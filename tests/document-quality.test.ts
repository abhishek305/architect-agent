import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ChatMessage,
  checkDocumentQuality,
  cleanGeneratedDocument,
  generateDocumentWithQualityGate,
} from '../src/utils/document-quality';
import { PRD_SECTIONS, TDR_SECTIONS, SectionSpec } from '../src/utils/document-spec';
import { extractKeySections } from '../src/utils/document-reader';
import { buildPRDPrompt, buildTDRPrompt } from '../src/utils/context-builder';
import { buildArchitectInstructions } from '../src/mastra/agents/architect';

const filler = 'Concrete, project-specific content with real numbers like 250 req/s and a 99.9% SLO. '.repeat(4);

function buildDoc(title: string, sections: SectionSpec[], extra = ''): string {
  const body = sections.map((s, i) => `## ${i + 1}. ${s.heading}\n\n### ${i + 1}.1 Detail\n\n${filler}`).join('\n\n');
  return `# ${title}\n\n${body}\n\n${extra}`;
}

const MERMAID = '```mermaid\ngraph TB\n    API["Orders API (Node.js)"] --> DB[(PostgreSQL)]\n```';

test('cleanGeneratedDocument strips reasoning blocks, whole-document fences and preambles', () => {
  const raw = '<think>planning the doc...</think>\nSure! Here is your PRD:\n\n```markdown\n# Foo - PRD\n\n## 1. Summary\nText\n```';
  assert.equal(cleanGeneratedDocument(raw), '# Foo - PRD\n\n## 1. Summary\nText');
});

test('cleanGeneratedDocument keeps inner code blocks intact', () => {
  const doc = `# Foo\n\n${MERMAID}\n\nMore text`;
  assert.equal(cleanGeneratedDocument(doc), doc);
});

test('a complete PRD passes the quality gate', () => {
  const report = checkDocumentQuality(buildDoc('Foo - Product Requirements Document', PRD_SECTIONS), 'PRD');
  assert.deepEqual(report.issues.filter(i => i.severity === 'error'), []);
  assert.equal(report.passed, true);
});

test('a complete TDR with a valid Mermaid diagram passes', () => {
  const report = checkDocumentQuality(buildDoc('Foo - Technical Design Review', TDR_SECTIONS, MERMAID), 'TDR');
  assert.equal(report.passed, true, JSON.stringify(report.issues));
});

test('missing required sections are reported, optional ones only warn', () => {
  const sections = TDR_SECTIONS.filter(s => s.heading !== 'Alternatives Considered' && s.heading !== 'Cost Estimate');
  const report = checkDocumentQuality(buildDoc('Foo - TDR', sections, MERMAID), 'TDR');
  assert.equal(report.passed, false);
  assert.deepEqual(report.missingSections, ['Alternatives Considered']);
  assert.ok(report.issues.some(i => i.severity === 'warning' && i.message.includes('Cost Estimate')));
});

test('TDR without a Mermaid diagram fails', () => {
  const report = checkDocumentQuality(buildDoc('Foo - TDR', TDR_SECTIONS), 'TDR');
  assert.ok(report.issues.some(i => i.message.includes('no ```mermaid')));
});

test('invalid Mermaid and unquoted parentheses are caught', () => {
  const bad = '```mermaid\nApi --> Db\n```\n\n```mermaid\ngraph TB\n    A[Core API (Go)] --> B\n```';
  const report = checkDocumentQuality(buildDoc('Foo - TDR', TDR_SECTIONS, bad), 'TDR');
  assert.ok(report.issues.some(i => i.severity === 'error' && i.message.includes('expected a diagram type')));
  assert.ok(report.issues.some(i => i.message.includes('unquoted parentheses')));
});

test('unfilled template placeholders are errors; checkboxes, links and diagram labels are not', () => {
  const clean = checkDocumentQuality(
    buildDoc('Foo - PRD', PRD_SECTIONS, '- [x] done\n- [X] also done\n- [ ] todo\n[Docs](https://x.dev)\n' + MERMAID),
    'PRD'
  );
  assert.equal(clean.passed, true, JSON.stringify(clean.issues));

  for (const placeholder of ['[Pain 1]', "[Today's Date]", '[X weeks]', '[Requirement 1 - specific and testable]']) {
    const report = checkDocumentQuality(buildDoc('Foo - PRD', PRD_SECTIONS, `Value: ${placeholder}`), 'PRD');
    assert.equal(report.passed, false, `expected ${placeholder} to be flagged`);
  }
});

test('unbalanced code fences fail', () => {
  const report = checkDocumentQuality(buildDoc('Foo - PRD', PRD_SECTIONS, '```ts\nconst a = 1;'), 'PRD');
  assert.ok(report.issues.some(i => i.message.includes('Unbalanced')));
});

test('quality gate requests one revision with tools disabled and keeps the better draft', async () => {
  const calls: { messages: ChatMessage[]; options?: object }[] = [];
  const good = buildDoc('Foo - Product Requirements Document', PRD_SECTIONS);
  const agent = {
    async generate(messages: ChatMessage[], options?: object) {
      calls.push({ messages, options });
      return { text: calls.length === 1 ? '# Foo\n\n## 1. Executive Summary\n[Pain 1]' : `Here you go:\n${good}` };
    },
  };

  const result = await generateDocumentWithQualityGate(agent, 'make a PRD', 'PRD');

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].options, { toolChoice: 'none', maxSteps: 1 });
  assert.match(calls[1].messages[2].content, /Missing section "Problem Statement"/);
  assert.equal(result.revised, true);
  assert.equal(result.report.passed, true);
  assert.ok(result.content.startsWith('# Foo'));
});

test('quality gate skips revision when the first draft passes', async () => {
  let count = 0;
  const agent = {
    async generate() {
      count++;
      return { text: buildDoc('Foo - Product Requirements Document', PRD_SECTIONS) };
    },
  };
  const result = await generateDocumentWithQualityGate(agent, 'make a PRD', 'PRD');
  assert.equal(count, 1);
  assert.equal(result.revised, false);
});

test('extractKeySections captures numbered sections including their subsections', () => {
  const doc = [
    '# Foo - PRD',
    '## 1. Executive Summary', 'We build foo.',
    '## 2. Problem Statement', '### 2.1 Pain Points', 'Users lose 3 hours a week.',
    '## 3. Appendix', 'x'.repeat(5000),
  ].join('\n');
  const extracted = extractKeySections(doc, 2000);
  assert.match(extracted, /Users lose 3 hours a week/);
  assert.doesNotMatch(extracted, /Appendix/);
});

test('automation prompts and agent instructions use the shared section spec', () => {
  const config = { projectName: 'Foo', context: 'Build foo', techStack: ['Go', 'PostgreSQL'] };
  const prd = buildPRDPrompt(config);
  const tdr = buildTDRPrompt(config);
  const instructions = buildArchitectInstructions('2026-01-15');

  for (const s of PRD_SECTIONS) assert.ok(prd.includes(s.heading) && instructions.includes(s.heading), s.heading);
  for (const s of TDR_SECTIONS) assert.ok(tdr.includes(s.heading) && instructions.includes(s.heading), s.heading);
  assert.match(tdr, /project's tech stack \(Go, PostgreSQL\)/);
  assert.match(instructions, /Today's date is 2026-01-15/);
  // The old translation-CMS example must not leak into unrelated projects
  assert.doesNotMatch(instructions, /translations|content_type_id/);
});
