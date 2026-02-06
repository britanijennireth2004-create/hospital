/**
 * Módulo de Historia Clínica Electrónica
 * Gestión completa de registros médicos de pacientes
 */

export default function mountClinical(root, { bus, store, user, role }) {
  const state = {
    clinicalRecords: [],
    filteredRecords: [],
    filters: {
      patientId: '',
      doctorId: '',
      dateFrom: '',
      dateTo: '',
      type: '',
      status: ''
    },
    editingId: null,
    isLoading: false,
    showModal: false,
    showDetailModal: false,
    currentPatient: null,
    currentView: 'list', // 'list', 'detail', 'timeline'
    searchQuery: '',
    currentPage: 1,
    itemsPerPage: 10
  };

  // Elementos DOM
  let elements = {};

  // ===== INICIALIZACIÓN =====
  function init() {
    render();
    setupEventListeners();
    loadClinicalRecords();
    
    // Verificar si hay datos de formulario prellenados desde citas
    const formData = localStorage.getItem('clinical_form_data');
    if (formData) {
      const data = JSON.parse(formData);
      openModalWithData(data);
      localStorage.removeItem('clinical_form_data');
    }
    
    // Verificar si hay un registro específico para mostrar desde citas
    const viewRecordId = localStorage.getItem('clinical_view_record');
    if (viewRecordId) {
      const record = store.find('clinicalRecords', viewRecordId);
      if (record) {
        viewRecordDetail(record);
      }
      localStorage.removeItem('clinical_view_record');
    }
    
    // Verificar si hay un filtro de paciente específico
    const patientFilter = localStorage.getItem('clinical_patient_filter');
    if (patientFilter) {
      state.filters.patientId = patientFilter;
      localStorage.removeItem('clinical_patient_filter');
      // Aplicar el filtro después de un pequeño delay para que se renderice
      setTimeout(() => {
        if (elements.filterPatient) {
          elements.filterPatient.value = patientFilter;
        }
        loadClinicalRecords();
      }, 100);
    }
    
    // Suscribirse a cambios en el store
    const unsubscribe = store.subscribe('clinicalRecords', () => {
      loadClinicalRecords();
    });
    
    // También escuchar cambios en pacientes para actualizar filtros
    store.subscribe('patients', () => {
      updatePatientSelects();
    });
    
    return unsubscribe;
  }

  // ===== FUNCIONES PRINCIPALES =====
  
  // Cargar registros clínicos
  function loadClinicalRecords() {
    let records = store.get('clinicalRecords');
    
    // Filtrar por rol
    if (role === 'doctor' && user?.doctorId) {
      records = records.filter(record => record.doctorId === user.doctorId);
    } else if (role === 'patient' && user?.patientId) {
      records = records.filter(record => record.patientId === user.patientId);
    }
    
    // Aplicar filtros
    state.clinicalRecords = applyFilters(records);
    state.filteredRecords = [...state.clinicalRecords];
    
    // Ordenar por fecha (más reciente primero)
    state.filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    renderRecordsList();
    updateStats();
    updatePatientSelects();
  }

  // Aplicar filtros
  function applyFilters(records) {
    return records.filter(record => {
      // Filtro por paciente
      if (state.filters.patientId && record.patientId !== state.filters.patientId) {
        return false;
      }
      
      // Filtro por médico
      if (state.filters.doctorId && record.doctorId !== state.filters.doctorId) {
        return false;
      }
      
      // Filtro por tipo
      if (state.filters.type && record.type !== state.filters.type) {
        return false;
      }
      
      // Filtro por estado
      if (state.filters.status && record.status !== state.filters.status) {
        return false;
      }
      
      // Filtro por fecha desde
      if (state.filters.dateFrom) {
        const fromDate = new Date(state.filters.dateFrom);
        const recordDate = new Date(record.date);
        if (recordDate < fromDate) return false;
      }
      
      // Filtro por fecha hasta
      if (state.filters.dateTo) {
        const toDate = new Date(state.filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        const recordDate = new Date(record.date);
        if (recordDate > toDate) return false;
      }
      
      // Búsqueda por texto
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const searchableText = [
          record.symptoms,
          record.diagnosis,
          record.treatment,
          record.notes
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(query)) {
          // También buscar en nombre del paciente
          const patient = store.find('patients', record.patientId);
          if (!patient?.name.toLowerCase().includes(query)) {
            return false;
          }
        }
      }
      
      return true;
    });
  }

  // ===== RENDERIZADO PRINCIPAL =====
  function render() {
    const canCreate = role === 'admin' || role === 'doctor';
    const isPatient = role === 'patient';
    
    root.innerHTML = `
      <div class="module-clinical">
        <!-- Header -->
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <h2>📋 Historia Clínica</h2>
              <p class="text-muted">Registros médicos electrónicos de pacientes</p>
            </div>
            ${canCreate ? `
              <button class="btn btn-primary" id="btn-new-record">
                <span>+</span> Nuevo Registro
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Barra de búsqueda y filtros -->
        <div class="card">
          <div class="flex justify-between items-center mb-3">
            <h3 style="margin: 0;">Registros Clínicos</h3>
            <div class="flex items-center gap-2">
              <div class="relative" style="width: 300px;">
                <input 
                  type="text" 
                  class="input" 
                  id="search-input" 
                  placeholder="Buscar síntomas, diagnósticos, pacientes..."
                  value="${state.searchQuery}"
                >
                <div style="position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--muted);">
                  🔍
                </div>
              </div>
              <button class="btn btn-outline btn-sm" id="btn-advanced-filters">
                Filtros avanzados
              </button>
            </div>
          </div>
          
          <!-- Filtros avanzados (colapsable) -->
          <div id="advanced-filters" class="hidden">
            <div class="grid grid-4 gap-3 mt-3">
              <div class="form-group">
                <label class="form-label">Paciente</label>
                <select class="input" id="filter-patient">
                  <option value="">Todos los pacientes</option>
                </select>
              </div>
              
              ${role !== 'doctor' ? `
                <div class="form-group">
                  <label class="form-label">Médico</label>
                  <select class="input" id="filter-doctor">
                    <option value="">Todos los médicos</option>
                  </select>
                </div>
              ` : ''}
              
              <div class="form-group">
                <label class="form-label">Tipo</label>
                <select class="input" id="filter-type">
                  <option value="">Todos los tipos</option>
                  <option value="consultation">Consulta</option>
                  <option value="followup">Seguimiento</option>
                  <option value="emergency">Urgencia</option>
                  <option value="lab">Laboratorio</option>
                  <option value="prescription">Receta</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Estado</label>
                <select class="input" id="filter-status">
                  <option value="">Todos</option>
                  <option value="draft">Borrador</option>
                  <option value="finalized">Finalizado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Fecha desde</label>
                <input type="date" class="input" id="filter-date-from">
              </div>
              
              <div class="form-group">
                <label class="form-label">Fecha hasta</label>
                <input type="date" class="input" id="filter-date-to">
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
        </div>

        <!-- Contenido principal -->
        <div style="flex: 1;">
          <div class="card">
            <div class="card-header">
              <h3 style="margin: 0;">${isPatient ? 'Mi Historia Clínica' : 'Registros Recientes'}</h3>
              <div class="text-muted" id="records-count">
                Cargando...
              </div>
            </div>
            
            <div id="records-list-container">
              <div id="records-list">
                <!-- Se llenará dinámicamente -->
              </div>
              
              <div id="empty-state" class="hidden">
                <div class="text-center" style="padding: 3rem;">
                  <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📋</div>
                  <h3>No hay registros clínicos</h3>
                  <p class="text-muted">No se encontraron registros con los filtros aplicados</p>
                  ${canCreate ? `
                    <button class="btn btn-primary mt-3" id="btn-create-first-record">
                      Crear primer registro
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
            
            <!-- Paginación -->
            <div id="pagination" class="flex justify-between items-center mt-3">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para nuevo/editar registro -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="record-modal">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h3 style="margin: 0;">${state.editingId ? 'Editar Registro Clínico' : 'Nuevo Registro Clínico'}</h3>
            <button class="btn btn-outline btn-sm" id="btn-close-modal">×</button>
          </div>
          
          <div class="modal-body">
            <form id="record-form">
              <!-- Información básica -->
              <div class="card" style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 1rem;">Información Básica</h4>
                
                <div class="grid grid-2">
                  <div class="form-group">
                    <label class="form-label">Paciente *</label>
                    <select class="input" id="form-patient" required>
                      <option value="">Seleccionar paciente</option>
                    </select>
                  </div>
                  
                  ${role !== 'doctor' ? `
                    <div class="form-group">
                      <label class="form-label">Médico *</label>
                      <select class="input" id="form-doctor" required>
                        <option value="">Seleccionar médico</option>
                      </select>
                    </div>
                  ` : `<input type="hidden" id="form-doctor" value="${user?.doctorId || ''}">`}
                </div>
                
                <div class="grid grid-3">
                  <div class="form-group">
                    <label class="form-label">Fecha *</label>
                    <input type="date" class="input" id="form-date" required value="${new Date().toISOString().split('T')[0]}">
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Tipo *</label>
                    <select class="input" id="form-type" required>
                      <option value="">Seleccionar tipo</option>
                      <option value="consultation">Consulta</option>
                      <option value="followup">Seguimiento</option>
                      <option value="emergency">Urgencia</option>
                      <option value="lab">Laboratorio</option>
                      <option value="prescription">Receta</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Estado</label>
                    <select class="input" id="form-status">
                      <option value="draft">Borrador</option>
                      <option value="finalized">Finalizado</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Motivo de consulta</label>
                  <textarea class="input" id="form-reason" rows="2" placeholder="Describa el motivo de la consulta..."></textarea>
                </div>
              </div>
              
              <!-- Signos vitales -->
              <div class="card" style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 1rem;">Signos Vitales</h4>
                
                <div class="grid grid-4">
                  <div class="form-group">
                    <label class="form-label">Presión arterial</label>
                    <input type="text" class="input" id="form-bp" placeholder="120/80">
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Frecuencia cardíaca</label>
                    <input type="number" class="input" id="form-heart-rate" placeholder="72" min="0" max="200">
                    <div class="form-hint">lpm</div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Temperatura</label>
                    <input type="number" class="input" id="form-temperature" placeholder="36.5" min="30" max="45" step="0.1">
                    <div class="form-hint">°C</div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Saturación O₂</label>
                    <input type="number" class="input" id="form-spo2" placeholder="98" min="0" max="100">
                    <div class="form-hint">%</div>
                  </div>
                </div>
                
                <div class="grid grid-2" style="margin-top: 1rem;">
                  <div class="form-group">
                    <label class="form-label">Peso</label>
                    <input type="number" class="input" id="form-weight" placeholder="65" min="0" max="300" step="0.1">
                    <div class="form-hint">kg</div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Altura</label>
                    <input type="number" class="input" id="form-height" placeholder="170" min="0" max="250">
                    <div class="form-hint">cm</div>
                  </div>
                </div>
              </div>
              
              <!-- Evaluación clínica -->
              <div class="card" style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 1rem;">Evaluación Clínica</h4>
                
                <div class="form-group">
                  <label class="form-label">Síntomas</label>
                  <textarea class="input" id="form-symptoms" rows="3" placeholder="Describa los síntomas presentados por el paciente..."></textarea>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Diagnóstico *</label>
                  <textarea class="input" id="form-diagnosis" rows="2" required placeholder="Diagnóstico principal..."></textarea>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Tratamiento</label>
                  <textarea class="input" id="form-treatment" rows="3" placeholder="Plan de tratamiento prescrito..."></textarea>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Recetas</label>
                  <textarea class="input" id="form-prescriptions" rows="2" placeholder="Medicamentos recetados (uno por línea)..."></textarea>
                  <div class="form-hint">Formato: Medicamento - Dosis - Frecuencia - Duración</div>
                </div>
              </div>
              
              <!-- Seguimiento -->
              <div class="card">
                <h4 style="margin-bottom: 1rem;">Seguimiento</h4>
                
                <div class="form-group">
                  <label class="form-label">Notas adicionales</label>
                  <textarea class="input" id="form-notes" rows="3" placeholder="Observaciones, recomendaciones, notas importantes..."></textarea>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Próximo control</label>
                  <input type="date" class="input" id="form-followup">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Recomendaciones</label>
                  <textarea class="input" id="form-recommendations" rows="2" placeholder="Recomendaciones para el paciente..."></textarea>
                </div>
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
    captureElements();
    
    // Cargar datos iniciales
    loadClinicalRecords();
  }

  // Capturar referencias a elementos DOM
  function captureElements() {
    elements = {
      // Contenedores
      statsContainer: root.querySelector('#stats-container'),
      recordsList: root.querySelector('#records-list'),
      recordsCount: root.querySelector('#records-count'),
      emptyState: root.querySelector('#empty-state'),
      recordsListContainer: root.querySelector('#records-list-container'),
      pagination: root.querySelector('#pagination'),
      
      // Búsqueda y filtros
      searchInput: root.querySelector('#search-input'),
      btnAdvancedFilters: root.querySelector('#btn-advanced-filters'),
      advancedFilters: root.querySelector('#advanced-filters'),
      filterPatient: root.querySelector('#filter-patient'),
      filterDoctor: root.querySelector('#filter-doctor'),
      filterType: root.querySelector('#filter-type'),
      filterStatus: root.querySelector('#filter-status'),
      filterDateFrom: root.querySelector('#filter-date-from'),
      filterDateTo: root.querySelector('#filter-date-to'),
      btnClearFilters: root.querySelector('#btn-clear-filters'),
      btnApplyFilters: root.querySelector('#btn-apply-filters'),
      
      // Modal
      modal: root.querySelector('#record-modal'),
      form: root.querySelector('#record-form'),
      formPatient: root.querySelector('#form-patient'),
      formDoctor: root.querySelector('#form-doctor'),
      formDate: root.querySelector('#form-date'),
      formType: root.querySelector('#form-type'),
      formStatus: root.querySelector('#form-status'),
      formReason: root.querySelector('#form-reason'),
      formBp: root.querySelector('#form-bp'),
      formHeartRate: root.querySelector('#form-heart-rate'),
      formTemperature: root.querySelector('#form-temperature'),
      formSpo2: root.querySelector('#form-spo2'),
      formWeight: root.querySelector('#form-weight'),
      formHeight: root.querySelector('#form-height'),
      formSymptoms: root.querySelector('#form-symptoms'),
      formDiagnosis: root.querySelector('#form-diagnosis'),
      formTreatment: root.querySelector('#form-treatment'),
      formPrescriptions: root.querySelector('#form-prescriptions'),
      formNotes: root.querySelector('#form-notes'),
      formFollowup: root.querySelector('#form-followup'),
      formRecommendations: root.querySelector('#form-recommendations'),
      
      // Botones
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewRecord: root.querySelector('#btn-new-record'),
      btnCreateFirstRecord: root.querySelector('#btn-create-first-record')
    };
  }

  // ===== FUNCIONES DE RENDERIZADO =====
  
  // Renderizar lista de registros
  function renderRecordsList() {
    if (!elements.recordsList) return;
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedRecords = state.filteredRecords.slice(startIndex, endIndex);
    
    if (paginatedRecords.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.recordsList.innerHTML = '';
      elements.recordsCount.textContent = '0 registros';
      elements.pagination.classList.add('hidden');
      return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.recordsCount.textContent = `${state.filteredRecords.length} ${state.filteredRecords.length === 1 ? 'registro' : 'registros'}`;
    elements.pagination.classList.remove('hidden');
    
    const recordsHtml = paginatedRecords.map(record => {
      const patient = store.find('patients', record.patientId);
      const doctor = store.find('doctors', record.doctorId);
      
      const date = new Date(record.date);
      const dateStr = date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      
      const typeIcon = {
        consultation: '🩺',
        followup: '📅',
        emergency: '🚨',
        lab: '🧪',
        prescription: '💊'
      }[record.type] || '📄';
      
      const statusBadge = getStatusBadge(record.status);
      
      return `
        <div class="record-item" data-id="${record.id}" 
             style="padding: 1rem; border-bottom: 1px solid var(--border-light); cursor: pointer; transition: background 0.2s;"
             onmouseover="this.style.background='var(--bg-light)'" 
             onmouseout="this.style.background='transparent'">
          <div style="display: flex; align-items: flex-start; gap: 1rem;">
            <div style="font-size: 1.5rem; flex-shrink: 0;">${typeIcon}</div>
            
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <div style="font-weight: 500; font-size: 1.1rem;">${patient?.name || 'Paciente'}</div>
                  <div style="display: flex; gap: 1rem; margin-top: 0.25rem;">
                    <span class="text-sm text-muted">${dateStr}</span>
                    <span class="text-sm">${doctor?.name || 'Médico'}</span>
                    <span class="text-sm text-muted">${getTypeText(record.type)}</span>
                  </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  ${statusBadge}
                </div>
              </div>
              
              ${record.diagnosis ? `
                <div style="margin-top: 0.5rem;">
                  <div class="text-sm text-muted">Diagnóstico:</div>
                  <div style="font-size: 0.9rem; color: var(--text);">${truncateText(record.diagnosis, 120)}</div>
                </div>
              ` : ''}
              
              ${record.treatment ? `
                <div style="margin-top: 0.25rem;">
                  <div class="text-sm text-muted">Tratamiento:</div>
                  <div style="font-size: 0.9rem; color: var(--text);">${truncateText(record.treatment, 100)}</div>
                </div>
              ` : ''}
              
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                ${record.vitalSigns?.bloodPressure ? `
                  <div class="text-xs" style="padding: 0.125rem 0.5rem; background: var(--bg-light); border-radius: 4px;">
                    <span class="text-muted">TA:</span> ${record.vitalSigns.bloodPressure}
                  </div>
                ` : ''}
                
                ${record.vitalSigns?.temperature ? `
                  <div class="text-xs" style="padding: 0.125rem 0.5rem; background: var(--bg-light); border-radius: 4px;">
                    <span class="text-muted">Temp:</span> ${record.vitalSigns.temperature}°C
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    elements.recordsList.innerHTML = recordsHtml;
    renderPagination();
  }

  // Renderizar paginación
  function renderPagination() {
    if (!elements.pagination) return;
    
    const totalPages = Math.ceil(state.filteredRecords.length / state.itemsPerPage);
    
    if (totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }
    
    elements.pagination.innerHTML = `
      <div class="text-sm text-muted">
        Mostrando ${Math.min(state.currentPage * state.itemsPerPage, state.filteredRecords.length)} 
        de ${state.filteredRecords.length} registros
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
    
    const records = state.clinicalRecords;
    const patients = store.get('patients');
    
    const stats = {
      total: records.length,
      consultations: records.filter(r => r.type === 'consultation').length,
      pendingFollowups: records.filter(r => {
        if (!r.followUp) return false;
        return new Date(r.followUp) > new Date() && r.status !== 'archived';
      }).length,
      patientsWithRecords: new Set(records.map(r => r.patientId)).size
    };
    
    elements.statsContainer.innerHTML = `
      <div class="card">
        <div class="text-muted text-sm">Total registros</div>
        <div class="text-2xl font-bold" style="color: var(--accent);">${stats.total}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Consultas</div>
        <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.consultations}</div>
        <div class="text-xs text-muted mt-1">${stats.total > 0 ? Math.round((stats.consultations / stats.total) * 100) : 0}% del total</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Controles pendientes</div>
        <div class="text-2xl font-bold" style="color: var(--warning);">${stats.pendingFollowups}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Pacientes con HC</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${stats.patientsWithRecords}</div>
        <div class="text-xs text-muted mt-1">de ${patients.length} pacientes</div>
      </div>
    `;
  }

  // Actualizar selects de pacientes
  function updatePatientSelects() {
    const patients = store.get('patients');
    
    // Para filtros
    if (elements.filterPatient) {
      const options = patients.map(p => `<option value="${p.id}">${p.name} - ${p.dni || ''}</option>`).join('');
      elements.filterPatient.innerHTML = `<option value="">Todos los pacientes</option>${options}`;
      if (state.filters.patientId) {
        elements.filterPatient.value = state.filters.patientId;
      }
    }
    
    // Para formulario
    if (elements.formPatient) {
      const options = patients.map(p => `<option value="${p.id}">${p.name} (${p.dni || 'Sin DNI'})</option>`).join('');
      elements.formPatient.innerHTML = `<option value="">Seleccionar paciente</option>${options}`;
    }
    
    // Actualizar select de médicos (solo si no es doctor)
    if (elements.filterDoctor && role !== 'doctor') {
      const doctors = store.get('doctors');
      const options = doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
      elements.filterDoctor.innerHTML = `<option value="">Todos los médicos</option>${options}`;
      if (state.filters.doctorId) {
        elements.filterDoctor.value = state.filters.doctorId;
      }
    }
    
    if (elements.formDoctor && role !== 'doctor') {
      const doctors = store.get('doctors');
      const options = doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
      elements.formDoctor.innerHTML = `<option value="">Seleccionar médico</option>${options}`;
    }
  }

  // ===== FUNCIONES UTILITARIAS =====
  
  function getTypeText(type) {
    const types = {
      consultation: 'Consulta',
      followup: 'Seguimiento',
      emergency: 'Urgencia',
      lab: 'Laboratorio',
      prescription: 'Receta'
    };
    return types[type] || type;
  }
  
  function getStatusBadge(status) {
    const statusConfig = {
      draft: { text: 'Borrador', class: 'badge-info' },
      finalized: { text: 'Finalizado', class: 'badge-success' },
      archived: { text: 'Archivado', class: 'badge-muted' }
    };
    
    const config = statusConfig[status] || { text: status, class: 'badge-info' };
    return `<span class="badge ${config.class}">${config.text}</span>`;
  }
  
  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
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

  // ===== EVENT LISTENERS =====
  function setupEventListeners() {
    // Búsqueda en tiempo real
    if (elements.searchInput) {
      let searchTimeout;
      elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          state.searchQuery = e.target.value;
          state.currentPage = 1;
          loadClinicalRecords();
        }, 300);
      });
    }
    
    // Filtros avanzados
    if (elements.btnAdvancedFilters) {
      elements.btnAdvancedFilters.addEventListener('click', () => {
        elements.advancedFilters.classList.toggle('hidden');
      });
    }
    
    // Aplicar filtros
    if (elements.btnApplyFilters) {
      elements.btnApplyFilters.addEventListener('click', applyFiltersHandler);
    }
    
    // Limpiar filtros
    if (elements.btnClearFilters) {
      elements.btnClearFilters.addEventListener('click', clearFiltersHandler);
    }
    
    // Nuevo registro
    if (elements.btnNewRecord) {
      elements.btnNewRecord.addEventListener('click', () => openModal());
    }
    
    if (elements.btnCreateFirstRecord) {
      elements.btnCreateFirstRecord.addEventListener('click', () => openModal());
    }
    
    // Modal
    if (elements.btnCloseModal) {
      elements.btnCloseModal.addEventListener('click', closeModal);
    }
    
    if (elements.btnCancel) {
      elements.btnCancel.addEventListener('click', closeModal);
    }
    
    if (elements.btnSave) {
      elements.btnSave.addEventListener('click', saveRecord);
    }
    
    // Click en registros
    if (elements.recordsList) {
      elements.recordsList.addEventListener('click', (e) => {
        const recordItem = e.target.closest('.record-item');
        if (recordItem) {
          const recordId = recordItem.dataset.id;
          const record = store.find('clinicalRecords', recordId);
          if (record) {
            viewRecordDetail(record);
          }
        }
      });
    }
    
    // Paginación (event delegation)
    if (elements.pagination) {
      elements.pagination.addEventListener('click', handlePagination);
    }
    
    // Enter en búsqueda
    if (elements.searchInput) {
      elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          state.searchQuery = e.target.value;
          state.currentPage = 1;
          loadClinicalRecords();
        }
      });
    }
  }

  function applyFiltersHandler() {
    state.filters = {
      patientId: elements.filterPatient?.value || '',
      doctorId: elements.filterDoctor?.value || '',
      type: elements.filterType?.value || '',
      status: elements.filterStatus?.value || '',
      dateFrom: elements.filterDateFrom?.value || '',
      dateTo: elements.filterDateTo?.value || ''
    };
    
    state.currentPage = 1;
    loadClinicalRecords();
  }

  function clearFiltersHandler() {
    if (elements.filterPatient) elements.filterPatient.value = '';
    if (elements.filterDoctor) elements.filterDoctor.value = '';
    if (elements.filterType) elements.filterType.value = '';
    if (elements.filterStatus) elements.filterStatus.value = '';
    if (elements.filterDateFrom) elements.filterDateFrom.value = '';
    if (elements.filterDateTo) elements.filterDateTo.value = '';
    if (elements.searchInput) elements.searchInput.value = '';
    
    state.filters = {
      patientId: '',
      doctorId: '',
      type: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    };
    
    state.searchQuery = '';
    state.currentPage = 1;
    loadClinicalRecords();
  }

  function handlePagination(event) {
    const button = event.target.closest('button[data-page]');
    if (!button) return;
    
    const pageAction = button.dataset.page;
    
    switch (pageAction) {
      case 'prev':
        if (state.currentPage > 1) {
          state.currentPage--;
          renderRecordsList();
        }
        break;
        
      case 'next':
        const totalPages = Math.ceil(state.filteredRecords.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderRecordsList();
        }
        break;
        
      default:
        const pageNum = parseInt(pageAction);
        if (!isNaN(pageNum)) {
          state.currentPage = pageNum;
          renderRecordsList();
        }
    }
  }

  // ===== GESTIÓN DE REGISTROS =====
  
  function openModal(record = null) {
    state.editingId = record?.id || null;
    state.showModal = true;
    
    if (elements.modal) {
      elements.modal.classList.remove('hidden');
    }
    
    if (record) {
      populateForm(record);
    } else {
      clearForm();
      
      // Si es doctor, auto-seleccionar
      if (role === 'doctor' && user?.doctorId && elements.formDoctor) {
        elements.formDoctor.value = user.doctorId;
      }
      
      // Fecha por defecto: hoy
      if (elements.formDate) {
        elements.formDate.value = new Date().toISOString().split('T')[0];
      }
    }
  }

  // Función para abrir modal con datos prellenados desde citas
  function openModalWithData(data) {
    // Crear un objeto de registro temporal con los datos proporcionados
    const tempRecord = {
      patientId: data.patientId,
      doctorId: data.doctorId,
      appointmentId: data.appointmentId,
      date: data.date,
      reason: data.reason || '',
      type: 'consultation',
      status: 'draft'
    };
    
    openModal(tempRecord);
    
    // Si hay área específica, agregarla como nota
    if (data.areaId) {
      const area = store.find('areas', data.areaId);
      if (area && elements.formNotes) {
        const currentNotes = elements.formNotes.value || '';
        elements.formNotes.value = `Consulta generada desde cita en ${area.name}. ${currentNotes}`;
      }
    }
    
    // Si hay información de paciente, mostrarla
    if (data.patientId && elements.formPatient) {
      const patient = store.find('patients', data.patientId);
      if (patient) {
        showNotification(`Creando consulta para ${patient.name}`, 'info');
      }
    }
  }

  function closeModal() {
    state.showModal = false;
    state.editingId = null;
    
    if (elements.modal) {
      elements.modal.classList.add('hidden');
    }
    
    clearForm();
  }

  function populateForm(record) {
    // Información básica
    if (elements.formPatient) elements.formPatient.value = record.patientId;
    if (elements.formDoctor) elements.formDoctor.value = record.doctorId;
    if (elements.formDate) {
      const date = new Date(record.date);
      elements.formDate.value = date.toISOString().split('T')[0];
    }
    if (elements.formType) elements.formType.value = record.type;
    if (elements.formStatus) elements.formStatus.value = record.status;
    if (elements.formReason) elements.formReason.value = record.reason || '';
    
    // Signos vitales
    if (elements.formBp) elements.formBp.value = record.vitalSigns?.bloodPressure || '';
    if (elements.formHeartRate) elements.formHeartRate.value = record.vitalSigns?.heartRate || '';
    if (elements.formTemperature) elements.formTemperature.value = record.vitalSigns?.temperature || '';
    if (elements.formSpo2) elements.formSpo2.value = record.vitalSigns?.spo2 || '';
    if (elements.formWeight) elements.formWeight.value = record.vitalSigns?.weight || '';
    if (elements.formHeight) elements.formHeight.value = record.vitalSigns?.height || '';
    
    // Evaluación clínica
    if (elements.formSymptoms) elements.formSymptoms.value = record.symptoms || '';
    if (elements.formDiagnosis) elements.formDiagnosis.value = record.diagnosis || '';
    if (elements.formTreatment) elements.formTreatment.value = record.treatment || '';
    
    // Recetas
    if (elements.formPrescriptions) {
      if (Array.isArray(record.prescriptions)) {
        elements.formPrescriptions.value = record.prescriptions
          .map(p => `${p.medication} - ${p.dosage} - ${p.frequency} - ${p.duration}`)
          .join('\n');
      } else if (record.prescriptions) {
        elements.formPrescriptions.value = record.prescriptions;
      }
    }
    
    // Seguimiento
    if (elements.formNotes) elements.formNotes.value = record.notes || '';
    if (elements.formFollowup && record.followUp) {
      const followupDate = new Date(record.followUp);
      elements.formFollowup.value = followupDate.toISOString().split('T')[0];
    }
    if (elements.formRecommendations) elements.formRecommendations.value = record.recommendations || '';
  }

  function clearForm() {
    if (elements.form) elements.form.reset();
    updatePatientSelects();
    
    // Restaurar valores por defecto
    if (elements.formDate) {
      elements.formDate.value = new Date().toISOString().split('T')[0];
    }
    
    if (elements.formStatus) {
      elements.formStatus.value = 'draft';
    }
    
    // Si es doctor, auto-seleccionar
    if (role === 'doctor' && user?.doctorId && elements.formDoctor) {
      elements.formDoctor.value = user.doctorId;
    }
  }

  async function saveRecord() {
    if (!validateForm()) {
      showNotification('Por favor, complete todos los campos requeridos correctamente.', 'warning');
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
        // Actualizar registro existente
        await updateRecord(state.editingId, formData);
        showNotification('Registro actualizado correctamente', 'success');
      } else {
        // Crear nuevo registro
        await createRecord(formData);
        showNotification('Registro creado correctamente', 'success');
      }
      
      closeModal();
      loadClinicalRecords();
      
    } catch (error) {
      console.error('Error guardando registro:', error);
      showNotification('Error al guardar el registro', 'error');
    } finally {
      state.isLoading = false;
      if (elements.btnSave) {
        elements.btnSave.disabled = false;
        elements.btnSave.textContent = state.editingId ? 'Actualizar' : 'Guardar';
      }
    }
  }

  function validateForm() {
    let isValid = true;
    
    const requiredFields = [
      elements.formPatient,
      elements.formDoctor,
      elements.formDate,
      elements.formType,
      elements.formDiagnosis
    ];
    
    requiredFields.forEach(field => {
      if (field && !field.value.trim()) {
        field.classList.add('error');
        isValid = false;
      } else if (field) {
        field.classList.remove('error');
      }
    });
    
    return isValid;
  }

  function getFormData() {
    // Parsear recetas
    const prescriptions = [];
    if (elements.formPrescriptions && elements.formPrescriptions.value.trim()) {
      const lines = elements.formPrescriptions.value.split('\n');
      lines.forEach(line => {
        const parts = line.split('-').map(part => part.trim());
        if (parts.length >= 4) {
          prescriptions.push({
            medication: parts[0],
            dosage: parts[1],
            frequency: parts[2],
            duration: parts[3]
          });
        }
      });
    }
    
    return {
      patientId: elements.formPatient.value,
      doctorId: elements.formDoctor ? elements.formDoctor.value : user.doctorId,
      date: new Date(elements.formDate.value).getTime(),
      type: elements.formType.value,
      status: elements.formStatus.value,
      reason: elements.formReason.value || '',
      vitalSigns: {
        bloodPressure: elements.formBp.value || null,
        heartRate: elements.formHeartRate.value || null,
        temperature: elements.formTemperature.value || null,
        spo2: elements.formSpo2.value || null,
        weight: elements.formWeight.value || null,
        height: elements.formHeight.value || null
      },
      symptoms: elements.formSymptoms.value || '',
      diagnosis: elements.formDiagnosis.value,
      treatment: elements.formTreatment.value || '',
      prescriptions: prescriptions.length > 0 ? prescriptions : null,
      notes: elements.formNotes.value || '',
      followUp: elements.formFollowup.value ? new Date(elements.formFollowup.value).getTime() : null,
      recommendations: elements.formRecommendations.value || '',
      createdBy: user.id
    };
  }

  async function createRecord(data) {
    return store.add('clinicalRecords', data);
  }

  async function updateRecord(id, data) {
    return store.update('clinicalRecords', id, data);
  }

  // ===== MODAL DE DETALLES - FORMATO PROFESIONAL DE INFORME CLÍNICO =====
  function viewRecordDetail(record) {
    const patient = store.find('patients', record.patientId);
    const doctor = store.find('doctors', record.doctorId);
    const appointment = record.appointmentId ? store.find('appointments', record.appointmentId) : null;
    
    const date = new Date(record.date);
    const vitals = record.vitalSigns || {};
    
    // Crear modal de visualización
    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-clinical-record-modal';
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
      z-index: 2000;
      padding: 1rem;
      overflow: auto;
    `;
    
    modalContainer.innerHTML = `
      <div style="
        background: white; 
        border-radius: 4px; 
        width: 100%; 
        max-width: 800px; 
        max-height: 90vh; 
        overflow-y: auto; 
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
      ">
        <!-- Header del modal -->
        <div style="
          padding: 1rem 1.5rem; 
          background: #f8fafc; 
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <h3 style="margin: 0; font-size: 1.25rem; color: #2d3748;">Registro Clínico</h3>
            <div style="font-size: 0.875rem; color: #718096; margin-top: 0.25rem;">
              ${getTypeText(record.type)} • ${getStatusBadge(record.status)}
            </div>
          </div>
          <button class="btn-close-modal" style="
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #718096;
            padding: 0;
            line-height: 1;
          ">×</button>
        </div>
        
        <!-- Contenido del modal -->
        <div style="padding: 1.5rem; flex: 1; overflow-y: auto;">
          <!-- Información básica -->
          <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 1.5rem; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;">Paciente</div>
                <div style="font-weight: 500; font-size: 1.125rem;">${patient?.name || 'N/A'}</div>
                <div style="font-size: 0.875rem; color: #718096; margin-top: 0.25rem;">
                  ${patient?.dni || ''} • ${patient?.birthDate ? calculateAge(patient.birthDate) + ' años' : ''}
                </div>
              </div>
              <div style="flex: 1;">
                <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;">Médico</div>
                <div style="font-weight: 500; font-size: 1.125rem;">${doctor?.name || 'N/A'}</div>
                <div style="font-size: 0.875rem; color: #718096; margin-top: 0.25rem;">
                  ${doctor?.specialty || ''}
                </div>
              </div>
            </div>
            <div style="font-size: 0.875rem; color: #718096;">
              Fecha: ${date.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
          
          <!-- Signos vitales -->
          ${Object.values(vitals).some(v => v !== null && v !== '') ? `
            <div style="margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #2d3748;">Signos Vitales</h4>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
                ${vitals.bloodPressure ? `
                  <div style="background: #f8fafc; padding: 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.75rem; color: #718096;">Presión Arterial</div>
                    <div style="font-weight: 500; font-size: 1rem;">${vitals.bloodPressure}</div>
                  </div>
                ` : ''}
                ${vitals.heartRate ? `
                  <div style="background: #f8fafc; padding: 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.75rem; color: #718096;">Frec. Cardíaca</div>
                    <div style="font-weight: 500; font-size: 1rem;">${vitals.heartRate} lpm</div>
                  </div>
                ` : ''}
                ${vitals.temperature ? `
                  <div style="background: #f8fafc; padding: 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.75rem; color: #718096;">Temperatura</div>
                    <div style="font-weight: 500; font-size: 1rem;">${vitals.temperature}°C</div>
                  </div>
                ` : ''}
                ${vitals.spo2 ? `
                  <div style="background: #f8fafc; padding: 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.75rem; color: #718096;">Saturación O₂</div>
                    <div style="font-weight: 500; font-size: 1rem;">${vitals.spo2}%</div>
                  </div>
                ` : ''}
                ${vitals.weight ? `
                  <div style="background: #f8fafc; padding: 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.75rem; color: #718096;">Peso</div>
                    <div style="font-weight: 500; font-size: 1rem;">${vitals.weight} kg</div>
                  </div>
                ` : ''}
                ${vitals.height ? `
                  <div style="background: #f8fafc; padding: 0.75rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 0.75rem; color: #718096;">Altura</div>
                    <div style="font-weight: 500; font-size: 1rem;">${vitals.height} cm</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <!-- Motivo y síntomas -->
          ${record.reason || record.symptoms ? `
            <div style="margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #2d3748;">Motivo y Síntomas</h4>
              <div style="background: #f8fafc; padding: 1rem; border-radius: 4px; border: 1px solid #e2e8f0;">
                ${record.reason ? `
                  <div style="margin-bottom: ${record.symptoms ? '0.75rem' : '0'}">
                    <div style="font-size: 0.75rem; color: #718096; margin-bottom: 0.25rem;">Motivo de consulta</div>
                    <div style="white-space: pre-line;">${record.reason}</div>
                  </div>
                ` : ''}
                ${record.symptoms ? `
                  <div>
                    <div style="font-size: 0.75rem; color: #718096; margin-bottom: 0.25rem;">Síntomas</div>
                    <div style="white-space: pre-line;">${record.symptoms}</div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <!-- Diagnóstico -->
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #2d3748;">Diagnóstico</h4>
            <div style="background: #fff5f5; padding: 1rem; border-radius: 4px; border: 1px solid #fed7d7;">
              <div style="white-space: pre-line; font-weight: 500;">${record.diagnosis || 'No especificado'}</div>
            </div>
          </div>
          
          <!-- Tratamiento -->
          ${record.treatment ? `
            <div style="margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #2d3748;">Tratamiento</h4>
              <div style="background: #f0fff4; padding: 1rem; border-radius: 4px; border: 1px solid #c6f6d5;">
                <div style="white-space: pre-line;">${record.treatment}</div>
              </div>
            </div>
          ` : ''}
          
          <!-- Recetas -->
          ${(record.prescriptions && (Array.isArray(record.prescriptions) ? record.prescriptions.length > 0 : record.prescriptions.trim() !== '')) ? `
            <div style="margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #2d3748;">Recetas</h4>
              <div style="background: #faf5ff; padding: 1rem; border-radius: 4px; border: 1px solid #d6bcfa;">
                ${Array.isArray(record.prescriptions) ? 
                  record.prescriptions.map((pres, index) => `
                    <div style="
                      padding: 0.75rem;
                      ${index < record.prescriptions.length - 1 ? 'border-bottom: 1px solid #e9d8fd; margin-bottom: 0.75rem;' : ''}
                    ">
                      <div style="font-weight: 500; margin-bottom: 0.5rem;">${pres.medication || 'Medicamento'}</div>
                      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; font-size: 0.875rem;">
                        <div>
                          <div style="color: #718096;">Dosis</div>
                          <div>${pres.dosage || 'N/A'}</div>
                        </div>
                        <div>
                          <div style="color: #718096;">Frecuencia</div>
                          <div>${pres.frequency || 'N/A'}</div>
                        </div>
                        <div>
                          <div style="color: #718096;">Duración</div>
                          <div>${pres.duration || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  `).join('')
                  :
                  `<div style="white-space: pre-line;">${record.prescriptions}</div>`
                }
              </div>
            </div>
          ` : ''}
          
          <!-- Observaciones y seguimiento -->
          ${record.notes || record.recommendations || record.followUp ? `
            <div style="margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; color: #2d3748;">Seguimiento</h4>
              <div style="background: #ebf8ff; padding: 1rem; border-radius: 4px; border: 1px solid #90cdf4;">
                ${record.notes ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.75rem; color: #718096; margin-bottom: 0.25rem;">Notas</div>
                    <div style="white-space: pre-line;">${record.notes}</div>
                  </div>
                ` : ''}
                ${record.recommendations ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.75rem; color: #718096; margin-bottom: 0.25rem;">Recomendaciones</div>
                    <div style="white-space: pre-line;">${record.recommendations}</div>
                  </div>
                ` : ''}
                ${record.followUp ? `
                  <div>
                    <div style="font-size: 0.75rem; color: #718096; margin-bottom: 0.25rem;">Próximo control</div>
                    <div style="font-weight: 500;">
                      ${new Date(record.followUp).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                      <span style="font-size: 0.75rem; color: #718096; margin-left: 0.5rem;">
                        (${calculateDaysUntil(record.followUp)})
                      </span>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <!-- Información del registro -->
          <div style="
            margin-top: 1.5rem; 
            padding-top: 1rem; 
            border-top: 1px solid #e2e8f0;
            font-size: 0.75rem;
            color: #718096;
          ">
            <div>Registro creado: ${new Date(record.createdAt).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
            ${record.updatedAt && record.updatedAt !== record.createdAt ? `
              <div style="margin-top: 0.25rem;">
                Última actualización: ${new Date(record.updatedAt).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Footer del modal -->
        <div style="
          padding: 1rem 1.5rem; 
          background: #f8fafc; 
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        ">
          <button class="btn-print" style="
            padding: 0.5rem 1rem; 
            background: #4299e1; 
            color: white; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 0.875rem;
            font-weight: 500;
          " id="print-record-btn">
            🖨️ Imprimir Informe
          </button>
          ${(role === 'admin' || (role === 'doctor' && user?.doctorId === record.doctorId)) ? `
            <button class="btn-edit" style="
              padding: 0.5rem 1rem; 
              background: #38a169; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer; 
              font-size: 0.875rem;
              font-weight: 500;
            " id="edit-record-btn" data-id="${record.id}">
              ✏️ Editar
            </button>
          ` : ''}
          <button class="btn-close" style="
            padding: 0.5rem 1rem; 
            background: #718096; 
            color: white; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer; 
            font-size: 0.875rem;
            font-weight: 500;
          " id="close-modal-btn">
            Cerrar
          </button>
        </div>
      </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(modalContainer);
    
    // Configurar event listeners del modal
    setupDetailModalListeners(modalContainer, record, patient, doctor, appointment);
  }

  // ===== FUNCIÓN PARA IMPRIMIR INFORME CLÍNICO PROFESIONAL =====
// ===== FUNCIÓN PARA IMPRIMIR INFORME CLÍNICO COMPACTO =====
function generateClinicalReport(record) {
    const patient = store.find('patients', record.patientId);
    const doctor = store.find('doctors', record.doctorId);
    const date = new Date(record.date);
    const vitals = record.vitalSigns || {};
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showNotification('Permite ventanas emergentes para imprimir', 'warning');
        return;
    }
    
    // Funciones de formato
    const formatDateShort = (dateObj) => dateObj.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    
    const formatDateTime = (dateObj) => dateObj.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    const getSeverityLevel = () => {
        if (!vitals.bloodPressure && !vitals.heartRate && !vitals.temperature) {
            return 'NORMAL';
        }
        
        const bp = vitals.bloodPressure ? vitals.bloodPressure.split('/').map(Number) : [null, null];
        const hr = vitals.heartRate || 0;
        const temp = vitals.temperature || 0;
        
        let score = 0;
        if (bp[0] && (bp[0] > 180 || bp[0] < 90)) score += 2;
        else if (bp[0] && (bp[0] > 140 || bp[0] < 100)) score += 1;
        if (hr > 120 || hr < 50) score += 2;
        else if (hr > 100 || hr < 60) score += 1;
        if (temp > 39 || temp < 35) score += 2;
        else if (temp > 38 || temp < 36) score += 1;
        
        if (score >= 4) return 'ALTO';
        if (score >= 2) return 'MODERADO';
        return 'BAJO';
    };
    
    // Generar tabla compacta
    const createCompactTable = (headers, rows, colWidths = []) => {
        let table = '<table style="width:100%;border-collapse:collapse;margin:8px 0;font-size:9pt;">';
        table += '<tr style="background:#2c5282;color:white;">';
        headers.forEach((header, i) => {
            const width = colWidths[i] ? `width="${colWidths[i]}"` : '';
            table += `<th style="padding:5px 8px;text-align:left;font-weight:bold;" ${width}>${header}</th>`;
        });
        table += '</tr>';
        rows.forEach(row => {
            table += '<tr style="border-bottom:1px solid #e2e8f0;">';
            row.forEach(cell => {
                table += `<td style="padding:5px 8px;">${cell}</td>`;
            });
            table += '</tr>';
        });
        table += '</table>';
        return table;
    };
    
    // Calcular IMC si hay peso y altura
    const calculateBMI = () => {
        if (vitals.weight && vitals.height) {
            const heightM = vitals.height / 100;
            const bmi = (vitals.weight / (heightM * heightM)).toFixed(1);
            let category = '';
            if (bmi < 18.5) category = 'Bajo peso';
            else if (bmi < 25) category = 'Normal';
            else if (bmi < 30) category = 'Sobrepeso';
            else category = 'Obesidad';
            return `${bmi} (${category})`;
        }
        return 'N/A';
    };
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Informe Clínico - ${patient?.name || 'Paciente'}</title>
            <style>
                @page { margin: 0.8cm; size: A4; }
                * { margin:0; padding:0; box-sizing:border-box; font-family:'Segoe UI',sans-serif; }
                body { font-size:9.5pt; line-height:1.2; color:#333; max-width:100%; }
                
                /* HEADER SUPER COMPACTO */
                .header { text-align:center; margin-bottom:12px; padding-bottom:8px; border-bottom:2px solid #2c5282; }
                .hospital { font-size:11pt; font-weight:bold; color:#2c5282; letter-spacing:0.3px; }
                .title { font-size:10pt; font-weight:bold; color:#2d3748; margin:3px 0; }
                .info-line { font-size:8pt; color:#666; margin-top:2px; }
                
                /* DATOS PACIENTE - 2 COLUMNAS */
                .patient-grid { 
                    display:grid; grid-template-columns:1fr 1fr; gap:6px; 
                    margin-bottom:12px; font-size:9pt;
                }
                .patient-item { display:flex; margin-bottom:4px; }
                .patient-label { width:70px; color:#666; font-size:8.5pt; flex-shrink:0; }
                .patient-value { font-weight:500; }
                
                /* RESÚMENES COMPACTOS */
                .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin:10px 0; }
                .summary-item { 
                    background:#f8fafc; border:1px solid #e2e8f0; border-radius:3px; 
                    padding:6px; text-align:center;
                }
                .summary-label { font-size:8pt; color:#666; margin-bottom:2px; }
                .summary-value { font-size:9.5pt; font-weight:bold; color:#2c5282; }
                
                /* SIGNOS VITALES EN 1 LÍNEA */
                .vitals-line { 
                    display:grid; grid-template-columns:repeat(6,1fr); gap:4px; 
                    margin:10px 0; font-size:9pt;
                }
                .vital-compact { 
                    text-align:center; padding:5px; 
                    border:1px solid #e2e8f0; border-radius:3px;
                }
                .vital-label-compact { font-size:8pt; color:#666; margin-bottom:1px; }
                .vital-value-compact { font-size:9pt; font-weight:bold; }
                
                /* CONTENIDO COMPACTO */
                .section { margin:10px 0; }
                .section-title { 
                    font-size:9.5pt; font-weight:bold; color:#2c5282; 
                    margin-bottom:6px; padding-bottom:3px; border-bottom:1px solid #e2e8f0;
                }
                .content-compact { 
                    font-size:9pt; line-height:1.3; white-space:pre-line;
                    padding:8px; background:#f8fafc; border-radius:3px;
                    max-height:80px; overflow:hidden;
                }
                .content-expand { max-height:none !important; }
                
                /* DIAGNÓSTICO DESTACADO */
                .diagnosis-box { 
                    background:#fff5f5; border:1px solid #fed7d7; 
                    padding:8px; border-radius:3px; font-weight:bold;
                    font-size:9.5pt; margin:8px 0;
                }
                
                /* LISTA COMPACTA */
                .compact-list { padding-left:15px; margin:5px 0; }
                .compact-list li { 
                    font-size:8.5pt; margin-bottom:3px; line-height:1.2;
                    list-style-type:disc; 
                }
                
                /* FIRMAS COMPACTAS */
                .signatures { 
                    display:grid; grid-template-columns:1fr 1fr; gap:15px;
                    margin-top:15px; padding-top:10px; border-top:1px solid #ddd;
                }
                .signature { text-align:center; }
                .signature-line { 
                    border-top:1px solid #000; width:80%; margin:0 auto;
                    padding-top:4px; margin-top:25px;
                }
                
                /* FOOTER MINIMALISTA */
                .footer { 
                    font-size:7.5pt; color:#888; text-align:center;
                    margin-top:10px; padding-top:5px; border-top:1px solid #eee;
                }
                
                /* UTILIDADES */
                .text-small { font-size:8pt; }
                .text-muted { color:#666; }
                .text-bold { font-weight:bold; }
                .severity-high { color:#c53030; background:#fff5f5; padding:1px 4px; border-radius:2px; }
                .severity-moderate { color:#d69e2e; background:#fffff0; padding:1px 4px; border-radius:2px; }
                .severity-low { color:#38a169; background:#f0fff4; padding:1px 4px; border-radius:2px; }
                
                @media print {
                    .no-print { display:none !important; }
                    .page-break { page-break-before:always; }
                    .content-compact { max-height:60px; }
                }
            </style>
        </head>
        <body>
            <!-- ENCABEZADO MINIMALISTA -->
            <div class="header">
                <div class="hospital">HOSPITAL CENTRAL</div>
                <div class="title">INFORME CLÍNICO ELECTRÓNICO</div>
                <div class="info-line">
                    Generado: ${formatDateTime(new Date())} | ID: ${record.id.substring(0,8)}
                </div>
            </div>
            
            <!-- PACIENTE Y MÉDICO EN 2 COLUMNAS -->
            <div class="patient-grid">
                <div>
                    <div class="patient-item">
                        <span class="patient-label">Paciente:</span>
                        <span class="patient-value">${patient?.name || 'N/A'}</span>
                    </div>
                    <div class="patient-item">
                        <span class="patient-label">DNI:</span>
                        <span class="patient-value">${patient?.dni || 'N/A'}</span>
                    </div>
                    <div class="patient-item">
                        <span class="patient-label">Edad:</span>
                        <span class="patient-value">${patient?.birthDate ? calculateAge(patient.birthDate) + ' años' : 'N/A'}</span>
                    </div>
                    <div class="patient-item">
                        <span class="patient-label">Teléfono:</span>
                        <span class="patient-value">${patient?.phone || 'N/A'}</span>
                    </div>
                </div>
                <div>
                    <div class="patient-item">
                        <span class="patient-label">Médico:</span>
                        <span class="patient-value">${doctor?.name || 'N/A'}</span>
                    </div>
                    <div class="patient-item">
                        <span class="patient-label">Especialidad:</span>
                        <span class="patient-value">${doctor?.specialty || 'N/A'}</span>
                    </div>
                    <div class="patient-item">
                        <span class="patient-label">Fecha:</span>
                        <span class="patient-value">${formatDateShort(date)}</span>
                    </div>
                    <div class="patient-item">
                        <span class="patient-label">Matrícula:</span>
                        <span class="patient-value">${doctor?.license || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <!-- RESUMEN EN 4 CUADROS -->
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-label">TIPO</div>
                    <div class="summary-value">${getTypeText(record.type)}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">ESTADO</div>
                    <div class="summary-value">${record.status.toUpperCase()}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">SEVERIDAD</div>
                    <div class="summary-value ${'severity-' + getSeverityLevel().toLowerCase()}">
                        ${getSeverityLevel()}
                    </div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">IMC</div>
                    <div class="summary-value">${calculateBMI()}</div>
                </div>
            </div>
            
            <!-- SIGNOS VITALES EN 1 LÍNEA -->
            ${Object.values(vitals).some(v => v !== null && v !== '') ? `
                <div class="section">
                    <div class="section-title">SIGNOS VITALES</div>
                    <div class="vitals-line">
                        ${vitals.bloodPressure ? `
                            <div class="vital-compact">
                                <div class="vital-label-compact">PA</div>
                                <div class="vital-value-compact">${vitals.bloodPressure}</div>
                            </div>
                        ` : '<div class="vital-compact"></div>'}
                        ${vitals.heartRate ? `
                            <div class="vital-compact">
                                <div class="vital-label-compact">FC</div>
                                <div class="vital-value-compact">${vitals.heartRate}</div>
                            </div>
                        ` : '<div class="vital-compact"></div>'}
                        ${vitals.temperature ? `
                            <div class="vital-compact">
                                <div class="vital-label-compact">Temp</div>
                                <div class="vital-value-compact">${vitals.temperature}°</div>
                            </div>
                        ` : '<div class="vital-compact"></div>'}
                        ${vitals.spo2 ? `
                            <div class="vital-compact">
                                <div class="vital-label-compact">O₂</div>
                                <div class="vital-value-compact">${vitals.spo2}%</div>
                            </div>
                        ` : '<div class="vital-compact"></div>'}
                        ${vitals.weight ? `
                            <div class="vital-compact">
                                <div class="vital-label-compact">Peso</div>
                                <div class="vital-value-compact">${vitals.weight}kg</div>
                            </div>
                        ` : '<div class="vital-compact"></div>'}
                        ${vitals.height ? `
                            <div class="vital-compact">
                                <div class="vital-label-compact">Altura</div>
                                <div class="vital-value-compact">${vitals.height}cm</div>
                            </div>
                        ` : '<div class="vital-compact"></div>'}
                    </div>
                </div>
            ` : ''}
            
            <!-- DIAGNÓSTICO -->
            <div class="section">
                <div class="section-title">DIAGNÓSTICO</div>
                <div class="diagnosis-box">${record.diagnosis || 'No especificado'}</div>
            </div>
            
            <!-- EVALUACIÓN CLÍNICA COMPACTA -->
            ${record.symptoms || record.reason ? `
                <div class="section">
                    <div class="section-title">EVALUACIÓN</div>
                    <div class="content-compact">
                        ${record.reason ? `<span class="text-bold">Motivo:</span> ${record.reason}<br><br>` : ''}
                        ${record.symptoms ? `<span class="text-bold">Síntomas:</span> ${record.symptoms}` : ''}
                    </div>
                </div>
            ` : ''}
            
            <!-- TRATAMIENTO -->
            ${record.treatment ? `
                <div class="section">
                    <div class="section-title">TRATAMIENTO</div>
                    <div class="content-compact">${record.treatment}</div>
                </div>
            ` : ''}
            
            <!-- RECETAS COMPACTAS -->
            ${(record.prescriptions && (Array.isArray(record.prescriptions) ? record.prescriptions.length > 0 : record.prescriptions.trim() !== '')) ? `
                <div class="section">
                    <div class="section-title">PRESCRIPCIONES</div>
                    ${createCompactTable(
                        ['Medicamento', 'Dosis', 'Frecuencia', 'Duración'],
                        Array.isArray(record.prescriptions) ? 
                            record.prescriptions.map(pres => [
                                pres.medication || 'N/A',
                                pres.dosage || 'N/A',
                                pres.frequency || 'N/A',
                                pres.duration || 'N/A'
                            ])
                            :
                            [[record.prescriptions, '', '', '']],
                        ['40%', '20%', '20%', '20%']
                    )}
                </div>
            ` : ''}
            
            <!-- RECOMENDACIONES Y SEGUIMIENTO -->
            <div class="section">
                <div class="section-title">RECOMENDACIONES</div>
                <ul class="compact-list">
                    ${getSeverityLevel() === 'ALTO' ? 
                        '<li>SEGUIMIENTO ESTRICTO REQUERIDO - Nivel de severidad ALTO</li>' : 
                      getSeverityLevel() === 'MODERADO' ? 
                        '<li>Seguimiento regular recomendado</li>' : 
                        '<li>Seguimiento según evolución</li>'
                    }
                    ${record.followUp ? 
                        `<li>Control programado: ${formatDateShort(new Date(record.followUp))}</li>` : 
                        '<li>No se programó control de seguimiento</li>'
                    }
                    ${record.recommendations ? `<li>${record.recommendations}</li>` : ''}
                    ${record.notes ? `<li>${record.notes}</li>` : ''}
                    <li class="text-muted">Documento electrónico válido - Confidencial</li>
                </ul>
            </div>
            
            <!-- FIRMAS COMPACTAS -->
            <div class="signatures">
                <div class="signature">
                    <div class="text-bold">${doctor?.name || 'Médico Tratante'}</div>
                    <div class="text-small text-muted">${doctor?.specialty || ''} - Mat. ${doctor?.license || 'N/A'}</div>
                    <div class="signature-line"></div>
                    <div class="text-small">Firma</div>
                </div>
                <div class="signature">
                    <div class="text-bold">HOSPITAL CENTRAL</div>
                    <div class="text-small text-muted">Sello institucional</div>
                    <div class="signature-line"></div>
                    <div class="text-small">Sello y firma</div>
                </div>
            </div>
            
            <!-- FOOTER MINIMALISTA -->
            <div class="footer">
                <div>ID: ${record.id} | Creación: ${formatDateShort(new Date(record.createdAt))}</div>
                <div>Documento electrónico válido | Sistema HCE v2.0</div>
            </div>
            
            <!-- BOTÓN DE IMPRESIÓN OCULTO -->
            <div class="no-print" style="text-align:center; margin-top:10px;">
                <button onclick="window.print()" style="padding:6px 12px; background:#2c5282; color:white; border:none; border-radius:3px; cursor:pointer;">
                    🖨️ Imprimir Informe
                </button>
            </div>
            
            <script>
                // Imprimir automáticamente
                window.onload = function() {
                    setTimeout(() => window.print(), 300);
                    // Cerrar después de 3 segundos si no se imprime
                    setTimeout(() => {
                        if (!window.closed && confirm('¿Cerrar ventana de impresión?')) {
                            window.close();
                        }
                    }, 3000);
                };
                
                // Mostrar más contenido al hacer clic
                document.querySelectorAll('.content-compact').forEach(el => {
                    el.addEventListener('click', function() {
                        this.classList.toggle('content-expand');
                    });
                });
                
                // Ctrl+P para imprimir
                document.addEventListener('keydown', (e) => {
                    if (e.ctrlKey && e.key === 'p') {
                        e.preventDefault();
                        window.print();
                    }
                });
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
}

  // Función para calcular edad
  function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Función para calcular días hasta el próximo control
  function calculateDaysUntil(followUpDate) {
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `En ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    } else if (diffDays === 0) {
      return 'Hoy';
    } else {
      return `Vencido hace ${Math.abs(diffDays)} días`;
    }
  }

  // Configurar event listeners del modal de detalles
  function setupDetailModalListeners(modalContainer, record, patient, doctor, appointment) {
    // Función para cerrar el modal
    const closeModal = () => {
      if (modalContainer.parentNode) {
        modalContainer.parentNode.removeChild(modalContainer);
      }
    };
    
    // Botón de cerrar
    const closeBtn = modalContainer.querySelector('#close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    // Botón de cerrar en header
    const closeHeaderBtn = modalContainer.querySelector('.btn-close-modal');
    if (closeHeaderBtn) {
      closeHeaderBtn.addEventListener('click', closeModal);
    }
    
    // Botón de editar
    const editBtn = modalContainer.querySelector('#edit-record-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        closeModal();
        openModal(record);
      });
    }
    
    // Botón de imprimir
    const printBtn = modalContainer.querySelector('#print-record-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        generateClinicalReport(record);
      });
    }
    
    // Cerrar al hacer clic fuera del contenido
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        closeModal();
      }
    });
    
    // Cerrar con ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    
    document.addEventListener('keydown', escHandler);
    
    // Limpiar event listener cuando se cierra el modal
    const originalCloseModal = closeModal;
    const enhancedCloseModal = () => {
      originalCloseModal();
      document.removeEventListener('keydown', escHandler);
    };
    
    // Reasignar event listeners para usar la función mejorada
    if (closeBtn) {
      closeBtn.removeEventListener('click', closeModal);
      closeBtn.addEventListener('click', enhancedCloseModal);
    }
    
    if (closeHeaderBtn) {
      closeHeaderBtn.removeEventListener('click', closeModal);
      closeHeaderBtn.addEventListener('click', enhancedCloseModal);
    }
    
    modalContainer.removeEventListener('click', (e) => {
      if (e.target === modalContainer) closeModal();
    });
    
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) enhancedCloseModal();
    });
  }

  // ===== INICIALIZACIÓN Y DESTRUCCIÓN =====
  const unsubscribe = init();
  
  return {
    refresh: loadClinicalRecords,
    
    destroy() {
      if (unsubscribe) unsubscribe();
      // También limpiar cualquier modal abierto
      const detailModal = document.querySelector('#view-clinical-record-modal');
      if (detailModal && detailModal.parentNode) {
        detailModal.parentNode.removeChild(detailModal);
      }
    }
  };
}