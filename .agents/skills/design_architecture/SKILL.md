---
name: design_architecture
description: Use this skill when an approved spec needs to be converted into a complete project architecture — folder structure, naming conventions, data flow, and code reuse patterns.
---

# Skill: Design Project Architecture

---

## Step 1: Read Everything First

Before designing anything:
- Read `specs/SPEC_[feature].md` fully
- Understand the tech stack provided by the user
- Understand the scale requirements from the spec
- Understand all the data entities and their relationships

Do NOT design anything until this is done.

---

## Step 2: Make Key Architecture Decisions

Answer these before writing the document:

**Structure:**
- How many top-level layers does this project need?
- What is the entry point for frontend? For backend?
- Where do shared types/interfaces live?
- Where does configuration live?

**Separation of Concerns:**
- What is the frontend's job? (Only UI, only state display)
- What is the backend's job? (Business logic, auth, validation)
- What is the data layer's job? (Only DB queries, nothing else)
- What is the service layer's job? (Only business logic)

**Reusability:**
- What will be used across multiple features? (Make it shared)
- What will only be used once? (Keep it local)
- What utility functions will be needed everywhere?
- What types/interfaces will be shared between frontend and backend?

**Consistency:**
- What naming convention for files?
- What naming convention for functions?
- What naming convention for components?
- What naming convention for database tables and columns?

---

## Step 3: Write the Architecture Document

Create file: `specs/ARCHITECTURE_[feature-name].md`

Use this exact structure:

### Project Architecture: [Feature/Project Name]

**Author:** Software Architect Agent  
**Tech Stack:** [List exactly as provided by user]

---

### 1. Architecture Overview
[2-3 paragraphs explaining the overall approach and why]

---

### 2. Project Folder Structure

[Write the full folder tree with a comment explaining what each folder's job is]

Example format:

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── pages/        ← Route-level components only
│   │   ├── components/
│   │   │   ├── ui/       ← Reusable base components (Button, Input)
│   │   │   └── features/ ← Feature-specific components
│   │   ├── services/     ← All API calls live here only
│   │   ├── hooks/        ← Reusable React/custom hooks
│   │   ├── store/        ← Global state management
│   │   ├── types/        ← TypeScript interfaces and types
│   │   └── utils/        ← Pure helper functions
```

[Adapt this to the actual tech stack being used]

---

### 3. Naming Conventions

#### Files
- Components: PascalCase → `UserCard.tsx`
- Hooks: camelCase with `use` prefix → `useUserData.ts`
- Services: camelCase with `Service` suffix → `userService.ts`
- Utils: camelCase → `formatDate.ts`
- Routes: kebab-case → `user-profile.ts`
- DB migrations: numbered + underscore → `001_create_users.sql`

#### Functions & Variables
- Functions: camelCase → `getUserById()`
- React components: PascalCase → `UserProfile`
- Constants: UPPER_SNAKE_CASE → `MAX_RETRY_COUNT`
- Types/Interfaces: PascalCase → `UserProfile`, `ApiResponse`
- Boolean variables: starts with is/has/can → `isLoading`, `hasError`

#### Database
- Tables: plural, snake_case → `users`, `order_items`
- Columns: snake_case → `created_at`, `user_id`, `is_active`
- Indexes: `idx_[table]_[column]` → `idx_users_email`
- Foreign keys: `[referenced_table_singular]_id` → `user_id`

[Adjust naming conventions to the actual tech stack]

---

### 4. Layer Responsibilities

Layer: [Layer Name] (e.g., Controller / Route Handler)  
Job: [One sentence — what this layer does]  
Owns: [What logic lives here]  
Never: [What this layer must never do]  

[Repeat for each layer in the stack]

---

### 5. Data Flow

User Action → [Frontend Component] → [API Service / HTTP call] →  
[Backend Route] → [Controller/Handler] → [Service/Business Logic] →  
[Data Layer/DB Query] → [Database] →  
[Response bubbles back up the same chain] →  
[Frontend State Updated] → [UI Re-renders]

---

### 6. Reusable Modules

| Module | Location | Purpose | Used By |
|--------|----------|---------|--------|
| ApiResponse type | shared/types/ | Standard API response shape | All routes |
| auth middleware | middleware/ | Verify JWT on protected routes | All protected routes |
| logger utility | utils/logger | Consistent logging | All layers |
| validate utility | utils/validate | Input validation wrapper | All controllers |
| ... | ... | ... | ... |

---

### 7. Shared Types / Interfaces

```ts
// Standard API Response (used on both frontend and backend)
interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
  }
}

// Pagination
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

---

### 8. State Management Approach

- What state management tool is being used?
- What goes into global state? (only UI state + auth)
- What goes into server/cache state? (fetched data)
- What stays in local component state? (form fields, toggles)
- Rules for when to use each type

---

### 9. Error Handling Strategy

- How are errors thrown in the data layer?
- How are they caught in the service layer?
- How are they returned from the API?
- How are they displayed in the UI?
- What error codes exist and what do they mean?

---

### 10. Patterns to Use (and Avoid)

#### ✅ Use These Patterns
- [Pattern name]&#58; [Why it fits this project]

#### ❌ Avoid These Patterns
- [Anti-pattern name]&#58; [Why it's wrong for this project]

---

### 11. Architecture Rules for Other Agents

The following rules MUST be followed by all agents:

- All API calls from frontend go through the services layer only
- No business logic in UI components
- No direct database calls outside the data layer
- No cross-layer imports (e.g., frontend importing backend code)
- All new files must go in the folder defined in Section 2
- All naming must follow Section 3 conventions
- [Add project-specific rules here]

---

## Step 4: Request Approval

After writing, say exactly this:

"🏗️ **Architecture is ready:** `specs/ARCHITECTURE_[feature-name].md`

Please review and reply:
- ✅ **APPROVED** — to proceed to UI/UX design
- 📝 **[Your feedback]** — I will revise"

**Do NOT proceed to the next phase until the user says APPROVED.**