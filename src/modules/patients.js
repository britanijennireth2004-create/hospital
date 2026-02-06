/**
 * Módulo de Gestión de Pacientes - CRUD Completo
 */

export default function mountPatients(root, { bus, store, user, role }) {
  const state = {
    patients: [],
    clinicalRecords: [],
    appointments: [],
    editingId: null,
    showModal: false,
    viewMode: 'list', // 'list' o 'cards'
    filters: {
      search: '',
      gender: '',
      status: 'active',
      ageRange: '',
      hasAllergies: '',
      bloodType: ''
    },
    sortBy: 'name',
    currentPage: 1,
    itemsPerPage: 10,
    selectedPatient: null,
    showClinicalHistory: false
  };

  // Elementos DOM
  let elements = {};

  // Inicializar
  function init() {
    render();
    setupEventListeners();
    loadData();
    
    // Suscribirse a cambios
    const unsubscribe = store.subscribe('patients', () => {
      loadData();
    });
    
    return unsubscribe;
  }

  // Cargar datos
  function loadData() {
    state.patients = store.get('patients');
    state.clinicalRecords = store.get('clinicalRecords');
    state.appointments = store.get('appointments');
    
    applyFilters();
    renderContent();
    renderStats();
  }

  // Aplicar filtros
  function applyFilters() {
    let filteredPatients = state.patients;
    
    // Búsqueda por texto
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        patient.dni?.toLowerCase().includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm) ||
        patient.phone?.includes(searchTerm)
      );
    }
    
    // Filtro por género
    if (state.filters.gender) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.gender === state.filters.gender
      );
    }
    
    // Filtro por estado
    if (state.filters.status === 'active') {
      filteredPatients = filteredPatients.filter(patient => patient.isActive);
    } else if (state.filters.status === 'inactive') {
      filteredPatients = filteredPatients.filter(patient => !patient.isActive);
    }
    
    // Filtro por rango de edad
    if (state.filters.ageRange) {
      filteredPatients = filteredPatients.filter(patient => {
        if (!patient.birthDate) return true;
        const age = calculateAge(patient.birthDate);
        
        switch (state.filters.ageRange) {
          case 'child': return age < 12;
          case 'teen': return age >= 12 && age < 20;
          case 'adult': return age >= 20 && age < 60;
          case 'senior': return age >= 60;
          default: return true;
        }
      });
    }
    
    // Filtro por alergias
    if (state.filters.hasAllergies === 'yes') {
      filteredPatients = filteredPatients.filter(patient => 
        patient.allergies && patient.allergies.length > 0
      );
    } else if (state.filters.hasAllergies === 'no') {
      filteredPatients = filteredPatients.filter(patient => 
        !patient.allergies || patient.allergies.length === 0
      );
    }
    
    // Filtro por tipo de sangre
    if (state.filters.bloodType) {
      filteredPatients = filteredPatients.filter(patient => 
        patient.bloodType === state.filters.bloodType
      );
    }
    
    // Ordenar
    filteredPatients.sort((a, b) => {
      switch (state.sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'age': return calculateAge(b.birthDate) - calculateAge(a.birthDate);
        case 'recent': return new Date(b.createdAt) - new Date(a.createdAt);
        default: return 0;
      }
    });
    
    state.filteredPatients = filteredPatients;
    updatePagination();
  }

  // Calcular edad
  function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // Actualizar paginación
  function updatePagination() {
    const totalPages = Math.ceil(state.filteredPatients.length / state.itemsPerPage);
    state.totalPages = totalPages;
    
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    state.paginatedPatients = state.filteredPatients.slice(start, end);
  }

  // Renderizar componente principal
  function render() {
    const canEdit = role === 'admin' || role === 'doctor';
    
    root.innerHTML = `
      <div class="module-patients">
        <!-- Header -->
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <h2>Pacientes</h2>
              <p class="text-muted">Gestión integral de pacientes</p>
            </div>
            ${canEdit ? `
              <button class="btn btn-primary" id="btn-new-patient">
                <span>+</span> Nuevo Paciente
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Filtros -->
        <div class="card">
          <div class="flex justify-between items-center mb-3">
            <h3 style="margin: 0;">Filtros</h3>
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" id="btn-reset-filters">
                Limpiar filtros
              </button>
              <button class="btn btn-outline btn-sm" id="btn-toggle-view">
                ${state.viewMode === 'list' ? '📊 Vista Tarjetas' : '📋 Vista Lista'}
              </button>
            </div>
          </div>
          
          <div class="grid grid-4">
            <!-- Búsqueda -->
            <div class="form-group">
              <label class="form-label">Buscar</label>
              <div class="flex gap-2">
                <input type="text" class="input" id="filter-search" 
                       placeholder="Nombre, DNI, teléfono..." 
                       value="${state.filters.search}">
                <button class="btn btn-outline" id="btn-search">🔍</button>
              </div>
            </div>
            
            <!-- Filtros básicos -->
            <div class="form-group">
              <label class="form-label">Género</label>
              <select class="input" id="filter-gender">
                <option value="">Todos</option>
                <option value="M" ${state.filters.gender === 'M' ? 'selected' : ''}>Masculino</option>
                <option value="F" ${state.filters.gender === 'F' ? 'selected' : ''}>Femenino</option>
                <option value="O" ${state.filters.gender === 'O' ? 'selected' : ''}>Otro</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="input" id="filter-status">
                <option value="active" ${state.filters.status === 'active' ? 'selected' : ''}>Activos</option>
                <option value="inactive" ${state.filters.status === 'inactive' ? 'selected' : ''}>Inactivos</option>
                <option value="all" ${state.filters.status === 'all' ? 'selected' : ''}>Todos</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Ordenar por</label>
              <select class="input" id="sort-by">
                <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Nombre</option>
                <option value="age" ${state.sortBy === 'age' ? 'selected' : ''}>Edad</option>
                <option value="recent" ${state.sortBy === 'recent' ? 'selected' : ''}>Más recientes</option>
              </select>
            </div>
          </div>
          
          <!-- Filtros avanzados -->
          <div class="grid grid-3 mt-3" id="advanced-filters" style="display: none;">
            <div class="form-group">
              <label class="form-label">Rango de edad</label>
              <select class="input" id="filter-age">
                <option value="">Todos</option>
                <option value="child" ${state.filters.ageRange === 'child' ? 'selected' : ''}>Niño (0-11)</option>
                <option value="teen" ${state.filters.ageRange === 'teen' ? 'selected' : ''}>Adolescente (12-19)</option>
                <option value="adult" ${state.filters.ageRange === 'adult' ? 'selected' : ''}>Adulto (20-59)</option>
                <option value="senior" ${state.filters.ageRange === 'senior' ? 'selected' : ''}>Adulto mayor (60+)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Alergias</label>
              <select class="input" id="filter-allergies">
                <option value="">Todos</option>
                <option value="yes" ${state.filters.hasAllergies === 'yes' ? 'selected' : ''}>Con alergias</option>
                <option value="no" ${state.filters.hasAllergies === 'no' ? 'selected' : ''}>Sin alergias</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Tipo de sangre</label>
              <select class="input" id="filter-blood">
                <option value="">Todos</option>
                <option value="O+" ${state.filters.bloodType === 'O+' ? 'selected' : ''}>O+</option>
                <option value="O-" ${state.filters.bloodType === 'O-' ? 'selected' : ''}>O-</option>
                <option value="A+" ${state.filters.bloodType === 'A+' ? 'selected' : ''}>A+</option>
                <option value="A-" ${state.filters.bloodType === 'A-' ? 'selected' : ''}>A-</option>
                <option value="B+" ${state.filters.bloodType === 'B+' ? 'selected' : ''}>B+</option>
                <option value="B-" ${state.filters.bloodType === 'B-' ? 'selected' : ''}>B-</option>
                <option value="AB+" ${state.filters.bloodType === 'AB+' ? 'selected' : ''}>AB+</option>
                <option value="AB-" ${state.filters.bloodType === 'AB-' ? 'selected' : ''}>AB-</option>
              </select>
            </div>
          </div>
          
          <div class="flex justify-between mt-3">
            <button class="btn btn-outline btn-sm" id="btn-toggle-advanced">
              <span id="advanced-icon">▼</span> Filtros avanzados
            </button>
            <div class="text-sm text-muted" id="filter-count">
              Mostrando 0 de 0 pacientes
            </div>
          </div>
        </div>

        <!-- Contenido principal -->
        <div id="content-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Paginación -->
        <div class="card hidden" id="pagination-container">
          <div class="flex justify-between items-center">
            <div class="text-sm text-muted" id="page-info">
              Página 1 de 1
            </div>
            <div class="flex gap-1" id="pagination-controls">
              <!-- Se llenará dinámicamente -->
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted">Mostrar:</span>
              <select class="input input-sm" id="items-per-page" style="width: 80px;">
                <option value="5">5</option>
                <option value="10" selected>10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Modal para nuevo/editar paciente -->
        <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="patient-modal">
          <div class="modal-content" style="max-width: 700px; max-height: 90vh;">
            <div class="modal-header">
              <h3 style="margin: 0;">${state.editingId ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
              <button class="btn btn-outline btn-sm" id="btn-close-modal">×</button>
            </div>
            
            <div class="modal-body">
              <form id="patient-form">
                <!-- Pestañas -->
                <div class="flex border-b mb-4">
                  <button type="button" class="tab-btn active" data-tab="basic">Datos Básicos</button>
                  <button type="button" class="tab-btn" data-tab="medical">Historial Médico</button>
                  <button type="button" class="tab-btn" data-tab="contact">Contacto</button>
                </div>
                
                <!-- Contenido de pestañas -->
                <div id="tab-content">
                  <!-- Pestaña 1: Datos Básicos -->
                  <div class="tab-pane active" data-tab="basic">
                    <div class="grid grid-2">
                      <div class="form-group">
                        <label class="form-label">Nombre completo *</label>
                        <input type="text" class="input" id="form-name" required>
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label">DNI/NIE *</label>
                        <input type="text" class="input" id="form-dni" required 
                               pattern="[0-9]{8}[A-Za-z]|[XYZ][0-9]{7}[A-Za-z]">
                      </div>
                    </div>
                    
                    <div class="grid grid-3">
                      <div class="form-group">
                        <label class="form-label">Fecha de nacimiento *</label>
                        <input type="date" class="input" id="form-birthdate" required>
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label">Género *</label>
                        <select class="input" id="form-gender" required>
                          <option value="">Seleccionar</option>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                          <option value="O">Otro</option>
                        </select>
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label">Tipo de sangre</label>
                        <select class="input" id="form-blood-type">
                          <option value="">Desconocido</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Pestaña 2: Historial Médico -->
                  <div class="tab-pane" data-tab="medical">
                    <div class="form-group">
                      <label class="form-label">Alergias conocidas</label>
                      <div id="allergies-container">
                        <!-- Alergias se agregarán dinámicamente -->
                      </div>
                      <button type="button" class="btn btn-outline btn-sm mt-2" id="btn-add-allergy">
                        + Agregar alergia
                      </button>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Enfermedades crónicas</label>
                      <textarea class="input" id="form-chronic-diseases" rows="3" 
                                placeholder="Ej: Hipertensión, Diabetes, Asma..."></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Medicación habitual</label>
                      <textarea class="input" id="form-regular-meds" rows="2" 
                                placeholder="Medicamentos que toma regularmente..."></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Cirugías previas</label>
                      <textarea class="input" id="form-surgeries" rows="2" 
                                placeholder="Cirugías realizadas, fechas..."></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Observaciones médicas</label>
                      <textarea class="input" id="form-medical-notes" rows="3" 
                                placeholder="Otras observaciones importantes..."></textarea>
                    </div>
                  </div>
                  
                  <!-- Pestaña 3: Contacto -->
                  <div class="tab-pane" data-tab="contact">
                    <div class="grid grid-2">
                      <div class="form-group">
                        <label class="form-label">Teléfono *</label>
                        <input type="tel" class="input" id="form-phone" required>
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="input" id="form-email">
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Dirección</label>
                      <textarea class="input" id="form-address" rows="2"></textarea>
                    </div>
                    
                    <div class="grid grid-2">
                      <div class="form-group">
                        <label class="form-label">Ciudad</label>
                        <input type="text" class="input" id="form-city">
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label">Código postal</label>
                        <input type="text" class="input" id="form-zip">
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Contacto de emergencia</label>
                      <div class="grid grid-2">
                        <input type="text" class="input" id="form-emergency-name" placeholder="Nombre">
                        <input type="tel" class="input" id="form-emergency-phone" placeholder="Teléfono">
                      </div>
                      <textarea class="input mt-2" id="form-emergency-relation" rows="1" 
                                placeholder="Parentesco/Relación"></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Seguro médico</label>
                      <div class="grid grid-2">
                        <input type="text" class="input" id="form-insurance-company" placeholder="Compañía">
                        <input type="text" class="input" id="form-insurance-number" placeholder="Número de póliza">
                      </div>
                    </div>
                  </div>
                </div>
                
                ${state.editingId ? `
                  <div class="form-group mt-4">
                    <label class="form-label">Estado</label>
                    <select class="input" id="form-status">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                ` : ''}
              </form>
            </div>
            
            <div class="modal-footer">
              <button class="btn btn-outline" id="btn-cancel">Cancelar</button>
              <button class="btn btn-primary" id="btn-save">
                ${state.editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>

        <!-- Modal para historial clínico -->
        <div class="modal-overlay ${state.showClinicalHistory ? '' : 'hidden'}" id="clinical-history-modal">
          <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
            <div class="modal-header">
              <h3 style="margin: 0;">
                <span id="patient-history-name"></span> - Historial Clínico
              </h3>
              <button class="btn btn-outline btn-sm" id="btn-close-history">×</button>
            </div>
            
            <div class="modal-body" id="clinical-history-content">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Guardar referencias
    elements = {
      // Contenedores
      statsContainer: root.querySelector('#stats-container'),
      contentContainer: root.querySelector('#content-container'),
      paginationContainer: root.querySelector('#pagination-container'),
      pageInfo: root.querySelector('#page-info'),
      paginationControls: root.querySelector('#pagination-controls'),
      filterCount: root.querySelector('#filter-count'),
      
      // Filtros
      filterSearch: root.querySelector('#filter-search'),
      filterGender: root.querySelector('#filter-gender'),
      filterStatus: root.querySelector('#filter-status'),
      sortBy: root.querySelector('#sort-by'),
      btnSearch: root.querySelector('#btn-search'),
      btnResetFilters: root.querySelector('#btn-reset-filters'),
      btnToggleView: root.querySelector('#btn-toggle-view'),
      
      // Filtros avanzados
      advancedFilters: root.querySelector('#advanced-filters'),
      filterAge: root.querySelector('#filter-age'),
      filterAllergies: root.querySelector('#filter-allergies'),
      filterBlood: root.querySelector('#filter-blood'),
      btnToggleAdvanced: root.querySelector('#btn-toggle-advanced'),
      advancedIcon: root.querySelector('#advanced-icon'),
      
      // Paginación
      itemsPerPage: root.querySelector('#items-per-page'),
      
      // Modal paciente
      modal: root.querySelector('#patient-modal'),
      form: root.querySelector('#patient-form'),
      formName: root.querySelector('#form-name'),
      formDni: root.querySelector('#form-dni'),
      formBirthdate: root.querySelector('#form-birthdate'),
      formGender: root.querySelector('#form-gender'),
      formBloodType: root.querySelector('#form-blood-type'),
      allergiesContainer: root.querySelector('#allergies-container'),
      formChronicDiseases: root.querySelector('#form-chronic-diseases'),
      formRegularMeds: root.querySelector('#form-regular-meds'),
      formSurgeries: root.querySelector('#form-surgeries'),
      formMedicalNotes: root.querySelector('#form-medical-notes'),
      formPhone: root.querySelector('#form-phone'),
      formEmail: root.querySelector('#form-email'),
      formAddress: root.querySelector('#form-address'),
      formCity: root.querySelector('#form-city'),
      formZip: root.querySelector('#form-zip'),
      formEmergencyName: root.querySelector('#form-emergency-name'),
      formEmergencyPhone: root.querySelector('#form-emergency-phone'),
      formEmergencyRelation: root.querySelector('#form-emergency-relation'),
      formInsuranceCompany: root.querySelector('#form-insurance-company'),
      formInsuranceNumber: root.querySelector('#form-insurance-number'),
      formStatus: root.querySelector('#form-status'),
      btnAddAllergy: root.querySelector('#btn-add-allergy'),
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewPatient: root.querySelector('#btn-new-patient'),
      
      // Tabs
      tabBtns: root.querySelectorAll('.tab-btn'),
      tabPanes: root.querySelectorAll('.tab-pane'),
      
      // Historial clínico modal
      clinicalHistoryModal: root.querySelector('#clinical-history-modal'),
      clinicalHistoryContent: root.querySelector('#clinical-history-content'),
      patientHistoryName: root.querySelector('#patient-history-name'),
      btnCloseHistory: root.querySelector('#btn-close-history')
    };
    
    loadData();
  }

  // Renderizar contenido según modo de vista
  function renderContent() {
    if (!elements.contentContainer) return;
    
    if (state.filteredPatients.length === 0) {
      renderEmptyState();
      return;
    }
    
    if (state.viewMode === 'list') {
      renderListView();
    } else {
      renderCardsView();
    }
    
    renderPagination();
  }

  // Renderizar vista de lista
  function renderListView() {
    elements.contentContainer.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>DNI</th>
                <th>Edad</th>
                <th>Género</th>
                <th>Contacto</th>
                <th>Última visita</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="patients-list">
              ${state.paginatedPatients.map(patient => renderPatientRow(patient)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // Configurar event listeners
    const list = elements.contentContainer.querySelector('#patients-list');
    if (list) {
      list.addEventListener('click', handleListAction);
    }
  }

  // Renderizar fila de paciente
  function renderPatientRow(patient) {
    const age = calculateAge(patient.birthDate);
    const lastVisit = getLastVisit(patient.id);
    const clinicalCount = state.clinicalRecords.filter(cr => cr.patientId === patient.id).length;
    const appointmentCount = state.appointments.filter(apt => apt.patientId === patient.id).length;
    
    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 40px; height: 40px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 500;">
              ${patient.name.charAt(0)}
            </div>
            <div>
              <div style="font-weight: 500;">${patient.name}</div>
              <div style="font-size: 0.75rem; color: var(--muted);">
                ${clinicalCount} registros • ${appointmentCount} citas
              </div>
            </div>
          </div>
        </td>
        <td>${patient.dni || '-'}</td>
        <td>${age || '?'} años</td>
        <td>
          <span class="badge ${patient.gender === 'M' ? 'badge-info' : patient.gender === 'F' ? 'badge-warning' : 'badge-secondary'}">
            ${patient.gender === 'M' ? '♂ Masculino' : patient.gender === 'F' ? '♀ Femenino' : 'Otro'}
          </span>
        </td>
        <td>
          <div style="font-size: 0.875rem;">
            <div>${patient.phone || '-'}</div>
            <div class="text-muted text-xs">${patient.email || ''}</div>
          </div>
        </td>
        <td>
          ${lastVisit ? `
            <div style="font-size: 0.875rem;">
              <div>${lastVisit.toLocaleDateString('es-ES')}</div>
              <div class="text-muted text-xs">${lastVisit.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
            </div>
          ` : 'Sin visitas'}
        </td>
        <td>
          <span class="badge ${patient.isActive ? 'badge-success' : 'badge-danger'}">
            ${patient.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" data-action="view" data-id="${patient.id}">
              Ver
            </button>
            ${role === 'admin' || role === 'doctor' ? `
              <button class="btn btn-outline btn-sm" data-action="edit" data-id="${patient.id}">
                Editar
              </button>
              <button class="btn btn-outline btn-sm" data-action="history" data-id="${patient.id}">
                Historial
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  // Renderizar vista de tarjetas
  function renderCardsView() {
    elements.contentContainer.innerHTML = `
      <div class="grid grid-3">
        ${state.paginatedPatients.map(patient => renderPatientCard(patient)).join('')}
      </div>
    `;
    
    // Configurar event listeners
    state.paginatedPatients.forEach(patient => {
      const card = elements.contentContainer.querySelector(`.patient-card[data-id="${patient.id}"]`);
      if (card) {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.card-actions')) {
            viewPatientDetails(patient);
          }
        });
      }
    });
  }

  // Renderizar tarjeta de paciente
  function renderPatientCard(patient) {
    const age = calculateAge(patient.birthDate);
    const clinicalCount = state.clinicalRecords.filter(cr => cr.patientId === patient.id).length;
    const appointmentCount = state.appointments.filter(apt => apt.patientId === patient.id).length;
    const lastVisit = getLastVisit(patient.id);
    
    // Color por género
    const genderColor = patient.gender === 'M' ? 'var(--info)' : 
                       patient.gender === 'F' ? 'var(--warning)' : 'var(--muted)';
    
    return `
      <div class="card patient-card" data-id="${patient.id}" style="cursor: pointer;">
        <div class="card-header" style="padding: 0; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 60px; height: 60px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">
              ${patient.name.charAt(0)}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 1.125rem;">${patient.name}</div>
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--muted);">
                <span>${patient.dni || 'Sin DNI'}</span>
                •
                <span style="color: ${genderColor};">
                  ${patient.gender === 'M' ? '♂' : patient.gender === 'F' ? '♀' : '⚧'} 
                  ${age || '?'} años
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--muted); font-size: 0.875rem;">Contacto:</span>
            <span style="font-weight: 500; font-size: 0.875rem;">${patient.phone || 'No especificado'}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--muted); font-size: 0.875rem;">Tipo de sangre:</span>
            <span style="font-weight: 500; font-size: 0.875rem;">${patient.bloodType || 'Desconocido'}</span>
          </div>
          
          ${patient.allergies && patient.allergies.length > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--muted); font-size: 0.875rem;">Alergias:</span>
              <span style="font-weight: 500; font-size: 0.875rem; color: var(--danger);">
                ${patient.allergies.length}
              </span>
            </div>
          ` : ''}
          
          ${lastVisit ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--muted); font-size: 0.875rem;">Última visita:</span>
              <span style="font-weight: 500; font-size: 0.875rem;">
                ${lastVisit.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ` : ''}
        </div>
        
        <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">Registros</div>
              <div style="font-weight: 600; font-size: 1.25rem;">${clinicalCount}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">Citas</div>
              <div style="font-weight: 600; font-size: 1.25rem;">${appointmentCount}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">Estado</div>
              <div>
                <span class="badge ${patient.isActive ? 'badge-success' : 'badge-danger'}">
                  ${patient.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          
          <div class="card-actions flex gap-2">
            <button class="btn btn-outline btn-sm" style="flex: 1;" data-action="view" data-id="${patient.id}">
              Ver
            </button>
            ${role === 'admin' || role === 'doctor' ? `
              <button class="btn btn-outline btn-sm" style="flex: 1;" data-action="history" data-id="${patient.id}">
                Historial
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Renderizar estado vacío
  function renderEmptyState() {
    elements.contentContainer.innerHTML = `
      <div class="card">
        <div class="text-center" style="padding: 3rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">👤</div>
          <h3>No hay pacientes</h3>
          <p class="text-muted" style="margin-bottom: 1.5rem;">
            ${state.filters.search || state.filters.gender || state.filters.ageRange ? 
              'No se encontraron pacientes con los filtros aplicados' : 
              'No hay pacientes registrados en el sistema'}
          </p>
          ${role === 'admin' || role === 'doctor' ? `
            <button class="btn btn-primary" id="btn-create-first-patient">
              Registrar primer paciente
            </button>
          ` : ''}
        </div>
      </div>
    `;
    
    const btn = elements.contentContainer.querySelector('#btn-create-first-patient');
    if (btn) {
      btn.addEventListener('click', () => openModal());
    }
    
    elements.paginationContainer.classList.add('hidden');
    if (elements.filterCount) {
      elements.filterCount.textContent = `Mostrando 0 de 0 pacientes`;
    }
  }

  // Renderizar paginación
  function renderPagination() {
    if (state.filteredPatients.length <= state.itemsPerPage) {
      elements.paginationContainer.classList.add('hidden');
      return;
    }
    
    elements.paginationContainer.classList.remove('hidden');
    
    // Información de página
    const start = (state.currentPage - 1) * state.itemsPerPage + 1;
    const end = Math.min(state.currentPage * state.itemsPerPage, state.filteredPatients.length);
    const total = state.filteredPatients.length;
    
    if (elements.pageInfo) {
      elements.pageInfo.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
    }
    
    if (elements.filterCount) {
      elements.filterCount.textContent = `Mostrando ${start}-${end} de ${total} pacientes`;
    }
    
    // Controles de paginación
    let paginationHTML = '';
    
    // Botón anterior
    paginationHTML += `
      <button class="btn btn-outline btn-sm ${state.currentPage === 1 ? 'disabled' : ''}" 
              id="btn-prev" ${state.currentPage === 1 ? 'disabled' : ''}>
        ←
      </button>
    `;
    
    // Números de página
    const maxPagesToShow = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(state.totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="btn btn-outline btn-sm ${state.currentPage === i ? 'active' : ''}" 
                data-page="${i}">
          ${i}
        </button>
      `;
    }
    
    // Botón siguiente
    paginationHTML += `
      <button class="btn btn-outline btn-sm ${state.currentPage === state.totalPages ? 'disabled' : ''}" 
              id="btn-next" ${state.currentPage === state.totalPages ? 'disabled' : ''}>
        →
      </button>
    `;
    
    if (elements.paginationControls) {
      elements.paginationControls.innerHTML = paginationHTML;
    }
  }

  // Renderizar estadísticas
  function renderStats() {
    if (!elements.statsContainer) return;
    
    const totalPatients = state.patients.length;
    const activePatients = state.patients.filter(p => p.isActive).length;
    const patientsWithAppointments = state.patients.filter(p => 
      state.appointments.some(apt => apt.patientId === p.id)
    ).length;
    const patientsWithRecords = state.patients.filter(p => 
      state.clinicalRecords.some(cr => cr.patientId === p.id)
    ).length;
    
    // Distribución por género
    const genderCount = {
      M: state.patients.filter(p => p.gender === 'M').length,
      F: state.patients.filter(p => p.gender === 'F').length,
      O: state.patients.filter(p => p.gender === 'O').length
    };
    
    elements.statsContainer.innerHTML = `
      <div class="card">
        <div class="text-muted text-sm">Total de pacientes</div>
        <div class="text-2xl font-bold" style="color: var(--accent);">${totalPatients}</div>
        <div class="text-xs text-muted mt-1">${activePatients} activos</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Con citas</div>
        <div class="text-2xl font-bold" style="color: var(--accent-2);">${patientsWithAppointments}</div>
        <div class="text-xs text-muted mt-1">${patientsWithRecords} con historial</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Distribución por género</div>
        <div class="flex items-center justify-between mt-2">
          <div style="text-align: center;">
            <div style="font-size: 1.25rem; color: var(--info);">${genderCount.M}</div>
            <div style="font-size: 0.75rem; color: var(--muted);">♂</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.25rem; color: var(--warning);">${genderCount.F}</div>
            <div style="font-size: 0.75rem; color: var(--muted);">♀</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 1.25rem; color: var(--muted);">${genderCount.O}</div>
            <div style="font-size: 0.75rem; color: var(--muted);">⚧</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Edad promedio</div>
        <div class="text-2xl font-bold" style="color: var(--info);">
          ${calculateAverageAge()} años
        </div>
        <div class="text-xs text-muted mt-1">Entre todos los pacientes</div>
      </div>
    `;
  }

  // Calcular edad promedio
  function calculateAverageAge() {
    const ages = state.patients
      .map(p => calculateAge(p.birthDate))
      .filter(age => age > 0);
    
    if (ages.length === 0) return 0;
    
    const average = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    return Math.round(average);
  }

  // Obtener última visita
  function getLastVisit(patientId) {
    const patientAppointments = state.appointments
      .filter(apt => apt.patientId === patientId && apt.status === 'completed')
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    if (patientAppointments.length === 0) return null;
    
    return new Date(patientAppointments[0].dateTime);
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Filtros
    if (elements.filterSearch) {
      elements.filterSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyFilterChanges();
        }
      });
    }
    
    if (elements.btnSearch) {
      elements.btnSearch.addEventListener('click', applyFilterChanges);
    }
    
    if (elements.filterGender) {
      elements.filterGender.addEventListener('change', applyFilterChanges);
    }
    
    if (elements.filterStatus) {
      elements.filterStatus.addEventListener('change', applyFilterChanges);
    }
    
    if (elements.sortBy) {
      elements.sortBy.addEventListener('change', () => {
        state.sortBy = elements.sortBy.value;
        applyFilters();
        renderContent();
      });
    }
    
    if (elements.btnResetFilters) {
      elements.btnResetFilters.addEventListener('click', resetFilters);
    }
    
    if (elements.btnToggleView) {
      elements.btnToggleView.addEventListener('click', toggleViewMode);
    }
    
    // Filtros avanzados
    if (elements.btnToggleAdvanced) {
      elements.btnToggleAdvanced.addEventListener('click', toggleAdvancedFilters);
    }
    
    if (elements.filterAge) {
      elements.filterAge.addEventListener('change', applyFilterChanges);
    }
    
    if (elements.filterAllergies) {
      elements.filterAllergies.addEventListener('change', applyFilterChanges);
    }
    
    if (elements.filterBlood) {
      elements.filterBlood.addEventListener('change', applyFilterChanges);
    }
    
    // Paginación
    if (elements.itemsPerPage) {
      elements.itemsPerPage.addEventListener('change', () => {
        state.itemsPerPage = parseInt(elements.itemsPerPage.value);
        state.currentPage = 1;
        updatePagination();
        renderContent();
      });
    }
    
    // Delegación de eventos para paginación
    if (elements.paginationContainer) {
      elements.paginationContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        
        if (btn.id === 'btn-prev') {
          state.currentPage--;
          updatePagination();
          renderContent();
        } else if (btn.id === 'btn-next') {
          state.currentPage++;
          updatePagination();
          renderContent();
        } else if (btn.dataset.page) {
          state.currentPage = parseInt(btn.dataset.page);
          updatePagination();
          renderContent();
        }
      });
    }
    
    // Modal paciente
    if (elements.btnNewPatient) {
      elements.btnNewPatient.addEventListener('click', () => openModal());
    }
    
    if (elements.btnCloseModal) {
      elements.btnCloseModal.addEventListener('click', closeModal);
    }
    
    if (elements.btnCancel) {
      elements.btnCancel.addEventListener('click', closeModal);
    }
    
    if (elements.btnSave) {
      elements.btnSave.addEventListener('click', savePatient);
    }
    
    // Tabs del modal
    if (elements.tabBtns) {
      elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          switchTab(tab);
        });
      });
    }
    
    // Agregar alergia
    if (elements.btnAddAllergy) {
      elements.btnAddAllergy.addEventListener('click', addAllergyField);
    }
    
    // Historial clínico modal
    if (elements.btnCloseHistory) {
      elements.btnCloseHistory.addEventListener('click', () => {
        state.showClinicalHistory = false;
        if (elements.clinicalHistoryModal) {
          elements.clinicalHistoryModal.classList.add('hidden');
        }
      });
    }
    
    // Acciones en el contenido
    if (elements.contentContainer) {
      elements.contentContainer.addEventListener('click', handleContentAction);
    }
  }

  // Manejar acciones en el contenido
  function handleContentAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    event.stopPropagation();
    
    const action = button.dataset.action;
    const patientId = button.dataset.id;
    const patient = store.find('patients', patientId);
    
    switch (action) {
      case 'edit':
        editPatient(patient);
        break;
      case 'view':
        viewPatientDetails(patient);
        break;
      case 'history':
        viewClinicalHistory(patient);
        break;
    }
  }

  // Manejar acciones en la lista
  function handleListAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const patientId = button.dataset.id;
    const patient = store.find('patients', patientId);
    
    switch (action) {
      case 'edit':
        editPatient(patient);
        break;
      case 'view':
        viewPatientDetails(patient);
        break;
      case 'history':
        viewClinicalHistory(patient);
        break;
    }
  }

  // Aplicar cambios en filtros
  function applyFilterChanges() {
    state.filters = {
      search: elements.filterSearch?.value || '',
      gender: elements.filterGender?.value || '',
      status: elements.filterStatus?.value || 'active',
      ageRange: elements.filterAge?.value || '',
      hasAllergies: elements.filterAllergies?.value || '',
      bloodType: elements.filterBlood?.value || ''
    };
    
    state.currentPage = 1;
    applyFilters();
    renderContent();
  }

  // Resetear filtros
  function resetFilters() {
    state.filters = {
      search: '',
      gender: '',
      status: 'active',
      ageRange: '',
      hasAllergies: '',
      bloodType: ''
    };
    
    state.sortBy = 'name';
    state.currentPage = 1;
    
    if (elements.filterSearch) elements.filterSearch.value = '';
    if (elements.filterGender) elements.filterGender.value = '';
    if (elements.filterStatus) elements.filterStatus.value = 'active';
    if (elements.filterAge) elements.filterAge.value = '';
    if (elements.filterAllergies) elements.filterAllergies.value = '';
    if (elements.filterBlood) elements.filterBlood.value = '';
    if (elements.sortBy) elements.sortBy.value = 'name';
    
    applyFilters();
    renderContent();
  }

  // Cambiar modo de vista
  function toggleViewMode() {
    state.viewMode = state.viewMode === 'list' ? 'cards' : 'list';
    if (elements.btnToggleView) {
      elements.btnToggleView.textContent = state.viewMode === 'list' ? '📊 Vista Tarjetas' : '📋 Vista Lista';
    }
    renderContent();
  }

  // Mostrar/ocultar filtros avanzados
  function toggleAdvancedFilters() {
    if (!elements.advancedFilters) return;
    
    const isHidden = elements.advancedFilters.style.display === 'none';
    elements.advancedFilters.style.display = isHidden ? 'grid' : 'none';
    
    if (elements.advancedIcon) {
      elements.advancedIcon.textContent = isHidden ? '▲' : '▼';
    }
  }

  // Cambiar pestaña en el modal
  function switchTab(tabName) {
    // Actualizar botones de pestaña
    elements.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Actualizar contenido de pestañas
    elements.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.dataset.tab === tabName);
    });
  }

  // Agregar campo de alergia
  function addAllergyField(value = '', index = null) {
    if (!elements.allergiesContainer) return;
    
    const allergyIndex = index !== null ? index : elements.allergiesContainer.children.length;
    const allergyId = `allergy-${allergyIndex}`;
    
    const allergyDiv = document.createElement('div');
    allergyDiv.className = 'flex items-center gap-2 mb-2';
    allergyDiv.innerHTML = `
      <input type="text" class="input" id="${allergyId}" 
             placeholder="Ej: Penicilina" 
             value="${value}"
             style="flex: 1;">
      <select class="input" style="width: 120px;">
        <option value="mild">Leve</option>
        <option value="moderate">Moderada</option>
        <option value="severe" selected>Severa</option>
      </select>
      <button type="button" class="btn btn-outline btn-sm remove-allergy" 
              style="color: var(--danger);" data-index="${allergyIndex}">
        ×
      </button>
    `;
    
    elements.allergiesContainer.appendChild(allergyDiv);
    
    // Configurar evento para eliminar
    const removeBtn = allergyDiv.querySelector('.remove-allergy');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        allergyDiv.remove();
      });
    }
  }

  // Abrir modal
  function openModal(patient = null) {
    state.editingId = patient?.id || null;
    state.showModal = true;
    
    if (elements.modal) {
      elements.modal.classList.remove('hidden');
    }
    
    if (patient) {
      populateForm(patient);
    } else {
      clearForm();
    }
    
    // Mostrar primera pestaña
    switchTab('basic');
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
  function populateForm(patient) {
    // Datos básicos
    if (elements.formName) elements.formName.value = patient.name || '';
    if (elements.formDni) elements.formDni.value = patient.dni || '';
    if (elements.formBirthdate) elements.formBirthdate.value = patient.birthDate || '';
    if (elements.formGender) elements.formGender.value = patient.gender || '';
    if (elements.formBloodType) elements.formBloodType.value = patient.bloodType || '';
    
    // Historial médico
    if (elements.allergiesContainer && patient.allergies) {
      elements.allergiesContainer.innerHTML = '';
      patient.allergies.forEach((allergy, index) => {
        if (typeof allergy === 'string') {
          addAllergyField(allergy, index);
        } else if (allergy.name) {
          addAllergyField(allergy.name, index);
        }
      });
    }
    
    if (elements.formChronicDiseases) elements.formChronicDiseases.value = patient.chronicDiseases || '';
    if (elements.formRegularMeds) elements.formRegularMeds.value = patient.regularMeds || '';
    if (elements.formSurgeries) elements.formSurgeries.value = patient.surgeries || '';
    if (elements.formMedicalNotes) elements.formMedicalNotes.value = patient.medicalNotes || '';
    
    // Contacto
    if (elements.formPhone) elements.formPhone.value = patient.phone || '';
    if (elements.formEmail) elements.formEmail.value = patient.email || '';
    if (elements.formAddress) elements.formAddress.value = patient.address || '';
    if (elements.formCity) elements.formCity.value = patient.city || '';
    if (elements.formZip) elements.formZip.value = patient.zipCode || '';
    if (elements.formEmergencyName) elements.formEmergencyName.value = patient.emergencyContact?.name || '';
    if (elements.formEmergencyPhone) elements.formEmergencyPhone.value = patient.emergencyContact?.phone || '';
    if (elements.formEmergencyRelation) elements.formEmergencyRelation.value = patient.emergencyContact?.relation || '';
    if (elements.formInsuranceCompany) elements.formInsuranceCompany.value = patient.insurance?.company || '';
    if (elements.formInsuranceNumber) elements.formInsuranceNumber.value = patient.insurance?.policyNumber || '';
    
    // Estado
    if (elements.formStatus) elements.formStatus.value = patient.isActive ? 'active' : 'inactive';
  }

  // Limpiar formulario
  function clearForm() {
    if (elements.form) elements.form.reset();
    if (elements.allergiesContainer) {
      elements.allergiesContainer.innerHTML = '';
      addAllergyField(); // Una alergia por defecto
    }
  }

  // Guardar paciente
  async function savePatient() {
    if (!validateForm()) {
      alert('Por favor, complete los campos requeridos correctamente.');
      return;
    }
    
    const formData = getFormData();
    
    try {
      if (state.editingId) {
        await store.update('patients', state.editingId, formData);
        showNotification('Paciente actualizado correctamente', 'success');
      } else {
        await store.add('patients', formData);
        showNotification('Paciente creado correctamente', 'success');
      }
      
      closeModal();
      loadData();
      
    } catch (error) {
      console.error('Error guardando paciente:', error);
      showNotification('Error al guardar el paciente', 'error');
    }
  }

  // Validar formulario
  function validateForm() {
    let isValid = true;
    
    const requiredFields = [
      elements.formName,
      elements.formDni,
      elements.formBirthdate,
      elements.formGender,
      elements.formPhone
    ];
    
    requiredFields.forEach(field => {
      if (field && !field.value.trim()) {
        field.classList.add('error');
        isValid = false;
      } else if (field) {
        field.classList.remove('error');
      }
    });
    
    // Validar DNI/NIE
    if (elements.formDni && !validateDNI(elements.formDni.value)) {
      elements.formDni.classList.add('error');
      isValid = false;
    }
    
    // Validar fecha de nacimiento (no puede ser en el futuro)
    if (elements.formBirthdate) {
      const birthDate = new Date(elements.formBirthdate.value);
      const today = new Date();
      if (birthDate > today) {
        elements.formBirthdate.classList.add('error');
        alert('La fecha de nacimiento no puede ser en el futuro.');
        isValid = false;
      }
    }
    
    return isValid;
  }

  // Validar DNI/NIE
  function validateDNI(dni) {
    if (!dni) return false;
    
    const dniRegex = /^[0-9]{8}[A-Za-z]$/;
    const nieRegex = /^[XYZ][0-9]{7}[A-Za-z]$/;
    
    return dniRegex.test(dni) || nieRegex.test(dni);
  }

  // Obtener datos del formulario
  function getFormData() {
    // Obtener alergias
    const allergies = [];
    if (elements.allergiesContainer) {
      const allergyInputs = elements.allergiesContainer.querySelectorAll('input[type="text"]');
      allergyInputs.forEach(input => {
        if (input.value.trim()) {
          allergies.push(input.value.trim());
        }
      });
    }
    
    return {
      name: elements.formName.value,
      dni: elements.formDni.value.toUpperCase(),
      birthDate: elements.formBirthdate.value,
      gender: elements.formGender.value,
      bloodType: elements.formBloodType.value || null,
      allergies: allergies,
      chronicDiseases: elements.formChronicDiseases.value || '',
      regularMeds: elements.formRegularMeds.value || '',
      surgeries: elements.formSurgeries.value || '',
      medicalNotes: elements.formMedicalNotes.value || '',
      phone: elements.formPhone.value,
      email: elements.formEmail.value || '',
      address: elements.formAddress.value || '',
      city: elements.formCity.value || '',
      zipCode: elements.formZip.value || '',
      emergencyContact: {
        name: elements.formEmergencyName.value || '',
        phone: elements.formEmergencyPhone.value || '',
        relation: elements.formEmergencyRelation.value || ''
      },
      insurance: {
        company: elements.formInsuranceCompany.value || '',
        policyNumber: elements.formInsuranceNumber.value || ''
      },
      isActive: elements.formStatus ? elements.formStatus.value === 'active' : true
    };
  }

  // Editar paciente
  function editPatient(patient) {
    openModal(patient);
  }

  // Ver detalles del paciente
  function viewPatientDetails(patient) {
    const clinicalRecords = state.clinicalRecords.filter(cr => cr.patientId === patient.id);
    const appointments = state.appointments.filter(apt => apt.patientId === patient.id);
    const age = calculateAge(patient.birthDate);
    
    // Crear modal de detalles
    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-patient-modal';
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
            <div style="width: 60px; height: 60px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">
              ${patient.name.charAt(0)}
            </div>
            <div>
              <h3 style="margin: 0;">${patient.name}</h3>
              <div style="color: var(--muted);">${patient.dni || 'Sin DNI'} • ${age} años</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" id="close-view-patient-btn">×</button>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <!-- Pestañas -->
          <div class="flex border-b mb-4">
            <button type="button" class="tab-btn active" data-tab="info">Información</button>
            <button type="button" class="tab-btn" data-tab="medical">Historial Médico</button>
            <button type="button" class="tab-btn" data-tab="appointments">Citas</button>
            <button type="button" class="tab-btn" data-tab="records">Registros</button>
          </div>
          
          <!-- Contenido de pestañas -->
          <div id="view-tab-content">
            <!-- Pestaña 1: Información -->
            <div class="tab-pane active" data-tab="info">
              <div class="grid grid-2" style="margin-bottom: 1.5rem;">
                <div>
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.25rem;">Fecha de nacimiento</div>
                  <div>${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('es-ES') : 'No especificada'}</div>
                </div>
                <div>
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.25rem;">Género</div>
                  <div>
                    <span class="badge ${patient.gender === 'M' ? 'badge-info' : patient.gender === 'F' ? 'badge-warning' : 'badge-secondary'}">
                      ${patient.gender === 'M' ? '♂ Masculino' : patient.gender === 'F' ? '♀ Femenino' : 'Otro'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="grid grid-2" style="margin-bottom: 1.5rem;">
                <div>
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.25rem;">Tipo de sangre</div>
                  <div>${patient.bloodType || 'Desconocido'}</div>
                </div>
                <div>
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.25rem;">Estado</div>
                  <div>
                    <span class="badge ${patient.isActive ? 'badge-success' : 'badge-danger'}">
                      ${patient.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 1.5rem;">
                <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.5rem;">Contacto</div>
                <div class="grid grid-2">
                  <div>
                    <div style="font-weight: 500; font-size: 0.875rem;">Teléfono</div>
                    <div>${patient.phone || 'No especificado'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 500; font-size: 0.875rem;">Email</div>
                    <div>${patient.email || 'No especificado'}</div>
                  </div>
                </div>
                ${patient.address ? `
                  <div style="margin-top: 0.5rem;">
                    <div style="font-weight: 500; font-size: 0.875rem;">Dirección</div>
                    <div>${patient.address}</div>
                    ${patient.city || patient.zipCode ? `
                      <div class="text-muted text-sm">
                        ${patient.city || ''} ${patient.zipCode || ''}
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
              
              ${patient.emergencyContact?.name ? `
                <div style="margin-bottom: 1.5rem;">
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.5rem;">Contacto de emergencia</div>
                  <div class="grid grid-2">
                    <div>
                      <div style="font-weight: 500; font-size: 0.875rem;">Nombre</div>
                      <div>${patient.emergencyContact.name}</div>
                    </div>
                    <div>
                      <div style="font-weight: 500; font-size: 0.875rem;">Teléfono</div>
                      <div>${patient.emergencyContact.phone}</div>
                    </div>
                  </div>
                  ${patient.emergencyContact.relation ? `
                    <div style="margin-top: 0.25rem;">
                      <div style="font-weight: 500; font-size: 0.875rem;">Parentesco</div>
                      <div>${patient.emergencyContact.relation}</div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
              
              ${patient.insurance?.company ? `
                <div>
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.5rem;">Seguro médico</div>
                  <div class="grid grid-2">
                    <div>
                      <div style="font-weight: 500; font-size: 0.875rem;">Compañía</div>
                      <div>${patient.insurance.company}</div>
                    </div>
                    <div>
                      <div style="font-weight: 500; font-size: 0.875rem;">Número de póliza</div>
                      <div>${patient.insurance.policyNumber}</div>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <!-- Pestaña 2: Historial Médico -->
            <div class="tab-pane" data-tab="medical">
              ${patient.allergies && patient.allergies.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.5rem;">Alergias</div>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${patient.allergies.map(allergy => `
                      <span class="badge badge-danger">${allergy}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${patient.chronicDiseases ? `
                <div style="margin-bottom: 1.5rem;">
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.5rem;">Enfermedades crónicas</div>
                  <div class="card" style="background: var(--bg-light); padding: 1rem;">
                    ${patient.chronicDiseases}
                  </div>
                </div>
              ` : ''}
              
              ${patient.regularMeds ? `
                <div style="margin-bottom: 1.5rem;">
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.5rem;">Medicación habitual</div>
                  <div class="card" style="background: var(--bg-light); padding: 1rem;">
                    ${patient.regularMeds}
                  </div>
                </div>
              ` : ''}
              
              ${patient.surgeries ? `
                <div style="margin-bottom: 1.5rem;">
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.5rem;">Cirugías previas</div>
                  <div class="card" style="background: var(--bg-light); padding: 1rem;">
                    ${patient.surgeries}
                  </div>
                </div>
              ` : ''}
              
              ${patient.medicalNotes ? `
                <div>
                  <div style="font-weight: 500; color: var(--muted); margin-bottom: 0.5rem;">Observaciones médicas</div>
                  <div class="card" style="background: var(--bg-light); padding: 1rem;">
                    ${patient.medicalNotes}
                  </div>
                </div>
              ` : `
                <div class="text-center" style="padding: 2rem; color: var(--muted);">
                  No hay información médica registrada
                </div>
              `}
            </div>
            
            <!-- Pestaña 3: Citas -->
            <div class="tab-pane" data-tab="appointments">
              ${appointments.length > 0 ? `
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Médico</th>
                        <th>Área</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${appointments.slice(0, 10).map(appointment => {
                        const doctor = store.find('doctors', appointment.doctorId);
                        const area = store.find('areas', appointment.areaId);
                        const date = new Date(appointment.dateTime);
                        
                        return `
                          <tr>
                            <td>
                              <div>${date.toLocaleDateString('es-ES')}</div>
                              <div class="text-xs text-muted">${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>
                            <td>${doctor?.name || 'N/A'}</td>
                            <td>${area?.name || 'N/A'}</td>
                            <td>${appointment.reason || ''}</td>
                            <td>
                              <span class="badge ${appointment.status === 'completed' ? 'badge-success' : 
                                                   appointment.status === 'scheduled' ? 'badge-info' : 
                                                   appointment.status === 'confirmed' ? 'badge-warning' : 'badge-danger'}">
                                ${appointment.status === 'scheduled' ? 'Programada' :
                                  appointment.status === 'confirmed' ? 'Confirmada' :
                                  appointment.status === 'completed' ? 'Completada' : 'Cancelada'}
                              </span>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
                ${appointments.length > 10 ? `
                  <div class="text-center mt-3">
                    <span class="text-muted text-sm">
                      ${appointments.length - 10} citas más...
                    </span>
                  </div>
                ` : ''}
              ` : `
                <div class="text-center" style="padding: 2rem; color: var(--muted);">
                  No hay citas registradas para este paciente
                </div>
              `}
            </div>
            
            <!-- Pestaña 4: Registros clínicos -->
            <div class="tab-pane" data-tab="records">
              ${clinicalRecords.length > 0 ? `
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Diagnóstico</th>
                        <th>Médico</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${clinicalRecords.slice(0, 10).map(record => {
                        const doctor = store.find('doctors', record.doctorId);
                        const date = new Date(record.date);
                        
                        return `
                          <tr>
                            <td>${date.toLocaleDateString('es-ES')}</td>
                            <td>
                              <span class="badge ${record.type === 'consultation' ? 'badge-info' : 
                                                   record.type === 'emergency' ? 'badge-danger' : 
                                                   record.type === 'followup' ? 'badge-success' : 'badge-warning'}">
                                ${record.type === 'consultation' ? 'Consulta' :
                                  record.type === 'emergency' ? 'Urgencia' :
                                  record.type === 'followup' ? 'Control' :
                                  record.type === 'lab' ? 'Laboratorio' : 'Prescripción'}
                              </span>
                            </td>
                            <td>${record.diagnosis?.substring(0, 50) || 'Sin diagnóstico'}...</td>
                            <td>${doctor?.name || 'N/A'}</td>
                            <td>
                              <button class="btn btn-outline btn-sm" data-action="view-record" data-id="${record.id}">
                                Ver
                              </button>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
                ${clinicalRecords.length > 10 ? `
                  <div class="text-center mt-3">
                    <span class="text-muted text-sm">
                      ${clinicalRecords.length - 10} registros más...
                    </span>
                  </div>
                ` : ''}
              ` : `
                <div class="text-center" style="padding: 2rem; color: var(--muted);">
                  No hay registros clínicos para este paciente
                </div>
              `}
            </div>
          </div>
        </div>
        
        <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: space-between;">
          <div style="font-size: 0.75rem; color: var(--muted);">
            Registrado el ${new Date(patient.createdAt).toLocaleDateString('es-ES')}
          </div>
          <div class="flex gap-2">
            ${role === 'admin' || role === 'doctor' ? `
              <button class="btn btn-primary" id="btn-edit-patient" data-id="${patient.id}">
                Editar paciente
              </button>
              <button class="btn btn-outline" id="btn-new-appointment-for-patient" data-id="${patient.id}">
                Nueva cita
              </button>
            ` : ''}
            <button class="btn btn-outline" id="close-view-patient-btn-2">Cerrar</button>
          </div>
        </div>
      </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(modalContainer);
    
    // Configurar event listeners
    const closeModal = () => modalContainer.remove();
    
    const closeBtn1 = modalContainer.querySelector('#close-view-patient-btn');
    const closeBtn2 = modalContainer.querySelector('#close-view-patient-btn-2');
    const editBtn = modalContainer.querySelector('#btn-edit-patient');
    const newAppointmentBtn = modalContainer.querySelector('#btn-new-appointment-for-patient');
    const viewRecordBtns = modalContainer.querySelectorAll('[data-action="view-record"]');
    
    if (closeBtn1) closeBtn1.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
    
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        closeModal();
        editPatient(patient);
      });
    }
    
    if (newAppointmentBtn) {
      newAppointmentBtn.addEventListener('click', () => {
        closeModal();
        createAppointmentForPatient(patient);
      });
    }
    
    if (viewRecordBtns) {
      viewRecordBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const recordId = btn.dataset.id;
          viewClinicalRecord(recordId);
        });
      });
    }
    
    // Tabs dentro del modal
    const tabBtns = modalContainer.querySelectorAll('.tab-btn');
    const tabPanes = modalContainer.querySelectorAll('.tab-pane');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Actualizar botones
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Actualizar contenido
        tabPanes.forEach(pane => {
          pane.classList.remove('active');
          if (pane.dataset.tab === tab) {
            pane.classList.add('active');
          }
        });
      });
    });
    
    // Cerrar al hacer clic fuera o con ESC
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // Ver historial clínico completo
  function viewClinicalHistory(patient) {
    state.selectedPatient = patient;
    state.showClinicalHistory = true;
    
    if (elements.clinicalHistoryModal) {
      elements.clinicalHistoryModal.classList.remove('hidden');
    }
    
    if (elements.patientHistoryName) {
      elements.patientHistoryName.textContent = patient.name;
    }
    
    renderClinicalHistory();
  }

  // Renderizar historial clínico
  function renderClinicalHistory() {
    if (!elements.clinicalHistoryContent || !state.selectedPatient) return;
    
    const patientRecords = state.clinicalRecords
      .filter(cr => cr.patientId === state.selectedPatient.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (patientRecords.length === 0) {
      elements.clinicalHistoryContent.innerHTML = `
        <div class="text-center" style="padding: 3rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📋</div>
          <h3>No hay historial clínico</h3>
          <p class="text-muted">Este paciente no tiene registros clínicos</p>
        </div>
      `;
      return;
    }
    
    elements.clinicalHistoryContent.innerHTML = `
      <div class="timeline">
        ${patientRecords.map(record => {
          const doctor = store.find('doctors', record.doctorId);
          const date = new Date(record.date);
          
          return `
            <div class="timeline-item">
              <div class="timeline-date">
                ${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                <span style="color: var(--muted);"> • ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div class="timeline-content">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                  <div>
                    <h4 style="margin: 0;">
                      ${record.type === 'consultation' ? 'Consulta médica' :
                        record.type === 'emergency' ? 'Urgencia' :
                        record.type === 'followup' ? 'Control de seguimiento' :
                        record.type === 'lab' ? 'Resultados de laboratorio' : 'Prescripción médica'}
                    </h4>
                    <div style="font-size: 0.875rem; color: var(--muted);">
                      ${doctor?.name || 'Médico no especificado'}
                    </div>
                  </div>
                  <span class="badge ${record.type === 'consultation' ? 'badge-info' : 
                                       record.type === 'emergency' ? 'badge-danger' : 
                                       record.type === 'followup' ? 'badge-success' : 'badge-warning'}">
                    ${record.type === 'consultation' ? 'Consulta' :
                      record.type === 'emergency' ? 'Urgencia' :
                      record.type === 'followup' ? 'Control' :
                      record.type === 'lab' ? 'Laboratorio' : 'Prescripción'}
                  </span>
                </div>
                
                ${record.symptoms ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">Síntomas</div>
                    <div>${record.symptoms}</div>
                  </div>
                ` : ''}
                
                ${record.diagnosis ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">Diagnóstico</div>
                    <div>${record.diagnosis}</div>
                  </div>
                ` : ''}
                
                ${record.treatment ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">Tratamiento</div>
                    <div>${record.treatment}</div>
                  </div>
                ` : ''}
                
                ${record.prescriptions && record.prescriptions.length > 0 ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">Medicamentos recetados</div>
                    <ul style="padding-left: 1.5rem; margin: 0;">
                      ${record.prescriptions.map(p => `
                        <li>${p.medication} - ${p.dosage} (${p.frequency}, ${p.duration})</li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                
                ${record.notes ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">Notas</div>
                    <div>${record.notes}</div>
                  </div>
                ` : ''}
                
                ${record.vitalSigns ? `
                  <div>
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">Signos vitales</div>
                    <div class="grid grid-3" style="font-size: 0.875rem;">
                      ${record.vitalSigns.bloodPressure ? `
                        <div>
                          <span style="color: var(--muted);">Presión:</span>
                          <span style="font-weight: 500;">${record.vitalSigns.bloodPressure}</span>
                        </div>
                      ` : ''}
                      ${record.vitalSigns.heartRate ? `
                        <div>
                          <span style="color: var(--muted);">Ritmo cardíaco:</span>
                          <span style="font-weight: 500;">${record.vitalSigns.heartRate} lpm</span>
                        </div>
                      ` : ''}
                      ${record.vitalSigns.temperature ? `
                        <div>
                          <span style="color: var(--muted);">Temperatura:</span>
                          <span style="font-weight: 500;">${record.vitalSigns.temperature}°C</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                ` : ''}
                
                <div style="border-top: 1px solid var(--border); margin-top: 1rem; padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 0.75rem; color: var(--muted);">
                    Registrado el ${new Date(record.createdAt).toLocaleDateString('es-ES')}
                  </div>
                  <button class="btn btn-outline btn-sm" onclick="viewFullRecord('${record.id}')">
                    Ver completo
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Ver registro clínico completo
  function viewClinicalRecord(recordId) {
    // Navegar al módulo de historia clínica
    if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
      window.APP_STATE.appShell.navigateTo('clinical');
      
      // Guardar el ID del registro para mostrar detalles
      localStorage.setItem('clinical_view_record', recordId);
      
      // Cerrar modales abiertos
      state.showClinicalHistory = false;
      if (elements.clinicalHistoryModal) {
        elements.clinicalHistoryModal.classList.add('hidden');
      }
      
      // Mostrar notificación
      setTimeout(() => {
        showNotification('Cargando registro clínico...', 'info');
      }, 300);
    }
  }

  // Crear cita para paciente
  function createAppointmentForPatient(patient) {
    // Navegar al módulo de citas
    if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
      window.APP_STATE.appShell.navigateTo('appointments');
      
      // Guardar datos para prellenar el formulario
      const appointmentData = {
        patientId: patient.id,
        patientName: patient.name,
        source: 'patients'
      };
      
      localStorage.setItem('appointment_form_data', JSON.stringify(appointmentData));
      
      // Mostrar notificación
      setTimeout(() => {
        showNotification(`Creando cita para ${patient.name}...`, 'info');
      }, 300);
    }
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
  
  // Función global para ver registro completo
  window.viewFullRecord = viewClinicalRecord;
  
  return {
    refresh: loadData,
    
    destroy() {
      if (unsubscribe) unsubscribe();
      delete window.viewFullRecord;
    }
  };
}