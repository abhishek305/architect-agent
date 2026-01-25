import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Document Architect Pipeline
 * 
 * A master orchestration workflow that automates the full document generation pipeline:
 * PRD -> TDR -> Frontend TDR (optional) -> User Stories
 * 
 * This workflow takes structured JSON input and runs end-to-end without user interaction,
 * enabling CI/CD integration and API-based automation.
 * 
 * Flow:
 * 1. Generate PRD → Product Requirements Document
 * 2. Generate TDR → Technical Design Review (uses PRD as context)
 * 3. Generate Frontend TDR → Frontend-specific TDR (conditional, if hasFrontend)
 * 4. Generate Stories → Epics and User Stories from all documents
 * 5. Export & Save → Save all files, optionally export Jira CSV
 */

// ============================================================================
// Input/Output Schemas
// ============================================================================

const TeamContextSchema = z.object({
  velocity: z.number().default(20).describe('Team velocity in story points per sprint'),
  sprintDuration: z.number().default(2).describe('Sprint duration in weeks'),
  teamSize: z.number().default(4).describe('Number of engineers on the team'),
});

const PipelineInputSchema = z.object({
  projectName: z.string().describe('Name of the project'),
  description: z.string().describe('Brief description of the project/feature'),
  requirements: z.array(z.string()).describe('List of key requirements'),
  techStack: z.array(z.string()).describe('Technologies to be used'),
  hasFrontend: z.boolean().default(false).describe('Whether this is a frontend-heavy application'),
  teamContext: TeamContextSchema.optional(),
  jiraProjectKey: z.string().optional().describe('Jira project key for CSV export (e.g., "NOTIFY")'),
  author: z.string().default('Document Architect').describe('Author name for documents'),
});

const PipelineOutputSchema = z.object({
  success: z.boolean(),
  documents: z.object({
    prd: z.string().describe('Path to PRD file'),
    tdr: z.string().describe('Path to TDR file'),
    frontendTdr: z.string().nullable().describe('Path to Frontend TDR file (null if not generated)'),
    stories: z.string().describe('Path to stories file'),
  }),
  exports: z.object({
    jira: z.string().nullable().describe('Path to Jira CSV export (null if not generated)'),
  }),
  summary: z.object({
    epics: z.number(),
    stories: z.number(),
    totalPoints: z.number(),
  }),
  message: z.string(),
});

// ============================================================================
// Helper Functions
// ============================================================================

function getTimestamp(): string {
  return new Date().toISOString().split('T')[0];
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function saveDocument(content: string, filename: string, subDir?: string): string {
  const projectRoot = process.cwd();
  const docsDir = subDir 
    ? path.join(projectRoot, 'docs', subDir)
    : path.join(projectRoot, 'docs');
  
  ensureDir(docsDir);
  
  const filePath = path.join(docsDir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  
  return filePath;
}

// ============================================================================
// Step 1: Generate PRD
// ============================================================================

const generatePRDStep = createStep({
  id: 'generate-prd',
  description: 'Generate a Product Requirements Document from the project specification',
  inputSchema: PipelineInputSchema,
  outputSchema: z.object({
    prdContent: z.string(),
    prdPath: z.string(),
    // Pass through input for next steps
    projectName: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    techStack: z.array(z.string()),
    hasFrontend: z.boolean(),
    teamContext: TeamContextSchema.optional(),
    jiraProjectKey: z.string().optional(),
    author: z.string(),
  }),
  execute: async ({ inputData }) => {
    // Dynamically import the agent to avoid circular dependencies
    const { architectAgent } = await import('../agents/architect');
    
    const timestamp = getTimestamp();
    const sanitizedName = sanitizeFilename(inputData.projectName);
    
    // Build a structured prompt for PRD generation
    const prompt = `You are generating a PRD (Product Requirements Document) in PM mode.

## Project Details
- **Project Name:** ${inputData.projectName}
- **Description:** ${inputData.description}
- **Key Requirements:** ${inputData.requirements.join(', ')}
- **Tech Stack:** ${inputData.techStack.join(', ')}
- **Author:** ${inputData.author}

## Instructions
Generate a complete, professional PRD using the standard template. Include:
1. Executive Summary
2. Problem Statement with user pain points
3. Goals and Success Metrics (KPIs)
4. Requirements (P0/P1/P2 priority)
5. User Stories with acceptance criteria
6. Timeline and milestones
7. Risks and mitigations

Format the document in Markdown. Be specific and detailed.`;

    const response = await architectAgent.generate([{ role: 'user' as const, content: prompt }]);
    
    // Save the PRD
    const filename = `${sanitizedName}-prd-${timestamp}.md`;
    const prdPath = saveDocument(response.text, filename);
    
    return {
      prdContent: response.text,
      prdPath,
      projectName: inputData.projectName,
      description: inputData.description,
      requirements: inputData.requirements,
      techStack: inputData.techStack,
      hasFrontend: inputData.hasFrontend ?? false,
      teamContext: inputData.teamContext,
      jiraProjectKey: inputData.jiraProjectKey,
      author: inputData.author ?? 'Document Architect',
    };
  },
});

// ============================================================================
// Step 2: Generate TDR
// ============================================================================

const generateTDRStep = createStep({
  id: 'generate-tdr',
  description: 'Generate a Technical Design Review using the PRD as context',
  inputSchema: z.object({
    prdContent: z.string(),
    prdPath: z.string(),
    projectName: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    techStack: z.array(z.string()),
    hasFrontend: z.boolean(),
    teamContext: TeamContextSchema.optional(),
    jiraProjectKey: z.string().optional(),
    author: z.string(),
  }),
  outputSchema: z.object({
    prdContent: z.string(),
    prdPath: z.string(),
    tdrContent: z.string(),
    tdrPath: z.string(),
    projectName: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    techStack: z.array(z.string()),
    hasFrontend: z.boolean(),
    teamContext: TeamContextSchema.optional(),
    jiraProjectKey: z.string().optional(),
    author: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { architectAgent } = await import('../agents/architect');
    
    const timestamp = getTimestamp();
    const sanitizedName = sanitizeFilename(inputData.projectName);
    
    // Build a structured prompt for TDR generation with PRD context
    const prompt = `You are generating a TDR (Technical Design Review) in Principal Engineer mode.

## Project Context
- **Project Name:** ${inputData.projectName}
- **Tech Stack:** ${inputData.techStack.join(', ')}
- **Author:** ${inputData.author}

## PRD Summary (for context)
${inputData.prdContent.slice(0, 3000)}${inputData.prdContent.length > 3000 ? '...[truncated]' : ''}

## Instructions
Generate a complete, professional TDR using the standard template. Include:
1. Executive Summary
2. System Architecture with Mermaid.js diagram
3. Component breakdown with responsibilities
4. Security Audit (threat model, authentication, data privacy)
5. Scalability Plan (bottlenecks, monitoring, SLIs/SLOs)
6. Implementation Guide with step-by-step instructions
7. Common Pitfalls for developers
8. Code examples where applicable

Format the document in Markdown. Be specific and actionable.`;

    const response = await architectAgent.generate([{ role: 'user' as const, content: prompt }]);
    
    // Save the TDR
    const filename = `${sanitizedName}-tdr-${timestamp}.md`;
    const tdrPath = saveDocument(response.text, filename);
    
    return {
      ...inputData,
      tdrContent: response.text,
      tdrPath,
    };
  },
});

// ============================================================================
// Step 3: Generate Frontend TDR (Conditional)
// ============================================================================

const generateFrontendTDRStep = createStep({
  id: 'generate-frontend-tdr',
  description: 'Generate a Frontend-specific TDR if the project is frontend-heavy',
  inputSchema: z.object({
    prdContent: z.string(),
    prdPath: z.string(),
    tdrContent: z.string(),
    tdrPath: z.string(),
    projectName: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    techStack: z.array(z.string()),
    hasFrontend: z.boolean(),
    teamContext: TeamContextSchema.optional(),
    jiraProjectKey: z.string().optional(),
    author: z.string(),
  }),
  outputSchema: z.object({
    prdContent: z.string(),
    prdPath: z.string(),
    tdrContent: z.string(),
    tdrPath: z.string(),
    frontendTdrContent: z.string().nullable(),
    frontendTdrPath: z.string().nullable(),
    projectName: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    techStack: z.array(z.string()),
    hasFrontend: z.boolean(),
    teamContext: TeamContextSchema.optional(),
    jiraProjectKey: z.string().optional(),
    author: z.string(),
  }),
  execute: async ({ inputData }) => {
    // Skip if not a frontend-heavy project
    if (!inputData.hasFrontend) {
      return {
        ...inputData,
        frontendTdrContent: null,
        frontendTdrPath: null,
      };
    }
    
    const { frontendArchitectAgent } = await import('../agents/frontend-architect');
    
    const timestamp = getTimestamp();
    const sanitizedName = sanitizeFilename(inputData.projectName);
    
    // Filter frontend-related tech stack
    const frontendTech = inputData.techStack.filter(tech => 
      /react|next|vue|angular|svelte|tailwind|css|typescript|javascript/i.test(tech)
    );
    
    // Build a structured prompt for Frontend TDR generation
    const prompt = `You are generating a Frontend Technical Design Review.

## Project Context
- **Project Name:** ${inputData.projectName}
- **Frontend Tech Stack:** ${frontendTech.length > 0 ? frontendTech.join(', ') : inputData.techStack.join(', ')}
- **Author:** ${inputData.author}

## PRD Summary (for context)
${inputData.prdContent.slice(0, 2000)}${inputData.prdContent.length > 2000 ? '...[truncated]' : ''}

## TDR Summary (for context)
${inputData.tdrContent.slice(0, 2000)}${inputData.tdrContent.length > 2000 ? '...[truncated]' : ''}

## Instructions
Generate a complete Frontend TDR using the standard template. Apply all Vercel React/Next.js best practices. Include:
1. Technology Stack with rationale
2. Application Structure (Next.js App Router format)
3. Component Hierarchy with Mermaid.js diagram
4. Server vs Client Component Strategy
5. Performance Optimizations (waterfalls, bundle size, re-renders)
6. State Management Strategy
7. Accessibility Implementation
8. Testing Strategy with examples
9. Vercel Best Practices Checklist
10. Common Pitfalls with solutions
11. Implementation Checklist

Format the document in Markdown. Be specific and actionable.`;

    const response = await frontendArchitectAgent.generate([{ role: 'user' as const, content: prompt }]);
    
    // Save the Frontend TDR
    const filename = `${sanitizedName}-frontend-tdr-${timestamp}.md`;
    const frontendTdrPath = saveDocument(response.text, filename);
    
    return {
      ...inputData,
      frontendTdrContent: response.text,
      frontendTdrPath,
    };
  },
});

// ============================================================================
// Step 4: Generate Stories
// ============================================================================

const generateStoriesStep = createStep({
  id: 'generate-stories',
  description: 'Generate epics and user stories from all documents',
  inputSchema: z.object({
    prdContent: z.string(),
    prdPath: z.string(),
    tdrContent: z.string(),
    tdrPath: z.string(),
    frontendTdrContent: z.string().nullable(),
    frontendTdrPath: z.string().nullable(),
    projectName: z.string(),
    description: z.string(),
    requirements: z.array(z.string()),
    techStack: z.array(z.string()),
    hasFrontend: z.boolean(),
    teamContext: TeamContextSchema.optional(),
    jiraProjectKey: z.string().optional(),
    author: z.string(),
  }),
  outputSchema: z.object({
    prdPath: z.string(),
    tdrPath: z.string(),
    frontendTdrPath: z.string().nullable(),
    storiesContent: z.string(),
    storiesPath: z.string(),
    projectName: z.string(),
    jiraProjectKey: z.string().optional(),
    epicsCount: z.number(),
    storiesCount: z.number(),
    totalPoints: z.number(),
    teamContext: TeamContextSchema.optional(),
  }),
  execute: async ({ inputData }) => {
    const { storyBuilderAgent } = await import('../agents/story-builder');
    
    const timestamp = getTimestamp();
    const sanitizedName = sanitizeFilename(inputData.projectName);
    const teamContext = inputData.teamContext ?? { velocity: 20, sprintDuration: 2, teamSize: 4 };
    
    // Combine all documents for context
    let fullContext = `## PRD Summary\n${inputData.prdContent.slice(0, 2500)}\n\n`;
    fullContext += `## TDR Summary\n${inputData.tdrContent.slice(0, 2500)}\n\n`;
    
    if (inputData.frontendTdrContent) {
      fullContext += `## Frontend TDR Summary\n${inputData.frontendTdrContent.slice(0, 2000)}\n\n`;
    }
    
    // Build a structured prompt for story generation
    const prompt = `You are generating Epics and User Stories as a Senior Agile Coach.

## Project Context
- **Project Name:** ${inputData.projectName}
- **Team Velocity:** ${teamContext.velocity} points per sprint
- **Sprint Duration:** ${teamContext.sprintDuration} weeks
- **Team Size:** ${teamContext.teamSize} engineers

## Document Context
${fullContext}

## Instructions
Generate a complete set of Epics and User Stories. Include:

1. **Epics Overview Table**
   - Epic name, business value, success metric, dependencies, effort (S/M/L/XL)

2. **User Stories** (for each story):
   - ID (US-001, US-002, etc.)
   - Title
   - "As a [persona], I want [action], so that [benefit]"
   - Acceptance Criteria (Given/When/Then format)
   - Definition of Done checklist
   - Test Cases (Happy Path, Edge Cases, Error Scenarios)
   - Technical Notes
   - Story Points (1, 2, 3, 5, 8, 13)
   - Priority (P0, P1, P2)
   - Sprint allocation

3. **Story Dependency Graph** (Mermaid.js)

4. **Sprint Plan Suggestion** table

Format in Markdown. Be detailed and actionable.`;

    const response = await storyBuilderAgent.generate([{ role: 'user' as const, content: prompt }]);
    
    // Extract metrics from the response (basic parsing)
    const epicsMatch = response.text.match(/EPIC-\d+/g);
    const storiesMatch = response.text.match(/US-\d+/g);
    const pointsMatches = response.text.match(/Story Points:\s*(\d+)/g);
    
    const epicsCount = epicsMatch ? new Set(epicsMatch).size : 3;
    const storiesCount = storiesMatch ? new Set(storiesMatch).size : 10;
    const totalPoints = pointsMatches 
      ? pointsMatches.reduce((sum, match) => {
          const num = parseInt(match.replace(/\D/g, ''));
          return sum + (isNaN(num) ? 0 : num);
        }, 0)
      : storiesCount * 5; // Default estimate
    
    // Save the stories
    const filename = `${sanitizedName}-stories-${timestamp}.md`;
    const storiesPath = saveDocument(response.text, filename, 'stories');
    
    return {
      prdPath: inputData.prdPath,
      tdrPath: inputData.tdrPath,
      frontendTdrPath: inputData.frontendTdrPath,
      storiesContent: response.text,
      storiesPath,
      projectName: inputData.projectName,
      jiraProjectKey: inputData.jiraProjectKey,
      epicsCount,
      storiesCount,
      totalPoints,
      teamContext: inputData.teamContext,
    };
  },
});

// ============================================================================
// Step 5: Export and Save
// ============================================================================

const exportAndSaveStep = createStep({
  id: 'export-and-save',
  description: 'Export documents to additional formats and generate summary',
  inputSchema: z.object({
    prdPath: z.string(),
    tdrPath: z.string(),
    frontendTdrPath: z.string().nullable(),
    storiesContent: z.string(),
    storiesPath: z.string(),
    projectName: z.string(),
    jiraProjectKey: z.string().optional(),
    epicsCount: z.number(),
    storiesCount: z.number(),
    totalPoints: z.number(),
    teamContext: TeamContextSchema.optional(),
  }),
  outputSchema: PipelineOutputSchema,
  execute: async ({ inputData }) => {
    let jiraExportPath: string | null = null;
    
    // Export to Jira CSV if project key is provided
    if (inputData.jiraProjectKey) {
      const jiraCSV = generateJiraCSV(inputData.storiesContent, inputData.jiraProjectKey, inputData.projectName);
      const timestamp = getTimestamp();
      const sanitizedName = sanitizeFilename(inputData.projectName);
      const filename = `${sanitizedName}-jira-${timestamp}.csv`;
      
      const projectRoot = process.cwd();
      const exportsDir = path.join(projectRoot, 'docs', 'exports');
      ensureDir(exportsDir);
      
      jiraExportPath = path.join(exportsDir, filename);
      fs.writeFileSync(jiraExportPath, jiraCSV, 'utf-8');
    }
    
    // Generate summary message
    const docsGenerated = [
      `PRD: ${inputData.prdPath}`,
      `TDR: ${inputData.tdrPath}`,
      inputData.frontendTdrPath ? `Frontend TDR: ${inputData.frontendTdrPath}` : null,
      `Stories: ${inputData.storiesPath}`,
      jiraExportPath ? `Jira CSV: ${jiraExportPath}` : null,
    ].filter(Boolean).join('\n  ');
    
    const message = `✅ Document Architect Pipeline completed successfully!

📄 Documents Generated:
  ${docsGenerated}

📊 Summary:
  • Epics: ${inputData.epicsCount}
  • User Stories: ${inputData.storiesCount}
  • Total Story Points: ${inputData.totalPoints}
  • Estimated Sprints: ${Math.ceil(inputData.totalPoints / (inputData.teamContext?.velocity ?? 20))}`;
    
    return {
      success: true,
      documents: {
        prd: inputData.prdPath,
        tdr: inputData.tdrPath,
        frontendTdr: inputData.frontendTdrPath,
        stories: inputData.storiesPath,
      },
      exports: {
        jira: jiraExportPath,
      },
      summary: {
        epics: inputData.epicsCount,
        stories: inputData.storiesCount,
        totalPoints: inputData.totalPoints,
      },
      message,
    };
  },
});

/**
 * Generate a Jira-compatible CSV from stories markdown
 */
function generateJiraCSV(storiesContent: string, projectKey: string, projectName: string): string {
  const headers = [
    'Issue Type',
    'Summary',
    'Description',
    'Priority',
    'Story Points',
    'Labels',
    'Epic Link',
  ];
  
  const rows: string[][] = [];
  
  // Parse stories from markdown (basic extraction)
  const storyPattern = /###\s+(US-\d+):\s*(.+?)(?=\n)/g;
  const matches = [...storiesContent.matchAll(storyPattern)];
  
  for (const match of matches) {
    const storyId = match[1];
    const title = match[2].trim();
    
    // Extract priority if present
    const priorityMatch = storiesContent.match(new RegExp(`${storyId}[\\s\\S]*?Priority:\\s*(P[012])`, 'i'));
    const priority = priorityMatch ? priorityMatch[1] : 'P1';
    
    // Extract story points if present
    const pointsMatch = storiesContent.match(new RegExp(`${storyId}[\\s\\S]*?Story Points:\\s*(\\d+)`, 'i'));
    const points = pointsMatch ? pointsMatch[1] : '5';
    
    // Map priority to Jira priority
    const jiraPriority = priority === 'P0' ? 'Highest' : priority === 'P1' ? 'High' : 'Medium';
    
    rows.push([
      'Story',
      `[${projectKey}] ${title}`,
      `Generated from ${projectName} documentation`,
      jiraPriority,
      points,
      'auto-generated',
      '',
    ]);
  }
  
  // If no stories were parsed, add a placeholder
  if (rows.length === 0) {
    rows.push([
      'Story',
      `[${projectKey}] Initial Setup`,
      `Review generated documentation for ${projectName}`,
      'High',
      '3',
      'auto-generated',
      '',
    ]);
  }
  
  // Build CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}

// ============================================================================
// Create the Workflow
// ============================================================================

export const documentArchitectPipeline = createWorkflow({
  id: 'document-architect-pipeline',
  description: 'Master orchestration workflow that automates the full document generation pipeline: PRD -> TDR -> Frontend TDR (optional) -> User Stories -> Jira Export',
  inputSchema: PipelineInputSchema,
  outputSchema: PipelineOutputSchema,
})
  .then(generatePRDStep)
  .then(generateTDRStep)
  .then(generateFrontendTDRStep)
  .then(generateStoriesStep)
  .then(exportAndSaveStep)
  .commit();
