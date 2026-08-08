import { get, put } from '../api.js';
import { navigate } from '../app.js';

export async function render(container, [tableId]) {
  container.innerHTML = `
    <header class="app-header">
      <button class="btn-back" id="back-btn">&#8592;</button>
      <span class="app-title">Cuenta - Mesa ${tableId}</span>
    </header>
    <main class="bill-main" id="bill-main">
      <p class="loading">Cargando cuenta...</p>
    </main>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate(`#/mesa/${tableId}`));

  try {
    const table = await get(`/tables/${tableId}`);
    renderBill(container, table, tableId);
  } catch (err) {
    document.getElementById('bill-main').innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function renderBill(container, table, tableId) {
  const items = table.detalles || [];
  const total = items.reduce((acc, i) => acc + Number(i.subtotal), 0);
  const main = document.getElementById('bill-main');

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
    <button class="btn-charge" id="charge-btn">Cobrar</button>
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
      navigate('#/mesas');
    } catch (err) {
      alert(err.message);
      btn.disabled = false;
      btn.textContent = 'Cobrar';
    }
  });
}
