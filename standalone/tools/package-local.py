#!/usr/bin/env python3
"""Local-only explicit source and raw Docker-save package. Never upload/install."""
from pathlib import Path,PurePosixPath
import argparse,hashlib,json,subprocess,tarfile,zipfile,io
ROOT=Path(__file__).resolve().parents[1]
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1048576),b''):h.update(b)
 return h.hexdigest()
def dump(p,obj):p.write_text(json.dumps(obj,indent=2)+'\n')
def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--source-only',action='store_true',help='Export reviewed source without Docker access')
 args=parser.parse_args()
 m=json.loads((ROOT/'dappnode_package.json').read_text());tag='web.'+m['name']+':'+m['version'];out=ROOT/'artifacts'/('sigformel-web-'+m['version']+'-linux-amd64');out.mkdir(parents=True,exist_ok=False)
 selected=['LICENSE','Dockerfile','.dockerignore','.gitignore','README.md','package.json','package-lock.json','dappnode_package.json','docker-compose.yml','server/index.cjs','tools/validate-package.mjs','tools/package-local.py']
 for directory in ['runtime','server/data','site','tests']:
  selected.extend(str(p.relative_to(ROOT)) for p in (ROOT/directory).rglob('*') if p.is_file() and 'reference' not in p.relative_to(ROOT).parts and '__pycache__' not in p.parts)
 selected.extend(str(p.relative_to(ROOT)) for p in (ROOT/'server/test').glob('*.cjs'))
 selected=sorted(set(selected));manifest=[]
 for rel in selected:
  p=ROOT/rel;assert not p.is_symlink() and not any(x in PurePosixPath(rel).parts for x in ['.git','node_modules','var','evidence','artifacts']);manifest.append({'path':rel,'bytes':p.stat().st_size,'sha256':sha(p)})
 dump(out/'source-manifest.json',{'files':manifest,'exclusions':['Git history','owner/private var','node_modules','evidence','artifacts','historical site/reference local record examples','native moon source','migration/preflight operational helpers']})
 with zipfile.ZipFile(out/'public-source.zip','x',compression=zipfile.ZIP_DEFLATED) as z:
  for rel in selected:
   zi=zipfile.ZipInfo(rel,(2026,11,10,0,0,0));zi.external_attr=0o100644<<16;zi.compress_type=zipfile.ZIP_DEFLATED;z.writestr(zi,(ROOT/rel).read_bytes())
 with zipfile.ZipFile(out/'public-source.zip') as z:
  assert z.testzip() is None and sorted(z.namelist())==selected
  for f in manifest:assert hashlib.sha256(z.read(f['path'])).hexdigest()==f['sha256']
 (out/'dappnode_package.json').write_bytes((ROOT/'dappnode_package.json').read_bytes());compose=json.loads((ROOT/'docker-compose.yml').read_text());compose['services']['web'].pop('build');dump(out/'docker-compose.yml',compose)
 if args.source_only:
  print(json.dumps({'status':'SOURCE_ONLY_EXPORTED_NO_IMAGE_BUILD','files':len(manifest),'archiveSha256':sha(out/'public-source.zip')}));return
 (ROOT/'evidence').mkdir(exist_ok=True)
 info=json.loads(subprocess.check_output(['docker','image','inspect',tag,'--format','{{json .Id}}'],text=True));assert info.startswith('sha256:')
 print('Exporting exact local AMD64 image (no publication)',flush=True);subprocess.run(['docker','save','-o',str(out/'image.tar'),tag],check=True)
 # Independently verify actual raw Docker archive config, platform, tag and every layer.
 with tarfile.open(out/'image.tar','r:') as tar:
  dm=json.load(tar.extractfile('manifest.json'));assert len(dm)==1 and dm[0]['RepoTags']==[tag]
  raw=tar.extractfile(dm[0]['Config']).read();assert 'sha256:'+hashlib.sha256(raw).hexdigest()==info
  config=json.loads(raw);assert (config['os'],config['architecture'])==('linux','amd64');assert config['config']['User']=='10001:10001';assert config['config'].get('Volumes') in [None,{}];assert set(config['config']['ExposedPorts'])=={'8088/tcp'}
  layers=[];appFiles={}
  for i,name in enumerate(dm[0]['Layers']):
   data=tar.extractfile(name).read();digest='sha256:'+hashlib.sha256(data).hexdigest();assert digest==config['rootfs']['diff_ids'][i];layers.append(digest)
   with tarfile.open(fileobj=io.BytesIO(data)) as layer:
    for member in layer:
     normalized=member.name.removeprefix('./');p=PurePosixPath(normalized);assert '..' not in p.parts and not p.is_absolute()
     assert not any(normalized.startswith(x) for x in ['app/var/','app/evidence/','app/.git/','app/site/reference/','app/native/','records-unavailable/'])
     if normalized.startswith('app/') and member.isfile() and any(normalized=='app/'+f['path'] for f in manifest):appFiles[normalized[4:]]=hashlib.sha256(layer.extractfile(member).read()).hexdigest()
 imageInputs=[f for f in manifest if f['path'].startswith(('site/','runtime/','server/data/')) or f['path'] in ['LICENSE','server/index.cjs','package.json','package-lock.json']]
 for f in imageInputs:assert appFiles[f['path']]==f['sha256'],f['path']
 dump(out/'image-source-manifest.json',{'files':imageInputs,'verifiedInDockerSaveLayers':True})
 result={'status':'BUILT_EXPORTED_NOT_INSTALLED','tag':tag,'imageId':info,'platform':'linux/amd64','layers':layers,'runtimeInputs':len(imageInputs),'publicSourceFiles':len(manifest),'artifacts':{}}
 for p in sorted(out.iterdir()):
  if p.is_file():result['artifacts'][p.name]={'path':str(p),'bytes':p.stat().st_size,'sha256':sha(p)}
 dump(ROOT/'evidence/artifact-binding.json',result);print(json.dumps({k:v for k,v in result.items() if k!='layers'},indent=2))
if __name__=='__main__':main()
