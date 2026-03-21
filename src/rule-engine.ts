import type { RuleDefinition, LintOptions, LintDiagnostic, PromptDocument, Severity } from './types.js';
import { locationFromOffset } from './parser.js';

const PRESET_RULES: Record<string, Record<string, Severity>> = {
  recommended: {
    'vague-instruction': 'warning',
    'missing-output-format': 'warning',
    'missing-task-definition': 'warning',
    'contradictory-directives': 'error',
    'undelimited-variable': 'warning',
    'prompt-injection-risk': 'error',
    'excessive-length': 'warning',
    'missing-examples': 'info',
    'undefined-variable': 'warning',
    'repeated-instructions': 'info',
  },
  strict: {
    'vague-instruction': 'error',
    'missing-output-format': 'error',
    'missing-task-definition': 'error',
    'contradictory-directives': 'error',
    'undelimited-variable': 'error',
    'prompt-injection-risk': 'error',
    'excessive-length': 'error',
    'missing-examples': 'warning',
    'undefined-variable': 'error',
    'repeated-instructions': 'warning',
  },
  'security-only': {
    'vague-instruction': 'off',
    'missing-output-format': 'off',
    'missing-task-definition': 'off',
    'contradictory-directives': 'off',
    'undelimited-variable': 'error',
    'prompt-injection-risk': 'error',
    'excessive-length': 'off',
    'missing-examples': 'off',
    'undefined-variable': 'off',
    'repeated-instructions': 'off',
  },
  minimal: {
    'vague-instruction': 'off',
    'missing-output-format': 'off',
    'missing-task-definition': 'off',
    'contradictory-directives': 'error',
    'undelimited-variable': 'off',
    'prompt-injection-risk': 'error',
    'excessive-length': 'off',
    'missing-examples': 'off',
    'undefined-variable': 'off',
    'repeated-instructions': 'off',
  },
  off: {},
};

const ALL_RULE_IDS = [
  'vague-instruction',
  'missing-output-format',
  'missing-task-definition',
  'contradictory-directives',
  'undelimited-variable',
  'prompt-injection-risk',
  'excessive-length',
  'missing-examples',
  'undefined-variable',
  'repeated-instructions',
];

export function resolveRules(options: LintOptions): Map<string, Severity> {
  const preset = options.preset ?? 'recommended';

  // For the 'off' preset, all rules default to 'off'.
  // For any known preset, use its table. Unknown presets fall back to recommended.
  const baseRules: Record<string, Severity> =
    preset === 'off'
      ? Object.fromEntries(ALL_RULE_IDS.map((id) => [id, 'off' as Severity]))
      : (PRESET_RULES[preset] ?? PRESET_RULES['recommended']);

  const resolved = new Map<string, Severity>(Object.entries(baseRules));

  // Any rule not explicitly listed in the preset defaults to 'off' (not its rule default).
  for (const id of ALL_RULE_IDS) {
    if (!resolved.has(id)) {
      resolved.set(id, 'off');
    }
  }

  // Apply user overrides
  if (options.rules) {
    for (const [ruleId, config] of Object.entries(options.rules)) {
      if (typeof config === 'string') {
        resolved.set(ruleId, config as Severity);
      } else if (typeof config === 'object' && config.severity) {
        resolved.set(ruleId, config.severity);
      }
    }
  }

  return resolved;
}

export function runRules(
  document: PromptDocument,
  rules: RuleDefinition[],
  resolvedSeverities: Map<string, Severity>,
  options?: LintOptions
): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];

  for (const rule of rules) {
    const severity = resolvedSeverities.get(rule.id) ?? 'off';
    if (severity === 'off') continue;

    const collected: Omit<LintDiagnostic, 'ruleId' | 'severity' | 'category'>[] = [];

    const ruleContext = {
      report(d: Omit<LintDiagnostic, 'ruleId' | 'severity' | 'category'>) {
        collected.push(d);
      },
      locationFromOffset(start: number, end: number) {
        return locationFromOffset(document.source, start, end);
      },
    };

    rule.check(document, ruleContext, options);

    for (const d of collected) {
      diagnostics.push({
        ...d,
        ruleId: rule.id,
        severity: severity as 'error' | 'warning' | 'info',
        category: rule.category,
      });
    }
  }

  return diagnostics;
}
