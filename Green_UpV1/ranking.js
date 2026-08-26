document.addEventListener('DOMContentLoaded', async () => {
    const cuerpo = document.getElementById('ranking-body');
    if (!cuerpo) return;

    try {
        const res = await fetch('/api/ranking');
        const data = await res.json();

        if (!data.ok || !data.ranking || data.ranking.length === 0) {
            cuerpo.innerHTML = '<tr><td colspan="4" class="text-center">Todavía no hay usuarios registrados.</td></tr>';
            return;
        }

        cuerpo.innerHTML = '';
        data.ranking.forEach((usuario, index) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${index + 1}</td>
                <td>${usuario.nombre}</td>
                <td>${usuario.nivel}</td>
                <td>${usuario.experiencia}</td>
            `;
            cuerpo.appendChild(fila);
        });
    } catch (e) {
        cuerpo.innerHTML = '<tr><td colspan="4" class="text-center">No se pudo cargar el ranking.</td></tr>';
    }
});