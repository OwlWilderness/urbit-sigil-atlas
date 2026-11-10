from pathlib import Path
import shutil, hashlib, json
root=Path('/Users/tekh/rn/urbit-sigil-atlas')
scratch=Path('/Users/tekh/.hermes/cache/scratch/pacfyl-names')
qa=root/'docs/qa';qa.mkdir(parents=True,exist_ok=True)
for name in ['test-site.cjs','test-responsive.cjs','test-integrated.cjs','test-drag.cjs','test-candidate-ui.cjs','test-api-docs.cjs','test-slot-controls-acceptance.cjs','test-slot-copy-click.cjs','test-clear-layout-acceptance.cjs','test-mixed-logic-integration.cjs','test-row-map-integration.cjs','run-site-tests.py']:
 shutil.copy2(scratch/name,qa/name)
for p in sorted((scratch/'site-qa').iterdir()):
 if p.is_file():shutil.copy2(p,qa/p.name)
files=[p for p in (root/'site').rglob('*') if p.is_file()]+[root/'server/index.cjs',root/'data/glyphs.json',root/'tools/build-site.cjs']
(qa/'final-source-hashes.json').write_text(json.dumps({str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)},indent=2)+'\n')
print('Archived browser test scripts, executed receipts, screenshots, and final source hashes to',qa)
