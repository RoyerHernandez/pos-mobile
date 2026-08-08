export const API_BASE = 'http://localhost:8080/api/pos/v1';

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

async function refreshToken() {
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
  }
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res = await fetch(`${API_BASE}${path}`, opts);

  if (res.status === 401) {
    const ok = await refreshToken();
    if (ok) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    } else {
      clearTokens();
      window.location.hash = '#/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function login(usuario, password) {
  const data = await request('POST', '/auth/login', { usuario, password });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export const get = (path) => request('GET', path);
export const post = (path, body) => request('POST', path, body);
export const put = (path, body) => request('PUT', path, body);
export const del = (path) => request('DELETE', path);
