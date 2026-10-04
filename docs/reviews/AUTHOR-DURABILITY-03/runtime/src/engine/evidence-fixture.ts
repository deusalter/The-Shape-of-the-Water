import { validateContentV2 } from './evidence-validate';

// Noncanonical mechanical material. This module is never imported by the player.
const result = validateContentV2({
  schemaVersion: 2, id: 'evidence-fixture', title: 'Noncanonical selected-evidence fixture', version: 2, start: 'bench',
  beliefIds: ['worker-private-belief', 'cup-was-drunk-from'],
  characters: [
    { id: 'worker', name: 'Worker', initial: { knows: ['worker-private'], believes: ['worker-private-belief'], claims: [] } },
    { id: 'witness', name: 'Witness', initial: { knows: [], believes: ['cup-was-drunk-from'], claims: [] } },
  ],
  sources: [
    { id: 'ring', title: 'Dry ring', text: 'The blue cup stood beside a dry ring.', kind: 'observation', provenanceId: 'bench-inspection' },
    { id: 'rinse', title: 'Rinse test', text: 'Rinse water leaves the same blue ring.', kind: 'observation', provenanceId: 'sink-test' },
    { id: 'film', title: 'Recorded rinse', text: 'A recording shows the cup being rinsed. UNSEEN_FILM_SENTINEL', kind: 'document', provenanceId: 'camera-recording' },
    { id: 'aside', title: 'Sanding dust', text: 'Sanding dust lies below the bench.', kind: 'observation', provenanceId: 'dust-inspection' },
    { id: 'corroboration', title: 'Water bottle', text: 'The rinse bottle is almost empty.', kind: 'observation', provenanceId: 'bottle-inspection' },
    { id: 'testimony', title: 'Witness statement', text: 'The witness says the cup was rinsed.', kind: 'statement', provenanceId: 'witness-account', speakerId: 'witness', claimIds: ['cup-was-drunk-from'] },
    { id: 'copy', title: 'Statement transcription', text: 'A transcription repeats the witness statement.', kind: 'document', provenanceId: 'witness-account' },
    { id: 'worker-private', title: 'PRIVATE_TITLE_SENTINEL', text: 'PRIVATE_NPC_SENTINEL', kind: 'document', provenanceId: 'private-history' },
  ],
  questions: [
    {
      id: 'ring-account', text: 'What supports an account of the ring?',
      candidates: [
        { id: 'rinsing', text: 'Rinsing can explain the ring.' },
        { id: 'drinking', text: 'Only drinking can explain the ring.', contradictedBy: ['rinse', 'film'] },
      ],
      supportedCandidateId: 'rinsing',
      proof: { op: 'any', args: [{ op: 'all', args: [{ op: 'ref', refId: 'ring' }, { op: 'ref', refId: 'rinse' }] }, { op: 'ref', refId: 'film' }] },
      allowedCorroborators: ['corroboration'],
      feedback: [
        { code: 'premature', text: 'Your selected ring records an appearance, not yet its cause.', mentions: ['ring'] },
        { code: 'unsupported', text: 'UNSEEN_FEEDBACK_SENTINEL', when: { op: 'hasSource', id: 'film' }, mentions: ['film'] },
      ], effects: ['account-supported'],
    },
    {
      id: 'independence-account', text: 'Are these independent accounts?', when: { op: 'hasSource', id: 'copy' },
      candidates: [{ id: 'independent', text: 'Independent origins support the account.' }], supportedCandidateId: 'independent',
      proof: { op: 'all', independent: true, args: [{ op: 'any', args: [{ op: 'ref', refId: 'testimony' }, { op: 'ref', refId: 'film' }] }, { op: 'ref', refId: 'copy' }] },
      allowedCorroborators: [], feedback: [],
    },
    {
      id: 'ancestry-account', text: 'Does the recorded account add an independent origin?', when: { op: 'hasDeduction', id: 'ring-account' },
      candidates: [{ id: 'independent-ancestry', text: 'The account and ring have independent origins.' }], supportedCandidateId: 'independent-ancestry',
      proof: { op: 'all', independent: true, args: [{ op: 'ref', refId: 'ring-account' }, { op: 'ref', refId: 'ring' }] },
      allowedCorroborators: [], feedback: [],
    },
  ],
  interpretationRules: [
    { id: 'ring-reading', title: 'Reconsider the ring', text: 'The ring can be explained by rinsing. UNSEEN_READING_SENTINEL', when: { op: 'hasSource', id: 'rinse' }, relatedRefs: ['ring', 'rinse'], effects: ['reading-ready'] },
    { id: 'second-reading', title: 'Read the first reading again', text: 'A reading changes your question; it does not erase the dry ring.', when: { op: 'interpretationAvailable', id: 'ring-reading' }, relatedRefs: ['ring'], effects: ['second-ready'] },
  ],
  hints: [
    { id: 'ring-hint', label: 'Consider the ring', questionId: 'ring-account', when: { op: 'always' }, mentions: ['ring'], text: 'Keep the recorded appearance separate from an account of its cause.', reveals: false },
    { id: 'later-hint', label: 'Compare the two observations', questionId: 'ring-account', when: { op: 'hasSource', id: 'rinse' }, mentions: ['ring', 'rinse'], text: 'LATER_HINT_SENTINEL: compare the dry ring with your test.', reveals: false },
    { id: 'film-reveal', label: 'Reveal the recording', questionId: 'ring-account', when: { op: 'always' }, mentions: ['ring'], text: 'EXPLICIT_REVEAL_SENTINEL: this recording shows a rinse.', reveals: true, sourceIds: ['film'] },
  ],
  scenes: [
    {
      id: 'bench', title: 'A bench in the workshop', paragraphs: ['The cup stands beside a dry ring. ORIGINAL_PASSAGE_SENTINEL'], paragraphIds: ['bench.original'], sourceIds: ['ring'],
      variants: [{ id: 'bench.after-rinse', requires: ['water'], paragraphs: ['The ring remains. You have tested the rinse water. REVISIT_PASSAGE_SENTINEL'], paragraphIds: ['bench.revisited'] }],
      choices: [
        { id: 'cup', label: 'Inspect the cup.', target: 'bench', unless: ['cup-seen'], effects: ['cup-seen'], observation: { id: 'ring', text: 'The blue cup stood beside a dry ring.' } },
        { id: 'test-rinse', label: 'Test the rinse water.', target: 'sink', actions: [{ type: 'acquireSource', sourceId: 'rinse' }], effects: ['water'] },
        { id: 'record-film', label: 'Consult the recording.', target: 'bench', actions: [{ type: 'acquireSource', sourceId: 'film' }] },
        { id: 'inspect-aside', label: 'Inspect the sanding dust.', target: 'bench', actions: [{ type: 'acquireSource', sourceId: 'aside' }] },
        { id: 'inspect-bottle', label: 'Inspect the rinse bottle.', target: 'bench', actions: [{ type: 'acquireSource', sourceId: 'corroboration' }] },
        { id: 'ask-gently', label: 'Ask the witness privately.', target: 'bench', unless: ['rebuffed'], actions: [{ type: 'acquireSource', sourceId: 'testimony' }], relationship: { id: 'courtesy', text: 'You asked without accusation.' } },
        { id: 'accuse', label: 'Accuse the witness.', target: 'worker', effects: ['rebuffed'], relationship: { id: 'accusation', text: 'The witness declined to help.' } },
        { id: 'read-copy', label: 'Read the transcription.', target: 'bench', actions: [{ type: 'acquireSource', sourceId: 'copy' }] },
        { id: 'visit-worker', label: 'Visit the worker.', target: 'worker' },
        { id: 'disclose-worker', label: 'Share the witness statement with the worker.', target: 'worker', when: { op: 'hasSource', id: 'testimony' }, actions: [{ type: 'disclose', characterId: 'worker', refId: 'testimony' }, { type: 'setBelief', characterId: 'worker', beliefId: 'cup-was-drunk-from', value: true }] },
        { id: 'finish', label: 'Return the cup and finish.', target: 'finish', requires: ['account-supported'], ending: true },
      ],
    },
    { id: 'sink', title: 'The rinse sink', paragraphs: ['A droplet dries blue on the white rim.'], choices: [{ id: 'return-sink', label: 'Return to the bench.', target: 'bench' }] },
    { id: 'worker', title: 'The worker', paragraphs: ['The worker answers without knowing your private conversation.'], variants: [{ id: 'worker.informed', requires: [], when: { op: 'npcKnows', characterId: 'worker', refId: 'testimony' }, paragraphs: ['The worker responds to the statement you actually shared. DISCLOSED_RESPONSE_SENTINEL'] }], choices: [{ id: 'return-worker', label: 'Return to the bench.', target: 'bench' }] },
    { id: 'finish', title: 'Cup returned', paragraphs: ['The cup dries on the rack.'], choices: [] },
  ],
});
if (!result.ok) throw new Error(result.errors.join('\n'));
export const evidenceFixture = result.value;
