import { get, post, del } from '../api.js';
import { navigate } from '../app.js';

export async function render(container, [tableId]) {
  container.innerHTML = `
    <header class="app-header">
      <button class="btn-back" id="back-btn">&#8592;</button>
      <span class="app-title" id="mesa-title">Mesa ${tableId}</span>
      <span class="order-total" id="order-total"></span>
    </header>
    <div class="category-tabs" id="category-tabs"></div>
    <main class="order-main">
      <div class="products-list" id="products-list"><p class="loading">Cargando...</p></div>
      <aside class="order-summary" id="order-summary"><p class="empty">Sin items</p></aside>
    </main>
    <footer class="order-footer">
      <button class="btn-primary" id="bill-btn">Ver Cuenta</button>
    </footer>
    <div class="toast" id="toast"></div>
  `;

  document.getElementById('back-btn').addEventListener('click', () => navigate('#/mesas'));
  document.getElementById('bill-btn').addEventListener('click', () => navigate(`#/mesa/${tableId}/cuenta`));

  let selectedCategory = null;
  let allProducts = [];

  try {
    const [table, products] = await Promise.all([
      get(`/tables/${tableId}`),
      get('/products')
    ]);

    // Show table name if available
    const title = document.getElementById('mesa-title');
    if (title) title.textContent = table.nombre ? `${table.nombre}` : `Mesa ${tableId}`;

    allProducts = products;

    const categories = [
      ...new Map(
        products.map(p => [p.id_categoria, { id: p.id_categoria, nombre: p.categoria }])
      ).values()
    ];
    selectedCategory = categories[0]?.id ?? null;

    const tabs = document.getElementById('category-tabs');
    tabs.innerHTML = categories.map(c => `
      <button class="tab-btn ${c.id === selectedCategory ? 'active' : ''}" data-cat="${c.id}">${c.nombre}</button>
    `).join('');

    tabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCategory = Number(btn.dataset.cat);
        tabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderProducts(allProducts, selectedCategory, tableId);
      });
    });

    renderProducts(allProducts, selectedCategory, tableId);
    renderSummary(table, tableId);
  } catch (err) {
    document.getElementById('products-list').innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function renderProducts(products, categoryId, tableId) {
  const list = document.getElementById('products-list');
  const filtered = products.filter(p => p.id_categoria === categoryId);

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty">Sin productos en esta categoría</p>';
    return;
  }

  list.innerHTML = filtered.map(p => `
    <div class="product-row">
      <span class="product-name">${p.nombre}</span>
      <span class="product-price">$${Number(p.precio).toFixed(2)}</span>
      <button class="btn-add" data-id="${p.id}">+</button>
    </div>
  `).join('');

  list.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = '…';

      try {
        await post(`/tables/${tableId}/items`, {
          productos: [{ id_producto: Number(btn.dataset.id), cantidad: 1 }]
        });
        const table = await get(`/tables/${tableId}`);
        renderSummary(table, tableId);
      } catch (err) {
        showToast(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '+';
      }
    });
  });
}

function renderSummary(table, tableId) {
  const summary = document.getElementById('order-summary');
  const totalEl = document.getElementById('order-total');
  const items = table.detalles || [];
  const sum = items.reduce((acc, i) => acc + Number(i.subtotal), 0);

  if (totalEl) totalEl.textContent = sum > 0 ? `$${sum.toFixed(2)}` : '';

  if (items.length === 0) {
    summary.innerHTML = '<p class="empty">Sin items</p>';
    return;
  }

  summary.innerHTML = items.map(i => `
    <div class="summary-row">
      <span>${i.cantidad}x ${i.producto}</span>
      <span>$${Number(i.subtotal).toFixed(2)}</span>
      <button class="btn-remove" data-detail="${i.id}">-</button>
    </div>
  `).join('');

  summary.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (btn.disabled) return;
      btn.disabled = true;

      try {
        await del(`/tables/${tableId}/items/${btn.dataset.detail}`);
        const updated = await get(`/tables/${tableId}`);
        renderSummary(updated, tableId);
      } catch (err) {
        showToast(err.message);
        btn.disabled = false;
      }
    });
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('toast-visible');
  setTimeout(() => toast.classList.remove('toast-visible'), 3500);
}
