import type { Content, Validation } from './types';
import { contentSchema } from './schema';

export const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const validId = (value: unknown) => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,119}$/.test(value);
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

/** Validate before author content or imported content can enter the runtime. */
export function validateContent(input: unknown): Validation<Content> {
  const shape = contentSchema.safeParse(input);
  if (!shape.success) return { ok: false, errors: shape.error.issues.slice(0,100).map(issue => `${issue.path.join('.') || 'content'}: ${issue.message}`) };
  const errors: string[] = [];
  const report = (path: string, message: string) => { if (errors.length < 100) errors.push(`${path}: ${message}`); };
  const keys = (v: Record<string, unknown>, allowed: string[], path: string) => {
    for (const key of Object.keys(v)) if (!allowed.includes(key)) report(path, `unknown field ${key}`);
  };
  const text = (v: unknown, path: string) => { if (typeof v !== 'string' || !v.trim() || v.length > 50000) report(path, 'must be nonempty text (at most 50,000 characters)'); };
  const id = (v: unknown, path: string) => { if (!validId(v)) report(path, 'must be a short ID using letters, digits, underscore, period, colon or hyphen'); };
  const flags = (v: unknown, path: string, optional = true) => {
    if (v === undefined && optional) return;
    if (!Array.isArray(v) || v.length > 200) { report(path, 'must be an array of at most 200 flag IDs'); return; }
    v.forEach((f, i) => id(f, `${path}[${i}]`));
    if (new Set(v).size !== v.length) report(path, 'duplicate flags');
  };
  const paragraphs = (v: unknown, path: string) => {
    if (!Array.isArray(v) || !v.length || v.length > 200) { report(path, 'must have 1–200 paragraphs'); return; }
    v.forEach((p, i) => text(p, `${path}[${i}]`));
  };
  if (!isObject(input)) return { ok: false, errors: ['content: must be an object'] };
  keys(input, ['id', 'title', 'version', 'start', 'scenes'], 'content');
  id(input.id, 'content.id'); text(input.title, 'content.title'); id(input.start, 'content.start');
  if (!Number.isSafeInteger(input.version) || Number(input.version) < 1) report('content.version', 'must be a positive integer');
  if (!Array.isArray(input.scenes) || !input.scenes.length || input.scenes.length > 2000) return { ok: false, errors: [...errors, 'content.scenes: must have 1–2000 scenes'] };
  const sceneIds = new Set<string>(), choiceIds = new Set<string>(), producedFlags = new Set<string>();
  const requiredFlags: { flag: string; path: string }[] = [];
  const links: { from: string; target: string; path: string }[] = [];
  const recordTexts = { observation: new Map<string, string>(), interpretation: new Map<string, string>(), relationship: new Map<string, string>() };
  const rememberFlags = (v: unknown, path: string) => { if (Array.isArray(v)) v.forEach(f => { if (typeof f === 'string') requiredFlags.push({ flag: f, path }); }); };
  input.scenes.forEach((scene, i) => {
    const p = `scenes[${i}]`;
    if (!isObject(scene)) { report(p, 'must be an object'); return; }
    keys(scene, ['id', 'title', 'paragraphs', 'choices', 'requires', 'variants'], p);
    id(scene.id, `${p}.id`); text(scene.title, `${p}.title`); paragraphs(scene.paragraphs, `${p}.paragraphs`); flags(scene.requires, `${p}.requires`); rememberFlags(scene.requires, `${p}.requires`);
    if (typeof scene.id === 'string') { if (sceneIds.has(scene.id)) report(`${p}.id`, 'duplicate scene ID'); sceneIds.add(scene.id); }
    if (scene.variants !== undefined) {
      if (!Array.isArray(scene.variants) || scene.variants.length > 100) report(`${p}.variants`, 'must be an array of at most 100 variants');
      else scene.variants.forEach((variant, j) => {
        const vp = `${p}.variants[${j}]`;
        if (!isObject(variant)) { report(vp, 'must be an object'); return; }
        keys(variant, ['requires', 'paragraphs'], vp); flags(variant.requires, `${vp}.requires`, false); paragraphs(variant.paragraphs, `${vp}.paragraphs`); rememberFlags(variant.requires, `${vp}.requires`);
      });
    }
    if (!Array.isArray(scene.choices) || scene.choices.length > 200) { report(`${p}.choices`, 'must be an array of at most 200 choices'); return; }
    scene.choices.forEach((choice, j) => {
      const cp = `${p}.choices[${j}]`;
      if (!isObject(choice)) { report(cp, 'must be an object'); return; }
      keys(choice, ['id', 'label', 'target', 'requires', 'unless', 'effects', 'observation', 'interpretation', 'relationship', 'ending', 'irreversible'], cp);
      id(choice.id, `${cp}.id`); text(choice.label, `${cp}.label`); id(choice.target, `${cp}.target`);
      if (typeof choice.id === 'string') { if (choiceIds.has(choice.id)) report(`${cp}.id`, 'choice IDs must be globally unique'); choiceIds.add(choice.id); }
      for (const field of ['requires', 'unless', 'effects']) flags(choice[field], `${cp}.${field}`);
      rememberFlags(choice.requires, `${cp}.requires`); rememberFlags(choice.unless, `${cp}.unless`);
      if (Array.isArray(choice.effects)) choice.effects.forEach(f => { if (typeof f === 'string') producedFlags.add(f); });
      if (typeof choice.target === 'string') links.push({ from: String(scene.id), target: choice.target, path: `${cp}.target` });
      if (choice.ending !== undefined && typeof choice.ending !== 'boolean') report(`${cp}.ending`, 'must be boolean');
      if (choice.irreversible !== undefined && typeof choice.irreversible !== 'boolean') report(`${cp}.irreversible`, 'must be boolean');
      for (const field of ['observation', 'interpretation', 'relationship'] as const) {
        const record = choice[field];
        if (record === undefined) continue;
        if (!isObject(record)) { report(`${cp}.${field}`, 'must be an object'); continue; }
        keys(record, ['id', 'text'], `${cp}.${field}`); id(record.id, `${cp}.${field}.id`); text(record.text, `${cp}.${field}.text`);
        if (typeof record.id === 'string' && typeof record.text === 'string') {
          const previous = recordTexts[field].get(record.id);
          if (previous !== undefined && previous !== record.text) report(`${cp}.${field}`, 'repeated record ID must preserve identical text');
          recordTexts[field].set(record.id, record.text);
        }
      }
    });
  });
  if (!sceneIds.has(String(input.start))) report('content.start', 'scene does not exist');
  const startScene = input.scenes.find(s => isObject(s) && s.id === input.start);
  if (isObject(startScene) && Array.isArray(startScene.requires) && startScene.requires.length) report('content.start', 'start scene cannot require flags');
  for (const link of links) if (!sceneIds.has(link.target)) report(link.path, 'target scene does not exist');
  for (const requirement of requiredFlags) if (!producedFlags.has(requirement.flag)) report(requirement.path, `flag ${requirement.flag} is never produced`);
  if (producedFlags.size > 64) report('content', 'at most 64 state flags are supported');
  if (sceneIds.size + choiceIds.size > 8000) report('content', 'at most 8000 authored scenes and choices are supported');
  if (!errors.length) {
    const reached = new Set([String(input.start)]);
    for (let changed = true; changed;) { changed = false; for (const { from, target } of links) if (reached.has(from) && !reached.has(target)) { reached.add(target); changed = true; } }
    for (const sceneId of sceneIds) if (!reached.has(sceneId)) report('content.scenes', `scene ${sceneId} has no graph route from start`);
  }
  if (errors.length) return { ok: false, errors };
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > 10 * 1024 * 1024) return { ok: false, errors: ['content: exceeds the 10 MB import limit'] };
  return { ok: true, value: deepFreeze(JSON.parse(JSON.stringify(input)) as Content) };
}
