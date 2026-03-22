# prompt-lint

Static analysis for LLM prompts. Catch clarity, security, structure, efficiency, and best-practice issues before your prompts reach production.

[![npm version](https://img.shields.io/npm/v/prompt-lint.svg)](https://www.npmjs.com/package/prompt-lint)
[![license](https://img.shields.io/npm/l/prompt-lint.svg)](https://github.com/SiluPanda/prompt-lint/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/prompt-lint.svg)](https://nodejs.org)
[![types](https://img.shields.io/npm/types/prompt-lint.svg)](https://www.npmjs.com/package/prompt-lint)

---

## Description

`prompt-lint` is a zero-dependency, deterministic linting engine for LLM prompts. It parses prompt text -- whether a plain string, an OpenAI-style message array, or an Anthropic-style prompt object -- into a structured intermediate representation, then evaluates it against a configurable set of rules. Rules detect vague instructions, prompt injection vulnerabilities, missing output format specifications, contradictory directives, template variable errors, excessive length, and repeated instructions.

The result is a structured `LintReport` with per-rule diagnostics, severity levels, source locations, and fix suggestions -- suitable for programmatic use in CI/CD pipelines, code review tooling, and prompt management systems.

No LLM API calls are made. Analysis runs entirely offline in milliseconds.

---

## Installation

```bash
npm install prompt-lint
```

Requires Node.js >= 18.

---

## Quick Start

```typescript
import { lint } from 'prompt-lint';

const report = lint({
  source: 'Be helpful and try to answer the user question.',
  preset: 'recommended',
});

console.log(report.passed);
// false -- vague instructions detected

console.log(report.summary);
// { total: 2, errors: 0, warnings: 2, infos: 0 }

console.log(report.diagnostics[0]);
// {
//   ruleId: 'vague-instruction',
//   severity: 'warning',
//   category: 'clarity',
//   message: 'Vague instruction: "be helpful". Be explicit about what is required.',
//   suggestion: 'Replace "be helpful" with a specific, measurable directive.',
//   location: { startLine: 1, startColumn: 1, ... }
// }
```

---

## Features

- **10 built-in rules** covering clarity, security, structure, efficiency, and best practices
- **Multiple prompt formats** -- plain text, OpenAI message arrays, and Anthropic prompt objects
- **Template variable detection** -- `{{var}}`, `${var}`, `{var}`, and `%(var)s` syntaxes
- **Configurable presets** -- `recommended`, `strict`, `security-only`, `minimal`, and `off`
- **Per-rule severity overrides** -- promote, demote, or disable individual rules
- **Structured output** -- every diagnostic includes rule ID, severity, category, source location, message, and optional suggestion
- **Zero dependencies** -- uses only Node.js built-ins at runtime
- **TypeScript-first** -- full type definitions included, all exports are strongly typed
- **Fast** -- deterministic, pattern-based analysis runs in milliseconds with no API calls

---

## API Reference

### `lint(options: LintOptions): LintReport`

The primary entry point. Parses the prompt source, resolves rule configuration from the selected preset and any overrides, runs all enabled rules, and returns a structured report.

```typescript
import { lint } from 'prompt-lint';

const report = lint({
  source: 'Summarize the following document in JSON format.',
  preset: 'strict',
  rules: {
    'missing-examples': 'off',
  },
});
```

### `parse(source: PromptSource): PromptDocument`

Parses a prompt source into a `PromptDocument` without running any lint rules. Useful for inspecting the parsed structure, extracting variables, or building custom analysis on top of the parsed representation.

```typescript
import { parse } from 'prompt-lint';

const doc = parse('Answer the question: {{user_query}}');

console.log(doc.format);          // 'plain-text'
console.log(doc.variables);       // [{ name: 'user_query', syntax: '{{}}', occurrences: [...] }]
console.log(doc.estimatedTokens); // 9
console.log(doc.roles);           // [{ role: 'system', content: '...', location: {...} }]
```

### Types

All types are exported from the package root.

#### `LintOptions`

```typescript
interface LintOptions {
  source: PromptSource;
  preset?: 'recommended' | 'strict' | 'security-only' | 'minimal' | 'off';
  rules?: Record<string, { severity?: Severity } | Severity>;
  variables?: Record<string, { required?: boolean }>;
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `source` | `PromptSource` | (required) | The prompt to lint. See Prompt Source Formats below. |
| `preset` | `string` | `'recommended'` | Base rule configuration preset. |
| `rules` | `Record` | `undefined` | Per-rule severity overrides applied on top of the preset. |
| `variables` | `Record` | `undefined` | Declared variables for the `undefined-variable` rule. |

#### `PromptSource`

```typescript
type PromptSource = string | PromptMessage[] | AnthropicPrompt | { file: string };
```

Accepted input formats:

| Format | Example |
|---|---|
| Plain text string | `'Analyze the following document.'` |
| OpenAI message array | `[{ role: 'system', content: '...' }, { role: 'user', content: '...' }]` |
| Anthropic prompt object | `{ system: '...', messages: [{ role: 'user', content: '...' }] }` |
| File reference | `{ file: './prompt.txt' }` |

#### `PromptMessage`

```typescript
interface PromptMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string;
}
```

#### `AnthropicPrompt`

```typescript
interface AnthropicPrompt {
  system: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}
```

#### `LintReport`

```typescript
interface LintReport {
  passed: boolean;          // true when there are zero errors (warnings and infos do not fail)
  timestamp: string;        // ISO 8601 timestamp
  durationMs: number;       // analysis duration in milliseconds
  diagnostics: LintDiagnostic[];
  summary: LintSummary;
  document: PromptDocument; // the parsed prompt representation
  preset: string;           // the preset that was used
}
```

#### `LintDiagnostic`

```typescript
interface LintDiagnostic {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  category: RuleCategory;
  location: SourceLocation;
  message: string;
  suggestion?: string;
}
```

#### `LintSummary`

```typescript
interface LintSummary {
  total: number;
  errors: number;
  warnings: number;
  infos: number;
}
```

#### `PromptDocument`

```typescript
interface PromptDocument {
  source: string;
  format: 'plain-text' | 'message-array' | 'anthropic';
  roles: Array<{ role: string; content: string; location: SourceLocation }>;
  variables: Array<{ name: string; syntax: string; occurrences: SourceLocation[] }>;
  estimatedTokens: number;
  characterCount: number;
}
```

#### `SourceLocation`

```typescript
interface SourceLocation {
  startOffset: number;
  endOffset: number;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
```

#### `Severity`

```typescript
type Severity = 'error' | 'warning' | 'info' | 'off';
```

#### `RuleCategory`

```typescript
type RuleCategory = 'clarity' | 'security' | 'structure' | 'efficiency' | 'best-practice';
```

#### `RuleContext`

```typescript
interface RuleContext {
  report(diagnostic: Omit<LintDiagnostic, 'ruleId' | 'severity' | 'category'>): void;
  locationFromOffset(start: number, end: number): SourceLocation;
}
```

#### `RuleDefinition`

```typescript
interface RuleDefinition {
  id: string;
  category: RuleCategory;
  defaultSeverity: Severity;
  description: string;
  check(document: PromptDocument, context: RuleContext, options?: LintOptions): void;
}
```

---

## Configuration

### Presets

Presets define the base severity for all 10 built-in rules. Select a preset with the `preset` option.

#### `recommended` (default)

Balanced configuration for production use. All rules are enabled at reasonable severity levels.

| Rule | Severity |
|---|---|
| `vague-instruction` | warning |
| `missing-output-format` | warning |
| `missing-task-definition` | warning |
| `contradictory-directives` | error |
| `undelimited-variable` | warning |
| `prompt-injection-risk` | error |
| `excessive-length` | warning |
| `missing-examples` | info |
| `undefined-variable` | warning |
| `repeated-instructions` | info |

#### `strict`

All rules elevated to error or warning. Suitable for enforcing high-quality standards in CI.

| Rule | Severity |
|---|---|
| `vague-instruction` | error |
| `missing-output-format` | error |
| `missing-task-definition` | error |
| `contradictory-directives` | error |
| `undelimited-variable` | error |
| `prompt-injection-risk` | error |
| `excessive-length` | error |
| `missing-examples` | warning |
| `undefined-variable` | error |
| `repeated-instructions` | warning |

#### `security-only`

Only security-focused rules are enabled. All other rules are disabled.

| Rule | Severity |
|---|---|
| `undelimited-variable` | error |
| `prompt-injection-risk` | error |
| All others | off |

#### `minimal`

Only the most critical rules. Catches contradictions and injection risks.

| Rule | Severity |
|---|---|
| `contradictory-directives` | error |
| `prompt-injection-risk` | error |
| All others | off |

#### `off`

All rules disabled. Useful as a base when enabling only specific rules via overrides.

### Per-Rule Overrides

Override individual rule severities on top of any preset using the `rules` option. Accepts either a severity string or an object with a `severity` field.

```typescript
lint({
  source: '...',
  preset: 'recommended',
  rules: {
    'vague-instruction': 'error',             // string form
    'missing-examples': { severity: 'off' },  // object form
    'repeated-instructions': 'warning',
  },
});
```

### Variable Declarations

Pass known template variables via the `variables` option to enable the `undefined-variable` rule. Any variable used in the prompt that is not listed in this map will be reported.

```typescript
lint({
  source: 'Answer {{user_query}} with context from {{knowledge_base}}.',
  variables: {
    user_query: { required: true },
    knowledge_base: { required: false },
  },
});
```

---

## Rules

### Clarity Rules

#### `vague-instruction`

Detects vague, non-specific phrases that weaken prompt effectiveness. Flagged phrases: "be helpful", "do your best", "try to", "if possible", "as needed", "as appropriate", "feel free to", "whenever you can", "you may".

Each occurrence is reported individually with a suggestion to replace the vague phrase with a specific, measurable directive.

#### `missing-output-format`

Warns when generation verbs (`write`, `generate`, `create`, `produce`, `output`, `provide`) appear in the prompt but no output format keyword is found. Format keywords include: `json`, `yaml`, `markdown`, `list`, `table`, `csv`, `xml`, `bullet`, `numbered`, `paragraph`, `html`, `text`.

If any format keyword is present anywhere in the prompt, the rule does not fire.

#### `missing-task-definition`

Warns when the first role block (typically the system message) contains no primary action verb. The rule looks for: `analyze`, `write`, `generate`, `summarize`, `extract`, `classify`, `translate`, `answer`, `explain`, `review`, `evaluate`, `compare`, `create`, `identify`, `convert`, `describe`, `list`, `find`.

#### `contradictory-directives`

Detects two categories of contradictions:

1. **Always/never conflicts** -- both "always" and "never" appear in the prompt. While they may apply to different subjects, this pattern is flagged for manual review.
2. **Format conflicts** -- multiple output format directives are detected (e.g., both "json" and "yaml" appear), suggesting conflicting format requirements.

### Security Rules

#### `prompt-injection-risk`

Detects phrases commonly used in prompt injection attacks: "ignore previous", "ignore all", "ignore the above", "disregard", "forget everything", "new instructions", "override", "ignore all previous instructions", "ignore your instructions", "do not follow".

Each occurrence is reported as an error with a suggestion to remove the phrase or ensure user input is properly delimited.

#### `undelimited-variable`

Warns when template variables whose names suggest user input (containing: `user`, `input`, `query`, `request`, `message`, `text`, `content`, `data`) are not wrapped in protective delimiters. Recognized delimiters include XML tags, quotes (`'`, `"`, `` ` ``), and code fences (` ``` `).

This rule helps prevent prompt injection by ensuring user-controlled content is clearly bounded.

### Structure Rules

#### `undefined-variable`

When `options.variables` is provided, reports any template variable used in the prompt that is not listed in the variables map. This catches typos in variable names and undeclared variables that would fail at runtime.

This rule only fires when the `variables` option is explicitly provided.

### Efficiency Rules

#### `excessive-length`

Warns when the estimated token count exceeds 2,000 tokens. Token count is estimated as `Math.ceil(characterCount / 4)`. Suggests splitting into smaller, focused prompts or reducing verbosity.

#### `repeated-instructions`

Detects instructions (sentences or clauses of 10+ characters) that appear 3 or more times in the prompt. Repeated instructions waste tokens and can confuse model behavior. Suggests consolidating into a single directive.

### Best-Practice Rules

#### `missing-examples`

When a prompt exceeds 500 characters but contains no example markers, suggests adding few-shot examples. Recognized markers: `example:`, `for example`, `e.g.`, `eg.`, `input:`, `output:`, `sample:`, `for instance`, `such as`, `demonstration:`.

---

## Error Handling

The `lint()` function is synchronous and does not throw under normal operation. The `passed` field on `LintReport` indicates whether the prompt passed linting:

- `passed: true` -- zero errors were found (warnings and infos do not cause failure)
- `passed: false` -- one or more errors were found

To gate a CI pipeline on lint results:

```typescript
import { lint } from 'prompt-lint';

const report = lint({ source: promptText, preset: 'strict' });

if (!report.passed) {
  console.error(`Lint failed: ${report.summary.errors} error(s) found.`);
  for (const d of report.diagnostics.filter(d => d.severity === 'error')) {
    console.error(`  [${d.ruleId}] line ${d.location.startLine}: ${d.message}`);
  }
  process.exit(1);
}
```

Diagnostics are sorted by severity (errors first, then warnings, then infos), making it straightforward to process the most critical issues first.

---

## Advanced Usage

### Linting OpenAI Message Arrays

```typescript
import { lint } from 'prompt-lint';

const report = lint({
  source: [
    { role: 'system', content: 'You are a helpful assistant. Try to be concise.' },
    { role: 'user', content: 'Summarize this document.' },
  ],
  preset: 'recommended',
});

// Detected format:
console.log(report.document.format); // 'message-array'
```

### Linting Anthropic Prompts

```typescript
import { lint } from 'prompt-lint';

const report = lint({
  source: {
    system: 'You are an expert analyst. Be helpful and thorough.',
    messages: [
      { role: 'user', content: 'Analyze the quarterly revenue data.' },
    ],
  },
  preset: 'strict',
});

console.log(report.document.format); // 'anthropic'
```

### Linting Prompts with Template Variables

```typescript
import { lint } from 'prompt-lint';

const report = lint({
  source: 'Answer {{user_query}} using context from {{knowledge_base}} and {{typo_var}}.',
  variables: {
    user_query: { required: true },
    knowledge_base: { required: true },
  },
});

// The 'undefined-variable' rule will report 'typo_var' as undefined.
// The 'undelimited-variable' rule will flag 'user_query' as undelimited user input.
```

### Security-Only Scanning

```typescript
import { lint } from 'prompt-lint';

const report = lint({
  source: userProvidedPrompt,
  preset: 'security-only',
});

if (!report.passed) {
  throw new Error('Security issues detected in prompt template.');
}
```

### Building a Custom Preset with `off` Base

```typescript
import { lint } from 'prompt-lint';

const report = lint({
  source: '...',
  preset: 'off',
  rules: {
    'prompt-injection-risk': 'error',
    'undelimited-variable': 'error',
    'vague-instruction': 'warning',
  },
});
```

### Inspecting the Parsed Document

```typescript
import { parse } from 'prompt-lint';

const doc = parse('<system>You are an assistant.</system><user>Hello {{name}}</user>');

console.log(doc.format);     // 'plain-text'
console.log(doc.roles);
// [
//   { role: 'system', content: 'You are an assistant.', location: {...} },
//   { role: 'user', content: 'Hello {{name}}', location: {...} },
// ]

console.log(doc.variables);
// [{ name: 'name', syntax: '{{}}', occurrences: [{...}] }]

console.log(doc.estimatedTokens);
console.log(doc.characterCount);
```

### Parsing Markdown-Headed Prompts

```typescript
import { parse } from 'prompt-lint';

const doc = parse(`# System
You are an expert code reviewer.

# User
Review the following pull request for security issues.`);

console.log(doc.roles.length);     // 2
console.log(doc.roles[0].role);    // 'system'
console.log(doc.roles[1].role);    // 'user'
```

### Variable Syntax Support

The parser detects four template variable syntaxes:

| Syntax | Pattern | Example |
|---|---|---|
| Handlebars/Mustache | `{{variableName}}` | `{{user_query}}` |
| Dollar-brace | `${variableName}` | `${user_query}` |
| Python %-format | `%(variableName)s` | `%(user_query)s` |
| Single-brace | `{variableName}` | `{user_query}` |

```typescript
import { parse } from 'prompt-lint';

const doc = parse('Process ${input_data} and compare with {{baseline}}.');

console.log(doc.variables);
// [
//   { name: 'input_data', syntax: '${}', occurrences: [...] },
//   { name: 'baseline', syntax: '{{}}', occurrences: [...] },
// ]
```

---

## TypeScript

`prompt-lint` is written in TypeScript and ships with full type declarations. All public types are exported from the package root.

```typescript
import { lint, parse } from 'prompt-lint';
import type {
  Severity,
  RuleCategory,
  PromptMessage,
  AnthropicPrompt,
  PromptSource,
  SourceLocation,
  LintDiagnostic,
  LintSummary,
  PromptDocument,
  LintReport,
  LintOptions,
  RuleContext,
  RuleDefinition,
} from 'prompt-lint';
```

Type declarations are generated alongside the JavaScript output in the `dist/` directory via `declaration: true` in the TypeScript configuration.

---

## License

MIT
