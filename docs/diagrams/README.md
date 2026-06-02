# System Diagrams

Codebase-accurate diagrams for the GraduationProject e-learning platform.
Each diagram is provided as a renderable **Mermaid** `.md` and a tool-agnostic
**`nodes + edges` JSON** export. Generated 2026-06-02 from source
(migrations, gateway `access-policy.ts`, service controllers).

| Diagram | Mermaid | JSON | Source verified against |
|---|---|---|---|
| Architecture — Logical View | [architecture-logical-view.md](./architecture-logical-view.md) | [.json](./architecture-logical-view.json) | `backend_services/*`, `api_gateway` |
| Use Case | [use-case.md](./use-case.md) | [.json](./use-case.json) | `api_gateway/.../access-policy.ts`, controllers |
| Activity — Process View (8 flows) | [activity-process-view.md](./activity-process-view.md) | [.json](./activity-process-view.json) | service controllers/services |
| ERD (full, 36 tables) | [erd.md](./erd.md) | [.json](./erd.json) | `database/knex_migrations/001..041` |

- [schema.json](./schema.json) — JSON Schema documenting the shared node/edge export shape.
- Design spec: [`docs/superpowers/specs/2026-06-02-system-diagrams-design.md`](../superpowers/specs/2026-06-02-system-diagrams-design.md)

## Rendering

Mermaid blocks render natively on GitHub and in most Markdown viewers. To render
standalone (PNG/SVG), use the Mermaid CLI:

```bash
npx -p @mermaid-js/mermaid-cli mmdc -i erd.md -o erd.svg
```

## Regenerating

These diagrams are derived from the codebase. When the schema or routes change:
1. ERD — re-read `database/knex_migrations/` (final state after all migrations).
2. Use Case — re-read the gateway `access-policy.ts` role matrix.
3. Activity / Architecture — re-check the relevant service controllers.

Keep the `.md` and `.json` in sync (same node/edge set).
