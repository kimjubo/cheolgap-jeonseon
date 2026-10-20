// Deploy with JWT verification disabled: public game endpoint, no player login.
const cors = {'Access-Control-Allow-Origin':'https://kimjubo.github.io','Access-Control-Allow-Headers':'content-type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Cache-Control':'no-store'};
Deno.serve(async request => {
  const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
  if(request.method==='OPTIONS') return new Response(null,{headers:cors});
  const url=Deno.env.get('SUPABASE_URL')!;
  const secretKeys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
  const key=secretKeys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers:Record<string,string>={apikey:key,'Content-Type':'application/json'};
  if(!key.startsWith('sb_secret_'))headers.Authorization='Bearer '+key;
  const rest=(path:string,options:RequestInit={})=>fetch(url+'/rest/v1/'+path,{...options,headers,signal:AbortSignal.timeout(10000)});
  if(request.method==='GET'){
    try {
      const result=await rest('game_rankings?select=id,name,gold,kills,difficulty,at&order=gold.desc,id.asc&limit=12');
      return result.ok?reply({version:1,rows:await result.json()}):reply({error:'read failed'},503);
    } catch {return reply({error:'read failed'},503);}
  }
  if(request.method!=='POST')return reply({error:'method'},405);
  if(Number(request.headers.get('content-length'))>4096)return reply({error:'size'},413);
  try{
    const text=await request.text();if(text.length>4096)return reply({error:'size'},413);
    const r=JSON.parse(text),name=String(r.name||'').trim();
    if(r.version!==1||(r.difficulty==='endless'?(!Number.isSafeInteger(r.wave)||r.wave<1):r.wave!==20)||!name||name.length>10||/[\u0000-\u001f\u007f]/.test(name)||!Number.isInteger(r.gold)||r.gold<0||r.gold>2147483647||!Number.isInteger(r.kills)||r.kills<0||r.kills>2147483647||!['easy','normal','hard','endless'].includes(r.difficulty)||!/^\d{10,20}$/.test(r.runId)) return reply({error:'invalid record'},400);
    const result=await rest('rpc/submit_game_rank',{method:'POST',body:JSON.stringify({p_run_id:r.runId,p_name:name,p_gold:r.gold,p_kills:r.kills,p_difficulty:r.difficulty})});
    return result.ok?reply(await result.json()):reply({error:'save failed'},503);
  }catch{return reply({error:'invalid request'},400);}
});
