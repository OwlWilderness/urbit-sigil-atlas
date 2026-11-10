"""Bounded, append-only either-half qualification; no live runtime or user-data writes."""
import pathlib, sys, os, subprocess, hashlib, json, datetime, re
root=pathlib.Path(__file__).resolve().parents[2]
label,mode=sys.argv[1:]
assert re.fullmatch(r'either-half-[a-z0-9-]+',label)
assert mode in ('tracer','qualified','capture')
out=root/'server/test-evidence'/label
out.mkdir(parents=True,exist_ok=False)
files=[p for p in (root/'server').rglob('*') if p.is_file() and 'test-evidence' not in p.parts]
files += [root/'package-lock.json',root/'docs/api.md',root/'docs/either-half-search-contract.md']
files += [p for p in (root/'docs/api-examples').rglob('*') if p.is_file()]
for package in ['urbit-ob','bn.js','lodash.chunk','lodash.isequal']:
    files += [p for p in (root/'node_modules'/package).rglob('*') if p.is_file() and p.suffix in ('.js','.json')]
files += [root/'site/assets/glyphs'/f'{kind}-{syl}-{detail}.svg' for kind,syl in [('prefix','rad'),('suffix','ret')] for detail in ['default','none']]
hashes={}
for p in sorted(set(files)):
    rel=str(p.relative_to(root));data=p.read_bytes();dest=out/'source'/rel
    dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    hashes[rel]=hashlib.sha256(data).hexdigest()
names=['either-half.test.cjs'] if mode=='tracer' else ['api.test.cjs','candidates.test.cjs','boolean.test.cjs','row-group.test.cjs','either-half.test.cjs']
cmd=['node',*([] if mode=='capture' else ['--test']),*([str(root/'server/test/either-half-examples.cjs')] if mode=='capture' else [str(root/'server/test'/n) for n in names])]
env=dict(os.environ,TMPDIR='/Users/tekh/.hermes/cache/scratch')
started=datetime.datetime.now(datetime.timezone.utc).isoformat()
try:
    result=subprocess.run(cmd,cwd=root,env=env,capture_output=True,text=True,timeout=150)
    stdout,stderr,code=result.stdout,result.stderr,result.returncode
except subprocess.TimeoutExpired as e:
    stdout=(e.stdout or b'').decode() if isinstance(e.stdout,bytes) else (e.stdout or '')
    stderr=(e.stderr or b'').decode() if isinstance(e.stderr,bytes) else (e.stderr or '')
    code=124
(out/'stdout.txt').write_text(stdout);(out/'stderr.txt').write_text(stderr)
artifacts={}
if mode=='capture':
    for p in sorted((root/'docs/api-examples').glob('either-half-*')):
        if not p.is_file():continue
        data=p.read_bytes();dest=out/'artifacts'/p.name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
        artifacts[str(p.relative_to(root))]=hashlib.sha256(data).hexdigest()
counts={}
if mode!='capture':
    counts={k:int(m.group(1)) for k in ['tests','pass','fail','cancelled','skipped','todo'] if (m:=re.search(r'^# '+k+r' (\d+)$',stdout,re.M))}
receipt={'command':cmd,'cwd':str(root),'exit':code,'started':started,'finished':datetime.datetime.now(datetime.timezone.utc).isoformat(),'environmentOverrides':{'TMPDIR':env['TMPDIR']},'timeoutSeconds':150,'sourceSha256':hashes,'artifactSha256':artifacts,'testCounts':counts,'streamSha256':{n:hashlib.sha256((out/n).read_bytes()).hexdigest() for n in ['stdout.txt','stderr.txt']}}
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(stdout,end='');print(stderr,end='',file=sys.stderr);print('CHILD_EXIT='+str(code));print('RECEIPT='+str(out/'receipt.json'))
sys.exit(code)
