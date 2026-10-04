import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { otherStoryEditions, storyEditionFromSearch, storyEditions } from '../src/content/edition-catalog';
import { exportPortableV2, importPortableV2, validateContentV2 } from '../src/engine/evidence-v2';
import { contentHash } from '../src/engine/hash';

const { imports } = vi.hoisted(() => ({ imports: [] as string[] }));
vi.mock('../src/content/case-v7.json', async original => { imports.push('case-v7.json'); return original(); });
vi.mock('../src/content/case-v5.json', async original => { imports.push('case-v5.json'); return original(); });
vi.mock('../src/content/case-v4.json', async original => { imports.push('case-v4.json'); return original(); });
vi.mock('../src/content/case-v2.json', async original => { imports.push('case-v2.json'); return original(); });
vi.mock('../src/content/legacy/case-v1.json', async original => { imports.push('legacy/case-v1.json'); return original(); });
vi.mock('../src/content/compatibility/short-case-v1-to-blaise-v2.json', async original => {
  imports.push('compatibility/short-case-v1-to-blaise-v2.json'); return original();
});
const read = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

describe('edition loading from the browser registry', () => {
  it('opens only the requested text, caches validation, and keeps exact retained replay identities', async () => {
    const { loadStoryEdition, loadInstalledReplayContext } = await import('../src/content/load-story');
    expect(imports).toEqual([]);
    const current = storyEditionFromSearch('');
    expect(current.file).toBe(read('src/content/selection.json').file);
    expect(storyEditionFromSearch('?edition=unknown')).toBe(current);
    expect(otherStoryEditions(current)).toHaveLength(3);
    expect(imports).toEqual([]);

    const [first, same] = await Promise.all([loadStoryEdition(current), loadStoryEdition(current)]);
    expect(imports).toEqual(['case-v7.json']);
    expect(first.content).toBe(same.content);
    expect(first.context).toEqual({ legacyBundles: {}, manifests: {} });
    if (!first.content.ok) throw Error('Current story must validate');
    const selected = validateContentV2(read(`src/content/${current.file}`));
    if (!selected.ok) throw Error('Selected source must validate');
    expect(contentHash(first.content.value)).toBe(contentHash(selected.value));

    for (const [id, frozenPath, runPath] of [
      ['second-mouth-v5', 'narrative/accepted/second-mouth-v5-country-r2/case-v5.json', 'narrative/rebuild/readings-v5/kept-test-dry-tracing-pipe-written.run.json'],
      ['second-mouth-v4', 'narrative/accepted/second-mouth-v4-first-movement-r2/case-v4.json', 'narrative/rebuild/readings/closed-private-confession-dry.run.json'],
    ]) {
      const before = imports.length;
      const edition = storyEditionFromSearch(`?edition=${id}`);
      const retained = await loadStoryEdition(edition);
      expect(imports.slice(before)).toEqual([edition.file]);
      expect(retained.context).toEqual({ legacyBundles: {}, manifests: {} });
      const frozen = validateContentV2(read(frozenPath));
      if (!retained.content.ok || !frozen.ok) throw Error('Retained story must validate');
      expect(contentHash(retained.content.value)).toBe(contentHash(frozen.value));
      const run = read(runPath);
      const replayed = importPortableV2(retained.content.value, run, retained.context);
      if (!replayed.ok) throw Error('Retained run must replay');
      expect(JSON.parse(exportPortableV2(replayed.value))).toEqual(run);
      expect(importPortableV2(first.content.value, run, first.context).ok).toBe(false);
    }

    const beforeCompatibility = imports.length;
    const firstNight = await loadStoryEdition(storyEditionFromSearch('?edition=first-night'));
    expect(imports.slice(beforeCompatibility).sort()).toEqual([
      'case-v2.json', 'legacy/case-v1.json', 'compatibility/short-case-v1-to-blaise-v2.json',
    ].sort());
    if (!firstNight.content.ok) throw Error('First-night story must validate');
    const manifest = Object.values(firstNight.context.manifests)[0];
    expect(manifest.toHash).toBe(contentHash(firstNight.content.value));
    expect(contentHash(firstNight.context.legacyBundles[manifest.fromHash])).toBe(manifest.fromHash);
    // The studio requests the same complete context independent of its initial
    // edition, so subsequently imported migrated v2 previews remain supported.
    expect(await loadInstalledReplayContext()).toBe(firstNight.context);
    const compatibility = await import('../src/content/load-evidence');
    expect(firstNight.context).toEqual(compatibility.replayContext);
    expect(firstNight.content).toEqual(compatibility.firstNightCase);
  });

  it('keeps every retained edition link distinct without reading its content', () => {
    for (const selected of storyEditions) {
      const alternatives = otherStoryEditions(selected);
      expect(new Set(alternatives.map(edition => edition.file)).size).toBe(alternatives.length);
      expect(alternatives.map(edition => edition.file)).not.toContain(selected.file);
    }
  });

  it('rejects unavailable installed content instead of resolving a prototype property', async () => {
    const { loadStoryEdition } = await import('../src/content/load-story');
    await expect(loadStoryEdition({ ...storyEditions[0], file: 'constructor' })).rejects.toThrow('no content loader');
  });
});
