import { z } from 'zod';
import { contentSchema, choiceSchema, sceneSchema } from '../engine/schema';
import { validateContent, type Content } from '../engine/game';

// A draft can have blank prose or unfinished flag spelling. Its shape, stable IDs
// and resource limits remain constrained; it is never passed to the game engine.
const draftText = z.string().max(50000);
const draftFlags = z.array(z.string().max(120)).max(64);
const draftRecord = z.strictObject({ id: contentSchema.shape.id, text: draftText });
const draftChoice = choiceSchema.extend({
  label: draftText,
  requires: draftFlags.optional(), unless: draftFlags.optional(), effects: draftFlags.optional(),
  observation: draftRecord.optional(), interpretation: draftRecord.optional(), relationship: draftRecord.optional(),
});
const draftScene = sceneSchema.extend({
  title: draftText,
  paragraphs: z.array(draftText).min(1).max(200),
  choices: z.array(draftChoice).max(200),
  requires: draftFlags.optional(),
  variants: z.array(z.strictObject({ requires: draftFlags, paragraphs: z.array(draftText).min(1).max(200) })).max(100).optional(),
});
const draftSchema = contentSchema.extend({
  title: draftText,
  version: z.number().finite().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER),
  scenes: z.array(draftScene).min(1).max(2000),
}).refine(draft => draft.scenes.reduce((total, scene) => total + 1 + scene.choices.length, 0) <= 8000, 'Draft exceeds 8000 scenes and choices');
const envelopeSchema = z.strictObject({ schemaVersion: z.literal(1), draft: draftSchema, lastValid: z.unknown() });

function checkedEnvelope(value: unknown): { schemaVersion: 1; draft: Content; lastValid: Content } {
  const envelope = envelopeSchema.safeParse(value);
  if (!envelope.success) throw new Error('Studio draft envelope has an unsupported shape or exceeds its limits.');
  if (new TextEncoder().encode(JSON.stringify(envelope.data.draft)).byteLength > 10 * 1024 * 1024) throw new Error('Studio draft exceeds the 10 MB limit.');
  const valid = validateContent(envelope.data.lastValid);
  if (!valid.ok) throw new Error('The saved studio preview failed content validation.');
  return { schemaVersion: 1, draft: envelope.data.draft, lastValid: valid.value };
}

/** Author drafts never enter the player's database. Invalid graph edits can be recovered. */
export class StudioDraftStore {
  constructor(private readonly factory: IDBFactory | undefined = globalThis.indexedDB, private readonly name = 'literary-detective-studio-drafts-v1') {}
  private async open(): Promise<IDBDatabase> {
    if (!this.factory) throw new DOMException('Studio storage unavailable', 'NotSupportedError');
    return new Promise((resolve,reject) => { const request = this.factory!.open(this.name,1); request.onupgradeneeded = () => request.result.createObjectStore('projects'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); request.onblocked = () => reject(new DOMException('Studio database blocked by another tab', 'InvalidStateError')); });
  }
  async save(draft: Content, lastValid: Content): Promise<void> {
    // Save and load use the same envelope boundary, so a successful save is recoverable.
    const checked = checkedEnvelope({ schemaVersion: 1, draft, lastValid });
    const db = await this.open();
    try { await new Promise<void>((resolve,reject) => { const tx = db.transaction('projects','readwrite'); tx.objectStore('projects').put(checked,checked.draft.id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
  }
  async load(id: string): Promise<{ draft: Content; lastValid: Content } | undefined> {
    const db = await this.open();
    try {
      const value: unknown = await new Promise((resolve,reject) => { const request = db.transaction('projects').objectStore('projects').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      if (value === undefined) return;
      const checked = checkedEnvelope(value);
      if (checked.draft.id !== id) throw new Error('Studio draft project identity does not match its saved key.');
      return { draft: checked.draft, lastValid: checked.lastValid };
    } finally { db.close(); }
  }
}
