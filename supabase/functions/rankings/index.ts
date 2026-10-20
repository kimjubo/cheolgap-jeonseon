// Deploy with JWT verification disabled: public game endpoint, no player login.
import { createClient } from 'npm:@supabase/supabase-js@2';
const cors = {'Access-Control-Allow-Origin':'https://kimjubo.github.io','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'};
Deno.serve(async request => {
  const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
  if(request.method==='OPTIONS') return new Response(null,{headers:cors});
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  if(request.method==='GET'){
    const {data,error}=await db.from('game_rankings').select('id,name,gold,kills,difficulty,at').order('gold',{ascending:false}).order('id',{ascending:true}).limit(12);
    return error?reply({error:'read failed'},503):reply({version:1,rows:data});
  }
  if(request.method!=='POST')return reply({error:'method'},405);
  if(Number(request.headers.get('content-length'))>4096)return reply({error:'size'},413);
  try{
    const text=await request.text();if(text.length>4096)return reply({error:'size'},413);
    const r=JSON.parse(text),name=String(r.name||'').trim();
    if(r.version!==1||r.wave!==20||!name||name.length>10||/[\u0000-\u001f\u007f]/.test(name)||!Number.isInteger(r.gold)||r.gold<0||r.gold>1000000||!Number.isInteger(r.kills)||r.kills<0||r.kills>10000||!['easy','normal','hard'].includes(r.difficulty)||!/^\d{10,20}$/.test(r.runId)) return reply({error:'invalid record'},400);
    const {data,error}=await db.rpc('submit_game_rank',{p_run_id:r.runId,p_name:name,p_gold:r.gold,p_kills:r.kills,p_difficulty:r.difficulty});
    return error?reply({error:'save failed'},503):reply(data);
  }catch{return reply({error:'invalid request'},400);}
});
