import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { root, loadEngine } from './runtime.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const correctionRoot = resolve(root, 'docs/reviews/MERCY-WHOLE-29/correction-input');
const originalPath = resolve(root, 'docs/reviews/MERCY-WHOLE-29/input/reading.txt');
const originalBytes = await readFile(originalPath);
const originalPin = JSON.parse(await readFile(resolve(root, 'docs/reviews/MERCY-WHOLE-29/INPUT-PIN.json'), 'utf8'));
if (sha(originalBytes) !== originalPin.readingSha256) throw new Error('Original blind reading differs from its pin; no correction packet written.');
const contentBytes = await readFile(resolve(root, 'src/content/case-v7.json'));
const engine = await loadEngine();
const checked = engine.validateContentV2(JSON.parse(contentBytes.toString('utf8')));
if (!checked.ok) throw new Error(checked.errors.join('\n'));
const content = checked.value;
const selected = new Set(['a2.confirmation', 'a2.erasmus-loss', 'a2.a-form-of-love', 'a2.greenroom']);
const routes = [
  { label: 'Invitation route', file: 'a2.letter--invitation.encountered-run.json', output: 'invitation.txt' },
  { label: 'Limited-account route', file: 'a3.final-horse--base--proof-q.julian-disappearance.encountered-run.json', output: 'limited-account.txt' },
];
const receipt = {
  contentSha256: sha(contentBytes), originalReadingSha256: sha(originalBytes),
  scope: 'Player-only passages and actually offered/chosen actions for the four requested scenes, plus notebook records acquired there. Built from exact final portable witnesses using the shipped engine. No author explanation, unencountered prose or NPC state is included. Original blind input is unchanged.',
  routes: [],
};
await mkdir(correctionRoot, { recursive: true });
for (const route of routes) {
  const sourceRun = `docs/execution/evidence/mercy-content/${route.file}`;
  const runBytes = await readFile(resolve(root, sourceRun));
  const run = JSON.parse(runBytes.toString('utf8'));
  const imported = engine.importPortableV2(content, run);
  if (!imported.ok) throw new Error(`${route.label}: final witness import failed`);
  let state = engine.createGameV2(content);
  const paragraphs = [], scenes = [];
  for (const command of run.commands) {
    const prior = state;
    const result = engine.applyCommandV2(content, state, command);
    if (!result.ok) throw new Error(`${route.label}: captured command replay failed (${result.error.code})`);
    state = result.state;
    if (selected.has(prior.currentScene)) {
      const event = state.transcript.find(event => event.kind === 'action' && event.revision === state.revision);
      if (event?.kind === 'action') paragraphs.push(`Chosen action: ${event.label}`);
    }
    const passage = engine.currentPassageV2(state);
    if (!selected.has(state.currentScene) || passage.revision !== state.revision || scenes.includes(state.currentScene)) continue;
    scenes.push(state.currentScene);
    paragraphs.push(passage.title, ...passage.paragraphs);
    const choices = engine.availableChoicesV2(content, state);
    if (choices.length) paragraphs.push('Available actions:', ...choices.map(choice => `* ${choice.label}`));
    for (const source of state.sources.filter(source => source.revision === state.revision)) {
      paragraphs.push(`Notebook record: ${source.title}`, source.text);
    }
  }
  if (selected.size !== scenes.length || [...selected].some(id => !scenes.includes(id))) throw new Error(`${route.label}: missing requested played correction scene`);
  const text = ['PLAYER CORRECTION READING', route.label, ...paragraphs].join('\n\n') + '\n';
  await writeFile(resolve(correctionRoot, route.output), text);
  receipt.routes.push({ label: route.label, sourceRun, sourceRunSha256: sha(runBytes), scenes,
    input: `docs/reviews/MERCY-WHOLE-29/correction-input/${route.output}`, readingSha256: sha(text) });
}
if (sha(await readFile(originalPath)) !== sha(originalBytes)) throw new Error('Original input changed during correction generation.');
await writeFile(resolve(correctionRoot, 'INPUT-PINS.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify({ contentSha256: receipt.contentSha256, correctionReadings: receipt.routes.map(route => route.input), originalUnchanged: true }, null, 2));
