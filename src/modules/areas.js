/**
 * Módulo de Áreas/Servicios - Gestión completa
 */

export default function mountAreas(root, { bus, store, user, role }) {
  const state = {
    areas: [],
    filters: {
      search: '',
      status: 'active',
      parentId: ''
    },
    editingId: null,
    isLoading: false,
    showModal: false,
    currentPage: 1,
    itemsPerPage: 10,
    viewMode: 'grid' // grid o list
  };

  let elements = {};

  // Inicializar
  function init() {
    render();
    setupEventListeners();
    loadAreas();

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
    renderAreasGrid();
    updateStats();
    loadSelectData();
  }

  // Aplicar filtros
  function applyFilters(areas) {
    return areas.filter(area => {
      // Filtro de búsqueda
      if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        const searchFields = [
          area.name,
          area.code,
          area.description,
          area.location
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }

      // Filtro por estado
      if (state.filters.status) {
        if (state.filters.status === 'active' && !area.isActive) {
          return false;
        }
        if (state.filters.status === 'inactive' && area.isActive !== false) {
          return false;
        }
      }

      // Filtro por área padre
      if (state.filters.parentId === 'main') {
        if (area.parentId) return false;
      } else if (state.filters.parentId === 'sub') {
        if (!area.parentId) return false;
      } else if (state.filters.parentId) {
        if (area.parentId !== state.filters.parentId) return false;
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
      <div class="module-areas animated-fade-in" style="max-width: 1400px; margin: 0 auto; padding: 1rem;">
        <!-- Header -->
        <div class="card" style="margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h2 style="margin: 0;">Áreas Médicas</h2>
              <p style="color: var(--muted); margin: 0;">Gestión de departamentos y servicios del hospital</p>
            </div>
            <div style="display: flex; gap: 1rem;">
              ${canManage ? `
                <button class="btn btn-primary" id="btn-new-area">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.5rem;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> NUEVA ÁREA
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-4" id="stats-container" style="gap: 1.5rem; margin-bottom: 2rem;">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Vista de tarjetas con scroll horizontal -->
        <div class="card" id="grid-view-section">
          <div class="card-header">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <h3 style="margin: 0;">Departamentos</h3>
                <div class="text-muted" id="areas-view-count">Cargando...</div>
              </div>
              <div class="flex items-center gap-2">
                <button class="btn btn-outline btn-sm" id="btn-toggle-view">
                  <span id="view-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg></span> Ver lista
                </button>
              </div>
            </div>
          </div>
          
          <div class="areas-grid-container" style="overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: thin; padding-bottom: 0.5rem;">
            <div class="areas-grid" id="areas-grid" style="display: flex; gap: 1rem; min-width: min-content;">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>
          
          <div id="empty-grid" class="hidden">
            <div class="text-center" style="padding: 2rem;">
              <div style="margin-bottom: 1rem; opacity: 0.3;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg></div>
              <h3>No hay áreas</h3>
              <p class="text-muted">No se encontraron áreas con los filtros aplicados</p>
            </div>
          </div>
        </div>

        <!-- Vista de lista con filtros -->
        <div class="card" id="list-view-section" style="display: none;">
          <div class="card-header">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <h3 style="margin: 0;">Lista de Áreas</h3>
                <div class="text-muted" id="list-view-count"></div>
              </div>
              <button class="btn btn-outline btn-sm" id="btn-toggle-view-list">
                <span id="view-icon-list"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/></svg></span> Ver tarjetas
              </button>
            </div>
          </div>
          
          <!-- Filtros (solo visibles en vista de lista) -->
          <div class="p-4 border-b">
            <div class="grid" style="grid-template-columns: 1.5fr 1fr 1fr 1fr; gap: 1rem;">
              <div class="form-group">
                <label class="form-label">Buscar</label>
                <input type="text" class="input" id="filter-search" 
                       placeholder="Nombre, código, ubicación...">
              </div>
              
              <div class="form-group">
                <label class="form-label">Estado</label>
                <select class="input" id="filter-status">
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                  <option value="">Todas</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Tipo</label>
                <select class="input" id="filter-parent">
                  <option value="">Todas</option>
                  <option value="main">Áreas principales</option>
                  <option value="sub">Sub-áreas</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Área padre</label>
                <select class="input" id="filter-parent-area">
                  <option value="">Todas las áreas</option>
                </select>
              </div>
            </div>
            
            <div class="flex justify-end gap-2 mt-3">
              <button class="btn btn-outline" id="btn-clear-filters">
                Limpiar filtros
              </button>
              <button class="btn btn-primary" id="btn-apply-filters">
                Aplicar filtros
              </button>
            </div>
          </div>
          
          <!-- Lista de áreas -->
          <div class="table-responsive" id="list-view-container">
            <table class="table" id="areas-table">
              <thead>
                <tr>
                  <th>Área</th>
                  <th>Código</th>
                  <th>Ubicación</th>
                  <th>Médicos</th>
                  <th>Citas (mes)</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="areas-list">
                <!-- Se llenará dinámicamente -->
              </tbody>
            </table>
          </div>
          
          <!-- Paginación -->
          <div id="pagination" class="flex justify-between items-center mt-3">
            <!-- Se llenará dinámicamente -->
          </div>
          
          <div id="empty-state" class="hidden">
            <div class="text-center" style="padding: 3rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">🏥</div>
              <h3>No hay áreas</h3>
              <p class="text-muted">No se encontraron áreas con los filtros aplicados</p>
              ${canManage ? `
                <button class="btn btn-primary mt-3" id="btn-create-first">
                  Crear primera área
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para nueva/editar área -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="area-modal">
        <div class="modal-content" style="max-width: 800px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              ${state.editingId ? 'EDICIÓN DE ÁREA / SERVICIO' : 'CONFIGURACIÓN DE NUEVA ÁREA'}
            </div>
            <button class="btn-close-modal" id="btn-close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 65vh; overflow-y: auto;">
            <form id="area-form">
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                🏢 INFORMACIÓN GENERAL DEL ÁREA
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOMBRE DEL ÁREA *</label>
                  <input type="text" class="input" id="form-name" 
                         required placeholder="Ej: Pediatría, Urgencias, Laboratorio..." style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CÓDIGO INTERNO *</label>
                  <input type="text" class="input" id="form-code" 
                         required placeholder="Ej: PED, URG, LAB" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DESCRIPCIÓN DEL SERVICIO</label>
                <textarea class="input" id="form-description" rows="2"
                          placeholder="Breve descripción..." style="border-color: var(--modal-border); background: var(--modal-bg);"></textarea>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">UBICACIÓN FÍSICA</label>
                  <input type="text" class="input" id="form-location" 
                         placeholder="Ej: Piso 3, Ala Norte..." style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">TELÉFONO DE CONTACTO</label>
                  <input type="tel" class="input" id="form-phone" 
                         placeholder="Ej: 600123456" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
              </div>
              
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                ⚙️ CONFIGURACIÓN TÉCNICA
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">TIPO DE ÁREA</label>
                  <select class="input" id="form-type" style="border-color: var(--modal-border); background: var(--modal-bg);">
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
                           style="width: 50px; height: 38px; padding: 2px; border-color: var(--modal-border);">
                    <input type="text" class="input" id="form-color-text" 
                           placeholder="#2196F3" style="flex: 1; border-color: var(--modal-border); background: var(--modal-bg);">
                  </div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ÁREA PADRE (SI APLICA)</label>
                  <select class="input" id="form-parent" style="border-color: var(--modal-border); background: var(--modal-bg);">
                    <option value="">Área principal (sin padre)</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MÉDICO RESPONSABLE</label>
                  <select class="input" id="form-head-doctor" style="border-color: var(--modal-border); background: var(--modal-bg);">
                    <option value="">Sin asignar</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CAPACIDAD (CONSULTORIOS)</label>
                <input type="number" class="input" id="form-capacity" min="1" max="50" value="1" style="border-color: var(--modal-border); background: var(--modal-bg);">
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESPECIALIDADES</label>
                <div class="flex gap-2">
                  <input type="text" class="input" id="form-add-specialty" 
                         placeholder="Ej: Cardiología, Neurología..." style="flex: 1; border-color: var(--modal-border); background: var(--modal-bg);">
                  <button type="button" class="btn btn-outline" id="btn-add-specialty" style="white-space: nowrap;">Agregar</button>
                </div>
                <div id="specialties-container" class="flex flex-wrap gap-1 mt-2">
                  <!-- Se llenará dinámicamente -->
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">EMAIL DE CONTACTO</label>
                <input type="email" class="input" id="form-email" 
                       placeholder="Ej: area@hospital.com" style="border-color: var(--modal-border); background: var(--modal-bg);">
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
                          placeholder="Observaciones importantes..." style="border-color: var(--modal-border); background: var(--modal-bg);"></textarea>
              </div>
            </form>
          </div>
          
          <div class="modal-footer" style="background: var(--modal-header); padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
            <button class="btn" id="btn-cancel" style="background: var(--danger); color: #fff; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
            <button class="btn" id="btn-save" style="background: var(--success); color: white; border: none; padding: 0.75rem 2rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" ${state.isLoading ? 'disabled' : ''}>
              ${state.isLoading ? 'GUARDANDO...' : (state.editingId ? 'ACTUALIZAR ÁREA' : 'CONFIRMAR ÁREA')}
            </button>
          </div>
        </div>
      </div>
    `;

    // Guardar referencias a elementos
    elements = {
      statsContainer: root.querySelector('#stats-container'),
      areasGrid: root.querySelector('#areas-grid'),
      areasGridContainer: root.querySelector('.areas-grid-container'),
      areasViewCount: root.querySelector('#areas-view-count'),
      listViewCount: root.querySelector('#list-view-count'),
      emptyGrid: root.querySelector('#empty-grid'),
      areasList: root.querySelector('#areas-list'),
      areasTable: root.querySelector('#areas-table'),
      listViewContainer: root.querySelector('#list-view-container'),
      pagination: root.querySelector('#pagination'),
      emptyState: root.querySelector('#empty-state'),

      // Secciones de vista
      gridViewSection: root.querySelector('#grid-view-section'),
      listViewSection: root.querySelector('#list-view-section'),
      btnToggleView: root.querySelector('#btn-toggle-view'),
      btnToggleViewList: root.querySelector('#btn-toggle-view-list'),
      viewIcon: root.querySelector('#view-icon'),
      viewIconList: root.querySelector('#view-icon-list'),

      // Filtros
      filterSearch: root.querySelector('#filter-search'),
      filterStatus: root.querySelector('#filter-status'),
      filterParent: root.querySelector('#filter-parent'),
      filterParentArea: root.querySelector('#filter-parent-area'),
      btnClearFilters: root.querySelector('#btn-clear-filters'),
      btnApplyFilters: root.querySelector('#btn-apply-filters'),

      // Modal
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
      formCapacity: root.querySelector('#form-capacity'),
      formAddSpecialty: root.querySelector('#form-add-specialty'),
      btnAddSpecialty: root.querySelector('#btn-add-specialty'),
      specialtiesContainer: root.querySelector('#specialties-container'),
      formStatus: root.querySelector('#form-status'),
      formNotes: root.querySelector('#form-notes'),
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewArea: root.querySelector('#btn-new-area'),
      btnCreateFirst: root.querySelector('#btn-create-first')
    };

    // Configurar vista inicial
    if (state.viewMode === 'list') {
      elements.gridViewSection.style.display = 'none';
      elements.listViewSection.style.display = 'block';
    } else {
      elements.gridViewSection.style.display = 'block';
      elements.listViewSection.style.display = 'none';
    }

    // Cargar datos iniciales
    loadSelectData();
    loadAreas();
  }

  // Cargar datos en selects
  function loadSelectData() {
    const areas = store.get('areas') || [];

    // Áreas padre para filtros
    if (elements.filterParentArea) {
      const options = areas
        .filter(a => !a.parentId) // Solo áreas principales
        .map(a => `<option value="${a.id}">${a.name}</option>`)
        .join('');
      elements.filterParentArea.innerHTML = `<option value="">Todas las áreas</option>${options}`;
    }

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
  }

  // Renderizar tarjetas de áreas
  function renderAreasGrid() {
    if (!elements.areasGrid) return;

    const areas = state.areas.filter(area => !area.parentId); // Solo áreas principales en grid

    if (areas.length === 0) {
      elements.emptyGrid.classList.remove('hidden');
      elements.areasGridContainer.style.display = 'none';
      elements.areasViewCount.textContent = '0 áreas';
      return;
    }

    elements.emptyGrid.classList.add('hidden');
    elements.areasGridContainer.style.display = 'block';
    elements.areasViewCount.textContent = `${areas.length} ${areas.length === 1 ? 'departamento' : 'departamentos'}`;

    const cards = areas.map(area => {
      const stats = getAreaStats(area.id);
      const subAreas = state.areas.filter(a => a.parentId === area.id);

      return `
        <div class="card" style="flex: 0 0 300px; border-left: 4px solid ${area.color || '#2196F3'}; margin: 0;">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="width: 48px; height: 48px; background: ${area.color || '#2196F3'}; 
                       border-radius: 8px; display: flex; align-items: center; justify-content: center; 
                       color: white; font-size: 1.25rem; font-weight: bold;">
              ${area.code ? area.code.charAt(0) : area.name.charAt(0)}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 600; font-size: 1.125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${area.name}">${area.name}</div>
              <div style="color: var(--muted); font-size: 0.875rem; font-family: monospace;">${area.code || 'Sin código'}</div>
            </div>
          </div>
          
          <p style="color: var(--muted); font-size: 0.875rem; margin-bottom: 1.25rem; min-height: 40px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
            ${area.description || 'Sin descripción disponible para este departamento médico.'}
          </p>
          
          ${area.location ? `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem;">
              <span style="opacity: 0.6;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
              <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${area.location}</span>
            </div>
          ` : ''}
          
          ${area.phone ? `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem;">
              <span style="opacity: 0.6;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span>
              <span>${area.phone}</span>
            </div>
          ` : ''}
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: var(--bg-light); padding: 0.75rem; border-radius: var(--radius); margin-bottom: 1rem;">
            <div style="text-align: center;">
              <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 600;">Médicos</div>
              <div style="font-weight: 700; font-size: 1.15rem; color: var(--accent);">${stats.doctors}</div>
            </div>
            <div style="text-align: center; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
              <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 600;">Citas Hoy</div>
              <div style="font-weight: 700; font-size: 1.15rem; color: var(--accent-2);">${stats.todayAppointments}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 600;">Subs</div>
              <div style="font-weight: 700; font-size: 1.15rem; color: var(--info);">${subAreas.length}</div>
            </div>
          </div>
          
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline btn-sm" style="flex: 1;" data-action="view" data-id="${area.id}">
              Ver detalles
            </button>
            ${role === 'admin' ? `
              <button class="btn btn-outline btn-sm" data-action="edit" data-id="${area.id}">
                Editar
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    elements.areasGrid.innerHTML = cards;
  }

  // Renderizar lista de áreas
  function renderAreasList() {
    if (!elements.areasList) return;

    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedAreas = state.areas.slice(startIndex, endIndex);

    if (paginatedAreas.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.areasTable.classList.add('hidden');
      elements.pagination.classList.add('hidden');
      elements.listViewCount.textContent = '0 áreas';
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.areasTable.classList.remove('hidden');
    elements.pagination.classList.remove('hidden');
    elements.listViewCount.textContent = `${state.areas.length} ${state.areas.length === 1 ? 'área' : 'áreas'}`;

    const rows = paginatedAreas.map(area => {
      const stats = getAreaStats(area.id);
      const parentName = getParentAreaName(area.parentId);
      const canEdit = role === 'admin';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 32px; height: 32px; background: ${area.color || '#2196F3'}; 
                       border-radius: 6px; display: flex; align-items: center; justify-content: center; 
                       color: white; font-weight: bold; font-size: 0.875rem;">
                ${area.code ? area.code.charAt(0) : area.name.charAt(0)}
              </div>
              <div>
                <div style="font-weight: 500;">${area.name}</div>
                <div class="text-xs text-muted">${area.code || 'Sin código'}</div>
              </div>
            </div>
          </td>
          <td>${area.code || '-'}</td>
          <td>
            <div>${area.location || 'No especificada'}</div>
            <div class="text-xs text-muted">${area.phone || 'Sin teléfono'}</div>
          </td>
          <td>
            <div class="text-center">
              <div style="font-weight: bold; color: ${stats.totalDoctors > 0 ? 'var(--accent)' : 'var(--muted)'}">
                ${stats.totalDoctors}
              </div>
            </div>
          </td>
          <td>
            <div class="text-center">
              <div style="font-weight: bold; color: ${stats.monthAppointments > 0 ? 'var(--accent-2)' : 'var(--muted)'}">
                ${stats.monthAppointments}
              </div>
            </div>
          </td>
          <td>
            ${parentName ? `
              <div>
                <div class="text-xs text-muted">Sub-área de:</div>
                <div class="text-sm">${parentName}</div>
              </div>
            ` : '<span class="badge badge-info">Principal</span>'}
          </td>
          <td>
            <span class="badge ${area.isActive ? 'badge-success' : 'badge-danger'}">
              ${area.isActive ? 'Activa' : 'Inactiva'}
              ${area.status === 'maintenance' ? ' (Mantenimiento)' : ''}
            </span>
          </td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" data-action="view" data-id="${area.id}">
                Ver
              </button>
              
              ${canEdit ? `
                <button class="btn btn-outline btn-sm" data-action="edit" data-id="${area.id}">
                  Editar
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
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

    const stats = {
      total: areas.length,
      active: areas.filter(a => a.isActive).length,
      mainAreas: areas.filter(a => !a.parentId).length,
      subAreas: areas.filter(a => a.parentId).length,
      totalDoctors: doctors.length,
      areaAssignments: doctors.filter(d => d.areaId).length +
        doctors.reduce((sum, d) => sum + (d.otherAreas ? d.otherAreas.length : 0), 0)
    };

    elements.statsContainer.innerHTML = `
      <div class="stats-card" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 8px solid var(--triage-red);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="color: #64748b; font-size: 0.875rem; font-weight: 600; text-transform: uppercase;">Total Áreas</div>
            <div style="font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0.25rem 0;">${stats.total}</div>
          </div>
          <div style="background: transparent; padding: 0.5rem; border-radius: 8px; color: var(--triage-red);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>
          </div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--muted);">${stats.mainAreas} principales, ${stats.subAreas} sub-áreas</div>
      </div>
      
      <div class="stats-card" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 8px solid var(--triage-green);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="color: #64748b; font-size: 0.875rem; font-weight: 600; text-transform: uppercase;">Áreas Activas</div>
            <div style="font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0.25rem 0;">${stats.active}</div>
          </div>
          <div style="background: transparent; padding: 0.5rem; border-radius: 8px; color: var(--triage-green);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--muted); font-weight: 600;">${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% en funcionamiento</div>
      </div>
      
      <div class="stats-card" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 8px solid var(--triage-yellow);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="color: #64748b; font-size: 0.875rem; font-weight: 600; text-transform: uppercase;">Médicos</div>
            <div style="font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0.25rem 0;">${stats.areaAssignments}</div>
          </div>
          <div style="background: transparent; padding: 0.5rem; border-radius: 8px; color: var(--triage-yellow);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--muted);">Asignados a departamentos</div>
      </div>
      
      <div class="stats-card" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 8px solid var(--triage-blue);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="color: #64748b; font-size: 0.875rem; font-weight: 600; text-transform: uppercase;">Citas Hoy</div>
            <div style="font-size: 2rem; font-weight: 800; color: #1e293b; margin: 0.25rem 0;">${appointments.filter(a => {
      const d = new Date(a.dateTime);
      return d.toDateString() === new Date().toDateString();
    }).length}</div>
          </div>
          <div style="background: transparent; padding: 0.5rem; border-radius: 8px; color: var(--triage-blue);">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
        </div>
        <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--muted);">En todos los servicios</div>
      </div>
    `;
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Filtros
    if (elements.btnApplyFilters) {
      elements.btnApplyFilters.addEventListener('click', applyFiltersHandler);
    }

    if (elements.btnClearFilters) {
      elements.btnClearFilters.addEventListener('click', clearFiltersHandler);
    }

    // Búsqueda en tiempo real
    if (elements.filterSearch) {
      let searchTimeout;
      elements.filterSearch.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.filters.search = e.target.value;
          loadAreas();
        }, 300);
      });
    }

    // Cambiar vista (desde grid a list)
    if (elements.btnToggleView) {
      elements.btnToggleView.addEventListener('click', () => toggleView('list'));
    }

    // Cambiar vista (desde list a grid)
    if (elements.btnToggleViewList) {
      elements.btnToggleViewList.addEventListener('click', () => toggleView('grid'));
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

    // Agregar especialidad
    if (elements.btnAddSpecialty) {
      elements.btnAddSpecialty.addEventListener('click', addSpecialty);
    }

    if (elements.formAddSpecialty) {
      elements.formAddSpecialty.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSpecialty();
        }
      });
    }

    // Sincronizar color picker con input de texto
    if (elements.formColor && elements.formColorText) {
      elements.formColor.addEventListener('input', (e) => {
        elements.formColorText.value = e.target.value;
      });

      elements.formColorText.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          elements.formColor.value = e.target.value;
        }
      });
    }

    // Acciones en la lista y grid
    if (elements.areasList) {
      elements.areasList.addEventListener('click', handleListAction);
    }

    if (elements.areasGrid) {
      elements.areasGrid.addEventListener('click', handleListAction);
    }

    // Paginación
    if (elements.pagination) {
      elements.pagination.addEventListener('click', handlePagination);
    }

    // Scroll horizontal con rueda del ratón
    if (elements.areasGridContainer) {
      elements.areasGridContainer.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          elements.areasGridContainer.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }
  }

  // Cambiar entre vista de tarjetas y lista
  function toggleView(targetView) {
    state.viewMode = targetView;

    if (targetView === 'list') {
      elements.gridViewSection.style.display = 'none';
      elements.listViewSection.style.display = 'block';
    } else {
      elements.gridViewSection.style.display = 'block';
      elements.listViewSection.style.display = 'none';
      renderAreasGrid();
    }
  }

  // Manejar filtros
  function applyFiltersHandler() {
    state.filters = {
      search: elements.filterSearch?.value || '',
      status: elements.filterStatus?.value || 'active',
      parentId: elements.filterParent?.value || '',
      parentArea: elements.filterParentArea?.value || ''
    };

    // Si se selecciona un área padre específica, sobreescribir el tipo
    if (state.filters.parentArea) {
      state.filters.parentId = state.filters.parentArea;
    }

    state.currentPage = 1;
    loadAreas();
  }

  function clearFiltersHandler() {
    if (elements.filterSearch) elements.filterSearch.value = '';
    if (elements.filterStatus) elements.filterStatus.value = 'active';
    if (elements.filterParent) elements.filterParent.value = '';
    if (elements.filterParentArea) elements.filterParentArea.value = '';

    state.filters = {
      search: '',
      status: 'active',
      parentId: '',
      parentArea: ''
    };

    state.currentPage = 1;
    loadAreas();
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
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const areaId = button.dataset.id;
    const area = store.find('areas', areaId);

    if (!area) {
      console.error('Área no encontrada con ID:', areaId);
      showNotification('No se pudo encontrar el área', 'error');
      return;
    }

    switch (action) {
      case 'view':
        viewArea(area);
        break;
      case 'edit':
        editArea(area);
        break;
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

  // Rellenar formulario
  function populateForm(area) {
    if (elements.formName) elements.formName.value = area.name || '';
    if (elements.formCode) elements.formCode.value = area.code || '';
    if (elements.formDescription) elements.formDescription.value = area.description || '';
    if (elements.formLocation) elements.formLocation.value = area.location || '';
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
    if (elements.formCapacity) elements.formCapacity.value = 1;
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
      code: elements.formCode.value.trim().toUpperCase(),
      description: elements.formDescription.value.trim() || null,
      location: elements.formLocation.value.trim() || null,
      phone: elements.formPhone.value.trim() || null,
      email: elements.formEmail.value.trim() || null,
      color: elements.formColor.value,
      type: elements.formType.value,
      parentId: elements.formParent.value || null,
      headDoctorId: elements.formHeadDoctor.value || null,
      capacity: parseInt(elements.formCapacity.value) || 1,
      specialties: specialties.length > 0 ? specialties : null,
      status: elements.formStatus ? elements.formStatus.value : 'active',
      isActive: elements.formStatus ? elements.formStatus.value === 'active' : true,
      notes: elements.formNotes.value.trim() || null
    };
  }

  // Guardar área
  async function saveArea() {
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

  // Ver área
  function viewArea(area) {
    if (!area) return;

    const stats = getAreaStats(area.id);
    const subAreas = state.areas.filter(a => a.parentId === area.id);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.5); display: flex; align-items: center;
      justify-content: center; z-index: 5000; padding: 1rem;
    `;

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px; background: white; border-radius: var(--radius); overflow: hidden;">
        <div class="modal-header" style="padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border);">
          <h3 class="modal-title" style="margin: 0;">${area.name}</h3>
          <button class="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <div style="display: grid; grid-template-columns: 1fr 200px; gap: 2rem;">
            <div>
              <div style="margin-bottom: 1.5rem;">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--accent);">Descripción</h4>
                <p style="margin: 0; line-height: 1.6;">${area.description || 'Sin descripción disponible.'}</p>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                  <h4 style="margin: 0 0 0.5rem 0; color: var(--accent);">Contacto</h4>
                  <div style="font-size: 0.9rem;"><strong>Ubicación:</strong> ${area.location || '-'}</div>
                  <div style="font-size: 0.9rem;"><strong>Teléfono:</strong> ${area.phone || '-'}</div>
                </div>
                <div>
                  <h4 style="margin: 0 0 0.5rem 0; color: var(--accent);">Gestión</h4>
                  <div style="font-size: 0.9rem;"><strong>Responsable:</strong> ${area.headDoctor || 'No asignado'}</div>
                  <div style="font-size: 0.9rem;"><strong>Estado:</strong> <span class="badge ${area.isActive ? 'badge-success' : 'badge-danger'}">${area.isActive ? 'Activo' : 'Inactivo'}</span></div>
                </div>
              </div>
            </div>

            <div>
              <div style="background: var(--bg-light); padding: 1.25rem; border-radius: var(--radius); border: 1px solid var(--border); text-align: center;">
                <div style="margin-bottom: 1rem;">
                  <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent);">${stats.totalDoctors}</div>
                  <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Médicos</div>
                </div>
                <div>
                  <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent-2);">${stats.todayAppointments}</div>
                  <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase;">Citas Hoy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 1rem;">
          <button class="btn btn-outline" id="btn-view-doctors">Ver Equipo Médico</button>
          <button class="btn btn-outline" id="close-view-area">Cerrar</button>
          ${role === 'admin' ? `<button class="btn btn-primary" id="edit-area-from-view">Editar Área</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeHandler = () => modal.remove();
    modal.querySelector('.close-modal').onclick = closeHandler;
    modal.querySelector('#close-view-area').onclick = closeHandler;
    modal.onclick = (e) => { if (e.target === modal) closeHandler(); };

    modal.querySelector('#btn-view-doctors').onclick = () => {
      closeHandler();
      viewAreaDoctors(area);
    };

    if (role === 'admin') {
      modal.querySelector('#edit-area-from-view').onclick = () => {
        closeHandler();
        editArea(area);
      };
    }
  }

  // Ver médicos del área en un modal premium
  function viewAreaDoctors(area) {
    const doctors = store.get('doctors') || [];
    const areaDoctors = doctors.filter(d =>
      d.areaId === area.id || (d.otherAreas && d.otherAreas.includes(area.id))
    );

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; 
      z-index: 6000; padding: 1rem;
    `;

    const doctorsHtml = areaDoctors.length > 0 ? areaDoctors.map(d => `
      <div style="background: #f8fafc; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem; transition: transform 0.2s, box-shadow 0.2s;">
        <div style="width: 50px; height: 50px; background: var(--modal-header); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.25rem;">
          ${d.name.charAt(0)}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 700; color: #1e293b; font-size: 1rem;">${d.name}</div>
          <div style="color: var(--info); font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">${d.specialty}</div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.25rem;">
            <span style="font-size: 0.75rem; color: #64748b; background: white; padding: 2px 8px; border-radius: 4px; border: 1px solid #eee;">Lic: ${d.license}</span>
            <span class="badge ${d.isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 0.65rem;">
              ${d.isActive ? 'Disponible' : 'No disponible'}
            </span>
          </div>
        </div>
        <div style="text-align: right;">
           <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">HORARIO</div>
           <div style="font-size: 0.85rem; font-weight: 700; color: #334155;">${d.schedule || 'Ver agenda'}</div>
        </div>
      </div>
    `).join('') : `
      <div style="text-align: center; padding: 3rem; color: #94a3b8;">
        <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">👨‍⚕️</div>
        <div style="font-weight: 600;">No hay médicos asignados actualmente</div>
        <div style="font-size: 0.85rem;">Este área no cuenta con personal médico activo registrado.</div>
      </div>
    `;

    modal.innerHTML = `
      <div class="modal-content animated-scale-up" style="max-width: 700px; width: 100%; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border-radius: 16px;">
        <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
          <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h2>
          <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
            EQUIPO MÉDICO DE ${area.name.toUpperCase()}
          </div>
          <button class="close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">&times;</button>
        </div>
        
        <div class="modal-body" style="background: white; padding: 1.5rem; max-height: 60vh; overflow-y: auto;">
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${doctorsHtml}
          </div>
        </div>

        <div class="modal-footer" style="background: #f8fafc; padding: 1.25rem; display: flex; justify-content: flex-end; border-top: 1px solid #e2e8f0;">
          <button class="btn btn-primary" id="close-doctors-modal" style="padding: 0.75rem 2rem; border-radius: 8px; font-weight: 700;">VOLVER AL ÁREA</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeHandler = () => modal.remove();
    modal.querySelector('.close-modal').onclick = closeHandler;
    modal.querySelector('#close-doctors-modal').onclick = closeHandler;
    modal.onclick = (e) => { if (e.target === modal) closeHandler(); };
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
  border - radius: var(--radius);
  box - shadow: var(--shadow - lg);
  z - index: 10000;
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