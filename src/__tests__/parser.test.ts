import { describe, it, expect } from 'vitest';
import { parse } from '../parser.js';

describe('parse() - plain text', () => {
  it('detects plain text format', () => {
    const doc = parse('Analyze the following user query and provide an answer.');
    expect(doc.format).toBe('plain-text');
  });

  it('computes character count and estimated tokens', () => {
    const text = 'Hello world';
    const doc = parse(text);
    expect(doc.characterCount).toBe(text.length);
    expect(doc.estimatedTokens).toBe(Math.ceil(text.length / 4));
  });

  it('stores source text', () => {
    const text = 'You are a helpful assistant.';
    const doc = parse(text);
    expect(doc.source).toBe(text);
  });

  it('creates a single system role for plain text', () => {
    const doc = parse('Analyze this document carefully.');
    expect(doc.roles).toHaveLength(1);
    expect(doc.roles[0].role).toBe('system');
  });

  it('detects XML-style role blocks', () => {
    const text = '<system>You are an assistant.</system><user>Hello</user>';
    const doc = parse(text);
    expect(doc.roles.length).toBeGreaterThanOrEqual(2);
    expect(doc.roles[0].role).toBe('system');
    expect(doc.roles[1].role).toBe('user');
  });

  it('detects markdown heading role blocks', () => {
    const text = '# System\nYou are an assistant.\n# User\nHello there';
    const doc = parse(text);
    expect(doc.roles.length).toBeGreaterThanOrEqual(2);
    expect(doc.roles[0].role).toBe('system');
    expect(doc.roles[1].role).toBe('user');
  });
});

describe('parse() - message array format', () => {
  it('detects message-array format', () => {
    const doc = parse([
      { role: 'system', content: 'You are an assistant.' },
      { role: 'user', content: 'What is 2+2?' },
    ]);
    expect(doc.format).toBe('message-array');
  });

  it('extracts roles from message array', () => {
    const doc = parse([
      { role: 'system', content: 'You are an assistant.' },
      { role: 'user', content: 'What is 2+2?' },
    ]);
    expect(doc.roles).toHaveLength(2);
    expect(doc.roles[0].role).toBe('system');
    expect(doc.roles[0].content).toBe('You are an assistant.');
    expect(doc.roles[1].role).toBe('user');
    expect(doc.roles[1].content).toBe('What is 2+2?');
  });

  it('joins content into source string', () => {
    const doc = parse([
      { role: 'system', content: 'Be helpful.' },
      { role: 'user', content: 'Hello' },
    ]);
    expect(doc.source).toContain('Be helpful.');
    expect(doc.source).toContain('Hello');
  });
});

describe('parse() - anthropic format', () => {
  it('detects anthropic format', () => {
    const doc = parse({
      system: 'You are an assistant.',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(doc.format).toBe('anthropic');
  });

  it('extracts system and message roles', () => {
    const doc = parse({
      system: 'You are an assistant.',
      messages: [
        { role: 'user', content: 'What is 2+2?' },
        { role: 'assistant', content: 'It is 4.' },
      ],
    });
    expect(doc.roles).toHaveLength(3);
    expect(doc.roles[0].role).toBe('system');
    expect(doc.roles[1].role).toBe('user');
    expect(doc.roles[2].role).toBe('assistant');
  });
});

describe('parse() - variable extraction', () => {
  it('extracts {{var}} variables', () => {
    const doc = parse('Answer the question: {{user_query}}');
    const names = doc.variables.map((v) => v.name);
    expect(names).toContain('user_query');
  });

  it('extracts ${var} variables', () => {
    const doc = parse('Answer: ${question}');
    const names = doc.variables.map((v) => v.name);
    expect(names).toContain('question');
  });

  it('extracts %(var)s variables', () => {
    const doc = parse('Process %(input)s carefully');
    const names = doc.variables.map((v) => v.name);
    expect(names).toContain('input');
  });

  it('extracts {var} variables', () => {
    const doc = parse('Answer the {topic} question');
    const names = doc.variables.map((v) => v.name);
    expect(names).toContain('topic');
  });

  it('records correct offset for variable', () => {
    const text = 'Query: {{myVar}}';
    const doc = parse(text);
    const v = doc.variables.find((v) => v.name === 'myVar');
    expect(v).toBeDefined();
    expect(v!.occurrences[0].startOffset).toBe(text.indexOf('{{myVar}}'));
  });

  it('counts multiple occurrences of the same variable', () => {
    const doc = parse('{{x}} and {{x}} again');
    const v = doc.variables.find((v) => v.name === 'x');
    expect(v).toBeDefined();
    expect(v!.occurrences).toHaveLength(2);
  });

  it('returns empty variables array when no variables present', () => {
    const doc = parse('No variables here.');
    expect(doc.variables).toHaveLength(0);
  });

  it('does not double-extract variables from {{var}} as {var}', () => {
    const doc = parse('Use {{user_query}} in the prompt.');
    // Should only extract once with {{}} syntax, not also as {} syntax
    const names = doc.variables.map(v => v.name);
    const uniqueNames = [...new Set(names)];
    expect(names.length).toBe(uniqueNames.length);
    expect(doc.variables).toHaveLength(1);
    expect(doc.variables[0].syntax).toBe('{{}}');
  });

  it('does not double-extract variables from ${var} as {var}', () => {
    const doc = parse('Use ${user_name} in the prompt.');
    const names = doc.variables.map(v => v.name);
    expect(names).toHaveLength(1);
    expect(doc.variables[0].syntax).toBe('${}');
  });

  it('extracts standalone {var} correctly', () => {
    const doc = parse('Use {name} in the prompt.');
    expect(doc.variables).toHaveLength(1);
    expect(doc.variables[0].name).toBe('name');
    expect(doc.variables[0].syntax).toBe('{}');
  });

  it('extracts mixed syntaxes without duplicates', () => {
    const doc = parse('Hello {{greeting}}, ${user_name}, and {var}.');
    expect(doc.variables).toHaveLength(3);
    const syntaxes = doc.variables.map(v => v.syntax).sort();
    expect(syntaxes).toEqual(['${}', '{{}}', '{}']);
  });
});
