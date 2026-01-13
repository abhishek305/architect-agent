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

| Feature | Description |
|---------|-------------|
| **Agent Chat** | Interactive chat interface with the Architect Agent |
| **Tool Calls** | See when tools are called (e.g., saveDocument) |
| **Conversation History** | View full conversation with timestamps |
| **Agent Config** | Inspect agent settings, model, and tools |
| **API Explorer** | Test the REST API endpoints directly |
| **Logs** | Real-time logs for debugging |

#### Playground Screenshot

```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Mastra Playground          http://localhost:4111        │
├─────────────────────────────────────────────────────────────┤
│  📁 Agents                                                   │
│    └── Architect Agent  ←── Click here                      │
│  📁 Workflows                                                │
│  📁 Tools                                                    │
│  📁 Logs                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  💬 Chat with Architect Agent                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 👋 Welcome to Document Architect!                    │    │
│  │                                                      │    │
│  │ I can help you create:                              │    │
│  │ • 📋 PRD (Product Requirements)                     │    │
│  │ • 🏗️ TDR (Technical Design Review)                  │    │
│  │                                                      │    │
│  │ Which mode would you like? Type 'PRD' or 'TDR'      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Type your message...                          [Send]│    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### REST API Endpoints

When running `npm run dev`, these API endpoints are available:

```bash
# Chat with the agent
POST http://localhost:4111/api/agents/architectAgent/generate
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "I want to create a TDR" }
  ]
}

# Stream responses
POST http://localhost:4111/api/agents/architectAgent/stream

# Get agent info
GET http://localhost:4111/api/agents/architectAgent
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

## 🧪 Complete End-to-End Example

This section walks through testing **all features** of both agents using a realistic "Smart Notification System" scenario.

### Phase 1: Generate a PRD (Product Manager Mode)

```bash
npm run architect
# Or: npm run dev → http://localhost:4111 → Agents → Architect Agent
```

**Step 1 - Select Mode:**
```
PRD
```

**Step 2 - Project Name:**
```
Smart Notification System
```

**Q1 - Problem Discovery (copy this response):**
```
Our users are missing important updates because they rely on checking the app manually. 
For example, a project manager named Sarah checks her dashboard 5 times a day just to see 
if any team member has completed a task or if a deadline is approaching. Yesterday, she 
missed a critical deadline because the status update was buried in a long list. She wants 
to be notified immediately when something important happens.
```

**Q2 - Target Audience:**
```
Primary Persona: Sarah, Project Manager at a 50-person marketing agency
- Technical Level: Semi-technical (uses Slack, Notion, basic automation)
- Current Workaround: Browser tab always open, refreshes every 30 minutes, 
  sets manual calendar reminders for critical deadlines
- Also uses email notifications from other tools but finds them overwhelming
```

**Q3 - Success Metrics:**
```
1. Reduce "missed deadline" incidents by 80% (currently 5/month → target 1/month)
2. Decrease average "time to acknowledge" from 4 hours to 15 minutes
3. Achieve 70% notification preference setup completion within first week
4. Reduce app refresh rate by 60% (tracked via analytics)
```

**Q4 - MVP Scope:**
```
Must Have (P0):
- In-app notification bell with unread count
- Real-time notification popup for critical alerts
- Basic notification preferences (on/off per category)
- Mark as read/unread functionality

Should Have (P1):
- Email digest (daily/weekly summary)
- Push notifications for mobile

Nice to Have (P2):
- Slack/Teams integration
- Custom notification rules
```

**Q5 - Business Context:**
```
This is driven by customer retention concerns. In our last NPS survey, 23% of detractors 
mentioned "missing important updates" as a pain point. Three competitors launched 
notification features in Q4 2025. If we don't ship in Q1 2026, we risk losing 2 enterprise 
renewals worth $180K ARR.
```

**✅ Output:** `docs/smart-notification-system-prd-YYYY-MM-DD.md`

---

### Phase 2: Generate a TDR (Principal Engineer Mode)

```bash
npm run architect
```

**Select Mode:**
```
TDR
```

**System Name:**
```
Smart Notification System - Real-time notification delivery with multi-channel support
```

**Q1 - Architecture Overview:**
```
The system has these components:

1. Frontend (React): 
   - NotificationBell component with WebSocket connection
   - NotificationPreferences settings page

2. Notification Service (Node.js):
   - REST API for CRUD operations
   - WebSocket server for real-time delivery

3. Message Queue (Redis):
   - Pub/Sub for real-time notifications
   - Queue for batch processing (email digests)

4. Database (PostgreSQL):
   - notifications table
   - notification_preferences table

5. External Services:
   - SendGrid for email, Firebase for push
```

**Q2 - Security Deep Dive:**
```
Authentication: JWT tokens with 1-hour expiry, refresh tokens in httpOnly cookies

Authorization: 
- Users can only see their own notifications
- Admins can send system-wide notifications
- Rate limiting: 100 requests/minute per user

If JWT is stolen:
- Short expiry limits damage
- Refresh token rotation on use
- User can revoke all sessions
```

**Q3 - Data & Scalability:**
```
Main tables:

notifications:
- id (UUID), user_id, type, title, body, read_at, created_at, metadata (JSONB)
- Indexes: user_id, created_at DESC

At 10M notifications:
- Partitioning by created_at (monthly)
- Archive old notifications (>90 days)
- Unread count cached in Redis
```

**Q4 - Failure Modes:**
```
Database goes down:
- Read from Redis cache for recent notifications
- Queue new notifications, replay when DB recovers

WebSocket disconnects:
- Auto-reconnect with exponential backoff
- Fetch missed notifications on reconnect

Traffic spike (10x):
- Redis handles burst
- Auto-scale WebSocket servers
```

**Q5 - Implementation Path:**
```
Guardrails:
1. All endpoints use Zod schemas for validation
2. All queries through TypeORM (parameterized)
3. Redis-based rate limiting
4. WebSocket token validated on connection
5. No raw SQL in code reviews
```

**✅ Output:** `docs/smart-notification-system-tdr-YYYY-MM-DD.md`

---

### Phase 3: Generate User Stories (Story Builder Agent)

```bash
npm run dev
# Open http://localhost:4111 → Agents → Story Builder Agent
```

**Q1 - Document Selection:**
```
Use the PRD file: smart-notification-system-prd-YYYY-MM-DD.md
```
(Replace with actual filename from Phase 1)

**Q2 - Team Context:**
```
- Sprint duration: 2 weeks
- Average velocity: 24 story points per sprint
- Team size: 4 engineers (2 backend, 1 frontend, 1 full-stack)
```

**Q3 - Priority & Scope:**
```
Focus on P0 (MVP) only. Ship in-app notification bell and real-time popups first.
```

**Q4 - Technical Constraints:**
```
- Must integrate with existing React app (using React Query)
- Backend is Node.js with Express, PostgreSQL
- Already have Redis for caching
- JWT-based authentication already exists
```

**Q5 - Definition of Done:**
```
Standard DoD, plus:
- Performance test completed (< 100ms notification delivery)
- Accessibility audit passed (WCAG 2.1 AA)
- Feature flag configured
```

**✅ Output:** `docs/stories/smart-notification-system-stories-YYYY-MM-DD.md`

**Export to Jira:**
```
Please export these stories to Jira CSV format with project key NOTIFY
```

**✅ Output:** `docs/exports/notify-stories-jira-YYYY-MM-DD.csv`

---

### Phase 4: Test Additional Tools

#### Tech Stack Analyzer

In the Architect Agent, ask:
```
Can you analyze our tech stack? We're using:
- React 18
- Node.js 20
- PostgreSQL 15
- Redis 7
- TypeScript 5

This is a growth-stage startup with a medium-sized team.
```

**✅ Expected:** Strengths, concerns, best practices, pitfalls, and learning resources.

#### Export to Confluence

After generating a TDR:
```
Can you export this TDR to Confluence wiki markup?
```

**✅ Output:** `docs/exports/smart-notification-system-confluence-YYYY-MM-DD.txt`

#### Export to HTML

```
Can you export this TDR to HTML format?
```

**✅ Output:** `docs/exports/smart-notification-system-html-YYYY-MM-DD.html`

---

### Complete Test Checklist

| Feature | Test | Expected Result |
|---------|------|-----------------|
| PRD Generation | Complete interview | Full PRD with all sections |
| TDR Generation | Complete interview | TDR with Mermaid diagrams + code |
| Story Generation | Use PRD as input | Epics, stories, acceptance criteria |
| Jira Export | Request CSV export | Valid CSV for Jira import |
| Stack Analyzer | Provide tech stack | Best practices + pitfalls |
| HTML Export | Request export | Formatted HTML file |
| Confluence Export | Request export | Wiki markup file |

### Troubleshooting

```bash
# Agent doesn't respond?
ollama list                        # Check Ollama is running
cat .env                           # Verify env variables

# File not saving?
ls -la docs/                       # Check directory exists
mkdir -p docs/stories docs/exports # Create if missing

# Jira CSV encoding issues?
# Import to Jira with UTF-8 encoding selected
```

---

## 🛠️ Story Builder Agent

The **Story Builder Agent** transforms your PRDs and TDRs into implementation-ready user stories.

### How to Use

```bash
# Step 1: Start the Mastra dev server
npm run dev

# Step 2: Open browser
open http://localhost:4111

# Step 3: Navigate to Agents → Story Builder Agent

# Step 4: The agent will guide you through 5 questions:
#   Q1 - Select a document from /docs or paste content
#   Q2 - Provide team context (sprint duration, velocity)
#   Q3 - Set priority & scope
#   Q4 - Describe technical constraints
#   Q5 - Define your Definition of Done
```

> **Tip:** First generate a PRD or TDR using the Architect Agent, then use the Story Builder to break it down into implementable stories.

### What It Generates

| Output | Description |
|--------|-------------|
| **Epics** | Grouped features with business value and success metrics |
| **User Stories** | As a/I want/So that format with full details |
| **Acceptance Criteria** | Given/When/Then testable criteria |
| **Definition of Done** | Checklist for story completion |
| **Test Cases** | Happy path, edge cases, error scenarios |
| **Story Points** | Fibonacci estimates (1,2,3,5,8,13) |
| **Sprint Plan** | Stories allocated to sprints based on velocity |
| **Dependencies** | Mermaid diagram showing story relationships |
| **Jira Export** | CSV file ready for bulk import |

### Example Story Output

```markdown
### US-0101: User Authentication - Setup

**Priority:** P0 | **Points:** 5 | **Sprint:** 1

**As a** end user,  
**I want** to log in with my email and password,  
**So that** I can access my personalized dashboard.

#### Acceptance Criteria

1. **Given** I'm on the login page, **When** I enter valid credentials, **Then** I'm redirected to the dashboard
2. **Given** I enter wrong password, **When** I submit, **Then** I see "Invalid credentials" error
3. **Given** I'm logged in, **When** my session expires, **Then** I'm prompted to log in again

#### Definition of Done

- [ ] Code complete with unit tests (>80% coverage)
- [ ] Code reviewed by at least 1 team member
- [ ] All acceptance criteria verified
- [ ] Integration tests passing
- [ ] Documentation updated

#### Test Cases

**Happy Path:**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to /login | Login form displayed |
| 2 | Enter valid email/password | Form accepts input |
| 3 | Click "Sign In" | Redirect to dashboard |

**Edge Cases:**
| Scenario | Input | Expected Behavior |
|----------|-------|-------------------|
| Empty email | "" | "Email is required" |
| Invalid format | "notanemail" | "Invalid email format" |

**Error Scenarios:**
| Scenario | Trigger | Expected Behavior |
|----------|---------|-------------------|
| Network down | API timeout | Show retry option |
| Account locked | 5 failed attempts | Show "Account locked" message |
```

### Workflow: Chaining Documents to Stories

The **Story Builder Workflow** automatically processes documents through these steps:

```
┌─────────────────┐
│ 1. Parse Doc    │ Extract requirements from PRD/TDR
├─────────────────┤
│ 2. Gen Epics    │ Group features into logical epics
├─────────────────┤
│ 3. Create       │ Break down epics into user stories
│    Stories      │
├─────────────────┤
│ 4. Add Details  │ Acceptance criteria, DoD, test cases
├─────────────────┤
│ 5. Estimate &   │ Story points + sprint allocation
│    Plan         │
├─────────────────┤
│ 6. Output       │ Markdown + optional Jira CSV
└─────────────────┘
```

### Tools Available

| Tool | Description |
|------|-------------|
| `listDocumentsTool` | List PRDs/TDRs in /docs folder |
| `readDocumentTool` | Read a document for processing |
| `saveStoriesTool` | Save stories to /docs/stories/ |
| `exportToJiraTool` | Export as Jira-compatible CSV |
| `generateStoryDependencyTool` | Create dependency diagram |

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

### Product Managers

- **Struggling to start a PRD?** Let the AI interview you with proven questions
- **Missing key sections?** The template ensures comprehensive coverage
- **Need consistency?** Same format every time

### Engineers

- **Designing a new system?** Get prompted on security, scalability, failure modes
- **Onboarding juniors?** TDRs include code examples and common pitfalls
- **Architecture reviews?** Share generated TDRs with your team

### Scrum Masters / Agile Coaches

- **Breaking down features?** Story Builder creates structured epics and stories
- **Writing acceptance criteria?** Given/When/Then format with edge cases
- **Sprint planning?** Automatic story point estimates and sprint allocation
- **Jira setup?** Export directly to Jira-compatible CSV

### QA Engineers

- **Test case creation?** Happy path, edge cases, and error scenarios included
- **Definition of Done?** Clear checklist for each story
- **Coverage gaps?** Stories include technical notes and dependencies

---

## 📝 Output Examples

### PRD Output Includes:
- Executive Summary
- Problem Statement with Pain Points Table
- Target Persona
- Success Metrics & KPIs
- Prioritized Requirements (P0/P1/P2)
- User Stories with Acceptance Criteria
- Timeline & Milestones
- Risks & Mitigations

### TDR Output Includes:
- Architecture Diagram (Mermaid.js)
- Component Descriptions
- Security Design with Code Examples
- Database Schema (SQL)
- Scalability Patterns
- Circuit Breaker Implementation
- Rate Limiting Code
- Common Pitfalls with Before/After
- Testing Strategy

---

## 🛠️ Development

### Running Modes

| Command | Description | URL |
|---------|-------------|-----|
| `npm run architect` | CLI mode - terminal interview | N/A |
| `npm run dev` | Mastra dev server with Playground UI | http://localhost:4111 |
| `npm run build` | Build for production | N/A |
| `npm run start` | Start production server | http://localhost:4111 |

### Mastra Dev Server Features

When you run `npm run dev`, you get:

1. **Playground UI** - Visual interface to chat with agents
2. **Hot Reload** - Changes to agents/tools auto-reload
3. **REST API** - Full API for integrating with other apps
4. **Logs Panel** - Real-time debugging logs
5. **Tool Inspector** - See tool definitions and test them

### Adding New Providers

To add a new LLM provider:

1. Install the AI SDK provider package
2. Update `getModelConfig()` in `architect.ts`
3. Add environment variable to `.env`

Example for a new provider:

```typescript
import { someProvider } from '@ai-sdk/some-provider';

function getModelConfig() {
  if (process.env.SOME_PROVIDER_API_KEY) {
    return someProvider('model-name');
  }
  // ... existing config
}
```

---

## 🔐 Security Notes

- **Never commit `.env` files** - They're in `.gitignore`
- **Rotate leaked keys immediately** - Generate new ones if exposed
- **Use environment variables** - Don't hardcode API keys
- **The `.env.example` file** - Safe to commit (contains no real keys)

---

## 📚 Resources

- [Mastra Documentation](https://docs.mastra.ai)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Ollama Cloud Models](https://ollama.com/blog/cloud-models)
- [Complete Test Scenario](./docs/TEST-SCENARIO.md) - Detailed testing guide with sample responses

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

MIT License - feel free to use this for your own projects!

---

## 🙏 Acknowledgments

- Built with [Mastra.ai](https://mastra.ai)
- Powered by [Vercel AI SDK](https://sdk.vercel.ai)
- LLM providers: Ollama, Groq, OpenAI, Anthropic, Google
