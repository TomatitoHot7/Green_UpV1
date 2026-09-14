document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements - Ranking Table Body
    const cuerpo = document.getElementById('ranking-body');
    if (!cuerpo) return;

    try {
        // Fetch ranking data from the server API
        const res = await fetch('/api/ranking');
        const data = await res.json();

        // Validate if the ranking data is empty or invalid
        if (!data.ok || !data.ranking || data.ranking.length === 0) {
            cuerpo.innerHTML = '<tr><td colspan="4" class="text-center">Todavía no hay usuarios registrados.</td></tr>';
            return;
        }

        // Clear previous content and populate ranking rows dynamically
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
        // Handle connection or parsing errors gracefully
        cuerpo.innerHTML = '<tr><td colspan="4" class="text-center">No se pudo cargar el ranking.</td></tr>';
    }
});
