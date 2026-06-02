# BE-01 → BE-07 — Run summary

Date: 2026-05-29
Author: thanhtovntmk@gmail.com (To Quoc Thanh)
Auto-run from `/goal complete all task in Backend Developer 1, file be-tasks.html`.

## Branches pushed

| Task | Branch | Base | Trace |
|---|---|---|---|
| BE-01 | feat/TT-BE-01 | main | docs/be-traces/BE-01.md |
| BE-02 | feat/TT-BE-02 | BE-01 (stacked) | docs/be-traces/BE-02.md |
| BE-03 | feat/TT-BE-03 | BE-02 (stacked) | docs/be-traces/BE-03.md |
| BE-04 | feat/TT-BE-04 | BE-03 (stacked) | docs/be-traces/BE-04.md |
| BE-05 | feat/TT-BE-05 | main (independent) | docs/be-traces/BE-05.md |
| BE-06 | feat/TT-BE-06 | main (independent) | docs/be-traces/BE-06.md |
| BE-07 | feat/TT-BE-07 | BE-06 (stacked) | docs/be-traces/BE-07.md |

Recommended PR merge order: BE-01 -> BE-02 -> BE-03 -> BE-04 -> BE-05 -> BE-06 -> BE-07. BE-05 is independent and can land any time after main.

## Verification

Every task was tested with live HTTP against the running services on this machine (course_service :8008, user_service :8002). After each task all test rows were cleaned from the DB. Build (yarn build) and tsc --noEmit were clean for every modified service before commit.

## Cross-cutting notes / questions for confirm

1. Table naming: snake_case plurals (discussion_posts, discussion_upvotes, wishlists, instructor_follows) to match every existing table. Jira cards use PascalCase logical names.
2. Best-answer target: BE-03 enforces that only replies (parentId != null) can be marked as best; root questions cannot be self-best.
3. Follow notifications gating: re-follow does NOT re-notify; re-publish DOES re-notify on every publish event.
4. Gateway mount: BE-06 added /api/instructors to the gateway so the spec URL works verbatim.
5. Migration numbering: BE-04 used 040_, BE-07 used 041_ so they don't collide with BE-05's 038_wishlists.js and BE-06's 039_instructor_follows.js.
6. DatabaseModule double-key bug in user_service: the original database.module.ts had two `models: [...]` keys; the second silently shadowed the first and was dropping AuditLog from Sequelize. Fixed as part of BE-06.
7. WebSocket emit (notification:new) is NOT wired — notifications are DB-only. Existing FE polls/SSEs via media_service.
8. Notification model duplicated across course_service and user_service. Both Nest services register their own Sequelize mapping for the same shared notifications table — service-per-module convention.

## Authentication model

All endpoints rely on the API gateway populating x-user-id, x-user-role, x-user-email headers from the bearer token. Services parse these headers — no JWT verification inside services themselves. Same pattern as feedbacks/enrolls.

## Build/runtime status

- pm2: course_service, user_service, api_gateway online.
- Migrations 036–041 applied to local DB; rolled back & re-applied clean during BE-01 verification.
- No leftover test data.
