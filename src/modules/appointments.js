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

      <!-- Modal para nueva/editar cita -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="appointment-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 style="margin: 0;">${state.editingId ? 'Editar Cita' : 'Nueva Cita'}</h3>
            <button class="btn btn-outline btn-sm" id="btn-close-modal">×</button>
          </div>
          
          <div class="modal-body">
            <form id="appointment-form">
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Paciente *</label>
                  <select class="input" id="form-patient" required>
                    <option value="">Seleccionar paciente</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Médico *</label>
                  <select class="input" id="form-doctor" required>
                    <option value="">Seleccionar médico</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Área *</label>
                <select class="input" id="form-area" required>
                  <option value="">Seleccionar área</option>
                </select>
              </div>
              
              <div class="grid grid-2">
                <div class="form-group">
                  <label class="form-label">Fecha *</label>
                  <input type="date" class="input" id="form-date" required>
                </div>
                
                <div class="form-group">
                  <label class="form-label">Hora *</label>
                  <input type="time" class="input" id="form-time" required>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Duración (minutos) *</label>
                <select class="input" id="form-duration" required>
                  <option value="15">15 minutos</option>
                  <option value="30" selected>30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Motivo de la consulta</label>
                <textarea class="input" id="form-reason" rows="3" placeholder="Describa el motivo de la consulta..."></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Notas adicionales</label>
                <textarea class="input" id="form-notes" rows="2" placeholder="Notas importantes..."></textarea>
              </div>
              
              ${state.editingId ? `
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="input" id="form-status">
                    <option value="scheduled">Programada</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
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
    elements.formDate.min = today;
    
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
    
    if (elements.btnCloseModal) {
      elements.btnCloseModal.addEventListener('click', closeModal);
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
        elements.formPatient.value = user.patientId;
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
    
    if (elements.formPatient) elements.formPatient.value = appointment.patientId;
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
  }

  // Limpiar formulario
  function clearForm() {
    if (elements.form) elements.form.reset();
    
    // Restaurar fecha mínima
    if (elements.formDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.formDate.min = today;
    }
    
    // Restaurar selects
    loadSelectData();
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
  }

  // Guardar cita
  async function saveAppointment() {
    // Validar formulario
    if (!validateForm()) {
      alert('Por favor, complete todos los campos requeridos correctamente.');
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
        elements.btnSave.textContent = state.editingId ? 'Actualizar' : 'Guardar';
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
        field.classList.add('error');
        isValid = false;
      } else if (field) {
        field.classList.remove('error');
      }
    });
    
    // Validar que la fecha no sea en el pasado
    if (elements.formDate && elements.formTime) {
      const selectedDate = new Date(`${elements.formDate.value}T${elements.formTime.value}`);
      const now = new Date();
      
      if (selectedDate < now) {
        alert('No se puede programar una cita en el pasado');
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

  // Ver detalles de cita
  // Reemplazar la función viewAppointment actual con esta versión corregida:

function viewAppointment(appointment) {
  const patient = store.find('patients', appointment.patientId);
  const doctor = store.find('doctors', appointment.doctorId);
  const area = store.find('areas', appointment.areaId);
  
  const date = new Date(appointment.dateTime);
  const dateStr = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
  
  // Crear modal
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
    z-index: 1000;
    padding: 1rem;
  `;
  
  modalContainer.innerHTML = `
    <div class="modal-content" style="max-width: 600px; background: var(--card); border-radius: var(--radius); width: 100%; max-height: 90vh; overflow-y: auto; animation: modalSlideIn 0.3s ease;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border);">
        <h3 style="margin: 0;">Detalles de la Cita</h3>
        <button class="btn btn-outline btn-sm" id="close-view-appointment-btn">×</button>
      </div>
      
      <div class="modal-body" style="padding: 1.5rem;">
        <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Paciente</label>
            <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
              ${patient?.name || 'N/A'}
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Médico</label>
            <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
              ${doctor?.name || 'N/A'}
            </div>
          </div>
        </div>
        
        <div class="form-group" style="margin-bottom: 1rem;">
          <label class="form-label">Área</label>
          <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
            ${area?.name || 'N/A'}
          </div>
        </div>
        
        <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
              ${dateStr}
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Hora</label>
            <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
              ${timeStr}
            </div>
          </div>
        </div>
        
        <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Duración</label>
            <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
              ${appointment.duration} minutos
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Estado</label>
            <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border);">
              ${getStatusBadge(appointment.status)}
            </div>
          </div>
        </div>
        
        ${appointment.reason ? `
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Motivo de consulta</label>
            <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border); min-height: 60px;">
              ${appointment.reason}
            </div>
          </div>
        ` : ''}
        
        ${appointment.notes ? `
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label">Notas adicionales</label>
            <div class="input" style="background: var(--bg-light); padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border); min-height: 60px;">
              ${appointment.notes}
            </div>
          </div>
        ` : ''}
        
        <!-- Información de registro clínico -->
        ${hasClinicalRecord(appointment.id) ? `
          <div class="alert alert-success" style="margin-top: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>📋</span>
              <div>
                <div style="font-weight: 500;">Registro clínico disponible</div>
                <div style="font-size: 0.875rem;">Esta cita ya tiene una consulta médica registrada</div>
              </div>
            </div>
          </div>
        ` : ''}
        
        <div style="font-size: 0.75rem; color: var(--muted); margin-top: 1.5rem;">
          Creada el ${new Date(appointment.createdAt).toLocaleDateString('es-ES')}
          ${appointment.updatedAt && appointment.updatedAt !== appointment.createdAt ? 
            ` • Actualizada el ${new Date(appointment.updatedAt).toLocaleDateString('es-ES')}` : ''}
        </div>
      </div>
      
      <div class="modal-footer" style="padding: 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.5rem;">
        ${canCreateClinical ? `
          <button class="btn btn-primary" id="btn-create-clinical-from-appointment" data-id="${appointment.id}">
            📋 Crear Consulta Médica
          </button>
        ` : ''}
        
        ${hasClinicalRecord(appointment.id) ? `
          <button class="btn btn-outline" id="btn-view-clinical-record" data-id="${appointment.id}">
            Ver Historia Clínica
          </button>
        ` : ''}
        
        <button class="btn btn-outline" id="close-view-appointment-btn-2">Cerrar</button>
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
  const closeBtn1 = modalContainer.querySelector('#close-view-appointment-btn');
  const closeBtn2 = modalContainer.querySelector('#close-view-appointment-btn-2');
  const createClinicalBtn = modalContainer.querySelector('#btn-create-clinical-from-appointment');
  const viewClinicalBtn = modalContainer.querySelector('#btn-view-clinical-record');
  
  if (closeBtn1) {
    closeBtn1.addEventListener('click', closeModal);
  }
  
  if (closeBtn2) {
    closeBtn2.addEventListener('click', closeModal);
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
  if (closeBtn1) {
    closeBtn1.removeEventListener('click', closeModal);
    closeBtn1.addEventListener('click', enhancedCloseModal);
  }
  
  if (closeBtn2) {
    closeBtn2.removeEventListener('click', closeModal);
    closeBtn2.addEventListener('click', enhancedCloseModal);
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