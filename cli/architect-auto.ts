#!/usr/bin/env npx tsx

/**
 * Document Architect - Automation CLI
 * 
 * Runs the document architect pipeline in automated mode (no user interaction).
 * Takes a JSON configuration file or stdin input and generates all documents.
 * 
 * This CLI calls agents DIRECTLY (not via Mastra workflow) for standalone execution.
 * No Mastra server required.
 * 
 * Usage:
 *   npx tsx cli/architect-auto.ts --config configs/examples/full-example.json
 *   echo '{"projectName":"My App",...}' | npx tsx cli/architect-auto.ts
 *   npm run architect:auto -- --config configs/examples/full-example.json
 * 
 * Options:
 *   --config, -c   Path to JSON configuration file
 *   --help, -h     Show help message
 *   --quiet, -q    Suppress progress output (only show final result)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

import { 
  ProjectConfigV2, 
  normalizeConfig, 
  validateConfig as validateConfigSchema 
} from '../src/types/config';
import { readSourceDocuments, extractKeySections } from '../src/utils/document-reader';
import { 
  buildPRDPrompt, 
  buildTDRPrompt, 
  buildFrontendTDRPrompt, 
  buildStoriesPrompt,
  buildPromptContext
} from '../src/utils/context-builder';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Re-export ProjectConfigV2 as PipelineConfig for backward compatibility
type PipelineConfig = ProjectConfigV2;

// Pipeline result structure
interface PipelineResult {
  success: boolean;
  documents: {
    prd: string;
    tdr: string;
    frontendTdr: string | null;
    stories: string;
  };
  exports: {
    jira: string | null;
  };
  summary: {
    epics: number;
    stories: number;
    totalPoints: number;
  };
  message: string;
}

/**
 * Load environment variables from .env file
 */
function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      if (line.startsWith('#') || !line.trim()) return;
      
      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) return;
      
      const key = line.substring(0, equalIndex).trim();
      let value = line.substring(equalIndex + 1).trim();
      
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (key && value) {
        process.env[key] = value;
      }
    });
  }
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
${colors.cyan}${colors.bright}Document Architect - Automation CLI${colors.reset}

${colors.yellow}Usage:${colors.reset}
  npx tsx cli/architect-auto.ts --config <file>
  echo '<json>' | npx tsx cli/architect-auto.ts
  npm run architect:auto -- --config <file>

${colors.yellow}Options:${colors.reset}
  --config, -c   Path to JSON configuration file
  --help, -h     Show this help message
  --quiet, -q    Suppress progress output

${colors.yellow}Configuration Format (v2 - Flexible):${colors.reset}
  {
    "projectName": "My Project",
    "context": "Free-form description of the project, problem, etc.",
    "sourceDocuments": ["docs/existing-prd.md"],
    "interviewAnswers": {
      "problem": "The specific problem we're solving",
      "targetUser": "Who experiences this problem",
      "successMetrics": "How we'll measure success"
    },
    "techStack": ["Next.js", "PostgreSQL"],
    "hasFrontend": true,
    "teamContext": { "velocity": 20, "sprintDuration": 2, "teamSize": 4 },
    "jiraProjectKey": "PROJ"
  }

${colors.yellow}Legacy Format (v1 - Still Supported):${colors.reset}
  {
    "projectName": "My Project",
    "description": "Project description",
    "requirements": ["req1", "req2"],
    "techStack": ["Next.js", "PostgreSQL"]
  }

${colors.yellow}Examples:${colors.reset}
  ${colors.dim}# Run with config file${colors.reset}
  npm run architect:auto -- --config configs/examples/full-example.json

  ${colors.dim}# Minimal config${colors.reset}
  echo '{"projectName":"API Gateway","context":"Need an API gateway for auth and rate limiting"}' | npm run architect:auto

  ${colors.dim}# With source documents${colors.reset}
  npm run architect:auto -- --config configs/engineer-architecture.json
`);
}

/**
 * Parse command line arguments
 */
function parseArgs(): { configPath?: string; quiet: boolean; help: boolean } {
  const args = process.argv.slice(2);
  let configPath: string | undefined;
  let quiet = false;
  let help = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--quiet' || arg === '-q') {
      quiet = true;
    } else if (arg === '--config' || arg === '-c') {
      configPath = args[++i];
    }
  }

  return { configPath, quiet, help };
}

/**
 * Read configuration from file
 */
function readConfigFile(configPath: string): PipelineConfig {
  const absolutePath = path.isAbsolute(configPath) 
    ? configPath 
    : path.resolve(process.cwd(), configPath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Configuration file not found: ${absolutePath}`);
  }
  
  const content = fs.readFileSync(absolutePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Read configuration from stdin
 */
async function readConfigFromStdin(): Promise<PipelineConfig> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
    
    let data = '';
    
    rl.on('line', (line) => {
      data += line;
    });
    
    rl.on('close', () => {
      try {
        const config = JSON.parse(data);
        resolve(config);
      } catch (error) {
        reject(new Error('Invalid JSON input from stdin'));
      }
    });
    
    rl.on('error', (error) => {
      reject(error);
    });
    
    // Timeout after 5 seconds if no input
    setTimeout(() => {
      if (!data) {
        reject(new Error('No input received. Use --config <file> or pipe JSON to stdin.'));
      }
    }, 5000);
  });
}

/**
 * Validate configuration (supports both v1 and v2 formats)
 */
function validateConfig(config: PipelineConfig): void {
  // Normalize to v2 format first
  const normalized = normalizeConfig(config);
  
  // Use schema validation
  const errors = validateConfigSchema(normalized);
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n  - ${errors.join('\n  - ')}`);
  }
}

/**
 * Print progress update
 */
function printProgress(message: string, quiet: boolean): void {
  if (!quiet) {
    console.log(`${colors.dim}[${new Date().toISOString()}]${colors.reset} ${message}`);
  }
}

/**
 * Helper functions for file operations
 */
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

/**
 * Generate Jira-compatible CSV from stories
 */
function generateJiraCSV(storiesContent: string, projectKey: string, projectName: string): string {
  const headers = [
    'Issue Type',
    'Summary',
    'Description',
    'Priority',
    'Story Points',
    'Labels',
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
    ]);
  }
  
  // Build CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  return csvContent;
}

/**
 * Execute the document generation pipeline by calling agents directly
 */
async function executePipeline(config: PipelineConfig, quiet: boolean): Promise<PipelineResult> {
  const timestamp = getTimestamp();
  
  // Normalize configuration to v2 format
  const normalizedConfig = normalizeConfig(config);
  
  const sanitizedName = sanitizeFilename(normalizedConfig.projectName);
  const teamContext = normalizedConfig.teamContext ?? { velocity: 20, sprintDuration: 2, teamSize: 4 };
  
  // Import agents dynamically (after env vars are loaded)
  printProgress('Loading agents...', quiet);
  const { architectAgent } = await import('../src/mastra/agents/architect');
  const { frontendArchitectAgent } = await import('../src/mastra/agents/frontend-architect');
  const { storyBuilderAgent } = await import('../src/mastra/agents/story-builder');
  
  // Read source documents if provided
  let sourceDocsContent = '';
  if (normalizedConfig.sourceDocuments && normalizedConfig.sourceDocuments.length > 0) {
    printProgress(`Reading ${normalizedConfig.sourceDocuments.length} source document(s)...`, quiet);
    const docsResult = readSourceDocuments(normalizedConfig.sourceDocuments);
    sourceDocsContent = docsResult.combinedContent;
    
    if (docsResult.documents.length > 0) {
      printProgress(`  ✓ Read: ${docsResult.documents.map(d => d.filename).join(', ')}`, quiet);
    }
    if (docsResult.errors.length > 0) {
      printProgress(`  ⚠ Failed to read: ${docsResult.errors.map(e => e.filename).join(', ')}`, quiet);
    }
  }
  
  // Build context summary for logging
  const contextInfo = buildPromptContext(normalizedConfig);
  printProgress(`Context: ${contextInfo.sections.join(', ')} (${contextInfo.length} chars)`, quiet);
  
  // =========================================================================
  // Step 1: Generate PRD
  // =========================================================================
  printProgress('Step 1/5: Generating PRD...', quiet);
  
  // Use context builder for PRD prompt
  const prdPrompt = buildPRDPrompt(normalizedConfig);

  const prdResponse = await architectAgent.generate([
    { role: 'user' as const, content: prdPrompt }
  ]);
  const prdContent = prdResponse.text;
  const prdFilename = `${sanitizedName}-prd-${timestamp}.md`;
  const prdPath = saveDocument(prdContent, prdFilename);
  
  printProgress(`  ✓ PRD saved to: ${prdPath}`, quiet);
  
  // =========================================================================
  // Step 2: Generate TDR
  // =========================================================================
  printProgress('Step 2/5: Generating TDR...', quiet);
  
  // Use context builder for TDR prompt
  const tdrPrompt = buildTDRPrompt(normalizedConfig, prdContent);

  const tdrResponse = await architectAgent.generate([
    { role: 'user' as const, content: tdrPrompt }
  ]);
  const tdrContent = tdrResponse.text;
  const tdrFilename = `${sanitizedName}-tdr-${timestamp}.md`;
  const tdrPath = saveDocument(tdrContent, tdrFilename);
  
  printProgress(`  ✓ TDR saved to: ${tdrPath}`, quiet);
  
  // =========================================================================
  // Step 3: Generate Frontend TDR (if hasFrontend)
  // =========================================================================
  let frontendTdrPath: string | null = null;
  let frontendTdrContent: string | null = null;
  
  if (normalizedConfig.hasFrontend) {
    printProgress('Step 3/5: Generating Frontend TDR...', quiet);
    
    // Use context builder for Frontend TDR prompt
    const frontendTdrPrompt = buildFrontendTDRPrompt(normalizedConfig, prdContent, tdrContent);

    const frontendTdrResponse = await frontendArchitectAgent.generate([
      { role: 'user' as const, content: frontendTdrPrompt }
    ]);
    frontendTdrContent = frontendTdrResponse.text;
    const frontendTdrFilename = `${sanitizedName}-frontend-tdr-${timestamp}.md`;
    frontendTdrPath = saveDocument(frontendTdrContent, frontendTdrFilename);
    
    printProgress(`  ✓ Frontend TDR saved to: ${frontendTdrPath}`, quiet);
  } else {
    printProgress('Step 3/5: Skipping Frontend TDR (not a frontend project)', quiet);
  }
  
  // =========================================================================
  // Step 4: Generate User Stories
  // =========================================================================
  printProgress('Step 4/5: Generating User Stories...', quiet);
  
  // Combine all documents for context
  let fullDocContext = `## PRD Summary\n${extractKeySections(prdContent, 3000)}\n\n`;
  fullDocContext += `## TDR Summary\n${extractKeySections(tdrContent, 3000)}\n\n`;
  if (frontendTdrContent) {
    fullDocContext += `## Frontend TDR Summary\n${extractKeySections(frontendTdrContent, 2000)}\n\n`;
  }
  
  // Use context builder for stories prompt
  const storiesPrompt = buildStoriesPrompt(normalizedConfig, fullDocContext);

  const storiesResponse = await storyBuilderAgent.generate([
    { role: 'user' as const, content: storiesPrompt }
  ]);
  const storiesContent = storiesResponse.text;
  const storiesFilename = `${sanitizedName}-stories-${timestamp}.md`;
  const storiesPath = saveDocument(storiesContent, storiesFilename, 'stories');
  
  printProgress(`  ✓ Stories saved to: ${storiesPath}`, quiet);
  
  // =========================================================================
  // Step 5: Export Jira CSV (if jiraProjectKey provided)
  // =========================================================================
  let jiraExportPath: string | null = null;
  
  if (normalizedConfig.jiraProjectKey) {
    printProgress('Step 5/5: Exporting Jira CSV...', quiet);
    
    const jiraCSV = generateJiraCSV(storiesContent, normalizedConfig.jiraProjectKey, normalizedConfig.projectName);
    const jiraFilename = `${sanitizedName}-jira-${timestamp}.csv`;
    
    const exportsDir = path.join(process.cwd(), 'docs', 'exports');
    ensureDir(exportsDir);
    jiraExportPath = path.join(exportsDir, jiraFilename);
    fs.writeFileSync(jiraExportPath, jiraCSV, 'utf-8');
    
    printProgress(`  ✓ Jira CSV saved to: ${jiraExportPath}`, quiet);
  } else {
    printProgress('Step 5/5: Skipping Jira export (no jiraProjectKey provided)', quiet);
  }
  
  // =========================================================================
  // Calculate summary metrics
  // =========================================================================
  
  // Extract metrics from stories content
  const epicsMatch = storiesContent.match(/EPIC-\d+/g);
  const storiesMatch = storiesContent.match(/US-\d+/g);
  const pointsMatches = storiesContent.match(/Story Points:\s*(\d+)/gi);
  
  const epicsCount = epicsMatch ? new Set(epicsMatch).size : 3;
  const storiesCount = storiesMatch ? new Set(storiesMatch).size : 10;
  const totalPoints = pointsMatches 
    ? pointsMatches.reduce((sum, match) => {
        const num = parseInt(match.replace(/\D/g, ''));
        return sum + (isNaN(num) ? 0 : num);
      }, 0)
    : storiesCount * 5;
  
  // Build result message
  const docsGenerated = [
    `  PRD: ${prdPath}`,
    `  TDR: ${tdrPath}`,
    frontendTdrPath ? `  Frontend TDR: ${frontendTdrPath}` : null,
    `  Stories: ${storiesPath}`,
    jiraExportPath ? `  Jira CSV: ${jiraExportPath}` : null,
  ].filter(Boolean).join('\n');
  
  const message = `📄 Documents Generated:
${docsGenerated}

📊 Summary:
  • Epics: ${epicsCount}
  • User Stories: ${storiesCount}
  • Total Story Points: ${totalPoints}
  • Estimated Sprints: ${Math.ceil(totalPoints / teamContext.velocity)}`;
  
  return {
    success: true,
    documents: {
      prd: prdPath,
      tdr: tdrPath,
      frontendTdr: frontendTdrPath,
      stories: storiesPath,
    },
    exports: {
      jira: jiraExportPath,
    },
    summary: {
      epics: epicsCount,
      stories: storiesCount,
      totalPoints,
    },
    message,
  };
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const { configPath, quiet, help } = parseArgs();
  
  // Show help if requested
  if (help) {
    printHelp();
    process.exit(0);
  }
  
  // Load environment variables FIRST
  loadEnv();
  
  if (!quiet) {
    console.log(`\n${colors.cyan}${colors.bright}📐 Document Architect - Automation Pipeline${colors.reset}\n`);
  }
  
  try {
    // Read configuration
    let config: PipelineConfig;
    
    if (configPath) {
      printProgress(`Reading configuration from: ${configPath}`, quiet);
      config = readConfigFile(configPath);
    } else if (!process.stdin.isTTY) {
      printProgress('Reading configuration from stdin...', quiet);
      config = await readConfigFromStdin();
    } else {
      console.error(`${colors.red}Error: No configuration provided.${colors.reset}`);
      console.error(`Use --config <file> or pipe JSON to stdin.`);
      console.error(`Run with --help for usage information.`);
      process.exit(1);
    }
    
    // Validate configuration
    validateConfig(config);
    
    printProgress(`Project: ${config.projectName}`, quiet);
    printProgress(`Tech Stack: ${config.techStack.join(', ')}`, quiet);
    printProgress(`Frontend Mode: ${config.hasFrontend ? 'Yes' : 'No'}`, quiet);
    printProgress('', quiet);
    
    // Execute the pipeline by calling agents directly
    const result = await executePipeline(config, quiet);
    
    if (result.success) {
      console.log(`\n${colors.green}${colors.bright}✅ Pipeline completed successfully!${colors.reset}\n`);
      console.log(result.message);
      
      // Output JSON result for programmatic use
      if (quiet) {
        console.log('\n' + JSON.stringify(result, null, 2));
      }
      
      process.exit(0);
    } else {
      console.error(`\n${colors.red}Pipeline completed with errors.${colors.reset}`);
      console.error(result.message);
      process.exit(1);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`\n${colors.red}${colors.bright}❌ Error:${colors.reset} ${errorMessage}`);
    
    if (error instanceof Error && error.stack && !quiet) {
      console.error(`\n${colors.dim}Stack trace:${colors.reset}`);
      console.error(colors.dim + error.stack + colors.reset);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();
