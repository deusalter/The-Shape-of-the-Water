import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative } from 'node:path';

const root = resolve(process.argv[2] ?? 'dist');
async function walk(dir) { const all = []; for (const entry of await readdir(dir, { withFileTypes: true })) { const path = resolve(dir, entry.name); if (entry.isDirectory()) all.push(...await walk(path)); else all.push(path); } return all; }
const files = (await walk(root)).filter(path => !['sw.js', 'asset-manifest.json'].includes(relative(root, path))).sort();
const hash = createHash('sha256');
const worker = await readFile(resolve('public/sw.js'), 'utf8');
hash.update(worker);
const hashes = {};
for (const file of files) { const bytes=await readFile(file);hash.update(relative(root, file));hash.update(bytes);hashes[relative(root,file).split('\\').join('/')]=createHash('sha256').update(bytes).digest('hex'); }
const version = hash.digest('hex').slice(0, 16);
const canonicalJSON=value=>Array.isArray(value)?`[${value.map(canonicalJSON).join(',')}]`:value!==null&&typeof value==='object'?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`:JSON.stringify(value);
let contentHash=null;
const selection=JSON.parse(await readFile(resolve('src/content/selection.json'),'utf8'));
if(!/^case(?:-v[0-9]+)?\.json$/.test(selection.file))throw new Error('Unsupported installed content path.');
const content=JSON.parse(await readFile(resolve('src/content',selection.file),'utf8'));
contentHash=createHash('sha256').update(canonicalJSON(content)).digest('hex');
await writeFile(resolve(root, 'asset-manifest.json'), JSON.stringify({ version, contentHash, files: files.map(file => relative(root, file).split('\\').join('/')),hashes }));
await writeFile(resolve(root, 'sw.js'), worker.replaceAll('__BUILD_VERSION__', version));
console.log(`Offline manifest: ${files.length} local files, build ${version}`);
