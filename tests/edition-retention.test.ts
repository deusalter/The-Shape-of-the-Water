import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { editionFromSearch, editions, otherEditions } from '../src/content/editions';
import { installedCase } from '../src/content/load-evidence';
import { exportPortableV2, importPortableV2, validateContentV2 } from '../src/engine/evidence-v2';
import { contentHash } from '../src/engine/hash';

const read = (path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

describe('retained story editions', () => {
  it('loads the content actually named by the build selection', () => {
    const selection = read('src/content/selection.json');
    const selected = validateContentV2(read(`src/content/${selection.file}`));
    if (!selected.ok || !installedCase.ok) throw Error('Selected content must validate');
    expect(contentHash(installedCase.value)).toBe(contentHash(selected.value));
    expect(editionFromSearch('?edition=unknown').content).toBe(installedCase);
  });

  it('replays a completed v4 run against its frozen edition and rejects different editions', () => {
    const frozen = validateContentV2(read('narrative/accepted/second-mouth-v4-first-movement-r2/case-v4.json'));
    const retained = editionFromSearch('?edition=second-mouth-v4').content;
    if (!frozen.ok || !retained.ok) throw Error('Retained first movement must validate');
    expect(contentHash(retained.value)).toBe(contentHash(frozen.value));
    const run = read('narrative/rebuild/readings/closed-private-confession-dry.run.json');
    const loaded = importPortableV2(retained.value, run);
    if (!loaded.ok) throw Error('Historical run must replay against its exact retained content');
    expect(JSON.parse(exportPortableV2(loaded.value))).toEqual(run);
    for (const edition of editions) {
      if (edition.content.ok && contentHash(edition.content.value) !== contentHash(retained.value)) {
        expect(importPortableV2(edition.content.value, run).ok).toBe(false);
      }
    }
  });

  it('offers distinct content identities without duplicating the selected edition', () => {
    for (const selected of editions) {
      if (!selected.content.ok) throw Error('A registered edition is invalid');
      const alternatives = otherEditions(selected);
      const hashes = alternatives.map(edition => {
        if (!edition.content.ok) throw Error('A listed alternative is invalid');
        return contentHash(edition.content.value);
      });
      expect(new Set(hashes).size).toBe(hashes.length);
      expect(hashes).not.toContain(contentHash(selected.content.value));
    }
  });

  it('retains the country chapter and replays its completed run only against that exact content', () => {
    const frozen = validateContentV2(read('narrative/accepted/second-mouth-v5-country-r2/case-v5.json'));
    const retained = editionFromSearch('?edition=second-mouth-v5').content;
    if (!frozen.ok || !retained.ok) throw Error('Retained country chapter must validate');
    expect(contentHash(retained.value)).toBe(contentHash(frozen.value));
    const run = read('narrative/rebuild/readings-v5/kept-test-dry-tracing-pipe-written.run.json');
    const replayed = importPortableV2(retained.value, run);
    if (!replayed.ok) throw Error('Historical country run must replay against its frozen content');
    expect(JSON.parse(exportPortableV2(replayed.value))).toEqual(run);
    for (const edition of editions) {
      if (edition.content.ok && contentHash(edition.content.value) !== contentHash(retained.value)) {
        expect(importPortableV2(edition.content.value, run).ok).toBe(false);
      }
    }
  });
});
