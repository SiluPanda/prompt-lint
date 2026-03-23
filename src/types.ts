export type Severity = 'error' | 'warning' | 'info' | 'off';
export type RuleCategory = 'clarity' | 'security' | 'structure' | 'efficiency' | 'best-practice';

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string;
}

export interface AnthropicPrompt {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export type PromptSource = string | PromptMessage[] | AnthropicPrompt;

export interface SourceLocation {
  startOffset: number;
  endOffset: number;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface LintDiagnostic {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  category: RuleCategory;
  location: SourceLocation;
  message: string;
  suggestion?: string;
}

export interface LintSummary {
  total: number;
  errors: number;
  warnings: number;
  infos: number;
}

export interface PromptDocument {
  source: string;
  format: 'plain-text' | 'message-array' | 'anthropic';
  roles: Array<{ role: string; content: string; location: SourceLocation }>;
  variables: Array<{ name: string; syntax: string; occurrences: SourceLocation[] }>;
  estimatedTokens: number;
  characterCount: number;
}

export interface LintReport {
  passed: boolean;
  timestamp: string;
  durationMs: number;
  diagnostics: LintDiagnostic[];
  summary: LintSummary;
  document: PromptDocument;
  preset: string;
}

export interface LintOptions {
  source: PromptSource;
  preset?: 'recommended' | 'strict' | 'security-only' | 'minimal' | 'off';
  rules?: Record<string, { severity?: Severity } | Severity>;
  variables?: Record<string, { required?: boolean }>;
}

export interface RuleContext {
  report(diagnostic: Omit<LintDiagnostic, 'ruleId' | 'severity' | 'category'>): void;
  locationFromOffset(start: number, end: number): SourceLocation;
}

export interface RuleDefinition {
  id: string;
  category: RuleCategory;
  defaultSeverity: Severity;
  description: string;
  check(document: PromptDocument, context: RuleContext, options?: LintOptions): void;
}
