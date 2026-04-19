---
description: Start the Full Autonomous Development Pipeline — PM → UI/UX → Engineer → QA → DevOps
---

# Autonomous Development Pipeline

When the user types `/startcycle <idea>`, execute this pipeline strictly.

---

## PIPELINE EXECUTION

---

### PHASE 1 — Product Manager

Act as the **Product Manager** as defined in `agents.md`.  
Execute the `write_specs` skill using `<idea>` as input.  

⚠️ **PAUSE HERE** — Wait for explicit user approval of SPEC.md.  
Do not proceed until user says "APPROVED" or similar confirmation.

---

### PHASE 2 — Software Architect

Act as the **Software Architect** as defined in `agents.md`.  
Execute the `design_architecture` skill using approved SPEC.md.  

⚠️ **PAUSE HERE** — Wait for explicit user approval of ARCHITECTURE.md.  
Do not proceed until user says "APPROVED".

---

### PHASE 3 — UI/UX Designer

Act as the **UI/UX Designer** as defined in `agents.md`.  
Execute the `design_ui` skill using approved SPEC.md + ARCHITECTURE.md.  

⚠️ **PAUSE HERE** — Wait for explicit user approval of UI_BLUEPRINT.md.  
Do not proceed until user says "APPROVED".

---

### PHASE 4 — Full-Stack Engineer

Act as the **Full-Stack Engineer** as defined in `agents.md`.  
Execute the `generate_code` skill using approved SPEC.md + UI_BLUEPRINT.md.  

First present `specs/IMPLEMENTATION_PLAN_[feature].md` for review.  

⚠️ **PAUSE HERE** — Wait for user to confirm the implementation plan.  

Then proceed to write all code.  
Notify when complete.

---

### PHASE 5 — QA Engineer

Act as the **QA Engineer** as defined in `agents.md`.  
Execute the `audit_code` skill on all code produced in Phase 4.  

Produce complete `reports/QA_REPORT_[date].md`.  

⚠️ **PAUSE HERE** — Show QA Report to user.  

- If 🔴 Critical bugs found → loop back to Phase 4 for fixes  
- If ✅ Approved → proceed  

---

### PHASE 6 — DevOps Master

Act as the **DevOps Master** as defined in `agents.md`.  
Execute the `deploy` skill.  

Read `reports/QA_REPORT_[date].md` first — only proceed if zero 🔴 Critical bugs.  

Complete `reports/DEPLOY_LOG_[date].md` after successful deployment.

---

## PIPELINE COMPLETE

Output final summary:

- ✅ Feature: [Feature Name]  
- 📋 Spec: `specs/SPEC_[feature].md`  
- 🏗️ Architecture: `specs/ARCHITECTURE_[feature].md`  
- 🎨 UI Blueprint: `specs/UI_BLUEPRINT_[feature].md`  
- 💻 Implementation Plan: `specs/IMPLEMENTATION_PLAN_[feature].md`  
- 🧪 QA Report: `reports/QA_REPORT_[date].md`  
- 🚀 Deploy Log: `reports/DEPLOY_LOG_[date].md`  

**Status:** 🟢 LIVE in Production