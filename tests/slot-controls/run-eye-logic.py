import hashlib,json,os,pathlib,subprocess,sys,time
ROOT=pathlib.Path('/Users/tekh/rn/urbit-sigil-atlas');label=sys.argv[1];OUT=ROOT/'tests/slot-controls/evidence'/('eye-logic-'+label);OUT.mkdir(parents=True,exist_ok=False)
files=['site/app.js','site/workshop.js','site/workshop.css','site/workshop.html','tools/workshop-template.cjs','tests/slot-controls/eye-logic.cjs','tests/slot-controls/run-eye-logic.py','docs/slot-controls.md'];seal={}
for name in files:
 data=(ROOT/name).read_bytes();seal[name]=hashlib.sha256(data).hexdigest();dest=OUT/'source'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
cmd=['npm','run','build:site'] if label.startswith('build') else ['node',str(ROOT/'tests/slot-controls/eye-logic.cjs'),sys.argv[2] if len(sys.argv)>2 else 'all'];start=time.monotonic()
try:
 child=subprocess.run(cmd,cwd=ROOT,env=dict(os.environ,SLOT_EVIDENCE=str(OUT)),capture_output=True,text=True,timeout=150);code,stdout,stderr=child.returncode,child.stdout,child.stderr
except subprocess.TimeoutExpired as e:code,stdout,stderr=124,str(e.stdout),str(e.stderr)
for n,s in [('stdout.txt',stdout),('stderr.txt',stderr)]:(OUT/n).write_text(s)
if not label.startswith('build'):assert all(hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h for n,h in seal.items()),'Focused source changed during test'
receipt={'schema':'eye-logic-v1','sha256':seal,'children':[{'command':cmd,'cwd':str(ROOT),'environment_overrides':{'SLOT_EVIDENCE':str(OUT)},'timeout':150,'seconds':time.monotonic()-start,'exit':code,'stdout':stdout,'stderr':stderr}],'artifact_sha256':{str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.iterdir() if p.is_file()},'exit':code,'integration_gap':'Captured real outgoing OR queries only; running API is old. Parent must exercise accepted backend Boolean results.'}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2));print(stdout);print(stderr);print('CHILD_EXIT',code,'RECEIPT',OUT/'receipt.json');sys.exit(code)
