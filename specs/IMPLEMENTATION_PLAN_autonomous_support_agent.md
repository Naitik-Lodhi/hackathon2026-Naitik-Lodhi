### Implementation Plan: Autonomous Support Resolution Agent

**Status:** Draft
**Author:** Full-Stack Engineer Agent

---

### Files to Create

| File Path | Purpose |
|----------|--------|
| `backend/package.json` | Dependencies for Express + PG + TS backend |
| `backend/tsconfig.json` | strict TS configuration for backend |
| `backend/src/index.ts` | Express server entry point |
| `backend/src/types/index.ts` | Shared models (Ticket, AuditLog, ApiResponse) |
| `backend/src/db/db.ts` | PostgreSQL connection pool and wrapper utility |
| `backend/src/db/schema.sql` | Drop/Create tables for tickets, audit_logs, customers, orders |
| `backend/src/tools/mockTools.ts` | Simulated functions (get_customer, issue_refund, etc.) with random failures |
| `backend/src/services/ticketService.ts` | Business logic for queuing, concurrent ticket processing, db interaction |
| `backend/src/controllers/ticketController.ts` | Express handlers formatting JSON payload responses |
| `backend/src/routes/ticketRoutes.ts` | REST definitions mapped to controllers |
| `frontend/index.html` | Vite entry point |
| `frontend/package.json` | React + TS dependencies |
| `frontend/vite.config.ts` | Vite build config |
| `frontend/src/main.tsx` | React app mount |
| `frontend/src/App.tsx` | URL routing setup (React Router) |
| `frontend/src/index.css` | Vanilla CSS root styles / theme |
| `frontend/src/api/client.ts` | fetch wrappers for backend requests |
| `frontend/src/hooks/useTickets.ts` | Custom hook for managing ticket fetch and polling |
| `frontend/src/components/ui/BaseSpinner.tsx` | Reusable loading indicator |
| `frontend/src/components/features/tickets/TicketCard.tsx` | Component showing ticket snapshot |
| `frontend/src/components/features/tickets/TicketList.tsx` | Renders a grid/list of TicketCards |
| `frontend/src/components/features/agent/ProcessingStatus.tsx` | Component detailing current active ticket |
| `frontend/src/components/features/audit/AuditTimeline.tsx` | Sequence component rendering audit steps |
| `frontend/src/components/features/audit/AuditStep.tsx` | Individual audit visualization with JsonViewer |
| `frontend/src/pages/Dashboard.tsx` | Home page layout |
| `frontend/src/pages/TicketDetail.tsx` | Deep link page layout |

---

### Files to Modify

| File Path | What Changes |
|----------|-------------|
| N/A | Total virgin scaffolding |

---

### Implementation Order

1. **Database Layer:** Write the TS Postgres handler (`db.ts`) and create `schema.sql` to initialize `tickets`, `audit_logs`, `ticket_runs`, and mock entities `customers`, `orders`, `products`.
2. **Backend Config:** Create package.json, install express, pg, typescript. Write `tsconfig.json`.
3. **Backend Types & Mocks:** Create `types/index.ts` and `tools/mockTools.ts`. Implement the 8 mock functions.
4. **Backend Services:** Build `ticketService.ts` including the `processAllTickets` method which simulates concurrent processing of tickets (Promise.all) with audit logging.
5. **Backend Controllers and Routes:** Expose `GET /tickets`, `GET /tickets/:id`, `GET /tickets/:id/audit`, and `POST /tickets/seed`.
6. **Backend Server Config:** Assemble `index.ts` and ensure it runs natively.
7. **Frontend Config:** Setup Vite React app via vanilla scripts (vanilla CSS).
8. **Frontend Hooks/API:** Create `api/client.ts` and fetchers.
9. **Frontend Shared Components:** Build Spinners and Layout wrappers.
10. **Frontend Features:** Build the Dashboard (Ticket List, Processing UI) and TicketDetail (Audit Timeline) components.
11. **Final Wiring:** Ensure routing (`react-router-dom`) functions and the full cycle can be viewed inside browser testing.
