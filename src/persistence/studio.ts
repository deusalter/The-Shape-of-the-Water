import { contentSchema } from '../engine/schema';
import { validateContent, type Content } from '../engine/game';
import { isObject } from '../engine/validate';

/** Author drafts never enter the player's database. Invalid graph edits can be recovered. */
export class StudioDraftStore {
  private async open(): Promise<IDBDatabase> {
    return new Promise((resolve,reject) => { const request = indexedDB.open('literary-detective-studio-drafts-v1',1); request.onupgradeneeded = () => request.result.createObjectStore('projects'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  }
  async save(draft: Content, lastValid: Content): Promise<void> {
    const db = await this.open();
    try { await new Promise<void>((resolve,reject) => { const tx = db.transaction('projects','readwrite'); tx.objectStore('projects').put({ schemaVersion:1,draft,lastValid },draft.id); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); } finally { db.close(); }
  }
  async load(id: string): Promise<{ draft: Content; lastValid: Content } | undefined> {
    const db = await this.open();
    try {
      const value: unknown = await new Promise((resolve,reject) => { const request = db.transaction('projects').objectStore('projects').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      if (value === undefined) return;
      if (!isObject(value) || value.schemaVersion !== 1) throw new Error('Studio draft envelope is invalid.');
      const shape = contentSchema.safeParse(value.draft), valid = validateContent(value.lastValid);
      if (!shape.success || !valid.ok) throw new Error('Studio draft failed validation. Current editor remains active.');
      return { draft: shape.data, lastValid: valid.value };
    } finally { db.close(); }
  }
}
