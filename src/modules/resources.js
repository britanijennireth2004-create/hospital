/**
 * Módulo de Gestión de Recursos Críticos
 * Maneja consultorios, equipamiento e insumos críticos
 */

import { Logger } from '../utils/logger.js';

export default function mountResources(container, { store, bus, user }) {
  const state = {
    activeTab: 'rooms', // 'rooms', 'equipment', 'supplies'
    isLoading: false
  };

  const icons = {
    room: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M13 13h4"/><path d="M13 17h4"/><path d="M7 13h2v4H7z"/></svg>`,
    equipment: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22V2"/><path d="M7 22V2"/><path d="M10 7h4"/><path d="M10 11h4"/><path d="M10 15h4"/></svg>`,
    supply: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    save: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`
  };

  function getAddButtonLabel() {
    switch (state.activeTab) {
      case 'rooms': return 'Nuevo Consultorio';
      case 'equipment': return 'Nuevo Equipo';
      case 'supplies': return 'Nuevo Insumo';
      default: return 'Agregar';
    }
  }

  function render() {
    container.innerHTML = `
      <style>
        .resource-card-clickable {
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .resource-card-clickable:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary) !important;
        }
        .resource-card-clickable::after {
          content: 'Haga clic para gestionar';
          position: absolute;
          bottom: 10px;
          right: 15px;
          font-size: 0.65rem;
          color: var(--primary);
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .resource-card-clickable:hover::after {
          opacity: 0.7;
        }
      </style>
      <div class="module-header">
        <div>
          <h1>Gestión de Recursos Críticos</h1>
          <p>Hospital Universitario Manuel Nuñez Tovar - Control de Infraestructura e Insumos</p>
        </div>
        <div class="actions">
          <button class="btn btn-primary" id="btn-add-resource" style="display: flex; align-items: center; gap: 0.5rem;">
            ${icons.plus} ${getAddButtonLabel()}
          </button>
        </div>
      </div>

      <div class="card mb-1rem">
        <div class="tabs" style="display: flex; gap: 1rem; border-bottom: 2px solid var(--border-light); padding-bottom: 0.5rem;">
          <button class="tab-btn ${state.activeTab === 'rooms' ? 'active' : ''}" data-tab="rooms" style="background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; color: ${state.activeTab === 'rooms' ? 'var(--primary)' : 'var(--muted)'}; border-bottom: 3px solid ${state.activeTab === 'rooms' ? 'var(--primary)' : 'transparent'};">
            ${icons.room} Consultorios
          </button>
          <button class="tab-btn ${state.activeTab === 'equipment' ? 'active' : ''}" data-tab="equipment" style="background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; color: ${state.activeTab === 'equipment' ? 'var(--primary)' : 'var(--muted)'}; border-bottom: 3px solid ${state.activeTab === 'equipment' ? 'var(--primary)' : 'transparent'};">
            ${icons.equipment} Equipamiento
          </button>
          <button class="tab-btn ${state.activeTab === 'supplies' ? 'active' : ''}" data-tab="supplies" style="background: none; border: none; padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; color: ${state.activeTab === 'supplies' ? 'var(--primary)' : 'var(--muted)'}; border-bottom: 3px solid ${state.activeTab === 'supplies' ? 'var(--primary)' : 'transparent'};">
            ${icons.supply} Insumos Críticos
          </button>
        </div>
        
        <div id="resources-content" class="mt-1rem">
          ${renderActiveTab()}
        </div>
      </div>
    `;

    setupListeners();
  }

  function renderActiveTab() {
    switch (state.activeTab) {
      case 'rooms': return renderRooms();
      case 'equipment': return renderEquipment();
      case 'supplies': return renderSupplies();
      default: return '';
    }
  }

  function renderRooms() {
    const rooms = store.get('consultorios') || [];
    if (rooms.length === 0) return '<p class="text-muted" style="text-align: center; padding: 2rem;">No hay consultorios registrados.</p>';

    return `
      <div class="grid-3">
        ${rooms.map(room => `
          <div class="card resource-card-clickable btn-manage-room" data-id="${room.id}" style="border-left: 4px solid ${getStatusColor(room.status)};">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <h3 style="margin: 0; padding-right: 2rem;">${room.name}</h3>
              <span class="badge ${getStatusBadgeClass(room.status)}">${getStatusLabel(room.status).toUpperCase()}</span>
            </div>
            <div class="text-muted" style="font-size: 0.85rem; margin-bottom: 0.5rem;">
              <p><strong>Área:</strong> ${room.area}</p>
              <p><strong>Planta:</strong> Piso ${room.floor}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderEquipment() {
    const equipment = store.get('equiposMedicos') || [];
    if (equipment.length === 0) return '<p class="text-muted" style="text-align: center; padding: 2rem;">No hay equipamiento registrado.</p>';

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Estado</th>
            <th>Condición</th>
            <th>Mantenimiento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${equipment.map(eq => `
            <tr>
              <td><strong>${eq.name}</strong></td>
              <td><span class="badge ${getStatusBadgeClass(eq.status)}">${getStatusLabel(eq.status)}</span></td>
              <td><span class="badge badge-outline">${getConditionLabel(eq.condition)}</span></td>
              <td>${eq.lastMaintenance || 'N/A'}</td>
              <td>
                <button class="btn btn-sm btn-outline btn-manage-equipment" data-id="${eq.id}">Gestionar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderSupplies() {
    const supplies = store.get('suministros') || [];
    if (supplies.length === 0) return '<p class="text-muted" style="text-align: center; padding: 2rem;">No hay insumos críticos registrados.</p>';

    return `
      <div class="grid-2">
        ${supplies.map(item => {
      const isLow = item.stock <= item.minStock;
      return `
            <div class="card resource-card-clickable btn-manage-supply" data-id="${item.id}">
              ${isLow ? `<div style="position: absolute; top: 10px; right: 10px; color: var(--danger);" title="Stock Crítico">${icons.alert}</div>` : ''}
              <h3>${item.name}</h3>
              <p class="text-muted">${item.category}</p>
              <div style="margin-top: 1rem; display: flex; align-items: center; gap: 1rem;">
                <div style="flex: 1; background: #eee; height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="width: ${Math.min((item.stock / (item.minStock || 1)) * 50, 100)}%; background: ${isLow ? 'var(--danger)' : 'var(--success)'}; height: 100%;"></div>
                </div>
                <span style="font-weight: bold; color: ${isLow ? 'var(--danger)' : 'var(--text)'};">${item.stock} ${item.unit}</span>
              </div>
              <p style="font-size: 0.75rem; color: var(--muted); margin-top: 0.5rem;">Mínimo requerido: ${item.minStock} ${item.unit}</p>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

  function setupListeners() {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        state.activeTab = btn.dataset.tab;
        render();
      };
    });

    container.querySelectorAll('.btn-manage-equipment').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        showManageEquipmentModal(btn.dataset.id);
      };
    });

    container.querySelectorAll('.btn-manage-room').forEach(card => {
      card.onclick = () => showManageRoomModal(card.dataset.id);
    });

    container.querySelectorAll('.btn-manage-supply').forEach(card => {
      card.onclick = () => showManageSupplyModal(card.dataset.id);
    });

    const btnAdd = container.querySelector('#btn-add-resource');
    if (btnAdd) {
      btnAdd.onclick = () => showAddResourceModal();
    }
  }

  function showAddResourceModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000;
    `;

    let formFields = '';
    let title = '';

    switch (state.activeTab) {
      case 'rooms':
        title = 'Registrar Nuevo Consultorio';
        formFields = `
          <div class="form-group mb-4">
            <label class="form-label">Nombre/Número del Consultorio *</label>
            <input type="text" class="input" name="name" placeholder="Ej: Consultorio 101" required style="width: 100%;">
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Área Médica *</label>
            <input type="text" class="input" name="area" placeholder="Ej: Cardiología" required style="width: 100%;">
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Piso/Planta *</label>
            <input type="number" class="input" name="floor" value="1" required style="width: 100%;">
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Estado Inicial</label>
            <select class="input" name="status" style="width: 100%;">
              <option value="available">Disponible</option>
              <option value="maintenance">En Mantenimiento</option>
            </select>
          </div>
        `;
        break;
      case 'equipment':
        title = 'Registrar Nuevo Equipamiento';
        formFields = `
          <div class="form-group mb-4">
            <label class="form-label">Nombre del Equipo *</label>
            <input type="text" class="input" name="name" placeholder="Ej: Electrocardiógrafo" required style="width: 100%;">
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Estado Inicial</label>
            <select class="input" name="status" style="width: 100%;">
              <option value="available">Disponible</option>
              <option value="maintenance">En Mantenimiento</option>
            </select>
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Condición Actual</label>
            <select class="input" name="condition" style="width: 100%;">
              <option value="excellent">Excelente</option>
              <option value="good">Bueno</option>
              <option value="fair">Regular</option>
            </select>
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Último Mantenimiento</label>
            <input type="date" class="input" name="lastMaintenance" style="width: 100%;">
          </div>
        `;
        break;
      case 'supplies':
        title = 'Registrar Nuevo Insumo Crítico';
        formFields = `
          <div class="form-group mb-4">
            <label class="form-label">Nombre del Insumo *</label>
            <input type="text" class="input" name="name" placeholder="Ej: Guantes Quirúrgicos" required style="width: 100%;">
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Categoría *</label>
            <input type="text" class="input" name="category" placeholder="Ej: Protección / Desechables" required style="width: 100%;">
          </div>
          <div class="grid-2">
            <div class="form-group mb-4">
              <label class="form-label">Stock Actual *</label>
              <input type="number" class="input" name="stock" value="0" min="0" required style="width: 100%;">
            </div>
            <div class="form-group mb-4">
              <label class="form-label">Stock Mínimo *</label>
              <input type="number" class="input" name="minStock" value="10" min="0" required style="width: 100%;">
            </div>
          </div>
          <div class="form-group mb-4">
            <label class="form-label">Unidad de Medida *</label>
            <input type="text" class="input" name="unit" placeholder="Ej: cajas, unidades, ml" required style="width: 100%;">
          </div>
        `;
        break;
    }

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 550px; width: 95%; background: white; border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div style="background: var(--primary); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 1.25rem;">${title}</h2>
          <button class="close-modal" style="background: none; border: none; color: white; cursor: pointer;">${icons.close}</button>
        </div>
        <div style="padding: 2rem; max-height: 80vh; overflow-y: auto;">
          <form id="add-resource-form">
            ${formFields}
            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" class="btn btn-outline close-modal" style="flex: 1;">Cancelar</button>
              <button type="submit" class="btn btn-primary" style="flex: 2; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                ${icons.save} Guardar Registro
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelectorAll('.close-modal').forEach(btn => btn.onclick = close);

    const form = modal.querySelector('#add-resource-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      let collection = '';
      let moduleName = '';

      switch (state.activeTab) {
        case 'rooms': collection = 'consultorios'; moduleName = 'Consultorio'; break;
        case 'equipment': collection = 'equiposMedicos'; moduleName = 'Equipo Médico'; break;
        case 'supplies': collection = 'suministros'; moduleName = 'Insumo Crítico'; break;
      }

      try {
        const result = await store.add(collection, {
          ...data,
          createdAt: Date.now()
        });

        Logger.log(store, user, {
          action: Logger.Actions.CREATE,
          module: Logger.Modules.RESOURCES,
          description: `Nuevo ${moduleName.toLowerCase()} creado: ${data.name}`,
          details: { id: result.id, ...data }
        });

        showNotification(`${moduleName} registrado correctamente`, 'success');
        close();
        render();
      } catch (error) {
        showNotification(`Error al registrar el ${moduleName.toLowerCase()}`, 'error');
      }
    };
  }

  function showManageRoomModal(id) {
    const room = store.find('consultorios', id);
    if (!room) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000;
    `;

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; width: 90%; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background: var(--primary); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 1.25rem;">Gestionar Consultorio</h2>
          <button class="close-modal" style="background: none; border: none; color: white; cursor: pointer;">${icons.close}</button>
        </div>
        <div style="padding: 2rem;">
          <div style="margin-bottom: 1.5rem;">
            <p style="margin: 0; font-weight: 700; font-size: 1.1rem; color: var(--primary);">${room.name}</p>
            <p style="margin: 0.25rem 0 0; color: var(--muted); font-size: 0.85rem;">Distribución: ${room.area} - Piso ${room.floor}</p>
          </div>

          <form id="manage-room-form">
            <div class="form-group mb-4">
              <label class="form-label" style="font-weight: 600;">Estado de Disponibilidad</label>
              <select class="input" name="status" style="width: 100%;">
                <option value="available" ${room.status === 'available' || room.status === 'disponible' ? 'selected' : ''}>Disponible</option>
                <option value="occupied" ${room.status === 'occupied' || room.status === 'ocupado' ? 'selected' : ''}>Ocupado</option>
                <option value="maintenance" ${room.status === 'maintenance' || room.status === 'mantenimiento' ? 'selected' : ''}>Falla Técnica / Mantenimiento</option>
              </select>
            </div>

            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" class="btn btn-outline close-modal" style="flex: 1;">Cancelar</button>
              <button type="submit" class="btn btn-primary" style="flex: 2; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                ${icons.save} Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelectorAll('.close-modal').forEach(btn => btn.onclick = close);

    const form = modal.querySelector('#manage-room-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const status = new FormData(form).get('status');

      try {
        await store.update('consultorios', id, { status, updatedAt: Date.now() });
        Logger.log(store, user, {
          action: Logger.Actions.UPDATE,
          module: Logger.Modules.RESOURCES,
          description: `Estado de consultorio actualizado: ${room.name}`,
          details: { roomId: id, oldStatus: room.status, newStatus: status }
        });
        showNotification('Consultorio actualizado', 'success');
        close();
        render();
      } catch (error) {
        showNotification('Error al actualizar', 'error');
      }
    };
  }

  function showManageEquipmentModal(id) {
    const eq = store.find('equiposMedicos', id);
    if (!eq) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000;
    `;

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; width: 90%; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background: var(--primary); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 1.25rem;">Gestionar Equipo</h2>
          <button class="close-modal" style="background: none; border: none; color: white; cursor: pointer;">${icons.close}</button>
        </div>
        <div style="padding: 2rem;">
          <div style="margin-bottom: 1.5rem;">
            <p style="margin: 0; font-weight: 700; font-size: 1.1rem; color: var(--primary);">${eq.name}</p>
            <p style="margin: 0.25rem 0 0; color: var(--muted); font-size: 0.85rem;">Último mantenimiento: ${eq.lastMaintenance || 'N/A'}</p>
          </div>

          <form id="manage-equipment-form">
            <div class="form-group mb-4">
              <label class="form-label" style="font-weight: 600;">Estado Operativo</label>
              <select class="input" name="status" style="width: 100%;">
                <option value="available" ${eq.status === 'available' || eq.status === 'disponible' ? 'selected' : ''}>Disponible</option>
                <option value="occupied" ${eq.status === 'occupied' || eq.status === 'ocupado' ? 'selected' : ''}>En Uso</option>
                <option value="maintenance" ${eq.status === 'maintenance' || eq.status === 'mantenimiento' ? 'selected' : ''}>En Mantenimiento</option>
              </select>
            </div>

            <div class="form-group mb-4">
              <label class="form-label" style="font-weight: 600;">Condición Física</label>
              <select class="input" name="condition" style="width: 100%;">
                <option value="excellent" ${eq.condition === 'excellent' || eq.condition === 'excelente' ? 'selected' : ''}>Excelente</option>
                <option value="good" ${eq.condition === 'good' || eq.condition === 'bueno' ? 'selected' : ''}>Bueno</option>
                <option value="fair" ${eq.condition === 'fair' || eq.condition === 'regular' ? 'selected' : ''}>Regular</option>
                <option value="poor" ${eq.condition === 'poor' || eq.condition === 'malo' ? 'selected' : ''}>Necesita Reparación</option>
              </select>
            </div>

            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" class="btn btn-outline close-modal" style="flex: 1;">Cancelar</button>
              <button type="submit" class="btn btn-primary" style="flex: 2; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                ${icons.save} Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelectorAll('.close-modal').forEach(btn => btn.onclick = close);

    const form = modal.querySelector('#manage-equipment-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const updates = {
        status: formData.get('status'),
        condition: formData.get('condition'),
        updatedAt: Date.now()
      };

      try {
        await store.update('equiposMedicos', id, updates);

        Logger.log(store, user, {
          action: Logger.Actions.UPDATE,
          module: Logger.Modules.RESOURCES,
          description: `Estado de equipo actualizado: ${eq.name}`,
          details: { equipmentId: id, old: { status: eq.status, condition: eq.condition }, new: updates }
        });

        showNotification('Equipo actualizado correctamente', 'success');
        close();
        render();
      } catch (error) {
        showNotification('Error al actualizar the equipo', 'error');
      }
    };
  }

  function showManageSupplyModal(id) {
    const supply = store.find('suministros', id);
    if (!supply) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000;
    `;

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px; width: 90%; background: white; border-radius: 8px; overflow: hidden;">
        <div style="background: var(--primary); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 1.25rem;">Ajustar Stock</h2>
          <button class="close-modal" style="background: none; border: none; color: white; cursor: pointer;">${icons.close}</button>
        </div>
        <div style="padding: 2rem;">
          <div style="margin-bottom: 1.5rem;">
            <p style="margin: 0; font-weight: 700; font-size: 1.1rem; color: var(--primary);">${supply.name}</p>
            <p style="margin: 0.25rem 0 0; color: var(--muted); font-size: 0.85rem;">Categoría: ${supply.category}</p>
          </div>

          <form id="manage-supply-form">
             <div class="form-group mb-4">
              <label class="form-label" style="font-weight: 600;">Stock Actual (${supply.unit})</label>
              <input type="number" class="input" name="stock" value="${supply.stock}" min="0" required style="width: 100%;">
            </div>

            <div class="form-group mb-4">
              <label class="form-label" style="font-weight: 600;">Stock Mínimo Alerta (${supply.unit})</label>
              <input type="number" class="input" name="minStock" value="${supply.minStock}" min="0" required style="width: 100%;">
            </div>

            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" class="btn btn-outline close-modal" style="flex: 1;">Cancelar</button>
              <button type="submit" class="btn btn-primary" style="flex: 2; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                ${icons.save} Actualizar Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelectorAll('.close-modal').forEach(btn => btn.onclick = close);

    const form = modal.querySelector('#manage-supply-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const updates = {
        stock: parseInt(formData.get('stock')),
        minStock: parseInt(formData.get('minStock')),
        updatedAt: Date.now()
      };

      try {
        await store.update('suministros', id, updates);
        Logger.log(store, user, {
          action: Logger.Actions.UPDATE,
          module: Logger.Modules.RESOURCES,
          description: `Stock de insumo ajustado: ${supply.name}`,
          details: { supplyId: id, oldStock: supply.stock, newStock: updates.stock }
        });
        showNotification('Inventario actualizado', 'success');
        close();
        render();
      } catch (error) {
        showNotification('Error al actualizar inventario', 'error');
      }
    };
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6';

    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem;
      background: ${bgColor}; color: white; border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    notification.innerHTML = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  function getStatusLabel(status) {
    const labels = {
      'available': 'Disponible',
      'occupied': 'Ocupado',
      'maintenance': 'Mantenimiento',
      'disponible': 'Disponible',
      'ocupado': 'Ocupado',
      'mantenimiento': 'Mantenimiento'
    };
    return (status && labels[status.toLowerCase()]) || status || 'N/A';
  }

  function getConditionLabel(condition) {
    const labels = {
      'good': 'Bueno',
      'fair': 'Regular',
      'excellent': 'Excelente',
      'poor': 'Malo',
      'bueno': 'Bueno',
      'regular': 'Regular',
      'excelente': 'Excelente',
      'malo': 'Malo'
    };
    return (condition && labels[condition.toLowerCase()]) || condition || 'N/A';
  }

  function getStatusColor(status) {
    if (!status) return '#6b7280';
    switch (status.toLowerCase()) {
      case 'available':
      case 'disponible': return '#10b981';
      case 'occupied':
      case 'ocupado': return '#ef4444';
      case 'maintenance':
      case 'mantenimiento': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  function getStatusBadgeClass(status) {
    if (!status) return 'badge-outline';
    switch (status.toLowerCase()) {
      case 'available':
      case 'disponible': return 'badge-success';
      case 'occupied':
      case 'ocupado': return 'badge-danger';
      case 'maintenance':
      case 'mantenimiento': return 'badge-warning';
      default: return 'badge-outline';
    }
  }

  render();
}
