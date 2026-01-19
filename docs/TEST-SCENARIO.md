# 🧪 End-to-End Test Scenario

This document provides a complete test scenario to validate all features of both the **Architect Agent** and **Story Builder Agent**.

---

## 📋 Test Feature: "Smart Notification System"

A notification system that allows users to receive real-time alerts via multiple channels (in-app, email, push) with customizable preferences.

---

## Phase 1: Architect Agent - PRD Mode

### Start the Agent

```bash
# Option 1: CLI Mode
npm run architect

# Option 2: Mastra Playground
npm run dev
# Open http://localhost:4111 → Agents → Architect Agent
```

### Test Conversation

Copy and paste these responses when prompted:

**Agent asks:** Which mode would you like to use?
```
PRD
```

**Agent asks:** What's the project/feature name?
```
Smart Notification System
```

**Q1 - Problem Discovery:**
```
Our users are missing important updates because they rely on checking the app manually. 
For example, a project manager named Sarah checks her dashboard 5 times a day just to see 
if any team member has completed a task or if a deadline is approaching. Yesterday, she 
missed a critical deadline because the status update was buried in a long list. She wants 
to be notified immediately when something important happens, without having to constantly 
refresh the page.
```

**Q2 - Target Audience & Alternatives:**
```
Primary Persona: Sarah, Project Manager at a 50-person marketing agency
- Technical Level: Semi-technical (uses Slack, Notion, basic automation)
- Current Workaround: She has a browser tab always open, refreshes every 30 minutes, 
  and sets manual calendar reminders for critical deadlines
- Also uses email notifications from other tools but finds them overwhelming

Secondary Persona: Developer Dave
- Technical Level: Technical
- Wants API access to integrate notifications with his workflow tools
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
- Notification categories (Tasks, Deadlines, Mentions, System)

Nice to Have (P2):
- Slack/Teams integration
- Custom notification rules ("notify me when X happens")
- Quiet hours / Do Not Disturb mode
- Notification sound customization
```

**Q5 - Business Context:**
```
This is driven by customer retention concerns. In our last NPS survey, 23% of detractors 
mentioned "missing important updates" as a pain point. Three competitors launched 
notification features in Q4 2025. Our enterprise customers are specifically requesting 
this for their teams. If we don't ship this in Q1 2026, we risk losing 2 enterprise 
renewals worth $180K ARR.
```

### Expected Output

The agent should generate a complete PRD saved to:
```
docs/smart-notification-system-prd-YYYY-MM-DD.md
```

### Verify PRD Contains:
- [ ] Executive Summary
- [ ] Problem Statement with pain points table
- [ ] Target Persona (Sarah)
- [ ] Success Metrics with baseline/target
- [ ] Requirements (P0/P1/P2)
- [ ] User Stories with acceptance criteria
- [ ] Timeline & Milestones
- [ ] Risks & Mitigations

---

## Phase 2: Architect Agent - TDR Mode

### Start Fresh or Continue

```bash
npm run architect
# Or use Mastra Playground
```

### Test Conversation

**Agent asks:** Which mode would you like to use?
```
TDR
```

**Agent asks:** What system are you designing?
```
Smart Notification System - Real-time notification delivery with multi-channel support
```

**Q1 - Architecture Overview:**
```
The system has these components:

1. Frontend (React): 
   - NotificationBell component with WebSocket connection
   - NotificationPreferences settings page
   - Toast/popup for real-time alerts

2. Notification Service (Node.js):
   - REST API for CRUD operations on notifications
   - WebSocket server for real-time delivery
   - Preference management endpoints

3. Message Queue (Redis):
   - Pub/Sub for real-time notifications
   - Queue for batch processing (email digests)

4. Database (PostgreSQL):
   - notifications table
   - notification_preferences table
   - notification_templates table

5. External Services:
   - SendGrid for email delivery
   - Firebase Cloud Messaging for push notifications

Data flows: User action → Event emitted → Notification Service creates notification → 
Stored in DB → Published to Redis → WebSocket pushes to connected clients
```

**Q2 - Security Deep Dive:**
```
Authentication: JWT tokens with 1-hour expiry, refresh tokens stored in httpOnly cookies

Authorization: 
- Users can only see their own notifications
- Admins can send system-wide notifications
- API uses scope-based access (read:notifications, write:notifications)

Trust boundaries:
- Frontend is untrusted - all input validated server-side
- WebSocket connections require valid JWT
- Rate limiting: 100 requests/minute per user

If JWT is stolen:
- Short expiry limits damage window
- Refresh token rotation on use
- WebSocket sessions tied to JWT, expire with it
- User can revoke all sessions from settings
```

**Q3 - Data & Scalability:**
```
Main tables:

notifications:
- id (UUID), user_id (UUID), type (enum), title, body, 
- read_at (timestamp), created_at, metadata (JSONB)
- Indexes: user_id, created_at DESC, (user_id, read_at) for unread count

notification_preferences:
- user_id (UUID), channel (email/push/in_app), category, enabled (boolean)
- Composite key: (user_id, channel, category)

At 10M notifications:
- Partitioning by created_at (monthly partitions)
- Archive old notifications (>90 days) to cold storage
- Unread count cached in Redis, invalidated on read/new

Indexing: 
- Partial index on read_at IS NULL for fast unread queries
- BRIN index on created_at for time-range queries
```

**Q4 - Failure Modes:**
```
Database goes down:
- Read from Redis cache for recent notifications
- Queue new notifications in Redis, replay when DB recovers
- Show "Some notifications may be delayed" banner

WebSocket disconnects:
- Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s)
- On reconnect, fetch missed notifications since last received
- Heartbeat every 30s to detect zombie connections

SendGrid/FCM outage:
- Queue failed deliveries in Redis with retry count
- Retry with exponential backoff (5m, 15m, 1h, 4h)
- Alert ops team after 3 failures
- Gracefully degrade: show in-app even if email fails

Traffic spike (10x):
- Redis pub/sub handles burst
- Database write pooling with queue
- Shed load: delay non-critical notifications (P2)
- Auto-scale WebSocket servers (k8s HPA)
```

**Q5 - Implementation Path:**
```
Guardrails for devs:

1. Input validation:
   - All endpoints use Zod schemas
   - Notification body max 500 chars, title max 100
   - Enum validation for notification types

2. Database safety:
   - All queries through TypeORM (parameterized)
   - Row-level security for multi-tenant safety
   - Soft deletes with deleted_at column

3. Rate limiting:
   - Redis-based sliding window
   - Per-user and per-endpoint limits
   - Decorator: @RateLimit(100, '1m')

4. WebSocket auth:
   - Token validated on connection
   - Re-validated every 5 minutes
   - Middleware rejects expired tokens

5. Code review checklist:
   - No raw SQL
   - All new fields have validation
   - Error handling for external services
   - Logging without PII
```

### Expected Output

The agent should generate a complete TDR saved to:
```
docs/smart-notification-system-tdr-YYYY-MM-DD.md
```

### Verify TDR Contains:
- [ ] Architecture diagram (Mermaid)
- [ ] Component descriptions table
- [ ] Security implementation with code examples
- [ ] Database schema (SQL)
- [ ] Rate limiting code
- [ ] Circuit breaker implementation
- [ ] Common pitfalls with before/after code
- [ ] Testing strategy

---

## Phase 3: Frontend Architect Agent

For frontend-heavy applications, use the specialized Frontend Architect Agent.

### Start the Frontend Architect

```bash
npm run dev
# Open http://localhost:4111 → Agents → Frontend Architect Agent
```

### Test Conversation

**Agent asks:** Tell me about the frontend you're building.

**Q1 - Application Overview:**
```
We're building a notification dashboard for our Smart Notification System. 
It's primarily a dashboard app with real-time updates. Expected 5,000 daily active users,
with medium interaction complexity - users will be viewing, filtering, and managing 
notifications. Some light admin functionality for notification preferences.
```

**Q2 - Component Architecture:**
```
We're planning to use a shared component library for the entire company. The main hierarchy:

- App Shell (Header, Sidebar, Main Content)
- Dashboard Page (NotificationList, FilterBar, MetricsCards)
- Settings Page (PreferencesForm, ChannelToggles)
- Shared Components (Button, Card, Modal, Toast)

We'll have about 30 reusable components. Using compound component pattern for 
complex UI like dropdowns and modals.
```

**Q3 - Data Fetching & State:**
```
We're using React Query for server state management:
- Notifications list with infinite scroll
- User preferences (cached for 5 minutes)
- Real-time updates via WebSocket for new notifications

For UI state:
- Zustand for global UI state (sidebar collapsed, theme)
- useState for local component state (modal open, form inputs)

We need optimistic updates when marking notifications as read.
```

**Q4 - Performance Strategy:**
```
Performance targets:
- LCP < 2s (hero is the notification list)
- CLS < 0.1 (fixed height notification cards)
- FID < 100ms

We'll lazy load the settings page and admin features.
Using next/image for user avatars.
Virtualized list for notifications (react-window).
```

**Q5 - Testing & Quality:**
```
Testing strategy:
- Unit tests with Vitest for utilities and hooks
- Component tests with React Testing Library
- E2E with Playwright for critical flows (login, view notifications, mark as read)
- Accessibility: jest-axe in component tests, manual audits with axe DevTools

We want 80% component test coverage for the shared library.
```

### Expected Output

The agent should generate a Frontend TDR saved to:
```
docs/smart-notification-system-frontend-tdr-YYYY-MM-DD.md
```

### Verify Frontend TDR Contains:
- [ ] Technology stack table with rationale
- [ ] Project structure (App Router format)
- [ ] Component hierarchy diagram (Mermaid)
- [ ] Server vs Client component patterns with code examples
- [ ] State management architecture (Zustand + React Query)
- [ ] **Vercel Best Practices Checklist** (45 rules across 8 priorities)
- [ ] Common pitfalls with Vercel rule references (e.g., `→ async-parallel`)
- [ ] Accessibility implementation (focus management, forms)
- [ ] Testing strategy with code examples

---

## Phase 4: Story Builder Agent

### Start the Story Builder

```bash
npm run dev
# Open http://localhost:4111 → Agents → Story Builder Agent
```

### Test Conversation

**Agent:** (Should list available documents automatically)

**Q1 - Document Selection:**
```
Use the PRD file: smart-notification-system-prd-YYYY-MM-DD.md
```
(Replace YYYY-MM-DD with actual date)

**Q2 - Team Context:**
```
- Sprint duration: 2 weeks
- Average velocity: 24 story points per sprint
- Team size: 4 engineers (2 backend, 1 frontend, 1 full-stack)
```

**Q3 - Priority & Scope:**
```
Focus on P0 (MVP) only for now. We want to ship the in-app notification 
bell and real-time popups first. Email and push can wait for phase 2.
```

**Q4 - Technical Constraints:**
```
- Must integrate with existing React app (using React Query for state)
- Backend is Node.js with Express, PostgreSQL
- Already have Redis for caching
- Need to work with existing user authentication (JWT)
- Mobile app is React Native, but push notifications are P1
```

**Q5 - Definition of Done:**
```
Use standard, but add:
- Performance test completed (< 100ms notification delivery)
- Accessibility audit passed (WCAG 2.1 AA)
- Feature flag configured
```

### Expected Output

The agent should generate stories saved to:
```
docs/stories/smart-notification-system-stories-YYYY-MM-DD.md
```

### Verify Stories Contain:
- [ ] Epics Overview table
- [ ] Sprint Plan with allocation
- [ ] At least 5-8 user stories
- [ ] Each story has:
  - [ ] As a/I want/So that
  - [ ] 3+ Acceptance Criteria (Given/When/Then)
  - [ ] Definition of Done checklist
  - [ ] Happy Path test cases
  - [ ] Edge Cases table
  - [ ] Error Scenarios table
  - [ ] Technical Notes
  - [ ] Story Points
  - [ ] Dependencies

### Test Jira Export

After stories are generated, ask:
```
Please export these stories to Jira CSV format with project key NOTIFY
```

Expected output:
```
docs/exports/notify-stories-jira-YYYY-MM-DD.csv
```

---

## Phase 5: Test Additional Tools

### Test Tech Stack Analyzer

In the Architect Agent (TDR mode), ask:
```
Can you analyze our tech stack? We're using:
- React 18
- Node.js 20
- PostgreSQL 15
- Redis 7
- TypeScript 5

This is a growth-stage startup API with a medium-sized team.
```

The agent should use `analyzeStackTool` and provide:
- [ ] Strengths of each technology
- [ ] Concerns to watch out for
- [ ] Best practices per technology
- [ ] Common pitfalls with solutions
- [ ] Learning resources

### Test Export to Confluence

After generating a TDR, ask:
```
Can you export this TDR to Confluence wiki markup?
```

Expected output:
```
docs/exports/smart-notification-system-confluence-YYYY-MM-DD.txt
```

### Test Export to HTML

```
Can you export this TDR to HTML format?
```

Expected output:
```
docs/exports/smart-notification-system-html-YYYY-MM-DD.html
```

---

## ✅ Complete Test Checklist

### Architect Agent - PRD Mode
- [ ] Mode selection works
- [ ] 5 questions asked one at a time
- [ ] PRD generated with all sections
- [ ] File saved to /docs/

### Architect Agent - TDR Mode
- [ ] Mode selection works
- [ ] 5 questions asked with follow-ups
- [ ] TDR contains Mermaid diagram
- [ ] TDR contains code examples
- [ ] Security section with implementation
- [ ] Common pitfalls included
- [ ] File saved to /docs/

### Frontend Architect Agent
- [ ] 5 questions asked about frontend architecture
- [ ] Technology stack table with rationale
- [ ] Component hierarchy diagram (Mermaid)
- [ ] Server vs Client component patterns
- [ ] State management code examples (Zustand, React Query)
- [ ] Performance optimization section
- [ ] Accessibility implementation
- [ ] Testing strategy with code
- [ ] Common pitfalls included
- [ ] File saved to /docs/

### Story Builder Agent
- [ ] Lists available documents
- [ ] Reads PRD/TDR successfully
- [ ] Generates epics breakdown
- [ ] Generates user stories
- [ ] Each story has acceptance criteria
- [ ] Each story has test cases
- [ ] Sprint plan included
- [ ] Stories saved to /docs/stories/
- [ ] Jira export works

### Export Tools
- [ ] analyzeStackTool provides recommendations
- [ ] exportDocumentTool creates HTML
- [ ] exportDocumentTool creates Confluence markup
- [ ] exportToJiraTool creates valid CSV

---

## 🐛 Troubleshooting

### Agent doesn't respond
```bash
# Check if Ollama is running
ollama list

# Check if model is pulled
ollama pull qwen3-coder:480b-cloud

# Check environment variables
cat .env
```

### WebSocket connection failed (Playground)
```bash
# Restart the dev server
npm run dev
```

### File not saving
```bash
# Check /docs directory exists
ls -la docs/

# Check permissions
chmod 755 docs/
```

### Jira CSV encoding issues
The CSV is UTF-8 encoded. Import to Jira with UTF-8 selected.

---

*Test Scenario v1.1 - Generated for Document Architect (includes Frontend Architect Agent)*
