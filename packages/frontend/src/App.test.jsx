import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App.jsx';

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

describe('App', () => {
  beforeEach(() => {
    global.fetch = mockFetchJson({
      '/api/codelines': [],
      '/api/planned-commits': [],
      '/api/planned-events': [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the planning board heading and an empty state when there is no data', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /plangit/ })).toBeDefined();
    expect(await screen.findByText(/No codelines yet/)).toBeDefined();
  });
});
