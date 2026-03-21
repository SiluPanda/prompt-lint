import type { RuleDefinition } from '../types.js';

const RESPONSE_FORMATS = ['json', 'yaml', 'markdown', 'xml', 'csv', 'html', 'plain text', 'plain-text'];

export const contradictoryDirectives: RuleDefinition = {
  id: 'contradictory-directives',
  category: 'clarity',
  defaultSeverity: 'error',
  description: 'Detects contradictory directives such as always/never conflicts or format conflicts.',
  check(document, context) {
    const text = document.source.toLowerCase();

    // Check for "always" and "never" both present
    const alwaysIdx = text.indexOf('always');
    const neverIdx = text.indexOf('never');
    if (alwaysIdx !== -1 && neverIdx !== -1) {
      context.report({
        location: context.locationFromOffset(Math.min(alwaysIdx, neverIdx), Math.max(alwaysIdx, neverIdx) + 5),
        message: 'Contradictory directives: "always" and "never" both appear. Verify they do not conflict.',
        suggestion: 'Review the instructions to ensure "always" and "never" apply to different subjects.',
      });
    }

    // Check for conflicting format directives (e.g., "respond in json" AND "respond in yaml")
    const foundFormats: Array<{ format: string; idx: number }> = [];
    for (const fmt of RESPONSE_FORMATS) {
      const idx = text.indexOf(fmt);
      if (idx !== -1) {
        foundFormats.push({ format: fmt, idx });
      }
    }

    if (foundFormats.length > 1) {
      const first = foundFormats[0];
      const second = foundFormats[1];
      context.report({
        location: context.locationFromOffset(
          Math.min(first.idx, second.idx),
          Math.max(first.idx, second.idx) + second.format.length
        ),
        message: `Conflicting output format directives: "${first.format}" and "${second.format}" both specified.`,
        suggestion: 'Specify only one output format.',
      });
    }
  },
};
