"""Canonical first-party and scoped third-party notice payload contract."""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
assert (ROOT/'LICENSE').is_file(), 'Missing canonical first-party MIT LICENSE'
assert 'Copyright (c) 2026 Sigformel contributors' in (ROOT/'LICENSE').read_text()
assert 'Permission is hereby granted, free of charge' in (ROOT/'LICENSE').read_text()
assert 'THE SOFTWARE IS PROVIDED "AS IS"' in (ROOT/'LICENSE').read_text()
for name in ['LICENSE', 'LICENSE-STATUS.md', 'THIRD-PARTY-NOTICES.txt']:
    assert (ROOT/'native/public'/name).read_bytes() == (ROOT/name).read_bytes(), name+' canonical served parity'
for path in ['native/URBIT-LICENSE.txt', 'native/ARVO-LICENSE.txt', 'site/GLYPH-LICENSE.txt']:
    assert (ROOT/path).read_text() in (ROOT/'THIRD-PARTY-NOTICES.txt').read_text(), path+' full notice missing'
for name in ['urbit-ob 5.0.1','bn.js 4.12.5','lodash.chunk 4.2.0','lodash.isequal 4.5.0','@urbit/http-api 2.3.0','browser-or-node 1.3.0','@microsoft/fetch-event-source 2.0.1','@babel/runtime 7.29.13','core-js 3.51.0']:
    assert name in (ROOT/'THIRD-PARTY-NOTICES.txt').read_text(), name
for page in (ROOT/'native/public').glob('*.html'):
    if page.name != 'licenses.html':
        assert '<a href="licenses.html">Licenses</a>' in page.read_text(), page.name+' license link'
index = (ROOT/'native/public/licenses.html').read_text()
for name in ['LICENSE','LICENSE-STATUS.md','THIRD-PARTY-NOTICES.txt','GLYPH-LICENSE.txt','NATIVE-NOTICES.txt']:
    assert 'href="'+name+'"' in index
print(json.dumps({'status':'passed','canonicalCopies':3,'fullRetainedNotices':3,'licenseIndex':True}))
