// ============================================================
// GREENUP - auth.js
// Manejo de autenticación a través de la base de datos MySQL y Flask.
// Se mantiene la estructura original sin dependencias de localStorage.
// ============================================================

async function apiPost(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    });
    let data = {};
    try { data = await res.json(); } catch (e) { /* respuesta vacía */ }
    return { status: res.status, data };
}

async function getSession() {
    try {
        const res = await fetch('/api/session');
        return await res.json();
    } catch (e) {
        return { logged_in: false };
    }
}

async function requireAuth() {
    const sesion = await getSession();
    if (!sesion.logged_in) {
        const paginaActual = encodeURIComponent(window.location.pathname);
        window.location.href = 'login.html?next=' + paginaActual;
        return null;
    }
    return sesion;
}

async function redirectIfLoggedIn() {
    const sesion = await getSession();
    if (sesion.logged_in) window.location.href = 'index.html';
}

function switchTab(tab) {
    document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
    clearMessage('login-message');
    clearMessage('register-message');
}

function showMessage(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = 'auth-message ' + type;
}

function clearMessage(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'auth-message';
    el.textContent = '';
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
    else { input.type = 'password'; btn.textContent = '👁️'; }
}

function checkPasswordReqs(value) {
    const reqLength = document.getElementById('req-length');
    const reqLetter = document.getElementById('req-letter');
    setReq(reqLength, value.length >= 6);
    setReq(reqLetter, /[a-zA-Z]/.test(value));
}

function setReq(el, met) {
    if (!el) return;
    el.classList.toggle('met', met);
    el.querySelector('.req-icon').textContent = met ? '✔' : '○';
}

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

async function logout() {
    await apiPost('/api/logout');
    window.location.href = 'login.html';
}

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

document.addEventListener('DOMContentLoaded', async () => {
    const paginaActual = window.location.pathname.split('/').pop().toLowerCase();
    const paginasProtegidas = ['misiones.html', 'ranking.html'];

    if (paginasProtegidas.includes(paginaActual)) {
        const sesion = await requireAuth();
        if (!sesion) return;
    }

    if (document.getElementById('panel-login')) {
        redirectIfLoggedIn();
    } else {
        initUserNavbar();
    }

    ['login-email', 'login-password'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
    });
    ['reg-name', 'reg-email', 'reg-password', 'reg-password2'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); });
    });
});