import hashlib,json,os,pathlib,subprocess,sys,time
ROOT=pathlib.Path('/Users/tekh/rn/urbit-sigil-atlas')
label=sys.argv[1]
assert label in ('red','final','final2','final3','entry-red','final-entry','toolbar-red','final-toolbar','final-toolbar2')
OUT=ROOT/'tests/slot-controls/evidence'/('either-half-'+label)
OUT.mkdir(parents=True,exist_ok=False)
files=['site/app.js','site/workshop.js','site/workshop.css','site/workshop.html','tools/workshop-template.cjs','tools/build-site.cjs','tests/slot-controls/either-half.cjs','tests/slot-controls/workshop-square.cjs','tests/slot-controls/run-either-half.py','docs/slot-controls.md']
if label in ('entry-red','final-entry'):files[6]='tests/slot-controls/text-entry.cjs'
if label in ('toolbar-red','final-toolbar','final-toolbar2'):files[6:8]=['tests/slot-controls/results-toolbar.cjs','tests/slot-controls/toolbar-geometry.cjs']
seal={}
for name in files:
 data=(ROOT/name).read_bytes();seal[name]=hashlib.sha256(data).hexdigest();dest=OUT/'source'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
commands=[['node',str(ROOT/('tests/slot-controls/text-entry.cjs' if label in ('entry-red','final-entry') else 'tests/slot-controls/either-half.cjs'))]]
if label.startswith('final'):commands.append(['node',str(ROOT/'tests/slot-controls/workshop-square.cjs')])
if label in ('toolbar-red','final-toolbar','final-toolbar2'):
 commands=[['node',str(ROOT/'tests/slot-controls/results-toolbar.cjs')]]
 if label.startswith('final'):commands.append(['node',str(ROOT/'tests/slot-controls/toolbar-geometry.cjs')])
children=[]
for n,cmd in enumerate(commands):
 childout=OUT/('ui' if n==0 else 'geometry');childout.mkdir()
 start=time.monotonic()
 try:
  child=subprocess.run(cmd,cwd=ROOT,env=dict(os.environ,SLOT_EVIDENCE=str(childout)),capture_output=True,text=True,timeout=150)
  code,stdout,stderr=child.returncode,child.stdout,child.stderr
 except subprocess.TimeoutExpired as e:
  code=124;stdout=e.stdout or b'';stderr=e.stderr or b''
  if isinstance(stdout,bytes):stdout=stdout.decode(errors='replace')
  if isinstance(stderr,bytes):stderr=stderr.decode(errors='replace')
 streams={}
 for suffix,text in [('stdout',stdout),('stderr',stderr)]:
  path=OUT/(str(n)+'-'+suffix+'.txt');path.write_text(text);streams[suffix+'_sha256']=hashlib.sha256(path.read_bytes()).hexdigest()
 children.append(dict(command=cmd,cwd=str(ROOT),environment_overrides={'SLOT_EVIDENCE':str(childout)},timeout=150,seconds=time.monotonic()-start,exit=code,stdout=stdout,stderr=stderr,**streams))
 print(stdout);print(stderr)
 if code:break
unchanged=all(hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h for n,h in seal.items())
receipt={'schema':'either-half-ui-v1','invocation':['/usr/bin/python3','-B',str(pathlib.Path(__file__).resolve()),label],'sha256':seal,'source_unchanged':unchanged,'children':children,'artifact_sha256':{str(p.relative_to(OUT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.rglob('*') if p.is_file() and 'source' not in p.relative_to(OUT).parts},'exit':max([c['exit'] for c in children]+([0] if unchanged else [1])),'limitations':['UI emission/persistence plus accepted geometry only; actual either-half result acceptance requires parent runtime cutover. Real responses only; no API JSON mocking, saves, installs, process control or authenticated profiles. Native mobile drag remains unclaimed.']}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2));print('CHILD_EXIT',receipt['exit'],'RECEIPT',OUT/'receipt.json');sys.exit(receipt['exit'])
