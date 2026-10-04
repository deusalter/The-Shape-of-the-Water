import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const bundled = await build({ entryPoints: ['src/engine/game.ts'], bundle: true, platform: 'node', format: 'esm', write: false, logLevel: 'silent' });
const engine = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const bytes = readFileSync('src/content/case.json'), checked = engine.validateContent(JSON.parse(bytes));
if (!checked.ok) throw Error(checked.errors.join('\n'));
const content = checked.value;
const words = text => text.trim() ? text.trim().split(/\s+/u).length : 0;
const physical = ['arrival-miriam', 'bench-record', 'hub-workshop', 'workshop-record', 'hub-cabinet', 'cabinet-test', 'release-record', 'hub-shared', 'shared-optics'];
const recorded = ['arrival-cabinet', 'cabinet-cautious', 'hub-gallery', 'gallery-recording', 'recording-keep', 'hub-shared', 'shared-optics'];
const optionalTour = ['hub-gallery', 'gallery-direct', 'simon-account-record', 'hub-miriam', 'miriam-account-record', 'hub-ada-private', 'ada-miriam-leave', 'hub-simon-private', 'simon-ada-leave', 'hub-miriam-private', 'miriam-private-listen'];
const dimensions = [];
for (const [evidence, prefix] of [['physical', physical], ['recorded', recorded]]) for (const optics of ['optics-narrow', 'optics-measure']) for (const report of ['public', 'private']) for (const ending of ['continue-stay', 'continue-supper-only', 'continue-leave']) dimensions.push({ name: `${evidence}/${optics}/${report}/${ending}`, category: 'required-route alternative; do not add alternatives together', actions: [...prefix, optics, 'cabinet-report', `report-${report}`, `${report}-next`, ending] });
const routes = [
  { name: 'selected-opening', category: 'incomplete opening only', actions: ['arrival-miriam', 'bench-record', 'hub-workshop', 'workshop-record', 'hub-cabinet', 'cabinet-cautious', 'hub-gallery'] },
  ...dimensions,
  { name: 'physical-rich-optional/public/stay', category: 'one complete route including compatible optional conversations', actions: [...physical.slice(0, 7), ...optionalTour, ...physical.slice(7), 'optics-narrow', 'cabinet-report', 'report-public', 'public-next', 'continue-stay'] },
  { name: 'physical-rich-failure/public/stay', category: 'one complete route after interpersonal failure; exclusive shorter private variants', actions: ['arrival-miriam', 'bench-panic', 'miriam-account-record', 'hub-workshop', 'workshop-record', 'hub-cabinet', 'cabinet-test', 'release-record', 'hub-gallery', 'gallery-accuse', 'simon-account-record', 'hub-ada-private', 'ada-miriam-leave', 'hub-simon-private', 'simon-ada-leave', 'hub-miriam-private', 'miriam-private-listen', 'hub-shared', 'shared-optics', 'optics-narrow', 'cabinet-report', 'report-public', 'public-next', 'continue-stay'] },
];
const results = routes.map(route => {
  let state = engine.createGame(content);
  for (const choiceId of route.actions) {
    const choice = engine.availableChoices(content, state).find(choice => choice.id === choiceId);
    if (!choice) throw Error(`${route.name}: unavailable ${choiceId} at ${state.currentScene}`);
    const base = { id: `words.${state.revision}`, choiceId, expectedRevision: state.revision };
    const command = choice.ending || choice.irreversible ? { ...base, confirmation: engine.confirmationFor(state, base) } : base;
    const result = engine.applyChoice(content, state, command);
    if (!result.ok) throw Error(`${route.name}/${choiceId}: ${result.error.code}`);
    state = result.state;
  }
  const passages = state.transcript.filter(event => event.kind === 'passage');
  const seenParagraphs = new Set(), visitedScenes = new Set();
  let uniqueRenderedParagraphWords = 0, firstSceneOccurrenceWords = 0;
  const occurrences = passages.map(passage => {
    const count = passage.paragraphs.reduce((sum, paragraph) => sum + words(paragraph), 0);
    const firstOccurrence = !visitedScenes.has(passage.sceneId); visitedScenes.add(passage.sceneId);
    if (firstOccurrence) firstSceneOccurrenceWords += count;
    for (const paragraph of passage.paragraphs) if (!seenParagraphs.has(paragraph)) { seenParagraphs.add(paragraph); uniqueRenderedParagraphWords += words(paragraph); }
    return { sceneId: passage.sceneId, revision: passage.revision, words: count, firstSceneOccurrence: firstOccurrence };
  });
  return { ...route, ended: state.ended, endingScene: state.currentScene, renderedPassageWords: occurrences.reduce((sum, occurrence) => sum + occurrence.words, 0), uniqueRenderedParagraphWords, firstSceneOccurrenceWords, selectedChoiceLabelWords: state.transcript.filter(event => event.kind === 'choice').reduce((sum, event) => sum + words(event.label), 0), notebookRecordWords: [...state.observations, ...state.interpretations, ...state.relationships].reduce((sum, record) => sum + words(record.text), 0), occurrences, terminalStateHash: engine.stateHash(state), durationMeasured: false };
});
const baseline = results.find(route => route.name === 'physical/optics-narrow/public/continue-stay');
const rich = results.find(route => route.name === 'physical-rich-optional/public/stay');
const report = {
  testedAt: new Date().toISOString(), command: 'node tools/verify-route-words.mjs', scope: 'Actual production-engine rendering for separately playable routes. Whitespace tokens in passages; labels and notebook text separate. Counts are not human-measured duration.',
  contentFileSha256: createHash('sha256').update(bytes).digest('hex'), contentHash: engine.contentHash(content), humanPlaytests: 0,
  corpus: { scenes: content.scenes.length, choices: content.scenes.reduce((sum, scene) => sum + scene.choices.length, 0), basePassageWords: content.scenes.reduce((sum, scene) => sum + scene.paragraphs.reduce((count, paragraph) => count + words(paragraph), 0), 0) },
  optionalIncrement: { comparison: `${rich.name} minus ${baseline.name}`, renderedWordsIncludingHubReturns: rich.renderedPassageWords - baseline.renderedPassageWords, uniqueParagraphWords: rich.uniqueRenderedParagraphWords - baseline.uniqueRenderedParagraphWords },
  assumption: 'A hypothetical uninterrupted reading rate of 180–250 words/minute may provide a reading-only calculation; actual investigation, reflection, accessibility and choice time must be measured by human playtesting. Mutually exclusive routes/variants are never summed.',
  routes: results,
};
mkdirSync('tests/verification/artifacts', { recursive: true });
writeFileSync('tests/verification/artifacts/baseline-route-words.json', JSON.stringify(report, null, 2) + '\n');
for (const route of results) console.log(`${route.name}: ${route.renderedPassageWords} passage words; ${route.uniqueRenderedParagraphWords} distinct-paragraph words; ${route.selectedChoiceLabelWords} selected-label words; ended=${route.ended}`);
console.log(JSON.stringify(report.optionalIncrement));
