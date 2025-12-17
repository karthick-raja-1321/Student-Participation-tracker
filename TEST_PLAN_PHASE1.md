# Phase 1 Frontend QA Test Plan (After Backend is Live)

## Scope
Validate Phase 1 changes: renaming, auto-save, dashboards, and approval flows against live backend APIs.

## Environments
- Frontend: Vite dev server (`npm run dev`) or deployed build
- Backend: API base URL set via `VITE_API_URL`
- Auth: Valid user tokens for Student, Class Advisor, Innovation Coordinator

## Pre-checks
- Set `VITE_API_URL` in frontend env.
- Ensure test accounts exist for required roles.
- Clear browser localStorage before each scenario.

## Test Cases

### 1) Auto-Save – On-Duty Process
- Path: `/on-duty/new`
- Steps: Fill fields → wait 2s → see "Auto-saved" → refresh → data restored → submit → data clears.
- Expected: Fields persist across refresh; status indicator shows; submission succeeds; localStorage key removed.

### 2) Auto-Save – Event Participation Proof
- Path: `/participation-proof/new/:id`
- Steps: Fill fields → wait 2s → see "Auto-saved" → refresh → data restored → submit → data clears.
- Expected: Same as above; success toast text mentions "Event Participation Proof".

### 3) Class Advisor Dashboard
- Path: `/dashboard/class-advisor`
- API calls: `/approvals/class-advisor-stats`, `/approvals/class-advisor-submissions`, `/faculty`.
- Steps: Load page → stats populated → filter by Pending → click Review on a pending item → assign coordinator → approve with comment → table refreshes.
- Expected: Status chip updates; toast success; data refetched; rejection path also works with warning.

### 4) Innovation Coordinator Dashboard – Phase I
- Path: `/dashboard/innovation-coordinator`
- API calls: `/approvals/innovation-coordinator-stats`, `/approvals/innovation-coordinator-phase-i`.
- Steps: Switch to Phase I tab → filter Pending → Review → approve/reject with comments.
- Expected: Status updates; toast success; table refreshes.

### 5) Innovation Coordinator Dashboard – Phase II
- Path: same as above, Phase II tab
- API calls: `/approvals/innovation-coordinator-phase-ii`, `/approvals/approve-phase-ii`.
- Steps: Filter Pending → Review → verify/approve or reject with comments.
- Expected: Status updates; prize/result visible; table refreshes.

### 6) Routing & Backward Compatibility
- Paths: `/on-duty/new`, `/on-duty/:id`, `/participation-proof/new/:id`, `/participation-proof/:id`, legacy `/submissions/phase-i/*`, `/submissions/phase-ii/*`.
- Expected: All routes render without 404; legacy routes still work.

### 7) Error Handling
- Force 401 (invalid token): should redirect/login flow.
- Force 500/400: toast with backend message; UI remains stable; loading spinners stop.

## Pass/Fail Criteria
- All test cases above pass without console errors.
- No broken routes; no missing API calls; auto-save behaves as designed.

## Logging & Evidence
- Capture screenshots of dashboards, auto-save indicators, and status changes.
- Note API responses for approvals (IDs, statuses).

## Known Dependencies
- Backend endpoints implemented per `BACKEND_INTEGRATION_GUIDE.md`.
- Role-based access control configured on backend.
