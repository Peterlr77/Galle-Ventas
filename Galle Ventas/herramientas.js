// Herramientas Operativas Module

const viewHerramientas = document.getElementById('view-herramientas');

// Render the view
function renderHerramientas() {
    const herramientas = window.appState.herramientas || [];
    const inversionTotal = herramientas.reduce((acc, h) => acc + h.costoInversion, 0);
    const inversionRecuperada = window.appState.inversionRecuperada || 0;
    
    const recuperadaPlot = Math.min(inversionRecuperada, inversionTotal);
    const porcentaje = inversionTotal > 0 ? (recuperadaPlot / inversionTotal) * 100 : 0;
    
    let html = `
        <div class="card" style="text-align: center;">
 
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
                Registra tus herramientas. Tu inversión se recupera con cada venta usando los costos operativos.
            </p>
            
            <div style="background: #fafafa; padding: 15px; border-radius: 10px; border: 1px solid #eee; margin-bottom: 15px;">
                <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase;">Inversión Total vs Recuperada</div>
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin: 10px 0;">
                    <div style="font-weight: 800; font-size: 1.2rem; color: var(--primary-dark);">$${inversionTotal.toFixed(2)}</div>
                    <div style="font-weight: 900; font-size: 1.4rem; color: var(--success);">$${inversionRecuperada.toFixed(2)}</div>
                </div>
                <!-- Barra global -->
                <div style="background: #eee; border-radius: 10px; height: 12px; overflow: hidden; margin-top: 5px; position: relative;">
                    <div style="background: var(--success); height: 100%; width: ${porcentaje.toFixed(1)}%; max-width: 100%; transition: width 0.3s;"></div>
                </div>
                <div style="font-size: 0.75rem; text-align: right; color: var(--text-muted); margin-top: 5px;">
                    ${porcentaje.toFixed(1)}% Recuperado
                </div>
            </div>

            <button class="btn-primary" onclick="openHerramientaModal()">
                <i class="fa-solid fa-plus"></i> Agregar Herramienta
            </button>
        </div>
        <div class="herramientas-list">
    `;

    if (herramientas.length === 0) {
        html += `<div class="card"><p style="text-align:center; color: var(--text-muted);">No hay herramientas registradas.</p></div>`;
    } else {
        herramientas.forEach(h => {
            html += `
                <div class="card" style="text-align: left; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 800; color: var(--text-main); font-size: 1.1rem;">${h.nombre}</div>
                            <div style="color: var(--text-muted); font-size: 0.9rem;">Costo: $${parseFloat(h.costoInversion).toFixed(2)}</div>
                        </div>
                        <div>
                            <button onclick="openHerramientaModal('${h.id}')" style="background:none; border:none; color: var(--secondary); font-size: 1.2rem; cursor: pointer; padding: 5px;">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onclick="deleteHerramienta('${h.id}')" style="background:none; border:none; color: var(--danger); font-size: 1.2rem; cursor: pointer; padding: 5px;">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    viewHerramientas.innerHTML = html;
}

// Open Modal
window.openHerramientaModal = function(id = null) {
    let herr = { nombre: '', costoInversion: '' };
    if (id) {
        herr = window.appState.herramientas.find(h => h.id === id);
    }

    const modalHtml = `
        <div class="form-header" style="margin-bottom: 20px; text-align: center;">
            <h2 style="color: var(--primary-dark);">${id ? 'Editar' : 'Nueva'} Herramienta</h2>
        </div>
        <div class="form-group">
            <label>Nombre de Herramienta</label>
            <input type="text" id="herr-nombre" value="${herr.nombre}" placeholder="Ej. Impresora Epson" />
        </div>
        <div class="form-group">
            <label>Costo de Inversión ($ MXN)</label>
            <input type="number" id="herr-costo" value="${herr.costoInversion}" step="0.01" />
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 25px;">
            <button class="btn-danger" style="flex: 1; background: #eee; color: var(--text-main);" onclick="window.closeModal()">Cancelar</button>
            <button class="btn-primary" style="flex: 1;" onclick="saveHerramienta('${id || ''}')">Guardar</button>
        </div>
    `;

    window.openModal(modalHtml);
};

// Save
window.saveHerramienta = function(id) {
    const nombre = document.getElementById('herr-nombre').value.trim();
    const costoInversion = parseFloat(document.getElementById('herr-costo').value);

    if (!nombre || isNaN(costoInversion)) {
        alert('Por favor completa todos los campos correctamente.');
        return;
    }

    if (id) {
        const index = window.appState.herramientas.findIndex(h => h.id === id);
        if (index > -1) {
            window.appState.herramientas[index] = {
                ...window.appState.herramientas[index],
                nombre, costoInversion
            };
        }
    } else {
        window.appState.herramientas.push({
            id: window.generateId(),
            nombre,
            costoInversion
        });
    }

    DB.save(window.appState);
    window.closeModal();
    renderHerramientas();
};

// Delete
window.deleteHerramienta = function(id) {
    if (confirm('¿Estás segura de eliminar esta herramienta?')) {
        window.appState.herramientas = window.appState.herramientas.filter(h => h.id !== id);
        DB.save(window.appState);
        renderHerramientas();
    }
};

// Listen to navigation events to render
document.addEventListener('view-view-herramientas', renderHerramientas);
