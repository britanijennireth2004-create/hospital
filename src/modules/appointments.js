/**
 * Módulo de Citas Médicas - Gestión completa
 */

export default function mountAppointments(root, { bus, store, user, role }) {
  const state = {
    appointments: [],
    filters: {
      status: '',
      doctorId: '',
      patientId: '',
      dateFrom: '',
      dateTo: ''
    },
    editingId: null,
    isLoading: false,
    showModal: false
  };

  // Elementos DOM
  let elements = {};

  // Inicializar
  function init() {
    render();
    setupEventListeners();
    loadAppointments();
    
    // Suscribirse a cambios en el store
    const unsubscribe = store.subscribe('appointments', () => {
      loadAppointments();
    });
    
    return unsubscribe;
  }

  // Cargar citas
  function loadAppointments() {
    let appointments = store.get('appointments');
    
    // Aplicar filtros
    appointments = applyFilters(appointments);
    
    // Aplicar visibilidad por rol
    appointments = filterByRole(appointments);
    
    // Ordenar por fecha (más recientes primero)
    appointments.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    state.appointments = appointments;
    renderAppointmentsList();
    updateStats();
  }

  // Aplicar filtros
  function applyFilters(appointments) {
    return appointments.filter(appointment => {
      if (state.filters.status && appointment.status !== state.filters.status) {
        return false;
      }
      
      if (state.filters.doctorId && appointment.doctorId !== state.filters.doctorId) {
        return false;
      }
      
      if (state.filters.patientId && appointment.patientId !== state.filters.patientId) {
        return false;
      }
      
      if (state.filters.dateFrom) {
        const fromDate = new Date(state.filters.dateFrom);
        const appointmentDate = new Date(appointment.dateTime);
        if (appointmentDate < fromDate) return false;
      }
      
      if (state.filters.dateTo) {
        const toDate = new Date(state.filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        const appointmentDate = new Date(appointment.dateTime);
        if (appointmentDate > toDate) return false;
      }
      
      return true;
    });
  }

  // Filtrar por rol
  function filterByRole(appointments) {
    if (role === 'patient' && user?.patientId) {
      return appointments.filter(a => a.patientId === user.patientId);
    }
    
    if (role === 'doctor' && user?.doctorId) {
      return appointments.filter(a => a.doctorId === user.doctorId);
    }
    
    return appointments;
  }

  // Renderizar componente principal
  function render() {
    const canCreate = role === 'admin' || role === 'patient' || role === 'doctor';
    
    root.innerHTML = `
      <div class="module-appointments">
        <!-- Header -->
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <h2>Citas Médicas</h2>
              <p class="text-muted">Gestión y programación de citas</p>
            </div>
            ${canCreate ? `
              <button class="btn btn-primary" id="btn-new-appointment">
                <span>+</span> Nueva Cita
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="grid grid-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Filtros -->
        <div class="card">
          <h3 class="mb-3">Filtros</h3>
          <div class="grid grid-4">
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select class="input" id="filter-status">
                <option value="">Todos</option>
                <option value="scheduled">Programada</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            
            ${role === 'admin' || role === 'doctor' ? `
              <div class="form-group">
                <label class="form-label">Paciente</label>
                <select class="input" id="filter-patient">
                  <option value="">Todos los pacientes</option>
                </select>
              </div>
            ` : ''}
            
            ${role === 'admin' || role === 'patient' ? `
              <div class="form-group">
                <label class="form-label">Médico</label>
                <select class="input" id="filter-doctor">
                  <option value="">Todos los médicos</option>
                </select>
              </div>
            ` : ''}
            
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

        <!-- Lista de citas -->
        <div class="card">
          <div class="card-header">
            <h3 style="margin: 0;">Citas programadas</h3>
            <div class="text-muted" id="appointments-count">
              Cargando...
            </div>
          </div>
          
          <div class="table-responsive">
            <table class="table" id="appointments-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Médico</th>
                  <th>Área</th>
                  <th>Fecha y Hora</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="appointments-list">
                <!-- Se llenará dinámicamente -->
              </tbody>
            </table>
          </div>
          
          <div id="empty-state" class="hidden">
            <div class="text-center" style="padding: 3rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📅</div>
              <h3>No hay citas</h3>
              <p class="text-muted">No se encontraron citas con los filtros aplicados</p>
              ${canCreate ? `
                <button class="btn btn-primary mt-3" id="btn-create-first">
                  Crear primera cita
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para nueva/editar cita - DISEÑO PROFESIONAL ACTUALIZADO -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="appointment-modal">
        <div class="modal-content" style="max-width: 800px; background: var(--modal-bg);">
          <div class="modal-header" style="flex-direction: column; align-items: center; padding: 1.5rem;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem;">HOSPITAL GENERAL</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.875rem; margin-top: 0.25rem; letter-spacing: 0.05em;">${state.editingId ? 'ACTUALIZACIÓN DE CITA' : 'REGISTRO DE CITA MÉDICA'}</div>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 4px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <form id="appointment-form">
              <!-- Información básica -->
              <div style="margin-bottom: 2rem;">
                <div style="font-size: 0.9rem; font-weight: 700; color: #2a5298; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                  <span>📋</span> INFORMACIÓN DE LA CITA
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 600; color: #5a8973;">Paciente *</label>
                    <select class="input" id="form-patient" required style="border-color: #5a8973;">
                      <option value="">Seleccionar paciente</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 600; color: #5a8973;">Médico *</label>
                    <select class="input" id="form-doctor" required style="border-color: #5a8973;">
                      <option value="">Seleccionar médico</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 2rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 600; color: #d69e2e;">Área *</label>
                  <select class="input" id="form-area" required style="border-color: #d69e2e;">
                    <option value="">Seleccionar área</option>
                  </select>
                </div>
              </div>
              
              <!-- Fecha y Hora -->
              <div style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                <div style="font-size: 0.9rem; font-weight: 700; color: #689f38; margin-bottom: 1rem;">FECHA Y HORA DE LA CITA</div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 600; color: #689f38;">Fecha *</label>
                    <input type="date" class="input" id="form-date" required style="border-color: #689f38;">
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 600; color: #689f38;">Hora *</label>
                    <input type="time" class="input" id="form-time" required style="border-color: #689f38;">
                  </div>
                </div>
              </div>
              
              <!-- Duración y Estado -->
              <div style="margin-bottom: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 600; color: #276749;">Duración *</label>
                    <select class="input" id="form-duration" required style="border-color: #276749;">
                      <option value="15">15 minutos</option>
                      <option value="30" selected>30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                    </select>
                  </div>
                  
                  ${state.editingId ? `
                    <div class="form-group">
                      <label class="form-label" style="font-weight: 600; color: #276749;">Estado</label>
                      <select class="input" id="form-status" style="border-color: #276749;">
                        <option value="scheduled">Programada</option>
                        <option value="confirmed">Confirmada</option>
                        <option value="completed">Completada</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- Motivo y Notas -->
              <div style="margin-bottom: 2rem;">
                <div style="font-size: 0.9rem; font-weight: 700; color: #d69e2e; margin-bottom: 1rem;">INFORMACIÓN ADICIONAL</div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 600; color: #d69e2e;">Motivo de la consulta</label>
                    <textarea class="input" id="form-reason" rows="3" placeholder="Describa el motivo de la consulta..." style="border-color: #d69e2e;"></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 600; color: #d69e2e;">Notas adicionales</label>
                    <textarea class="input" id="form-notes" rows="3" placeholder="Notas importantes..." style="border-color: #d69e2e;"></textarea>
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <div class="modal-footer" style="background: var(--modal-header); border: none; padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button class="btn btn-outline" id="btn-cancel" style="background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.3);">Cancelar</button>
            <button class="btn btn-primary" id="btn-save" style="background: #daa722; border: none;" ${state.isLoading ? 'disabled' : ''}>
              ${state.isLoading ? 'Guardando...' : (state.editingId ? 'Actualizar Cita' : 'Registrar Cita')}
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Guardar referencias a elementos importantes
    elements = {
      statsContainer: root.querySelector('#stats-container'),
      appointmentsList: root.querySelector('#appointments-list'),
      appointmentsCount: root.querySelector('#appointments-count'),
      emptyState: root.querySelector('#empty-state'),
      appointmentsTable: root.querySelector('#appointments-table'),
      
      // Filtros
      filterStatus: root.querySelector('#filter-status'),
      filterPatient: root.querySelector('#filter-patient'),
      filterDoctor: root.querySelector('#filter-doctor'),
      filterDateFrom: root.querySelector('#filter-date-from'),
      filterDateTo: root.querySelector('#filter-date-to'),
      btnClearFilters: root.querySelector('#btn-clear-filters'),
      btnApplyFilters: root.querySelector('#btn-apply-filters'),
      
      // Modal
      modal: root.querySelector('#appointment-modal'),
      form: root.querySelector('#appointment-form'),
      formPatient: root.querySelector('#form-patient'),
      formDoctor: root.querySelector('#form-doctor'),
      formArea: root.querySelector('#form-area'),
      formDate: root.querySelector('#form-date'),
      formTime: root.querySelector('#form-time'),
      formDuration: root.querySelector('#form-duration'),
      formReason: root.querySelector('#form-reason'),
      formNotes: root.querySelector('#form-notes'),
      formStatus: root.querySelector('#form-status'),
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewAppointment: root.querySelector('#btn-new-appointment'),
      btnCreateFirst: root.querySelector('#btn-create-first')
    };
    
    // Cargar datos en selects
    loadSelectData();
    
    // Configurar valores por defecto
    if (role === 'patient' && user?.patientId) {
      const patient = store.find('patients', user.patientId);
      if (patient) {
        elements.formPatient.innerHTML = `<option value="${patient.id}">${patient.name}</option>`;
        elements.formPatient.value = patient.id;
        elements.formPatient.disabled = true;
      }
    }
    
    // Establecer fecha mínima (hoy)
    const today = new Date().toISOString().split('T')[0];
    if (elements.formDate) {
      elements.formDate.min = today;
    }
    
    // Cargar citas iniciales
    loadAppointments();
  }

  // Cargar datos en selects
  function loadSelectData() {
    // Pacientes (solo para admin y doctor)
    if (elements.filterPatient) {
      const patients = store.get('patients');
      const options = patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      elements.filterPatient.innerHTML = `<option value="">Todos los pacientes</option>${options}`;
    }
    
    if (elements.formPatient) {
      const patients = store.get('patients');
      const options = patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      elements.formPatient.innerHTML = `<option value="">Seleccionar paciente</option>${options}`;
    }
    
    // Médicos
    if (elements.filterDoctor) {
      const doctors = store.get('doctors');
      const options = doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
      elements.filterDoctor.innerHTML = `<option value="">Todos los médicos</option>${options}`;
    }
    
    if (elements.formDoctor) {
      const doctors = store.get('doctors');
      const options = doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
      elements.formDoctor.innerHTML = `<option value="">Seleccionar médico</option>${options}`;
    }
    
    // Áreas
    if (elements.formArea) {
      const areas = store.get('areas');
      const options = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      elements.formArea.innerHTML = `<option value="">Seleccionar área</option>${options}`;
    }
  }

  // Renderizar lista de citas
  function renderAppointmentsList() {
    if (!elements.appointmentsList) return;
    
    if (state.appointments.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.appointmentsTable.classList.add('hidden');
      elements.appointmentsCount.textContent = '0 citas';
      return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.appointmentsTable.classList.remove('hidden');
    elements.appointmentsCount.textContent = `${state.appointments.length} ${state.appointments.length === 1 ? 'cita' : 'citas'}`;
    
    const rows = state.appointments.map(appointment => {
      const patient = store.find('patients', appointment.patientId);
      const doctor = store.find('doctors', appointment.doctorId);
      const area = store.find('areas', appointment.areaId);
      
      // Formatear fecha y hora
      const date = new Date(appointment.dateTime);
      const dateStr = date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      const timeStr = date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Determinar qué acciones puede realizar el usuario
      const canEdit = role === 'admin' || 
                     (role === 'doctor' && user?.doctorId === appointment.doctorId) ||
                     (role === 'patient' && user?.patientId === appointment.patientId);
      
      const canCancel = canEdit && appointment.status !== 'completed' && appointment.status !== 'cancelled';
      
      // Estado con badge
      const statusBadge = getStatusBadge(appointment.status);
      
      return `
        <tr>
          <td>
            <div style="font-weight: 500;">${patient?.name || 'N/A'}</div>
            ${patient?.dni ? `<div class="text-xs text-muted">${patient.dni}</div>` : ''}
          </td>
          <td>
            <div>${doctor?.name || 'N/A'}</div>
            <div class="text-xs text-muted">${doctor?.specialty || ''}</div>
          </td>
          <td>${area?.name || 'N/A'}</td>
          <td>
            <div>${dateStr}</div>
            <div class="text-xs text-muted">${timeStr}</div>
          </td>
          <td>${appointment.duration} min</td>
          <td>${statusBadge}</td>
          <td>
            <div class="flex gap-2">
              ${canEdit ? `
                <button class="btn btn-outline btn-sm" data-action="edit" data-id="${appointment.id}">
                  Editar
                </button>
              ` : ''}
              
              ${canCancel ? `
                <button class="btn btn-outline btn-sm" data-action="cancel" data-id="${appointment.id}">
                  Cancelar
                </button>
              ` : ''}
              
              <button class="btn btn-outline btn-sm" data-action="view" data-id="${appointment.id}">
                Ver
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
    
    elements.appointmentsList.innerHTML = rows;
  }

  // Actualizar estadísticas
  function updateStats() {
    if (!elements.statsContainer) return;
    
    const appointments = store.get('appointments');
    
    const stats = {
      total: appointments.length,
      today: store.getTodayAppointments().length,
      upcoming: store.getUpcomingAppointments(7).length,
      completed: appointments.filter(a => a.status === 'completed').length
    };
    
    elements.statsContainer.innerHTML = `
      <div class="card">
        <div class="text-muted text-sm">Total de citas</div>
        <div class="text-2xl font-bold" style="color: var(--accent);">${stats.total}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Citas hoy</div>
        <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.today}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Próximos 7 días</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${stats.upcoming}</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Completadas</div>
        <div class="text-2xl font-bold" style="color: var(--success);">${stats.completed}</div>
      </div>
    `;
  }

  // Badge para estado
  function getStatusBadge(status) {
    const statusText = {
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    
    const statusColor = {
      scheduled: 'badge-info',
      confirmed: 'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    
    return `<span class="badge ${statusColor[status] || ''}">${statusText[status] || status}</span>`;
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
    
    // Modal
    if (elements.btnNewAppointment) {
      elements.btnNewAppointment.addEventListener('click', () => openModal());
    }
    
    if (elements.btnCreateFirst) {
      elements.btnCreateFirst.addEventListener('click', () => openModal());
    }
    
    if (elements.btnCancel) {
      elements.btnCancel.addEventListener('click', closeModal);
    }
    
    if (elements.btnSave) {
      elements.btnSave.addEventListener('click', saveAppointment);
    }
    
    // Acciones en la lista
    if (elements.appointmentsList) {
      elements.appointmentsList.addEventListener('click', handleListAction);
    }
    
    // Filtrar doctores por área
    if (elements.formArea) {
      elements.formArea.addEventListener('change', updateDoctorsByArea);
    }
    
    // Fecha mínima en el formulario (hoy)
    if (elements.formDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.formDate.min = today;
    }
  }

  // Manejar filtros
  function applyFiltersHandler() {
    state.filters = {
      status: elements.filterStatus?.value || '',
      doctorId: elements.filterDoctor?.value || '',
      patientId: elements.filterPatient?.value || '',
      dateFrom: elements.filterDateFrom?.value || '',
      dateTo: elements.filterDateTo?.value || ''
    };
    
    loadAppointments();
  }

  function clearFiltersHandler() {
    if (elements.filterStatus) elements.filterStatus.value = '';
    if (elements.filterDoctor) elements.filterDoctor.value = '';
    if (elements.filterPatient) elements.filterPatient.value = '';
    if (elements.filterDateFrom) elements.filterDateFrom.value = '';
    if (elements.filterDateTo) elements.filterDateTo.value = '';
    
    state.filters = {
      status: '',
      doctorId: '',
      patientId: '',
      dateFrom: '',
      dateTo: ''
    };
    
    loadAppointments();
  }

  // Manejar acciones en la lista
  function handleListAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const appointmentId = button.dataset.id;
    const appointment = store.find('appointments', appointmentId);
    
    switch (action) {
      case 'edit':
        editAppointment(appointment);
        break;
      case 'cancel':
        cancelAppointment(appointment);
        break;
      case 'view':
        viewAppointment(appointment);
        break;
    }
  }

  // Abrir modal
  function openModal(appointment = null) {
    state.editingId = appointment?.id || null;
    state.showModal = true;
    
    if (elements.modal) {
      elements.modal.classList.remove('hidden');
    }
    
    if (appointment) {
      // Rellenar formulario con datos existentes
      populateForm(appointment);
    } else {
      // Formulario nuevo
      clearForm();
      
      // Si es paciente, seleccionar automáticamente
      if (role === 'patient' && user?.patientId) {
        const patient = store.find('patients', user.patientId);
        if (patient && elements.formPatient) {
          elements.formPatient.innerHTML = `<option value="${patient.id}">${patient.name}</option>`;
          elements.formPatient.value = patient.id;
          elements.formPatient.disabled = true;
        }
      }
      
      // Establecer fecha mínima (hoy)
      if (elements.formDate) {
        const today = new Date().toISOString().split('T')[0];
        elements.formDate.min = today;
        elements.formDate.value = today;
      }
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
  function populateForm(appointment) {
    const date = new Date(appointment.dateTime);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);
    
    if (elements.formPatient) {
      elements.formPatient.value = appointment.patientId;
      // Si es paciente, deshabilitar el select
      if (role === 'patient' && user?.patientId === appointment.patientId) {
        const patient = store.find('patients', user.patientId);
        if (patient) {
          elements.formPatient.innerHTML = `<option value="${patient.id}">${patient.name}</option>`;
          elements.formPatient.disabled = true;
        }
      }
    }
    
    if (elements.formDoctor) elements.formDoctor.value = appointment.doctorId;
    if (elements.formArea) elements.formArea.value = appointment.areaId;
    if (elements.formDate) elements.formDate.value = dateStr;
    if (elements.formTime) elements.formTime.value = timeStr;
    if (elements.formDuration) elements.formDuration.value = appointment.duration;
    if (elements.formReason) elements.formReason.value = appointment.reason || '';
    if (elements.formNotes) elements.formNotes.value = appointment.notes || '';
    if (elements.formStatus) elements.formStatus.value = appointment.status;
    
    // Actualizar doctores según área
    updateDoctorsByArea();
    
    // Establecer fecha mínima (hoy)
    if (elements.formDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.formDate.min = today;
    }
  }

  // Limpiar formulario
  function clearForm() {
    if (elements.form) elements.form.reset();
    
    // Restaurar selects
    loadSelectData();
    
    // Restaurar fecha mínima y valor por defecto
    if (elements.formDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.formDate.min = today;
      elements.formDate.value = today;
    }
    
    // Si es paciente, auto-seleccionar y deshabilitar
    if (role === 'patient' && user?.patientId && elements.formPatient) {
      const patient = store.find('patients', user.patientId);
      if (patient) {
        elements.formPatient.innerHTML = `<option value="${patient.id}">${patient.name}</option>`;
        elements.formPatient.value = patient.id;
        elements.formPatient.disabled = true;
      }
    }
    
    // Si es doctor, auto-seleccionar
    if (role === 'doctor' && user?.doctorId && elements.formDoctor) {
      elements.formDoctor.value = user.doctorId;
    }
  }

  // Actualizar doctores por área
  function updateDoctorsByArea() {
    if (!elements.formDoctor || !elements.formArea) return;
    
    const areaId = elements.formArea.value;
    const doctors = store.get('doctors');
    
    let filteredDoctors = doctors;
    if (areaId) {
      filteredDoctors = doctors.filter(d => d.areaId === areaId);
    }
    
    const options = filteredDoctors.map(d => 
      `<option value="${d.id}">${d.name} - ${d.specialty}</option>`
    ).join('');
    
    elements.formDoctor.innerHTML = `<option value="">Seleccionar médico</option>${options}`;
    
    // Si estamos editando y el doctor actual no está en la lista, mantenerlo
    if (state.editingId && elements.formDoctor.value) {
      const currentDoctorExists = filteredDoctors.some(d => d.id === elements.formDoctor.value);
      if (!currentDoctorExists && filteredDoctors.length > 0) {
        elements.formDoctor.value = '';
      }
    }
    
    // Si es doctor, auto-seleccionar después de cargar
    if (role === 'doctor' && user?.doctorId) {
      const doctorExists = filteredDoctors.some(d => d.id === user.doctorId);
      if (doctorExists) {
        elements.formDoctor.value = user.doctorId;
      }
    }
  }

  // Guardar cita
  async function saveAppointment() {
    // Validar formulario
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
        // Actualizar cita existente
        await updateAppointment(state.editingId, formData);
        showNotification('Cita actualizada correctamente', 'success');
      } else {
        // Crear nueva cita
        await createAppointment(formData);
        showNotification('Cita creada correctamente', 'success');
      }
      
      closeModal();
      loadAppointments();
      
    } catch (error) {
      console.error('Error guardando cita:', error);
      showNotification('Error al guardar la cita', 'error');
    } finally {
      state.isLoading = false;
      if (elements.btnSave) {
        elements.btnSave.disabled = false;
        elements.btnSave.textContent = state.editingId ? 'Actualizar Cita' : 'Registrar Cita';
      }
    }
  }

  // Validar formulario
  function validateForm() {
    let isValid = true;
    
    const requiredFields = [
      elements.formPatient,
      elements.formDoctor,
      elements.formArea,
      elements.formDate,
      elements.formTime,
      elements.formDuration
    ];
    
    requiredFields.forEach(field => {
      if (field && !field.value.trim()) {
        field.style.borderColor = '#e53e3e';
        isValid = false;
      } else if (field) {
        // Restaurar color original según el tipo de campo
        const fieldType = field.id.replace('form-', '');
        switch(fieldType) {
          case 'patient':
          case 'doctor':
            field.style.borderColor = '#5a8973';
            break;
          case 'area':
            field.style.borderColor = '#d69e2e';
            break;
          case 'date':
          case 'time':
            field.style.borderColor = '#689f38';
            break;
          case 'duration':
          case 'status':
            field.style.borderColor = '#276749';
            break;
          default:
            field.style.borderColor = '';
        }
      }
    });
    
    // Validar que la fecha no sea en el pasado
    if (elements.formDate && elements.formTime) {
      const selectedDate = new Date(`${elements.formDate.value}T${elements.formTime.value}`);
      const now = new Date();
      
      if (selectedDate < now) {
        showNotification('No se puede programar una cita en el pasado', 'warning');
        return false;
      }
    }
    
    return isValid;
  }

  // Obtener datos del formulario
  function getFormData() {
    const date = new Date(`${elements.formDate.value}T${elements.formTime.value}`);
    
    return {
      patientId: elements.formPatient.value,
      doctorId: elements.formDoctor.value,
      areaId: elements.formArea.value,
      dateTime: date.getTime(),
      duration: parseInt(elements.formDuration.value),
      reason: elements.formReason.value || '',
      notes: elements.formNotes.value || '',
      status: elements.formStatus ? elements.formStatus.value : 'scheduled',
      createdBy: user.id
    };
  }

  // Crear nueva cita
  async function createAppointment(data) {
    return store.add('appointments', data);
  }

  // Actualizar cita existente
  async function updateAppointment(id, data) {
    return store.update('appointments', id, data);
  }

  // Cancelar cita
  async function cancelAppointment(appointment) {
    if (!confirm(`¿Está seguro de cancelar la cita del ${new Date(appointment.dateTime).toLocaleDateString('es-ES')}?`)) {
      return;
    }
    
    try {
      await store.update('appointments', appointment.id, {
        status: 'cancelled',
        cancelledAt: Date.now(),
        cancelledBy: user.id
      });
      
      showNotification('Cita cancelada correctamente', 'success');
      loadAppointments();
      
    } catch (error) {
      console.error('Error cancelando cita:', error);
      showNotification('Error al cancelar la cita', 'error');
    }
  }

  // Ver detalles de cita - DISEÑO PROFESIONAL ACTUALIZADO
  function viewAppointment(appointment) {
    const patient = store.find('patients', appointment.patientId);
    const doctor = store.find('doctors', appointment.doctorId);
    const area = store.find('areas', appointment.areaId);
    
    const date = new Date(appointment.dateTime);
    const dateStr = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Determinar si el usuario actual puede crear una consulta clínica
    const canCreateClinical = (role === 'admin' || role === 'doctor') && 
                           appointment.status === 'completed' &&
                           !hasClinicalRecord(appointment.id);
    
    // Verificar si ya existe un registro clínico para esta cita
    function hasClinicalRecord(appointmentId) {
      const clinicalRecords = store.get('clinicalRecords');
      return clinicalRecords.some(record => record.appointmentId === appointmentId);
    }
    
    // Crear modal con diseño profesional similar al historial clínico
    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-appointment-modal';
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
    
    // Determinar si el usuario puede editar esta cita
    const canEdit = role === 'admin' || 
                   (role === 'doctor' && user?.doctorId === appointment.doctorId) ||
                   (role === 'patient' && user?.patientId === appointment.patientId);
    
    const canCancel = canEdit && appointment.status !== 'completed' && appointment.status !== 'cancelled';
    
    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 800px; background: var(--modal-bg);">
        <div class="modal-header" style="flex-direction: column; align-items: center; padding: 1.5rem;">
          <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem;">HOSPITAL GENERAL</h2>
          <div style="color: rgba(255,255,255,0.9); font-size: 0.875rem; margin-top: 0.25rem; letter-spacing: 0.05em;">INFORME DE CITA MÉDICA</div>
        </div>
        
        <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 4px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
          <!-- Encabezado de Datos -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1rem;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 700; color: #666;">N° DE CITA</div>
              <div style="font-family: monospace; font-size: 1.25rem; font-weight: 700;">${appointment.id.split('_').pop()}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #666;">FECHA Y HORA PROGRAMADA</div>
              <div style="font-size: 1.125rem; font-weight: 700;">
                ${dateStr}
              </div>
              <div style="margin-top: 0.25rem; font-size: 0.95rem; color: #2a5298;">
                ${timeStr} • ${appointment.duration} minutos
              </div>
            </div>
          </div>

          <!-- Paciente y Médico (Mismo esquema de colores que historial clínico) -->
          <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: var(--card-patient); border-radius: 4px; padding: 1.25rem; position: relative;">
               <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">👤</div>
                  <div>
                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--modal-text-muted);">PACIENTE</div>
                    <div style="font-weight: 700; font-size: 1.1rem;">${patient?.name || 'N/A'}</div>
                  </div>
               </div>
               <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; font-size: 0.8rem;">
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">DNI</div>
                    <div>${patient?.dni || 'No disponible'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">TELÉFONO</div>
                    <div>${patient?.phone || 'No disponible'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">EMAIL</div>
                    <div style="word-break: break-all;">${patient?.email || 'No disponible'}</div>
                  </div>
               </div>
            </div>

            <div style="background: var(--card-doctor); border-radius: 4px; padding: 1.25rem;">
               <div style="display: flex; align-items: center; gap: 1rem;">
                  <div style="width: 40px; height: 40px; background: white; border-radius: 50%; opacity: 0.6; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                  <div>
                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--modal-text-muted);">MÉDICO ASIGNADO</div>
                    <div style="font-weight: 700; font-size: 1.1rem;">${doctor?.name || 'N/A'}</div>
                  </div>
               </div>
               <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; margin-top: 1rem; font-size: 0.8rem;">
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">ESPECIALIDAD</div>
                    <div>${doctor?.specialty || 'No especificada'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">ÁREA</div>
                    <div>${area?.name || 'No asignada'}</div>
                  </div>
                  <div>
                    <div style="font-weight: 700; color: var(--modal-text-muted);">MATRÍCULA</div>
                    <div>${doctor?.license || 'No disponible'}</div>
                  </div>
               </div>
            </div>
          </div>

          <!-- Estado de la Cita -->
          <div style="margin-bottom: 2rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #666; margin-bottom: 0.5rem;">ESTADO ACTUAL</div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              ${getStatusBadge(appointment.status)}
              <div style="font-size: 0.85rem; color: #666;">
                ${appointment.cancelledAt ? `Cancelada el ${new Date(appointment.cancelledAt).toLocaleDateString('es-ES')}` : ''}
              </div>
            </div>
          </div>

          <!-- Información de la Consulta -->
          <div style="margin-bottom: 2rem;">
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              <span>📋</span> INFORMACIÓN DE LA CONSULTA
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
              <div style="background: var(--modal-section-gold-light); border: 1px solid var(--modal-section-gold); border-radius: 4px; padding: 1rem;">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--modal-highlight); margin-bottom: 0.5rem;">MOTIVO DE LA CONSULTA</div>
                <div style="font-size: 0.9rem; line-height: 1.4;">
                  ${appointment.reason || 'No especificado'}
                </div>
              </div>
              
              <div style="background: var(--modal-section-olive-light); border: 1px solid var(--modal-section-olive); border-radius: 4px; padding: 1rem;">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--modal-section-olive); margin-bottom: 0.5rem;">NOTAS ADICIONALES</div>
                <div style="font-size: 0.9rem; line-height: 1.4;">
                  ${appointment.notes || 'Sin notas adicionales'}
                </div>
              </div>
            </div>
          </div>

          <!-- Información de Registro -->
          <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; display: flex; justify-content: space-between; font-size: 0.7rem; color: #999;">
            <div>
              <div style="font-weight: 700; color: #666;">CITA CREADA POR</div>
              <div>${appointment.createdBy || 'Sistema'}</div>
              <div>${new Date(appointment.createdAt).toLocaleString()}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; color: #666;">ÚLTIMA ACTUALIZACIÓN</div>
              <div>${appointment.updatedAt ? new Date(appointment.updatedAt).toLocaleString() : 'Sin modificaciones'}</div>
            </div>
          </div>

          <!-- Información de Registro Clínico -->
          ${hasClinicalRecord(appointment.id) ? `
            <div style="background: var(--modal-section-forest-light); border: 1px solid var(--modal-section-forest); border-radius: 4px; padding: 1rem; margin-top: 1.5rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="font-size: 1.25rem;">📋</div>
                <div>
                  <div style="font-weight: 700; color: var(--modal-section-forest);">REGISTRO CLÍNICO DISPONIBLE</div>
                  <div style="font-size: 0.8rem; color: var(--modal-section-forest);">
                    Esta cita tiene una consulta médica registrada en el historial clínico
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
        
        <div style="padding: 1rem 1.5rem; text-align: center; color: rgba(255,255,255,0.8); font-size: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1);">
            Documento administrativo • Generado automáticamente por Hospital General
        </div>

        <div class="modal-footer" style="background: var(--modal-header); border: none; padding: 1rem 1.5rem; display: flex; justify-content: space-between; gap: 0.5rem;">
          <div style="display: flex; gap: 0.5rem;">
            ${canCancel ? `
              <button class="btn" style="background: #e53e3e; border: none; color: white; padding: 0.5rem 1rem;" 
                id="cancel-appointment-btn" data-id="${appointment.id}">
                🚫 Cancelar Cita
              </button>
            ` : ''}
            
            ${canEdit ? `
              <button class="btn" style="background: var(--modal-section-olive); border: none; color: white; padding: 0.5rem 1rem;" 
                id="edit-appointment-btn" data-id="${appointment.id}">
                ✏️ Editar Cita
              </button>
            ` : ''}
          </div>
          
          <div style="display: flex; gap: 0.5rem;">
            ${canCreateClinical ? `
              <button class="btn" style="background: var(--modal-section-forest); border: none; color: white; padding: 0.5rem 1rem;" 
                id="create-clinical-from-appointment" data-id="${appointment.id}">
                📋 Crear Consulta
              </button>
            ` : ''}
            
            ${hasClinicalRecord(appointment.id) ? `
              <button class="btn" style="background: var(--modal-section-sage); border: none; color: white; padding: 0.5rem 1rem;" 
                id="view-clinical-record" data-id="${appointment.id}">
                👁️ Ver Historia
              </button>
            ` : ''}
            
            <button class="btn" style="background: #495057; border: none; color: white; padding: 0.5rem 1rem;" 
              id="close-appointment-modal">
              ✕ Cerrar
            </button>
          </div>
        </div>
      </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(modalContainer);
    
    // Función para cerrar el modal
    const closeModal = () => {
      if (modalContainer.parentNode) {
        modalContainer.parentNode.removeChild(modalContainer);
      }
    };
    
    // Configurar event listeners
    const closeBtn = modalContainer.querySelector('#close-appointment-modal');
    const editBtn = modalContainer.querySelector('#edit-appointment-btn');
    const cancelBtn = modalContainer.querySelector('#cancel-appointment-btn');
    const createClinicalBtn = modalContainer.querySelector('#create-clinical-from-appointment');
    const viewClinicalBtn = modalContainer.querySelector('#view-clinical-record');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    // Botón para editar cita
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        editAppointment(appointment);
        closeModal();
      });
    }
    
    // Botón para cancelar cita
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        cancelAppointment(appointment);
        closeModal();
      });
    }
    
    // Botón para crear consulta clínica
    if (createClinicalBtn) {
      createClinicalBtn.addEventListener('click', () => {
        createClinicalFromAppointment(appointment);
        closeModal();
      });
    }
    
    // Botón para ver registro clínico existente
    if (viewClinicalBtn) {
      viewClinicalBtn.addEventListener('click', () => {
        viewClinicalRecordFromAppointment(appointment);
        closeModal();
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
    
    // También limpiamos el event listener cuando se cierra el modal
    const originalCloseModal = closeModal;
    const enhancedCloseModal = () => {
      originalCloseModal();
      document.removeEventListener('keydown', escHandler);
    };
    
    // Reasignar los event listeners para usar la función mejorada
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
    
    // ===== FUNCIONES AUXILIARES =====
    
    function createClinicalFromAppointment(appointment) {
      if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
        // Navegar al módulo de historia clínica
        window.APP_STATE.appShell.navigateTo('clinical');
        
        // Guardar datos para prellenar el formulario
        const clinicalData = {
          appointmentId: appointment.id,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId || (role === 'doctor' ? user?.doctorId : ''),
          date: appointment.dateTime,
          reason: appointment.reason,
          areaId: appointment.areaId,
          source: 'appointment'
        };
        
        localStorage.setItem('clinical_form_data', JSON.stringify(clinicalData));
        
        // Mostrar notificación
        setTimeout(() => {
          const patientName = patient?.name || 'el paciente';
          showNotification(`Creando consulta para ${patientName}...`, 'info');
        }, 300);
      }
    }
    
    function viewClinicalRecordFromAppointment(appointment) {
      // Buscar el registro clínico asociado a esta cita
      const clinicalRecords = store.get('clinicalRecords');
      const clinicalRecord = clinicalRecords.find(record => record.appointmentId === appointment.id);
      
      if (clinicalRecord) {
        if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
          // Navegar al módulo de historia clínica
          window.APP_STATE.appShell.navigateTo('clinical');
          
          // Guardar el ID del registro para mostrar detalles
          localStorage.setItem('clinical_view_record', clinicalRecord.id);
          
          // Mostrar notificación
          setTimeout(() => {
            showNotification('Cargando registro clínico...', 'info');
          }, 300);
        }
      } else {
        showNotification('No se encontró el registro clínico', 'warning');
      }
    }
  }

  // Mostrar notificación
  function showNotification(message, type = 'info') {
    // Crear notificación simple
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
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
    
    // Agregar estilos de animación si no existen
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Editar cita
  function editAppointment(appointment) {
    openModal(appointment);
  }

  // Verificar si existe registro clínico
  function hasClinicalRecord(appointmentId) {
    const clinicalRecords = store.get('clinicalRecords');
    return clinicalRecords.some(record => record.appointmentId === appointmentId);
  }

  // Inicializar módulo
  const unsubscribe = init();
  
  // Retornar API pública
  return {
    refresh: loadAppointments,
    
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}