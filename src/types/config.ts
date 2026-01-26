/**
 * Document Architect - Configuration Types (v2)
 * 
 * This module defines the flexible configuration schema that accepts rich context
 * from PMs and engineers. It supports:
 * - Free-form context for any background information
 * - Source document paths to read and use as context
 * - Pre-answered interview questions to skip interactive prompts
 * - Backward compatibility with v1 config format
 */

/**
 * Team context for story generation and sprint planning
 */
export interface TeamContext {
  /** Story points the team completes per sprint (default: 20) */
  velocity?: number;
  /** Sprint duration in weeks (default: 2) */
  sprintDuration?: number;
  /** Number of engineers on the team (default: 4) */
  teamSize?: number;
}

/**
 * Pre-answered interview questions
 * 
 * Use these to skip specific questions in interactive mode
 * or to provide rich context in automation mode.
 * 
 * Any custom keys are also allowed for domain-specific context.
 */
export interface InterviewAnswers {
  // PRD-related questions
  /** What problem are you solving? Who experiences it? */
  problem?: string;
  /** Who are your target users? Technical level? Current alternatives? */
  targetUser?: string;
  /** How will you measure success? KPIs and targets? */
  successMetrics?: string;
  /** What's in MVP vs future phases? P0/P1/P2 priorities? */
  mvpScope?: string;
  /** Timeline, budget, strategic importance, risks if not built? */
  businessContext?: string;

  // TDR-related questions
  /** System architecture, components, data flow? */
  architecture?: string;
  /** Security requirements, compliance, authentication? */
  security?: string;
  /** Scale expectations, performance targets, bottlenecks? */
  scale?: string;
  /** Deployment strategy, CI/CD, monitoring? */
  deployment?: string;
  /** Integration points, external APIs, databases? */
  integrations?: string;

  // Frontend TDR-related questions
  /** Server vs client components, rendering strategy? */
  renderingStrategy?: string;
  /** State management approach (local, global, server)? */
  stateManagement?: string;
  /** Bundle size targets, code splitting strategy? */
  bundleStrategy?: string;
  /** Core Web Vitals targets (LCP, CLS, FID)? */
  performanceTargets?: string;
  /** Accessibility requirements (WCAG level, focus management)? */
  accessibility?: string;

  // Story Builder-related questions
  /** Sprint planning preferences, story point scale? */
  sprintPlanning?: string;
  /** Definition of Done requirements? */
  definitionOfDone?: string;
  /** Technical constraints that affect story breakdown? */
  technicalConstraints?: string;

  // Allow any custom keys for domain-specific context
  [key: string]: string | undefined;
}

/**
 * Generation mode selection
 * 
 * - PRD: Generate only Product Requirements Document
 * - TDR: Generate only Technical Design Review
 * - FRONTEND_TDR: Generate only Frontend Technical Design Review
 * - STORIES: Generate only User Stories and Epics
 * - ALL: Generate all documents (default)
 */
export type GenerationMode = 'PRD' | 'TDR' | 'FRONTEND_TDR' | 'STORIES' | 'ALL';

/**
 * Project Configuration v2
 * 
 * The enhanced configuration schema that supports rich, flexible context
 * while maintaining backward compatibility with v1 configs.
 * 
 * @example Minimal config (just project name and context)
 * ```json
 * {
 *   "projectName": "API Gateway",
 *   "context": "We need an API gateway for auth and rate limiting."
 * }
 * ```
 * 
 * @example Full config with interview answers
 * ```json
 * {
 *   "projectName": "Customer Portal",
 *   "mode": "ALL",
 *   "context": "Enterprise customer portal for self-service...",
 *   "sourceDocuments": ["docs/existing-prd.md"],
 *   "interviewAnswers": {
 *     "problem": "Customers call support for simple tasks...",
 *     "targetUser": "Enterprise IT admins..."
 *   },
 *   "techStack": ["Next.js", "PostgreSQL"],
 *   "hasFrontend": true
 * }
 * ```
 */
export interface ProjectConfigV2 {
  // =========================================================================
  // Required field (minimal config)
  // =========================================================================
  
  /** Project name (used in document titles and filenames) */
  projectName: string;

  // =========================================================================
  // NEW: Flexible context fields
  // =========================================================================

  /**
   * Free-form context about the project
   * 
   * This is the main input for real users. Can include:
   * - Product briefs from stakeholder meetings
   * - Architecture notes from tech discussions
   * - Competitive analysis
   * - User research findings
   * - Any background that helps generate better documents
   * 
   * @example
   * "After our quarterly review, we decided to build a notification system.
   *  Currently using email-only with 15% open rates. Users want push
   *  notifications. Main competitor charges $500/mo which is too expensive."
   */
  context?: string;

  /**
   * Paths to existing documents to read and use as context
   * 
   * Supports:
   * - Markdown files (.md)
   * - Text files (.txt)
   * - Relative paths (from project root)
   * - Absolute paths
   * 
   * @example
   * ["docs/existing-prd.md", "notes/architecture-meeting.md"]
   */
  sourceDocuments?: string[];

  /**
   * Pre-answered interview questions
   * 
   * Use to skip specific questions or provide rich context.
   * Any keys not provided will trigger the agent to ask.
   * 
   * @see InterviewAnswers for available keys
   */
  interviewAnswers?: InterviewAnswers;

  /**
   * Explicit mode selection for document generation
   * 
   * - PRD: Generate only Product Requirements Document
   * - TDR: Generate only Technical Design Review  
   * - FRONTEND_TDR: Generate only Frontend TDR (Next.js/React)
   * - STORIES: Generate only User Stories and Epics
   * - ALL: Generate all documents (default)
   */
  mode?: GenerationMode;

  // =========================================================================
  // EXISTING: Backward compatible fields (v1 schema)
  // =========================================================================

  /**
   * Project description (DEPRECATED: use `context` instead)
   * 
   * If `context` is not provided, this field will be used as the context.
   * Kept for backward compatibility with v1 configs.
   */
  description?: string;

  /**
   * List of requirements (DEPRECATED: use `interviewAnswers.mvpScope` instead)
   * 
   * If provided without `interviewAnswers.mvpScope`, these will be
   * converted to MVP scope context.
   */
  requirements?: string[];

  /**
   * Technology stack
   * 
   * List of technologies, frameworks, and tools.
   * Used to tailor technical recommendations.
   * 
   * @example ["Next.js 14", "TypeScript", "PostgreSQL", "Redis"]
   */
  techStack?: string[];

  /**
   * Whether the project has a frontend component
   * 
   * When true, generates a Frontend TDR with React/Next.js best practices.
   */
  hasFrontend?: boolean;

  /**
   * Team context for story generation
   */
  teamContext?: TeamContext;

  /**
   * Jira project key for CSV export
   * 
   * If provided, generates a Jira-compatible CSV for bulk import.
   * 
   * @example "PROJ", "NOTIFY", "PORTAL"
   */
  jiraProjectKey?: string;

  /**
   * Document author name
   * 
   * @default "Document Architect (Automation)"
   */
  author?: string;
}

/**
 * Legacy configuration format (v1)
 * 
 * For backward compatibility. Will be normalized to v2.
 */
export interface ProjectConfigV1 {
  projectName: string;
  description: string;
  requirements: string[];
  techStack: string[];
  hasFrontend?: boolean;
  teamContext?: TeamContext;
  jiraProjectKey?: string;
  author?: string;
}

/**
 * Type guard to check if config is v1 format
 */
export function isV1Config(config: unknown): config is ProjectConfigV1 {
  const c = config as Record<string, unknown>;
  return (
    typeof c.projectName === 'string' &&
    typeof c.description === 'string' &&
    Array.isArray(c.requirements) &&
    c.requirements.length > 0 &&
    !c.context &&
    !c.interviewAnswers
  );
}

/**
 * Normalize any config input to v2 format
 * 
 * Handles:
 * - v1 configs (description + requirements)
 * - Partial v2 configs
 * - Minimal configs (just projectName + context)
 * 
 * @param input - Raw configuration input
 * @returns Normalized v2 configuration
 */
export function normalizeConfig(input: unknown): ProjectConfigV2 {
  const config = input as Record<string, unknown>;
  const result: ProjectConfigV2 = {
    projectName: typeof config.projectName === 'string' 
      ? config.projectName 
      : 'Untitled Project',
  };

  // Copy through optional fields
  if (typeof config.context === 'string') {
    result.context = config.context;
  }
  if (Array.isArray(config.sourceDocuments)) {
    result.sourceDocuments = config.sourceDocuments as string[];
  }
  if (config.interviewAnswers && typeof config.interviewAnswers === 'object') {
    result.interviewAnswers = config.interviewAnswers as InterviewAnswers;
  }
  if (typeof config.mode === 'string') {
    result.mode = config.mode as GenerationMode;
  }
  if (Array.isArray(config.techStack)) {
    result.techStack = config.techStack as string[];
  }
  if (typeof config.hasFrontend === 'boolean') {
    result.hasFrontend = config.hasFrontend;
  }
  if (config.teamContext && typeof config.teamContext === 'object') {
    result.teamContext = config.teamContext as TeamContext;
  }
  if (typeof config.jiraProjectKey === 'string') {
    result.jiraProjectKey = config.jiraProjectKey;
  }
  if (typeof config.author === 'string') {
    result.author = config.author;
  }

  // =========================================================================
  // Backward compatibility: Migrate v1 fields to v2
  // =========================================================================

  // If legacy 'description' field exists but no 'context', use description
  if (typeof config.description === 'string' && !result.context) {
    result.context = config.description;
  }

  // If legacy 'requirements' array exists, convert to mvpScope
  if (Array.isArray(config.requirements) && config.requirements.length > 0) {
    result.interviewAnswers = result.interviewAnswers ?? {};
    if (!result.interviewAnswers.mvpScope) {
      result.interviewAnswers.mvpScope = 
        `Key requirements:\n- ${(config.requirements as string[]).join('\n- ')}`;
    }
  }

  return result;
}

/**
 * Validate a configuration and return any errors
 * 
 * @param config - Configuration to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateConfig(config: ProjectConfigV2): string[] {
  const errors: string[] = [];

  // Required: projectName
  if (!config.projectName || typeof config.projectName !== 'string') {
    errors.push('Missing required field: projectName');
  }

  // At least one of: context, description, or sourceDocuments
  const hasContext = config.context && config.context.trim().length > 0;
  const hasSourceDocs = config.sourceDocuments && config.sourceDocuments.length > 0;
  const hasInterviewAnswers = config.interviewAnswers && 
    Object.values(config.interviewAnswers).some(v => v && v.trim().length > 0);

  if (!hasContext && !hasSourceDocs && !hasInterviewAnswers) {
    errors.push(
      'Configuration needs context. Provide at least one of: ' +
      'context, sourceDocuments, or interviewAnswers'
    );
  }

  // Validate mode if provided
  if (config.mode) {
    const validModes: GenerationMode[] = ['PRD', 'TDR', 'FRONTEND_TDR', 'STORIES', 'ALL'];
    if (!validModes.includes(config.mode)) {
      errors.push(`Invalid mode: ${config.mode}. Valid modes: ${validModes.join(', ')}`);
    }
  }

  // Validate sourceDocuments paths (just check they're strings)
  if (config.sourceDocuments) {
    for (const docPath of config.sourceDocuments) {
      if (typeof docPath !== 'string') {
        errors.push(`Invalid sourceDocument path: ${docPath}`);
      }
    }
  }

  return errors;
}
