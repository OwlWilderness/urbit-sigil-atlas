from pathlib import Path
import json,sys,hashlib
R=Path(__file__).resolve().parents[1]
checks={}
checks['agent_filename']=(R/'native/desk/app/sigformel.hoon').exists() and not (R/'native/desk/app/sigil-atlas.hoon').exists()
checks['bill']=(R/'native/desk/desk.bill').read_text().strip()=='~[%sigformel]'
checks['docket']=all(s in next(p for p in [R/'native/desk/desk.docket-0', R/'native/desk/desk.docket-0.example'] if p.exists()).read_text() for s in ["title+'Sigformel'","base+'sigformel'"])
checks['transport']="window.SIGFORMEL_AGENT||'sigformel'" in (R/'native/frontend/native.js').read_text()
checks['pages']=all('Sigformel' in p.read_text() and 'Sigil Atlas' not in p.read_text() for p in (R/'site').glob('*.html'))
checks['config']="window.SIGFORMEL_AGENT='sigformel'" in (R/'tools/build-native.py').read_text()
checks['unchanged_library']=hashlib.sha256((R/'native/desk/lib/sigil-atlas.hoon').read_bytes()).hexdigest()=='3170a768da0cc117f3212f7970973cce79f3aa8c8a260a5857f89ecc6e595991'
print(json.dumps(checks,indent=2));assert all(checks.values()),'Final native Sigformel identity not yet implemented'
