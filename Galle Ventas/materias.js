// Materias Primas Module

const viewMaterias = document.getElementById('view-materias');

// Render the view
function renderMaterias() {
    let html = `
        <div class="card">
 
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
                Aquí puedes gestionar todos los materiales que usas, incluyendo el valor de tu mano de obra.
            </p>
            <button class="btn-primary" onclick="openMateriaModal()">
                <i class="fa-solid fa-plus"></i> Agregar Material
            </button>
        </div>
        <div class="materias-list">
    `;

    const materias = window.appState.materiasPrimas;

    if (materias.length === 0) {
        html += `<div class="card"><p style="text-align:center; color: var(--text-muted);">No hay materiales registrados.</p></div>`;
    } else {
        materias.forEach(m => {
            let badges = '';
            if(m.esManoDeObra) badges += '<span style="background: var(--accent); padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; color: #fff; font-weight: bold; margin-left: 5px;">Mano de Obra</span>';
            if(m.esArte) badges += '<span style="background: #e6e6fa; padding: 2px 8px; border-radius: 10px; font-size: 0.7rem; color: var(--primary-dark); font-weight: bold; margin-left: 5px;">🎨 Arte</span>';
            
            html += `
                <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px;">
                    <div style="text-align: left;">
                        <div style="font-weight: 800; color: var(--text-main); font-size: 1.1rem;">
                            ${m.nombre} ${badges}
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">
                            $${parseFloat(m.costo).toFixed(2)} mxn por ${m.unidad}
                        </div>
                    </div>
                    <div>
                        <button onclick="openMateriaModal('${m.id}')" style="background:none; border:none; color: var(--secondary); font-size: 1.2rem; cursor: pointer; padding: 5px;">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onclick="deleteMateria('${m.id}')" style="background:none; border:none; color: var(--danger); font-size: 1.2rem; cursor: pointer; padding: 5px;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    viewMaterias.innerHTML = html;
}

// Open Modal
window.openMateriaModal = function(id = null) {
    let materia = { nombre: '', unidad: 'pza', costo: '', esManoDeObra: false, esArte: false };
    if (id) {
        materia = window.appState.materiasPrimas.find(m => m.id === id);
    }

    const modalHtml = `
        <div class="form-header" style="margin-bottom: 20px; text-align: center;">
            <h2 style="color: var(--primary-dark);">${id ? 'Editar' : 'Nuevo'} Material</h2>
        </div>
        <div class="form-group">
            <label>Nombre del Material / Labor</label>
            <input type="text" id="mat-nombre" value="${materia.nombre}" placeholder="Ej. Papel Fotográfico" />
        </div>
        <div class="form-group">
            <label>Unidad de Medida</label>
            <select id="mat-unidad">
                <option value="pza" ${materia.unidad === 'pza' ? 'selected' : ''}>Pieza (pza)</option>
                <option value="unidad" ${materia.unidad === 'unidad' ? 'selected' : ''}>Unidad (ud)</option>
                <option value="hoja" ${materia.unidad === 'hoja' ? 'selected' : ''}>Hoja (hoja)</option>
                <option value="ml" ${materia.unidad === 'ml' ? 'selected' : ''}>Mililitros (ml)</option>
                <option value="g" ${materia.unidad === 'g' ? 'selected' : ''}>Gramos (g)</option>
                <option value="cm" ${materia.unidad === 'cm' ? 'selected' : ''}>Centímetros (cm)</option>
                <option value="min" ${materia.unidad === 'min' ? 'selected' : ''}>Minuto (min) - Usar para Mano de Obra</option>
                <option value="hr" ${materia.unidad === 'hr' ? 'selected' : ''}>Hora (hr) - Usar para Mano de Obra</option>
            </select>
        </div>
        <div class="form-group">
            <label>Costo por Unidad ($ MXN)</label>
            <input type="number" id="mat-costo" value="${materia.costo}" step="0.01" placeholder="Ej. 2.50" />
        </div>
        <div class="form-group" style="flex-direction: row; align-items: center; gap: 10px;">
            <input type="checkbox" id="mat-esManoDeObra" ${materia.esManoDeObra ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--primary);" />
            <label style="margin: 0;">¿Es Mano de Obra?</label>
        </div>
        <div class="form-group" style="flex-direction: row; align-items: center; gap: 10px;">
            <input type="checkbox" id="mat-esArte" ${materia.esArte ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--secondary);" />
            <label style="margin: 0;">¿Es un Arte? (Se calcula por unidad en productos)</label>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 25px;">
            <button class="btn-danger" style="flex: 1; background: #eee; color: var(--text-main);" onclick="window.closeModal()">Cancelar</button>
            <button class="btn-primary" style="flex: 1;" onclick="saveMateria('${id || ''}')">Guardar</button>
        </div>
    `;

    window.openModal(modalHtml);
};

// Save Materia
window.saveMateria = function(id) {
    const nombre = document.getElementById('mat-nombre').value.trim();
    const unidad = document.getElementById('mat-unidad').value;
    const costo = parseFloat(document.getElementById('mat-costo').value);
    const esManoDeObra = document.getElementById('mat-esManoDeObra').checked;
    const esArte = document.getElementById('mat-esArte').checked;

    if (!nombre || isNaN(costo)) {
        alert('Por favor ingresa un nombre y un costo válido.');
        return;
    }

    const nuevaMateria = {
        id: id || window.generateId(),
        nombre,
        unidad,
        costo,
        esManoDeObra,
        esArte
    };

    if (id) {
        const index = window.appState.materiasPrimas.findIndex(m => m.id === id);
        if (index > -1) window.appState.materiasPrimas[index] = nuevaMateria;
    } else {
        window.appState.materiasPrimas.push(nuevaMateria);
    }

    DB.save(window.appState);
    window.closeModal();
    renderMaterias();
};

// Delete Materia
window.deleteMateria = function(id) {
    if (confirm('¿Estás segura de eliminar este material?')) {
        window.appState.materiasPrimas = window.appState.materiasPrimas.filter(m => m.id !== id);
        DB.save(window.appState);
        renderMaterias();
    }
};

// Listen to navigation events to render
document.addEventListener('view-view-materias', renderMaterias);
