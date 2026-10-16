/**
 * Document Specifications
 *
 * Single source of truth for the sections of PRDs and TDRs. Used by:
 * - The Architect Agent's system instructions (interactive mode)
 * - The automation prompt builders (context-builder.ts)
 * - The document quality checker (document-quality.ts)
 *
 * Keeping these in one place ensures interactive and automated documents
 * have the same structure, and that the quality gate checks for exactly
 * what the agent was asked to produce.
 */

export type ArchitectDocumentType = 'PRD' | 'TDR';

export interface SectionSpec {
  /** Canonical H2 heading (without numbering) */
  heading: string;
  /** Alternative heading keywords that also satisfy this section */
  aliases?: string[];
  /** What the section must contain */
  guidance: string;
  /** Whether the quality gate treats a missing section as an error (default: true) */
  required?: boolean;
}

export const PRD_SECTIONS: SectionSpec[] = [
  {
    heading: 'Executive Summary',
    aliases: ['Summary', 'Overview'],
    guidance: '2-3 sentences: what we are building, for whom, and why now.',
  },
  {
    heading: 'Problem Statement',
    aliases: ['Problem'],
    guidance:
      'Pain point table (Pain Point | Impact | Current Workaround | Evidence) and a target persona ' +
      '(role, technical level, goals, frustrations, current tools).',
  },
  {
    heading: 'Goals & Non-Goals',
    aliases: ['Goals', 'Objectives'],
    guidance: 'Numbered objectives, plus an explicit list of non-goals so scope creep is visible.',
  },
  {
    heading: 'Success Metrics',
    aliases: ['Metrics', 'KPI'],
    guidance:
      'KPI table (KPI | Baseline | Target | Timeframe | Measurement Method). Every target is a number. ' +
      'Include at least one guardrail metric (something that must NOT get worse).',
  },
  {
    heading: 'Functional Requirements',
    aliases: ['Requirements'],
    guidance:
      'Grouped as P0 (MVP), P1, P2. Give each an ID (FR-1, FR-2...) and phrase it so QA could test it.',
  },
  {
    heading: 'Non-Functional Requirements',
    aliases: ['NFR', 'Quality Attributes'],
    guidance:
      'IDs NFR-1... covering performance, availability, security & privacy, accessibility, and compliance, ' +
      'each with a measurable threshold.',
  },
  {
    heading: 'User Stories',
    aliases: ['Stories'],
    guidance: 'Key stories in As a / I want / So that form, each with Given/When/Then acceptance criteria.',
  },
  {
    heading: 'Out of Scope',
    aliases: ['Scope'],
    guidance: 'What we are explicitly NOT building in this release, and ideas considered but rejected.',
  },
  {
    heading: 'Dependencies & Assumptions',
    aliases: ['Assumptions', 'Dependencies'],
    guidance:
      'Teams, systems and vendors we depend on, plus every assumption you made to fill gaps in the input.',
  },
  {
    heading: 'Timeline & Milestones',
    aliases: ['Timeline', 'Milestones', 'Roadmap'],
    guidance: 'Phase table (Phase | Duration | Deliverables | Exit Criteria).',
  },
  {
    heading: 'Risks & Mitigations',
    aliases: ['Risks'],
    guidance: 'Risk table (Risk | Probability | Impact | Mitigation | Owner).',
  },
  {
    heading: 'Open Questions',
    aliases: ['Questions'],
    guidance: 'Unresolved decisions, each with who should answer it.',
  },
];

export const TDR_SECTIONS: SectionSpec[] = [
  {
    heading: 'Executive Summary',
    aliases: ['Summary', 'Overview'],
    guidance: '2-3 sentences: what we are building and what makes it technically challenging.',
  },
  {
    heading: 'Context & Scope',
    aliases: ['Context', 'Scope', 'Goals'],
    guidance:
      'Goals, non-goals, key constraints (team, budget, deadlines, compliance), and the PRD requirements ' +
      'this design satisfies.',
  },
  {
    heading: 'Architecture Overview',
    aliases: ['Architecture', 'System Design'],
    guidance:
      'A Mermaid system diagram, a component table (Component | Technology | Responsibility | SLA), ' +
      'a numbered data flow for the primary request path, and a Mermaid sequenceDiagram for the most critical flow.',
  },
  {
    heading: 'Alternatives Considered',
    aliases: ['Alternatives', 'Design Decisions', 'Trade-offs', 'Tradeoffs'],
    guidance:
      'For the 2-3 most consequential decisions: Option | Pros | Cons | Decision table, ' +
      'plus a one-paragraph rationale (ADR style).',
  },
  {
    heading: 'Data Design',
    aliases: ['Data Model', 'Schema', 'Database'],
    guidance:
      'Schema in the chosen datastore\'s own syntax, indexes and the queries they serve, ' +
      'data retention, and the migration strategy.',
  },
  {
    heading: 'API Design',
    aliases: ['API', 'Interfaces', 'Contracts'],
    guidance:
      'Endpoint/event table (Method | Path | Purpose | Auth), one full request/response example, ' +
      'error format, pagination, idempotency and versioning.',
  },
  {
    heading: 'Security & Privacy',
    aliases: ['Security'],
    guidance:
      'Authentication, authorization model, threat model table (Threat | Likelihood | Impact | Mitigation), ' +
      'secrets management, PII handling, and compliance.',
  },
  {
    heading: 'Scalability & Reliability',
    aliases: ['Scalability', 'Reliability', 'Performance'],
    guidance:
      'Back-of-envelope capacity estimates with real numbers, bottlenecks, caching strategy, and a failure mode ' +
      'table (Failure | Detection | Mitigation | User Impact) covering timeouts, retries and circuit breakers.',
  },
  {
    heading: 'Observability',
    aliases: ['Monitoring'],
    guidance: 'SLI/SLO table, key metrics, logging (no PII), tracing, and alerts with thresholds.',
  },
  {
    heading: 'Deployment & Rollout',
    aliases: ['Deployment', 'Rollout', 'Release'],
    guidance: 'Environments, CI/CD, feature flags, data migration/backfill, and an explicit rollback plan.',
  },
  {
    heading: 'Implementation Plan',
    aliases: ['Implementation Guide', 'Implementation', 'Milestones'],
    guidance: 'Phased milestones with deliverables and rough estimates, ordered by dependency.',
  },
  {
    heading: 'Common Pitfalls',
    aliases: ['Pitfalls'],
    guidance:
      'At least 3 pitfalls specific to THIS design, each with a short ❌ wrong / ✅ right code pair ' +
      'in the project\'s language and a one-line "why".',
  },
  {
    heading: 'Testing Strategy',
    aliases: ['Testing', 'Test Plan'],
    guidance: 'Unit, integration, end-to-end and load testing approach, with one example test for a critical path.',
  },
  {
    heading: 'Cost Estimate',
    aliases: ['Cost'],
    guidance: 'Rough monthly infrastructure and third-party cost at launch and at 10x scale.',
    required: false,
  },
  {
    heading: 'Risks, Assumptions & Open Questions',
    aliases: ['Risks', 'Assumptions', 'Open Questions'],
    guidance: 'Technical risks, every assumption you made to fill gaps, and decisions still needed (with owner).',
  },
];

export const DOCUMENT_SECTIONS: Record<ArchitectDocumentType, SectionSpec[]> = {
  PRD: PRD_SECTIONS,
  TDR: TDR_SECTIONS,
};

export const DOCUMENT_TITLES: Record<ArchitectDocumentType, string> = {
  PRD: 'Product Requirements Document',
  TDR: 'Technical Design Review',
};

/**
 * Render a numbered section outline for use in prompts
 *
 * @example
 * renderSectionOutline(PRD_SECTIONS)
 * // ## 1. Executive Summary
 * // 2-3 sentences: what we are building, for whom, and why now.
 * // ...
 */
export function renderSectionOutline(sections: SectionSpec[]): string {
  return sections
    .map((s, i) => `## ${i + 1}. ${s.heading}${s.required === false ? ' (optional)' : ''}\n${s.guidance}`)
    .join('\n\n');
}
