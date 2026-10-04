import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadEngine } from './mercy/runtime.mjs';

const [runPath, outputFolder] = process.argv.slice(2);
if (!runPath || !outputFolder) throw new Error('Supply an encountered-run path and a fresh review input directory.');
const engine = await loadEngine();
const contentBytes = readFileSync('src/content/case-v7.json');
const content = JSON.parse(contentBytes);
const runBytes = readFileSync(runPath);
const run = JSON.parse(runBytes);
const checked = engine.importPortableV2(content, run);
if (!checked.ok || !checked.value.ended) throw new Error('Only exact completed encountered runs are eligible.');
let state = engine.createGameV2(content);
const text = ['PLAYER READING', 'This reading contains the passages and actions of one completed playthrough. Notebook records are shown when acquired. Other authored scenes, hidden history and author explanations are not included.'];
const recordIds = new Set();
let passageRevision = -1;
function capture() {
  const view = engine.projectPlayerV2(content, state);
  const passage = [...state.transcript].reverse().find(entry => entry.kind === 'passage');
  if (passage.revision !== passageRevision) {
    text.push(view.passage.title, ...view.passage.paragraphs);
    passageRevision = passage.revision;
  }
  const records = [
    ...view.sources.map(record => ({ ...record, category: record.kind === 'statement' ? 'Statement' : record.kind === 'document' ? 'Document' : 'Observation' })),
    ...view.deductions.map(record => ({ ...record, category: 'Supported conclusion' })),
    ...view.interpretations.map(record => ({ ...record, category: 'Possible reading; not another established fact' })),
    ...view.relationships.map(record => ({ ...record, category: 'Interpersonal decision' })),
    ...view.hints.map(record => ({ ...record, category: 'Requested investigation help' })),
  ];
  for (const record of records) {
    if (recordIds.has(record.id)) continue;
    recordIds.add(record.id);
    text.push(`Notebook, ${record.category}: ${record.title ?? ''}`);
    if (record.originOccasionLabel ?? record.occasionLabel) text.push(record.originOccasionLabel ?? record.occasionLabel);
    text.push(record.text);
    if (record.selectedRefs) {
      const refs = [...view.sources, ...view.deductions];
      text.push('Evidence submitted:', ...record.selectedRefs.map(id => {
        const ref = refs.find(item => item.id === id);
        return `* ${ref?.title ?? ref?.text ?? 'Previously recorded support'}${ref?.occasionLabel ? ` (${ref.occasionLabel})` : ''}`;
      }));
    }
  }
  if (view.choices.length) text.push('Available actions:', ...view.choices.map(choice => `* ${choice.label}`));
}
capture();
for (const command of run.commands) {
  const result = engine.applyCommandV2(content, state, command);
  if (!result.ok) throw new Error(result.error.code);
  state = result.state;
  const action = [...state.transcript].reverse().find(entry => entry.kind !== 'passage');
  text.push(`Chosen action: ${action.label}`);
  if (action.feedback) text.push(action.feedback);
  capture();
}
mkdirSync(outputFolder, { recursive: true });
const reading = text.filter(Boolean).join('\n\n') + '\n';
writeFileSync(resolve(outputFolder, 'reading.txt'), reading);
const sha = value => createHash('sha256').update(value).digest('hex');
// Keep source metadata outside the blind input directory.
writeFileSync(resolve(outputFolder, '../INPUT-PIN.json'), JSON.stringify({
  contentSha256: sha(contentBytes), runSha256: sha(runBytes), readingSha256: sha(reading),
  sourceRun: runPath, input: resolve(outputFolder, 'reading.txt'),
  scope: 'Only projected encountered passages, offered actions, chosen actions and acquired notebook records.',
}, null, 2) + '\n');
console.log(`Saved player-only reading: ${resolve(outputFolder, 'reading.txt')}`);
