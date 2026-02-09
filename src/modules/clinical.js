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
        <div class="modal-content" style="max-width: 900px; background: var(--modal-bg);">
          <div class="modal-header" style="flex-direction: column; align-items: center; padding: 1.25rem;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.25rem;">HOSPITAL GENERAL</h2>
            <div style="color: rgba(255,255,255,0.8); font-size: 0.75rem; font-weight: 500;">REGISTRO DE ATENCIÓN MÉDICA</div>
          </div>
          
          <div class="modal-body" style="padding: 1.5rem;">
            <form id="record-form">
              <div style="background: white; border-radius: 4px; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <!-- Información básica -->
                <div class="clinical-section">
                  <div class="clinical-section-header sage">DATOS DE LA CONSULTA</div>
                  <div class="clinical-section-content">
                    <div class="grid grid-2">
                      <div class="form-group">
                        <label class="clinical-label">Paciente *</label>
                        <select class="input" id="form-patient" required></select>
                      </div>
                      <div class="form-group">
                        <label class="clinical-label">Médico *</label>
                        ${role !== 'doctor' ? `
                          <select class="input" id="form-doctor" required></select>
                        ` : `<input type="text" class="input" value="${user.name}" readonly>
                             <input type="hidden" id="form-doctor" value="${user?.doctorId || ''}">`}
                      </div>
                    </div>
                    
                    <div class="grid grid-3">
                      <div class="form-group">
                        <label class="clinical-label">Fecha de Atención *</label>
                        <input type="date" class="input" id="form-date" required value="${new Date().toISOString().split('T')[0]}">
                      </div>
                      <div class="form-group">
                        <label class="clinical-label">Tipo de Atención *</label>
                        <select class="input" id="form-type" required>
                          <option value="consultation">Consulta General</option>
                          <option value="followup">Seguimiento</option>
                          <option value="emergency">Urgencia</option>
                          <option value="lab">Laboratorio</option>
                          <option value="prescription">Receta</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="clinical-label">Estado del Registro</label>
                        <select class="input" id="form-status">
                          <option value="draft">Borrador</option>
                          <option value="finalized">Finalizado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Signos vitales -->
                <div class="clinical-section">
                  <div class="clinical-section-header sage">SIGNOS VITALES</div>
                  <div class="clinical-section-content" style="background: var(--modal-section-green-light);">
                    <div class="grid grid-4">
                      <div class="form-group">
                        <label class="clinical-label">Presión arterial</label>
                        <input type="text" class="input" id="form-bp" placeholder="120/80">
                      </div>
                      <div class="form-group">
                        <label class="clinical-label">Frec. Cardíaca (lpm)</label>
                        <input type="number" class="input" id="form-heart-rate" placeholder="72">
                      </div>
                      <div class="form-group">
                        <label class="clinical-label">Temperatura (°C)</label>
                        <input type="number" class="input" id="form-temperature" placeholder="36.5" step="0.1">
                      </div>
                      <div class="form-group">
                        <label class="clinical-label">Saturación O₂ (%)</label>
                        <input type="number" class="input" id="form-spo2" placeholder="98">
                      </div>
                    </div>
                    <div class="grid grid-2" style="margin-top: 1rem;">
                      <div class="form-group">
                        <label class="clinical-label">Peso (kg)</label>
                        <input type="number" class="input" id="form-weight" placeholder="0.0" step="0.1">
                      </div>
                      <div class="form-group">
                        <label class="clinical-label">Altura (cm)</label>
                        <input type="number" class="input" id="form-height" placeholder="0">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Evaluación -->
                <div class="clinical-section">
                  <div class="clinical-section-header gold">MOTIVO Y SÍNTOMAS</div>
                  <div class="clinical-section-content" style="background: var(--modal-section-gold-light);">
                    <textarea class="input" id="form-reason" rows="2" placeholder="Describa el motivo de la consulta..." style="background: white; border-color: var(--modal-highlight);"></textarea>
                  </div>
                </div>

                <div class="clinical-section">
                  <div class="clinical-section-header olive">DIAGNÓSTICO Y TRATAMIENTO</div>
                  <div class="clinical-section-content" style="background: var(--modal-section-olive-light);">
                    <div class="form-group">
                      <label class="clinical-label">Diagnóstico Principal *</label>
                      <textarea class="input" id="form-diagnosis" rows="2" required placeholder="Diagnóstico..." style="background: white; border-color: var(--modal-section-olive);"></textarea>
                    </div>
                    <div class="form-group">
                      <label class="clinical-label">Plan de Tratamiento</label>
                      <textarea class="input" id="form-treatment" rows="3" placeholder="Instrucciones del médico..." style="background: white; border-color: var(--modal-section-olive);"></textarea>
                    </div>
                  </div>
                </div>

                <!-- Recetas y Notas -->
                <div class="clinical-section">
                  <div class="clinical-section-header forest">RECETAS Y SEGUIMIENTO</div>
                  <div class="clinical-section-content" style="background: var(--modal-section-forest-light);">
                    <div class="form-group">
                      <label class="clinical-label">Prescripciones (Medicamento - Dosis - Frecuencia - Duración)</label>
                      <textarea class="input" id="form-prescriptions" rows="3" placeholder="Ej: Paracetamol - 500mg - cada 8h - 5 días" style="background: white; border-color: var(--modal-section-forest);"></textarea>
                    </div>
                    <div class="grid grid-2">
                       <div class="form-group">
                        <label class="clinical-label">Próximo Control</label>
                        <input type="date" class="input" id="form-followup" style="background: white; border-color: var(--modal-section-forest);">
                      </div>
                      <div class="form-group">
                        <label class="clinical-label">Notas Adicionales</label>
                        <textarea class="input" id="form-notes" rows="1" placeholder="Notas internas..." style="background: white; border-color: var(--modal-section-forest);"></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Campos ocultos para compatibilidad -->
                <textarea id="form-symptoms" class="hidden"></textarea>
                <textarea id="form-recommendations" class="hidden"></textarea>
              </div>
            </form>
          </div>
          
          <div class="modal-footer" style="background: var(--modal-header); border: none;">
            <button class="btn btn-outline" id="btn-cancel" style="background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.3);">Cancelar</button>
            <button class="btn btn-primary" id="btn-save" style="background: #daa722; border: none;">
              ${state.editingId ? 'Actualizar Registro' : 'Guardar Historia Clínica'}
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
    elements.recordsCount.textContent = `${state.filteredRecords.length} ${state.filteredRecords.length === 1 ? 'registro' : 'registros'} `;
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
        <div class="record-item" data-id="${record.id}">
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
        elements.formNotes.value = `Consulta generada desde cita en ${area.name}. ${currentNotes} `;
      }
    }

    // Si hay información de paciente, mostrarla
    if (data.patientId && elements.formPatient) {
      const patient = store.find('patients', data.patientId);
      if (patient) {
        showNotification(`Creando consulta para ${patient.name} `, 'info');
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
          .map(p => `${p.medication} - ${p.dosage} - ${p.frequency} - ${p.duration} `)
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
      <div class="modal-content" style="max-width: 850px; background: var(--modal-bg);">
        <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem;">
          <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem;">HOSPITAL GENERAL</h2>
          <div style="color: rgba(255,255,255,0.9); font-size: 0.875rem; margin-top: 0.25rem; letter-spacing: 0.05em;">HISTORIA CLÍNICA ELECTRÓNICA</div>
        </div>
        
        <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 4px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <!-- Encabezado de Datos -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #666;">N° DE REGISTRO</div>
              <div style="font-family: monospace; font-size: 1.25rem; font-weight: 700;">${record.id.split('_').pop()}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #666;">FECHA DE ATENCIÓN</div>
              <div style="font-size: 1.125rem; font-weight: 700;">
                ${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style="margin-top: 0.25rem;">
                <span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 8px;">Finalizado</span>
                <span style="font-size: 0.75rem; color: #666;">• ${getTypeText(record.type)}</span>
              </div>
            </div>
          </div>

          <!-- Paciente y Médico (Cajas Verdes) -->
          <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: var(--card-patient); border-radius: 4px; padding: 1.25rem; position: relative;">
               <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">👤</div>
                  <div>
                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--modal-text-muted);">PACIENTE</div>
                    <div style="font-weight: 700; font-size: 1.1rem;">${patient?.name || 'María Gómez'}</div>
                  </div>
               </div>
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; font-size: 0.8rem;">
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">DNI</div>
                    <div>${patient?.dni || '12345678A'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">EDAD</div>
                    <div>${patient?.birthDate ? calculateAge(patient.birthDate) + ' años' : '40 años'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">TELÉFONO</div>
                    <div>${patient?.phone || '555-0101'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">EMAIL</div>
                    <div style="word-break: break-all;">${patient?.email || 'maria@email.com'}</div>
                  </div>
               </div>
            </div>

            <div style="background: var(--card-doctor); border-radius: 4px; padding: 1.25rem;">
               <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="width: 40px; height: 40px; background: white; border-radius: 50%; opacity: 0.6;"></div>
                  <div>
                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--modal-text-muted);">MÉDICO TRATANTE</div>
                    <div style="font-weight: 700; font-size: 1.1rem;">${doctor?.name || 'Dra. Ana Ruiz'}</div>
                  </div>
               </div>
               <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; margin-top: 1rem; font-size: 0.8rem;">
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">ESPECIALIDAD</div>
                    <div>${doctor?.specialty || 'Medicina General'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">MATRÍCULA</div>
                    <div>${doctor?.license || 'MG-12345'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">CITA ORIGINAL</div>
                    <div>#${record.appointmentId ? record.appointmentId.split('_').pop() : 'Directo'}</div>
                  </div>
               </div>
            </div>
          </div>

          <!-- Signos Vitales (Cabecera Verde Grisácea) -->
          <div class="clinical-section">
            <div class="clinical-section-header sage" style="background: #5a8973;">SIGNOS VITALES</div>
            <div class="clinical-section-content" style="display: grid; grid-template-columns: repeat(6, 1fr); text-align: center; border: 1px solid #ddd; border-top: none;">
              <div style="padding: 1rem; border-right: 1px solid #ddd;">
                <div style="font-size: 0.65rem; font-weight: 700; color: #666; margin-bottom: 0.5rem;">Presión Arterial</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${vitals.bloodPressure || '-'}</div>
                <div style="font-size: 0.65rem; color: #999;">mmHg</div>
              </div>
              <div style="padding: 1rem; border-right: 1px solid #ddd;">
                <div style="font-size: 0.65rem; font-weight: 700; color: #666; margin-bottom: 0.5rem;">Frec. Cardíaca</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${vitals.heartRate || '-'}</div>
                <div style="font-size: 0.65rem; color: #999;">lpm</div>
              </div>
              <div style="padding: 1rem; border-right: 1px solid #ddd;">
                <div style="font-size: 0.65rem; font-weight: 700; color: #666; margin-bottom: 0.5rem;">Temperatura</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${vitals.temperature || '-'}</div>
                <div style="font-size: 0.65rem; color: #999;">°C</div>
              </div>
              <div style="padding: 1rem; border-right: 1px solid #ddd;">
                <div style="font-size: 0.65rem; font-weight: 700; color: #666; margin-bottom: 0.5rem;">Saturación O₂</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${vitals.spo2 || '-'}</div>
                <div style="font-size: 0.65rem; color: #999;">%</div>
              </div>
              <div style="padding: 1rem; border-right: 1px solid #ddd;">
                <div style="font-size: 0.65rem; font-weight: 700; color: #666; margin-bottom: 0.5rem;">Peso</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${vitals.weight || '-'}</div>
                <div style="font-size: 0.65rem; color: #999;">kg</div>
              </div>
              <div style="padding: 1rem;">
                <div style="font-size: 0.65rem; font-weight: 700; color: #666; margin-bottom: 0.5rem;">Altura</div>
                <div style="font-weight: 700; font-size: 1.1rem;">${vitals.height || '-'}</div>
                <div style="font-size: 0.65rem; color: #999;">cm</div>
              </div>
            </div>
          </div>

          <!-- Motivo de Consulta y Síntomas (CABECERA AMARILLA) -->
          <div class="clinical-section" style="margin-top: 1.5rem;">
            <div class="clinical-section-header gold" style="background: var(--modal-section-gold);">MOTIVO DE CONSULTA Y SÍNTOMAS</div>
            <div class="clinical-section-content" style="background: var(--modal-section-gold-light); padding: 1.25rem;">
               <div style="font-size: 0.75rem; font-weight: 700; color: var(--modal-highlight); margin-bottom: 0.5rem;">SÍNTOMAS REPORTADOS</div>
               <div style="font-size: 0.95rem; line-height: 1.5;">${record.reason || ''} ${record.symptoms || 'No especificados'}</div>
            </div>
          </div>

          <!-- Diagnóstico (CABECERA OLIVA) -->
          <div class="clinical-section" style="margin-top: 1.5rem;">
            <div class="clinical-section-header olive" style="background: var(--modal-section-olive);">DIAGNÓSTICO</div>
            <div class="clinical-section-content" style="background: var(--modal-section-olive-light); padding: 1.25rem;">
               <div style="font-size: 0.95rem; font-weight: 700;">${record.diagnosis || 'Resultados pendientes'}</div>
            </div>
          </div>

          <!-- Tratamiento Prescrito (CABECERA OLIVA) -->
          <div class="clinical-section" style="margin-top: 1.5rem;">
            <div class="clinical-section-header olive" style="background: var(--modal-section-olive);">TRATAMIENTO PRESCRITO</div>
            <div class="clinical-section-content" style="background: var(--modal-section-olive-light); padding: 1.25rem;">
               <div style="font-size: 0.95rem; line-height: 1.5;">${record.treatment || 'Seguimiento según evolución'}</div>
            </div>
          </div>

          <!-- Recetas Médicas (CABECERA BOSQUE) -->
          <div class="clinical-section" style="margin-top: 1.5rem;">
            <div class="clinical-section-header forest" style="background: var(--modal-section-forest);">RECETAS MÉDICAS</div>
            <div class="clinical-section-content" style="background: var(--modal-section-forest-light); padding: 0;">
               <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                 <thead>
                    <tr style="text-align: left; color: var(--modal-text-muted);">
                      <th style="padding: 0.75rem 1.25rem; font-weight: 700;">MEDICAMENTO</th>
                      <th style="padding: 0.75rem; font-weight: 700;">DOSIS</th>
                      <th style="padding: 0.75rem; font-weight: 700;">FRECUENCIA</th>
                      <th style="padding: 0.75rem; font-weight: 700;">DURACIÓN</th>
                    </tr>
                 </thead>
                 <tbody>
                    ${record.prescriptions && Array.isArray(record.prescriptions) ?
        record.prescriptions.map(p => `
                        <tr>
                          <td style="padding: 0.75rem 1.25rem; font-weight: 700;">${p.medication}</td>
                          <td style="padding: 0.75rem;">${p.dosage}</td>
                          <td style="padding: 0.75rem;">${p.frequency}</td>
                          <td style="padding: 0.75rem;">${p.duration}</td>
                        </tr>
                      `).join('') : `
                        <tr>
                          <td colspan="4" style="padding: 1.25rem; text-align: center; color: var(--modal-text-muted);">Sin prescripciones activas</td>
                        </tr>
                      `
      }
                 </tbody>
               </table>
            </div>
          </div>

          <!-- Observaciones y Seguimiento (CABECERA BOSQUE) -->
          <div class="clinical-section" style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: none;">
            <div style="background: var(--modal-section-forest-light); padding: 1.25rem; border: 1px solid var(--modal-border); border-right: none; border-radius: 4px 0 0 4px;">
               <div class="clinical-section-header forest" style="background: var(--modal-section-forest); margin: -1.25rem -1.25rem 1.25rem -1.25rem;">OBSERVACIONES Y SEGUIMIENTO</div>
               <div style="margin-bottom: 1rem;">
                  <div style="font-size: 0.7rem; font-weight: 700; color: var(--modal-text-muted);">NOTAS ADICIONALES</div>
                  <div style="font-size: 0.85rem;">${record.notes || 'Ninguna observación relevante'}</div>
               </div>
               <div>
                  <div style="font-size: 0.7rem; font-weight: 700; color: var(--modal-text-muted);">RECOMENDACIONES</div>
                  <div style="font-size: 0.85rem;">${record.recommendations || 'Acudir a urgencias si presenta síntomas de alarma'}</div>
               </div>
            </div>
            
            <div style="background: var(--modal-section-forest-light); padding: 1.25rem; border: 1px solid var(--modal-border); border-radius: 0 4px 4px 0; display: flex; align-items: center; justify-content: center;">
               <div style="background: var(--modal-highlight-light); border: 1px solid var(--modal-highlight); padding: 1rem; border-radius: 4px; width: 100%;">
                  <div style="font-size: 0.65rem; font-weight: 700; color: var(--modal-highlight);">PRÓXIMO CONTROL</div>
                  <div style="font-weight: 700; font-size: 1rem; margin-top: 0.25rem;">
                    ${record.followUp ? new Date(record.followUp).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'A demanda'}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--modal-highlight); margin-top: 0.25rem;">
                    ${record.followUp ? 'En ' + calculateDaysUntil(record.followUp).replace('en ', '') : ''}
                  </div>
               </div>
            </div>
          </div>

          <!-- Footer del Documento -->
          <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; display: flex; justify-content: space-between; font-size: 0.7rem; color: #999;">
            <div>
              <div style="font-weight: 700; color: #666;">REGISTRO CREADO POR</div>
              <div>${user.name}</div>
              <div>${new Date(record.createdAt).toLocaleString()}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; color: #666;">ÚLTIMA ACTUALIZACIÓN</div>
              <div>${record.updatedAt ? new Date(record.updatedAt).toLocaleString() : 'Sin modificaciones'}</div>
            </div>
          </div>
        </div>
        
        <div style="padding: 1rem 1.5rem; text-align: center; color: #666; font-size: 0.75rem; border-top: 1px solid var(--modal-border);">
            Documento clínico electrónico • Generado automáticamente por Hospital General
        </div>

        <div class="modal-footer" style="background: var(--modal-header); border: none; padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
          <button class="btn btn-primary" style="background: #4a7963; border: none; padding: 0.5rem 1rem;" id="print-record-btn">📄 Imprimir</button>
          <button class="btn btn-primary" style="background: #7c9b1f; border: none; padding: 0.5rem 1rem;" id="edit-record-btn" data-id="${record.id}">✏️ Editar</button>
          <button class="btn btn-danger" style="background: #d55050; border: none; padding: 0.5rem 1rem;" id="close-modal-btn">✕ Cerrar</button>
        </div>
      </div>
      `;

    // Agregar al DOM
    document.body.appendChild(modalContainer);

    // Configurar event listeners del modal
    setupDetailModalListeners(modalContainer, record, patient, doctor, appointment);
  }

  // ===== FUNCIÓN PARA IMPRIMIR INFORME CLÍNICO EN FORMATO OFICIO - UNA SOLA PÁGINA =====
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

    // Funciones de utilidad
    const formatDateLong = (dateObj) => dateObj.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const formatDateShort = (dateObj) => dateObj.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const calculateAge = (birthDate) => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    // Calcular IMC
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
        <title>Historia Clínica - ${patient?.name || 'Paciente'}</title>
        <style>
          /* TAMAÑO OFICIO: 215.9mm × 330.2mm - MARGENES REDUCIDOS */
          @page {
            size: 215.9mm 330.2mm;
            margin: 8mm 12mm 8mm 12mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', 'Roboto', sans-serif;
          }
          
          body {
            width: 191.9mm; /* Ancho total menos márgenes */
            height: 314.2mm; /* Alto total menos márgenes */
            color: #333;
            font-size: 9pt;
            line-height: 1.2;
          }
          
          /* CONTENEDOR PRINCIPAL - COMPACTO */
          .page-container {
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          
          /* ENCABEZADO COMPACTO */
          .header-compact {
            text-align: center;
            padding: 3mm 0 4mm 0;
            margin-bottom: 3mm;
            border-bottom: 1pt solid #2c5282;
          }
          
          .hospital-name-compact {
            font-size: 14pt;
            font-weight: 700;
            color: #1a365d;
            letter-spacing: 0.5px;
            margin-bottom: 1mm;
          }
          
          .document-title-compact {
            font-size: 12pt;
            font-weight: 700;
            color: #2c5282;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 2mm 0;
          }
          
          .document-subtitle-compact {
            font-size: 9pt;
            color: #718096;
            font-weight: 500;
          }
          
          /* INFORMACIÓN DEL REGISTRO - UNA LÍNEA */
          .record-info-compact {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5mm;
            padding: 2mm 3mm;
            background: #f8fafc;
            border: 0.5pt solid #e2e8f0;
            border-radius: 2px;
            font-size: 9pt;
          }
          
          .record-id-compact {
            font-weight: 700;
            color: #4a5568;
          }
          
          .record-date-compact {
            text-align: right;
            font-weight: 700;
            color: #4a5568;
          }
          
          .record-meta-compact {
            font-size: 8pt;
            color: #718096;
            margin-top: 0.5mm;
          }
          
          /* DATOS DE PACIENTE Y MÉDICO - COMPACTO */
          .data-grid-compact {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4mm;
            margin-bottom: 5mm;
          }
          
          .data-card-compact {
            padding: 3mm;
            border: 0.5pt solid #cbd5e0;
            border-radius: 2px;
            font-size: 9pt;
          }
          
          .data-card-patient {
            background: #f0fff4;
            border-color: #38a169;
          }
          
          .data-card-doctor {
            background: #ebf8ff;
            border-color: #4299e1;
          }
          
          .data-card-header {
            display: flex;
            align-items: center;
            margin-bottom: 2mm;
          }
          
          .data-card-icon {
            width: 8mm;
            height: 8mm;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10pt;
            margin-right: 2mm;
            border: 0.5pt solid #cbd5e0;
          }
          
          .data-card-title {
            font-size: 8pt;
            font-weight: 700;
            color: #4a5568;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .data-card-name {
            font-size: 10pt;
            font-weight: 700;
            color: #2d3748;
          }
          
          .data-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1mm;
            font-size: 8pt;
          }
          
          .data-detail-label {
            font-weight: 600;
            color: #718096;
          }
          
          .data-detail-value {
            font-weight: 500;
          }
          
          /* SIGNOS VITALES - COMPACTO */
          .vitals-compact {
            margin-bottom: 5mm;
          }
          
          .section-header-compact {
            background: #5a8973;
            color: white;
            padding: 2mm 3mm;
            font-weight: 700;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-radius: 1px 1px 0 0;
          }
          
          .vitals-grid-compact {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            text-align: center;
            border: 0.5pt solid #cbd5e0;
            border-top: none;
          }
          
          .vital-item-compact {
            padding: 2mm 1mm;
            border-right: 0.5pt solid #cbd5e0;
          }
          
          .vital-item-compact:last-child {
            border-right: none;
          }
          
          .vital-label-compact {
            font-size: 7pt;
            font-weight: 700;
            color: #4a5568;
            margin-bottom: 0.5mm;
          }
          
          .vital-value-compact {
            font-size: 10pt;
            font-weight: 700;
            color: #2d3748;
          }
          
          .vital-unit-compact {
            font-size: 7pt;
            color: #a0aec0;
          }
          
          /* SECCIONES DE CONTENIDO - COMPACTAS */
          .content-section-compact {
            margin-bottom: 4mm;
          }
          
          .section-header-gold-compact {
            background: #d69e2e;
            color: white;
            padding: 2mm 3mm;
            font-weight: 700;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-radius: 1px 1px 0 0;
          }
          
          .section-header-olive-compact {
            background: #689f38;
            color: white;
            padding: 2mm 3mm;
            font-weight: 700;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-radius: 1px 1px 0 0;
          }
          
          .section-header-forest-compact {
            background: #276749;
            color: white;
            padding: 2mm 3mm;
            font-weight: 700;
            font-size: 9pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-radius: 1px 1px 0 0;
          }
          
          .section-content-compact {
            padding: 3mm;
            border: 0.5pt solid #e2e8f0;
            border-top: none;
            border-radius: 0 0 1px 1px;
            min-height: 10mm;
            font-size: 9pt;
            line-height: 1.3;
          }
          
          /* MOTIVO Y DIAGNÓSTICO EN UNA FILA */
          .diagnosis-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4mm;
            margin-bottom: 4mm;
          }
          
          /* TRATAMIENTO COMPACTO */
          .treatment-compact {
            margin-bottom: 4mm;
          }
          
          /* TABLA DE RECETAS COMPACTA */
          .prescriptions-table-compact {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1mm;
            font-size: 8pt;
          }
          
          .prescriptions-table-compact th {
            background: #e2e8f0;
            color: #4a5568;
            font-weight: 700;
            text-align: left;
            padding: 1.5mm 2mm;
            border: 0.5pt solid #cbd5e0;
          }
          
          .prescriptions-table-compact td {
            padding: 1.5mm 2mm;
            border: 0.5pt solid #cbd5e0;
          }
          
          /* SEGUIMIENTO COMPACTO */
          .followup-compact {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4mm;
            margin-top: 2mm;
          }
          
          .notes-compact {
            padding: 2mm;
            border: 0.5pt solid #cbd5e0;
            border-radius: 1px;
            font-size: 8pt;
          }
          
          .next-control-compact {
            padding: 2mm;
            border: 0.5pt solid #38a169;
            border-radius: 1px;
            background: #f0fff4;
            text-align: center;
          }
          
          .next-control-label {
            font-size: 8pt;
            font-weight: 700;
            color: #276749;
          }
          
          .next-control-date {
            font-size: 9pt;
            font-weight: 700;
            color: #2d3748;
            margin: 1mm 0;
          }
          
          /* PIE DE PÁGINA COMPACTO */
          .footer-compact {
            margin-top: auto;
            padding-top: 3mm;
            border-top: 0.5pt solid #e2e8f0;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 3mm;
            font-size: 7pt;
            color: #718096;
          }
          
          .footer-section-compact {
            flex: 1;
          }
          
          .footer-label-compact {
            font-weight: 700;
            color: #4a5568;
            margin-bottom: 0.5mm;
          }
          
          /* FIRMA COMPACTA */
          .signature-compact {
            margin-top: 5mm;
            text-align: right;
          }
          
          .signature-box-compact {
            display: inline-block;
            text-align: center;
            width: 50mm;
          }
          
          .signature-line-compact {
            border-top: 0.75pt solid #333;
            width: 100%;
            margin-bottom: 1mm;
          }
          
          .doctor-name-compact {
            font-size: 10pt;
            font-weight: 700;
            color: #2d3748;
          }
          
          .doctor-info-compact {
            font-size: 8pt;
            color: #718096;
          }
          
          /* ESTILOS DE IMPRESIÓN */
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          /* BADGES COMPACTOS */
          .badge-compact {
            display: inline-block;
            padding: 0.5mm 1mm;
            font-size: 7pt;
            font-weight: 600;
            border-radius: 1px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }
          
          .badge-success-compact {
            background: #c6f6d5;
            color: #22543d;
            border: 0.5pt solid #9ae6b4;
          }
          
          .badge-warning-compact {
            background: #feebc8;
            color: #744210;
            border: 0.5pt solid #fbd38d;
          }
          
          /* UTILIDADES */
          .text-small {
            font-size: 8pt;
          }
          
          .text-xsmall {
            font-size: 7pt;
          }
          
          .mb-1 {
            margin-bottom: 1mm;
          }
          
          .mb-2 {
            margin-bottom: 2mm;
          }
          
          .mt-1 {
            margin-top: 1mm;
          }
          
          .mt-2 {
            margin-top: 2mm;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <!-- ENCABEZADO -->
          <div class="header-compact">
            <div class="hospital-name-compact">HOSPITAL GENERAL</div>
            <div class="document-title-compact">INFORME MÉDICO</div>
            <div class="document-subtitle-compact">Registro de Atención Clínica</div>
          </div>
          
          <!-- INFORMACIÓN DEL REGISTRO -->
          <div class="record-info-compact">
            <div>
              <div class="record-id-compact">Registro: ${record.id.split('_').pop()}</div>
              <div class="record-meta-compact">
                <span class="badge-compact ${record.status === 'finalized' ? 'badge-success-compact' : 'badge-warning-compact'}">
                  ${record.status === 'finalized' ? 'Finalizado' : 'Borrador'}
                </span>
                <span> • ${getTypeText(record.type)}</span>
              </div>
            </div>
            <div class="record-date-compact">
              <div>${formatDateShort(date)}</div>
              <div class="record-meta-compact">${date.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
            </div>
          </div>
          
          <!-- DATOS DE PACIENTE Y MÉDICO -->
          <div class="data-grid-compact mb-2">
            <!-- PACIENTE -->
            <div class="data-card-compact data-card-patient">
              <div class="data-card-header">
                <div class="data-card-icon">👤</div>
                <div>
                  <div class="data-card-title">PACIENTE</div>
                  <div class="data-card-name">${patient?.name || 'Nombre del Paciente'}</div>
                </div>
              </div>
              <div class="data-details-grid">
                <div>
                  <div class="data-detail-label">DNI</div>
                  <div class="data-detail-value">${patient?.dni || 'N/A'}</div>
                </div>
                <div>
                  <div class="data-detail-label">EDAD</div>
                  <div class="data-detail-value">${patient?.birthDate ? calculateAge(patient.birthDate) + ' años' : 'N/A'}</div>
                </div>
                <div>
                  <div class="data-detail-label">TELÉFONO</div>
                  <div class="data-detail-value">${patient?.phone || 'N/A'}</div>
                </div>
                <div>
                  <div class="data-detail-label">EMAIL</div>
                  <div class="data-detail-value text-xsmall">${patient?.email || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <!-- MÉDICO -->
            <div class="data-card-compact data-card-doctor">
              <div class="data-card-header">
                <div class="data-card-icon">🩺</div>
                <div>
                  <div class="data-card-title">MÉDICO</div>
                  <div class="data-card-name">${doctor?.name || 'Nombre del Médico'}</div>
                </div>
              </div>
              <div class="data-details-grid">
                <div>
                  <div class="data-detail-label">ESPECIALIDAD</div>
                  <div class="data-detail-value">${doctor?.specialty || 'Medicina General'}</div>
                </div>
                <div>
                  <div class="data-detail-label">MATRÍCULA</div>
                  <div class="data-detail-value">${doctor?.license || 'N/A'}</div>
                </div>
                <div>
                  <div class="data-detail-label">CITA</div>
                  <div class="data-detail-value">${record.appointmentId ? '#' + record.appointmentId.split('_').pop() : 'Directa'}</div>
                </div>
                <div>
                  <div class="data-detail-label">REGISTRO</div>
                  <div class="data-detail-value">${formatDateShort(new Date(record.createdAt || Date.now()))}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- SIGNOS VITALES -->
          <div class="vitals-compact mb-2">
            <div class="section-header-compact">SIGNOS VITALES</div>
            <div class="vitals-grid-compact">
              <div class="vital-item-compact">
                <div class="vital-label-compact">P. ARTERIAL</div>
                <div class="vital-value-compact">${vitals.bloodPressure || '-'}</div>
                <div class="vital-unit-compact">mmHg</div>
              </div>
              <div class="vital-item-compact">
                <div class="vital-label-compact">F. CARDÍACA</div>
                <div class="vital-value-compact">${vitals.heartRate || '-'}</div>
                <div class="vital-unit-compact">lpm</div>
              </div>
              <div class="vital-item-compact">
                <div class="vital-label-compact">TEMPERATURA</div>
                <div class="vital-value-compact">${vitals.temperature || '-'}</div>
                <div class="vital-unit-compact">°C</div>
              </div>
              <div class="vital-item-compact">
                <div class="vital-label-compact">SAT. O₂</div>
                <div class="vital-value-compact">${vitals.spo2 || '-'}</div>
                <div class="vital-unit-compact">%</div>
              </div>
              <div class="vital-item-compact">
                <div class="vital-label-compact">PESO</div>
                <div class="vital-value-compact">${vitals.weight || '-'}</div>
                <div class="vital-unit-compact">kg</div>
              </div>
              <div class="vital-item-compact">
                <div class="vital-label-compact">ALTURA</div>
                <div class="vital-value-compact">${vitals.height || '-'}</div>
                <div class="vital-unit-compact">cm</div>
              </div>
            </div>
            ${vitals.weight && vitals.height ? `
              <div style="text-align: center; margin-top: 1mm; font-size: 8pt; color: #4a5568;">
                <strong>IMC:</strong> ${calculateBMI()}
              </div>
            ` : ''}
          </div>
          
          <!-- MOTIVO Y DIAGNÓSTICO EN UNA FILA -->
          <div class="diagnosis-row mb-2">
            <!-- MOTIVO -->
            <div class="content-section-compact">
              <div class="section-header-gold-compact">MOTIVO DE CONSULTA</div>
              <div class="section-content-compact">
                <div class="text-small">${record.reason || ''} ${record.symptoms || 'No se reportaron síntomas'}</div>
              </div>
            </div>
            
            <!-- DIAGNÓSTICO -->
            <div class="content-section-compact">
              <div class="section-header-olive-compact">DIAGNÓSTICO</div>
              <div class="section-content-compact" style="font-weight: 700;">
                ${record.diagnosis || 'No se estableció diagnóstico'}
              </div>
            </div>
          </div>
          
          <!-- TRATAMIENTO -->
          <div class="treatment-compact mb-2">
            <div class="section-header-olive-compact">PLAN DE TRATAMIENTO</div>
            <div class="section-content-compact">
              <div class="text-small">${record.treatment || 'No se prescribió tratamiento específico'}</div>
            </div>
          </div>
          
          <!-- RECETAS -->
          <div class="content-section-compact mb-2">
            <div class="section-header-forest-compact">RECETAS MÉDICAS</div>
            <div class="section-content-compact">
              ${record.prescriptions && Array.isArray(record.prescriptions) && record.prescriptions.length > 0 ? `
                <table class="prescriptions-table-compact">
                  <thead>
                    <tr>
                      <th style="width: 35%;">MEDICAMENTO</th>
                      <th style="width: 20%;">DOSIS</th>
                      <th style="width: 25%;">FRECUENCIA</th>
                      <th style="width: 20%;">DURACIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${record.prescriptions.map(pres => `
                      <tr>
                        <td><strong>${pres.medication || 'N/A'}</strong></td>
                        <td>${pres.dosage || 'N/A'}</td>
                        <td>${pres.frequency || 'N/A'}</td>
                        <td>${pres.duration || 'N/A'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : `
                <div class="text-small">No se prescribieron medicamentos.</div>
              `}
            </div>
          </div>
          
          <!-- SEGUIMIENTO -->
          <div class="content-section-compact mb-2">
            <div class="section-header-forest-compact">SEGUIMIENTO</div>
            <div class="section-content-compact">
              <div class="followup-compact">
                <div class="notes-compact">
                  <div style="font-weight: 700; color: #4a5568; margin-bottom: 1mm;">NOTAS Y RECOMENDACIONES</div>
                  <div class="text-small">
                    ${record.notes ? `<div class="mb-1">${record.notes}</div>` : ''}
                    ${record.recommendations ? `<div><strong>Recomendaciones:</strong> ${record.recommendations}</div>` : ''}
                  </div>
                </div>
                
                <div class="next-control-compact">
                  <div class="next-control-label">PRÓXIMO CONTROL</div>
                  <div class="next-control-date">
                    ${record.followUp ? formatDateShort(new Date(record.followUp)) : 'No programado'}
                  </div>
                  ${record.followUp ? `
                    <div class="text-xsmall" style="color: #38a169;">
                      ${calculateDaysUntil(record.followUp)}
                    </div>
                  ` : ''}
                  <div class="text-xsmall mt-1" style="color: #718096;">
                    Consultar ante síntomas de alarma
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- PIE DE PÁGINA -->
          <div class="footer-compact">
            <div class="footer-section-compact">
              <div class="footer-label-compact">CREADO POR</div>
              <div>${user.name}</div>
              <div class="text-xsmall">${new Date(record.createdAt || Date.now()).toLocaleDateString('es-ES')}</div>
            </div>
            
            <div class="footer-section-compact">
              <div class="footer-label-compact">ACTUALIZACIÓN</div>
              <div>${record.updatedAt ? new Date(record.updatedAt).toLocaleDateString('es-ES') : 'Sin cambios'}</div>
            </div>
            
            <div class="footer-section-compact">
              <div class="footer-label-compact">DOCUMENTO</div>
              <div>Historia Clínica Electrónica</div>
              <div class="text-xsmall">Válido sin firma manuscrita</div>
            </div>
          </div>
          
          <!-- FIRMA -->
          <div class="signature-compact">
            <div class="signature-box-compact">
              <div class="signature-line-compact"></div>
              <div class="doctor-name-compact">${doctor?.name || 'Médico Tratante'}</div>
              <div class="doctor-info-compact">
                ${doctor?.specialty || 'Especialidad'} • Mat. ${doctor?.license || 'N/A'}
              </div>
              <div class="doctor-info-compact mt-1">
                ${formatDateShort(new Date())}
              </div>
            </div>
          </div>
          
          <!-- BOTÓN DE IMPRESIÓN -->
          <div class="no-print" style="position: fixed; top: 5mm; right: 5mm; z-index: 1000;">
            <button onclick="window.print()" style="
              padding: 3mm 4mm;
              background: #2c5282;
              color: white;
              border: none;
              border-radius: 2px;
              font-size: 9pt;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            ">
              📄 IMPRIMIR
            </button>
          </div>
        </div>
        
        <script>
          // Auto-impresión después de cargar
          window.onload = function() {
            setTimeout(() => {
              window.print();
              setTimeout(() => {
                window.close();
              }, 1000);
            }, 300);
          };
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
      return `En ${diffDays} ${diffDays === 1 ? 'día' : 'días'} `;
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
      if (modalContainer && modalContainer.parentNode) {
        modalContainer.parentNode.removeChild(modalContainer);
      }
    };

    // Botón de cerrar - CORREGIDO
    const closeBtn = modalContainer.querySelector('#close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
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
    const cleanup = () => {
      document.removeEventListener('keydown', escHandler);
      if (closeBtn) closeBtn.removeEventListener('click', closeModal);
      if (editBtn) editBtn.removeEventListener('click', () => {});
      if (printBtn) printBtn.removeEventListener('click', () => {});
      modalContainer.removeEventListener('click', (e) => {
        if (e.target === modalContainer) closeModal();
      });
    };

    // Agregar cleanup cuando se cierra el modal
    const originalCloseModal = closeModal;
    const enhancedCloseModal = () => {
      cleanup();
      originalCloseModal();
    };

    // Reasignar event listeners para usar la función mejorada
    if (closeBtn) {
      closeBtn.removeEventListener('click', closeModal);
      closeBtn.addEventListener('click', enhancedCloseModal);
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