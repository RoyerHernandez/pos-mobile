import { login } from '../api.js';
import { navigate } from '../app.js';

export function render(container) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">
        <h1>POS Callejon</h1>
      </div>
      <form class="login-form" id="login-form">
        <div class="form-group">
          <label for="usuario">Usuario</label>
          <input type="text" id="usuario" name="usuario" autocomplete="username" required>
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" name="password" autocomplete="current-password" required>
        </div>
        <p class="login-error" id="login-error"></p>
        <button type="submit" class="btn-primary" id="login-btn">Iniciar Sesión</button>
      </form>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');
    errorEl.textContent = '';
    btn.disabled = true;
    btn.textContent = 'Iniciando...';

    try {
      const usuario = document.getElementById('usuario').value.trim();
      const password = document.getElementById('password').value;
      const data = await login(usuario, password);
      localStorage.setItem('pos_user', JSON.stringify(data.user));
      navigate('#/mesas');
    } catch (err) {
      errorEl.textContent = err.message || 'Error al iniciar sesión';
      btn.disabled = false;
      btn.textContent = 'Iniciar Sesión';
    }
  });
}
