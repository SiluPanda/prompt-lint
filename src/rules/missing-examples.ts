import type { RuleDefinition } from '../types.js';

const EXAMPLE_MARKERS = [
  'example:', 'for example', 'e.g.', 'eg.', 'input:', 'output:', 'sample:',
  'for instance', 'such as', 'demonstration:',
];

const COMPLEX_THRESHOLD = 500;

export const missingExamples: RuleDefinition = {
  id: 'missing-examples',
  category: 'best-practice',
  defaultSeverity: 'info',
  description: 'Suggests adding examples when instructions are complex.',
  check(document, context) {
    if (document.characterCount < COMPLEX_THRESHOLD) return;

    const textLower = document.source.toLowerCase();
    const hasExample = EXAMPLE_MARKERS.some((marker) => textLower.includes(marker));

    if (!hasExample) {
      context.report({
        location: context.locationFromOffset(0, Math.min(50, document.source.length)),
        message: 'Complex prompt (>500 chars) has no examples. Adding examples improves model accuracy.',
        suggestion: 'Add one or more "Example:" blocks with sample inputs and expected outputs.',
      });
    }
  },
};
