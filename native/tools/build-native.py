from pathlib import Path
import shutil,re,json,hashlib
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'native/public'
if out.exists():shutil.rmtree(out)
out.mkdir(parents=True,exist_ok=True)
for p in (ROOT/'site').rglob('*'):
 if not p.is_file():continue
 rel=p.relative_to(ROOT/'site');dest=out/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest)
app=(ROOT/'site/app.js').read_text()
app=app.replace("(()=>{'use strict';", "window.SigilNative.ready.then(()=>{'use strict';",1)
old=next(line for line in app.splitlines() if line.startswith('let memory='))
app=app.replace(old,"let storageOkay=true;function read(key,fallback){return window.SigilNative.get(key,fallback);}function write(key,value){window.SigilNative.set(key,value);}")
old=next(line for line in app.splitlines() if line.startswith('async function api('))
app=app.replace(old,"async function api(endpoint,options={}){return window.SigilNative.request(endpoint,options);}")
app=app.replace('Local API connected · names only, no spawning','Native Hoon connected · names only, no spawning').replace('Local API unavailable','Native Eyre unavailable').replace('API offline. Atlas browsing and shortlist still work.','Native Eyre disconnected. Reopen this app to reconnect.').replace('No API compositions saved yet.','No confirmed compositions saved yet.').replace("})();","});")
(out/'app.js').write_text(app)
workshop=(ROOT/'site/workshop.js').read_text().replace('Run the local API to see matching names. Drag-and-drop and the atlas still work offline.','Connect to native Eyre to see matching names. Drag-and-drop and the atlas remain available.')
(out/'workshop.js').write_text(workshop)
shutil.copyfile(ROOT/'native/frontend/native.js',out/'native.js')
shutil.copyfile(ROOT/'node_modules/@urbit/http-api/dist/urbit-http-api.min.js',out/'urbit-http-api-2.3.0.min.js')
(out/'native-config.js').write_text("window.SIGFORMEL_AGENT='sigformel';\n")
for p in out.glob('*.html'):
 html=p.read_text();html=html.replace('<script defer src="workshop.js"></script>','<script defer src="urbit-http-api-2.3.0.min.js"></script><script defer src="native-config.js"></script><script defer src="native.js"></script><script defer src="workshop.js"></script>')
 html=html.replace('Saved in this browser.','Saved on your installing ship.').replace('Checking local API…','Connecting to native Eyre…').replace('Stored by the local API, separate from this browser’s glyph shortlist.','Saved in Gall on your installing ship, alongside your confirmed glyph shortlist.')
 if p.name=='api.html':
  start=html.index('<main ');end=html.index('</main>',start)
  html=html[:start]+'''<main id="main" tabindex="-1"><div class="page-head"><div><h1>Native API</h1><p>Hoon validates identities and owns name searches. Eyre uses your existing ship session.</p></div></div><p id="backend-status">Connecting to native Eyre…</p><h2>Gall agent: sigformel</h2><p>Read state: <code>/~/scry/sigformel/state.json</code>. Send JSON pokes through the bundled official Urbit HTTP API client.</p><pre>{action: "search", id: "unique-request-id", query: {grouping: "rows", pairPlacement: "either", p0: "rad", p1: "dev", limit: 50}}</pre><p>Read <code>/result/&lt;id&gt;</code> by scry until pending is absent. Global search counts and unranks syllable truth categories without enumerating the planet namespace. Selected-star scans cover at most 65,535 native descendants in 1,024-item events. Four request jobs are retained; abandoned jobs can be evicted.</p><p>Preferences and shortlist entries are validated and stored durably in Gall. Editing drafts remain in the browser. A match proves neither ownership, current sponsorship nor spawn availability.</p><p><a href="provenance.json">Glyph provenance</a> · <a href="GLYPH-LICENSE.txt">Glyph license</a> · <a href="NATIVE-NOTICES.txt">Native dependency notices</a></p>'''+html[end:]
 p.write_text(html)
notice=(ROOT/'native/URBIT-LICENSE.txt').read_text()
notices=['Urbit native support source and official Urbit HTTP API 2.3.0 (MIT):\n'+notice, 'Arvo support/reference source (MIT):\n'+(ROOT/'native/ARVO-LICENSE.txt').read_text()]
for dependency in ['browser-or-node','@microsoft/fetch-event-source','@babel/runtime','core-js']:
 package=ROOT/'node_modules'/dependency
 metadata=json.loads((package/'package.json').read_text())
 license_file=next((p for p in [package/'LICENSE',package/'LICENSE.txt'] if p.exists()),None)
 assert license_file, dependency+' license missing'
 notices.append(dependency+' '+metadata['version']+'\n'+license_file.read_text())
(out/'NATIVE-NOTICES.txt').write_text('\n\n'.join(notices))
for name in ['LICENSE','LICENSE-STATUS.md','THIRD-PARTY-NOTICES.txt']:
 shutil.copyfile(ROOT/name,out/name)
 assert (out/name).read_bytes()==(ROOT/name).read_bytes(), 'Canonical license payload mismatch: '+name
manifest=[]
for p in sorted(out.rglob('*')):
 if p.is_file():manifest.append({'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(ROOT/'native/frontend-manifest.json').write_text(json.dumps(manifest,indent=2))
print('Built native frontend',len(manifest),'files; original UI geometry CSS byte-identical')
assert (out/'styles.css').read_bytes()==(ROOT/'site/styles.css').read_bytes()
assert (out/'workshop.css').read_bytes()==(ROOT/'site/workshop.css').read_bytes()
svg=[p for p in out.glob('assets/glyphs/*.svg')];assert len(svg)==1024
for p in svg:assert p.read_bytes()==(ROOT/'site/assets/glyphs'/p.name).read_bytes()
print('Verified all 1024 authentic glyph SVG bytes and both accepted CSS files unchanged')
