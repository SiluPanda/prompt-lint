# prompt-lint -- Implementation Tasks

This file tracks all implementation tasks derived from [SPEC.md](./SPEC.md). Tasks are grouped into phases matching the spec's roadmap (Section 20), with additional granularity for scaffolding, testing, documentation, and publishing.

---

## Phase 0: Project Scaffolding and Infrastructure

- [ ] **Install dev dependencies** — Add `typescript`, `vitest`, and `eslint` as devDependencies in `package.json`. Verify `npm install` succeeds. | Status: not_done
- [ ] **Add CLI bin entry to package.json** — Add `"bin": { "prompt-lint": "./dist/cli.js" }` to `package.json` so the CLI is available as `prompt-lint` after install. | Status: not_done
- [ ] **Create src/types.ts with all type definitions** — Define all TypeScript interfaces and types from spec Section 7: `PromptSource`, `PromptMessage`, `AnthropicPrompt`, `Severity`, `RuleConfig`, `LintOptions`, `VariableDefinition`, `SourceLocation`, `Fix`, `LintDiagnostic`, `LintSummary`, `LintReport`, `PromptDocument`, `RoleBlock`, `Section`, `Variable`, `Instruction`, `ExampleBlock`, `OutputFormatSpec`, `Delimiter`, `CustomRuleDefinition`, `RuleContext`. | Status: not_done
- [ ] **Create src/utils/location.ts** — Implement offset-to-line/column conversion utility (`locationFromOffset`). Given source text and a start/end character offset, return a `SourceLocation` with line numbers (1-based) and column numbers (1-based). | Status: not_done
- [ ] **Create src/utils/text.ts** — Implement text normalization utilities: lowercase+whitespace-collapse for comparison, sentence splitting, whitespace detection helpers. | Status: not_done
- [ ] **Create src/utils/patterns.ts** — Implement shared regex patterns and keyword lists used by multiple rules and parser components: vague instruction patterns, injection patterns, politeness markers, verbose phrases, model name patterns, imperative verbs, constraint keywords, etc. | Status: not_done
- [ ] **Create directory structure** — Create all directories specified in spec Section 19: `src/parser/`, `src/rules/`, `src/rules/clarity/`, `src/rules/security/`, `src/rules/structure/`, `src/rules/efficiency/`, `src/rules/best-practice/`, `src/config/`, `src/formatters/`, `src/fixer/`, `src/utils/`, `src/__tests__/`, and all test subdirectories. | Status: not_done
- [ ] **Create test fixtures directory and files** — Create `src/__tests__/fixtures/prompts/` and `src/__tests__/fixtures/configs/` directories. Create fixture files: `well-written.md`, `poorly-written.md`, `security-risks.md`, `template-handlebars.md`, `template-jinja2.md`, `message-array.json`, `anthropic-format.json`, `empty.md`, `large-prompt.md`, `valid-config.json`, `invalid-config.json`, `strict-override.json`, `custom-rules.js`. | Status: not_done

---

## Phase 1: Parser

### 1.1 Parser Entry Point and Format Detection

- [ ] **Create src/parser/index.ts — parser entry point** — Implement the main `parse()` function that accepts `PromptSource` (string, message array, Anthropic object, or `{ file }` path) and dispatches to the appropriate format-specific parser. Implement format auto-detection for string inputs: check if JSON parses as message array, Anthropic format, or fall back to plain text. For `{ file }` inputs, read the file synchronously using `node:fs` and then parse the content. | Status: not_done
- [ ] **Implement file reading for { file } source** — When `PromptSource` is `{ file: string }`, read the file from disk using `node:fs`. Detect format from file extension (`.json` for message/Anthropic formats, `.md`/`.txt`/`.prompt`/`.system`/`.promptmd` for plain text). Handle file-not-found and read errors gracefully. | Status: not_done
- [ ] **Implement JSON format detection** — When input is a string that parses as valid JSON, determine if it is a message array (array of `{ role, content }` objects) or Anthropic format (object with `system` string and `messages` array). If neither, treat as plain text. When input is provided as a JavaScript array or object directly, infer format from shape. | Status: not_done

### 1.2 Plain Text Parser

- [ ] **Create src/parser/parse-plain-text.ts** — Implement the plain text parser that takes a raw string and produces a `PromptDocument`. Orchestrate calls to role detector, section detector, variable extractor, instruction detector, example detector, output format detector, and delimiter detector. Populate all fields of the `PromptDocument`: source, format (`plain-text`), templateSyntax, roles, sections, variables, instructions, examples, outputFormats, delimiters, characterCount, estimatedTokens (chars / 4). | Status: not_done

### 1.3 Message Array Parser

- [ ] **Create src/parser/parse-messages.ts** — Implement parsing for OpenAI-style message arrays (`PromptMessage[]`) and Anthropic-style prompt objects (`AnthropicPrompt`). Map each message's role and content to `RoleBlock` entries. For Anthropic format, map the `system` field to a system role block. Run section detection, variable extraction, instruction detection, example detection, output format detection, and delimiter detection on each role block's content. | Status: not_done

### 1.4 Role Detection

- [ ] **Create src/parser/role-detector.ts** — Implement role boundary detection for plain text prompts. Detect roles via: markdown headers (`# System`, `## User`, etc., case-insensitive), label patterns (`System:`, `User:`, `Assistant:`, `Human:`, `AI:` at line start), XML tags (`<system>`, `<user>`, `<assistant>`), Anthropic legacy format (`\n\nHuman:`, `\n\nAssistant:`). If no role markers are detected, treat the entire text as a single implicit system role block. Return an ordered list of `RoleBlock` objects with content and location. | Status: not_done

### 1.5 Section Detection

- [ ] **Create src/parser/section-detector.ts** — Implement section detection within role blocks. Detect sections via: markdown headers (`#`, `##`, `###`), XML tags (`<instructions>`, `<context>`, `<examples>`, `<output>`, `<rules>`, `<constraints>`, and similar), labeled blocks (`Instructions:`, `Output Format:`, `Examples:`, `Context:`, `Rules:`, `Constraints:` at line start), horizontal rules (`---`, `***`, `___`). Return `Section` objects with title, type, content, location, and roleBlock index. | Status: not_done

### 1.6 Variable Extraction

- [ ] **Create src/parser/variable-extractor.ts** — Implement template variable extraction supporting all syntaxes: Handlebars/Mustache (`{{variableName}}`), Jinja2 (`{{ variableName }}`), f-string (`{variableName}`), dollar (`$variableName` or `${variableName}`), bracket-dollar (`{{$variableName}}`). For each variable, record: name, syntax style, location (character offset range), all occurrences, and whether the name suggests user input (contains "input", "user", "query", "message", "question", "request", "prompt", "text", "content", "data"). Detect the dominant syntax and set `templateSyntax` on the `PromptDocument`. Handle `templateSyntax` option for explicit override. | Status: not_done

### 1.7 Instruction Detection

- [ ] **Create src/parser/instruction-detector.ts** — Implement instruction and directive detection. Identify imperative sentences starting with imperative verbs ("Write", "Generate", "Analyze", "Return", "Always", "Never", "Do not", "Make sure", "Ensure", "You must", "You should", "You will"), sentences with modal directives ("must", "should", "shall", "need to", "have to"), and sentences with constraint language ("only", "always", "never", "do not", "cannot", "must not"). Also detect bullet points and numbered items within instruction-labeled sections. Classify each as `imperative`, `constraint`, or `directive`. Return `Instruction` objects with text, type, and location. | Status: not_done

### 1.8 Example Block Detection

- [ ] **Create src/parser/example-detector.ts** — Implement few-shot example block detection. Detect: sections labeled "Examples"/"Example"/"Few-shot examples", numbered patterns (`Example 1:`, `1.`, `1)`), input/output pairs (`Input:`/`Output:`, `Q:`/`A:`, `User:`/`Assistant:` within example sections), XML-tagged examples (`<example>`, `<examples>`), and content between delimiters following "example" or "for instance" introductions. Return `ExampleBlock` objects with content, location, and exampleCount. | Status: not_done

### 1.9 Output Format Detection

- [ ] **Create src/parser/output-format-detector.ts** — Implement output format specification detection. Detect: sections labeled "Output Format"/"Response Format"/"Output"/"Expected Output", JSON/YAML schema blocks (fenced code blocks with `json` or `yaml` markers containing schema-like structures), explicit format instructions ("Respond in JSON", "Return a JSON object", "Format your response as", "Use the following schema"), and structured response templates with placeholder fields. Return `OutputFormatSpec` objects with format, content, and location. | Status: not_done

### 1.10 Delimiter Detection

- [ ] **Create src/parser/delimiter-detector.ts** — Implement delimiter detection and matching. Detect XML tags, triple-backtick fenced blocks, quoted blocks (`"""`), separator lines (`---`, `===`), and plain text labels. For each delimiter, record type, open location, close location (null if unterminated), and the variable name being wrapped (if wrapping a template variable). Match opening and closing delimiters to detect unterminated pairs. | Status: not_done

### 1.11 Parser Tests

- [ ] **Write parser unit tests for plain text parsing** — Test `parse-plain-text.ts`: verify correct `PromptDocument` structure for various plain text inputs, including prompts with headers, XML tags, labels, mixed sections, and no structure at all. Test character count and estimated token count. | Status: not_done
- [ ] **Write parser unit tests for message array parsing** — Test `parse-messages.ts`: verify correct parsing of OpenAI-style message arrays and Anthropic-style prompt objects. Test role mapping, content extraction, and sub-parsing of each role block. | Status: not_done
- [ ] **Write parser unit tests for format detection** — Test format auto-detection: JSON that is a message array, JSON that is Anthropic format, JSON that is neither, plain string, programmatic array/object inputs. | Status: not_done
- [ ] **Write parser unit tests for role detection** — Test `role-detector.ts`: markdown headers, label patterns, XML tags, Anthropic legacy markers, no role markers (implicit system), mixed styles, edge cases (role markers inside code blocks, partial matches). | Status: not_done
- [ ] **Write parser unit tests for section detection** — Test `section-detector.ts`: markdown headers at various levels, XML tag sections, labeled blocks, horizontal rule separators, nested sections, empty sections, sections spanning multiple lines. | Status: not_done
- [ ] **Write parser unit tests for variable extraction** — Test `variable-extractor.ts`: each syntax style (Handlebars, Jinja2, f-string, dollar, bracket-dollar), mixed syntaxes, duplicate variables, user-input name detection, dominant syntax detection, explicit `templateSyntax` override. | Status: not_done
- [ ] **Write parser unit tests for instruction detection** — Test `instruction-detector.ts`: imperative verbs, modal directives, constraint language, bullet points in instruction sections, non-instruction text that should not be flagged. | Status: not_done
- [ ] **Write parser unit tests for example detection** — Test `example-detector.ts`: labeled example sections, numbered examples, input/output pairs, XML-tagged examples, no examples present. | Status: not_done
- [ ] **Write parser unit tests for output format detection** — Test `output-format-detector.ts`: labeled format sections, JSON/YAML schema blocks, explicit format instructions, no format specification. | Status: not_done
- [ ] **Write parser unit tests for delimiter detection** — Test `delimiter-detector.ts`: XML tag pairs, fenced code blocks, quoted blocks, separator lines, unterminated delimiters, delimiters wrapping variables. | Status: not_done
- [ ] **Write parser edge case tests** — Test: empty string input, whitespace-only input, very long input (100KB+), deeply nested XML tags, binary/non-text content, Unicode content, prompts with only variables and no text. | Status: not_done

---

## Phase 2: Rules Engine

### 2.1 Rule Infrastructure

- [ ] **Create src/rules/create-rule.ts** — Implement the `createRule()` factory function that accepts a `CustomRuleDefinition` and returns it with type validation. Validate that the rule has a valid id, category, defaultSeverity, description, and check function. | Status: not_done
- [ ] **Create src/rules/rule-runner.ts** — Implement the rule evaluation engine. Accept a `PromptDocument`, a list of enabled rules (built-in + custom), and effective severity configuration. For each enabled rule, create a `RuleContext` with `report()`, `severity`, `locationFromOffset()`, and `options`. Execute each rule's check function, collect diagnostics, and return them sorted by severity (errors first) then by location. Handle inline directives (disable/enable comments) to suppress specific diagnostics. | Status: not_done
- [ ] **Create src/rules/index.ts — rule registry** — Export a registry of all built-in rules. This module imports all rule files from subdirectories and exports them as an array. Used by `lint.ts` to get the full list of available rules. | Status: not_done

### 2.2 Clarity Rules

- [ ] **Implement `vague-instruction` rule** — Create `src/rules/clarity/vague-instruction.ts`. Detect patterns: "be helpful", "be creative", "do your best", "be accurate", "be concise" (without specifics), "be professional", "try to", "attempt to", "if possible", "as needed", "as appropriate", "use your judgment", "be thorough" (without scope). Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `ambiguous-pronoun` rule** — Create `src/rules/clarity/ambiguous-pronoun.ts`. Flag pronouns ("it", "they", "this", "that", "these", "those") at the start of instruction sentences with no noun in the preceding sentence. Flag "it"/"this" in the first instruction. Do not flag pronouns inside example blocks or quoted text. Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `missing-output-format` rule** — Create `src/rules/clarity/missing-output-format.ts`. Fire when prompt has generation instructions (verbs: "write", "generate", "create", "return", "produce", "output", "list", "summarize") but no output format section and no format-specifying language ("in JSON", "as a bulleted list", "in markdown", "as a table"). Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `contradictory-directives` rule** — Create `src/rules/clarity/contradictory-directives.ts`. Detect direct negation contradictions (always/never pairs), quantity contradictions (concise vs thorough), format contradictions (plain text vs JSON), scope contradictions (only context vs general knowledge), behavior contradictions (don't ask vs ask clarifying). Use keyword matching for semantic opposition: always/never, include/exclude, do/do not, only/also. Default severity: error. No auto-fix. | Status: not_done
- [ ] **Implement `redundant-instruction` rule** — Create `src/rules/clarity/redundant-instruction.ts`. Detect same instruction repeated verbatim or with minor wording variations. Use normalized comparison (lowercased, whitespace-collapsed, common synonym substitution). Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `missing-task-definition` rule** — Create `src/rules/clarity/missing-task-definition.ts`. Fire when no instruction contains a primary action verb ("analyze", "write", "generate", "summarize", "translate", "classify", "extract", "answer", "explain", "compare", "evaluate", "review", "create", "convert", "rewrite"). Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `wall-of-text` rule** — Create `src/rules/clarity/wall-of-text.ts`. Fire when a role block or section has more than `maxLength` (default: 2000) consecutive characters with no structural breaks (headers, bullets, numbered lists, blank lines, XML tags, horizontal rules). Support configurable `maxLength` option. Default severity: info. No auto-fix. | Status: not_done

### 2.3 Security Rules

- [ ] **Implement `injection-risk` rule** — Create `src/rules/security/injection-risk.ts`. Detect patterns: "ignore previous instructions", "ignore all prior instructions", "ignore the above", "disregard previous", "forget your instructions", "you are now", "new instructions:", "system override", "developer mode", "DAN", "jailbreak", "pretend you are", "act as if you have no restrictions", "reveal your system prompt", "repeat the above text", "what are your instructions?", Base64-encoded injection patterns. Do NOT fire when pattern appears inside a labeled example block, fenced code block, or injection prevention section. Default severity: error. No auto-fix. | Status: not_done
- [ ] **Implement `unescaped-interpolation` rule** — Create `src/rules/security/unescaped-interpolation.ts`. Fire when a template variable whose name suggests user input (containing "input", "user", "query", "message", "question", "request", "prompt", "text", "content", "data") is not enclosed in delimiters (XML tags, triple backticks, quotation marks, or other boundary markers). Also check the `variables` option in `LintOptions` for explicit `userInput: true` flags. Default severity: error. Auto-fix: wrap in XML tags `<var_name>{{var_name}}</var_name>`. | Status: not_done
- [ ] **Implement `role-confusion-vector` rule** — Create `src/rules/security/role-confusion-vector.ts`. Fire when a user input variable appears as the first content after a role marker, when a user input variable could contain role markers without escaping, or when a user input variable is interpolated into an instruction position. Default severity: error. No auto-fix. | Status: not_done
- [ ] **Implement `delimiter-weakness` rule** — Create `src/rules/security/delimiter-weakness.ts`. Fire when user input is bounded by weak delimiters: single/double quotes, dashes/equals signs, plain text labels without structural markers. Do not fire for strong delimiters: XML tags with unique names, triple backticks with language labels, multiple layered delimiters. Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `system-prompt-leak-risk` rule** — Create `src/rules/security/system-prompt-leak-risk.ts`. Fire when the prompt contains sensitive content (API keys, internal URLs, company-specific instructions, role definitions) but no confidentiality instruction ("do not reveal", "keep confidential", "do not share your instructions", "do not disclose"). Only fire when both conditions are true. Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `encoding-bypass-risk` rule** — Create `src/rules/security/encoding-bypass-risk.ts`. Fire when user input variables are present and the prompt does not address encoding-based bypass (Base64, hex, ROT13, Unicode homoglyphs). Also detect encoded strings in the prompt that decode to sensitive content. Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `sensitive-data-exposure` rule** — Create `src/rules/security/sensitive-data-exposure.ts`. Detect patterns: API keys (`sk-`, `pk_`, `api_key`, `token`, `bearer`, `secret` + long alphanumeric strings), connection strings (database URLs, Redis URLs, AWS ARNs), hardcoded passwords (`password = "..."`, `pwd:`, `passwd`), private keys (`-----BEGIN RSA PRIVATE KEY-----` and similar PEM blocks). Default severity: error. No auto-fix. | Status: not_done

### 2.4 Structure Rules

- [ ] **Implement `missing-system-role` rule** — Create `src/rules/structure/missing-system-role.ts`. Fire when a message array has user/assistant messages but no system message, or when a plain text prompt with explicit role markers has user/assistant roles but no system role. Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `empty-section` rule** — Create `src/rules/structure/empty-section.ts`. Fire when a section (header, XML tag, or label) contains no content or only whitespace. Default severity: warning. Auto-fix: remove the empty section header and trailing whitespace. | Status: not_done
- [ ] **Implement `orphaned-variable` rule** — Create `src/rules/structure/orphaned-variable.ts`. Fire when a template variable is referenced in the text but not defined in the `variables` option of `LintOptions` or any accompanying variable documentation block. Default severity: error. No auto-fix. | Status: not_done
- [ ] **Implement `unused-variable` rule** — Create `src/rules/structure/unused-variable.ts`. Fire when a variable is defined in the `variables` option of `LintOptions` but never referenced in the prompt template text. Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `inconsistent-variable-syntax` rule** — Create `src/rules/structure/inconsistent-variable-syntax.ts`. Fire when the prompt uses multiple template variable syntaxes (e.g., some `{{var}}` and some `{var}`). Default severity: error. Auto-fix: convert all variables to the dominant syntax (majority usage). | Status: not_done
- [ ] **Implement `missing-examples` rule** — Create `src/rules/structure/missing-examples.ts`. Fire when the prompt requests a specific output format (JSON, structured data, specific schema) but has no example blocks. Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `section-order` rule** — Create `src/rules/structure/section-order.ts`. Fire when sections appear in non-standard order. Expected order: role/persona definition, context/background, task/instructions, constraints/rules, output format, examples. Detect when examples appear before task definition or constraints before context. Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `unterminated-delimiter` rule** — Create `src/rules/structure/unterminated-delimiter.ts`. Fire when an opening delimiter (XML tag, fenced code block, quoted block) has no matching closing delimiter. Default severity: error. Auto-fix: append the matching closing delimiter at the end of the relevant section. | Status: not_done

### 2.5 Efficiency Rules

- [ ] **Implement `verbose-instruction` rule** — Create `src/rules/efficiency/verbose-instruction.ts`. Detect verbose patterns and their concise alternatives: "I would like you to" -> omit, "Could you please" -> omit, "It is important that you" -> omit, "Please make sure to" -> omit, "In order to" -> "To", "For the purpose of" -> "To"/"For", "In the event that" -> "If", "With regard to" -> "Regarding"/"About", "At this point in time" -> "Now", "Due to the fact that" -> "Because". Default severity: info. Auto-fix: replace verbose patterns with concise alternatives. | Status: not_done
- [ ] **Implement `redundant-whitespace` rule** — Create `src/rules/efficiency/redundant-whitespace.ts`. Detect: more than two consecutive blank lines, trailing whitespace on lines, lines containing only spaces/tabs. Default severity: info. Auto-fix: collapse multiple blank lines to one, remove trailing whitespace. | Status: not_done
- [ ] **Implement `token-waste` rule** — Create `src/rules/efficiency/token-waste.ts`. Detect: excessive markdown formatting in non-visible contexts, repeated separator lines beyond the first, commented-out content (HTML comments with old instructions), ASCII art or decorative elements, strings of repeated characters as separators. Default severity: info. Partial auto-fix: remove HTML comments, collapse repeated separators, remove trailing whitespace. | Status: not_done
- [ ] **Implement `could-use-xml-tags` rule** — Create `src/rules/efficiency/could-use-xml-tags.ts`. Fire when the prompt uses prose-based section labeling ("The following is the context:", "Here are the instructions:") instead of XML tags, and has 3+ such sections. Default severity: info. No auto-fix. | Status: not_done

### 2.6 Best Practice Rules

- [ ] **Implement `no-please-thank` rule** — Create `src/rules/best-practice/no-please-thank.ts`. Detect politeness markers: "please", "thank you", "thanks", "kindly", "would you mind", "I'd appreciate if". Default severity: info. Auto-fix: remove politeness markers while preserving instruction. | Status: not_done
- [ ] **Implement `missing-constraints` rule** — Create `src/rules/best-practice/missing-constraints.ts`. Fire when prompt has generation instructions but no constraints: no max length, word/sentence count, response boundaries, language constraints, format constraints, or scope limitations. Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `missing-error-handling` rule** — Create `src/rules/best-practice/missing-error-handling.ts`. Fire when prompt has task instructions but no specification for: malformed/empty/unexpected input, information not available in context, ambiguous/underspecified tasks, or fallback behavior. Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `hardcoded-model-name` rule** — Create `src/rules/best-practice/hardcoded-model-name.ts`. Detect references to model names: "GPT-4", "GPT-3.5", "Claude", "Claude 3", "Gemini", "Llama", "Mistral", "gpt-4o", "claude-3-opus", and similar identifiers. Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `persona-overload` rule** — Create `src/rules/best-practice/persona-overload.ts`. Fire when more than `maxTraits` (default: 10) distinct persona traits/roles/behavioral requirements are assigned in the system role. Support configurable `maxTraits` option. Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `no-negative-framing` rule** — Create `src/rules/best-practice/no-negative-framing.ts`. Fire when instructions use negative framing ("do not", "never", "don't") as the primary directive without an accompanying positive instruction. Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `missing-role-definition` rule** — Create `src/rules/best-practice/missing-role-definition.ts`. Fire when a system role block does not include a role/persona definition at the beginning and jumps directly into task instructions. Default severity: info. No auto-fix. | Status: not_done
- [ ] **Implement `excessive-prompt-length` rule** — Create `src/rules/best-practice/excessive-prompt-length.ts`. Fire when total prompt length exceeds `maxLength` (default: 50,000 characters). Support configurable `maxLength` option. Default severity: warning. No auto-fix. | Status: not_done
- [ ] **Implement `language-consistency` rule** — Create `src/rules/best-practice/language-consistency.ts`. Fire when instruction sections mix human languages (e.g., English and another language mid-sentence or between sections). Default severity: info. No auto-fix. | Status: not_done

### 2.7 Rule Tests

- [ ] **Write tests for `vague-instruction`** — Test with prompts that pass (specific instructions) and fail (vague patterns). Test each vague pattern individually. Test that vague language inside quoted examples does not fire. | Status: not_done
- [ ] **Write tests for `ambiguous-pronoun`** — Test pronouns at start of first instruction, pronouns with clear antecedents, pronouns inside example blocks (should not fire), pronouns inside quoted text (should not fire). | Status: not_done
- [ ] **Write tests for `missing-output-format`** — Test prompts with explicit format specs, prompts with format-specifying language, prompts with no format. Test that non-generation prompts (no generation verbs) do not fire. | Status: not_done
- [ ] **Write tests for `contradictory-directives`** — Test each contradiction type: direct negation, quantity, format, scope, behavior. Test near-contradictions that should NOT fire. Test contradictions across different sections. | Status: not_done
- [ ] **Write tests for `redundant-instruction`** — Test verbatim duplicates, near-duplicates with minor wording changes, instructions that are similar but meaningfully different (should not fire). | Status: not_done
- [ ] **Write tests for `missing-task-definition`** — Test prompts with clear action verbs, prompts with only context/constraints/formatting but no task. | Status: not_done
- [ ] **Write tests for `wall-of-text`** — Test text blocks above and below threshold, text with structural breaks (headers, bullets, blank lines). Test configurable `maxLength`. | Status: not_done
- [ ] **Write tests for `injection-risk`** — Test each injection pattern. Test patterns inside labeled example blocks (should not fire), inside fenced code blocks (should not fire), inside injection prevention sections (should not fire). Test Base64-encoded patterns. | Status: not_done
- [ ] **Write tests for `unescaped-interpolation`** — Test variables with user-input names wrapped in delimiters (should pass), unwrapped (should fail). Test variables with non-user-input names (should not fire). Test auto-fix output. | Status: not_done
- [ ] **Write tests for `role-confusion-vector`** — Test user input variables in structural positions, after role markers, in instruction context. Test properly bounded variables (should pass). | Status: not_done
- [ ] **Write tests for `delimiter-weakness`** — Test weak delimiters (quotes, dashes), strong delimiters (XML tags, fences). Test no delimiter (covered by `unescaped-interpolation`). | Status: not_done
- [ ] **Write tests for `system-prompt-leak-risk`** — Test prompts with sensitive content + no confidentiality instruction (should fire), sensitive content + confidentiality instruction (should pass), no sensitive content (should pass). | Status: not_done
- [ ] **Write tests for `encoding-bypass-risk`** — Test prompts with user input variables and no encoding warning, prompts with encoding awareness instructions. Test encoded strings in prompt text. | Status: not_done
- [ ] **Write tests for `sensitive-data-exposure`** — Test each pattern type: API keys, connection strings, passwords, PEM blocks. Test strings that look similar but are not secrets. | Status: not_done
- [ ] **Write tests for `missing-system-role`** — Test message arrays with and without system message, plain text with explicit role markers but no system role. | Status: not_done
- [ ] **Write tests for `empty-section`** — Test sections with content, empty sections, whitespace-only sections. Test auto-fix removes empty section headers. | Status: not_done
- [ ] **Write tests for `orphaned-variable`** — Test variables referenced in text but not in `variables` config. Test variables that are defined (should pass). Test with no `variables` config (rule behavior). | Status: not_done
- [ ] **Write tests for `unused-variable`** — Test variables defined in `variables` config but not in text. Test variables that are referenced (should pass). | Status: not_done
- [ ] **Write tests for `inconsistent-variable-syntax`** — Test prompts with single syntax (should pass), mixed syntaxes (should fail). Test auto-fix converts to dominant syntax. | Status: not_done
- [ ] **Write tests for `missing-examples`** — Test prompts requesting structured output with and without examples. | Status: not_done
- [ ] **Write tests for `section-order`** — Test standard order (should pass), non-standard order (should fire). Test prompts without identifiable sections. | Status: not_done
- [ ] **Write tests for `unterminated-delimiter`** — Test matched delimiter pairs (should pass), unmatched opening delimiters (should fire). Test auto-fix appends closing delimiter. | Status: not_done
- [ ] **Write tests for `verbose-instruction`** — Test each verbose pattern and its replacement. Test auto-fix output. | Status: not_done
- [ ] **Write tests for `redundant-whitespace`** — Test multiple blank lines, trailing whitespace, whitespace-only lines. Test auto-fix output. | Status: not_done
- [ ] **Write tests for `token-waste`** — Test HTML comments, repeated separators, decorative elements. Test partial auto-fix (comments removed, formatting kept). | Status: not_done
- [ ] **Write tests for `could-use-xml-tags`** — Test prompts with 3+ prose-labeled sections (should fire), prompts already using XML tags (should pass), prompts with fewer than 3 sections. | Status: not_done
- [ ] **Write tests for `no-please-thank`** — Test each politeness marker. Test auto-fix removes marker and preserves instruction. | Status: not_done
- [ ] **Write tests for `missing-constraints`** — Test prompts with and without constraints. Test various constraint types (length, scope, format). | Status: not_done
- [ ] **Write tests for `missing-error-handling`** — Test prompts with and without error handling instructions. | Status: not_done
- [ ] **Write tests for `hardcoded-model-name`** — Test each model name pattern. Test model names in contexts where they are acceptable (should still fire per spec). | Status: not_done
- [ ] **Write tests for `persona-overload`** — Test prompts with few traits (should pass), many traits (should fire). Test configurable `maxTraits`. | Status: not_done
- [ ] **Write tests for `no-negative-framing`** — Test negative-only instructions (should fire), negative + positive pairs (should pass), positive-only (should pass). | Status: not_done
- [ ] **Write tests for `missing-role-definition`** — Test system blocks with role definition (should pass), system blocks starting directly with task instructions (should fire). | Status: not_done
- [ ] **Write tests for `excessive-prompt-length`** — Test prompts above and below threshold. Test configurable `maxLength`. | Status: not_done
- [ ] **Write tests for `language-consistency`** — Test single-language prompts (should pass), mixed-language prompts (should fire). | Status: not_done

---

## Phase 3: Configuration System

### 3.1 Presets

- [ ] **Create src/config/presets.ts** — Define all four presets plus `off`. For `recommended`: all rules at their default severities per spec Section 10. For `strict`: upgrade all warnings to errors and all info to warnings. For `security-only`: enable only the 7 security rules, all others off. For `minimal`: enable only the 7 critical rules, all others off. For `off`: disable all rules. Export preset definitions as a mapping from preset name to rule severity configurations. | Status: not_done
- [ ] **Write preset tests** — Verify each preset enables/disables the expected rules at the expected severities. Test that `off` disables everything. Test that `strict` has no info-level rules. Test that `security-only` has only security category rules enabled. | Status: not_done

### 3.2 Configuration File Loading

- [ ] **Create src/config/index.ts** — Implement configuration file loading and resolution. Search for config files in order: `.prompt-lint.json`, `.prompt-lint.yaml`, `.prompt-lintrc`, `prompt-lint` key in `package.json`. Search current directory and ancestor directories. Parse JSON config files. Implement minimal YAML parser for the subset used in config (simple key-value, nested objects, arrays). Implement `--config` flag override. Merge configuration in precedence order: built-in defaults < preset < config file < CLI flags < programmatic `rules` < inline directives. | Status: not_done
- [ ] **Implement shorthand severity expansion** — In the `rules` config, accept both a severity string (`"vague-instruction": "error"`) and a full `RuleConfig` object (`"wall-of-text": { "severity": "warning", "options": { "maxLength": 3000 } }`). Expand shorthand strings to full objects during config loading. | Status: not_done
- [ ] **Implement plugin loading from config** — Support `"plugins"` array in config file that references external JS files exporting arrays of `CustomRuleDefinition` objects. Load plugins using `require()`. Validate loaded rules (id, category, etc.). | Status: not_done
- [ ] **Write config loading tests** — Test config file discovery, JSON parsing, YAML parsing, `package.json` key, ancestor directory search. Test precedence resolution. Test invalid config error handling. Test plugin loading. | Status: not_done

### 3.3 Inline Directives

- [ ] **Create src/config/inline-directives.ts** — Implement inline disable/enable comment parsing. Support: `<!-- prompt-lint-disable rule-name -->` / `<!-- prompt-lint-enable rule-name -->` for region disable, `<!-- prompt-lint-disable-next-line rule-name -->` for single-line disable, `<!-- prompt-lint-disable -->` / `<!-- prompt-lint-enable -->` for full disable/enable (all rules). Parse directives from the prompt text and build a map of disabled regions per rule. Used by the rule runner to suppress diagnostics. Support `noInlineConfig` option to ignore all inline directives. | Status: not_done
- [ ] **Write inline directive tests** — Test single-rule disable/enable, all-rule disable/enable, disable-next-line, nested directives, `noInlineConfig` flag, multiple directives for different rules, malformed directives. | Status: not_done

---

## Phase 4: Core lint() Function

- [ ] **Create src/lint.ts** — Implement the core `lint()` function. Accept `LintOptions`, resolve configuration (preset + config file + rule overrides + inline directives), parse the prompt into a `PromptDocument` using `parse()`, evaluate all enabled rules using the rule runner, collect diagnostics, compute summary counts (total, errors, warnings, infos, fixable), apply auto-fixes if `fix: true`, build and return a `LintReport` with all fields: `passed` (no errors), `timestamp`, `durationMs`, `diagnostics` (sorted by severity then location), `summary`, `document`, `preset`, `ruleStates`, and `fixed` (if applicable). | Status: not_done
- [ ] **Wire up src/index.ts public API** — Export `lint`, `parse`, `createRule`, and all public types from `src/index.ts`. This is the main entry point for programmatic use. | Status: not_done
- [ ] **Write lint() integration tests** — Test the full lint pipeline against fixture prompts. Test: well-written prompt (zero errors/warnings with recommended), poorly-written prompt (expected diagnostics), security-focused prompt (security rules fire), template file with orphaned/unused variables. Test `fix: true` returns fixed text. Test that `passed` is false when errors exist and true otherwise. Test `durationMs` and `timestamp` fields. | Status: not_done

---

## Phase 5: Auto-fix Engine

- [ ] **Create src/fixer/apply-fixes.ts** — Implement the fix application engine. Accept source text and an array of `Fix` objects (range + replacement). Sort fixes by range (smallest first for specificity). Detect overlapping ranges and skip conflicting fixes (first wins). Apply fixes in reverse offset order (last first) to avoid invalidating earlier offsets. Return the fixed text. | Status: not_done
- [ ] **Create src/fixer/index.ts** — Export the fix application function. Provide a helper that takes a `LintReport` and applies all fixable diagnostics, returning the fixed text. | Status: not_done
- [ ] **Write auto-fix tests** — Test fix application for each fixable rule. Test overlapping fix conflict resolution (first wins). Test that non-overlapping fixes all apply correctly. Test that surrounding text is not corrupted. Test round-trip: fix -> re-lint -> fixed issues gone. | Status: not_done

---

## Phase 6: Formatters

- [ ] **Create src/formatters/human.ts** — Implement the human-readable terminal formatter. Output colored, indented text with severity badges (`ERROR`, `WARN`, `INFO`), rule IDs, line numbers, messages, and a summary line. Use ANSI escape codes directly (no chalk dependency). Respect `NO_COLOR` environment variable and `--no-color` flag. Hide info-severity diagnostics unless `--verbose`. Show the file path, detected format, and preset at the top. Show fix summary when `--fix` is used. | Status: not_done
- [ ] **Create src/formatters/json.ts** — Implement the JSON formatter. Output the `LintReport` object as pretty-printed JSON to stdout. | Status: not_done
- [ ] **Create src/formatters/sarif.ts** — Implement the SARIF v2.1.0 formatter. Map `LintReport` to SARIF structure: `ruleId` -> `result.ruleId`, severity mapping (error->error, warning->warning, info->note), `message` -> `result.message.text`, `location` -> `result.locations[0].physicalLocation`, `suggestion` -> `result.fixes[0].description.text`, rule metadata -> `run.tool.driver.rules[]`. Include tool info (name: "prompt-lint", version from package.json). | Status: not_done
- [ ] **Create src/formatters/index.ts** — Export a formatter factory function that takes a format name ("human", "json", "sarif") and returns the corresponding formatter function. | Status: not_done
- [ ] **Write human formatter tests** — Test output structure for a known report: severity badges, rule IDs, line numbers, messages, summary counts, pass/fail indicator. Test `--verbose` includes info diagnostics. Test `--quiet` suppresses non-error output. Test `--no-color` strips ANSI codes. | Status: not_done
- [ ] **Write JSON formatter tests** — Test that output is valid JSON matching the `LintReport` structure. | Status: not_done
- [ ] **Write SARIF formatter tests** — Test that output conforms to SARIF v2.1.0 structure. Test severity mapping (error->error, warning->warning, info->note). Test location mapping. Test rule metadata inclusion. | Status: not_done

---

## Phase 7: CLI

- [ ] **Create src/cli.ts** — Implement the CLI entry point using `node:util.parseArgs`. Add `#!/usr/bin/env node` shebang. Parse all flags: positional file paths/globs, `--stdin`, `--format-in`, `--template-syntax`, `--preset`, `--rule` (repeatable), `--config`, `--fix`, `--fix-dry-run`, `--format`, `--quiet`, `--verbose`, `--no-color`, `--max-warnings`, `--version`, `--help`. | Status: not_done
- [ ] **Implement file globbing and multi-file linting** — Expand glob patterns to file lists. Lint each file independently. Aggregate results across files for exit code determination. Support stdin reading when `--stdin` is specified or no files are given. | Status: not_done
- [ ] **Implement CLI environment variable fallback** — Read environment variables: `PROMPT_LINT_PRESET`, `PROMPT_LINT_FORMAT`, `PROMPT_LINT_CONFIG`, `PROMPT_LINT_MAX_WARNINGS`, `PROMPT_LINT_TEMPLATE_SYNTAX`. Environment variables are overridden by explicit CLI flags. | Status: not_done
- [ ] **Implement CLI exit codes** — Exit 0 for no errors (and warnings under `--max-warnings` threshold). Exit 1 for errors found or warnings exceeding `--max-warnings`. Exit 2 for configuration/usage errors (invalid flags, no input files, invalid config, file read failure). | Status: not_done
- [ ] **Implement --fix and --fix-dry-run in CLI** — For `--fix`: apply fixes and write modified content back to source files, then re-lint to report remaining issues. For `--fix-dry-run`: show unified diff of what would change without modifying files. | Status: not_done
- [ ] **Implement --help output** — Print formatted help text matching spec Section 8 (all flags, descriptions, default values). | Status: not_done
- [ ] **Implement --version output** — Read version from `package.json` and print it. | Status: not_done
- [ ] **Write CLI argument parsing tests** — Test all flag combinations, repeatable flags (`--rule`), environment variable fallback, flag precedence over env vars, invalid flag handling, --help, --version. | Status: not_done
- [ ] **Write CLI end-to-end tests** — Run the CLI binary against test fixture files. Verify exit codes for passing prompts (0), failing prompts (1), and configuration errors (2). Verify stdout output for human, JSON, and SARIF formats. Test `--stdin` with piped input. Test `--fix` modifies files. Test `--fix-dry-run` does not modify files. Test `--quiet` suppresses output. Test `--max-warnings` threshold. | Status: not_done

---

## Phase 8: Integration Tests

- [ ] **Write integration test: well-written prompt passes** — Lint the `well-written.md` fixture with the `recommended` preset. Assert zero errors and zero warnings. | Status: not_done
- [ ] **Write integration test: poorly-written prompt produces expected diagnostics** — Lint the `poorly-written.md` fixture. Assert the expected set of diagnostics (specific rule IDs, severities, approximate locations). | Status: not_done
- [ ] **Write integration test: security-focused prompt** — Lint the `security-risks.md` fixture with `security-only` preset. Assert security rules fire appropriately. | Status: not_done
- [ ] **Write integration test: template file with variables** — Lint the `template-handlebars.md` and `template-jinja2.md` fixtures. Assert variable extraction, orphaned/unused variable detection. | Status: not_done
- [ ] **Write integration test: message array format** — Lint the `message-array.json` fixture. Assert correct message array parsing and rule evaluation. | Status: not_done
- [ ] **Write integration test: Anthropic format** — Lint the `anthropic-format.json` fixture. Assert correct Anthropic format parsing and rule evaluation. | Status: not_done
- [ ] **Write integration test: auto-fix round-trip** — Apply fixes to a prompt, re-lint the fixed output. Assert fixed issues no longer produce diagnostics and unfixed issues remain. | Status: not_done
- [ ] **Write integration test: custom rule registration** — Register a custom rule via `customRules`, lint a prompt, assert the custom rule fires. Test custom rule severity override. | Status: not_done
- [ ] **Write integration test: inline disable directives** — Test that `<!-- prompt-lint-disable -->` suppresses diagnostics in the disabled region. Test `disable-next-line`. Test that diagnostics outside the disabled region are still reported. | Status: not_done
- [ ] **Write integration test: configuration file precedence** — Test that preset < config file < CLI rule overrides < inline directives. Verify a rule disabled in config is re-enabled by CLI flag. | Status: not_done

---

## Phase 9: Edge Case Tests

- [ ] **Test empty prompt input** — Empty string, empty file. Verify no crash, sensible report (zero diagnostics or specific structural warnings). | Status: not_done
- [ ] **Test whitespace-only prompt** — Verify behavior and no crash. | Status: not_done
- [ ] **Test prompt with only variables, no text** — Verify variable extraction works and rule evaluation handles sparse document. | Status: not_done
- [ ] **Test very large prompt (1MB+)** — Performance test. Verify completes in reasonable time (<1s) and does not crash. | Status: not_done
- [ ] **Test prompt with thousands of variables** — Performance test for variable extraction. | Status: not_done
- [ ] **Test binary file as input** — Verify graceful error handling, no crash. | Status: not_done
- [ ] **Test file with unrecognized extension** — Verify it is still processed (treated as plain text). | Status: not_done
- [ ] **Test JSON file that is valid JSON but not a message array** — Verify it is treated as plain text or produces appropriate error. | Status: not_done
- [ ] **Test deeply nested XML tags (10+ levels)** — Verify parser handles without stack overflow or excessive slowdown. | Status: not_done
- [ ] **Test mixed inline directive styles** — Multiple `disable`/`enable` directives for different rules, overlapping regions. | Status: not_done
- [ ] **Test custom rule that throws during execution** — Verify the error is caught, the rule is reported as errored, and other rules continue. | Status: not_done
- [ ] **Test config file with unknown rule IDs** — Verify warning or graceful handling, not a crash. | Status: not_done
- [ ] **Test config file with invalid JSON/YAML** — Verify exit code 2 and clear error message. | Status: not_done
- [ ] **Test glob pattern matching zero files** — Verify exit code 2 or appropriate behavior. | Status: not_done
- [ ] **Test multiple files with different template syntaxes** — Verify each file is parsed with its own detected syntax. | Status: not_done

---

## Phase 10: Documentation

- [ ] **Create README.md** — Write comprehensive README including: overview/description, installation instructions (npm, npx), quick start example, CLI usage with all flags, API usage with code examples (`lint`, `parse`, `createRule`), full rule catalog table (ID, category, severity, auto-fix, description), preset descriptions, configuration file format and examples, inline directives documentation, custom rules guide with example, output format examples (human, JSON, SARIF), CI/CD integration guide (GitHub Actions YAML example), pre-commit hook setup, environment variable reference, FAQ. | Status: not_done
- [ ] **Add JSDoc comments to all public API exports** — Document `lint()`, `parse()`, `createRule()`, and all exported types with JSDoc comments including parameter descriptions, return types, and usage examples. | Status: not_done
- [ ] **Create example configuration file** — Create `.prompt-lint.json` at project root as an example config file that is also used for self-linting documentation prompt files. | Status: not_done

---

## Phase 11: Build, Publish, and CI/CD

- [ ] **Verify TypeScript build succeeds** — Run `npm run build` and ensure all source files compile to `dist/` with declarations, declaration maps, and source maps. Verify `dist/index.js`, `dist/index.d.ts`, `dist/cli.js` are produced. | Status: not_done
- [ ] **Verify all tests pass** — Run `npm run test` and ensure 100% pass rate across all unit, integration, and edge case tests. | Status: not_done
- [ ] **Verify lint passes** — Run `npm run lint` on the package's own source code. Ensure zero errors. | Status: not_done
- [ ] **Bump version in package.json** — Set the appropriate version (0.1.0 for Phase 1 deliverables per spec roadmap). | Status: not_done
- [ ] **Verify CLI binary works via npx** — Test `npx prompt-lint` invocation from outside the project. Verify the shebang, argument parsing, and output all work correctly. | Status: not_done
- [ ] **Publish to npm** — Follow monorepo workflow: merge to master, `npm publish` from master. Verify `prepublishOnly` runs build. Verify package is accessible on npm. | Status: not_done
