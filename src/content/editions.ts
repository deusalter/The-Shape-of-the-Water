import { contentHash } from '../engine/hash';
import { firstCountryCase, firstMovementCase, firstNightCase, installedCase } from './load-evidence';

// Each retained edition supplies its exact original content to the player and studio.
// A URL choice never migrates a save or relabels an old transcript as current content.
export const editions = [
  { id: 'current', href: './', label: 'Open the current story', content: installedCase },
  { id: 'second-mouth-v5', href: '?edition=second-mouth-v5', label: 'Open the retained first journeys', content: firstCountryCase },
  { id: 'second-mouth-v4', href: '?edition=second-mouth-v4', label: 'Open the retained first movement', content: firstMovementCase },
  { id: 'first-night', href: '?edition=first-night', label: 'Open the earlier bath prototype', content: firstNightCase },
];
export type StoryEdition = (typeof editions)[number];

export function editionFromSearch(search: string): StoryEdition {
  const requested = new URLSearchParams(search).get('edition');
  return editions.find(edition => edition.id === requested) ?? editions[0];
}

export function otherEditions(selected: StoryEdition): StoryEdition[] {
  const seen = new Set(selected.content.ok ? [contentHash(selected.content.value)] : []);
  return editions.filter(edition => {
    if (!edition.content.ok) return false;
    const hash = contentHash(edition.content.value);
    if (seen.has(hash)) return false;
    seen.add(hash);
    return true;
  });
}
