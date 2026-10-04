import type { Choice, ChoiceEvent, Content, EncounteredRecord, GameState, Passage, Scene, Confirmation } from './types';

export type OccasionScopeV2 = 'current' | 'historical' | 'encountered';
export interface CapturedOccasionV2 { occasionId?: string; occasionLabel?: string }
export type ConditionV2 =
  | { op: 'always' }
  | { op: 'all' | 'any'; args: ConditionV2[] }
  | { op: 'not'; arg: ConditionV2 }
  | { op: 'hasSource' | 'hasDeduction' | 'flag'; id: string; scope?: OccasionScopeV2 }
  | { op: 'interpretationAvailable' | 'occasionIs'; id: string }
  | { op: 'npcKnows'; characterId: string; refId: string }
  | { op: 'npcBelieves'; characterId: string; beliefId: string };
export type ProofV2 = { op: 'ref'; refId: string; scope?: OccasionScopeV2 } | { op: 'all' | 'any'; args: ProofV2[]; independent?: boolean };
export interface SourceV2 { id: string; title: string; text: string; kind: 'observation' | 'document' | 'statement'; provenanceId: string; speakerId?: string; claimIds?: string[]; occasionId?: string; sourceKey?: string; derivedFrom?: string[] }
export interface CharacterV2 { id: string; name: string; initial: { knows: string[]; believes: string[]; claims: string[] }; occasionId?: string; persistent?: true; requiresSnapshot?: true }
export type ActionV2 = { type: 'acquireSource'; sourceId: string } | { type: 'disclose'; characterId: string; refId: string } | { type: 'setBelief'; characterId: string; beliefId: string; value: boolean } | { type: 'snapshotCharacter'; fromCharacterId: string; toCharacterId: string } | { type: 'witnessSource'; characterId: string; sourceId: string };
export interface ChoiceV2 extends Choice { when?: ConditionV2; actions?: ActionV2[]; enterOccasion?: string }
export interface VariantV2 { id: string; requires: string[]; when?: ConditionV2; paragraphs: string[]; paragraphIds?: string[]; sourceIds?: string[] }
export interface SceneV2 extends Omit<Scene, 'choices' | 'variants'> { choices: ChoiceV2[]; when?: ConditionV2; sourceIds?: string[]; paragraphIds?: string[]; variants?: VariantV2[]; occasionId?: string }
export type FeedbackCodeV2 = 'supported' | 'unsupported' | 'premature' | 'contradictory' | 'irrelevant';
export interface FeedbackV2 { code: FeedbackCodeV2; text: string; when?: ConditionV2; mentions?: string[] }
export interface QuestionV2 { id: string; text: string; when?: ConditionV2; candidates: { id: string; text: string; when?: ConditionV2; contradictedBy?: string[] }[]; supportedCandidateId: string; proof: ProofV2; allowedCorroborators: string[]; feedback: FeedbackV2[]; effects?: string[]; actions?: ActionV2[]; target?: string; occasionId?: string }
export interface InterpretationRuleV2 { id: string; title: string; text: string; when: ConditionV2; relatedRefs: string[]; effects?: string[]; occasionId?: string }
export interface HintV2 { id: string; label: string; questionId: string; when: ConditionV2; mentions: string[]; text: string; reveals: boolean; sourceIds?: string[]; occasionId?: string }
export interface ContentV2 extends Omit<Content, 'scenes'> { schemaVersion: 2; sources: SourceV2[]; characters: CharacterV2[]; beliefIds: string[]; questions: QuestionV2[]; interpretationRules: InterpretationRuleV2[]; hints: HintV2[]; scenes: SceneV2[]; occasions?: { id: string; label: string }[] }
interface BaseCommandV2 { id: string; expectedRevision: number; confirmation?: Confirmation }
export type CommandV2 = BaseCommandV2 & (
  | { type: 'choose'; choiceId: string }
  | { type: 'submitDeduction'; questionId: string; candidateId: string; selectedRefs: string[] }
  | { type: 'requestHint'; hintId: string }
  | { type: 'reviewInterpretation'; interpretationId: string }
);
export interface EncounteredSourceV2 extends SourceV2, CapturedOccasionV2 { sceneId: string; revision: number }
export interface AcceptedDeductionV2 extends CapturedOccasionV2 { id: string; candidateId: string; text: string; selectedRefs: string[]; witnessRefs: string[]; sceneId: string; revision: number }
export interface NpcStateV2 { id: string; knows: string[]; believes: string[]; claims: { sourceId: string; revision: number }[]; snapshot?: { fromCharacterId: string; occasionId: string; revision: number } }
export interface PassageV2 extends Passage, CapturedOccasionV2 { contentHash: string; variantId: string; blocks: { id: string; text: string }[] }
export interface ActionEventV2 extends CapturedOccasionV2 { kind: 'action'; revision: number; sceneId: string; label: string; command: CommandV2; feedback?: string }
export interface SeenV2 { transcript: (PassageV2 | ActionEventV2 | Passage | ChoiceEvent)[]; sources: EncounteredSourceV2[]; deductions: AcceptedDeductionV2[]; interpretations: (EncounteredRecord & CapturedOccasionV2 & { originOccasionId?: string; originOccasionLabel?: string })[]; relationships: (EncounteredRecord & CapturedOccasionV2)[]; hints: ({ id: string; text: string; revision: number } & CapturedOccasionV2)[] }
export interface GameStateV2 extends Omit<GameState, keyof SeenV2 | 'observations'>, SeenV2 { schemaVersion: 2; engineVersion: 2; npcState: NpcStateV2[]; eligibleInterpretations: ({ id: string; revision: number } & CapturedOccasionV2)[]; observations: (EncounteredRecord & CapturedOccasionV2)[]; commands: CommandV2[]; migrationSeed: LegacySeedV2 | null; currentOccasionId?: string }
export interface WitnessV2 { refs: string[]; independent: string[][]; scopes?: { refId: string; scope: OccasionScopeV2 }[] }
export type ErrorCodeV2 = FeedbackCodeV2 | 'unknown-reference' | 'unavailable-question' | 'unavailable-choice' | 'unavailable-hint' | 'unavailable-reading' | 'invalid-command' | 'stale-command' | 'content-mismatch' | 'confirmation-required' | 'resource-limit' | 'ended';
export type ResultV2 = { ok: true; state: GameStateV2; duplicate: boolean; feedback?: string } | { ok: false; state: GameStateV2; error: { code: ErrorCodeV2; message: string } };
export interface PortableV2 { saveVersion: 2; schemaVersion: 2; engineVersion: 2; kind: 'encountered-run'; content: { id: string; version: number; hash: string }; commands: CommandV2[]; seen: SeenV2; seenChecksum: string; migrationSeed: LegacySeedV2 | null }

// Compatibility manifests are installed trusted data, never embedded runtime truth.
export interface MigrationManifestV2 { id: string; fromHash: string; toHash: string; sceneMap: Record<string, string>; flagMap: Record<string, string>; sourceMap: Record<string, string>; disclosures: { choiceId: string; characterId: string; refId: string }[] }
export interface LegacySeedV2 { manifestId: string; manifestHash: string; legacyState: GameState; legacyStateHash: string }
export interface ReplayContextV2 { legacyBundles: Record<string, Content>; manifests: Record<string, MigrationManifestV2> }
