import hashlib, json, os, pathlib, subprocess, sys, time
ROOT=pathlib.Path('/Users/tekh/rn/urbit-sigil-atlas')
SCRATCH=pathlib.Path('/Users/tekh/.hermes/cache/scratch/pacfyl-names')
OUT=ROOT/'tests/slot-controls/evidence'/('fix-copy-click-'+sys.argv[1])
OUT.mkdir(parents=True,exist_ok=False)
files=['site/app.js','site/workshop.js','site/workshop.css','tools/workshop-template.cjs','tools/build-site.cjs','tests/slot-controls/browser.cjs','tests/slot-controls/run.py','tests/slot-controls/copy-click.cjs','tests/slot-controls/run-copy-click.py']+[f'site/{n}.html' for n in ['index','prefixes','suffixes','shortlist','workshop','api']]
seal={}
for name in files:
 data=(ROOT/name).read_bytes();seal[name]=hashlib.sha256(data).hexdigest();dest=OUT/'source'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
if sys.argv[1]=='parent-red':
 probe=(SCRATCH/'test-slot-copy-click.cjs').read_bytes();raw=(SCRATCH/'site-qa/run-25.json').read_bytes();receipt=json.loads(raw)
 assert receipt['test_sha256']==hashlib.sha256(probe).hexdigest()
 assert receipt['returncode']==1 and 'dragging is not defined' in receipt['stdout'] and "actual: 'rad'" in receipt['stderr']
 (OUT/'parent-test-slot-copy-click.cjs').write_bytes(probe);(OUT/'parent-run-25.json').write_bytes(raw)
 result={'parent_receipt':str(SCRATCH/'site-qa/run-25.json'),'parent_receipt_sha256':hashlib.sha256(raw).hexdigest(),'parent_probe_sha256':hashlib.sha256(probe).hexdigest(),'parent_exit':1,'sha256':seal,'limitation':'Parent RED sealed its probe but not candidate source. Source here captured after RED, before correction; not a contemporaneous RED source seal.'}
 (OUT/'receipt.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));sys.exit(0)
assert sys.argv[1] in ('green','green2')
results=[]
for label,test in [('focused','copy-click.cjs'),('smoke','browser.cjs')]:
 cmd=['node',str(ROOT/'tests/slot-controls'/test)];start=time.monotonic()
 try:
  child=subprocess.run(cmd,cwd=ROOT,env=dict(os.environ,SLOT_EVIDENCE=str(OUT)),capture_output=True,text=True,timeout=150)
  code,stdout,stderr=child.returncode,child.stdout,child.stderr
 except subprocess.TimeoutExpired as error:
  code=124;stdout=str(error.stdout);stderr=str(error.stderr)
 (OUT/(label+'-stdout.txt')).write_text(stdout);(OUT/(label+'-stderr.txt')).write_text(stderr)
 results.append({'label':label,'command':cmd,'cwd':str(ROOT),'environment_overrides':{'SLOT_EVIDENCE':str(OUT)},'timeout':150,'exit':code,'seconds':time.monotonic()-start,'stdout_sha256':hashlib.sha256(stdout.encode()).hexdigest(),'stderr_sha256':hashlib.sha256(stderr.encode()).hexdigest()})
 print(stdout);print(stderr);print('CHILD_EXIT',label,code)
 if code:break
assert all(hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h for n,h in seal.items()),'Source changed during execution'
receipt={'sha256':seal,'children':results,'exit':next((r['exit'] for r in results if r['exit']),0)}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2));print('RECEIPT',OUT/'receipt.json');sys.exit(receipt['exit'])
