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
    showModal: false,
    currentView: 'calendar', // Por defecto vista de calendario como pidió el usuario
    calendarDate: new Date()
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
    renderCalendar();
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

  // ========== FUNCIONES DE CAPACIDAD Y DISPONIBILIDAD ==========

  // Obtener citas de un médico para una fecha específica
  function getDoctorAppointmentsForDate(doctorId, date) {
    const appointments = store.get('appointments');
    const targetDate = new Date(date).toDateString();
    
    return appointments.filter(appointment => {
      if (appointment.doctorId !== doctorId) return false;
      if (appointment.status === 'cancelled') return false;
      
      const appointmentDate = new Date(appointment.dateTime).toDateString();
      return appointmentDate === targetDate;
    });
  }

  // Verificar si un médico tiene disponibilidad en una fecha
  function hasDoctorAvailability(doctorId, date, excludeAppointmentId = null) {
    const doctor = store.find('doctors', doctorId);
    if (!doctor) return false;
    
    const dailyCapacity = doctor.dailyCapacity || 20;
    const appointments = getDoctorAppointmentsForDate(doctorId, date);
    
    // Filtrar la cita que estamos editando (si existe)
    const relevantAppointments = excludeAppointmentId 
      ? appointments.filter(a => a.id !== excludeAppointmentId)
      : appointments;
    
    return relevantAppointments.length < dailyCapacity;
  }

  // Obtener disponibilidad restante
  function getDoctorRemainingAvailability(doctorId, date, excludeAppointmentId = null) {
    const doctor = store.find('doctors', doctorId);
    if (!doctor) return 0;
    
    const dailyCapacity = doctor.dailyCapacity || 20;
    const appointments = getDoctorAppointmentsForDate(doctorId, date);
    
    // Filtrar la cita que estamos editando (si existe)
    const relevantAppointments = excludeAppointmentId 
      ? appointments.filter(a => a.id !== excludeAppointmentId)
      : appointments;
    
    return Math.max(0, dailyCapacity - relevantAppointments.length);
  }

  // Verificar si un médico está completamente lleno para una fecha
  function isDoctorFullyBooked(doctorId, date, excludeAppointmentId = null) {
    return !hasDoctorAvailability(doctorId, date, excludeAppointmentId);
  }

  // Obtener médicos disponibles para una fecha específica
  function getAvailableDoctorsForDate(date, areaId = null, excludeAppointmentId = null) {
    const doctors = store.get('doctors');
    
    // Filtrar por área si se especifica
    let filteredDoctors = doctors;
    if (areaId) {
      filteredDoctors = doctors.filter(d => d.areaId === areaId);
    }
    
    // Filtrar médicos con disponibilidad
    return filteredDoctors.filter(doctor => 
      hasDoctorAvailability(doctor.id, date, excludeAppointmentId)
    );
  }

  // Verificar solapamiento de horarios
  function hasScheduleConflict(doctorId, date, time, duration, excludeAppointmentId = null) {
    const appointments = store.get('appointments');
    
    // Crear el inicio y fin de la nueva cita
    const newAppointmentStart = new Date(`${date}T${time}`);
    const newAppointmentEnd = new Date(newAppointmentStart.getTime() + (duration * 60000));
    
    return appointments.some(appointment => {
      // Excluir la cita que estamos editando
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }
      
      // Solo considerar citas activas del mismo médico
      if (appointment.doctorId !== doctorId) return false;
      if (appointment.status === 'cancelled') return false;
      
      // Verificar si es el mismo día
      const appointmentDate = new Date(appointment.dateTime);
      if (appointmentDate.toDateString() !== newAppointmentStart.toDateString()) {
        return false;
      }
      
      // Calcular inicio y fin de la cita existente
      const existingStart = new Date(appointment.dateTime);
      const existingEnd = new Date(existingStart.getTime() + (appointment.duration * 60000));
      
      // Verificar solapamiento
      return (
        (newAppointmentStart >= existingStart && newAppointmentStart < existingEnd) ||
        (newAppointmentEnd > existingStart && newAppointmentEnd <= existingEnd) ||
        (newAppointmentStart <= existingStart && newAppointmentEnd >= existingEnd)
      );
    });
  }

  // Obtener horarios disponibles para un médico en una fecha específica
  function getAvailableTimeSlots(doctorId, date, duration = 30) {
    const doctor = store.find('doctors', doctorId);
    if (!doctor) return [];
    
    // Configuración de horario laboral (ajustable por médico si es necesario)
    const workStart = doctor.workStartHour || 9; // 9:00 AM
    const workEnd = doctor.workEndHour || 17; // 5:00 PM
    const lunchStart = doctor.lunchStartHour || 13; // 1:00 PM
    const lunchEnd = doctor.lunchEndHour || 14; // 2:00 PM
    
    // Obtener citas existentes del médico para esa fecha
    const existingAppointments = getDoctorAppointmentsForDate(doctorId, date);
    
    // Generar slots de 30 minutos
    const slots = [];
    const startDate = new Date(date);
    startDate.setHours(workStart, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(workEnd, 0, 0, 0);
    
    let currentTime = new Date(startDate);
    
    while (currentTime < endDate) {
      // Saltar hora de almuerzo
      if (currentTime.getHours() >= lunchStart && currentTime.getHours() < lunchEnd) {
        currentTime.setMinutes(currentTime.getMinutes() + 30);
        continue;
      }
      
      const timeStr = currentTime.toTimeString().slice(0, 5);
      const timeEnd = new Date(currentTime.getTime() + (duration * 60000));
      
      // Verificar si este slot tiene conflicto
      const hasConflict = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.dateTime);
        const appointmentEnd = new Date(appointmentStart.getTime() + (appointment.duration * 60000));
        
        return (
          (currentTime >= appointmentStart && currentTime < appointmentEnd) ||
          (timeEnd > appointmentStart && timeEnd <= appointmentEnd) ||
          (currentTime <= appointmentStart && timeEnd >= appointmentEnd)
        );
      });
      
      if (!hasConflict) {
        slots.push(timeStr);
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    return slots;
  }

  // ========== FIN FUNCIONES DE CAPACIDAD Y DISPONIBILIDAD ==========

  // Renderizar componente principal
  function render() {
    const canCreate = ['admin', 'patient', 'doctor', 'receptionist'].includes(role);

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
          
          <div class="flex justify-between items-center mt-3">
             <div class="view-toggle">
              <button class="view-toggle-btn ${state.currentView === 'calendar' ? 'active' : ''}" id="btn-view-calendar">
                📅 Calendario
              </button>
              <button class="view-toggle-btn ${state.currentView === 'list' ? 'active' : ''}" id="btn-view-list">
                📋 Lista
              </button>
            </div>
            <div class="text-muted text-sm" id="view-description">
              ${state.currentView === 'calendar' ? 'Vista mensual de citas' : 'Lista detallada de todas las citas'}
            </div>
          </div>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="grid grid-4 mb-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Filtros -->
        <div class="card mb-4" id="filters-container">
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

        <!-- Vista de Calendario -->
        <div id="calendar-container" class="${state.currentView === 'calendar' ? '' : 'hidden'} mb-4">
          <!-- El calendario se renderizará aquí -->
        </div>

        <!-- Vista de Lista (Envuelta en un contenedor) -->
        <div id="list-container" class="${state.currentView === 'list' ? '' : 'hidden'}">

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
        </div> <!-- card -->
      </div> <!-- list-container -->
    </div> <!-- module-appointments -->

      <!-- Modal para nueva/editar cita - DISEÑO PROFESIONAL ACTUALIZADO -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="appointment-modal">
        <div class="modal-content" style="max-width: 800px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL GENERAL</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              ${state.editingId ? 'ACTUALIZACIÓN DE CITA' : 'REGISTRO DE CITA MÉDICA'}
            </div>
            <button class="btn-close-modal" id="btn-close-appointment-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 65vh; overflow-y: auto;">
            <form id="appointment-form">
              <!-- Información básica -->
              <div style="margin-bottom: 2rem;">
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                  <span>📋</span> INFORMACIÓN DE LA CITA
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">PACIENTE *</label>
                    <select class="input" id="form-patient" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                      <option value="">Seleccionar paciente</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MÉDICO *</label>
                    <select class="input" id="form-doctor" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                      <option value="">Seleccionar médico</option>
                    </select>
                  </div>
                </div>
                
                <!-- Mensaje cuando no hay médicos disponibles -->
                <div id="no-doctors-message" class="hidden" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 1rem; margin-top: 1rem; color: #856404;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>⚠️</span>
                    <div>
                      <strong>No hay médicos disponibles para la fecha seleccionada.</strong>
                      <div style="font-size: 0.9rem; margin-top: 0.25rem;">
                        Todos los médicos de esta área tienen su cupo completo. Por favor, seleccione otra fecha.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div style="margin-bottom: 2rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ÁREA *</label>
                  <select class="input" id="form-area" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                    <option value="">Seleccionar área</option>
                  </select>
                </div>
              </div>
              
              <!-- Fecha y Hora -->
              <div style="margin-bottom: 2rem;">
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                  <span>📅</span> FECHA Y HORA DE LA CITA
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA *</label>
                    <input type="date" class="input" id="form-date" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">HORA *</label>
                    <input type="time" class="input" id="form-time" required style="border-color: var(--modal-border); background: var(--modal-bg);"
                           list="available-times" step="1800" min="09:00" max="17:00">
                    <datalist id="available-times">
                      <!-- Se llenará dinámicamente con horarios disponibles -->
                    </datalist>
                    <div class="text-xs text-muted mt-1" id="time-slot-info">
                      Seleccione un médico y fecha para ver horarios disponibles
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Duración y Estado -->
              <div style="margin-bottom: 2rem;">
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DURACIÓN *</label>
                    <select class="input" id="form-duration" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                      <option value="15">15 minutos</option>
                      <option value="30" selected>30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                    </select>
                  </div>
                  
                  ${state.editingId ? `
                    <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO</label>
                      <select class="input" id="form-status" style="border-color: var(--modal-border); background: var(--modal-bg);">
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
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-olive); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                  <span>📝</span> INFORMACIÓN ADICIONAL
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MOTIVO DE LA CONSULTA</label>
                    <textarea class="input" id="form-reason" rows="3" placeholder="Describa el motivo de la consulta..." style="border-color: var(--modal-border); background: var(--modal-bg);"></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOTAS ADICIONALES</label>
                    <textarea class="input" id="form-notes" rows="3" placeholder="Notas importantes..." style="border-color: var(--modal-border); background: var(--modal-bg);"></textarea>
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <div class="modal-footer" style="background: var(--modal-header); border: none; padding: 1rem 1.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
             <button class="btn" id="btn-cancel" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
            <button class="btn btn-primary" id="btn-save" style="background: white; color: var(--modal-header); border: none; padding: 0.75rem 2rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" ${state.isLoading ? 'disabled' : ''}>
              ${state.isLoading ? 'GUARDANDO...' : (state.editingId ? 'ACTUALIZAR CITA' : 'REGISTRAR CITA')}
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
      btnCloseModal: root.querySelector('#btn-close-appointment-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewAppointment: root.querySelector('#btn-new-appointment'),
      btnCreateFirst: root.querySelector('#btn-create-first'),

      // Contenedores de vista
      calendarContainer: root.querySelector('#calendar-container'),
      listContainer: root.querySelector('#list-container'),
      btnViewCalendar: root.querySelector('#btn-view-calendar'),
      btnViewList: root.querySelector('#btn-view-list'),
      viewDescription: root.querySelector('#view-description'),

      // Nuevos elementos para disponibilidad
      timeSlotInfo: root.querySelector('#time-slot-info'),
      availableTimes: root.querySelector('#available-times'),
      noDoctorsMessage: root.querySelector('#no-doctors-message')
    };

    // Cargar datos en selects
    loadSelectData();

    // Verificar si hay filtros externos (desde otros módulos)
    checkExternalFilters();

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

    // Médicos (se actualizarán dinámicamente según fecha)
    if (elements.filterDoctor) {
      const doctors = store.get('doctors');
      const options = doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
      elements.filterDoctor.innerHTML = `<option value="">Todos los médicos</option>${options}`;
    }

    if (elements.formDoctor) {
      // Inicialmente cargar todos los médicos
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

  // Verificar si hay filtros externos (desde otros módulos)
  function checkExternalFilters() {
    const doctorFilter = localStorage.getItem('appointment_doctor_filter');
    if (doctorFilter) {
      state.filters.doctorId = doctorFilter;

      if (elements.filterDoctor) {
        elements.filterDoctor.value = doctorFilter;
      }

      // Limpiar filtro para no persistir en futuras recargas
      localStorage.removeItem('appointment_doctor_filter');
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
          <td data-label="Paciente">
            <div style="font-weight: 500;">${patient?.name || 'N/A'}</div>
            ${patient?.dni ? `<div class="text-xs text-muted">${patient.dni}</div>` : ''}
          </td>
          <td data-label="Médico">
            <div>${doctor?.name || 'N/A'}</div>
            <div class="text-xs text-muted">${doctor?.specialty || ''}</div>
          </td>
          <td data-label="Área">${area?.name || 'N/A'}</td>
          <td data-label="Fecha y Hora">
            <div>${dateStr}</div>
            <div class="text-xs text-muted">${timeStr}</div>
          </td>
          <td data-label="Duración">${appointment.duration} min</td>
          <td data-label="Estado">${statusBadge}</td>
          <td data-label="Acciones">
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

  // === LÓGICA DEL CALENDARIO ===
  function renderCalendar() {
    const container = elements.calendarContainer;
    if (!container) return;

    const year = state.calendarDate.getFullYear();
    const month = state.calendarDate.getMonth();

    const monthName = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(state.calendarDate);
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Día de la semana del primer día (0=Dom, 1=Lun...) - Ajustamos a 0=Lun, 6=Dom
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Ajustar para que lunes sea 0

    // Días en el mes
    const daysInMonth = lastDay.getDate();

    // Días del mes anterior para rellenar el inicio
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    container.innerHTML = `
      <div class="calendar-view card">
        <div class="calendar-header">
          <div class="flex items-center gap-4">
            <h3 style="margin: 0; min-width: 150px;">${capitalizedMonth} ${year}</h3>
            <div class="flex gap-1">
              <button class="btn btn-outline btn-sm" id="cal-prev">◀</button>
              <button class="btn btn-outline btn-sm" id="cal-today">Hoy</button>
              <button class="btn btn-outline btn-sm" id="cal-next">▶</button>
            </div>
          </div>
          <div class="text-muted text-sm hide-mobile">
            ${state.appointments.length} citas este mes
          </div>
        </div>
        
        <div class="calendar-grid">
          <div class="calendar-day-head">Lun</div>
          <div class="calendar-day-head">Mar</div>
          <div class="calendar-day-head">Mié</div>
          <div class="calendar-day-head">Jue</div>
          <div class="calendar-day-head">Vie</div>
          <div class="calendar-day-head">Sáb</div>
          <div class="calendar-day-head">Dom</div>
          ${renderCalendarDays(year, month, startDay, daysInMonth, prevMonthLastDay)}
        </div>
      </div>
    `;

    // Event listeners del calendario
    container.querySelector('#cal-prev').onclick = () => {
      state.calendarDate.setMonth(state.calendarDate.getMonth() - 1);
      renderCalendar();
    };
    container.querySelector('#cal-next').onclick = () => {
      state.calendarDate.setMonth(state.calendarDate.getMonth() + 1);
      renderCalendar();
    };
    container.querySelector('#cal-today').onclick = () => {
      state.calendarDate = new Date();
      renderCalendar();
    };

    // Click en citas del calendario
    container.querySelectorAll('.calendar-appointment').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        const appointment = store.find('appointments', id);
        if (appointment) viewAppointment(appointment);
      };
    });

    // Click en días para crear cita
    const canCreate = ['admin', 'patient', 'doctor', 'receptionist'].includes(role);
    container.querySelectorAll('.calendar-day').forEach(el => {
      el.onclick = () => {
        const date = el.dataset.date;
        if (date && canCreate) {
          openModalWithDate(date);
        }
      };
    });
  }

  function renderCalendarDays(year, month, startDay, daysInMonth, prevMonthLastDay) {
    let html = '';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Días del mes anterior
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      html += `<div class="calendar-day outside"><div class="day-number">${d}</div></div>`;
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const isToday = dateStr === `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

      // Buscar citas para este día
      const dayAppointments = state.appointments.filter(apt => {
        const d = new Date(apt.dateTime);
        const aptDateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        return aptDateStr === dateStr;
      });

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <div class="day-number">${i}</div>
          <div class="calendar-appointments">
            ${dayAppointments.slice(0, 3).map(apt => {
        const patient = store.find('patients', apt.patientId);
        return `
                <div class="calendar-appointment ${apt.status}" data-id="${apt.id}" title="${patient?.name || 'Cita'}">
                  ${new Date(apt.dateTime).getHours()}:${new Date(apt.dateTime).getMinutes().toString().padStart(2, '0')} ${patient?.name || 'Cita'}
                </div>
              `;
      }).join('')}
            ${dayAppointments.length > 3 ? `<div class="text-xs text-muted mt-1">+ ${dayAppointments.length - 3} más</div>` : ''}
          </div>
        </div>
      `;
    }

    // Rellenar hasta completar semanas
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (startDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
      html += `<div class="calendar-day outside"><div class="day-number">${i}</div></div>`;
    }

    return html;
  }

  function openModalWithDate(dateStr) {
    openModal();
    if (elements.formDate) {
      elements.formDate.value = dateStr;
      // Actualizar médicos disponibles y horarios
      updateDoctorsByAreaAndDate();
      updateAvailableTimeSlots();
    }
  }

  // ========== FUNCIONES DE VALIDACIÓN Y ADVERTENCIA ==========

  function showNoDoctorsMessage() {
    if (elements.noDoctorsMessage) {
      elements.noDoctorsMessage.classList.remove('hidden');
      if (elements.formDoctor) {
        elements.formDoctor.disabled = true;
        elements.formDoctor.innerHTML = '<option value="">No hay médicos disponibles</option>';
      }
    }
  }

  function hideNoDoctorsMessage() {
    if (elements.noDoctorsMessage) {
      elements.noDoctorsMessage.classList.add('hidden');
    }
    if (elements.formDoctor) {
      elements.formDoctor.disabled = false;
    }
  }

  function showScheduleConflictWarning(doctor, date, time, duration) {
    let warningElement = document.querySelector('#schedule-conflict-warning');
    
    if (!warningElement) {
      warningElement = document.createElement('div');
      warningElement.id = 'schedule-conflict-warning';
      warningElement.style.cssText = `
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 1rem;
        margin: 1rem 0;
        color: #721c24;
      `;
      
      // Insertar después del campo de hora
      const timeField = elements.formTime;
      if (timeField && timeField.parentNode) {
        timeField.parentNode.parentNode.insertBefore(warningElement, timeField.parentNode.nextSibling);
      }
    }
    
    warningElement.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <div style="font-size: 1.25rem;">⏰</div>
        <div>
          <div style="font-weight: 700; margin-bottom: 0.25rem;">Conflicto de horario</div>
          <div style="font-size: 0.9rem;">
            El Dr. ${doctor.name} ya tiene una cita programada para el ${date} a las ${time}.<br>
            Por favor, seleccione otro horario o consulte los horarios disponibles.
          </div>
        </div>
      </div>
    `;
  }

  function hideScheduleConflictWarning() {
    const warningElement = document.querySelector('#schedule-conflict-warning');
    if (warningElement) {
      warningElement.remove();
    }
  }

  // ========== FIN FUNCIONES DE VALIDACIÓN Y ADVERTENCIA ==========

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

    // Filtrar doctores por área y fecha
    if (elements.formArea) {
      elements.formArea.addEventListener('change', updateDoctorsByAreaAndDate);
    }
    
    if (elements.formDate) {
      elements.formDate.addEventListener('change', updateDoctorsByAreaAndDate);
    }

    // Validación en tiempo real de horarios
    if (elements.formDoctor) {
      elements.formDoctor.addEventListener('change', updateAvailableTimeSlots);
    }
    
    if (elements.formTime) {
      elements.formTime.addEventListener('change', validateDoctorSchedule);
    }
    
    if (elements.formDuration) {
      elements.formDuration.addEventListener('change', () => {
        updateAvailableTimeSlots();
        validateDoctorSchedule();
      });
    }

    // Toggles de vista
    if (elements.btnViewCalendar) {
      elements.btnViewCalendar.addEventListener('click', () => switchView('calendar'));
    }

    if (elements.btnViewList) {
      elements.btnViewList.addEventListener('click', () => switchView('list'));
    }

    // Agregar estilos CSS dinámicamente
    const style = document.createElement('style');
    style.textContent = `
      select option:disabled {
        background-color: #f8d7da;
        color: #721c24;
        font-style: italic;
      }
      
      .doctor-available {
        color: #38a169 !important;
      }
      
      .doctor-full {
        color: #e53e3e !important;
        text-decoration: line-through;
      }
      
      .error-field {
        border-color: #e53e3e !important;
        background-color: #fff5f5 !important;
      }
      
      .available-slot {
        color: #38a169 !important;
        font-weight: 600;
      }
      
      .no-slots {
        color: #e53e3e !important;
        font-weight: 600;
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  function switchView(view) {
    state.currentView = view;

    // Actualizar botones
    elements.btnViewCalendar.classList.toggle('active', view === 'calendar');
    elements.btnViewList.classList.toggle('active', view === 'list');

    // Actualizar visibilidad de contenedores
    elements.calendarContainer.classList.toggle('hidden', view !== 'calendar');
    elements.listContainer.classList.toggle('hidden', view !== 'list');

    // Actualizar descripción
    if (elements.viewDescription) {
      elements.viewDescription.textContent = view === 'calendar' ? 'Vista mensual de citas' : 'Lista detallada de todas las citas';
    }

    if (view === 'calendar') {
      renderCalendar();
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
      populateForm(appointment);
    } else {
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
        
        // Actualizar médicos disponibles para hoy
        setTimeout(() => updateDoctorsByAreaAndDate(), 100);
      }
    }
    
    // Ocultar advertencias previas
    hideNoDoctorsMessage();
    hideScheduleConflictWarning();
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

    // Actualizar doctores según área y fecha
    updateDoctorsByAreaAndDate();

    // Establecer fecha mínima (hoy)
    if (elements.formDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.formDate.min = today;
    }
    
    // Actualizar horarios disponibles
    updateAvailableTimeSlots();
    
    // Verificar conflicto de horario
    setTimeout(() => validateDoctorSchedule(), 100);
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
    
    // Si es doctor, auto-seleccionar (solo si tiene disponibilidad)
    if (role === 'doctor' && user?.doctorId && elements.formDoctor) {
      // Verificar si el doctor tiene disponibilidad para hoy
      const today = new Date().toISOString().split('T')[0];
      if (hasDoctorAvailability(user.doctorId, today, state.editingId)) {
        elements.formDoctor.value = user.doctorId;
      }
    }
    
    // Limpiar advertencias
    hideNoDoctorsMessage();
    hideScheduleConflictWarning();
    
    // Remover clases de error
    if (elements.formDoctor) elements.formDoctor.classList.remove('error-field');
    if (elements.formDate) elements.formDate.classList.remove('error-field');
    if (elements.formTime) elements.formTime.classList.remove('error-field');
    if (elements.formDuration) elements.formDuration.classList.remove('error-field');
    
    // Limpiar información de horarios
    if (elements.timeSlotInfo) {
      elements.timeSlotInfo.textContent = 'Seleccione un médico y fecha para ver horarios disponibles';
    }
    
    if (elements.availableTimes) {
      elements.availableTimes.innerHTML = '';
    }
  }

  // Actualizar doctores por área y fecha (SOLO muestra médicos con disponibilidad)
  function updateDoctorsByAreaAndDate() {
    if (!elements.formDoctor || !elements.formArea) return;

    const areaId = elements.formArea.value;
    const selectedDate = elements.formDate ? elements.formDate.value : null;
    
    // Si no hay fecha seleccionada, mostrar todos los médicos
    if (!selectedDate) {
      const doctors = store.get('doctors');
      let filteredDoctors = doctors;
      
      if (areaId) {
        filteredDoctors = doctors.filter(d => d.areaId === areaId);
      }
      
      const options = filteredDoctors.map(d => 
        `<option value="${d.id}">${d.name} - ${d.specialty}</option>`
      ).join('');
      
      elements.formDoctor.innerHTML = `<option value="">Seleccionar médico</option>${options}`;
      hideNoDoctorsMessage();
      return;
    }
    
    // Obtener médicos disponibles para la fecha seleccionada
    const availableDoctors = getAvailableDoctorsForDate(selectedDate, areaId, state.editingId);
    
    if (availableDoctors.length === 0) {
      // Mostrar mensaje de que no hay médicos disponibles
      showNoDoctorsMessage();
    } else {
      // Mostrar solo médicos disponibles
      const options = availableDoctors.map(d => {
        const remaining = getDoctorRemainingAvailability(d.id, selectedDate, state.editingId);
        const dailyCapacity = d.dailyCapacity || 20;
        const appointments = getDoctorAppointmentsForDate(d.id, selectedDate);
        
        return `<option value="${d.id}" class="doctor-available">
          ${d.name} - ${d.specialty} (${remaining}/${dailyCapacity} cupos disponibles)
        </option>`;
      }).join('');
      
      elements.formDoctor.innerHTML = `<option value="">Seleccionar médico</option>${options}`;
      hideNoDoctorsMessage(); // CORRECCIÓN: Antes decía "hideNoctorsMessage" (error de tipeo)
      
      // Si estamos editando y el doctor actual está disponible, mantenerlo seleccionado
      if (state.editingId && elements.formDoctor.value) {
        const currentDoctor = store.find('doctors', elements.formDoctor.value);
        if (currentDoctor && !availableDoctors.some(d => d.id === currentDoctor.id)) {
          // El doctor actual no está disponible, buscar alternativas
          if (availableDoctors.length > 0) {
            // Mostrar opciones disponibles
            elements.formDoctor.value = '';
            showNotification(
              `El Dr. ${currentDoctor.name} ya no tiene disponibilidad para el ${selectedDate}. Por favor, seleccione otro médico.`,
              'warning'
            );
          }
        }
      }
      
      // Si es doctor y está disponible, auto-seleccionar
      if (role === 'doctor' && user?.doctorId && !state.editingId) {
        const doctorExists = availableDoctors.some(d => d.id === user.doctorId);
        if (doctorExists) {
          elements.formDoctor.value = user.doctorId;
          // Actualizar horarios disponibles
          updateAvailableTimeSlots();
        }
      }
    }
  }

  // Actualizar horarios disponibles
  function updateAvailableTimeSlots() {
    if (!elements.formDoctor || !elements.formDate || !elements.formDoctor.value || !elements.formDate.value) {
      if (elements.timeSlotInfo) {
        elements.timeSlotInfo.textContent = 'Seleccione un médico y fecha para ver horarios disponibles';
      }
      if (elements.availableTimes) {
        elements.availableTimes.innerHTML = '';
      }
      return;
    }
    
    const doctorId = elements.formDoctor.value;
    const date = elements.formDate.value;
    const duration = elements.formDuration ? parseInt(elements.formDuration.value) : 30;
    
    const availableSlots = getAvailableTimeSlots(doctorId, date, duration);
    
    // Actualizar datalist
    if (elements.availableTimes) {
      elements.availableTimes.innerHTML = availableSlots
        .map(slot => `<option value="${slot}">${slot}</option>`)
        .join('');
    }
    
    // Actualizar información
    if (elements.timeSlotInfo) {
      if (availableSlots.length > 0) {
        elements.timeSlotInfo.innerHTML = `
          <span class="available-slot">✓ ${availableSlots.length} horarios disponibles</span>
          <br>
          <small>Seleccione un horario de la lista o ingrese manualmente</small>
        `;
        
        // Si hay un horario seleccionado que ya no está disponible, limpiarlo
        if (elements.formTime && elements.formTime.value && !availableSlots.includes(elements.formTime.value)) {
          elements.formTime.value = '';
          showNotification('El horario seleccionado ya no está disponible. Por favor, seleccione otro.', 'warning');
        }
      } else {
        elements.timeSlotInfo.innerHTML = `
          <span class="no-slots">✗ No hay horarios disponibles para esta fecha</span>
          <br>
          <small>El médico no tiene horarios libres en esta fecha. Seleccione otra fecha.</small>
        `;
        
        // Limpiar horario seleccionado si no hay disponibilidad
        if (elements.formTime) {
          elements.formTime.value = '';
        }
      }
    }
  }

  // Validar horario específico
  function validateDoctorSchedule() {
    hideScheduleConflictWarning();
    
    if (elements.formTime) elements.formTime.classList.remove('error-field');
    if (elements.formDuration) elements.formDuration.classList.remove('error-field');
    
    if (elements.formDoctor && elements.formDoctor.value && 
        elements.formDate && elements.formDate.value &&
        elements.formTime && elements.formTime.value &&
        elements.formDuration && elements.formDuration.value) {
      
      const doctorId = elements.formDoctor.value;
      const date = elements.formDate.value;
      const time = elements.formTime.value;
      const duration = parseInt(elements.formDuration.value);
      
      // Verificar conflicto de horario
      if (hasScheduleConflict(doctorId, date, time, duration, state.editingId)) {
        const doctor = store.find('doctors', doctorId);
        showScheduleConflictWarning(doctor, date, time, duration);
        
        // Marcar campos como con error
        if (elements.formTime) elements.formTime.classList.add('error-field');
        if (elements.formDuration) elements.formDuration.classList.add('error-field');
      }
    }
  }

  // Validar formulario completo
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

    // Limpiar errores previos
    requiredFields.forEach(field => {
      if (field) {
        field.classList.remove('error-field');
      }
    });

    // Validar campos requeridos
    requiredFields.forEach(field => {
      if (field && !field.value.trim()) {
        field.classList.add('error-field');
        isValid = false;
      }
    });

    // Validar que la fecha no sea en el pasado
    if (elements.formDate && elements.formTime) {
      const selectedDate = new Date(`${elements.formDate.value}T${elements.formTime.value}`);
      const now = new Date();

      if (selectedDate < now) {
        showNotification('No se puede programar una cita en el pasado', 'warning');
        elements.formDate.classList.add('error-field');
        elements.formTime.classList.add('error-field');
        return false;
      }
    }

    // Validar que el médico esté disponible (esto ya debería estar garantizado por el select)
    if (elements.formDoctor && elements.formDoctor.value && elements.formDate && elements.formDate.value) {
      const doctorId = elements.formDoctor.value;
      const date = elements.formDate.value;
      
      if (isDoctorFullyBooked(doctorId, date, state.editingId)) {
        const doctor = store.find('doctors', doctorId);
        
        showNotification(
          `El Dr. ${doctor?.name} ya no tiene disponibilidad para el ${date}. Por favor, seleccione otro médico u otra fecha.`,
          'error'
        );
        
        elements.formDoctor.classList.add('error-field');
        elements.formDate.classList.add('error-field');
        return false;
      }
    }

    // Validar conflicto de horario
    if (elements.formDoctor && elements.formDoctor.value && 
        elements.formDate && elements.formDate.value &&
        elements.formTime && elements.formTime.value &&
        elements.formDuration && elements.formDuration.value) {
      
      const doctorId = elements.formDoctor.value;
      const date = elements.formDate.value;
      const time = elements.formTime.value;
      const duration = parseInt(elements.formDuration.value);
      
      if (hasScheduleConflict(doctorId, date, time, duration, state.editingId)) {
        showNotification(
          `Conflicto de horario: El médico ya tiene una cita programada para ${date} a las ${time}`,
          'warning'
        );
        
        elements.formTime.classList.add('error-field');
        elements.formDuration.classList.add('error-field');
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

  // Guardar cita
  async function saveAppointment() {
    // Validar formulario
    if (!validateForm()) {
      showNotification('Por favor, complete todos los campos requeridos correctamente.', 'warning');
      return;
    }
    
    // Validación adicional de capacidad (doble verificación)
    if (elements.formDoctor && elements.formDoctor.value && elements.formDate && elements.formDate.value) {
      const doctorId = elements.formDoctor.value;
      const date = elements.formDate.value;
      
      if (isDoctorFullyBooked(doctorId, date, state.editingId)) {
        const doctor = store.find('doctors', doctorId);
        showNotification(
          `No se puede guardar la cita. El Dr. ${doctor?.name} ya no tiene disponibilidad para el ${date}.`,
          'error'
        );
        return;
      }
    }
    
    // Validación adicional de conflicto de horario
    if (elements.formDoctor && elements.formDoctor.value && 
        elements.formDate && elements.formDate.value &&
        elements.formTime && elements.formTime.value &&
        elements.formDuration && elements.formDuration.value) {
      
      const doctorId = elements.formDoctor.value;
      const date = elements.formDate.value;
      const time = elements.formTime.value;
      const duration = parseInt(elements.formDuration.value);
      
      if (hasScheduleConflict(doctorId, date, time, duration, state.editingId)) {
        showNotification(
          `No se puede guardar la cita. Conflicto de horario detectado para ${date} a las ${time}.`,
          'error'
        );
        return;
      }
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
      <div class="modal-content" style="max-width: 800px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
          <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL GENERAL</h2>
          <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">INFORME DE CITA MÉDICA</div>
          <button class="btn-close-modal" id="close-view-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
        </div>
        
        <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 4px; padding: 2rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); max-height: 70vh; overflow-y: auto;">
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

    // Función para cerrar el modal extendida
    function escHandler(e) {
      if (e.key === 'Escape') extendedCloseModal();
    }

    function extendedCloseModal() {
      if (modalContainer.parentNode) {
        modalContainer.parentNode.removeChild(modalContainer);
      }
      document.removeEventListener('keydown', escHandler);
    }

    document.addEventListener('keydown', escHandler);

    // Configurar event listeners
    const closeBtnHeader = modalContainer.querySelector('#close-view-modal');
    const closeBtnFooter = modalContainer.querySelector('#close-appointment-modal');
    const editBtn = modalContainer.querySelector('#edit-appointment-btn');
    const cancelBtn = modalContainer.querySelector('#cancel-appointment-btn');
    const createClinicalBtn = modalContainer.querySelector('#create-clinical-from-appointment');
    const viewClinicalBtn = modalContainer.querySelector('#view-clinical-record');

    if (closeBtnHeader) closeBtnHeader.addEventListener('click', extendedCloseModal);
    if (closeBtnFooter) closeBtnFooter.addEventListener('click', extendedCloseModal);

    // Botón para editar cita
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        editAppointment(appointment);
        extendedCloseModal();
      });
    }

    // Botón para cancelar cita
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        cancelAppointment(appointment);
        extendedCloseModal();
      });
    }

    // Botón para crear consulta clínica
    if (createClinicalBtn) {
      createClinicalBtn.addEventListener('click', () => {
        createClinicalFromAppointment(appointment);
        extendedCloseModal();
      });
    }

    // Botón para ver registro clínico existente
    if (viewClinicalBtn) {
      viewClinicalBtn.addEventListener('click', () => {
        viewClinicalRecordFromAppointment(appointment);
        extendedCloseModal();
      });
    }

    // Cerrar al hacer clic fuera del contenido
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) extendedCloseModal();
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