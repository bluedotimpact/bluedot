// Minimal Keycloak admin REST API client (no dependencies, Node >= 20).

export function createAdminClient({ baseUrl, username, password }) {
  let token = null;
  let tokenFetchedAt = 0;

  const getToken = async () => {
    // Admin tokens default to a 60s lifespan; refresh a bit before that
    if (token && Date.now() - tokenFetchedAt < 45_000) return token;
    const res = await fetch(`${baseUrl}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password', client_id: 'admin-cli', username, password,
      }),
    });
    if (!res.ok) throw new Error(`Failed to get admin token: ${res.status} ${await res.text()}`);
    token = (await res.json()).access_token;
    tokenFetchedAt = Date.now();
    return token;
  };

  const request = async (method, path, body) => {
    const res = await fetch(`${baseUrl}/admin${path}`, {
      method,
      headers: {
        authorization: `Bearer ${await getToken()}`,
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return res;
  };

  const requestOk = async (method, path, body) => {
    const res = await request(method, path, body);
    if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${await res.text()}`);
    return res;
  };

  return {
    baseUrl,
    // Returns parsed JSON, or null on 404
    get: async (path) => {
      const res = await request('GET', path);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
      return res.json();
    },
    post: (path, body) => requestOk('POST', path, body),
    put: (path, body) => requestOk('PUT', path, body),
    del: (path) => requestOk('DELETE', path),
  };
}

export function adminClientFromEnv() {
  const baseUrl = (process.env.KC_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
  const username = process.env.KC_ADMIN_USERNAME ?? 'admin';
  const password = process.env.KC_ADMIN_PASSWORD ?? 'admin';
  return createAdminClient({ baseUrl, username, password });
}
