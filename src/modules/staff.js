/**
 * Módulo de Gestión de Personal (Enfermería y Recepción)
 * Este módulo se encarga del personal no médico del hospital.
 */

import { Logger } from '../utils/logger.js';

export default function mountStaff(root, { bus, store, user, role }) {
  const state = {
    activeTab: 'nurses', // 'nurses' | 'receptionists'
    nurses: [],
    receptionists: [],
    showModal: false,
    editingItem: null,
    isLoading: false,
    filters: {
      search: '',
      areaId: ''
    }
  };

  const icons = {
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    cancel: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    save: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`
  };

  let elements = {};

  function init() {
    render();
    setupEventListeners();
    loadData();

    const unsubN = store.subscribe('nurses', () => loadData());
    const unsubR = store.subscribe('receptionists', () => loadData());

    return () => {
      unsubN();
      unsubR();
    };
  }

  function loadData() {
    const nurses = store.get('nurses') || [];
    const receptionists = store.get('receptionists') || [];

    state.nurses = filterData(nurses);
    state.receptionists = filterData(receptionists);

    renderList();
    renderStats();
  }

  function filterData(data) {
    return data.filter(item => {
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase();
        if (!item.name.toLowerCase().includes(search) && !item.email.toLowerCase().includes(search)) return false;
      }
      if (state.filters.areaId && item.areaId !== state.filters.areaId) return false;
      return true;
    });
  }

  function render() {
    root.innerHTML = `
      <div class="staff-module">
        <div class="stats-auto-grid mb-4" id="staff-stats"></div>

        <div class="card p-0 overflow-hidden">
          <div class="tabs-header" style="border-bottom: 1px solid var(--border); padding: 0 1.5rem; background: #f8fafc;">
            <div class="flex gap-4">
              <button class="tab-item ${state.activeTab === 'nurses' ? 'active' : ''}" data-tab="nurses">ENFERMERÍA</button>
              <button class="tab-item ${state.activeTab === 'receptionists' ? 'active' : ''}" data-tab="receptionists">RECEPCIÓN</button>
            </div>
          </div>

          <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border);">
            <div class="flex justify-between items-center">
              <button class="btn btn-primary" id="btn-add-staff">
                <span class="flex items-center gap-2">${icons.plus} Nuevo Ingreso</span>
              </button>
              <div class="search-input-wrapper" style="position: relative; width: 450px;">
                <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input type="text" class="input" id="search-staff" 
                       placeholder="Buscar por nombre, correo, área..." 
                       value="${state.filters.search}"
                       style="padding-left: 2.8rem; border-radius: 20px; background: rgba(0,0,0,0.05); border: 1px solid transparent; transition: all 0.3s; height: 40px; width: 100%;">
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Área / Detalles</th>
                  <th>Estado</th>
                  <th class="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody id="staff-list-body"></tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Modal Add/Edit -->
      <div class="modal-overlay hidden" id="staff-modal">
        <div class="modal-content" style="max-width: 600px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title" id="modal-title">Registrar Personal</h3>
            </div>
            <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="close-modal">&times;</button>
          </div>
          <div class="modal-body" style="padding: 2rem;">
            <form id="staff-form">
              <div class="grid grid-2 gap-4 mb-4">
                <div class="form-group">
                  <label class="form-label font-bold">NOMBRE COMPLETO</label>
                  <input type="text" class="input" name="name" id="form-name" required>
                </div>
                <div class="form-group">
                  <label class="form-label font-bold">CÉDULA / C.I. *</label>
                  <div class="doc-group" style="display: flex; gap: 0;">
                    <select class="input" id="form-doc-type" name="docType" required style="width: 70px; border-radius: 4px 0 0 4px; border-right: none; background: #fff; height: 38px; border: 1px solid var(--border);">
                      <option value="V">V</option>
                      <option value="E">E</option>
                      <option value="J">J</option>
                      <option value="P">P</option>
                    </select>
                    <input type="text" class="input" id="form-dni" name="dni" required placeholder="Número de cédula" style="flex: 1; border-radius: 0 4px 4px 0; height: 38px; border: 1px solid var(--border); border-left: none;">
                  </div>
                </div>
              </div>
              <div class="grid grid-2 gap-4 mb-4">
                <div class="form-group">
                  <label class="form-label font-bold">CORREO</label>
                  <input type="email" class="input" name="email" id="form-email" required>
                </div>
                <div class="form-group">
                  <label class="form-label font-bold">TELÉFONO</label>
                  <input type="tel" class="input" name="phone" id="form-phone" required>
                </div>
              </div>
              <div class="form-group mb-4">
                <label class="form-label font-bold">ÁREA</label>
                <select class="input" name="areaId" id="modal-area-select" required></select>
              </div>
              <div id="dynamic-fields"></div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn-circle btn-circle-cancel" id="btn-cancel" title="Cancelar">${icons.cancel}</button>
            <button class="btn-circle btn-circle-save" id="btn-save" title="Guardar">${icons.save}</button>
          </div>
        </div>
      </div>

      <style>
        .tab-item {
          padding: 1rem 0.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
        }
        .tab-item.active { border-bottom-color: var(--accent); color: var(--accent); }
      </style>
    `;

    elements = {
      listBody: root.querySelector('#staff-list-body'),
      statsContainer: root.querySelector('#staff-stats'),
      modal: root.querySelector('#staff-modal'),
      form: root.querySelector('#staff-form'),
      areaFilter: root.querySelector('#area-filter'),
      modalArea: root.querySelector('#modal-area-select'),
      fName: root.querySelector('#form-name'),
      fDocType: root.querySelector('#form-doc-type'),
      fDni: root.querySelector('#form-dni'),
      fEmail: root.querySelector('#form-email'),
      fPhone: root.querySelector('#form-phone')
    };

    const areas = store.get('areas') || [];
    const areaOptions = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    elements.areaFilter.innerHTML += areaOptions;
    elements.modalArea.innerHTML = `<option value="">Seleccione...</option>` + areaOptions;
  }

  function setupEventListeners() {
    root.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        state.activeTab = tab.dataset.tab;
        root.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadData();
      });
    });

    const searchStaff = root.querySelector('#search-staff');
    if (searchStaff) {
      searchStaff.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        loadData();
      });
    }

    if (elements.areaFilter) {
      elements.areaFilter.addEventListener('change', (e) => {
        state.filters.areaId = e.target.value;
        loadData();
      });
    }

    root.querySelector('#btn-add-staff').addEventListener('click', () => openModal());
    root.querySelector('#close-modal').addEventListener('click', closeModal);
    root.querySelector('#btn-cancel').addEventListener('click', closeModal);
    root.querySelector('#btn-save').addEventListener('click', saveItem);

    if (elements.fDni) {
      elements.fDni.addEventListener('input', debounce(handleRegistryLookup, 500));
    }
    if (elements.fDocType) {
      elements.fDocType.addEventListener('change', handleRegistryLookup);
    }
  }

  function renderList() {
    const data = state[state.activeTab];
    const areas = store.get('areas') || [];

    if (data.length === 0) {
      elements.listBody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-muted">No se encontraron registros</td></tr>`;
      return;
    }

    elements.listBody.innerHTML = data.map(item => {
      const area = areas.find(a => a.id === item.areaId);
      return `
        <tr>
          <td>
            <div class="flex items-center gap-2">
              <div style="width:32px; height:32px; border-radius:50%; background:var(--accent); color:white; display:flex; align-items:center; justify-content:center; font-weight:700;">${item.name.charAt(0)}</div>
              <div class="font-bold">${item.name}</div>
            </div>
          </td>
          <td>
            <div class="text-xs text-bold">${item.email}</div>
            <div class="text-xs text-muted">${item.phone}</div>
          </td>
          <td>
            <div class="badge" style="background:${area?.color}11; color:${area?.color}; border:1px solid ${area?.color}">${area?.name || 'N/A'}</div>
            <div class="text-xs text-muted mt-1">${item.shift || item.title || '-'}</div>
          </td>
          <td><span class="badge badge-success">Activo</span></td>
          <td class="text-right">
             <div class="flex justify-end gap-1">
               <button class="btn-circle btn-circle-edit" onclick="window.staffAction('edit', '${item.id}')" title="Editar">${icons.edit}</button>
               <button class="btn-circle btn-circle-danger" onclick="window.staffAction('delete', '${item.id}')" title="Eliminar">${icons.trash}</button>
             </div>
          </td>
        </tr>
      `;
    }).join('');

    window.staffAction = (action, id) => {
      const item = data.find(i => i.id === id);
      if (action === 'edit') openModal(item);
      else if (action === 'delete') {
        if (confirm('¿Eliminar registro?')) {
          store.remove(state.activeTab, id);
          loadData();
        }
      }
    };
  }

  function renderStats() {
    const n = (store.get('nurses') || []).length;
    const r = (store.get('receptionists') || []).length;
    elements.statsContainer.innerHTML = `
      <div class="stat-info-card" style="--accent: var(--info);">
        <span class="stat-info-label">Enfermería</span>
        <span class="stat-info-value">${n}</span>
        <span class="stat-info-sub">Personal de asistencia</span>
      </div>
      <div class="stat-info-card" style="--accent: var(--warning);">
        <span class="stat-info-label">Recepción</span>
        <span class="stat-info-value">${r}</span>
        <span class="stat-info-sub">Gestión administrativa</span>
      </div>
      <div class="stat-info-card" style="--accent: var(--accent);">
        <span class="stat-info-label">Total Staff</span>
        <span class="stat-info-value">${n + r}</span>
        <span class="stat-info-sub">Talento humano</span>
      </div>
    `;
  }

  function openModal(item = null) {
    state.editingItem = item;
    elements.form.reset();

    const dynamic = root.querySelector('#dynamic-fields');
    if (state.activeTab === 'nurses') {
      dynamic.innerHTML = `
        <div class="form-group"><label class="form-label font-bold">TURNO</label>
        <select class="input" name="shift"><option value="Mañana">Mañana</option><option value="Tarde">Tarde</option><option value="Noche">Noche</option></select></div>
      `;
    } else {
      dynamic.innerHTML = `<div class="form-group"><label class="form-label font-bold">CARGO</label><input type="text" class="input" name="title" placeholder="Ej: Recepcionista"></div>`;
    }

    if (item) {
      root.querySelector('#modal-title').textContent = 'Editar Personal';
      Object.keys(item).forEach(key => {
        const input = elements.form.querySelector(`[name="${key}"]`);
        if (input) input.value = item[key];
      });
    } else {
      root.querySelector('#modal-title').textContent = 'Registrar Personal';
    }

    elements.modal.classList.remove('hidden');
  }

  function closeModal() { elements.modal.classList.add('hidden'); state.editingItem = null; }

  // --- Lógica de Precarga por Cédula (SAIME Simulation) ---
  function handleRegistryLookup() {
    if (state.editingItem) return;

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

          // Efecto visual de resaltado
          [elements.fName, elements.fEmail, elements.fPhone].forEach(f => {
            if (f) {
              f.style.transition = 'background 0.5s';
              f.style.backgroundColor = '#f0fdf4';
              setTimeout(() => { f.style.backgroundColor = ''; }, 2000);
            }
          });
        }
      }, 700);
    }
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Mostrar notificación toast
  function showNotification(message, type = 'info') {
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
    notification.innerHTML = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function saveItem() {
    if (!elements.form.checkValidity()) return elements.form.reportValidity();
    const data = Object.fromEntries(new FormData(elements.form).entries());

    if (state.editingItem) {
      store.update(state.activeTab, state.editingItem.id, data);
    } else {
      store.add(state.activeTab, data);
    }

    closeModal();
    loadData();
  }

  return init();
}
