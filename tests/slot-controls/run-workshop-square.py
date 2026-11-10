import hashlib,json,os,pathlib,subprocess,sys,time
ROOT=pathlib.Path('/Users/tekh/rn/urbit-sigil-atlas');label=sys.argv[1];OUT=ROOT/'tests/slot-controls/evidence'/(label if label.startswith(('palette-panel-','row-map-','adjacent-panels-')) else 'workshop-square-'+label);OUT.mkdir(parents=True,exist_ok=False)
files=['site/app.js','site/workshop.js','site/workshop.css','site/workshop.html','tools/workshop-template.cjs','tools/build-site.cjs','tests/slot-controls/workshop-square.cjs','tests/slot-controls/eye-logic.cjs','tests/slot-controls/run-workshop-square.py','docs/slot-controls.md'];seal={}
for name in files:
 data=(ROOT/name).read_bytes();seal[name]=hashlib.sha256(data).hexdigest();dest=OUT/'source'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
commands=[['npm','run','build:site']] if label.startswith('build') else [['node',str(ROOT/'tests/slot-controls/workshop-square.cjs')]+(['layout'] if label=='row-map-layout' or label=='red' or label.startswith(('palette-panel-','row-map-','adjacent-panels-')) and label.endswith('-red') else [])]
if label in ('final','palette-panel-final','palette-panel-visual-green','row-map-final'):commands.append(['node',str(ROOT/'tests/slot-controls/eye-logic.cjs'),'all'])
if label in ('row-map-semantics-red','row-map-semantics-green'):commands=[['node',str(ROOT/'tests/slot-controls/eye-logic.cjs'),'all']]
children=[]
for n,cmd in enumerate(commands):
 childout=OUT/('eye-logic' if n else '.');childout.mkdir(parents=True,exist_ok=True)
 start=time.monotonic()
 try:
  child=subprocess.run(cmd,cwd=ROOT,env=dict(os.environ,SLOT_EVIDENCE=str(childout)),capture_output=True,text=True,timeout=150);code,stdout,stderr=child.returncode,child.stdout,child.stderr
 except subprocess.TimeoutExpired as e:code,stdout,stderr=124,str(e.stdout),str(e.stderr)
 for suffix,s in [('stdout.txt',stdout),('stderr.txt',stderr)]:(OUT/(str(n)+'-'+suffix)).write_text(s)
 children.append({'command':cmd,'cwd':str(ROOT),'environment_overrides':{'SLOT_EVIDENCE':str(childout)},'timeout':150,'seconds':time.monotonic()-start,'exit':code,'stdout':stdout,'stderr':stderr});print(stdout);print(stderr)
 if code:break
if not label.startswith('build'):assert all(hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h for n,h in seal.items()),'Focused source changed during test'
renderer_scope={'scope':'Responsive composition CSS only; existing main/filter DOM, controller, renderer, persistence and queries unchanged. Focused layout child only; unchanged API and controller acceptance reused.'}
receipt={'invocation':['/usr/bin/python3','-B',str(pathlib.Path(__file__).resolve()),label],'renderer_scope':renderer_scope,'schema':'workshop-square-v1','sha256':seal,'children':children,'artifact_sha256':{str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*') if p.is_file() and 'source' not in p.relative_to(OUT).parts},'exit':max(c['exit'] for c in children),'limitations':['Backend Boolean result acceptance and runtime control are parent-owned. No API responses mocked; no save operations. Mobile drag not claimed.']}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2));print('CHILD_EXIT',receipt['exit'],'RECEIPT',OUT/'receipt.json');sys.exit(receipt['exit'])
