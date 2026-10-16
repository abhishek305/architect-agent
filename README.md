# 📐 Document Architect

An AI-powered toolkit that interviews you like a Senior PM or Principal Engineer to generate professional documentation and implementation-ready artifacts.

Built with [Mastra.ai](https://mastra.ai) - a TypeScript framework for building AI agents with tools, memory, and workflows.

---

## ✨ Features

### Three Agents, Two Workflows

| Agent | Persona | Output |
|-------|---------|--------|
| **📋 Architect Agent** | Senior PM / Principal Engineer | PRDs & TDRs |
| **⚛️ Frontend Architect Agent** | React/Next.js Expert | Frontend TDRs |
| **🛠️ Story Builder Agent** | Senior Agile Coach | User Stories & Epics |

| Workflow | Mode | Use Case |
|----------|------|----------|
| **Story Builder Workflow** | Interactive | Generate stories from existing docs |
| **Document Architect Pipeline** | Automated | Full end-to-end generation (CI/CD) |

### Workflow Chain: PRD → TDR → Stories

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Architect Agent │ →  │ Frontend Arch   │ →  │ Architect Agent │ →  │ Story Builder   │
│   (PRD Mode)    │    │     Agent       │    │   (TDR Mode)    │    │     Agent       │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • User problems │    │ • React patterns│    │ • Backend arch  │    │ • Epics         │
│ • Success KPIs  │    │ • Next.js config│    │ • Security      │    │ • User Stories  │
│ • Requirements  │    │ • Performance   │    │ • Scalability   │    │ • Test Cases    │
│ • Timeline      │    │ • Accessibility │    │ • Code examples │    │ • Sprint Plan   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
       ↓                       ↓                      ↓                      ↓
   docs/*.md              docs/*.md              docs/*.md           docs/stories/*.md
```

### Key Capabilities

- **Interactive Interview**: 5 focused questions per agent; skips anything your context already answers
- **Quality Gate**: Every PRD/TDR is checked for missing sections, unfilled placeholders, broken Mermaid, and unclosed code blocks — and revised automatically if it fails
- **Visible Assumptions**: Gaps the agent fills are marked *(Assumption)* and listed, so you can see what was your call vs. the agent's
- **PRD-aware TDRs**: In TDR mode the agent finds your existing PRD in `/docs` and builds on it instead of re-asking
- **Conversation Memory**: Maintains context across sessions
- **Rich Document Output**: Markdown with tables, Mermaid diagrams, code examples
- **Automatic File Saving**: Documents saved to `/docs` folder
- **Workflow Chaining**: Story Builder can read PRD/TDR files directly
- **Jira Export**: Export user stories in Jira-compatible CSV
- **Tech Stack Analysis**: Get recommendations based on your stack
- **Multiple Export Formats**: Markdown, HTML, Confluence, Notion
- **Frontend Best Practices**: React/Next.js patterns from [Vercel's agent-skills](https://github.com/vercel-labs/agent-skills)

### ⚠️ User Priority Principle

**Your explicit choices drive the document. Gaps are filled with expert recommendations.**

All agents follow this balanced hierarchy:
1. **EXPLICIT USER REQUIREMENTS (Non-negotiable)**: If you specify it, the agent uses it exactly
2. **GAPS IN REQUIREMENTS (Agent Expertise)**: If you don't specify, the agent recommends best practices
3. **COMPLEMENTARY VALUE (Always)**: Agent adds security, performance, and accessibility—without overriding

**Examples:**
- You say "Redux Toolkit" → Agent uses Redux Toolkit, adds RTK Query patterns
- You don't mention testing → Agent includes comprehensive testing strategy
- You're vague about architecture → Agent proposes well-reasoned options

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
git clone https://github.com/abhishek305/document-architect.git
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

### Option 4: OpenAI, Anthropic, Google Gemini, and others (Paid / Free Tier)

Set `MODEL` to any [Mastra model router](https://mastra.ai/models) ID (`provider/model`) and add that provider's
API key. No code changes needed — `MODEL` takes priority over the Ollama and Groq settings.

```env
# OpenAI — https://platform.openai.com/api-keys
MODEL=openai/gpt-5.1
OPENAI_API_KEY=sk-...

# Anthropic — https://console.anthropic.com
MODEL=anthropic/claude-sonnet-4-5
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini (free tier) — https://aistudio.google.com/app/apikey
MODEL=google/gemini-2.5-pro
GOOGLE_GENERATIVE_AI_API_KEY=...
```

> The list of known model IDs comes with `@mastra/core`; upgrade it to use models released after your installed version.

---

## 📖 Usage

### Quick Reference

| What You Want | Command | Access |
|---------------|---------|--------|
| Generate PRD/TDR via terminal | `npm run architect` | CLI (interactive) |
| Generate PRD/TDR via web UI | `npm run dev` | http://localhost:4111 → Architect Agent |
| Generate Frontend TDR | `npm run dev` | http://localhost:4111 → Frontend Architect Agent |
| Generate User Stories | `npm run dev` | http://localhost:4111 → Story Builder Agent |
| **Full automation pipeline** | `npm run architect:auto` | CLI (non-interactive) |
| Auto-restart on changes | `npm run architect:dev` | CLI |

### Option 1: CLI Mode

The simplest way to use Document Architect:

```bash
# Start the interactive session
npm run architect

# With file watching (auto-restart on code changes)
npm run architect:dev
```

### Option 2: Automation Pipeline (No Interaction)

For CI/CD integration or batch processing, use the automation pipeline:

```bash
# Run with a config file
npm run architect:auto -- --config configs/examples/full-example.json

# Pipe JSON directly
cat configs/examples/quick-start.json | npm run architect:auto

# View help
npm run architect:auto -- --help
```

**Pipeline Output:**
- `docs/[project]-prd-YYYY-MM-DD.md` — PRD document
- `docs/[project]-tdr-YYYY-MM-DD.md` — TDR document
- `docs/[project]-frontend-tdr-YYYY-MM-DD.md` — Frontend TDR (if `hasFrontend: true`)
- `docs/stories/[project]-stories-YYYY-MM-DD.md` — User stories
- `docs/exports/[project]-jira-YYYY-MM-DD.csv` — Jira import (if `jiraProjectKey` provided)

---

### Configuration Schema (v2 - Flexible)

The config schema supports **flexible, free-form context** that real PMs and engineers actually have.

#### Minimal Config (Quick Start)

Just a project name and context is enough:

```json
{
  "projectName": "AI Code Review Bot",
  "context": "Slack bot that reviews PRs using GPT-4. Posts summary + suggestions in thread. Team of 3, 2-week timeline.",
  "techStack": ["Node.js", "Slack Bolt", "OpenAI API"]
}
```

#### Full Config with Interview Answers

Pre-answer interview questions to skip the interactive flow:

```json
{
  "projectName": "Customer Feedback Portal",
  "mode": "ALL",
  
  "context": "After our Q2 review, leadership prioritized customer feedback. Currently using email threads and Zendesk - no unified view. NPS dropped from 45 to 38.",
  
  "sourceDocuments": [
    "docs/user-research-summary.md",
    "notes/architecture-meeting.md"
  ],
  
  "interviewAnswers": {
    "problem": "No centralized system for feedback. Product doesn't see support tickets.",
    "targetUser": "Customer Success Managers (primary), Product Managers (secondary)",
    "successMetrics": "NPS back to 45+ in 6 months, 50% reduction in lost feedback",
    "mvpScope": "Feedback form, status tracking, admin dashboard, email notifications",
    "businessContext": "Q2 priority, $75K budget, 3-person team"
  },
  
  "techStack": ["Next.js", "PostgreSQL", "Redis"],
  "hasFrontend": true,
  "teamContext": { "velocity": 18, "sprintDuration": 2, "teamSize": 3 },
  "jiraProjectKey": "FEEDBACK"
}
```

#### Config Schema Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectName` | string | **Yes** | Project name (used in filenames) |
| `context` | string | Recommended | Free-form project context (the main input) |
| `sourceDocuments` | string[] | No | Paths to existing docs to read as context |
| `interviewAnswers` | object | No | Pre-answered interview questions |
| `mode` | enum | No | `PRD`, `TDR`, `FRONTEND_TDR`, `STORIES`, or `ALL` |
| `techStack` | string[] | Recommended | Technologies being used |
| `hasFrontend` | boolean | No | Generate Frontend TDR? (default: false) |
| `teamContext` | object | No | `{ velocity, sprintDuration, teamSize }` |
| `jiraProjectKey` | string | No | Project key for Jira CSV export |
| `author` | string | No | Document author name |

#### Interview Answer Keys

| PRD Questions | TDR Questions | Frontend Questions |
|---------------|---------------|-------------------|
| `problem` | `architecture` | `renderingStrategy` |
| `targetUser` | `security` | `stateManagement` |
| `successMetrics` | `scale` | `bundleStrategy` |
| `mvpScope` | `deployment` | `performanceTargets` |
| `businessContext` | `integrations` | `accessibility` |

**Custom keys are allowed** - add any domain-specific context.

#### ⚠️ Ensuring Your Requirements Are Respected

If you need specific technologies, be **explicit** in your config:

```json
{
  "context": "**CRITICAL TECH STACK (DO NOT CHANGE):**\n- Framework: React SPA with Vite (NOT Next.js)\n- State: Redux Toolkit (NOT Zustand)\n- Styling: Styled Components (NOT Tailwind)\n\nDO NOT substitute these with your preferences.",
  
  "interviewAnswers": {
    "renderingStrategy": "React SPA with Vite - NOT Next.js. Client-side rendering only.",
    "stateManagement": "Redux Toolkit with RTK Query - NOT Zustand, NOT standalone React Query"
  }
}
```

**Tips:**
- Use `CRITICAL:` or `DO NOT use:` prefixes for non-negotiable choices
- Repeat tech requirements in both `context` and `interviewAnswers`
- The agents will warn about potential issues but WILL NOT override your choices

#### Example Configs

See `configs/examples/` for ready-to-use templates:

| Config | Use Case |
|--------|----------|
| `quick-start.json` | Minimal config (just name + context + tech stack) |
| `full-example.json` | Comprehensive config showing all options |

#### Legacy Config (v1 - Still Supported)

Old configs with `description` + `requirements` still work:

```json
{
  "projectName": "API Gateway",
  "description": "REST API gateway service",
  "requirements": ["auth", "rate-limiting"],
  "techStack": ["Node.js", "Redis"]
}
```

The `description` is converted to `context`, and `requirements` to `interviewAnswers.mvpScope`.

---

### Option 3: Mastra Playground (Web UI)

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

### Interactive Mode with Pre-loaded Context

Skip the interview by pasting context directly. Works in CLI or Mastra Playground:

```
You: Generate a PRD with this context:

## Pre-loaded Context

**Project:** Mobile Banking App Redesign

**Problem:** Our mobile app has a 2.3-star rating. Users complain about:
- 6+ taps to transfer money
- No biometric login
- Slow load times (8+ seconds)

**Target Users:** Retail banking customers, ages 25-45.

**Success Metrics:** 
- App store rating: 2.3 → 4.0+ within 6 months
- Transfer completion rate: 45% → 85%

**MVP Scope:** 
- Biometric login
- 3-tap money transfer
- Redesigned dashboard
- Performance optimization (<3s load)

Agent: I see you've provided comprehensive context. I have a few clarifying questions:

1. For "3-tap transfer" - should this include verification step?
2. For accessibility - do you have an existing audit?

Once you confirm, I'll generate the complete PRD.
```

The agent detects pre-loaded context and:
- Acknowledges the provided information
- Skips already-answered questions
- Asks only for missing details
- Proceeds directly to generation if complete

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

## ⚛️ Frontend Architect Agent

Specialized in React/Next.js architecture with **45 rules from [Vercel's agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)**, prioritized by impact.

```bash
npm run dev  # Open http://localhost:4111 → Frontend Architect Agent
```

### Vercel Best Practices (8 Categories by Priority)

| Priority | Category | Impact | Key Rules |
|----------|----------|--------|-----------|
| 1 | **Eliminating Waterfalls** | CRITICAL | `async-parallel`, `async-suspense-boundaries` |
| 2 | **Bundle Size** | CRITICAL | `bundle-barrel-imports`, `bundle-dynamic-imports` |
| 3 | **Server Performance** | HIGH | `server-serialization`, `server-cache-react` |
| 4 | **Client Fetching** | MEDIUM-HIGH | `client-swr-dedup`, `client-passive-event-listeners` |
| 5 | **Re-render Optimization** | MEDIUM | `rerender-functional-setstate`, `rerender-derived-state` |
| 6 | **Rendering** | MEDIUM | `rendering-content-visibility`, `rendering-hydration-no-flicker` |
| 7 | **JS Performance** | LOW-MEDIUM | `js-tosorted-immutable`, `js-index-maps` |
| 8 | **Advanced Patterns** | LOW | `advanced-use-latest`, `advanced-event-handler-refs` |

### Interview Questions (Detects Anti-Patterns)

1. **Data Flow** - Detect sequential awaits, suggest `Promise.all()`
2. **Bundle Size** - Detect barrel imports, suggest direct imports
3. **Server/Client** - Detect over-serialization, suggest minimal props
4. **State & Re-renders** - Detect stale closures, suggest functional setState
5. **Performance** - Detect missing `content-visibility`, hydration flicker

### Frontend TDR Output

- Technology stack table with rationale
- Project structure (App Router, feature-based folders)
- Component hierarchy diagram (Mermaid)
- Server vs Client component patterns with code
- State management architecture
- Performance optimization techniques
- Accessibility implementation
- Testing strategy with examples
- Common pitfalls & solutions

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
│   ├── mastra/
│   │   ├── agents/
│   │   │   ├── architect.ts                  # Document Architect (PRD/TDR)
│   │   │   ├── frontend-architect.ts         # Frontend Architect (React/Next.js)
│   │   │   └── story-builder.ts              # Story Builder (User Stories)
│   │   ├── tools/
│   │   │   ├── file-tools.ts                 # PRD/TDR tools + export formats
│   │   │   └── story-tools.ts                # Story tools + Jira export
│   │   ├── workflows/
│   │   │   └── story-builder-workflow.ts     # Story generation workflow
│   │   └── index.ts                          # Mastra instance export
│   ├── types/
│   │   └── config.ts                         # ProjectConfigV2 interface
│   └── utils/
│       ├── document-reader.ts                # Read source documents
│       ├── document-spec.ts                  # PRD/TDR section spec (single source of truth)
│       ├── document-quality.ts               # Output cleanup + quality gate + revision loop
│       ├── context-builder.ts                # Build prompts from context
│       ├── model-config.ts                   # Shared LLM configuration
│       └── jira-export.ts                    # Jira CSV generation
├── cli/
│   └── architect-auto.ts                     # Automation CLI (no interaction)
├── configs/
│   └── examples/
│       ├── quick-start.json                  # Minimal quick-start (5 lines)
│       └── full-example.json                 # Comprehensive example (22 lines)
├── docs/                                     # Generated documents
│   ├── stories/                              # User stories
│   └── exports/                              # HTML, Confluence, Jira
├── tests/                                    # Unit tests (npm test)
├── run.ts                                    # Interactive CLI entry point
├── env.example
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

PRD and TDR sections are defined once in [`src/utils/document-spec.ts`](src/utils/document-spec.ts) and shared by
interactive mode, the automation pipeline, and the quality gate.

| PRD | TDR | Stories |
|-----|-----|---------|
| Executive Summary | Context & Scope (goals, non-goals, constraints) | Epics Overview |
| Problem Statement + Persona | Architecture (Mermaid system + sequence diagrams) | User Stories |
| Goals & Non-Goals | Alternatives Considered (ADR-style) | Acceptance Criteria |
| Success Metrics (baseline → target) | Data Design + API Design | Test Cases |
| Functional Requirements (P0/P1/P2) | Security & Privacy (threat model) | Sprint Plan |
| Non-Functional Requirements | Scalability & Reliability (failure modes) | Dependency Graph |
| User Stories, Out of Scope | Observability (SLIs/SLOs) + Deployment & Rollback | Jira CSV |
| Dependencies & Assumptions | Implementation Plan, Pitfalls (❌/✅ code), Testing | |
| Timeline, Risks, Open Questions | Cost Estimate, Risks & Assumptions | |

---

## 🛠️ Development

| Command | Description |
|---------|-------------|
| `npm run architect` | Interactive CLI mode |
| `npm run architect:auto` | Automation pipeline (no interaction) |
| `npm run dev` | Web UI at http://localhost:4111 |
| `npm run build` | Build for production |
| `npm test` | Run unit tests (quality gate, prompts, document parsing) |
| `npm run typecheck` | Type-check `src/`, `cli/`, `tests/`, and `run.ts` |

**Adding new LLM providers:** Set `MODEL=provider/model` and the provider's API key in `.env` (see Option 4 above). For providers outside the Mastra router, update `getModelConfig()` in `src/utils/model-config.ts`.

### Automation Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Document Architect Pipeline                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input (JSON config)                                             │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │ Step 1: PRD │ →  │ Step 2: TDR │ →  │ Step 3:     │          │
│  │ Generator   │    │ Generator   │    │ Frontend TDR│ (if set) │
│  └─────────────┘    └─────────────┘    └─────────────┘          │
│                            │                  │                  │
│                            └────────┬─────────┘                  │
│                                     ▼                            │
│                          ┌─────────────────┐                     │
│                          │ Step 4: Stories │                     │
│                          │ Generator       │                     │
│                          └─────────────────┘                     │
│                                     │                            │
│                                     ▼                            │
│                          ┌─────────────────┐                     │
│                          │ Step 5: Export  │                     │
│                          │ (Jira CSV, etc) │                     │
│                          └─────────────────┘                     │
│                                     │                            │
│                                     ▼                            │
│                              Output Files                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**CI/CD Integration Example (GitHub Actions):**

```yaml
name: Generate Docs
on:
  issues:
    types: [labeled]

jobs:
  generate:
    if: contains(github.event.label.name, 'needs-docs')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm run architect:auto -- --config configs/project.json
      - uses: peter-evans/create-pull-request@v5
        with:
          title: "docs: Add generated documentation"
```

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
