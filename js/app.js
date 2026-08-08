import { getToken } from './api.js';

// Routes that require authentication
const AUTH_ROUTES = new Set(['#/mesas', '#/mesa/:id', '#/mesa/:id/cuenta']);

const routes = {
  '#/login':           () => import('./views/login.js'),
  '#/mesas':           () => import('./views/mesas.js'),
  '#/mesa/:id':        () => import('./views/order.js'),
  '#/mesa/:id/cuenta': () => import('./views/bill.js'),
};

export function navigate(hash) {
  window.location.hash = hash;
}

function matchRoute(hash) {
  for (const pattern of Object.keys(routes)) {
    const regex = new RegExp('^' + pattern.replace(/:id/g, '([^/]+)') + '$');
    const match = hash.match(regex);
    if (match) return { loader: routes[pattern], params: match.slice(1), pattern };
  }
  return null;
}

function requiresAuth(pattern) {
  return AUTH_ROUTES.has(pattern);
}

async function render() {
  const hash = window.location.hash || '#/login';
  const app = document.getElementById('app');

  const matched = matchRoute(hash);

  if (!matched) {
    navigate(getToken() ? '#/mesas' : '#/login');
    return;
  }

  // Guard: redirect to login if route requires auth and no token
  if (requiresAuth(matched.pattern) && !getToken()) {
    navigate('#/login');
    return;
  }

  // Guard: redirect to mesas if already authenticated and going to login
  if (matched.pattern === '#/login' && getToken()) {
    navigate('#/mesas');
    return;
  }

  const module = await matched.loader();
  app.innerHTML = '';
  module.render(app, matched.params);
}

window.addEventListener('hashchange', render);

window.addEventListener('load', () => {
  if (!window.location.hash || window.location.hash === '#') {
    navigate(getToken() ? '#/mesas' : '#/login');
  } else {
    render();
  }
});
