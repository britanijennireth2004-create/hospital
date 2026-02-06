/**
 * Módulo de Médicos - Gestión completa
 */

export default function mountDoctors(root, { bus, store, user, role }) {
  const state = {
    doctors: [],
    filters: {
      search: '',
      specialty: '',
      areaId: '',
      status: 'active'
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
    loadDoctors();
    
    // Suscribirse a cambios en el store
    const unsubscribe = store.subscribe('doctors', () => {
      loadDoctors();
    });
    
    return unsubscribe;
  }

  // Cargar médicos
  function loadDoctors() {
    let doctors = store.get('doctors');
    
    // Aplicar filtros
    doctors = applyFilters(doctors);
    
    // Aplicar orden (por defecto: alfabético)
    doctors.sort((a, b) => a.name.localeCompare(b.name));
    
    state.doctors = doctors;
    renderDoctorsList();
    updateStats();
  }

  // Aplicar filtros
  function applyFilters(doctors) {
    return doctors.filter(doctor => {
      // Filtro de búsqueda
      if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        const searchFields = [
          doctor.name,
          doctor.specialty,
          doctor.license,
          doctor.email,
          doctor.phone
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }
      
      // Filtro por especialidad
      if (state.filters.specialty && doctor.specialty !== state.filters.specialty) {
        return false;
      }
      
      // Filtro por área
      if (state.filters.areaId && doctor.areaId !== state.filters.areaId) {
        return false;
      }
      
      // Filtro por estado
      if (state.filters.status) {
        if (state.filters.status === 'active' && !doctor.isActive) {
          return false;
        }
        if (state.filters.status === 'inactive' && doctor.isActive !== false) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Obtener estadísticas de médico
  function getDoctorStats(doctorId) {
    const appointments = store.get('appointments');
    const today = new Date();
    
    return {
      totalAppointments: appointments.filter(a => a.doctorId === doctorId).length,
      todayAppointments: appointments.filter(a => {
        const appointmentDate = new Date(a.dateTime);
        return a.doctorId === doctorId && 
               appointmentDate.toDateString() === today.toDateString();
      }).length,
      upcomingAppointments: appointments.filter(a => {
        const appointmentDate = new Date(a.dateTime);
        return a.doctorId === doctorId && 
               appointmentDate > today && 
               a.status === 'scheduled';
      }).length,
      completedAppointments: appointments.filter(a => 
        a.doctorId === doctorId && a.status === 'completed'
      ).length
    };
  }

  // Formatear horario
  function formatSchedule(schedule) {
    if (!schedule) return 'No definido';
    if (typeof schedule === 'string') return schedule;
    
    // Si schedule es un objeto, formatearlo
    try {
      const days = {
        monday: 'Lun',
        tuesday: 'Mar',
        wednesday: 'Mié',
        thursday: 'Jue',
        friday: 'Vie',
        saturday: 'Sáb',
        sunday: 'Dom'
      };
      
      return Object.entries(schedule)
        .filter(([day, hours]) => hours && hours.start && hours.end)
        .map(([day, hours]) => 
          `${days[day] || day}: ${hours.start}-${hours.end}`
        )
        .join(', ');
    } catch {
      return 'Horario personalizado';
    }
  }

  // Renderizar componente principal
  function render() {
    const canManage = role === 'admin' || role === 'doctor';
    
    root.innerHTML = `
      <div class="module-doctors">
        <!-- Header -->
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <h2>Médicos</h2>
              <p class="text-muted">Gestión del personal médico</p>
            </div>
            ${canManage ? `
              <button class="btn btn-primary" id="btn-new-doctor">
                <span>+</span> Nuevo Médico
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
          <div class="grid grid-4">
            <div class="form-group">
              <label class="form-label">Buscar</label>
              <input type="text" class="input" id="filter-search" 
                     placeholder="Nombre, especialidad, licencia...">
            </div>
            
            <div class="form-group">
              <label class="form-label">Especialidad</label>
              <select class="input" id="filter-specialty">
                <option value="">Todas</option>
                <option value="Medicina General">Medicina General</option>
                <option value="Pediatría">Pediatría</option>
                <option value="Ginecología">Ginecología</option>
                <option value="Cardiología">Cardiología</option>
                <option value="Dermatología">Dermatología</option>
                <option value="Ortopedia">Ortopedia</option>
                <option value="Oftalmología">Oftalmología</option>
                <option value="Psiquiatría">Psiquiatría</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Área</label>
              <select class="input" id="filter-area">
                <option value="">Todas las áreas</option>
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

        <!-- Lista de médicos -->
        <div class="card">
          <div class="card-header">
            <h3 style="margin: 0;">Médicos registrados</h3>
            <div class="text-muted" id="doctors-count">
              Cargando...
            </div>
          </div>
          
          <div class="table-responsive">
            <table class="table" id="doctors-table">
              <thead>
                <tr>
                  <th>Médico</th>
                  <th>Especialidad</th>
                  <th>Área</th>
                  <th>Horario</th>
                  <th>Citas hoy</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="doctors-list">
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
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">👨‍⚕️</div>
              <h3>No hay médicos</h3>
              <p class="text-muted">No se encontraron médicos con los filtros aplicados</p>
              ${canManage ? `
                <button class="btn btn-primary mt-3" id="btn-create-first">
                  Registrar primer médico
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para nuevo/editar médico -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="doctor-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 style="margin: 0;">${state.editingId ? 'Editar Médico' : 'Nuevo Médico'}</h3>
            <button class="btn btn-outline btn-sm" id="btn-close-modal">×</button>
          </div>
          
          <div class="modal-body">
            <form id="doctor-form">
              <!-- Información personal -->
              <div class="section-title mb-3">
                <h4 style="margin: 0;">Información personal</h4>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Nombre completo *</label>
                  <input type="text" class="input" id="form-name" required placeholder="Ej: Juan Pérez García">
                </div>
                
                <div class="form-group">
                  <label class="form-label">DNI/NIE</label>
                  <input type="text" class="input" id="form-dni" placeholder="Ej: 12345678A (opcional)">
                  <div class="form-hint">Formato: 8 dígitos + letra. Campo opcional.</div>
                </div>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Fecha de nacimiento</label>
                  <input type="date" class="input" id="form-birth-date">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Género</label>
                  <select class="input" id="form-gender">
                    <option value="">Seleccionar (opcional)</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>
              
              <!-- Información profesional -->
              <div class="section-title mb-3" style="margin-top: 1.5rem;">
                <h4 style="margin: 0;">Información profesional</h4>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Número de licencia *</label>
                  <input type="text" class="input" id="form-license" required placeholder="Ej: MED-123456">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Especialidad *</label>
                  <select class="input" id="form-specialty" required>
                    <option value="">Seleccionar especialidad *</option>
                    <option value="Medicina General">Medicina General</option>
                    <option value="Pediatría">Pediatría</option>
                    <option value="Ginecología">Ginecología</option>
                    <option value="Cardiología">Cardiología</option>
                    <option value="Dermatología">Dermatología</option>
                    <option value="Ortopedia">Ortopedia</option>
                    <option value="Oftalmología">Oftalmología</option>
                    <option value="Psiquiatría">Psiquiatría</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Área principal *</label>
                <select class="input" id="form-area" required>
                  <option value="">Seleccionar área *</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Otras áreas asignadas</label>
                <div id="other-areas-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                  <!-- Se llenará dinámicamente -->
                </div>
                <select class="input mt-2" id="form-add-area" style="width: 100%;">
                  <option value="">Agregar otra área...</option>
                </select>
              </div>
              
              <!-- Información de contacto -->
              <div class="section-title mb-3" style="margin-top: 1.5rem;">
                <h4 style="margin: 0;">Información de contacto</h4>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Teléfono *</label>
                  <input type="tel" class="input" id="form-phone" required placeholder="Ej: 600123456">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Email *</label>
                  <input type="email" class="input" id="form-email" required placeholder="Ej: medico@hospital.com">
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Dirección</label>
                <textarea class="input" id="form-address" rows="2" placeholder="Calle, número, ciudad, código postal... (opcional)"></textarea>
              </div>
              
              <!-- Horario y disponibilidad -->
              <div class="section-title mb-3" style="margin-top: 1.5rem;">
                <h4 style="margin: 0;">Horario de trabajo</h4>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Horario de entrada *</label>
                  <input type="time" class="input" id="form-schedule-start" required value="08:00">
                </div>
                
                <div class="form-group">
                  <label class="form-label">Horario de salida *</label>
                  <input type="time" class="input" id="form-schedule-end" required value="17:00">
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Días de trabajo</label>
                <div class="flex flex-wrap gap-2 mt-2">
                  ${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => `
                    <label class="checkbox-label">
                      <input type="checkbox" class="form-checkbox" value="${day.toLowerCase()}" checked>
                      ${day}
                    </label>
                  `).join('')}
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Duración de consulta (minutos) *</label>
                <select class="input" id="form-consultation-duration" required>
                  <option value="15">15 minutos</option>
                  <option value="30" selected>30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </div>
              
              ${state.editingId ? `
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="input" id="form-status">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="vacation">Vacaciones</option>
                    <option value="license">Licencia</option>
                  </select>
                </div>
              ` : ''}
              
              <div class="form-group">
                <label class="form-label">Notas</label>
                <textarea class="input" id="form-notes" rows="3" placeholder="Notas adicionales sobre el médico... (opcional)"></textarea>
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
      doctorsList: root.querySelector('#doctors-list'),
      doctorsCount: root.querySelector('#doctors-count'),
      emptyState: root.querySelector('#empty-state'),
      doctorsTable: root.querySelector('#doctors-table'),
      pagination: root.querySelector('#pagination'),
      
      // Filtros
      filterSearch: root.querySelector('#filter-search'),
      filterSpecialty: root.querySelector('#filter-specialty'),
      filterArea: root.querySelector('#filter-area'),
      filterStatus: root.querySelector('#filter-status'),
      btnClearFilters: root.querySelector('#btn-clear-filters'),
      btnApplyFilters: root.querySelector('#btn-apply-filters'),
      
      // Modal
      modal: root.querySelector('#doctor-modal'),
      form: root.querySelector('#doctor-form'),
      formName: root.querySelector('#form-name'),
      formDni: root.querySelector('#form-dni'),
      formBirthDate: root.querySelector('#form-birth-date'),
      formGender: root.querySelector('#form-gender'),
      formLicense: root.querySelector('#form-license'),
      formSpecialty: root.querySelector('#form-specialty'),
      formArea: root.querySelector('#form-area'),
      formAddArea: root.querySelector('#form-add-area'),
      otherAreasContainer: root.querySelector('#other-areas-container'),
      formPhone: root.querySelector('#form-phone'),
      formEmail: root.querySelector('#form-email'),
      formAddress: root.querySelector('#form-address'),
      formScheduleStart: root.querySelector('#form-schedule-start'),
      formScheduleEnd: root.querySelector('#form-schedule-end'),
      formConsultationDuration: root.querySelector('#form-consultation-duration'),
      formStatus: root.querySelector('#form-status'),
      formNotes: root.querySelector('#form-notes'),
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewDoctor: root.querySelector('#btn-new-doctor'),
      btnCreateFirst: root.querySelector('#btn-create-first')
    };
    
    // Cargar datos iniciales
    loadSelectData();
    loadDoctors();
  }

  // Cargar datos en selects
  function loadSelectData() {
    // Áreas para filtros
    if (elements.filterArea) {
      const areas = store.get('areas');
      const options = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      elements.filterArea.innerHTML = `<option value="">Todas las áreas</option>${options}`;
    }
    
    // Áreas para formulario principal
    if (elements.formArea) {
      const areas = store.get('areas');
      const options = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      elements.formArea.innerHTML = `<option value="">Seleccionar área *</option>${options}`;
    }
    
    // Áreas para agregar otras áreas
    if (elements.formAddArea) {
      const areas = store.get('areas');
      const options = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      elements.formAddArea.innerHTML = `<option value="">Agregar otra área...</option>${options}`;
    }
  }

  // Renderizar lista de médicos
  function renderDoctorsList() {
    if (!elements.doctorsList) return;
    
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    const paginatedDoctors = state.doctors.slice(startIndex, endIndex);
    
    if (paginatedDoctors.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.doctorsTable.classList.add('hidden');
      elements.pagination.classList.add('hidden');
      elements.doctorsCount.textContent = '0 médicos';
      return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.doctorsTable.classList.remove('hidden');
    elements.pagination.classList.remove('hidden');
    
    elements.doctorsCount.textContent = `${state.doctors.length} ${state.doctors.length === 1 ? 'médico' : 'médicos'}`;
    
    const rows = paginatedDoctors.map(doctor => {
      const stats = getDoctorStats(doctor.id);
      const area = store.find('areas', doctor.areaId);
      const canEdit = role === 'admin' || (role === 'doctor' && user?.doctorId === doctor.id);
      
      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 40px; height: 40px; background: ${doctor.isActive ? 'var(--accent)' : 'var(--muted)'}; 
                           border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                           color: white; font-weight: bold; font-size: 1rem;">
                ${doctor.name.charAt(0)}
              </div>
              <div>
                <div style="font-weight: 500;">${doctor.name}</div>
                <div class="text-xs text-muted">${doctor.license}</div>
              </div>
            </div>
          </td>
          <td>
            <div>${doctor.specialty}</div>
          </td>
          <td>${area?.name || 'No asignada'}</td>
          <td>
            <div class="text-sm">${formatSchedule(doctor.schedule)}</div>
            <div class="text-xs text-muted">${doctor.consultationDuration || 30} min/consulta</div>
          </td>
          <td>
            <div class="text-center">
              <div style="font-weight: bold; font-size: 1.25rem; color: ${stats.todayAppointments > 0 ? 'var(--accent-2)' : 'var(--muted)'}">
                ${stats.todayAppointments}
              </div>
              <div class="text-xs text-muted">de ${stats.totalAppointments}</div>
            </div>
          </td>
          <td>
            <span class="badge ${doctor.isActive ? 'badge-success' : 'badge-danger'}">
              ${doctor.isActive ? 'Activo' : 'Inactivo'}
              ${doctor.status === 'vacation' ? ' (Vacaciones)' : doctor.status === 'license' ? ' (Licencia)' : ''}
            </span>
          </td>
          <td>
            <div class="flex gap-2">
              <button class="btn btn-outline btn-sm" data-action="view" data-id="${doctor.id}">
                Ver
              </button>
              
              ${canEdit ? `
                <button class="btn btn-outline btn-sm" data-action="edit" data-id="${doctor.id}">
                  Editar
                </button>
                
                <button class="btn btn-outline btn-sm" data-action="schedule" data-id="${doctor.id}">
                  Agenda
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    elements.doctorsList.innerHTML = rows;
    renderPagination();
  }

  // Renderizar paginación
  function renderPagination() {
    if (!elements.pagination) return;
    
    const totalPages = Math.ceil(state.doctors.length / state.itemsPerPage);
    
    if (totalPages <= 1) {
      elements.pagination.innerHTML = '';
      return;
    }
    
    elements.pagination.innerHTML = `
      <div class="text-sm text-muted">
        Mostrando ${Math.min(state.currentPage * state.itemsPerPage, state.doctors.length)} de ${state.doctors.length} médicos
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
    
    const doctors = store.get('doctors');
    const appointments = store.get('appointments');
    
    const stats = {
      total: doctors.length,
      active: doctors.filter(d => d.isActive).length,
      specialties: [...new Set(doctors.map(d => d.specialty).filter(Boolean))].length,
      todayAppointments: appointments.filter(a => {
        const today = new Date().toDateString();
        return new Date(a.dateTime).toDateString() === today;
      }).length
    };
    
    elements.statsContainer.innerHTML = `
      <div class="card">
        <div class="text-muted text-sm">Total médicos</div>
        <div class="text-2xl font-bold" style="color: var(--accent);">${stats.total}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Médicos activos</div>
        <div class="text-2xl font-bold" style="color: var(--success);">${stats.active}</div>
        <div class="text-xs text-muted mt-1">${Math.round((stats.active / stats.total) * 100)}% del total</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Especialidades</div>
        <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.specialties}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Citas hoy</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${stats.todayAppointments}</div>
        <div class="text-xs text-muted mt-1">${doctors.length > 0 ? Math.round(stats.todayAppointments / doctors.length) : 0} por médico</div>
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
          loadDoctors();
        }, 300);
      });
    }
    
    // Modal
    if (elements.btnNewDoctor) {
      elements.btnNewDoctor.addEventListener('click', () => openModal());
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
      elements.btnSave.addEventListener('click', saveDoctor);
    }
    
    // Agregar área adicional
    if (elements.formAddArea) {
      elements.formAddArea.addEventListener('change', addOtherArea);
    }
    
    // Acciones en la lista
    if (elements.doctorsList) {
      elements.doctorsList.addEventListener('click', handleListAction);
    }
    
    // Paginación
    if (elements.pagination) {
      elements.pagination.addEventListener('click', handlePagination);
    }
  }

  // Manejar filtros
  function applyFiltersHandler() {
    state.filters = {
      search: elements.filterSearch?.value || '',
      specialty: elements.filterSpecialty?.value || '',
      areaId: elements.filterArea?.value || '',
      status: elements.filterStatus?.value || 'active'
    };
    
    state.currentPage = 1;
    loadDoctors();
  }

  function clearFiltersHandler() {
    if (elements.filterSearch) elements.filterSearch.value = '';
    if (elements.filterSpecialty) elements.filterSpecialty.value = '';
    if (elements.filterArea) elements.filterArea.value = '';
    if (elements.filterStatus) elements.filterStatus.value = 'active';
    
    state.filters = {
      search: '',
      specialty: '',
      areaId: '',
      status: 'active'
    };
    
    state.currentPage = 1;
    loadDoctors();
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
          renderDoctorsList();
        }
        break;
        
      case 'next':
        const totalPages = Math.ceil(state.doctors.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderDoctorsList();
        }
        break;
        
      default:
        const pageNum = parseInt(pageAction);
        if (!isNaN(pageNum)) {
          state.currentPage = pageNum;
          renderDoctorsList();
        }
    }
  }

  // Manejar acciones en la lista
  function handleListAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const doctorId = button.dataset.id;
    const doctor = store.find('doctors', doctorId);
    
    switch (action) {
      case 'view':
        viewDoctor(doctor);
        break;
      case 'edit':
        editDoctor(doctor);
        break;
      case 'schedule':
        viewSchedule(doctor);
        break;
    }
  }

  // Abrir modal
  function openModal(doctor = null) {
    state.editingId = doctor?.id || null;
    state.showModal = true;
    
    if (elements.modal) {
      elements.modal.classList.remove('hidden');
    }
    
    if (doctor) {
      populateForm(doctor);
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
  function populateForm(doctor) {
    if (elements.formName) elements.formName.value = doctor.name || '';
    if (elements.formDni) elements.formDni.value = doctor.dni || '';
    if (elements.formBirthDate) elements.formBirthDate.value = doctor.birthDate || '';
    if (elements.formGender) elements.formGender.value = doctor.gender || '';
    if (elements.formLicense) elements.formLicense.value = doctor.license || '';
    if (elements.formSpecialty) elements.formSpecialty.value = doctor.specialty || '';
    if (elements.formArea) elements.formArea.value = doctor.areaId || '';
    if (elements.formPhone) elements.formPhone.value = doctor.phone || '';
    if (elements.formEmail) elements.formEmail.value = doctor.email || '';
    if (elements.formAddress) elements.formAddress.value = doctor.address || '';
    if (elements.formScheduleStart) elements.formScheduleStart.value = doctor.scheduleStart || '08:00';
    if (elements.formScheduleEnd) elements.formScheduleEnd.value = doctor.scheduleEnd || '17:00';
    if (elements.formConsultationDuration) elements.formConsultationDuration.value = doctor.consultationDuration || 30;
    if (elements.formStatus) elements.formStatus.value = doctor.status || 'active';
    if (elements.formNotes) elements.formNotes.value = doctor.notes || '';
    
    // Cargar días de trabajo
    const workDays = doctor.workDays || ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
    document.querySelectorAll('.form-checkbox').forEach(checkbox => {
      checkbox.checked = workDays.includes(checkbox.value);
    });
    
    // Cargar otras áreas
    if (elements.otherAreasContainer) {
      elements.otherAreasContainer.innerHTML = '';
      const otherAreas = doctor.otherAreas || [];
      otherAreas.forEach(areaId => {
        const area = store.find('areas', areaId);
        if (area) {
          addOtherAreaToContainer(areaId, area.name);
        }
      });
    }
  }

  // Limpiar formulario
  function clearForm() {
    if (elements.form) elements.form.reset();
    if (elements.otherAreasContainer) {
      elements.otherAreasContainer.innerHTML = '';
    }
    
    // Reset días de trabajo (L-V)
    document.querySelectorAll('.form-checkbox').forEach((checkbox, index) => {
      checkbox.checked = index < 5; // Lunes a Viernes
    });
    
    // Restaurar valores por defecto
    if (elements.formScheduleStart) elements.formScheduleStart.value = '08:00';
    if (elements.formScheduleEnd) elements.formScheduleEnd.value = '17:00';
    if (elements.formConsultationDuration) elements.formConsultationDuration.value = 30;
  }

  // Agregar área adicional
  function addOtherArea() {
    const areaId = elements.formAddArea.value;
    if (!areaId) return;
    
    const area = store.find('areas', areaId);
    if (!area) return;
    
    // Verificar que no sea la misma que el área principal
    if (elements.formArea.value === areaId) {
      showNotification('Esta área ya está seleccionada como principal', 'warning');
      elements.formAddArea.value = '';
      return;
    }
    
    // Verificar que no esté ya agregada
    const existingBadges = elements.otherAreasContainer.querySelectorAll('.badge');
    const alreadyExists = Array.from(existingBadges).some(badge => 
      badge.dataset.id === areaId
    );
    
    if (alreadyExists) {
      showNotification('Esta área ya ha sido agregada', 'warning');
      elements.formAddArea.value = '';
      return;
    }
    
    addOtherAreaToContainer(areaId, area.name);
    elements.formAddArea.value = '';
  }

  function addOtherAreaToContainer(areaId, areaName) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-info';
    badge.dataset.id = areaId;
    badge.innerHTML = `
      ${areaName}
      <button type="button" class="badge-remove" data-id="${areaId}" style="margin-left: 0.5rem; background: none; border: none; color: inherit; cursor: pointer; font-size: 0.75rem;">
        ×
      </button>
    `;
    
    elements.otherAreasContainer.appendChild(badge);
    
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
      elements.formLicense,
      elements.formSpecialty,
      elements.formArea,
      elements.formPhone,
      elements.formEmail,
      elements.formScheduleStart,
      elements.formScheduleEnd,
      elements.formConsultationDuration
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
    
    // Validar DNI solo si se ha ingresado algo
    if (elements.formDni && elements.formDni.value.trim()) {
      const dniValue = elements.formDni.value.trim().toUpperCase();
      const dniRegex = /^[0-9]{8}[A-Z]$/;
      
      if (!dniRegex.test(dniValue)) {
        elements.formDni.classList.add('error');
        showNotification('El DNI debe tener 8 números seguidos de una letra (ej: 12345678A)', 'warning');
        isValid = false;
      }
    }
    
    // Validar email
    if (elements.formEmail && elements.formEmail.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(elements.formEmail.value.trim())) {
        elements.formEmail.classList.add('error');
        showNotification('Por favor, ingrese un email válido (ej: nombre@dominio.com)', 'warning');
        isValid = false;
      }
    }
    
    // Validar teléfono (formato básico)
    if (elements.formPhone && elements.formPhone.value.trim()) {
      const phoneRegex = /^[0-9\s\+\-\(\)]{9,15}$/;
      const phoneValue = elements.formPhone.value.trim();
      
      if (!phoneRegex.test(phoneValue)) {
        elements.formPhone.classList.add('error');
        showNotification('Ingrese un número de teléfono válido (9-15 dígitos)', 'warning');
        isValid = false;
      }
    }
    
    // Validar horario
    if (elements.formScheduleStart && elements.formScheduleEnd) {
      const startTime = new Date(`1970-01-01T${elements.formScheduleStart.value}`);
      const endTime = new Date(`1970-01-01T${elements.formScheduleEnd.value}`);
      
      if (startTime >= endTime) {
        elements.formScheduleStart.classList.add('error');
        elements.formScheduleEnd.classList.add('error');
        showNotification('La hora de inicio debe ser anterior a la hora de fin', 'warning');
        isValid = false;
      }
    }
    
    // Validar licencia (formato básico)
    if (elements.formLicense && elements.formLicense.value.trim()) {
      const licenseValue = elements.formLicense.value.trim();
      if (licenseValue.length < 3) {
        elements.formLicense.classList.add('error');
        showNotification('El número de licencia debe tener al menos 3 caracteres', 'warning');
        isValid = false;
      }
    }
    
    return isValid;
  }

  // Obtener datos del formulario
  function getFormData() {
    // Obtener días de trabajo seleccionados
    const workDays = Array.from(document.querySelectorAll('.form-checkbox:checked'))
      .map(checkbox => checkbox.value);
    
    // Obtener otras áreas
    const otherAreas = Array.from(elements.otherAreasContainer.querySelectorAll('.badge'))
      .map(badge => badge.dataset.id);
    
    // Manejar DNI: si está vacío o solo espacios, guardar como null
    const dniValue = elements.formDni.value.trim();
    
    return {
      name: elements.formName.value.trim(),
      dni: dniValue ? dniValue.toUpperCase() : null, // Cambiado a null si está vacío
      birthDate: elements.formBirthDate.value || null,
      gender: elements.formGender.value || null,
      license: elements.formLicense.value.trim(),
      specialty: elements.formSpecialty.value,
      areaId: elements.formArea.value,
      otherAreas: otherAreas,
      phone: elements.formPhone.value.trim(),
      email: elements.formEmail.value.trim(),
      address: elements.formAddress.value.trim() || null,
      scheduleStart: elements.formScheduleStart.value,
      scheduleEnd: elements.formScheduleEnd.value,
      workDays: workDays,
      consultationDuration: parseInt(elements.formConsultationDuration.value),
      status: elements.formStatus ? elements.formStatus.value : 'active',
      isActive: elements.formStatus ? elements.formStatus.value === 'active' : true,
      notes: elements.formNotes.value.trim() || null
    };
  }

  // Guardar médico
  async function saveDoctor() {
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
        // Actualizar médico existente
        await updateDoctor(state.editingId, formData);
        showNotification('Médico actualizado correctamente', 'success');
      } else {
        // Crear nuevo médico
        await createDoctor(formData);
        showNotification('Médico registrado correctamente', 'success');
      }
      
      closeModal();
      loadDoctors();
      
    } catch (error) {
      console.error('Error guardando médico:', error);
      showNotification('Error al guardar el médico', 'error');
    } finally {
      state.isLoading = false;
      if (elements.btnSave) {
        elements.btnSave.disabled = false;
        elements.btnSave.textContent = state.editingId ? 'Actualizar' : 'Guardar';
      }
    }
  }

  // Crear nuevo médico
  async function createDoctor(data) {
    return store.add('doctors', data);
  }

  // Actualizar médico existente
  async function updateDoctor(id, data) {
    return store.update('doctors', id, data);
  }

  // Ver médico
  function viewDoctor(doctor) {
    const stats = getDoctorStats(doctor.id);
    const area = store.find('areas', doctor.areaId);
    const appointments = store.get('appointments')
      .filter(a => a.doctorId === doctor.id)
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    // Crear modal de vista detallada
    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-doctor-modal';
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
          <h3 style="margin: 0;">${doctor.name}</h3>
          <button class="btn btn-outline btn-sm" id="close-view-doctor-modal">×</button>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <!-- Información personal y profesional -->
          <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div class="card">
              <h4 style="margin-bottom: 1rem;">Información personal</h4>
              <div class="space-y-3">
                <div>
                  <div class="text-muted text-sm">DNI</div>
                  <div class="font-bold">${doctor.dni || 'No registrado'}</div>
                </div>
                <div>
                  <div class="text-muted text-sm">Teléfono</div>
                  <div class="font-bold">${doctor.phone || 'N/A'}</div>
                </div>
                <div>
                  <div class="text-muted text-sm">Email</div>
                  <div class="font-bold">${doctor.email || 'N/A'}</div>
                </div>
                ${doctor.address ? `
                  <div>
                    <div class="text-muted text-sm">Dirección</div>
                    <div class="font-bold">${doctor.address}</div>
                  </div>
                ` : ''}
              </div>
            </div>
            
            <div class="card">
              <h4 style="margin-bottom: 1rem;">Información profesional</h4>
              <div class="space-y-3">
                <div>
                  <div class="text-muted text-sm">Licencia</div>
                  <div class="font-bold">${doctor.license}</div>
                </div>
                <div>
                  <div class="text-muted text-sm">Especialidad</div>
                  <div class="font-bold">${doctor.specialty}</div>
                </div>
                <div>
                  <div class="text-muted text-sm">Área principal</div>
                  <div class="font-bold">${area?.name || 'No asignada'}</div>
                </div>
                <div>
                  <div class="text-muted text-sm">Duración consulta</div>
                  <div class="font-bold">${doctor.consultationDuration || 30} minutos</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Horario -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 1rem;">Horario de trabajo</h4>
            <div class="grid grid-2">
              <div>
                <div class="text-muted text-sm">Horario</div>
                <div class="font-bold">${doctor.scheduleStart || '08:00'} - ${doctor.scheduleEnd || '17:00'}</div>
              </div>
              <div>
                <div class="text-muted text-sm">Días de trabajo</div>
                <div class="font-bold">${doctor.workDays ? doctor.workDays.map(d => 
                  d.charAt(0).toUpperCase() + d.slice(1)).join(', ') : 'Lunes a Viernes'}</div>
              </div>
            </div>
          </div>
          
          <!-- Estadísticas -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 1rem;">Estadísticas</h4>
            <div class="grid grid-4">
              <div class="text-center">
                <div class="text-muted text-sm">Total citas</div>
                <div class="text-2xl font-bold" style="color: var(--accent);">${stats.totalAppointments}</div>
              </div>
              <div class="text-center">
                <div class="text-muted text-sm">Citas hoy</div>
                <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.todayAppointments}</div>
              </div>
              <div class="text-center">
                <div class="text-muted text-sm">Próximas</div>
                <div class="text-2xl font-bold" style="color: var(--info);">${stats.upcomingAppointments}</div>
              </div>
              <div class="text-center">
                <div class="text-muted text-sm">Completadas</div>
                <div class="text-2xl font-bold" style="color: var(--success);">${stats.completedAppointments}</div>
              </div>
            </div>
          </div>
          
          <!-- Próximas citas -->
          <div class="card">
            <h4 style="margin-bottom: 1rem;">Próximas citas</h4>
            ${appointments.length > 0 ? `
              <div class="table-responsive">
                <table class="table" style="font-size: 0.875rem;">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Paciente</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${appointments.slice(0, 5).map(appointment => {
                      const patient = store.find('patients', appointment.patientId);
                      return `
                        <tr>
                          <td>${new Date(appointment.dateTime).toLocaleDateString('es-ES')}</td>
                          <td>${patient?.name || 'N/A'}</td>
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
            ` : `
              <div class="text-center" style="padding: 2rem;">
                <div style="font-size: 2rem; opacity: 0.3; margin-bottom: 0.5rem;">📅</div>
                <p class="text-muted">No hay citas programadas</p>
              </div>
            `}
          </div>
        </div>
        
        <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.5rem;">
          ${(role === 'admin' || role === 'doctor') ? `
            <button class="btn btn-outline" id="edit-doctor-btn" data-id="${doctor.id}">
              Editar médico
            </button>
            <button class="btn btn-primary" id="view-schedule-btn" data-id="${doctor.id}">
              Ver agenda completa
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
    const closeBtn1 = modalContainer.querySelector('#close-view-doctor-modal');
    const closeBtn2 = modalContainer.querySelector('#close-modal-btn');
    if (closeBtn1) closeBtn1.addEventListener('click', closeModalHandler);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModalHandler);
    
    // Botón de editar
    const editBtn = modalContainer.querySelector('#edit-doctor-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        closeModalHandler();
        editDoctor(doctor);
      });
    }
    
    // Botón de ver agenda
    const scheduleBtn = modalContainer.querySelector('#view-schedule-btn');
    if (scheduleBtn) {
      scheduleBtn.addEventListener('click', () => {
        closeModalHandler();
        viewSchedule(doctor);
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

  // Editar médico
  function editDoctor(doctor) {
    openModal(doctor);
  }

  // Ver agenda del médico
  function viewSchedule(doctor) {
    // Navegar al módulo de citas con filtro por médico
    if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
      window.APP_STATE.appShell.navigateTo('appointments');
      
      setTimeout(() => {
        showNotification(`Mostrando agenda de ${doctor.name}`, 'info');
        
        // Guardar el filtro en localStorage para que appointments.js lo use
        localStorage.setItem('appointment_doctor_filter', doctor.id);
      }, 500);
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
  
  // Retornar API pública
  return {
    refresh: loadDoctors,
    
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}