import { get, post, clearTokens } from '../api.js';
import { navigate } from '../app.js';

let refreshInterval = null;

export async function render(container) {
  const user = JSON.parse(localStorage.getItem('pos_user') || '{}');

  container.innerHTML = `
    <header class="app-header">
      <span class="app-title">POS Callejon</span>
      <div class="header-user">
        <span>${user.nombre || user.usuario || ''}</span>
        <button id="logout-btn">Salir</button>
      </div>
    </header>
    <main class="mesas-main">
      <div class="mesas-grid" id="mesas-grid">
        <p class="loading">Cargando mesas...</p>
      </div>
      <footer class="mesas-footer" id="mesas-footer"></footer>
    </main>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearTokens();
    localStorage.removeItem('pos_user');
    stopRefresh();
    navigate('#/login');
  });

  await loadMesas();
  refreshInterval = setInterval(loadMesas, 10000);
}

async function loadMesas() {
  try {
    const tables = await get('/tables');
    renderGrid(tables);
  } catch (err) {
    const grid = document.getElementById('mesas-grid');
    if (grid) grid.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function renderGrid(tables) {
  const grid = document.getElementById('mesas-grid');
  const footer = document.getElementById('mesas-footer');
  if (!grid) return;

  grid.innerHTML = tables.map(t => `
    <div class="mesa-card mesa-${t.estado}" data-id="${t.id}" data-estado="${t.estado}">
      <span class="mesa-numero">${t.numero}</span>
      <span class="mesa-nombre">${t.nombre || ''}</span>
      <span class="mesa-estado">${t.estado}</span>
    </div>
  `).join('');

  grid.querySelectorAll('.mesa-card').forEach(card => {
    card.addEventListener('click', () => onMesaTap(card.dataset.id, card.dataset.estado));
  });

  const ocupadas = tables.filter(t => t.estado === 'ocupada' || t.estado === 'pagando').length;
  if (footer) footer.textContent = `${tables.length} mesas · ${ocupadas} ocupadas`;
}

async function onMesaTap(id, estado) {
  if (estado === 'libre') {
    try {
      await post(`/tables/${id}/open`, {});
      navigate(`#/mesa/${id}`);
    } catch (err) {
      alert(err.message);
    }
  } else if (estado === 'ocupada') {
    navigate(`#/mesa/${id}`);
  } else if (estado === 'pagando') {
    navigate(`#/mesa/${id}/cuenta`);
  }
}

export function stopRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
