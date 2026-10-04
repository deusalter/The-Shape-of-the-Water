import { z } from 'zod';

const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,119}$/);
const text = z.string().min(1).max(50000).refine(value => value.trim().length > 0, 'Text cannot be blank');
const flags = z.array(id).max(64);
const record = z.strictObject({ id, text });
export const choiceSchema = z.strictObject({ id, label: text, target: id, requires: flags.optional(), unless: flags.optional(), effects: flags.optional(), observation: record.optional(), interpretation: record.optional(), relationship: record.optional(), ending: z.boolean().optional(), irreversible: z.boolean().optional() });
export const sceneSchema = z.strictObject({ id, title: text, paragraphs: z.array(text).min(1).max(200), choices: z.array(choiceSchema).max(200), requires: flags.optional(), variants: z.array(z.strictObject({ requires: flags, paragraphs: z.array(text).min(1).max(200) })).max(100).optional() });
export const contentSchema = z.strictObject({ id, title: text, version: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), start: id, scenes: z.array(sceneSchema).min(1).max(2000) });
