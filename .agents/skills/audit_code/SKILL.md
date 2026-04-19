---
name: audit_code
description: Use this skill after code implementation is complete to perform a full audit, write tests, and produce a QA report.
---

# Skill: Audit Code and Write Tests

---

## Step 1: Gather Context

Before auditing:
- Read `specs/SPEC_[feature].md` — the requirements
- Read `specs/ARCHITECTURE_[feature].md` — the rules
- Read `specs/UI_BLUEPRINT_[feature].md` — the expected UI behavior
- Get the list of all files created/modified from the Engineer

---

## Step 2: Spec Compliance Audit

Go through SPEC.md line by line:

- [ ] Every API endpoint implemented with correct method and route?
- [ ] Every functional requirement (FR-001, FR-002...) coded?
- [ ] Every acceptance criterion met?
- [ ] API response format matches standard (success/error/paginated)?
- [ ] Database entities match the spec?

Mark each: ✅ Pass / ❌ Fail (with file + line number if fail)

---

## Step 3: Architecture Compliance Audit

Go through ARCHITECTURE.md:

- [ ] All files in correct folders per Section 2?
- [ ] All naming follows conventions per Section 3?
- [ ] All layer rules followed per Section 4?
  (e.g., no business logic in controllers, no DB calls outside data layer)
- [ ] All API calls from frontend go through services layer only?
- [ ] No forbidden patterns from Section 10 used?

Mark each: ✅ Pass / ❌ Fail (with file + line number if fail)

---

## Step 4: Code Quality Audit

For every file:

**TypeScript:**
- [ ] No `any` types?
- [ ] All parameters typed?
- [ ] All return types typed?
- [ ] No type assertions that hide errors?

**Error Handling:**
- [ ] Every async function has try/catch?
- [ ] All errors passed to the global error handler?
- [ ] No silent failures (catch blocks that swallow errors)?
- [ ] Meaningful error messages (not just "Error occurred")?

**Code Smells:**
- [ ] No functions longer than 50 lines?
- [ ] No files longer than 300 lines?
- [ ] No duplicate code that should be abstracted?
- [ ] No magic numbers (use named constants)?
- [ ] No `console.log` in production code?
- [ ] No commented-out code?

---

## Step 5: Security Audit

Run these checks on every relevant file:

- [ ] SQL/DB injection: Parameterized queries only? Zero string concat in queries?
- [ ] Authentication: Auth middleware on every protected route?
- [ ] Authorization: Does it check if user owns the resource?
- [ ] Passwords: Hashed with strong algorithm? Never returned in responses?
- [ ] Sensitive data: Passwords/tokens never in API responses or logs?
- [ ] Input validation: All user inputs validated server-side?
- [ ] Rate limiting: Exists on auth routes?
- [ ] CORS: Configured to allowed origins only (not wildcard in prod)?
- [ ] Secrets: Zero hardcoded API keys, secrets, or passwords?

Mark each: ✅ Pass / ❌ Fail / ⚠️ Warning

---

## Step 6: UI Compliance Audit

Go through UI_BLUEPRINT.md:

For every component:
- [ ] Loading state implemented and shows correctly?
- [ ] Error state implemented and shows correct message?
- [ ] Empty state implemented and shows correctly?
- [ ] Form validation fires at correct time (on submit? on blur?)?
- [ ] Form error messages match blueprint exactly?
- [ ] Buttons disabled during loading/submitting?
- [ ] Responsive — works on mobile?
- [ ] Accessibility — ARIA labels present on interactive elements?

---

## Step 7: Write Tests

Write tests for every file modified/created.

**Test file naming:**
- Backend: `[filename].test.ts` next to the file
- Frontend: `[ComponentName].test.tsx` next to the component

**For every backend route, test:**
1. Happy path (valid input, authenticated) → 200/201
2. Invalid input → 400 with validation error
3. Unauthenticated request → 401
4. Resource not found → 404
5. Edge cases specific to the feature

**For every frontend component, test:**
1. Renders correctly in default state
2. Shows loading state while fetching
3. Shows data after successful fetch
4. Shows error state when fetch fails
5. Shows empty state when data is empty array
6. Form submits correctly with valid data
7. Form shows errors with invalid data
8. Buttons are disabled during submission

---

## Step 8: Produce QA Report

Create file: `reports/QA_REPORT_[YYYY-MM-DD].md`

Use this exact structure:

### QA Report: [Feature Name]
**Date:** [Date]  
**QA Engineer:** QA Agent

### Summary

| Category | Total Checks | Passed | Failed | Warnings |
|----------|-------------|--------|--------|----------|
| Spec Compliance | X | X | X | X |
| Architecture Compliance | X | X | X | X |
| Code Quality | X | X | X | X |
| Security | X | X | X | X |
| UI Compliance | X | X | X | X |
| TOTAL | X | X | X | X |

---

### 🔴 Critical Bugs — DEPLOY BLOCKED
**If none, write:** "None — no critical bugs found"

BUG-001: path/to/file.ts:45  
Issue: [Clear description]  
Fix: [What needs to be done]

---

### 🟡 Warnings — Fix Before Deploy
**If none, write:** "None"

WARN-001: path/to/file.ts:23  
Issue: [Description]  
Fix: [What needs to be done]

---

### 🟢 Suggestions — Nice to Have
**If none, write:** "None"

SUG-001: [Description and suggested improvement]

---

### Security Audit Results

| Check | Result | Notes |
|------|--------|-------|
| SQL/DB Injection | ✅ PASS / ❌ FAIL | [notes] |
| Auth on Protected Routes | ✅ PASS / ❌ FAIL | [notes] |
| Password Hashing | ✅ PASS / ❌ FAIL | [notes] |
| Sensitive Data in Responses | ✅ PASS / ❌ FAIL | [notes] |
| Input Validation | ✅ PASS / ❌ FAIL | [notes] |
| Rate Limiting | ✅ PASS / ❌ FAIL | [notes] |
| No Hardcoded Secrets | ✅ PASS / ❌ FAIL | [notes] |

---

### Test Coverage

- Unit Tests: [X% coverage]
- Integration Tests: [X routes covered of Y total]
- E2E Tests: [X user flows covered]
- Tests Written: [list test file paths]

---

### Final Verdict

🔴 DEPLOY BLOCKED — Fix [X] critical bugs and re-submit for audit.  
OR  
🟡 CONDITIONALLY APPROVED — No critical bugs. [X] warnings noted.  
OR  
✅ APPROVED — All checks passed. Ready for deployment.

---

## Step 9: Communicate Result

**If DEPLOY BLOCKED:**
"🚨 **DEPLOY BLOCKED**  
QA Report: `reports/QA_REPORT_[date].md`  
[X] critical bugs found. Sending back to Engineer.  
[List the critical bugs briefly]"

**If APPROVED:**
"✅ **QA APPROVED**  
QA Report: `reports/QA_REPORT_[date].md`  
No critical bugs. Ready for DevOps to deploy.  
[Note any warnings the team should know about]"