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
    <div class="toast" id="toast"></div>
  `;

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearTokens();
    localStorage.removeItem('pos_user');
    stopRefresh();
    navigate('#/login');
  });

  // Clear any previous interval before starting a new one
  stopRefresh();

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

  grid.innerHTML = tables.map(t => {
    const itemCount = t.detalles?.length ?? (t.total_items ?? null);
    const itemsBadge = (t.estado === 'ocupada' || t.estado === 'pagando') && itemCount != null
      ? `<span class="mesa-items">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>`
      : '';

    return `
      <div class="mesa-card mesa-${t.estado}" data-id="${t.id}" data-estado="${t.estado}">
        <span class="mesa-numero">${t.numero}</span>
        <span class="mesa-nombre">${t.nombre || ''}</span>
        ${itemsBadge}
        <span class="mesa-estado">${labelEstado(t.estado)}</span>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.mesa-card').forEach(card => {
    card.addEventListener('click', () => onMesaTap(card));
  });

  const ocupadas = tables.filter(t => t.estado === 'ocupada' || t.estado === 'pagando').length;
  if (footer) footer.textContent = `${tables.length} mesas · ${ocupadas} ocupadas`;
}

function labelEstado(estado) {
  const labels = { libre: 'Libre', ocupada: 'Ocupada', pagando: 'Pagando', reservada: 'Reservada' };
  return labels[estado] ?? estado;
}

async function onMesaTap(card) {
  const { id, estado } = card.dataset;

  if (estado === 'libre') {
    // Visual feedback: mark card as loading
    card.classList.add('mesa-loading');
    card.style.pointerEvents = 'none';
    stopRefresh();
    try {
      await post(`/tables/${id}/open`, {});
      navigate(`#/mesa/${id}`);
    } catch (err) {
      showToast(err.message);
      card.classList.remove('mesa-loading');
      card.style.pointerEvents = '';
      // Resume refresh after error
      refreshInterval = setInterval(loadMesas, 10000);
    }
  } else if (estado === 'ocupada') {
    stopRefresh();
    navigate(`#/mesa/${id}`);
  } else if (estado === 'pagando') {
    stopRefresh();
    navigate(`#/mesa/${id}/cuenta`);
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast-visible');
  setTimeout(() => toast.classList.remove('toast-visible'), 3500);
}

export function stopRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
