import type { RuleDefinition, LintOptions } from '../types.js';

const DEFAULT_TOKEN_LIMIT = 2000;

export const excessiveLength: RuleDefinition = {
  id: 'excessive-length',
  category: 'efficiency',
  defaultSeverity: 'warning',
  description: 'Warns when the prompt exceeds the recommended token limit.',
  check(document, context, options?: LintOptions) {
    void options;
    const limit = DEFAULT_TOKEN_LIMIT;
    if (document.estimatedTokens > limit) {
      context.report({
        location: context.locationFromOffset(0, document.source.length),
        message: `Prompt is too long: ~${document.estimatedTokens} estimated tokens exceeds the limit of ${limit}.`,
        suggestion: 'Split the prompt into smaller, focused prompts or reduce verbosity.',
      });
    }
  },
};
