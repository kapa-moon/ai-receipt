/* Shared demo exclusions are explicit IDs; imports are never filtered. */
const policy=require('./demo-policy.json');
function curate(datasets){const all=datasets.flatMap(d=>d.tasks.filter(t=>(policy.excludedTasks[d.id]||[]).includes(t.id))).map(t=>t.prompt);const needles=all.map(p=>p.slice(0,160));return datasets.map(source=>{const d=JSON.parse(JSON.stringify(source)),excluded=new Set(policy.excludedTasks[d.id]||[]),removed=d.tasks.filter(t=>excluded.has(t.id)).length;d.tasks=d.tasks.filter(t=>!excluded.has(t.id));d.events=d.events.filter(e=>!excluded.has(e.taskId));d.calls=d.calls.filter(c=>!excluded.has(c.taskId));
 // Automatic review prompts sometimes embed an excluded owner's full request.
 // Keep review usage/rows while withholding that embedded context.
 let contexts=0;for(const t of d.tasks){const text=JSON.stringify(t);if(needles.some(p=>text.includes(p)||text.includes(JSON.stringify(p).slice(1,-1)))){if(d.id.includes('review')){t.prompt='Automatic review request with private context withheld from the shared demo';t.assistantExcerpt='';delete t.aiSummary;contexts++;}else throw Error('Excluded content remains embedded in another owner message.');}}
 d.publication={curated:true,removedMessages:removed,withheldReviewContexts:contexts};
 if(d.id.startsWith('lite-')){d.files=['data/curated/'+d.id+'.receipt.json'];for(const e of d.events){delete e.file;delete e.line;}d.meta=[];}
 const times=[...d.tasks.map(t=>t.time),...d.events.map(e=>e.time)].filter(t=>t&&Number.isFinite(Date.parse(t))).sort();d.coverage={start:times[0]||null,end:times[times.length-1]||null,measuredResponses:d.events.length};return d;});}
module.exports={curate,policy};
