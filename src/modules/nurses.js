import { Logger } from '../utils/logger.js';

/**
 * Módulo de Enfermería - Gestión completa
 * Modal y diseño EXACTO al módulo médico.
 */

const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="2.25" y="3.75" width="15.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6 1.75v3.5M14 1.75v3.5"/><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M2 7.5h16"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="4.25" y="3.75" width="11.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/><rect x="6.75" y="2" width="6.5" height="3.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,
  nurse: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 2a9 9 0 0 0-9 9v11c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2V11a9 9 0 0 0-9-9Z"/><path d="m7 12 2 2 4-4"/></svg>`,
  area: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" fill="none" viewBox="0 0 20 20"><rect x="2.25" y="4.25" width="15.5" height="10.5" rx="1.75" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6.5 15.75V17a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-1.25"/></svg>`,
  successCheck: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M6 10.5l2.5 2 5-5"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M10 3v8"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M10 7v5"/><circle cx="10" cy="14" r="1" fill="currentColor"/></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M2.5 17.5L8 12l-1-1-5.5 5.5v1h1z"/><path stroke="currentColor" stroke-width="1.5" d="M12.5 2.5L17.5 7.5 14.5 10.5 9.5 5.5 12.5 2.5z"/></svg>`,
  view: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M2 10c1.5-4 4.5-6.5 8-6.5s6.5 2.5 8 6.5c-1.5 4-4.5 6.5-8 6.5s-6.5-2.5-8-6.5z"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="2" d="M6 6L14 14M14 6L6 14"/></svg>`,
  status: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2" fill="currentColor"/></svg>`,
  capacity: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="8" width="4" height="8" stroke="currentColor" stroke-width="1.5"/><rect x="8" y="5" width="4" height="11" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="2" width="4" height="14" stroke="currentColor" stroke-width="1.5"/></svg>`,
  add: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="2" d="M10 3v14M3 10h14"/></svg>`
};

export default function mountNurses(root, { bus, store, user, role }) {
  const state = {
    nurses: [],
    filters: {
      search: '',
      specialty: '',
      areaId: '',
      status: 'active'
    },
    editingId: null,
    currentNurse: null,
    showModal: false,
    showStatusModal: false,
    showCapacityModal: false,
    currentPage: 1,
    itemsPerPage: 10
  };

  let elements = {};

  // Debounce helper to prevent overloading
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function init() {
    render();
    setupEventListeners();
    loadNurses();
    const unsubscribe = store.subscribe('nurses', loadNurses);

    // Return object with destroy method as expected by main.js
    return {
      destroy: () => {
        unsubscribe();
        // Cleanup global handlers
        delete window.nursesAction;
        delete window.nursesPage;
      }
    };
  }

  function loadNurses() {
    let raw = store.get('nurses') || [];
    state.nurses = raw.filter(nurse => {
      if (state.filters.search) {
        const s = state.filters.search.toLowerCase();
        const fields = [nurse.name, nurse.specialty, nurse.license].join(' ').toLowerCase();
        if (!fields.includes(s)) return false;
      }
      if (state.filters.specialty && nurse.specialty !== state.filters.specialty) return false;
      if (state.filters.areaId && nurse.areaId !== state.filters.areaId) return false;
      if (state.filters.status === 'active' && !nurse.isActive) return false;
      if (state.filters.status === 'inactive' && nurse.isActive !== false) return false;
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));

    renderNursesList();
    updateStats();
  }

  function render() {
    const canManage = role === 'admin' || role === 'receptionist';
    root.innerHTML = `
      <div class="module-doctors">
        <!-- Header -->
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <h2>Cuerpo de Enfermería</h2>
              <p class="text-muted">Gestión de personal de planta y atención</p>
            </div>
            ${canManage ? `
              <button class="btn btn-primary" id="btn-new-nurse">
                <span style="display: flex; align-items: center; gap: 0.5rem;">
                  ${icons.add} Nuevo Personal
                </span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-4" id="stats-container" class="mb-4"></div>

        <!-- Filtros -->
        <div class="card mb-4">
          <h3 class="mb-3">Búsqueda y Filtros</h3>
          <div class="grid grid-4">
            <div class="form-group">
              <label class="form-label">Buscar</label>
              <input type="text" class="input" id="filter-search" placeholder="Nombre, especialidad...">
            </div>
            <div class="form-group">
              <label class="form-label">Especialidad</label>
              <select class="input" id="filter-specialty">
                <option value="">Todas</option>
                <option value="Enfermería General">Enfermería General</option>
                <option value="Pediatría">Pediatría</option>
                <option value="Quirúrgica">Quirúrgica</option>
                <option value="Urgencias">Urgencias</option>
                <option value="Cuidados Intensivos">Cuidados Intensivos</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Área</label>
              <select class="input" id="filter-area"><option value="">Todas las áreas</option></select>
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="input" id="filter-status">
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="">Todos</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Lista -->
        <div class="card">
          <div class="card-header">
            <h3 style="margin: 0;">Personal Registrado</h3>
            <div class="text-muted" id="nurses-count">Cargando...</div>
          </div>
          <div class="table-responsive">
            <table class="table" id="nurses-table">
              <thead>
                <tr>
                  <th>Enfermero/a</th>
                  <th>Especialidad</th>
                  <th>Área</th>
                  <th>Horario/Turno</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="nurses-list"></tbody>
            </table>
          </div>
          <div id="pagination" class="flex justify-center items-center mt-3"></div>
        </div>

      </div>

      <!-- Modal Edición -->
      <div class="modal-overlay hidden" id="nurse-modal">
        <div class="modal-content" style="max-width: 800px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              REGISTRO DE PERSONAL DE ENFERMERÍA
            </div>
            <button class="btn-close-modal" id="btn-close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ${icons.close}
            </button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 65vh; overflow-y: auto;">
            <form id="nurse-form">
               <!-- Secciones del formulario -->
               <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                ${icons.user} DATOS PERSONALES
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">NOMBRE *</label><input type="text" class="input" id="form-name" required style="border-color: var(--modal-border); background: var(--modal-bg);"></div>
                <div class="form-group">
                  <label class="form-label font-bold" style="color: var(--modal-text);">CÉDULA / C.I. *</label>
                  <div class="doc-group">
                    <select class="input" id="form-doc-type" required style="border-color: var(--modal-border); background-color: var(--modal-bg);">
                      <option value="V">V</option>
                      <option value="E">E</option>
                      <option value="J">J</option>
                      <option value="P">P</option>
                    </select>
                    <input type="text" class="input" id="form-dni" required placeholder="Número de cédula" style="border-color: var(--modal-border); background: var(--modal-bg);">
                  </div>
                </div>
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">EMAIL *</label><input type="email" class="input" id="form-email" required style="border-color: var(--modal-border); background: var(--modal-bg);"></div>
                <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">TELÉFONO *</label><input type="tel" class="input" id="form-phone" required style="border-color: var(--modal-border); background: var(--modal-bg);"></div>
              </div>
              
              <div class="form-group mb-4"><label class="form-label font-bold" style="color: var(--modal-text);">DIRECCIÓN</label><input type="text" class="input" id="form-address" style="border-color: var(--modal-border); background: var(--modal-bg);"></div>

              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                ${icons.clipboard} DATOS PROFESIONALES
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                 <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text);">ESPECIALIDAD *</label>
                    <select class="input" id="form-specialty" style="border-color: var(--modal-border); background: var(--modal-bg);">
                       <option value="Enfermería General">Enfermería General</option>
                       <option value="Pediatría">Pediatría</option>
                       <option value="Quirúrgica">Quirúrgica</option>
                       <option value="Urgencias">Urgencias</option>
                       <option value="Cuidados Intensivos">Cuidados Intensivos</option>
                    </select>
                 </div>
                 <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">Nº LICENCIA *</label><input type="text" class="input" id="form-license" required style="border-color: var(--modal-border); background: var(--modal-bg);"></div>
              </div>
              <div class="form-group mb-4"><label class="form-label font-bold" style="color: var(--modal-text);">ÁREA *</label><select class="input" id="form-area" required style="border-color: var(--modal-border); background: var(--modal-bg);"></select></div>

              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: var(--modal-section-olive); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                ${icons.calendar} HORARIO Y CAPACIDAD
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                 <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">ENTRADA (TURNO)</label><input type="time" class="input" id="form-schedule-start" value="07:00" style="border-color: var(--modal-border); background: var(--modal-bg);"></div>
                 <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">SALIDA (TURNO)</label><input type="time" class="input" id="form-schedule-end" value="15:00" style="border-color: var(--modal-border); background: var(--modal-bg);"></div>
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                 <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">CAPACIDAD DIARIA (PACIENTES)</label><input type="number" class="input" id="form-daily-capacity" value="15" style="border-color: var(--modal-border); background: var(--modal-bg);"></div>
                 <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text);">ESTADO ACTUAL</label>
                    <select class="input" id="form-status" style="border-color: var(--modal-border); background: var(--modal-bg);">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="vacation">Vacaciones</option>
                      <option value="license">Licencia</option>
                    </select>
                 </div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                ${icons.user} CREDENCIALES DE ACCESO
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                <div class="form-group">
                  <label class="form-label font-bold" style="color: var(--modal-text);">USUARIO</label>
                  <input type="text" class="input" id="form-username" placeholder="Email por defecto" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
                <div class="form-group">
                  <label class="form-label font-bold" style="color: var(--modal-text);">CONTRASEÑA *</label>
                  <input type="password" class="input" id="form-password" placeholder="Mínimo 6 caracteres" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer" style="background: var(--modal-header); padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
             <button class="btn" id="btn-cancel" style="background: var(--danger); color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
             <button class="btn" id="btn-save" style="background: var(--success); color: #fff; border: none; padding: 0.75rem 2rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">GUARDAR CAMBIOS</button>
          </div>
        </div>
      </div>

      <!-- Modal Estado (idéntico a doctors.js) -->
      <div class="modal-overlay hidden" id="status-modal">
        <div class="modal-content" style="max-width: 500px; padding: 0;">
           <div class="modal-header" style="background: var(--warning); color: white; padding: 1.5rem; flex-direction: column; align-items:center; position:relative;">
              <h2 style="margin:0; font-size:1.25rem;">ACTUALIZAR ESTADO</h2>
              <div style="font-size:0.85rem; opacity:0.8; margin-top:0.25rem;">Estado laboral del enfermero</div>
              <button class="btn-close-modal" id="btn-close-status-modal" style="position:absolute; top:1rem; right:1rem; background:rgba(255,255,255,0.1); border:none; color:white; width:32px; height:32px; border-radius:50%;">${icons.close}</button>
           </div>
           <div class="modal-body" style="padding: 1.5rem;">
              <label class="form-label font-bold mb-2">NUEVO ESTADO</label>
              <select class="input mb-4" id="status-select">
                 <option value="active">Activo</option>
                 <option value="inactive">Inactivo</option>
                 <option value="vacation">Vacaciones</option>
                 <option value="license">Licencia</option>
              </select>
              <label class="form-label font-bold mb-2">MOTIVO / COMENTARIO</label>
              <textarea class="input" id="status-reason" rows="3" placeholder="Detalle el motivo del cambio..."></textarea>
           </div>
           <div class="modal-footer" style="padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; background: #f8fafc;">
              <button class="btn btn-outline" id="btn-cancel-status">CANCELAR</button>
              <button class="btn btn-primary" id="btn-save-status" style="background: var(--warning); border:none;">ACTUALIZAR</button>
           </div>
        </div>
      </div>

      <!-- Modal Capacidad (idéntico a doctors.js) -->
      <div class="modal-overlay hidden" id="capacity-modal">
        <div class="modal-content" style="max-width: 500px; padding: 0;">
           <div class="modal-header" style="background: var(--modal-text); color: white; padding: 1.5rem; flex-direction: column; align-items:center; position:relative;">
              <h2 style="margin:0; font-size:1.25rem;">AJUSTAR CAPACIDAD</h2>
              <div style="font-size:0.85rem; opacity:0.8; margin-top:0.25rem;">Límite de atención diaria</div>
              <button class="btn-close-modal" id="btn-close-capacity-modal" style="position:absolute; top:1rem; right:1rem; background:rgba(255,255,255,0.1); border:none; color:white; width:32px; height:32px; border-radius:50%;">${icons.close}</button>
           </div>
           <div class="modal-body" style="padding: 1.5rem;">
              <div class="bg-blue-50 p-4 rounded mb-4 flex items-center gap-4">
                 <div style="font-size:2rem; color:var(--info);">${icons.capacity}</div>
                 <div>
                    <div style="font-weight:bold; color:var(--info);">Capacidad Actual</div>
                    <div class="text-xs text-muted">Pacientes por turno</div>
                 </div>
                 <div style="font-size:2rem; font-weight:800; margin-left:auto;" id="current-capacity-display">0</div>
              </div>
              <label class="form-label font-bold mb-2">NUEVA CAPACIDAD</label>
              <div class="flex gap-2 mb-4">
                  <input type="range" id="capacity-slider" min="1" max="50" class="flex-1">
                  <input type="number" class="input w-20 text-center font-bold" id="capacity-value" min="1" max="50">
              </div>
              <div class="flex justify-between text-xs text-muted mb-4"><span>1 paciente</span><span>50 pacientes</span></div>
           </div>
           <div class="modal-footer" style="padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; background: #f8fafc;">
              <button class="btn btn-outline" id="btn-cancel-capacity">CANCELAR</button>
              <button class="btn btn-primary" id="btn-save-capacity" style="background: var(--success); border:none;">GUARDAR</button>
           </div>
        </div>
      </div>
    `;

    // References
    elements = {
      nursesList: root.querySelector('#nurses-list'),
      nursesCount: root.querySelector('#nurses-count'),
      pagination: root.querySelector('#pagination'),
      statsContainer: root.querySelector('#stats-container'),

      search: root.querySelector('#filter-search'),
      specialty: root.querySelector('#filter-specialty'),
      area: root.querySelector('#filter-area'),
      status: root.querySelector('#filter-status'),

      modal: root.querySelector('#nurse-modal'),
      statusModal: root.querySelector('#status-modal'),
      capacityModal: root.querySelector('#capacity-modal'),

      form: root.querySelector('#nurse-form'),
      fName: root.querySelector('#form-name'),
      fDocType: root.querySelector('#form-doc-type'),
      fDni: root.querySelector('#form-dni'),
      fEmail: root.querySelector('#form-email'),
      fPhone: root.querySelector('#form-phone'),
      fAddress: root.querySelector('#form-address'),
      fSpec: root.querySelector('#form-specialty'),
      fLicense: root.querySelector('#form-license'),
      fArea: root.querySelector('#form-area'),
      fStart: root.querySelector('#form-schedule-start'),
      fEnd: root.querySelector('#form-schedule-end'),
      fCap: root.querySelector('#form-daily-capacity'),
      fUser: root.querySelector('#form-username'),
      fPass: root.querySelector('#form-password'),
      fStatus: root.querySelector('#form-status'),

      btnNew: root.querySelector('#btn-new-nurse'),
      btnClose: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),

      btnSaveStatus: root.querySelector('#btn-save-status'),
      btnCancelStatus: root.querySelector('#btn-cancel-status'),
      btnCloseStatus: root.querySelector('#btn-close-status-modal'),
      statusSelect: root.querySelector('#status-select'),
      statusReason: root.querySelector('#status-reason'),

      btnSaveCapacity: root.querySelector('#btn-save-capacity'),
      btnCancelCapacity: root.querySelector('#btn-cancel-capacity'),
      btnCloseCapacity: root.querySelector('#btn-close-capacity-modal'),
      capacityValue: root.querySelector('#capacity-value'),
      capacitySlider: root.querySelector('#capacity-slider'),
      currentCapDisplay: root.querySelector('#current-capacity-display')
    };

    const areas = store.get('areas');
    const opts = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    elements.area.innerHTML += opts;
    if (elements.fArea) elements.fArea.innerHTML = `<option value="">Seleccione área</option>` + opts;
  }

  function renderNursesList() {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const items = state.nurses.slice(start, start + state.itemsPerPage);

    elements.nursesCount.textContent = `${state.nurses.length} Registros`;
    const canManage = role === 'admin' || role === 'receptionist';

    elements.nursesList.innerHTML = items.map(nurse => {
      const area = store.find('areas', nurse.areaId);
      return `
         <tr>
           <td>
              <div class="flex items-center gap-3">
                 <div>
                    <div class="font-bold">${nurse.name}</div>
                    <div class="text-xs text-muted">Lic: ${nurse.license}</div>
                 </div>
              </div>
           </td>
           <td>${nurse.specialty}</td>
           <td>${area?.name || '-'}</td>
           <td>
              <div class="text-sm">${nurse.scheduleStart || '07:00'} - ${nurse.scheduleEnd || '15:00'}</div>
           </td>
           <td>
              <div class="flex items-center gap-2">
                 <span class="badge ${nurse.isActive ? 'badge-success' : 'badge-danger'}">
                    ${nurse.status === 'vacation' ? 'Vacaciones' : (nurse.isActive ? 'Activo' : 'Inactivo')}
                 </span>
                 ${canManage ? `
                 <button class="btn btn-xs btn-outline" onclick="window.nursesAction('status', '${nurse.id}')" title="Cambiar">${icons.status}</button>
                 ` : ''}
              </div>
           </td>
           <td>
              <div class="flex gap-2">
                 <button class="btn btn-sm btn-outline" onclick="window.nursesAction('view', '${nurse.id}')" title="Ver Perfil">${icons.view}</button>
                 ${canManage ? `
                 <button class="btn btn-sm btn-outline" onclick="window.nursesAction('edit', '${nurse.id}')" title="Editar">${icons.edit}</button>
                 ` : ''}
              </div>
           </td>
         </tr>
       `;
    }).join('');

    window.nursesAction = (action, id) => {
      const nurse = state.nurses.find(n => n.id === id);
      if (!nurse) return;
      state.currentNurse = nurse;

      if (action === 'edit') openModal(nurse);
      if (action === 'view') viewNurse(nurse);
      if (action === 'status') {
        if (elements.statusSelect) {
          elements.statusSelect.value = nurse.status || 'active';
        }
        if (elements.statusModal) {
          elements.statusModal.classList.remove('hidden');
        }
      }
      if (action === 'capacity') {
        const cap = nurse.dailyCapacity || 15;
        if (elements.capacityValue) {
          elements.capacityValue.value = cap;
        }
        if (elements.capacitySlider) {
          elements.capacitySlider.value = cap;
        }
        if (elements.currentCapDisplay) {
          elements.currentCapDisplay.textContent = cap;
        }
        if (elements.capacityModal) {
          elements.capacityModal.classList.remove('hidden');
        }
      }
    };

    renderPagination();
  }

  function renderPagination() {
    const pages = Math.ceil(state.nurses.length / state.itemsPerPage);
    elements.pagination.innerHTML = Array.from({ length: pages }, (_, i) =>
      `<button class="btn btn-sm ${state.currentPage === i + 1 ? 'btn-primary' : 'btn-outline'}" 
           style="${state.currentPage === i + 1 ? 'background: transparent; color: var(--info);' : ''}"
           onclick="window.nursesPage(${i + 1})">${i + 1}</button>`
    ).join('');

    window.nursesPage = p => {
      state.currentPage = p;
      renderNursesList();
    };
  }
  function updateStats() {
    const total = state.nurses.length;
    const active = state.nurses.filter(n => n.isActive).length;
    elements.statsContainer.innerHTML = `
        <div class="card"><div class="text-muted text-sm">Total Enfermería</div><div class="text-2xl font-bold" style="color:var(--info)">${total}</div></div>
        <div class="card"><div class="text-muted text-sm">Activos</div><div class="text-2xl font-bold" style="color:var(--success)">${active}</div></div>
        <div class="card"><div class="text-muted text-sm">Áreas</div><div class="text-2xl font-bold" style="color:#f59e0b">${new Set(state.nurses.map(n => n.areaId)).size}</div></div>
        <div class="card"><div class="text-muted text-sm">Turnos</div><div class="text-2xl font-bold" style="color:#64748b">3</div></div>
      `;
  }

  function viewNurse(nurse) {
    const area = store.find('areas', nurse.areaId);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 850px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">PERFIL PROFESIONAL DE ENFERMERÍA</div>
            <button onclick="this.closest('.modal-overlay').remove()" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">${icons.close}</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2.5rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
               <div style="width: 100px; height: 100px; background: var(--modal-header); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: white;">${icons.nurse}</div>
               <div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: var(--modal-header); letter-spacing: 0.1em; margin-bottom: 0.5rem;">CUALIFICACIÓN PROFESIONAL</div>
                  <h3 style="margin: 0; font-size: 1.75rem; color: #1a202c; font-weight: 800;">${nurse.name}</h3>
                  <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                     <span class="badge badge-info">${nurse.specialty}</span>
                     <span class="badge ${nurse.isActive ? 'badge-success' : 'badge-danger'}">${nurse.isActive ? 'Activo' : 'Inactivo'}</span>
                  </div>
               </div>
            </div>
            
            <div class="grid grid-2 gap-4">
                <div style="background: var(--modal-bg); border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-header);">
                   <div style="font-weight: 800; color: #64748b; margin-bottom: 1rem;">IDENTIFICACIÓN</div>
                   <div class="grid grid-2">
                      <div><div class="text-xs text-muted font-bold">LICENCIA</div><div class="font-mono text-lg font-bold">${nurse.license}</div></div>
                      <div><div class="text-xs text-muted font-bold">CÉDULA / ID</div><div class="font-bold">${nurse.docType || 'V'}-${nurse.dni || '-'}</div></div>
                   </div>
                   <div class="mt-4">
                      <div class="text-xs text-muted font-bold">CONTACTO</div>
                      <div>${nurse.phone} • ${nurse.email}</div>
                   </div>
                </div>
                
                <div style="background: #f0fdf4; border-radius: 8px; padding: 1.5rem; border-left: 4px solid #16a34a;">
                   <div style="font-weight: 800; color: #166534; margin-bottom: 1rem;">HORARIO Y ÁREA</div>
                   <div class="text-xl font-bold text-gray-800">${nurse.scheduleStart || '07:00'} - ${nurse.scheduleEnd || '15:00'}</div>
                   <div class="text-sm font-bold text-gray-600 mb-2">Turno Regular</div>
                   <div class="flex items-center gap-2">
                      <span class="badge" style="background:white; border:1px solid #ddd;">${area?.name || 'General'}</span>
                      <span class="badge" style="background:white; border:1px solid #ddd;">Capacidad: ${nurse.dailyCapacity || 15}</span>
                   </div>
                </div>
            </div>
            <div class="mt-4 flex justify-end">
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Cerrar Perfil</button>
            </div>
          </div>
        </div>
      `;
    document.body.appendChild(modal);
  }

  function setupEventListeners() {
    if (elements.btnNew) elements.btnNew.addEventListener('click', () => openModal());
    if (elements.btnClose) elements.btnClose.addEventListener('click', closeModal);
    if (elements.btnCancel) elements.btnCancel.addEventListener('click', closeModal);
    if (elements.btnSave) elements.btnSave.addEventListener('click', saveNurse);

    // Debounced search to prevent system overload
    const debouncedLoad = debounce(() => {
      state.filters.search = elements.search ? elements.search.value : '';
      state.currentPage = 1;
      loadNurses();
    }, 300);
    if (elements.search) elements.search.addEventListener('input', debouncedLoad);

    // Immediate update for selects
    [elements.area, elements.specialty, elements.status].forEach(el => {
      if (el) el.addEventListener('change', () => {
        state.filters.search = elements.search ? elements.search.value : '';
        state.filters.specialty = elements.specialty ? elements.specialty.value : '';
        state.filters.areaId = elements.area ? elements.area.value : '';
        state.filters.status = elements.status ? elements.status.value : 'active';
        state.currentPage = 1;
        loadNurses();
      });
    });

    // Status Modal Events
    if (elements.btnCancelStatus) {
      elements.btnCancelStatus.addEventListener('click', () => {
        if (elements.statusModal) elements.statusModal.classList.add('hidden');
      });
    }

    if (elements.btnCloseStatus) {
      elements.btnCloseStatus.addEventListener('click', () => {
        if (elements.statusModal) elements.statusModal.classList.add('hidden');
      });
    }

    if (elements.btnSaveStatus) {
      elements.btnSaveStatus.addEventListener('click', () => {
        if (!state.currentNurse) return;
        const newStatus = elements.statusSelect ? elements.statusSelect.value : 'active';
        store.update('nurses', state.currentNurse.id, {
          status: newStatus,
          isActive: newStatus === 'active'
        });
        if (elements.statusModal) elements.statusModal.classList.add('hidden');
        loadNurses();
      });
    }

    // Capacity Modal Events
    const updateSlider = (e) => {
      if (elements.capacityValue) elements.capacityValue.value = e.target.value;
      if (elements.currentCapDisplay) elements.currentCapDisplay.textContent = e.target.value;
    };

    const updateInput = (e) => {
      if (elements.capacitySlider) elements.capacitySlider.value = e.target.value;
      if (elements.currentCapDisplay) elements.currentCapDisplay.textContent = e.target.value;
    };

    if (elements.capacitySlider) elements.capacitySlider.addEventListener('input', updateSlider);
    if (elements.capacityValue) elements.capacityValue.addEventListener('input', updateInput);

    if (elements.btnCancelCapacity) {
      elements.btnCancelCapacity.addEventListener('click', () => {
        if (elements.capacityModal) elements.capacityModal.classList.add('hidden');
      });
    }

    if (elements.btnCloseCapacity) {
      elements.btnCloseCapacity.addEventListener('click', () => {
        if (elements.capacityModal) elements.capacityModal.classList.add('hidden');
      });
    }

    if (elements.btnSaveCapacity) {
      elements.btnSaveCapacity.addEventListener('click', () => {
        if (!state.currentNurse) return;
        const cap = parseInt(elements.capacityValue ? elements.capacityValue.value : 15);
        if (cap > 0) {
          store.update('nurses', state.currentNurse.id, { dailyCapacity: cap });
          if (elements.capacityModal) elements.capacityModal.classList.add('hidden');
          loadNurses();
        }
      });
    }
  }

  function openModal(nurse = null) {
    state.editingId = nurse?.id || null;
    if (elements.modal) elements.modal.classList.remove('hidden');
    if (elements.form) elements.form.reset();

    if (nurse) {
      if (elements.fName) elements.fName.value = nurse.name;
      if (elements.fDocType) elements.fDocType.value = nurse.docType || 'V';
      if (elements.fDni) elements.fDni.value = nurse.dni || '';
      if (elements.fPhone) elements.fPhone.value = nurse.phone;
      if (elements.fEmail) elements.fEmail.value = nurse.email;
      if (elements.fAddress) elements.fAddress.value = nurse.address || '';
      if (elements.fLicense) elements.fLicense.value = nurse.license;
      if (elements.fSpec) elements.fSpec.value = nurse.specialty;
      if (elements.fArea) elements.fArea.value = nurse.areaId;
      if (elements.fStart) elements.fStart.value = nurse.scheduleStart || '07:00';
      if (elements.fEnd) elements.fEnd.value = nurse.scheduleEnd || '15:00';
      if (elements.fCap) elements.fCap.value = nurse.dailyCapacity || 15;
      if (elements.fStatus) elements.fStatus.value = nurse.status || 'active';

      // Para edición, no requerir contraseña
      if (elements.fPass) elements.fPass.required = false;
    } else {
      // Para nuevo registro, requerir contraseña
      if (elements.fPass) elements.fPass.required = true;
    }
  }

  function closeModal() {
    state.editingId = null;
    if (elements.modal) elements.modal.classList.add('hidden');
  }

  function saveNurse() {
    if (!elements.form.checkValidity()) {
      elements.form.reportValidity();
      return;
    }

    // Validar permisos para crear y editar
    const canManage = role === 'admin' || role === 'receptionist';
    if (!canManage) {
      alert('No tienes permiso para gestionar personal de enfermería');
      return;
    }

    const status = elements.fStatus ? elements.fStatus.value : 'active';
    const data = {
      name: elements.fName ? elements.fName.value : '',
      docType: elements.fDocType ? elements.fDocType.value : 'V',
      dni: elements.fDni ? elements.fDni.value.trim() : '',
      phone: elements.fPhone ? elements.fPhone.value : '',
      email: elements.fEmail ? elements.fEmail.value : '',
      address: elements.fAddress ? elements.fAddress.value : '',
      license: elements.fLicense ? elements.fLicense.value : '',
      specialty: elements.fSpec ? elements.fSpec.value : 'Enfermería General',
      areaId: elements.fArea ? elements.fArea.value : '',
      scheduleStart: elements.fStart ? elements.fStart.value : '07:00',
      scheduleEnd: elements.fEnd ? elements.fEnd.value : '15:00',
      dailyCapacity: parseInt(elements.fCap ? elements.fCap.value : 15),
      status: status,
      isActive: status === 'active'
    };

    if (state.editingId) {
      store.update('nurses', state.editingId, data);
    } else {
      const n = store.add('nurses', data);
      const username = elements.fUser ? elements.fUser.value || data.email.split('@')[0] : data.email.split('@')[0];
      const password = elements.fPass ? elements.fPass.value : 'demo123';
      store.add('users', {
        username,
        password,
        name: data.name,
        role: 'nurse',
        email: data.email,
        staffId: n.id
      });
    }
    closeModal();
    loadNurses();
  }

  return init();
}