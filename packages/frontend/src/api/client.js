const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${path} failed with ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  listCodelines: () => request('/codelines'),
  listPlannedCommits: () => request('/planned-commits'),
  listPlannedEvents: () => request('/planned-events'),
  listMilestones: () => request('/milestones'),
  listTeamMembers: () => request('/team-members'),

  createCodeline: (data) => request('/codelines', { method: 'POST', body: JSON.stringify(data) }),
  createPlannedCommit: (data) =>
    request('/planned-commits', { method: 'POST', body: JSON.stringify(data) }),
  createPlannedEvent: (data) =>
    request('/planned-events', { method: 'POST', body: JSON.stringify(data) }),

  updatePlannedCommit: (id, patch) =>
    request(`/planned-commits/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  updatePlannedEvent: (id, patch) =>
    request(`/planned-events/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
};
