import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const root=path.resolve(process.argv[2]||'.');
const read=file=>fs.readFileSync(path.resolve(root,file));
const hash=file=>createHash('sha256').update(read(file)).digest('hex');
const metadata=JSON.parse(read('dist/internal/client-build.json'));
const entry=source=>{
 const matches=Object.keys(metadata.outputs).filter(file=>metadata.outputs[file].entryPoint===source);
 if(matches.length!==1)throw new Error('Expected one built entry: '+source);
 return matches[0];
};
function closure(file,result=new Set()){
 if(result.has(file))return result;
 result.add(file);
 for(const dependency of metadata.outputs[file].imports)if(dependency.kind!=='dynamic-import'&&metadata.outputs[dependency.path])closure(dependency.path,result);
 return result;
}
const entries={navigation:'src/client/navigation.tsx',outline:'src/client/reading.ts',preview:'src/components/evidence-preview.tsx',search:'src/components/search-palette.tsx',graph:'src/client/connections.tsx',map:'src/client/library-map.tsx'};
const sets=Object.fromEntries(Object.entries(entries).map(([name,source])=>[name,closure(entry(source))]));
const bytes=set=>[...set].reduce((sum,file)=>sum+gzipSync(read(file)).length,0);
const union=(...sets)=>new Set(sets.flatMap(set=>[...set]));
const reading=union(sets.navigation,sets.outline,sets.preview);
const report={
 note:'Built production asset graph; gzip per file. Includes shared chunks exactly once per scenario. No network, latency, CSS, HTML or browser-cache claim. Compare only with the recorded equivalent navigation baseline; corpus and build identity included below.',
 node:process.version,lockfile_sha256:hash('package-lock.json'),release:JSON.parse(read('dist/internal/release-meta.json')),
 assets:Object.fromEntries([...union(...Object.values(sets))].map(file=>[file,{bytes:read(file).length,gzip_bytes:gzipSync(read(file)).length,sha256:hash(file)}])),
 entries:Object.fromEntries(Object.entries(sets).map(([name,set])=>[name,{files:[...set],gzip_bytes:bytes(set),incremental_after_navigation_gzip_bytes:bytes(new Set([...set].filter(file=>!sets.navigation.has(file))))}])),
 scenarios_gzip_bytes:{navigation:bytes(sets.navigation),navigation_and_outline:bytes(union(sets.navigation,sets.outline)),edited_brief_with_preview:bytes(reading),edited_brief_then_search:bytes(union(reading,sets.search)),graph:bytes(union(sets.navigation,sets.graph)),whole_library_map:bytes(union(sets.navigation,sets.map))},
 graph_modules_in_ordinary_reading:[...reading].flatMap(file=>Object.keys(metadata.outputs[file].inputs)).filter(file=>/(?:connections|connection-canvas|library-map|library-explorer|cytoscape|react-resizable-panels)/u.test(file)),
};
console.log(JSON.stringify(report,null,2));
