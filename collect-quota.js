// Read-only collection from local rollout logs. No credentials or network calls.
const fs=require('fs'),path=require('path'),os=require('os'),Q=require('./quota-engine');
const root=process.argv[2]||path.join(os.homedir(),'.codex','sessions');
const snapshotPath=path.join(__dirname,'quota-current.private.json');
function collect(){
 const current=fs.existsSync(snapshotPath)?JSON.parse(fs.readFileSync(snapshotPath,'utf8')):null;
 const account=current?.raw?.accountId,cutoff=Date.now()-7*86400000,matched=[],unverified=[];
 function walk(dir){for(const f of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,f.name);if(f.isDirectory())walk(p);else if(p.endsWith('.jsonl')){
  // Skip old files before reading full transcript content.
  if(fs.statSync(p).mtimeMs<cutoff)continue;
  let records=[];try{records=fs.readFileSync(p,'utf8').split(/\r?\n/).filter(x=>x.trim()).map(x=>JSON.parse(x));}catch{continue;}
  const meta=records.find(x=>x.type==='session_meta')?.payload||{};
  if(account&&meta.creator_account_id&&meta.creator_account_id!==account)continue;
  const rows=Q.fromTraces(records,'Provider-reported local trace snapshot').filter(s=>Date.parse(s.capturedAt)>=cutoff);
  if(account&&meta.creator_account_id===account)matched.push(...rows);else unverified.push(...rows);
 }}}
 walk(root);if(current)matched.push(...Q.snapshot(current.raw,current.capturedAt,'Live account API observation captured during build'));
 const histories=[];if(matched.length)histories.push({id:'actual-account',title:'Your account · verified local observations',samples:Q.merge(matched)});
 if(unverified.length)histories.push({id:'unverified-local',title:'Local observations · account identity unverified',samples:Q.merge(unverified)});
 fs.writeFileSync(path.join(__dirname,'quota-history.json'),JSON.stringify({schema:'quota-history-v1',samples:histories[0]?.samples||[]},null,2));
 const js='window.QUOTA_HISTORIES='+JSON.stringify(histories).replace(/</g,'\\u003c')+';';fs.writeFileSync(path.join(__dirname,'quota-real.js'),js);
 const html=fs.readFileSync(path.join(__dirname,'quota.html'),'utf8').replace('href="trace-receipts.html"','href="AI-receipts.html"').replace(/<script src="(quota-engine\.js|quota-demo\.js|quota-ui\.js)"><\/script>/g,(_,name)=>'<script>'+(name==='quota-demo.js'?js:fs.readFileSync(path.join(__dirname,name),'utf8')).replace(/<\/script/gi,'<\\/script')+'</script>');fs.writeFileSync(path.join(__dirname,'subscription-capacity.html'),html);
 console.log(JSON.stringify(histories.map(h=>({title:h.title,observations:h.samples.length,latest:h.samples.at(-1)})),null,2));
}
collect();if(process.argv.includes('--watch')){console.log('Watching local quota observations every 60 seconds. Stop with Ctrl+C. No provider polling.');setInterval(collect,60000);}
