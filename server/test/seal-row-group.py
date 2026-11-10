"""Seal final row qualification and refreshed captures without running tests again."""
import pathlib, hashlib, json, re, datetime
root=pathlib.Path(__file__).resolve().parents[2]
base=root/'server/test-evidence'
seal=base/'row-group-final-seal'
seal.mkdir(exist_ok=False)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
qualified=base/'row-group-qualified-green'
captured=base/'row-group-actual-examples'
receipts={name:json.loads((base/name/'receipt.json').read_text()) for name in ['row-group-qualified-green','row-group-actual-examples']}
for name,r in receipts.items():
    assert r['exit']==0, name
    assert (base/name/'stderr.txt').read_text()=='', name
    for rel,h in r['sourceSha256'].items():
        if rel.startswith('docs/api-examples/'): continue # separately refreshed artifacts
        p=root/rel if rel.startswith(('node_modules/','docs/','site/')) or rel=='package-lock.json' else root/'server'/rel
        assert sha(p)==h, (name,rel)
text=(qualified/'stdout.txt').read_text()
counts={k:int(re.search(r'^# '+k+r' (\d+)$',text,re.M).group(1)) for k in ['tests','pass','fail','cancelled','skipped','todo']}
assert counts['tests']==counts['pass'] and all(counts[k]==0 for k in ['fail','cancelled','skipped','todo'])
old={}
for name in ['api.test.cjs','candidates.test.cjs','boolean.test.cjs']:
    current=root/'server/test'/name
    prior=base/'boolean-qualified-green/source/test'/name
    assert current.read_bytes()==prior.read_bytes(),name
    old['server/test/'+name]=sha(current)
manifest=json.loads((root/'docs/api-examples/manifest.json').read_text())
assert len({e['label'] for e in manifest['items']})==len(manifest['items'])
for e in manifest['items']:
    assert sha(root/'docs/api-examples'/e['file'])==e['sha256'],e['label']
assert 'EXAMPLES_CAPTURED='+str(len(manifest['items'])) in (captured/'stdout.txt').read_text()
assert 'DEMO_RECORDS_READ_BACK=2' in (captured/'stdout.txt').read_text()
assert len(json.loads((base/'boolean-actual-examples/artifacts/manifest.json').read_text())['items'])==33
files=[p for p in (root/'server').rglob('*') if p.is_file() and 'test-evidence' not in p.parts]
files += [root/'docs/api.md',root/'docs/row-group-backend.md',*sorted((root/'docs/api-examples').glob('*'))]
source={}
for p in files:
    rel=p.relative_to(root);data=p.read_bytes();dest=seal/'source'/rel
    dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data);source[str(rel)]=hashlib.sha256(data).hexdigest()
receiptHashes={}
for name in receipts:
    for filename in ['receipt.json','stdout.txt','stderr.txt']:
        receiptHashes[name+'/'+filename]=sha(base/name/filename)
artifacts=receipts['row-group-actual-examples']['artifactSha256']
for rel,h in artifacts.items():assert sha(root/rel)==h,rel
value={'verdict':'PASS','time':datetime.datetime.now(datetime.timezone.utc).isoformat(),'testCounts':counts,'captureCount':len(manifest['items']),'previousCaptureCount':33,'originalTestsUnchangedSha256':old,'sourceSha256':source,'receiptSha256':receiptHashes,'artifactSha256':artifacts,'qualifiedSourceSha256':receipts['row-group-qualified-green']['sourceSha256'],'captureSourceSha256':receipts['row-group-actual-examples']['sourceSha256'],'scope':'Backend only; four fixed glyph fixtures, no moving frontend bytes, no runtime adoption.'}
(seal/'seal.json').write_text(json.dumps(value,indent=2)+'\n')
print(json.dumps({'verdict':value['verdict'],'testCounts':counts,'captureCount':value['captureCount'],'sourceSha256':source['server/index.cjs'],'seal':str(seal/'seal.json')},indent=2))
