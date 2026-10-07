/* Static Vercel build: includes only an explicit public asset allowlist. */
const fs=require('fs'),path=require('path');
const root=__dirname,out=path.join(root,'dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const files=['favicon.svg','demo-reflections.js','trace-engine.js','receipt-view.js','trace-ui.js','shared-data.js','quota-engine.js','quota-ui.js','shared-quota.js'];
for(const name of files){if(!fs.existsSync(path.join(root,name)))throw Error('Missing published asset: '+name);fs.copyFileSync(path.join(root,name),path.join(out,name));}
const html=fs.readFileSync(path.join(root,'trace-receipts.html'),'utf8').replace('src="demo-data.js"','src="shared-data.js"');for(const name of ['index.html','trace-receipts.html'])fs.writeFileSync(path.join(out,name),html);
const quota=fs.readFileSync(path.join(root,'quota.html'),'utf8').replace('src="quota-demo.js"','src="shared-quota.js"');fs.writeFileSync(path.join(out,'quota.html'),quota);
fs.cpSync(path.join(root,'data'),path.join(out,'data'),{recursive:true});
console.log('Built dist/: curated shared receipts, quota history, browser-only uploads.');
