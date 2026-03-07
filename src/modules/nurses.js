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
  add: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="2" d="M10 3v14M3 10h14"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
};

export default function mountNurses(root, { bus, store, user, role }) {
  const state = {
    nurses: [],
    filters: {
      search: '',
      specialty: '',
      areaId: '',
      status: 'all'
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
      // Solo filtrar por estado si el usuario eligió uno específico (no 'all')
      if (state.filters.status && state.filters.status !== 'all') {
        if (state.filters.status === 'active' && !nurse.isActive) return false;
        if (state.filters.status === 'inactive' && nurse.isActive !== false) return false;
        if (state.filters.status === 'vacation' && nurse.status !== 'vacation') return false;
        if (state.filters.status === 'license' && nurse.status !== 'license') return false;
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));

    renderNursesList();
    updateStats();
  }

  function render() {
    const canManage = role === 'admin' || role === 'receptionist';
    root.innerHTML = `
      <div class="module-doctors">
        <!-- Estadísticas -->
        <div class="stats-auto-grid mb-4" id="stats-container"></div>

        <div class="card" style="padding: 0.75rem 1rem;">
          <div class="flex justify-between items-center">
            ${canManage ? `
              <button class="btn btn-primary" id="btn-new-nurse">
                <span style="display: flex; align-items: center; gap: 0.5rem;">
                  ${icons.add} Nuevo Personal
                </span>
              </button>
            ` : '<div></div>'}
            <div class="search-input-wrapper" style="position: relative; width: 450px;">
              <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
                ${icons.search || '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'}
              </span>
              <input type="text" class="input" id="filter-search" 
                     placeholder="Buscar por nombre, especialidad, área, estado..." 
                     style="padding-left: 2.8rem; border-radius: 20px; background: rgba(0,0,0,0.05); border: 1px solid transparent; transition: all 0.3s; height: 40px; width: 100%;">
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
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h3>
              <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">
                REGISTRO DE PERSONAL DE ENFERMERÍA
              </div>
            </div>
            <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-modal">&times;</button>
          </div>
          
          <div class="modal-body" style="padding: 1.5rem; max-height: 65vh; overflow-y: auto;">
            <form id="nurse-form">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: var(--neutralPrimary); display: flex; align-items: center; gap: 8px;">
                  ${icons.user} DATOS PERSONALES
                </h4>
                <div class="grid grid-2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">NOMBRE *</label>
                    <input type="text" class="input" id="form-name" required style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">CÉDULA / C.I. *</label>
                    <div class="doc-group" style="display: flex; gap: 0;">
                      <select class="input" id="form-doc-type" required style="width: 70px; border-radius: 4px 0 0 4px; border-right: none; background: #fff; height: 38px;">
                        <option value="V">V</option>
                        <option value="E">E</option>
                        <option value="J">J</option>
                        <option value="P">P</option>
                      </select>
                      <input type="text" class="input" id="form-dni" required placeholder="Número de cédula" style="flex: 1; border-radius: 0 4px 4px 0; height: 38px;">
                    </div>
                  </div>
                </div>
                <div class="grid grid-2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">EMAIL *</label>
                    <input type="email" class="input" id="form-email" required style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">TELÉFONO *</label>
                    <input type="tel" class="input" id="form-phone" required style="height: 38px;">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">DIRECCIÓN</label>
                  <input type="text" class="input" id="form-address" style="height: 38px;">
                </div>
              </div>

               <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; border: 1px solid #c2e0ff; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #005a9e; display: flex; align-items: center; gap: 8px;">
                  ${icons.clipboard} DATOS PROFESIONALES
                </h4>
                <div class="grid grid-2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">ESPECIALIDAD *</label>
                    <select class="input" id="form-specialty" style="height: 38px;">
                       <option value="Enfermería General">Enfermería General</option>
                       <option value="Pediatría">Pediatría</option>
                       <option value="Quirúrgica">Quirúrgica</option>
                       <option value="Urgencias">Urgencias</option>
                       <option value="Cuidados Intensivos">Cuidados Intensivos</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">Nº LICENCIA *</label>
                    <input type="text" class="input" id="form-license" required style="height: 38px;">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">ÁREA *</label>
                  <select class="input" id="form-area" required style="height: 38px;"></select>
                </div>
              </div>

              <div style="background: #fffcf5; padding: 20px; border-radius: 8px; border: 1px solid #fff1c1; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #856404; display: flex; align-items: center; gap: 8px;">
                  ${icons.calendar} HORARIO Y CAPACIDAD
                </h4>
                <div class="grid grid-2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">ENTRADA (TURNO)</label>
                    <input type="time" class="input" id="form-schedule-start" value="07:00" style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">SALIDA (TURNO)</label>
                    <input type="time" class="input" id="form-schedule-end" value="15:00" style="height: 38px;">
                  </div>
                </div>
                <div class="grid grid-2 gap-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">CAPACIDAD DIARIA</label>
                    <input type="number" class="input" id="form-daily-capacity" value="15" style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">ESTADO ACTUAL</label>
                    <select class="input" id="form-status" style="height: 38px;">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                      <option value="vacation">Vacaciones</option>
                      <option value="license">Licencia</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 5px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #1e40af; display: flex; align-items: center; gap: 8px;">
                  ${icons.user} CREDENCIALES DE ACCESO
                </h4>
                <div class="grid grid-2 gap-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">USUARIO</label>
                    <input type="text" class="input" id="form-username" placeholder="Email por defecto" style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">CONTRASEÑA *</label>
                    <input type="password" class="input" id="form-password" placeholder="Mínimo 6 caracteres" style="height: 38px;">
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
             <button class="btn-circle btn-circle-cancel" id="btn-cancel" title="Cancelar">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
             <button class="btn-circle btn-circle-save" id="btn-save" title="Guardar Cambios">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </button>
          </div>
        </div>
      </div>

      <!-- Modal Estado (idéntico a doctors.js) -->
      <div class="modal-overlay hidden" id="status-modal">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">CAMBIAR ESTADO</h3>
              <div id="status-modal-name" style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">
                Personal de Enfermería
              </div>
            </div>
            <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-status-modal">&times;</button>
          </div>
          
          <div class="modal-body" style="padding: 1.5rem;">
            <form id="status-form">
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO ACTUAL</label>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                  <div id="status-modal-badge" style="width: 12px; height: 12px; border-radius: 50%; background: var(--success);"></div>
                  <span id="status-modal-text" style="font-weight: 600;">ACTIVO</span>
                  <span id="status-modal-subtext" class="hidden" style="margin-left: 0.5rem;"></span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NUEVO ESTADO *</label>
                <select class="input" id="status-select" required style="border-color: var(--neutralTertiary); background: var(--white);">
                  <option value="">Seleccionar estado</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="vacation">Vacaciones</option>
                  <option value="license">Licencia</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MOTIVO DEL CAMBIO</label>
                <textarea class="input" id="status-reason" rows="3" placeholder="Ej: Vacaciones programadas, licencia médica..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA DE REINTEGRO</label>
                <input type="date" class="input" id="status-return-date" style="border-color: var(--neutralTertiary); background: var(--white);">
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn-circle" id="btn-cancel-status" title="Cancelar" style="background-color: #64748b; color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button class="btn-circle" id="btn-save-status" title="Actualizar Estado" style="background-color: var(--success); color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Capacidad (idéntico a doctors.js) -->
      <div class="modal-overlay hidden" id="capacity-modal">
        <div class="modal-content" style="max-width: 500px;">
           <div class="modal-header">
              <div>
                <h3 class="modal-title">AJUSTAR CAPACIDAD</h3>
                <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">Límite de atención diaria</div>
              </div>
              <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-capacity-modal">&times;</button>
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
           <div class="modal-footer">
              <button class="btn-circle" id="btn-cancel-capacity" title="Cancelar" style="background-color: #64748b; color: white;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <button class="btn-circle" id="btn-save-capacity" title="Guardar Cambios" style="background-color: var(--themePrimary); color: white;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
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

    const areas = store.get('areas') || [];
    const opts = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    if (elements.area) elements.area.innerHTML += opts;
    if (elements.fArea) elements.fArea.innerHTML = `<option value="">Seleccione área</option>` + opts;
  }

  function renderNursesList() {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const items = state.nurses.slice(start, start + state.itemsPerPage);

    if (elements.nursesCount) elements.nursesCount.textContent = `${state.nurses.length} Registros`;
    const canManageAll = role === 'admin' || role === 'receptionist';
    const isOwnNurse = (n) => role === 'nurse' && user?.staffId === n.id;

    elements.nursesList.innerHTML = items.map(nurse => {
      const area = store.find('areas', nurse.areaId);
      const canEdit = canManageAll || isOwnNurse(nurse);
      const canChangeStatus = canManageAll; // SOLO admin/recep
      return `
         <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
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
              <span class="badge ${nurse.isActive ? 'badge-success' : 'badge-danger'}">
                 ${nurse.status === 'vacation' ? 'Vacaciones' : (nurse.isActive ? 'Activo' : 'Inactivo')}
              </span>
           </td>
           <td>
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                 <button class="btn-circle btn-circle-status" data-action="view" data-id="${nurse.id}" title="Ver Perfil">${icons.view || ICONS.eye}</button>
                 ${canChangeStatus ? `
                 <button class="btn-circle btn-circle-cancel" data-action="status" data-id="${nurse.id}" title="Cambiar Estado">${ICONS.sync}</button>
                 <button class="btn-circle btn-circle-view" data-action="capacity" data-id="${nurse.id}" title="Ajustar Capacidad">${icons.capacity || ICONS.chart}</button>
                 ` : ''}
                 ${canEdit ? `
                 <button class="btn-circle btn-circle-edit" data-action="edit" data-id="${nurse.id}" title="Editar">${icons.edit || ICONS.edit}</button>
                 ` : ''}
              </div>
           </td>
        </tr>
      `;
    }).join('');


    // Event delegation para acciones
    elements.nursesList.onclick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const nurse = state.nurses.find(n => n.id === id);
      if (!nurse) return;
      state.currentNurse = nurse;
      if (action === 'edit') openModal(nurse);
      if (action === 'view') viewNurse(nurse);
      if (action === 'status') {
        const modalName = root.querySelector('#status-modal-name');
        if (modalName) modalName.textContent = nurse.name;

        const badge = root.querySelector('#status-modal-badge');
        const text = root.querySelector('#status-modal-text');
        const subtext = root.querySelector('#status-modal-subtext');

        if (badge) badge.style.background = nurse.isActive ? 'var(--success)' : 'var(--danger)';
        if (text) text.textContent = nurse.isActive ? 'ACTIVO' : 'INACTIVO';

        if (subtext) {
          if (nurse.status === 'vacation') {
            subtext.innerHTML = '<span class="badge badge-warning">Vacaciones</span>';
            subtext.classList.remove('hidden');
          } else if (nurse.status === 'license') {
            subtext.innerHTML = '<span class="badge badge-info">Licencia</span>';
            subtext.classList.remove('hidden');
          } else {
            subtext.innerHTML = '';
            subtext.classList.add('hidden');
          }
        }

        if (elements.statusSelect) elements.statusSelect.value = nurse.status || 'active';

        const reasonInput = root.querySelector('#status-reason');
        if (reasonInput) reasonInput.value = nurse.statusReason || '';

        const returnDateInput = root.querySelector('#status-return-date');
        if (returnDateInput) {
          const today = new Date().toISOString().split('T')[0];
          returnDateInput.min = today;
          returnDateInput.value = nurse.statusReturnDate || '';
        }

        if (elements.statusModal) elements.statusModal.classList.remove('hidden');
      }
      if (action === 'capacity') {
        const cap = nurse.dailyCapacity || 15;
        if (elements.capacityValue) elements.capacityValue.value = cap;
        if (elements.capacitySlider) elements.capacitySlider.value = cap;
        if (elements.currentCapDisplay) elements.currentCapDisplay.textContent = cap;
        if (elements.capacityModal) elements.capacityModal.classList.remove('hidden');
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
    const areasCount = new Set(state.nurses.map(n => n.areaId)).size;

    elements.statsContainer.innerHTML = `
      <div class="stat-info-card">
        <span class="stat-info-label">Total Personal</span>
        <span class="stat-info-value">${total}</span>
        <span class="stat-info-sub">${icons.nurse} Registrados</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Personal Activo</span>
        <span class="stat-info-value">${active}</span>
        <span class="stat-info-sub">${icons.successCheck} Operativos</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Cobertura Áreas</span>
        <span class="stat-info-value">${areasCount}</span>
        <span class="stat-info-sub">${icons.area} Áreas asistidas</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Turnos</span>
        <span class="stat-info-value">3</span>
        <span class="stat-info-sub">${icons.calendar} 24h / 7d</span>
      </div>
    `;
  }

  function viewNurse(nurse) {
    const area = store.find('areas', nurse.areaId);
    const canManageAll = role === 'admin' || role === 'receptionist';
    const isOwnNurse = (n) => role === 'nurse' && user?.staffId === n.id;


    // Estadísticas básicas de la enfermera
    const allAppointments = store.get('appointments') || [];
    const today = new Date().toDateString();
    const todayApts = allAppointments.filter(a =>
      (a.nurseId === nurse.id || a.assignedNurse === nurse.id) &&
      new Date(a.dateTime).toDateString() === today
    ).length;
    const totalApts = allAppointments.filter(a =>
      a.nurseId === nurse.id || a.assignedNurse === nurse.id
    ).length;
    const pendingApts = allAppointments.filter(a =>
      (a.nurseId === nurse.id || a.assignedNurse === nurse.id) &&
      (a.status === 'pending' || a.status === 'confirmed')
    ).length;
    const completedApts = allAppointments.filter(a =>
      (a.nurseId === nurse.id || a.assignedNurse === nurse.id) &&
      a.status === 'completed'
    ).length;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-nurse-modal';
    modalContainer.className = 'modal-overlay';
    modalContainer.style.zIndex = '1000';

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 850px;">
        <!-- Cabecera institucional -->
        <div class="modal-header">
          <div>
            <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h3>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">PERSONAL DE ENFERMERÍA</div>
          </div>
          <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="close-nurse-hdr">&times;</button>
        </div>

        <!-- Cuerpo -->
        <div class="modal-body" style="padding: 2rem; max-height: 70vh; overflow-y: auto;">

          <!-- Encabezado de Perfil -->
          <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2.5rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
            <div style="width: 100px; height: 100px; background: var(--card-patient); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: relative; color: var(--modal-header);">
              ${icons.nurse}
            </div>
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--modal-header); letter-spacing: 0.1em; margin-bottom: 0.5rem;">CUALIFICACIÓN PROFESIONAL</div>
              <h3 style="margin: 0; font-size: 1.75rem; color: #1a202c; font-weight: 800;">${nurse.name}</h3>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge" style="background: var(--modal-header); color: white; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700;">${nurse.specialty || 'Enfermería General'}</span>
                <span style="color: #4a5568; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                  ${icons.area} ${area?.name || 'Área General'}
                </span>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge ${nurse.isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                  ${nurse.isActive ? icons.successCheck : icons.warning}
                  ${nurse.isActive ? 'Activo' : 'Inactivo'}
                  ${nurse.status === 'vacation' ? ' (Vacaciones)' : nurse.status === 'license' ? ' (Licencia)' : ''}
                </span>
                <span class="badge badge-info" style="font-size: 0.75rem;">
                  Capacidad: ${nurse.dailyCapacity || 15}/día
                </span>
              </div>
            </div>
          </div>

          <!-- Información Dividida -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
            <!-- Identificación y Licencia -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-header);">
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 1rem; letter-spacing: 0.05em;">
                ${icons.clipboard} IDENTIFICACIÓN Y REGISTRO
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">LICENCIA N°</div>
                  <div style="font-family: monospace; font-weight: 700; font-size: 1.1rem; color: var(--modal-header);">${nurse.license || '-'}</div>
                </div>
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">CÉDULA / ID</div>
                  <div style="font-weight: 600;">${nurse.docType || 'V'}-${nurse.dni || 'No registrado'}</div>
                </div>
              </div>
              <div style="margin-top: 1rem;">
                <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">CONTACTO</div>
                <div style="font-size: 0.9rem; color: #475569; margin-top: 0.25rem;">
                  📞 ${nurse.phone || 'N/A'}<br>
                  ✉️ ${nurse.email || 'N/A'}
                </div>
              </div>
            </div>

            <!-- Horario y Turno -->
            <div style="background: var(--modal-section-forest-light); border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-section-forest);">
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 800; color: var(--modal-section-forest); margin-bottom: 1rem; letter-spacing: 0.05em;">
                ${icons.calendar} HORARIO Y TURNO
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="font-weight: 800; font-size: 1.25rem; color: #1a202c;">
                  ${nurse.scheduleStart || '07:00'} - ${nurse.scheduleEnd || '15:00'}
                </div>
                <div style="font-size: 0.9rem; color: #2d3748; font-weight: 600;">
                  ${nurse.workDays && nurse.workDays.length > 0
        ? nurse.workDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
        : 'Lunes a Viernes'}
                </div>
                <div style="font-size: 0.85rem; color: #4a5568; display: flex; align-items: center; gap: 0.25rem;">
                  ${icons.area} Área: <span style="font-weight: 700; margin-left: 0.25rem;">${area?.name || 'General'}</span>
                </div>
                <div style="font-size: 0.85rem; color: #4a5568; display: flex; align-items: center; gap: 0.25rem;">
                  ${icons.capacity || icons.nurse} <span style="font-weight: 700;">${nurse.dailyCapacity || 15} pacientes</span> máximo por día
                </div>
              </div>
            </div>
          </div>

          <!-- Panel de Estadísticas (Grid 4) -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2.5rem;">
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">TOTAL ATENDIDOS</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-header);">${totalApts}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">HOY</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-section-gold);">${todayApts}</div>
              <div style="font-size: 0.75rem; color: #64748b;">de ${nurse.dailyCapacity || 15}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">PENDIENTES</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #3182ce;">${pendingApts}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">COMPLETADOS</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-section-forest);">${completedApts}</div>
            </div>
          </div>

          <!-- Datos adicionales -->
          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 0.75rem; letter-spacing: 0.05em;">INFORMACIÓN ADICIONAL</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; font-size: 0.85rem;">
              <div>
                <div style="font-weight: 700; color: #334155; font-size: 0.7rem;">FECHA DE REGISTRO</div>
                <div>${nurse.createdAt ? new Date(nurse.createdAt).toLocaleDateString('es-ES') : '-'}</div>
              </div>
              <div>
                <div style="font-weight: 700; color: #334155; font-size: 0.7rem;">DIRECCIÓN</div>
                <div>${nurse.address || 'No registrada'}</div>
              </div>
              <div>
                <div style="font-weight: 700; color: #334155; font-size: 0.7rem;">NOTAS</div>
                <div>${nurse.notes || 'Sin observaciones'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer con btn-circle -->
        <div class="modal-footer">
          ${(canManageAll || isOwnNurse(nurse)) ? `
            <button class="btn-circle btn-circle-edit" id="edit-nurse-btn" data-id="${nurse.id}" title="Editar Perfil">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          ` : ''}
          ${canManageAll ? `
            <button class="btn-circle btn-circle-cancel" id="status-nurse-btn" data-id="${nurse.id}" title="Cambiar Estado">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          ` : ''}
          <button class="btn-circle btn-circle-cancel" id="close-nurse-ftr" title="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const closeModal = () => modalContainer.remove();
    modalContainer.querySelector('#close-nurse-hdr').addEventListener('click', closeModal);
    modalContainer.querySelector('#close-nurse-ftr').addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });
    const escH = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);

    const editBtn = modalContainer.querySelector('#edit-nurse-btn');
    if (editBtn) editBtn.addEventListener('click', () => { closeModal(); openModal(nurse); });

    const statusBtn = modalContainer.querySelector('#status-nurse-btn');
    if (statusBtn) statusBtn.addEventListener('click', () => {
      closeModal();
      state.currentNurse = nurse;
      const modalName = root.querySelector('#status-modal-name');
      if (modalName) modalName.textContent = nurse.name;
      const badge = root.querySelector('#status-modal-badge');
      const text = root.querySelector('#status-modal-text');
      if (badge) badge.style.background = nurse.isActive ? 'var(--success)' : 'var(--danger)';
      if (text) text.textContent = nurse.isActive ? 'ACTIVO' : 'INACTIVO';
      if (elements.statusSelect) elements.statusSelect.value = nurse.status || 'active';
      if (elements.statusModal) elements.statusModal.classList.remove('hidden');
    });
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
        if (!newStatus) {
          showNotification('Por favor, seleccione un estado', 'warning');
          return;
        }
        const reasonInput = root.querySelector('#status-reason');
        const returnDateInput = root.querySelector('#status-return-date');
        store.update('nurses', state.currentNurse.id, {
          status: newStatus,
          isActive: newStatus === 'active',
          statusReason: reasonInput ? reasonInput.value.trim() : null,
          statusReturnDate: returnDateInput ? returnDateInput.value : null,
          statusChangedBy: user?.id || 'system',
          statusChangedAt: new Date().toISOString()
        });
        // Cerrar modal PRIMERO, luego mostrar notificación (igual que doctors.js)
        if (elements.statusModal) elements.statusModal.classList.add('hidden');
        showNotification('Estado actualizado correctamente', 'success');
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

    if (elements.fDni) {
      elements.fDni.addEventListener('input', debounce(handleRegistryLookup, 500));
    }
    if (elements.fDocType) {
      elements.fDocType.addEventListener('change', handleRegistryLookup);
    }
  }

  // --- Lógica de Precarga por Cédula (SAIME Simulation) ---
  function handleRegistryLookup() {
    if (state.editingId) return;

    const docType = elements.fDocType.value;
    const dni = elements.fDni.value.trim();

    if (dni && dni.length >= 6) {
      if (elements.fDni) elements.fDni.style.opacity = '0.7';

      setTimeout(() => {
        const found = store.fetchFromRegistry(docType, dni);
        if (elements.fDni) elements.fDni.style.opacity = '1';

        if (found) {
          showNotification(`Datos encontrados para C.I. ${docType}-${dni}. Precargando...`, 'info');

          if (elements.fName) elements.fName.value = found.name;
          if (elements.fEmail && !elements.fEmail.value) elements.fEmail.value = found.email || '';
          if (elements.fPhone && !elements.fPhone.value) elements.fPhone.value = found.phone || '';

          if (elements.fName) {
            elements.fName.style.transition = 'background 0.5s';
            elements.fName.style.backgroundColor = '#f0fdf4';
            setTimeout(() => { elements.fName.style.backgroundColor = ''; }, 2000);
          }
        }
      }, 700);
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

  // Mostrar notificación toast (idéntico a doctors.js)
  function showNotification(message, type = 'info') {
    const icons_notif = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M6 10.5l2.5 2 5-5"/></svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M10 3v8"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/></svg>`,
      error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M10 3v8"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/></svg>`,
      info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M10 7v5"/><circle cx="10" cy="14" r="1" fill="currentColor"/></svg>`
    };
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? 'var(--success)' :
        type === 'error' ? 'var(--danger)' :
          type === 'warning' ? 'var(--warning)' : 'var(--info)'};
      color: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      min-width: 280px;
    `;
    notification.innerHTML = `${icons_notif[type] || icons_notif.info} ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  return init();
}