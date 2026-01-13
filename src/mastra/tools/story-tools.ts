import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * User Story Schema
 */
export const UserStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  epicId: z.string(),
  asA: z.string().describe('The persona/role'),
  iWant: z.string().describe('The desired action/feature'),
  soThat: z.string().describe('The business value/benefit'),
  acceptanceCriteria: z.array(z.object({
    given: z.string(),
    when: z.string(),
    then: z.string(),
  })),
  definitionOfDone: z.array(z.string()),
  testCases: z.object({
    happyPath: z.array(z.object({
      step: z.number(),
      action: z.string(),
      expectedResult: z.string(),
    })),
    edgeCases: z.array(z.object({
      scenario: z.string(),
      input: z.string(),
      expectedBehavior: z.string(),
    })),
    errorScenarios: z.array(z.object({
      scenario: z.string(),
      trigger: z.string(),
      expectedBehavior: z.string(),
    })),
  }),
  technicalNotes: z.array(z.string()),
  storyPoints: z.number(),
  priority: z.enum(['P0', 'P1', 'P2']),
  sprint: z.number().optional(),
  dependencies: z.array(z.string()),
});

/**
 * Epic Schema
 */
export const EpicSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  businessValue: z.string(),
  successMetric: z.string(),
  estimatedEffort: z.enum(['S', 'M', 'L', 'XL']),
  priority: z.enum(['P0', 'P1', 'P2']),
  stories: z.array(z.string()), // Story IDs
});

/**
 * Sprint Plan Schema
 */
export const SprintPlanSchema = z.object({
  sprintNumber: z.number(),
  stories: z.array(z.string()),
  totalPoints: z.number(),
  focus: z.string(),
});

export type UserStory = z.infer<typeof UserStorySchema>;
export type Epic = z.infer<typeof EpicSchema>;
export type SprintPlan = z.infer<typeof SprintPlanSchema>;

/**
 * Read Document Tool
 * Reads a PRD/TDR document from the /docs folder
 */
export const readDocumentTool = createTool({
  id: 'read-document',
  description: 'Reads a PRD or TDR document from the /docs folder to use as input for story generation',
  inputSchema: z.object({
    filename: z.string().describe('The filename to read (e.g., "user-auth-prd-2026-01-12.md")'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    content: z.string(),
    documentType: z.string(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { filename } = context;
    
    const projectRoot = process.cwd();
    const docsDir = path.join(projectRoot, 'docs');
    const filePath = path.join(docsDir, filename);
    
    try {
      if (!fs.existsSync(filePath)) {
        // Try to find similar files
        const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));
        return {
          success: false,
          content: '',
          documentType: '',
          message: `❌ File not found: ${filename}. Available files: ${files.join(', ')}`,
        };
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Detect document type from content or filename
      let documentType = 'unknown';
      if (filename.toLowerCase().includes('prd') || content.includes('Product Requirements')) {
        documentType = 'PRD';
      } else if (filename.toLowerCase().includes('tdr') || content.includes('Technical Design')) {
        documentType = 'TDR';
      }
      
      return {
        success: true,
        content,
        documentType,
        message: `✅ Successfully read ${documentType}: ${filename}`,
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        documentType: '',
        message: `❌ Failed to read document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * List Documents Tool
 * Lists available PRD/TDR documents in the /docs folder
 */
export const listDocumentsTool = createTool({
  id: 'list-documents',
  description: 'Lists all PRD and TDR documents available in the /docs folder',
  inputSchema: z.object({}),
  outputSchema: z.object({
    documents: z.array(z.object({
      filename: z.string(),
      type: z.string(),
      createdAt: z.string(),
    })),
    message: z.string(),
  }),
  execute: async () => {
    const projectRoot = process.cwd();
    const docsDir = path.join(projectRoot, 'docs');
    
    try {
      if (!fs.existsSync(docsDir)) {
        return {
          documents: [],
          message: 'No documents found. Generate a PRD or TDR first using the Architect Agent.',
        };
      }
      
      const files = fs.readdirSync(docsDir)
        .filter(f => f.endsWith('.md'))
        .map(filename => {
          const filePath = path.join(docsDir, filename);
          const stats = fs.statSync(filePath);
          
          let type = 'Unknown';
          if (filename.toLowerCase().includes('prd')) type = 'PRD';
          else if (filename.toLowerCase().includes('tdr')) type = 'TDR';
          
          return {
            filename,
            type,
            createdAt: stats.mtime.toISOString().split('T')[0],
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      
      return {
        documents: files,
        message: `Found ${files.length} document(s) in /docs`,
      };
    } catch (error) {
      return {
        documents: [],
        message: `❌ Error listing documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * Save Stories Tool
 * Saves generated user stories to a file
 */
export const saveStoriesTool = createTool({
  id: 'save-stories',
  description: 'Saves generated epics and user stories as a Markdown file',
  inputSchema: z.object({
    projectName: z.string().describe('Name of the project/feature'),
    content: z.string().describe('The full Markdown content of the stories'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { projectName, content } = context;
    
    const projectRoot = process.cwd();
    const storiesDir = path.join(projectRoot, 'docs', 'stories');
    
    if (!fs.existsSync(storiesDir)) {
      fs.mkdirSync(storiesDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    const filename = `${sanitizedName}-stories-${timestamp}.md`;
    const filePath = path.join(storiesDir, filename);
    
    try {
      const header = `<!-- 
Document Type: User Stories
Project: ${projectName}
Generated: ${new Date().toISOString()}
Tool: Story Builder Agent
-->

`;
      
      fs.writeFileSync(filePath, header + content, 'utf-8');
      
      return {
        success: true,
        filePath,
        message: `✅ Stories saved to: ${filePath}`,
      };
    } catch (error) {
      return {
        success: false,
        filePath: '',
        message: `❌ Failed to save stories: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * Export to Jira Tool
 * Exports stories in Jira-compatible CSV format
 */
export const exportToJiraTool = createTool({
  id: 'export-to-jira',
  description: 'Exports user stories in Jira-compatible CSV format for bulk import',
  inputSchema: z.object({
    projectKey: z.string().describe('Jira project key (e.g., "PROJ")'),
    stories: z.array(z.object({
      id: z.string(),
      title: z.string(),
      epicName: z.string(),
      description: z.string(),
      acceptanceCriteria: z.string(),
      storyPoints: z.number(),
      priority: z.string(),
      labels: z.array(z.string()).optional(),
    })),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string(),
    csvContent: z.string(),
    message: z.string(),
  }),
  execute: async ({ context }) => {
    const { projectKey, stories } = context;
    
    // CSV Header for Jira import
    const headers = [
      'Summary',
      'Issue Type',
      'Description',
      'Acceptance Criteria',
      'Story Points',
      'Priority',
      'Epic Link',
      'Labels',
    ];
    
    const rows = stories.map(story => [
      `"${story.title.replace(/"/g, '""')}"`,
      'Story',
      `"${story.description.replace(/"/g, '""')}"`,
      `"${story.acceptanceCriteria.replace(/"/g, '""')}"`,
      story.storyPoints.toString(),
      story.priority === 'P0' ? 'Highest' : story.priority === 'P1' ? 'High' : 'Medium',
      `"${story.epicName.replace(/"/g, '""')}"`,
      `"${(story.labels || []).join(',')}"`,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    const projectRoot = process.cwd();
    const exportsDir = path.join(projectRoot, 'docs', 'exports');
    
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${projectKey.toLowerCase()}-stories-jira-${timestamp}.csv`;
    const filePath = path.join(exportsDir, filename);
    
    try {
      fs.writeFileSync(filePath, csvContent, 'utf-8');
      
      return {
        success: true,
        filePath,
        csvContent,
        message: `✅ Jira CSV exported to: ${filePath} (${stories.length} stories)`,
      };
    } catch (error) {
      return {
        success: false,
        filePath: '',
        csvContent,
        message: `❌ Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
});

/**
 * Generate Story Dependency Diagram
 */
export const generateStoryDependencyTool = createTool({
  id: 'generate-story-dependency',
  description: 'Generates a Mermaid diagram showing dependencies between user stories',
  inputSchema: z.object({
    stories: z.array(z.object({
      id: z.string(),
      title: z.string(),
      dependencies: z.array(z.string()),
      sprint: z.number().optional(),
    })),
  }),
  outputSchema: z.object({
    mermaidCode: z.string(),
  }),
  execute: async ({ context }) => {
    const { stories } = context;
    
    // Group by sprint for subgraphs
    const sprintGroups: Record<number, typeof stories> = {};
    stories.forEach(story => {
      const sprint = story.sprint || 0;
      if (!sprintGroups[sprint]) sprintGroups[sprint] = [];
      sprintGroups[sprint].push(story);
    });
    
    let mermaidCode = '```mermaid\ngraph LR\n';
    
    // Add sprint subgraphs
    Object.entries(sprintGroups).sort(([a], [b]) => Number(a) - Number(b)).forEach(([sprint, sprintStories]) => {
      if (Number(sprint) > 0) {
        mermaidCode += `    subgraph Sprint${sprint}["Sprint ${sprint}"]\n`;
        sprintStories.forEach(story => {
          const shortTitle = story.title.length > 20 ? story.title.substring(0, 20) + '...' : story.title;
          mermaidCode += `        ${story.id}["${story.id}: ${shortTitle}"]\n`;
        });
        mermaidCode += '    end\n';
      } else {
        // Unassigned stories
        sprintStories.forEach(story => {
          const shortTitle = story.title.length > 20 ? story.title.substring(0, 20) + '...' : story.title;
          mermaidCode += `    ${story.id}["${story.id}: ${shortTitle}"]\n`;
        });
      }
    });
    
    mermaidCode += '\n    %% Dependencies\n';
    
    // Add dependency arrows
    stories.forEach(story => {
      story.dependencies.forEach(dep => {
        mermaidCode += `    ${dep} --> ${story.id}\n`;
      });
    });
    
    mermaidCode += '```';
    
    return { mermaidCode };
  },
});

/**
 * Format stories as Markdown
 */
export function formatStoriesToMarkdown(
  projectName: string,
  epics: Epic[],
  stories: UserStory[],
  sprintPlan: SprintPlan[],
  teamContext: { sprintDuration: number; velocity: number; teamSize: number }
): string {
  let md = `# ${projectName} - User Stories & Epics

**Generated:** ${new Date().toISOString().split('T')[0]}  
**Total Epics:** ${epics.length}  
**Total Stories:** ${stories.length}  
**Estimated Sprints:** ${sprintPlan.length}

---

## Team Context

| Metric | Value |
|--------|-------|
| Sprint Duration | ${teamContext.sprintDuration} weeks |
| Team Velocity | ${teamContext.velocity} points/sprint |
| Team Size | ${teamContext.teamSize} engineers |

---

## Epics Overview

| ID | Epic | Priority | Effort | Stories |
|----|------|----------|--------|---------|
${epics.map(e => `| ${e.id} | ${e.name} | ${e.priority} | ${e.estimatedEffort} | ${e.stories.length} |`).join('\n')}

---

## Sprint Plan

| Sprint | Focus | Stories | Points |
|--------|-------|---------|--------|
${sprintPlan.map(s => `| Sprint ${s.sprintNumber} | ${s.focus} | ${s.stories.join(', ')} | ${s.totalPoints} |`).join('\n')}

---

`;

  // Add each epic with its stories
  for (const epic of epics) {
    md += `## Epic: ${epic.name}

**ID:** ${epic.id}  
**Priority:** ${epic.priority}  
**Estimated Effort:** ${epic.estimatedEffort}

### Business Value
${epic.businessValue}

### Success Metric
${epic.successMetric}

---

`;
    
    // Add stories for this epic
    const epicStories = stories.filter(s => s.epicId === epic.id);
    
    for (const story of epicStories) {
      md += `### ${story.id}: ${story.title}

**Priority:** ${story.priority} | **Points:** ${story.storyPoints} | **Sprint:** ${story.sprint || 'Unassigned'}

**As a** ${story.asA},  
**I want** ${story.iWant},  
**So that** ${story.soThat}.

#### Acceptance Criteria

${story.acceptanceCriteria.map((ac, i) => `${i + 1}. **Given** ${ac.given}, **When** ${ac.when}, **Then** ${ac.then}`).join('\n')}

#### Definition of Done

${story.definitionOfDone.map(d => `- [ ] ${d}`).join('\n')}

#### Test Cases

**Happy Path:**

| Step | Action | Expected Result |
|------|--------|-----------------|
${story.testCases.happyPath.map(t => `| ${t.step} | ${t.action} | ${t.expectedResult} |`).join('\n')}

**Edge Cases:**

| Scenario | Input | Expected Behavior |
|----------|-------|-------------------|
${story.testCases.edgeCases.map(t => `| ${t.scenario} | ${t.input} | ${t.expectedBehavior} |`).join('\n')}

**Error Scenarios:**

| Scenario | Trigger | Expected Behavior |
|----------|---------|-------------------|
${story.testCases.errorScenarios.map(t => `| ${t.scenario} | ${t.trigger} | ${t.expectedBehavior} |`).join('\n')}

#### Technical Notes

${story.technicalNotes.map(n => `- ${n}`).join('\n')}

${story.dependencies.length > 0 ? `#### Dependencies\n\nBlocked by: ${story.dependencies.join(', ')}` : ''}

---

`;
    }
  }
  
  md += `
---

*Generated by Story Builder Agent*
`;
  
  return md;
}
