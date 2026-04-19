# Implementation Plan: Day 2 — Core Agent Execution Layer

## Goal
Transform the system into a deterministic, fully-functional autonomous support resolution agent by implementing classification, entity extraction, a dynamic reasoning chain, rigid decision logic, confidence scoring, and strict concurrency batching.

---

### Files to Create

| File Path | Purpose |
|----------|--------|
| backend/src/agent/nlpMock.ts | Helpers to extract entities and classify tickets using matching algorithms without LLMs. |

---

### Files to Modify

| File Path | What Changes |
|----------|-------------|
| backend/src/agent/agentEngine.ts | Complete rewrite. Execute deterministic plans depending on dummy classification and extract tools, with the strict 6-step loop. Implement accurate confidence variables. |
| backend/src/services/ticketService.ts | Update `processAllTickets` to chunk the active queue elements and route them using `Promise.all` across chunks to explicitly satisfy strict batching requirements. |

---

### Implementation Order

1. **Extraction Helpers Phase**: Implement the deterministic string parsers in the new utility file.
2. **Controller/Service Refactoring Phase**: Overwrite the `ticketService.ts` loop immediately so that no sequential processing occurs and chunks run smoothly.
3. **Core Engine Phase**: Refactor `agentEngine.ts` entirely to execute the exact tool sequence provided (customer -> order -> kb -> conditions). Ensure retries are perfectly mapped.
4. **Validation Phase**: Check the output locally rendering in logs.
