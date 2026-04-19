---
name: deploy
description: Use this skill after QA approval to safely deploy the application to production with zero downtime.
---

# Skill: Deploy to Production

---

## Step 1: Read QA Report First — MANDATORY

Read `reports/QA_REPORT_[latest].md`.

If ANY 🔴 Critical bugs exist:

STOP IMMEDIATELY. Output:

"🚨 DEPLOY BLOCKED  
Reason: QA Report contains [X] critical bug(s).  
Bugs: [list them]  
Action: Return to QA after Engineer fixes these."

Do NOT proceed under any circumstances.

---

## Step 2: Pre-Deploy Checklist

Before touching any server:

- [ ] QA Report confirms zero 🔴 critical bugs
- [ ] All environment variables confirmed present
- [ ] Database backup command ready
- [ ] Rollback plan written down (see Step 3)
- [ ] Health check endpoint exists in the application
- [ ] Team notified of upcoming deployment

---

## Step 3: Write Rollback Plan BEFORE Deploying

Document this BEFORE starting the deploy:

### Rollback Plan

- Previous Version: [git commit hash or tag]
- Code Rollback Command: [exact command to revert code]
- DB Rollback: [SQL commands to undo migration if needed]
- Expected Rollback Time: [X minutes]
- Rollback Decision Trigger: [e.g., "if error rate > 1% in 5 min"]

If you cannot write a clear rollback plan — DO NOT DEPLOY.

---

## Step 4: Deploy Sequence

Execute in this exact order — never skip or reorder:

### 4A: Database First
```bash
# 1. Backup the database
[backup command appropriate for the DB being used]

# Confirm backup exists before continuing

# 2. Apply new migrations
[migration command appropriate for the DB/ORM being used]

# Confirm migration succeeded before continuing
```

### 4B: Build the Application
```bash
# Install dependencies
[install command — use lockfile, not loose install]

# Run tests one final time
[test command]

# If any test fails — STOP. Do not deploy.

# Build for production
[build command appropriate for the tech stack]

# Confirm build succeeded before continuing
```

### 4C: Deploy
```bash
# Deploy using zero-downtime method appropriate for the tech stack
# (e.g., PM2 cluster reload, rolling deploy, blue-green, etc.)
[deploy command]
```

### 4D: Run Smoke Tests Immediately
```bash
# Test 1: Application is reachable
[health check request]

# Test 2: API is responding
[API health check request]

# Test 3: Database is connected
[DB health check request]

# Test 4: The specific feature just deployed works
[feature-specific smoke test]
```

If any smoke test fails → Execute rollback plan immediately.

### 4E: Monitor for 10 Minutes

- Watch application logs for errors  
- Watch error rate (should be same as before deploy)  
- Watch response times (should be same as before deploy)  

If anything anomalous → Execute rollback plan

---

## Step 5: Write Deploy Log

Create file: `reports/DEPLOY_LOG_[YYYY-MM-DD-HH-MM].md`

### Deploy Log

**Timestamp:** [ISO timestamp]  
**Feature Deployed:** [Feature name]  
**Git Commit:** [hash]  
**Deployed By:** DevOps Agent  

---

## Pre-Deploy Checks

- [x] QA Report approved — zero critical bugs  
- [x] Database backup created  
- [x] Rollback plan documented  
- [x] Environment variables confirmed  

---

## Changes Deployed

### Database
- Migrations applied: [list]
- Tables modified: [list]

### Backend
- New files: [list]
- Modified files: [list]
- New routes: [list]

### Frontend
- New pages: [list]
- New components: [list]
- Build size: [size]

---

## Smoke Test Results

| Test | Result |
|------|--------|
| App reachable | ✅ PASS / ❌ FAIL |
| API health | ✅ PASS / ❌ FAIL |
| DB connected | ✅ PASS / ❌ FAIL |
| Feature works | ✅ PASS / ❌ FAIL |

---

## Rollback Plan

**Code:** [exact rollback command]  
**Database:** [exact rollback SQL if migration was applied]  
**Time to rollback:** ~[X] minutes  

---

## Final Status

✅ DEPLOYED SUCCESSFULLY — [timestamp]  
OR  
🔴 ROLLED BACK — Reason: [reason] — [timestamp]  

---

## Step 6: Communicate Result

"🚀 Deployment Complete  
Deploy Log: reports/DEPLOY_LOG_[timestamp].md  
Status: ✅ LIVE  

All smoke tests passed. Monitoring for 10 minutes..."

[After 10 minutes:]

"✅ Deployment Stable  
No errors detected in monitoring window. Feature is live and healthy."

---

## 📄 FILE 9 — `.agents/workflows/startcycle.md`

```markdown
---
description: Starts the full autonomous development pipeline. Type /startcycle followed by your feature idea and tech stack.
---

# Full Autonomous Development Pipeline

**Trigger:** `/startcycle [feature idea] — Tech Stack: [your stack]`

Execute each phase strictly in order.  
Never skip a phase.  
Never proceed without explicit user approval.

---

## PHASE 1 — Product Manager → Write Specification

**Agent:** Product Manager  
**Skill:** `write_specs`  

**Input:** User's feature idea  
**Output:** `specs/SPEC_[feature].md`  

**Process:**
1. Ask clarifying questions if needed
2. Write the full spec following the skill instructions
3. Present spec to user

**STOP — Wait for user to say APPROVED**

---

## PHASE 2 — Software Architect → Design Architecture

**Agent:** Software Architect  
**Skill:** `design_architecture`  

**Input:** Approved `specs/SPEC_[feature].md` + Tech Stack  
**Output:** `specs/ARCHITECTURE_[feature].md`  

**Process:**
1. Read the approved spec fully
2. Design complete architecture
3. Define folder structure
4. Define naming conventions and layer rules
5. Define reusable modules and shared types
6. Present architecture to user

**STOP — Wait for user to say APPROVED**

---

## PHASE 3 — UI/UX Designer → Design Interface

**Agent:** UI/UX Designer  
**Skill:** `design_ui`  

**Input:** Approved SPEC + ARCHITECTURE  
**Output:** `specs/UI_BLUEPRINT_[feature].md`  

**Process:**
1. Read both approved documents fully
2. Design every screen
3. Define all states, forms, empty states, error states
4. Map every user action to API calls
5. Present blueprint to user

**STOP — Wait for user to say APPROVED**

---

## PHASE 4 — Full-Stack Engineer → Write Code

**Agent:** Full-Stack Engineer  
**Skill:** `generate_code`  

**Input:** All three approved documents  
**Output:** Code + `IMPLEMENTATION_PLAN`  

**Process:**
1. Read all documents
2. Write implementation plan
3. Present plan to user

**STOP — Wait for approval**

4. Implement code
5. Announce completion

---

## PHASE 5 — QA Engineer → Audit and Test

**Agent:** QA Engineer  
**Skill:** `audit_code`  

**Process:**
1. Run full audit
2. Write tests
3. Produce QA Report
4. Present report

**Decision:**
- 🔴 Critical bugs → back to Phase 4
- ✅ No bugs → ready for deploy

**STOP — Wait for approval**

---

## PHASE 6 — DevOps Master → Deploy

**Agent:** DevOps Master  
**Skill:** `deploy`  

**Process:**
1. Re-check QA
2. Deploy
3. Test
4. Monitor
5. Log

---

## PIPELINE COMPLETE

```
╔══════════════════════════════════════════╗
║ PIPELINE COMPLETE ✅                     ║
╠══════════════════════════════════════════╣
║ Feature: [name]                          ║
║ Deployed: [timestamp]                    ║
╠══════════════════════════════════════════╣
║ DOCUMENTS CREATED:                       ║
║ 📋 specs/SPEC_[feature].md               ║
║ 🏗️ specs/ARCHITECTURE_[feature].md      ║
║ 🎨 specs/UI_BLUEPRINT_[feature].md       ║
║ 💻 specs/IMPLEMENTATION_PLAN_[feature].md║
║ 🧪 reports/QA_REPORT_[date].md           ║
║ 🚀 reports/DEPLOY_LOG_[date].md          ║
╠══════════════════════════════════════════╣
║ STATUS: 🟢 LIVE IN PRODUCTION            ║
╚══════════════════════════════════════════╝
```