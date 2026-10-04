import { validateContentV2, type ReplayContextV2 } from '../engine/evidence-v2';
import type { StoryEdition } from './edition-catalog';

// Explicit imports exclude uninstalled candidates and allow Vite to retain exact
// edition chunks without downloading or validating them in the initial player.
const contentLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  'case-v7.json': () => import('./case-v7.json'),
  'case-v5.json': () => import('./case-v5.json'),
  'case-v4.json': () => import('./case-v4.json'),
  'case-v2.json': () => import('./case-v2.json'),
};

type ValidatedStory = ReturnType<typeof validateContentV2>;
export interface LoadedStoryEdition { content: ValidatedStory; context: ReplayContextV2 }
const contentCache = new Map<string, Promise<ValidatedStory>>();
const emptyContext: ReplayContextV2 = { legacyBundles: {}, manifests: {} };
let compatibilityCache: Promise<ReplayContextV2> | undefined;

function loadContentFile(file: string): Promise<ValidatedStory> {
  const cached = contentCache.get(file);
  if (cached) return cached;
  const loader = Object.hasOwn(contentLoaders, file) ? contentLoaders[file] : undefined;
  if (!loader) return Promise.reject(new Error('This installed edition has no content loader.'));
  const pending = loader().then(module => validateContentV2(module.default)).catch(error => {
    contentCache.delete(file);
    throw error;
  });
  contentCache.set(file, pending);
  return pending;
}

/** Studio needs this mapping even when a later imported draft uses the v2 story. */
export function loadInstalledReplayContext(): Promise<ReplayContextV2> {
  return compatibilityCache ??= Promise.all([
    loadContentFile('case-v2.json'), import('./load-compatibility'),
  ]).then(([firstNight, compatibility]) => compatibility.contextFor(firstNight)).catch(error => {
    compatibilityCache = undefined;
    throw error;
  });
}

export async function loadStoryEdition(edition: StoryEdition): Promise<LoadedStoryEdition> {
  const content = await loadContentFile(edition.file);
  const context = edition.file === 'case-v2.json' ? await loadInstalledReplayContext() : emptyContext;
  return { content, context };
}
