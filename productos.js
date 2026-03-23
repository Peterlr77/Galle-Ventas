// Productos Module

const viewProductos = document.getElementById('view-productos');

// Render
function renderProductos() {
    let html = `
        <div class="card">
 
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
                Crea productos definiendo sus materiales, tiempo de producción y costos fijos.
            </p>
            <button class="btn-primary" onclick="openProductoModal()">
                <i class="fa-solid fa-plus"></i> Añadir Producto
            </button>
        </div>
        <div class="productos-list">
    `;

    const productos = window.appState.productos;

    if (productos.length === 0) {
        html += `<div class="card"><p style="text-align:center; color: var(--text-muted);">No hay productos registrados.</p></div>`;
    } else {
        productos.forEach(p => {
            const matIds = Object.keys(p.receta);
            const numMaterials = matIds.length;
            
            html += `
                <div class="card" style="text-align: left; padding: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <div style="font-weight: 800; color: var(--text-main); font-size: 1.2rem;">${p.nombre}</div>
                            <div style="color: var(--text-muted); font-size: 0.8rem;">
                                ${numMaterials} materias primas
                            </div>
                        </div>
                        <div>
                            <button onclick="openProductoModal('${p.id}')" style="background:none; border:none; color: var(--secondary); font-size: 1.2rem; cursor: pointer; padding: 5px;">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button onclick="deleteProducto('${p.id}')" style="background:none; border:none; color: var(--danger); font-size: 1.2rem; cursor: pointer; padding: 5px;">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div style="background: #fafafa; padding: 10px; border-radius: 10px; border: 1px solid #eee; margin-top: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px;">
                            <span>Costo Materiales:</span> <strong>$${(p.costoMateriales || 0).toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px;">
                            <span>Mano de Obra:</span> <strong>$${(p.costoManoDeObra || 0).toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px;">
                            <span>Arte:</span> <strong>$${(p.costoArte || 0).toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 5px;">
                            <span>Costo Operativo:</span> <strong>$${(p.costoOperativo || 0).toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 1rem; margin-top: 8px; border-top: 1px dotted #ccc; padding-top: 5px; color: var(--primary-dark);">
                            <strong>Costo Producción:</strong> <strong>$${(p.costoProduccion || 0).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    viewProductos.innerHTML = html;
}

// Modal State Variables
let currentReceta = {}; // { materiaId: cantidad }

window.openProductoModal = function(id = null) {
    let prod = { nombre: '', costoOperativo: 0, tiempoProduccion: 0, arteCant: 1 };
    currentReceta = {};
    
    if (id) {
        const found = window.appState.productos.find(p => p.id === id);
        if (found) {
            prod = { ...found };
            currentReceta = { ...found.receta };
        }
    }

    renderProductoModalContent(id, prod);
};

window.renderProductoModalContent = function(id, prod) {
    const materiasNormales = window.appState.materiasPrimas.filter(m => !m.esManoDeObra && !m.esArte);
    const materiasLabor = window.appState.materiasPrimas.filter(m => m.esManoDeObra);
    const materiasArte = window.appState.materiasPrimas.filter(m => m.esArte);
    
    let html = `
        <div class="form-header" style="margin-bottom: 20px; text-align: center;">
            <h2 style="color: var(--primary-dark);">${id ? 'Editar' : 'Nuevo'} Producto</h2>
        </div>
        <div class="form-group">
            <label>Nombre del Producto</label>
            <input type="text" id="prod-nombre" value="${prod.nombre}" placeholder="Ej. Libreta Kawaii A5" />
        </div>
        
        <div style="margin: 20px 0; border-top: 2px dashed #eee; padding-top: 15px;">
            <h3 style="color: var(--text-main); font-size: 1.1rem; margin-bottom: 10px;">1. Materias Primas</h3>
    `;
    
    // Receta Builder
    const recetaIds = Object.keys(currentReceta);
    if(recetaIds.length > 0) {
        html += `<div style="background: #f0fff0; border-radius: 10px; padding: 10px; margin-bottom: 15px;">`;
        recetaIds.forEach(mId => {
            const mData = window.appState.materiasPrimas.find(m => m.id === mId);
            if(mData) {
                const subtotal = (mData.costo * currentReceta[mId]).toFixed(2);
                html += `
                    <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 5px; border-bottom: 1px solid #d4fcd4; padding-bottom: 5px;">
                        <div style="font-size: 0.85rem;">
                            <strong>${mData.nombre}</strong><br>
                            ${currentReceta[mId]} ${mData.unidad} ($${subtotal})
                        </div>
                        <button onclick="removeMateriaFromReceta('${mId}', '${id}')" style="background:none; border:none; color: var(--danger); font-size: 1rem; padding:5px;"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `;
            }
        });
        html += `</div>`;
    }

    if(materiasNormales.length > 0) {
        html += `
            <div style="display: flex; gap: 5px;">
                <select id="prod-add-mat-id" style="flex: 2; padding: 8px;">
                    ${materiasNormales.map(m => `<option value="${m.id}">${m.nombre} ($${m.costo}/${m.unidad})</option>`).join('')}
                </select>
                <input type="number" id="prod-add-mat-cant" style="flex: 1; padding: 8px;" placeholder="Cant." step="0.01" />
                <button onclick="addMateriaToReceta('${id || ''}')" class="btn-primary" style="flex: 1; padding: 8px;">Añadir</button>
            </div>
        `;
    } else {
        html += `<p style="font-size:0.8rem; color: var(--danger);">No hay materiales registrados. Ve a Materias Primas primero.</p>`;
    }

    html += `
        </div>
        <div style="margin: 20px 0; border-top: 2px dashed #eee; padding-top: 15px;">
            <h3 style="color: var(--text-main); font-size: 1.1rem; margin-bottom: 10px;">2. Mano de Obra</h3>
            <div class="form-group">
                <label>Tiempo de Producción (minutos) Mínimo:0</label>
                <input type="number" id="prod-tiempo" value="${prod.tiempoProduccion}" min="0" step="1" />
            </div>
            <div class="form-group">
                <label>Tarifa de Mano de Obra (Asociada)</label>
                <select id="prod-labor-id">
                    <option value="">Selecciona (Opcional)</option>
                    ${materiasLabor.map(m => `<option value="${m.id}" ${prod.laborId === m.id ? 'selected' : ''}>${m.nombre} ($${m.costo}/${m.unidad})</option>`).join('')}
                </select>
            </div>
        </div>

        <div style="margin: 20px 0; border-top: 2px dashed #eee; padding-top: 15px;">
            <h3 style="color: var(--text-main); font-size: 1.1rem; margin-bottom: 10px;">3. Arte</h3>
            <div class="form-group">
                <label>Unidades de Arte (ej. 1 ud)</label>
                <input type="number" id="prod-arte-cant" value="${prod.arteCant !== undefined ? prod.arteCant : 1}" min="0" step="0.01" />
            </div>
            <div class="form-group">
                <label>Arte Aplicado</label>
                <select id="prod-arte-id">
                    <option value="">Ninguno</option>
                    ${materiasArte.map(m => `<option value="${m.id}" ${prod.arteId === m.id ? 'selected' : ''}>${m.nombre} ($${m.costo}/${m.unidad})</option>`).join('')}
                </select>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Asocia 1 de los artes que registraste en Materias Primas.</span>
            </div>
        </div>

        <div style="margin: 20px 0; border-top: 2px dashed #eee; padding-top: 15px;">
            <h3 style="color: var(--text-main); font-size: 1.1rem; margin-bottom: 10px;">4. Costo Operativo</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">Aquí incluye parte del desgaste de tus herramientas, luz, etc.</p>
            <div class="form-group">
                <label>Costo Operativo Fijo ($ MXN)</label>
                <input type="number" id="prod-costo-op" value="${prod.costoOperativo}" step="0.01" />
            </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 25px;">
            <button class="btn-danger" style="flex: 1; background: #eee; color: var(--text-main);" onclick="window.closeModal()">Cancelar</button>
            <button class="btn-primary" style="flex: 1;" onclick="saveProducto('${id || ''}')">Guardar</button>
        </div>
    `;

    window.openModal(html);
};

// Receta modifications
window.addMateriaToReceta = function(id) {
    // Save current typed progress
    const prod = getCurrentModalState();
    
    const mId = document.getElementById('prod-add-mat-id').value;
    const cant = parseFloat(document.getElementById('prod-add-mat-cant').value);

    if(!mId || isNaN(cant) || cant <= 0) return;

    if(currentReceta[mId]) {
        currentReceta[mId] += cant;
    } else {
        currentReceta[mId] = cant;
    }
    
    renderProductoModalContent(id, prod);
};

window.removeMateriaFromReceta = function(mId, id) {
    const prod = getCurrentModalState();
    delete currentReceta[mId];
    renderProductoModalContent(id, prod);
};

function getCurrentModalState() {
    return {
        nombre: document.getElementById('prod-nombre') ? document.getElementById('prod-nombre').value : '',
        tiempoProduccion: document.getElementById('prod-tiempo') ? parseFloat(document.getElementById('prod-tiempo').value) || 0 : 0,
        laborId: document.getElementById('prod-labor-id') ? document.getElementById('prod-labor-id').value : '',
        arteId: document.getElementById('prod-arte-id') ? document.getElementById('prod-arte-id').value : '',
        arteCant: document.getElementById('prod-arte-cant') ? parseFloat(document.getElementById('prod-arte-cant').value) || 0 : 0,
        costoOperativo: document.getElementById('prod-costo-op') ? parseFloat(document.getElementById('prod-costo-op').value) || 0 : 0
    };
}

// Save Product
window.saveProducto = function(id) {
    const prod = getCurrentModalState();
    
    if (!prod.nombre) {
        alert('Ingresa el nombre del producto.');
        return;
    }

    // Calcular Costo Materiales
    let costoMateriales = 0;
    Object.keys(currentReceta).forEach(mId => {
        const m = window.appState.materiasPrimas.find(x => x.id === mId);
        if(m) {
            costoMateriales += m.costo * currentReceta[mId];
        }
    });

    // Calcular Costo Mano de Obra
    let costoManoDeObra = 0;
    if(prod.laborId && prod.tiempoProduccion > 0) {
        const labor = window.appState.materiasPrimas.find(x => x.id === prod.laborId);
        if(labor) {
            // Asumimos que la unidad de labor es "min" (minutos)
            let factor = 1;
            if(labor.unidad === 'hr') factor = 1/60; // Si el costo está en hrs, 60 mins = 1 hr
            costoManoDeObra = labor.costo * prod.tiempoProduccion * factor;
        }
    }

    // Calcular Costo de Arte
    let costoArte = 0;
    if(prod.arteId && prod.arteCant > 0) {
        const arte = window.appState.materiasPrimas.find(x => x.id === prod.arteId);
        if(arte) {
            costoArte = arte.costo * prod.arteCant;
        }
    }

    const costoProduccion = costoMateriales + costoManoDeObra + costoArte + prod.costoOperativo;

    const productoFinal = {
        id: id || window.generateId(),
        nombre: prod.nombre,
        receta: currentReceta,
        tiempoProduccion: prod.tiempoProduccion,
        laborId: prod.laborId,
        arteId: prod.arteId,
        arteCant: prod.arteCant,
        costoMateriales,
        costoManoDeObra,
        costoArte,
        costoOperativo: prod.costoOperativo,
        costoProduccion,
        // Mantener precios si era edicion
        precioVenta: 0,
        utilidad: 0
    };

    if (id) {
        const index = window.appState.productos.findIndex(p => p.id === id);
        if (index > -1) {
            productoFinal.precioVenta = window.appState.productos[index].precioVenta || 0;
            // update utility based on old price
            if(productoFinal.precioVenta > 0) {
                productoFinal.utilidad = productoFinal.precioVenta - productoFinal.costoProduccion;
            }
            window.appState.productos[index] = productoFinal;
        } else {
            // Failsafe push if index is magically -1
            window.appState.productos.push(productoFinal);
        }
    } else {
        window.appState.productos.push(productoFinal);
    }

    DB.save(window.appState);
    window.closeModal();
    renderProductos();
};

window.deleteProducto = function(id) {
    if (confirm('¿Estás segura de eliminar este producto?')) {
        window.appState.productos = window.appState.productos.filter(p => p.id !== id);
        DB.save(window.appState);
        renderProductos();
    }
};

document.addEventListener('view-view-productos', renderProductos);
