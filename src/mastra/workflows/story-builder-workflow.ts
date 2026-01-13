import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

/**
 * Story Builder Workflow
 * 
 * A workflow chain that transforms PRD/TDR documents into implementable user stories.
 * 
 * Flow:
 * 1. Parse Document → Extract requirements and features
 * 2. Generate Epics → Group features into logical epics
 * 3. Create Stories → Break down epics into user stories
 * 4. Add Details → Add acceptance criteria, DoD, test cases
 * 5. Estimate & Plan → Add story points and sprint allocation
 * 6. Generate Output → Create final markdown document
 */

// Input schema for the workflow
const WorkflowInputSchema = z.object({
  documentContent: z.string().describe('The PRD or TDR document content'),
  documentType: z.enum(['PRD', 'TDR']).describe('Type of source document'),
  projectName: z.string().describe('Name of the project'),
  teamContext: z.object({
    sprintDuration: z.number().default(2).describe('Sprint duration in weeks'),
    velocity: z.number().default(20).describe('Team velocity in story points per sprint'),
    teamSize: z.number().default(4).describe('Number of engineers on the team'),
  }),
  priorities: z.object({
    p0Features: z.array(z.string()).describe('Must-have features for first release'),
    p1Features: z.array(z.string()).describe('Should-have features'),
    p2Features: z.array(z.string()).describe('Nice-to-have features'),
  }).optional(),
});

// Step 1: Parse Document
const parseDocumentStep = createStep({
  id: 'parse-document',
  description: 'Parse the PRD/TDR document to extract key requirements and features',
  inputSchema: WorkflowInputSchema,
  outputSchema: z.object({
    projectName: z.string(),
    documentType: z.string(),
    features: z.array(z.object({
      name: z.string(),
      description: z.string(),
      priority: z.enum(['P0', 'P1', 'P2']),
      technicalRequirements: z.array(z.string()),
      userRequirements: z.array(z.string()),
    })),
    personas: z.array(z.object({
      name: z.string(),
      role: z.string(),
      goals: z.array(z.string()),
    })),
    constraints: z.array(z.string()),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    // In a real implementation, this would use an LLM to parse the document
    // For now, we'll create a structured extraction placeholder
    
    const content = inputData.documentContent;
    const features: Array<{
      name: string;
      description: string;
      priority: 'P0' | 'P1' | 'P2';
      technicalRequirements: string[];
      userRequirements: string[];
    }> = [];
    
    // Extract features from P0/P1/P2 sections (basic parsing)
    const p0Match = content.match(/### 4\.1 Must Have \(P0\)[^#]*([\s\S]*?)(?=###|##|$)/i);
    const p1Match = content.match(/### 4\.2 Should Have \(P1\)[^#]*([\s\S]*?)(?=###|##|$)/i);
    const p2Match = content.match(/### 4\.3 Nice to Have \(P2\)[^#]*([\s\S]*?)(?=###|##|$)/i);
    
    const extractItems = (text: string | undefined): string[] => {
      if (!text) return [];
      return text
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*\[?\s*[x\s]?\]?\s*/i, '').trim())
        .filter(Boolean);
    };
    
    const p0Items = extractItems(p0Match?.[1]);
    const p1Items = extractItems(p1Match?.[1]);
    const p2Items = extractItems(p2Match?.[1]);
    
    p0Items.forEach((item, idx) => {
      features.push({
        name: `Feature ${idx + 1}`,
        description: item,
        priority: 'P0',
        technicalRequirements: [],
        userRequirements: [item],
      });
    });
    
    p1Items.forEach((item, idx) => {
      features.push({
        name: `Feature ${p0Items.length + idx + 1}`,
        description: item,
        priority: 'P1',
        technicalRequirements: [],
        userRequirements: [item],
      });
    });
    
    p2Items.forEach((item, idx) => {
      features.push({
        name: `Feature ${p0Items.length + p1Items.length + idx + 1}`,
        description: item,
        priority: 'P2',
        technicalRequirements: [],
        userRequirements: [item],
      });
    });
    
    // Extract persona if present
    const personas: Array<{ name: string; role: string; goals: string[] }> = [];
    const personaMatch = content.match(/### 2\.2 Target Persona[\s\S]*?(?=###|##)/i);
    if (personaMatch) {
      const roleMatch = personaMatch[0].match(/\*\*Role:\*\*\s*(.+)/i);
      personas.push({
        name: 'Primary User',
        role: roleMatch?.[1]?.trim() || 'User',
        goals: ['Complete tasks efficiently'],
      });
    }
    
    return {
      projectName: inputData.projectName,
      documentType: inputData.documentType,
      features: features.length > 0 ? features : [
        {
          name: 'Core Feature',
          description: 'Main functionality from document',
          priority: 'P0' as const,
          technicalRequirements: ['API implementation', 'Database schema'],
          userRequirements: ['User interface', 'Workflow'],
        },
      ],
      personas: personas.length > 0 ? personas : [
        { name: 'Primary User', role: 'End User', goals: ['Accomplish tasks'] },
      ],
      constraints: [],
      teamContext: inputData.teamContext,
    };
  },
});

// Step 2: Generate Epics
const generateEpicsStep = createStep({
  id: 'generate-epics',
  description: 'Group related features into logical epics',
  inputSchema: z.object({
    projectName: z.string(),
    documentType: z.string(),
    features: z.array(z.object({
      name: z.string(),
      description: z.string(),
      priority: z.enum(['P0', 'P1', 'P2']),
      technicalRequirements: z.array(z.string()),
      userRequirements: z.array(z.string()),
    })),
    personas: z.array(z.object({
      name: z.string(),
      role: z.string(),
      goals: z.array(z.string()),
    })),
    constraints: z.array(z.string()),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  outputSchema: z.object({
    epics: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      businessValue: z.string(),
      successMetric: z.string(),
      estimatedEffort: z.enum(['S', 'M', 'L', 'XL']),
      priority: z.enum(['P0', 'P1', 'P2']),
      featureNames: z.array(z.string()),
    })),
    projectName: z.string(),
    personas: z.array(z.object({
      name: z.string(),
      role: z.string(),
      goals: z.array(z.string()),
    })),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { features, projectName, personas, teamContext } = inputData;
    
    // Group features by priority into epics
    const p0Features = features.filter(f => f.priority === 'P0');
    const p1Features = features.filter(f => f.priority === 'P1');
    const p2Features = features.filter(f => f.priority === 'P2');
    
    const epics: Array<{
      id: string;
      name: string;
      description: string;
      businessValue: string;
      successMetric: string;
      estimatedEffort: 'S' | 'M' | 'L' | 'XL';
      priority: 'P0' | 'P1' | 'P2';
      featureNames: string[];
    }> = [];
    
    if (p0Features.length > 0) {
      epics.push({
        id: 'EPIC-001',
        name: 'Core Functionality',
        description: `Core features required for MVP: ${p0Features.map(f => f.description).join(', ')}`,
        businessValue: 'Essential functionality that enables the primary use case',
        successMetric: 'Users can complete the core workflow end-to-end',
        estimatedEffort: p0Features.length > 3 ? 'L' : 'M',
        priority: 'P0',
        featureNames: p0Features.map(f => f.name),
      });
    }
    
    if (p1Features.length > 0) {
      epics.push({
        id: 'EPIC-002',
        name: 'Enhanced Experience',
        description: `Enhanced features for better UX: ${p1Features.map(f => f.description).join(', ')}`,
        businessValue: 'Improves user satisfaction and engagement',
        successMetric: 'Increased user retention and satisfaction scores',
        estimatedEffort: p1Features.length > 3 ? 'L' : 'M',
        priority: 'P1',
        featureNames: p1Features.map(f => f.name),
      });
    }
    
    if (p2Features.length > 0) {
      epics.push({
        id: 'EPIC-003',
        name: 'Future Enhancements',
        description: `Nice-to-have features: ${p2Features.map(f => f.description).join(', ')}`,
        businessValue: 'Differentiating features for competitive advantage',
        successMetric: 'Feature adoption rate and user feedback',
        estimatedEffort: p2Features.length > 3 ? 'L' : 'S',
        priority: 'P2',
        featureNames: p2Features.map(f => f.name),
      });
    }
    
    return {
      epics,
      projectName,
      personas,
      teamContext,
    };
  },
});

// Step 3: Create User Stories
const createStoriesStep = createStep({
  id: 'create-stories',
  description: 'Break down epics into detailed user stories',
  inputSchema: z.object({
    epics: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      businessValue: z.string(),
      successMetric: z.string(),
      estimatedEffort: z.enum(['S', 'M', 'L', 'XL']),
      priority: z.enum(['P0', 'P1', 'P2']),
      featureNames: z.array(z.string()),
    })),
    projectName: z.string(),
    personas: z.array(z.object({
      name: z.string(),
      role: z.string(),
      goals: z.array(z.string()),
    })),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  outputSchema: z.object({
    stories: z.array(z.object({
      id: z.string(),
      title: z.string(),
      epicId: z.string(),
      asA: z.string(),
      iWant: z.string(),
      soThat: z.string(),
      priority: z.enum(['P0', 'P1', 'P2']),
      complexity: z.enum(['simple', 'medium', 'complex']),
    })),
    epics: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      businessValue: z.string(),
      successMetric: z.string(),
      estimatedEffort: z.enum(['S', 'M', 'L', 'XL']),
      priority: z.enum(['P0', 'P1', 'P2']),
      storyIds: z.array(z.string()),
    })),
    projectName: z.string(),
    personas: z.array(z.object({
      name: z.string(),
      role: z.string(),
      goals: z.array(z.string()),
    })),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { epics, projectName, personas, teamContext } = inputData;
    const primaryPersona = personas[0] || { name: 'User', role: 'End User', goals: [] };
    
    const stories: Array<{
      id: string;
      title: string;
      epicId: string;
      asA: string;
      iWant: string;
      soThat: string;
      priority: 'P0' | 'P1' | 'P2';
      complexity: 'simple' | 'medium' | 'complex';
    }> = [];
    
    const updatedEpics = epics.map((epic, epicIdx) => {
      const storyIds: string[] = [];
      
      // Create 2-4 stories per epic based on complexity
      const numStories = epic.estimatedEffort === 'XL' ? 4 : 
                         epic.estimatedEffort === 'L' ? 3 :
                         epic.estimatedEffort === 'M' ? 2 : 1;
      
      for (let i = 0; i < numStories; i++) {
        const storyId = `US-${String(epicIdx + 1).padStart(2, '0')}${String(i + 1).padStart(2, '0')}`;
        storyIds.push(storyId);
        
        const storyTemplates = [
          {
            title: `${epic.name} - Setup & Configuration`,
            iWant: `set up the ${epic.name.toLowerCase()} feature`,
            soThat: 'I can start using it for my workflow',
            complexity: 'simple' as const,
          },
          {
            title: `${epic.name} - Core Functionality`,
            iWant: `use the core functionality of ${epic.name.toLowerCase()}`,
            soThat: 'I can accomplish my primary goal',
            complexity: 'complex' as const,
          },
          {
            title: `${epic.name} - Validation & Error Handling`,
            iWant: `see clear validation and error messages`,
            soThat: 'I know how to fix issues when something goes wrong',
            complexity: 'medium' as const,
          },
          {
            title: `${epic.name} - Polish & Edge Cases`,
            iWant: `have a smooth experience even in edge cases`,
            soThat: 'I can trust the system to handle unusual situations',
            complexity: 'medium' as const,
          },
        ];
        
        const template = storyTemplates[i % storyTemplates.length];
        
        stories.push({
          id: storyId,
          title: template.title,
          epicId: epic.id,
          asA: primaryPersona.role,
          iWant: template.iWant,
          soThat: template.soThat,
          priority: epic.priority,
          complexity: template.complexity,
        });
      }
      
      return {
        ...epic,
        storyIds,
      };
    });
    
    return {
      stories,
      epics: updatedEpics,
      projectName,
      personas,
      teamContext,
    };
  },
});

// Step 4: Add Details (Acceptance Criteria, DoD, Test Cases)
const addDetailsStep = createStep({
  id: 'add-details',
  description: 'Add acceptance criteria, definition of done, and test cases to each story',
  inputSchema: z.object({
    stories: z.array(z.object({
      id: z.string(),
      title: z.string(),
      epicId: z.string(),
      asA: z.string(),
      iWant: z.string(),
      soThat: z.string(),
      priority: z.enum(['P0', 'P1', 'P2']),
      complexity: z.enum(['simple', 'medium', 'complex']),
    })),
    epics: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      businessValue: z.string(),
      successMetric: z.string(),
      estimatedEffort: z.enum(['S', 'M', 'L', 'XL']),
      priority: z.enum(['P0', 'P1', 'P2']),
      storyIds: z.array(z.string()),
    })),
    projectName: z.string(),
    personas: z.array(z.object({
      name: z.string(),
      role: z.string(),
      goals: z.array(z.string()),
    })),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  outputSchema: z.object({
    detailedStories: z.array(z.object({
      id: z.string(),
      title: z.string(),
      epicId: z.string(),
      asA: z.string(),
      iWant: z.string(),
      soThat: z.string(),
      priority: z.enum(['P0', 'P1', 'P2']),
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
      dependencies: z.array(z.string()),
    })),
    epics: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      businessValue: z.string(),
      successMetric: z.string(),
      estimatedEffort: z.enum(['S', 'M', 'L', 'XL']),
      priority: z.enum(['P0', 'P1', 'P2']),
      storyIds: z.array(z.string()),
    })),
    projectName: z.string(),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { stories, epics, projectName, teamContext } = inputData;
    
    // Standard Definition of Done
    const standardDoD = [
      'Code complete with unit tests (>80% coverage)',
      'Code reviewed by at least 1 team member',
      'All acceptance criteria verified',
      'Integration tests passing',
      'Documentation updated',
      'No critical/high severity bugs',
      'Deployed to staging and smoke tested',
    ];
    
    const detailedStories = stories.map((story, idx) => {
      // Calculate story points based on complexity
      const storyPoints = story.complexity === 'complex' ? 8 :
                         story.complexity === 'medium' ? 5 : 3;
      
      // Generate acceptance criteria
      const acceptanceCriteria = [
        {
          given: `the ${story.asA.toLowerCase()} is logged in`,
          when: `they ${story.iWant}`,
          then: 'the action completes successfully',
        },
        {
          given: 'invalid input is provided',
          when: 'the user submits the form',
          then: 'appropriate validation errors are shown',
        },
        {
          given: 'the action is successful',
          when: 'the operation completes',
          then: 'the user sees a confirmation message',
        },
      ];
      
      // Generate test cases
      const testCases = {
        happyPath: [
          { step: 1, action: 'Navigate to the feature', expectedResult: 'Feature page loads' },
          { step: 2, action: 'Enter valid data', expectedResult: 'Form accepts input' },
          { step: 3, action: 'Submit the form', expectedResult: 'Success message appears' },
          { step: 4, action: 'Verify the result', expectedResult: 'Data is saved correctly' },
        ],
        edgeCases: [
          { scenario: 'Empty input', input: '""', expectedBehavior: 'Show required field error' },
          { scenario: 'Maximum length', input: '256+ chars', expectedBehavior: 'Truncate or show error' },
          { scenario: 'Special characters', input: '"<script>"', expectedBehavior: 'Sanitize and accept' },
        ],
        errorScenarios: [
          { scenario: 'Network failure', trigger: 'API timeout', expectedBehavior: 'Show retry option' },
          { scenario: 'Server error', trigger: '500 response', expectedBehavior: 'Show error message' },
          { scenario: 'Session expired', trigger: '401 response', expectedBehavior: 'Redirect to login' },
        ],
      };
      
      // Calculate dependencies (later stories depend on earlier ones in same epic)
      const epicStories = stories.filter(s => s.epicId === story.epicId);
      const storyIdxInEpic = epicStories.findIndex(s => s.id === story.id);
      const dependencies = storyIdxInEpic > 0 ? [epicStories[storyIdxInEpic - 1].id] : [];
      
      // Technical notes based on story type
      const technicalNotes = story.title.includes('Setup') 
        ? ['Create database schema', 'Implement API endpoints', 'Add configuration options']
        : story.title.includes('Validation')
        ? ['Implement client-side validation', 'Add server-side validation', 'Create error message components']
        : ['Implement core business logic', 'Add appropriate caching', 'Consider performance implications'];
      
      return {
        id: story.id,
        title: story.title,
        epicId: story.epicId,
        asA: story.asA,
        iWant: story.iWant,
        soThat: story.soThat,
        priority: story.priority,
        acceptanceCriteria,
        definitionOfDone: standardDoD,
        testCases,
        technicalNotes,
        storyPoints,
        dependencies,
      };
    });
    
    return {
      detailedStories,
      epics,
      projectName,
      teamContext,
    };
  },
});

// Step 5: Sprint Planning
const sprintPlanningStep = createStep({
  id: 'sprint-planning',
  description: 'Allocate stories to sprints based on velocity and dependencies',
  inputSchema: z.object({
    detailedStories: z.array(z.object({
      id: z.string(),
      title: z.string(),
      epicId: z.string(),
      asA: z.string(),
      iWant: z.string(),
      soThat: z.string(),
      priority: z.enum(['P0', 'P1', 'P2']),
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
      dependencies: z.array(z.string()),
    })),
    epics: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      businessValue: z.string(),
      successMetric: z.string(),
      estimatedEffort: z.enum(['S', 'M', 'L', 'XL']),
      priority: z.enum(['P0', 'P1', 'P2']),
      storyIds: z.array(z.string()),
    })),
    projectName: z.string(),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  outputSchema: z.object({
    finalStories: z.array(z.object({
      id: z.string(),
      title: z.string(),
      epicId: z.string(),
      asA: z.string(),
      iWant: z.string(),
      soThat: z.string(),
      priority: z.enum(['P0', 'P1', 'P2']),
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
      dependencies: z.array(z.string()),
      sprint: z.number(),
    })),
    sprintPlan: z.array(z.object({
      sprintNumber: z.number(),
      stories: z.array(z.string()),
      totalPoints: z.number(),
      focus: z.string(),
    })),
    epics: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      businessValue: z.string(),
      successMetric: z.string(),
      estimatedEffort: z.enum(['S', 'M', 'L', 'XL']),
      priority: z.enum(['P0', 'P1', 'P2']),
      storyIds: z.array(z.string()),
    })),
    projectName: z.string(),
    teamContext: z.object({
      sprintDuration: z.number(),
      velocity: z.number(),
      teamSize: z.number(),
    }),
  }),
  execute: async ({ inputData }) => {
    const { detailedStories, epics, projectName, teamContext } = inputData;
    const { velocity } = teamContext;
    
    // Sort stories by priority and dependencies
    const sortedStories = [...detailedStories].sort((a, b) => {
      // P0 first
      if (a.priority !== b.priority) {
        return a.priority.localeCompare(b.priority);
      }
      // Then by dependencies
      if (a.dependencies.includes(b.id)) return 1;
      if (b.dependencies.includes(a.id)) return -1;
      return 0;
    });
    
    const sprintPlan: Array<{
      sprintNumber: number;
      stories: string[];
      totalPoints: number;
      focus: string;
    }> = [];
    
    const assignedStories: Array<typeof detailedStories[0] & { sprint: number }> = [];
    let currentSprint = 1;
    let currentSprintPoints = 0;
    let currentSprintStories: string[] = [];
    
    for (const story of sortedStories) {
      // Check if adding this story exceeds velocity
      if (currentSprintPoints + story.storyPoints > velocity && currentSprintStories.length > 0) {
        // Save current sprint
        const epicNames = [...new Set(
          currentSprintStories.map(sId => {
            const s = sortedStories.find(st => st.id === sId);
            return epics.find(e => e.id === s?.epicId)?.name || 'General';
          })
        )];
        
        sprintPlan.push({
          sprintNumber: currentSprint,
          stories: [...currentSprintStories],
          totalPoints: currentSprintPoints,
          focus: epicNames.join(', '),
        });
        
        // Start new sprint
        currentSprint++;
        currentSprintPoints = 0;
        currentSprintStories = [];
      }
      
      currentSprintPoints += story.storyPoints;
      currentSprintStories.push(story.id);
      assignedStories.push({ ...story, sprint: currentSprint });
    }
    
    // Don't forget the last sprint
    if (currentSprintStories.length > 0) {
      const epicNames = [...new Set(
        currentSprintStories.map(sId => {
          const s = sortedStories.find(st => st.id === sId);
          return epics.find(e => e.id === s?.epicId)?.name || 'General';
        })
      )];
      
      sprintPlan.push({
        sprintNumber: currentSprint,
        stories: currentSprintStories,
        totalPoints: currentSprintPoints,
        focus: epicNames.join(', '),
      });
    }
    
    return {
      finalStories: assignedStories,
      sprintPlan,
      epics,
      projectName,
      teamContext,
    };
  },
});

// Create the workflow
export const storyBuilderWorkflow = createWorkflow({
  id: 'story-builder-workflow',
  description: 'Transforms PRD/TDR documents into implementable user stories with epics, acceptance criteria, and sprint planning',
  inputSchema: WorkflowInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    projectName: z.string(),
    totalEpics: z.number(),
    totalStories: z.number(),
    totalSprints: z.number(),
    totalPoints: z.number(),
  }),
})
  .then(parseDocumentStep)
  .then(generateEpicsStep)
  .then(createStoriesStep)
  .then(addDetailsStep)
  .then(sprintPlanningStep)
  .commit();
