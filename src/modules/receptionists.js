import { Logger } from '../utils/logger.js';

/**
 * Módulo de Recepción - Gestión completa
 * Modal y diseño EXACTO al módulo médico.
 */

const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="2.25" y="3.75" width="15.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6 1.75v3.5M14 1.75v3.5"/><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M2 7.5h16"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="4.25" y="3.75" width="11.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/><rect x="6.75" y="2" width="6.5" height="3.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,
  receptionist: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M17 21v-2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2"/><path d="M9 20h6"/><path d="M12 7V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3"/><path d="M8 7V4a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v3"/></svg>`,
  area: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" fill="none" viewBox="0 0 20 20"><rect x="2.25" y="4.25" width="15.5" height="10.5" rx="1.75" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6.5 15.75V17a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-1.25"/></svg>`,
  successCheck: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M6 10.5l2.5 2 5-5"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M10 3v8"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M2.5 17.5L8 12l-1-1-5.5 5.5v1h1z"/><path stroke="currentColor" stroke-width="1.5" d="M12.5 2.5L17.5 7.5 14.5 10.5 9.5 5.5 12.5 2.5z"/></svg>`,
  add: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="2" d="M10 3v14M3 10h14"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="2" d="M6 6L14 14M14 6L6 14"/></svg>`,
  status: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2" fill="currentColor"/></svg>`,
  view: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M2 10c1.5-4 4.5-6.5 8-6.5s6.5 2.5 8 6.5c-1.5 4-4.5 6.5-8 6.5s-6.5-2.5-8-6.5z"/></svg>`,
  filter: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M2 4h16v2l-5 5v5l-2 2v-7L2 6V4z"/></svg>`
};

export default function mountReceptionists(root, { bus, store, user, role }) {
  const state = {
    receptionists: [],
    filters: {
      search: '',
      specialty: '',
      areaId: '',
      status: 'all'
    },
    editingId: null,
    currentRec: null,
    itemsPerPage: 10,
    currentPage: 1,
    showModal: false,
    showStatusModal: false
  };

  let elements = {};

  // Debounce helper
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
    loadItems();
    const unsubscribe = store.subscribe('receptionists', loadItems);

    return {
      destroy: () => {
        unsubscribe();
        delete window.recAction;
        delete window.recPage;
      }
    };
  }

  function loadItems() {
    let raw = store.get('receptionists') || [];
    state.receptionists = raw.filter(item => {
      if (state.filters.search && !item.name.toLowerCase().includes(state.filters.search.toLowerCase())) return false;
      // Solo filtrar por estado si el usuario eligió uno específico (no 'all')
      if (state.filters.status && state.filters.status !== 'all') {
        if (state.filters.status === 'active' && !item.isActive) return false;
        if (state.filters.status === 'inactive' && item.isActive !== false) return false;
        if (state.filters.status === 'vacation' && item.status !== 'vacation') return false;
        if (state.filters.status === 'license' && item.status !== 'license') return false;
      }
      return true;
    });
    renderList();
    updateStats();
  }

  function render() {
    const canManage = role === 'admin';
    root.innerHTML = `
      <div class="module-doctors">
        <!-- Estadísticas -->
        <div class="stats-auto-grid mb-4" id="stats-container"></div>

        <div class="card" style="padding: 0.75rem 1rem;">
          <div class="flex justify-between items-center">
            ${canManage ? `
              <button class="btn btn-primary" id="btn-new-rec">
                <span style="display: flex; align-items: center; gap: 0.5rem;">
                  ${icons.add} Nuevo Staff
                </span>
              </button>
            ` : '<div></div>'}
            <div class="search-input-wrapper" style="position: relative; width: 450px;">
              <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
                ${icons.search || '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'}
              </span>
              <input type="text" class="input" id="filter-search" 
                     placeholder="Buscar por nombre, cargo, área, estado..." 
                     style="padding-left: 2.8rem; border-radius: 20px; background: rgba(0,0,0,0.05); border: 1px solid transparent; transition: all 0.3s; height: 40px; width: 100%;">
            </div>
          </div>
        </div>

        <!-- Lista -->
        <div class="card">
          <div class="card-header">
            <h3 style="margin: 0;">Staff Registrado</h3>
            <div class="text-muted" id="rec-count">Cargando...</div>
          </div>
          
          <div class="table-responsive">
            <table class="table" id="rec-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Cargo</th>
                  <th>Ubicación</th>
                  <th>Horario/Turno</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="rec-list"></tbody>
            </table>
          </div>
          
          <div id="pagination" class="flex justify-center items-center mt-3"></div>
        </div>
      </div>

      <!-- Modal -->
      <div class="modal-overlay hidden" id="rec-modal">
        <div class="modal-content" style="max-width: 800px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              REGISTRO DE PERSONAL ADMINISTRATIVO
            </div>
            <button class="btn-close-modal" id="btn-close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">${icons.close}</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 65vh; overflow-y: auto;">
            <form id="rec-form">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: var(--neutralPrimary); display: flex; align-items: center; gap: 8px;">
                  ${icons.user} DATOS DEL EMPLEADO
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
                <div class="grid grid-2 gap-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">TELÉFONO *</label>
                    <input type="tel" class="input" id="form-phone" required style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">EMAIL *</label>
                    <input type="email" class="input" id="form-email" required style="height: 38px;">
                  </div>
                </div>
              </div>

               <div style="background: #fffcf5; padding: 20px; border-radius: 8px; border: 1px solid #fff1c1; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #856404; display: flex; align-items: center; gap: 8px;">
                  ${icons.clipboard} DATOS LABORALES
                </h4>
                <div class="grid grid-2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">CARGO *</label>
                    <select class="input" id="form-specialty" style="height: 38px;">
                        <option value="Admisión General">Admisión General</option>
                        <option value="Urgencias">Urgencias</option>
                        <option value="Caja">Caja</option>
                        <option value="Información">Información</option>
                        <option value="Archivo">Archivo</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">ÁREA *</label>
                    <select class="input" id="form-area" required style="height: 38px;"></select>
                  </div>
                </div>
                <div class="grid grid-2 gap-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">ENTRADA</label>
                    <input type="time" class="input" id="form-start" value="08:00" style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">SALIDA</label>
                    <input type="time" class="input" id="form-end" value="16:00" style="height: 38px;">
                  </div>
                </div>
              </div>

              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; border: 1px solid #bfdbfe; margin-bottom: 5px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #1e40af; display: flex; align-items: center; gap: 8px;">
                  CREDENCIALES DE ACCESO
                </h4>
                <div class="grid grid-2 gap-4">
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">USUARIO</label>
                    <input type="text" class="input" id="form-username-cre" placeholder="Email por defecto" style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">CONTRASEÑA *</label>
                    <input type="password" class="input" id="form-password-cre" placeholder="Mínimo 6 caracteres" style="height: 38px;">
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer" style="background: var(--modal-header); padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
             <button class="btn-circle btn-circle-cancel" id="btn-cancel" title="Cancelar">
               ${ICONS.close}
             </button>
             <button class="btn-circle btn-circle-save" id="btn-save" title="Guardar Cambios">
               ${ICONS.check}
             </button>
          </div>
        </div>
      </div>

      <!-- Modal Estado (Estilo idéntico a doctors.js) -->
      <!-- Modal Estado (idéntico a doctors.js) -->
      <div class="modal-overlay hidden" id="status-modal">
        <div class="modal-content" style="max-width: 500px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--warning); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">CAMBIAR ESTADO</h2>
            <div id="status-modal-name" style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              Recepcionista
            </div>
            <button class="btn-close-modal" id="btn-close-status-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ${ICONS.close}
            </button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
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
          
          <div class="modal-footer" style="background: var(--modal-header); padding: 1.25rem 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
            <button class="btn-circle btn-circle-cancel" id="btn-cancel-status" title="Cancelar">
              ${ICONS.close}
            </button>
            <button class="btn-circle btn-circle-status" id="btn-save-status" title="Actualizar Estado">
              ${ICONS.check}
            </button>
          </div>
        </div>
      </div>
    `;

    elements = {
      stats: root.querySelector('#stats-container'),
      list: root.querySelector('#rec-list'),
      count: root.querySelector('#rec-count'),
      table: root.querySelector('#rec-table'),
      pagination: root.querySelector('#pagination'),

      search: root.querySelector('#filter-search'),
      area: root.querySelector('#filter-area'),
      status: root.querySelector('#filter-status'),
      spec: root.querySelector('#filter-specialty'),

      modal: root.querySelector('#rec-modal'),
      form: root.querySelector('#rec-form'),
      statusModal: root.querySelector('#status-modal'),

      // Form fields
      fName: root.querySelector('#form-name'),
      fDocType: root.querySelector('#form-doc-type'),
      fDni: root.querySelector('#form-dni'),
      fPhone: root.querySelector('#form-phone'),
      fEmail: root.querySelector('#form-email'),
      fSpec: root.querySelector('#form-specialty'),
      fArea: root.querySelector('#form-area'),
      fStart: root.querySelector('#form-start'),
      fEnd: root.querySelector('#form-end'),
      fUser: root.querySelector('#form-username-cre'),
      fPass: root.querySelector('#form-password-cre'),

      btnSave: root.querySelector('#btn-save'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnClose: root.querySelector('#btn-close-modal'),
      btnNew: root.querySelector('#btn-new-rec'),

      btnSaveStatus: root.querySelector('#btn-save-status'),
      btnCancelStatus: root.querySelector('#btn-cancel-status'),
      btnCloseStatus: root.querySelector('#btn-close-status-modal'),
      statusSelect: root.querySelector('#status-select'),
      statusReason: root.querySelector('#status-reason')
    };

    const areas = store.get('areas') || [];
    const opts = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    if (elements.area) elements.area.innerHTML += opts;
    if (elements.fArea) elements.fArea.innerHTML = `<option value="">Seleccione área</option>` + opts;
  }

  function renderList() {
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const items = state.receptionists.slice(start, start + state.itemsPerPage);

    if (elements.count) elements.count.textContent = `${state.receptionists.length} Registros`;
    elements.list.innerHTML = items.map(item => {
      const area = store.find('areas', item.areaId);
      return `
            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
              <td>
                <div class="flex items-center gap-3">
                    <div>
                        <div class="font-bold">${item.name}</div>
                        <div class="text-xs text-muted">C.I.: ${item.docType || 'V'}-${item.dni || '0'}</div>
                    </div>
                </div>
              </td>
              <td>${item.specialty || 'General'}</td>
              <td>${area?.name || 'Oficina Central'}</td>
              <td>
                <div class="text-sm">${item.scheduleStart || '08:00'} - ${item.scheduleEnd || '16:00'}</div>
              </td>
              <td>
                <span class="badge ${item.isActive ? 'badge-success' : 'badge-danger'}">
                  ${item.status === 'vacation' ? 'Vacaciones' : (item.isActive ? 'Activo' : 'Inactivo')}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                  <button class="btn-circle btn-circle-status" data-action="view" data-id="${item.id}" title="Ver">${icons.view || ICONS.eye}</button>
                  <button class="btn-circle btn-circle-cancel" data-action="status" data-id="${item.id}" title="Cambiar Estado">${ICONS.sync}</button>
                  <button class="btn-circle btn-circle-edit" data-action="edit" data-id="${item.id}" title="Editar">${icons.edit || ICONS.edit}</button>
                </div>
              </td>
            </tr>
          `;
    }).join('');

    // Event delegation para acciones
    elements.list.onclick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const r = state.receptionists.find(x => x.id === id);
      if (!r) return;
      state.currentRec = r;
      if (action === 'edit') openModal(r);
      if (action === 'view') viewRec(r);
      if (action === 'status') {
        const modalName = root.querySelector('#status-modal-name');
        if (modalName) modalName.textContent = r.name;

        const badge = root.querySelector('#status-modal-badge');
        const text = root.querySelector('#status-modal-text');
        const subtext = root.querySelector('#status-modal-subtext');

        if (badge) badge.style.background = r.isActive ? 'var(--success)' : 'var(--danger)';
        if (text) text.textContent = r.isActive ? 'ACTIVO' : 'INACTIVO';

        if (subtext) {
          if (r.status === 'vacation') {
            subtext.innerHTML = '<span class="badge badge-warning">Vacaciones</span>';
            subtext.classList.remove('hidden');
          } else if (r.status === 'license') {
            subtext.innerHTML = '<span class="badge badge-info">Licencia</span>';
            subtext.classList.remove('hidden');
          } else {
            subtext.innerHTML = '';
            subtext.classList.add('hidden');
          }
        }

        if (elements.statusSelect) elements.statusSelect.value = r.status || 'active';

        const reasonInput = root.querySelector('#status-reason');
        if (reasonInput) reasonInput.value = r.statusReason || '';

        const returnDateInput = root.querySelector('#status-return-date');
        if (returnDateInput) {
          const today = new Date().toISOString().split('T')[0];
          returnDateInput.min = today;
          returnDateInput.value = r.statusReturnDate || '';
        }

        if (elements.statusModal) elements.statusModal.classList.remove('hidden');
      }
    };

    renderPagination();
  }

  function renderPagination() {
    const pages = Math.ceil(state.receptionists.length / state.itemsPerPage);
    elements.pagination.innerHTML = Array.from({ length: pages }, (_, i) =>
      `<button class="btn btn-sm ${state.currentPage === i + 1 ? 'btn-primary' : 'btn-outline'}" 
            style="${state.currentPage === i + 1 ? 'background: transparent; color: var(--info);' : ''}" 
            onclick="window.recPage(${i + 1})">${i + 1}</button>`
    ).join('');
    window.recPage = p => { state.currentPage = p; renderList(); };
  }

  function updateStats() {
    const total = state.receptionists.length;
    const active = state.receptionists.filter(r => r.isActive).length;
    const areas = new Set(state.receptionists.map(r => r.areaId)).size;

    elements.stats.innerHTML = `
      <div class="stat-info-card">
        <span class="stat-info-label">Total Staff</span>
        <span class="stat-info-value">${total}</span>
        <span class="stat-info-sub">
          ${icons.receptionist || ''}
          Registrados
        </span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Personal Activo</span>
        <span class="stat-info-value">${active}</span>
        <span class="stat-info-sub">
          ${icons.user || ''}
          En servicio
        </span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Áreas Cubiertas</span>
        <span class="stat-info-value">${areas}</span>
        <span class="stat-info-sub">
          ${icons.clipboard || ''}
          Ubicaciones
        </span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Turnos Hoy</span>
        <span class="stat-info-value">2</span>
        <span class="stat-info-sub">
          ${icons.calendar || ''}
          Rotación activa
        </span>
      </div>
    `;
  }

  function viewRec(rec) {
    const area = store.find('areas', rec.areaId);
    const canEditStatus = role === 'admin';

    // Estadísticas de citas gestionadas
    const allAppointments = store.get('appointments') || [];
    const today = new Date().toDateString();
    const managedApts = allAppointments.filter(a => a.registeredBy === rec.id || a.receptionist === rec.id);
    const todayManaged = managedApts.filter(a => new Date(a.dateTime).toDateString() === today).length;
    const totalManaged = managedApts.length;
    const pendingManaged = managedApts.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
    const completedManaged = managedApts.filter(a => a.status === 'completed').length;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-rec-modal';
    modalContainer.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    `;

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 850px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
        <!-- Cabecera institucional -->
        <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
          <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h2>
          <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">PERSONAL DE RECEPCIÓN Y ADMISIÓN</div>
          <button id="close-rec-hdr" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
        </div>

        <!-- Cuerpo -->
        <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 70vh; overflow-y: auto;">

          <!-- Encabezado de Perfil -->
          <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2.5rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
            <div style="width: 100px; height: 100px; background: var(--info); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: white; font-size: 2.5rem; font-weight: 800;">
              ${rec.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--modal-header); letter-spacing: 0.1em; margin-bottom: 0.5rem;">PERSONAL ADMINISTRATIVO</div>
              <h3 style="margin: 0; font-size: 1.75rem; color: #1a202c; font-weight: 800;">${rec.name}</h3>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge" style="background: var(--modal-header); color: white; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700;">${rec.specialty || 'Recepcionista'}</span>
                <span style="color: #4a5568; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                  ${icons.area || ''} ${area?.name || 'Recepción General'}
                </span>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge ${rec.isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                  ${rec.isActive ? icons.successCheck || '✓' : '✗'}
                  ${rec.isActive ? 'Activo' : 'Inactivo'}
                  ${rec.status === 'vacation' ? ' (Vacaciones)' : rec.status === 'license' ? ' (Licencia)' : ''}
                </span>
                <span class="badge badge-info" style="font-size: 0.75rem;">
                  ${icons.calendar || ''} Admisión y Gestión
                </span>
              </div>
            </div>
          </div>

          <!-- Información Dividida -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
            <!-- Identificación -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-header);">
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 1rem; letter-spacing: 0.05em;">
                ${icons.clipboard || ''} IDENTIFICACIÓN Y CARGO
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">CÉDULA / ID</div>
                  <div style="font-weight: 600; font-size: 1rem;">${rec.docType || 'V'}-${rec.dni || 'No registrado'}</div>
                </div>
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">CARGO</div>
                  <div style="font-weight: 700; font-size: 1rem; color: var(--modal-header);">${rec.specialty || 'Recepcionista'}</div>
                </div>
              </div>
              <div style="margin-top: 1rem;">
                <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">CONTACTO</div>
                <div style="font-size: 0.9rem; color: #475569; margin-top: 0.25rem;">
                  📞 ${rec.phone || 'N/A'}<br>
                  ✉️ ${rec.email || 'N/A'}
                </div>
              </div>
              <div style="margin-top: 1rem;">
                <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">DIRECCIÓN</div>
                <div style="font-size: 0.85rem; color: #475569;">${rec.address || 'No registrada'}</div>
              </div>
            </div>

            <!-- Asignación y Turno -->
            <div style="background: var(--modal-section-forest-light); border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-section-forest);">
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 800; color: var(--modal-section-forest); margin-bottom: 1rem; letter-spacing: 0.05em;">
                ${icons.calendar || ''} ASIGNACIÓN Y TURNO
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="font-weight: 800; font-size: 1.25rem; color: #1a202c;">
                  ${rec.scheduleStart || '07:00'} - ${rec.scheduleEnd || '15:00'}
                </div>
                <div style="font-size: 0.9rem; color: #2d3748; font-weight: 600;">
                  ${rec.workDays && rec.workDays.length > 0
        ? rec.workDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
        : 'Lunes a Viernes'}
                </div>
                <div style="font-size: 0.85rem; color: #4a5568;">
                  ${icons.area || ''} Área: <strong>${area?.name || 'Recepción Central'}</strong>
                </div>
                <div style="background: white; border: 1px solid #d1fae5; border-radius: 6px; padding: 0.75rem; margin-top: 0.5rem;">
                  <div style="font-size: 0.7rem; font-weight: 700; color: #065f46; margin-bottom: 0.25rem;">RESPONSABILIDADES</div>
                  <div style="font-size: 0.8rem; color: #047857;">Registro de pacientes • Gestión de citas • Admisión hospitalaria</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel de Estadísticas (Grid 4) -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2.5rem;">
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">CITAS GESTIONADAS</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-header);">${totalManaged}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">HOY</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-section-gold);">${todayManaged}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">PENDIENTES</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #3182ce;">${pendingManaged}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">COMPLETADAS</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-section-forest);">${completedManaged}</div>
            </div>
          </div>

          <!-- Datos adicionales -->
          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; border: 1px solid #e2e8f0;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 0.75rem; letter-spacing: 0.05em;">INFORMACIÓN ADICIONAL</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem;">
              <div>
                <div style="font-weight: 700; color: #334155; font-size: 0.7rem;">FECHA DE REGISTRO</div>
                <div>${rec.createdAt ? new Date(rec.createdAt).toLocaleDateString('es-ES') : '-'}</div>
              </div>
              <div>
                <div style="font-weight: 700; color: #334155; font-size: 0.7rem;">NOTAS</div>
                <div>${rec.notes || 'Sin observaciones'}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer con btn-circle -->
        <div class="modal-footer" style="background: var(--modal-header); padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; border: none;">
          ${(role === 'admin') ? `
            <button class="btn-circle btn-circle-edit" id="edit-rec-btn" data-id="${rec.id}" title="Editar Perfil">
              ${icons.edit || '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'}
            </button>
          ` : ''}
          ${canEditStatus ? `
            <button class="btn-circle btn-circle-cancel" id="status-rec-btn" data-id="${rec.id}" title="Cambiar Estado">
              ${icons.status || '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'}
            </button>
          ` : ''}
          <button class="btn-circle btn-circle-cancel" id="close-rec-ftr" title="Cerrar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const closeModal = () => modalContainer.remove();
    modalContainer.querySelector('#close-rec-hdr').addEventListener('click', closeModal);
    modalContainer.querySelector('#close-rec-ftr').addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });
    const escH = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);

    const editBtn = modalContainer.querySelector('#edit-rec-btn');
    if (editBtn) editBtn.addEventListener('click', () => { closeModal(); openModal(rec); });

    const statusBtn = modalContainer.querySelector('#status-rec-btn');
    if (statusBtn) statusBtn.addEventListener('click', () => {
      closeModal();
      state.currentRec = rec;
      const modalName = root.querySelector('#status-modal-name');
      if (modalName) modalName.textContent = rec.name;
      const badge = root.querySelector('#status-modal-badge');
      const text = root.querySelector('#status-modal-text');
      if (badge) badge.style.background = rec.isActive ? 'var(--success)' : 'var(--danger)';
      if (text) text.textContent = rec.isActive ? 'ACTIVO' : 'INACTIVO';
      if (elements.statusSelect) elements.statusSelect.value = rec.status || 'active';
      if (elements.statusModal) elements.statusModal.classList.remove('hidden');
    });
  }

  function setupEventListeners() {
    if (elements.btnNew) elements.btnNew.addEventListener('click', () => openModal());
    if (elements.btnClose) elements.btnClose.addEventListener('click', closeModal);
    if (elements.btnCancel) elements.btnCancel.addEventListener('click', closeModal);
    if (elements.btnSave) elements.btnSave.addEventListener('click', saveItem);

    const debouncedLoad = debounce(() => {
      state.filters.search = elements.search ? elements.search.value : '';
      state.currentPage = 1;
      loadItems();
    }, 300);
    if (elements.search) elements.search.addEventListener('input', debouncedLoad);

    [elements.area, elements.status, elements.spec].forEach(e => {
      if (e) e.addEventListener('change', () => {
        state.filters.search = elements.search ? elements.search.value : '';
        state.filters.specialty = elements.spec ? elements.spec.value : '';
        state.filters.areaId = elements.area ? elements.area.value : '';
        state.filters.status = elements.status ? elements.status.value : 'active';
        state.currentPage = 1;
        loadItems();
      });
    });

    if (elements.btnCancelStatus) elements.btnCancelStatus.addEventListener('click', () => elements.statusModal && elements.statusModal.classList.add('hidden'));
    if (elements.btnCloseStatus) elements.btnCloseStatus.addEventListener('click', () => elements.statusModal && elements.statusModal.classList.add('hidden'));

    if (elements.btnSaveStatus) {
      elements.btnSaveStatus.addEventListener('click', () => {
        if (!state.currentRec) return;
        const status = elements.statusSelect.value;
        if (!status) {
          showNotification('Por favor, seleccione un estado', 'warning');
          return;
        }
        const reasonInput = root.querySelector('#status-reason');
        const returnDateInput = root.querySelector('#status-return-date');
        store.update('receptionists', state.currentRec.id, {
          status: status,
          isActive: status === 'active',
          statusReason: reasonInput ? reasonInput.value.trim() : null,
          statusReturnDate: returnDateInput ? returnDateInput.value : null,
          statusChangedBy: user?.id || 'system',
          statusChangedAt: new Date().toISOString()
        });
        // Cerrar modal PRIMERO, luego mostrar notificación (igual que doctors.js)
        if (elements.statusModal) elements.statusModal.classList.add('hidden');
        showNotification('Estado actualizado correctamente', 'success');
        loadItems();
      });
    }
  }

  function openModal(item = null) {
    state.editingId = item?.id || null;
    if (elements.modal) elements.modal.classList.remove('hidden');
    elements.form.reset();
    if (item) {
      elements.fName.value = item.name;
      if (elements.fDocType) elements.fDocType.value = item.docType || 'V';
      elements.fDni.value = item.dni || '';
      elements.fPhone.value = item.phone;
      elements.fEmail.value = item.email;
      elements.fSpec.value = item.specialty || '';
      elements.fArea.value = item.areaId;
      elements.fStart.value = item.scheduleStart || '08:00';
      elements.fEnd.value = item.scheduleEnd || '16:00';
    }
  }

  function closeModal() {
    state.editingId = null;
    if (elements.modal) elements.modal.classList.add('hidden');
  }

  function saveItem() {
    if (!elements.form.checkValidity()) { elements.form.reportValidity(); return; }

    // Validar permisos: solo admin puede crear nuevos recepcionistas
    if (!state.editingId && role !== 'admin') {
      alert('No tienes permiso para registrar personal administrativo');
      return;
    }

    const data = {
      name: elements.fName.value,
      docType: elements.fDocType.value,
      dni: elements.fDni.value.trim(),
      phone: elements.fPhone.value,
      email: elements.fEmail.value,
      specialty: elements.fSpec.value,
      areaId: elements.fArea.value,
      scheduleStart: elements.fStart.value,
      scheduleEnd: elements.fEnd.value,
      isActive: true
    };

    if (state.editingId) store.update('receptionists', state.editingId, data);
    else {
      const r = store.add('receptionists', data);
      const username = (elements.fUser && elements.fUser.value) || data.email.split('@')[0];
      const password = (elements.fPass && elements.fPass.value) || 'demo123';
      store.add('users', { username, password, name: data.name, role: 'receptionist', email: data.email, staffId: r.id });
    }
    closeModal();
    loadItems();
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
