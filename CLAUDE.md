# CLAUDE.md

Orientation file for Claude Code. Read this first, then `ARCHITECTURE.md` for full design rationale before writing code.

## Project

**plangit** — a visual planning board for scheduling *future, virtual* commits, branches, merges, and releases on a codebase's codelines (trunk + branches), laid out against a calendar. Lets a team lead plan integration milestones in advance instead of reacting to slipped deadlines.

The current codebase under version control is SVN, not git — this tool's data model is intentionally VCS-agnostic (see ARCHITECTURE.md §1) so it isn't tied to either.

## Current phase — read carefully before implementing

**We are building v1 only: pure visual planning, no live repo connection.**

In scope now:
- CRUD for Codeline, PlannedCommit, PlannedEvent, Milestone, TeamMember
- Lanes-by-calendar-timeline board UI with drag-to-reschedule
- Persistence to Postgres

Out of scope until explicitly requested:
- `RepoBinding` / reconciliation service (pulling `svn log --xml`, matching planned vs. actual, flagging slippage)
- Any real SVN or git connectivity
- Auth / multi-user permissions

Do not scaffold or stub the reconciliation service yet — it's a deliberately separate concern (see ARCHITECTURE.md §3) and building it early risks coupling it to the planning core.

## Tech stack (confirmed)

- **Frontend:** React, custom SVG/canvas renderer for the lanes+calendar view
- **Backend:** Node.js + Express, REST API
- **Storage:** PostgreSQL
- **Reconciliation (phase 2, not now):** scheduled job (likely a GitHub Action) parsing `svn log --xml`

## Repo layout

```
plangit/
├── CLAUDE.md
├── ARCHITECTURE.md
├── README.md
├── docs/
│   └── diagrams/           # Mermaid source, GitHub-renderable
│       ├── 01_class_diagram.mermaid
│       ├── 02_component_diagram.mermaid
│       ├── 03_sequence_reconciliation.mermaid
│       └── 04_state_diagram.mermaid
├── packages/
│   ├── frontend/            # React app
│   └── backend/             # Express API + DB layer
└── .github/
    └── workflows/           # CI now; reconciliation job added in phase 2
```

Monorepo with `packages/frontend` and `packages/backend` as independent npm workspaces — keeps the eventual reconciliation service addable as a third package without restructuring.

## Conventions

- **Commits:** Conventional Commits — `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. Scope prefix when useful, e.g. `feat(frontend): add drag-to-reschedule`.
- **Branches:** `feature/<short-name>`, `fix/<short-name>`.
- **PRs:** one logical change per PR; description should reference the relevant ARCHITECTURE.md section when introducing new domain concepts.
- Domain model naming in code should match ARCHITECTURE.md §1 exactly (`PlannedCommit`, `PlannedEvent`, etc.) — don't rename entities ad hoc.

## Where to look for more detail

- Full data model, entity relationships, rationale: `ARCHITECTURE.md`
- Diagrams (class, component, sequence, state): `docs/diagrams/`
