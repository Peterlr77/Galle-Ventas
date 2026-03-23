// Ventas Module (POS)

const viewVentas = document.getElementById('view-ventas');

let posData = {
    mode: null, // 'libre' | 'evento'
    eventoNombre: '',
    eventoCosto: 0,
    cart: [] // { producto: obj, qty: num }
};

function renderVentas() {
    if (!posData.mode) {
        let html = `
            <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
                <button class="btn-primary" style="padding: 20px; font-size: 1.2rem; background: var(--primary-dark);" onclick="startPOS('libre')">
                    <i class="fa-solid fa-store"></i> Venta Libre
                </button>
                <button class="btn-primary" style="padding: 20px; font-size: 1.2rem; background: var(--secondary); color: var(--text-main);" onclick="startPOS('evento')">
                    <i class="fa-solid fa-tent"></i> Evento / Bazar
                </button>
            </div>
        `;
        viewVentas.innerHTML = html;
        return;
    }

    // POS Interface Active
    const totalVenta = posData.cart.reduce((acc, item) => acc + (item.producto.precioVenta * item.qty), 0);
    const totalItems = posData.cart.reduce((acc, item) => acc + item.qty, 0);

    const headerEl = document.querySelector('.app-header');
    if (headerEl) {
        headerEl.style.display = 'none';
    }

    let titleText = posData.mode === 'evento' ? '🎪 Evento / Bazar' : '🛍️ Venta Libre';
    
    let html = `
        <div style="position: sticky; top: -20px; margin-top: -20px; margin-left: -20px; margin-right: -20px; padding: 20px 20px 10px 20px; background: var(--bg-color); z-index: 10;">
            <div style="display: flex; align-items: center; justify-content: center; position: relative;">
                <button style="position: absolute; left: 0; background: transparent; border: none; font-size: 1.5rem; color: var(--primary-dark); cursor: pointer; padding: 5px;" onclick="cancelPOS()"><i class="fa-solid fa-arrow-left"></i></button>
                <h2 style="margin: 0; font-size: 1.2rem; color: var(--primary-dark);">${titleText}</h2>
                ${posData.mode === 'evento' ? `<button style="position: absolute; right: 0; background: transparent; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; padding: 5px;" onclick="editarEventoModal()"><i class="fa-solid fa-gear"></i></button>` : ''}
            </div>
    `;

    if (posData.mode === 'evento') {
        let montoVendido = 0;
        let costosProductos = 0;
        let comisiones = 0;

        (window.appState.ventas || []).forEach(v => {
            if((v.tipo === 'evento' || v.tipoVenta === 'Evento') && v.eventoNombre === posData.eventoNombre) {
                montoVendido += v.totalVendido || 0;
                costosProductos += v.totalCostoProduccion || 0;
                comisiones += v.comisionTarjeta || 0;
            }
        });

        let costoTotalEvento = posData.eventoCosto;
        let recuperacion = montoVendido - costoTotalEvento;
        let inversionStr = recuperacion >= 0 
            ? `<span style="color:var(--success)">+$${recuperacion.toFixed(2)}</span>` 
            : `<span style="color:var(--danger)">-$${Math.abs(recuperacion).toFixed(2)}</span>`;

        let utilidadNeta = montoVendido - costoTotalEvento - costosProductos - comisiones;
        let netaColor = utilidadNeta >= 0 ? "var(--success)" : "var(--danger)";

        html += `
            <div style="font-size: 0.9rem; color: var(--primary-dark); margin-top: 10px; font-weight: bold; text-align: center;">${posData.eventoNombre}</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.70rem; color: var(--text-muted); margin-top: 5px; background: #fff; padding: 8px; border-radius: 8px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);">
                <div style="text-align: center;">Vendido<br><strong style="font-size: 0.8rem; color: var(--text-main)">$${montoVendido.toFixed(2)}</strong></div>
                <div style="text-align: center;">Recuperación<br><strong style="font-size: 0.8rem;">${inversionStr}</strong></div>
                <div style="text-align: center;">Utilidad Neta<br><strong style="font-size: 0.8rem; color:${netaColor}">${utilidadNeta < 0 ? '-' : ''}$${Math.abs(utilidadNeta).toFixed(2)}</strong></div>
            </div>
        `;
    }
    html += `</div>`; // Close sticky top header

    html += `
        <div style="padding-bottom: 100px;">
            <h3 style="margin-bottom: 10px; color: var(--text-muted); font-size: 1rem;">Productos Disponibles</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
    `;

    const prods = window.appState.productos.filter(p => p.precioVenta > 0);
    if(prods.length === 0) {
        html += `<p style="grid-column: 1 / -1; font-size: 0.8rem; color: var(--danger);">No hay productos con precio asignado.</p>`;
    } else {
        prods.forEach(p => {
            const inCart = posData.cart.find(c => c.producto.id === p.id);
            const qty = inCart ? inCart.qty : 0;
            
            html += `
                <div style="background: ${qty > 0 ? '#fff0f5' : '#fff'}; border: 2px solid ${qty > 0 ? 'var(--primary)' : '#eee'}; border-radius: 10px; padding: 10px; text-align: center; cursor: pointer; transition: 0.2s; position: relative; display: flex; flex-direction: column; justify-content: space-between;" onclick="addToCart('${p.id}')">
                    <div style="font-size: 0.9rem; font-weight: 800; color: var(--text-main); line-height: 1.1; margin-bottom: 5px; height: 35px; overflow: hidden;">${p.nombre}</div>
                    <div style="color: var(--primary-dark); font-weight: bold; margin-bottom: ${qty > 0 ? '30px' : '5px'};">$${p.precioVenta.toFixed(2)}</div>
                    ${qty > 0 ? `
                        <div style="position: absolute; bottom: 8px; left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 10px;">
                            <button style="background: transparent; color: var(--danger); border: none; padding: 4px; cursor: pointer; font-size: 1.1rem;" title="Eliminar del carrito" onclick="event.stopPropagation(); removeProductFromCart('${p.id}')"><i class="fa-solid fa-trash-can"></i></button>
                            <button style="background: var(--danger); color: white; border: none; border-radius: 5px; width: 28px; height: 28px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onclick="event.stopPropagation(); updateCartQty('${p.id}', -1)">-</button>
                            <span style="font-weight: 900; color: var(--primary-dark); font-size: 1rem;">${qty}</span>
                            <button style="background: var(--primary); color: white; border: none; border-radius: 5px; width: 28px; height: 28px; font-weight: bold; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" onclick="event.stopPropagation(); updateCartQty('${p.id}', 1)">+</button>
                        </div>
                    ` : '<div style="font-size: 0.8rem; color: var(--text-muted); background: #eee; padding: 4px; border-radius: 5px; width: 100%; box-sizing: border-box;">Tocar para añadir</div>'}
                </div>
            `;
        });
    }

    html += `
            </div>
        </div>
        
        <!-- Fixed Bottom Bar -->
        <div style="position: fixed; bottom: 70px; left: 0; right: 0; max-width: 600px; margin: 0 auto; width: 100%; padding: 15px 20px; background: var(--bg-color); z-index: 100;">
            <div style="display: flex; gap: 10px;">
                <button class="btn-danger" style="flex: 1; background: #ffe4e1; color: var(--danger); font-size: 1.5rem; display: flex; align-items: center; justify-content: center; border-radius: 15px;" onclick="vaciarCarrito()" ${totalItems === 0 ? 'disabled style="opacity:0.5"' : ''} title="Vaciar Carrito">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
                <button class="btn-primary" style="flex: 4; display: flex; justify-content: space-between; font-size: 1.2rem; padding: 20px; border-radius: 15px; background: var(--success);" ${totalItems === 0 ? 'disabled style="opacity:0.5"' : ''} onclick="checkoutModal()">
                    <span style="font-weight: 900;"><i class="fa-solid fa-cart-shopping"></i> Cobrar</span>
                    <strong style="text-shadow: 0 1px 2px rgba(0,0,0,0.2);">$${totalVenta.toFixed(2)}</strong>
                </button>
            </div>
        </div>
    `;
    
    viewVentas.innerHTML = html;
}

window.startPOS = function(mode) {
    posData.mode = mode;
    posData.cart = [];
    if(mode === 'evento') {
        const eventMap = new Map();
        
        // 1. Get from sales (most recent sale per event) to ensure recently sold-at events bubble up
        (window.appState.ventas || []).forEach(v => {
            if((v.tipo === 'evento' || v.tipoVenta === 'Evento') && v.eventoNombre) {
                const existing = eventMap.get(v.eventoNombre);
                // Safe date comparison
                if (!existing || new Date(v.fecha).getTime() > new Date(existing.fecha).getTime()) {
                    eventMap.set(v.eventoNombre, { costo: v.eventoCosto, fecha: v.fecha });
                }
            }
        });
        
        // 2. Override/Add from eventosGuardados (to include brand new events with no sales yet)
        (window.appState.eventos || []).forEach(e => {
            const existing = eventMap.get(e.nombre);
            const evtDate = e.fecha || new Date(0).toISOString();
            if (!existing || new Date(evtDate).getTime() > new Date(existing.fecha).getTime()) {
                eventMap.set(e.nombre, { costo: e.costo, fecha: evtDate });
            }
        });
        
        const allEvents = Array.from(eventMap.entries()).map(([nombre, data]) => ({ nombre, ...data }));
        allEvents.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        
        const recent3 = allEvents.slice(0, 3);

        let html = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: var(--primary-dark);">🎪 Iniciar Evento</h2>
            </div>
            
            <div style="margin-bottom: 20px;">
                <button class="btn-primary" style="width: 100%; margin-bottom: 10px;" onclick="renderNuevoEventoForm()">
                    <i class="fa-solid fa-plus"></i> Crear Nuevo Evento
                </button>
        `;
        
        if (recent3.length > 0) {
            html += `
                <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-top: 10px;">
                    <label style="display:block; margin-bottom: 10px; color: var(--text-main); font-weight: bold;">Últimos Eventos:</label>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
                        ${recent3.map(e => `
                            <button style="width: 100%; text-align: left; padding: 12px 15px; border: 1px solid var(--primary); background: #fff; border-radius: 10px; color: var(--primary-dark); font-weight: bold; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.02);" onclick="reanudarEventoDirecto('${e.nombre}', ${e.costo})">
                                <span><i class="fa-solid fa-clock-rotate-left" style="margin-right: 8px;"></i> ${e.nombre}</span>
                                <i class="fa-solid fa-chevron-right" style="font-size: 0.8rem; color: #ccc;"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        if(allEvents.length > 0) {
            html += `
                <div style="border-top: 1px dashed #ccc; padding-top: 15px; margin-top: 10px;">
                    <label style="display:block; margin-bottom: 5px; color: var(--text-main); font-weight: bold;">Todos los eventos (Historial):</label>
                    <select id="ev-existente" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ccc; margin-bottom: 10px;">
                        <option value="">-- Seleccionar --</option>
                        ${allEvents.map(e => `<option value="${e.nombre}|${e.costo}">${e.nombre}</option>`).join('')}
                    </select>
                    <button class="btn-secondary" style="width: 100%; border: 2px solid var(--primary); color: var(--primary-dark); background: transparent; padding: 10px; border-radius: 10px; font-weight: bold; cursor: pointer;" onclick="reanudarEvento()">
                        <i class="fa-solid fa-play"></i> Continuar Evento Existente
                    </button>
                </div>
            `;
        }
        
        html += `<button class="btn-danger" style="margin-top: 20px; background: #eee; color: var(--text-main); width: 100%; border-radius: var(--border-radius-sm); padding: 10px 15px; font-weight: bold;" onclick="cancelPOS(); window.closeModal()">Regresar</button>`;
        
        window.openModal(html);
    } else {
        renderVentas();
    }
};

window.renderNuevoEventoForm = function() {
    const modalHtml = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: var(--primary-dark);">🎪 Datos del Nuevo Evento</h2>
        </div>
        <div class="form-group">
            <label>Nombre del Evento</label>
            <input type="text" id="ev-nombre" placeholder="Ej. Bazar Kawaii Mty" />
        </div>
        <div class="form-group">
            <label>Costo del Espacio ($ MXN)</label>
            <input type="number" id="ev-costo" step="0.01" value="0" />
        </div>
        <div class="form-group">
            <label>Gastos Adicionales</label>
            <div id="gastos-extra-container"></div>
            <button type="button" style="background: transparent; border: 2px dashed var(--primary); color: var(--primary-dark); padding: 8px; border-radius: 10px; width: 100%; cursor: pointer; font-weight: bold; margin-bottom: 5px;" onclick="addGastoExtra()">
                <i class="fa-solid fa-plus"></i> Añadir gasto adicional
            </button>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Se sumarán al costo total de la inversión del evento.</span>
        </div>
        <button class="btn-primary" style="margin-top: 15px;" onclick="confirmarEvento()">Comenzar Venta</button>
        <button class="btn-danger" style="margin-top: 10px; background: #eee; color: var(--text-main); width: 100%; border-radius: var(--border-radius-sm); padding: 10px 15px; font-weight: bold;" onclick="startPOS('evento')">Atrás</button>
    `;
    window.openModal(modalHtml);
};

window.reanudarEvento = function() {
    const selector = document.getElementById('ev-existente').value;
    if(!selector) { alert('Por favor selecciona un evento de la lista.'); return; }
    
    const parts = selector.split('|');
    window.reanudarEventoDirecto(parts[0], parts[1]);
};

window.reanudarEventoDirecto = function(nombre, costo) {
    posData.eventoNombre = nombre;
    posData.eventoCosto = parseFloat(costo) || 0;
    
    window.closeModal();
    renderVentas();
};

window.addGastoExtra = function() {
    const container = document.getElementById('gastos-extra-container');
    const id = Date.now();
    const html = `
        <div id="gasto-${id}" style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center;">
            <input type="text" class="gasto-nombre" placeholder="Concepto (ej. Uber)" style="flex: 2; padding: 8px; border: 1px solid #ccc; border-radius: 5px;" />
            <span style="color: var(--text-muted); font-weight: bold;">$</span>
            <input type="number" class="gasto-costo" placeholder="0.00" step="0.01" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 5px;" />
            <button type="button" style="padding: 8px 12px; border:none; border-radius:5px; background: #ffe4e1; color: var(--danger); cursor:pointer;" onclick="document.getElementById('gasto-${id}').remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
};

window.confirmarEvento = function() {
    const nombre = document.getElementById('ev-nombre').value;
    const costoBase = parseFloat(document.getElementById('ev-costo').value);
    
    let gastosExtraSum = 0;
    const costosExtraInputs = document.querySelectorAll('.gasto-costo');
    costosExtraInputs.forEach(input => {
        gastosExtraSum += (parseFloat(input.value) || 0);
    });
    
    if(!nombre || isNaN(costoBase) || costoBase < 0 || gastosExtraSum < 0) {
        alert("Llena los datos correctamente.");
        return;
    }
    posData.eventoNombre = nombre;
    posData.eventoCosto = costoBase + gastosExtraSum;
    
    // Guardar en la DB de eventos activos para persistir frente a recargas de pagina
    if (!window.appState.eventos) window.appState.eventos = [];
    const exists = window.appState.eventos.find(x => x.nombre === nombre);
    if (!exists) {
        window.appState.eventos.push({ nombre: posData.eventoNombre, costo: posData.eventoCosto, fecha: new Date().toISOString() });
        DB.save(window.appState);
    }
    
    window.closeModal();
    renderVentas();
};

window.editarEventoModal = function() {
    let html = `
        <div style="text-align: center; margin-bottom: 20px; position: relative;">
            <h2 style="color: var(--primary-dark); margin: 0;">⚙️ Editar Evento</h2>
            <button style="position: absolute; right: 0; top: 0; background: transparent; border: none; font-size: 1.4rem; color: var(--danger); outline: none; cursor: pointer; padding: 5px;" onclick="eliminarEventoConfirm('${posData.eventoNombre}')" title="Eliminar Evento">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
        <div class="form-group">
            <label>Nombre del Evento</label>
            <input type="text" id="edit-ev-nombre" value="${posData.eventoNombre}" />
        </div>
        <div class="form-group">
            <label>Desglose de Costos / Gastos Adicionales</label>
            <div id="gastos-extra-container">
                <div id="gasto-base" style="display: flex; gap: 8px; margin-bottom: 10px; align-items: center;">
                    <input type="text" class="gasto-nombre" value="Inversión Inicial" style="flex: 2; padding: 8px; border: 1px solid #ccc; border-radius: 5px;" />
                    <span style="color: var(--text-muted); font-weight: bold;">$</span>
                    <input type="number" class="gasto-costo" value="${posData.eventoCosto}" step="0.01" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 5px;" />
                    <button type="button" style="padding: 8px 12px; border:none; border-radius:5px; background: #ffe4e1; color: var(--danger); cursor:pointer;" onclick="document.getElementById('gasto-base').remove()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <button type="button" style="background: transparent; border: 2px dashed var(--primary); color: var(--primary-dark); padding: 8px; border-radius: 10px; width: 100%; cursor: pointer; font-weight: bold; margin-bottom: 5px;" onclick="addGastoEdit()">
                <i class="fa-solid fa-plus"></i> Añadir gasto adicional
            </button>
        </div>
        <button class="btn-primary" style="margin-top: 15px;" onclick="guardarEdicionEvento('${posData.eventoNombre}')">Guardar Cambios</button>
        <button class="btn-danger" style="margin-top: 10px; background: #eee; color: var(--text-main); width: 100%; border-radius: var(--border-radius-sm); padding: 10px 15px; font-weight: bold;" onclick="window.closeModal()">Cancelar</button>
    `;
    window.openModal(html);
};

window.addGastoEdit = function() {
    const container = document.getElementById('gastos-extra-container');
    if(!container) return;
    const div = document.createElement('div');
    div.style = "display: flex; gap: 8px; margin-bottom: 10px; align-items: center;";
    div.innerHTML = `
        <input type="text" class="gasto-nombre" placeholder="Concepto (ej. Uber)" style="flex: 2; padding: 8px; border: 1px solid #ccc; border-radius: 5px;" />
        <span style="color: var(--text-muted); font-weight: bold;">$</span>
        <input type="number" class="gasto-costo" placeholder="100.00" step="0.01" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 5px;" />
        <button type="button" style="padding: 8px 12px; border:none; border-radius:5px; background: #ffe4e1; color: var(--danger); cursor:pointer;" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    container.appendChild(div);
};

window.guardarEdicionEvento = function(oldNombre) {
    const newNombre = document.getElementById('edit-ev-nombre').value.trim();
    if(!newNombre) { alert("El nombre no puede estar vacío"); return; }
    
    let nuevoCosto = 0;
    const costosExtraInputs = document.querySelectorAll('#gastos-extra-container .gasto-costo');
    costosExtraInputs.forEach(input => {
        nuevoCosto += (parseFloat(input.value) || 0);
    });
    
    // Update past sales
    (window.appState.ventas || []).forEach(v => {
        if(v.tipoVenta === 'Evento' && v.eventoNombre === oldNombre) {
            v.eventoNombre = newNombre;
            v.eventoCosto = nuevoCosto;
        }
    });
    
    // Update appState.eventos
    const evt = (window.appState.eventos || []).find(x => x.nombre === oldNombre);
    if(evt) {
        evt.nombre = newNombre;
        evt.costo = nuevoCosto;
    } else {
        if(!window.appState.eventos) window.appState.eventos = [];
        window.appState.eventos.push({nombre: newNombre, costo: nuevoCosto, fecha: new Date().toISOString()});
    }
    
    posData.eventoNombre = newNombre;
    posData.eventoCosto = nuevoCosto;
    
    DB.save(window.appState);
    window.closeModal();
    renderVentas();
};

window.eliminarEventoConfirm = function(nombre) {
    if(!confirm(`⚠️ ¡ATENCIÓN! ¿Estás completamente seguro de ELIMINAR el evento "${nombre}" y TODAS las ventas registradas en él?\n\nEsta acción no se puede deshacer y afectará el historial de ventas.`)) {
        return;
    }
    
    // Remove from ventas
    if(window.appState.ventas) {
        window.appState.ventas = window.appState.ventas.filter(v => !( (v.tipo === 'evento' || v.tipoVenta === 'Evento') && v.eventoNombre === nombre ));
    }
    // Remove from eventos guardados
    if(window.appState.eventos) {
        window.appState.eventos = window.appState.eventos.filter(e => e.nombre !== nombre);
    }
    
    DB.save(window.appState);
    window.closeModal();
    
    posData = { mode: null, eventoNombre: '', eventoCosto: 0, cart: [] };
    const headerEl = document.querySelector('.app-header');
    if (headerEl) headerEl.style.display = '';
    renderVentas();
};

window.vaciarCarrito = function() {
    if(posData.cart.length > 0) {
        if(confirm("¿Seguro que quieres vaciar el carrito?")) {
            posData.cart = [];
            renderVentas();
        }
    }
};

window.cancelPOS = function() {
    if(posData.cart.length > 0) {
        if(!confirm("Tienes productos en el carrito. ¿Seguro que quieres salir hacia el menú principal y perder la venta actual?")) return;
    }
    posData = { mode: null, eventoNombre: '', eventoCosto: 0, cart: [] };
    const headerEl = document.querySelector('.app-header');
    if (headerEl) headerEl.style.display = '';
    renderVentas();
};

window.updateCartQty = function(id, change) {
    const existing = posData.cart.find(c => c.producto.id === id);
    if (existing) {
        existing.qty += change;
        if (existing.qty <= 0) {
            posData.cart = posData.cart.filter(c => c.producto.id !== id);
        }
    }
    renderVentas();
};

window.removeProductFromCart = function(id) {
    posData.cart = posData.cart.filter(c => c.producto.id !== id);
    renderVentas();
    
    if(document.getElementById('checkout-summary-list')) {
        if(posData.cart.length > 0) {
            window.refreshCheckoutSummary();
        } else {
            window.closeModal();
        }
    }
};

window.updateCartQtyModal = function(id, change) {
    window.updateCartQty(id, change);
    if(posData.cart.length > 0) {
        window.refreshCheckoutSummary();
    } else {
        window.closeModal();
    }
};

window.addToCart = function(id) {
    const prod = window.appState.productos.find(p => p.id === id);
    if (!prod) return;
    
    const existing = posData.cart.find(c => c.producto.id === id);
    if (existing) {
        existing.qty++;
    } else {
        posData.cart.push({ producto: prod, qty: 1 });
    }
    renderVentas();
};

window.refreshCheckoutSummary = function() {
    window.currentCheckoutTotal = posData.cart.reduce((acc, item) => acc + (item.producto.precioVenta * item.qty), 0);
    const totalVenta = window.currentCheckoutTotal;
    
    const titleEl = document.getElementById('checkout-total-title');
    if(titleEl) titleEl.innerText = '$' + totalVenta.toFixed(2);
    
    const comisionEl = document.getElementById('checkout-comision-display');
    if(comisionEl) comisionEl.innerHTML = '<strong>$' + (totalVenta * 0.0407).toFixed(2) + '</strong>';

    const summaryContainer = document.getElementById('checkout-summary-list');
    if(summaryContainer) {
        let summaryHtml = '';
        posData.cart.forEach(c => {
            summaryHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 6px; margin-bottom: 6px;">
                    <div style="flex: 2; font-size: 0.8rem; font-weight: bold; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;">${c.producto.nombre}</div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1.5;">
                        <button style="background: transparent; color: var(--danger); border: none; padding: 0; cursor: pointer; font-size: 1.1rem; margin-right: 5px;" title="Eliminar del carrito" onclick="removeProductFromCart('${c.producto.id}')"><i class="fa-solid fa-trash-can"></i></button>
                        <button style="background: var(--danger); color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-weight: bold;" onclick="updateCartQtyModal('${c.producto.id}', -1)">-</button>
                        <span style="font-weight: 900; font-size: 0.95rem; color: var(--primary-dark);">${c.qty}</span>
                        <button style="background: var(--primary); color: white; border: none; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-weight: bold;" onclick="updateCartQtyModal('${c.producto.id}', 1)">+</button>
                    </div>
                    <div style="flex: 1.2; text-align: right; font-weight: bold; font-size: 0.9rem; color: var(--text-main);">$${(c.producto.precioVenta * c.qty).toFixed(2)}</div>
                </div>
            `;
        });
        summaryContainer.innerHTML = summaryHtml;
    }
    
    const inputRecibido = document.getElementById('monto-recibido');
    if(inputRecibido) {
        inputRecibido.dispatchEvent(new Event('input'));
    }
};

window.checkoutModal = function() {
    if (posData.cart.length === 0) return;
    window.pagoGlobalState = 'efectivo'; // Default

    const html = `
        <div style="text-align: center; margin-bottom: 10px;">
            <h2 style="color: var(--primary-dark); margin-bottom: 5px;">💳 Cobro</h2>
            <div id="checkout-total-title" style="font-size: 2rem; font-weight: 900; color: var(--text-main); margin: 0;"></div>
        </div>
        
        <div style="font-size: 0.85rem; font-weight: bold; color: var(--text-muted); margin-bottom: 5px;">Resumen del Carrito</div>
        <div id="checkout-summary-list" style="max-height: 140px; overflow-y: auto; background: #fff; border: 1px solid #eee; border-radius: 10px; padding: 10px; margin-bottom: 15px; text-align: left;">
        </div>
        
        <div class="form-group" style="margin-bottom: 15px;">
            <label>Método de Pago</label>
            <div style="display: flex; gap: 10px; margin-top: 5px;">
                <button id="btn-efectivo" class="btn-primary" style="flex:1;" onclick="setPaymentMode('efectivo')">💵 Efectivo</button>
                <button id="btn-tarjeta" class="btn-danger" style="flex:1; background: #eee; color: var(--text-main);" onclick="setPaymentMode('tarjeta')">💳 Tarjeta <span style="font-size: 0.7rem; display:block;">(Aplica 4.07%)</span></button>
            </div>
        </div>
        
        <div id="efectivo-panel" style="background: #fafafa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
            <div class="form-group">
                <label>Monto Recibido ($) - (Opcional)</label>
                <input type="number" id="monto-recibido" placeholder="Ej. 500" />
            </div>
            <div id="cambio-preview" style="text-align: center; font-size: 1.1rem; font-weight: bold; color: var(--text-muted); margin-top: 10px;">
                
            </div>
        </div>
        
        <div id="tarjeta-panel" style="display:none; background: #fff0f5; padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
            <p style="font-size: 0.9rem; color: var(--primary-dark);">Comisión (4.07%): <span id="checkout-comision-display"></span></p>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">Se restará de tu utilidad final.</p>
        </div>

        <div style="display: flex; gap: 10px;">
            <button class="btn-danger" style="flex: 1; background: #eee; color: var(--text-main);" onclick="window.closeModal()">Regresar</button>
            <button class="btn-primary" style="flex: 2; background: var(--success);" onclick="completarVenta()">✅ Venta Exitosilla</button>
        </div>
    `;
    
    window.openModal(html);
    window.setPaymentMode(window.pagoGlobalState);
    
    const inputRecibido = document.getElementById('monto-recibido');
    inputRecibido.addEventListener('input', () => {
        const valStr = inputRecibido.value.trim();
        if(!valStr) {
            document.getElementById('cambio-preview').innerHTML = '';
            return;
        }
        
        const val = parseFloat(valStr) || 0;
        const totalVenta = window.currentCheckoutTotal || 0;
        const cambio = val - totalVenta;
        if(cambio >= 0) {
            document.getElementById('cambio-preview').innerHTML = `Cambio a dar: 💵 <span style="color:var(--success)">$${cambio.toFixed(2)}</span>`;
        } else {
            document.getElementById('cambio-preview').innerHTML = `<span style="color:var(--danger)">Faltan $${Math.abs(cambio).toFixed(2)}</span>`;
        }
    });

    window.refreshCheckoutSummary();
};

window.setPaymentMode = function(mode) {
    window.pagoGlobalState = mode;
    const btnEf = document.getElementById('btn-efectivo');
    const btnTa = document.getElementById('btn-tarjeta');
    const panEf = document.getElementById('efectivo-panel');
    const panTa = document.getElementById('tarjeta-panel');
    
    if(mode === 'efectivo') {
        btnEf.style.background = 'var(--primary)';
        btnEf.style.color = '#fff';
        btnTa.style.background = '#eee';
        btnTa.style.color = 'var(--text-main)';
        panEf.style.display = 'block';
        panTa.style.display = 'none';
    } else {
        btnTa.style.background = 'var(--primary)';
        btnTa.style.color = '#fff';
        btnEf.style.background = '#eee';
        btnEf.style.color = 'var(--text-main)';
        panTa.style.display = 'block';
        panEf.style.display = 'none';
    }
};

window.completarVenta = function() {
    const totalVenta = window.currentCheckoutTotal || posData.cart.reduce((acc, item) => acc + (item.producto.precioVenta * item.qty), 0);
    
    if (window.pagoGlobalState === 'efectivo') {
        const inputStr = document.getElementById('monto-recibido').value.trim();
        if (inputStr !== '') {
            const recibido = parseFloat(inputStr) || 0;
            if (recibido < totalVenta) {
                alert("El monto recibido no es suficiente para cubrir la venta.");
                return;
            }
        }
    }

    const comisionTarjeta = window.pagoGlobalState === 'tarjeta' ? (totalVenta * 0.0407) : 0;
    
    // Calculate costs & utility
    let totalCostoProduccion = 0;
    let totalCostoOperativo = 0;
    const itemsSimplificados = posData.cart.map(c => {
        const p = c.producto;
        const q = c.qty;
        totalCostoProduccion += (p.costoProduccion * q);
        totalCostoOperativo += (p.costoOperativo * q);
        return {
            idProducto: p.id,
            nombre: p.nombre,
            cantidad: q,
            precioUnidad: p.precioVenta,
            costoProduccionUnidad: p.costoProduccion,
            subtotal: p.precioVenta * q,
            // Guardar desglose histórico detallado
            costoMateriales: p.costoMateriales || 0,
            costoManoDeObra: p.costoManoDeObra || 0,
            costoArte: p.costoArte || 0,
            costoOperativo: p.costoOperativo || 0
        };
    });

    const totalGananciaBruta = totalVenta - totalCostoProduccion;
    const totalGananciaNeta = totalGananciaBruta - comisionTarjeta;

    const venta = {
        id: window.generateId(),
        fecha: new Date().toISOString(),
        tipo: posData.mode, // libre o evento
        eventoNombre: posData.mode === 'evento' ? posData.eventoNombre : null,
        eventoCosto: posData.mode === 'evento' ? posData.eventoCosto : 0, // Event cost applies once for the entire event, but we'll attach it to the first sale of the event if needed, or track it per event. Actually, we should only subtract the event cost once in overall profit metrics, let's keep it here so the stats module knows.
        items: itemsSimplificados,
        totalVendido: totalVenta,
        totalCostoProduccion: totalCostoProduccion,
        totalGanancia: totalGananciaNeta,
        metodoPago: window.pagoGlobalState,
        comisionTarjeta: comisionTarjeta
    };

    window.appState.ventas.push(venta);

    // Inversión Recuperada Global
    window.appState.inversionRecuperada = (window.appState.inversionRecuperada || 0) + totalCostoOperativo;

    DB.save(window.appState);
    
    // Reset cart but keep mode
    window.closeModal();
    posData.cart = [];
    
    // Notify
    window.openModal(`
        <div style="text-align:center; padding: 20px;">
            <div style="font-size: 4rem; color: var(--success); margin-bottom: 20px;">🎉</div>
            <h2 style="color: var(--primary-dark);">¡Venta Registrada!</h2>
            <p style="color: var(--text-muted); margin-top: 10px;">Tu venta se guardó en el historial exitosamente.</p>
        </div>
    `);

    // Auto-close after 1.5 seconds and return to POS
    setTimeout(() => {
        window.closeModal();
        renderVentas();
    }, 1500);
};

document.addEventListener('view-view-ventas', renderVentas);
