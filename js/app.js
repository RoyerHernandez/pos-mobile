import { getToken } from './api.js';

const routes = {
  '#/login':        () => import('./views/login.js'),
  '#/mesas':        () => import('./views/mesas.js'),
  '#/mesa/:id':     () => import('./views/order.js'),
  '#/mesa/:id/cuenta': () => import('./views/bill.js'),
};

export function navigate(hash) {
  window.location.hash = hash;
}

function matchRoute(hash) {
  for (const pattern of Object.keys(routes)) {
    const regex = new RegExp('^' + pattern.replace(/:id/g, '([^/]+)') + '$');
    const match = hash.match(regex);
    if (match) return { loader: routes[pattern], params: match.slice(1) };
  }
  return null;
}

async function render() {
  const hash = window.location.hash || '#/login';
  const app = document.getElementById('app');

  const matched = matchRoute(hash);
  if (!matched) {
    navigate(getToken() ? '#/mesas' : '#/login');
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
