/**
 * Document Quality Utilities
 *
 * - cleanGeneratedDocument: strips model artifacts (reasoning blocks, chat preambles,
 *   whole-document code fences) from raw LLM output
 * - checkDocumentQuality: heuristic quality gate for generated PRDs/TDRs
 * - generateDocumentWithQualityGate: generate → check → revise once if needed
 */

import { ArchitectDocumentType, DOCUMENT_SECTIONS, SectionSpec } from './document-spec';

export interface QualityIssue {
  severity: 'error' | 'warning';
  message: string;
}

export interface QualityReport {
  /** True when there are no error-level issues */
  passed: boolean;
  issues: QualityIssue[];
  /** Headings of required sections that were not found */
  missingSections: string[];
}

const MERMAID_DIAGRAM_TYPES = [
  'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'stateDiagram-v2',
  'erDiagram', 'gantt', 'journey', 'pie', 'mindmap', 'timeline', 'C4Context', 'C4Container',
  'C4Component', 'quadrantChart', 'gitGraph', 'block-beta', 'architecture-beta',
];

/**
 * Template placeholders that indicate the model copied the template without filling it in.
 * Checked only outside code blocks, so Mermaid node labels like A[Web App] don't match.
 */
const PLACEHOLDER_PATTERNS: RegExp[] = [
  /\[(?:Today'?s Date|Today|Date|Name|Product Name|System Name|Persona Name|Job Title|Engineering Leads|TBD)\]/i,
  /\[(?:Pain|Metric|Requirement|Risk|Question|Objective|Deliverables?|Story|Component)\s+\d+[^\]]*\]/i,
  /(?<![-*+]\s)\[[XY](?:\s+\w+)?\](?!\()/,
];

/**
 * Remove artifacts that LLMs commonly wrap around a document:
 * - <think>...</think> reasoning blocks (qwen, deepseek and other reasoning models)
 * - A ```markdown fence around the entire document
 * - Short conversational preambles before the first H1 ("Sure! Here is your PRD:")
 */
export function cleanGeneratedDocument(raw: string): string {
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // A ```markdown fence opening before the first H1 (possibly after a preamble) and closing at the very end
  const fence = text.search(/^```(?:markdown|md)?[ \t]*$/im);
  const firstH1 = text.search(/^# /m);
  if (fence !== -1 && fence < 500 && (firstH1 === -1 || fence < firstH1) && /\n```\s*$/.test(text)) {
    text = text.slice(fence).replace(/^```[^\n]*\n/, '').replace(/\n```\s*$/, '').trim();
  }

  const h1 = text.search(/^# /m);
  if (h1 > 0 && h1 < 500) {
    text = text.slice(h1);
  }

  return text;
}

function stripCodeBlocks(content: string): string {
  return content.replace(/```[\s\S]*?```/g, '');
}

function normalizeHeading(line: string): string {
  return line
    .replace(/^#{2,3}\s+/, '')
    .replace(/^\d+(\.\d+)*\.?\s*/, '')
    .toLowerCase();
}

function findMissingSections(content: string, sections: SectionSpec[]): SectionSpec[] {
  const headings = stripCodeBlocks(content)
    .split('\n')
    .filter(line => /^#{2,3}\s+/.test(line))
    .map(normalizeHeading);

  return sections.filter(section => {
    const keywords = [section.heading, ...(section.aliases ?? [])].map(k => k.toLowerCase());
    return !headings.some(h => keywords.some(k => h.includes(k)));
  });
}

/**
 * Check a generated document against its section spec and basic Markdown hygiene
 *
 * @param content - Markdown document
 * @param documentType - 'PRD' or 'TDR'
 */
export function checkDocumentQuality(content: string, documentType: ArchitectDocumentType): QualityReport {
  const issues: QualityIssue[] = [];
  const sections = DOCUMENT_SECTIONS[documentType];

  if (!/^# \S/m.test(content)) {
    issues.push({ severity: 'error', message: 'Document has no H1 title (expected "# <Name> - ...").' });
  }

  const missing = findMissingSections(content, sections);
  for (const section of missing) {
    issues.push({
      severity: section.required === false ? 'warning' : 'error',
      message: `Missing section "${section.heading}": ${section.guidance}`,
    });
  }

  const fenceCount = (content.match(/^\s*```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) {
    issues.push({ severity: 'error', message: 'Unbalanced ``` code fences - a code block is not closed.' });
  }

  const mermaidBlocks = [...content.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)].map(m => m[1].trim());
  if (documentType === 'TDR' && mermaidBlocks.length === 0) {
    issues.push({ severity: 'error', message: 'TDR has no ```mermaid architecture diagram.' });
  }
  for (const block of mermaidBlocks) {
    const firstLine = block.split('\n').find(l => l.trim() && !l.trim().startsWith('%%'))?.trim() ?? '';
    const diagramType = firstLine.split(/\s+/)[0];
    if (!MERMAID_DIAGRAM_TYPES.includes(diagramType)) {
      issues.push({
        severity: 'error',
        message: `Mermaid block starts with "${firstLine.slice(0, 40)}" - expected a diagram type such as graph TB or sequenceDiagram.`,
      });
    }
    if (/^\s*\w+\[[^\]"]*[()][^\]"]*\]/m.test(block)) {
      issues.push({
        severity: 'warning',
        message: 'Mermaid node label contains unquoted parentheses, which breaks rendering. Use A["Label (detail)"].',
      });
    }
  }

  const prose = stripCodeBlocks(content);
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = prose.match(pattern);
    if (match) {
      issues.push({ severity: 'error', message: `Unfilled template placeholder found: "${match[0]}".` });
    }
  }

  if (content.length < 1500) {
    issues.push({ severity: 'warning', message: `Document is very short (${content.length} chars).` });
  }

  return {
    passed: !issues.some(i => i.severity === 'error'),
    issues,
    missingSections: missing.filter(s => s.required !== false).map(s => s.heading),
  };
}

/**
 * Format quality issues as a bullet list for prompts and logs
 */
export function formatQualityIssues(issues: QualityIssue[]): string {
  return issues.map(i => `- [${i.severity.toUpperCase()}] ${i.message}`).join('\n');
}

export type ChatMessage = { role: 'user'; content: string } | { role: 'assistant'; content: string };

/** Minimal agent surface needed for generation, so this stays testable without a real model */
export interface DocumentGenerator {
  generate(
    messages: ChatMessage[],
    options?: { toolChoice?: 'none' | 'auto'; maxSteps?: number }
  ): Promise<{ text: string }>;
}

export interface GeneratedDocument {
  content: string;
  report: QualityReport;
  /** Whether a revision pass was run */
  revised: boolean;
}

function errorCount(report: QualityReport): number {
  return report.issues.filter(i => i.severity === 'error').length;
}

/**
 * Generate a document, run the quality gate, and ask the agent for one revision
 * if there are error-level issues. Returns whichever attempt has fewer errors.
 *
 * Tools are disabled (toolChoice: 'none') so the response text is the document itself,
 * not a "document saved" confirmation from a tool call.
 */
export async function generateDocumentWithQualityGate(
  agent: DocumentGenerator,
  prompt: string,
  documentType: ArchitectDocumentType,
  onProgress?: (message: string) => void
): Promise<GeneratedDocument> {
  const options = { toolChoice: 'none' as const, maxSteps: 1 };

  const first = await agent.generate([{ role: 'user', content: prompt }], options);
  const draft = cleanGeneratedDocument(first.text);
  const draftReport = checkDocumentQuality(draft, documentType);

  if (draftReport.passed) {
    return { content: draft, report: draftReport, revised: false };
  }

  onProgress?.(`  ↻ Quality gate found ${errorCount(draftReport)} issue(s), requesting a revision...`);

  const revisionPrompt = `Your ${documentType} has these problems:

${formatQualityIssues(draftReport.issues)}

Rewrite the COMPLETE ${documentType} with every problem fixed. Keep all content that was already good.
Output ONLY the Markdown document - no commentary, no code fence around the whole document.`;

  const second = await agent.generate(
    [
      { role: 'user', content: prompt },
      { role: 'assistant', content: draft },
      { role: 'user', content: revisionPrompt },
    ],
    options
  );
  const revision = cleanGeneratedDocument(second.text);
  const revisionReport = checkDocumentQuality(revision, documentType);

  return errorCount(revisionReport) <= errorCount(draftReport)
    ? { content: revision, report: revisionReport, revised: true }
    : { content: draft, report: draftReport, revised: true };
}
