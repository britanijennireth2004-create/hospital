/**
 * Módulo de Áreas/Servicios - Gestión completa
 */

const icons = {
  area: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  doctor: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  successCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  bed: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`,
  door: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4v16"/><path d="M13 4H4v16h9"/><path d="M19 4h-6"/><path d="M19 20h-6"/><path d="M11 12h.01"/></svg>`
};

export default function mountAreas(root, { bus, store, user, role }) {
  const state = {
    areas: [],
    filters: {
      search: ''
    },
    editingId: null,
    isLoading: false,
    showModal: false,
    currentPage: 1,
    itemsPerPage: 10
  };

  let elements = {};

  // Inicializar
  function init() {
    render();
    setupEventListeners();

    // Suscribirse a cambios en el store
    const unsubscribe = store.subscribe('areas', () => {
      loadAreas();
    });

    return unsubscribe;
  }

  // Cargar áreas
  function loadAreas() {
    let areas = store.get('areas') || [];

    // Aplicar filtros
    areas = applyFilters(areas);

    // Ordenar jerárquicamente (áreas principales primero, luego sub-áreas)
    areas.sort((a, b) => {
      // Primero por estado activo
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      // Luego por si es principal o sub-área
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      // Finalmente alfabético
      return a.name.localeCompare(b.name);
    });

    state.areas = areas;
    renderAreasList();
    updateStats();
    loadSelectData();
  }

  // Aplicar filtros
  function applyFilters(areas) {
    return areas.filter(area => {
      if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        const statusText = area.isActive ? 'activo active' : 'inactivo inactive';
        const parentAreaName = getParentAreaName(area.parentId);

        const searchFields = [
          area.name,
          area.code,
          area.description,
          area.location,
          statusText,
          parentAreaName
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });
  }

  // Obtener estadísticas de área
  function getAreaStats(areaId) {
    const doctors = store.get('doctors') || [];
    const appointments = store.get('appointments') || [];
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const areaDoctors = doctors.filter(d =>
      d.areaId === areaId ||
      (d.otherAreas && d.otherAreas.includes(areaId))
    );

    const areaAppointments = appointments.filter(a => a.areaId === areaId);

    return {
      totalDoctors: areaDoctors.length,
      totalAppointments: areaAppointments.length,
      todayAppointments: areaAppointments.filter(a => {
        const appointmentDate = new Date(a.dateTime);
        return appointmentDate.toDateString() === today.toDateString();
      }).length,
      monthAppointments: areaAppointments.filter(a => {
        const appointmentDate = new Date(a.dateTime);
        return appointmentDate.getMonth() === thisMonth &&
          appointmentDate.getFullYear() === thisYear;
      }).length
    };
  }

  // Obtener nombre del área padre
  function getParentAreaName(parentId) {
    if (!parentId) return null;
    const parentArea = store.find('areas', parentId);
    return parentArea ? parentArea.name : 'Área eliminada';
  }

  // Renderizar componente principal
  function render() {
    const canManage = role === 'admin';

    root.innerHTML = `
      <style>
        .module-areas { max-width: 1400px; margin: 0 auto; padding: 1.5rem; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .areas-header-card { 
          background: white; 
          border-radius: 16px; 
          padding: 2rem; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.04); 
          margin-bottom: 2rem;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .areas-table-card { 
          background: white; 
          border-radius: 16px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.06); 
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .areas-table { width: 100%; border-collapse: collapse; }
        .areas-table th { 
          background: #f8fafc; 
          padding: 1.25rem 1rem; 
          text-align: left; 
          font-size: 0.75rem; 
          font-weight: 700; 
          color: #64748b; 
          text-transform: uppercase; 
          letter-spacing: 0.05em;
          border-bottom: 1px solid #edf2f7;
        }
        .areas-table td { padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .areas-table tr:hover { background: #fcfdfe; }
        .search-container { position: relative; flex: 1; max-width: 500px; }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .search-input { 
          width: 100%; 
          padding: 0.85rem 1rem 0.85rem 3.2rem; 
          border-radius: 20px; 
          background: rgba(0,0,0,0.05); 
          border: 1px solid transparent; 
          font-size: 0.95rem; 
          transition: all 0.2s; 
          outline: none; 
        }
        .search-input:focus { border-color: var(--accent); background: white; box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.1); }
        .area-badge { padding: 0.4rem 0.75rem; border-radius: 8px; font-weight: 600; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.5rem; }
        .area-type-pill { background: #f1f5f9; color: #475569; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
        .area-icon-box { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 1.1rem; }
        
        /* Modal Utilities */
        .modal-body::-webkit-scrollbar { width: 6px; }
        .modal-body::-webkit-scrollbar-track { background: #f1f1f1; }
        .modal-body::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
        .modal-body::-webkit-scrollbar-thumb:hover { background: #bbb; }
      </style>

      <div class="module-areas animated-fade-in">
        <!-- Estadísticas -->
        <div class="stats-auto-grid mb-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Barra de Búsqueda + Botón -->
        <div class="card" style="padding: 0.75rem 1rem; margin-bottom: 1.5rem;">
          <div class="flex justify-between items-center">
            ${canManage ? `
              <button class="btn btn-primary" id="btn-new-area">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Nueva Área
              </button>
            ` : '<div></div>'}
            
            <div class="search-input-wrapper" style="position: relative; width: 450px;">
              <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input type="text" class="input" id="filter-search" 
                     placeholder="Buscar por nombre, código o ubicación..." 
                     style="padding-left: 2.8rem; border-radius: 20px; background: rgba(0,0,0,0.05); border: 1px solid transparent; transition: all 0.3s; height: 40px; width: 100%;"
                     value="${state.filters.search}">
            </div>
          </div>
        </div>

        <!-- Vista de lista -->
        <div class="areas-grid" id="areas-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 1.5rem;">
          <!-- Se llenará dinámicamente -->
        </div>
          
          <!-- Paginación y Estados Vacíos -->
          <div id="pagination" style="padding: 1.5rem; border-top: 1px solid #f1f5f9;"></div>
          
          <div id="empty-state" class="hidden" style="padding: 5rem 2rem; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.2;">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6V2H4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4"/><path d="M16 22v-8h-4v8"/><path d="M11 5h1"/><path d="M11 9h1"/><path d="M11 13h1"/></svg>
            </div>
            <h3 style="font-size: 1.5rem; color: #1e293b; margin-bottom: 0.5rem;">No se encontraron áreas</h3>
            <p style="color: #64748b; max-width: 400px; margin: 0 auto 2rem;">Ajuste los filtros de búsqueda o registre una nueva área en el sistema.</p>
            ${canManage ? `
              <button class="btn btn-primary" id="btn-create-first" style="padding: 0.75rem 2rem; border-radius: 12px;">
                Registrar primera área
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Modal para nueva/editar área -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="area-modal">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h3>
              <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">
                ${state.editingId ? 'EDICIÓN DE ÁREA / SERVICIO' : 'CONFIGURACIÓN DE NUEVA ÁREA'}
              </div>
            </div>
            <button class="close-modal btn-circle" id="btn-close-modal" style="background: rgba(255,255,255,0.2); border: none; color: white;">&times;</button>
          </div>
          
          <div class="modal-body" style="padding: 2rem;">
            <form id="area-form">
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M15 18h.01"/><path d="M9 18h.01"/></svg>
                INFORMACIÓN GENERAL DEL ÁREA
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOMBRE DEL ÁREA *</label>
                  <input type="text" class="input" id="form-name" 
                         required placeholder="Ej: Pediatría, Urgencias, Laboratorio...">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CÓDIGO DE IDENTIFICACIÓN *</label>
                  <input type="text" class="input" id="form-code" 
                         required placeholder="Ej: PEDI-01">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DESCRIPCIÓN DEL ÁREA</label>
                <textarea class="input" id="form-description" rows="2" placeholder="Propósito o función del servicio..."></textarea>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESPECIALIDAD PRINCIPAL *</label>
                  <input type="text" class="input" id="form-specialty" 
                         required placeholder="Ej: Medicina General">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">TELÉFONO DE CONTACTO</label>
                  <input type="text" class="input" id="form-phone" 
                         placeholder="Ej: 0412-1234567">
                </div>
              </div>
              
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                ${icons.door}
                UBICACIÓN FÍSICA
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">EDIFICIO</label>
                  <input type="text" class="input" id="form-edificio" placeholder="Ej: A">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">PISO</label>
                  <input type="text" class="input" id="form-piso" placeholder="Ej: 1">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ALA</label>
                  <input type="text" class="input" id="form-ala" placeholder="Ej: Norte">
                </div>
              </div>
              
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                CONFIGURACIÓN TÉCNICA
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">TIPO DE ÁREA</label>
                  <select class="input" id="form-type">
                    <option value="clinical">Clínica</option>
                    <option value="diagnostic">Diagnóstico</option>
                    <option value="surgical">Quirúrgica</option>
                    <option value="administrative">Administrativa</option>
                    <option value="support">Soporte</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">COLOR IDENTIFICATIVO</label>
                  <div class="flex items-center gap-2">
                    <input type="color" class="input" id="form-color" 
                           value="#2196F3" 
                           style="width: 50px; height: 38px; padding: 2px;">
                    <input type="text" class="input" id="form-color-text" 
                           placeholder="#2196F3">
                  </div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ÁREA PADRE (SI APLICA)</label>
                  <select class="input" id="form-parent">
                    <option value="">Área principal (sin padre)</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MÉDICO RESPONSABLE</label>
                  <select class="input" id="form-head-doctor">
                    <option value="">Sin asignar</option>
                  </select>
                </div>
              </div>
              
              <div class="clinical-section" style="margin-top: 1.5rem;">
                <div class="clinical-section-header sage">CONFIGURACIÓN DE INFRAESTRUCTURA (HABITACIONES)</div>
                <div class="clinical-section-content">
                  <div style="display: grid; grid-template-columns: 1.5fr 1fr 1.2fr 0.6fr 0.6fr 1fr auto; gap: 0.5rem; margin-bottom: 1rem; align-items: end;">
                    <div class="form-group">
                      <label class="clinical-label">Nombre/Código</label>
                      <input type="text" class="input" id="form-room-name" placeholder="Ej: 101">
                    </div>
                    <div class="form-group">
                      <label class="clinical-label">Tipo</label>
                      <select class="input" id="form-room-type">
                        <option value="Individual">Individual</option>
                        <option value="UCI">UCI</option>
                        <option value="Triaje">Triaje</option>
                        <option value="Observación">Observación</option>
                        <option value="Quirófano">Quirófano</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="clinical-label">Especialidad</label>
                      <select class="input" id="form-room-specialty">
                        <!-- Llenado dinámicamente -->
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="clinical-label">Total</label>
                      <input type="number" class="input" id="form-room-beds" min="1" value="1">
                    </div>
                    <div class="form-group">
                      <label class="clinical-label">Libres</label>
                      <input type="number" class="input" id="form-room-available" min="0" value="1">
                    </div>
                    <div class="form-group">
                      <label class="clinical-label">Estado</label>
                      <select class="input" id="form-room-status">
                        <option value="disponible">Disponible</option>
                        <option value="ocupada">Ocupada</option>
                        <option value="mantenimiento">Mantenimiento</option>
                      </select>
                    </div>
                    <button type="button" class="btn btn-outline" id="btn-add-room" style="height: 38px; display: flex; align-items: center; justify-content: center; padding: 0 1rem; background: var(--modal-section-green-light);">
                      ${icons.plus}
                    </button>
                  </div>
                  <div id="rooms-container" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 200px; overflow-y: auto; padding-right: 0.5rem;">
                    <!-- Habitaciones añadidas se verán aquí -->
                  </div>
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESPECIALIDADES</label>
                <div class="flex gap-2">
                  <input type="text" class="input" id="form-add-specialty" 
                         placeholder="Ej: Cardiología, Neurología..." style="flex: 1;">
                  <button type="button" class="btn btn-outline" id="btn-add-specialty" style="white-space: nowrap; background: var(--themeLighter); border-color: var(--themeLight);">Agregar</button>
                </div>
                <div id="specialties-container" class="flex flex-wrap gap-1 mt-2">
                  <!-- Se llenará dinámicamente -->
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">EMAIL DE CONTACTO</label>
                <input type="email" class="input" id="form-email" 
                       placeholder="Ej: area@hospital.com">
              </div>
              
              ${state.editingId ? `
                <div class="form-group" style="background: var(--modal-bg); padding: 1rem; border-radius: 4px; margin-top: 1.5rem;">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO OPERATIVO</label>
                  <select class="input" id="form-status" style="border-color: var(--modal-border); background: white;">
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                    <option value="maintenance">En mantenimiento</option>
                  </select>
                </div>
              ` : ''}
              
              <div class="form-group" style="margin-top: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOTAS ADICIONALES</label>
                <textarea class="input" id="form-notes" rows="2"
                          placeholder="Observaciones importantes..."></textarea>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn-circle btn-circle-cancel" id="btn-cancel" title="Cancelar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button class="btn-circle btn-circle-save" id="btn-save" title="${state.editingId ? 'Actualizar Área' : 'Confirmar Área'}" ${state.isLoading ? 'disabled' : ''}>
              ${state.isLoading ? '<span class="loading-spinner"></span>' : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal para cambiar estado -->
      <div class="modal-overlay hidden" id="status-modal">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header" style="background: var(--warning);">
            <div>
              <h3 class="modal-title">CAMBIAR ESTADO OPERATIVO</h3>
              <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;" id="status-area-name">Área Seleccionada</div>
            </div>
            <button class="close-modal btn-circle" id="btn-close-status-modal" style="background: rgba(255,255,255,0.2); border: none; color: white;">&times;</button>
          </div>
          
          <div class="modal-body" style="padding: 2rem;">
            <form id="status-form">
              <div class="form-group mb-4">
                <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">ESTADO ACTUAL</label>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                  <div id="status-modal-badge" style="width: 12px; height: 12px; border-radius: 50%; background: var(--success);"></div>
                  <span id="status-modal-text" style="font-weight: 600;">ACTIVO</span>
                  <span id="status-modal-subtext" class="hidden" style="margin-left: 0.5rem;"></span>
                </div>
              </div>
              <div class="form-group mb-4">
                <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">NUEVO ESTADO *</label>
                <select class="input" id="status-form-state" required style="border-color: var(--neutralTertiary); background: var(--white); height:38px;">
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                  <option value="maintenance">En mantenimiento</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label font-bold" style="color: var(--modal-text); font-size: 0.85rem;">MOTIVO DEL CAMBIO / OBSERVACIONES</label>
                <textarea class="input" id="status-form-reason" rows="3" placeholder="Ej: Remodelación, cierre temporal..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn-circle btn-circle-cancel" id="btn-cancel-status" title="Cancelar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button class="btn-circle btn-circle-status" id="btn-save-status" title="Confirmar Cambio">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Modal para detalles e infraestructura -->
      <div class="modal-overlay hidden" id="detail-modal">
        <div class="modal-content" style="width: 90vw; max-width: 1400px; height: 95vh; display: flex; flex-direction: column;">
          <div class="modal-header" style="background: var(--modal-section-green, #16a34a);">
            <div>
              <h3 class="modal-title" id="detail-area-name" style="color: var(--modal-header-text);">INFRAESTRUCTURA DE ÁREA</h3>
              <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500; color: var(--modal-header-text);" id="detail-area-location">Ubicación</div>
            </div>
            <button class="close-modal btn-circle" id="btn-close-detail" style="background: rgba(255,255,255,0.2); border: none; color: white;">&times;</button>
          </div>
          
          <div class="modal-body" style="padding: 2rem; flex: 1; overflow-y: auto; display: flex; gap: 2rem;">
            <!-- Grid de habitaciones -->
            <div style="flex: 2;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="color: var(--modal-section-green); font-weight: bold; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4v16"/><path d="M13 4H4v16h9"/><path d="M19 4h-6"/><path d="M19 20h-6"/><path d="M11 12h.01"/></svg>
                  Habitaciones
                </h4>
              </div>
              <div id="rooms-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem;">
                <!-- Habitaciones llenadas dinámicamente -->
              </div>
            </div>
            
            <!-- Panel lateral de edición de camas -->
            <div id="room-edit-panel" style="flex: 1; background: var(--modal-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--modal-border); display: none; align-self: flex-start;">
              <h4 style="color: var(--modal-section-forest); font-weight: bold; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;" id="edit-room-name">Editar Habitación</h4>
              
              <form id="room-form">
                <input type="hidden" id="room-id">
                <input type="hidden" id="is-new-room" value="false">
                <div class="form-group mb-4" id="form-group-room-name" style="display: none;">
                  <label class="form-label" style="font-weight: bold; color: var(--modal-text);">Nombre/Código</label>
                  <input type="text" class="input" id="room-name-input" style="background: white;" placeholder="Ej: 101">
                </div>
                <div class="form-group mb-4">
                  <label class="form-label" style="font-weight: bold; color: var(--modal-text);">Tipo</label>
                  <select class="input" id="room-type-input" style="background: white;">
                    <option value="Individual">Individual</option>
                    <option value="UCI">UCI</option>
                    <option value="Triaje">Triaje</option>
                    <option value="Observación">Observación</option>
                    <option value="Quirófano">Quirófano</option>
                  </select>
                </div>
                <div class="form-group mb-4">
                  <label class="form-label" style="font-weight: bold; color: var(--modal-text);">Especialidad Médica</label>
                  <select class="input" id="room-specialty-input" style="background: white;">
                    <!-- Llenado dinámicamente -->
                  </select>
                </div>
                <div class="form-group mb-4">
                  <label class="form-label" style="font-weight: bold; color: var(--modal-text);">Capacidad Total</label>
                  <input type="number" class="input" id="room-capacity" min="1" max="20" style="background: white;" oninput="if(window.validateRoomBeds) window.validateRoomBeds()">
                </div>
                <div class="form-group mb-4" id="form-group-room-available">
                  <label class="form-label" style="font-weight: bold; color: var(--modal-text);">Libres (Disponibles)</label>
                  <input type="number" class="input" id="room-available" min="0" max="20" style="background: white;" oninput="if(window.validateRoomBeds) window.validateRoomBeds()">
                  <div id="room-beds-error" class="hidden" style="color: var(--redDark, #dc2626); font-size: 0.8rem; margin-top: 0.25rem;">Error: Camillas libres superan el total.</div>
                </div>
                <div class="form-group mb-4" id="form-group-room-status">
                  <label class="form-label" style="font-weight: bold; color: var(--modal-text);">Estado Operativo</label>
                  <select class="input" id="room-status-input" style="background: white;">
                    <option value="disponible">Disponible</option>
                    <option value="ocupada">Ocupada</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
                <button type="submit" id="btn-save-room" class="btn btn-primary" style="width: 100%; background: var(--modal-section-green); border: none;">Actualizar Habitación</button>
              </form>
            </div>
          </div>

          <div class="modal-footer" style="background: #f8fafc; border-top: 1px solid var(--modal-border);">
            <button type="button" class="btn btn-outline" id="btn-add-room-detail" style="border-color: var(--green); color: var(--green); padding: 0.5rem 1.5rem; font-weight: 700;">+ Añadir Habitación</button>
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('detail-modal').classList.add('hidden')" style="padding: 0.5rem 1.5rem;">Cerrar Panel</button>
          </div>
        </div>
      </div>
    `;

    // Guardar referencias a elementos
    elements = {
      statsContainer: root.querySelector('#stats-container'),
      listViewCount: root.querySelector('#list-view-count'),
      areasList: root.querySelector('#areas-list'),
      pagination: root.querySelector('#pagination'),
      emptyState: root.querySelector('#empty-state'),
      filterSearch: root.querySelector('#filter-search'),
      modal: root.querySelector('#area-modal'),
      form: root.querySelector('#area-form'),
      formName: root.querySelector('#form-name'),
      formCode: root.querySelector('#form-code'),
      formDescription: root.querySelector('#form-description'),
      formLocation: root.querySelector('#form-location'),
      formPhone: root.querySelector('#form-phone'),
      formEmail: root.querySelector('#form-email'),
      formColor: root.querySelector('#form-color'),
      formColorText: root.querySelector('#form-color-text'),
      formType: root.querySelector('#form-type'),
      formParent: root.querySelector('#form-parent'),
      formHeadDoctor: root.querySelector('#form-head-doctor'),
      formRoomName: root.querySelector('#form-room-name'),
      formRoomBeds: root.querySelector('#form-room-beds'),
      btnAddRoom: root.querySelector('#btn-add-room'),
      formRoomType: root.querySelector('#form-room-type'),
      formRoomSpecialty: root.querySelector('#form-room-specialty'),
      formRoomAvailable: root.querySelector('#form-room-available'),
      formRoomStatus: root.querySelector('#form-room-status'),
      roomsContainer: root.querySelector('#rooms-container'),
      formAddSpecialty: root.querySelector('#form-add-specialty'),
      btnAddSpecialty: root.querySelector('#btn-add-specialty'),
      specialtiesContainer: root.querySelector('#specialties-container'),
      formStatus: root.querySelector('#form-status'),
      formNotes: root.querySelector('#form-notes'),
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewArea: root.querySelector('#btn-new-area'),
      btnCreateFirst: root.querySelector('#btn-create-first'),
      formEdificio: root.querySelector('#form-edificio'),
      formPiso: root.querySelector('#form-piso'),
      formAla: root.querySelector('#form-ala'),
      formSpecialty: root.querySelector('#form-specialty'),

      statusModal: root.querySelector('#status-modal'),
      btnCancelStatus: root.querySelector('#btn-cancel-status'),
      btnSaveStatus: root.querySelector('#btn-save-status'),
      btnCloseStatusModal: root.querySelector('#btn-close-status-modal'),
      statusFormState: root.querySelector('#status-form-state'),
      statusFormReason: root.querySelector('#status-form-reason'),
      statusAreaName: root.querySelector('#status-area-name')
    };

    // Cargar datos iniciales
    loadSelectData();
    loadAreas();
  }

  // Cargar datos en selects
  function loadSelectData() {
    const areas = store.get('areas') || [];

    // Ya no se necesitan cargas de filtros aquí

    // Áreas padre para formulario
    if (elements.formParent) {
      const options = areas
        .filter(a => !a.parentId) // Solo áreas principales
        .map(a => `<option value="${a.id}">${a.name}</option>`)
        .join('');
      elements.formParent.innerHTML = `<option value="">Área principal (sin padre)</option>${options}`;
    }

    // Médicos jefe
    if (elements.formHeadDoctor) {
      const doctors = (store.get('doctors') || []).filter(d => d.isActive);
      const options = doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
      elements.formHeadDoctor.innerHTML = `<option value="">Sin asignar</option>${options}`;
    }

    // Especialidades para habitaciones
    const specialtiesList = [
      'Cardiología', 'Pediatría', 'Traumatología', 'Ginecología', 
      'Medicina General', 'UCI', 'Triaje', 'Odontología', 'Gastroenterología',
      'Neurología', 'Oftalmología', 'Urgencias Adulto'
    ];
    const specialtyOptions = specialtiesList.map(s => `<option value="${s}">${s}</option>`).join('');

    if (elements.formRoomSpecialty) {
      elements.formRoomSpecialty.innerHTML = specialtyOptions;
    }

    const roomSpecialtyInput = root.querySelector('#room-specialty-input');
    if (roomSpecialtyInput) {
      roomSpecialtyInput.innerHTML = specialtyOptions;
    }
  }


  // Renderizado de lista manejado por renderAreasList


  // Renderizar lista de áreas
  function renderAreasList() {
    if (!elements.areasList) return;

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedAreas = state.areas.slice(startIndex, endIndex);

    if (paginatedAreas.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.areasList.classList.add('hidden');
      elements.pagination.classList.add('hidden');
      if (elements.listViewCount) elements.listViewCount.textContent = '0 áreas';
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.areasList.classList.remove('hidden');
    elements.pagination.classList.remove('hidden');
    if (elements.listViewCount) elements.listViewCount.textContent = `${state.areas.length} ${state.areas.length === 1 ? 'área' : 'áreas'}`;

    const rows = paginatedAreas.map(area => {
      const stats = getAreaStats(area.id);
      const parentName = getParentAreaName(area.parentId);
      const canEdit = role === 'admin';

      const typeNames = { clinical: 'Clínica', diagnostic: 'Diagnóstico', surgical: 'Quirúrgica', administrative: 'Admin', support: 'Soporte' };

      return `
        <div class="card area-card" data-action="view" data-id="${area.id}" style="cursor: pointer; position: relative; border-left: 4px solid ${area.color || '#2196F3'}; border-radius: 12px; padding: 1.2rem; background: white; box-shadow: 0 4px 15px rgba(0,0,0,0.05); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.08)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.05)';">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <div>
              <h4 style="font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem 0; line-height: 1.2;">${area.name}</h4>
              <div style="font-size: 0.8rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${area.location ? `Edif. ${area.location.edificio}, Piso ${area.location.piso}, Ala ${area.location.ala}` : 'No asignada'}
              </div>
            </div>
            <div class="area-badge" style="background: ${area.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${area.isActive ? '#10b981' : '#ef4444'}; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 6px; font-weight: 600;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: currentColor; margin-right: 4px;"></span>
              ${area.isActive ? 'Activa' : 'Inactiva'}
            </div>
          </div>
          
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <span style="background: #f1f5f9; color: #475569; padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">
              Habitaciones: ${area.rooms ? area.rooms.filter(r => (r.availableBeds !== undefined ? r.availableBeds : r.available) > 0).length : 0} / ${area.rooms ? area.rooms.length : 0} Disponibles
            </span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 0.75rem; margin-top: auto;">
             <div class="toggle-switch" data-action="toggle-status" data-id="${area.id}" style="display: flex; align-items: center; cursor: pointer;">
                <span style="width: 36px; height: 20px; background: ${area.isActive ? 'var(--success)' : '#e2e8f0'}; border-radius: 20px; position: relative; display: inline-block; transition: background 0.3s;">
                  <span style="position: absolute; left: ${area.isActive ? '18px' : '2px'}; top: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: left 0.3s;"></span>
                </span>
             </div>
             ${canEdit ? `
               <button class="btn-circle-edit" data-action="edit-area" data-id="${area.id}" style="width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--neutralLighter); color: var(--primary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='var(--primary-light)'; this.style.color='white'" onmouseout="this.style.background='var(--neutralLighter)'; this.style.color='var(--primary)'">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
               </button>
             ` : ''}
          </div>
        </div>
      `;
    }).join('');

    elements.areasList.innerHTML = rows;

    renderPagination();
  }

  // Renderizar paginación
  function renderPagination() {
    if (!elements.pagination) return;

    const totalPages = Math.ceil(state.areas.length / state.itemsPerPage);

    if (totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }

    let pageButtons = '';
    const maxVisible = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageButtons += `
        <button class="btn btn-sm ${state.currentPage === i ? 'btn-primary' : 'btn-outline'}" 
                data-page="${i}">
          ${i}
        </button>
      `;
    }

    elements.pagination.innerHTML = `
      <div class="text-sm text-muted">
        Mostrando ${Math.min((state.currentPage - 1) * state.itemsPerPage + 1, state.areas.length)} - 
        ${Math.min(state.currentPage * state.itemsPerPage, state.areas.length)} de ${state.areas.length} áreas
      </div>
      
      <div class="flex gap-1">
        <button class="btn btn-outline btn-sm ${state.currentPage === 1 ? 'disabled' : ''}" 
                data-page="prev" ${state.currentPage === 1 ? 'disabled' : ''}>
          ← Anterior
        </button>
        
        ${pageButtons}
        
        <button class="btn btn-outline btn-sm ${state.currentPage === totalPages ? 'disabled' : ''}" 
                data-page="next" ${state.currentPage === totalPages ? 'disabled' : ''}>
          Siguiente →
        </button>
      </div>
    `;
  }

  // Actualizar estadísticas
  function updateStats() {
    if (!elements.statsContainer) return;

    const areas = store.get('areas') || [];
    const doctors = store.get('doctors') || [];
    const appointments = store.get('appointments') || [];

    const now = new Date();
    const monthlyCount = appointments.filter(a => {
      const d = new Date(a.dateTime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const stats = {
      total: areas.length,
      active: areas.filter(a => a.isActive).length,
      mainAreas: areas.filter(a => !a.parentId).length,
      subAreas: areas.filter(a => a.parentId).length,
      areaAssignments: doctors.filter(d => d.areaId).length +
        doctors.reduce((sum, d) => sum + (d.otherAreas ? d.otherAreas.length : 0), 0),
      monthlyAppointments: monthlyCount
    };

    elements.statsContainer.innerHTML = `
      <div class="stat-info-card">
        <span class="stat-info-label">Total Áreas</span>
        <span class="stat-info-value">${stats.total}</span>
        <span class="stat-info-sub">
          ${icons.area || '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'}
          ${stats.mainAreas} principales, ${stats.subAreas} sub
        </span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Áreas Activas</span>
        <span class="stat-info-value">${stats.active}</span>
        <span class="stat-info-sub">
          ${icons.successCheck || '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'}
          ${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% operativa
        </span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Asignaciones</span>
        <span class="stat-info-value">${stats.areaAssignments}</span>
        <span class="stat-info-sub">
          ${icons.doctor || '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}
          Capacidad instalada
        </span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Citas del Mes</span>
        <span class="stat-info-value">${stats.monthlyAppointments}</span>
        <span class="stat-info-sub">
          ${icons.calendar || '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'}
          Rendimiento mensual
        </span>
      </div>
    `;
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Helper para debouncing
    function debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }

    // Búsqueda unificada
    if (elements.filterSearch) {
      elements.filterSearch.addEventListener('input', debounce((e) => {
        state.filters.search = e.target.value;
        state.currentPage = 1;
        loadAreas();

        // Sincronizar con el input de la lista si existe
        const listSearch = root.querySelector('#filter-search-list');
        if (listSearch && listSearch !== e.target) {
          listSearch.value = e.target.value;
        }
      }, 300));
    }

    // Modal

    if (elements.btnNewArea) {
      elements.btnNewArea.addEventListener('click', () => openModal());
    }

    if (elements.btnCreateFirst) {
      elements.btnCreateFirst.addEventListener('click', () => openModal());
    }

    if (elements.btnCloseModal) {
      elements.btnCloseModal.addEventListener('click', closeModal);
    }

    if (elements.btnCancel) {
      elements.btnCancel.addEventListener('click', closeModal);
    }

    if (elements.btnSave) {
      elements.btnSave.addEventListener('click', saveArea);
    }

    if (elements.btnAddSpecialty) {
      elements.btnAddSpecialty.addEventListener('click', addSpecialty);
    }
    
    if (elements.btnAddRoom) {
      elements.btnAddRoom.addEventListener('click', addRoomToForm);
    }

    if (elements.btnCloseStatusModal) {
      elements.btnCloseStatusModal.addEventListener('click', closeStatusModal);
    }

    if (elements.btnCancelStatus) {
      elements.btnCancelStatus.addEventListener('click', closeStatusModal);
    }

    if (elements.btnSaveStatus) {
      elements.btnSaveStatus.addEventListener('click', saveStatus);
    }

    // Paginación (event delegation)
    if (elements.pagination) {
      elements.pagination.addEventListener('click', handlePagination);
    }

    // Acciones de la lista y grid (event delegation)
    if (elements.areasList) {
      elements.areasList.addEventListener('click', handleListAction);
    }


  }

  // Manejar filtros
  // Los antiguos manejadores de filtros han sido eliminados en la refactorización unificada.




  // Manejar filtros
  function applyFiltersHandler() {
    // Los antiguos manejadores de filtros han sido eliminados en la refactorización unificada.
  }

  // Manejar paginación
  function handlePagination(event) {
    const button = event.target.closest('button[data-page]');
    if (!button) return;

    const pageAction = button.dataset.page;

    switch (pageAction) {
      case 'prev':
        if (state.currentPage > 1) {
          state.currentPage--;
          renderAreasList();
        }
        break;

      case 'next':
        const totalPages = Math.ceil(state.areas.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderAreasList();
        }
        break;

      default:
        const pageNum = parseInt(pageAction);
        if (!isNaN(pageNum)) {
          state.currentPage = pageNum;
          renderAreasList();
        }
    }
  }

  // Manejar acciones en la lista
  function handleListAction(event) {
    const editBtn = event.target.closest('[data-action="edit-area"]');
    if (editBtn) {
      event.stopPropagation();
      const area = store.find('areas', editBtn.dataset.id);
      if (area) openModal(area);
      return;
    }

    const toggleBtn = event.target.closest('[data-action="toggle-status"]');
    if (toggleBtn) {
      event.stopPropagation(); // Evitar que el clic llegue a la tarjeta
      const areaId = toggleBtn.dataset.id;
      const area = store.find('areas', areaId);
      if (area) {
        area.isActive = !area.isActive;
        store.update('areas', area.id, area);
        showNotification(`Área ${area.isActive ? 'activada' : 'desactivada'} correctamente`, 'success');
        loadAreas();
      }
      return;
    }

    const card = event.target.closest('.area-card');
    if (card) {
      const areaId = card.dataset.id;
      const action = card.dataset.action;
      const area = store.find('areas', areaId);
      
      if (!area) {
        showNotification('No se pudo encontrar el área', 'error');
        return;
      }
      
      if (action === 'view') {
        viewAreaDetails(area);
      }
    }
  }

  // Abrir modal
  function openModal(area = null) {
    state.editingId = area?.id || null;
    state.showModal = true;

    if (elements.modal) {
      elements.modal.classList.remove('hidden');
    }

    if (area) {
      populateForm(area);
    } else {
      clearForm();
    }
  }

  // Cerrar modal
  function closeModal() {
    state.showModal = false;
    state.editingId = null;

    if (elements.modal) {
      elements.modal.classList.add('hidden');
    }

    clearForm();
  }

  // Lógica Modal Estado
  function openStatusModal(area) {
    state.editingId = area.id;
    if (elements.statusAreaName) elements.statusAreaName.textContent = area.name;

    const badge = root.querySelector('#status-modal-badge');
    const text = root.querySelector('#status-modal-text');
    const subtext = root.querySelector('#status-modal-subtext');

    if (badge) badge.style.background = area.isActive ? 'var(--success)' : 'var(--danger)';
    if (text) text.textContent = area.isActive ? 'ACTIVO' : 'INACTIVO';

    if (subtext) {
      if (area.status === 'maintenance') {
        subtext.innerHTML = '<span class="badge badge-warning">Mantenimiento</span>';
        subtext.classList.remove('hidden');
      } else {
        subtext.innerHTML = '';
        subtext.classList.add('hidden');
      }
    }

    if (elements.statusFormState) elements.statusFormState.value = area.status || (area.isActive ? 'active' : 'inactive');
    if (elements.statusFormReason) elements.statusFormReason.value = area.statusReason || '';
    if (elements.statusModal) elements.statusModal.classList.remove('hidden');
  }

  function closeStatusModal() {
    state.editingId = null;
    if (elements.statusModal) elements.statusModal.classList.add('hidden');
  }

  function saveStatus() {
    const areaId = state.editingId;
    if (!areaId) return;

    const area = store.find('areas', areaId);
    if (!area) return;

    const newStatus = elements.statusFormState.value;
    const reason = elements.statusFormReason.value;

    area.isActive = newStatus === 'active';
    area.status = newStatus;
    area.statusReason = reason;
    area.updatedAt = new Date().toISOString();

    store.update('areas', areaId, area);
    showNotification('Estado del área actualizado correctamente', 'success');
    closeStatusModal();
    loadAreas();
  }

  // Rellenar formulario
  function populateForm(area) {
    if (elements.formName) elements.formName.value = area.name || '';
    if (elements.formCode) elements.formCode.value = area.code || '';
    if (elements.formDescription) elements.formDescription.value = area.description || '';
    if (elements.formSpecialty) elements.formSpecialty.value = area.specialty || '';
    if (elements.formEdificio) elements.formEdificio.value = area.location ? area.location.edificio : '';
    if (elements.formPiso) elements.formPiso.value = area.location ? area.location.piso : '';
    if (elements.formAla) elements.formAla.value = area.location ? area.location.ala : '';
    if (elements.formPhone) elements.formPhone.value = area.phone || '';
    if (elements.formEmail) elements.formEmail.value = area.email || '';
    if (elements.formColor) elements.formColor.value = area.color || '#2196F3';
    if (elements.formColorText) elements.formColorText.value = area.color || '#2196F3';
    if (elements.formType) elements.formType.value = area.type || 'clinical';
    if (elements.formParent) elements.formParent.value = area.parentId || '';
    if (elements.formHeadDoctor) elements.formHeadDoctor.value = area.headDoctorId || '';
    if (elements.formCapacity) elements.formCapacity.value = area.capacity || 1;
    if (elements.formStatus) elements.formStatus.value = area.status || 'active';
    if (elements.formNotes) elements.formNotes.value = area.notes || '';

    if (elements.roomsContainer) {
      elements.roomsContainer.innerHTML = '';
      if (area.rooms && area.rooms.length > 0) {
        area.rooms.forEach(room => {
          const tBeds = room.totalBeds !== undefined ? room.totalBeds : (room.capacity || 0);
          const aBeds = room.availableBeds !== undefined ? room.availableBeds : (room.available || 0);
          renderRoomInForm(room.name, tBeds, aBeds, room.type || 'Individual', room.status || 'disponible', room.medicalSpecialty || 'Medicina General');
        });
      }
    }

    // Cargar especialidades
    if (elements.specialtiesContainer) {
      elements.specialtiesContainer.innerHTML = '';
      const specialties = area.specialties || [];
      specialties.forEach(specialty => {
        addSpecialtyToContainer(specialty);
      });
    }
  }

  // Limpiar formulario
  function clearForm() {
    if (elements.form) elements.form.reset();
    if (elements.specialtiesContainer) {
      elements.specialtiesContainer.innerHTML = '';
    }

    // Restaurar valores por defecto
    if (elements.formColor) elements.formColor.value = '#2196F3';
    if (elements.formColorText) elements.formColorText.value = '#2196F3';
    if (elements.roomsContainer) elements.roomsContainer.innerHTML = '';
  }

  // Agregar especialidad
  function addSpecialty() {
    const specialty = elements.formAddSpecialty.value.trim();
    if (!specialty) return;

    // Verificar que no esté ya agregada
    const existingBadges = elements.specialtiesContainer.querySelectorAll('.badge');
    const alreadyExists = Array.from(existingBadges).some(badge =>
      badge.textContent.replace('×', '').trim() === specialty
    );

    if (alreadyExists) {
      showNotification('Esta especialidad ya ha sido agregada', 'warning');
      elements.formAddSpecialty.value = '';
      return;
    }

    addSpecialtyToContainer(specialty);
    elements.formAddSpecialty.value = '';
  }

  function addSpecialtyToContainer(specialty) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-info';
    badge.style.cssText = 'display: inline-flex; align-items: center; padding-right: 0.25rem;';
    badge.innerHTML = `
      ${specialty}
<button type="button" class="badge-remove" style="margin-left: 0.25rem; background: none; border: none; color: inherit; cursor: pointer; font-size: 1rem; line-height: 1; padding: 0 0.25rem;">
  ×
</button>
`;

    elements.specialtiesContainer.appendChild(badge);

    // Agregar event listener al botón de eliminar
    badge.querySelector('.badge-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      badge.remove();
    });
  }

  function addRoomToForm() {
    const roomName = elements.formRoomName.value.trim();
    const roomBeds = parseInt(elements.formRoomBeds.value);
    const roomAvailable = parseInt(elements.formRoomAvailable.value);
    const roomType = elements.formRoomType.value || 'Individual';
    const roomStatus = elements.formRoomStatus.value || 'disponible';
    const roomSpecialty = elements.formRoomSpecialty.value || 'Medicina General';

    if (!roomName || isNaN(roomBeds) || roomBeds < 1) {
      showNotification('Ingrese datos válidos para la habitación', 'warning');
      return;
    }

    if (roomAvailable > roomBeds) {
      showNotification('La disponibilidad inicial no puede ser mayor al total', 'error');
      return;
    }

    renderRoomInForm(roomName, roomBeds, roomAvailable, roomType, roomStatus, roomSpecialty);

    elements.formRoomName.value = '';
    elements.formRoomBeds.value = '1';
    elements.formRoomAvailable.value = '1';
  }

  function renderRoomInForm(name, beds, available, type = 'Individual', status = 'disponible', specialty = 'Medicina General') {
    const item = document.createElement('div');
    item.className = 'room-form-item';
    item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid var(--modal-border); border-radius: 4px; background-color: var(--white); margin-bottom: 0.25rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02);';
    item.dataset.name = name;
    item.dataset.beds = beds;
    item.dataset.available = available;
    item.dataset.type = type;
    item.dataset.status = status;
    item.dataset.specialty = specialty;
    
    const statusText = status.charAt(0).toUpperCase() + status.slice(1);
    const statusColor = status === 'disponible' ? 'var(--green)' : (status === 'mantenimiento' ? 'var(--yellow)' : 'var(--danger)');
    
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="background: var(--modal-section-green); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: 800;">${type.toUpperCase()}</div>
        <div style="display: flex; flex-direction: column;">
          <span style="font-weight: 700; color: var(--modal-text); font-size: 0.9rem;">Habitación ${name} <span style="font-size: 0.7rem; color: ${statusColor}; font-weight: 800;">(${statusText})</span></span>
          <span style="font-size: 0.75rem; color: var(--modal-text-muted); font-weight: 600; color: var(--accent);">${specialty}</span>
          <span style="font-size: 0.75rem; color: var(--modal-text-muted);">${available} de ${beds} camillas libres</span>
        </div>
      </div>
      <button type="button" class="btn-remove-room" style="background: none; border: none; cursor: pointer; color: var(--danger); opacity: 0.6; padding: 0.4rem; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.opacity='1'; this.style.background='rgba(239, 68, 68, 0.08)'" onmouseout="this.style.opacity='0.6'; this.style.background='none'">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
      </button>
    `;

    item.querySelector('.btn-remove-room').addEventListener('click', (e) => {
      e.stopPropagation();
      item.remove();
    });

    elements.roomsContainer.appendChild(item);
  }

  // Validar formulario
  function validateForm() {
    let isValid = true;

    // Solo validar campos verdaderamente requeridos
    const requiredFields = [
      elements.formName,
      elements.formCode
    ];

    // Limpiar clases de error primero
    requiredFields.forEach(field => {
      if (field) field.classList.remove('error');
    });

    // Validar campos requeridos
    requiredFields.forEach(field => {
      if (field && !field.value.trim()) {
        field.classList.add('error');
        isValid = false;

        // Mostrar mensaje específico
        const fieldName = field.id.replace('form-', '').replace(/([A-Z])/g, ' $1').toLowerCase();
        showNotification(`El campo "${fieldName}" es obligatorio`, 'warning');
      }
    });

    // Validar código (máximo 10 caracteres)
    if (elements.formCode && elements.formCode.value.trim()) {
      const codeValue = elements.formCode.value.trim().toUpperCase();
      if (codeValue.length > 10) {
        elements.formCode.classList.add('error');
        showNotification('El código debe tener máximo 10 caracteres', 'warning');
        isValid = false;
      }
    }

    // Validar email si se proporciona
    if (elements.formEmail && elements.formEmail.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(elements.formEmail.value.trim())) {
        elements.formEmail.classList.add('error');
        showNotification('Por favor, ingrese un email válido', 'warning');
        isValid = false;
      }
    }

    // Validar capacidad
    if (elements.formCapacity) {
      const capacity = parseInt(elements.formCapacity.value);
      if (isNaN(capacity) || capacity < 1 || capacity > 50) {
        elements.formCapacity.classList.add('error');
        showNotification('La capacidad debe ser un número entre 1 y 50', 'warning');
        isValid = false;
      }
    }

    // Validar que no sea su propio padre
    if (elements.formParent && state.editingId) {
      if (elements.formParent.value === state.editingId) {
        elements.formParent.classList.add('error');
        showNotification('Un área no puede ser padre de sí misma', 'warning');
        isValid = false;
      }
    }

    return isValid;
  }

  // Obtener datos del formulario
  function getFormData() {
    // Obtener especialidades
    const specialties = Array.from(elements.specialtiesContainer.querySelectorAll('.badge'))
      .map(badge => badge.textContent.replace('×', '').trim());

    return {
      name: elements.formName.value.trim(),
      code: elements.formCode ? elements.formCode.value.trim().toUpperCase() : '',
      description: elements.formDescription ? elements.formDescription.value.trim() : null,
      specialty: elements.formSpecialty ? elements.formSpecialty.value.trim() : null,
      location: {
        edificio: elements.formEdificio ? elements.formEdificio.value.trim() : '',
        piso: elements.formPiso ? elements.formPiso.value.trim() : '',
        ala: elements.formAla ? elements.formAla.value.trim() : ''
      },
      phone: elements.formPhone ? elements.formPhone.value.trim() : null,
      email: elements.formEmail ? elements.formEmail.value.trim() : null,
      color: elements.formColor.value,
      type: elements.formType.value,
      parentId: elements.formParent.value || null,
      headDoctorId: elements.formHeadDoctor.value || null,
      specialties: specialties.length > 0 ? specialties : null,
      status: elements.formStatus ? elements.formStatus.value : 'active',
      isActive: elements.formStatus ? elements.formStatus.value === 'active' : true,
      notes: elements.formNotes ? elements.formNotes.value.trim() : null,
      rooms: Array.from(elements.roomsContainer.querySelectorAll('.room-form-item')).map((item, index) => {
        const beds = parseInt(item.dataset.beds);
        const available = parseInt(item.dataset.available);
        return {
          id: state.editingId && store.find('areas', state.editingId)?.rooms?.[index]?.id || `h_${Date.now()}_${index}`,
          name: item.dataset.name,
          type: item.dataset.type || 'Individual',
          totalBeds: beds,
          availableBeds: available,
          status: item.dataset.status || (available === 0 ? 'ocupada' : 'disponible'),
          medicalSpecialty: item.dataset.specialty || 'Medicina General'
        };
      })
    };
  }

  // Guardar área
  async function saveArea() {
    // Validar permisos: solo admin
    if (role !== 'admin') {
      showNotification('No tiene permisos para gestionar áreas', 'error');
      return;
    }

    if (!validateForm()) {
      return;
    }

    state.isLoading = true;
    if (elements.btnSave) {
      elements.btnSave.disabled = true;
      elements.btnSave.textContent = 'Guardando...';
    }

    try {
      const formData = getFormData();

      if (state.editingId) {
        // Actualizar área existente
        await updateArea(state.editingId, formData);
        showNotification('Área actualizada correctamente', 'success');
      } else {
        // Crear nueva área
        await createArea(formData);
        showNotification('Área creada correctamente', 'success');
      }

      // Auditoría de área
      if (window.Logger && window.Logger.log) {
        const actionText = state.editingId ? 'actualizó' : 'registró';
        window.Logger.log(store, user, {
          action: 'UPDATE',
          module: 'RESOURCES',
          detail: `Infraestructura: ${user?.name || 'Administrador'} ${actionText} el área ${formData.name}`
        });
      }

      closeModal();
      loadAreas();

    } catch (error) {
      console.error('Error guardando área:', error);
      showNotification('Error al guardar el área', 'error');
    } finally {
      state.isLoading = false;
      if (elements.btnSave) {
        elements.btnSave.disabled = false;
        elements.btnSave.textContent = state.editingId ? 'ACTUALIZAR ÁREA' : 'CONFIRMAR ÁREA';
      }
    }
  }

  // Crear nueva área
  async function createArea(data) {
    return store.add('areas', data);
  }

  // Actualizar área existente
  async function updateArea(id, data) {
    return store.update('areas', id, data);
  }

  // Ver área — Modal de Infraestructura
  function viewAreaDetails(area) {
    if (!area) return;

    state.currentAreaId = area.id;

    const detailModal = root.querySelector('#detail-modal');
    const detailAreaName = root.querySelector('#detail-area-name');
    const detailAreaLocation = root.querySelector('#detail-area-location');
    const roomEditPanel = root.querySelector('#room-edit-panel');

    if (detailAreaName) detailAreaName.textContent = area.name;
    if (detailAreaLocation) {
       detailAreaLocation.textContent = area.location ? `Edificio ${area.location.edificio}, Piso ${area.location.piso}, Ala ${area.location.ala}` : 'Ubicación no asignada';
    }

    if (detailModal) detailModal.classList.remove('hidden');
    if (roomEditPanel) roomEditPanel.style.display = 'none';

    renderRoomsList(area);

    // Setup close
    const btnClose = root.querySelector('#btn-close-detail');
    if (btnClose) {
      btnClose.onclick = () => {
        detailModal.classList.add('hidden');
      };
    }
    
    // Setup form submit
    const roomForm = root.querySelector('#room-form');
    if (roomForm) {
      roomForm.onsubmit = (e) => {
        e.preventDefault();
        saveRoom();
      };
    }
  }

  function renderRoomsList(area) {
    const roomsGrid = root.querySelector('#rooms-grid');
    if (!roomsGrid) return;
    
    const isAreaActive = area.isActive;
    
    // Setup add room detail button
    const btnAddRoomDetail = root.querySelector('#btn-add-room-detail');
    if (btnAddRoomDetail && isAreaActive) {
      btnAddRoomDetail.style.display = 'block';
      btnAddRoomDetail.onclick = () => {
         openRoomEdit(area.id, null, true);
      };
    } else if (btnAddRoomDetail) {
      btnAddRoomDetail.style.display = 'none';
    }

    if (!area.rooms || area.rooms.length === 0) {
      roomsGrid.innerHTML = '<div style="color: var(--modal-text-muted); font-style: italic;">No hay habitaciones registradas en esta área.</div>';
      return;
    }

    const roomsHtml = area.rooms.map(room => {
      const availBeds = room.availableBeds !== undefined ? room.availableBeds : (room.available || 0);
      const totBeds = room.totalBeds !== undefined ? room.totalBeds : (room.capacity || 1);
      const percentFree = (availBeds / totBeds) * 100;
      
      let statusColor = 'var(--triaje-green)';
      let statusText = 'Disponible';
      
      if (room.status === 'mantenimiento') {
        statusColor = 'var(--neutralTertiary)';
        statusText = 'Mantenimiento';
      } else if (availBeds === 0) {
        statusColor = 'var(--triaje-red)';
        statusText = 'Lleno';
      } else if (availBeds < totBeds) {
        statusColor = 'var(--triaje-yellow)';
        statusText = 'Parcial';
      }

      if (!isAreaActive) {
        statusColor = 'var(--neutralTertiary)';
        statusText = 'Inactivo';
      }
      
      const pointerEvent = !isAreaActive ? 'pointer-events: none;' : 'cursor: pointer;';
      
      return `
        <div class="room-cell" data-room-id="${room.id}" data-area-id="${area.id}" style="${pointerEvent}">
          <div class="room-status-indicator" style="background: ${statusColor};"></div>
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="background: var(--modal-section-green-light); color: var(--modal-section-green); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;">
              ${room.type || 'INDIVIDUAL'}
            </div>
            <div style="font-size: 0.7rem; font-weight: 700; color: ${statusColor}; text-transform: uppercase;">
              ${statusText}
            </div>
          </div>

          <div style="margin-top: 0.5rem;">
            <div style="font-weight: 800; color: var(--modal-text); font-size: 1.1rem;">Hab. ${room.name}</div>
            <div style="font-size: 0.75rem; color: var(--accent); font-weight: 700; margin-top: 0.1rem;">${room.medicalSpecialty || 'Medicina General'}</div>
          </div>

          <div style="margin-top: auto; padding-top: 0.75rem; border-top: 1px dashed var(--modal-border);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: var(--modal-text-muted); font-weight: 600;">DISPONIBILIDAD</span>
              <span style="font-weight: 800; color: var(--modal-text); font-size: 0.9rem;">${availBeds} / ${totBeds}</span>
            </div>
            <div class="progress-bar" style="height: 6px; margin-top: 0.5rem; background: var(--neutralLighter); border-radius: 3px; overflow: hidden;">
              <div class="progress-fill" style="width: ${(availBeds / totBeds) * 100}%; background: ${statusColor}; height: 100%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    roomsGrid.className = 'room-grid';
    roomsGrid.innerHTML = roomsHtml;

    // Agregar eventos a las tarjetas de habitación
    if (isAreaActive) {
      const roomCards = roomsGrid.querySelectorAll('.room-cell');
      roomCards.forEach(card => {
        card.addEventListener('click', () => {
          openRoomEdit(card.dataset.areaId, card.dataset.roomId);
        });
      });
    }
  }

  function openRoomEdit(areaId, roomId, isNew = false) {
    const area = store.find('areas', areaId);
    if (!area) return;
    
    let room = null;
    if (!isNew) {
      if (!area.rooms) return;
      room = area.rooms.find(r => r.id === roomId);
      if (!room) return;
    }

    const roomEditPanel = root.querySelector('#room-edit-panel');
    const editRoomName = root.querySelector('#edit-room-name');
    const roomIdInput = root.querySelector('#room-id');
    const roomCapacity = root.querySelector('#room-capacity');
    const roomAvailable = root.querySelector('#room-available');
    const roomTypeInput = root.querySelector('#room-type-input');
    const roomSpecialtyInput = root.querySelector('#room-specialty-input');
    const roomStatusInput = root.querySelector('#room-status-input');
    const isNewRoomInput = root.querySelector('#is-new-room');
    const formGroupRoomName = root.querySelector('#form-group-room-name');
    const roomNameInput = root.querySelector('#room-name-input');
    const formGroupRoomAvailable = root.querySelector('#form-group-room-available');
    const formGroupRoomStatus = root.querySelector('#form-group-room-status');
    const btnSaveRoom = root.querySelector('#btn-save-room');

    if (roomEditPanel) roomEditPanel.style.display = 'block';

    if (isNew) {
       if (editRoomName) editRoomName.textContent = `Añadir Nueva Habitación`;
       if (isNewRoomInput) isNewRoomInput.value = "true";
       if (roomIdInput) roomIdInput.value = "";
       if (formGroupRoomName) formGroupRoomName.style.display = 'block';
       if (roomNameInput) roomNameInput.value = "";
       if (roomCapacity) {
          roomCapacity.value = 1;
          roomCapacity.readOnly = false;
       }
       if (formGroupRoomAvailable) formGroupRoomAvailable.style.display = 'block';
       if (roomAvailable) roomAvailable.value = 1;
       if (roomTypeInput) roomTypeInput.value = "Individual";
       if (roomSpecialtyInput) roomSpecialtyInput.value = "Medicina General";
       if (roomStatusInput) roomStatusInput.value = "disponible";
       if (formGroupRoomStatus) formGroupRoomStatus.style.display = 'block';
       if (btnSaveRoom) btnSaveRoom.textContent = "Crear Habitación";
    } else {
       if (editRoomName) editRoomName.textContent = `Editar Hab. ${room.name}`;
       if (isNewRoomInput) isNewRoomInput.value = "false";
       if (roomIdInput) roomIdInput.value = room.id;
       if (formGroupRoomName) formGroupRoomName.style.display = 'none';
       if (roomCapacity) {
          roomCapacity.value = room.totalBeds !== undefined ? room.totalBeds : (room.capacity || 0);
          roomCapacity.readOnly = true;
       }
       if (roomTypeInput) roomTypeInput.value = room.type || "Individual";
       if (roomSpecialtyInput) roomSpecialtyInput.value = room.medicalSpecialty || "Medicina General";
       if (roomStatusInput) roomStatusInput.value = room.status || "disponible";
       if (formGroupRoomAvailable) formGroupRoomAvailable.style.display = 'block';
       if (formGroupRoomStatus) formGroupRoomStatus.style.display = 'block';
       if (roomAvailable) roomAvailable.value = room.availableBeds !== undefined ? room.availableBeds : (room.available || 0);
       if (btnSaveRoom) btnSaveRoom.textContent = "Actualizar Habitación";
    }

    const roomBedsError = root.querySelector('#room-beds-error');

    window.validateRoomBeds = function() {
      const tot = parseInt(roomCapacity.value) || 0;
      const av = parseInt(roomAvailable.value) || 0;
      if (!isNew && av > tot) {
         if (roomBedsError) roomBedsError.classList.remove('hidden');
         if (btnSaveRoom) btnSaveRoom.disabled = true;
         if (roomAvailable) roomAvailable.classList.add('error');
      } else {
         if (roomBedsError) roomBedsError.classList.add('hidden');
         if (btnSaveRoom) btnSaveRoom.disabled = false;
         if (roomAvailable) roomAvailable.classList.remove('error');
      }
    };
    if (window.validateRoomBeds) window.validateRoomBeds();
  }

  function updateRoomStatus(areaId, roomId, totalBeds, availableBeds, roomName = null, isNew = false, roomType = 'Individual', roomStatus = 'disponible', roomSpecialty = 'Medicina General') {
    const area = store.find('areas', areaId);
    if (!area) return null;

    if (!area.rooms) area.rooms = [];

    let oldBeds = totalBeds;
    let room = null;

    if (isNew) {
      room = {
        id: `h_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: roomName || `Nueva Hab`,
        type: roomType,
        medicalSpecialty: roomSpecialty,
        totalBeds: totalBeds,
        availableBeds: totalBeds,
        status: roomStatus
      };
      area.rooms.push(room);
    } else {
      const roomIndex = area.rooms.findIndex(r => r.id === roomId);
      if (roomIndex === -1) return null;

      oldBeds = area.rooms[roomIndex].totalBeds !== undefined ? area.rooms[roomIndex].totalBeds : area.rooms[roomIndex].capacity;

      area.rooms[roomIndex].type = roomType;
      area.rooms[roomIndex].medicalSpecialty = roomSpecialty;
      area.rooms[roomIndex].totalBeds = totalBeds;
      area.rooms[roomIndex].availableBeds = availableBeds;
      area.rooms[roomIndex].status = roomStatus;
      room = area.rooms[roomIndex];
    }

    return { area, room, oldBeds };
  }

  function saveRoom() {
    const areaId = state.currentAreaId;
    const isNewRoomInput = root.querySelector('#is-new-room');
    const roomIdInput = root.querySelector('#room-id');
    const roomNameInput = root.querySelector('#room-name-input');
    const roomCapacityInput = root.querySelector('#room-capacity');
    const roomAvailableInput = root.querySelector('#room-available');

    const roomTypeInput = root.querySelector('#room-type-input');
    const roomSpecialtyInput = root.querySelector('#room-specialty-input');

    if (!roomCapacityInput || !roomAvailableInput) return;

    const isNew = isNewRoomInput && isNewRoomInput.value === "true";
    const roomId = roomIdInput ? roomIdInput.value : '';
    const roomName = roomNameInput ? roomNameInput.value.trim() : '';
    const roomType = roomTypeInput ? roomTypeInput.value : 'Individual';
    const roomSpecialty = roomSpecialtyInput ? roomSpecialtyInput.value : 'Medicina General';
    
    const totalBeds = parseInt(roomCapacityInput.value) || 0;
    const roomStatusInput = root.querySelector('#room-status-input');
    const availableBeds = isNew ? totalBeds : (parseInt(roomAvailableInput.value) || 0);
    const roomStatus = roomStatusInput ? roomStatusInput.value : (availableBeds === 0 ? 'ocupada' : 'disponible');

    if (isNew && !roomName) {
      showNotification("Error: Especifique un nombre de habitación", "error");
      return;
    }

    if (!isNew && availableBeds > totalBeds) {
      showNotification("Error: Las camillas disponibles no pueden superar el total", "error");
      return;
    }

    const result = updateRoomStatus(areaId, roomId, totalBeds, availableBeds, roomName, isNew, roomType, roomStatus, roomSpecialty);
    if (!result) return;
    
    const { area, room, oldBeds } = result;

    // Guardar en store
    store.update('areas', areaId, area);

    // Logging trace CRITICO
    if (window.Logger && window.Logger.log) {
      const roomStatus = room.availableBeds === 0 ? 'Lleno' : 'Disponible';
      const logMsg = isNew ? 
        `Infraestructura: ${user?.name || 'Administrador'} creó la Habitación ${room.name} en el Área ${area.name} con ${totalBeds} camillas` :
        `Infraestructura: ${user?.name || 'Administrador'} actualizó capacidad en ${room.name} - Estado: ${roomStatus}`;

      window.Logger.log(store, user, { 
        action: window.Logger.Actions?.UPDATE || 'UPDATE', 
        module: 'RESOURCES', 
        detail: logMsg
      });
    }

    if (!isNew && availableBeds === 0) {
      showNotification(`Atención: La habitación ${room.name} se ha bloqueado por falta de camillas`, 'warning');
    } else {
      showNotification(isNew ? 'Habitación creada correctamente' : 'Capacidad actualizada correctamente', 'success');
    }
    
    // Ocultar formulario de edición
    const roomEditPanel = root.querySelector('#room-edit-panel');
    if (roomEditPanel) roomEditPanel.style.display = 'none';

    // Actualizar UI
    renderRoomsList(area);
    loadAreas(); // Para actualizar la tarjeta principal
  }

  // Editar área
  function editArea(area) {
    openModal(area);
  }

  // Mostrar notificación
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? 'var(--success)' :
        type === 'error' ? 'var(--danger)' :
          type === 'warning' ? 'var(--warning)' : 'var(--info)'
      };
      color: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Inicializar módulo
  const unsubscribe = init();

  // Retornar API pública
  return {
    refresh: loadAreas,

    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}
