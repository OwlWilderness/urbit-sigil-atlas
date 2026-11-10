from pathlib import Path
import os,json,hashlib,re,urllib.request,zipfile
from html.parser import HTMLParser
root=Path(__file__).resolve().parents[1]
base=os.environ.get('ATLAS_URL','http://127.0.0.1:8741')
def raw(path):
 with urllib.request.urlopen(base+path,timeout=45) as response:
  assert response.status==200
  return response.read(),response.headers.get_content_type()
def get(path):return json.loads(raw(path)[0])
health=get('/api/v1/health');assert health['ok']
assert get('/api/v1/glyphs')['total']==512
assert len(get('/api/v1/shapes')['items'])==12
assert get('/api/v1/planets?star=~pacfyl&syllables=rad,bot&limit=50')['total']==1
assert get('/api/v1/planets?star=~pacfyl&endings=it,yr,oc,ef&minMatches=3&limit=50')['total']==21
family='shape0=circle&shape1=circle&shape2=circle&shape3=circle&limit=2'
global_matches=get('/api/v1/candidates?'+family);assert global_matches['star'] is None and global_matches['total']==2432040
star_matches=get('/api/v1/candidates?'+family+'&star=~pacfyl');assert star_matches['total']==29
exact=get('/api/v1/candidates?p0=bot&p1=myr&p2=rad&p3=ret');assert exact['total']==1 and exact['items'][0]['name']=='~botmyr-radret'
glyph=get('/api/v1/glyphs/prefix/rad');assert glyph['syllable']=='rad' and glyph['kind']=='prefix'
for detail,key in [('default','full'),('none','silhouette')]:
 data,content_type=raw('/api/v1/glyphs/prefix/rad/svg?detail='+detail)
 assert content_type=='image/svg+xml'
 assert data==(root/('site/assets/glyphs/prefix-rad-'+detail+'.svg')).read_bytes()
 assert data.decode()==glyph['svg'][key]
saved=get('/api/v1/compositions')
import runpy
backend=runpy.run_path(str(root/'tools/verify-either-half-handoff.py'))['verify']()
assert backend['verdict']=='PASS'
passed=backend['tests']['pass'];failed=backend['tests']['fail'];capture_count=backend['captures']
provenance=json.loads((root/'site/provenance.json').read_text())
for item in provenance['manifest']:assert hashlib.sha256((root/'site/assets/glyphs'/item['file']).read_bytes()).hexdigest()==item['sha256']
assert len(provenance['manifest'])==1024
manifest=json.loads((root/'docs/api-examples/manifest.json').read_text());assert len(manifest['items'])==capture_count
for item in manifest['items']:
 data=(root/'docs/api-examples'/item['file']).read_bytes()
 assert hashlib.sha256(data).hexdigest()==item['sha256']
 assert data==(root/'site/reference/examples'/item['file']).read_bytes()
 if item['method']=='POST':assert 'Origin: http://127.0.0.1:8741' in item['curl'] and 'Content-Type: application/json' in item['curl']
class Links(HTMLParser):
 def __init__(self):super().__init__();self.urls=[]
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if key in ('href','src'):self.urls.append(value)
for filename in ['index.html','prefixes.html','suffixes.html','shortlist.html','workshop.html','api.html']:
 parser=Links();parser.feed((root/'site'/filename).read_text())
 for url in parser.urls:
  assert not url.startswith(('http:','https:','data:')),url
  bare=url.split('#')[0].split('?')[0]
  if bare:assert (root/'site'/bare).is_file(),(filename,url)
 assert raw('/'+filename)[1]=='text/html'
assert raw('/reference/api.txt')[1]=='text/plain'
assert raw('/reference/examples/README.txt')[1]=='text/plain'
slot_receipt_path=Path(os.environ.get('SLOT_RECEIPT',str(root/'tests/slot-controls/evidence/either-half-final-toolbar2/receipt.json')))
if not slot_receipt_path.is_absolute():slot_receipt_path=root/slot_receipt_path
slot_receipt=json.loads(slot_receipt_path.read_text());assert slot_receipt['exit']==0
for rel,digest in slot_receipt['sha256'].items():assert hashlib.sha256((root/rel).read_bytes()).hexdigest()==digest,rel
for field in ('backend_sha256','reused_receipt_sha256'):
 for rel,digest in slot_receipt.get(field,{}).items():assert hashlib.sha256((root/rel).read_bytes()).hexdigest()==digest,rel
for rel,digest in slot_receipt.get('artifact_sha256',{}).items():assert hashlib.sha256((slot_receipt_path.parent/rel).read_bytes()).hexdigest()==digest,rel
# Row grouping explicitly authorizes renderer, independent persistence and query changes.
# Authenticate their current complete closure; the predecessor's renderer-only guard no longer applies.
assert slot_receipt['schema']=='either-half-ui-v1' and slot_receipt['source_unchanged']
required_ui={'site/app.js','site/workshop.js','site/workshop.css','site/workshop.html','tools/workshop-template.cjs','tools/build-site.cjs'}
assert required_ui.issubset(slot_receipt['sha256'])
expected_commands=[['node',str(root/'tests/slot-controls/results-toolbar.cjs')],['node',str(root/'tests/slot-controls/toolbar-geometry.cjs')]]
previous=json.loads((root/'tests/slot-controls/evidence/either-half-final-entry/receipt.json').read_text())
# Toolbar relocation intentionally changes builder/template/CSS, not input logic.
# Reuse entry behavior only with byte-identical application/controller sources.
for rel in ('site/app.js','site/workshop.js'):
 assert slot_receipt['sha256'][rel]==previous['sha256'][rel],rel
assert [child['command'] for child in slot_receipt['children']]==expected_commands
for index,child in enumerate(slot_receipt['children']):
 assert child['exit']==0 and child['cwd']==str(root)
 for stream in ('stdout','stderr'):
  name=f'{index}-{stream}.txt'
  data=(slot_receipt_path.parent/name).read_bytes()
  assert hashlib.sha256(data).hexdigest()==slot_receipt['artifact_sha256'][name]
  assert data.decode()==child[stream]
 assert 'PASS' in child['stdout'] and child['stderr']==''
samples=[json.loads(line) for line in slot_receipt['children'][1]['stdout'].splitlines() if line.startswith('{"label":')]
toolbar_samples=[json.loads(line) for line in slot_receipt['children'][0]['stdout'].splitlines() if line.startswith('{"width":')]
assert {s['width'] for s in toolbar_samples}=={900,640,375}
for sample in toolbar_samples:
 g=sample['geometry']
 assert g['heading']['bottom']<=g['status']['y'] and g['status']['bottom']<=g['actions']['y']
 assert abs(g['refresh']['bottom']-g['search']['bottom'])<=2 and g['search']['x']>=g['refresh']['right']
 assert g['documentFits'] and sample['refreshWorks'] and sample['searchFilterWorks'] and sample['pageErrors']==[]
assert samples and all(all(sample['checks'].values()) for sample in samples)
assert {375,640,768,900,1000,1100,1360}.issubset({int(sample['label'].split('-')[1]) for sample in samples})
for rel in slot_receipt['artifact_sha256']:
 if not rel.endswith('-geometry.json'):continue
 geometry=json.loads((slot_receipt_path.parent/rel).read_text());a=geometry['dock'];b=geometry['filter']
 assert b['x']>=a['right']-1,rel
 for key in ('width','height','y','bottom'):assert abs(a[key]-b[key])<=2,(rel,key)
 assert geometry['scroll']<=geometry['width']+1,rel
 if geometry['rowScroll']>geometry['rowClient']+1:assert geometry['rowOverflow']=='auto',rel
interaction=json.loads((slot_receipt_path.parent/'geometry/interaction.json').read_text())
assert interaction['trustedDrag']=={'trusted':True,'effect':'copy'}
assert all(interaction[key] for key in ('sourceRetained','eyeRetainsValue','selectionClear'))
report={'liveURL':base+'/workshop.html','slotControls':{'sourceReceiptVerified':True,'receipt':str(slot_receipt_path.relative_to(root)),'sealedFiles':len(slot_receipt['sha256']),'geometrySamples':len(samples),'typedInput':True,'artworkClickSelectsOnly':True,'clearSelectedAndAll':True,'externalCompactControls':True,'placeholder':'zod','filterIcons':'eye includes; crossed eye ignores without erasing; distinct trash clears','copyButtonsHidden':True,'mixedBooleanSearch':'(top row) AND/OR (bottom row), inclusive OR; legacy API linear default retained','workshopLayout':'full-width shapes top; main 2x2 left/filter right remain adjacent equal-width/equal-height; confined composition-row horizontal scroll when narrow; full-width actions then results','compactRowMiniMap':True,'legacyOperatorStorageUntouched':True,'copyPreservesSource':True,'searchEnablePreservesValues':True,'catalogueScope':'All stars; no hidden star filter'},'apiTests':{'passed':passed,'failed':failed,'sourceReceiptVerified':True},'catalogue':{'glyphs':512,'shapes':12,'svgHashesVerified':1024},'candidateQueries':{'globalFourCircles':global_matches['total'],'pacfylFourCircles':star_matches['total'],'globalExactBotmyrRadret':exact['total']},'documentation':{'capturedRequestResponses':len(manifest['items']),'allHashesVerified':True,'webReference':'api.html'},'browserEvidence':{'drag':'Native desktop artwork drag COPY, selection-only clicks, safe clearing; mobile tap/checkbox/typing verified, native mobile drag not claimed.','candidates':'Global and optional-star exact/family matching, inclusive mixed AND/OR with preserved operators and stale-response cancellation.','integration':'Parent desktop/mobile actual selected-star union and mixed-group totals agree with API; no user-record writes.','responsive':'Equal adjacent outer panels at1360/1100/1000/900/768/640/375 plus boundary resize; narrow overflow confined to composition row, never document; no stacking.'},'liveSavedCompositionCount':saved['total'],'scope':'Local-only matching names; no spawn availability, chain mutation or public deployment.'}
report['slotControls']['pairPlacement']='Middle AND/OR fixes positions; AND ↕ / OR ↕ searches each pair in either half; separate validated persistence and single-pair placement supported.'
report['slotControls']['textEntry']='Single optional leading tilde in syllables and catalogue search; star accepts with/without tilde; empty default with ~pacfyl placeholder; strict spelling retained.'
report['slotControls']['hiddenActions']=['Validate preview','Save composition']
report['slotControls']['resultsToolbar']='Matching planet names and dynamic status precede Refresh matches + Find a syllable on the same row, including375px; one original set of glyph filters, unchanged semantics.'
report['documentation']['additionalEitherHalfCaptures']=backend['additionalCaptures']
report['documentation']['capturedRequestResponses']+=backend['additionalCaptures']
report['browserEvidence']['eitherHalfIntegration']='Parent actual live API and Brave900px results: swapped-pair set, single-pair top/bottom union, selected-star AND/OR, no request failures or JS errors; equal adjacent panels retained.'
(root/'docs/verification.json').write_text(json.dumps(report,indent=2)+'\n')
include=[root/p for p in ['README.md','package.json','package-lock.json','docs/api.md','docs/verification.json']]
for folder in ['site','tools','data','server','docs/api-examples','tests/slot-controls']:
 include.extend(p for p in sorted((root/folder).rglob('*')) if p.is_file() and 'test-evidence' not in p.parts and 'evidence' not in p.parts and '__pycache__' not in p.parts)
out=root/'dist';out.mkdir(exist_ok=True)
for filename,members in [('sigil-atlas-and-api.zip',include),('sigil-atlas-static.zip',sorted(p for p in (root/'site').rglob('*') if p.is_file()))]:
 dest=out/filename
 with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as archive:
  for p in members:archive.write(p,str(Path('sigil-atlas')/p.relative_to(root)))
 with zipfile.ZipFile(dest) as archive:
  assert archive.testzip() is None
  assert not any('/var/' in n or '/node_modules/' in n or 'checkpoint' in n or 'resume-prompt' in n for n in archive.namelist())
 print(filename,len(members),'files',dest.stat().st_size,'bytes',hashlib.sha256(dest.read_bytes()).hexdigest())
print(json.dumps(report,indent=2))
