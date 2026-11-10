"""Authenticate the either-half successor without rewriting historical receipts."""
from pathlib import Path
import hashlib,json,re

def verify():
 root=Path(__file__).resolve().parents[1]
 evidence=root/'server/test-evidence'
 def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
 qualified=evidence/'either-half-qualified-green'
 receipt=json.loads((qualified/'receipt.json').read_text());assert receipt['exit']==0
 for rel,digest in receipt['sourceSha256'].items():
  if rel.startswith(('server/','node_modules/','site/assets/')) or rel=='package-lock.json':
   assert sha(root/rel)==digest,rel
   assert sha(qualified/'source'/rel)==digest,rel
 for rel,digest in receipt['streamSha256'].items():assert sha(qualified/rel)==digest,rel
 stdout=(qualified/'stdout.txt').read_text()
 counts={key:int(re.search(r'^# '+key+r' (\d+)$',stdout,re.M)[1]) for key in receipt['testCounts']}
 assert counts==receipt['testCounts'] and counts['pass']==counts['tests']
 assert all(counts[k]==0 for k in ('fail','cancelled','skipped','todo'))
 for name in ('api.test.cjs','candidates.test.cjs','boolean.test.cjs','row-group.test.cjs','either-half.test.cjs'):
  assert str(root/'server/test'/name) in receipt['command'],name
 old=json.loads((evidence/'row-group-final-seal/seal.json').read_text())
 for rel,digest in old['originalTestsUnchangedSha256'].items():assert sha(root/rel)==digest,rel
 # Keep the earlier actual capture corpus immutable; new captures are additive.
 original=json.loads((root/'docs/api-examples/manifest.json').read_text())
 assert len(original['items'])==old['captureCount']
 capture=evidence/'either-half-actual-examples'
 captured=json.loads((capture/'receipt.json').read_text());assert captured['exit']==0
 assert captured['sourceSha256']['server/index.cjs']==sha(root/'server/index.cjs')
 for rel,digest in captured['streamSha256'].items():assert sha(capture/rel)==digest,rel
 for rel,digest in captured['artifactSha256'].items():
  assert sha(root/rel)==digest,rel
  assert sha(capture/'artifacts'/Path(rel).name)==digest,rel
 additive=json.loads((root/'docs/api-examples/either-half-manifest.json').read_text())
 assert additive['count']==len(additive['items'])
 assert f"EXAMPLES_CAPTURED={additive['count']}" in (capture/'stdout.txt').read_text()
 for item in original['items']+additive['items']:
  assert sha(root/'docs/api-examples'/item['file'])==item['sha256'],item['file']
  assert (root/'docs/api-examples'/item['file']).read_bytes()==(root/'site/reference/examples'/item['file']).read_bytes(),item['file']
 return {'verdict':'PASS','tests':counts,'captures':len(original['items']),'additionalCaptures':len(additive['items']),'productionSha256':sha(root/'server/index.cjs'),'testReceipt':'server/test-evidence/either-half-qualified-green/receipt.json','captureReceipt':'server/test-evidence/either-half-actual-examples/receipt.json'}

if __name__=='__main__':print(json.dumps(verify(),indent=2))
