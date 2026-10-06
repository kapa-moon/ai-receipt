/* Receipt scope and subjective value calculations, separate from provider accounting. */
(function(root){
const noPrompt='No explicit user prompt recorded for this turn';
function day(time){const d=new Date(time);return Number.isFinite(+d)?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:'';}
function scope(data,vendor,topic='all',date='all',now=Date.now()){
 const sets=data.filter(d=>d.provider===vendor&&(topic==='all'?!d.id.includes('review'):d.id===topic));
 const days={'30d':30,'7d':7,'3d':3,'24h':1},rows=[];
 for(const d of sets)for(const t of d.tasks){const ms=Date.parse(t.time),match=date==='all'||(days[date]?Number.isFinite(ms)&&ms>=now-days[date]*86400000&&ms<=now:day(t.time)===date);if(!match)continue;const es=d.events.filter(e=>e.taskId===t.id),cs=d.calls.filter(c=>c.taskId===t.id);rows.push({d,t,events:es,calls:cs,key:JSON.stringify([d.id,t.id]),isMessage:t.prompt!==noPrompt});}
 rows.sort((a,b)=>(Date.parse(a.t.time)||0)-(Date.parse(b.t.time)||0)||a.key.localeCompare(b.key));
 return {sets,rows,events:rows.flatMap(r=>r.events),calls:rows.flatMap(r=>r.calls),messages:rows.filter(r=>r.isMessage).length};
}
function rating(x){const n=Number(x.rating);if(Number.isInteger(n)&&n>=1&&n<=5)return n;return ({'Not useful yet':1,'Somewhat useful':3,'Useful':4,'Very useful':5})[x.value]||null;}
function value(x){if(x.benefit===undefined||x.benefit===null||String(x.benefit).trim()==='')return null;const n=Number(x.benefit);return Number.isFinite(n)&&n>=0?n:null;}
function gain(benefit,cost){if(benefit===null||cost.unknown||!(cost.low>0)||!(cost.high>0))return null;return {low:(benefit/cost.high-1)*100,high:(benefit/cost.low-1)*100};}
function assess(rows,prefs,engine){let count=0,stars=0,benefit=0,valued=0,costEvents=[];for(const r of rows){if(!r.isMessage)continue;const p=prefs(r),n=rating(p);if(n){count++;stars+=n;}const b=value(p),s=engine.totals(r.events);if(b!==null&&r.events.length&&!s.unknown&&s.low>0&&s.high>0){benefit+=b;valued++;costEvents.push(...r.events);}}const cost=engine.totals(costEvents);return {utility:count?stars/count/5*100:null,rated:count,valued,benefit,gain:valued?gain(benefit,cost):null};}
function summary(row){if(row.t.aiSummary)return row.t.aiSummary;const groups={};for(const c of row.calls)groups[c.action]=(groups[c.action]||0)+1;const excerpt=(row.t.assistantExcerpt||'').replace(/[#*_`]/g,'').replace(/\s+/g,' ').trim();const report=excerpt?' Assistant reported: “'+excerpt.slice(0,230)+(excerpt.length>230?'…':'')+'”.':'';const activity=Object.entries(groups).map(([a,n])=>`${a.toLowerCase()} (${n})`).join('; ');return activity?`Recorded ${row.events.length} model responses with ${activity}. ${report} Completion is not independently verified.`:row.events.length?`Recorded ${row.events.length} model responses; no tool calls were captured for this request.${report}`:'No measured model responses or tool calls are linked to this entry.';}
const api={day,scope,rating,value,gain,assess,summary};if(typeof module!=='undefined')module.exports=api;root.ReceiptView=api;
})(typeof globalThis!=='undefined'?globalThis:this);
