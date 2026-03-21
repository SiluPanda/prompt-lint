import type { RuleDefinition, LintOptions } from '../types.js';

export const undefinedVariable: RuleDefinition = {
  id: 'undefined-variable',
  category: 'structure',
  defaultSeverity: 'warning',
  description: 'Warns when variables are used in the prompt but not defined in options.variables.',
  check(document, context, options?: LintOptions) {
    if (!options?.variables) return;

    const defined = new Set(Object.keys(options.variables));

    for (const variable of document.variables) {
      if (!defined.has(variable.name)) {
        for (const occurrence of variable.occurrences) {
          context.report({
            location: occurrence,
            message: `Variable "${variable.name}" is used but not defined in options.variables.`,
            suggestion: `Add "${variable.name}" to the variables configuration with its expected value.`,
          });
        }
      }
    }
  },
};
