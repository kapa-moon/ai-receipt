const fs=require('fs'),path=require('path');
const E=require('./trace-engine.js');
const manifest=process.argv[2];
let datasets;
if(manifest){
 const sets=JSON.parse(fs.readFileSync(manifest,'utf8'));
 datasets=sets.map(s=>{const n=E.normalize(s.files.map(p=>({name:p,records:E.parseJSONL(fs.readFileSync(p,'utf8'))})),s.title);n.id=s.id;n.subtitle=s.subtitle;return n;});
 fs.writeFileSync(path.join(__dirname,'real-data.js'),'window.RECEIPT_DATA='+JSON.stringify(datasets).replace(/</g,'\\u003c')+';\n');
 for(const d of datasets)fs.writeFileSync(path.join(__dirname,d.id+'.receipt.json'),JSON.stringify(d,null,2));
}else datasets=require('./demo-data.js');
const data='window.RECEIPT_DATA='+JSON.stringify(datasets).replace(/</g,'\\u003c')+';';
let html=fs.readFileSync(path.join(__dirname,'trace-receipts.html'),'utf8');if(manifest)html=html.replace('href="quota.html"','href="subscription-capacity.html"');
const standalone=html.replace(/<script src="(trace-engine\.js|demo-data\.js|trace-ui\.js)"><\/script>/g,(_,name)=>'<script>'+(name==='demo-data.js'?data:fs.readFileSync(path.join(__dirname,name),'utf8')).replace(/<\/script/gi,'<\\/script')+'</script>');
const output=manifest?'AI-receipts.html':'demo-receipts.html';
fs.writeFileSync(path.join(__dirname,output),standalone);
console.log(JSON.stringify(datasets.map(d=>({id:d.id,responses:d.events.length,...E.totals(d.events)})),null,2));
