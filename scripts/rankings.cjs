const PREFIX = '[철갑전선 기록]';
function parseRecord(issue) {
  if (issue.pull_request || !issue.title.startsWith(PREFIX)) return null;
  const match = (issue.body || '').match(/```json\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const r = JSON.parse(match[1]);
    if (r.version !== 1 || (r.difficulty==='endless'?(!Number.isSafeInteger(r.wave)||r.wave<1):r.wave!==20) || !['easy','normal','hard','endless'].includes(r.difficulty)) return null;
    if (!Number.isSafeInteger(r.gold) || r.gold < 0 || r.gold > 2147483647 || !Number.isSafeInteger(r.kills) || r.kills < 0 || r.kills > 2147483647) return null;
    const name = String(r.name || '').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,10);
    if (!name) return null;
    return {name, gold:r.gold, kills:r.kills, difficulty:r.difficulty, at:Date.parse(issue.created_at), issue:issue.number};
  } catch { return null; }
}
function topRecords(issues) {
  return issues.map(parseRecord).filter(Boolean).sort((a,b)=>b.gold-a.gold || b.kills-a.kills || a.at-b.at || a.issue-b.issue).slice(0,12);
}
module.exports = async ({github, context}) => {
  const {owner,repo} = context.repo;
  const issues = await github.paginate(github.rest.issues.listForRepo,{owner,repo,state:'all',per_page:100});
  const rows=topRecords(issues);
  const path='data/rankings.json';
  const existing = await github.rest.repos.getContent({owner,repo,path,ref:'main'});
  const old=JSON.parse(Buffer.from(existing.data.content,'base64').toString('utf8'));
  if (JSON.stringify(old.rows)===JSON.stringify(rows)) return;
  const content=JSON.stringify({version:1,updatedAt:new Date().toISOString(),rows},null,2)+'\n';
  await github.rest.repos.createOrUpdateFileContents({owner,repo,path,branch:'main',sha:existing.data.sha,message:'Update top 12 rankings',content:Buffer.from(content).toString('base64')});
};
module.exports.parseRecord=parseRecord;
module.exports.topRecords=topRecords;
