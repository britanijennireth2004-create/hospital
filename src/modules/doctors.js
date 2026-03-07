import { Logger } from '../utils/logger.js';

/**
 * Módulo de Médicos - Gestión completa
 */

// SVG ICONOS ejecutivos
const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
  <rect x="2.25" y="3.75" width="15.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M6 1.75v3.5M14 1.75v3.5"/>
  <path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M2 7.5h16"/>
</svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
  <rect x="4.25" y="3.75" width="11.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/>
  <rect x="6.75" y="2" width="6.5" height="3.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/>
</svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
  <circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/>
</svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
  <circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M10 1.75v2.5M10 15.75v2.5M3.64 3.64l1.77 1.77M14.59 14.59l1.77 1.77M1.75 10h2.5M15.75 10h2.5M3.64 16.36l1.77-1.77M14.59 5.41l1.77-1.77"/>
</svg>`,
  doctor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
  <circle cx="10" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M3.5 18c0-3.037 2.486-5.5 6.5-5.5s6.5 2.463 6.5 5.5"/>
</svg>`,
  patient: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none">
  <circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/>
</svg>`,
  area: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" fill="none" viewBox="0 0 20 20">
  <rect x="2.25" y="4.25" width="15.5" height="10.5" rx="1.75" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M6.5 15.75V17a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-1.25"/>
</svg>`,
  successCheck: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20">
  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
  <path stroke="currentColor" stroke-width="2" d="M6 10.5l2.5 2 5-5"/>
</svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20">
  <path stroke="currentColor" stroke-width="1.5" d="M10 3v8"/>
  <circle cx="10" cy="15" r="1" fill="currentColor"/>
  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
</svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20">
  <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/>
  <path stroke="currentColor" stroke-width="2" d="M10 7v5"/>
  <circle cx="10" cy="14" r="1" fill="currentColor"/>
</svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
  <path stroke="currentColor" stroke-width="1.5" d="M2.5 17.5L8 12l-1-1-5.5 5.5v1h1z"/>
  <path stroke="currentColor" stroke-width="1.5" d="M12.5 2.5L17.5 7.5 14.5 10.5 9.5 5.5 12.5 2.5z"/>
</svg>`,
  view: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
  <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M2 10c1.5-4 4.5-6.5 8-6.5s6.5 2.5 8 6.5c-1.5 4-4.5 6.5-8 6.5s-6.5-2.5-8-6.5z"/>
</svg>`,
  schedule: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
  <rect x="2.25" y="3.75" width="15.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M6 1.75v3.5M14 1.75v3.5"/>
  <path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M2 7.5h16"/>
  <circle cx="10" cy="11.5" r="1.5" fill="currentColor"/>
  <circle cx="14" cy="11.5" r="1.5" fill="currentColor"/>
  <circle cx="6" cy="11.5" r="1.5" fill="currentColor"/>
</svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path stroke="currentColor" stroke-width="2" d="M6 6L14 14M14 6L6 14"/>
</svg>`,
  gear: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
  <circle cx="10" cy="10" r="3.5" stroke="currentColor" stroke-width="1.5"/>
  <path stroke="currentColor" stroke-width="1.5" d="M10 1.75v2.5M10 15.75v2.5M3.64 3.64l1.77 1.77M14.59 14.59l1.77 1.77M1.75 10h2.5M15.75 10h2.5M3.64 16.36l1.77-1.77M14.59 5.41l1.77-1.77"/>
</svg>`,
  status: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
  <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
  <circle cx="10" cy="10" r="2" fill="currentColor"/>
</svg>`,
  capacity: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="none">
  <rect x="2" y="8" width="4" height="8" stroke="currentColor" stroke-width="1.5"/>
  <rect x="8" y="5" width="4" height="11" stroke="currentColor" stroke-width="1.5"/>
  <rect x="14" y="2" width="4" height="14" stroke="currentColor" stroke-width="1.5"/>
</svg>`,
  add: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path stroke="currentColor" stroke-width="2" d="M10 3v14M3 10h14"/>
</svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  filter: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path stroke="currentColor" stroke-width="1.5" d="M2 4h16v2l-5 5v5l-2 2v-7L2 6V4z"/>
</svg>`
};

export default function mountDoctors(root, { bus, store, user, role }) {
  const state = {
    doctors: [],
    filters: {
      search: '',
      onlyToday: false
    },
    editingId: null,
    isLoading: false,
    showModal: false,
    showStatusModal: false,
    showCapacityModal: false,
    currentDoctor: null,
    currentPage: 1,
    itemsPerPage: 10
  };

  let elements = {};

  // Inicializar
  function init() {
    render();
    setupEventListeners();
    loadSelectData();
    loadDoctors();

    const unsubscribe = store.subscribe('doctors', () => {
      loadDoctors();
    });

    return {
      destroy: () => {
        unsubscribe();
      }
    };
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Cargar médicos
  function loadDoctors() {
    let doctors = store.get('doctors');
    doctors = applyFilters(doctors);
    doctors.sort((a, b) => a.name.localeCompare(b.name));
    state.doctors = doctors;
    renderDoctorsList();
    updateStats();
  }

  // Aplicar filtros
  function applyFilters(doctors) {
    return doctors.filter(doctor => {
      if (state.filters.search) {
        const searchTerm = state.filters.search.toLowerCase();
        const area = store.find('areas', doctor.areaId);

        // Traducir estado para facilitar búsqueda
        const statusMap = {
          'active': 'activo active',
          'inactive': 'inactivo inactive',
          'vacation': 'vacaciones vacation',
          'license': 'licencia license'
        };
        const statusText = statusMap[doctor.status] || (doctor.isActive ? 'activo active' : 'inactivo inactive');

        const searchFields = [
          doctor.name,
          doctor.specialty,
          doctor.license,
          doctor.email,
          doctor.phone,
          area?.name,
          statusText
        ].filter(Boolean).join(' ').toLowerCase();

        if (!searchFields.includes(searchTerm)) {
          return false;
        }
      }

      if (state.filters.onlyToday) {
        if (!isDoctorWorkingAt(doctor, new Date())) {
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

  // Verificar si un médico trabaja en un día/hora específico
  function isDoctorWorkingAt(doctor, date, timeStr = null, duration = 0) {
    if (doctor.isActive === false || doctor.status === 'vacation' || doctor.status === 'license') return false;

    // Normalizar fecha
    const dateObj = date instanceof Date ? date : new Date(date + 'T12:00:00');
    const dayIndex = dateObj.getDay();

    // Arrays para días de la semana
    const englishDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const spanishDays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayEn = englishDays[dayIndex];
    const dayEs = spanishDays[dayIndex];

    let worksThatDay = false;
    let startStr = doctor.scheduleStart || (doctor.workStartHour !== undefined ? `${doctor.workStartHour.toString().padStart(2, '0')}:00` : '08:00');
    let endStr = doctor.scheduleEnd || (doctor.workEndHour !== undefined ? `${doctor.workEndHour.toString().padStart(2, '0')}:00` : '18:00');

    // 1. Objeto schedule (formato avanzado)
    if (doctor.schedule && typeof doctor.schedule === 'object') {
      const scheduleKeys = Object.keys(doctor.schedule).reduce((acc, key) => { acc[key.toLowerCase()] = doctor.schedule[key]; return acc; }, {});
      if (scheduleKeys[dayEn]) {
        const daySched = scheduleKeys[dayEn];
        if (daySched.start && daySched.end) {
          worksThatDay = true;
          startStr = daySched.start;
          endStr = daySched.end;
        }
      }
    }

    // 2. Array workDays (formato simple)
    if (!worksThatDay && doctor.workDays && Array.isArray(doctor.workDays) && doctor.workDays.length > 0) {
      const workDays = doctor.workDays.map(d => d.toLowerCase());
      const normalizedDayEs = dayEs.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (workDays.includes(dayEs.toLowerCase()) || workDays.includes(normalizedDayEs)) {
        worksThatDay = true;
      }
    }

    // 3. String schedule (formato legado)
    if (!worksThatDay && typeof doctor.schedule === 'string') {
      const s = doctor.schedule.toLowerCase();
      if (s.includes('lun-vie') && dayIndex >= 1 && dayIndex <= 5) worksThatDay = true;
      else if (s.includes('mar-jue') && dayIndex >= 2 && dayIndex <= 4) worksThatDay = true;
      else if (s.includes('lun-sab') && dayIndex >= 1 && dayIndex <= 6) worksThatDay = true;
      else if (s.includes('lun-dom')) worksThatDay = true;

      if (!worksThatDay) {
        const abbrs = { 'lun': 1, 'mar': 2, 'mie': 3, 'jue': 4, 'vie': 5, 'sab': 6, 'dom': 0 };
        Object.entries(abbrs).forEach(([a, i]) => { if (s.includes(a) && dayIndex === i) worksThatDay = true; });
      }
    }

    // Fallback absoluto: L-V si no tiene nada definido
    if (!worksThatDay && !doctor.workDays && !doctor.schedule) {
      if (dayIndex >= 1 && dayIndex <= 5) worksThatDay = true;
    }

    if (!worksThatDay) return false;
    if (!timeStr) return true;

    const timeToMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const timeVal = timeToMin(timeStr);
    const endValTarget = timeVal + (duration || 0);
    const startValTotal = timeToMin(startStr);
    const endValTotal = timeToMin(endStr);

    return timeVal >= startValTotal && endValTarget <= endValTotal;
  }

  // Formatear horario
  function formatSchedule(doctor) {
    if (!doctor) return 'No definido';

    // 1. Si hay schedule string (legado)
    if (typeof doctor.schedule === 'string' && doctor.schedule) {
      return doctor.schedule;
    }

    // 2. Si hay workDays + horas (formato nuevo)
    if (doctor.workDays && Array.isArray(doctor.workDays) && doctor.workDays.length > 0) {
      const daysShort = {
        'lunes': 'Lun', 'martes': 'Mar', 'miércoles': 'Mié', 'jueves': 'Jue',
        'viernes': 'Vie', 'sábado': 'Sáb', 'domingo': 'Dom'
      };
      const daysStr = doctor.workDays.map(d => daysShort[d.toLowerCase()] || d).join(', ');
      const start = doctor.scheduleStart || (doctor.workStartHour !== undefined ? `${doctor.workStartHour}:00` : '08:00');
      const end = doctor.scheduleEnd || (doctor.workEndHour !== undefined ? `${doctor.workEndHour}:00` : '17:00');
      return `${daysStr} ${start}-${end}`;
    }

    // 3. Si hay objeto schedule (formato avanzado)
    if (doctor.schedule && typeof doctor.schedule === 'object') {
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

        return Object.entries(doctor.schedule)
          .filter(([day, hours]) => hours && hours.start && hours.end)
          .map(([day, hours]) => `${days[day] || day}: ${hours.start}-${hours.end}`)
          .join(', ');
      } catch {
        return 'Horario personalizado';
      }
    }

    return 'No definido';
  }

  // Renderizar componente principal
  function render() {
    const canManage = role === 'admin' || role === 'receptionist';
    const canEditStatus = role === 'admin' || role === 'receptionist';

    root.innerHTML = `
      <div class="module-doctors">
        <!-- Estadísticas -->
        <div class="stats-auto-grid mb-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Header -->
        <div class="card" style="padding: 0.75rem 1rem;">
          <div class="flex justify-between items-center">
            ${canManage ? `
              <button class="btn btn-primary" id="btn-new-doctor">
                <span style="display: flex; align-items: center; gap: 0.5rem;">
                  ${icons.add}
                  Nuevo Médico
                </span>
              </button>
            ` : '<div></div>'}
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2" style="white-space: nowrap;">
                <input type="checkbox" id="filter-today" ${state.filters.onlyToday ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                <label for="filter-today" class="text-sm font-semibold" style="cursor: pointer;">En turno hoy</label>
              </div>
              <div class="search-input-wrapper" style="position: relative; width: 450px;">
                <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
                  ${icons.search}
                </span>
                <input type="text" class="input" id="filter-search" 
                       placeholder="Buscar por nombre, especialidad, licencia, área, estado..." 
                       style="padding-left: 2.8rem; border-radius: 20px; background: rgba(0,0,0,0.05); border: 1px solid transparent; transition: all 0.3s; height: 40px; width: 100%;"
                       value="${state.filters.search}">
              </div>
            </div>
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
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; color: var(--muted);">
                ${icons.doctor}
              </div>
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
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h3>
              <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">
                ${state.editingId ? 'EDICIÓN DE PERFIL PROFESIONAL' : 'REGISTRO DE PERSONAL MÉDICO'}
              </div>
            </div>
            <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-modal">&times;</button>
          </div>
          
          <div class="modal-body" style="padding: 1.5rem; max-height: 65vh; overflow-y: auto;">
            <form id="doctor-form">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: var(--neutralPrimary); display: flex; align-items: center; gap: 8px;">
                  ${icons.user} INFORMACIÓN PERSONAL
                </h4>
                
                <div class="grid grid-2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOMBRE COMPLETO *</label>
                    <input type="text" class="input" id="form-name" required style="height: 38px;">
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CÉDULA / C.I. *</label>
                    <div class="doc-group" style="display: flex; gap: 0;">
                      <select class="input" id="form-doc-type" required style="width: 70px; border-radius: 4px 0 0 4px; border-right: none; background: #fff; height: 38px;">
                        <option value="V">V</option>
                        <option value="E">E</option>
                        <option value="J">J</option>
                        <option value="P">P</option>
                      </select>
                      <input type="text" class="input" id="form-dni" required placeholder="Número de cédula" style="flex: 1; border-radius: 0 4px 4px 0; height: 38px;">
                    </div>
                  </div>
                </div>

                <div class="grid grid-2 gap-4">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">TELÉFONO *</label>
                    <input type="tel" class="input" id="form-phone" required style="height: 38px;">
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CORREO ELECTRÓNICO *</label>
                    <input type="email" class="input" id="form-email" required style="height: 38px;">
                  </div>
                </div>
              </div>

              <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; border: 1px solid #c2e0ff; margin-bottom: 20px;">
                <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #005a9e; display: flex; align-items: center; gap: 8px;">
                  ${icons.clipboard || ''} DATOS PROFESIONALES
                </h4>
                <div class="grid grid-2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESPECIALIDAD *</label>
                    <input type="text" class="input" id="form-specialty" required placeholder="Ej: Cardiología" style="height: 38px;">
                  </div>
                   <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">Nº LICENCIA / MPPS *</label>
                    <input type="text" class="input" id="form-license" required style="height: 38px;">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ÁREA ASIGNADA *</label>
                  <select class="input" id="form-area" required style="height: 38px;"></select>
                </div>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">OTRAS ÁREAS ASIGNADAS</label>
                <div id="other-areas-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; min-height: 20px;">
                  <!-- Se llenará dinámicamente con las áreas adicionales -->
                </div>
                <select class="input" id="form-add-area" style="border-color: var(--modal-border); background: var(--modal-bg); margin-top: 0.5rem;">
                  <option value="">Agregar otra área...</option>
                </select>
              </div>
              
              <div style="background: #fffcf5; padding: 20px; border-radius: 8px; border: 1px solid #fff1c1; margin-bottom: 20px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA DE NACIMIENTO</label>
                    <input type="date" class="input" id="form-birth-date" style="border-color: var(--neutralTertiary); background: var(--white); height: 38px;">
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">GÉNERO</label>
                    <select class="input" id="form-gender" style="border-color: var(--neutralTertiary); background: var(--white); height: 38px;">
                      <option value="">Seleccionar</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                      <option value="O">Otro</option>
                    </select>
                  </div>
                </div>

                <div class="form-group" style="margin-top: 1rem;">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DIRECCIÓN</label>
                  <input type="text" class="input" id="form-address" placeholder="Ej: Calle Principal 123, Ciudad" style="border-color: var(--neutralTertiary); background: var(--white); height: 38px;">
                </div>
              </div>
              
              <!-- Horario y disponibilidad -->
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: var(--modal-section-olive); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                ${icons.calendar}
                HORARIO Y DISPONIBILIDAD
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ENTRADA *</label>
                  <input type="time" class="input" id="form-schedule-start" required value="08:00" style="border-color: var(--neutralTertiary); background: var(--white);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">SALIDA *</label>
                  <input type="time" class="input" id="form-schedule-end" required value="17:00" style="border-color: var(--neutralTertiary); background: var(--white);">
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
                  <select class="input" id="form-consultation-duration" required style="border-color: var(--neutralTertiary); background: var(--white);">
                    <option value="15">15 minutos</option>
                    <option value="20">20 minutos</option>
                    <option value="30" selected>30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CAPACIDAD DIARIA *</label>
                  <input type="number" class="input" id="form-daily-capacity" required min="1" max="50" value="20" placeholder="Ej: 20" style="border-color: var(--neutralTertiary); background: var(--white);">
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
              
              <!-- Credenciales de Acceso -->
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; margin-top: 1.5rem;">
                ${icons.settings}
                CREDENCIALES DE ACCESO
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOMBRE DE USUARIO</label>
                  <input type="text" class="input" id="form-username" placeholder="Se usará el email si se deja vacío" style="border-color: var(--neutralTertiary); background: var(--white);">
                </div>
                
                <div class="form-group">
                  <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CONTRASEÑA DE ACCESO *</label>
                  <input type="password" class="input" id="form-password" ${state.editingId ? '' : 'required'} placeholder="Mínimo 6 caracteres" style="border-color: var(--neutralTertiary); background: var(--white);">
                </div>
              </div>

              <div class="form-group" style="margin-top: 1.5rem;">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOTAS INTERNAS</label>
                <textarea class="input" id="form-notes" rows="2" placeholder="Notas adicionales..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn-circle btn-circle-cancel" id="btn-cancel" title="Cancelar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button class="btn-circle btn-circle-save" id="btn-save" title="${state.editingId ? 'Actualizar Perfil' : 'Registrar Médico'}" ${state.isLoading ? 'disabled' : ''}>
              ${state.isLoading ? '<span class="loading-spinner"></span>' : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal para cambiar estado -->
      <div class="modal-overlay ${state.showStatusModal ? '' : 'hidden'}" id="status-modal">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">CAMBIAR ESTADO</h3>
              <div id="status-modal-name" style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">Médico</div>
            </div>
            <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-status-modal">&times;</button>
          </div>
          
          <div class="modal-body" style="padding: 1.5rem;">
            <form id="status-form">
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO ACTUAL</label>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                  <div id="status-modal-badge" style="width: 12px; height: 12px; border-radius: 50%; background: ${state.currentDoctor?.isActive ? 'var(--success)' : 'var(--danger)'};"></div>
                  <span id="status-modal-text" style="font-weight: 600;">${state.currentDoctor?.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
                  <span id="status-modal-subtext" class="hidden" style="margin-left: 0.5rem;"></span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NUEVO ESTADO *</label>
                <select class="input" id="status-form-state" required style="border-color: var(--neutralTertiary); background: var(--white);">
                  <option value="">Seleccionar estado</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="vacation">Vacaciones</option>
                  <option value="license">Licencia</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MOTIVO DEL CAMBIO</label>
                <textarea class="input" id="status-form-reason" rows="3" placeholder="Ej: Vacaciones programadas, licencia médica..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA DE REINTEGRO</label>
                <input type="date" class="input" id="status-form-return-date" style="border-color: var(--neutralTertiary); background: var(--white);">
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn-circle" id="btn-cancel-status" title="Cancelar" style="background-color: #64748b; color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button class="btn-circle" id="btn-save-status" title="Actualizar Estado" style="background-color: var(--success); color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal para ajustar capacidad -->
      <div class="modal-overlay ${state.showCapacityModal ? '' : 'hidden'}" id="capacity-modal">
        <div class="modal-content" style="max-width: 500px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">AJUSTAR CAPACIDAD</h3>
              <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">
                ${state.currentDoctor ? state.currentDoctor.name : 'Médico'}
              </div>
            </div>
            <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-capacity-modal">&times;</button>
          </div>
          
          <div class="modal-body" style="padding: 1.5rem;">
            <form id="capacity-form">
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CAPACIDAD ACTUAL</label>
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                  <div style="font-size: 2rem; color: var(--info);">${icons.capacity}</div>
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
          
          <div class="modal-footer">
            <button class="btn-circle" id="btn-cancel-capacity" title="Cancelar" style="background-color: #64748b; color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button class="btn-circle" id="btn-save-capacity" title="Actualizar Capacidad" style="background-color: var(--themePrimary); color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>
          </div>
        </div>
      </div>
    `;

    captureElements();
  }

  // Capturar referencias a elementos del DOM
  function captureElements() {
    elements = {
      statsContainer: root.querySelector('#stats-container'),
      doctorsList: root.querySelector('#doctors-list'),
      doctorsCount: root.querySelector('#doctors-count'),
      emptyState: root.querySelector('#empty-state'),
      doctorsTable: root.querySelector('#doctors-table'),
      pagination: root.querySelector('#pagination'),

      // Filtros
      filterSearch: root.querySelector('#filter-search'),
      filterToday: root.querySelector('#filter-today'),

      // Modal principal
      modal: root.querySelector('#doctor-modal'),
      form: root.querySelector('#doctor-form'),
      formName: root.querySelector('#form-name'),
      formDocType: root.querySelector('#form-doc-type'),
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
      formUsername: root.querySelector('#form-username'),
      formPassword: root.querySelector('#form-password'),
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
  }

  // Cargar datos en selects
  function loadSelectData() {
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
    const canManageAll = role === 'admin' || role === 'receptionist';   // puede editar/estado de todos
    const isOwnDoctor = (d) => role === 'doctor' && user?.doctorId === d.id; // médico viendo su propio perfil

    if (paginatedDoctors.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.doctorsTable.classList.add('hidden');
      elements.pagination.classList.add('hidden');
      if (elements.doctorsCount) elements.doctorsCount.textContent = '0 médicos';
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.doctorsTable.classList.remove('hidden');
    elements.pagination.classList.remove('hidden');

    if (elements.doctorsCount) elements.doctorsCount.textContent = `${state.doctors.length} ${state.doctors.length === 1 ? 'médico' : 'médicos'}`;

    const rows = paginatedDoctors.map(doctor => {
      const stats = getDoctorStats(doctor.id);
      const area = store.find('areas', doctor.areaId);
      const dailyCapacity = doctor.dailyCapacity || 20;
      const capacityPercentage = Math.min(Math.round((stats.todayAppointments / dailyCapacity) * 100), 100);
      const isWorkingToday = isDoctorWorkingAt(doctor, new Date());

      // Permisos por botón
      const canEdit = canManageAll || isOwnDoctor(doctor); // editar: admin/recep o propio médico
      const canChangeStatus = canManageAll;                       // estado: SOLO admin/recep

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
            <div class="text-sm">${formatSchedule(doctor)}</div>
            <div class="text-xs text-muted">${doctor.consultationDuration || 30} min/consulta</div>
            ${isWorkingToday ? '<span class="badge badge-success" style="font-size: 0.65rem; margin-top: 0.25rem;">Hoy en turno</span>' : '<span class="badge badge-outline" style="font-size: 0.65rem; margin-top: 0.25rem; opacity: 0.6;">No labora hoy</span>'}
          </td>
          <td data-label="Citas hoy">
            <div class="text-center">
              ${isWorkingToday ? `
                <div style="font-weight: bold; font-size: 1.25rem; color: ${stats.todayAppointments > 0 ? 'var(--accent-2)' : 'var(--muted)'}">
                  ${stats.todayAppointments}
                </div>
                <div class="text-xs text-muted">de ${dailyCapacity}</div>
              ` : `
                <div style="color: var(--muted); font-style: italic; font-size: 0.85rem;">-</div>
              `}
            </div>
          </td>
          <td data-label="Capacidad diaria">
            ${isWorkingToday ? `
              <div style="margin-bottom: 0.25rem;">
                <div style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                  <div style="width: ${capacityPercentage}%; height: 100%; background: ${capacityPercentage > 80 ? 'var(--danger)' : capacityPercentage > 60 ? 'var(--warning)' : 'var(--success)'}"></div>
                </div>
              </div>
              <div class="text-sm">
                ${stats.todayAppointments}/${dailyCapacity} pacientes
              </div>
            ` : `
              <div style="font-size: 0.8rem; color: var(--muted); text-align: center;">Sin actividad hoy</div>
            `}
          </td>
          <td data-label="Estado">
            <span class="badge ${doctor.isActive ? 'badge-success' : 'badge-danger'}">
              ${doctor.isActive ? 'Activo' : 'Inactivo'}
              ${doctor.status === 'vacation' ? ' (Vacaciones)' : doctor.status === 'license' ? ' (Licencia)' : ''}
            </span>
          </td>
          <td data-label="Acciones">
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button class="btn-circle btn-circle-status" data-action="view" data-id="${doctor.id}" title="Ver perfil">
                ${icons.view || ICONS.eye}
              </button>
              ${canChangeStatus ? `
                <button class="btn-circle btn-circle-cancel" data-action="status" data-id="${doctor.id}" title="Cambiar Estado">
                  ${ICONS.sync}
                </button>
                <button class="btn-circle btn-circle-view" data-action="capacity" data-id="${doctor.id}" title="Ajustar Capacidad">
                  ${icons.capacity || ICONS.chart}
                </button>
              ` : ''}
              ${canEdit ? `
                <button class="btn-circle btn-circle-edit" data-action="edit" data-id="${doctor.id}" title="Editar">
                  ${ICONS.edit}
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
    const doctors = store.get('doctors') || [];
    const appointments = store.get('appointments') || [];
    const today = new Date();
    const todayStr = today.toDateString();

    const usedCapacity = appointments.filter(a =>
      a.status !== 'cancelled' &&
      new Date(a.dateTime).toDateString() === todayStr
    ).length;

    // Calcular capacidad total considerando solo médicos trabajando hoy
    const workingToday = doctors.filter(d => isDoctorWorkingAt(d, today));
    const totalCapacity = workingToday.reduce((sum, d) => sum + (d.dailyCapacity || 20), 0);
    const availableCapacity = Math.max(0, totalCapacity - usedCapacity);

    const stats = {
      total: doctors.length,
      active: doctors.filter(d => d.isActive).length,
      workingToday: workingToday.length,
      specialties: [...new Set(doctors.map(d => d.specialty).filter(Boolean))].length,
      todayAppointments: usedCapacity,
      totalCapacity: totalCapacity,
      availableCapacity: availableCapacity
    };

    elements.statsContainer.innerHTML = `
      <div class="stat-info-card">
        <span class="stat-info-label">Total Médicos</span>
        <span class="stat-info-value">${stats.total}</span>
        <span class="stat-info-sub">${icons.doctor} Registrados</span>
      </div>

      <div class="stat-info-card">
        <span class="stat-info-label">Médicos Hoy</span>
        <span class="stat-info-value">${stats.workingToday}</span>
        <span class="stat-info-sub">${icons.successCheck} En turno</span>
      </div>

      <div class="stat-info-card">
        <span class="stat-info-label">Especialidades</span>
        <span class="stat-info-value">${stats.specialties}</span>
        <span class="stat-info-sub">${icons.clipboard} Áreas médicas</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Capacidad Hoy</span>
        <span class="stat-info-value">${usedCapacity}/${stats.totalCapacity}</span>
        <span class="stat-info-sub">${icons.capacity} ${availableCapacity} disponibles</span>
      </div>
    `;
  }

  // Configurar event listeners
  function setupEventListeners() {
    if (elements.filterSearch) {
      elements.filterSearch.addEventListener('input', debounce(applyFiltersHandler, 300));
    }

    if (elements.filterToday) {
      elements.filterToday.addEventListener('change', (e) => {
        state.filters.onlyToday = e.target.checked;
        applyFiltersHandler();
      });
    }


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

    if (elements.formAddArea) {
      elements.formAddArea.addEventListener('change', addOtherArea);
    }

    if (elements.doctorsList) {
      elements.doctorsList.addEventListener('click', handleListAction);
    }

    if (elements.pagination) {
      elements.pagination.addEventListener('click', handlePagination);
    }

    if (elements.btnCloseStatusModal) {
      elements.btnCloseStatusModal.addEventListener('click', closeStatusModal);
    }

    if (elements.btnCancelStatus) {
      elements.btnCancelStatus.addEventListener('click', closeStatusModal);
    }

    if (elements.btnSaveStatus) {
      elements.btnSaveStatus.addEventListener('click', saveStatus);
    }

    if (elements.btnCloseCapacityModal) {
      elements.btnCloseCapacityModal.addEventListener('click', closeCapacityModal);
    }

    if (elements.btnCancelCapacity) {
      elements.btnCancelCapacity.addEventListener('click', closeCapacityModal);
    }

    if (elements.btnSaveCapacity) {
      elements.btnSaveCapacity.addEventListener('click', saveCapacity);
    }

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

      const calcButtons = document.querySelectorAll('[data-calc]');
      calcButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          const calcType = e.target.dataset.calc;
          let capacity;

          switch (calcType) {
            case '8h':
              capacity = 16;
              break;
            case '6h':
              capacity = 12;
              break;
            case '4h':
              capacity = 8;
              break;
            default:
              return;
          }

          elements.capacityFormSlider.value = capacity;
          elements.capacityFormValue.value = capacity;
          updateCapacityImpact();
        });
      });
    }

    if (elements.formDni) {
      elements.formDni.addEventListener('input', debounce(handleRegistryLookup, 500));
    }

    if (elements.formDocType) {
      elements.formDocType.addEventListener('change', handleRegistryLookup);
    }
  }

  // --- Lógica de Precarga por Cédula (SAIME Simulation) ---
  function handleRegistryLookup() {
    // Solo permitir si estamos creando un nuevo registro
    if (state.editingId) return;

    const docType = elements.formDocType.value;
    const dni = elements.formDni.value.trim();

    if (dni && dni.length >= 6) {
      // Mostrar estado de carga visual sutil
      if (elements.formDni) elements.formDni.style.opacity = '0.7';

      setTimeout(() => {
        const found = store.fetchFromRegistry(docType, dni);
        if (elements.formDni) elements.formDni.style.opacity = '1';

        if (found) {
          showNotification(`Datos encontrados para C.I. ${docType}-${dni}. Precargando...`, 'info');

          // Llenar campos
          if (elements.formName) elements.formName.value = found.name;
          if (elements.formBirthDate) elements.formBirthDate.value = found.birthDate;
          if (elements.formGender) elements.formGender.value = found.gender;
          if (elements.formAddress && !elements.formAddress.value) elements.formAddress.value = found.address || '';
          if (elements.formPhone && !elements.formPhone.value) elements.formPhone.value = found.phone || '';
          if (elements.formEmail && !elements.formEmail.value) elements.formEmail.value = found.email || '';

          // Efecto visual de resaltado
          const highlightFields = [elements.formName, elements.formBirthDate, elements.formGender];
          highlightFields.forEach(f => {
            if (f) {
              f.style.transition = 'background 0.5s';
              f.style.backgroundColor = '#f0fdf4';
              setTimeout(() => {
                f.style.backgroundColor = '';
              }, 2000);
            }
          });
        }
      }, 700);
    }
  }

  // Manejar filtros
  function applyFiltersHandler() {
    state.filters.search = elements.filterSearch?.value || '';
    state.currentPage = 1;
    loadDoctors();
  }

  // El manejador de limpieza de filtros ha sido eliminado en la refactorización unificada.

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
        if (role === 'admin' || role === 'receptionist' || (role === 'doctor' && user?.doctorId === doctorId)) {
          editDoctor(doctor);
        } else {
          showNotification('No tienes permiso para editar este perfil', 'error');
        }
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
  // Abrir modal principal
  function openModal(doctor = null) {
    state.editingId = doctor?.id || null;
    state.showModal = true;

    if (elements.modal) {
      elements.modal.classList.remove('hidden');
    }

    if (doctor) {
      populateForm(doctor);

      // Si es médico editando su perfil, restringir cambios sensibles
      if (role === 'doctor') {
        const restrictedFields = ['form-name', 'form-dni', 'form-license', 'form-specialty', 'form-area'];
        restrictedFields.forEach(id => {
          const el = root.querySelector(`#${id}`);
          if (el) {
            el.disabled = true;
            el.title = "Solo administración puede modificar este campo";
            el.style.backgroundColor = '#f3f4f6';
          }
        });
      }
    } else {
      clearForm();
      // Restaurar campos si es necesario
      const allFields = ['form-name', 'form-dni', 'form-license', 'form-specialty', 'form-area'];
      allFields.forEach(id => {
        const el = root.querySelector(`#${id}`);
        if (el) {
          el.disabled = false;
          el.style.backgroundColor = '';
          el.title = "";
        }
      });
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

    // Actualizar dinámicamente el nombre y el estado actual visual en el modal
    const modalName = root.querySelector('#status-modal-name');
    if (modalName) modalName.textContent = doctor.name;

    const badge = root.querySelector('#status-modal-badge');
    const text = root.querySelector('#status-modal-text');
    const subtext = root.querySelector('#status-modal-subtext');

    if (badge) badge.style.background = doctor.isActive ? 'var(--success)' : 'var(--danger)';
    if (text) text.textContent = doctor.isActive ? 'ACTIVO' : 'INACTIVO';

    if (subtext) {
      if (doctor.status === 'vacation') {
        subtext.innerHTML = '<span class="badge badge-warning">Vacaciones</span>';
        subtext.classList.remove('hidden');
      } else if (doctor.status === 'license') {
        subtext.innerHTML = '<span class="badge badge-info">Licencia</span>';
        subtext.classList.remove('hidden');
      } else {
        subtext.innerHTML = '';
        subtext.classList.add('hidden');
      }
    }

    if (elements.statusFormState) {
      elements.statusFormState.value = doctor.status || 'active';
    }

    const reasonInput = root.querySelector('#status-form-reason');
    if (reasonInput) reasonInput.value = doctor.statusReason || '';

    if (elements.statusFormReturnDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.statusFormReturnDate.min = today;
      elements.statusFormReturnDate.value = doctor.statusReturnDate || '';
    }

    if (elements.statusModal) {
      elements.statusModal.classList.remove('hidden');
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
    if (elements.formDocType) elements.formDocType.value = doctor.docType || 'V';
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

    // Cargar nombre de usuario asociado
    const userAccount = store.get('users').find(u => u.doctorId === doctor.id);
    if (elements.formUsername) elements.formUsername.value = userAccount ? userAccount.username : '';

    let workDays = doctor.workDays || [];

    // Si no hay workDays pero hay schedule string (legado)
    if ((!workDays || workDays.length === 0) && typeof doctor.schedule === 'string') {
      const s = doctor.schedule.toLowerCase();
      if (s.includes('lun-vie')) workDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
      else if (s.includes('mar-jue')) workDays = ['martes', 'miércoles', 'jueves'];
      else if (s.includes('lun-sab')) workDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      else if (s.includes('lun-dom')) workDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

      const dayAbbrs = { 'lun': 'lunes', 'mar': 'martes', 'mie': 'miércoles', 'jue': 'jueves', 'vie': 'viernes', 'sab': 'sábado', 'dom': 'domingo' };
      Object.entries(dayAbbrs).forEach(([abbr, full]) => {
        if (s.includes(abbr) && !workDays.includes(full)) workDays.push(full);
      });
    }

    // Si sigue vacío, usar default
    if (!workDays || workDays.length === 0) {
      workDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
    }

    root.querySelectorAll('#doctor-form .form-checkbox').forEach(checkbox => {
      checkbox.checked = workDays.includes(checkbox.value);
    });

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

    if (elements.otherAreasContainer) {
      elements.otherAreasContainer.innerHTML = '';
    }

    root.querySelectorAll('#doctor-form .form-checkbox').forEach((checkbox, index) => {
      checkbox.checked = index < 5;
    });

    if (elements.formScheduleStart) elements.formScheduleStart.value = '08:00';
    if (elements.formScheduleEnd) elements.formScheduleEnd.value = '17:00';
    if (elements.formConsultationDuration) elements.formConsultationDuration.value = 30;
    if (elements.formDailyCapacity) elements.formDailyCapacity.value = 20;

    if (elements.formAddArea) elements.formAddArea.value = '';
  }

  // Agregar área adicional
  function addOtherArea() {
    if (!elements.formAddArea || !elements.otherAreasContainer) return;

    const areaId = elements.formAddArea.value;
    if (!areaId) return;

    const area = store.find('areas', areaId);
    if (!area) return;

    if (elements.formArea && elements.formArea.value === areaId) {
      showNotification('Esta área ya está seleccionada como principal', 'warning');
      elements.formAddArea.value = '';
      return;
    }

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

    badge.querySelector('.badge-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      badge.remove();
    });
  }

  // Validar formulario principal
  async function validateForm() {
    let isValid = true;
    window.hospitalFieldValidation.clearAll(elements.form);

    const requiredFields = [
      { field: elements.formName, label: 'Este campo es obligatorio' },
      { field: elements.formLicense, label: 'Este campo es obligatorio' },
      { field: elements.formSpecialty, label: 'Este campo es obligatorio' },
      { field: elements.formArea, label: 'Debe seleccionar un área' },
      { field: elements.formPhone, label: 'Este campo es obligatorio' },
      { field: elements.formEmail, label: 'Este campo es obligatorio' },
      { field: elements.formScheduleStart, label: 'Hora requerida' },
      { field: elements.formScheduleEnd, label: 'Hora requerida' },
      { field: elements.formConsultationDuration, label: 'Requerido' },
      { field: elements.formDailyCapacity, label: 'Requerido' }
    ];

    requiredFields.forEach(({ field, label }) => {
      if (field) {
        if (!field.value.trim()) {
          window.hospitalFieldValidation.show(field, label);
          isValid = false;
        }
      }
    });

    if (elements.formDni && elements.formDni.value.trim() && !/^\d+$/.test(elements.formDni.value.trim())) {
      window.hospitalFieldValidation.show(elements.formDni, 'Cédula inválida (solo números)');
      isValid = false;
    }

    if (elements.formEmail && elements.formEmail.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(elements.formEmail.value.trim())) {
        window.hospitalFieldValidation.show(elements.formEmail, 'Email no válido');
        isValid = false;
      }
    }

    if (elements.formPhone && elements.formPhone.value.trim()) {
      const phoneRegex = /^[0-9\s\+\-\(\)]{9,15}$/;
      if (!phoneRegex.test(elements.formPhone.value.trim())) {
        window.hospitalFieldValidation.show(elements.formPhone, 'Teléfono no válido');
        isValid = false;
      }
    }

    if (elements.formScheduleStart && elements.formScheduleEnd && elements.formScheduleStart.value && elements.formScheduleEnd.value) {
      const startTime = new Date(`1970-01-01T${elements.formScheduleStart.value}`);
      const endTime = new Date(`1970-01-01T${elements.formScheduleEnd.value}`);
      if (startTime >= endTime) {
        window.hospitalFieldValidation.show(elements.formScheduleEnd, 'Debe ser posterior al inicio');
        isValid = false;
      }
    }

    if (elements.formDailyCapacity) {
      const capacity = parseInt(elements.formDailyCapacity.value);
      if (isNaN(capacity) || capacity < 1 || capacity > 50) {
        window.hospitalFieldValidation.show(elements.formDailyCapacity, 'Entre 1 y 50');
        isValid = false;
      }
    }

    if (!isValid) {
      const firstError = elements.form.querySelector('.error-field');
      if (firstError) firstError.focus();
    }

    return isValid;
  }

  // Obtener datos del formulario principal
  function getFormData() {
    const workDays = Array.from(root.querySelectorAll('#doctor-form .form-checkbox:checked'))
      .map(checkbox => checkbox.value);

    let otherAreas = [];
    if (elements.otherAreasContainer) {
      otherAreas = Array.from(elements.otherAreasContainer.querySelectorAll('.badge'))
        .map(badge => badge.dataset.id);
    }

    const dniValue = elements.formDni ? elements.formDni.value.trim() : '';

    return {
      name: elements.formName ? elements.formName.value.trim() : '',
      docType: elements.formDocType?.value || 'V',
      dni: elements.formDni?.value.trim() || '',
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
      notes: elements.formNotes ? elements.formNotes.value.trim() || null : null,
      username: elements.formUsername ? elements.formUsername.value.trim() : '',
      password: elements.formPassword ? elements.formPassword.value : ''
    };
  }

  // Guardar médico (formulario principal)
  async function saveDoctor() {
    if (!await validateForm()) {
      return;
    }

    // Validar permisos para crear
    if (!state.editingId && role !== 'admin' && role !== 'receptionist') {
      showNotification('No tienes permiso para registrar nuevos médicos', 'error');
      return;
    }

    // Validar permisos para editar: doctor solo puede editar su propio perfil
    if (state.editingId) {
      const canEditThis = role === 'admin' || role === 'receptionist' ||
        (role === 'doctor' && user?.doctorId === state.editingId);
      if (!canEditThis) {
        showNotification('No tienes permiso para editar este perfil médico', 'error');
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
        await updateDoctor(state.editingId, formData);

        // Actualizar usuario asociado
        const userAccount = store.get('users').find(u => u.doctorId === state.editingId);
        if (userAccount) {
          const userUpdates = {};

          if (formData.username && formData.username !== userAccount.username) {
            userUpdates.username = formData.username;
          }

          if (formData.password) {
            userUpdates.password = formData.password;
          }

          if (formData.name !== userAccount.name) userUpdates.name = formData.name;
          if (formData.email !== userAccount.email) userUpdates.email = formData.email;
          if (formData.isActive !== userAccount.isActive) userUpdates.isActive = formData.isActive;

          if (Object.keys(userUpdates).length > 0) {
            store.update('users', userAccount.id, userUpdates);
          }
        }

        Logger.log(store, user, {
          action: Logger.Actions.UPDATE,
          module: Logger.Modules.DOCTORS,
          description: `Médico actualizado: ${formData.name}`,
          details: { doctorId: state.editingId, ...formData }
        });
        showNotification('Médico actualizado correctamente', 'success');
      } else {
        const result = await createDoctor(formData);

        // Crear usuario asociado
        const username = formData.username || formData.email.split('@')[0];
        const password = formData.password || 'demo123';

        store.add('users', {
          username: username,
          password: password,
          name: formData.name,
          role: 'doctor',
          email: formData.email,
          doctorId: result.id,
          isActive: true
        });

        Logger.log(store, user, {
          action: Logger.Actions.CREATE,
          module: Logger.Modules.DOCTORS,
          description: `Médico registrado con usuario: ${formData.name}`,
          details: { doctorId: result.id, ...formData }
        });
        showNotification('Médico y usuario registrados correctamente', 'success');
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
      Logger.log(store, user, {
        action: Logger.Actions.UPDATE,
        module: Logger.Modules.DOCTORS,
        description: `Estado de médico actualizado: ${state.currentDoctor.name} -> ${newStatus}`,
        details: { doctorId: state.currentDoctor.id, ...updateData }
      });
      showNotification('Estado actualizado correctamente', 'success');

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

    if (newCapacity < stats.todayAppointments) {
      const confirmed = await hospitalConfirm(
        `¡Atención! El médico ya tiene ${stats.todayAppointments} citas programadas para hoy. ` +
        `Reducir la capacidad a ${newCapacity} podría causar problemas. ¿Desea continuar?`,
        'warning'
      );

      if (!confirmed) return;
    }

    try {
      await updateDoctor(state.currentDoctor.id, {
        dailyCapacity: newCapacity,
        capacityReason: reason || null,
        capacityChangedBy: user?.id || 'system',
        capacityChangedAt: new Date().toISOString()
      });

      Logger.log(store, user, {
        action: Logger.Actions.UPDATE,
        module: Logger.Modules.DOCTORS,
        description: `Capacidad de médico ajustada: ${state.currentDoctor.name} -> ${newCapacity}`,
        details: {
          doctorId: state.currentDoctor.id,
          oldCapacity: state.currentDoctor.dailyCapacity,
          newCapacity,
          reason
        }
      });

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

    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-doctor-modal';
    modalContainer.className = 'modal-overlay';

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 850px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h3>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">PERFIL DEL PROFESIONAL MÉDICO</div>
          </div>
          <button class="close-modal btn-circle" id="close-view-doctor-modal" style="background: rgba(255,255,255,0.2); border: none; color: white;">
            &times;
          </button>
        </div>
        
        <div class="modal-body" style="padding: 2rem; max-height: 70vh; overflow-y: auto;">
          <!-- Encabezado de Perfil -->
          <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2.5rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
            <div style="width: 100px; height: 100px; background: var(--card-doctor); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); position: relative; color: var(--modal-header);">
              ${icons.doctor}
            </div>
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--modal-header); letter-spacing: 0.1em; margin-bottom: 0.5rem;">CUALIFICACIÓN PROFESIONAL</div>
              <h3 style="margin: 0; font-size: 1.75rem; color: #1a202c; font-weight: 800;">${doctor.name}</h3>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge" style="background: var(--modal-header); color: white; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700;">${doctor.specialty}</span>
                <span style="color: #4a5568; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                  ${icons.area} ${area?.name || 'Área General'}
                </span>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge ${doctor.isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                  ${doctor.isActive ? icons.successCheck : icons.warning}
                  ${doctor.isActive ? 'Activo' : 'Inactivo'}
                  ${doctor.status === 'vacation' ? ' (Vacaciones)' : doctor.status === 'license' ? ' (Licencia)' : ''}
                </span>
                <span class="badge badge-info" style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                  ${icons.capacity} Capacidad: ${doctor.dailyCapacity || 20}/día
                </span>
              </div>
            </div>
          </div>

          <!-- Información Dividida -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
            <!-- Ficha Técnica -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-header);">
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 1rem; letter-spacing: 0.05em;">
                ${icons.clipboard} IDENTIFICACIÓN Y LICENCIA
              </div>
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
                <div style="font-size: 0.9rem; color: #475569;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.15rem;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${doctor.phone || 'N/A'} • <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.15rem;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> ${doctor.email || 'N/A'}</div>
              </div>
            </div>

            <!-- Horario y Disponibilidad -->
            <div style="background: var(--modal-section-forest-light); border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--modal-section-forest);">
              <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 800; color: var(--modal-section-forest); margin-bottom: 1rem; letter-spacing: 0.05em;">
                ${icons.calendar} HORARIO Y DISPONIBILIDAD
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div style="font-weight: 800; font-size: 1.25rem; color: #1a202c;">
                  ${doctor.scheduleStart || (doctor.workStartHour !== undefined ? `${doctor.workStartHour}:00` : '08:00')} - 
                  ${doctor.scheduleEnd || (doctor.workEndHour !== undefined ? `${doctor.workEndHour}:00` : '17:00')}
                </div>
                <div style="font-size: 0.9rem; color: #2d3748; font-weight: 600;">
                   ${doctor.workDays && doctor.workDays.length > 0
        ? doctor.workDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
        : (typeof doctor.schedule === 'string' ? doctor.schedule : 'Lunes a Viernes')}
                </div>
                <div style="font-size: 0.85rem; color: #4a5568; display: flex; align-items: center; gap: 0.25rem;">
                  ${icons.schedule} <span style="font-weight: 700;">${doctor.consultationDuration || 30} min</span> por consulta
                </div>
                <div style="font-size: 0.85rem; color: #4a5568; display: flex; align-items: center; gap: 0.25rem;">
                  ${icons.capacity} <span style="font-weight: 700;">${doctor.dailyCapacity || 20} pacientes</span> máximo por día
                </div>
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
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 800; color: var(--modal-header); margin-bottom: 1rem;">
              ${icons.calendar} AGENDA DE LOS PRÓXIMOS DÍAS
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
                    ${appointments.slice(0, 5).map(app => {
          const patient = store.find('patients', app.patientId);
          return `
                      <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 1rem;">
                           <div style="font-weight: 700;">${new Date(app.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                           <div style="font-size: 0.75rem; color: #666;">${new Date(app.dateTime).toLocaleDateString()}</div>
                        </td>
                        <td style="padding: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                          ${icons.patient}
                          ${patient?.name || 'N/A'}
                        </td>
                        <td style="padding: 1rem; color: #666;">${app.reason || 'Consulta'}</td>
                        <td style="padding: 1rem;">
                          <span class="badge ${app.status === 'confirmed' ? 'badge-warning' : 'badge-info'}" style="font-size: 0.7rem;">${app.status.toUpperCase()}</span>
                        </td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>
            ` : '<div style="background: #f8fafc; padding: 2.5rem; border-radius: 8px; text-align: center; color: #64748b; font-style: italic;">No hay citas registradas en la agenda próxima</div>'}
          </div>
        </div>
        
        <div class="modal-footer">
          ${(role === 'admin' || role === 'receptionist' || (role === 'doctor' && user?.doctorId === doctor.id)) ? `
            <button class="btn-circle btn-circle-edit" id="edit-doctor-btn" data-id="${doctor.id}" title="Editar Perfil">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-circle btn-circle-status" id="view-schedule-btn" data-id="${doctor.id}" title="Ver Agenda">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>
          ` : ''}
          ${canEditStatus ? `
            <button class="btn-circle btn-circle-cancel" id="change-status-btn" data-id="${doctor.id}" title="Cambiar Estado">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <button class="btn-circle btn-circle-save" id="adjust-capacity-btn" data-id="${doctor.id}" title="Ajustar Capacidad">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            </button>
          ` : ''}
          <button class="btn-circle" id="close-modal-btn" title="Cerrar" style="background-color: #64748b;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const closeModalHandler = () => {
      if (modalContainer.parentNode) {
        modalContainer.parentNode.removeChild(modalContainer);
      }
    };

    const closeBtn1 = modalContainer.querySelector('#close-view-doctor-modal');
    const closeBtn2 = modalContainer.querySelector('#close-modal-btn');
    if (closeBtn1) closeBtn1.addEventListener('click', closeModalHandler);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModalHandler);

    const editBtn = modalContainer.querySelector('#edit-doctor-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        closeModalHandler();
        editDoctor(doctor);
      });
    }

    const scheduleBtn = modalContainer.querySelector('#view-schedule-btn');
    if (scheduleBtn) {
      scheduleBtn.addEventListener('click', () => {
        closeModalHandler();
        viewSchedule(doctor);
      });
    }

    const statusBtn = modalContainer.querySelector('#change-status-btn');
    if (statusBtn) {
      statusBtn.addEventListener('click', () => {
        closeModalHandler();
        openStatusModal(doctor);
      });
    }

    const capacityBtn = modalContainer.querySelector('#adjust-capacity-btn');
    if (capacityBtn) {
      capacityBtn.addEventListener('click', () => {
        closeModalHandler();
        openCapacityModal(doctor);
      });
    }

    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) {
        closeModalHandler();
      }
    });

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
    localStorage.setItem('appointment_doctor_filter', doctor.id);

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
      display: flex;
      align-items: center;
      gap: 0.75rem;
    `;

    const icon = type === 'success' ? icons.successCheck :
      type === 'error' ? icons.warning :
        type === 'warning' ? icons.warning : icons.info;

    notification.innerHTML = `${icon} ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Inicializar módulo
  const moduleInstance = init();

  // Retornar API pública
  return {
    refresh: loadDoctors,

    destroy() {
      if (moduleInstance && typeof moduleInstance.destroy === 'function') {
        moduleInstance.destroy();
      }
    }
  };
}