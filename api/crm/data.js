import { ensureSchema, sql } from './_lib/db.js';
import { requireUser, jsonOnly } from './_lib/auth.js';
import { canWriteKind, readableKinds } from './_lib/security.js';

const ALLOWED=new Set(['customers','tasks','quotes','sales','events','dealers','notifications','activities','finance','devices','service']);

export default async function handler(req,res){
  try{
    if(!jsonOnly(req,res)) return;
    await ensureSchema();
    const user=await requireUser(req,res); if(!user) return;
    const q=sql();
    if(req.method==='GET'){
      const kinds=readableKinds(user.role).filter(k=>ALLOWED.has(k));
      const rows=await q`SELECT kind,payload FROM crm_collections WHERE kind=ANY(${kinds})`;
      const data=Object.fromEntries(kinds.map(k=>[k,[]]));
      for(const row of rows) data[row.kind]=row.payload;
      return res.status(200).json({ok:true,data});
    }
    if(req.method==='PUT'){
      const {kind,records}=req.body||{};
      if(!ALLOWED.has(kind)||!Array.isArray(records)) return res.status(400).json({ok:false,error:'Geçersiz veri'});
      if(!canWriteKind(user.role,kind)) return res.status(403).json({ok:false,error:'Bu işlem için yetkiniz yok'});
      await q`INSERT INTO crm_collections(kind,payload,updated_by,updated_at)
        VALUES(${kind},${JSON.stringify(records)}::jsonb,${user.id}::uuid,now())
        ON CONFLICT(kind) DO UPDATE SET payload=excluded.payload,updated_by=excluded.updated_by,updated_at=now()`;
      return res.status(200).json({ok:true});
    }
    res.setHeader('Allow','GET, PUT');
    return res.status(405).json({ok:false,error:'Method not allowed'});
  }catch(err){console.error('crm data',err);return res.status(500).json({ok:false,error:'Sunucu hatası'})}
}
