import { get, put } from '../api.js';
import { navigate } from '../app.js';

export async function render(container, [tableId]) {
  container.innerHTML = `
    <header class="app-header">
      <button class="btn-back" id="back-btn">&#8592;</button>
      <span class="app-title" id="bill-title">Cuenta - Mesa ${tableId}</span>
    </header>
    <main class="bill-main" id="bill-main">
      <p class="loading">Cargando cuenta...</p>
    </main>
    <div class="toast" id="toast"></div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate(`#/mesa/${tableId}`));

  try {
    const table = await get(`/tables/${tableId}`);

    // Update title with table name if available
    const titleEl = document.getElementById('bill-title');
    if (titleEl) titleEl.textContent = table.nombre
      ? `Cuenta - ${table.nombre}`
      : `Cuenta - Mesa ${tableId}`;

    renderBill(table, tableId);
  } catch (err) {
    document.getElementById('bill-main').innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function renderBill(table, tableId) {
  const items = table.detalles || [];
  const main = document.getElementById('bill-main');

  if (items.length === 0) {
    main.innerHTML = `
      <div class="bill-empty">
        <p class="empty">Esta mesa no tiene items.</p>
        <button class="btn-secondary" id="back-to-order">Volver al pedido</button>
      </div>
    `;
    document.getElementById('back-to-order').addEventListener('click', () => navigate(`#/mesa/${tableId}`));
    return;
  }

  const total = items.reduce((acc, i) => acc + Number(i.subtotal), 0);

  main.innerHTML = `
    <div class="bill-items">
      ${items.map(i => `
        <div class="bill-row">
          <span>${i.cantidad}x ${i.producto}</span>
          <span>$${Number(i.subtotal).toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
    <div class="bill-total">
      <strong>Total</strong>
      <strong>$${total.toFixed(2)}</strong>
    </div>
    <div class="payment-methods">
      <button class="pay-method active" data-method="efectivo">Efectivo</button>
      <button class="pay-method" data-method="tarjeta">Tarjeta</button>
      <button class="pay-method" data-method="transferencia">Transferencia</button>
    </div>
    <button class="btn-charge" id="charge-btn">Cobrar $${total.toFixed(2)}</button>
  `;

  let selectedMethod = 'efectivo';

  main.querySelectorAll('.pay-method').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMethod = btn.dataset.method;
      main.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('charge-btn').addEventListener('click', async () => {
    const btn = document.getElementById('charge-btn');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    try {
      await put(`/tables/${tableId}/close`, { metodo_pago: selectedMethod, id_cliente: null });
      showSuccess();
    } catch (err) {
      showToast(err.message);
      btn.disabled = false;
      btn.textContent = `Cobrar $${total.toFixed(2)}`;
    }
  });
}

function showSuccess() {
  const main = document.getElementById('bill-main');
  main.innerHTML = `
    <div class="bill-success">
      <span class="bill-success-icon">&#10003;</span>
      <p class="bill-success-text">Pago registrado</p>
      <p class="bill-success-sub">Volviendo a las mesas...</p>
    </div>
  `;
  setTimeout(() => navigate('#/mesas'), 1800);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast-visible');
  setTimeout(() => toast.classList.remove('toast-visible'), 3500);
}
