/**
 * Módulo de Pacientes - Gestión completa
 */

export default function mountPatients(root, { bus, store, user, role }) {
  const state = {
    patients: [],
    filters: {
      search: '',
      gender: '',
      status: 'active',
      ageFrom: '',
      ageTo: ''
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
    loadPatients();
    
    // Suscribirse a cambios
    const unsubscribe = store.subscribe('patients', () => {
      loadPatients();
    });
    
    return unsubscribe;
  }

  // Cargar pacientes
  function loadPatients() {
    let patients = store.get('patients');
    
    // Aplicar filtros
    patients = applyFilters(patients);
    
    // Aplicar orden (por defecto: más recientes primero)
    patients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    state.patients = patients;
    renderPatientsList();
    updateStats();
  }

  // Aplicar filtros
  function applyFilters(patients) {
    return patients.filter(patient => {
      // Filtro de búsqueda
      if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        const searchFields = [
          patient.name,
          patient.dni,
          patient.email,
          patient.phone,
          patient.address
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }
      
      // Filtro por género
      if (state.filters.gender && patient.gender !== state.filters.gender) {
        return false;
      }
      
      // Filtro por estado
      if (state.filters.status) {
        if (state.filters.status === 'active' && !patient.isActive) {
          return false;
        }
        if (state.filters.status === 'inactive' && patient.isActive !== false) {
          return false;
        }
      }
      
      // Filtro por edad
      if (state.filters.ageFrom || state.filters.ageTo) {
        const age = calculateAge(patient.birthDate);
        if (state.filters.ageFrom && age < parseInt(state.filters.ageFrom)) {
          return false;
        }
        if (state.filters.ageTo && age > parseInt(state.filters.ageTo)) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Calcular edad
  function calculateAge(birthDate) {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Formatear fecha
  function formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES');
  }

  // Renderizar componente principal
  function render() {
    const canManage = role === 'admin' || role === 'doctor';
    
    root.innerHTML = `
      <div class="module-patients">
        <!-- Header -->
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <h2>Pacientes</h2>
              <p class="text-muted">Gestión de pacientes del hospital</p>
            </div>
            ${canManage ? `
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
          <h3 class="mb-3">Búsqueda y Filtros</h3>
          <div class="grid grid-5">
            <div class="form-group">
              <label class="form-label">Buscar</label>
              <input type="text" class="input" id="filter-search" placeholder="Nombre, DNI, teléfono...">
            </div>
            
            <div class="form-group">
              <label class="form-label">Género</label>
              <select class="input" id="filter-gender">
                <option value="">Todos</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="input" id="filter-status">
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="">Todos</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Edad desde</label>
              <input type="number" class="input" id="filter-age-from" placeholder="18" min="0" max="120">
            </div>
            
            <div class="form-group">
              <label class="form-label">Edad hasta</label>
              <input type="number" class="input" id="filter-age-to" placeholder="65" min="0" max="120">
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

        <!-- Lista de pacientes -->
        <div class="card">
          <div class="card-header">
            <h3 style="margin: 0;">Pacientes registrados</h3>
            <div class="text-muted" id="patients-count">
              Cargando...
            </div>
          </div>
          
          <div class="table-responsive">
            <table class="table" id="patients-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>DNI</th>
                  <th>Edad</th>
                  <th>Teléfono</th>
                  <th>Última consulta</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="patients-list">
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
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">👤</div>
              <h3>No hay pacientes</h3>
              <p class="text-muted">No se encontraron pacientes con los filtros aplicados</p>
              ${canManage ? `
                <button class="btn btn-primary mt-3" id="btn-create-first-patient">
                  Registrar primer paciente
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para nuevo/editar paciente -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="patient-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 style="margin: 0;">${state.editingId ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>
            <button class="btn btn-outline btn-sm" id="btn-close-modal">×</button>
          </div>
          
          <div class="modal-body">
            <form id="patient-form">
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Nombre completo *</label>
                  <input type="text" class="input" id="form-name" required>
                </div>
                
                <div class="form-group">
                  <label class="form-label">DNI/NIE *</label>
                  <input type="text" class="input" id="form-dni" required>
                </div>
              </div>
              
              <div class="grid grid-3">
                <div class="form-group">
                  <label class="form-label">Fecha de nacimiento *</label>
                  <input type="date" class="input" id="form-birth-date" required>
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
                  <label class="form-label">Grupo sanguíneo</label>
                  <select class="input" id="form-blood-type">
                    <option value="">Desconocido</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              
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
                <textarea class="input" id="form-address" rows="2" placeholder="Calle, número, ciudad, código postal..."></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Alergias</label>
                <textarea class="input" id="form-allergies" rows="2" placeholder="Lista de alergias separadas por comas..."></textarea>
                <div class="form-hint">Ej: Penicilina, Ibuprofeno, Polen</div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Notas médicas</label>
                <textarea class="input" id="form-notes" rows="3" placeholder="Notas importantes sobre el paciente..."></textarea>
              </div>
              
              ${state.editingId ? `
                <div class="form-group">
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
      patientsList: root.querySelector('#patients-list'),
      patientsCount: root.querySelector('#patients-count'),
      emptyState: root.querySelector('#empty-state'),
      patientsTable: root.querySelector('#patients-table'),
      pagination: root.querySelector('#pagination'),
      
      // Filtros
      filterSearch: root.querySelector('#filter-search'),
      filterGender: root.querySelector('#filter-gender'),
      filterStatus: root.querySelector('#filter-status'),
      filterAgeFrom: root.querySelector('#filter-age-from'),
      filterAgeTo: root.querySelector('#filter-age-to'),
      btnClearFilters: root.querySelector('#btn-clear-filters'),
      btnApplyFilters: root.querySelector('#btn-apply-filters'),
      
      // Modal
      modal: root.querySelector('#patient-modal'),
      form: root.querySelector('#patient-form'),
      formName: root.querySelector('#form-name'),
      formDni: root.querySelector('#form-dni'),
      formBirthDate: root.querySelector('#form-birth-date'),
      formGender: root.querySelector('#form-gender'),
      formBloodType: root.querySelector('#form-blood-type'),
      formPhone: root.querySelector('#form-phone'),
      formEmail: root.querySelector('#form-email'),
      formAddress: root.querySelector('#form-address'),
      formAllergies: root.querySelector('#form-allergies'),
      formNotes: root.querySelector('#form-notes'),
      formStatus: root.querySelector('#form-status'),
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewPatient: root.querySelector('#btn-new-patient'),
      btnCreateFirstPatient: root.querySelector('#btn-create-first-patient')
    };
    
    // Cargar pacientes iniciales
    loadPatients();
  }

  // Renderizar lista de pacientes
  function renderPatientsList() {
    if (!elements.patientsList) return;
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedPatients = state.patients.slice(startIndex, endIndex);
    
    if (paginatedPatients.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.patientsTable.classList.add('hidden');
      elements.pagination.classList.add('hidden');
      elements.patientsCount.textContent = '0 pacientes';
      return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.patientsTable.classList.remove('hidden');
    elements.pagination.classList.remove('hidden');
    
    elements.patientsCount.textContent = `${state.patients.length} ${state.patients.length === 1 ? 'paciente' : 'pacientes'}`;
    
    const rows = paginatedPatients.map(patient => {
      const age = calculateAge(patient.birthDate);
      const lastAppointment = getLastAppointment(patient.id);
      
      // Acciones disponibles
      const canEdit = role === 'admin' || role === 'doctor';
      const canView = true;
      
      return `
        <tr>
          <td>
            <div style="font-weight: 500;">${patient.name}</div>
            <div class="text-xs text-muted">${patient.email || 'Sin email'}</div>
          </td>
          <td>${patient.dni || 'N/A'}</td>
          <td>
            <div>${age !== null ? `${age} años` : 'N/A'}</div>
            <div class="text-xs text-muted">${formatDate(patient.birthDate)}</div>
          </td>
          <td>${patient.phone || 'N/A'}</td>
          <td>
            ${lastAppointment ? `
              <div>${formatDate(lastAppointment.dateTime)}</div>
              <div class="text-xs text-muted">${lastAppointment.reason || 'Consulta'}</div>
            ` : 'Sin consultas'}
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
              
              ${canEdit ? `
                <button class="btn btn-outline btn-sm" data-action="edit" data-id="${patient.id}">
                  Editar
                </button>
                
                <button class="btn btn-outline btn-sm" data-action="history" data-id="${patient.id}">
                  Historia
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    elements.patientsList.innerHTML = rows;
    renderPagination();
  }

  // Obtener última cita del paciente
  function getLastAppointment(patientId) {
    const appointments = store.get('appointments')
      .filter(a => a.patientId === patientId)
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    return appointments[0] || null;
  }

  // Renderizar paginación
  function renderPagination() {
    if (!elements.pagination) return;
    
    const totalPages = Math.ceil(state.patients.length / state.itemsPerPage);
    
    if (totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }
    
    elements.pagination.innerHTML = `
      <div class="text-sm text-muted">
        Mostrando ${Math.min(state.currentPage * state.itemsPerPage, state.patients.length)} de ${state.patients.length} pacientes
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
    
    const patients = store.get('patients');
    const appointments = store.get('appointments');
    
    const stats = {
      total: patients.length,
      active: patients.filter(p => p.isActive).length,
      todayAppointments: appointments.filter(a => {
        const today = new Date().toDateString();
        return new Date(a.dateTime).toDateString() === today;
      }).length,
      averageAge: calculateAverageAge(patients)
    };
    
    elements.statsContainer.innerHTML = `
      <div class="card">
        <div class="text-muted text-sm">Total pacientes</div>
        <div class="text-2xl font-bold" style="color: var(--accent);">${stats.total}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Pacientes activos</div>
        <div class="text-2xl font-bold" style="color: var(--success);">${stats.active}</div>
        <div class="text-xs text-muted mt-1">${Math.round((stats.active / stats.total) * 100)}% del total</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Citas hoy</div>
        <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.todayAppointments}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Edad promedio</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${stats.averageAge}</div>
        <div class="text-xs text-muted mt-1">años</div>
      </div>
    `;
  }

  // Calcular edad promedio
  function calculateAverageAge(patients) {
    const validAges = patients
      .map(p => calculateAge(p.birthDate))
      .filter(age => age !== null);
    
    if (validAges.length === 0) return 0;
    
    const sum = validAges.reduce((a, b) => a + b, 0);
    return Math.round(sum / validAges.length);
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
          loadPatients();
        }, 300);
      });
    }
    
    // Modal
    if (elements.btnNewPatient) {
      elements.btnNewPatient.addEventListener('click', () => openModal());
    }
    
    if (elements.btnCreateFirstPatient) {
      elements.btnCreateFirstPatient.addEventListener('click', () => openModal());
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
    
    // Acciones en la lista
    if (elements.patientsList) {
      elements.patientsList.addEventListener('click', handleListAction);
    }
    
    // Paginación
    if (elements.pagination) {
      elements.pagination.addEventListener('click', handlePagination);
    }
    
    // Enter en búsqueda
    if (elements.filterSearch) {
      elements.filterSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          applyFiltersHandler();
        }
      });
    }
  }

  // Manejar filtros
  function applyFiltersHandler() {
    state.filters = {
      search: elements.filterSearch?.value || '',
      gender: elements.filterGender?.value || '',
      status: elements.filterStatus?.value || 'active',
      ageFrom: elements.filterAgeFrom?.value || '',
      ageTo: elements.filterAgeTo?.value || ''
    };
    
    state.currentPage = 1; // Volver a primera página
    loadPatients();
  }

  function clearFiltersHandler() {
    if (elements.filterSearch) elements.filterSearch.value = '';
    if (elements.filterGender) elements.filterGender.value = '';
    if (elements.filterStatus) elements.filterStatus.value = 'active';
    if (elements.filterAgeFrom) elements.filterAgeFrom.value = '';
    if (elements.filterAgeTo) elements.filterAgeTo.value = '';
    
    state.filters = {
      search: '',
      gender: '',
      status: 'active',
      ageFrom: '',
      ageTo: ''
    };
    
    state.currentPage = 1;
    loadPatients();
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
          renderPatientsList();
        }
        break;
        
      case 'next':
        const totalPages = Math.ceil(state.patients.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderPatientsList();
        }
        break;
        
      default:
        const pageNum = parseInt(pageAction);
        if (!isNaN(pageNum)) {
          state.currentPage = pageNum;
          renderPatientsList();
        }
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
      case 'view':
        viewPatient(patient);
        break;
      case 'edit':
        editPatient(patient);
        break;
      case 'history':
        viewMedicalHistory(patient);
        break;
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
    if (elements.formName) elements.formName.value = patient.name || '';
    if (elements.formDni) elements.formDni.value = patient.dni || '';
    if (elements.formBirthDate) elements.formBirthDate.value = patient.birthDate || '';
    if (elements.formGender) elements.formGender.value = patient.gender || '';
    if (elements.formBloodType) elements.formBloodType.value = patient.bloodType || '';
    if (elements.formPhone) elements.formPhone.value = patient.phone || '';
    if (elements.formEmail) elements.formEmail.value = patient.email || '';
    if (elements.formAddress) elements.formAddress.value = patient.address || '';
    if (elements.formAllergies) elements.formAllergies.value = Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies || '';
    if (elements.formNotes) elements.formNotes.value = patient.notes || '';
    if (elements.formStatus) elements.formStatus.value = patient.isActive ? 'active' : 'inactive';
  }

  // Limpiar formulario
  function clearForm() {
    if (elements.form) elements.form.reset();
  }

  // Guardar paciente
  async function savePatient() {
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
        // Actualizar paciente existente
        await updatePatient(state.editingId, formData);
        showNotification('Paciente actualizado correctamente', 'success');
      } else {
        // Crear nuevo paciente
        await createPatient(formData);
        showNotification('Paciente registrado correctamente', 'success');
      }
      
      closeModal();
      loadPatients();
      
    } catch (error) {
      console.error('Error guardando paciente:', error);
      showNotification('Error al guardar el paciente', 'error');
    } finally {
      state.isLoading = false;
      if (elements.btnSave) {
        elements.btnSave.disabled = false;
        elements.btnSave.textContent = state.editingId ? 'Actualizar' : 'Guardar';
      }
    }
  }

  // Validar formulario
  function validateForm() {
    let isValid = true;
    
    const requiredFields = [
      elements.formName,
      elements.formDni,
      elements.formBirthDate,
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
    
    // Validar DNI
    if (elements.formDni && elements.formDni.value.trim()) {
      const dniRegex = /^[0-9]{8}[A-Z]$/i;
      if (!dniRegex.test(elements.formDni.value.trim())) {
        elements.formDni.classList.add('error');
        showNotification('El DNI debe tener 8 números seguidos de una letra', 'warning');
        return false;
      }
    }
    
    // Validar email si se proporciona
    if (elements.formEmail && elements.formEmail.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(elements.formEmail.value.trim())) {
        elements.formEmail.classList.add('error');
        showNotification('Por favor, ingrese un email válido', 'warning');
        return false;
      }
    }
    
    // Validar fecha de nacimiento
    if (elements.formBirthDate && elements.formBirthDate.value) {
      const birthDate = new Date(elements.formBirthDate.value);
      const today = new Date();
      
      if (birthDate > today) {
        elements.formBirthDate.classList.add('error');
        showNotification('La fecha de nacimiento no puede ser en el futuro', 'warning');
        return false;
      }
      
      const age = calculateAge(elements.formBirthDate.value);
      if (age < 0 || age > 120) {
        elements.formBirthDate.classList.add('error');
        showNotification('La edad debe estar entre 0 y 120 años', 'warning');
        return false;
      }
    }
    
    return isValid;
  }

  // Obtener datos del formulario
  function getFormData() {
    const allergies = elements.formAllergies.value
      ? elements.formAllergies.value.split(',').map(a => a.trim()).filter(a => a)
      : [];
    
    return {
      name: elements.formName.value.trim(),
      dni: elements.formDni.value.trim().toUpperCase(),
      birthDate: elements.formBirthDate.value,
      gender: elements.formGender.value,
      bloodType: elements.formBloodType.value || null,
      phone: elements.formPhone.value.trim(),
      email: elements.formEmail.value.trim() || null,
      address: elements.formAddress.value.trim() || null,
      allergies: allergies,
      notes: elements.formNotes.value.trim() || null,
      isActive: elements.formStatus ? elements.formStatus.value === 'active' : true
    };
  }

  // Crear nuevo paciente
  async function createPatient(data) {
    return store.add('patients', data);
  }

  // Actualizar paciente existente
  async function updatePatient(id, data) {
    return store.update('patients', id, data);
  }

  // Ver paciente
  function viewPatient(patient) {
    const appointments = store.get('appointments')
      .filter(a => a.patientId === patient.id)
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    const lastAppointment = appointments[0];
    const age = calculateAge(patient.birthDate);
    
    // Crear modal
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
          <h3 style="margin: 0;">${patient.name}</h3>
          <button class="btn btn-outline btn-sm" id="close-view-patient-modal">×</button>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <!-- Información básica -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 1rem;">Información personal</h4>
            <div class="grid grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
              <div>
                <div class="text-muted text-sm">DNI</div>
                <div class="font-bold">${patient.dni || 'N/A'}</div>
              </div>
              <div>
                <div class="text-muted text-sm">Edad</div>
                <div class="font-bold">${age !== null ? `${age} años` : 'N/A'}</div>
              </div>
              <div>
                <div class="text-muted text-sm">Género</div>
                <div class="font-bold">${patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}</div>
              </div>
              <div>
                <div class="text-muted text-sm">Teléfono</div>
                <div class="font-bold">${patient.phone || 'N/A'}</div>
              </div>
              <div>
                <div class="text-muted text-sm">Email</div>
                <div class="font-bold">${patient.email || 'N/A'}</div>
              </div>
              <div>
                <div class="text-muted text-sm">Grupo sanguíneo</div>
                <div class="font-bold">${patient.bloodType || 'Desconocido'}</div>
              </div>
            </div>
            
            ${patient.address ? `
              <div style="margin-top: 1rem;">
                <div class="text-muted text-sm">Dirección</div>
                <div>${patient.address}</div>
              </div>
            ` : ''}
          </div>
          
          <!-- Información médica -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 1rem;">Información médica</h4>
            
            ${patient.allergies && patient.allergies.length > 0 ? `
              <div style="margin-bottom: 1rem;">
                <div class="text-muted text-sm">Alergias</div>
                <div>
                  ${patient.allergies.map(allergy => `
                    <span class="badge badge-danger" style="margin-right: 0.25rem; margin-bottom: 0.25rem;">${allergy}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            
            ${patient.notes ? `
              <div>
                <div class="text-muted text-sm">Notas médicas</div>
                <div style="padding: 0.75rem; background: var(--bg-light); border-radius: var(--radius); margin-top: 0.5rem;">
                  ${patient.notes}
                </div>
              </div>
            ` : ''}
          </div>
          
          <!-- Historial de citas -->
          <div class="card">
            <h4 style="margin-bottom: 1rem;">Últimas consultas</h4>
            
            ${appointments.length > 0 ? `
              <div class="table-responsive">
                <table class="table" style="font-size: 0.875rem;">
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
                    ${appointments.slice(0, 5).map(appointment => {
                      const doctor = store.find('doctors', appointment.doctorId);
                      const area = store.find('areas', appointment.areaId);
                      
                      return `
                        <tr>
                          <td>${formatDate(appointment.dateTime)}</td>
                          <td>${doctor?.name || 'N/A'}</td>
                          <td>${area?.name || 'N/A'}</td>
                          <td>${appointment.reason || 'Consulta'}</td>
                          <td>
                            <span class="badge ${appointment.status === 'completed' ? 'badge-success' : 
                                               appointment.status === 'cancelled' ? 'badge-danger' : 
                                               appointment.status === 'confirmed' ? 'badge-warning' : 'badge-info'}">
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
              
              ${appointments.length > 5 ? `
                <div class="text-center mt-2">
                  <span class="text-muted text-sm">Mostrando 5 de ${appointments.length} citas</span>
                </div>
              ` : ''}
            ` : `
              <div class="text-center" style="padding: 2rem;">
                <div style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem;">📅</div>
                <p class="text-muted">No hay consultas registradas</p>
              </div>
            `}
          </div>
        </div>
        
        <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.5rem;">
          ${(role === 'admin' || role === 'doctor') ? `
            <button class="btn btn-outline" id="edit-patient-btn" data-id="${patient.id}">
              Editar paciente
            </button>
            <button class="btn btn-primary" id="new-appointment-btn" data-id="${patient.id}">
              Nueva cita
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
    
    // Botón de cerrar en header
    const closeBtn1 = modalContainer.querySelector('#close-view-patient-modal');
    if (closeBtn1) {
      closeBtn1.addEventListener('click', closeModalHandler);
    }
    
    // Botón de cerrar en footer
    const closeBtn2 = modalContainer.querySelector('#close-modal-btn');
    if (closeBtn2) {
      closeBtn2.addEventListener('click', closeModalHandler);
    }
    
    // Botón de editar
    const editBtn = modalContainer.querySelector('#edit-patient-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        closeModalHandler();
        editPatient(patient);
      });
    }
    
    // Botón de nueva cita
    const newAppointmentBtn = modalContainer.querySelector('#new-appointment-btn');
    if (newAppointmentBtn) {
      newAppointmentBtn.addEventListener('click', () => {
        closeModalHandler();
        createAppointmentForPatient(patient);
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

  // Editar paciente
  function editPatient(patient) {
    openModal(patient);
  }

  // Ver historial médico
  function viewMedicalHistory(patient) {
    if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
      // Pasar el ID del paciente como parámetro
      window.APP_STATE.appShell.navigateTo('clinical');
      
      // Usar un pequeño delay para asegurar que el módulo se cargue
      setTimeout(() => {
        // Podríamos usar el store o localStorage para pasar el filtro
        localStorage.setItem('clinical_patient_filter', patient.id);
        showNotification(`Cargando historia clínica de ${patient.name}`, 'info');
      }, 500);
    }
  }

  // Crear cita para paciente
  function createAppointmentForPatient(patient) {
    // Navegar al módulo de citas con el paciente pre-seleccionado
    if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
      window.APP_STATE.appShell.navigateTo('appointments');
      
      // Usar un pequeño delay para asegurar que el módulo se cargue
      setTimeout(() => {
        // Podríamos pasar el paciente como parámetro o usar el store
        showNotification(`Crear cita para ${patient.name}`, 'info');
      }, 500);
    }
  }

  // Mostrar notificación
  function showNotification(message, type = 'info') {
    // Misma función de notificación que en appointments
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
    refresh: loadPatients,
    
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}