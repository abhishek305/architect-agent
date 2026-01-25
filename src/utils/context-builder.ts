/**
 * Context Builder Utility
 * 
 * Builds rich prompts from all available context sources:
 * - Free-form user context
 * - Source documents
 * - Pre-answered interview questions
 * - Structured data (tech stack, requirements, etc.)
 */

import { ProjectConfigV2, InterviewAnswers } from '../types/config';
import { readSourceDocuments, extractKeySections } from './document-reader';

/**
 * Context building options
 */
export interface ContextBuilderOptions {
  /** Maximum total context length in characters (default: 12000) */
  maxLength?: number;
  /** Whether to include source documents (default: true) */
  includeSourceDocs?: boolean;
  /** Maximum characters per source document (default: 4000) */
  maxPerDocument?: number;
  /** Base path for resolving source document paths */
  basePath?: string;
}

/**
 * Built context result
 */
export interface BuiltContext {
  /** The formatted context string for use in prompts */
  promptContext: string;
  /** Number of characters in the context */
  length: number;
  /** Sections included in the context */
  sections: string[];
  /** Source documents that were read */
  sourceDocuments: string[];
  /** Interview questions that were answered */
  answeredQuestions: string[];
  /** Whether the context was truncated */
  truncated: boolean;
}

/**
 * Convert camelCase or snake_case key to human-readable label
 * 
 * @example
 * formatKey('successMetrics') // 'Success Metrics'
 * formatKey('target_user') // 'Target User'
 */
export function formatKey(key: string): string {
  return key
    // Insert space before uppercase letters
    .replace(/([A-Z])/g, ' $1')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Capitalize first letter of each word
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Build prompt context from configuration
 * 
 * Combines all context sources into a single, formatted string
 * suitable for including in agent prompts.
 * 
 * Priority order:
 * 1. Free-form user context (highest priority)
 * 2. Source documents
 * 3. Pre-answered interview questions
 * 4. Structured data (tech stack, requirements)
 * 
 * @param config - Project configuration
 * @param options - Context building options
 * @returns Built context with metadata
 * 
 * @example
 * ```typescript
 * const context = buildPromptContext({
 *   projectName: 'My App',
 *   context: 'Building a notification system...',
 *   interviewAnswers: {
 *     problem: 'Users miss important updates...',
 *     successMetrics: 'Increase open rate to 60%'
 *   },
 *   techStack: ['Next.js', 'PostgreSQL']
 * });
 * 
 * console.log(context.promptContext);
 * // Output:
 * // ## Project: My App
 * // 
 * // ## User-Provided Context
 * // Building a notification system...
 * // 
 * // ## Interview Answers
 * // **Problem:** Users miss important updates...
 * // **Success Metrics:** Increase open rate to 60%
 * // 
 * // ## Tech Stack
 * // Next.js, PostgreSQL
 * ```
 */
export function buildPromptContext(
  config: ProjectConfigV2,
  options: ContextBuilderOptions = {}
): BuiltContext {
  const {
    maxLength = 12000,
    includeSourceDocs = true,
    maxPerDocument = 4000,
    basePath,
  } = options;

  const sections: string[] = [];
  const sourceDocuments: string[] = [];
  const answeredQuestions: string[] = [];
  let truncated = false;

  let context = '';

  // =========================================================================
  // Project header
  // =========================================================================
  context += `## Project: ${config.projectName}\n\n`;
  sections.push('Project Header');

  // =========================================================================
  // 1. Free-form user context (highest priority)
  // =========================================================================
  if (config.context && config.context.trim()) {
    context += `## User-Provided Context\n\n`;
    context += config.context.trim();
    context += '\n\n';
    sections.push('User Context');
  }

  // =========================================================================
  // 2. Source documents
  // =========================================================================
  if (includeSourceDocs && config.sourceDocuments && config.sourceDocuments.length > 0) {
    const docsResult = readSourceDocuments(config.sourceDocuments, basePath);
    
    if (docsResult.documents.length > 0) {
      context += `## Reference Documents\n`;
      
      for (const doc of docsResult.documents) {
        sourceDocuments.push(doc.filename);
        
        // Extract key sections if document is too long
        const docContent = doc.content.length > maxPerDocument
          ? extractKeySections(doc.content, maxPerDocument)
          : doc.content;
        
        context += `\n### Source: ${doc.filename}\n\n`;
        context += docContent.trim();
        context += '\n';
      }
      
      context += '\n';
      sections.push('Reference Documents');
    }
  }

  // =========================================================================
  // 3. Pre-answered interview questions
  // =========================================================================
  if (config.interviewAnswers) {
    const answers = config.interviewAnswers;
    const hasAnswers = Object.values(answers).some(v => v && v.trim());
    
    if (hasAnswers) {
      context += `## Interview Answers\n\n`;
      
      // Group answers by category for better organization
      const prdQuestions = ['problem', 'targetUser', 'successMetrics', 'mvpScope', 'businessContext'];
      const tdrQuestions = ['architecture', 'security', 'scale', 'deployment', 'integrations'];
      const frontendQuestions = ['renderingStrategy', 'stateManagement', 'bundleStrategy', 'performanceTargets', 'accessibility'];
      const storyQuestions = ['sprintPlanning', 'definitionOfDone', 'technicalConstraints'];
      
      const allKnownQuestions = [...prdQuestions, ...tdrQuestions, ...frontendQuestions, ...storyQuestions];
      
      // First, add known questions in order
      for (const key of allKnownQuestions) {
        const value = answers[key];
        if (value && value.trim()) {
          context += `**${formatKey(key)}:**\n${value.trim()}\n\n`;
          answeredQuestions.push(key);
        }
      }
      
      // Then, add any custom questions
      for (const [key, value] of Object.entries(answers)) {
        if (!allKnownQuestions.includes(key) && value && value.trim()) {
          context += `**${formatKey(key)}:**\n${value.trim()}\n\n`;
          answeredQuestions.push(key);
        }
      }
      
      sections.push('Interview Answers');
    }
  }

  // =========================================================================
  // 4. Structured data (tech stack, requirements)
  // =========================================================================
  if (config.techStack && config.techStack.length > 0) {
    context += `## Tech Stack\n\n`;
    context += config.techStack.join(', ');
    context += '\n\n';
    sections.push('Tech Stack');
  }

  // Legacy requirements (from v1 configs)
  if (config.requirements && config.requirements.length > 0) {
    // Only add if not already in interview answers
    if (!answeredQuestions.includes('mvpScope')) {
      context += `## Requirements\n\n`;
      context += config.requirements.map(r => `- ${r}`).join('\n');
      context += '\n\n';
      sections.push('Requirements');
    }
  }

  // Team context
  if (config.teamContext) {
    const tc = config.teamContext;
    const teamInfo: string[] = [];
    
    if (tc.velocity) teamInfo.push(`Velocity: ${tc.velocity} points/sprint`);
    if (tc.sprintDuration) teamInfo.push(`Sprint: ${tc.sprintDuration} weeks`);
    if (tc.teamSize) teamInfo.push(`Team Size: ${tc.teamSize} engineers`);
    
    if (teamInfo.length > 0) {
      context += `## Team Context\n\n`;
      context += teamInfo.join(' | ');
      context += '\n\n';
      sections.push('Team Context');
    }
  }

  // =========================================================================
  // Truncate if needed
  // =========================================================================
  if (context.length > maxLength) {
    context = context.slice(0, maxLength) + '\n\n...[context truncated]';
    truncated = true;
  }

  return {
    promptContext: context.trim(),
    length: context.length,
    sections,
    sourceDocuments,
    answeredQuestions,
    truncated,
  };
}

/**
 * Build a PRD-specific prompt with context
 * 
 * @param config - Project configuration
 * @param options - Context options
 * @returns Formatted prompt for PRD generation
 */
export function buildPRDPrompt(
  config: ProjectConfigV2,
  options: ContextBuilderOptions = {}
): string {
  const context = buildPromptContext(config, options);
  const timestamp = new Date().toISOString().split('T')[0];
  const author = config.author ?? 'Document Architect';

  return `## AUTOMATION MODE - DIRECT GENERATION

**IMPORTANT:** This is automation mode. Do NOT ask any interview questions.
Generate the complete PRD document immediately using the context below.
Output ONLY the Markdown document content. No greetings, no questions, no confirmations.

---

${context.promptContext}

---

## Document Requirements
- **Author:** ${author}
- **Date:** ${timestamp}

Generate the complete PRD now. Include:
1. Executive Summary (2-3 paragraphs)
2. Problem Statement with specific user pain points
3. Target Persona with role, goals, and frustrations
4. Goals and Success Metrics (table with KPIs)
5. Requirements organized by P0/P1/P2 priority
6. User Stories with acceptance criteria (at least 5 stories)
7. Timeline with milestones
8. Risks and mitigations

Start the document with: # ${config.projectName} - Product Requirements Document`;
}

/**
 * Build a TDR-specific prompt with context
 * 
 * @param config - Project configuration  
 * @param prdContent - Optional PRD content for reference
 * @param options - Context options
 * @returns Formatted prompt for TDR generation
 */
export function buildTDRPrompt(
  config: ProjectConfigV2,
  prdContent?: string,
  options: ContextBuilderOptions = {}
): string {
  const context = buildPromptContext(config, options);
  const timestamp = new Date().toISOString().split('T')[0];
  const author = config.author ?? 'Document Architect';

  let prompt = `## AUTOMATION MODE - DIRECT GENERATION

**IMPORTANT:** This is automation mode. Do NOT ask any interview questions.
Generate the complete TDR document immediately using the context below.
Output ONLY the Markdown document content. No greetings, no questions, no confirmations.

---

${context.promptContext}
`;

  if (prdContent) {
    const truncatedPRD = prdContent.length > 4000 
      ? extractKeySections(prdContent, 4000)
      : prdContent;
    
    prompt += `
---

## PRD Context (for reference)

${truncatedPRD}
`;
  }

  prompt += `
---

## Document Requirements
- **Author:** ${author}
- **Date:** ${timestamp}

Generate the complete TDR now. Include:
1. Executive Summary
2. System Architecture with Mermaid.js diagram (use graph TB)
3. Component breakdown table with responsibilities and SLAs
4. Database schema with SQL CREATE TABLE statements
5. API design with REST endpoints (method, path, request/response)
6. Security Audit (threat model, authentication code examples)
7. Scalability Plan (bottlenecks, SLIs/SLOs)
8. Implementation Guide with step-by-step instructions
9. Common Pitfalls for junior/mid developers
10. Code examples in TypeScript where applicable

Start the document with: # ${config.projectName} - Technical Design Review`;

  return prompt;
}

/**
 * Build a Frontend TDR-specific prompt with context
 * 
 * @param config - Project configuration
 * @param prdContent - Optional PRD content for reference
 * @param tdrContent - Optional TDR content for reference
 * @param options - Context options
 * @returns Formatted prompt for Frontend TDR generation
 */
export function buildFrontendTDRPrompt(
  config: ProjectConfigV2,
  prdContent?: string,
  tdrContent?: string,
  options: ContextBuilderOptions = {}
): string {
  const context = buildPromptContext(config, options);
  const timestamp = new Date().toISOString().split('T')[0];
  const author = config.author ?? 'Document Architect';

  // Filter frontend-related tech stack
  const frontendTech = config.techStack?.filter(tech => 
    /react|next|vue|angular|svelte|tailwind|css|typescript|javascript/i.test(tech)
  ) ?? config.techStack ?? [];

  let prompt = `## AUTOMATION MODE - DIRECT GENERATION

**IMPORTANT:** This is automation mode. Do NOT ask any interview questions.
Generate the complete Frontend TDR document immediately using the context below.
Output ONLY the Markdown document content. No greetings, no questions, no confirmations.

---

${context.promptContext}
`;

  if (prdContent) {
    prompt += `
---

## PRD Context (for reference)

${extractKeySections(prdContent, 2000)}
`;
  }

  if (tdrContent) {
    prompt += `
---

## TDR Context (for reference)

${extractKeySections(tdrContent, 2000)}
`;
  }

  prompt += `
---

## Document Requirements
- **Frontend Stack:** ${frontendTech.join(', ') || 'Next.js, React, TypeScript'}
- **Author:** ${author}
- **Date:** ${timestamp}

Generate the complete Frontend TDR now. Apply Vercel React/Next.js best practices. Include:
1. Technology Stack table with version and rationale
2. Application Structure (Next.js App Router src/ folder format)
3. Component Hierarchy with Mermaid.js diagram
4. Server vs Client Component Strategy with code examples
5. Performance Optimizations (waterfalls, bundle size, re-renders) with code
6. State Management Strategy (local, global, server state)
7. Accessibility Implementation with focus trap and form examples
8. Testing Strategy with Vitest/RTL/Playwright examples
9. Vercel Best Practices Checklist (all 8 priority categories)
10. Common Pitfalls with ❌ wrong and ✅ right code examples
11. Implementation Checklist with weekly breakdown

Start the document with: # ${config.projectName} - Frontend Technical Design Review`;

  return prompt;
}

/**
 * Build a User Stories prompt with context
 * 
 * @param config - Project configuration
 * @param documentContext - Combined PRD/TDR content for reference
 * @param options - Context options
 * @returns Formatted prompt for story generation
 */
export function buildStoriesPrompt(
  config: ProjectConfigV2,
  documentContext: string,
  options: ContextBuilderOptions = {}
): string {
  const context = buildPromptContext(config, options);
  const teamContext = config.teamContext ?? { velocity: 20, sprintDuration: 2, teamSize: 4 };

  return `## AUTOMATION MODE - DIRECT GENERATION

**IMPORTANT:** This is automation mode. Do NOT ask any interview questions.
Generate the complete User Stories document immediately using the context below.
Output ONLY the Markdown document content. No greetings, no questions, no confirmations.
Do NOT list available documents or ask which one to use.

---

${context.promptContext}

---

## Document Context

${documentContext}

---

## Team Context
- **Sprint Duration:** ${teamContext.sprintDuration} weeks
- **Team Velocity:** ${teamContext.velocity} story points per sprint
- **Team Size:** ${teamContext.teamSize} engineers

## Definition of Done
- Code complete with unit tests (>80% coverage)
- Code reviewed by at least 1 team member
- All acceptance criteria verified
- Integration tests passing
- Documentation updated
- Deployed to staging and smoke tested

Generate the complete User Stories document now. Include:

1. **Epics Overview Table**
   | Epic | Business Value | Success Metric | Dependencies | Effort |
   (Generate 3-5 epics)

2. **User Stories** (Generate 8-12 detailed stories)
   For each story include:
   - ID: US-001, US-002, etc.
   - Title
   - Format: "As a [persona], I want [action], so that [benefit]"
   - Acceptance Criteria (3-5 Given/When/Then statements)
   - Definition of Done (5-7 checkboxes)
   - Test Cases:
     * Happy Path table (Step, Action, Expected Result)
     * Edge Cases table (Scenario, Input, Expected Behavior)
     * Error Scenarios table (Scenario, Trigger, Expected Behavior)
   - Technical Notes (2-3 implementation hints)
   - Story Points: 1, 2, 3, 5, 8, or 13
   - Priority: P0, P1, or P2
   - Sprint: Sprint 1, Sprint 2, etc.

3. **Story Dependency Graph**
   \`\`\`mermaid
   graph LR
       US001 --> US002
       ...
   \`\`\`

4. **Sprint Plan Suggestion**
   | Sprint | Stories | Total Points | Focus |

Start the document with: # Epics & User Stories for ${config.projectName}`;
}

/**
 * Build context for interactive mode (pre-loaded context detection)
 * 
 * This builds a context string that agents can detect and use
 * to skip already-answered questions in interactive mode.
 * 
 * @param config - Project configuration
 * @returns Formatted context for interactive mode
 */
export function buildInteractiveContext(config: ProjectConfigV2): string {
  const context = buildPromptContext(config, { includeSourceDocs: true });
  
  if (context.sections.length <= 1) {
    // Only has project header, no real context
    return '';
  }

  return `## Pre-loaded Context

${context.promptContext}

---

**Note:** I've provided context above. Please review it and:
1. Skip questions that are already answered
2. Ask only for missing or unclear information
3. Proceed to document generation when you have enough context`;
}
