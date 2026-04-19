### Implementation Plan: Autonomous Support Resolution Agent (Day 1 Enhancements)

This plan details the steps to modify the previously built Day 1 backend and frontend foundation to strictly meet the new requirements for:
1. Architectural decomposition (Agent Engine extraction).
2. Advanced concurrency with limits (`Promise.all` with chunking/batching).
3. Resilient retry logic with exponential backoff on tools.
4. Richer audit definitions (`attempt`, `decision`).
5. A dedicated endpoint for viewing the "Current Processing" ticket state via `GET /tickets/current`.

---

### Files to Create

| File Path | Purpose |
|----------|--------|
| backend/src/agent/agentEngine.ts | Hosts the structured logic `processTicket(ticket)` reasoning loop with max `2` retries, and failure routing. |

---

### Files to Modify

| File Path | What Changes |
|----------|-------------|
| backend/src/db/schema.sql | Alter the `audit_logs` table schema to append `attempt INT NOT NULL DEFAULT 1` and `decision TEXT`. |
| backend/src/services/ticketService.ts | Delegate step logic to `agentEngine`. Rebuild `processAllQueuedTickets` into batching loop `processAllTickets(concurrencyLimit=3)`. |
| backend/src/types/index.ts | Include `attempt: number` and `decision?: string` in Backend. |
| backend/src/controllers/ticketController.ts | Inject `getCurrentProcessingTicket()` endpoint function serving `GET /tickets/current` polling. |
| backend/src/routes/ticketRoutes.ts | Route `router.get('/current')`. |
| frontend/src/types/index.ts | Synchronize `AuditLog` definitions. |
| frontend/src/api/client.ts | Incorporate `getCurrentProcessing()` call wrapping the route endpoint. |
| frontend/src/hooks/useTickets.ts | Track `currentTicket` individually on interval loop via proxy. |
| frontend/src/pages/Dashboard.tsx | Relay current fetch state cleanly into UI hooks. |
| frontend/src/components/features/agent/ProcessingStatus.tsx | Accept `currentTicket` directly. |
| frontend/src/components/features/audit/AuditStep.tsx | Expose `attempt` metrics beneath sub-headers. Output text for `decision` logic when appropriate. |

---

### Implementation Order

1. **Database Schema updates** (Schema migration to `schema.sql`).
2. **Backend Type definitions** (`types/index.ts`).
3. **Agent Implementation** (`agent/agentEngine.ts`).
4. **Service Iterations** (`ticketService.ts` concurrency loops).
5. **API adjustments** (`ticketController.ts`, `ticketRoutes.ts`).
6. **Frontend Type synchronization** (`frontend/src/types/index.ts`).
7. **Frontend State APIs** (`api/client.ts`, `useTickets.ts`).
8. **View Components integrations** (`ProcessingStatus.tsx`, `AuditStep.tsx`, `Dashboard.tsx`).
