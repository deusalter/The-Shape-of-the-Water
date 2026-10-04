import selection from './selection.json';

/** This registry describes links only. Opening one edition never loads the others. */
export interface StoryEdition {
  id: string;
  href: string;
  label: string;
  file: string;
}

export const storyEditions: readonly StoryEdition[] = [
  { id: 'current', href: './', label: 'Open the current story', file: selection.file },
  { id: 'second-mouth-v5', href: '?edition=second-mouth-v5', label: 'Open the retained first journeys', file: 'case-v5.json' },
  { id: 'second-mouth-v4', href: '?edition=second-mouth-v4', label: 'Open the retained first movement', file: 'case-v4.json' },
  { id: 'first-night', href: '?edition=first-night', label: 'Open the earlier bath prototype', file: 'case-v2.json' },
];

export function storyEditionFromSearch(search: string): StoryEdition {
  const requested = new URLSearchParams(search).get('edition');
  return storyEditions.find(edition => edition.id === requested) ?? storyEditions[0];
}

export function otherStoryEditions(selected: StoryEdition): StoryEdition[] {
  const seen = new Set([selected.file]);
  return storyEditions.filter(edition => {
    if (seen.has(edition.file)) return false;
    seen.add(edition.file);
    return true;
  });
}
