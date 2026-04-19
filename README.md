# ShopWave Autonomous Support Resolution Agent

An autonomous support agent for the Hackathon 2026 ShopWave challenge. The system ingests the 20 provided support tickets, classifies each issue, executes deterministic support tools, writes an audit trail for every decision, and resolves or escalates tickets with policy-backed reasoning.

## Tech Stack

- Backend: Node.js, TypeScript, Express, PostgreSQL
- Frontend: React, TypeScript, Vite
- AI: Optional Gemini or OpenRouter LLM analysis with deterministic rule fallback
- Data source: default files in `data/`, uploaded JSON, or `/api/import`

## LLM Integration (Optional and Pluggable)

The system is designed to operate in two modes:

---

### 1. Deterministic Mode (Default)

The agent works fully without any LLM.

- Uses rule-based classification and entity extraction  
- Executes tool chains using structured data from the database  
- Applies knowledge-base driven policies for decisions  
- Ensures consistent and reproducible results  

This guarantees reliability even when AI services are unavailable.

---

### 2. LLM-Enhanced Mode (Optional)

If an API key is provided, the system enhances reasoning using an LLM.

#### Supported Providers

- Gemini (Google)  
- OpenRouter (multi-model support)  

---

### Enable LLM

```env
USE_LLM=true
LLM_PROVIDER=gemini   # or openrouter
GEMINI_API_KEY=your_key
OPENROUTER_API_KEY=your_key
```

---

### Behavior

- If LLM is available → used for classification and reasoning  
- If LLM fails, quota is exceeded, or key is missing → system automatically falls back to deterministic mode  
- No processing is blocked due to LLM failure  

---

### Why This Design

This architecture ensures:

- High reliability (no hard dependency on external AI)  
- Flexibility (plug any provider)  
- Production readiness (graceful degradation)  

---

## Setup

Start PostgreSQL:

```bash
cd backend
docker-compose up
```

Run the backend:

```bash
cd backend
npm install
npm run dev
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Optional environment setup:

```bash
cp .env.example backend/.env
```

Keep real API keys only in `.env`. The repository tracks `.env.example` placeholders only.

## Data Seeding And Demo Run

Seed the default dataset from the provided data folder:

```bash
cd backend
npm run seed
```

Open the admin console and load or upload tickets. Processing starts automatically as soon as tickets are inserted. Export the audit log after the run:

```bash
cd backend
npm run export:audit
```

This writes `audit_log.json` at the repository root.

## API Endpoints

All endpoints are under `/api`.

- `GET /api` - list tickets
- `POST /api/tickets` - create a ticket manually
- `POST /api/seed` - with no body, load the default dataset; with a JSON body, validate and import that dataset
- `POST /api/import` - import external data as `{ "source": "api", "data": { ... } }`
- `POST /api/reset` - clear tickets and audit logs
- `POST /api/trigger` - optional compatibility endpoint; normal processing starts automatically when tickets are created, seeded, or imported
- `GET /api/status` - data source and LLM/fallback status summary
- `GET /api/current` - get the currently processing ticket
- `GET /api/:id` - get one ticket
- `GET /api/:id/audit` - get the audit trail for one ticket

## Agent Flow

1. Load a queued ticket and mark it `processing`.
2. Run optional LLM analysis; fall back to deterministic classification and entity extraction when unavailable or low confidence.
3. Build a tool chain that always calls `get_customer`, `get_order`, and `search_knowledge_base`; call `get_product` whenever a product can be identified.
4. Validate every tool output before using it. Malformed or missing data lowers confidence and routes the agent to a fallback response or escalation.
5. Execute the right flow:
   - Refund: check refund eligibility, issue refund only when eligible, or explain denial.
   - Warranty: verify warranty policy and escalate valid claims to a specialist.
   - Cancellation: call `cancel_order` and reply based on order status.
   - Shipping/general/ambiguous: answer from order data or ask targeted clarifying questions.
6. Write every tool call, retry, decision, and final confidence score to `audit_logs`.

Tools read imported customer, order, product, and knowledge-base records from PostgreSQL only. Default files are used only to populate the database. A queue watcher starts on server boot, wakes immediately after ticket creation/import, and keeps a polling safety net for any missed queued ticket.
