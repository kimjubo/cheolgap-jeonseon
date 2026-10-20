module.exports=async({github,context})=>{
  const {owner,repo}=context.repo;
  const read=async path=>{const r=await github.rest.repos.getContent({owner,repo,path,ref:'main'});return {sha:r.data.sha,data:JSON.parse(Buffer.from(r.data.content,'base64').toString())};};
  const config=await read('data/rankings-config.json');
  if(!config.data.endpoint){console.log('Rankings endpoint is not connected; no commit.');return;}
  const url=new URL(config.data.endpoint);
  if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co'))throw Error('Unexpected rankings host');
  const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('rankings read failed');
  const incoming=await response.json();
  if(!Array.isArray(incoming.rows)||incoming.rows.length>12)throw Error('invalid rankings');
  const rows=incoming.rows.map(r=>{
    if(typeof r.name!=='string'||!r.name.trim()||r.name.length>10||!Number.isInteger(r.gold)||r.gold<0||r.gold>1000000||!Number.isInteger(r.kills)||r.kills<0||r.kills>10000||!['easy','normal','hard'].includes(r.difficulty)||!Number.isSafeInteger(r.at))throw Error('invalid record');
    return {name:r.name,gold:r.gold,kills:r.kills,difficulty:r.difficulty,at:r.at};
  }).sort((a,b)=>b.gold-a.gold||a.at-b.at);
  const old=await read('data/rankings.json');
  if(JSON.stringify(old.data.rows)===JSON.stringify(rows))return;
  await github.rest.repos.createOrUpdateFileContents({owner,repo,path:'data/rankings.json',branch:'main',sha:old.sha,message:'Automatically save qualifying top 12 mineral records',content:Buffer.from(JSON.stringify({version:1,updatedAt:new Date().toISOString(),rows},null,2)+'\n').toString('base64')});
};
