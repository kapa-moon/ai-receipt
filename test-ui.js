const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const elements={},listeners={},storage={};
const el=id=>elements[id]||(elements[id]={id,value:id==='measure'?'total':'',innerHTML:'',textContent:'',dataset:{},click(){},showModal(){this.open=true},close(){this.open=false},querySelectorAll(){return []}});
const document={getElementById:el,addEventListener:(n,f)=>listeners[n]=f,createElement:()=>({click(){}})};
const context={document,console,localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},setTimeout:fn=>fn(),window:{print(){}},Date,Map,Set,Number,JSON,globalThis:null};context.globalThis=context;
vm.createContext(context);for(const f of ['trace-engine.js','demo-data.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+f,'utf8'),context);context.RECEIPT_DATA=context.window.RECEIPT_DATA;vm.runInContext(fs.readFileSync(__dirname+'/trace-ui.js','utf8'),context);
assert.equal(el('title').textContent,'Lite AI · Codex');assert.equal((el('tasks').innerHTML.match(/class="panel task"/g)||[]).length,2);assert.ok(el('metrics').innerHTML.includes('21,200'));
function switchTo(id){listeners.click({target:{closest:()=>({dataset:{source:id}})}})}
switchTo('boba-code');assert.equal((el('tasks').innerHTML.match(/class="panel task"/g)||[]).length,2);assert.ok(el('metrics').innerHTML.includes('$0.005'));
switchTo('lite-work');assert.ok(el('title').textContent.includes('Work'));switchTo('claude-work');assert.equal((el('tasks').innerHTML.match(/class="panel task"/g)||[]).length,2);
const d=context.window.RECEIPT_DATA.find(d=>d.id==='claude-work');listeners.change({target:{dataset:{task:d.tasks[0].id,field:'value'},value:'Useful'}});switchTo('lite-code');switchTo('claude-work');assert.ok(el('tasks').innerHTML.includes('<option selected>Useful</option>'));assert.ok(storage['trace-receipts-v1'].includes('Useful'));
listeners.change({target:{dataset:{task:d.tasks[0].id,field:'category'},value:'Back-and-forth / clarification'}});assert.ok(el('intentBars').innerHTML.includes('Back-and-forth / clarification'));
el('methodButton').onclick();assert.equal(el('method').open,true);assert.ok(el('rates').innerHTML.includes('claude-opus-5-5'));el('closeMethod').onclick();assert.equal(el('method').open,false);
switchTo('lite-review');assert.ok(el('metrics').innerHTML.includes('Unknown'));assert.ok(!el('metrics').innerHTML.includes('$0.000'));
console.log('UI logic tests passed: all source selections, measured totals, category editing, reflection persistence, pricing dialog, unknown-cost display.');
