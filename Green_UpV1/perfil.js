document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM - Modos y Botones
    const btnToggleEdit = document.getElementById('btn-toggle-edit');
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const viewMode = document.getElementById('view-mode');
    const editMode = document.getElementById('edit-mode');
    const profileForm = document.getElementById('profile-form');
    const alertBox = document.getElementById('profile-alert');

    // Campos de Lectura (Visualización)
    const displayNombre = document.getElementById('display-nombre');
    const displayEmail = document.getElementById('display-email');
    const displayBio = document.getElementById('display-bio');
    const displayUbicacion = document.getElementById('display-ubicacion');
    const displayFecha = document.getElementById('display-fecha-registro');
    const profileLevel = document.getElementById('profile-level');
    const profileExp = document.getElementById('profile-exp');
    const profileMissions = document.getElementById('profile-missions-count');
    const profileAvatarImg = document.getElementById('profile-avatar-img');
    const bannerContainer = document.getElementById('banner-container');

    // Campos de Edición (Inputs)
    const inputNombre = document.getElementById('input-nombre');
    const inputUbicacion = document.getElementById('input-ubicacion');
    const inputBio = document.getElementById('input-bio');

    // Inputs de Archivos (Imágenes)
    const avatarFileInput = document.getElementById('avatar-file-input');
    const bannerFileInput = document.getElementById('banner-file-input');

    // Elementos de la Sección Amigos
    const amigosLista = document.getElementById('amigos-lista');
    const inputBuscarAmigo = document.getElementById('input-buscar-amigo');
    const btnEjecutarBusqueda = document.getElementById('btn-ejecutar-busqueda');
    const resultadosBusqueda = document.getElementById('resultados-busqueda');

    // 1. Cargar los datos del perfil desde MySQL
    async function cargarPerfil() {
        try {
            const res = await fetch('/api/perfil');
            const data = await res.json();

            if (data.ok && data.usuario) {
                const u = data.usuario;

                if (displayNombre) displayNombre.textContent = u.nombre || 'Misionero GREENUP';
                if (displayEmail) displayEmail.textContent = u.email || 'usuario@greenup.org';
                if (displayBio) displayBio.textContent = u.bio || '¡Hola! Soy parte de GREENUP reduciendo la huella de carbono.';
                if (displayUbicacion) displayUbicacion.textContent = u.ubicacion || 'No especificada';
                if (displayFecha) displayFecha.textContent = u.fecha_registro || '2024';

                if (profileLevel) profileLevel.textContent = u.nivel || 1;
                if (profileExp) profileExp.textContent = u.experiencia || 0;
                if (profileMissions) profileMissions.textContent = u.misiones_completadas || 0;

                if (u.avatar_url && profileAvatarImg) profileAvatarImg.src = u.avatar_url;
                if (u.banner_url && bannerContainer) bannerContainer.style.backgroundImage = `url('${u.banner_url}')`;

                if (inputNombre) inputNombre.value = u.nombre || '';
                if (inputUbicacion) inputUbicacion.value = u.ubicacion || '';
                if (inputBio) inputBio.value = u.bio || '';
            } else {
                mostrarAlerta(data.message || 'Error al obtener datos del perfil.', 'danger');
            }
        } catch (e) {
            mostrarAlerta('No se pudieron obtener los datos del perfil desde el servidor.', 'danger');
        }
    }

    // 2. Alternar entre Modo Vista y Modo Edición
    if (btnToggleEdit) {
        btnToggleEdit.addEventListener('click', () => {
            const estaEnEdicion = !editMode.classList.contains('d-none');
            if (estaEnEdicion) {
                ocultarEdicion();
            } else {
                mostrarEdicion();
            }
        });
    }

    if (btnCancelEdit) btnCancelEdit.addEventListener('click', ocultarEdicion);

    function mostrarEdicion() {
        if (viewMode) viewMode.classList.add('d-none');
        if (editMode) editMode.classList.remove('d-none');
        if (btnToggleEdit) btnToggleEdit.classList.replace('btn-outline-success', 'btn-success');
    }

    function ocultarEdicion() {
        if (editMode) editMode.classList.add('d-none');
        if (viewMode) viewMode.classList.remove('d-none');
        if (btnToggleEdit) btnToggleEdit.classList.replace('btn-success', 'btn-outline-success');
    }

    // 3. Guardar cambios de texto (Nombre, Ubicación, Biografía)
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const datosActualizados = {
                nombre: inputNombre.value.trim(),
                ubicacion: inputUbicacion.value.trim(),
                bio: inputBio.value.trim()
            };

            try {
                const res = await fetch('/api/perfil/actualizar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosActualizados)
                });

                const data = await res.json();

                if (data.ok) {
                    mostrarAlerta('¡Perfil actualizado con éxito! 🎉', 'success');
                    if (displayNombre) displayNombre.textContent = datosActualizados.nombre;
                    if (displayUbicacion) displayUbicacion.textContent = datosActualizados.ubicacion || 'No especificada';
                    if (displayBio) displayBio.textContent = datosActualizados.bio || '¡Hola! Soy parte de GREENUP...';
                    ocultarEdicion();
                } else {
                    mostrarAlerta(data.message || 'Error al guardar los datos.', 'danger');
                }
            } catch (err) {
                mostrarAlerta('Error de conexión al intentar guardar los datos.', 'danger');
            }
        });
    }

    // 4. Subir y cambiar el Banner de Portada
    if (bannerFileInput) {
        bannerFileInput.addEventListener('change', async () => {
            const file = bannerFileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('banner', file);

            try {
                const res = await fetch('/api/perfil/banner', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (data.ok) {
                    if (bannerContainer) bannerContainer.style.backgroundImage = `url('${data.banner_url}')`;
                    mostrarAlerta('¡Imagen de portada actualizada!', 'success');
                } else {
                    mostrarAlerta(data.message || 'No se pudo subir la portada.', 'danger');
                }
            } catch (err) {
                mostrarAlerta('Error al intentar cambiar el banner.', 'danger');
            }
        });
    }

    // 5. Subir y cambiar el Avatar
    if (avatarFileInput) {
        avatarFileInput.addEventListener('change', async () => {
            const file = avatarFileInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const res = await fetch('/api/perfil/avatar', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (data.ok) {
                    if (profileAvatarImg) profileAvatarImg.src = data.avatar_url;
                    const navAvatar = document.getElementById('user-avatar');
                    if (navAvatar) navAvatar.src = data.avatar_url;

                    mostrarAlerta('¡Foto de perfil actualizada!', 'success');
                } else {
                    mostrarAlerta(data.message || 'Error al actualizar la foto.', 'danger');
                }
            } catch (err) {
                mostrarAlerta('Error de conexión al cambiar el avatar.', 'danger');
            }
        });
    }

    // ============================================================
    // GESTIÓN DE AMIGOS
    // ============================================================

    async function cargarAmigos() {
        if (!amigosLista) return;
        try {
            const res = await fetch('/api/amigos');
            const data = await res.json();

            if (data.ok) {
                if (data.amigos.length === 0) {
                    amigosLista.innerHTML = `<p class="text-muted col-12 mb-0">Aún no agregaste ningún amigo. ¡Usá el botón de arriba para buscar integrantes!</p>`;
                    return;
                }

                amigosLista.innerHTML = data.amigos.map(a => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card bg-light border-0 p-3 h-100 d-flex flex-row align-items-center justify-content-between shadow-sm">
                            <div class="d-flex align-items-center gap-3 overflow-hidden">
                                <img src="${a.avatar_url || 'imagenes/default-avatar.png'}" class="rounded-circle shadow-sm" style="width: 50px; height: 50px; object-fit: cover;">
                                <div class="text-truncate">
                                    <h6 class="fw-bold mb-0 text-truncate">${a.nombre}</h6>
                                    <span class="badge bg-success small">Nivel ${a.nivel}</span>
                                    <span class="text-muted small ms-1">${a.experiencia} XP</span>
                                </div>
                            </div>
                            <div class="d-flex flex-column gap-1 ms-2">
                                <button class="btn btn-outline-success btn-sm btn-ver-perfil" data-id="${a.id}" title="Ver Perfil">
                                    <i class="bi bi-eye-fill"></i>
                                </button>
                                <button class="btn btn-outline-danger btn-sm btn-eliminar-amigo" data-id="${a.id}" title="Eliminar Amigo">
                                    <i class="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.btn-ver-perfil').forEach(btn => {
                    btn.addEventListener('click', () => verPerfilPublico(btn.dataset.id));
                });

                document.querySelectorAll('.btn-eliminar-amigo').forEach(btn => {
                    btn.addEventListener('click', () => eliminarAmigo(btn.dataset.id));
                });
            }
        } catch (err) {
            amigosLista.innerHTML = `<p class="text-danger col-12">Error al cargar lista de amigos.</p>`;
        }
    }

    async function buscarUsuarios() {
        const query = inputBuscarAmigo.value.trim();
        if (!query) return;

        try {
            const res = await fetch(`/api/amigos/buscar?q=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (data.ok) {
                if (data.resultados.length === 0) {
                    resultadosBusqueda.innerHTML = `<p class="text-muted text-center my-3">No se encontraron usuarios con esa búsqueda.</p>`;
                    return;
                }

                resultadosBusqueda.innerHTML = data.resultados.map(u => `
                    <div class="list-group-item d-flex align-items-center justify-content-between p-2">
                        <div class="d-flex align-items-center gap-2">
                            <img src="${u.avatar_url || 'imagenes/default-avatar.png'}" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">
                            <div>
                                <strong class="d-block leading-tight">${u.nombre}</strong>
                                <small class="text-muted">Nivel ${u.nivel}</small>
                            </div>
                        </div>
                        ${u.es_amigo ? 
                            `<span class="badge bg-secondary">Ya es tu amigo</span>` : 
                            `<button class="btn btn-success btn-sm btn-agregar-amigo" data-id="${u.id}"><i class="bi bi-person-plus-fill"></i> Agregar</button>`
                        }
                    </div>
                `).join('');

                document.querySelectorAll('.btn-agregar-amigo').forEach(btn => {
                    btn.addEventListener('click', () => agregarAmigo(btn.dataset.id));
                });
            }
        } catch (err) {
            resultadosBusqueda.innerHTML = `<p class="text-danger text-center my-3">Error en la búsqueda.</p>`;
        }
    }

    if (btnEjecutarBusqueda) btnEjecutarBusqueda.addEventListener('click', buscarUsuarios);
    if (inputBuscarAmigo) {
        inputBuscarAmigo.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') buscarUsuarios();
        });
    }

    async function agregarAmigo(amigoId) {
        try {
            const res = await fetch('/api/amigos/agregar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amigo_id: parseInt(amigoId) })
            });

            const data = await res.json();
            if (data.ok) {
                mostrarAlerta('¡Amigo agregado con éxito!', 'success');
                buscarUsuarios();
                cargarAmigos();
            } else {
                mostrarAlerta(data.message || 'No se pudo agregar.', 'danger');
            }
        } catch (err) {
            mostrarAlerta('Error de conexión al agregar amigo.', 'danger');
        }
    }

    async function eliminarAmigo(amigoId) {
        if (!confirm('¿Seguro que querés eliminar a este amigo?')) return;

        try {
            const res = await fetch('/api/amigos/eliminar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amigo_id: parseInt(amigoId) })
            });

            const data = await res.json();
            if (data.ok) {
                mostrarAlerta('Amigo eliminado.', 'info');
                cargarAmigos();
            }
        } catch (err) {
            mostrarAlerta('Error al eliminar amigo.', 'danger');
        }
    }

    async function verPerfilPublico(userId) {
        try {
            const res = await fetch(`/api/perfil/${userId}`);
            const data = await res.json();

            if (data.ok && data.usuario) {
                const u = data.usuario;
                document.getElementById('public-nombre').textContent = u.nombre || 'Usuario';
                document.getElementById('public-nivel').textContent = `Nivel ${u.nivel || 1}`;
                document.getElementById('public-bio').textContent = u.bio ? `"${u.bio}"` : '"Sin biografía aún."';
                document.getElementById('public-ubicacion').textContent = u.ubicacion || 'No especificada';
                document.getElementById('public-exp').textContent = `${u.experiencia || 0} XP`;
                document.getElementById('public-misiones').textContent = u.misiones_completadas || 0;
                document.getElementById('public-registro').textContent = u.fecha_registro || 'Desconocida';

                const avatarEl = document.getElementById('public-avatar');
                if (avatarEl) avatarEl.src = u.avatar_url || 'imagenes/default-avatar.png';

                const bannerEl = document.getElementById('public-banner');
                if (bannerEl) {
                    if (u.banner_url) {
                        bannerEl.style.backgroundImage = `url('${u.banner_url}')`;
                    } else {
                        bannerEl.style.backgroundImage = 'none';
                        bannerEl.style.backgroundColor = '#2e7d32';
                    }
                }

                const modal = new bootstrap.Modal(document.getElementById('modalPerfilPublico'));
                modal.show();
            }
        } catch (err) {
            mostrarAlerta('No se pudo cargar el perfil público.', 'danger');
        }
    }

    function mostrarAlerta(mensaje, tipo) {
        if (!alertBox) return;
        alertBox.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
        alertBox.innerHTML = `${mensaje} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        alertBox.classList.remove('d-none');
    }

    // Carga inicial
    cargarPerfil();
    cargarAmigos();
});