import { neon } from '@neondatabase/serverless';

let initialized=false;
export function sql(){
  if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
}

export async function ensureSchema(){
  if(initialized) return;
  const q=sql();
  await q`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await q`CREATE TABLE IF NOT EXISTS crm_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL CHECK (role IN ('Admin','Satış Müdürü','Satış Temsilcisi','Bayi')),
    region text NOT NULL DEFAULT 'Türkiye',
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await q`CREATE TABLE IF NOT EXISTS crm_collections (
    kind text PRIMARY KEY,
    payload jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_by uuid REFERENCES crm_users(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`;
  await ensureAdmin(q);
  initialized=true;
}

async function ensureAdmin(q){
  const email=process.env.CRM_ADMIN_EMAIL;
  const password=process.env.CRM_ADMIN_PASSWORD;
  if(!email||!password) return;
  const existing=await q`SELECT id FROM crm_users LIMIT 1`;
  if(existing.length) return;
  const name=process.env.CRM_ADMIN_NAME || 'Avrasya MedTech Admin';
  await q`INSERT INTO crm_users(name,email,password_hash,role,region)
    VALUES(${name},${email.toLowerCase()},crypt(${password},gen_salt('bf',12)),'Admin','Tüm Türkiye')`;
}

export async function getUserBySessionId(id){
  await ensureSchema();
  const q=sql();
  const rows=await q`SELECT id::text,name,email,role,region,active FROM crm_users WHERE id=${id}::uuid AND active=true LIMIT 1`;
  return rows[0]||null;
}
