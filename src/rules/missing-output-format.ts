import type { RuleDefinition } from '../types.js';

const GENERATION_VERBS = ['write', 'generate', 'create', 'produce', 'output', 'provide'];
const FORMAT_WORDS = [
  'json', 'yaml', 'markdown', 'list', 'table', 'csv', 'xml',
  'bullet', 'numbered', 'paragraph', 'html', 'text',
];

export const missingOutputFormat: RuleDefinition = {
  id: 'missing-output-format',
  category: 'clarity',
  defaultSeverity: 'warning',
  description: 'Warns when generation verbs appear without a specified output format.',
  check(document, context) {
    const text = document.source.toLowerCase();
    const hasFormat = FORMAT_WORDS.some((f) => text.includes(f));

    if (hasFormat) return;

    for (const verb of GENERATION_VERBS) {
      // Match the verb as a whole word
      const re = new RegExp(`\\b${verb}\\b`, 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(document.source)) !== null) {
        context.report({
          location: context.locationFromOffset(m.index, m.index + m[0].length),
          message: `Generation verb "${verb}" found without a specified output format.`,
          suggestion: 'Specify the desired output format (e.g., "respond in JSON", "write a markdown list").',
        });
      }
    }
  },
};
