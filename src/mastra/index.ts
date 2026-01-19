import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { architectAgent } from './agents/architect';
import { storyBuilderAgent } from './agents/story-builder';
import { frontendArchitectAgent } from './agents/frontend-architect';
import { storyBuilderWorkflow } from './workflows/story-builder-workflow';

export const mastra = new Mastra({
  workflows: { 
    storyBuilderWorkflow, // Transforms PRD/TDR into user stories
  },
  agents: { 
    architectAgent,          // Document Architect Agent for PRD/TDR generation
    storyBuilderAgent,       // Story Builder Agent for user stories & epics
    frontendArchitectAgent,  // Frontend Architect for React/Next.js TDRs
  },
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: {
    default: { enabled: true }, 
  },
});

// Export agents individually for direct access
export { architectAgent } from './agents/architect';
export { storyBuilderAgent } from './agents/story-builder';
export { frontendArchitectAgent } from './agents/frontend-architect';

// Export workflow
export { storyBuilderWorkflow } from './workflows/story-builder-workflow';

// Export tools for external use
export { 
  saveDocumentTool, 
  generateDiagramTool,
  analyzeStackTool,
  exportDocumentTool,
} from './tools/file-tools';

export {
  readDocumentTool,
  listDocumentsTool,
  saveStoriesTool,
  exportToJiraTool,
  generateStoryDependencyTool,
} from './tools/story-tools';
