import type { SaveOptions } from './checkpoint-store';

/** Replacement intent is external save metadata, independent of fictional state. */
export class ReplacementIntent {
  private requested = 0;
  private persisted = 0;
  private options = new Map<number, SaveOptions>();
  request(options: SaveOptions = {}): void { this.requested += 1; this.options.set(this.requested, structuredClone(options)); }
  saveOptions(snapshot: number): SaveOptions { return this.needsArchive(snapshot) ? { ...this.options.get(snapshot), archiveCurrent: true } : {}; }
  snapshot(): number { return this.requested; }
  needsArchive(snapshot: number): boolean { return snapshot > this.persisted; }
  committed(snapshot: number): void { this.persisted = Math.max(this.persisted, snapshot); for (const key of this.options.keys()) if (key <= this.persisted) this.options.delete(key); }
  discard(): void { this.persisted = this.requested; this.options.clear(); }
}
