# plangit — Architecture

## 0. Purpose

A team lead needs to plan integration milestones — future commits, branch creations, merges, and releases — against a calendar, *before* they happen, so slippage is visible and manageable rather than discovered after the fact. The current codebase is under SVN. The tool is deliberately VCS-agnostic: it plans against abstract "codelines," not SVN or git internals, so it isn't locked to either.

v1 (this build) is planning-only: create, visualize, and reschedule a plan. No live repo connection yet.
Phase 2 (future, out of scope for now): reconcile the plan against a real repo's actual history and flag divergence.

## 1. Domain model

| Entity | Represents |
|---|---|
| **Codeline** | A branch/trunk lane in the plan (`trunk`, `branches/release-2.4`). A planning object — doesn't need to exist in SVN yet. |
| **PlannedCommit** | A virtual commit: a point on a codeline with a date, not yet real work. |
| **PlannedEvent** | A scheduled action that isn't a plain commit: `BRANCH_CREATE`, `MERGE`, `RELEASE_TAG`. |
| **Milestone** | Optional grouping of PlannedCommits/Events (e.g. "v2.4 release"). |
| **TeamMember** | Assignee, for workload/calendar visibility. |
| **RepoBinding** *(phase 2)* | Config for reaching the real repo (SVN log source) for reconciliation. |
| **ReconciliationResult** *(phase 2)* | Diff between planned items and actual repo history: on-time / late / missing / diverged. |

```
Codeline {
  id, name, parent_codeline_id, branch_point_date, color
}

PlannedCommit {
  id, codeline_id, title, description, planned_date,
  status,              // planned | in_progress | done | slipped
  linked_real_revision, // nullable — set once reconciled (phase 2)
  assignee_ids[], milestone_id
}

PlannedEvent {
  id, type,            // BRANCH_CREATE | MERGE | RELEASE_TAG
  source_codeline_id, target_codeline_id,
  planned_date, status, milestone_id
}

Milestone {
  id, name, target_date, description
}

TeamMember {
  id, name, color
}

RepoBinding (phase 2) {
  id, vcs_type, log_source, last_synced_at
}
```

Key design choice: **PlannedCommit/Event are decoupled from real VCS objects.** They only gain a `linked_real_revision` once reconciliation matches them — the planning layer has zero SVN/git-specific assumptions, so it survives a future migration off SVN unchanged.

See `docs/diagrams/01_class_diagram.mermaid` for the full UML class diagram including relationships.

## 2. Component architecture

Four subsystems:

- **Planning Board (frontend)** — React app rendering codelines as horizontal lanes against a calendar time axis, with drag-and-drop rescheduling of planned items.
- **Planning API (backend)** — Express REST API + domain service layer. Pure planning CRUD, no VCS dependency at all.
- **Storage** — PostgreSQL.
- **Reconciliation Service** *(phase 2, separate package)* — pulls `svn log --xml`, parses it, matches actual commits to planned items by date window + branch path, flags slippage.

Reconciliation is kept as a **separate service**, not folded into the Planning API, for two reasons: it needs repo credentials/network access the planning app has no reason to hold, and it's the one part likely to change if the org ever migrates off SVN — the planning core should be unaffected by that.

See `docs/diagrams/02_component_diagram.mermaid`.

## 3. Reconciliation flow (phase 2 — reference only, not built in v1)

A scheduled job fetches `svn log --xml`, parses it into structured commits, fetches planned items in the relevant date window from the Planning API, matches actual against planned, and persists `ReconciliationResult` rows.

See `docs/diagrams/03_sequence_reconciliation.mermaid` for the full sequence.

## 4. Lifecycle

A `PlannedCommit`/`PlannedEvent` moves `planned → in_progress → done`, with `slipped` reachable from either `planned` or `in_progress` once its target date passes without a matching real commit (phase 2) or without being marked done. This is the state that directly answers the original problem: making missed deadlines visible instead of silently absorbed into "current flow of events."

See `docs/diagrams/04_state_diagram.mermaid`.

## 5. v1 scope checklist

1. CRUD codelines (add trunk, branch off with a planned date)
2. CRUD planned commits/events on a codeline: date, assignee, milestone
3. Render on a lanes × calendar-timeline board
4. Drag a planned item to reschedule
5. Persist to Postgres

Explicitly deferred: RepoBinding, reconciliation, auth/multi-user permissions.

## 6. Stack

- Frontend: React, custom SVG/canvas renderer (no heavy graph library — layout needs precise control)
- Backend: Node.js + Express
- Storage: PostgreSQL
- Reconciliation (phase 2): scheduled job, likely a GitHub Action, parsing `svn log --xml`

See `CLAUDE.md` for repo layout and conventions.
