// Historial y Estadísticas Module

const viewHistorial = document.getElementById('view-historial');
const viewEstadisticas = document.getElementById('view-estadisticas');

// State for filters
let filterState = {
    historial: { rango: '30d', startDate: '', endDate: '', evento: 'all', metodo: 'all' },
    estadisticas: { rango: '30d', startDate: '', endDate: '', evento: 'all', metodo: 'all' }
};

// --- UTILS --- //
function getFilteredVentas(state) {
    let ventas = window.appState.ventas || [];
    const now = new Date();
    
    return ventas.filter(v => {
        const vd = new Date(v.fecha);
        let passDate = true;
        if (state.rango === '7d') {
            const past7 = new Date();
            past7.setDate(now.getDate() - 7);
            passDate = vd >= past7;
        } else if (state.rango === '30d') {
            const past30 = new Date();
            past30.setDate(now.getDate() - 30);
            passDate = vd >= past30;
        } else if (state.rango === 'custom' && state.startDate && state.endDate) {
            const d1 = new Date(state.startDate);
            const d2 = new Date(state.endDate);
            d2.setHours(23, 59, 59, 999);
            passDate = vd >= d1 && vd <= d2;
        }
        if(!passDate) return false;
        
        if (state.metodo && state.metodo !== 'all') {
            const vMethod = v.metodoPago || 'efectivo';
            if (vMethod !== state.metodo) return false;
        }
        
        if (state.evento && state.evento !== 'all') {
            if (state.evento === 'libre') {
                if (v.tipo === 'evento' || v.tipoVenta === 'Evento') return false;
            } else {
                if (v.eventoNombre !== state.evento) return false;
            }
        }
        
        return true;
    }).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
}

function renderFilterBar(targetView, state) {
    const isCustom = state.rango === 'custom';
    
    const eventosSet = new Set();
    (window.appState.ventas || []).forEach(v => {
        if((v.tipo === 'evento' || v.tipoVenta === 'Evento') && v.eventoNombre) {
            eventosSet.add(v.eventoNombre);
        }
    });
    const uniqueEventos = Array.from(eventosSet);
    
    return `
        <div style="background: var(--card-bg); padding: 15px; border-radius: var(--border-radius); box-shadow: var(--shadow-sm); margin-bottom: 20px;">
            <div style="display:flex; flex-direction:column; gap: 10px; margin-bottom: ${isCustom ? '10px' : '0'};">
                <select id="sel-${targetView}-rango" onchange="changeFilter('${targetView}')" style="padding: 10px; border-radius: 8px; border: 1px solid #eee; outline:none; font-family: 'Nunito', sans-serif;">
                    <option value="7d" ${state.rango === '7d' ? 'selected' : ''}>Últimos 7 días</option>
                    <option value="30d" ${state.rango === '30d' ? 'selected' : ''}>Últimos 30 días</option>
                    <option value="all" ${state.rango === 'all' ? 'selected' : ''}>Historico Completo</option>
                    <option value="custom" ${state.rango === 'custom' ? 'selected' : ''}>Fechas Personalizadas</option>
                </select>
                
                <div style="display:flex; gap: 10px;">
                    <select id="sel-${targetView}-metodo" onchange="changeFilter('${targetView}')" style="flex:1; padding: 10px; border-radius: 8px; border: 1px solid #eee; outline:none; font-family: 'Nunito', sans-serif;">
                        <option value="all" ${state.metodo === 'all' ? 'selected' : ''}>Cualquier Pago</option>
                        <option value="efectivo" ${state.metodo === 'efectivo' ? 'selected' : ''}>💵 Efectivo</option>
                        <option value="tarjeta" ${state.metodo === 'tarjeta' ? 'selected' : ''}>💳 Tarjeta</option>
                    </select>
                    
                    <select id="sel-${targetView}-evento" onchange="changeFilter('${targetView}')" style="flex:1; padding: 10px; border-radius: 8px; border: 1px solid #eee; outline:none; font-family: 'Nunito', sans-serif;">
                        <option value="all" ${state.evento === 'all' ? 'selected' : ''}>Todos los Tipos</option>
                        <option value="libre" ${state.evento === 'libre' ? 'selected' : ''}>🛍️ Venta Libre</option>
                        <optgroup label="Eventos">
                            ${uniqueEventos.map(e => `<option value="${e}" ${state.evento === e ? 'selected' : ''}>🎪 ${e}</option>`).join('')}
                        </optgroup>
                    </select>
                </div>
            </div>
            ${isCustom ? `
                <div style="display:flex; gap: 10px; align-items:center;">
                    <input type="date" id="inp-${targetView}-start" value="${state.startDate}" onchange="changeFilter('${targetView}')" style="flex:1; padding:5px; border-radius:5px; border:1px solid #ccc; font-size: 0.8rem; font-family: 'Nunito', sans-serif;" />
                    <span>a</span>
                    <input type="date" id="inp-${targetView}-end" value="${state.endDate}" onchange="changeFilter('${targetView}')" style="flex:1; padding:5px; border-radius:5px; border:1px solid #ccc; font-size: 0.8rem; font-family: 'Nunito', sans-serif;" />
                </div>
            ` : ''}
        </div>
    `;
}

window.changeFilter = function(target) {
    const rango = document.getElementById(`sel-${target}-rango`).value;
    const metodo = document.getElementById(`sel-${target}-metodo`).value;
    const evento = document.getElementById(`sel-${target}-evento`).value;
    
    filterState[target].rango = rango;
    filterState[target].metodo = metodo;
    filterState[target].evento = evento;
    
    if(rango === 'custom') {
        const sd = document.getElementById(`inp-${target}-start`);
        const ed = document.getElementById(`inp-${target}-end`);
        if(sd && ed) {
            filterState[target].startDate = sd.value;
            filterState[target].endDate = ed.value;
        }
    }
    
    if(target === 'historial') renderHistorial();
    if(target === 'estadisticas') renderEstadisticas();
};

// --- HISTORIAL VIEW --- //
function renderHistorial() {
    let html = ``;

    const state = filterState.historial;
    html += renderFilterBar('historial', state);
    
    const ventas = getFilteredVentas(state);
    
    if(ventas.length === 0) {
        html += `<div class="card"><p style="text-align:center; color: var(--text-muted);">No hay ventas en este periodo.</p></div>`;
    } else {
        html += `<div style="display:flex; flex-direction:column; gap: 15px;">`;
        ventas.forEach(v => {
            const fecha = new Date(v.fecha).toLocaleString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' });
            
            let badges = '';
            if (v.tipo === 'evento') {
                badges += `<span style="background:var(--secondary); color:#fff; font-size:0.7rem; padding: 2px 8px; border-radius:10px; font-weight:bold;">🎪 ${v.eventoNombre}</span>`;
            } else {
                badges += `<span style="background:var(--primary); color:#fff; font-size:0.7rem; padding: 2px 8px; border-radius:10px; font-weight:bold;">🏪 Venta Libre</span>`;
            }
            if(v.metodoPago === 'tarjeta') {
                badges += `<span style="background:#eee; color:var(--text-main); font-size:0.7rem; padding: 2px 8px; border-radius:10px; margin-left:5px;">💳 Tarjeta</span>`;
            }

            const itemsList = v.items.map(i => `<div style="font-size:0.8rem; color:var(--text-muted); display:flex; justify-content:space-between;"><span>${i.cantidad}x ${i.nombre}</span> <span>$${(i.subtotal).toFixed(2)}</span></div>`).join('');

            html += `
                <div class="card" style="text-align:left; padding: 15px; margin-bottom:0;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 5px;">
                        <div style="font-size: 0.8rem; color:var(--text-muted);">${fecha}</div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <div>${badges}</div>
                            <button onclick="eliminarVentaHistorial('${v.id}')" style="background:none; border:none; cursor:pointer; color:var(--danger); font-size:1.1rem; padding:0 5px;" title="Eliminar Venta">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div style="margin: 10px 0; border-top: 1px dashed #eee; border-bottom: 1px dashed #eee; padding: 5px 0;">
                        ${itemsList}
                    </div>
                    
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-size:0.85rem; color:var(--text-muted);">Total Cobrado:</span>
                        <strong style="color:var(--text-main);">$${v.totalVendido.toFixed(2)}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-size:0.85rem; color:var(--text-muted);">Ganancia Neta:</span>
                        <strong style="color:var(--success);">$${v.totalGanancia.toFixed(2)}</strong>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    viewHistorial.innerHTML = html;
}

window.eliminarVentaHistorial = function(idVenta) {
    if(confirm("⚠️ ¿Estás segura de querer ELIMINAR permanentemente el registro de esta venta?\n\nTus ingresos y utilidades se recalcularán y esta acción no se puede deshacer.")) {
        if(window.appState.ventas) {
            window.appState.ventas = window.appState.ventas.filter(v => v.id !== idVenta);
            DB.save(window.appState);
            renderHistorial();
        }
    }
};

// Global sort preference
window.sortProdsField = 'qty';
window.sortProdsDir = 'desc';

window.changeProdSortField = function() {
    const s = document.getElementById('sort-prods-sel');
    if(s) {
        window.sortProdsField = s.value;
        renderEstadisticas();
    }
};

window.toggleProdSortDir = function() {
    window.sortProdsDir = window.sortProdsDir === 'desc' ? 'asc' : 'desc';
    renderEstadisticas();
};

function generatePieChart(data) {
    let total = data.reduce((sum, d) => sum + d.value, 0);
    if(total <= 0) return '<div style="text-align:center; padding: 20px; color: #ccc;">Sin datos financieros</div>';
    
    let svg = `<svg viewBox="0 0 42 42" style="width: 180px; height: 180px; display: block; margin: 0 auto; transform: rotate(-90deg); border-radius: 50%; overflow: visible; filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.1));">`;
    let currentOffset = 0;
    
    data.forEach(d => {
        if(d.value <= 0) return;
        let pct = (d.value / total) * 100;
        let dasharray = `${pct} ${100 - pct}`;
        let offset = -currentOffset;
        
        svg += `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="${d.color}" stroke-width="8" stroke-dasharray="${dasharray}" stroke-dashoffset="${offset}"></circle>`;
        currentOffset += pct;
    });
    
    svg += `</svg>`;
    return svg;
}

// --- ESTADÍSTICAS VIEW --- //
function renderEstadisticas() {
    let html = ``;

    const state = filterState.estadisticas;
    html += renderFilterBar('estadisticas', state);
    
    const ventas = getFilteredVentas(state);
    
    if(ventas.length === 0) {
        html += `<div class="card"><p style="text-align:center; color: var(--text-muted);">Sin datos en este periodo.</p></div>`;
    } else {
        const metrica = {
            ingresos: 0, gananciaUnitaria: 0, costoProduccionTot: 0,
            cMateriales: 0, cManoObra: 0, cArte: 0, cOperativo: 0,
            comisiones: 0, eventosCostos: 0,
            topProds: {}
        };
        
        let eventosSet = new Set();

        ventas.forEach(v => {
            metrica.ingresos += v.totalVendido;
            metrica.gananciaUnitaria += v.totalGanancia;
            metrica.costoProduccionTot += v.totalCostoProduccion;
            metrica.comisiones += v.comisionTarjeta || 0;
            
            if(v.tipo === 'evento' && v.eventoNombre) {
                const evtKey = `${v.eventoNombre}-${v.eventoCosto}`;
                if(!eventosSet.has(evtKey)) {
                    eventosSet.add(evtKey);
                    metrica.eventosCostos += v.eventoCosto;
                }
            }

            // Products
            v.items.forEach(i => {
                let pid = i.idProducto || 'unknown';
                let fallback = window.appState.productos.find(p => p.id === pid) || {};
                
                let qty = i.cantidad;
                let cMat = (i.costoMateriales !== undefined ? i.costoMateriales : (fallback.costoMateriales || 0)) * qty;
                let cMO  = (i.costoManoDeObra !== undefined ? i.costoManoDeObra : (fallback.costoManoDeObra || 0)) * qty;
                let cArt = (i.costoArte !== undefined ? i.costoArte : (fallback.costoArte || 0)) * qty;
                let cOp  = (i.costoOperativo !== undefined ? i.costoOperativo : (fallback.costoOperativo || 0)) * qty;
                
                // If it's old data and all are 0 but costoProduccionUnidad exists, dump it entirely into Materiales (Producción)
                if (cMat === 0 && cMO === 0 && cArt === 0 && cOp === 0 && i.costoProduccionUnidad > 0) {
                    cMat = i.costoProduccionUnidad * qty;
                }
                
                let cTotal = cMat + cMO + cArt + cOp;
                
                metrica.cMateriales += cMat;
                metrica.cManoObra += cMO;
                metrica.cArte += cArt;
                metrica.cOperativo += cOp;
                
                if(!metrica.topProds[pid]) {
                    metrica.topProds[pid] = { 
                        nombre: i.nombre, 
                        qty: 0, 
                        rev: 0, 
                        totalCost: 0,
                        totalProfit: 0 
                    };
                }
                metrica.topProds[pid].qty += qty;
                metrica.topProds[pid].rev += i.subtotal;
                metrica.topProds[pid].totalCost += cTotal;
                metrica.topProds[pid].totalProfit += (i.subtotal - cTotal);
            });
        });
        
        // Calculate unit averages
        let allArr = Object.values(metrica.topProds);
        allArr.forEach(t => {
            t.unitPrice = t.qty > 0 ? (t.rev / t.qty) : 0;
            t.unitCost = t.qty > 0 ? (t.totalCost / t.qty) : 0;
            t.unitProfit = t.unitPrice - t.unitCost;
        });

        const gananciaRealFinal = metrica.gananciaUnitaria - metrica.eventosCostos;
        const total = metrica.ingresos;

        const pieData = [
            { label: 'Producción', value: metrica.cMateriales, color: '#FF9AA2' }, // Soft Red/Pink
            { label: 'Operativos', value: metrica.cOperativo, color: '#FFB7B2' },   // Peach
            { label: 'Mano de Obra', value: metrica.cManoObra, color: '#FFDAC1' }, // Light Orange
            { label: 'Arte', value: metrica.cArte, color: '#E2F0CB' },               // Light Green
            { label: 'Gasto Eventos', value: metrica.eventosCostos, color: '#B5EAD7' }, // Mint
            { label: 'Utilidad', value: gananciaRealFinal > 0 ? gananciaRealFinal : 0, color: '#C7CEEA' } // Lavender
        ];

        html += `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div class="card" style="margin:0; padding:15px; text-align:center;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Ventas Brutas</div>
                    <div style="font-size: 1.4rem; font-weight:900; color: var(--text-main);">$${metrica.ingresos.toFixed(2)}</div>
                </div>
                <div class="card" style="margin:0; padding:15px; text-align:center; background:#f0fff0;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Ganancia Real</div>
                    <div style="font-size: 1.4rem; font-weight:900; color: ${gananciaRealFinal < 0 ? 'var(--danger)' : 'var(--success)'};">$${gananciaRealFinal.toFixed(2)}</div>
                </div>
            </div>
            
            <div class="card" style="text-align:center; padding: 20px;">
                <h3 style="font-size:1.1rem; color:var(--primary-dark); margin-bottom: 15px;">🍩 Distribución de Ingresos</h3>
                ${generatePieChart(pieData)}
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 20px;">
                    ${pieData.map(d => `
                        <div style="display:flex; align-items:center; font-size: 0.75rem;">
                            <span style="display:inline-block; width:12px; height:12px; background:${d.color}; border-radius:50%; margin-right:5px;"></span>
                            <span style="color:var(--text-muted);">${d.label}: </span>
                            <strong style="margin-left: 3px;">$${d.value.toFixed(2)} (${total > 0 ? ((d.value/total)*100).toFixed(1) : 0}%)</strong>
                        </div>
                    `).join('')}
                    <div style="display:flex; align-items:center; font-size: 0.75rem;">
                        <span style="display:inline-block; width:12px; height:12px; background:#e0e0e0; border-radius:50%; margin-right:5px;"></span>
                        <span style="color:var(--text-muted);">Comisiones: </span>
                        <strong style="margin-left: 3px;">$${metrica.comisiones.toFixed(2)} (${total > 0 ? ((metrica.comisiones/total)*100).toFixed(1) : 0}%)</strong>
                    </div>
                </div>
            </div>
            
            <div class="card" style="text-align:left;">
                <h3 style="font-size:1.1rem; color:var(--primary-dark); margin-bottom: 10px;">🏆 Top 5 Productos más vendidos</h3>
                <div style="display:flex; flex-direction:column; gap:5px;">
        `;

        const topArr = Object.values(metrica.topProds).sort((a,b) => b.qty - a.qty).slice(0, 5);
        if(topArr.length === 0) {
            html += `<p style="font-size:0.8rem; color:var(--text-muted);">Sin datos.</p>`;
        } else {
            topArr.forEach((t, i) => {
                const isFirst = i === 0;
                html += `
                    <div style="display:flex; justify-content:space-between; align-items:center; background: ${isFirst ? '#fffacd' : '#fafafa'}; padding: 10px; border-radius: 8px;">
                        <span style="font-weight:bold;">${isFirst?'👑 ':''}${t.nombre}</span>
                        <div style="text-align:right;">
                            <span style="font-weight:900; color:var(--primary-dark); font-size:1.1rem;">${t.qty}</span>
                            <span style="font-size:0.7rem; color:var(--text-muted);">vendidos</span>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `
                </div>
            </div>
            
            <div class="card" style="text-align:left;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <h3 style="font-size:1.1rem; color:var(--primary-dark); margin: 0;">📋 Productos</h3>
                    <div style="display:flex; gap: 5px; align-items: center;">
                        <select id="sort-prods-sel" onchange="changeProdSortField()" style="padding: 5px; font-size:0.8rem; border-radius: 5px; border: 1px solid #ddd; outline:none; font-family:'Nunito', sans-serif;">
                            <option value="qty" ${window.sortProdsField==='qty'?'selected':''}>Unidades vendidas</option>
                            <option value="unitPrice" ${window.sortProdsField==='unitPrice'?'selected':''}>Precio</option>
                            <option value="unitCost" ${window.sortProdsField==='unitCost'?'selected':''}>Costo</option>
                            <option value="unitProfit" ${window.sortProdsField==='unitProfit'?'selected':''}>Utilidad por unidad</option>
                            <option value="rev" ${window.sortProdsField==='rev'?'selected':''}>Venta acumulada</option>
                            <option value="totalProfit" ${window.sortProdsField==='totalProfit'?'selected':''}>Utilidad acumulada</option>
                            <option value="nombre" ${window.sortProdsField==='nombre'?'selected':''}>Nombre</option>
                        </select>
                        <button onclick="toggleProdSortDir()" style="background:var(--primary); color:#fff; border:none; padding: 5px 10px; border-radius: 5px; cursor: pointer;" title="Cambiar orden dinámico">
                            <i class="fa-solid ${window.sortProdsDir === 'desc' ? 'fa-arrow-down-wide-short' : 'fa-arrow-up-short-wide'}"></i>
                        </button>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px;">
        `;
        
        allArr.sort((a,b) => {
            if(window.sortProdsField === 'nombre') {
                return window.sortProdsDir === 'desc' 
                    ? b.nombre.localeCompare(a.nombre) 
                    : a.nombre.localeCompare(b.nombre);
            }
            let valA = a[window.sortProdsField] || 0;
            let valB = b[window.sortProdsField] || 0;
            return window.sortProdsDir === 'desc' ? (valB - valA) : (valA - valB);
        });

        if(allArr.length === 0) {
             html += `<p style="font-size:0.8rem; color:var(--text-muted);">Sin datos.</p>`;
        } else {
             allArr.forEach((t) => {
                 html += `
                    <div style="background: #fafafa; padding: 12px; border-radius: 8px; border: 1px solid #eee;">
                        <div style="font-weight:bold; color:var(--text-main); margin-bottom:10px; font-size: 1.05rem;">
                            ${t.nombre}
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size:0.8rem; color:var(--text-muted);">
                            <div>Precio: <strong style="color:var(--text-main);">$${t.unitPrice.toFixed(2)}</strong></div>
                            <div>Costo: <strong style="color:var(--text-main);">$${t.unitCost.toFixed(2)}</strong></div>
                            <div>Util. ud: <strong style="color:var(--success);">$${t.unitProfit.toFixed(2)}</strong></div>
                            <div>Unidades: <strong style="color:var(--primary-dark);">${t.qty}x</strong></div>
                            <div>Venta Acum.: <strong style="color:var(--text-main);">$${t.rev.toFixed(2)}</strong></div>
                            <div>Util. Acum.: <strong style="color:var(--success);">$${t.totalProfit.toFixed(2)}</strong></div>
                        </div>
                    </div>
                 `;
             });
        }
        
        html += `
                </div>
            </div>
        `;
    }

    viewEstadisticas.innerHTML = html;
}


document.addEventListener('view-view-historial', renderHistorial);
document.addEventListener('view-view-estadisticas', renderEstadisticas);
