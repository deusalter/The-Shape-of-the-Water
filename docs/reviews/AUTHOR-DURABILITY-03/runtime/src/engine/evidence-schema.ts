import { z } from 'zod';
import { choiceSchema, contentSchema, sceneSchema } from './schema';
import type { ConditionV2, ProofV2 } from './evidence-types';
export const idV2 = contentSchema.shape.id;
const text = z.string().min(1).max(50000).refine(value => !!value.trim(), 'Text cannot be blank');
const ids = z.array(idV2).max(64);
const occasionId = idV2.optional();
const scope = z.enum(['current','historical','encountered']).optional();
export const conditionSchemaV2: z.ZodType<ConditionV2> = z.lazy(() => z.discriminatedUnion('op', [
  z.strictObject({ op: z.literal('always') }),
  z.strictObject({ op: z.enum(['all', 'any']), args: z.array(conditionSchemaV2).min(1).max(64) }),
  z.strictObject({ op: z.literal('not'), arg: conditionSchemaV2 }),
  z.strictObject({ op: z.enum(['hasSource', 'hasDeduction', 'flag']), id: idV2, scope }),
  z.strictObject({ op: z.enum(['interpretationAvailable','occasionIs']), id: idV2 }),
  z.strictObject({ op: z.literal('npcKnows'), characterId: idV2, refId: idV2 }),
  z.strictObject({ op: z.literal('npcBelieves'), characterId: idV2, beliefId: idV2 }),
]));
export const proofSchemaV2: z.ZodType<ProofV2> = z.lazy(() => z.discriminatedUnion('op', [
  z.strictObject({ op: z.literal('ref'), refId: idV2, scope }),
  z.strictObject({ op: z.enum(['all', 'any']), args: z.array(proofSchemaV2).min(1).max(64), independent: z.boolean().optional() }),
]));
const action = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('acquireSource'), sourceId: idV2 }),
  z.strictObject({ type: z.literal('disclose'), characterId: idV2, refId: idV2 }),
  z.strictObject({ type: z.literal('setBelief'), characterId: idV2, beliefId: idV2, value: z.boolean() }),
  z.strictObject({ type: z.literal('snapshotCharacter'), fromCharacterId: idV2, toCharacterId: idV2 }),
  z.strictObject({ type: z.literal('witnessSource'), characterId: idV2, sourceId: idV2 }),
]);
const actions = z.array(action).max(64);
const when = conditionSchemaV2.optional();
const choice = choiceSchema.extend({ when, actions: actions.optional(), enterOccasion: occasionId });
const variant = z.strictObject({ id: idV2, requires: ids, when, paragraphs: sceneSchema.shape.paragraphs, paragraphIds: z.array(idV2).max(200).optional(), sourceIds: ids.optional() });
const scene = sceneSchema.extend({ when, choices: z.array(choice).max(200), variants: z.array(variant).max(100).optional(), paragraphIds: z.array(idV2).max(200).optional(), sourceIds: ids.optional(), occasionId });
export const contentSchemaV2 = contentSchema.extend({
  schemaVersion: z.literal(2), scenes: z.array(scene).min(1).max(2000),
  beliefIds: ids,
  sources: z.array(z.strictObject({ id: idV2, title: text, text, kind: z.enum(['observation', 'document', 'statement']), provenanceId: idV2, speakerId: idV2.optional(), claimIds: ids.optional(), occasionId, sourceKey: idV2.optional(), derivedFrom: ids.min(1).optional() })).max(2000),
  characters: z.array(z.strictObject({ id: idV2, name: text, initial: z.strictObject({ knows: ids, believes: ids, claims: ids }), occasionId, persistent: z.literal(true).optional(), requiresSnapshot: z.literal(true).optional() })).max(100),
  questions: z.array(z.strictObject({ id: idV2, text, when, candidates: z.array(z.strictObject({ id: idV2, text, when, contradictedBy: ids.optional() })).min(1).max(64), supportedCandidateId: idV2, proof: proofSchemaV2, allowedCorroborators: ids, feedback: z.array(z.strictObject({ code: z.enum(['supported', 'unsupported', 'premature', 'contradictory', 'irrelevant']), text, when, mentions: ids.optional() })).max(50), effects: ids.optional(), actions: actions.optional(), target: idV2.optional(), occasionId })).max(200),
  interpretationRules: z.array(z.strictObject({ id: idV2, title: text, text, when: conditionSchemaV2, relatedRefs: ids, effects: ids.optional(), occasionId })).max(1000),
  hints: z.array(z.strictObject({ id: idV2, label: text, questionId: idV2, when: conditionSchemaV2, mentions: ids, text, reveals: z.boolean(), sourceIds: ids.optional(), occasionId })).max(1000),
  occasions: z.array(z.strictObject({id:idV2,label:text})).min(1).max(16).optional(),
});
const receipt = z.strictObject({ stateHash: z.string().regex(/^[0-9a-f]{64}$/), actionHash: z.string().regex(/^[0-9a-f]{64}$/), acknowledged: z.literal(true) });
const commandBase = { id: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}$/), expectedRevision: z.number().int().min(0).max(10000), confirmation: receipt.optional() };
export const commandSchemaV2 = z.discriminatedUnion('type', [
  z.strictObject({ ...commandBase, type: z.literal('choose'), choiceId: idV2 }),
  z.strictObject({ ...commandBase, type: z.literal('submitDeduction'), questionId: idV2, candidateId: idV2, selectedRefs: ids }),
  z.strictObject({ ...commandBase, type: z.literal('requestHint'), hintId: idV2 }),
  z.strictObject({ ...commandBase, type: z.literal('reviewInterpretation'), interpretationId: idV2 }),
]);
export const manifestSchemaV2 = z.strictObject({ id: idV2, fromHash: z.string().regex(/^[0-9a-f]{64}$/), toHash: z.string().regex(/^[0-9a-f]{64}$/), sceneMap: z.record(idV2, idV2), flagMap: z.record(idV2, idV2), sourceMap: z.record(idV2, idV2), disclosures: z.array(z.strictObject({ choiceId: idV2, characterId: idV2, refId: idV2 })).max(200) });
export const seedSchemaV2 = z.strictObject({ manifestId: idV2, manifestHash: z.string().regex(/^[0-9a-f]{64}$/), legacyState: z.unknown(), legacyStateHash: z.string().regex(/^[0-9a-f]{64}$/) });
export const portableSchemaV2 = z.strictObject({ saveVersion: z.literal(2), schemaVersion: z.literal(2), engineVersion: z.literal(2), kind: z.literal('encountered-run'), content: z.strictObject({ id: idV2, version: z.number().int().positive(), hash: z.string().regex(/^[0-9a-f]{64}$/) }), commands: z.array(commandSchemaV2).max(10000), seen: z.strictObject({ transcript: z.array(z.unknown()).max(20001), sources: z.array(z.unknown()).max(2000), deductions: z.array(z.unknown()).max(200), interpretations: z.array(z.unknown()).max(2000), relationships: z.array(z.unknown()).max(2000), hints: z.array(z.unknown()).max(1000) }), seenChecksum: z.string().regex(/^[0-9a-f]{64}$/), migrationSeed: seedSchemaV2.nullable() });
