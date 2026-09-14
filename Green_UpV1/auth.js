// ============================================================
// GREENUP - auth.js
// Handles authentication through MySQL database and Flask backend.
// Structure preserved without localStorage dependencies.
// ============================================================

/**
 * Generic helper function to make POST requests to the API.
 * @param {string} url - The endpoint URL to send the request to.
 * @param {Object} body - The payload data to be sent as JSON.
 * @returns {Promise<{status: number, data: Object}>} The HTTP status and response JSON data.
 */
async function apiPost(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty response fallback */ }
    return { status: res.status, data };
}

/**
 * Retrieves the current session status from the backend.
 * @returns {Promise<Object>} The session object (contains logged_in status and user info).
 */
async function getSession() {
    try {
        const res = await fetch('/api/session');
        return await res.json();
    } catch (e) {
        return { logged_in: false };
    }
}

/**
 * Protects routes by checking if the user is authenticated. 
 * Redirects to the login page with a return URL if not logged in.
 * @returns {Promise<Object|null>} The session object if authenticated, otherwise null.
 */
async function requireAuth() {
    const sesion = await getSession();
    if (!sesion.logged_in) {
        const paginaActual = encodeURIComponent(window.location.pathname);
        window.location.href = 'login.html?next=' + paginaActual;
        return null;
    }
    return sesion;
}

/**
 * Redirects the user to the home page if they are already logged in (prevents visiting login/register pages unnecessarily).
 */
async function redirectIfLoggedIn() {
    const sesion = await getSession();
    if (sesion.logged_in) window.location.href = 'index.html';
}

/**
 * Switches between authentication tabs (e.g., Login vs Register views).
 * @param {string} tab - The identifier of the tab to activate ('login' or 'register').
 */
function switchTab(tab) {
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
    clearMessage('login-message');
    clearMessage('register-message');
}

/**
 * Displays a feedback message inside an element.
 * @param {string} id - The DOM element ID where the message will be shown.
 * @param {string} text - The message text content.
 * @param {string} type - The message type class ('success', 'error', etc.).
 */
function showMessage(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'auth-message ' + type;
}

/**
 * Clears any feedback message from a specific element.
 * @param {string} id - The DOM element ID to clear.
 */
function clearMessage(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'auth-message';
    el.textContent = '';
}

/**
 * Toggles the visibility of a password input field (shows/hides text).
 * @param {string} inputId - The ID of the password input field.
 * @param {HTMLElement} btn - The toggle button element.
 */
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
    else { input.type = 'password'; btn.textContent = '👁️'; }
}

/**
 * Validates password requirements in real-time during registration.
 * @param {string} value - The current password string value.
 */
function checkPasswordReqs(value) {
    const reqLength = document.getElementById('req-length');
    const reqLetter = document.getElementById('req-letter');
    setReq(reqLength, value.length >= 6);
    setReq(reqLetter, /[a-zA-Z]/.test(value));
}

/**
 * Updates the visual indicator status for a specific password requirement.
 * @param {HTMLElement} el - The requirement DOM element.
 * @param {boolean} met - Whether the requirement has been met.
 */
function setReq(el, met) {
    if (!el) return;
    el.classList.toggle('met', met);
    el.querySelector('.req-icon').textContent = met ? '✔' : '○';
}

/**
 * Handles the user login process by sending credentials to the API and managing redirection.
 */
async function handleLogin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    clearMessage('login-message');

    if (!email || !password) {
        showMessage('login-message', '⚠️ Completá todos los campos.', 'error');
        return;
    }

    const { status, data } = await apiPost('/api/login', { email, password });

    if (status !== 200 || !data.ok) {
        showMessage('login-message', '❌ ' + (data.message || 'Email o contraseña incorrectos.'), 'error');
        return;
    }

    showMessage('login-message', '✅ ¡Bienvenido, ' + data.name + '! Redirigiendo...', 'success');
    setTimeout(() => {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('next') || 'index.html';
        window.location.href = redirect;
    }, 1000);
}

/**
 * Validates registration inputs, checks terms agreement, and submits new user data to the API.
 */
async function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const terms = document.getElementById('reg-terms');
    clearMessage('register-message');

    if (!name || !email || !password || !password2) {
        showMessage('register-message', '⚠️ Completá todos los campos.', 'error');
        return;
    }
    if (!terms || !terms.checked) {
        showMessage('register-message', '⚠️ Debes aceptar los Términos, Condiciones y Privacidad.', 'error');
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        showMessage('register-message', '⚠️ El email no tiene un formato válido.', 'error');
        return;
    }
    if (password.length < 6) {
        showMessage('register-message', '⚠️ La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }
    if (!/[a-zA-Z]/.test(password)) {
        showMessage('register-message', '⚠️ La contraseña debe tener al menos una letra.', 'error');
        return;
    }
    if (password !== password2) {
        showMessage('register-message', '⚠️ Las contraseñas no coinciden.', 'error');
        return;
    }

    const { status, data } = await apiPost('/api/register', { name, email, password });

    if (status !== 200 || !data.ok) {
        showMessage('register-message', '⚠️ ' + (data.message || 'No se pudo crear la cuenta.'), 'error');
        return;
    }

    showMessage('register-message', '🎉 ¡Cuenta creada! Bienvenido, ' + data.name + '...', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
}

/**
 * Logs the user out by requesting the backend logout endpoint and redirecting to the login page.
 */
async function logout() {
    await apiPost('/api/logout');
    window.location.href = 'login.html';
}

/**
 * Dynamically initializes the navigation bar elements based on the user's authentication session state.
 */
async function initUserNavbar() {
    const sesion = await getSession();
    const userProfileNav = document.querySelector('.user-profile-nav');
    const calcSection = document.getElementById('seccion-calculadora');

    if (!sesion.logged_in) {
        if (userProfileNav) {
            userProfileNav.innerHTML = `
                <a href="login.html" class="btn btn-success fw-bold px-3 py-2 rounded-pill shadow-sm" style="font-size: 0.9rem;">
                    🔑 Iniciar sesión
                </a>
            `;
        }
        if (calcSection) {
            calcSection.style.display = 'none';
        }
    } else {
        if (calcSection) {
            calcSection.style.display = 'block';
        }

        if (userProfileNav) {
            const navLevel = document.getElementById('nav-level');
            const imgAvatar = document.getElementById('user-avatar');
            if (navLevel && sesion.usuario && sesion.usuario.nivel) {
                navLevel.textContent = sesion.usuario.nivel;
            }
            if (imgAvatar && sesion.usuario && sesion.usuario.avatar_url) {
                imgAvatar.src = sesion.usuario.avatar_url;
            }
        }

        if (userProfileNav && !document.getElementById('logout-btn')) {
            const btn = document.createElement('button');
            btn.id = 'logout-btn';
            btn.className = 'btn btn-sm btn-outline-light ms-2';
            btn.style.cssText = 'font-size:0.8rem; padding:4px 10px; border-radius:20px;';
            btn.innerHTML = '👤 ' + (sesion.name ? sesion.name.split(' ')[0] : 'Usuario') + ' · Salir';
            btn.onclick = () => { if (confirm('¿Cerrar sesión?')) logout(); };
            userProfileNav.appendChild(btn);
        }
    }
}

/**
 * Main entry point executed when the DOM content is fully loaded.
 * Handles page protection, UI setup, and keyboard event listeners for forms.
 */
document.addEventListener('DOMContentLoaded', async () => {
    const paginaActual = window.location.pathname.split('/').pop().toLowerCase();
    const paginasProtegidas = ['misiones.html', 'ranking.html'];

    // Enforce authentication on protected pages
    if (paginasProtegidas.includes(paginaActual)) {
        const sesion = await requireAuth();
        if (!sesion) return;
    }

    // Redirect logged-in users away from the login page, otherwise setup the navbar
    if (document.getElementById('panel-login')) {
        redirectIfLoggedIn();
    } else {
        initUserNavbar();
    }

    // Add keyboard listeners (Enter key) for login inputs
    ['login-email', 'login-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
    });
    
    // Add keyboard listeners (Enter key) for register inputs
    ['reg-name', 'reg-email', 'reg-password', 'reg-password2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); });
    });
});
