import crypto from 'node:crypto';

const WRITE_PERMS={
  Admin:new Set(['customers','tasks','quotes','sales','events','dealers','notifications','activities','users','finance','devices','service']),
  'Satış Müdürü':new Set(['customers','tasks','quotes','sales','events','dealers','notifications','activities','finance','devices']),
  'Satış Temsilcisi':new Set(['customers','tasks','quotes','sales','events','notifications','activities']),
  Bayi:new Set(['customers','tasks','quotes','events','notifications','activities'])
};

function b64url(input){return Buffer.from(input).toString('base64url')}
function hmac(value,secret){return crypto.createHmac('sha256',secret).update(value).digest('base64url')}

export function signSession(payload,secret,ttlSeconds=60*60*12){
  if(!secret||secret.length<24) throw new Error('CRM_SESSION_SECRET must be at least 24 characters');
  const body=b64url(JSON.stringify({...payload,exp:Math.floor(Date.now()/1000)+ttlSeconds}));
  return `${body}.${hmac(body,secret)}`;
}

export function verifySession(token,secret){
  try{
    if(!token||!secret) return null;
    const [body,sig]=token.split('.');
    if(!body||!sig) return null;
    const expected=hmac(body,secret);
    if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;
    const data=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));
    if(!data.exp||data.exp<Math.floor(Date.now()/1000)) return null;
    return data;
  }catch{return null}
}

export function parseCookies(req){
  return Object.fromEntries((req.headers.cookie||'').split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('=');return [decodeURIComponent(v.slice(0,i)),decodeURIComponent(v.slice(i+1))]}));
}

export function sessionCookie(token){return `avm_crm_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`}
export function clearSessionCookie(){return 'avm_crm_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'}
export function canWriteKind(role,kind){return WRITE_PERMS[role]?.has(kind)||false}
export function readableKinds(role){return [...(WRITE_PERMS[role]||[])].filter(k=>k!=='users'||role==='Admin')}
