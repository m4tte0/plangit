import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { PlanningBoard } from '../../src/board/PlanningBoard.jsx';

function mockFetchJson(responsesByPath) {
  return vi.fn((url) => {
    const key = Object.keys(responsesByPath).find((path) => url.includes(path));
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(responsesByPath[key] ?? []),
    });
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PlanningBoard', () => {
  it('shows an empty-state message when there are no codelines', async () => {
    global.fetch = mockFetchJson({
      '/api/codelines': [],
      '/api/planned-commits': [],
      '/api/planned-events': [],
    });

    render(<PlanningBoard />);
    expect(await screen.findByText(/No codelines yet/)).toBeDefined();
  });

  it('renders a lane per codeline and the status legend', async () => {
    global.fetch = mockFetchJson({
      '/api/codelines': [
        { id: 'c1', name: 'trunk', color: null, branch_point_date: null, created_at: '2026-01-01T00:00:00.000Z' },
        {
          id: 'c2',
          name: 'branches/release-2.4',
          color: null,
          branch_point_date: '2026-08-01',
          created_at: '2026-01-02T00:00:00.000Z',
        },
      ],
      '/api/planned-commits': [
        {
          id: 'p1',
          codeline_id: 'c1',
          title: 'Ship feature X',
          status: 'planned',
          planned_date: '2026-08-05',
          assignee_ids: [],
        },
      ],
      '/api/planned-events': [
        {
          id: 'e1',
          type: 'BRANCH_CREATE',
          source_codeline_id: 'c1',
          target_codeline_id: 'c2',
          status: 'planned',
          planned_date: '2026-08-01',
        },
      ],
    });

    render(<PlanningBoard />);

    expect(await screen.findByText('trunk')).toBeDefined();
    expect(await screen.findByText('branches/release-2.4')).toBeDefined();

    const legend = within(document.querySelector('.board-legend'));
    expect(legend.getByText('Planned')).toBeDefined();
    expect(legend.getByText('In progress')).toBeDefined();
    expect(legend.getByText('Done')).toBeDefined();
    expect(legend.getByText('Slipped')).toBeDefined();
  });

  it('opens the add-codeline modal, blocks an empty name, and adds a new lane on success', async () => {
    const initialCodelines = [
      { id: 'c1', name: 'trunk', color: null, branch_point_date: null, created_at: '2026-01-01T00:00:00.000Z' },
    ];
    const created = {
      id: 'c2',
      name: 'branches/release-2.4',
      parent_codeline_id: 'c1',
      branch_point_date: '2026-08-01',
      color: null,
      created_at: '2026-01-03T00:00:00.000Z',
    };

    global.fetch = vi.fn((url, options = {}) => {
      if (url.includes('/api/codelines') && options.method === 'POST') {
        return Promise.resolve({ ok: true, status: 201, json: () => Promise.resolve(created) });
      }
      if (url.includes('/api/codelines')) {
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(initialCodelines) });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
    });

    render(<PlanningBoard />);
    expect(await screen.findByText('trunk')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: '+ Add codeline' }));
    expect(screen.getByText('Add codeline')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Name is required')).toBeDefined();

    fireEvent.change(screen.getByPlaceholderText('trunk'), { target: { value: 'branches/release-2.4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('branches/release-2.4')).toBeDefined();
    expect(screen.queryByText('Add codeline')).toBeNull();
  });
});
