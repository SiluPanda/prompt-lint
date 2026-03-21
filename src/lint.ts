import { parse } from './parser.js';
import { resolveRules, runRules } from './rule-engine.js';
import { ALL_RULES } from './rules/index.js';
import type { LintOptions, LintReport, LintDiagnostic } from './types.js';

export function lint(options: LintOptions): LintReport {
  const start = Date.now();
  const document = parse(options.source);
  const resolvedSeverities = resolveRules(options);
  const rawDiagnostics = runRules(document, ALL_RULES, resolvedSeverities, options);

  // Sort: errors first, then warnings, then infos
  const severityOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };
  const diagnostics: LintDiagnostic[] = rawDiagnostics.slice().sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  );

  const summary = {
    total: diagnostics.length,
    errors: diagnostics.filter((d) => d.severity === 'error').length,
    warnings: diagnostics.filter((d) => d.severity === 'warning').length,
    infos: diagnostics.filter((d) => d.severity === 'info').length,
  };

  return {
    passed: summary.errors === 0,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - start,
    diagnostics,
    summary,
    document,
    preset: options.preset ?? 'recommended',
  };
}
