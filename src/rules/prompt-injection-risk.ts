import type { RuleDefinition } from '../types.js';

const INJECTION_PATTERNS = [
  'ignore previous',
  'ignore all',
  'ignore the above',
  'disregard',
  'forget everything',
  'new instructions',
  'override',
  'ignore all previous instructions',
  'ignore your instructions',
  'do not follow',
];

export const promptInjectionRisk: RuleDefinition = {
  id: 'prompt-injection-risk',
  category: 'security',
  defaultSeverity: 'error',
  description: 'Detects patterns that could enable prompt injection attacks.',
  check(document, context) {
    const text = document.source.toLowerCase();
    for (const pattern of INJECTION_PATTERNS) {
      let searchFrom = 0;
      while (true) {
        const idx = text.indexOf(pattern, searchFrom);
        if (idx === -1) break;
        context.report({
          location: context.locationFromOffset(idx, idx + pattern.length),
          message: `Prompt injection risk: "${pattern}" found. This pattern can be exploited to override instructions.`,
          suggestion: 'Remove this phrase or ensure user input is properly delimited before using in a prompt.',
        });
        searchFrom = idx + pattern.length;
      }
    }
  },
};
