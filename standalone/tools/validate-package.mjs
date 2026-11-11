import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const sdk=process.env.DAPPNODE_SDK_ROOT;
assert.equal(JSON.parse(readFileSync(resolve(sdk,'package.json'))).version,'0.3.55');
const {getPackagesToBuildProps}=await import(pathToFileURL(resolve(sdk,'dist/commands/build/variants.js')));
const {getFileValidationTask}=await import(pathToFileURL(resolve(sdk,'dist/tasks/buildAndUpload/getFileValidationTask.js')));
for(const dir of process.argv.slice(2)){
 const rootDir=resolve(dir),props=getPackagesToBuildProps({rootDir,variantsDirPath:resolve(rootDir,'variants'),composeFileName:'docker-compose.yml'});
 assert.equal(props.length,1);assert.deepEqual(props[0].architectures,['linux/amd64']);assert.equal(props[0].compose.services.web.image,`web.${props[0].manifest.name}:${props[0].manifest.version}`);
 await getFileValidationTask({packagesToBuildProps:props,skipComposeValidation:false,stripComposeVersion:false}).task();
 console.log('PASS SDK0.3.55 manifest / Compose / Dappnode contract:',rootDir);
}
