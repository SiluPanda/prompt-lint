import type { RuleDefinition } from '../types.js';

const REPEAT_THRESHOLD = 3;
const MIN_PHRASE_LENGTH = 10;

export const repeatedInstructions: RuleDefinition = {
  id: 'repeated-instructions',
  category: 'efficiency',
  defaultSeverity: 'info',
  description: 'Detects instructions repeated 3 or more times.',
  check(document, context) {
    const text = document.source;
    const textLower = text.toLowerCase();

    // Split into sentences/clauses
    const sentences = textLower
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= MIN_PHRASE_LENGTH);

    const counts = new Map<string, number>();
    for (const sentence of sentences) {
      counts.set(sentence, (counts.get(sentence) ?? 0) + 1);
    }

    for (const [phrase, count] of counts.entries()) {
      if (count >= REPEAT_THRESHOLD) {
        // Find first occurrence in original text
        const idx = textLower.indexOf(phrase);
        if (idx === -1) continue;
        context.report({
          location: context.locationFromOffset(idx, idx + phrase.length),
          message: `Instruction repeated ${count} times: "${phrase.slice(0, 60)}..."`,
          suggestion: 'Consolidate repeated instructions into a single directive.',
        });
      }
    }
  },
};
