import { parseCookies, verifySession } from './security.js';
import { getUserBySessionId } from './db.js';

export async function requireUser(req,res){
  const token=parseCookies(req).avm_crm_session;
  const payload=verifySession(token,process.env.CRM_SESSION_SECRET);
  if(!payload){res.status(401).json({ok:false,error:'Oturum gerekli'});return null}
  const user=await getUserBySessionId(payload.uid);
  if(!user){res.status(401).json({ok:false,error:'Oturum geçersiz'});return null}
  return user;
}

export function jsonOnly(req,res){
  if(req.method==='GET'||req.method==='DELETE') return true;
  if(!(req.headers['content-type']||'').includes('application/json')){res.status(415).json({ok:false,error:'JSON gerekli'});return false}
  return true;
}
