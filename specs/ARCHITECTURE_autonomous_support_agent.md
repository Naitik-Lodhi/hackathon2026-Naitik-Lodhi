### Project Architecture: Autonomous Support Resolution Agent

**Author:** Software Architect Agent  
**Tech Stack:** Node.js, Express, TypeScript, PostgreSQL (Backend) | React (Frontend)

---

### 1. Architecture Overview
The Autonomous Support Agent operates as a decoupled system featuring a React frontend and a Node.js/Express backend running against a PostgreSQL database. The core mechanism is a mock-driven, concurrent pipeline that processes support tickets.

The system is separated into strict layers: The UI solely fetches and displays data via REST endpoints. The backend router maps endpoints to controllers, which offload logic to dedicated services. To fulfill the Day 1 requirements of "explainability and audit trails," the system emphasizes a dedicated tooling layer that simulates real-world constraints (failures/timeouts) to test safety measures and writes every step to an audit log database prior to making state changes.

---

### 2. Project Folder Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── routes/       ← Express route definitions mapping to controllers
│   │   ├── controllers/  ← Request/Response parsing and calling services
│   │   ├── services/     ← Core business logic, concurrency handling
│   │   ├── tools/        ← Mock tool layer (get_customer, etc.) with failure simulation
│   │   ├── db/           ← Database connections, schema drops/migrations, queries
│   │   ├── types/        ← TypeScript definitions and request payloads
│   │   └── index.ts      ← Express app bootstrap
├── frontend/
│   ├── src/
│   │   ├── components/   ← Reusable UI elements (TicketList, AuditTimeline)
│   │   ├── pages/        ← High-level route pages (Dashboard)
│   │   ├── api/          ← All API fetch wrappers
│   │   ├── hooks/        ← Custom React hooks (e.g., useTickets)
│   │   ├── types/        ← Shared types for frontend mirroring DB
│   │   └── App.tsx       ← Main application entry
```

---

### 3. Naming Conventions

#### Files
- Controllers/Routes: `camelCase` → `ticketController.ts`, `ticketRoutes.ts`
- Services/Tools: `camelCase` → `ticketService.ts`, `refundTool.ts`
- React Components: `PascalCase` → `TicketList.tsx`, `AuditLogItem.tsx`
- Type Definitions: `camelCase` with suffix → `types.ts` or `ticketTypes.ts`

#### Functions & Variables
- Functions: `camelCase` → `processTickets()`, `fetchCustomer()`
- React components: `PascalCase` → `Dashboard`
- Constants: `UPPER_SNAKE_CASE` → `MAX_CONCURRENT_TICKETS`
- Boolean variables: `isX`, `hasY`, `canZ` → `isProcessing`, `hasError`

#### Database
- Tables: `plural, snake_case` → `tickets`, `audit_logs`, `ticket_runs`
- Columns: `snake_case` → `ticket_id`, `created_at`
- Foreign keys: `[referenced_table_singular]_id` → `ticket_id`

---

### 4. Layer Responsibilities

Layer: **Routes**
Job: Maps HTTP endpoints to Controller methods.
Owns: URL paths, HTTP methods, mounting middleware.
Never: Holds business logic or directly calls the DB.

Layer: **Controllers**
Job: Extracts data from native request objects and formats responses.
Owns: Request parsing, sending JSON responses with standard ApiResponse shape.
Never: Executes complex business logic or executes mock tools.

Layer: **Services**
Job: Executes the business logic (orchestrating concurrency, calling tools).
Owns: The core execution loop (e.g. running 3 tools per ticket, recording audits).
Never: Handles direct UI concerns or Express formatting.

Layer: **Tools**
Job: Simulates external API actions (customer fetching, refund issuing).
Owns: Mock responses, random failure injection.
Never: Handles top-level ticket resolution logic directly.

Layer: **DB / Data Layer**
Job: Performs native queries to PostgreSQL.
Owns: SQL scripts, connection pooling, seed functions.
Never: Contains business logic.

---

### 5. Data Flow

**Viewing Tickets Formulation:**
User view Dashboard → [Frontend Page] → [API Fetch via useEffect loop or hooks] → 
[Express Route] → [TicketController] → [TicketService: getTickets] → 
[DB query] → [Database] → [Result parsed to JSON] → 
[Frontend State Updated] → [UI Re-renders with TicketList]

**Processing Formulation (Background):**
[Express Route Trigger: POST /seed or process start] → [TicketService processes queue] → 
[Concurrent executions spawned for tickets] → [Agent calls Tools Layer] → 
*Tool Fails safely or succeeds* → [Writes result row to audit_logs] → 
[Final state pushed to tickets table]

---

### 6. Reusable Modules

| Module | Location | Purpose | Used By |
|--------|----------|---------|--------|
| ApiResponse shape | `backend/src/types/` | Standard API response shape | All Controllers |
| db wrapper | `backend/src/db/` | Safe parameterized query executor | All Services & Tools |
| useFetch utility | `frontend/src/hooks/` | Simplified standardized fetching | UI Components |
| Failure Injector | `backend/src/tools/` | Randomly throws errors | All Mock Tools |

---

### 7. Shared Types / Interfaces

```ts
// Standard API Response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// System DB Interfaces
interface Ticket {
  id: string;
  content: string;
  status: 'queued' | 'processing' | 'resolved' | 'escalated';
  priority: number;
}

interface AuditLog {
  id: string;
  ticket_id: string;
  step: number;
  tool_name: string;
  input: string; // JSON String
  output: string; // JSON String
  status: 'success' | 'failure';
  timestamp: string;
}
```

---

### 8. State Management Approach

- **Frontend global state:** Kept explicitly simple for Day 1. There is no Redux or heavy Context.
- **Server/Cache state:** Maintained completely through `fetch` requests polling backend routes inside components or hooks.
- **Local component state:** `useState/useEffect` controls form fields, toggles, mock start, and loading booleans. 

---

### 9. Error Handling Strategy

- **DB Layer Errors:** Logged locally, mapped into 500 API responses.
- **Service Layer Tool Errors:** Handled via `try/catch` inside the service orchestrating the tools. If a tool fails, it writes status `failure` to the `audit_logs` table, triggers the retry/fallback logic, and ultimately escalates if retry fails.
- **API Formats:** Errors are converted to standard `ApiResponse` objects with `success: false`.
- **Frontend Errors:** Caught by `.catch()` chains triggering visual red alerts/toasts inside the mock UI.

---

### 10. Patterns to Use (and Avoid)

#### ✅ Use These Patterns
- **Try/Catch at Controller top-level**: Ensures no uncaught exceptions break Express.
- **Fail-safe Tool Mocks**: Wrap mock function responses in synthetic timeouts using `setTimeout` async wrappers to simulate real latency and failures.

#### ❌ Avoid These Patterns
- **Shared DB connections**: Always use a pooled client to avoid locking during concurrent testing.
- **Blocking loops**: Never use `forEach` with asynchronous mock tool calls; utilize `Promise.all` for real concurrent behaviors.

---

### 11. Architecture Rules for Other Agents

- All API calls from frontend go through the isolated API fetch wrappers only.
- Postgres SQL connections must strictly use parameterized inputs.
- Only the DB layer writes basic SQL statements; no inline SQL in Express routes.
- The Tools layer must be independently callable from unit tests or services.
- The `startcycle` standards require Strict TypeScript (no `any`).
- Follow all explicit `user_global` AI orchestrations rules.
