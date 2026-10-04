// V2 is an explicit opt-in facade. Legacy game.ts remains the v1 runtime.
export type * from './evidence-types';
export { validateContentV2 } from './evidence-validate';
export { compileProofV2 } from './evidence-proof';
export {
  createGameV2, applyCommandV2, confirmationForV2, evaluateConditionV2,
  availableChoicesV2, availableQuestionsV2, availableHintsV2,
  availableInterpretationsV2, currentPassageV2, projectPlayerV2, seenProjectionV2,
} from './evidence-runtime';
export { exportPortableV2, importPortableV2, validateStateV2 } from './evidence-portable';
