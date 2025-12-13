## Project Overview: Dreadmarch Campaign Manager

- **Description**: A campaign manager app for tabletop RPGs, designed to assist Game Masters (GMs) and players with real-time collaboration, state management, user-configurable datasets, and in-game asset tracking.
- **Primary Users**:
  - Game Masters: Full administrative control and approval workflows.
  - Players: Limited access to campaign data and asset management.
- **Top-Level Goals**:
  1. **Web-Hosted**: Accessible online for real-time GM/player collaboration.
  2. **Key-Based Access Control**: Define user roles for dynamically adjusted permissions.
  3. **Asset Management System**: Provide tools for tracking, buying, and requesting assets tied to the game world.

---

## Milestones Overview

### Completed:
- Initial feature assessment.
- Base state management implemented.

### In Progress:
- **Milestone 1: Web Hosting**:
  - Choose hosting provider.
  - Implement real-time collaboration features (e.g., WebSocket).

### Planned:
- **Milestone 2: Key Access System**:
  - Define roles for players and GMs.
  - Implement permission-based UI hiding/unhiding.
  - Secure role validation (e.g., keys, tokens).
- **Milestone 3: Asset Management System**:
  - Player-facing UI for tracking "owned" assets.
  - Implement point-buy "shop" interface.
  - Add GM approval workflow for custom requests.

---

## Key-Based Access Control

- **Purpose**: Grant users specific permissions to interact with app features.
- **Implementation Plan**:
  - Generate unique keys tied to sessions or roles (e.g., JWTs stored securely).
  - Extend the `state.access` structure to determine user capabilities.
  - Secure server-side validation to prevent unauthorized access (e.g., middleware for sensitive routes).
- **Pending Questions**:
  - How should GMs distribute access keys to players (e.g., manual input vs. automated distribution)?

---

## Technical Architecture

- **Frontend**: Vanilla JS with modular components.
- **State Management**:
  - Uses `dm4-state.js` to centralize campaign data, accessible via `subscribe()` and actions.
  - Supports scoped subscriptions to optimize component updates (e.g., `subscribe(fn, ['selection'])`)
  - Implements batch notifications to reduce redundant state propagation
  - Stores user access roles, campaign datasets, and editor status in top-level `state.campaign` object.
- **Pending Decisions**:
  - **Real-Time Collaboration**:
    - Socket.IO vs. Server-Sent Events.
    - Should the hosting backend process "live updates" via HTTP or WebSocket?

- **Styling**:
  - Style profiles stored in centralized `dm-style-core.js`.
  - Enforce rules via `DM4_STYLE_CONTRACT`.

---

## Pending Questions

1. **Real-Time Collaboration**:
   - Should players be able to see each other’s actions live within the UI?
   - How will live syncing affect performance on hosted servers?

2. **Custom Asset Request Workflow**:
   - Should GM notifications for asset requests happen in-app (e.g., panel UI alerts) or through external notifications (e.g., email)?

---

## Change Log

- **2025-12-10**:
  - Decided to prioritize hosting the app and implementing key access before asset management.
- **2025-12-09**:
  - Confirmed asset management will include a shop and approval-based workflow.