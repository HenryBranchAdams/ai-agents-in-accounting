import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Original files from Henry's free Areal download; binaries remain outside source.
export const arealFaces = Object.freeze([
 ['Regular',400,'normal',60600,'1ea32508d5d70d86ecd7a5a9fb9bcdaa2ffd9aeb0e40a8e02503d543c8a275b4'],
 ['RegularItalic',400,'italic',63668,'24738601f7448774f2acba908b34d5521fc6679c850dee71384d30a3bbd12556'],
 ['Medium',500,'normal',65612,'55baeac72de0b02e96098b6c3fb6c1fea662670f1bf9345ad59a63e304a1af6a'],
 ['MediumItalic',500,'italic',69568,'e5d83efb8ac385ab11269174e04a22f4a95cb6b2f9ad582c9b1c0ce49ea9b816'],
 ['Bold',700,'normal',63544,'2865aea562ce29af1a60ca0bdf62c4bb8884fb7a0143dc4c0ff3795b9354ed34'],
 ['BoldItalic',700,'italic',66872,'225ac3cf011cf5e9af54c5aceeb1861dc6fb8d5ab2457d55aec4738cb72d7494'],
]);
export function verifyFontBytes(body,bytes,digest) {
 if(body.subarray(0,4).toString()!=='wOF2'||body.length!==bytes||createHash('sha256').update(body).digest('hex')!==digest)
  throw new Error('Areal font does not match the original WOFF2 download');
}
export function prepareArealFonts({directory,root=process.cwd()}={}) {
 if(!directory)return null;
 const source=fs.realpathSync(directory),checkout=fs.realpathSync(root);
 if(source===checkout||source.startsWith(checkout+path.sep))throw new Error('Keep licensed font inputs outside the checkout');
 // Validate every input before the build writes anything. No conversion/subsetting.
 const faces=arealFaces.map(([name,weight,style,bytes,sha256])=>{
  const filename=`ABCAreal-${name}.woff2`,file=path.join(source,filename);
  if(fs.lstatSync(file).isSymbolicLink())throw new Error('Font inputs must be original regular files');
  const body=fs.readFileSync(file);verifyFontBytes(body,bytes,sha256);
  return {body,weight,style,bytes,sha256,url:`/fonts/areal-${name.toLowerCase()}-${sha256.slice(0,12)}.woff2`};
 });
 return {faces};
}
export function writeArealFonts(prepared,clientDirectory) {
 if(!prepared)return null;
 const files=prepared.faces.map(({body,...face})=>face);
 fs.mkdirSync(path.join(clientDirectory,'fonts'),{recursive:true});
 for(const face of prepared.faces)fs.writeFileSync(path.join(clientDirectory,face.url.slice(1)),face.body);
 const css=files.map(face=>`@font-face{font-family:"ABC Areal";font-style:${face.style};font-weight:${face.weight};font-display:swap;src:url("${face.url}") format("woff2");}`).join('\n');
 fs.appendFileSync(path.join(clientDirectory,'style.css'),'\n'+css+'\n');
 return {family:'ABC Areal',license:'Dinamo free fonts license, terms v2.51 section 9.12',license_url:'https://abcdinamo.com/licenses',files};
}
