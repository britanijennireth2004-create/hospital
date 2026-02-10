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
    showStatusModal: false, // Nuevo: modal para estado
    showCapacityModal: false, // Nuevo: modal para capacidad
    currentDoctor: null, // Nuevo: médico actual para modales específicos
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
    const canEditStatus = role === 'admin' || role === 'receptionist';

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
                  <th>Capacidad diaria</th>
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
        <div class="modal-content" style="max-width: 800px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL GENERAL</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              ${state.editingId ? 'EDICIÓN DE PERFIL PROFESIONAL' : 'REGISTRO DE PERSONAL MÉDICO'}
            </div>
            <button class="btn-close-modal" id="btn-close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 65vh; overflow-y: auto;">
            <form id="doctor-form">
              <!-- Información personal -->
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                👤 INFORMACIÓN PERSONAL
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOMBRE COMPLETO *</label>
                  <input type="text" class="input" id="form-name" required placeholder="Ej: Juan Pérez García" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DNI/NIE</label>
                  <input type="text" class="input" id="form-dni" placeholder="Ej: 12345678A" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA DE NACIMIENTO</label>
                  <input type="date" class="input" id="form-birth-date" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">GÉNERO</label>
                  <select class="input" id="form-gender" style="border-color: var(--modal-border); background: var(--modal-bg);">
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>
              
              <!-- Información profesional -->
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                🩺 INFORMACIÓN PROFESIONAL
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NÚMERO DE LICENCIA *</label>
                  <input type="text" class="input" id="form-license" required placeholder="Ej: MED-123456" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESPECIALIDAD *</label>
                  <select class="input" id="form-specialty" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                    <option value="">Seleccionar especialidad</option>
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
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ÁREA PRINCIPAL *</label>
                <select class="input" id="form-area" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                  <option value="">Seleccionar área</option>
                </select>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">
                  OTRAS ÁREAS ASIGNADAS
                </label>
                <div id="other-areas-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; min-height: 20px;">
                  <!-- Se llenará dinámicamente con las áreas adicionales -->
                </div>
                <select class="input" id="form-add-area" style="border-color: var(--modal-border); background: var(--modal-bg); margin-top: 0.5rem;">
                  <option value="">Agregar otra área...</option>
                </select>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">TELÉFONO *</label>
                  <input type="tel" class="input" id="form-phone" required placeholder="Ej: +34 600 123 456" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">EMAIL *</label>
                  <input type="email" class="input" id="form-email" required placeholder="Ej: medico@hospital.com" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DIRECCIÓN</label>
                  <input type="text" class="input" id="form-address" placeholder="Ej: Calle Principal 123, Ciudad" style="border-color: var(--modal-border); background: var(--modal-bg);">
              </div>
              
              <!-- Horario y disponibilidad -->
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-olive); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                📅 HORARIO Y DISPONIBILIDAD
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ENTRADA *</label>
                  <input type="time" class="input" id="form-schedule-start" required value="08:00" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">SALIDA *</label>
                  <input type="time" class="input" id="form-schedule-end" required value="17:00" style="border-color: var(--modal-border); background: var(--modal-bg);">
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DÍAS DE TRABAJO</label>
                <div class="flex flex-wrap gap-3 mt-2">
                  ${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => `
                    <label style="display: flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                      <input type="checkbox" class="form-checkbox" value="${day.toLowerCase()}">
                      ${day}
                    </label>
                  `).join('')}
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DURACIÓN DE CONSULTA *</label>
                  <select class="input" id="form-consultation-duration" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                    <option value="30" selected>30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CAPACIDAD DIARIA *</label>
                  <input type="number" class="input" id="form-daily-capacity" required min="1" max="50" value="20" placeholder="Ej: 20" style="border-color: var(--modal-border); background: var(--modal-bg);">
                  <div class="text-xs text-muted mt-1">Máximo de pacientes por día</div>
                </div>
              </div>
              
              ${state.editingId ? `
                <div class="form-group" style="background: var(--modal-bg); padding: 1rem; border-radius: 4px; margin-top: 1.5rem;">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO ACTUAL</label>
                  <select class="input" id="form-status" style="border-color: var(--modal-border); background: white;">
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="vacation">Vacaciones</option>
                    <option value="license">Licencia</option>
                  </select>
                </div>
              ` : ''}
              
              <div class="form-group" style="margin-top: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOTAS INTERNAS</label>
                <textarea class="input" id="form-notes" rows="2" placeholder="Notas adicionales..." style="border-color: var(--modal-border); background: var(--modal-bg);"></textarea>
              </div>
            </form>
          </div>
          
          <div class="modal-footer" style="background: var(--modal-header); padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
            <button class="btn" id="btn-cancel" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
            <button class="btn" id="btn-save" style="background: white; color: var(--modal-header); border: none; padding: 0.75rem 2rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" ${state.isLoading ? 'disabled' : ''}>
              ${state.isLoading ? 'GUARDANDO...' : (state.editingId ? 'ACTUALIZAR PERFIL' : 'REGISTRAR MÉDICO')}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal para cambiar estado (Admin/Receptionist) -->
      <div class="modal-overlay ${state.showStatusModal ? '' : 'hidden'}" id="status-modal">
        <div class="modal-content" style="max-width: 500px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--warning); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">CAMBIAR ESTADO</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              ${state.currentDoctor ? state.currentDoctor.name : 'Médico'}
            </div>
            <button class="btn-close-modal" id="btn-close-status-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <form id="status-form">
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO ACTUAL</label>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: ${state.currentDoctor?.isActive ? 'var(--success)' : 'var(--danger)'};"></div>
                  <span style="font-weight: 600;">${state.currentDoctor?.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                  ${state.currentDoctor?.status === 'vacation' ? '<span class="badge badge-warning ml-2">Vacaciones</span>' : ''}
                  ${state.currentDoctor?.status === 'license' ? '<span class="badge badge-info ml-2">Licencia</span>' : ''}
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NUEVO ESTADO *</label>
                <select class="input" id="status-form-state" required style="border-color: var(--modal-border); background: var(--modal-bg);">
                  <option value="">Seleccionar estado</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="vacation">Vacaciones</option>
                  <option value="license">Licencia</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MOTIVO DEL CAMBIO</label>
                <textarea class="input" id="status-form-reason" rows="3" placeholder="Ej: Vacaciones programadas, licencia médica..." style="border-color: var(--modal-border); background: var(--modal-bg);"></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA DE REINTEGRO</label>
                <input type="date" class="input" id="status-form-return-date" style="border-color: var(--modal-border); background: var(--modal-bg);">
              </div>
            </form>
          </div>
          
          <div class="modal-footer" style="background: #f8f9fa; padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #e9ecef;">
            <button class="btn" id="btn-cancel-status" style="background: white; color: #6c757d; border: 1px solid #dee2e6; padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
            <button class="btn" id="btn-save-status" style="background: var(--warning); color: white; border: none; padding: 0.75rem 2rem; font-weight: 700;">
              ACTUALIZAR ESTADO
            </button>
          </div>
        </div>
      </div>

      <!-- Modal para ajustar capacidad (Admin/Receptionist) -->
      <div class="modal-overlay ${state.showCapacityModal ? '' : 'hidden'}" id="capacity-modal">
        <div class="modal-content" style="max-width: 500px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
          <div class="modal-header" style="background: var(--info); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
            <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">AJUSTAR CAPACIDAD</h2>
            <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">
              ${state.currentDoctor ? state.currentDoctor.name : 'Médico'}
            </div>
            <button class="btn-close-modal" id="btn-close-capacity-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <form id="capacity-form">
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CAPACIDAD ACTUAL</label>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                  <div style="font-size: 2rem; color: var(--info);">👥</div>
                  <div>
                    <div style="font-size: 1.5rem; font-weight: 800; color: var(--info);">${state.currentDoctor?.dailyCapacity || 20}</div>
                    <div style="font-size: 0.85rem; color: #6c757d;">pacientes por día</div>
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NUEVA CAPACIDAD *</label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <input type="range" id="capacity-form-slider" min="1" max="50" value="${state.currentDoctor?.dailyCapacity || 20}" style="flex: 1;">
                  <input type="number" class="input" id="capacity-form-value" required min="1" max="50" value="${state.currentDoctor?.dailyCapacity || 20}" style="width: 80px; text-align: center;">
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                  <span class="text-xs text-muted">1 paciente</span>
                  <span class="text-xs text-muted">50 pacientes</span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CÁLCULO AUTOMÁTICO</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">
                  <button type="button" class="btn btn-outline btn-sm" data-calc="8h">8 horas (16 pacientes)</button>
                  <button type="button" class="btn btn-outline btn-sm" data-calc="6h">6 horas (12 pacientes)</button>
                  <button type="button" class="btn btn-outline btn-sm" data-calc="4h">4 horas (8 pacientes)</button>
                  <button type="button" class="btn btn-outline btn-sm" data-calc="custom">Personalizar</button>
                </div>
                <div class="text-xs text-muted mt-1">Basado en consultas de 30 minutos</div>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MOTIVO DEL AJUSTE</label>
                <textarea class="input" id="capacity-form-reason" rows="2" placeholder="Ej: Alta demanda temporal, reducción por mantenimiento..." style="border-color: var(--modal-border); background: var(--modal-bg);"></textarea>
              </div>
              
              <div class="form-group" style="background: #e7f5ff; padding: 1rem; border-radius: 4px; margin-top: 1rem;">
                <div style="font-weight: 700; color: var(--info); font-size: 0.85rem;">IMPACTO EN CITAS</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">
                  <div style="text-align: center;">
                    <div style="font-size: 0.75rem; color: #6c757d;">Citas hoy</div>
                    <div id="capacity-today-count" style="font-weight: 700; font-size: 1.25rem;">0</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 0.75rem; color: #6c757d;">Capacidad restante</div>
                    <div id="capacity-remaining" style="font-weight: 700; font-size: 1.25rem; color: var(--success);">0</div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <div class="modal-footer" style="background: #f8f9fa; padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #e9ecef;">
            <button class="btn" id="btn-cancel-capacity" style="background: white; color: #6c757d; border: 1px solid #dee2e6; padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
            <button class="btn" id="btn-save-capacity" style="background: var(--info); color: white; border: none; padding: 0.75rem 2rem; font-weight: 700;">
              ACTUALIZAR CAPACIDAD
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

      // Modal principal
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
      formDailyCapacity: root.querySelector('#form-daily-capacity'),
      formStatus: root.querySelector('#form-status'),
      formNotes: root.querySelector('#form-notes'),
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewDoctor: root.querySelector('#btn-new-doctor'),
      btnCreateFirst: root.querySelector('#btn-create-first'),

      // Modal de estado
      statusModal: root.querySelector('#status-modal'),
      statusForm: root.querySelector('#status-form'),
      statusFormState: root.querySelector('#status-form-state'),
      statusFormReason: root.querySelector('#status-form-reason'),
      statusFormReturnDate: root.querySelector('#status-form-return-date'),
      btnCloseStatusModal: root.querySelector('#btn-close-status-modal'),
      btnCancelStatus: root.querySelector('#btn-cancel-status'),
      btnSaveStatus: root.querySelector('#btn-save-status'),

      // Modal de capacidad
      capacityModal: root.querySelector('#capacity-modal'),
      capacityForm: root.querySelector('#capacity-form'),
      capacityFormSlider: root.querySelector('#capacity-form-slider'),
      capacityFormValue: root.querySelector('#capacity-form-value'),
      capacityFormReason: root.querySelector('#capacity-form-reason'),
      capacityTodayCount: root.querySelector('#capacity-today-count'),
      capacityRemaining: root.querySelector('#capacity-remaining'),
      btnCloseCapacityModal: root.querySelector('#btn-close-capacity-modal'),
      btnCancelCapacity: root.querySelector('#btn-cancel-capacity'),
      btnSaveCapacity: root.querySelector('#btn-save-capacity')
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
    const canEditStatus = role === 'admin' || role === 'receptionist';

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
      const dailyCapacity = doctor.dailyCapacity || 20;
      const capacityPercentage = Math.min(Math.round((stats.todayAppointments / dailyCapacity) * 100), 100);

      return `
        <tr>
          <td data-label="Médico">
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
          <td data-label="Especialidad">
            <div>${doctor.specialty}</div>
          </td>
          <td data-label="Área">${area?.name || 'No asignada'}</td>
          <td data-label="Horario">
            <div class="text-sm">${formatSchedule(doctor.schedule)}</div>
            <div class="text-xs text-muted">${doctor.consultationDuration || 30} min/consulta</div>
          </td>
          <td data-label="Citas hoy">
            <div class="text-center">
              <div style="font-weight: bold; font-size: 1.25rem; color: ${stats.todayAppointments > 0 ? 'var(--accent-2)' : 'var(--muted)'}">
                ${stats.todayAppointments}
              </div>
              <div class="text-xs text-muted">de ${dailyCapacity}</div>
            </div>
          </td>
          <td data-label="Capacidad diaria">
            <div style="margin-bottom: 0.25rem;">
              <div style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                <div style="width: ${capacityPercentage}%; height: 100%; background: ${capacityPercentage > 80 ? 'var(--danger)' : capacityPercentage > 60 ? 'var(--warning)' : 'var(--success)'};"></div>
              </div>
            </div>
            <div class="text-sm">
              ${stats.todayAppointments}/${dailyCapacity} pacientes
              ${canEditStatus ? `
                <button class="btn btn-xs btn-outline ml-2" data-action="capacity" data-id="${doctor.id}" title="Ajustar capacidad">
                  ⚙️
                </button>
              ` : ''}
            </div>
          </td>
          <td data-label="Estado">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span class="badge ${doctor.isActive ? 'badge-success' : 'badge-danger'}">
                ${doctor.isActive ? 'Activo' : 'Inactivo'}
                ${doctor.status === 'vacation' ? ' (Vacaciones)' : doctor.status === 'license' ? ' (Licencia)' : ''}
              </span>
              ${canEditStatus ? `
                <button class="btn btn-xs btn-outline" data-action="status" data-id="${doctor.id}" title="Cambiar estado">
                  ✏️
                </button>
              ` : ''}
            </div>
          </td>
          <td data-label="Acciones">
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
    const today = new Date().toDateString();

    // Calcular capacidad total
    const totalCapacity = doctors.reduce((sum, doctor) => sum + (doctor.dailyCapacity || 20), 0);
    const usedCapacity = appointments.filter(a => 
      new Date(a.dateTime).toDateString() === today
    ).length;
    const availableCapacity = totalCapacity - usedCapacity;

    const stats = {
      total: doctors.length,
      active: doctors.filter(d => d.isActive).length,
      specialties: [...new Set(doctors.map(d => d.specialty).filter(Boolean))].length,
      todayAppointments: usedCapacity,
      totalCapacity: totalCapacity,
      availableCapacity: availableCapacity
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
        <div class="text-muted text-sm">Capacidad hoy</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${stats.usedCapacity || 0}/${stats.totalCapacity}</div>
        <div class="text-xs text-muted mt-1">${stats.availableCapacity} disponibles</div>
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

    // Modal principal
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

    // Modal de estado
    if (elements.btnCloseStatusModal) {
      elements.btnCloseStatusModal.addEventListener('click', closeStatusModal);
    }

    if (elements.btnCancelStatus) {
      elements.btnCancelStatus.addEventListener('click', closeStatusModal);
    }

    if (elements.btnSaveStatus) {
      elements.btnSaveStatus.addEventListener('click', saveStatus);
    }

    // Modal de capacidad
    if (elements.btnCloseCapacityModal) {
      elements.btnCloseCapacityModal.addEventListener('click', closeCapacityModal);
    }

    if (elements.btnCancelCapacity) {
      elements.btnCancelCapacity.addEventListener('click', closeCapacityModal);
    }

    if (elements.btnSaveCapacity) {
      elements.btnSaveCapacity.addEventListener('click', saveCapacity);
    }

    // Sincronizar slider y input de capacidad
    if (elements.capacityFormSlider && elements.capacityFormValue) {
      elements.capacityFormSlider.addEventListener('input', (e) => {
        elements.capacityFormValue.value = e.target.value;
        updateCapacityImpact();
      });

      elements.capacityFormValue.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (value < 1) value = 1;
        if (value > 50) value = 50;
        elements.capacityFormSlider.value = value;
        elements.capacityFormValue.value = value;
        updateCapacityImpact();
      });

      // Botones de cálculo automático
      const calcButtons = document.querySelectorAll('[data-calc]');
      calcButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const calcType = e.target.dataset.calc;
          let capacity;
          
          switch (calcType) {
            case '8h':
              capacity = 16; // 8 horas / 0.5 horas por consulta
              break;
            case '6h':
              capacity = 12; // 6 horas / 0.5 horas por consulta
              break;
            case '4h':
              capacity = 8; // 4 horas / 0.5 horas por consulta
              break;
            default:
              return; // Personalizar no hace nada
          }
          
          elements.capacityFormSlider.value = capacity;
          elements.capacityFormValue.value = capacity;
          updateCapacityImpact();
        });
      });
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
      case 'status':
        if (role === 'admin' || role === 'receptionist') {
          openStatusModal(doctor);
        }
        break;
      case 'capacity':
        if (role === 'admin' || role === 'receptionist') {
          openCapacityModal(doctor);
        }
        break;
    }
  }

  // Abrir modal principal
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

  // Cerrar modal principal
  function closeModal() {
    state.showModal = false;
    state.editingId = null;

    if (elements.modal) {
      elements.modal.classList.add('hidden');
    }

    clearForm();
  }

  // Abrir modal de estado
  function openStatusModal(doctor) {
    state.currentDoctor = doctor;
    state.showStatusModal = true;

    if (elements.statusModal) {
      elements.statusModal.classList.remove('hidden');
    }

    if (elements.statusFormState) {
      elements.statusFormState.value = doctor.status || 'active';
    }
    
    if (elements.statusFormReturnDate) {
      // Establecer fecha mínima como hoy
      const today = new Date().toISOString().split('T')[0];
      elements.statusFormReturnDate.min = today;
    }
  }

  // Cerrar modal de estado
  function closeStatusModal() {
    state.showStatusModal = false;
    state.currentDoctor = null;

    if (elements.statusModal) {
      elements.statusModal.classList.add('hidden');
    }

    if (elements.statusForm) {
      elements.statusForm.reset();
    }
  }

  // Abrir modal de capacidad
  function openCapacityModal(doctor) {
    state.currentDoctor = doctor;
    state.showCapacityModal = true;

    if (elements.capacityModal) {
      elements.capacityModal.classList.remove('hidden');
    }

    const dailyCapacity = doctor.dailyCapacity || 20;
    
    if (elements.capacityFormSlider) {
      elements.capacityFormSlider.value = dailyCapacity;
    }
    
    if (elements.capacityFormValue) {
      elements.capacityFormValue.value = dailyCapacity;
    }

    updateCapacityImpact();
  }

  // Actualizar impacto de capacidad
  function updateCapacityImpact() {
    if (!state.currentDoctor || !elements.capacityTodayCount || !elements.capacityRemaining) return;
    
    const stats = getDoctorStats(state.currentDoctor.id);
    const newCapacity = parseInt(elements.capacityFormValue?.value || state.currentDoctor.dailyCapacity || 20);
    const remaining = Math.max(0, newCapacity - stats.todayAppointments);
    
    elements.capacityTodayCount.textContent = stats.todayAppointments;
    elements.capacityRemaining.textContent = remaining;
    
    // Cambiar color según disponibilidad
    if (remaining === 0) {
      elements.capacityRemaining.style.color = 'var(--danger)';
    } else if (remaining < 5) {
      elements.capacityRemaining.style.color = 'var(--warning)';
    } else {
      elements.capacityRemaining.style.color = 'var(--success)';
    }
  }

  // Cerrar modal de capacidad
  function closeCapacityModal() {
    state.showCapacityModal = false;
    state.currentDoctor = null;

    if (elements.capacityModal) {
      elements.capacityModal.classList.add('hidden');
    }

    if (elements.capacityForm) {
      elements.capacityForm.reset();
    }
  }

  // Rellenar formulario principal
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
    if (elements.formDailyCapacity) elements.formDailyCapacity.value = doctor.dailyCapacity || 20;
    if (elements.formStatus) elements.formStatus.value = doctor.status || 'active';
    if (elements.formNotes) elements.formNotes.value = doctor.notes || '';

    // Cargar días de trabajo (con verificación)
    const workDays = doctor.workDays || ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
    document.querySelectorAll('.form-checkbox').forEach(checkbox => {
      checkbox.checked = workDays.includes(checkbox.value);
    });

    // Cargar otras áreas (con verificación de existencia del contenedor)
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

  // Limpiar formulario principal
  function clearForm() {
    if (elements.form) elements.form.reset();
    
    // Limpiar contenedor de otras áreas si existe
    if (elements.otherAreasContainer) {
      elements.otherAreasContainer.innerHTML = '';
    }

    // Reset días de trabajo (L-V por defecto)
    document.querySelectorAll('.form-checkbox').forEach((checkbox, index) => {
      checkbox.checked = index < 5; // Lunes a Viernes
    });

    // Restaurar valores por defecto
    if (elements.formScheduleStart) elements.formScheduleStart.value = '08:00';
    if (elements.formScheduleEnd) elements.formScheduleEnd.value = '17:00';
    if (elements.formConsultationDuration) elements.formConsultationDuration.value = 30;
    if (elements.formDailyCapacity) elements.formDailyCapacity.value = 20;
    
    // Reset select de agregar área
    if (elements.formAddArea) elements.formAddArea.value = '';
  }

  // Agregar área adicional
  function addOtherArea() {
    if (!elements.formAddArea || !elements.otherAreasContainer) return;
    
    const areaId = elements.formAddArea.value;
    if (!areaId) return;

    const area = store.find('areas', areaId);
    if (!area) return;

    // Verificar que no sea la misma que el área principal
    if (elements.formArea && elements.formArea.value === areaId) {
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
    if (!elements.otherAreasContainer) return;
    
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

  // Validar formulario principal
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
      elements.formConsultationDuration,
      elements.formDailyCapacity
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

    // Validar capacidad diaria
    if (elements.formDailyCapacity) {
      const capacity = parseInt(elements.formDailyCapacity.value);
      if (isNaN(capacity) || capacity < 1 || capacity > 50) {
        elements.formDailyCapacity.classList.add('error');
        showNotification('La capacidad diaria debe ser entre 1 y 50 pacientes', 'warning');
        isValid = false;
      }
    }

    return isValid;
  }

  // Obtener datos del formulario principal
  function getFormData() {
    // Obtener días de trabajo seleccionados
    const workDays = Array.from(document.querySelectorAll('.form-checkbox:checked'))
      .map(checkbox => checkbox.value);

    // Obtener otras áreas (con verificación de existencia)
    let otherAreas = [];
    if (elements.otherAreasContainer) {
      otherAreas = Array.from(elements.otherAreasContainer.querySelectorAll('.badge'))
        .map(badge => badge.dataset.id);
    }

    // Manejar DNI: si está vacío o solo espacios, guardar como null
    const dniValue = elements.formDni ? elements.formDni.value.trim() : '';

    return {
      name: elements.formName ? elements.formName.value.trim() : '',
      dni: dniValue ? dniValue.toUpperCase() : null,
      birthDate: elements.formBirthDate ? elements.formBirthDate.value || null : null,
      gender: elements.formGender ? elements.formGender.value || null : null,
      license: elements.formLicense ? elements.formLicense.value.trim() : '',
      specialty: elements.formSpecialty ? elements.formSpecialty.value : '',
      areaId: elements.formArea ? elements.formArea.value : '',
      otherAreas: otherAreas,
      phone: elements.formPhone ? elements.formPhone.value.trim() : '',
      email: elements.formEmail ? elements.formEmail.value.trim() : '',
      address: elements.formAddress ? elements.formAddress.value.trim() || null : null,
      scheduleStart: elements.formScheduleStart ? elements.formScheduleStart.value : '08:00',
      scheduleEnd: elements.formScheduleEnd ? elements.formScheduleEnd.value : '17:00',
      workDays: workDays,
      consultationDuration: elements.formConsultationDuration ? parseInt(elements.formConsultationDuration.value) : 30,
      dailyCapacity: elements.formDailyCapacity ? parseInt(elements.formDailyCapacity.value) : 20,
      status: elements.formStatus ? elements.formStatus.value : 'active',
      isActive: elements.formStatus ? elements.formStatus.value === 'active' : true,
      notes: elements.formNotes ? elements.formNotes.value.trim() || null : null
    };
  }

  // Guardar médico (formulario principal)
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
        elements.btnSave.textContent = state.editingId ? 'ACTUALIZAR PERFIL' : 'REGISTRAR MÉDICO';
      }
    }
  }

  // Guardar estado (modal de estado)
  async function saveStatus() {
    if (!state.currentDoctor || !elements.statusFormState) return;

    const newStatus = elements.statusFormState.value;
    const reason = elements.statusFormReason ? elements.statusFormReason.value.trim() : '';
    const returnDate = elements.statusFormReturnDate ? elements.statusFormReturnDate.value : null;

    if (!newStatus) {
      showNotification('Por favor, seleccione un estado', 'warning');
      return;
    }

    try {
      const updateData = {
        status: newStatus,
        isActive: newStatus === 'active',
        statusReason: reason || null,
        statusReturnDate: returnDate || null,
        statusChangedBy: user?.id || 'system',
        statusChangedAt: new Date().toISOString()
      };

      await updateDoctor(state.currentDoctor.id, updateData);
      showNotification('Estado actualizado correctamente', 'success');
      
      // Notificar si hay citas programadas para un médico que se vuelve inactivo
      if (newStatus !== 'active') {
        const upcomingAppointments = store.get('appointments').filter(a => 
          a.doctorId === state.currentDoctor.id && 
          a.status === 'scheduled' &&
          new Date(a.dateTime) > new Date()
        );
        
        if (upcomingAppointments.length > 0) {
          showNotification(
            `¡Atención! Este médico tiene ${upcomingAppointments.length} citas programadas. Considere reasignarlas.`,
            'warning'
          );
        }
      }
      
      closeStatusModal();
      loadDoctors();

    } catch (error) {
      console.error('Error actualizando estado:', error);
      showNotification('Error al actualizar el estado', 'error');
    }
  }

  // Guardar capacidad (modal de capacidad)
  async function saveCapacity() {
    if (!state.currentDoctor || !elements.capacityFormValue) return;

    const newCapacity = parseInt(elements.capacityFormValue.value);
    const reason = elements.capacityFormReason ? elements.capacityFormReason.value.trim() : '';

    if (isNaN(newCapacity) || newCapacity < 1 || newCapacity > 50) {
      showNotification('La capacidad debe ser un número entre 1 y 50', 'warning');
      return;
    }

    // Verificar si se reduce la capacidad por debajo de las citas ya programadas para hoy
    const stats = getDoctorStats(state.currentDoctor.id);
    if (newCapacity < stats.todayAppointments) {
      const confirm = window.confirm(
        `¡Atención! El médico ya tiene ${stats.todayAppointments} citas programadas para hoy. ` +
        `Reducir la capacidad a ${newCapacity} podría causar problemas. ¿Desea continuar?`
      );
      
      if (!confirm) return;
    }

    try {
      const updateData = {
        dailyCapacity: newCapacity,
        capacityReason: reason || null,
        capacityChangedBy: user?.id || 'system',
        capacityChangedAt: new Date().toISOString()
      };

      await updateDoctor(state.currentDoctor.id, updateData);
      showNotification('Capacidad actualizada correctamente', 'success');
      
      closeCapacityModal();
      loadDoctors();

    } catch (error) {
      console.error('Error actualizando capacidad:', error);
      showNotification('Error al actualizar la capacidad', 'error');
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
    const canEditStatus = role === 'admin' || role === 'receptionist';

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
      <div class="modal-content" style="max-width: 850px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
          <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL GENERAL</h2>
          <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">PERFIL DEL PROFESIONAL MÉDICO</div>
          <button class="btn-close-modal" id="close-view-doctor-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
        </div>
        
        <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 70vh; overflow-y: auto;">
          <!-- Encabezado de Perfil -->
          <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2.5rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
            <div style="width: 100px; height: 100px; background: var(--card-doctor); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: relative;">
               <div style="font-size: 3.5rem;">👨‍⚕️</div>
            </div>
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--modal-header); letter-spacing: 0.1em; margin-bottom: 0.5rem;">CUALIFICACIÓN PROFESIONAL</div>
              <h3 style="margin: 0; font-size: 1.75rem; color: #1a202c; font-weight: 800;">${doctor.name}</h3>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge" style="background: var(--modal-header); color: white; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700;">${doctor.specialty}</span>
                <span style="color: #4a5568; font-size: 0.95rem; font-weight: 600;">📍 ${area?.name || 'Área General'}</span>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge ${doctor.isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 0.75rem;">
                  ${doctor.isActive ? 'Activo' : 'Inactivo'}
                  ${doctor.status === 'vacation' ? ' (Vacaciones)' : doctor.status === 'license' ? ' (Licencia)' : ''}
                </span>
                <span class="badge badge-info" style="font-size: 0.75rem;">
                  👥 Capacidad: ${doctor.dailyCapacity || 20}/día
                </span>
              </div>
            </div>
          </div>

          <!-- Información Dividida -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
            <!-- Ficha Técnica -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-header);">
              <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 1rem; letter-spacing: 0.05em;">IDENTIFICACIÓN Y LICENCIA</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">LICENCIA N°</div>
                  <div style="font-family: monospace; font-weight: 700; font-size: 1.1rem; color: var(--modal-header);">${doctor.license}</div>
                </div>
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">DNI / ID</div>
                  <div style="font-weight: 600;">${doctor.dni || 'No registrado'}</div>
                </div>
              </div>
              <div style="margin-top: 1rem;">
                <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">CONTACTO</div>
                <div style="font-size: 0.9rem; color: #475569;">📞 ${doctor.phone || 'N/A'} • ✉️ ${doctor.email || 'N/A'}</div>
              </div>
            </div>

            <!-- Horario y Disponibilidad -->
            <div style="background: var(--modal-section-forest-light); border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-section-forest);">
              <div style="font-size: 0.75rem; font-weight: 800; color: var(--modal-section-forest); margin-bottom: 1rem; letter-spacing: 0.05em;">HORARIO Y DISPONIBILIDAD</div>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="font-weight: 800; font-size: 1.25rem; color: #1a202c;">${doctor.scheduleStart || '08:00'} - ${doctor.scheduleEnd || '17:00'}</div>
                <div style="font-size: 0.9rem; color: #2d3748; font-weight: 600;">
                   ${doctor.workDays ? doctor.workDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') : 'Lunes a Viernes'}
                </div>
                <div style="font-size: 0.85rem; color: #4a5568;">⏱️ <span style="font-weight: 700;">${doctor.consultationDuration || 30} min</span> por consulta</div>
                <div style="font-size: 0.85rem; color: #4a5568;">👥 <span style="font-weight: 700;">${doctor.dailyCapacity || 20} pacientes</span> máximo por día</div>
              </div>
            </div>
          </div>

          <!-- Panel de Estadísticas (Grid 4) -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2.5rem;">
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">TOTAL CITAS</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-header);">${stats.totalAppointments}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">HOY</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-section-gold);">${stats.todayAppointments}</div>
              <div style="font-size: 0.75rem; color: #64748b;">de ${doctor.dailyCapacity || 20}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">PENDIENTES</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: #3182ce;">${stats.upcomingAppointments}</div>
            </div>
            <div style="background: #fff; border: 1px solid #edf2f7; border-radius: 8px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">ÉXITO</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--modal-section-forest);">${stats.completedAppointments}</div>
            </div>
          </div>

          <!-- Próximas citas -->
          <div style="margin-top: 1rem;">
            <div style="font-size: 0.85rem; font-weight: 800; color: var(--modal-header); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
               <span>📅</span> AGUDA DE LOS PRÓXIMOS DÍAS
            </div>
            ${appointments.length > 0 ? `
              <div style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                  <thead>
                    <tr style="background: #edf2f7; text-align: left;">
                      <th style="padding: 1rem; font-weight: 700; color: #4a5568;">FECHA/HORA</th>
                      <th style="padding: 1rem; font-weight: 700; color: #4a5568;">PACIENTE</th>
                      <th style="padding: 1rem; font-weight: 700; color: #4a5568;">MOTIVO</th>
                      <th style="padding: 1rem; font-weight: 700; color: #4a5568;">ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${appointments.slice(0, 5).map(app => `
                      <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 1rem;">
                           <div style="font-weight: 700;">${new Date(app.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                           <div style="font-size: 0.75rem; color: #666;">${new Date(app.dateTime).toLocaleDateString()}</div>
                        </td>
                        <td style="padding: 1rem;">${store.find('patients', app.patientId)?.name || 'N/A'}</td>
                        <td style="padding: 1rem; color: #666;">${app.reason || 'Consulta'}</td>
                        <td style="padding: 1rem;">
                          <span class="badge ${app.status === 'confirmed' ? 'badge-warning' : 'badge-info'}" style="font-size: 0.7rem;">${app.status.toUpperCase()}</span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div style="background: #f8fafc; padding: 2.5rem; border-radius: 8px; text-align: center; color: #64748b; font-style: italic;">No hay citas registradas en la agenda próxima</div>'}
          </div>
        </div>
        
        <div class="modal-footer" style="background: #f7fafc; padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #edf2f7;">
          <button class="btn" id="close-modal-btn" style="background: white; color: #4a5568; border: 1px solid #e2e8f0; padding: 0.7rem 1.75rem; font-weight: 700; border-radius: 4px;">CERRAR</button>
          ${(role === 'admin' || role === 'doctor') ? `
            <button class="btn" id="edit-doctor-btn" data-id="${doctor.id}" style="background: white; color: var(--modal-header); border: 1px solid var(--modal-header); padding: 0.7rem 1.75rem; font-weight: 700; border-radius: 4px;">EDITAR PERFIL</button>
            <button class="btn" id="view-schedule-btn" data-id="${doctor.id}" style="background: var(--modal-header); color: white; border: none; padding: 0.7rem 1.75rem; font-weight: 700; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">VER AGENDA COMPLETA</button>
          ` : ''}
          ${canEditStatus ? `
            <button class="btn" id="change-status-btn" data-id="${doctor.id}" style="background: var(--warning); color: white; border: none; padding: 0.7rem 1.75rem; font-weight: 700; border-radius: 4px;">CAMBIAR ESTADO</button>
            <button class="btn" id="adjust-capacity-btn" data-id="${doctor.id}" style="background: var(--info); color: white; border: none; padding: 0.7rem 1.75rem; font-weight: 700; border-radius: 4px;">AJUSTAR CAPACIDAD</button>
          ` : ''}
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

    // Botón de cambiar estado
    const statusBtn = modalContainer.querySelector('#change-status-btn');
    if (statusBtn) {
      statusBtn.addEventListener('click', () => {
        closeModalHandler();
        openStatusModal(doctor);
      });
    }

    // Botón de ajustar capacidad
    const capacityBtn = modalContainer.querySelector('#adjust-capacity-btn');
    if (capacityBtn) {
      capacityBtn.addEventListener('click', () => {
        closeModalHandler();
        openCapacityModal(doctor);
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
    // Guardar el filtro en localStorage ANTES de navegar para que appointments.js lo lea al iniciar
    localStorage.setItem('appointment_doctor_filter', doctor.id);

    // Navegar al módulo de citas con filtro por médico
    if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
      window.APP_STATE.appShell.navigateTo('appointments');

      setTimeout(() => {
        showNotification(`Mostrando agenda de ${doctor.name}`, 'info');
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