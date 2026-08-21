import { describe, it, expect } from 'vitest';
import { buildForest, buildGitGraphScripts } from '../../src/board/gitGraphScript.js';

const trunk = {
  id: 'trunk',
  name: 'trunk',
  parent_codeline_id: null,
  branch_point_date: null,
  created_at: '2026-01-01T00:00:00.000Z',
};

const release = {
  id: 'release',
  name: 'branches/release-2.4',
  parent_codeline_id: 'trunk',
  branch_point_date: '2026-08-10',
  created_at: '2026-01-02T00:00:00.000Z',
};

function commit(overrides) {
  return {
    id: 'c1',
    codeline_id: 'trunk',
    title: 'work',
    status: 'planned',
    planned_date: '2026-08-01',
    milestone_id: null,
    created_at: '2026-01-01T01:00:00.000Z',
    ...overrides,
  };
}

describe('buildForest', () => {
  it('groups a codeline and its descendants into one tree', () => {
    const forest = buildForest([trunk, release]);
    expect(forest).toHaveLength(1);
    expect(forest[0].memberIds).toEqual(new Set(['trunk', 'release']));
  });

  it('gives independent root codelines separate trees, ordered by created_at', () => {
    const other = { ...trunk, id: 'other', name: 'other-trunk', created_at: '2026-01-03T00:00:00.000Z' };
    const forest = buildForest([other, trunk]);
    expect(forest.map((t) => t.rootId)).toEqual(['trunk', 'other']);
  });
});

describe('buildGitGraphScripts', () => {
  it('emits one gitGraph script per independent tree', () => {
    const other = { ...trunk, id: 'other', name: 'other-trunk', created_at: '2026-01-03T00:00:00.000Z' };
    const result = buildGitGraphScripts([trunk, other], [], []);
    expect(result).toHaveLength(2);
    expect(result[0].script).toContain('gitGraph');
    expect(result[1].script).toContain('gitGraph');
  });

  it('sets mainBranchName to the root codeline name', () => {
    const [{ script }] = buildGitGraphScripts([trunk], [], []);
    expect(script).toContain("'mainBranchName': \"trunk\"");
  });

  it('emits a quoted branch statement using the codeline name', () => {
    // No explicit `checkout "trunk"` is needed here: trunk is the root and
    // is already the checked-out branch immediately after `gitGraph`.
    const [{ script }] = buildGitGraphScripts([trunk, release], [], []);
    expect(script).toContain('branch "branches/release-2.4"');
  });

  it('checks out the parent before branching when the parent is not already current', () => {
    const grandchild = {
      id: 'grandchild',
      name: 'branches/hotfix',
      parent_codeline_id: 'trunk',
      branch_point_date: '2026-08-05',
      created_at: '2026-01-04T00:00:00.000Z',
    };
    // grandchild (2026-08-05) branches off trunk before release (2026-08-10)
    // does, making grandchild current — release's branch then requires
    // switching back to trunk first.
    const [{ script }] = buildGitGraphScripts([trunk, release, grandchild], [], []);
    const lines = script.split('\n');
    const secondBranchIndex = lines.findIndex((l) => l.includes('branches/release-2.4'));
    const checkoutBefore = lines.slice(0, secondBranchIndex).reverse().find((l) => l.includes('checkout'));
    expect(checkoutBefore).toContain('trunk');
  });

  it('maps commit status/milestone to Mermaid commit type', () => {
    const commits = [
      commit({ id: 'c1', status: 'planned', planned_date: '2026-08-01' }),
      commit({ id: 'c2', status: 'slipped', planned_date: '2026-08-02' }),
      commit({ id: 'c3', milestone_id: 'm1', planned_date: '2026-08-03' }),
      commit({ id: 'c4', status: 'slipped', milestone_id: 'm1', planned_date: '2026-08-04' }),
    ];
    const [{ script }] = buildGitGraphScripts([trunk], commits, []);
    expect(script).toContain('commit id: "2026-08-01" type: NORMAL');
    expect(script).toContain('commit id: "2026-08-02" type: REVERSE');
    expect(script).toContain('commit id: "2026-08-03" type: HIGHLIGHT');
    // milestone takes precedence over slipped when both are set
    expect(script).toContain('commit id: "2026-08-04" type: HIGHLIGHT');
  });

  it('disambiguates commit ids that share a planned_date', () => {
    const commits = [
      commit({ id: 'c1', planned_date: '2026-08-01', created_at: '2026-01-01T00:00:00.000Z' }),
      commit({ id: 'c2', planned_date: '2026-08-01', created_at: '2026-01-01T01:00:00.000Z' }),
    ];
    const [{ script }] = buildGitGraphScripts([trunk], commits, []);
    expect(script).toContain('commit id: "2026-08-01" type: NORMAL');
    expect(script).toContain('commit id: "2026-08-01 (2)" type: NORMAL');
  });

  it('emits a merge statement after checking out the target branch', () => {
    const events = [
      {
        id: 'e1',
        type: 'MERGE',
        source_codeline_id: 'release',
        target_codeline_id: 'trunk',
        status: 'planned',
        milestone_id: null,
        planned_date: '2026-08-15',
        created_at: '2026-01-05T00:00:00.000Z',
      },
    ];
    const [{ script }] = buildGitGraphScripts([trunk, release], [], events);
    const lines = script.split('\n');
    const mergeIndex = lines.findIndex((l) => l.includes('merge'));
    const checkoutTrunkBeforeMerge = lines.slice(0, mergeIndex).reverse().find((l) => l.includes('checkout'));
    expect(checkoutTrunkBeforeMerge).toContain('trunk');
    expect(lines[mergeIndex]).toContain('merge "branches/release-2.4"');
  });

  it('synthesizes a tagged commit for a RELEASE_TAG event', () => {
    const events = [
      {
        id: 'e1',
        type: 'RELEASE_TAG',
        source_codeline_id: 'trunk',
        target_codeline_id: null,
        status: 'planned',
        milestone_id: null,
        planned_date: '2026-08-20',
        created_at: '2026-01-05T00:00:00.000Z',
      },
    ];
    const [{ script }] = buildGitGraphScripts([trunk], [], events);
    expect(script).toContain('tag: "2026-08-20"');
  });

  it('does not render BRANCH_CREATE events (redundant with the codeline branch point)', () => {
    const events = [
      {
        id: 'e1',
        type: 'BRANCH_CREATE',
        source_codeline_id: 'trunk',
        target_codeline_id: 'release',
        status: 'planned',
        milestone_id: null,
        planned_date: '2026-08-10',
        created_at: '2026-01-05T00:00:00.000Z',
      },
    ];
    const [{ script }] = buildGitGraphScripts([trunk, release], [], events);
    // still exactly one branch statement (from the codeline itself), not two
    expect(script.match(/branch "/g)).toHaveLength(1);
  });
});
