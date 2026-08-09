export const API_BASE = 'http://localhost:8081/api/pos/v1';

const TOKEN_KEY = 'pos_access_token';
const REFRESH_KEY = 'pos_refresh_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// Prevent concurrent refresh calls — reuse the in-flight promise
let refreshPromise = null;

async function refreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = localStorage.getItem(REFRESH_KEY);
    if (!refresh) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh })
      });
      if (!res.ok) return false;
      const data = await res.json();
      setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch {
    throw new Error('Sin conexión. Verifica tu red e intenta de nuevo.');
  }

  if (res.status === 401) {
    const ok = await refreshToken();
    if (ok) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      try {
        res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
      } catch {
        throw new Error('Sin conexión. Verifica tu red e intenta de nuevo.');
      }
    } else {
      clearTokens();
      window.location.hash = '#/login';
      throw new Error('Sesión expirada. Inicia sesión de nuevo.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.message || err.error || err.detail || res.statusText;
    throw new Error(message);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function login(usuario, password) {
  const data = await request('POST', '/auth/login', { usuario, password });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export const get  = (path)       => request('GET',    path);
export const post = (path, body) => request('POST',   path, body);
export const put  = (path, body) => request('PUT',    path, body);
export const del  = (path)       => request('DELETE', path);
