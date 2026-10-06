/* Explicit one-time publication of the source traces authorized for this app. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),E=require('./trace-engine'),{curate}=require('./curate-data');
const patterns=[/\bsk-(?:proj-|svcacct-|ant-)?[A-Za-z0-9_-]{20,}/g,/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g,/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,/Bearer\s+[A-Za-z0-9._-]{20,}/g,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,/\bxox[baprs]-[A-Za-z0-9-]{20,}/g,/\bya29\.[A-Za-z0-9_-]{30,}/g,/(?:access_token|refresh_token|api_key|client_secret)[\\"\s:=]+([A-Za-z0-9._-]{30,})/gi];
function credentialHits(text){return patterns.reduce((n,p)=>n+[...text.matchAll(p)].length,0);}
function publish(manifest){
 const sets=JSON.parse(fs.readFileSync(manifest,'utf8')),prepared=[];
 for(const s of sets){if(!/^[a-z0-9-]+$/.test(s.id))throw Error('Invalid source ID.');const files=s.files.map(p=>{const buffer=fs.readFileSync(p),text=buffer.toString('utf8');if(credentialHits(text))throw Error('Possible credentials found in '+s.id+'/'+path.basename(p)+'. Publication stopped; source unchanged.');return {buffer,records:E.parseJSONL(text),name:'data/traces/'+s.id+'/'+path.basename(p)};});prepared.push({s,files});}
 const full=prepared.map(({s,files})=>{const d=E.normalize(files.map(f=>({name:f.name,records:f.records})),s.title);d.id=s.id;d.subtitle=s.subtitle;return d;});
 const datasets=curate(full),traceSets=[];fs.mkdirSync(path.join(__dirname,'data/curated'),{recursive:true});
 for(const {s,files} of prepared){const d=datasets.find(d=>d.id===s.id);let publishedFiles;
 if(d.id.startsWith('lite-')){const name=d.files[0],buffer=Buffer.from(JSON.stringify(d));fs.writeFileSync(path.join(__dirname,name),buffer);publishedFiles=[{path:name,bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),kind:'curated-receipt'}];}
 else{for(const f of files){const output=path.join(__dirname,f.name);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,f.buffer);}publishedFiles=files.map(f=>({path:f.name,bytes:f.buffer.length,records:f.records.length,sha256:crypto.createHash('sha256').update(f.buffer).digest('hex'),kind:'original-trace'}));}
 traceSets.push({id:s.id,title:s.title,coverage:d.coverage,publication:d.publication,files:publishedFiles});}
 fs.writeFileSync(path.join(__dirname,'data/receipts.json'),JSON.stringify(datasets));
 fs.writeFileSync(path.join(__dirname,'data/trace-manifest.json'),JSON.stringify({schema:'shared-traces-v2',snapshotAt:new Date().toISOString(),datasets:traceSets},null,2));
 fs.writeFileSync(path.join(__dirname,'shared-data.js'),'window.RECEIPT_SHARED=true;window.RECEIPT_DATA='+JSON.stringify(datasets).replace(/</g,'\\u003c')+';\n');
 if(fs.existsSync(path.join(__dirname,'quota-real.js')))fs.copyFileSync(path.join(__dirname,'quota-real.js'),path.join(__dirname,'shared-quota.js'));
 console.log(JSON.stringify({datasets:datasets.length,files:traceSets.reduce((n,d)=>n+d.files.length,0),bytes:traceSets.reduce((n,d)=>n+d.files.reduce((k,f)=>k+f.bytes,0),0),removedMessages:datasets.reduce((n,d)=>n+d.publication.removedMessages,0),credentialPatternMatches:0}));
}
if(require.main===module){if(!process.argv[2])throw Error('Explicit source manifest required: node publish-data.js private-sources.json');publish(process.argv[2]);}
module.exports={credentialHits,publish};
