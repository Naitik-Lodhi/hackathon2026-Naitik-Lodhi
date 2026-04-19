### UI Blueprint: Autonomous Support Resolution Agent (Demo-Ready)

**Author:** UI/UX Designer Agent

---

### 1. Route & Page Map

| Route | Page Component | Description |
|------|---------------|------------|
| / | Dashboard.tsx | Central hub displaying the active processing state, ticket statistics, and a filterable ticket list. |

*Note: Since the user requested "keep everything visible at a glance" and "avoid complex navigation," the Ticket Detail and Audit Timeline will be implemented as a side-panel or expansion within the Dashboard to maintain context, or a secondary view that feels seamless.*

---

### 2. Screens

#### Screen: Dashboard

**Route:** /  
**Component:** Dashboard.tsx  
**Purpose:** Provides a real-time monitor of the agent's activity and a detailed audit trail for every support ticket.

---

#### Layout

```
+-------------------------------------------------------------+
| [LOGO] Support Agent Dashboard [Trigger Agent] [Seed Data]  |
+-------------------------------------------------------------+
|                                                             |
|  Status: [ Currently Processing: #ID / Status: IDLE ]       | <- Orange Highlight
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|  TICKET QUEUE (Left 40%)          AUDIT TRAIL (Right 60%)   |
|  +------------------------+      +-----------------------+  |
|  | [#123] [Status: Green] |      | Selected Ticket: #123 |  |
|  | Snippet text...        |      | Content: "Where is..."|  |
|  +------------------------+      |                       |  |
|  | [#124] [Status: Orng ] |      | Audit Steps:          |  |
|  | Snippet text...        |      | [ LLM Analysis ]      |  |
|  +------------------------+      | [ Tool: get_cust ]    |  |
|                                  +-----------------------+  |
+-------------------------------------------------------------+
```

---

#### Component Tree

```
App
└── Dashboard
    ├── DashboardHeader
    │   ├── Button [variant: orange, label: "Seed Data"]
    │   └── Button [variant: orange-outline, label: "Trigger Processing"]
    ├── ProcessingStatus [state: idle | processing, ticketId: string]
    └── MainContent (Flex Container)
        ├── TicketList (Scrollable)
        │   └── TicketCard [status: queued | processing | resolved | escalated]
        └── TicketDetailPanel (Fills when a ticket is selected)
            ├── TicketSummary
            └── AuditTimeline
                └── AuditStep [type: analysis | tool | decision]
                    └── JsonDisplay (formatted code block)
```

---

#### Data & API Calls

| User Action | API Call | Loading State | Success State | Error State |
|------------|---------|--------------|---------------|------------|
| Page loads | GET /api | Spinner on List | Data displayed | Error toast |
| 3s intervals | GET /api & GET /api/current | Subtle refresh | UI updates state | N/A (silent fail) |
| Click "Seed" | POST /api/seed | Button disabled | Toast "Seeded 20" | Error toast |
| Click "Start"| POST /api/trigger | Button disabled | Toast "Processing" | Error toast (409) |
| Select Ticket| GET /api/:id/audit | Skeleton in Panel| Timeline renders | Detail error msg |

---

#### All Component States

**ProcessingStatus:**
- **Idle**: Background color: `off-white`, Text: "Agent Status: Idle", Icon: 💤.
- **Processing**: Background color: `#fff7ed` (light orange), Border: `2px solid #f97316`, Text: "Currently Processing: #123", Icon: Spinning Gear ⚙️.

**TicketCard:**
- **queued**: Badge Gray (#94a3b8)
- **processing**: Badge Orange (#f97316)
- **resolved**: Badge Green (#22c55e)
- **escalated**: Badge Red (#ef4444)

**AuditStep:**
- **Analysis**: Header uses `Purple` or `Blue` icon. Displays reasoning text prominently.
- **Tool**: Header shows function name (`get_customer`, etc.). Displays Input/Output in monospace.
- **Final Decision**: Card has bold border and status specific icon (Check/Warning).

---

### 3. Forms (Minimal Actions)

#### Action: Seed Data
- Field: `count` (Optional, default 20)
- Validation: Number > 0.

---

### 4. Empty States

**TicketList — Empty:**
- Show: "No tickets found. Seed mock data to begin demonstration."

**AuditTimeline — Empty:**
- Show: "Select a ticket to view the autonomous reasoning chain."

---

### 5. Loading State

**List Skeleton:**
- Rectangular blocks with pulsing light-gray background to simulate ticket cards.

---

### 6. Responsive Behavior

| Element | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|--------|-----------------|---------------------|------------------|
| MainContent | Stacked: List then Detail (scroll) | Side-by-side (hidden panel toggle) | Fixed side-by-side (60/40) |
| ProcessingStatus| Full width, reduced padding | Standard | Standard |

---

### 7. Accessibility Requirements

- Color contrast for orange text against white background (min 4.5:1).
- Use `nav` and `main` semantic tags.
- Status badges use text labels for screen readers.
