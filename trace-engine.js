/* Local-only adapters for observed Codex rollout and Claude transcript/audit schemas. */
(function(root){
const CATEGORIES=['Build / create','Research / explore','Explain / learn','Correction / refinement','Back-and-forth / clarification','Set up / connect','Continue work','Other'];
const RATES={
 'gpt-6-astra':{input:10,read:1,write5:12.5,write1:12.5,output:50,long:{input:20,read:2,write5:25,write1:25,output:75}},
 'gpt-6.1-sol':{input:2,read:.1,write5:2.5,write1:2.5,output:10,long:{input:4,read:.2,write5:5,write1:5,output:15}},
 'claude-opus-5-5':{input:4,read:.2,write5:5,write1:8,output:20},
 'claude-opus-4-8':{input:5,read:.5,write5:6.25,write1:10,output:25},
 'claude-fable-5':{input:10,read:1,write5:12.5,write1:20,output:50},
 'claude-sonnet-5':{input:2,read:.2,write5:2.5,write1:4,output:10},
 'claude-sonnet-5-5':{input:2,read:.2,write5:2.5,write1:4,output:10}
};
function intention(s){
 const p=s.toLowerCase(),opening=p.slice(0,350);
 if(/^continue[.!\s]*$/.test(p.trim()))return 'Continue work';
 if(/too complicated|too many|take out|delete such|remove|don't put|do not put|instead|\bfix\b|\bcorrect\b|simplif|\bchange\b|refin|not realistic/.test(opening))return 'Correction / refinement';
 if(/connect the site|set up|co-manage|workflow/.test(opening))return 'Set up / connect';
 if(/build|create|develop|implement|prototype|accounting|assemble|vision statement/.test(opening))return 'Build / create';
 if(/what is|what does|explain|understand|what are|how does/.test(opening))return 'Explain / learn';
 if(/find|research|literature|papers|books|read for|inspiring|search|explore/.test(opening))return 'Research / explore';
 if(p.length<180)return 'Back-and-forth / clarification';
 return 'Other';
}
function cleanPrompt(s){
 if(s.includes('## My request:'))s=s.split('## My request:').pop();
 s=s.replace(/<in-app-browser-context[\s\S]*?<\/in-app-browser-context>/g,'').trim();
 if(/^# AGENTS\.md|<environment_context>|<external_codex_apps_writing_block_edits|<bash-input>/.test(s))return '';
 return s;
}
function blocks(m){return typeof m==='string'?m:(Array.isArray(m)?m.filter(x=>['text','input_text','output_text'].includes(x.type)).map(x=>x.text||'').join('\n'):'');}
function action(name){
 if(/web__run|WebSearch|WebFetch/i.test(name))return 'Search / retrieve';
 if(/apply_patch|Write|Edit|NotebookEdit/.test(name))return 'Write / edit files';
 if(/exec_command|Bash|bash|write_stdin/.test(name))return 'Run commands';
 if(/cua|computer|browser|chrome|navigate|preview|javascript_tool|read_page/.test(name))return 'Browser / interface';
 if(/AskUser|request_user_input/.test(name))return 'Ask / clarify';
 if(/Task|Agent|spawn|update_plan/.test(name))return 'Plan / coordinate';
 if(/ToolSearch/.test(name))return 'Discover tools';
 if(/present_files|open_in_codex/.test(name))return 'Present / open result';
 return 'Other tools';
}
function parseJSONL(text){return text.split(/\r?\n/).filter(x=>x.trim()).map((x,i)=>{try{return JSON.parse(x);}catch{throw Error('Invalid JSONL at line '+(i+1));}});}
function normalize(files, title='Imported trace'){
 const records=files.flatMap(f=>f.records.map((d,i)=>({...d,_file:f.name,_line:i+1}))); const provider=records.some(x=>x.type==='session_meta'||x.type==='token_usage_record')?'openai':'claude';
 const tasks=new Map(),events=new Map(),calls=new Map(),warnings=[],meta=[];let current=null,turn=null,model='unknown',pending=[],invalid=0,duplicates=0;
 const ensure=(id,time,prompt='')=>{if(!tasks.has(id))tasks.set(id,{id,time,prompt,category:intention(prompt),categorySource:'Inferred locally from prompt; editable',responseIds:[],toolIds:[]});const t=tasks.get(id);if(prompt&&!t.prompt)t.prompt=prompt;return t;};
 const addCall=(id,name,task,time,origin)=>{if(calls.has(id))return;const c={id,name,action:action(name),taskId:task,time,origin};calls.set(id,c);ensure(task,time).toolIds.push(id);pending.push(id);};
 for(const d of records){const p=d.payload||{};const time=d.timestamp||d._audit_timestamp||'';
  if(provider==='openai'){
   if(d.type==='session_meta'){meta.push({file:d._file,id:p.id,originator:p.originator,source:p.source});current=null;turn=null;pending=[];}
   if(d.type==='turn_context'){turn=p.turn_id;current=turn;model=p.model||model;ensure(current,time);}
   if(d.type==='response_item'&&p.type==='message'&&p.role==='user'){
    const s=cleanPrompt(blocks(p.content));if(s){current=turn||p.id||'prompt-'+time;ensure(current,time,s);}
   }
   if(d.type==='response_item'&&['custom_tool_call','function_call'].includes(p.type)){
    current=current||turn||'unassigned';
    if(p.name==='exec'){
     const found=[...(p.input||'').matchAll(/tools\.([A-Za-z_][A-Za-z_0-9]*)\s*\(/g)];
     if(found.length)found.forEach((m,i)=>addCall((p.call_id||p.id)+':'+i,m[1],current,time,'Observed invocation expression in exec; execution success not inferred'));
     else addCall(p.call_id||p.id,p.name,current,time,'Observed wrapper call');
    }else addCall(p.call_id||p.id,(p.namespace?p.namespace+'.':'')+p.name,current,time,'Observed tool call');
   }
   if(d.type==='token_usage_record'){
    const id=p.response_id;if(!id){invalid++;continue;}if(events.has(id)){duplicates++;pending=[];continue;}
    const u=p.usage;if(!u||!Number.isFinite(u.input_tokens)||!Number.isFinite(u.output_tokens)||u.input_tokens<0||u.output_tokens<0){invalid++;continue;}
    const taskId=p.turn_id||current||'unassigned';ensure(taskId,time);
    const input=Number(u.input_tokens||0),read=Number(u.cached_input_tokens||0),write=Number(u.cache_write_input_tokens||0);
    const e={id,provider,taskId,time,model,input:Math.max(0,input-read-write),read,write5:write,write1:0,output:Number(u.output_tokens||0),reasoning:Number(u.reasoning_output_tokens||0),total:Number(u.total_tokens??input+Number(u.output_tokens||0)),toolIds:pending.filter(id=>calls.get(id)?.taskId===taskId),rawUsage:u,file:d._file,line:d._line};
    if(input<read+write)warnings.push('Cached/write counts exceed input for '+id);
    events.set(id,e);pending=[];
   }
  }else{
   const m=d.message||{};const content=m.content;
   if(d.type==='user'&&typeof content==='string'&&!d.parent_tool_use_id){
    const s=cleanPrompt(content);if(s){current=d.promptId||d.prompt_id||d.uuid||'prompt-'+time;ensure(current,time,s);}
   }
   if(d.type==='assistant'){
    current=current||'unassigned';const id=d.requestId||d.request_id||m.id;if(!id){invalid++;continue;}
    const old=events.get(id);const u=m.usage;
    if(u&&Number.isFinite(u.input_tokens)&&Number.isFinite(u.output_tokens)&&u.input_tokens>=0&&u.output_tokens>=0){
     const cc=u.cache_creation||{},w=Number(u.cache_creation_input_tokens||0),w1=Number(cc.ephemeral_1h_input_tokens||0),w5=Number(cc.ephemeral_5m_input_tokens||0);
     const e={id,provider,taskId:old?.taskId||current,time:old?.time||time,model:m.model||old?.model||'unknown',input:Number(u.input_tokens||0),read:Number(u.cache_read_input_tokens||0),write5:w5,write1:w1,unknownWrite:Math.max(0,w-w1-w5),output:Number(u.output_tokens||0),reasoning:Number(u.output_tokens_details?.thinking_tokens||0),total:Number(u.input_tokens||0)+Number(u.cache_read_input_tokens||0)+w+Number(u.output_tokens||0),toolIds:old?.toolIds||[],rawUsage:u,file:d._file,line:d._line,speed:u.speed||'normal',geo:u.inference_geo};
     // Each message is streamed into several transcript rows. Keep final/largest usage once.
     if(old)duplicates++;if(!old||e.output>=old.output)events.set(id,e);
    }
    const event=events.get(id);
    if(Array.isArray(content))for(const b of content)if(b.type==='tool_use'){
     addCall(b.id,b.name,event?.taskId||current,time,'Observed tool_use block');if(event&&!event.toolIds.includes(b.id))event.toolIds.push(b.id);
    }
    pending=[];
   }
  }
 }
 for(const e of events.values())ensure(e.taskId,e.time).responseIds.push(e.id);
 const usedTasks=[...tasks.values()].filter(t=>t.prompt||t.responseIds.length||t.toolIds.length);
 for(const t of usedTasks){if(!t.prompt){t.prompt='No explicit user prompt recorded for this turn';t.category='Other';t.categorySource='Unassigned prompt';}else t.category=intention(t.prompt);}
 const times=records.map(d=>d.timestamp||d._audit_timestamp).filter(t=>t&&Number.isFinite(Date.parse(t))).map(t=>new Date(t).toISOString()).sort();
 const coverage={start:times[0]||null,end:times[times.length-1]||null,records:records.length};
 return {coverage,schema:'ai-receipt-trace-v1',id:title,title,provider,files:files.map(x=>x.name),meta,tasks:usedTasks,events:[...events.values()],calls:[...calls.values()],warnings,invalid,duplicates,importedAt:new Date().toISOString()};
}
function price(e,rates=RATES){
 const r=rates[e.model];if(!r)return {low:null,high:null,reason:'Model has no verified rate'};
 const calc=(rate,unknownRate)=> (e.input*rate.input+e.read*rate.read+e.write5*rate.write5+e.write1*rate.write1+(e.unknownWrite||0)*unknownRate+e.output*rate.output)/1e6;
 let mult=1;if(e.provider==='claude'&&e.speed==='fast')mult*=2;if(e.geo==='us')mult*=1.1;
 let low=calc(r,r.write5)*mult,high=calc(r.long||r,(r.long||r).write1)*mult;
 const search=Number(e.rawUsage?.server_tool_use?.web_search_requests||0)*.01;low+=search;high+=search;
 return {low,high,reason:e.provider==='openai'?'Standard-speed short/long-context scenario range; context tier not resolved':e.unknownWrite?'Cache duration unknown: 5-minute/1-hour range':'Public API rate estimate',toolFee:search};
}
function totals(events,rates=RATES){let x={input:0,read:0,write5:0,write1:0,unknownWrite:0,output:0,reasoning:0,total:0,low:0,high:0,unknown:0,responses:events.length};for(const e of events){for(const k of ['input','read','write5','write1','unknownWrite','output','reasoning','total'])x[k]+=e[k]||0;const p=price(e,rates);if(p.low===null)x.unknown++;else{x.low+=p.low;x.high+=p.high;}}return x;}
const api={CATEGORIES,RATES,intention,action,parseJSONL,normalize,price,totals};if(typeof module!=='undefined')module.exports=api;root.TraceReceipt=api;
})(typeof globalThis!=='undefined'?globalThis:this);
