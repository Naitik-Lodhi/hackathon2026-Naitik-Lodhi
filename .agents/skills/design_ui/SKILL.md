---
name: design_ui
description: Use this skill when an approved spec and architecture document are ready and UI/UX design needs to be created.
---

# Skill: Design UI/UX Blueprint

---

## Step 1: Read Everything First

Before designing anything:
- Read `specs/SPEC_[feature].md` fully
- Read `specs/ARCHITECTURE_[feature].md` fully — note the component folder structure
- Understand every API endpoint defined in the spec
- Understand every user story

Do NOT design until this is done.

---

## Step 2: Map the Screens

List every screen/page needed for this feature.

For each screen, identify:
- The URL route
- The component name (following ARCHITECTURE.md naming)
- What data it displays
- What actions the user can take
- What API calls it makes

---

## Step 3: Write the UI Blueprint

Create file: `specs/UI_BLUEPRINT_[feature-name].md`

Use this exact structure:

---

### UI Blueprint: [Feature Name]

**Author:** UI/UX Designer Agent

---

### 1. Route & Page Map

| Route | Page Component | Description |
|------|---------------|------------|
| /... | PageName.tsx | What this page does |

---

### 2. Screens

#### Screen: [Page Name]

**Route:** /path  
**Component:** PageName.tsx  
**Purpose:** [One sentence]

---

#### Layout

[Describe the layout clearly — header, sidebar, main content, footer]  
[Use ASCII art if helpful]

---

#### Component Tree

```
PageName
├── FeatureComponent (from features/)
│   ├── BaseComponent (from ui/) [prop: string, prop2: boolean]
│   └── BaseComponent (from ui/) [prop: string]
└── AnotherFeatureComponent
```

---

#### Data & API Calls

| User Action | API Call | Loading State | Success State | Error State |
|------------|---------|--------------|---------------|------------|
| Page loads | GET /api/... | Skeleton shown | Data displayed | Error message |
| Button click | POST /api/... | Button disabled + spinner | Success toast | Error toast |

---

#### All Component States

**[ComponentName]:**

- Default: [describe]
- Loading: [describe — skeleton? spinner? disabled button?]
- Error: [describe — what message? where shown?]
- Empty: [describe — what shows when no data?]
- Hover: [describe]
- Focus: [describe — for accessibility]
- Disabled: [describe when and how]

---

### 3. Forms

#### Form: [Form Name]

| Field | Label | Placeholder | Type | Validation Rule | Error Message |
|------|------|------------|------|----------------|--------------|
| email | Email Address | you@example.com | email | Required, valid email format | Please enter a valid email |
| password | Password | Min 8 characters | password | Required, min 8 chars | Password must be at least 8 characters |

---

#### Submit Button

- Default: Enabled, text: "[Button Label]"
- Loading: Disabled, text: "Loading..." or spinner
- After success: [What happens? Redirect? Toast?]
- After error: Re-enabled, error shown above form

---

### 4. Empty States

For every list or data-display component:

**[ComponentName] — Empty State:**

- When does this appear? [e.g., "when API returns empty array"]
- What to show? [illustration/icon + heading + subtext + optional CTA button]

Example:  
Icon + "No items yet" + "Create your first item" + [Create button]

---

### 5. Error States

#### API Error (e.g., network failure)
- Show: [error message text]
- Show: [retry button? yes/no]

#### Form Validation Error
- Show: [inline below the field]
- Style: [red text, red border on field]

#### Empty / Not Found
- Show: [friendly message]

---

### 6. Loading States

For every data-fetching component:

**[ComponentName] skeleton:**  
[describe the placeholder shape]

---

### 7. Responsive Behavior

| Element | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|--------|-----------------|---------------------|------------------|
| Navigation | Hamburger menu | Hamburger menu | Full top nav |
| [Component] | Stacked, full width | [describe] | [describe] |

---

### 8. Accessibility Requirements

For every interactive element:

| Element | ARIA Label | Keyboard Shortcut | Screen Reader Text |
|--------|-----------|------------------|-------------------|
| [element] | [aria-label value] | Tab / Enter | [what screen reader announces] |

- All images must have alt text  
- All form fields must have associated labels  
- Color contrast ratio minimum 4.5:1 for text  
- Focus indicator must be visible on all interactive elements  
- Error messages must not rely on color alone  

---

## Step 4: Request Approval

After writing, say exactly this:

"🎨 **UI Blueprint is ready:** `specs/UI_BLUEPRINT_[feature-name].md`

Please review and reply:
- ✅ **APPROVED** — to proceed to coding
- 📝 **[Your feedback]** — I will revise"

**Do NOT proceed to the next phase until the user says APPROVED.**