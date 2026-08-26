document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('misiones-container');
    if (!contenedor) return;

    const evidenciaModalEl = document.getElementById('evidenciaModal');
    const evidenciaModal = new bootstrap.Modal(evidenciaModalEl);
    const evidenciaDescripcion = document.getElementById('evidencia-mision-descripcion');
    const evidenciaTexto = document.getElementById('evidencia-texto');
    const evidenciaError = document.getElementById('evidencia-error');
    const evidenciaConfirmar = document.getElementById('evidencia-confirmar');
    const limiteDiarioAlert = document.getElementById('limite-diario-alert');
    const maxDiarioTexto = document.getElementById('max-diario-texto');

    let misionSeleccionada = null;
    let limiteAlcanzado = false;

    function badgeCategoria(categoria) {
        return `<span class="badge bg-secondary mb-2">${categoria}</span>`;
    }

    function crearTarjeta(mision) {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-4 animate__animated animate__fadeInUp';

        const completada = mision.completada;
        const botonDeshabilitado = completada || limiteAlcanzado;

        col.innerHTML = `
            <div class="card mission-card shadow-sm h-100">
                <div class="card-body d-flex flex-column justify-content-between">
                    <div>
                        ${badgeCategoria(mision.categoria)}
                        <h3 class="card-title h6">${mision.descripcion} <span class="badge bg-info text-dark mission-exp">${mision.xp}xp</span></h3>
                    </div>
                    <button type="button"
                        class="btn ${completada ? 'btn-secondary' : 'btn-success'} mt-3 btn-completar-mision"
                        data-id="${mision.id}"
                        ${botonDeshabilitado ? 'disabled' : ''}>
                        ${completada ? '¡Completada! ✔' : 'Completar'}
                    </button>
                </div>
            </div>
        `;

        const boton = col.querySelector('.btn-completar-mision');
        if (!completada) {
            boton.addEventListener('click', () => abrirModalEvidencia(mision));
        }

        return col;
    }

    function abrirModalEvidencia(mision) {
        misionSeleccionada = mision;
        evidenciaDescripcion.textContent = `${mision.descripcion} (${mision.xp} xp)`;
        evidenciaTexto.value = '';
        evidenciaError.style.display = 'none';
        evidenciaError.textContent = '';
        evidenciaModal.show();
    }

    async function cargarMisiones() {
        try {
            const res = await fetch('/api/misiones');
            const data = await res.json();

            if (!data.ok) {
                contenedor.innerHTML = '<div class="col-12 text-center"><p>No se pudieron cargar las misiones.</p></div>';
                return;
            }

            limiteAlcanzado = data.limite_alcanzado;
            maxDiarioTexto.textContent = data.max_diario;

            if (limiteAlcanzado) {
                limiteDiarioAlert.textContent = `Ya completaste tus ${data.max_diario} misiones de hoy. ¡Volvé mañana por más!`;
                limiteDiarioAlert.classList.remove('d-none');
            } else {
                limiteDiarioAlert.classList.add('d-none');
            }

            contenedor.innerHTML = '';
            data.misiones.forEach(mision => {
                contenedor.appendChild(crearTarjeta(mision));
            });
        } catch (e) {
            contenedor.innerHTML = '<div class="col-12 text-center"><p>No se pudo conectar con el servidor.</p></div>';
        }
    }

    evidenciaConfirmar.addEventListener('click', async () => {
        if (!misionSeleccionada) return;
        const evidencia = evidenciaTexto.value.trim();

        evidenciaConfirmar.disabled = true;
        try {
            const res = await fetch('/api/completar_mision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mision_id: misionSeleccionada.id, evidencia })
            });
            const data = await res.json();

            if (!data.ok) {
                evidenciaError.textContent = data.message || 'No se pudo completar la misión.';
                evidenciaError.style.display = 'block';
                evidenciaConfirmar.disabled = false;
                return;
            }

            evidenciaModal.hide();

            if (window.refrescarProgreso) {
                window.refrescarProgreso(data.nivel, data.experiencia, data.subio_nivel);
            }

            await cargarMisiones();
        } catch (e) {
            evidenciaError.textContent = 'No se pudo conectar con el servidor.';
            evidenciaError.style.display = 'block';
        } finally {
            evidenciaConfirmar.disabled = false;
        }
    });

    cargarMisiones();
});