# 📐 Document Architect

An AI-powered toolkit that interviews you like a Senior PM or Principal Engineer to generate professional documentation and implementation-ready artifacts.

Built with [Mastra.ai](https://mastra.ai) - a TypeScript framework for building AI agents with tools, memory, and workflows.

---

## ✨ Features

### Two Agents, One Workflow

| Agent | Persona | Output |
|-------|---------|--------|
| **📋 Architect Agent** | Senior PM / Principal Engineer | PRDs & TDRs |
| **🛠️ Story Builder Agent** | Senior Agile Coach | User Stories & Epics |

### Workflow Chain: PRD → TDR → Stories

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Architect Agent │ →  │ Architect Agent │ →  │ Story Builder   │
│   (PRD Mode)    │    │   (TDR Mode)    │    │     Agent       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • User problems │    │ • Architecture  │    │ • Epics         │
│ • Success KPIs  │    │ • Security      │    │ • User Stories  │
│ • Requirements  │    │ • Scalability   │    │ • Acceptance    │
│ • User stories  │    │ • Code examples │    │   Criteria      │
│ • Timeline      │    │ • Pitfalls      │    │ • Test Cases    │
│                 │    │                 │    │ • Sprint Plan   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
       ↓                       ↓                      ↓
   docs/*.md              docs/*.md           docs/stories/*.md
                                                    +
                                              Jira CSV Export
```

### Key Capabilities

- **Interactive Interview**: 5 focused questions per agent
- **Conversation Memory**: Maintains context across sessions
- **Rich Document Output**: Markdown with tables, Mermaid diagrams, code examples
- **Automatic File Saving**: Documents saved to `/docs` folder
- **Workflow Chaining**: Story Builder can read PRD/TDR files directly
- **Jira Export**: Export user stories in Jira-compatible CSV
- **Tech Stack Analysis**: Get recommendations based on your stack
- **Multiple Export Formats**: Markdown, HTML, Confluence, Notion

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** (required)
- **One of the following LLM providers:**
  - Ollama (local, free)
  - Ollama Cloud Models (free with Ollama account)
  - Groq (free tier available)
  - OpenAI (paid)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/document-architect.git
cd document-architect

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Configure your LLM provider (see below)
# Then run!
npm run architect
```

---

## 🔧 LLM Provider Configuration

### Option 1: Ollama Cloud Models (Recommended - Free)

Ollama Cloud lets you run massive models (up to 671B parameters) via Ollama's infrastructure while using your local Ollama as a proxy. **No API key required!**

```bash
# 1. Install Ollama (v0.12+)
# macOS
brew install ollama

# Or download from https://ollama.com

# 2. Sign in to Ollama Cloud
ollama signin

# 3. Pull a cloud model
ollama pull qwen3-coder:480b-cloud
```

**Available Cloud Models:**
| Model | Size | Best For |
|-------|------|----------|
| `qwen3-coder:480b-cloud` | 480B | Code generation, TDRs |
| `gpt-oss:120b-cloud` | 120B | General purpose |
| `gpt-oss:20b-cloud` | 20B | Faster responses |
| `deepseek-v3.1:671b-cloud` | 671B | Most capable |

**Configure `.env`:**
```env
USE_OLLAMA=true
OLLAMA_MODEL=qwen3-coder:480b-cloud
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=ollama
```

---

### Option 2: Local Ollama (Free)

Run models entirely on your machine. Requires a GPU with sufficient VRAM.

```bash
# Install Ollama
brew install ollama

# Pull a local model
ollama pull llama3.2:3b      # Light (2GB VRAM)
ollama pull llama3:8b        # Medium (8GB VRAM)
ollama pull llama3:70b       # Heavy (40GB VRAM)
ollama pull codellama:7b     # For code-focused tasks
```

**Configure `.env`:**
```env
USE_OLLAMA=true
OLLAMA_MODEL=llama3:8b
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=ollama
```

---

### Option 3: Groq (Free Tier - Fast!)

Groq provides blazing-fast inference with a generous free tier.

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key

**Configure `.env`:**
```env
USE_OLLAMA=false
GROQ_API_KEY=gsk_your_api_key_here
```

**Available Models (via Groq):**
- `llama-3.3-70b-versatile` (default)
- `llama-3.1-8b-instant`
- `mixtral-8x7b-32768`

---

### Option 4: OpenAI (Paid)

For the highest quality outputs using GPT-4.

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Modify `src/mastra/agents/architect.ts` to use OpenAI

**Configure `.env`:**
```env
OPENAI_API_KEY=sk-your_api_key_here
```

**Update the agent** (`src/mastra/agents/architect.ts`):
```typescript
function getModelConfig() {
  if (process.env.OPENAI_API_KEY) {
    return 'openai/gpt-4o';
  }
  // ... rest of config
}
```

---

### Option 5: Google Gemini (Free Tier)

1. Get an API key from [aistudio.google.com](https://aistudio.google.com)
2. Install the Gemini provider: `npm install @ai-sdk/google`

**Configure `.env`:**
```env
GOOGLE_API_KEY=your_api_key_here
```

**Update the agent:**
```typescript
import { google } from '@ai-sdk/google';

function getModelConfig() {
  if (process.env.GOOGLE_API_KEY) {
    return google('gemini-1.5-pro');
  }
  // ... rest of config
}
```

---

### Option 6: Anthropic Claude (Paid)

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Install the Anthropic provider: `npm install @ai-sdk/anthropic`

**Configure `.env`:**
```env
ANTHROPIC_API_KEY=sk-ant-your_api_key_here
```

**Update the agent:**
```typescript
import { anthropic } from '@ai-sdk/anthropic';

function getModelConfig() {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic('claude-3-5-sonnet-20241022');
  }
  // ... rest of config
}
```

---

## 📖 Usage

### Quick Reference

| What You Want | Command | Access |
|---------------|---------|--------|
| Generate PRD/TDR via terminal | `npm run architect` | CLI |
| Generate PRD/TDR via web UI | `npm run dev` | http://localhost:4111 → Architect Agent |
| Generate User Stories | `npm run dev` | http://localhost:4111 → Story Builder Agent |
| Auto-restart on changes | `npm run architect:dev` | CLI |

### Option 1: CLI Mode

The simplest way to use Document Architect:

```bash
# Start the interactive session
npm run architect

# With file watching (auto-restart on code changes)
npm run architect:dev
```

### Option 2: Mastra Playground (Web UI)

Mastra includes a built-in **Playground UI** for interacting with agents visually.

```bash
# Start the Mastra dev server
npm run dev
```

This starts the server at **http://localhost:4111**

#### Accessing the Playground

1. Open your browser to `http://localhost:4111`
2. Navigate to **Agents** in the sidebar
3. Select **"Architect Agent"**
4. Start chatting in the interactive UI!

#### Playground Features

- **Agent Chat** - Interactive UI for both agents
- **Tool Calls** - See when tools execute (saveDocument, etc.)
- **Logs** - Real-time debugging
- **API Explorer** - Test REST endpoints

#### REST API

```bash
# Chat with agent
POST http://localhost:4111/api/agents/architectAgent/generate
{ "messages": [{ "role": "user", "content": "I want to create a TDR" }] }

# Stream responses
POST http://localhost:4111/api/agents/architectAgent/stream
```

---

### CLI Example Session

```
$ npm run architect

🤖 Document Architect Agent
════════════════════════════════════════════════════════════

👋 Welcome to Document Architect!

I can help you create two types of documents:

📋 PRD Mode (Product Manager)
🏗️ TDR Mode (Principal Engineer)

Which mode would you like to use? (Type 'PRD' or 'TDR')

You: TDR

Great choice! Let's begin the Technical Design Review.
What system or feature are you designing?

You: A real-time collaborative document editor like Google Docs

Q1 - Architecture Overview:
"Walk me through the system architecture. What are the main components..."

[... 5 questions later ...]

✅ TDR Generated Successfully!
📄 Saved to: docs/collaborative-document-editor-tdr-2026-01-12.md
```

---

## 🧪 Testing All Features

For a complete end-to-end test with sample responses for all agents, see:

📖 **[Complete Test Scenario](./docs/TEST-SCENARIO.md)**

The test scenario covers:
- PRD generation (Product Manager mode)
- TDR generation (Principal Engineer mode)  
- User story generation (Story Builder)
- Jira CSV export
- Tech stack analysis
- HTML & Confluence export

**Quick test:**
```bash
# Start the agent
npm run architect

# When prompted, type: PRD
# Follow the 5-question interview
# Document saves to: docs/[project-name]-prd-YYYY-MM-DD.md
```

---

## 🛠️ Story Builder Agent

Transforms PRDs/TDRs into implementation-ready user stories with acceptance criteria, test cases, and sprint plans.

```bash
npm run dev  # Open http://localhost:4111 → Story Builder Agent
```

### What It Generates

| Output | Description |
|--------|-------------|
| **Epics** | Grouped features with business value |
| **User Stories** | As a/I want/So that format |
| **Acceptance Criteria** | Given/When/Then testable criteria |
| **Test Cases** | Happy path, edge cases, error scenarios |
| **Sprint Plan** | Stories allocated by velocity |
| **Jira Export** | CSV ready for bulk import |

### Workflow Steps

```
Parse Doc → Generate Epics → Create Stories → Add Details → Sprint Plan → Output
```

### Available Tools

| Tool | Description |
|------|-------------|
| `listDocumentsTool` | List PRDs/TDRs in /docs |
| `readDocumentTool` | Read document content |
| `saveStoriesTool` | Save to /docs/stories/ |
| `exportToJiraTool` | Export as Jira CSV |

---

## 🏗️ How It Works

### Built with Mastra.ai

[Mastra](https://mastra.ai) is a TypeScript framework for building AI agents. This project demonstrates:

1. **Agent Definition** (`src/mastra/agents/architect.ts`)
   - System instructions for PM and Engineer personas
   - Dynamic model configuration (Ollama/Groq/OpenAI)
   - Attached tools for document generation

2. **Tools** (`src/mastra/tools/file-tools.ts`)
   - `saveDocumentTool`: Saves generated markdown to disk
   - `generateDiagramTool`: Creates Mermaid.js diagrams

3. **Memory** (SQLite via LibSQL)
   - Persists conversation history across sessions
   - Enables context-aware follow-up questions

4. **CLI Runner** (`run.ts`)
   - Interactive readline interface
   - Handles user input/output loop

### Project Structure

```
architect-agent/
├── src/
│   └── mastra/
│       ├── agents/
│       │   ├── architect.ts      # Document Architect (PRD/TDR)
│       │   └── story-builder.ts  # Story Builder (User Stories)
│       ├── tools/
│       │   ├── file-tools.ts     # PRD/TDR tools + export formats
│       │   └── story-tools.ts    # Story tools + Jira export
│       ├── workflows/
│       │   └── story-builder-workflow.ts  # Story generation workflow
│       └── index.ts              # Mastra instance export
├── docs/                         # Generated PRDs/TDRs saved here
│   ├── stories/                  # Generated user stories
│   └── exports/                  # HTML, Confluence, Jira exports
├── run.ts                        # CLI entry point
├── env.example                   # Environment template
├── package.json
└── README.md
```

---

## 🎯 Who Is This For?

| Role | Use Case |
|------|----------|
| **Product Managers** | PRD templates, structured interviews, consistent output |
| **Engineers** | TDRs with security, scalability, code examples, pitfalls |
| **Scrum Masters** | User stories, acceptance criteria, sprint planning |
| **QA Engineers** | Test cases, DoD checklists, edge case coverage |

## 📝 Output Sections

| PRD | TDR | Stories |
|-----|-----|---------|
| Executive Summary | Architecture Diagram (Mermaid) | Epics Overview |
| Problem Statement | Security Design + Code | User Stories |
| Target Persona | Database Schema (SQL) | Acceptance Criteria |
| Success Metrics | Scalability Patterns | Test Cases |
| Requirements (P0/P1/P2) | Rate Limiting Code | Sprint Plan |
| Timeline & Risks | Common Pitfalls | Jira CSV |

---

## 🛠️ Development

| Command | Description |
|---------|-------------|
| `npm run architect` | CLI mode |
| `npm run dev` | Web UI at http://localhost:4111 |
| `npm run build` | Build for production |

**Adding new LLM providers:** Install the AI SDK package, update `getModelConfig()` in `architect.ts`, add env variable.

---

## 🔐 Security

- Never commit `.env` files (already in `.gitignore`)
- Rotate leaked keys immediately
- The `env.example` is safe to commit

---

## 📚 Resources

- [Mastra Docs](https://docs.mastra.ai) • [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [Ollama Cloud Models](https://ollama.com/blog/cloud-models)
- [Complete Test Scenario](./docs/TEST-SCENARIO.md)

---

## 📄 License

MIT License

---

**Built with [Mastra.ai](https://mastra.ai)** • Powered by Ollama, Groq, OpenAI, Anthropic, Google
