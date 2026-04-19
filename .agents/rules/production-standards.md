---
trigger: always_on
---

# Production Standards — Active for ALL Agents at ALL Times

---

## Code Quality

- TypeScript strict mode is ALWAYS on — no exceptions
- No `any` types — use `unknown` and narrow it properly
- All function parameters and return types must be explicitly typed
- Maximum file length: 300 lines — split if longer
- Maximum function length: 50 lines — extract if longer
- No commented-out code in production
- No `console.log` in production — use a logger utility
- All public functions must have a JSDoc/comment explaining purpose
- DRY principle — if you write it twice, make it reusable

---

## Git Standards

- Commit message format: `type(scope): short description`
- Allowed types: `feat` | `fix` | `refactor` | `test` | `docs` | `chore` | `migration`
- Examples:
  - `feat(auth): add Google OAuth login`
  - `fix(api): handle null user in profile endpoint`
  - `migration(users): add email_verified column`
  - `test(cart): add unit tests for price calculation`
- Never commit directly to `main` or `production`
- Every feature on its own branch

---

## Security (Zero Tolerance)

- No secrets, API keys, or passwords in code — ever
- No `.env` files committed — only `.env.example` with empty values
- All passwords hashed — never stored as plain text
- All SQL/DB queries parameterized — never string concatenation
- All user inputs validated server-side before any processing
- JWT or session tokens never stored in localStorage

---

## API Standards

All API responses must follow this exact format:

### Success
```json
{
  "success": true,
  "data": {},
  "message": "Action completed successfully"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_IN_CAPS",
    "message": "Human readable message"
  }
}
```

### Paginated
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Communication Rules (All Agents)

When blocked or unclear — STOP and ask. Never guess.  
Always confirm understanding before starting work.  
Always wait for explicit approval before moving to next phase.  
Report what you did, what files you created/modified, what is next.