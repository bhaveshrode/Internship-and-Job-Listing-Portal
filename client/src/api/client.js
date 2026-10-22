const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  getOpportunities: ({ search = '', domain = '', page = 1, limit = 9 } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (domain) params.set('domain', domain);
    return request(`/opportunities?${params}`);
  },
  getOpportunity: (id) => request(`/opportunities/${id}`),
  getDomains: () => request('/domains'),
  createApplication: (body) =>
    request('/applications', { method: 'POST', body: JSON.stringify(body) }),
};
