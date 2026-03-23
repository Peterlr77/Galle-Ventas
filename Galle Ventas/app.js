// Galle Ventas - Main App Logic
// State Management (LocalStorage Wrapper)
const DB = {
    load() {
        const defaultData = {
            materiasPrimas: [], // { id, nombre, unidad, costo, esManoDeObra: boolean }
            herramientas: [], // { id, nombre, costoInversion, usosEsperados, costoPorUso, usosActuales }
            productos: [], // { id, nombre, receta: [{idMateria, cantidad}], tiempoProduccion, costoOperativo, precioVenta, margen }
            ventas: [] // { id, fecha, tipo, eventoNombre, eventoCosto, totalVenta, totalGanancia, items: [...] }
        };
        const st = localStorage.getItem('galle_ventas_db');
        return st ? JSON.parse(st) : defaultData;
    },
    save(data) {
        localStorage.setItem('galle_ventas_db', JSON.stringify(data));
    }
};

// Global App State
window.appState = DB.load();

// Utility function to generate unique IDs
window.generateId = () => '_' + Math.random().toString(36).substr(2, 9);

// DOM Elements
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item[data-target]');
const headerTitle = document.getElementById('header-title');

// Navigation Logic
function navigateTo(targetId, title) {
    // Hide all views
    views.forEach(v => v.classList.remove('active'));
    // Show target
    document.getElementById(targetId).classList.add('active');
    
    // Update Header
    headerTitle.textContent = title;
    const headerEl = document.querySelector('.app-header');
    if(headerEl) headerEl.style.display = '';
    
    // Update Nav Activity (ignore More menu items for the bottom nav highlights)
    navItems.forEach(n => n.classList.remove('active'));
    const matchedNav = document.querySelector(`.bottom-nav .nav-item[data-target="${targetId}"]`);
    if(matchedNav) matchedNav.classList.add('active');
    
    // Trigger render function for the specific view if it exists
    const eventName = `view-${targetId}`;
    document.dispatchEvent(new CustomEvent(eventName));
}

// Add event listeners to navigation buttons
navItems.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Find the closest button if clicked on icon/span
        const target = e.target.closest('.nav-item') || e.target.closest('.menu-card');
        const targetId = target.dataset.target;
        const title = target.dataset.title;
        navigateTo(targetId, title);
        
        // Hide More menu if it's open
        hideMoreMenu();
    });
});

// More Menu Logic
const btnMore = document.getElementById('btn-more-menu');
const btnCloseMore = document.getElementById('btn-close-menu');
const moreMenuOverlay = document.getElementById('more-menu-overlay');
const moreMenuCards = document.querySelectorAll('.menu-card');

function showMoreMenu() {
    moreMenuOverlay.classList.remove('hidden');
}

function hideMoreMenu() {
    moreMenuOverlay.classList.add('hidden');
}

btnMore.addEventListener('click', showMoreMenu);
btnCloseMore.addEventListener('click', hideMoreMenu);
moreMenuOverlay.addEventListener('click', (e) => {
    if(e.target === moreMenuOverlay) hideMoreMenu();
});

moreMenuCards.forEach(card => {
    card.addEventListener('click', (e) => {
        const target = e.target.closest('.menu-card');
        const targetId = target.dataset.target;
        const title = target.dataset.title;
        navigateTo(targetId, title);
        hideMoreMenu();
    });
});

// General Utility: Create a Modal
window.openModal = function(contentHtml) {
    const container = document.getElementById('modals-container');
    container.innerHTML = `
        <div class="modal-overlay" id="active-modal">
            <div class="modal-content">
                ${contentHtml}
            </div>
        </div>
    `;
    const overlay = document.getElementById('active-modal');
    // Close on click outside
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) window.closeModal();
    });
};

window.closeModal = function() {
    const container = document.getElementById('modals-container');
    container.innerHTML = '';
};

// Start default view
navigateTo('view-dashboard', '🌸 Inicio');

// --- Import / Export --- //
window.openSettingsModal = function() {
    const html = `
        <div style="text-align: center;">
            <h2 style="color:var(--primary-dark); margin-bottom:20px;">⚙️ Respaldos y Datos</h2>
            <button class="btn-primary" style="margin-bottom: 15px; background:var(--secondary); color:#333; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="exportData()">
                <i class="fa-solid fa-download"></i> Exportar Datos (Backup)
            </button>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:20px;">
                Descarga un archivo con todas tus ventas, productos, e historial de la app.
            </p>
            <hr style="border:1px solid #eee; margin-bottom:15px;">
            <input type="file" id="importFile" style="display:none;" accept=".json" onchange="handleImport(event)">
            <button class="btn-danger" style="display:flex; align-items:center; justify-content:center; gap:8px;" onclick="document.getElementById('importFile').click()">
                <i class="fa-solid fa-upload"></i> Importar Datos
            </button>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:10px;">
                ⚠️ Precaución: Al importar, se <strong>borrarán y reemplazarán permanentemente</strong> todos los datos actuales de tu aplicación.
            </p>
        </div>
    `;
    window.openModal(html);
};

window.exportData = function() {
    const dataStr = JSON.stringify(window.appState, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const exportFileDefaultName = `GalleVentas_Backup_${dateStr}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(url);
};

window.handleImport = function(event) {
    const file = event.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if(importedData && typeof importedData === 'object') {
                if(confirm("⚠️ ¿Estás COMPLETAMENTE segura de querer reemplazar TODOS tus datos actuales con este respaldo?\n\nEsta acción NO se puede deshacer y borrará cualquier avance que no esté en el archivo.")) {
                    window.appState = importedData;
                    DB.save(window.appState);
                    alert("¡Datos importados con éxito! La aplicación se recargará para aplicar los cambios.");
                    window.location.reload();
                }
            } else {
                alert("El archivo no tiene un formato válido para Galle Ventas.");
            }
        } catch(err) {
            alert("Error al leer el archivo. Asegúrate de que sea un archivo .json válido y sin corrupciones.");
        }
    };
    reader.readAsText(file);
};

// --- Service Worker Registration --- //
if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log("Service Worker registered!", reg);
        }).catch(err => {
            console.log("Service Worker registration failed: ", err);
        });
    });
}
