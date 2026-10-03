import type { Choice, ChoiceResult, Command, Confirmation, Content, EncounteredRecord, EngineErrorCode, GameState, Passage, Scene, Validation } from './types';
import { deepFreeze, isObject } from './validate';
import { canonicalJSON, contentHash, sha256, stateHash } from './hash';
export { validateContent } from './validate';
export type * from './types';
export { contentHash, stateHash } from './hash';
export const ENGINE_VERSION = 1;
export function confirmationFor(state: GameState, command: Command): Confirmation { return { stateHash: stateHash(state), actionHash: sha256(canonicalJSON({ id: command.id, choiceId: command.choiceId, expectedRevision: command.expectedRevision })), acknowledged: true }; }

const matches = (requires: string[] | undefined, flags: string[]) => !requires || requires.every(flag => flags.includes(flag));
const sceneFor = (content: Content, id: string): Scene => {
  const scene = content.scenes.find(candidate => candidate.id === id);
  if (!scene) throw new Error(`Unknown scene ${id}`);
  return scene;
};
function passage(scene: Scene, flags: string[], revision: number): Passage {
  let paragraphs = scene.paragraphs;
  for (const variant of scene.variants ?? []) if (matches(variant.requires, flags)) paragraphs = variant.paragraphs;
  return { kind: 'passage', revision, sceneId: scene.id, title: scene.title, paragraphs: [...paragraphs] };
}
export function createGame(content: Content): GameState {
  return deepFreeze({ contentId: content.id, contentVersion: content.version, contentHash: contentHash(content), revision: 0, currentScene: content.start, ended: false, flags: [], observations: [], interpretations: [], relationships: [], transcript: [passage(sceneFor(content, content.start), [], 0)], processedCommandIds: [] });
}
export function availableChoices(content: Content, state: GameState): Choice[] {
  if (state.ended || content.id !== state.contentId || content.version !== state.contentVersion || state.contentHash !== contentHash(content)) return [];
  return sceneFor(content, state.currentScene).choices.filter(choice => {
    const nextFlags = [...new Set([...state.flags, ...(choice.effects ?? [])])];
    return matches(choice.requires, state.flags) && !(choice.unless ?? []).some(flag => state.flags.includes(flag)) && matches(sceneFor(content, choice.target).requires, nextFlags);
  });
}
export function applyChoice(content: Content, state: GameState, command: Command): ChoiceResult {
  const fail = (code: EngineErrorCode, message: string): ChoiceResult => ({ ok: false, state, error: { code, message } });
  if (!command || typeof command.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}$/.test(command.id) || typeof command.choiceId !== 'string' || !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0) return fail('invalid-command', 'The command is malformed.');
  if (content.id !== state.contentId || content.version !== state.contentVersion || state.contentHash !== contentHash(content)) return fail('content-mismatch', 'This run belongs to a different content revision.');
  if (state.processedCommandIds.includes(command.id)) return { ok: true, state, duplicate: true };
  if (command.expectedRevision !== state.revision) return fail('stale-command', 'The passage changed before this choice was applied.');
  if (state.ended) return fail('ended', 'This run has ended.');
  if (state.revision >= 10000) return fail('resource-limit', 'The 10,000-command run limit has been reached. Export this run before starting another.');
  const scene = sceneFor(content, state.currentScene);
  const choice = scene.choices.find(candidate => candidate.id === command.choiceId);
  if (!choice || !matches(choice.requires, state.flags) || (choice.unless ?? []).some(flag => state.flags.includes(flag))) return fail('unavailable-choice', 'That choice is not available in this passage.');
  if ((choice.ending || choice.irreversible || command.confirmation !== undefined) && (!command.confirmation || !equalData(command.confirmation, confirmationFor(state, command)))) return fail('confirmation-required', 'Confirm this action again for the current passage.');
  const flags = [...new Set([...state.flags, ...(choice.effects ?? [])])].sort();
  const target = sceneFor(content, choice.target);
  if (!matches(target.requires, flags)) return fail('locked-target', 'The destination is not available.');
  const revision = state.revision + 1;
  const records = (field: 'observations' | 'interpretations' | 'relationships', definition: Choice['observation']): EncounteredRecord[] => definition && !state[field].some(record => record.id === definition.id) ? [...state[field], { ...definition, sceneId: scene.id, revision }] : [...state[field]];
  const next: GameState = {
    ...state, revision, currentScene: target.id, ended: choice.ending === true, flags,
    observations: records('observations', choice.observation), interpretations: records('interpretations', choice.interpretation), relationships: records('relationships', choice.relationship),
    transcript: [...state.transcript, { kind: 'choice', revision, sceneId: scene.id, commandId: command.id, choiceId: choice.id, label: choice.label, ...(command.confirmation ? { confirmation: { ...command.confirmation } } : {}) }, passage(target, flags, revision)],
    processedCommandIds: [...state.processedCommandIds, command.id],
  };
  return { ok: true, state: deepFreeze(next), duplicate: false };
}
/** Imported saves must reproduce every flag, record, seen variant and choice label. */
export function validateState(content: Content, input: unknown): Validation<GameState> {
  if (!isObject(input) || input.contentId !== content.id || input.contentVersion !== content.version || input.contentHash !== contentHash(content) || !Number.isSafeInteger(input.revision) || Number(input.revision) < 0 || Number(input.revision) > 10000 || !Array.isArray(input.transcript) || input.transcript.length !== Number(input.revision) * 2 + 1) return { ok: false, errors: ['Save state identity, exact content hash, revision or transcript shape is invalid.'] };
  let replay = createGame(content);
  for (let i = 1; i < input.transcript.length; i += 2) {
    const event: unknown = input.transcript[i];
    if (!isObject(event) || event.kind !== 'choice' || typeof event.commandId !== 'string' || typeof event.choiceId !== 'string') return { ok: false, errors: [`Transcript entry ${i} is not a valid choice.`] };
    const confirmation = event.confirmation as Confirmation | undefined;
    const result = applyChoice(content, replay, { id: event.commandId, choiceId: event.choiceId, expectedRevision: replay.revision, ...(confirmation ? { confirmation } : {}) });
    if (!result.ok || result.duplicate) return { ok: false, errors: [`Transcript entry ${i} cannot be replayed.`] };
    replay = result.state;
  }
  if (!equalData(input, replay)) return { ok: false, errors: ['Save state differs from its deterministic transcript. It was not restored.'] };
  return { ok: true, value: replay };
}
function equalData(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equalData(v, b[i]));
  if (isObject(a) && isObject(b)) { const ak = Object.keys(a), bk = Object.keys(b); return ak.length === bk.length && ak.every(k => Object.hasOwn(b, k) && equalData(a[k], b[k])); }
  return false;
}
/** Intentionally never accepts Content: unseen scenes cannot enter this export. */
export function serializePlayerExport(state: GameState): string {
  return JSON.stringify({ schemaVersion: 1, engineVersion: ENGINE_VERSION, kind: 'encountered-run', stateChecksum: stateHash(state), state }, null, 2);
}
export function currentPassage(state: GameState): Passage {
  const last = state.transcript[state.transcript.length - 1];
  if (last.kind !== 'passage') throw new Error('Run has no current passage');
  return last;
}
