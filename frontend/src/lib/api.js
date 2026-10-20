// Every call to the backend goes through request(). The address always starts
// with /api — in development Vite forwards it to the Express server, and in
// Docker the nginx container forwards it to the backend container.

async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Orbit cannot reach its server. Is the backend running?');
  }

  if (response.status === 204) return null; // "No Content", e.g. after a delete
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Something went wrong (error ${response.status}).`);
  }
  return data;
}

// Builds "?q=docker&tag=beginner", leaving out empty values.
export function toQueryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const api = {
  listCollections: () => request('/collections'),
  createCollection: (data) => request('/collections', { method: 'POST', body: data }),
  updateCollection: (id, data) => request(`/collections/${id}`, { method: 'PUT', body: data }),
  deleteCollection: (id) => request(`/collections/${id}`, { method: 'DELETE' }),

  createSubgroup: (collectionId, name) =>
    request(`/collections/${collectionId}/subgroups`, { method: 'POST', body: { name } }),
  renameSubgroup: (id, name) => request(`/subgroups/${id}`, { method: 'PUT', body: { name } }),
  deleteSubgroup: (id) => request(`/subgroups/${id}`, { method: 'DELETE' }),

  listBookmarks: (filters) => request(`/bookmarks${toQueryString(filters)}`),
  createBookmark: (data) => request('/bookmarks', { method: 'POST', body: data }),
  updateBookmark: (id, data) => request(`/bookmarks/${id}`, { method: 'PUT', body: data }),
  deleteBookmark: (id) => request(`/bookmarks/${id}`, { method: 'DELETE' }),

  listTags: () => request('/tags'),

  listShortcuts: () => request('/shortcuts'),
  createShortcut: (data) => request('/shortcuts', { method: 'POST', body: data }),
  updateShortcut: (id, data) => request(`/shortcuts/${id}`, { method: 'PUT', body: data }),
  deleteShortcut: (id) => request(`/shortcuts/${id}`, { method: 'DELETE' }),
};
