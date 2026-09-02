document.addEventListener('DOMContentLoaded', async () => {

    // ============================
    // NIVEL, EXPERIENCIA Y AVATAR DESDE BASE DE DATOS
    // ============================
    let currentExp = 0;
    let currentLevel = 1;
    let expToNextLevel = calculateExpToNextLevel(currentLevel);

    function calculateExpToNextLevel(level) {
        return 2000 * level;
    }

    try {
        const res = await fetch('/api/session');
        if (res.ok) {
            const data = await res.json();
            if (data.logged_in && data.usuario) {
                currentExp = data.usuario.experiencia || 0;
                currentLevel = data.usuario.nivel || 1;
                expToNextLevel = calculateExpToNextLevel(currentLevel);
                if (data.usuario.avatar_url && document.getElementById('user-avatar')) {
                    document.getElementById('user-avatar').src = data.usuario.avatar_url;
                }
            }
        }
    } catch (e) {
        // Si falla la conexión, se mantiene el valor por defecto
    }

    const levelUpModalElement = document.getElementById('levelUpModal');
    const levelUpModal = levelUpModalElement ? new bootstrap.Modal(levelUpModalElement) : null;

    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar && document.getElementById('user-avatar') && !document.getElementById('user-avatar').src.includes('/uploads/')) {
        document.getElementById('user-avatar').src = savedAvatar;
    }

    function updateUI() {
        const navLevel = document.getElementById('nav-level');
        if (navLevel) navLevel.textContent = currentLevel;

        const currentLevelEl = document.getElementById('currentLevel');
        const currentExpEl = document.getElementById('currentExp');
        const expToNextLevelEl = document.getElementById('expToNextLevel');

        if (currentLevelEl) currentLevelEl.textContent = currentLevel;
        if (currentExpEl) currentExpEl.textContent = currentExp;
        if (expToNextLevelEl) expToNextLevelEl.textContent = expToNextLevel;

        const progressBarElement = document.getElementById('progressBar');
        const progressTextElement = document.getElementById('progressText');
        if (progressBarElement && progressTextElement) {
            const progressPercentage = Math.min(100, (currentExp / expToNextLevel) * 100);
            progressBarElement.style.width = `${progressPercentage}%`;
            progressTextElement.textContent = `${Math.round(progressPercentage)}%`;
        }
    }

    updateUI();

    // Función para refrescar el progreso desde la base de datos tras completar misiones
    window.refrescarProgreso = async function (nuevoNivel, nuevaExperiencia, subioNivel) {
        currentLevel = nuevoNivel;
        currentExp = nuevaExperiencia;
        expToNextLevel = calculateExpToNextLevel(currentLevel);
        updateUI();

        if (subioNivel && levelUpModal) {
            const newLevelDisplay = document.getElementById('newLevelDisplay');
            if (newLevelDisplay) newLevelDisplay.textContent = currentLevel;
            levelUpModal.show();
        }
    };

    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newAvatarUrl = e.target.result;
                    document.getElementById('user-avatar').src = newAvatarUrl;
                    localStorage.setItem('userAvatar', newAvatarUrl);
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // ============================
    // ECO - ASISTENTE DE HUELLA DIARIA
    // ============================

    const ecobotAvatar = document.getElementById('ecobot-avatar');
    const ecobotBubble = document.getElementById('ecobot-bubble');
    const ecobotBadge = document.getElementById('ecobot-badge');

    function getHoy() {
        return new Date().toISOString().split('T')[0];
    }

    function getAyer() {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }

    function obtenerEstadoEcobot() {
        const hoy = getHoy();
        const ayer = getAyer();
        const lastCheck = localStorage.getItem('lastCheckDate');
        const streak = parseInt(localStorage.getItem('streak')) || 0;

        if (lastCheck === hoy) {
            return { estado: 'hecho', streak };
        } else if (lastCheck === ayer) {
            return { estado: 'pendiente-racha', streak };
        } else if (lastCheck) {
            return { estado: 'racha-perdida', streak: 0 };
        } else {
            return { estado: 'nuevo', streak: 0 };
        }
    }

    const mensajesEco = {
        nuevo: [
            '¡Hola! Soy Eco 🌱 ¿Ya sabés cuál es tu huella de carbono? Toca aquí para calcularla 🌍',
            '¡Hola, soy Eco! Hacé tu primer chequeo y conocé tu impacto 🌍 (Clic aquí)'
        ],
        hecho: (streak) => [
            `¡Genial! Ya hiciste tu chequeo de hoy 🎉 Racha: ${streak} día${streak === 1 ? '' : 's'}`,
            `¡Vas muy bien! 💪 Llevás ${streak} día${streak === 1 ? '' : 's'} cuidando el planeta`
        ],
        'pendiente-racha': (streak) => [
            `¡No rompas tu racha de ${streak} día${streak === 1 ? '' : 's'}! Toca aquí para calcular tu huella 🔥`,
            `¡Te espero! Llevás ${streak} día${streak === 1 ? '' : 's'} seguidos, no lo dejes pasar 🌎`
        ],
        'racha-perdida': [
            '¡Te extrañé! 😢 Perdimos la racha, toca aquí para calcular tu huella de nuevo 🌱',
            'Hace tiempo no chequeás tu huella... ¡Toca aquí para medir tu impacto! 🌍'
        ]
    };

    function elegirMensajeEco(estado, streak) {
        const lista = (estado === 'hecho' || estado === 'pendiente-racha')
            ? mensajesEco[estado](streak)
            : mensajesEco[estado];
        return lista[Math.floor(Math.random() * lista.length)];
    }

    function actualizarEcobot() {
        if (!ecobotAvatar || !ecobotBubble || !ecobotBadge) return;

        const { estado, streak } = obtenerEstadoEcobot();
        ecobotBubble.textContent = elegirMensajeEco(estado, streak);

        if (estado === 'hecho') {
            ecobotBadge.style.display = 'none';
            ecobotAvatar.classList.remove('ecobot-alerta');
        } else {
            ecobotBadge.style.display = 'flex';
            ecobotBadge.textContent = '!';
            ecobotAvatar.classList.add('ecobot-alerta');
        }
    }

    window.actualizarEcobot = actualizarEcobot;

    if (ecobotAvatar && ecobotBubble) {
        actualizarEcobot();

        setTimeout(() => {
            ecobotBubble.classList.add('ecobot-bubble-visible', 'animate__animated', 'animate__bounceIn');
            setTimeout(() => {
                ecobotBubble.classList.remove('ecobot-bubble-visible');
            }, 6000);
        }, 1500);

        ecobotAvatar.addEventListener('click', () => {
            ecobotBubble.classList.toggle('ecobot-bubble-visible');
        });

        ecobotBubble.addEventListener('click', () => {
            window.location.href = 'calculadora.html';
        });
    }

    // ============================
    // CALCULADORA DE HUELLA DE CARBONO
    // ============================

    const form = document.getElementById('carbon-footprint-form');

    if (form) {
        const resultadoDiv = document.getElementById('resultado');
        const emojiP = document.getElementById('resultado-emoji');
        const textoP = document.getElementById('resultado-texto');
        const btnConsejos = document.getElementById('btn-consejos');
        const consejosBox = document.getElementById('consejos-box');
        const listaConsejos = document.getElementById('lista-consejos');

        const consejos = {
            movilidad: 'Probá usar más el transporte público, la bici o caminar en distancias cortas en vez del auto/moto.',
            energia: 'Apagá luces y aparatos que no uses, y desenchufá lo que no esté en uso para ahorrar energía.',
            reciclaje: 'Separá tus residuos en orgánicos, plásticos, papel y vidrio. ¡Reciclar siempre que puedas hace una gran diferencia!'
        };

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const movilidad = parseInt(document.querySelector('input[name="movilidad"]:checked').value);
            const energia = parseInt(document.querySelector('input[name="energia"]:checked').value);
            const reciclaje = parseInt(document.querySelector('input[name="reciclaje"]:checked').value);

            const total = movilidad + energia + reciclaje;

            resultadoDiv.classList.remove('huella-alta', 'huella-media', 'huella-baja');

            let nivel = '';
            if (total <= 5) {
                emojiP.textContent = '🔴';
                textoP.textContent = 'Huella alta';
                resultadoDiv.classList.add('huella-alta');
                nivel = 'alta';
            } else if (total <= 7) {
                emojiP.textContent = '🟡';
                textoP.textContent = 'Huella media';
                resultadoDiv.classList.add('huella-media');
                nivel = 'media';
            } else {
                emojiP.textContent = '🟢';
                textoP.textContent = 'Huella baja';
                resultadoDiv.classList.add('huella-baja');
                nivel = 'baja';
            }

            // Guardar el resultado en MySQL a través del Backend
            try {
                await fetch('/api/huella', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ total: total })
                });
            } catch (err) {
                console.error("Error al guardar la huella en el servidor:", err);
            }

            // Consejos según respuestas más débiles
            listaConsejos.innerHTML = '';
            const respuestas = { movilidad, energia, reciclaje };

            let hayConsejoEspecifico = false;
            for (const clave in respuestas) {
                if (respuestas[clave] === 1) {
                    const li = document.createElement('li');
                    li.textContent = consejos[clave];
                    listaConsejos.appendChild(li);
                    hayConsejoEspecifico = true;
                }
            }

            if (!hayConsejoEspecifico) {
                for (const clave in consejos) {
                    const li = document.createElement('li');
                    li.textContent = consejos[clave];
                    listaConsejos.appendChild(li);
                }
            }

            resultadoDiv.style.display = 'block';
            consejosBox.style.display = 'none';
            resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Actualizar racha y fecha de chequeo diario
            const hoy = getHoy();
            const ayer = getAyer();
            const lastCheck = localStorage.getItem('lastCheckDate');
            let streak = parseInt(localStorage.getItem('streak')) || 0;

            if (lastCheck === hoy) {
                // Ya había calculado hoy
            } else if (lastCheck === ayer) {
                streak += 1;
            } else {
                streak = 1;
            }

            localStorage.setItem('lastCheckDate', hoy);
            localStorage.setItem('streak', streak);
            localStorage.setItem('huellaNivel', nivel);

            if (window.actualizarEcobot) window.actualizarEcobot();
        });

        if (btnConsejos) {
            btnConsejos.addEventListener('click', () => {
                consejosBox.style.display = consejosBox.style.display === 'none' ? 'block' : 'none';
            });
        }
    }

});