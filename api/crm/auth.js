import { ensureSchema, sql, getUserBySessionId } from './_lib/db.js';
import { signSession, sessionCookie, clearSessionCookie, parseCookies, verifySession } from './_lib/security.js';

export default async function handler(req,res){
  try{
    await ensureSchema();
    if(req.method==='POST'){
      const {email='',password=''}=req.body||{};
      if(!email||!password) return res.status(400).json({ok:false,error:'E-posta ve şifre zorunlu'});
      const q=sql();
      const rows=await q`SELECT id::text,name,email,role,region,active FROM crm_users
        WHERE lower(email)=lower(${email}) AND active=true AND password_hash=crypt(${password},password_hash) LIMIT 1`;
      const user=rows[0];
      if(!user) return res.status(401).json({ok:false,error:'E-posta veya şifre hatalı'});
      const token=signSession({uid:user.id,role:user.role},process.env.CRM_SESSION_SECRET);
      res.setHeader('Set-Cookie',sessionCookie(token));
      return res.status(200).json({ok:true,user});
    }
    if(req.method==='GET'){
      const token=parseCookies(req).avm_crm_session;
      const payload=verifySession(token,process.env.CRM_SESSION_SECRET);
      if(!payload) return res.status(401).json({ok:false});
      const user=await getUserBySessionId(payload.uid);
      if(!user) return res.status(401).json({ok:false});
      return res.status(200).json({ok:true,user});
    }
    if(req.method==='DELETE'){
      res.setHeader('Set-Cookie',clearSessionCookie());
      return res.status(200).json({ok:true});
    }
    res.setHeader('Allow','GET, POST, DELETE');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(err){console.error('crm auth',err);return res.status(500).json({ok:false,error:'Sunucu hatası'})}
}
