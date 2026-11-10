import pathlib,json,hashlib
root=pathlib.Path('/Users/tekh/rn/urbit-sigil-atlas')
evidence=root/'tests/slot-controls/evidence/final-green'
receipt=json.loads((evidence/'receipt.json').read_text())
for name,want in receipt['sha256'].items():
 actual=hashlib.sha256((root/name).read_bytes()).hexdigest()
 assert actual==want,(name,actual,want)
print('SOURCE_SEAL_PASS',len(receipt['sha256']),'files unchanged since final browser execution')
print('PASS_CHECKPOINTS',sum(line.startswith('PASS ') for line in (evidence/'stdout.txt').read_text().splitlines()))
print('BROWSER_CHILD_EXIT',receipt['exit'])
assert receipt['exit']==0
print('HANDOFF_SHA256',hashlib.sha256((root/'docs/slot-controls.md').read_bytes()).hexdigest())
