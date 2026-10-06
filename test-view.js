const assert=require('assert/strict'),V=require('./receipt-view');
const d={id:'a',provider:'openai',tasks:[{id:'t1',time:'2026-09-01T00:00:00Z',prompt:'Old'},{id:'t2',time:'2026-10-06T00:00:00Z',prompt:'New'}],events:[],calls:[]};
assert.equal(V.scope([d],'openai').messages,2);assert.equal(V.scope([d],'openai','all','7d',Date.parse('2026-10-06T12:00:00Z')).messages,1);assert.equal(V.scope([d],'claude').messages,0);assert.equal(V.scope([d,{...d,id:'a-review'}],'openai').messages,2);
const rows=V.scope([d],'openai').rows,a=V.assess(rows,r=>r.t.id==='t1'?{rating:4,progress:'Decision',outcome:'Still exploring'}:{},null);assert.equal(a.utility,80);assert.equal(a.rated,1);assert.equal(a.scored,1);assert.ok(Math.abs(a.gain-66)<1e-9);
assert.equal(V.reflectionGain({rating:5,progress:'Working artifact',outcome:'Used / applied'}),100);assert.equal(V.reflectionGain({rating:5}),null);assert.equal(V.assess(rows,()=>({}),null).gain,null);
for(const outcome of Object.keys(V.OUTCOME)){assert.ok(V.reflectionGain({rating:5,progress:'Decision',outcome})>=V.reflectionGain({rating:1,progress:'Decision',outcome}));}
assert.ok(V.reflectionGain({rating:4,progress:'Decision',outcome:'Used / applied'})>V.reflectionGain({rating:4,progress:'Decision',outcome:'Still exploring'}));assert.ok(V.reflectionGain({rating:4,progress:'Decision',outcome:'Still exploring'})>V.reflectionGain({rating:4,progress:'Decision',outcome:'Abandoned'}));
console.log('Receipt reflection checks passed: full import scopes, complete-only scoring, coverage, known examples and monotonicity.');

const linked={rows:[{d:{id:'one'},calls:[{id:'a'},{id:'b'}],events:[{id:'shared',toolIds:['a','b'],total:20},{id:'unlinked',toolIds:[],total:50}]},{d:{id:'one'},calls:[{id:'a'}],events:[{id:'shared',toolIds:['a'],total:20}]},{d:{id:'two'},calls:[{id:'c'}],events:[{id:'shared',toolIds:['c'],total:30}]}]};
assert.equal(V.associatedEvents(linked).length,2);assert.equal(V.associatedEvents(linked).reduce((n,e)=>n+e.total,0),50);assert.equal(V.associatedEvents({rows:[]}).length,0);
console.log('Action total checks passed: linked responses deduplicated within each dataset; unlinked usage excluded.');
