#!/usr/bin/env python3
"""Isolated loopback HTTP qualification; never contact deployment origins."""
from pathlib import Path
import subprocess,json,http.client,socket,time,hashlib,sys,os
R=Path(__file__).resolve().parents[1];E=R/'evidence';E.mkdir(exist_ok=True)
PRIVATE='web.sigformel-web.public.dappnode.private:8088';PUBLIC='sigformel.quantumtekh.com'
PAIRS=[(PRIVATE,'http://'+PRIVATE),(PUBLIC,'https://'+PUBLIC)]
BASELINE='--baseline' in sys.argv
TAG='web.sigformel-web.public.dappnode.eth:'+('0.1.0' if BASELINE else '0.1.1')
NAME='sigformel-private-access-'+('red' if BASELINE else 'green')
rows=[]
def cmd(args):return subprocess.check_output(args,cwd=R,text=True).strip()
def request(port,path,host,origin=None,method='GET',body=None,extra=None):
 time.sleep(.27)
 c=http.client.HTTPConnection('127.0.0.1',port,timeout=30)
 h={'Host':host,**({'Origin':origin} if origin is not None else {}),**(extra or {})}
 if body is not None:h['Content-Type']='application/json'
 c.request(method,path,body=body,headers=h);r=c.getresponse();b=r.read();headers=dict(r.getheaders());c.close()
 return r.status,b,headers
def check(label,actual,expected):
 ok=actual==expected if not isinstance(expected,list) else actual in expected
 rows.append({'case':label,'actual':actual,'expected':expected,'pass':ok})
def main():
 if not BASELINE:
  binding=json.loads((E/'artifact-binding.json').read_text());a=Path(binding['artifacts']['image.tar']['path'])
  assert hashlib.sha256(a.read_bytes()).hexdigest()==binding['artifacts']['image.tar']['sha256']
  cmd(['docker','load','-i',str(a)])
 image=cmd(['docker','image','inspect',TAG,'--format','{{.Id}}'])
 assert cmd(['docker','image','inspect',TAG,'--format','{{.Os}}/{{.Architecture}}'])=='linux/amd64'
 cid=cmd(['docker','run','-d','--name',NAME,'--platform','linux/amd64','--read-only','--tmpfs','/tmp:rw,noexec,nosuid,size=32m','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','512m','--pids-limit','64','-p','127.0.0.1::8088',TAG])
 port=int(json.loads(cmd(['docker','inspect',NAME,'--format','{{json (index .NetworkSettings.Ports "8088/tcp")}}']))[0]['HostPort'])
 try:
  for _ in range(60):
   try:
    if request(port,'/api/v1/health',PUBLIC)[0]==200:break
   except (OSError,http.client.HTTPException):pass
   time.sleep(.2)
  else:raise AssertionError('Public baseline failed readiness')
  payload=json.dumps({'syllables':['rad','dev','bot','myr'],'mode':'free'})
  check('Open UI private URL',json.loads((R/'dappnode_package.json').read_text())['links']['ui'],'http://'+PRIVATE)
  for host,origin in PAIRS:
   check(host+' health',request(port,'/api/v1/health',host)[0],200)
   s,b,h=request(port,'/api/v1/compose',host,origin,'POST',payload);check(host+' same-origin compose',s,200)
   if s==200:check(host+' compose name',json.loads(b)['name'],'~raddev-botmyr')
   if BASELINE:continue
   check(host+' static',request(port,'/workshop.html',host)[0],200)
   check(host+' omitted Origin',request(port,'/api/v1/compose',host,method='POST',body=payload)[0],403)
   other=PAIRS[1][1] if host==PRIVATE else PAIRS[0][1]
   check(host+' cross-origin compose',request(port,'/api/v1/compose',host,other,'POST',payload)[0],403)
   check(host+' cross-origin GET',request(port,'/api/v1/health',host,other)[0],403)
   for o in ['null','https://evil.example',origin+'/',origin+':443']:
    check(host+' invalid Origin '+o,request(port,'/api/v1/compose',host,o,'POST',payload)[0],403)
   for path in ['/api/v1/compositions','/api/v1/compositions/','/api/v1/%63ompositions','/api/v1/%2563ompositions','/api/v1/a/../compositions','//api/v1/compositions','/api%2fv1/compositions','/api//v1/compositions']:
    for method in ['GET','POST']:
     check(host+' record alias '+method+' '+path,request(port,path,host,origin,method,payload if method=='POST' else None)[0],[400,403,404,405])
   for duplicate in ['host','origin']:
    headers=f'Host: {host}\r\n'+(f'Host: {host}\r\n' if duplicate=='host' else f'Origin: {origin}\r\nOrigin: {origin}\r\n')
    raw=f'POST /api/v1/compose HTTP/1.1\r\n{headers}Content-Type: application/json\r\nContent-Length: {len(payload)}\r\nConnection: close\r\n\r\n{payload}'.encode()
    with socket.create_connection(('127.0.0.1',port),timeout=5) as sock:
     sock.sendall(raw);status=int(sock.recv(1024).split(b' ')[1]);check(host+' duplicate '+duplicate,status,[400,403,421])
   check(host+' final healthy compose',request(port,'/api/v1/compose',host,origin,'POST',payload)[0],200)
  if not BASELINE:
   for host in ['evil.example',PUBLIC+':443',PUBLIC+'.','SIGFORMEL.quantumtekh.com',PRIVATE.split(':')[0],PRIVATE.replace(':8088',':80'),PRIVATE+'.evil.example','localhost','127.0.0.1:8088']:
    check('unknown Host '+host,request(port,'/api/v1/health',host)[0],421)
   check('forwarded headers not authority',request(port,'/api/v1/health','evil.example',extra={'X-Forwarded-Host':PUBLIC,'X-Forwarded-Proto':'https'})[0],421)
   for host,origin in PAIRS:
    s,b,_=request(port,'/api/v1/candidates?grouping=rows&p0=rad&p1=dev&p2=bot&p3=myr&pairPlacement=either',host)
    check(host+' exact/either search',s,200)
    if s==200:check(host+' search names correct',[i['name'] for i in json.loads(b)['items']]==['~botmyr-raddev','~raddev-botmyr'],True)
   cmd(['docker','exec',NAME,'nginx','-t','-e','stderr','-c','/app/runtime/nginx.conf'])
  result={'pass':all(x['pass'] for x in rows),'baseline':BASELINE,'tag':TAG,'imageId':image,'container':NAME,'containerId':cid,'port':port,'checks':rows,'testSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'scope':'Fresh isolated emulated AMD64 image; loopback transport with literal Host/Origin; not private DNS/VPN or production route proof'}
  (E/('private-red.json' if BASELINE else 'private-green.json')).write_text(json.dumps(result,indent=2)+'\n')
  print(json.dumps({k:v for k,v in result.items() if k!='checks'},indent=2));print(json.dumps([x for x in rows if not x['pass']],indent=2))
  return 0 if result['pass'] else 1
 finally:
  if BASELINE or '--keep' not in sys.argv:
   subprocess.run(['docker','stop','-t','10',NAME],check=True);subprocess.run(['docker','rm',NAME],check=True)
if __name__=='__main__':sys.exit(main())
