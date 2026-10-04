// Bounded literary reading through the actual v2 engine. No runtime files edited.
// Setup: npm install --prefix docs/coordination/literary/work/runtime --no-audit --no-fund --ignore-scripts zod@4.6.5
// Run from repository root: node docs/coordination/literary/work/read-routes.mjs
import { registerHooks } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('../../../../', import.meta.url);
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'zod') return next(new URL('runtime/node_modules/zod/index.js', import.meta.url).href, context);
  if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) {
    const target = new URL(specifier + '.ts', context.parentURL);
    if (existsSync(target)) return next(target.href, context);
  }
  return next(specifier, context);
}});
const { createGameV2, applyCommandV2, availableChoicesV2, confirmationForV2 } = await import(new URL('src/engine/evidence-runtime.ts', root));
const raw = readFileSync(new URL('src/content/case-v2.json', root));
const content = JSON.parse(raw);
const definitions = [
  { id: 'recording-public-supper', prefix: ['arrival-cabinet','cabinet-cautious','hub-gallery','gallery-recording','recording-keep'], refs: ['continuous-recording'], extra: [], optics: 'optics-narrow', audience: 'public', end: 'continue-stay' },
  { id: 'reconstruction-intimacies-private-supper', prefix: ['arrival-miriam','bench-record','hub-workshop','workshop-to-test','release-record'], refs: ['request-before-cut','ada-cut','binding-test'], extra: ['hub-gallery','gallery-hub','hub-ada-private','ada-miriam-leave','hub-simon-private','simon-ada-leave','hub-miriam-private','miriam-private-listen'], optics: 'optics-measure', audience: 'private', end: 'continue-supper-only' },
  { id: 'pressed-shamed-public-leave', prefix: ['arrival-miriam','bench-panic','miriam-account-record','hub-workshop','workshop-to-test','release-record','hub-gallery','gallery-accuse','simon-account-record'], refs: ['request-before-cut','ada-cut','binding-test'], extra: ['hub-miriam-private','miriam-private-listen','hub-simon-private','simon-ada-leave'], optics: 'optics-measure', audience: 'public', end: 'continue-leave' },
];
const report = { scope: 'Three authored first-night routes executed in the actual v2 engine; not UI, exhaustive, human, or recurrence testing', caseSha256: createHash('sha256').update(raw).digest('hex'), routes: [] };
for (const def of definitions) {
  let state = createGameV2(content);
  function command(payload) {
    const cmd = { ...payload, id: `${def.id}.${state.revision}`, expectedRevision: state.revision };
    if (cmd.type === 'choose') {
      const option = availableChoicesV2(content,state).find(c => c.id === cmd.choiceId);
      assert(option, `Unavailable ${cmd.choiceId} in ${state.currentScene}`);
      if (option.ending || option.irreversible) cmd.confirmation = confirmationForV2(state,cmd);
    }
    const old = structuredClone(state.transcript);
    const result = applyCommandV2(content,state,cmd);
    assert(result.ok, JSON.stringify(result.error));
    assert.deepEqual(result.state.transcript.slice(0,old.length),old);
    state = result.state;
  }
  const walk = ids => ids.forEach(choiceId => command({type:'choose',choiceId}));
  walk(def.prefix);
  walk(def.extra);
  command({type:'submitDeduction',questionId:'accident-sequence',candidateId:'rescue-then-impact',selectedRefs:def.refs});
  assert.equal(state.deductions.length,1);
  walk(['finding-share','shared-optics',def.optics,'cabinet-report',`report-${def.audience}`,`${def.audience}-next`,def.end]);
  assert(state.ended);
  const passages = state.transcript.filter(e => e.kind === 'passage');
  const text = passages.map(p => `## ${p.sceneId} / ${p.variantId}\n\n${p.paragraphs.join('\n\n')}`).join('\n\n');
  writeFileSync(new URL(`route-${def.id}.md`,import.meta.url),`# L-002 captured first-night reading: ${def.id}\n\nDerived unchanged from case ${report.caseSha256}. Repeated hub visits are actual route text. No recurrence is present.\n\n${text}\n`);
  report.routes.push({id:def.id,commands:state.commands,ended:state.ended,finalScene:state.currentScene,passages:passages.map(p=>({scene:p.sceneId,variant:p.variantId})),passageWords:passages.flatMap(p=>p.paragraphs).join(' ').trim().split(/\s+/).length,transcriptSha256:createHash('sha256').update(JSON.stringify(state.transcript)).digest('hex'),confidenceAcquired:state.sources.some(s=>s.id==='present-miriam-confidence')});
}
const manuscript = readFileSync(new URL('narrative/MANUSCRIPT.md',root),'utf8');
let checked = 0;
for (const s of content.scenes) for (const p of [s,...(s.variants??[])]) for (const paragraph of p.paragraphs) {
  assert(manuscript.includes(paragraph),`Manuscript paragraph absent: ${s.id}`); checked++;
}
report.manuscriptParagraphsMatched = checked;
report.status = 'PASS';
writeFileSync(new URL('route-checks.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,manuscriptParagraphsMatched:checked,routes:report.routes.map(({id,finalScene,passageWords,confidenceAcquired})=>({id,finalScene,passageWords,confidenceAcquired}))},null,2));
