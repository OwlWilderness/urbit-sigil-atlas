import subprocess, pathlib, hashlib, json, sys, time
root=pathlib.Path('/Users/tekh/rn/urbit-sigil-atlas')
label=sys.argv[1]
out=root/'tests/slot-controls/evidence'/label
out.mkdir(parents=True,exist_ok=False)
files=['site/app.js','site/workshop.js','site/workshop.css','tools/workshop-template.cjs','tools/build-site.cjs','tests/slot-controls/browser.cjs','tests/slot-controls/run.py']+[f'site/{name}.html' for name in ['index','prefixes','suffixes','shortlist','workshop','api']]
seal={}
for name in files:
 p=root/name
 if p.exists():
  b=p.read_bytes(); seal[name]=hashlib.sha256(b).hexdigest(); dest=out/'source'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
cmd=['npm','run','build:site'] if label.startswith('build') else ['node',str(root/'tests/slot-controls/browser.cjs')]
env=dict(__import__('os').environ,SLOT_EVIDENCE=str(out))
start=time.time()
try:
 result=subprocess.run(cmd,cwd=root,env=env,capture_output=True,text=True,timeout=150)
 code=result.returncode; stdout=result.stdout;stderr=result.stderr
except subprocess.TimeoutExpired as e:
 code=124;stdout=str(e.stdout);stderr=str(e.stderr)
(out/'stdout.txt').write_text(stdout);(out/'stderr.txt').write_text(stderr)
(out/'receipt.json').write_text(json.dumps(dict(command=cmd,cwd=str(root),timeout=150,exit=code,seconds=time.time()-start,sha256=seal),indent=2))
print(stdout);print(stderr);print('CHILD_EXIT',code,'RECEIPT',out/'receipt.json');sys.exit(code)
