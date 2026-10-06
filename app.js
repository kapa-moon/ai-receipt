(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const money = n => n == null ? 'Unknown' : '$' + n.toFixed(4);
  const num = n => n.toLocaleString('en-US');
  let data = structuredClone(window.RECEIPT_SAMPLE);
  try { const saved = localStorage.getItem('ai-receipt-v1'); if (saved) {const parsed=JSON.parse(saved); Receipt.calculate(parsed); data=parsed;} } catch (_) {}
  function text(tag, value, className) {const el=document.createElement(tag); el.textContent=value; if(className) el.className=className; return el;}
  function persist() { try {localStorage.setItem('ai-receipt-v1',JSON.stringify(data));} catch (_) {} }
  function render() {
    const r=Receipt.calculate(data);
    $('error').textContent=''; $('source').textContent=data.demo?'Illustrative example':'Imported trace';
    $('notice').textContent=data.demo?'Example data and example rates. No live provider connection.':'Imported records. Costs and attribution are only as complete as the supplied trace.';
    $('tokens').textContent=num(r.total.tokens);
    $('coverage').textContent=r.total.unknownTokens?`${r.total.unknownTokens} model call(s) have unknown usage; total is partial.`:'Input + output across recorded model calls; cached input counted once.';
    const hasEstimate=r.rows.some(e=>e.costSource==='Rate estimate');
    $('cost-label').textContent=hasEstimate?'Usage cost estimate':'Reported usage cost';
    $('cost').textContent=money(r.total.cost)+(r.total.unknownCost?' + unknown':'');
    $('cost-note').textContent=`Includes model calls and recorded tool fees.${r.total.unknownCost?' Missing charges are not treated as zero.':''}`;
    $('paid').textContent=money(r.payment.paid);
    $('paid-note').textContent='Entered payment; not inferred from tokens.';
    $('mode').value=r.payment.mode; $('fixed').value=r.payment.fixed??''; $('payment').value=r.payment.paid??'';
    $('subscription').textContent=r.payment.mode==='subscription'?`Monthly fee: ${r.payment.fixed==null?'unknown':('$'+r.payment.fixed.toFixed(2))}. Shared across the billing period; not allocated to this request. Token-priced estimates do not increase your subscription bill.`:'Usage cost is not proof of payment. Enter the amount charged for this scope once known.';
    $('activities').replaceChildren();
    r.groups.forEach(g=>{const row=text('div','','activity'); row.append(text('span',g.activity)); const bar=text('div','','bar');const fill=text('span','');fill.style.width=(r.total.tokens?g.tokens/r.total.tokens*100:0)+'%';bar.append(fill);row.append(bar,text('span',num(g.tokens)+' tokens'+(g.unknownTokens?' + ?':''),'number'),text('span',money(g.cost)+(g.unknownCost?' + ?':''),'number'));$('activities').append(row);});
    $('requests').replaceChildren();
    r.requests.forEach(req=>{const card=text('article','','request');card.append(text('div',req.text,'request-title'),text('div',`${num(req.tokens)} recorded tokens${req.unknownTokens?' + unknown usage':''} · ${money(req.cost)}${req.unknownCost?' + unknown charges':''} · ${req.calls} events`,'muted'));const events=text('div','','events');
      r.rows.filter(e=>e.request_id===req.id).forEach(e=>{const row=text('div','','event'); const desc=text('div','');desc.append(text('div',e.label),text('div',`${e.kind==='model'?(e.model||'Unspecified model'):'Tool'} · ${e.attribution} attribution`,'event-details'));if(e.kind==='model') desc.append(text('div',e.tokens==null?'Token usage unknown':`Input ${num(e.input)} (${num(e.cached)} cached) · Output ${num(e.output)}`,'event-details'));else desc.append(text('div','Tool fee; no separate token count','event-details'));
        const select=document.createElement('select');select.setAttribute('aria-label','Activity for '+e.label);Receipt.activities.forEach(a=>{const opt=text('option',a);opt.value=a;select.append(opt);});select.value=e.activity;select.addEventListener('change',()=>{const raw=data.events.find(v=>v.id===e.id);raw.activity=select.value;raw.attribution='manual';persist();render();});
        const values=text('div','','number');values.append(text('div',e.tokens==null?(e.kind==='tool'?'—':'Unknown'):num(e.tokens)+' tokens'),text('div',money(e.cost),'event-details'),text('div',e.costSource,'event-details'));row.append(desc,select,values);events.append(row);});card.append(events);$('requests').append(card);});
    $('json').value=JSON.stringify(data,null,2);
  }
  function load(value) {try {Receipt.calculate(value);data=value;persist();render();}catch(e){$('error').textContent=e.message;}}
  ['mode','fixed','payment'].forEach(id=>$(id).addEventListener('change',()=>{const next=structuredClone(data);next.payment={mode:$('mode').value,fixed_monthly_usd:$('fixed').value===''?null:Number($('fixed').value),additional_paid_usd:$('payment').value===''?null:Number($('payment').value)};load(next);}));
  $('apply').addEventListener('click',()=>{try{load(JSON.parse($('json').value));}catch(e){$('error').textContent='Invalid JSON: '+e.message;}});
  $('upload').addEventListener('change',async()=>{const file=$('upload').files[0];if(!file)return;if(file.size>2e6){$('error').textContent='Please import a trace smaller than 2 MB.';return;}try{load(JSON.parse(await file.text()));}catch(e){$('error').textContent='Unable to import: '+e.message;}$('upload').value='';});
  $('sample').addEventListener('click',()=>load(structuredClone(window.RECEIPT_SAMPLE)));
  $('export').addEventListener('click',()=>{const payload={...data,summary:Receipt.calculate(data)};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ai-receipt.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  render();
})();
