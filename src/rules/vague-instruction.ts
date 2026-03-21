import type { RuleDefinition } from '../types.js';

const VAGUE_PHRASES = [
  'be helpful',
  'do your best',
  'try to',
  'if possible',
  'as needed',
  'as appropriate',
  'feel free to',
  'whenever you can',
  'you may',
];

export const vagueInstruction: RuleDefinition = {
  id: 'vague-instruction',
  category: 'clarity',
  defaultSeverity: 'warning',
  description: 'Detects vague instructions that lack specificity.',
  check(document, context) {
    const text = document.source.toLowerCase();
    for (const phrase of VAGUE_PHRASES) {
      let searchFrom = 0;
      while (true) {
        const idx = text.indexOf(phrase, searchFrom);
        if (idx === -1) break;
        context.report({
          location: context.locationFromOffset(idx, idx + phrase.length),
          message: `Vague instruction: "${phrase}". Be explicit about what is required.`,
          suggestion: `Replace "${phrase}" with a specific, measurable directive.`,
        });
        searchFrom = idx + phrase.length;
      }
    }
  },
};
