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

    // 1. Cargar los datos del perfil desde MySQL
    async function cargarPerfil() {
        try {
            const res = await fetch('/api/perfil');
            const data = await res.json();

            if (data.ok && data.usuario) {
                const u = data.usuario;

                // Cargar datos de lectura
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

                // Precargar valores en los inputs de edición
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

    // 5. Subir y cambiar el Avatar (Foto de perfil)
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
                    
                    // Actualizar también el avatar del navbar si existe
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

    // Función auxiliar para desplegar alertas Bootstrap
    function mostrarAlerta(mensaje, tipo) {
        if (!alertBox) return;
        alertBox.className = `alert alert-${tipo} alert-dismissible fade show mt-3`;
        alertBox.innerHTML = `${mensaje} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
        alertBox.classList.remove('d-none');
    }

    // Carga inicial
    cargarPerfil();
});