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
    itemsPerPage: 10
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
    let areas = store.get('areas');
    
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
    const doctors = store.get('doctors');
    const appointments = store.get('appointments');
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
      <div class="module-areas">
        <!-- Header -->
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <h2>Áreas y Servicios</h2>
              <p class="text-muted">Gestión de departamentos médicos y especialidades</p>
            </div>
            ${canManage ? `
              <button class="btn btn-primary" id="btn-new-area">
                <span>+</span> Nueva Área
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Vista de tarjetas -->
        <div class="card">
          <div class="card-header">
            <h3 style="margin: 0;">Departamentos</h3>
            <div class="text-muted" id="areas-view-count">
              Cargando...
            </div>
          </div>
          
          <div class="grid grid-4" id="areas-grid">
            <!-- Se llenará dinámicamente -->
          </div>
          
          <div id="empty-grid" class="hidden">
            <div class="text-center" style="padding: 2rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">🏥</div>
              <h3>No hay áreas</h3>
              <p class="text-muted">No se encontraron áreas con los filtros aplicados</p>
            </div>
          </div>
        </div>

        <!-- Filtros y lista -->
        <div class="card">
          <div class="card-header">
            <div class="flex justify-between items-center">
              <h3 style="margin: 0;">Lista de Áreas</h3>
              <div class="flex gap-2">
                <button class="btn btn-outline btn-sm" id="btn-toggle-view">
                  <span id="view-icon">📋</span> Cambiar vista
                </button>
              </div>
            </div>
          </div>
          
          <!-- Filtros -->
          <div class="p-4 border-b">
            <div class="grid grid-4">
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
          <div class="table-responsive">
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
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <h3 style="margin: 0;">${state.editingId ? 'Editar Área' : 'Nueva Área'}</h3>
            <button class="btn btn-outline btn-sm" id="btn-close-modal">×</button>
          </div>
          
          <div class="modal-body">
            <form id="area-form">
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Nombre del área *</label>
                  <input type="text" class="input" id="form-name" 
                         required placeholder="Ej: Pediatría, Urgencias, Laboratorio...">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Código interno *</label>
                  <input type="text" class="input" id="form-code" 
                         required placeholder="Ej: PED, URG, LAB">
                  <div class="form-hint">Máximo 10 caracteres. Usado para identificaciones internas.</div>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Descripción</label>
                <textarea class="input" id="form-description" rows="2"
                          placeholder="Descripción del servicio que ofrece esta área..."></textarea>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Ubicación física</label>
                  <input type="text" class="input" id="form-location" 
                         placeholder="Ej: Piso 3, Ala Norte, Edificio B...">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Teléfono de contacto</label>
                  <input type="tel" class="input" id="form-phone" 
                         placeholder="Ej: 600123456">
                </div>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Email de contacto</label>
                  <input type="email" class="input" id="form-email" 
                         placeholder="Ej: area@hospital.com">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Color identificativo</label>
                  <div class="flex items-center gap-2">
                    <input type="color" class="input" id="form-color" 
                           value="${state.editingId ? '#4CAF50' : '#2196F3'}" 
                           style="width: 60px; height: 40px; padding: 0;">
                    <input type="text" class="input" id="form-color-text" 
                           placeholder="#2196F3" style="flex: 1;">
                  </div>
                  <div class="form-hint">Usado en calendarios y visualizaciones.</div>
                </div>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Tipo de área</label>
                  <select class="input" id="form-type">
                    <option value="clinical">Clínica</option>
                    <option value="diagnostic">Diagnóstico</option>
                    <option value="surgical">Quirúrgica</option>
                    <option value="administrative">Administrativa</option>
                    <option value="support">Soporte</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Área padre</label>
                  <select class="input" id="form-parent">
                    <option value="">Área principal (sin padre)</option>
                  </select>
                  <div class="form-hint">Seleccione si esta es una sub-área de otra.</div>
                </div>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Médico jefe/responsable</label>
                  <select class="input" id="form-head-doctor">
                    <option value="">Sin asignar</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Capacidad (consultorios)</label>
                  <input type="number" class="input" id="form-capacity" 
                         min="1" max="50" value="1"
                         placeholder="Ej: 5">
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Especialidades asociadas</label>
                <div class="flex flex-wrap gap-2 mt-2" id="specialties-container">
                  <!-- Se llenará dinámicamente -->
                </div>
                <div class="flex gap-2 mt-2">
                  <input type="text" class="input" id="form-add-specialty" 
                         placeholder="Agregar especialidad...">
                  <button type="button" class="btn btn-outline" id="btn-add-specialty">Agregar</button>
                </div>
                <div class="form-hint">Presione Enter o el botón para agregar especialidades.</div>
              </div>
              
              ${state.editingId ? `
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="input" id="form-status">
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                    <option value="maintenance">En mantenimiento</option>
                  </select>
                </div>
              ` : ''}
              
              <div class="form-group">
                <label class="form-label">Notas adicionales</label>
                <textarea class="input" id="form-notes" rows="3"
                          placeholder="Información adicional sobre el área..."></textarea>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-outline" id="btn-cancel">Cancelar</button>
            <button class="btn btn-primary" id="btn-save" ${state.isLoading ? 'disabled' : ''}>
              ${state.isLoading ? 'Guardando...' : (state.editingId ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Guardar referencias a elementos
    elements = {
      statsContainer: root.querySelector('#stats-container'),
      areasGrid: root.querySelector('#areas-grid'),
      areasViewCount: root.querySelector('#areas-view-count'),
      emptyGrid: root.querySelector('#empty-grid'),
      areasList: root.querySelector('#areas-list'),
      areasTable: root.querySelector('#areas-table'),
      pagination: root.querySelector('#pagination'),
      emptyState: root.querySelector('#empty-state'),
      btnToggleView: root.querySelector('#btn-toggle-view'),
      viewIcon: root.querySelector('#view-icon'),
      
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
    
    // Configurar vista inicial (tarjetas o lista)
    state.viewMode = 'grid'; // grid o list
    
    // Cargar datos iniciales
    loadSelectData();
    loadAreas();
  }

  // Cargar datos en selects
  function loadSelectData() {
    // Áreas padre para filtros
    if (elements.filterParentArea) {
      const areas = store.get('areas');
      const options = areas
        .filter(a => !a.parentId) // Solo áreas principales
        .map(a => `<option value="${a.id}">${a.name}</option>`)
        .join('');
      elements.filterParentArea.innerHTML = `<option value="">Todas las áreas</option>${options}`;
    }
    
    // Áreas padre para formulario
    if (elements.formParent) {
      const areas = store.get('areas');
      const options = areas
        .filter(a => !a.parentId) // Solo áreas principales
        .map(a => `<option value="${a.id}">${a.name}</option>`)
        .join('');
      elements.formParent.innerHTML = `<option value="">Área principal (sin padre)</option>${options}`;
    }
    
    // Médicos jefe
    if (elements.formHeadDoctor) {
      const doctors = store.get('doctors').filter(d => d.isActive);
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
      elements.areasGrid.classList.add('hidden');
      elements.areasViewCount.textContent = '0 áreas principales';
      return;
    }
    
    elements.emptyGrid.classList.add('hidden');
    elements.areasGrid.classList.remove('hidden');
    
    elements.areasViewCount.textContent = `${areas.length} ${areas.length === 1 ? 'área principal' : 'áreas principales'}`;
    
    const cards = areas.map(area => {
      const stats = getAreaStats(area.id);
      const subAreas = state.areas.filter(a => a.parentId === area.id);
      
      return `
        <div class="card" style="border-left: 4px solid ${area.color || '#2196F3'};">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
            <div style="width: 48px; height: 48px; background: ${area.color || '#2196F3'}; 
                       border-radius: 8px; display: flex; align-items: center; justify-content: center; 
                       color: white; font-size: 1.25rem; font-weight: bold;">
              ${area.code || area.name.charAt(0)}
            </div>
            <div>
              <div style="font-weight: 500; font-size: 1.125rem;">${area.name}</div>
              <div style="color: var(--muted); font-size: 0.875rem;">${area.code || 'Sin código'}</div>
            </div>
          </div>
          
          <p style="color: var(--muted); font-size: 0.875rem; margin-bottom: 1rem; min-height: 40px;">
            ${area.description || 'Sin descripción'}
          </p>
          
          ${area.location ? `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.875rem;">
              <span style="opacity: 0.6;">📍</span>
              <span>${area.location}</span>
            </div>
          ` : ''}
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">Médicos</div>
              <div style="font-weight: 500; font-size: 1.25rem;">${stats.totalDoctors}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">Citas hoy</div>
              <div style="font-weight: 500; font-size: 1.25rem; color: var(--accent-2);">${stats.todayAppointments}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">Sub-áreas</div>
              <div style="font-weight: 500; font-size: 1.25rem;">${subAreas.length}</div>
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
      return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.areasTable.classList.remove('hidden');
    elements.pagination.classList.remove('hidden');
    
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
    
    // También renderizar grid si está en ese modo
    if (state.viewMode === 'grid') {
      renderAreasGrid();
    }
  }

  // Renderizar paginación
  function renderPagination() {
    if (!elements.pagination) return;
    
    const totalPages = Math.ceil(state.areas.length / state.itemsPerPage);
    
    if (totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }
    
    elements.pagination.innerHTML = `
      <div class="text-sm text-muted">
        Mostrando ${Math.min(state.currentPage * state.itemsPerPage, state.areas.length)} de ${state.areas.length} áreas
      </div>
      
      <div class="flex gap-1">
        <button class="btn btn-outline btn-sm ${state.currentPage === 1 ? 'disabled' : ''}" 
                data-page="prev" ${state.currentPage === 1 ? 'disabled' : ''}>
          ← Anterior
        </button>
        
        ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (state.currentPage <= 3) {
            pageNum = i + 1;
          } else if (state.currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = state.currentPage - 2 + i;
          }
          
          return `
            <button class="btn btn-sm ${state.currentPage === pageNum ? 'btn-primary' : 'btn-outline'}" 
                    data-page="${pageNum}">
              ${pageNum}
            </button>
          `;
        }).join('')}
        
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
    
    const areas = store.get('areas');
    const doctors = store.get('doctors');
    const appointments = store.get('appointments');
    
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
      <div class="card">
        <div class="text-muted text-sm">Total áreas</div>
        <div class="text-2xl font-bold" style="color: var(--accent);">${stats.total}</div>
        <div class="text-xs text-muted mt-1">${stats.mainAreas} principales, ${stats.subAreas} sub-áreas</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Áreas activas</div>
        <div class="text-2xl font-bold" style="color: var(--success);">${stats.active}</div>
        <div class="text-xs text-muted mt-1">${Math.round((stats.active / stats.total) * 100)}% del total</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Médicos asignados</div>
        <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.areaAssignments}</div>
        <div class="text-xs text-muted mt-1">de ${stats.totalDoctors} médicos</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Tipos de áreas</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${stats.mainAreas}</div>
        <div class="text-xs text-muted mt-1">principales registradas</div>
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
    
    // Cambiar vista
    if (elements.btnToggleView) {
      elements.btnToggleView.addEventListener('click', toggleView);
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
  }

  // Cambiar entre vista de tarjetas y lista
  function toggleView() {
    if (state.viewMode === 'grid') {
      state.viewMode = 'list';
      elements.viewIcon.textContent = '📋';
      elements.areasGrid.parentElement.classList.add('hidden');
      elements.areasTable.parentElement.classList.remove('hidden');
    } else {
      state.viewMode = 'grid';
      elements.viewIcon.textContent = '🧩';
      elements.areasGrid.parentElement.classList.remove('hidden');
      elements.areasTable.parentElement.classList.add('hidden');
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
      badge.textContent.trim() === specialty
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
    badge.innerHTML = `
      ${specialty}
      <button type="button" class="badge-remove" style="margin-left: 0.5rem; background: none; border: none; color: inherit; cursor: pointer; font-size: 0.75rem;">
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
        elements.btnSave.textContent = state.editingId ? 'Actualizar' : 'Guardar';
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
    const stats = getAreaStats(area.id);
    const headDoctor = area.headDoctorId ? store.find('doctors', area.headDoctorId) : null;
    const parentArea = area.parentId ? store.find('areas', area.parentId) : null;
    const doctors = store.get('doctors').filter(d => 
      d.areaId === area.id || 
      (d.otherAreas && d.otherAreas.includes(area.id))
    );
    const subAreas = store.get('areas').filter(a => a.parentId === area.id);
    
    // Crear modal de vista detallada
    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-area-modal';
    modalContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    `;
    
    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 800px; background: var(--card); border-radius: var(--radius); width: 100%; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 48px; height: 48px; background: ${area.color || '#2196F3'}; 
                     border-radius: 8px; display: flex; align-items: center; justify-content: center; 
                     color: white; font-size: 1.25rem; font-weight: bold;">
              ${area.code ? area.code.charAt(0) : area.name.charAt(0)}
            </div>
            <div>
              <h3 style="margin: 0;">${area.name}</h3>
              <div style="color: var(--muted);">${area.code || 'Sin código'}</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" id="close-view-area-modal">×</button>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <!-- Información general -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 1rem;">Información general</h4>
            <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <div class="text-muted text-sm">Tipo de área</div>
                <div class="font-bold">${area.type === 'clinical' ? 'Clínica' : 
                                         area.type === 'diagnostic' ? 'Diagnóstico' : 
                                         area.type === 'surgical' ? 'Quirúrgica' : 
                                         area.type === 'administrative' ? 'Administrativa' : 'Soporte'}</div>
              </div>
              <div>
                <div class="text-muted text-sm">Capacidad</div>
                <div class="font-bold">${area.capacity || 1} consultorio(s)</div>
              </div>
              ${area.location ? `
                <div>
                  <div class="text-muted text-sm">Ubicación</div>
                  <div class="font-bold">${area.location}</div>
                </div>
              ` : ''}
              ${parentArea ? `
                <div>
                  <div class="text-muted text-sm">Área padre</div>
                  <div class="font-bold">${parentArea.name}</div>
                </div>
              ` : ''}
            </div>
            
            ${area.description ? `
              <div style="margin-top: 1rem;">
                <div class="text-muted text-sm">Descripción</div>
                <div style="padding: 0.75rem; background: var(--bg-light); border-radius: var(--radius); margin-top: 0.5rem;">
                  ${area.description}
                </div>
              </div>
            ` : ''}
          </div>
          
          <!-- Información de contacto -->
          ${(area.phone || area.email) ? `
            <div class="card" style="margin-bottom: 1.5rem;">
              <h4 style="margin-bottom: 1rem;">Información de contacto</h4>
              <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                ${area.phone ? `
                  <div>
                    <div class="text-muted text-sm">Teléfono</div>
                    <div class="font-bold">${area.phone}</div>
                  </div>
                ` : ''}
                ${area.email ? `
                  <div>
                    <div class="text-muted text-sm">Email</div>
                    <div class="font-bold">${area.email}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <!-- Médico responsable -->
          ${headDoctor ? `
            <div class="card" style="margin-bottom: 1.5rem;">
              <h4 style="margin-bottom: 1rem;">Médico responsable</h4>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; background: var(--accent); border-radius: 50%; 
                           display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                  ${headDoctor.name.charAt(0)}
                </div>
                <div>
                  <div style="font-weight: 500;">${headDoctor.name}</div>
                  <div style="color: var(--muted);">${headDoctor.specialty}</div>
                </div>
              </div>
            </div>
          ` : ''}
          
          <!-- Estadísticas -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 1rem;">Estadísticas</h4>
            <div class="grid grid-4">
              <div class="text-center">
                <div class="text-muted text-sm">Médicos asignados</div>
                <div class="text-2xl font-bold" style="color: var(--accent);">${stats.totalDoctors}</div>
              </div>
              <div class="text-center">
                <div class="text-muted text-sm">Citas totales</div>
                <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.totalAppointments}</div>
              </div>
              <div class="text-center">
                <div class="text-muted text-sm">Citas este mes</div>
                <div class="text-2xl font-bold" style="color: var(--info);">${stats.monthAppointments}</div>
              </div>
              <div class="text-center">
                <div class="text-muted text-sm">Sub-áreas</div>
                <div class="text-2xl font-bold" style="color: var(--success);">${subAreas.length}</div>
              </div>
            </div>
          </div>
          
          <!-- Especialidades -->
          ${area.specialties && area.specialties.length > 0 ? `
            <div class="card" style="margin-bottom: 1.5rem;">
              <h4 style="margin-bottom: 1rem;">Especialidades</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${area.specialties.map(specialty => `
                  <span class="badge badge-info">${specialty}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Sub-áreas -->
          ${subAreas.length > 0 ? `
            <div class="card">
              <h4 style="margin-bottom: 1rem;">Sub-áreas</h4>
              <div class="table-responsive">
                <table class="table" style="font-size: 0.875rem;">
                  <thead>
                    <tr>
                      <th>Sub-área</th>
                      <th>Código</th>
                      <th>Médicos</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subAreas.map(subArea => {
                      const subStats = getAreaStats(subArea.id);
                      return `
                        <tr>
                          <td>${subArea.name}</td>
                          <td>${subArea.code || '-'}</td>
                          <td>${subStats.totalDoctors}</td>
                          <td>
                            <span class="badge ${subArea.isActive ? 'badge-success' : 'badge-danger'}">
                              ${subArea.isActive ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.5rem;">
          ${role === 'admin' ? `
            <button class="btn btn-outline" id="edit-area-btn" data-id="${area.id}">
              Editar área
            </button>
            <button class="btn btn-primary" id="view-doctors-btn" data-id="${area.id}">
              Ver médicos (${doctors.length})
            </button>
          ` : ''}
          <button class="btn btn-outline" id="close-modal-btn">Cerrar</button>
        </div>
      </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(modalContainer);
    
    // Configurar event listeners
    const closeModalHandler = () => {
      if (modalContainer.parentNode) {
        modalContainer.parentNode.removeChild(modalContainer);
      }
    };
    
    // Botones de cerrar
    const closeBtn1 = modalContainer.querySelector('#close-view-area-modal');
    const closeBtn2 = modalContainer.querySelector('#close-modal-btn');
    if (closeBtn1) closeBtn1.addEventListener('click', closeModalHandler);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModalHandler);
    
    // Botón de editar
    const editBtn = modalContainer.querySelector('#edit-area-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        closeModalHandler();
        editArea(area);
      });
    }
    
    // Botón de ver médicos
    const doctorsBtn = modalContainer.querySelector('#view-doctors-btn');
    if (doctorsBtn) {
      doctorsBtn.addEventListener('click', () => {
        closeModalHandler();
        viewAreaDoctors(area);
      });
    }
    
    // Cerrar al hacer clic fuera
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        closeModalHandler();
      }
    });
    
    // Cerrar con ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModalHandler();
        document.removeEventListener('keydown', escHandler);
      }
    };
    
    document.addEventListener('keydown', escHandler);
  }

  // Ver médicos del área
  function viewAreaDoctors(area) {
    // Navegar al módulo de médicos con filtro por área
    if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
      window.APP_STATE.appShell.navigateTo('doctors');
      
      setTimeout(() => {
        showNotification(`Mostrando médicos de ${area.name}`, 'info');
        
        // Guardar el filtro en localStorage para que doctors.js lo use
        localStorage.setItem('doctor_area_filter', area.id);
      }, 500);
    }
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
                   type === 'warning' ? 'var(--warning)' : 'var(--info)'};
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