(function(root){
function bucket(x){if(!x)return null;const used=x.usedPercent??x.used_percent,duration=x.windowDurationMins??x.window_minutes,reset=x.resetsAt??x.resets_at;if(typeof used!=='number'||!Number.isFinite(used))return null;return {usedPercent:Math.max(0,Math.min(100,used)),windowDurationMins:duration??null,resetsAt:reset??null};}
function snapshot(raw,time,source='Imported provider snapshot'){
 if(raw?.content){const text=raw.content.find(c=>c.type==='text')?.text;if(text)raw=JSON.parse(text);}
 const groups=raw.rateLimitsByLimitId||raw.rate_limits_by_limit_id||(raw.rateLimits?{[raw.rateLimits.limitId||'codex']:raw.rateLimits}:raw.limit_id?{[raw.limit_id]:raw}:raw.limitId?{[raw.limitId]:raw}:{});
 const t=new Date(time).getTime();if(!Number.isFinite(t))throw Error('Snapshot timestamp is missing or invalid.');
 return Object.entries(groups).map(([id,r])=>({capturedAt:new Date(t).toISOString(),source,limitId:id,plan:r.planType||r.plan_type||null,primary:bucket(r.primary),secondary:bucket(r.secondary)})).filter(s=>s.primary||s.secondary);
}
function fromTraces(records,source='Local trace observation'){return records.flatMap(d=>d.type==='event_msg'&&d.payload?.type==='token_count'&&d.payload.rate_limits?snapshot(d.payload.rate_limits,d.timestamp,source):[]);}
function merge(rows){const seen=new Set();return rows.filter(r=>{const key=JSON.stringify([r.capturedAt,r.limitId,r.primary,r.secondary]);if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>Date.parse(a.capturedAt)-Date.parse(b.capturedAt));}
function segments(rows,key,maxGapMs=30*60*1000){const result=[];let previous=null;for(const row of rows){const b=row[key];if(!b){previous=null;continue;}const point={time:Date.parse(row.capturedAt),...b};if(previous&&point.time-previous.time<=maxGapMs&&point.resetsAt===previous.resetsAt&&point.usedPercent>=previous.usedPercent)result.push([previous,point]);previous=point;}return result;}
function remaining(b){return b?100-b.usedPercent:null;}
const api={bucket,snapshot,fromTraces,merge,segments,remaining};if(typeof module!=='undefined')module.exports=api;root.QuotaReceipt=api;
})(typeof globalThis!=='undefined'?globalThis:this);
