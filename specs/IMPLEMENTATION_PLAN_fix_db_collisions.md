# Implementation Plan: Fix Database Collisions

## Goal
Resolve duplicate primary key violations in the `tickets` and `audit_logs` tables by ensuring truly random UUID generation at the database level and removing any potential manual ID assignments in the application code.

## Proposed Changes

### Database Layer

#### [MODIFY] [schema.sql](file:///d:/shop-wave-agent/backend/src/db/schema.sql)
- Remove `DEFAULT gen_random_uuid()` from primary key columns to ensure application provides them.

#### [DELETE] [db.ts](file:///d:/shop-wave-agent/backend/src/db/db.ts)
- Remove the `gen_random_uuid` mock as it is unreliable in the current pg-mem environment.

### Backend Layer

#### [MODIFY] [agentEngine.ts](file:///d:/shop-wave-agent/backend/src/agent/agentEngine.ts)
- Generate UUIDs for `ticket_runs` and `audit_logs` before insertion.

#### [MODIFY] [ticketController.ts](file:///d:/shop-wave-agent/backend/src/controllers/ticketController.ts)
- Generate UUIDs for `tickets` during seeding.

## Implementation Order

1. **Update Schema**: Add `pgcrypto` extension to `schema.sql`.
2. **Clean Data**: Execute a cleanup command to wipe existing collided data.
3. **Re-run Migrations**: Re-apply the schema via the existing `runMigrations` path.
4. **Verify**: Trigger `/api/tickets/seed` and check results.
