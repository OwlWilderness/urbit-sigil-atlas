from pathlib import Path
import hashlib,json,re

def verify():
 root=Path(__file__).resolve().parents[1]
 evidence=root/'server/test-evidence'
 seal=json.loads((evidence/'row-group-final-seal/seal.json').read_text())
 assert seal['verdict']=='PASS'
 def check(base,mapping):
  for rel,digest in mapping.items():assert hashlib.sha256((base/rel).read_bytes()).hexdigest()==digest,rel
 for field in ('sourceSha256','originalTestsUnchangedSha256','artifactSha256'):check(root,seal[field])
 check(evidence,seal['receiptSha256'])
 for label,field in [('row-group-qualified-green','qualifiedSourceSha256'),('row-group-actual-examples','captureSourceSha256')]:
  receipt=json.loads((evidence/label/'receipt.json').read_text());assert receipt['exit']==0
  assert receipt['sourceSha256']==seal[field]
  for rel,digest in receipt['sourceSha256'].items():
   if rel.startswith('docs/api-examples/'):continue # captures intentionally follow the test-source snapshot
   source=root/'server'/rel if rel=='index.cjs' or rel.startswith(('data/','test/')) else root/rel
   assert hashlib.sha256(source.read_bytes()).hexdigest()==digest,rel
 qualified=json.loads((evidence/'row-group-qualified-green/receipt.json').read_text())
 for name in ('api.test.cjs','candidates.test.cjs','boolean.test.cjs','row-group.test.cjs'):
  assert any(str(arg).endswith('/'+name) for arg in qualified['command']),name
 stdout=(evidence/'row-group-qualified-green/stdout.txt').read_text()
 counts={key:int(re.search(r'^# '+key+r' (\d+)$',stdout,re.M)[1]) for key in seal['testCounts']}
 assert counts==seal['testCounts'] and counts['pass']==counts['tests'] and all(counts[k]==0 for k in ('fail','cancelled','skipped','todo'))
 manifest=json.loads((root/'docs/api-examples/manifest.json').read_text())
 assert len(manifest['items'])==seal['captureCount']
 assert f"EXAMPLES_CAPTURED={seal['captureCount']}" in (evidence/'row-group-actual-examples/stdout.txt').read_text()
 for item in manifest['items']:assert hashlib.sha256((root/'docs/api-examples'/item['file']).read_bytes()).hexdigest()==item['sha256']
 return {'verdict':'PASS','tests':counts,'captures':len(manifest['items']),'productionSha256':hashlib.sha256((root/'server/index.cjs').read_bytes()).hexdigest(),'testReceipt':'server/test-evidence/row-group-qualified-green/receipt.json','captureReceipt':'server/test-evidence/row-group-actual-examples/receipt.json'}

if __name__=='__main__':print(json.dumps(verify(),indent=2))
