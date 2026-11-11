#!/usr/bin/env python3
from pathlib import Path
import http.client,json,time,concurrent.futures,hashlib,socket,subprocess
ROOT=Path(__file__).resolve().parents[1];PORT=18742;HOST='sigformel.quantumtekh.com';ORIGIN='https://'+HOST
rows=[]
def request(path,method='GET',headers=None,body=None,pace=True):
 if pace:time.sleep(.27)
 c=http.client.HTTPConnection('127.0.0.1',PORT,timeout=40);h={'Host':HOST};h.update(headers or {});start=time.monotonic()
 try:
  c.request(method,path,body=body,headers=h);r=c.getresponse();data=r.read();result={'path':path,'method':method,'status':r.status,'ms':(time.monotonic()-start)*1000,'data':data,'headers':dict(r.getheaders())};rows.append({k:v for k,v in result.items() if k not in ('data','headers')});return result
 finally:c.close()
def good(path):
 r=request(path);assert r['status']==200,(path,r['status'],r['data'][:100]);return json.loads(r['data'])
def main():
 assert good('/api/v1/health')['records'] is False
 for path in ['/','/index.html','/prefixes.html','/suffixes.html','/shortlist.html','/workshop.html','/api.html','/app.js','/workshop.js','/workshop.css','/styles.css','/assets/glyphs/prefix-rad-none.svg','/provenance.json','/GLYPH-LICENSE.txt']:
  r=request(path);assert r['status']==200,(path,r['status']);assert r['headers'].get('Cache-Control')=='no-cache';assert r['headers'].get('X-Content-Type-Options')=='nosniff'
  expected='site/index.html' if path=='/' else 'site'+path
  assert hashlib.sha256(r['data']).digest()==hashlib.sha256((ROOT/expected).read_bytes()).digest(),path
 assert len(good('/api/v1/glyphs')['items'])==512
 assert good('/api/v1/glyphs/prefix/rad')['syllable']=='rad'
 # Exact fixed/either pair semantic fixture and stable pagination, through real Nginx+adapter+unchanged core.
 base='/api/v1/candidates?grouping=rows&p0=rad&p1=dev&p2=bot&p3=myr'
 assert [i['name'] for i in good(base)['items']]==['~raddev-botmyr']
 either=good(base+'&pairPlacement=either');assert either['total']==2;assert [i['name'] for i in either['items']]==['~botmyr-raddev','~raddev-botmyr']
 assert good(base+'&pairPlacement=either&offset=1&limit=1')['items']==either['items'][1:]
 globalq='/api/v1/candidates?grouping=rows&pairPlacement=either&shape0=circle&shape1=square&shape2=circle&shape3=square&join1=or&join2=and&join3=or&limit=5'
 assert good(globalq)['total']==2016176064
 # Real uncached selected-star computation: saturate only search; health/static must stay responsive.
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  start=time.monotonic();future=pool.submit(request,'/api/v1/candidates?star=~pacfyl&limit=2',pace=False);time.sleep(.35)
  health=request('/api/v1/health',pace=False);assert health['status']==200 and health['ms']<1000,health
  busy=request('/api/v1/candidates?limit=1',pace=False);assert busy['status']==503,busy
  result=future.result();assert result['status']==200,result
  star=json.loads(result['data']);assert star['total']==65535 and len(star['items'])==2
  starMeasure={'uncachedMs':(time.monotonic()-start)*1000,'healthDuringComputeMs':health['ms'],'busySearchStatus':busy['status']}
 assert good('/api/v1/planets?star=~pacfyl&limit=2')['items']==star['items']
 # Bounded raw-path aliases: every variant denied, never record dispatch.
 variants=set(['/api/v1/compositions','/api/v1/compositions/','/api/v1/COMPOSITIONS','//api/v1/compositions','/api//v1/compositions','/api/v1/./compositions','/api/v1/a/../compositions','/api/v1/compositions;foo','/api/v1/compositions.json','/API/v1/compositions'])
 for token in ['%63ompositions','%2563ompositions','compo%73itions','compo%2573itions','compositions%2f','compositions%252f','compositions%00','compositions%5c','compositions%255c']:
  variants.add('/api/v1/'+token)
 for prefix in ['/api%2fv1/','/api%252fv1/','/%61pi/v1/','/%2561pi/v1/','/api/v1%2f','/api/v1%252f']:
  variants.add(prefix+'compositions')
 for p in sorted(variants):
  for verb in ['GET','POST']:
   r=request(p,verb,{'Origin':ORIGIN,'Content-Type':'application/json'},'{}' if verb=='POST' else None);assert r['status'] in [400,403,404,405],r
 for verb in ['HEAD','OPTIONS','PUT','PATCH','DELETE','TRACE']:
  r=request('/api/v1/candidates',verb);assert r['status'] in [400,403,404,405],r
 for route,verb in [('/api/v1/compose','GET'),('/api/v1/health','POST'),('/api/v1/unknown','GET')]:
  assert request(route,verb,{'Origin':ORIGIN,'Content-Type':'application/json'},'{}' if verb=='POST' else None)['status']==404
 payload=json.dumps({'syllables':['rad','dev','bot','myr'],'mode':'free'})
 for origin in [None,'null','http://'+HOST,'https://evil.example','https://'+HOST+':443',ORIGIN+'/']:
  headers={'Content-Type':'application/json'}
  if origin is not None:headers['Origin']=origin
  assert request('/api/v1/compose','POST',headers,payload)['status']==403
 for host in ['evil.example',HOST+':443',HOST+'.','SIGFORMEL.quantumtekh.com','localhost','127.0.0.1:8088']:
  assert request('/api/v1/health',headers={'Host':host})['status']==421
 assert request('/api/v1/compose','POST',{'Origin':ORIGIN,'Content-Type':'text/plain'},payload)['status']==415
 assert request('/api/v1/compose','POST',{'Origin':ORIGIN,'Content-Type':'application/json','Content-Encoding':'gzip'},payload)['status']==415
 assert request('/api/v1/compose','POST',{'Origin':ORIGIN,'Content-Type':'application/json'},'{')['status']==400
 assert request('/api/v1/compose','POST',{'Origin':ORIGIN,'Content-Type':'application/json'},'x'*8193)['status']==413
 assert request('/api/v1/candidates?limit=1&limit=2')['status']==400
 for path in ['/.git/config','/server/index.cjs','/runtime/gateway.cjs','/var','/reference/api.txt']:
  assert request(path)['status']==404
 # Edge rate limit genuinely enforced, then healthy compose still succeeds.
 with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:burst=list(pool.map(lambda _:request('/api/v1/health',pace=False)['status'],range(40)))
 assert 429 in burst,burst
 time.sleep(4)
 valid=request('/api/v1/compose','POST',{'Origin':ORIGIN,'Content-Type':'application/json'},payload);assert valid['status']==200 and json.loads(valid['data'])['name']=='~raddev-botmyr'
 # Raw duplicate Host and Origin must not get successful responses.
 for header in [f'Host: {HOST}\r\nHost: {HOST}',f'Host: {HOST}\r\nOrigin: {ORIGIN}\r\nOrigin: {ORIGIN}']:
  method='GET' if header.count('Origin')==0 else 'POST';path='/api/v1/health' if method=='GET' else '/api/v1/compose'
  raw=f'{method} {path} HTTP/1.1\r\n{header}\r\nContent-Type: application/json\r\nContent-Length: 0\r\nConnection: close\r\n\r\n'.encode()
  with socket.create_connection(('127.0.0.1',PORT),timeout=5) as sock:sock.sendall(raw);status=sock.recv(1024).split(b'\r\n')[0];assert b' 200 ' not in status,status
 result={'pass':True,'requests':len(rows),'recordAliasCount':len(variants),'starMeasure':starMeasure,'rateStatuses':{str(s):burst.count(s) for s in set(burst)},'source':{str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [ROOT/'server/index.cjs',*list((ROOT/'runtime').glob('*'))]},'checks':rows}
 (ROOT/'evidence/http-qualification.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2))
try:main()
except BaseException:
 (ROOT/'evidence/http-partial.json').write_text(json.dumps(rows,indent=2));raise
