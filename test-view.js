const assert=require('assert/strict'),V=require('./receipt-view'),E=require('./trace-engine');
const ev=(id,taskId,time)=>({id,taskId,time,model:'gpt-6.1-sol',input:1000000,read:0,write5:0,write1:0,output:0,total:1000000,toolIds:[]});
const d={id:'a',provider:'openai',tasks:[{id:'t1',time:'2026-09-01T00:00:00Z',prompt:'Old',category:'Build / create'},{id:'t2',time:'2026-10-06T00:00:00Z',prompt:'New',category:'Build / create'}],events:[ev('1','t1',''),ev('2','t2','')],calls:[]};
assert.equal(V.scope([d],'openai').messages,2);assert.equal(V.scope([d],'openai','all','7d',Date.parse('2026-10-06T12:00:00Z')).messages,1);assert.equal(V.scope([d],'claude').messages,0);assert.equal(V.scope([d,{...d,id:'a-review'}],'openai').messages,2);assert.equal(V.scope([d,{...d,id:'a-review'}],'openai','a-review').messages,2);
let sc=V.scope([d],'openai'),a=V.assess(sc.rows,r=>r.t.id==='t1'?{rating:4,benefit:10}:{},E);assert.equal(a.utility,80);assert.equal(a.rated,1);assert.equal(a.valued,1);assert.equal(a.gain.low,150);assert.equal(a.gain.high,400);
assert.equal(V.value({}),null);assert.equal(V.value({benefit:''}),null);assert.equal(V.value({benefit:0}),0);assert.equal(V.gain(10,{low:0,high:0}),null);assert.equal(V.gain(10,{low:1,high:2,unknown:1}),null);assert.equal(V.assess(sc.rows,()=>({}),E).utility,null);assert.equal(V.assess(sc.rows,()=>({rating:5}),E).gain,null);
console.log('Receipt scope/value tests passed: full history, date windows, vendor separation, overhead scope, rated-only utility, matched gain denominator, missing and zero values.');

const zeroRow={...sc.rows[0],events:[{...sc.rows[0].events[0],input:0,total:0}]};assert.equal(V.assess([zeroRow],()=>({benefit:100}),E).valued,0);
