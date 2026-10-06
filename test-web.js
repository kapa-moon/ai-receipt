const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),E=require('./trace-engine'),{credentialHits}=require('./publish-data');
const m=JSON.parse(fs.readFileSync('data/trace-manifest.json','utf8')),ds=JSON.parse(fs.readFileSync('data/receipts.json','utf8'));
assert.equal(m.datasets.length,5);assert.equal(m.datasets.reduce((n,d)=>n+d.files.length,0),12);
for(const d of m.datasets)for(const f of d.files){const b=fs.readFileSync(f.path);assert.equal(b.length,f.bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256);assert.equal(credentialHits(b.toString('utf8')),0);assert.equal(E.parseJSONL(b.toString('utf8')).length,f.records);assert.ok(fs.existsSync('dist/'+f.path));}
for(const d of ds){const files=d.files.map(name=>({name,records:E.parseJSONL(fs.readFileSync(name,'utf8'))})),n=E.normalize(files);assert.equal(E.totals(n.events).total,E.totals(d.events).total);assert.equal(n.events.length,d.events.length);}
const html=fs.readFileSync('dist/index.html','utf8');assert.ok(html.includes('src="shared-data.js"'));assert.ok(!html.includes('src="demo-data.js"'));assert.ok(html.includes('id="uploadHelp"'));assert.ok(html.includes('~/.codex/sessions/'));assert.ok(html.includes('~/.claude/projects/'));
assert.ok(!fs.existsSync('dist/private-sources.json'));assert.ok(!fs.existsSync('dist/quota-current.private.json'));assert.ok(!fs.existsSync('dist/enrich-receipt.js'));
assert.equal(credentialHits('sk-proj-'+'x'.repeat(40)),1);assert.equal(credentialHits('ordinary transcript text'),0);
console.log('Web publication checks passed: all 12 complete sources, byte lengths/hashes, credential-pattern scan, normalization conservation, real-data entry, upload guidance and deployment allowlist.');
