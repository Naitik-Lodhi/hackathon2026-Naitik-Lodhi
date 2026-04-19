---
name: write_specs
description: Use this skill when a user provides a feature idea that needs to be converted into a detailed technical specification.
---

# Skill: Write Technical Specification

---

## Step 1: Understand Before Writing

Ask the user these questions if not already answered:

- Who is the primary user of this feature?
- What exact problem does this solve?
- What does "done" look like to you?
- What is the expected scale? (10 users? 10,000 users?)
- Are there any technical constraints I should know about?
- Are there existing features this connects to?

Do NOT start writing the spec until you have clear answers.

---

## Step 2: Analyze the Request

Before writing, think through:

- What database tables will this need?
- What API endpoints will this need?
- What can go wrong? (failure modes)
- What are the edge cases?
- What is explicitly OUT of scope?

---

## Step 3: Write the Specification

Create file: `specs/SPEC_[feature-name].md`

Use this exact structure:

---

# Feature Specification: [Feature Name]

**Status:** Draft  
**Author:** Product Manager Agent  

---

### 1. Overview
[2-3 sentence description of what this feature does and why]

---

### 2. Problem Statement
[What user pain does this solve? Why does it matter?]

---

### 3. User Stories

**As a** [user type],  
**I want to** [action],  
**so that** [benefit]

**Given** [context]  
**When** [user does action]  
**Then** [expected result]

[Add one story per main user flow]

---

### 4. API Endpoints

| Method | Route | Auth? | Request Body | Success Response |
|--------|------|-------|--------------|------------------|
| POST | /api/... | Yes/No | `{ field: type }` | `{ data: {...} }` |

---

### 5. Database Entities

**Table:** [table_name]

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| id | uuid | Yes | Primary key |
| ... | ... | ... | ... |
| created_at | timestamp | Yes | Auto-set |
| updated_at | timestamp | Yes | Auto-updated |

[Relationships: e.g., "users.id → posts.user_id (one to many)"]

---

### 6. Functional Requirements

- FR-001: [Requirement]  
- FR-002: [Requirement]  
- FR-003: [Requirement]  
- ...  

---

### 7. Non-Functional Requirements

- **Performance:** [e.g., API must respond within 300ms at p99]  
- **Security:** [e.g., Only authenticated users can access this]  
- **Scalability:** [e.g., Must handle 1,000 concurrent users]  
- **Accessibility:** WCAG 2.1 AA compliance required  

---

### 8. Acceptance Criteria

- [Criteria 1]  
- [Criteria 2]  
- [Criteria 3]  

---

### 9. Out of Scope

[What this feature will NOT do — be explicit]

---

### 10. Open Questions

[Anything still unresolved]

---

## Step 4: Request Approval

After writing, say exactly this:

"📋 **Spec is ready:** `specs/SPEC_[feature-name].md`

Please review and reply:
- ✅ **APPROVED** — to proceed to Architecture design
- 📝 **[Your feedback]** — I will revise"

**Do NOT proceed to the next phase until the user says APPROVED.**