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
      status: 'active'
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
      if (state.filters.status && state.filters.status !== 'all') {
        const isActive = state.filters.status === 'active';
        if (item.isActive !== isActive) return false;
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

        <!-- Estadísticas -->
        <div class="grid grid-4" id="stats-container"></div>

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
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                ${icons.user} DATOS DEL EMPLEADO
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
                    <input type="text" class="input" id="form-dni" required placeholder="Número de cédula" style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);">
                  </div>
                </div>
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">TELÉFONO *</label><input type="tel" class="input" id="form-phone" required style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);"></div>
                <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">EMAIL *</label><input type="email" class="input" id="form-email" required style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);"></div>
              </div>

               <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                ${icons.clipboard} DATOS LABORALES
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                 <div class="form-group">
                    <label class="form-label font-bold" style="color: var(--modal-text);">CARGO *</label>
                    <select class="input" id="form-specialty" style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);">
                        <option value="Admisión General">Admisión General</option>
                        <option value="Urgencias">Urgencias</option>
                        <option value="Caja">Caja</option>
                        <option value="Información">Información</option>
                        <option value="Archivo">Archivo</option>
                    </select>
                 </div>
                 <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">ÁREA *</label><select class="input" id="form-area" required style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);"></select></div>
              </div>
               <div class="grid grid-2 gap-4 mb-4">
                 <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">ENTRADA</label><input type="time" class="input" id="form-start" value="08:00" style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);"></div>
                 <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">SALIDA</label><input type="time" class="input" id="form-end" value="16:00" style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);"></div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                CREDENCIALES DE ACCESO
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">USUARIO</label><input type="text" class="input" id="form-username-cre" placeholder="Email por defecto" style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);"></div>
                <div class="form-group"><label class="form-label font-bold" style="color: var(--modal-text);">CONTRASEÑA *</label><input type="password" class="input" id="form-password-cre" placeholder="Mínimo 6 caracteres" style="border-width: 0 0 2px 0; border-color: var(--neutralTertiary); background: var(--white);"></div>
              </div>
            </form>
          </div>
          <div class="modal-footer" style="background: var(--modal-header); padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
             <button class="btn" id="btn-cancel" style="background: var(--danger); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem;">CANCELAR</button>
             <button class="btn" id="btn-save" style="background: var(--success); color: white; border: none; padding: 0.75rem 2rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">GUARDAR CAMBIOS</button>
          </div>
        </div>
      </div>

      <!-- Modal Estado (Estilo idéntico a doctors.js) -->
      <div class="modal-overlay hidden" id="status-modal">
         <div class="modal-content" style="max-width: 500px; padding: 0;">
           <div class="modal-header" style="background: var(--warning); color: white; padding: 1.5rem; flex-direction: column; align-items:center; position:relative;">
              <h2 style="margin:0; font-size:1.25rem;">ACTUALIZAR ESTADO</h2>
              <div style="font-size:0.85rem; opacity:0.8; margin-top:0.25rem;">Estado laboral del empleado</div>
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
            <tr>
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
                 <div class="flex items-center gap-2">
                    <span class="badge ${item.isActive ? 'badge-success' : 'badge-danger'}">
                        ${item.status === 'vacation' ? 'Vacaciones' : (item.isActive ? 'Activo' : 'Inactivo')}
                    </span>
                    <button class="btn btn-xs btn-outline" onclick="window.recAction('status', '${item.id}')" title="Cambiar">${icons.status}</button>
                 </div>
              </td>
              <td>
                 <div class="flex gap-2">
                    <button class="btn btn-outline btn-sm" onclick="window.recAction('view', '${item.id}')" title="Ver">${icons.view}</button>
                    <button class="btn btn-outline btn-sm" onclick="window.recAction('edit', '${item.id}')" title="Editar">${icons.edit}</button>
                 </div>
              </td>
            </tr>
          `;
    }).join('');

    window.recAction = (action, id) => {
      const r = state.receptionists.find(x => x.id === id);
      if (!r) return;
      state.currentRec = r;

      if (action === 'edit') openModal(r);
      if (action === 'view') viewRec(r);
      if (action === 'status') {
        elements.statusSelect.value = r.status || 'active';
        elements.statusModal.classList.remove('hidden');
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
    elements.stats.innerHTML = `
        <div class="card"><div class="text-muted text-sm">Total Staff</div><div class="text-2xl font-bold" style="color:#f59e0b">${total}</div></div>
        <div class="card"><div class="text-muted text-sm">Activos</div><div class="text-2xl font-bold" style="color:var(--success)">${active}</div></div>
        <div class="card"><div class="text-muted text-sm">Áreas</div><div class="text-2xl font-bold" style="color:#4b5563">${new Set(state.receptionists.map(r => r.areaId)).size}</div></div>
        <div class="card"><div class="text-muted text-sm">Turnos</div><div class="text-2xl font-bold" style="color:#f59e0b">2</div></div>
      `;
  }

  function viewRec(rec) {
    const area = store.find('areas', rec.areaId);
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; padding:0; background:white; border-radius:8px; overflow:hidden;">
            <div style="background: var(--modal-header); padding: 2rem; text-align: center; color: white;">
               <div style="width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; color: var(--modal-header); font-size: 2rem; font-weight: bold;">
                  ${rec.name.charAt(0)}
               </div>
               <h2 style="margin:0">${rec.name}</h2>
               <div>${rec.specialty}</div>
            </div>
            
            <div class="grid grid-2 gap-4 p-8">
                <div style="background: var(--modal-bg); border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-header);">
                   <div style="font-weight: 800; color: var(--modal-text); margin-bottom: 1rem;">IDENTIFICACIÓN</div>
                   <div class="grid grid-2">
                       <div><div class="text-xs text-muted font-bold">CÉDULA / ID</div><div class="font-bold">${rec.docType || 'V'}-${rec.dni || '-'}</div></div>
                       <div><div class="text-xs text-muted font-bold">CARGO</div><div class="font-bold text-lg">${rec.specialty}</div></div>
                   </div>
                   <div class="mt-4">
                       <div class="text-xs text-muted font-bold">CONTACTO</div>
                       <div>${rec.email}</div>
                   </div>
                </div>
                
                <div style="background: #f0fdf4; border-radius: 8px; padding: 1.5rem; border-left: 4px solid #16a34a;">
                   <div style="font-weight: 800; color: #166534; margin-bottom: 1rem;">ASIGNACIÓN</div>
                   <div class="text-lg font-bold">${rec.scheduleStart} - ${rec.scheduleEnd}</div>
                   <div class="text-sm">Turno Asignado</div>
                   <div class="mt-4">
                       <span class="badge badge-success">${area?.name || 'General'}</span>
                   </div>
                </div>
            </div>
            <div class="p-4 bg-gray-50 flex justify-end">
               <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()" style="background:#f59e0b; border:none;">Cerrar Perfil</button>
            </div>
        </div>
      `;
    document.body.appendChild(modal);
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
        store.update('receptionists', state.currentRec.id, { status: status, isActive: status === 'active' });
        if (elements.statusModal) elements.statusModal.classList.add('hidden');
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

  return init();
}
