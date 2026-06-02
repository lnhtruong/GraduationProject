# System Diagrams — Design Spec

**Date:** 2026-06-02
**Topic:** Codebase-accurate UML/architecture diagrams for the GraduationProject e-learning platform
**Status:** Approved (design), pending implementation

## Goal

Produce four high-quality, codebase-accurate diagrams for the thesis, each emitted as
a **Mermaid `.md`** (renderable) and a **generic `nodes+edges` JSON** (tool-agnostic).
Diagrams are derived from the *actual source* (migrations, gateway access-policy,
service controllers/routes), not the existing docs, which are stale.

## Decisions

| Decision | Choice |
|---|---|
| JSON format | Generic `nodes + edges` schema (tool-agnostic) |
| Label language | English |
| ERD scope | Full — all ~40 tables from the 41 knex migrations |
| Output location | `docs/diagrams/` |
| Extraction method | Source-of-truth: read migrations + `access-policy.ts` + controllers |

## Output layout

```
docs/diagrams/
  schema.json                          # documents the shared node/edge JSON shape
  architecture-logical-view.md / .json # UML Logical View
  use-case.md / .json                  # Actors x use cases
  activity-process-view.md / .json     # Key process flows (8 flows)
  erd.md / .json                       # Full ~40-table ERD
```

## Diagram 1 — Architecture (Logical View)

Mermaid `flowchart`, layered packages:

- **Presentation:** Next.js SPA (`frontend-nextjs/`)
- **Gateway:** API Gateway (Express) — CORS, rate-limit, JWT verify, `access-policy.ts`
  role authz, `x-user-*` header injection, HTTP + WS proxy
- **Application Services (NestJS/Express):** auth, user, course, media, payment, mail,
  ai, inference
- **Data:** MySQL 8 `graduation_db` (shared, per-service Sequelize models), Redis 7
  (cache + OTP + pub/sub)
- **External:** Bunny Stream, Cloudinary, PayOS, OpenAI, Gmail SMTP, `deploy-model/`
  (mascot talking-head)

Edge types: `rest`, `ws-sse`, `redis-pubsub`, `external-http`, `db`.

## Diagram 2 — Use Case

Mermaid `flowchart`; actors as nodes, use cases as ellipses, grouped by subsystem.
`<<include>>` / `<<extend>>` where applicable.

Actor mapping (system roles: ADMIN / STUDENT / LECTURER):

- **User / Guest** (unauthenticated): browse courses, view feed, register/login
- **Student** (STUDENT) — inherits User: enroll, cart/checkout (includes payment),
  learn lessons, take quiz, rate/feedback, comment/interact feed, request lecturer upgrade
- **Instructor** (LECTURER) — inherits Student: create/manage course & lessons,
  AI quiz generation, upload video, publish highlight feed, view course analytics
- **Admin** (ADMIN): approve/ban course, review reports, manage users/roles,
  approve lecturer upgrade requests, view audit logs

## Diagram 3 — Activity (Process View)

Mermaid `flowchart` with swimlane subgraphs. Eight flows (confirmed):

1. Auth: register -> login -> JWT issue -> refresh
2. Forgot-password OTP (auth_service -> mail_service -> Redis -> email)
3. Course lifecycle: create -> submit -> admin approve/reject -> publish
4. Enroll + Payment: cart -> PayOS link -> webhook -> Redis `payment:success` -> grant enroll
5. Video upload: TUS init -> direct upload to Bunny -> webhook -> WS/SSE progress
6. AI quiz generation: pick lesson SRT -> OpenAI -> persist quiz/questions/options
7. Newsfeed: scroll/recommend -> view log -> like/save/share/comment
8. Lecturer upgrade request -> admin review -> role update + notification

## Diagram 4 — ERD

Mermaid `erDiagram`, full schema (~40 tables) from `database/knex_migrations/001..041`,
with columns, PK/FK, and relationships. Includes late-migration tables missing from
the current data-model doc: `quiz_submissions`, `lecturer_upgrade_requests`,
`webhook_events`, `audit_logs`, `discussion_posts`, `discussion_upvotes`, `wishlists`,
`instructor_follows`, and notification-event additions.

## Shared JSON schema

```json
{
  "diagramType": "logical-view | use-case | activity | erd",
  "title": "string",
  "groups": [{ "id": "string", "label": "string", "kind": "layer|lane|subsystem" }],
  "nodes": [{ "id": "string", "label": "string", "type": "string", "group": "string", "meta": {} }],
  "edges": [{ "from": "string", "to": "string", "type": "string", "label": "string" }]
}
```

For the ERD, `nodes` are tables (with `meta.columns[]` incl. `pk`/`fk` flags) and
`edges` are FK relationships with cardinality in `type`.

## Quality / verification

- ERD entities and FKs verified line-by-line against the 41 migrations.
- Use-case role matrix verified against gateway `access-policy.ts`.
- Activity flows verified against the relevant controllers.
- Each Mermaid block validated for syntax; JSON validated as parseable.
