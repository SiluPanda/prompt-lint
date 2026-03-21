import { describe, it, expect } from 'vitest';
import { lint } from '../../lint.js';

describe('vague-instruction rule', () => {
  it('detects "do your best"', () => {
    const report = lint({
      source: 'Do your best to answer the user question.',
      preset: 'recommended',
    });
    const diag = report.diagnostics.find((d) => d.ruleId === 'vague-instruction');
    expect(diag).toBeDefined();
    expect(diag!.severity).toBe('warning');
    expect(diag!.category).toBe('clarity');
  });

  it('detects "be helpful"', () => {
    const report = lint({
      source: 'Be helpful and answer all questions.',
      preset: 'recommended',
    });
    const diag = report.diagnostics.find((d) => d.ruleId === 'vague-instruction');
    expect(diag).toBeDefined();
    expect(diag!.message).toContain('be helpful');
  });

  it('detects "try to"', () => {
    const report = lint({
      source: 'Try to summarize the document in three sentences.',
      preset: 'recommended',
    });
    const vagueDiags = report.diagnostics.filter((d) => d.ruleId === 'vague-instruction');
    expect(vagueDiags.length).toBeGreaterThan(0);
  });

  it('detects "if possible"', () => {
    const report = lint({
      source: 'Translate the text if possible.',
      preset: 'recommended',
    });
    const diag = report.diagnostics.find((d) => d.ruleId === 'vague-instruction');
    expect(diag).toBeDefined();
  });

  it('does not trigger on specific instructions without vague phrases', () => {
    const report = lint({
      source: 'Summarize the document in exactly three bullet points.',
      preset: 'recommended',
    });
    const diag = report.diagnostics.find((d) => d.ruleId === 'vague-instruction');
    expect(diag).toBeUndefined();
  });

  it('provides a suggestion', () => {
    const report = lint({
      source: 'Be helpful at all times.',
      preset: 'recommended',
    });
    const diag = report.diagnostics.find((d) => d.ruleId === 'vague-instruction');
    expect(diag!.suggestion).toBeDefined();
    expect(diag!.suggestion!.length).toBeGreaterThan(0);
  });

  it('detects multiple vague phrases in one prompt', () => {
    const report = lint({
      source: 'Be helpful and try to do your best when answering.',
      preset: 'recommended',
    });
    const vagueDiags = report.diagnostics.filter((d) => d.ruleId === 'vague-instruction');
    expect(vagueDiags.length).toBeGreaterThanOrEqual(3);
  });

  it('is off when preset is off', () => {
    const report = lint({
      source: 'Be helpful.',
      preset: 'off',
    });
    const diag = report.diagnostics.find((d) => d.ruleId === 'vague-instruction');
    expect(diag).toBeUndefined();
  });
});
