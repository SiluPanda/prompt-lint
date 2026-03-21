import type { RuleDefinition } from '../types.js';

const ACTION_VERBS = [
  'analyze', 'write', 'generate', 'summarize', 'extract', 'classify',
  'translate', 'answer', 'explain', 'review', 'evaluate', 'compare',
  'create', 'identify', 'convert', 'describe', 'list', 'find',
];

export const missingTaskDefinition: RuleDefinition = {
  id: 'missing-task-definition',
  category: 'clarity',
  defaultSeverity: 'warning',
  description: 'Warns when no primary action verb is found to define the task.',
  check(document, context) {
    // Check system or first role content
    const firstRole = document.roles[0];
    if (!firstRole) return;

    const text = firstRole.content.toLowerCase();
    const hasVerb = ACTION_VERBS.some((v) => {
      const re = new RegExp(`\\b${v}\\b`);
      return re.test(text);
    });

    if (!hasVerb) {
      context.report({
        location: firstRole.location,
        message: 'No primary action verb found. The task is not clearly defined.',
        suggestion: `Add a clear action verb such as: ${ACTION_VERBS.slice(0, 5).join(', ')}, etc.`,
      });
    }
  },
};
