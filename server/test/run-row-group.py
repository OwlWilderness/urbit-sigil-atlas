"""Retain exact sources, command, stdout, stderr and child exit for each run."""
import os, sys, pathlib, subprocess, hashlib, json, datetime
root = pathlib.Path(__file__).resolve().parents[2]
label = sys.argv[1]
evidence = root / 'server' / 'test-evidence' / label
evidence.mkdir(parents=True, exist_ok=False)
hashes = {}
for p in sorted((root/'server').rglob('*')):
    if p.is_file() and 'test-evidence' not in p.parts:
        rel = p.relative_to(root/'server')
        dest = evidence/'source'/rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        data=p.read_bytes(); dest.write_bytes(data)
        hashes[str(rel)]=hashlib.sha256(data).hexdigest()
# Explicit test basenames keep the established API-only default intact.
names = sys.argv[2:] or ['api.test.cjs']
if any(n not in ['api.test.cjs', 'candidates.test.cjs', 'boolean.test.cjs', 'row-group.test.cjs', 'examples.cjs'] for n in names) or ('examples.cjs' in names and names != ['examples.cjs']):
    raise ValueError('Unsupported test file')
support = [root/p for p in ['package-lock.json', 'docs/api.md', 'docs/row-group-backend.md']]
# Complete installed JS/JSON dependency closure, not moving frontend source.
for package in ['urbit-ob', 'bn.js', 'lodash.chunk', 'lodash.isequal']:
    support += sorted(p for p in (root/'node_modules'/package).rglob('*') if p.is_file() and p.suffix in ['.js', '.json'])
support += [root/'site/assets/glyphs'/f'{kind}-{syl}-{detail}.svg' for kind,syl in [('prefix','rad'),('suffix','ret')] for detail in ['default','none']]
support += sorted((root/'docs/api-examples').glob('*'))
for p in support:
    relative = str(p.relative_to(root))
    data = p.read_bytes()
    dest = evidence/'source'/'dependencies'/relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    hashes[relative] = hashlib.sha256(data).hexdigest()
cmd=['node',*([] if names == ['examples.cjs'] else ['--test']),*[str(root/'server/test'/n) for n in names]]
env=dict(os.environ)
env['TMPDIR']='/Users/tekh/.hermes/cache/scratch'
result=subprocess.run(cmd,cwd=root,env=env,capture_output=True,text=True,timeout=120)
(evidence/'stdout.txt').write_text(result.stdout)
(evidence/'stderr.txt').write_text(result.stderr)
artifacts = {}
for p in sorted((root/'docs/api-examples').glob('*')):
    if p.is_file():
        data = p.read_bytes()
        dest = evidence/'artifacts'/p.name
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        artifacts[str(p.relative_to(root))] = hashlib.sha256(data).hexdigest()
(evidence/'receipt.json').write_text(json.dumps({'artifactSha256':artifacts,'command':cmd,'cwd':str(root),'exit':result.returncode,'environmentOverrides':{'TMPDIR':env['TMPDIR']},'timeoutSeconds':120,'sourceSha256':hashes,'time':datetime.datetime.now(datetime.timezone.utc).isoformat()},indent=2))
print(result.stdout,end='');print(result.stderr,end='',file=sys.stderr)
print('CHILD_EXIT='+str(result.returncode))
sys.exit(result.returncode)
