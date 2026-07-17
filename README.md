# PLANG-IT!

A visual planning board for scheduling **future, virtual commits, branches, merges, and releases** on a codebase's codelines — laid out against a calendar — so a team lead can plan integration milestones in advance instead of reacting to slipped deadlines.

## The problem this solves

Most git/SVN history visualizers show you what *already happened*. Nothing shows you what's *planned to happen* — when a feature branch should merge, when a release should be tagged — mapped onto an actual calendar so a team lead can spot conflicts and slippage before they occur. plangit is that missing planning layer.

## Current status

**v1, in active development.** Scope is deliberately narrow right now:

- ✅ In scope: create/edit codelines (trunk + branches), place planned commits and events (branch/merge/release) on them with dates and assignees, group them into milestones, view everything on a lanes × calendar board, drag to reschedule.
- 🚧 Deferred (not yet built): connecting to a real repository to check the plan against actual history ("reconciliation"), authentication/multi-user permissions.

See `ARCHITECTURE.md` for the full design and the reasoning behind what's in and out of scope.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (custom SVG/canvas renderer for the board) |
| Backend | Node.js + Express (REST API) |
| Storage | PostgreSQL |
| Reconciliation (future) | Scheduled job parsing `svn log --xml` |

## Repo structure

```
plangit/
├── CLAUDE.md              # AI-agent orientation (read by Claude Code)
├── ARCHITECTURE.md         # Full design: data model, components, rationale
├── README.md                # You are here
├── docs/diagrams/           # UML/architecture diagrams (Mermaid, GitHub-renderable)
├── packages/
│   ├── frontend/            # React planning board app
│   └── backend/             # Express API + database layer
└── .github/workflows/       # CI (lint/test on PR)
```

## Where to start reading

1. `ARCHITECTURE.md` — domain model (Codeline, PlannedCommit, PlannedEvent, Milestone, TeamMember) and how the pieces fit together.
2. `docs/diagrams/` — class diagram, component/architecture diagram, reconciliation sequence diagram (future feature, documented for context), and the planned-item lifecycle state diagram.
3. `CLAUDE.md` — if you're working with Claude Code on this repo, this is the file it reads automatically for context and conventions.

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- **Branches:** `feature/<short-name>`, `fix/<short-name>`.
- Domain entity names in code must match `ARCHITECTURE.md` exactly — don't introduce ad hoc renames.

## Getting started (local dev)

> Setup scripts and package manifests are being scaffolded — this section will be filled in as `packages/frontend` and `packages/backend` come online.
