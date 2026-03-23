// Menú de Precios Module

const viewPrecios = document.getElementById('view-precios');

function renderPrecios() {
    let html = `
        <div class="card">
 
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
                Define el precio de venta de tus productos. Verás tu utilidad descontando el costo de producción.
            </p>
        </div>
        <div class="precios-list">
    `;

    const productos = window.appState.productos;

    if (productos.length === 0) {
        html += `<div class="card"><p style="text-align:center; color: var(--text-muted);">No hay productos registrados.</p></div>`;
    } else {
        productos.forEach(p => {
            const pv = p.precioVenta || 0;
            const cp = p.costoProduccion || 0;
            const utilidad = pv - cp;
            const porcentaje = cp > 0 && pv > 0 ? ((utilidad / pv) * 100).toFixed(1) : 0;
            
            let colorUtilidad = 'var(--text-muted)';
            if (utilidad > 0) colorUtilidad = 'var(--success)';
            if (utilidad < 0) colorUtilidad = 'var(--danger)';

            html += `
                <div class="card" style="text-align: left; padding: 15px;">
                    <div style="font-weight: 800; color: var(--text-main); font-size: 1.1rem; margin-bottom: 10px;">
                        ${p.nombre}
                    </div>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="flex: 1; background: #fafafa; padding: 10px; border-radius: 10px; border: 1px solid #eee; text-align: center;">
                            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Costo Prod.</div>
                            <div style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">$${cp.toFixed(2)}</div>
                        </div>
                        <div style="flex: 1; background: #fffacd; padding: 10px; border-radius: 10px; border: 1px double #ffe4b5; text-align: center; cursor: pointer;" onclick="promptPrecio('${p.id}')">
                            <div style="font-size: 0.75rem; color: var(--accent); text-transform: uppercase;">Precio Venta <i class="fa-solid fa-pen"></i></div>
                            <div style="font-weight: 800; font-size: 1.1rem; color: #b8860b;">$${pv.toFixed(2)}</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #eee; padding-top: 10px;">
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Utilidad Neta:</div>
                        <div style="font-weight: 900; font-size: 1.2rem; color: ${colorUtilidad};">
                            $${utilidad.toFixed(2)} <span style="font-size: 0.8rem; font-weight: normal;">(${porcentaje}%)</span>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    viewPrecios.innerHTML = html;
}

window.promptPrecio = function(id) {
    const prodIndex = window.appState.productos.findIndex(p => p.id === id);
    if(prodIndex === -1) return;
    
    const prod = window.appState.productos[prodIndex];
    let sugerido = (prod.costoProduccion * 2).toFixed(2); // Sugerir el doble por defecto
    
    const html = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: var(--primary-dark);">Establecer Precio</h2>
            <p style="color: var(--text-muted); font-size: 0.9rem;">${prod.nombre}</p>
        </div>
        
        <div style="background: #fafafa; padding: 10px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">Tu costo de producción es:</p>
            <strong style="font-size: 1.2rem; color: var(--text-main);">$${prod.costoProduccion.toFixed(2)}</strong>
        </div>

        <div class="form-group">
            <label>Precio de Venta ($ MXN)</label>
            <input type="number" id="input-precio-venta" value="${prod.precioVenta > 0 ? prod.precioVenta : sugerido}" step="0.01" />
        </div>
        
        <div class="form-group" style="margin-top:20px; text-align:center;">
            <p style="font-size:0.8rem; color:var(--text-muted);" id="precio-preview"></p>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn-danger" style="flex: 1; background: #eee; color: var(--text-main);" onclick="window.closeModal()">Cancelar</button>
            <button class="btn-primary" style="flex: 1;" onclick="guardarPrecio('${id}')">Guardar</button>
        </div>
    `;
    
    window.openModal(html);
    
    // Auto calculate preview
    const input = document.getElementById('input-precio-venta');
    const preview = document.getElementById('precio-preview');
    
    const updatePreview = () => {
        const val = parseFloat(input.value) || 0;
        const ut = val - prod.costoProduccion;
        if(ut > 0) {
            preview.innerHTML = `Ganarás <strong style="color:var(--success)">$${ut.toFixed(2)}</strong> por venta.`;
        } else {
            preview.innerHTML = `<span style="color:var(--danger)">Estarás perdiendo dinero.</span>`;
        }
    };
    
    input.addEventListener('input', updatePreview);
    updatePreview();
};

window.guardarPrecio = function(id) {
    const val = parseFloat(document.getElementById('input-precio-venta').value);
    if(isNaN(val) || val <= 0) {
        alert("Ingresa un precio válido.");
        return;
    }
    
    const index = window.appState.productos.findIndex(p => p.id === id);
    if(index > -1) {
        window.appState.productos[index].precioVenta = val;
        window.appState.productos[index].utilidad = val - window.appState.productos[index].costoProduccion;
        DB.save(window.appState);
        window.closeModal();
        renderPrecios();
    }
};

document.addEventListener('view-view-precios', renderPrecios);
