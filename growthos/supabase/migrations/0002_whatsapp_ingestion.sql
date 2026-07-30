create table public.whatsapp_channels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  phone_number_id text not null,
  display_phone_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (phone_number_id),
  unique (organization_id, phone_number_id)
);

alter table public.whatsapp_channels enable row level security;

create policy "members manage own whatsapp channels" on public.whatsapp_channels
for all using (organization_id = public.current_organization_id())
with check (organization_id = public.current_organization_id());

create unique index conversations_one_open_per_lead_idx
on public.conversations (organization_id, lead_id)
where is_open = true;

create or replace function public.ingest_whatsapp_text_message(
  p_phone_number_id text,
  p_external_message_id text,
  p_sender_phone text,
  p_sender_name text,
  p_body text,
  p_received_at timestamptz
)
returns table (
  organization_id uuid,
  lead_id uuid,
  conversation_id uuid,
  message_id uuid,
  duplicate boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_organization_id uuid;
  v_lead_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
begin
  select channel.organization_id
  into v_organization_id
  from public.whatsapp_channels channel
  where channel.phone_number_id = p_phone_number_id
    and channel.is_active = true;

  if v_organization_id is null then
    raise exception 'Unknown WhatsApp phone_number_id';
  end if;

  select messages.id, messages.conversation_id
  into v_message_id, v_conversation_id
  from public.messages messages
  where messages.organization_id = v_organization_id
    and messages.external_message_id = p_external_message_id;

  if v_message_id is not null then
    select conversations.lead_id
    into v_lead_id
    from public.conversations conversations
    where conversations.id = v_conversation_id;

    return query select
      v_organization_id,
      v_lead_id,
      v_conversation_id,
      v_message_id,
      true;
    return;
  end if;

  insert into public.leads (
    organization_id,
    whatsapp_user_id,
    full_name,
    source,
    status
  ) values (
    v_organization_id,
    p_sender_phone,
    nullif(trim(p_sender_name), ''),
    'whatsapp',
    'new'
  )
  on conflict (organization_id, whatsapp_user_id)
  do update set
    full_name = coalesce(public.leads.full_name, excluded.full_name),
    updated_at = now()
  returning id into v_lead_id;

  select conversations.id
  into v_conversation_id
  from public.conversations conversations
  where conversations.organization_id = v_organization_id
    and conversations.lead_id = v_lead_id
    and conversations.is_open = true
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (
      organization_id,
      lead_id,
      state,
      is_open,
      last_message_at
    ) values (
      v_organization_id,
      v_lead_id,
      'welcome',
      true,
      p_received_at
    )
    returning id into v_conversation_id;
  else
    update public.conversations
    set last_message_at = greatest(coalesce(last_message_at, p_received_at), p_received_at)
    where id = v_conversation_id;
  end if;

  insert into public.messages (
    organization_id,
    conversation_id,
    external_message_id,
    direction,
    message_type,
    body,
    metadata,
    created_at
  ) values (
    v_organization_id,
    v_conversation_id,
    p_external_message_id,
    'inbound',
    'text',
    p_body,
    jsonb_build_object(
      'sender_phone', p_sender_phone,
      'sender_name', p_sender_name,
      'phone_number_id', p_phone_number_id
    ),
    p_received_at
  )
  returning id into v_message_id;

  return query select
    v_organization_id,
    v_lead_id,
    v_conversation_id,
    v_message_id,
    false;
end;
$$;

revoke all on function public.ingest_whatsapp_text_message(text, text, text, text, text, timestamptz) from public;
grant execute on function public.ingest_whatsapp_text_message(text, text, text, text, text, timestamptz) to service_role;
