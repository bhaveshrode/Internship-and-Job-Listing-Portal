const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'adminToken';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// Authenticated request — attaches the admin JWT; on 401 clears the token
// so stale sessions bounce back to the login page.
async function authRequest(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Not logged in');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = {
  // --- public ---
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

  // --- admin auth ---
  loginAdmin: (credentials) =>
    request('/admin/login', { method: 'POST', body: JSON.stringify(credentials) }),

  // --- admin: opportunity CRUD ---
  createOpportunity: (body) =>
    authRequest('/opportunities', { method: 'POST', body: JSON.stringify(body) }),
  updateOpportunity: (id, body) =>
    authRequest(`/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteOpportunity: (id) =>
    authRequest(`/opportunities/${id}`, { method: 'DELETE' }),

  // --- admin: applications ---
  getApplications: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return authRequest(`/applications${qs ? `?${qs}` : ''}`);
  },
};
