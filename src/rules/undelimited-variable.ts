import type { RuleDefinition } from '../types.js';

const USER_INPUT_KEYWORDS = [
  'user', 'input', 'query', 'request', 'message', 'text', 'content', 'data',
];

function isDelimited(source: string, varSyntax: string, offset: number): boolean {
  const before = source.slice(Math.max(0, offset - 30), offset);
  const end = offset + varSyntax.length;
  const after = source.slice(end, Math.min(source.length, end + 30));

  // Check XML tags: <tag>{{var}}</tag>
  if (/<[a-z_]+>\s*$/i.test(before) && /^\s*<\/[a-z_]+>/i.test(after)) return true;
  // Check quotes
  if (/['"`]\s*$/.test(before) && /^\s*['"`]/.test(after)) return true;
  // Check code fences
  if (/```\s*$/.test(before) && /^\s*```/.test(after)) return true;
  return false;
}

export const undelimitedVariable: RuleDefinition = {
  id: 'undelimited-variable',
  category: 'security',
  defaultSeverity: 'warning',
  description: 'Warns when user-input variables are not surrounded by delimiters.',
  check(document, context) {
    for (const variable of document.variables) {
      const nameLower = variable.name.toLowerCase();
      const isUserInput = USER_INPUT_KEYWORDS.some((kw) => nameLower.includes(kw));
      if (!isUserInput) continue;

      for (const occurrence of variable.occurrences) {
        const syntaxText = document.source.slice(occurrence.startOffset, occurrence.endOffset);
        if (!isDelimited(document.source, syntaxText, occurrence.startOffset)) {
          context.report({
            location: occurrence,
            message: `User-input variable "${variable.name}" is not delimited, creating an injection risk.`,
            suggestion: `Wrap the variable with XML tags: <user_input>${syntaxText}</user_input>`,
          });
        }
      }
    }
  },
};
