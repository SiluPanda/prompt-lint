import type { PromptSource, PromptDocument, SourceLocation } from './types.js';

export function locationFromOffset(text: string, start: number, end: number): SourceLocation {
  let line = 1;
  let col = 1;
  for (let i = 0; i < start && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  const startLine = line;
  const startColumn = col;

  let eLine = startLine;
  let eCol = startColumn;
  for (let i = start; i < end && i < text.length; i++) {
    if (text[i] === '\n') {
      eLine++;
      eCol = 1;
    } else {
      eCol++;
    }
  }

  return {
    startOffset: start,
    endOffset: end,
    startLine,
    startColumn,
    endLine: eLine,
    endColumn: eCol,
  };
}

interface RawRole {
  role: string;
  content: string;
  startOffset: number;
}

function extractVariables(
  text: string
): Array<{ name: string; syntax: string; occurrences: SourceLocation[] }> {
  const patterns: Array<{ re: RegExp; syntax: string }> = [
    { re: /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, syntax: '{{}}' },
    { re: /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, syntax: '${}' },
    { re: /%\(([a-zA-Z_][a-zA-Z0-9_]*)\)s/g, syntax: '%(...)s' },
    { re: /(?<!\{|\$)\{([a-zA-Z_][a-zA-Z0-9_]*)\}(?!\})/g, syntax: '{}' },
  ];

  const map = new Map<string, { name: string; syntax: string; occurrences: SourceLocation[] }>();

  for (const { re, syntax } of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const name = m[1];
      const start = m.index;
      const end = start + m[0].length;
      const loc = locationFromOffset(text, start, end);
      const key = `${name}:${syntax}`;
      if (!map.has(key)) {
        map.set(key, { name, syntax, occurrences: [] });
      }
      map.get(key)!.occurrences.push(loc);
    }
  }

  return Array.from(map.values());
}

function makePlainTextRoles(source: string): RawRole[] {
  // Try to detect # System / ## System / <system> patterns
  const roles: RawRole[] = [];

  // XML-style: <system>...</system>, <user>...</user>, <assistant>...</assistant>
  const xmlRe = /<(system|user|assistant|developer)>([\s\S]*?)<\/\1>/gi;
  let xmlMatch: RegExpExecArray | null;
  const xmlFound: RawRole[] = [];
  while ((xmlMatch = xmlRe.exec(source)) !== null) {
    xmlFound.push({
      role: xmlMatch[1].toLowerCase(),
      content: xmlMatch[2].trim(),
      startOffset: xmlMatch.index,
    });
  }

  if (xmlFound.length > 0) {
    return xmlFound;
  }

  // Markdown heading style: # System / ## System / # User etc.
  const headingRe = /^#{1,3}\s*(system|user|assistant|developer)\s*$/gim;
  let headingMatch: RegExpExecArray | null;
  const headings: Array<{ role: string; offset: number }> = [];
  while ((headingMatch = headingRe.exec(source)) !== null) {
    headings.push({ role: headingMatch[1].toLowerCase(), offset: headingMatch.index });
  }

  if (headings.length > 0) {
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      const nextOffset = i + 1 < headings.length ? headings[i + 1].offset : source.length;
      const sectionText = source.slice(h.offset, nextOffset);
      // strip the heading line itself
      const contentStart = sectionText.indexOf('\n');
      const content = contentStart >= 0 ? sectionText.slice(contentStart + 1).trim() : '';
      roles.push({ role: h.role, content, startOffset: h.offset });
    }
    return roles;
  }

  // Fallback: whole document is one "system" block
  return [{ role: 'system', content: source, startOffset: 0 }];
}

function isAnthropicPrompt(source: unknown): source is import('./types.js').AnthropicPrompt {
  return (
    typeof source === 'object' &&
    source !== null &&
    'system' in source &&
    'messages' in source &&
    Array.isArray((source as Record<string, unknown>).messages)
  );
}

function isMessageArray(source: unknown): source is import('./types.js').PromptMessage[] {
  return (
    Array.isArray(source) &&
    source.length > 0 &&
    typeof source[0] === 'object' &&
    source[0] !== null &&
    'role' in source[0] &&
    'content' in source[0]
  );
}

export function parse(source: PromptSource): PromptDocument {
  if (isMessageArray(source)) {
    // Build joined source text with role markers
    const parts: string[] = [];
    const rawRoles: RawRole[] = [];
    let offset = 0;
    for (const msg of source) {
      const marker = `[${msg.role}]\n`;
      const block = marker + msg.content;
      rawRoles.push({ role: msg.role, content: msg.content, startOffset: offset + marker.length });
      parts.push(block);
      offset += block.length + 1; // +1 for '\n' separator
    }
    const fullText = parts.join('\n');

    const roles = rawRoles.map((r) => ({
      role: r.role,
      content: r.content,
      location: locationFromOffset(fullText, r.startOffset, r.startOffset + r.content.length),
    }));

    return {
      source: fullText,
      format: 'message-array',
      roles,
      variables: extractVariables(fullText),
      estimatedTokens: Math.ceil(fullText.length / 4),
      characterCount: fullText.length,
    };
  }

  if (isAnthropicPrompt(source)) {
    const systemBlock = `[system]\n${source.system}`;
    const messageParts = source.messages.map((m) => `[${m.role}]\n${m.content}`);
    const fullText = [systemBlock, ...messageParts].join('\n');

    const roles: Array<{ role: string; content: string; location: SourceLocation }> = [];
    // system
    const sysContentOffset = '[system]\n'.length;
    roles.push({
      role: 'system',
      content: source.system,
      location: locationFromOffset(fullText, sysContentOffset, sysContentOffset + source.system.length),
    });
    let runningOffset = systemBlock.length + 1;
    for (const msg of source.messages) {
      const marker = `[${msg.role}]\n`;
      const contentOffset = runningOffset + marker.length;
      roles.push({
        role: msg.role,
        content: msg.content,
        location: locationFromOffset(fullText, contentOffset, contentOffset + msg.content.length),
      });
      runningOffset += marker.length + msg.content.length + 1;
    }

    return {
      source: fullText,
      format: 'anthropic',
      roles,
      variables: extractVariables(fullText),
      estimatedTokens: Math.ceil(fullText.length / 4),
      characterCount: fullText.length,
    };
  }

  // Plain text
  const text = typeof source === 'string' ? source : '';
  const rawRoles = makePlainTextRoles(text);
  const roles = rawRoles.map((r) => ({
    role: r.role,
    content: r.content,
    location: locationFromOffset(text, r.startOffset, r.startOffset + r.content.length),
  }));

  return {
    source: text,
    format: 'plain-text',
    roles,
    variables: extractVariables(text),
    estimatedTokens: Math.ceil(text.length / 4),
    characterCount: text.length,
  };
}
