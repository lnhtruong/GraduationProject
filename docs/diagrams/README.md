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

## Rendered images

Pre-rendered images live alongside the sources (white background, 2× scale):

- `erd.png` / `.svg`, `architecture-logical-view.png` / `.svg`, `use-case.png` / `.svg`
- `activity-1-auth`, `activity-2-otp`, `activity-3-course-lifecycle`, `activity-4-payment`,
  `activity-5-video-upload`, `activity-6-ai-quiz`, `activity-7-newsfeed`,
  `activity-8-lecturer-upgrade` (each `.png` + `.svg`)

> **Uploading to Google Drive / Word / slides → use the PNG files.** Mermaid SVGs embed
> text via `<foreignObject>` (HTML-in-SVG), which Google Drive's previewer and some editors
> do **not** render, so text appears missing. The SVG is not corrupted — it just needs a
> renderer that supports `foreignObject` (e.g. a web browser). PNG always displays correctly.

## Rendering (regenerate)

Run from **inside this folder** (`docs/diagrams/`), not the repo root:

```bash
cd docs/diagrams
npx -p @mermaid-js/mermaid-cli mmdc -i erd.md -o erd.svg      # vector
npx -p @mermaid-js/mermaid-cli mmdc -i erd.md -o erd.png -b white -s 2   # raster (Drive-safe)
```

## Regenerating

These diagrams are derived from the codebase. When the schema or routes change:
1. ERD — re-read `database/knex_migrations/` (final state after all migrations).
2. Use Case — re-read the gateway `access-policy.ts` role matrix.
3. Activity / Architecture — re-check the relevant service controllers.

Keep the `.md` and `.json` in sync (same node/edge set).
