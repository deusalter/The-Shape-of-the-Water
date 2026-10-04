import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EvidencePlayer } from '../src/components/EvidencePlayer';
import { InvestigationNotebook } from '../src/components/InvestigationNotebook';
import { occasionFixture as content } from '../src/engine/evidence-occasion-fixture';
import { createGameV2, projectPlayerV2 } from '../src/engine/evidence-v2';

vi.mock('../src/engine/evidence-v2', async original => {
  const actual = await original<typeof import('../src/engine/evidence-v2')>();
  return { ...actual, projectPlayerV2: vi.fn(actual.projectPlayerV2) };
});

beforeEach(() => { vi.mocked(projectPlayerV2).mockClear(); });

describe('initial reading UI', () => {
  it('shows each current passage once while notebook and transcript remain unopened', () => {
    const state = createGameV2(content);
    const passage = state.transcript.find(entry => entry.kind === 'passage');
    if (!passage || passage.kind !== 'passage') throw Error('Opening passage must exist');
    const markup = renderToStaticMarkup(createElement(EvidencePlayer, { content, preview: true }));
    expect(markup).toContain('aria-controls="investigation-notebook"');
    expect(markup).toContain('id="investigation-notebook"');
    expect(markup).not.toContain('id="evidence-title"');
    expect(markup).toContain('Read encountered transcript (1 passages)');
    for (const paragraph of passage.paragraphs) {
      const renderedParagraph = renderToStaticMarkup(createElement('p', null, paragraph));
      expect(markup.split(renderedParagraph)).toHaveLength(2);
    }
    expect(markup).not.toContain('UNSEEN_');
    expect(markup).not.toContain('PRIVATE_TITLE');
    expect(projectPlayerV2).toHaveBeenCalledTimes(1);
  });

  it('renders the exact supplied encountered projection without repeating engine projection', () => {
    const state = createGameV2(content);
    const projection = projectPlayerV2(content, state);
    vi.mocked(projectPlayerV2).mockClear();
    const markup = renderToStaticMarkup(createElement(InvestigationNotebook, { content, state, projection, disabled: false, onAction: () => {} }));
    expect(markup).toContain('Encountered evidence');
    expect(markup).toContain('First visit');
    expect(markup).not.toContain('UNSEEN_');
    expect(projectPlayerV2).not.toHaveBeenCalled();
  });
});
