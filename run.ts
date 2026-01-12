#!/usr/bin/env npx tsx

/**
 * Document Architect - Interactive Terminal Session
 * 
 * Run with: npx tsx run.ts
 * Or: npm run architect
 * 
 * This script starts an interactive conversation with the Architect Agent
 * to create PRDs (Product Requirements Documents) or TDRs (Technical Design Reviews)
 */

import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';

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

// ASCII art banner
const banner = `
${colors.cyan}╔══════════════════════════════════════════════════════════════╗
║                                                                ║
║   ${colors.bright}📐 DOCUMENT ARCHITECT${colors.reset}${colors.cyan}                                     ║
║   ${colors.dim}AI-Powered PRD & TDR Generator${colors.reset}${colors.cyan}                            ║
║                                                                ║
║   ${colors.yellow}Modes:${colors.reset}${colors.cyan}                                                     ║
║   ${colors.green}• PRD${colors.reset}${colors.cyan} - Product Requirements Document (PM Mode)           ║
║   ${colors.magenta}• TDR${colors.reset}${colors.cyan} - Technical Design Review (Principal Engineer)      ║
║                                                                ║
║   ${colors.dim}Type 'exit' or 'quit' to end the session${colors.reset}${colors.cyan}                   ║
║   ${colors.dim}Type 'reset' to start a new conversation${colors.reset}${colors.cyan}                   ║
║                                                                ║
╚══════════════════════════════════════════════════════════════╝${colors.reset}
`;

// Store conversation history for context
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Load environment variables from .env file
 * Must be called BEFORE importing any modules that use env vars
 */
function loadEnv(): boolean {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    let loaded = 0;
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) return;
      
      const equalIndex = line.indexOf('=');
      if (equalIndex === -1) return;
      
      const key = line.substring(0, equalIndex).trim();
      let value = line.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (key && value) {
        process.env[key] = value;
        loaded++;
      }
    });
    console.log(`${colors.dim}Loaded ${loaded} environment variables from .env${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.yellow}⚠️  No .env file found.${colors.reset}`);
    console.log(`${colors.dim}Copy env.example to .env and add your API keys:${colors.reset}`);
    console.log(`${colors.dim}  cp env.example .env${colors.reset}\n`);
    return false;
  }
}

/**
 * Create readline interface for terminal input
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
}

/**
 * Format the agent's response for terminal display
 */
function formatResponse(response: string): string {
  return `${colors.blue}┌─ Agent ─────────────────────────────────────────────────────┐${colors.reset}
${colors.reset}${response}${colors.reset}
${colors.blue}└─────────────────────────────────────────────────────────────┘${colors.reset}`;
}

/**
 * Main interactive loop
 */
async function main(): Promise<void> {
  console.clear();
  console.log(banner);

  // Load environment variables FIRST
  const envLoaded = loadEnv();
  
  // Check configuration
  const useOllama = process.env.USE_OLLAMA === 'true' || 
                    process.env.OLLAMA_MODEL?.includes('-cloud') ||
                    process.env.OLLAMA_BASE_URL;
  const hasGroq = !!process.env.GROQ_API_KEY;
  const ollamaModel = process.env.OLLAMA_MODEL || 'qwen3-coder:480b-cloud';
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  
  // Show which provider is being used
  if (useOllama) {
    const isCloudModel = ollamaModel.includes('-cloud');
    if (isCloudModel) {
      console.log(`${colors.green}✓ Using Ollama Cloud Model: ${colors.bright}${ollamaModel}${colors.reset}`);
      console.log(`${colors.dim}  Make sure you've run: ollama signin && ollama pull ${ollamaModel}${colors.reset}`);
    } else {
      console.log(`${colors.green}✓ Using Ollama at: ${ollamaUrl}${colors.reset}`);
      console.log(`${colors.green}  Model: ${ollamaModel}${colors.reset}`);
    }
  } else if (hasGroq) {
    console.log(`${colors.green}✓ Using Groq (llama-3.3-70b-versatile)${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  No provider configured, defaulting to Ollama Cloud${colors.reset}`);
    console.log(`${colors.dim}  Run: ollama signin && ollama pull qwen3-coder:480b-cloud${colors.reset}`);
  }
  console.log();

  // Now dynamically import the agent (after env vars are loaded)
  const { architectAgent } = await import('./src/mastra/agents/architect');
  
  const conversationHistory: Message[] = [];

  /**
   * Send a message to the agent and get a response
   */
  async function chat(userMessage: string): Promise<string> {
    try {
      // Add user message to history
      conversationHistory.push({ role: 'user', content: userMessage });

      // Generate response from agent
      const response = await architectAgent.generate(conversationHistory);

      // Extract text from response
      const assistantMessage = response.text || 'I apologize, but I was unable to generate a response.';

      // Add assistant response to history
      conversationHistory.push({ role: 'assistant', content: assistantMessage });

      return assistantMessage;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`${colors.red}Error: ${errorMessage}${colors.reset}`);
      return `I encountered an error: ${errorMessage}. Please try again.`;
    }
  }

  const rl = createReadlineInterface();

  // Initial greeting from the agent
  console.log(`${colors.dim}Starting conversation...${colors.reset}\n`);
  
  try {
    const greeting = await chat("Hello, I'd like to create a document.");
    console.log(formatResponse(greeting));
    console.log();
  } catch (error) {
    console.error(`${colors.red}Failed to start conversation. Please check your API credentials.${colors.reset}`);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${colors.dim}Error: ${errorMsg}${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // Prompt function
  const prompt = (): void => {
    rl.question(`${colors.green}You: ${colors.reset}`, async (input: string) => {
      const trimmedInput = input.trim();

      // Handle special commands
      if (trimmedInput.toLowerCase() === 'exit' || trimmedInput.toLowerCase() === 'quit') {
        console.log(`\n${colors.cyan}Thank you for using Document Architect! Your documents are saved in /docs${colors.reset}`);
        rl.close();
        process.exit(0);
      }

      if (trimmedInput.toLowerCase() === 'reset') {
        conversationHistory.length = 0;
        console.log(`\n${colors.yellow}Conversation reset. Starting fresh...${colors.reset}\n`);
        const greeting = await chat("Hello, I'd like to create a document.");
        console.log(formatResponse(greeting));
        console.log();
        prompt();
        return;
      }

      if (trimmedInput.toLowerCase() === 'help') {
        console.log(`
${colors.yellow}Available Commands:${colors.reset}
  ${colors.green}PRD${colors.reset}    - Start a Product Requirements Document interview
  ${colors.green}TDR${colors.reset}    - Start a Technical Design Review interview
  ${colors.green}reset${colors.reset}  - Start a new conversation
  ${colors.green}help${colors.reset}   - Show this help message
  ${colors.green}exit${colors.reset}   - Exit the program
`);
        prompt();
        return;
      }

      if (!trimmedInput) {
        prompt();
        return;
      }

      // Show typing indicator
      process.stdout.write(`${colors.dim}Agent is thinking...${colors.reset}`);

      // Get response from agent
      const response = await chat(trimmedInput);

      // Clear typing indicator and show response
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log();
      console.log(formatResponse(response));
      console.log();

      // Continue the loop
      prompt();
    });
  };

  // Start the interactive loop
  prompt();

  // Handle SIGINT (Ctrl+C)
  rl.on('SIGINT', () => {
    console.log(`\n\n${colors.cyan}Goodbye! Your documents are saved in /docs${colors.reset}`);
    rl.close();
    process.exit(0);
  });
}

// Run the main function
main().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
