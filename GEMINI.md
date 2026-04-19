# Project Rules — Always Active

## Team
This project uses a 6-agent autonomous team defined in `.agents/agents.md`.
Agents: Product Manager, Software Architect, UI/UX Designer,
Full-Stack Engineer, QA Engineer, DevOps Master.

## Non-Negotiables
- TypeScript strict mode always ON — no `any` types ever
- All async functions must have try/catch
- All user inputs validated before DB operations
- Passwords always hashed — never plain text
- Parameterized queries only — never string concatenation in SQL
- No secrets hardcoded — always use environment variables
- No `console.log` in production code
- Standard API response format always:
  Success: { success: true, data: {}, message: "" }
  Error: { success: false, error: { code: "", message: "" } }

## On Ambiguity
STOP and ask. Never assume. Never guess.

## Folder Structure
Do NOT create folders. Wait for Architect agent to define structure.
Follow `.agents/specs/ARCHITECTURE_*.md` once created.