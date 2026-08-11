import { ensureSchema, sql } from './_lib/db.js';
import { requireUser, jsonOnly } from './_lib/auth.js';

export default async function handler(req,res){
  try{
    if(!jsonOnly(req,res)) return;
    await ensureSchema();
    const user=await requireUser(req,res); if(!user) return;
    if(user.role!=='Admin') return res.status(403).json({ok:false,error:'Yalnızca Admin'});
    const q=sql();
    if(req.method==='GET'){
      const rows=await q`SELECT id::text,name,email,role,region,CASE WHEN active THEN 'Aktif' ELSE 'Pasif' END status FROM crm_users ORDER BY created_at`;
      return res.status(200).json({ok:true,users:rows});
    }
    if(req.method==='POST'){
      const {name,email,password,role='Satış Temsilcisi',region='Türkiye'}=req.body||{};
      if(!name||!email||!password||password.length<8) return res.status(400).json({ok:false,error:'Ad, e-posta ve en az 8 karakter şifre gerekli'});
      const rows=await q`INSERT INTO crm_users(name,email,password_hash,role,region)
        VALUES(${name},lower(${email}),crypt(${password},gen_salt('bf',12)),${role},${region})
        RETURNING id::text,name,email,role,region,'Aktif' status`;
      return res.status(201).json({ok:true,user:rows[0]});
    }
    if(req.method==='PATCH'){
      const {id,name,email,role,region,active=true,password}=req.body||{};
      if(!id) return res.status(400).json({ok:false,error:'Kullanıcı id gerekli'});
      if(password){
        await q`UPDATE crm_users SET name=${name},email=lower(${email}),role=${role},region=${region},active=${active},password_hash=crypt(${password},gen_salt('bf',12)),updated_at=now() WHERE id=${id}::uuid`;
      }else{
        await q`UPDATE crm_users SET name=${name},email=lower(${email}),role=${role},region=${region},active=${active},updated_at=now() WHERE id=${id}::uuid`;
      }
      return res.status(200).json({ok:true});
    }
    if(req.method==='DELETE'){
      const id=req.query?.id;
      if(!id||id===user.id) return res.status(400).json({ok:false,error:'Bu kullanıcı silinemez'});
      await q`DELETE FROM crm_users WHERE id=${id}::uuid`;
      return res.status(200).json({ok:true});
    }
    res.setHeader('Allow','GET, POST, PATCH, DELETE');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(err){
    console.error('crm users',err);
    if(String(err?.message||'').toLowerCase().includes('unique')) return res.status(409).json({ok:false,error:'Bu e-posta zaten kayıtlı'});
    return res.status(500).json({ok:false,error:'Sunucu hatası'});
  }
}
