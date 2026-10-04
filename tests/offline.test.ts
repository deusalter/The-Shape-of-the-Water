import { readFileSync } from 'node:fs';
import { createHash,webcrypto } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import { describe,expect,it } from 'vitest';
const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8').replaceAll('__BUILD_VERSION__','test-build');
async function readiness(expectedContentHash:string,asset='local application bytes',storedAsset=asset,contentHashes?:string[]) {
  const listeners:Record<string,(event:any)=>void>={},contentHash='a'.repeat(64),base='https://example.test/player/';
  const manifest={version:'test-build',contentHash,...(contentHashes?{contentHashes}:{}),files:['index.html'],hashes:{'index.html':createHash('sha256').update(asset).digest('hex')}};
  const cached=new Map([[`${base}asset-manifest.json`,new Response(JSON.stringify(manifest))],[`${base}index.html`,new Response(storedAsset)]]);
  const cache={match:async(url:string)=>cached.get(url)?.clone()};
  const self={registration:{scope:base},location:{origin:'https://example.test'},addEventListener:(kind:string,handler:(event:any)=>void)=>{listeners[kind]=handler;}};
  runInNewContext(source,{self,caches:{open:async()=>cache},crypto:webcrypto,URL,Response,Uint8Array});
  let pending:Promise<void>|undefined,response:any;
  listeners.message({data:{type:'CHECK_READY',contentHash:expectedContentHash},ports:[{postMessage:(value:unknown)=>{response=value;}}],waitUntil:(promise:Promise<void>)=>{pending=promise;}});
  await pending;return response;
}
describe('offline readiness verifies active content and actual cached bytes',()=>{
  it('reports ready for matching active content and exact cached SHA-256',async()=>{expect(await readiness('a'.repeat(64))).toMatchObject({ready:true,contentMismatch:false});});
  it('refuses readiness for a different active content hash even with complete cached files',async()=>{expect(await readiness('b'.repeat(64))).toMatchObject({ready:false,contentMismatch:true});});
  it('refuses readiness when cached bytes changed',async()=>{expect(await readiness('a'.repeat(64),'local application bytes','corrupt replacement')).toMatchObject({ready:false});});
  it('verifies a separately retained edition only when explicitly included with the cached build',async()=>{expect(await readiness('b'.repeat(64),undefined,undefined,['a'.repeat(64),'b'.repeat(64)])).toMatchObject({ready:true,contentMismatch:false});expect(await readiness('c'.repeat(64),undefined,undefined,['a'.repeat(64),'b'.repeat(64)])).toMatchObject({ready:false,contentMismatch:true});expect(await readiness('b'.repeat(64),'asset','broken',['a'.repeat(64),'b'.repeat(64)])).toMatchObject({ready:false});});
  it('does not force waiting updates to activate or delete prior caches',()=>{expect(source).not.toContain('skipWaiting');expect(source).not.toContain('caches.delete');});
});
