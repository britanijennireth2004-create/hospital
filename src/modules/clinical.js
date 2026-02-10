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
        // Verificar permisos antes de mostrar
        if (hasPermissionToView(record)) {
          viewRecordDetail(record);
        } else {
          showNotification('No tiene permiso para ver este registro', 'error');
        }
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

  // ===== FUNCIONES DE SEGURIDAD Y PERMISOS =====

  // Verificar si el usuario tiene permiso para ver un registro específico
  function hasPermissionToView(record) {
    if (role === 'admin') return true;

    if (role === 'doctor') {
      // Los doctores pueden ver sus propios registros y todos los registros si están asignados
      // En este caso, permitimos que vean todos para propósitos del sistema
      return true;
    }

    if (role === 'patient') {
      // Los pacientes solo pueden ver sus propios registros
      return record.patientId === user.patientId;
    }

    return false;
  }

  // Verificar si el usuario tiene permiso para editar un registro específico
  function hasPermissionToEdit(record) {
    if (role === 'admin') return true;

    if (role === 'doctor') {
      // Los doctores solo pueden editar sus propios registros
      return record.doctorId === user.doctorId;
    }

    // Los pacientes NUNCA pueden editar registros
    // Las enfermeras pueden editar los registros que ellas crearon
    if (role === 'nurse') {
      return record.createdBy === user.id;
    }

    return false;
  }

  // Verificar si el usuario puede crear nuevos registros
  function canCreateRecords() {
    return ['admin', 'doctor', 'nurse'].includes(role);
  }

  // ===== FUNCIONES PRINCIPALES =====

  // Cargar registros clínicos
  function loadClinicalRecords() {
    let records = store.get('clinicalRecords');

    // Filtrar por rol y permisos
    if (role === 'doctor' && user?.doctorId) {
      // Los doctores ven todos los registros para propósitos del sistema
      // Si se quiere restringir a solo sus registros, usar:
      // records = records.filter(record => record.doctorId === user.doctorId);
    } else if (role === 'patient' && user?.patientId) {
      // Los pacientes solo ven sus propios registros
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

      // Filtro por médico (solo para admin y doctor)
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
    const canCreate = canCreateRecords();
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
              
              ${role !== 'doctor' && role !== 'patient' ? `
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
              <h3 style="margin: 0;">${isPatient ? 'Mi Historia Clínica' : 'Registros Clínicos'}</h3>
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
        <div class="modal-content" style="max-width: 950px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL GENERAL</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              ${state.editingId ? 'ACTUALIZACIÓN DE HISTORIA CLÍNICA' : 'NUEVO REGISTRO DE ATENCIÓN MÉDICA'}
            </div>
            <button class="btn-close-modal" id="btn-close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 70vh; overflow-y: auto;">
            <form id="record-form">
              <!-- Información de Cabecera -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; border: 1px solid #e2e8f0; margin-bottom: 2rem;">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--modal-header); margin-bottom: 1.25rem; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.5rem;">📌 DATOS GENERALES DE LA ATENCIÓN</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                   <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: #4a5568; font-size: 0.8rem;">PACIENTE *</label>
                      <select class="input" id="form-patient" required style="border-color: #cbd5e1;"></select>
                   </div>
                   <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: #4a5568; font-size: 0.8rem;">MÉDICO RESPONSABLE *</label>
                      ${role !== 'doctor' ? `
                        <select class="input" id="form-doctor" required style="border-color: #cbd5e1;"></select>
                      ` : `
                        <input type="text" class="input" value="${user.name}" readonly style="background: #edf2f7; border-color: #cbd5e1;">
                        <input type="hidden" id="form-doctor" value="${user?.doctorId || ''}">
                      `}
                   </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-top: 1.25rem;">
                   <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: #4a5568; font-size: 0.8rem;">FECHA *</label>
                      <input type="date" class="input" id="form-date" required value="${new Date().toISOString().split('T')[0]}" style="border-color: #cbd5e1;">
                   </div>
                   <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: #4a5568; font-size: 0.8rem;">TIPO DE ATENCIÓN *</label>
                      <select class="input" id="form-type" required style="border-color: #cbd5e1;">
                        <option value="consultation">Consulta General</option>
                        <option value="followup">Seguimiento</option>
                        <option value="emergency">Urgencia</option>
                        <option value="lab">Laboratorio</option>
                        <option value="prescription">Receta</option>
                      </select>
                   </div>
                   <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: #4a5568; font-size: 0.8rem;">ESTADO</label>
                      <select class="input" id="form-status" style="border-color: #cbd5e1; font-weight: 700;">
                        <option value="draft">Borrador (Edición)</option>
                        <option value="finalized">Finalizado (Solo lectura)</option>
                      </select>
                   </div>
                </div>
              </div>

              <!-- Signos Vitales (Sección Verde) -->
              <div style="background: var(--modal-section-forest-light); border-radius: 8px; padding: 1.5rem; border: 1px solid var(--modal-section-forest); margin-bottom: 2rem;">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1.25rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">🌡️ SIGNOS VITALES Y BIOMETRÍA</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-section-forest); font-size: 0.75rem;">PRESIÓN ARTERIAL</label>
                    <input type="text" class="input" id="form-bp" placeholder="120/80" style="background: white;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-section-forest); font-size: 0.75rem;">FREC. CARDÍACA (LPM)</label>
                    <input type="number" class="input" id="form-heart-rate" placeholder="72" style="background: white;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-section-forest); font-size: 0.75rem;">TEMP. (°C)</label>
                    <input type="number" class="input" id="form-temperature" placeholder="36.5" step="0.1" style="background: white;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-section-forest); font-size: 0.75rem;">SAT. O₂ (%)</label>
                    <input type="number" class="input" id="form-spo2" placeholder="98" style="background: white;">
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-section-forest); font-size: 0.75rem;">PESO (KG)</label>
                    <input type="number" class="input" id="form-weight" placeholder="0.0" step="0.1" style="background: white;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-section-forest); font-size: 0.75rem;">ALTURA (CM)</label>
                    <input type="number" class="input" id="form-height" placeholder="0" style="background: white;">
                  </div>
                </div>
              </div>

              <!-- Motivo y Síntomas (Sección Oro) -->
              <div style="background: var(--modal-section-gold-light); border-radius: 8px; padding: 1.5rem; border: 1px solid var(--modal-section-gold); margin-bottom: 2rem;">
                <div style="font-size: 0.85rem; font-weight: 700; color: #b8860b; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">📋 MOTIVO Y SÍNTOMAS</div>
                <textarea class="input" id="form-reason" rows="2" placeholder="Describa el motivo de la consulta..." style="background: white; border-color: var(--modal-section-gold);"></textarea>
              </div>

              <!-- Diagnóstico y Tratamiento (Sección Oliva) -->
              <div style="background: var(--modal-section-olive-light); border-radius: 8px; padding: 1.5rem; border: 1px solid var(--modal-section-olive); margin-bottom: 2rem;">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--modal-section-olive); margin-bottom: 1.25rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">🩺 EVALUACIÓN MÉDICA</div>
                <div class="form-group" style="margin-bottom: 1rem;">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-section-olive); font-size: 0.75rem;">DIAGNÓSTICO PRINCIPAL *</label>
                  <textarea class="input" id="form-diagnosis" rows="2" required placeholder="Diagnóstico..." style="background: white; border-color: var(--modal-section-olive); font-weight: 700;"></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-section-olive); font-size: 0.75rem;">PLAN DE TRATAMIENTO</label>
                  <textarea class="input" id="form-treatment" rows="3" placeholder="Instrucciones del médico..." style="background: white; border-color: var(--modal-section-olive);"></textarea>
                </div>
              </div>

              <!-- Recetas y Seguimiento -->
              <div style="background: #f1f5f9; border-radius: 8px; padding: 1.5rem; border: 1px solid #cbd5e1;">
                <div style="font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 1.25rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">💊 PRESCRIPCIONES Y SEGUIMIENTO</div>
                <div class="form-group" style="margin-bottom: 1rem;">
                  <label class="form-label" style="font-weight: 700; color: #475569; font-size: 0.75rem;">DETALLE DE MEDICACIÓN</label>
                  <textarea class="input" id="form-prescriptions" rows="3" placeholder="Medicamento - Dosis - Frecuencia..." style="background: white; border-color: #cbd5e1;"></textarea>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                   <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: #475569; font-size: 0.75rem;">PRÓXIMO CONTROL</label>
                      <input type="date" class="input" id="form-followup" style="background: white; border-color: #cbd5e1;">
                   </div>
                   <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: #475569; font-size: 0.75rem;">NOTAS ADICIONALES</label>
                      <textarea class="input" id="form-notes" rows="1" placeholder="Notas internas..." style="background: white; border-color: #cbd5e1;"></textarea>
                   </div>
                </div>
              </div>

              <!-- Campos ocultos para compatibilidad -->
              <textarea id="form-symptoms" class="hidden"></textarea>
              <textarea id="form-recommendations" class="hidden"></textarea>
            </form>
          </div>
          
          <div class="modal-footer" style="background: var(--modal-header); padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
            <button class="btn" id="btn-cancel" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
            <button class="btn" id="btn-save" style="background: white; color: var(--modal-header); border: none; padding: 0.75rem 2.5rem; font-weight: 800; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
              ${state.editingId ? 'ACTUALIZAR REGISTRO' : 'FINALIZAR HISTORIA CLÍNICA'}
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
        <div class="record-item" data-id="${record.id}" style="cursor: pointer;">
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
    if (elements.filterDoctor && role !== 'doctor' && role !== 'patient') {
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

    // Nuevo registro (solo si tiene permisos)
    if (elements.btnNewRecord) {
      elements.btnNewRecord.addEventListener('click', () => {
        if (!canCreateRecords()) {
          showNotification('No tiene permiso para crear registros clínicos', 'error');
          return;
        }
        openModal();
      });
    }

    if (elements.btnCreateFirstRecord) {
      elements.btnCreateFirstRecord.addEventListener('click', () => {
        if (!canCreateRecords()) {
          showNotification('No tiene permiso para crear registros clínicos', 'error');
          return;
        }
        openModal();
      });
    }

    // Modal
    if (elements.btnCancel) {
      elements.btnCancel.addEventListener('click', closeModal);
    }

    if (elements.btnSave) {
      elements.btnSave.addEventListener('click', saveRecord);
    }

    // Click en registros - CON VALIDACIÓN DE PERMISOS
    if (elements.recordsList) {
      elements.recordsList.addEventListener('click', (e) => {
        const recordItem = e.target.closest('.record-item');
        if (recordItem) {
          const recordId = recordItem.dataset.id;
          const record = store.find('clinicalRecords', recordId);
          if (record) {
            // Verificar permisos antes de mostrar detalles
            if (!hasPermissionToView(record)) {
              showNotification('No tiene permiso para ver este registro', 'error');
              return;
            }
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
    // Verificar permisos antes de abrir el modal
    if (!canCreateRecords()) {
      showNotification('No tiene permiso para crear o editar registros clínicos', 'error');
      return;
    }

    // Si está editando, verificar permisos específicos para ese registro
    if (record && !hasPermissionToEdit(record)) {
      showNotification('No tiene permiso para editar este registro', 'error');
      return;
    }

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
    // Verificar permisos primero
    if (!canCreateRecords()) {
      showNotification('No tiene permiso para crear registros clínicos', 'error');
      return;
    }

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
    // Verificar permisos antes de guardar
    if (!canCreateRecords()) {
      showNotification('No tiene permiso para crear o editar registros clínicos', 'error');
      return;
    }

    // Si está editando, verificar permisos para ese registro específico
    if (state.editingId) {
      const originalRecord = store.find('clinicalRecords', state.editingId);
      if (originalRecord && !hasPermissionToEdit(originalRecord)) {
        showNotification('No tiene permiso para editar este registro', 'error');
        return;
      }
    }

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

    // Determinar si el usuario puede editar este registro
    const canEditThisRecord = hasPermissionToEdit(record);

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 850px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
          <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL GENERAL</h2>
          <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">HISTORIA CLÍNICA ELECTRÓNICA</div>
          <button class="btn-close-modal" id="close-record-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
        </div>
        
        <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 4px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); max-height: 70vh; overflow-y: auto;">
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
          ${canEditThisRecord ? `
            <button class="btn btn-primary" style="background: #7c9b1f; border: none; padding: 0.5rem 1rem;" id="edit-record-btn" data-id="${record.id}">✏️ Editar</button>
          ` : ''}
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
  // Función para descargar PDF directo en escala de grises
  async function generateClinicalReport(record) {
    const patient = store.find('patients', record.patientId);
    const doctor = store.find('doctors', record.doctorId);
    const date = new Date(record.date);
    const vitals = record.vitalSigns || {};

    showNotification('Generando PDF en escala de grises...', 'info');

    try {
      // Verificar si jsPDF está disponible
      if (typeof window.jspdf === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      // Auxiliares de escala de grises
      const toGrayscale = (r, g, b) => {
        const gsc = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        return [gsc, gsc, gsc];
      };

      const safeSetFillColor = (color) => {
        let r, g, b;
        if (Array.isArray(color)) [r, g, b] = color;
        else if (typeof color === 'string' && color.startsWith('#')) {
          const hex = color.replace('#', '');
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        } else[r, g, b] = [0, 0, 0];
        const [gr, gg, gb] = toGrayscale(r, g, b);
        doc.setFillColor(gr, gg, gb);
      };

      const safeSetTextColor = (color) => {
        let r, g, b;
        if (Array.isArray(color)) [r, g, b] = color;
        else if (typeof color === 'string' && color.startsWith('#')) {
          const hex = color.replace('#', '');
          r = parseInt(hex.substring(0, 2), 16);
          g = parseInt(hex.substring(2, 4), 16);
          b = parseInt(hex.substring(4, 6), 16);
        } else[r, g, b] = [0, 0, 0];
        const [gr, gg, gb] = toGrayscale(r, g, b);
        doc.setTextColor(gr, gg, gb);
      };

      // --- ENCABEZADO ---
      doc.setFontSize(18);
      safeSetTextColor([10, 40, 80]);
      doc.setFont('helvetica', 'bold');
      doc.text('HOSPITAL CENTRAL', pageWidth / 2, margin + 5, { align: 'center' });

      doc.setFontSize(12);
      safeSetTextColor([80, 80, 80]);
      doc.text('HISTORIA CLÍNICA ELECTRÓNICA', pageWidth / 2, margin + 12, { align: 'center' });

      const [dr, dg, db] = toGrayscale(10, 40, 80);
      doc.setDrawColor(dr, dg, db);
      doc.setLineWidth(0.5);
      doc.line(margin, margin + 18, pageWidth - margin, margin + 18);

      let yPos = margin + 28;

      // --- INFO DEL REGISTRO ---
      doc.setFontSize(9);
      safeSetTextColor([100, 100, 100]);
      doc.setFont('helvetica', 'normal');
      doc.text(`Registro ID: ${record.id.split('_').pop()}`, margin, yPos);
      doc.text(`Fecha: ${date.toLocaleDateString('es-ES')}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 8;

      // --- BLOQUES DE PACIENTE Y MÉDICO ---
      safeSetFillColor([240, 245, 240]);
      doc.rect(margin, yPos, contentWidth / 2 - 2, 35, 'F');

      safeSetFillColor([240, 240, 245]);
      doc.rect(pageWidth / 2 + 2, yPos, contentWidth / 2 - 2, 35, 'F');

      doc.setFont('helvetica', 'bold');
      safeSetTextColor([40, 80, 40]);
      doc.text('DATOS DEL PACIENTE', margin + 3, yPos + 6);

      doc.setFont('helvetica', 'normal');
      safeSetTextColor([0, 0, 0]);
      doc.text(`Nombre: ${patient?.name || 'N/A'}`, margin + 3, yPos + 12);
      doc.text(`DNI: ${patient?.dni || 'N/A'}`, margin + 3, yPos + 18);
      doc.text(`Edad: ${patient?.birthDate ? calculateAge(patient.birthDate) + ' años' : 'N/A'}`, margin + 3, yPos + 24);
      doc.text(`Tel: ${patient?.phone || 'N/A'}`, margin + 3, yPos + 30);

      doc.setFont('helvetica', 'bold');
      safeSetTextColor([40, 40, 80]);
      doc.text('MÉDICO TRATANTE', pageWidth / 2 + 5, yPos + 6);

      doc.setFont('helvetica', 'normal');
      safeSetTextColor([0, 0, 0]);
      doc.text(`Nombre: ${doctor?.name || 'N/A'}`, pageWidth / 2 + 5, yPos + 12);
      doc.text(`Especialidad: ${doctor?.specialty || 'N/A'}`, pageWidth / 2 + 5, yPos + 18);
      doc.text(`Matrícula: ${doctor?.license || 'N/A'}`, pageWidth / 2 + 5, yPos + 24);

      yPos += 45;

      // --- SIGNOS VITALES ---
      safeSetFillColor([90, 137, 115]); // Sage
      doc.rect(margin, yPos, contentWidth, 7, 'F');
      safeSetTextColor([255, 255, 255]);
      doc.setFont('helvetica', 'bold');
      doc.text('SIGNOS VITALES', margin + 3, yPos + 5);

      yPos += 7;
      doc.setFontSize(8);
      safeSetTextColor([0, 0, 0]);
      doc.setFont('helvetica', 'normal');

      const vitalLabels = ['P. Arterial', 'F. Cardíaca', 'Temp.', 'Sat. O2', 'Peso', 'Altura'];
      const vitalValues = [`${vitals.bloodPressure || '-'} mmHg`, `${vitals.heartRate || '-'} lpm`, `${vitals.temperature || '-'} °C`, `${vitals.spo2 || '-'} %`, `${vitals.weight || '-'} kg`, `${vitals.height || '-'} cm`];

      let xOffset = margin;
      const colW = contentWidth / 6;

      vitalLabels.forEach((label, i) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, xOffset + colW / 2, yPos + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(vitalValues[i], xOffset + colW / 2, yPos + 10, { align: 'center' });
        xOffset += colW;
      });

      yPos += 18;

      // --- SECCIONES DE TEXTO ---
      const sections = [
        { title: 'MOTIVO DE CONSULTA Y SÍNTOMAS', content: `${record.reason || ''} ${record.symptoms || 'No especificados'}`, color: [214, 158, 46] },
        { title: 'DIAGNÓSTICO', content: record.diagnosis || 'Pendiente', color: [104, 159, 56] },
        { title: 'PLAN DE TRATAMIENTO', content: record.treatment || 'No especificado', color: [104, 159, 56] }
      ];

      sections.forEach(sec => {
        safeSetFillColor(sec.color);
        doc.rect(margin, yPos, contentWidth, 7, 'F');
        safeSetTextColor([255, 255, 255]);
        doc.setFont('helvetica', 'bold');
        doc.text(sec.title, margin + 3, yPos + 5);

        yPos += 7;
        safeSetTextColor([0, 0, 0]);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(sec.content, contentWidth - 6);
        doc.text(lines, margin + 3, yPos + 6);
        yPos += (lines.length * 5) + 8;
      });

      // --- RECETAS ---
      safeSetFillColor([39, 103, 73]); // Forest
      doc.rect(margin, yPos, contentWidth, 7, 'F');
      safeSetTextColor([255, 255, 255]);
      doc.setFont('helvetica', 'bold');
      doc.text('RECETAS MÉDICAS', margin + 3, yPos + 5);

      yPos += 7;
      doc.setFontSize(8);
      safeSetTextColor([0, 0, 0]);
      if (record.prescriptions && record.prescriptions.length > 0) {
        record.prescriptions.forEach((p, idx) => {
          doc.text(`${idx + 1}. ${p.medication} - ${p.dosage} - Cada ${p.frequency} - Durante ${p.duration}`, margin + 3, yPos + 6);
          yPos += 6;
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.text('Sin prescripciones activas', margin + 3, yPos + 6);
        yPos += 6;
      }
      yPos += 5;

      // --- FIRMA ---
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 20;
      doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
      doc.text(doctor?.name || 'Médico Tratante', pageWidth - margin - 30, yPos + 5, { align: 'center' });
      doc.text(`Mat. ${doctor?.license || 'N/A'}`, pageWidth - margin - 30, yPos + 10, { align: 'center' });

      doc.save(`Historia_Clinica_${patient?.name.replace(/\s+/g, '_') || 'Paciente'}.pdf`);
      showNotification('PDF descargado exitosamente', 'success');

    } catch (error) {
      console.error('Error al generar PDF:', error);
      showNotification('Error al crear el PDF', 'error');
    }
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
    // Función de limpieza
    function cleanup() {
      document.removeEventListener('keydown', escHandler);
    }

    // Función para cerrar el modal extendida
    function enhancedCloseModal() {
      cleanup();
      if (modalContainer && modalContainer.parentNode) {
        modalContainer.parentNode.removeChild(modalContainer);
      }
    }

    // Cerrar con ESC
    function escHandler(e) {
      if (e.key === 'Escape') enhancedCloseModal();
    }

    document.addEventListener('keydown', escHandler);

    // Botones de cerrar
    const closeBtnHeader = modalContainer.querySelector('#close-record-modal');
    const closeBtnFooter = modalContainer.querySelector('#close-modal-btn');
    if (closeBtnHeader) closeBtnHeader.addEventListener('click', enhancedCloseModal);
    if (closeBtnFooter) closeBtnFooter.addEventListener('click', enhancedCloseModal);

    // Botón de editar - SOLO si tiene permisos
    const editBtn = modalContainer.querySelector('#edit-record-btn');
    if (editBtn && hasPermissionToEdit(record)) {
      editBtn.addEventListener('click', () => {
        enhancedCloseModal();
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