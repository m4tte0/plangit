// Converts plangit's domain data (codelines, planned commits, planned
// events) into real Mermaid gitGraph syntax, so the board can be rendered
// by the actual mermaid.js library instead of an approximation of it.
//
// Mermaid's gitGraph is an imperative script (checkout/commit/branch/merge
// executed in order), not a declarative "N commits scattered across M dated
// branches" format, and it has no concept of a floating, commit-less event —
// every mark has to be a commit on some branch at some point in a single
// linear sequence per branch. A few mappings fall out of that mismatch:
//
// - Multiple root-level (parentless) codelines can't share one gitGraph
//   diagram (Mermaid has exactly one initial branch). buildForest groups
//   codelines into independent trees by parent_codeline_id; each tree gets
//   its own script, rendered as a separate diagram.
// - A PlannedEvent of type BRANCH_CREATE is structurally redundant once a
//   script is generated: the codeline's own branch_point_date already
//   produces the `branch` statement. Mermaid has no way to show a second,
//   separate "branch happened" marker for a branch that already exists, so
//   these events are intentionally not rendered here.
// - A RELEASE_TAG event isn't attached to any real commit in our model, but
//   Mermaid tags always decorate a commit — so a small commit is synthesized
//   to carry the tag.
// - Commit ids double as Mermaid's default visible label; we use the
//   planned_date so the board reads as it did with the previous renderer.
//   Multiple commits can share a date, so ids are disambiguated with a
//   " (n)" suffix on collision — Mermaid ids just need to be unique
//   strings, this keeps them still date-legible.

function quote(value) {
  return JSON.stringify(String(value));
}

function commitTypeFor(item) {
  if (item.milestone_id) return 'HIGHLIGHT';
  if (item.status === 'slipped') return 'REVERSE';
  return 'NORMAL';
}

export function buildForest(codelines) {
  const byId = new Map(codelines.map((cl) => [cl.id, cl]));

  function findRoot(codeline) {
    let current = codeline;
    const seen = new Set();
    while (current.parent_codeline_id && byId.has(current.parent_codeline_id) && !seen.has(current.id)) {
      seen.add(current.id);
      current = byId.get(current.parent_codeline_id);
    }
    return current;
  }

  const treesByRootId = new Map();
  for (const cl of codelines) {
    const root = findRoot(cl);
    if (!treesByRootId.has(root.id)) {
      treesByRootId.set(root.id, { rootId: root.id, rootName: root.name, memberIds: new Set() });
    }
    treesByRootId.get(root.id).memberIds.add(cl.id);
  }

  return [...treesByRootId.values()].sort(
    (a, b) => new Date(byId.get(a.rootId).created_at) - new Date(byId.get(b.rootId).created_at),
  );
}

function buildTreeActions(tree, codelineById, commits, events) {
  const actions = [];

  for (const cl of codelineById.values()) {
    if (cl.id === tree.rootId) continue;
    actions.push({
      date: cl.branch_point_date ?? cl.created_at,
      tiebreak: cl.created_at,
      key: `codeline:${cl.id}`,
      kind: 'branch',
      codelineId: cl.id,
      parentId: cl.parent_codeline_id,
    });
  }

  for (const c of commits) {
    if (!codelineById.has(c.codeline_id)) continue;
    actions.push({
      date: c.planned_date,
      tiebreak: c.created_at,
      key: `commit:${c.id}`,
      kind: 'commit',
      codelineId: c.codeline_id,
      item: c,
    });
  }

  for (const e of events) {
    if (!codelineById.has(e.source_codeline_id)) continue;
    if (e.type === 'MERGE') {
      if (!e.target_codeline_id || !codelineById.has(e.target_codeline_id)) continue;
      actions.push({
        date: e.planned_date,
        tiebreak: e.created_at,
        key: `event:${e.id}`,
        kind: 'merge',
        sourceId: e.source_codeline_id,
        targetId: e.target_codeline_id,
      });
    } else if (e.type === 'RELEASE_TAG') {
      actions.push({
        date: e.planned_date,
        tiebreak: e.created_at,
        key: `event:${e.id}`,
        kind: 'tag',
        codelineId: e.source_codeline_id,
        item: e,
      });
    }
    // BRANCH_CREATE: intentionally skipped — see file header.
  }

  actions.sort((a, b) => {
    const dateDiff = new Date(a.date) - new Date(b.date);
    if (dateDiff !== 0) return dateDiff;
    const tieDiff = new Date(a.tiebreak) - new Date(b.tiebreak);
    if (tieDiff !== 0) return tieDiff;
    return a.key.localeCompare(b.key);
  });

  return actions;
}

function buildTreeScript(tree, codelines, commits, events, { theme }) {
  const codelineById = new Map(codelines.filter((cl) => tree.memberIds.has(cl.id)).map((cl) => [cl.id, cl]));
  const actions = buildTreeActions(tree, codelineById, commits, events);

  const lines = [];
  let current = tree.rootId;
  const created = new Set([tree.rootId]);
  const dateCounts = new Map();

  function uniqueLabel(dateValue) {
    const date = String(dateValue).slice(0, 10);
    const n = (dateCounts.get(date) ?? 0) + 1;
    dateCounts.set(date, n);
    return n === 1 ? date : `${date} (${n})`;
  }

  function ensureCheckout(codelineId) {
    if (current !== codelineId) {
      lines.push(`  checkout ${quote(codelineById.get(codelineId).name)}`);
      current = codelineId;
    }
  }

  for (const action of actions) {
    if (action.kind === 'branch') {
      if (created.has(action.codelineId)) continue;
      const parentId = action.parentId && codelineById.has(action.parentId) ? action.parentId : current;
      ensureCheckout(parentId);
      lines.push(`  branch ${quote(codelineById.get(action.codelineId).name)}`);
      created.add(action.codelineId);
      current = action.codelineId; // `branch` also checks it out
    } else if (action.kind === 'commit') {
      ensureCheckout(action.codelineId);
      const id = uniqueLabel(action.item.planned_date);
      lines.push(`  commit id: ${quote(id)} type: ${commitTypeFor(action.item)}`);
    } else if (action.kind === 'merge') {
      if (!created.has(action.sourceId) || !created.has(action.targetId)) continue;
      ensureCheckout(action.targetId);
      lines.push(`  merge ${quote(codelineById.get(action.sourceId).name)}`);
    } else if (action.kind === 'tag') {
      ensureCheckout(action.codelineId);
      const id = uniqueLabel(action.item.planned_date);
      lines.push(`  commit id: ${quote(id)} type: ${commitTypeFor(action.item)} tag: ${quote(id)}`);
    }
  }

  const rootName = codelineById.get(tree.rootId).name;
  const init = `%%{init: { 'theme': ${quote(theme)}, 'gitGraph': { 'mainBranchName': ${quote(rootName)}, 'showCommitLabel': true } } }%%`;

  return [init, 'gitGraph', ...lines].join('\n');
}

export function buildGitGraphScripts(codelines, commits, events, { theme = 'default' } = {}) {
  const forest = buildForest(codelines);
  return forest.map((tree) => ({
    rootId: tree.rootId,
    rootName: tree.rootName,
    script: buildTreeScript(tree, codelines, commits, events, { theme }),
  }));
}
