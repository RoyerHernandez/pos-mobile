import { login } from '../api.js';
import { navigate } from '../app.js';

export function render(container) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-logo">
        <h1>POS Callejon</h1>
        <p>Sistema de mesas</p>
      </div>
      <form class="login-form" id="login-form" novalidate>
        <div class="form-group">
          <label for="usuario">Usuario</label>
          <input
            type="text"
            id="usuario"
            name="usuario"
            autocomplete="username"
            autocorrect="off"
            autocapitalize="none"
            spellcheck="false"
            inputmode="text"
            required
          >
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <div class="input-password-wrap">
            <input
              type="password"
              id="password"
              name="password"
              autocomplete="current-password"
              required
            >
            <button type="button" class="btn-toggle-pw" id="toggle-pw" aria-label="Mostrar contraseña">
              <span id="toggle-pw-icon">&#128065;</span>
            </button>
          </div>
        </div>
        <p class="login-error" id="login-error" role="alert"></p>
        <button type="submit" class="btn-primary" id="login-btn">Iniciar Sesión</button>
      </form>
    </div>
  `;

  // Auto-focus usuario field
  document.getElementById('usuario').focus();

  // Password show/hide toggle
  const toggleBtn = document.getElementById('toggle-pw');
  const passwordInput = document.getElementById('password');
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    document.getElementById('toggle-pw-icon').textContent = isPassword ? '🙈' : '👁';
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('login-btn');
    const errorEl = document.getElementById('login-error');
    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value;

    errorEl.textContent = '';

    if (!usuario) {
      errorEl.textContent = 'Ingresa tu usuario.';
      document.getElementById('usuario').focus();
      return;
    }
    if (!password) {
      errorEl.textContent = 'Ingresa tu contraseña.';
      document.getElementById('password').focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Iniciando...';

    try {
      const data = await login(usuario, password);
      localStorage.setItem('pos_user', JSON.stringify(data.user));
      navigate('#/mesas');
    } catch (err) {
      const msg = err.message || '';
      // Make 401/credential errors friendlier
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid') || msg === 'Unauthorized') {
        errorEl.textContent = 'Usuario o contraseña incorrectos.';
      } else {
        errorEl.textContent = msg || 'Error al iniciar sesión.';
      }
      btn.disabled = false;
      btn.textContent = 'Iniciar Sesión';
      document.getElementById('usuario').focus();
    }
  });
}
