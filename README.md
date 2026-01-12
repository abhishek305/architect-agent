# 📐 Document Architect

An AI-powered CLI tool that interviews you like a Senior PM or Principal Engineer to generate professional **PRDs (Product Requirements Documents)** and **TDRs (Technical Design Reviews)**.

Built with [Mastra.ai](https://mastra.ai) - a TypeScript framework for building AI agents with tools, memory, and workflows.

---

## ✨ Features

### Two Interview Modes

| Mode | Persona | Focus |
|------|---------|-------|
| **📋 PRD Mode** | Senior Product Manager | User problems, success metrics, MVP prioritization, user stories |
| **🏗️ TDR Mode** | Principal Engineer | System architecture, security, scalability, code examples, junior dev guides |

### Key Capabilities

- **Interactive Interview**: 5 focused questions, one at a time
- **Conversation Memory**: Maintains context across the entire session
- **Rich Document Output**: Markdown with tables, Mermaid diagrams, code examples
- **Automatic File Saving**: Documents saved to `/docs` folder
- **Multiple LLM Providers**: Works with free and paid models

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
Architect Agent/
├── src/
│   └── mastra/
│       ├── agents/
│       │   └── architect.ts    # Main agent definition
│       ├── tools/
│       │   └── file-tools.ts   # Document saving tools
│       └── index.ts            # Mastra instance export
├── docs/                       # Generated documents saved here
├── run.ts                      # CLI entry point
├── env.example                 # Environment template
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
