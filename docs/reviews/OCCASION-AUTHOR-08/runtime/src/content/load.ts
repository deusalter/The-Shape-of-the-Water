import { validateContent, type Content } from '../engine/game';
import { fixtureContent } from './fixture';

const modules = import.meta.glob('./case.json', { eager: true, import: 'default' });
const candidate = modules['./case.json'];
const validated = candidate === undefined ? undefined : validateContent(candidate);
export const initialContent: Content = validated?.ok ? validated.value : fixtureContent;
export const contentWarning = candidate === undefined ? 'The literary case is not installed. You are playing the noncanonical software fixture.' : validated && !validated.ok ? `The case failed validation; the software fixture is active. ${validated.errors.join(' ')}` : '';
