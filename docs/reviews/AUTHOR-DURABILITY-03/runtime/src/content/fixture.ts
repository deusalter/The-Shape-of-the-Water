import { validateContent } from '../engine/game';

// Noncanonical mechanical fixture, deliberately distinct from the literary case.
const result = validateContent({
  id: 'engine-fixture', title: 'The misplaced cup · noncanonical test fixture', version: 1, start: 'bench',
  scenes: [
    { id: 'bench', title: 'A bench in the workshop', paragraphs: ['A blue cup sits beside a dry ring. This small fixture tests the software; it is not part of the literary case.'], variants: [{ requires: ['water'], paragraphs: ['The cup is still beside the ring. You now know that rinse water makes the same mark.'] }], choices: [
      { id: 'cup', label: 'Inspect the cup and the ring.', target: 'bench', unless: ['cup-seen'], effects: ['cup-seen'], observation: { id: 'ring', text: 'The blue cup stood beside a dry ring.' } },
      { id: 'ask-gently', label: 'Ask the worker where the cup came from.', target: 'worker', unless: ['spoke'], effects: ['spoke', 'friendly'], relationship: { id: 'courtesy', text: 'You asked the worker without an accusation.' } },
      { id: 'accuse', label: 'Accuse the worker of taking the cup.', target: 'worker', unless: ['spoke'], effects: ['spoke', 'rebuffed'], relationship: { id: 'accusation', text: 'You accused the worker, who declined to help.' } },
      { id: 'inspect-drain', label: 'Inspect the rinse sink.', target: 'sink', requires: ['cup-seen'], effects: ['water'], observation: { id: 'rinse', text: 'Rinse water leaves the same blue ring.' } },
      { id: 'propose-rinse', label: 'Record that the ring may come from rinsing, rather than drinking.', target: 'bench', requires: ['water'], unless: ['read-ring'], effects: ['read-ring'], interpretation: { id: 'ring-reading', text: 'The ring can be explained by rinsing the cup.' } },
      { id: 'finish-fixture', label: 'Return the cup to the drying rack and finish.', target: 'finish', requires: ['water', 'read-ring'], ending: true },
    ] },
    { id: 'worker', title: 'The worker', paragraphs: ['The worker keeps sanding. “Look for yourself.”'], variants: [{ requires: ['friendly'], paragraphs: ['The worker points to the sink. “The blue coating washes off. Try the water.”'] }], choices: [{ id: 'return-worker', label: 'Return to the bench.', target: 'bench' }] },
    { id: 'sink', title: 'The rinse sink', paragraphs: ['A droplet dries blue on the white rim.'], choices: [{ id: 'return-sink', label: 'Return to the bench with this observation.', target: 'bench' }] },
    { id: 'finish', title: 'Cup returned', paragraphs: ['The cup dries on the rack. The original ring remains in your notes, along with your later reading of it.'], choices: [] },
  ],
});
if (!result.ok) throw new Error(result.errors.join('\n'));
export const fixtureContent = result.value;
