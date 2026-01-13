# 📐 Document Architect

An AI-powered agent that interviews you like a Senior PM or Principal Engineer to generate professional **PRDs (Product Requirements Documents)** and **TDRs (Technical Design Reviews)**.

Built with [Mastra.ai](https://mastra.ai) — a TypeScript framework for building AI agents with tools, memory, and workflows, powered by the [Vercel AI SDK](https://sdk.vercel.ai).

---

## 🎮 Two Ways to Interact

Mastra provides **two built-in interfaces** to interact with the Architect Agent:

| Interface | Command | Description |
|-----------|---------|-------------|
| **🖥️ Mastra Playground** | `npm run dev` | Web UI at http://localhost:4111 with chat interface, tool inspector, and logs |
| **⌨️ CLI Mode** | `npm run architect` | Terminal-based interactive interview |

Both interfaces use the same underlying agent — choose based on your preference!

---

## ✨ Features

### Two Interview Modes

| Mode | Persona | Focus |
|------|---------|-------|
| **📋 PRD Mode** | Senior Product Manager | User problems, success metrics, MVP prioritization, user stories |
| **🏗️ TDR Mode** | Principal Engineer | System architecture, security, scalability, code examples, junior dev guides |

### Key Capabilities

- **Interactive Interview**: 5 focused questions, one at a time
- **Conversation Memory**: Maintains context across the entire session (powered by LibSQL)
- **Rich Document Output**: Markdown with tables, Mermaid diagrams, code examples
- **Automatic File Saving**: Documents saved to `/docs` folder via Mastra Tools
- **Multiple LLM Providers**: Works with Ollama, Groq, OpenAI, Anthropic, Google (via Vercel AI SDK)

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | [Mastra.ai](https://mastra.ai) |
| **AI SDK** | [Vercel AI SDK](https://sdk.vercel.ai) (for LLM provider abstraction) |
| **Memory** | SQLite via [@mastra/libsql](https://www.npmjs.com/package/@mastra/libsql) |
| **Language** | TypeScript |
| **Runtime** | Node.js 22+ |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** (required)
- **One of the following LLM providers:**
  - Ollama Cloud Models (free with Ollama account) ✨ Recommended
  - Local Ollama (free, requires GPU)
  - Groq (free tier available)
  - OpenAI (paid)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/architect-agent.git
cd architect-agent

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Configure your LLM provider (see below)
```

### Start Using

```bash
# Option 1: Mastra Playground (Web UI)
npm run dev
# Open http://localhost:4111 → Agents → Architect Agent

# Option 2: CLI Mode
npm run architect
```

---

## 🎮 Using the Mastra Playground (Web UI)

The Mastra Playground provides a visual interface for interacting with agents.

```bash
npm run dev
```

Open **http://localhost:4111** in your browser.

### Playground Features

| Feature | Description |
|---------|-------------|
| **Agent Chat** | Interactive chat interface with the Architect Agent |
| **Tool Calls** | See when tools are called (e.g., `saveDocumentTool`) |
| **Conversation History** | View full conversation with timestamps |
| **Agent Config** | Inspect agent settings, model, and attached tools |
| **API Explorer** | Test the REST API endpoints directly |
| **Logs** | Real-time logs for debugging |

### Navigation

1. Open http://localhost:4111
2. Click **Agents** in the sidebar
3. Select **"Architect Agent"**
4. Start chatting!

### REST API

The Mastra dev server also exposes REST endpoints:

```bash
# Generate a response
POST http://localhost:4111/api/agents/architectAgent/generate
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "I want to create a TDR for a payment system" }
  ]
}

# Stream responses
POST http://localhost:4111/api/agents/architectAgent/stream

# Get agent info
GET http://localhost:4111/api/agents/architectAgent
```

---

## ⌨️ Using CLI Mode

For terminal lovers, the CLI provides an interactive interview experience:

```bash
npm run architect
```

### Example Session

```
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
"Walk me through the system architecture..."

[... 5 questions later ...]

✅ TDR Generated Successfully!
📄 Saved to: docs/collaborative-document-editor-tdr-2026-01-12.md
```

---

## 🔧 LLM Provider Configuration

### Option 1: Ollama Cloud Models (Recommended - Free)

Ollama Cloud lets you run massive models (up to 671B parameters) via Ollama's infrastructure. **No API key required!**

```bash
# 1. Install Ollama (v0.12+)
brew install ollama  # macOS
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
| `deepseek-v3.1:671b-cloud` | 671B | Most capable |

**Configure `.env`:**
```env
USE_OLLAMA=true
OLLAMA_MODEL=qwen3-coder:480b-cloud
OLLAMA_BASE_URL=http://localhost:11434
```

---

### Option 2: Local Ollama (Free)

Run models on your machine. Requires GPU with sufficient VRAM.

```bash
ollama pull llama3:8b        # 8GB VRAM
ollama pull codellama:7b     # 6GB VRAM
```

**Configure `.env`:**
```env
USE_OLLAMA=true
OLLAMA_MODEL=llama3:8b
OLLAMA_BASE_URL=http://localhost:11434
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

---

### Option 4: OpenAI (Paid)

For GPT-4 quality outputs.

1. Get an API key from [platform.openai.com](https://platform.openai.com)
2. Modify `src/mastra/agents/architect.ts`:

```typescript
function getModelConfig() {
  if (process.env.OPENAI_API_KEY) {
    return 'openai/gpt-4o';
  }
  // ... rest of config
}
```

**Configure `.env`:**
```env
OPENAI_API_KEY=sk-your_api_key_here
```

---

### Option 5: Google Gemini (Free Tier)

```bash
npm install @ai-sdk/google
```

**Configure `.env`:**
```env
GOOGLE_API_KEY=your_api_key_here
```

---

### Option 6: Anthropic Claude (Paid)

```bash
npm install @ai-sdk/anthropic
```

**Configure `.env`:**
```env
ANTHROPIC_API_KEY=sk-ant-your_api_key_here
```

---

## 🏗️ How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mastra Framework                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   Agent     │    │   Tools     │    │   Memory    │         │
│  │ (Architect) │ ←→ │ (Save Doc)  │ ←→ │  (LibSQL)   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         ↓                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Vercel AI SDK                          │    │
│  │  (Provider abstraction: Ollama, Groq, OpenAI, etc.)     │    │
│  └─────────────────────────────────────────────────────────┘    │
│         ↓                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              LLM Provider (your choice)                  │    │
│  │  Ollama Cloud │ Local Ollama │ Groq │ OpenAI │ etc.     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         ↓                              ↓
  ┌─────────────┐                ┌─────────────┐
  │ Playground  │                │    CLI      │
  │  (Web UI)   │                │ (Terminal)  │
  └─────────────┘                └─────────────┘
```

### Project Structure

```
architect-agent/
├── src/
│   └── mastra/
│       ├── agents/
│       │   └── architect.ts    # Agent definition with PM/Engineer prompts
│       ├── tools/
│       │   └── file-tools.ts   # saveDocumentTool, generateDiagramTool
│       └── index.ts            # Mastra instance export
├── docs/                       # Generated documents saved here
├── run.ts                      # CLI entry point
├── env.example                 # Environment template
├── package.json
└── README.md
```

### Components

1. **Agent** (`src/mastra/agents/architect.ts`)
   - Two personas: PM Mode & Principal Engineer Mode
   - 5-question interview protocol
   - Document generation with templates

2. **Tools** (`src/mastra/tools/file-tools.ts`)
   - `saveDocumentTool`: Saves markdown to `/docs`
   - `generateDiagramTool`: Creates Mermaid.js diagrams

3. **Memory** (LibSQL/SQLite)
   - Persists conversation history
   - Enables context-aware responses

---

## 🎯 Who Is This For?

### Product Managers

- **Struggling to start a PRD?** AI interviews you with proven questions
- **Missing key sections?** Template ensures comprehensive coverage
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

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Mastra Playground (http://localhost:4111) |
| `npm run architect` | Run CLI interview mode |
| `npm run architect:dev` | CLI with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |

### Adding New LLM Providers

Mastra uses the [Vercel AI SDK](https://sdk.vercel.ai) for LLM provider abstraction:

```bash
# Install a new provider
npm install @ai-sdk/anthropic
```

```typescript
// Update src/mastra/agents/architect.ts
import { anthropic } from '@ai-sdk/anthropic';

function getModelConfig() {
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic('claude-3-5-sonnet-20241022');
  }
  // ... existing config
}
```

---

## 🔐 Security Notes

- **Never commit `.env` files** — They're in `.gitignore`
- **Rotate leaked keys immediately** — Generate new ones if exposed
- **Use environment variables** — Don't hardcode API keys
- **The `env.example` file** — Safe to commit (contains no real keys)

---

## 📚 Resources

- [Mastra Documentation](https://docs.mastra.ai)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
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

MIT License — feel free to use this for your own projects!

---

## 🙏 Acknowledgments

- **[Mastra.ai](https://mastra.ai)** — The AI agent framework
- **[Vercel AI SDK](https://sdk.vercel.ai)** — LLM provider abstraction layer
- **LLM Providers** — Ollama, Groq, OpenAI, Anthropic, Google
