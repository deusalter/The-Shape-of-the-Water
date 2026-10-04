import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { root } from './runtime.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const readJSON = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const contentBytes = await readFile(resolve(root, 'src/content/case-v7.json'));
const content = JSON.parse(contentBytes.toString('utf8'));
const manifest = await readJSON('narrative/mercy/manifest.json');
const origins = new Map();
for (const name of manifest.modules) {
  const file = `narrative/mercy/${name}`;
  const bytes = await readFile(resolve(root, file));
  const module = JSON.parse(bytes.toString('utf8'));
  for (const [index, source] of (module.sources ?? []).entries()) {
    origins.set(source.id, { file, jsonPointer: `/sources/${index}`, moduleSha256: sha(bytes) });
  }
}
const sources = content.sources.map(source => {
  const declaredAcquisitionSites = [], explicitDisclosures = [];
  for (const scene of content.scenes) {
    if (scene.sourceIds?.includes(source.id)) declaredAcquisitionSites.push({ sceneId: scene.id, variantId: `${scene.id}.base`, type: 'scene-entry' });
    for (const variant of scene.variants ?? []) if ((variant.sourceIds ?? scene.sourceIds ?? []).includes(source.id)) {
      declaredAcquisitionSites.push({ sceneId: scene.id, variantId: variant.id, type: 'scene-entry' });
    }
    for (const choice of scene.choices) for (const action of choice.actions ?? []) {
      if (action.type === 'acquireSource' && action.sourceId === source.id) declaredAcquisitionSites.push({ sceneId: scene.id, choiceId: choice.id, type: 'choice-action' });
      if (action.type === 'disclose' && action.refId === source.id) {
        const record = { sceneId: scene.id, choiceId: choice.id, characterId: action.characterId };
        for (const field of ['when', 'requires', 'unless']) if (choice[field] !== undefined) record[field] = choice[field];
        explicitDisclosures.push(record);
      }
    }
  }
  if (!origins.has(source.id)) throw new Error(`Missing lead source origin ${source.id}`);
  return { source, origin: origins.get(source.id), declaredAcquisitionSites, explicitDisclosures };
});
const output = {
  contentSha256: sha(contentBytes),
  scope: 'Exact lead-authored source bodies, their module origins, declared acquisition sites and explicit choice disclosures. The verification report separately proves encountered source and offered-choice coverage; this index does not convert statements into established truths.',
  sources,
};
await writeFile(resolve(root, 'docs/execution/evidence/mercy-content/source-index.json'), JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ sourceCount: sources.length, contentSha256: output.contentSha256 }));
