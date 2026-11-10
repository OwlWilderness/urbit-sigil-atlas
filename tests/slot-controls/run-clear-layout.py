import hashlib,json,os,pathlib,subprocess,sys,time
ROOT=pathlib.Path('/Users/tekh/rn/urbit-sigil-atlas')
label=sys.argv[1];OUT=ROOT/'tests/slot-controls/evidence'/('clear-layout-'+label);OUT.mkdir(parents=True,exist_ok=False)
files=['site/app.js','site/workshop.js','site/workshop.css','tools/workshop-template.cjs','tools/build-site.cjs','docs/slot-controls.md']+[str(p.relative_to(ROOT)) for p in (ROOT/'tests/slot-controls').iterdir() if p.is_file()]+[str(p.relative_to(ROOT)) for p in (ROOT/'site').glob('*.html')]
seal={}
for name in files:
 data=(ROOT/name).read_bytes();seal[name]=hashlib.sha256(data).hexdigest();dest=OUT/'source'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
backend={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'server').rglob('*') if p.is_file() and 'test-evidence' not in p.parts and '__pycache__' not in p.parts}
if label=='final':
 baseline=json.loads((OUT.parent/'clear-layout-red/receipt.json').read_text())['backend_sha256'];assert backend==baseline,'Backend changed'
commands=[('focused',['node',str(ROOT/'tests/slot-controls/clear-layout.cjs')])]
if label.startswith('build'):commands=[('build',['npm','run','build:site'])]
if label=='final':commands += [('copy-smoke',['node',str(ROOT/'tests/slot-controls/copy-click.cjs')])]
results=[]
for name,cmd in commands:
 start=time.monotonic()
 try:
  child=subprocess.run(cmd,cwd=ROOT,env=dict(os.environ,SLOT_EVIDENCE=str(OUT)),capture_output=True,text=True,timeout=150);code,stdout,stderr=child.returncode,child.stdout,child.stderr
 except subprocess.TimeoutExpired as e:code,stdout,stderr=124,str(e.stdout),str(e.stderr)
 (OUT/(name+'-stdout.txt')).write_text(stdout);(OUT/(name+'-stderr.txt')).write_text(stderr)
 results.append({'label':name,'command':cmd,'cwd':str(ROOT),'environment_overrides':{'SLOT_EVIDENCE':str(OUT)},'timeout':150,'exit':code,'seconds':time.monotonic()-start,'stdout':stdout,'stderr':stderr,'stdout_sha256':hashlib.sha256(stdout.encode()).hexdigest(),'stderr_sha256':hashlib.sha256(stderr.encode()).hexdigest()})
 print(stdout);print(stderr);print('CHILD_EXIT',name,code)
 if code:break
if not label.startswith('build'):assert all(hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h for n,h in seal.items()),'Source changed during test'
backend_after={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT/'server').rglob('*') if p.is_file() and 'test-evidence' not in p.parts and '__pycache__' not in p.parts}
assert backend_after==backend,'Backend changed during execution'
reused={}
for name in ['server/test-evidence/candidates-and-api-final-green-20261109/receipt.json','docs/api-examples/manifest.json']:
 reused[name]=hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
artifacts={str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.iterdir() if p.is_file()}
receipt={'sha256':seal,'backend_sha256':backend,'reused_receipt_sha256':reused,'artifact_sha256':artifacts,'children':results,'exit':next((r['exit'] for r in results if r['exit']),0),'unchanged_backend_receipts':['server/test-evidence/candidates-and-api-final-green-20261109/ (13 tests and 30 examples, reused; not rerun)']}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2));print('RECEIPT',OUT/'receipt.json');sys.exit(receipt['exit'])
