export interface RecordDefinition { id: string; text: string }
export interface Choice {
  id: string;
  label: string;
  target: string;
  requires?: string[];
  unless?: string[];
  effects?: string[];
  observation?: RecordDefinition;
  interpretation?: RecordDefinition;
  relationship?: RecordDefinition;
  ending?: boolean;
  irreversible?: boolean;
}
export interface Scene {
  id: string;
  title: string;
  paragraphs: string[];
  choices: Choice[];
  requires?: string[];
  variants?: { requires: string[]; paragraphs: string[] }[];
}
export interface Content { id: string; title: string; version: number; start: string; scenes: Scene[] }
export interface EncounteredRecord extends RecordDefinition { sceneId: string; revision: number }
export interface Passage {
  kind: 'passage'; revision: number; sceneId: string; title: string; paragraphs: string[];
}
export interface ChoiceEvent {
  kind: 'choice'; revision: number; sceneId: string; commandId: string; choiceId: string; label: string;
  confirmation?: Confirmation;
}
export interface GameState {
  contentId: string;
  contentVersion: number;
  contentHash: string;
  revision: number;
  currentScene: string;
  ended: boolean;
  flags: string[];
  observations: EncounteredRecord[];
  interpretations: EncounteredRecord[];
  relationships: EncounteredRecord[];
  transcript: (Passage | ChoiceEvent)[];
  processedCommandIds: string[];
}
export type Validation<T> = { ok: true; value: T } | { ok: false; errors: string[] };
export interface Confirmation { stateHash: string; actionHash: string; acknowledged: true }
export interface Command { id: string; choiceId: string; expectedRevision: number; confirmation?: Confirmation }
export type EngineErrorCode = 'invalid-command' | 'content-mismatch' | 'stale-command' | 'ended' | 'unavailable-choice' | 'locked-target' | 'confirmation-required' | 'resource-limit';
export type ChoiceResult = { ok: true; state: GameState; duplicate: boolean } | { ok: false; state: GameState; error: { code: EngineErrorCode; message: string } };
