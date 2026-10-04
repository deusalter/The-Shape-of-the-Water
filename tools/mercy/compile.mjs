import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { root, loadEngine } from './runtime.mjs';

const sha = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const fields = ['scenes', 'sources', 'characters', 'beliefIds', 'questions', 'interpretationRules', 'hints'];
const narrativeRoot = resolve(root, 'narrative/mercy');
const evidenceRoot = resolve(root, 'docs/execution/evidence/mercy-content');

async function readJSON(path) {
  const bytes = await readFile(path);
  return { path, bytes, value: JSON.parse(bytes.toString('utf8')), sha256: sha(bytes) };
}

function modulePath(name) {
  if (typeof name !== 'string' || isAbsolute(name) || name.split(/[\\/]/).includes('..') || !name.endsWith('.json')) {
    throw new Error(`Unsafe or non-JSON scene module path: ${name}`);
  }
  const path = resolve(narrativeRoot, name);
  if (!path.startsWith(narrativeRoot + '/')) throw new Error(`Scene module escapes its narrative directory: ${name}`);
  return path;
}

function textAudit(content) {
  const errors = [];
  const inspect = (value, path) => {
    if (typeof value === 'string') {
      if (value.includes('—')) errors.push(`${path}: original runtime text contains an em dash`);
      if (/\b(?:TODO|TBD|PLACEHOLDER)\b/.test(value)) errors.push(`${path}: unfinished placeholder in runtime content`);
    } else if (Array.isArray(value)) value.forEach((item, index) => inspect(item, `${path}.${index}`));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([key, item]) => {
      if (key === 'scope') errors.push(`${path}.${key}: occasion scopes require authored engine occasions, which Mercy does not use`);
      inspect(item, `${path}.${key}`);
    });
  };
  inspect(content, 'content');
  if (content.occasions || content.scenes.some(scene => scene.choices.some(choice => choice.enterOccasion))) {
    errors.push('Mercy represents encountered returns with distinct scenes; a global engine occasion transition is outside this compiler contract.');
  }
  if (content.scenes.some(scene => scene.choices.some(choice => choice.actions?.some(action => ['snapshotCharacter', 'witnessSource'].includes(action.type))))) {
    errors.push('Mercy without engine occasions cannot use snapshotCharacter or witnessSource. Use distinct restored characters and explicit acquired-source disclosure.');
  }
  const sources = new Map(content.sources.map(source => [source.id, source]));
  const ancestry = (id, visited = new Set()) => {
    if (visited.has(id)) throw new Error(`Cyclic derived source ancestry at ${id}`);
    const source = sources.get(id);
    if (!source) throw new Error(`Derived source names missing original ${id}`);
    if (!source.derivedFrom) return new Set([source.provenanceId]);
    const next = new Set([...visited, id]);
    return new Set(source.derivedFrom.flatMap(parent => [...ancestry(parent, next)]));
  };
  for (const source of content.sources) if (source.derivedFrom) {
    const origins = ancestry(source.id);
    if (origins.size !== 1 || !origins.has(source.provenanceId)) {
      errors.push(`${source.id}: without occasions a copy must retain its original provenanceId; composite derived sources cannot serve as a new independent origin`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

export async function compileMercy({ check = false, stagingOnly = false, diagnoseOnly = false } = {}) {
  const manifest = await readJSON(resolve(narrativeRoot, 'manifest.json'));
  const specification = manifest.value;
  if (specification.id !== 'mercy-of-morning' || specification.version !== 7 || specification.schemaVersion !== 2) {
    throw new Error('Mercy manifest must identify mercy-of-morning, content version 7, schema version 2.');
  }
  if (!Array.isArray(specification.modules) || !specification.modules.length || new Set(specification.modules).size !== specification.modules.length) {
    throw new Error('Manifest must list a nonempty ordered set of distinct JSON modules.');
  }
  const modules = [];
  for (const name of specification.modules) {
    try { modules.push(await readJSON(modulePath(name))); }
    catch (error) { if (!(stagingOnly || diagnoseOnly) || error.code !== 'ENOENT') throw error; }
  }
  const content = {
    id: specification.id, title: specification.title, version: specification.version,
    start: specification.start, schemaVersion: 2,
    ...Object.fromEntries(fields.map(field => [field, []])),
  };
  const origins = [];
  const stages = [];
  for (const module of modules) {
    const sourceFile = relative(root, module.path);
    for (const field of fields) {
      const entries = module.value[field] ?? [];
      if (!Array.isArray(entries)) throw new Error(`${sourceFile}.${field}: module field must be an array`);
      for (let index = 0; index < entries.length; index++) {
        const entity = structuredClone(entries[index]);
        if (field === 'scenes') {
          const capture = (paragraphs, variantId, pointer) => paragraphs.map((text, paragraphIndex) => {
            const textSha256 = sha(text);
            const blockPrefix = variantId.startsWith(`${entity.id}.`) ? variantId : `${entity.id}.${variantId}`;
            const blockId = `${blockPrefix}.p${String(paragraphIndex + 1).padStart(3, '0')}`;
            origins.push({ sceneId: entity.id, variantId, blockId, paragraphIndex, textSha256,
              sourceFile, jsonPointer: `${pointer}/${paragraphIndex}`, sourceSha256: module.sha256 });
            return blockId;
          });
          entity.paragraphIds = capture(entity.paragraphs, `${entity.id}.base`, `/scenes/${index}/paragraphs`);
          for (const [variantIndex, variant] of (entity.variants ?? []).entries()) {
            variant.paragraphIds = capture(variant.paragraphs, variant.id, `/scenes/${index}/variants/${variantIndex}/paragraphs`);
          }
        }
        content[field].push(entity);
      }
    }
    for (const stage of module.value.staging ?? []) stages.push({ ...structuredClone(stage), sourceFile });
  }
  const sceneIds = content.scenes.map(scene => scene.id);
  if (new Set(origins.map(paragraph => paragraph.blockId)).size !== origins.length) throw new Error('Paragraph identities collide across authored scene variants.');
  const stageIds = stages.map(stage => stage.sceneId);
  if (new Set(stageIds).size !== stageIds.length) throw new Error('Duplicate scene IDs in Mercy staging.');
  for (const stage of stages) {
    if (!sceneIds.includes(stage.sceneId)) throw new Error(`Staging names undeclared scene ${stage.sceneId}`);
    if (typeof stage.location !== 'string' || !stage.location.trim()) throw new Error(`${stage.sceneId}: missing physical stage location`);
    const scene = content.scenes.find(scene => scene.id === stage.sceneId);
    for (const variant of stage.variants ?? []) {
      if (!scene.variants?.some(item => item.id === variant.variantId)) throw new Error(`${stage.sceneId}: staging names undeclared variant ${variant.variantId}`);
    }
  }
  for (const id of sceneIds) if (!stageIds.includes(id)) throw new Error(`${id}: scene lacks writer-authored staging metadata`);
  await mkdir(evidenceRoot, { recursive: true });
  if (stagingOnly) {
    const staging = { status: 'Partial module staging; not an installed or complete story.', contentId: content.id,
      version: content.version, loadedModules: modules.map(module => relative(root, module.path)), scenes: stages };
    await writeFile(resolve(root, 'tools/mercy/staging-v7.json'), json(staging));
    return { status: 'partial-staging', sceneCount: sceneIds.length };
  }
  const engine = await loadEngine();
  const validated = engine.validateContentV2(content);
  if (diagnoseOnly) {
    textAudit(content);
    return { status: 'partial-diagnostics', sceneCount: content.scenes.length,
      loadedModules: modules.map(module => relative(root, module.path)), validationErrors: validated.ok ? [] : validated.errors };
  }
  if (!validated.ok) throw new Error(validated.errors.join('\n'));
  textAudit(content);
  const bytes = json(content), contentSha256 = sha(bytes), contentHash = engine.createGameV2(validated.value).contentHash;
  const sourceHashes = Object.fromEntries([manifest, ...modules].map(source => [relative(root, source.path), source.sha256]));
  const output = resolve(root, 'src/content/case-v7.json');
  const staging = { status: 'Complete compiler candidate; root controls installation.', contentId: content.id,
    version: content.version, contentSha256, contentHash, scenes: stages };
  const build = { status: 'Complete deterministic compiler candidate, not owner acceptance.', contentId: content.id,
    version: content.version, schemaVersion: 2, contentSha256, contentHash, sourceHashes,
    compilerSha256: sha(await readFile(fileURLToPath(import.meta.url))),
    engineLoaderSha256: sha(await readFile(resolve(root, 'tools/mercy/runtime.mjs'))),
    sceneCount: content.scenes.length, choiceCount: content.scenes.reduce((sum, scene) => sum + scene.choices.length, 0),
    sourceCount: content.sources.length, questionCount: content.questions.length, paragraphCount: origins.length,
    endingScenes: [...new Set(content.scenes.flatMap(scene => scene.choices.filter(choice => choice.ending).map(choice => choice.target)))],
    literaryAuthority: 'lead_writer', sourceMap: 'docs/execution/evidence/mercy-content/source-map.json',
    memoryContract: 'Accumulated player transcript and notebook persist. Restored Blaise knowledge belongs to a distinct character and is acquired explicitly in new scenes. No occasion transition, invisible replay or implicit NPC disclosure.' };
  const artifacts = [
    [output, bytes],
    [resolve(root, 'tools/mercy/staging-v7.json'), json(staging)],
    [resolve(evidenceRoot, 'source-map.json'), json({ contentSha256, paragraphs: origins })],
    [resolve(evidenceRoot, 'build.json'), json(build)],
  ];
  if (check) {
    for (const [path, expected] of artifacts) {
      let actual;
      try { actual = await readFile(path, 'utf8'); } catch { throw new Error(`Missing compiled artifact ${relative(root, path)}`); }
      if (actual !== expected) throw new Error(`Compiled artifact differs from exact current modules: ${relative(root, path)}`);
    }
  } else {
    for (const [path, expected] of artifacts) await writeFile(path, expected);
  }
  return { ...build, status: check ? 'exact-current' : 'compiled' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await compileMercy({ check: process.argv.includes('--check'), stagingOnly: process.argv.includes('--staging'), diagnoseOnly: process.argv.includes('--diagnose') });
    console.log(JSON.stringify({ status: result.status, contentSha256: result.contentSha256,
      sceneCount: result.sceneCount, choiceCount: result.choiceCount, sourceCount: result.sourceCount, questionCount: result.questionCount,
      validationErrors: result.validationErrors }, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
