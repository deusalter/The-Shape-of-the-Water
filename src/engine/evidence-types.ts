import type { Choice, ChoiceEvent, Content, EncounteredRecord, GameState, Passage, Scene, Confirmation } from './types';

export type ConditionV2 =
  | { op: 'always' }
  | { op: 'all' | 'any'; args: ConditionV2[] }
  | { op: 'not'; arg: ConditionV2 }
  | { op: 'hasSource' | 'hasDeduction' | 'flag' | 'interpretationAvailable'; id: string }
  | { op: 'npcKnows'; characterId: string; refId: string }
  | { op: 'npcBelieves'; characterId: string; beliefId: string };
export type ProofV2 = { op: 'ref'; refId: string } | { op: 'all' | 'any'; args: ProofV2[]; independent?: boolean };
export interface SourceV2 { id: string; title: string; text: string; kind: 'observation' | 'document' | 'statement'; provenanceId: string; speakerId?: string; claimIds?: string[] }
export interface CharacterV2 { id: string; name: string; initial: { knows: string[]; believes: string[]; claims: string[] } }
export type ActionV2 = { type: 'acquireSource'; sourceId: string } | { type: 'disclose'; characterId: string; refId: string } | { type: 'setBelief'; characterId: string; beliefId: string; value: boolean };
export interface ChoiceV2 extends Choice { when?: ConditionV2; actions?: ActionV2[] }
export interface VariantV2 { id: string; requires: string[]; when?: ConditionV2; paragraphs: string[]; paragraphIds?: string[]; sourceIds?: string[] }
export interface SceneV2 extends Omit<Scene, 'choices' | 'variants'> { choices: ChoiceV2[]; when?: ConditionV2; sourceIds?: string[]; paragraphIds?: string[]; variants?: VariantV2[] }
export type FeedbackCodeV2 = 'supported' | 'unsupported' | 'premature' | 'contradictory' | 'irrelevant';
export interface FeedbackV2 { code: FeedbackCodeV2; text: string; when?: ConditionV2; mentions?: string[] }
export interface QuestionV2 { id: string; text: string; when?: ConditionV2; candidates: { id: string; text: string; when?: ConditionV2; contradictedBy?: string[] }[]; supportedCandidateId: string; proof: ProofV2; allowedCorroborators: string[]; feedback: FeedbackV2[]; effects?: string[]; actions?: ActionV2[]; target?: string }
export interface InterpretationRuleV2 { id: string; title: string; text: string; when: ConditionV2; relatedRefs: string[]; effects?: string[] }
export interface HintV2 { id: string; label: string; questionId: string; when: ConditionV2; mentions: string[]; text: string; reveals: boolean; sourceIds?: string[] }
export interface ContentV2 extends Omit<Content, 'scenes'> { schemaVersion: 2; sources: SourceV2[]; characters: CharacterV2[]; beliefIds: string[]; questions: QuestionV2[]; interpretationRules: InterpretationRuleV2[]; hints: HintV2[]; scenes: SceneV2[] }
interface BaseCommandV2 { id: string; expectedRevision: number; confirmation?: Confirmation }
export type CommandV2 = BaseCommandV2 & (
  | { type: 'choose'; choiceId: string }
  | { type: 'submitDeduction'; questionId: string; candidateId: string; selectedRefs: string[] }
  | { type: 'requestHint'; hintId: string }
  | { type: 'reviewInterpretation'; interpretationId: string }
);
export interface EncounteredSourceV2 extends SourceV2 { sceneId: string; revision: number }
export interface AcceptedDeductionV2 { id: string; candidateId: string; text: string; selectedRefs: string[]; witnessRefs: string[]; sceneId: string; revision: number }
export interface NpcStateV2 { id: string; knows: string[]; believes: string[]; claims: { sourceId: string; revision: number }[] }
export interface PassageV2 extends Passage { contentHash: string; variantId: string; blocks: { id: string; text: string }[] }
export interface ActionEventV2 { kind: 'action'; revision: number; sceneId: string; label: string; command: CommandV2; feedback?: string }
export interface SeenV2 { transcript: (PassageV2 | ActionEventV2 | Passage | ChoiceEvent)[]; sources: EncounteredSourceV2[]; deductions: AcceptedDeductionV2[]; interpretations: EncounteredRecord[]; relationships: EncounteredRecord[]; hints: { id: string; text: string; revision: number }[] }
export interface GameStateV2 extends Omit<GameState, 'transcript'>, SeenV2 { schemaVersion: 2; engineVersion: 2; npcState: NpcStateV2[]; eligibleInterpretations: { id: string; revision: number }[]; commands: CommandV2[]; migrationSeed: LegacySeedV2 | null }
export interface WitnessV2 { refs: string[]; independent: string[][] }
export type ErrorCodeV2 = FeedbackCodeV2 | 'unknown-reference' | 'unavailable-question' | 'unavailable-choice' | 'unavailable-hint' | 'unavailable-reading' | 'invalid-command' | 'stale-command' | 'content-mismatch' | 'confirmation-required' | 'resource-limit' | 'ended';
export type ResultV2 = { ok: true; state: GameStateV2; duplicate: boolean; feedback?: string } | { ok: false; state: GameStateV2; error: { code: ErrorCodeV2; message: string } };
export interface PortableV2 { saveVersion: 2; schemaVersion: 2; engineVersion: 2; kind: 'encountered-run'; content: { id: string; version: number; hash: string }; commands: CommandV2[]; seen: SeenV2; seenChecksum: string; migrationSeed: LegacySeedV2 | null }

// Compatibility manifests are installed trusted data, never embedded runtime truth.
export interface MigrationManifestV2 { id: string; fromHash: string; toHash: string; sceneMap: Record<string, string>; flagMap: Record<string, string>; sourceMap: Record<string, string>; disclosures: { choiceId: string; characterId: string; refId: string }[] }
export interface LegacySeedV2 { manifestId: string; manifestHash: string; legacyState: GameState; legacyStateHash: string }
export interface ReplayContextV2 { legacyBundles: Record<string, Content>; manifests: Record<string, MigrationManifestV2> }
