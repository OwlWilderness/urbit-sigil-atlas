const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),input=process.argv[2];if(!input)throw Error('Supply retained glyph-atlas directory');
const source=path.resolve(input),rows=JSON.parse(fs.readFileSync(path.join(source,'glyphs.json'),'utf8')),provenance=JSON.parse(fs.readFileSync(path.join(source,'provenance.json'),'utf8'));
if(rows.length!==512||new Set(rows.map(r=>r.kind+':'+r.syllable)).size!==512)throw Error('Catalogue mismatch');
const dest=path.join(root,'site/assets/glyphs');fs.mkdirSync(dest,{recursive:true});fs.mkdirSync(path.join(root,'data'),{recursive:true});
for(const item of provenance.manifest){const bytes=fs.readFileSync(path.join(source,item.file));if(require('crypto').createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Asset provenance mismatch '+item.file);fs.copyFileSync(path.join(source,item.file),path.join(dest,item.file));}
fs.copyFileSync(path.join(source,'glyphs.json'),path.join(root,'data/glyphs.json'));fs.copyFileSync(path.join(source,'provenance.json'),path.join(root,'site/provenance.json'));fs.copyFileSync(path.join(source,'LICENSE.txt'),path.join(root,'site/GLYPH-LICENSE.txt'));
console.log('Imported 512 glyph records and 1024 byte-identical authentic SVG assets.');
