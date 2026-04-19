---
name: generate_code
description: Use this skill when all three documents (SPEC, ARCHITECTURE, UI_BLUEPRINT) are approved and coding needs to begin.
---

# Skill: Generate Production Code

---

## Step 1: Read All Three Documents

Before writing a single line of code:
- Read `specs/SPEC_[feature].md` — know every requirement
- Read `specs/ARCHITECTURE_[feature].md` — know the folder structure and rules
- Read `specs/UI_BLUEPRINT_[feature].md` — know every state and interaction

If anything is unclear — STOP and ask. Never assume.

---

## Step 2: Present an Implementation Plan

Create `specs/IMPLEMENTATION_PLAN_[feature].md` with:

### Implementation Plan: [Feature Name]

---

### Files to Create

| File Path | Purpose |
|----------|--------|
| [exact path from ARCHITECTURE.md] | [what it does] |

---

### Files to Modify

| File Path | What Changes |
|----------|-------------|
| [existing file] | [what will be added/changed] |

---

### Implementation Order

1. [Step 1 — e.g., Database migration/schema]  
2. [Step 2 — e.g., Backend types and interfaces]  
3. [Step 3 — e.g., Data layer / DB queries]  
4. [Step 4 — e.g., Service layer / business logic]  
5. [Step 5 — e.g., API routes / controllers]  
6. [Step 6 — e.g., Frontend types]  
7. [Step 7 — e.g., API service functions]  
8. [Step 8 — e.g., Base UI components]  
9. [Step 9 — e.g., Feature components]  
10. [Step 10 — e.g., Pages]  
11. [Step 11 — e.g., Unit tests]  

---

Show this plan to the user and wait for confirmation before coding.

---

## Step 3: Implement in Order

Follow the implementation order from the plan exactly.

### For every file you create:

#### Architecture Check
- Is this file in the correct folder per ARCHITECTURE.md? ✓
- Does it follow the naming convention per ARCHITECTURE.md? ✓
- Does it follow the layer rules? (e.g., no business logic in controllers) ✓

#### Code Quality Check
- No `any` types
- All functions have explicit return types
- All async functions have try/catch
- All user inputs validated before processing
- No hardcoded values (use environment variables or constants)
- JSDoc comment on every public function

#### Feature Check
- Does this implement the requirement from SPEC.md?
- Does this match the design from UI_BLUEPRINT.md?
- Are ALL states handled? (loading, error, empty, success)

---

## Step 4: Self-Review Before Handoff

Go through every requirement in SPEC.md:

- [ ] Every API endpoint implemented?
- [ ] Every functional requirement coded?
- [ ] Every acceptance criterion met?

Go through every component in UI_BLUEPRINT.md:

- [ ] Loading state implemented?
- [ ] Error state implemented?
- [ ] Empty state implemented?
- [ ] Form validation implemented?
- [ ] Form error messages match blueprint?
- [ ] Buttons disabled during loading/submitting?
- [ ] Mobile responsive?

---

### Security Self-Check

- [ ] No `any` types anywhere?
- [ ] All async functions have try/catch?
- [ ] All inputs validated?
- [ ] No secrets hardcoded?
- [ ] Passwords hashed if applicable?
- [ ] Auth checks on protected routes?
- [ ] DB queries parameterized?

---

## Step 5: Handoff to QA

When done, say exactly this:

"💻 **Code implementation complete.**

Files created:
- [list every new file with its path]

Files modified:
- [list every modified file]

Handing off to QA for audit."