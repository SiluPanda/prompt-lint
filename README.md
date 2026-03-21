# prompt-lint

Static analysis for LLM prompts. Catch clarity, security, structure, efficiency, and best-practice issues before prompts reach production.

## Installation

```bash
npm install prompt-lint
```

## Quick Start

```typescript
import { lint } from 'prompt-lint';

const report = lint({
  source: 'Be helpful and try to answer the user question.',
  preset: 'recommended',
});

console.log(report.passed);          // false — vague instructions detected
console.log(report.summary);         // { total: 2, errors: 0, warnings: 2, infos: 0 }
console.log(report.diagnostics[0]);  // { ruleId: 'vague-instruction', severity: 'warning', ... }
```

## Options

```typescript
interface LintOptions {
  source: string | PromptMessage[] | AnthropicPrompt | { file: string };
  preset?: 'recommended' | 'strict' | 'security-only' | 'minimal' | 'off';
  rules?: Record<string, { severity?: Severity } | Severity>;
  variables?: Record<string, { required?: boolean }>;
}
```

### source

Accepts four formats:

- **Plain text string**: `"Analyze the following document."`
- **Message array**: `[{ role: 'system', content: '...' }, { role: 'user', content: '...' }]`
- **Anthropic format**: `{ system: '...', messages: [{ role: 'user', content: '...' }] }`
- **File reference**: `{ file: './prompt.txt' }` (path resolved at call time)

### preset

| Preset | Description |
|---|---|
| `recommended` | All 10 rules at their default severities (default) |
| `strict` | All rules elevated to error/warning |
| `security-only` | Only `undelimited-variable` and `prompt-injection-risk` at error |
| `minimal` | Only `contradictory-directives` and `prompt-injection-risk` at error |
| `off` | All rules disabled |

### rules

Override individual rule severities:

```typescript
lint({
  source: '...',
  rules: {
    'vague-instruction': 'error',      // string form
    'missing-examples': { severity: 'off' }, // object form
  },
});
```

### variables

Define known variables to enable the `undefined-variable` rule:

```typescript
lint({
  source: 'Answer {{user_query}} with context {{context}}.',
  variables: {
    user_query: { required: true },
    context: { required: false },
  },
});
```

## Presets

### recommended (default)

Balances signal-to-noise for production use.

| Rule | Severity |
|---|---|
| vague-instruction | warning |
| missing-output-format | warning |
| missing-task-definition | warning |
| contradictory-directives | error |
| undelimited-variable | warning |
| prompt-injection-risk | error |
| excessive-length | warning |
| missing-examples | info |
| undefined-variable | warning |
| repeated-instructions | info |

## Rules

### clarity

**vague-instruction** — Detects vague phrases: "be helpful", "do your best", "try to", "if possible", "as needed", "as appropriate", "feel free to", "whenever you can", "you may". Replace with specific, measurable directives.

**missing-output-format** — Warns when generation verbs (write, generate, create, produce, output, provide) appear but no output format (json, yaml, markdown, list, table, csv, xml, etc.) is specified.

**missing-task-definition** — Warns when no primary action verb is found in the first role, meaning the task is undefined. Looks for: analyze, write, generate, summarize, extract, classify, translate, answer, explain, review, evaluate, compare, create, identify, convert.

**contradictory-directives** — Detects "always"/"never" conflicts and conflicting format directives (e.g., both "respond in JSON" and "respond in YAML").

### security

**undelimited-variable** — Warns when variables with user-input names (containing: user, input, query, request, message, text, content, data) are not wrapped in XML tags, quotes, or code fences.

**prompt-injection-risk** — Detects injection-enabling phrases: "ignore previous", "ignore all", "disregard", "forget everything", "new instructions", "override".

### efficiency

**excessive-length** — Warns when estimated token count exceeds 2000. Suggests splitting into smaller prompts.

**repeated-instructions** — Detects instructions repeated 3 or more times. Suggests consolidating.

### best-practice

**missing-examples** — When a prompt exceeds 500 characters but contains no example markers (example:, for example, e.g., input:, output:), suggests adding examples.

### structure

**undefined-variable** — When `options.variables` is provided, reports any variable used in the prompt that is not listed there.

## LintReport Shape

```typescript
interface LintReport {
  passed: boolean;          // true if no errors
  timestamp: string;        // ISO 8601
  durationMs: number;
  diagnostics: LintDiagnostic[];
  summary: { total: number; errors: number; warnings: number; infos: number };
  document: PromptDocument; // parsed representation
  preset: string;
}

interface LintDiagnostic {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  category: RuleCategory;
  location: SourceLocation;
  message: string;
  suggestion?: string;
}
```

## License

MIT
