import { Logger } from '../utils/logger.js';

/**
 * Módulo de Citas Médicas - Gestión completa
 */

// SVG iconos ejecutivos
const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="2.25" y="3.75" width="15.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6 1.75v3.5M14 1.75v3.5"/><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M2 7.5h16"/></svg>`,

  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="4.25" y="3.75" width="11.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/><rect x="6.75" y="2" width="6.5" height="3.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/></svg>`,

  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,

  doctor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3.5 18c0-3.037 2.486-5.5 6.5-5.5s6.5 2.463 6.5 5.5"/></svg>`,

  patient: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,

  area: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" fill="none" viewBox="0 0 20 20"><rect x="2.25" y="4.25" width="15.5" height="10.5" rx="1.75" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6.5 15.75V17a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-1.25"/></svg>`,

  successCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M6 10.5l2.5 2 5-5"/></svg>`,

  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M10 3v8"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/></svg>`,

  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M10 7v5"/><circle cx="10" cy="14" r="1" fill="currentColor"/></svg>`,

  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M14.5 2.5l3 3L6 17H3v-3L14.5 2.5z"/></svg>`,

  cancel: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M7 7l6 6M13 7l-6 6"/></svg>`,

  view: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M2 10s2.5-6 8-6 8 6 8 6-2.5 6-8 6-8-6-8-6z"/></svg>`,

  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M10 4v6l3 3"/></svg>`,

  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M4 10h12M10 4v12"/></svg>`,

  close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M5 5l10 10M15 5L5 15"/></svg>`,

  conflict: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M10 6v5"/><circle cx="10" cy="13" r="1" fill="currentColor"/></svg>`,

  clinical: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="3.25" y="2.75" width="13.5" height="14.5" rx="1.75" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6.5 6h7M6.5 10h7M6.5 14h4"/></svg>`,

  video: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="1.5" y="4.5" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M13 8l5-3v10l-5-3z"/></svg>`,

  link: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M8 12l4-4"/><path stroke="currentColor" stroke-width="1.5" d="M6.5 13.5a2.83 2.83 0 004 0l1-1a2.83 2.83 0 000-4l-.5-.5M13.5 6.5a2.83 2.83 0 00-4 0l-1 1a2.83 2.83 0 000 4l.5.5"/></svg>`,

  resource: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="5.5" width="15" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6 5.5V4a2 2 0 012-2h4a2 2 0 012 2v1.5"/><path stroke="currentColor" stroke-width="1.5" d="M10 9v4M8 11h4"/></svg>`,

  hospital: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M10 5v4M8 7h4"/><path stroke="currentColor" stroke-width="1.5" d="M7 14h2v4H7zM11 14h2v4h-2z"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M13 13l4 4"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M3 4a2 2 0 012-2h2.28a1 1 0 01.95.68l1.05 3.15a1 1 0 01-.24 1L7.54 8.32a12 12 0 004.14 4.14l1.5-1.5a1 1 0 011-.24l3.15 1.05a1 1 0 01.68.95V15a2 2 0 01-2 2h-1A13 13 0 013 5V4z"/></svg>`
};

export default function mountAppointments(root, { bus, store, user, role }) {
  const state = {
    appointments: [],
    filters: {
      search: ''
    },
    editingId: null,
    isLoading: false,
    showModal: false,
    currentView: 'calendar',
    calendarDate: new Date()
  };

  // Elementos DOM
  let elements = {};

  // Inicializar
  function init() {
    render();
    setupEventListeners();
    loadAppointments();

    const unsubscribe = store.subscribe('appointments', () => {
      loadAppointments();
    });

    return unsubscribe;
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Cargar citas
  function loadAppointments() {
    let appointments = store.get('appointments');

    appointments = applyFilters(appointments);
    appointments = filterByRole(appointments);

    appointments.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    state.appointments = appointments;
    renderAppointmentsList();
    renderCalendar();
    updateStats();
  }

  function applyFilters(appointments) {
    let filtered = appointments;

    // Filtro por búsqueda global
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filtered = filtered.filter(appointment => {
        const patient = store.find('patients', appointment.patientId);
        const doctor = store.find('doctors', appointment.doctorId);
        const area = store.find('areas', appointment.areaId);

        const statusMap = {
          'scheduled': 'programada',
          'confirmed': 'confirmada',
          'completed': 'completada',
          'cancelled': 'cancelada'
        };

        const appointmentDate = new Date(appointment.dateTime).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });

        const searchFields = [
          patient?.name,
          patient?.dni,
          doctor?.name,
          area?.name,
          appointment.status,
          statusMap[appointment.status],
          appointmentDate,
          appointment.reason,
          appointment.modality
        ].filter(Boolean).join(' ').toLowerCase();

        return searchFields.includes(searchTerm);
      });
    }

    // Filtros específicos adicionales
    if (state.filters.doctorId) {
      filtered = filtered.filter(a => a.doctorId === state.filters.doctorId);
    }
    if (state.filters.areaId) {
      filtered = filtered.filter(a => a.areaId === state.filters.areaId);
    }
    if (state.filters.status) {
      filtered = filtered.filter(a => a.status === state.filters.status);
    }

    return filtered;
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

  function getDoctorAppointmentsForDate(doctorId, date) {
    const appointments = store.get('appointments');
    // date es "YYYY-MM-DD"
    return appointments.filter(appointment => {
      if (appointment.doctorId !== doctorId) return false;
      if (appointment.status === 'cancelled') return false;

      // Convertir a objeto Date para mayor seguridad
      const aptDate = new Date(appointment.dateTime);
      const year = aptDate.getFullYear();
      const month = String(aptDate.getMonth() + 1).padStart(2, '0');
      const day = String(aptDate.getDate()).padStart(2, '0');
      const appointmentDatePart = `${year}-${month}-${day}`;

      return appointmentDatePart === date;
    });
  }

  function isDoctorWorkingAt(doctor, dateStr, timeStr = null, duration = 0) {
    if (doctor.isActive === false || doctor.status === 'vacation' || doctor.status === 'license') return false;

    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayIndex = dateObj.getDay();
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

    // Fallback absoluto solo si no tiene NADA definido
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

  function hasDoctorAvailability(doctorId, date, excludeAppointmentId = null) {
    const doctor = store.find('doctors', doctorId);
    if (!doctor) return false;

    if (!isDoctorWorkingAt(doctor, date)) return false;

    const dailyCapacity = doctor.dailyCapacity || 20;
    const appointments = getDoctorAppointmentsForDate(doctorId, date);

    const relevantAppointments = excludeAppointmentId
      ? appointments.filter(a => a.id !== excludeAppointmentId)
      : appointments;

    return relevantAppointments.length < dailyCapacity;
  }

  function getDoctorRemainingAvailability(doctorId, date, excludeAppointmentId = null) {
    const doctor = store.find('doctors', doctorId);
    if (!doctor) return 0;

    const dailyCapacity = doctor.dailyCapacity || 20;
    const appointments = getDoctorAppointmentsForDate(doctorId, date);

    const relevantAppointments = excludeAppointmentId
      ? appointments.filter(a => a.id !== excludeAppointmentId)
      : appointments;

    return Math.max(0, dailyCapacity - relevantAppointments.length);
  }

  function isDoctorFullyBooked(doctorId, date, excludeAppointmentId = null) {
    return !hasDoctorAvailability(doctorId, date, excludeAppointmentId);
  }

  function getAvailableDoctorsForDate(date, areaId = null, excludeAppointmentId = null, time = null, duration = 30) {
    const doctors = store.get('doctors');

    let filteredDoctors = doctors;
    if (areaId) {
      filteredDoctors = doctors.filter(d => d.areaId === areaId || (d.otherAreas && d.otherAreas.includes(areaId)));
    }

    return filteredDoctors.filter(doctor => {
      // 1. Verificar si el médico trabaja ese día (independiente de la hora)
      if (!isDoctorWorkingAt(doctor, date)) return false;

      // 2. Disponibilidad general por cupos diarios
      if (!hasDoctorAvailability(doctor.id, date, excludeAppointmentId)) return false;

      // 3. Si hay una hora específica, verificar horario y conflictos
      if (time) {
        if (!isDoctorWorkingAt(doctor, date, time, duration)) return false;
        if (hasScheduleConflict(doctor.id, date, time, duration, excludeAppointmentId)) return false;
      }

      return true;
    });
  }

  function hasScheduleConflict(doctorId, date, time, duration, excludeAppointmentId = null) {
    const appointments = store.get('appointments');

    const newAppointmentStart = new Date(`${date}T${time}`);
    const newAppointmentEnd = new Date(newAppointmentStart.getTime() + (duration * 60000));

    return appointments.some(appointment => {
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) return false;
      if (appointment.doctorId !== doctorId) return false;
      if (appointment.status === 'cancelled') return false;

      const aptDate = new Date(appointment.dateTime);
      const isSameDay = aptDate.getFullYear() === newAppointmentStart.getFullYear() &&
        aptDate.getMonth() === newAppointmentStart.getMonth() &&
        aptDate.getDate() === newAppointmentStart.getDate();

      if (!isSameDay) return false;

      const existingStart = new Date(appointment.dateTime);
      const existingEnd = new Date(existingStart.getTime() + (appointment.duration * 60000));

      return (
        (newAppointmentStart >= existingStart && newAppointmentStart < existingEnd) ||
        (newAppointmentEnd > existingStart && newAppointmentEnd <= existingEnd) ||
        (newAppointmentStart <= existingStart && newAppointmentEnd >= existingEnd)
      );
    });
  }

  function getAvailableTimeSlots(doctorId, date, duration = 30, excludeAppointmentId = null) {
    const doctor = store.find('doctors', doctorId);
    if (!doctor) return [];

    const dateObj = new Date(date + 'T12:00:00');
    const dayIndex = dateObj.getDay();
    const englishDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayEn = englishDays[dayIndex];

    const timeToMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    let workStartMin = timeToMin(doctor.scheduleStart || (doctor.workStartHour !== undefined ? `${doctor.workStartHour.toString().padStart(2, '0')}:00` : '08:00'));
    let workEndMin = timeToMin(doctor.scheduleEnd || (doctor.workEndHour !== undefined ? `${doctor.workEndHour.toString().padStart(2, '0')}:00` : '18:00'));
    let worksThatDay = false;

    // 1. Objeto schedule
    if (doctor.schedule && typeof doctor.schedule === 'object') {
      const scheduleKeys = Object.keys(doctor.schedule).reduce((acc, key) => { acc[key.toLowerCase()] = doctor.schedule[key]; return acc; }, {});

      if (scheduleKeys[dayEn] && scheduleKeys[dayEn].start && scheduleKeys[dayEn].end) {
        worksThatDay = true;
        workStartMin = timeToMin(scheduleKeys[dayEn].start);
        workEndMin = timeToMin(scheduleKeys[dayEn].end);
      }
    }

    // 2. Array workDays
    if (!worksThatDay && doctor.workDays && Array.isArray(doctor.workDays) && doctor.workDays.length > 0) {
      const workDays = doctor.workDays.map(d => d.toLowerCase());
      const spanishDays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      const dayEs = spanishDays[dayIndex];
      const normalizedDayEs = dayEs.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (workDays.includes(dayEs.toLowerCase()) || workDays.includes(normalizedDayEs)) worksThatDay = true;
    }

    // 3. String schedule
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

    // Fallback absoluto solo si no tiene NADA definido
    if (!worksThatDay && !doctor.workDays && !doctor.schedule) {
      if (dayIndex >= 1 && dayIndex <= 5) worksThatDay = true;
    }

    if (!worksThatDay) return [];

    const existingAppointments = getDoctorAppointmentsForDate(doctorId, date)
      .filter(a => !excludeAppointmentId || a.id !== excludeAppointmentId);

    const slots = [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const isToday = (date === todayStr);
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

    let currentMin = workStartMin;
    const slotStep = 30; // Intervalos de 30 minutos para mayor flexibilidad

    while (currentMin + duration <= workEndMin) {
      // Si es hoy, solo permitir slots en el futuro (margen de 15 min)
      if (isToday && currentMin < currentMinutesNow + 15) {
        currentMin += slotStep;
        continue;
      }

      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      const timeEndMin = currentMin + duration;

      const hasConflict = existingAppointments.some(appointment => {
        const aptStart = new Date(appointment.dateTime);
        const aptStartMin = aptStart.getHours() * 60 + aptStart.getMinutes();
        const aptEndMin = aptStartMin + (appointment.duration || 30);

        return (
          (currentMin >= aptStartMin && currentMin < aptEndMin) ||
          (timeEndMin > aptStartMin && timeEndMin <= aptEndMin) ||
          (currentMin <= aptStartMin && timeEndMin >= aptEndMin)
        );
      });

      if (!hasConflict) slots.push(timeStr);
      currentMin += slotStep;
    }

    return slots;
  }

  // ========== FUNCIONES DE DISPONIBILIDAD DE RECURSOS ==========

  function isResourceAvailableAt(collection, resourceId, date, time, duration, excludeAppointmentId = null) {
    const appointments = store.get('appointments');
    const newStart = new Date(`${date}T${time}`);
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    return !appointments.some(apt => {
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;
      if (apt.status === 'cancelled') return false;

      let usesResource = false;
      if (collection === 'consultorios' && apt.consultorioId === resourceId) usesResource = true;
      if (collection === 'equiposMedicos' && apt.equipmentIds && apt.equipmentIds.includes(resourceId)) usesResource = true;

      if (!usesResource) return false;

      const aptDate = new Date(apt.dateTime);
      if (aptDate.toDateString() !== newStart.toDateString()) return false;

      const aptEnd = new Date(aptDate.getTime() + (apt.duration || 30) * 60000);

      return (newStart >= aptDate && newStart < aptEnd) ||
        (newEnd > aptDate && newEnd <= aptEnd) ||
        (newStart <= aptDate && newEnd >= aptEnd);
    });
  }

  function getAvailableRoomsForSlot(date, time, duration, excludeAppointmentId = null) {
    const rooms = store.get('consultorios') || [];
    return rooms.filter(room => {
      if (room.status === 'maintenance' || room.status === 'mantenimiento') return false;
      return isResourceAvailableAt('consultorios', room.id, date, time, duration, excludeAppointmentId);
    });
  }

  function getAvailableEquipmentForSlot(date, time, duration, excludeAppointmentId = null) {
    const equipment = store.get('equiposMedicos') || [];
    return equipment.filter(eq => {
      if (eq.status === 'maintenance' || eq.status === 'mantenimiento') return false;
      return isResourceAvailableAt('equiposMedicos', eq.id, date, time, duration, excludeAppointmentId);
    });
  }

  function updateAvailableResources() {
    const date = elements.formDate ? elements.formDate.value : null;
    const time = elements.formTime ? elements.formTime.value : null;
    const duration = elements.formDuration ? parseInt(elements.formDuration.value) : 30;
    const modality = elements.formModality ? elements.formModality.value : 'presencial';

    if (!date || !time) {
      if (elements.consultorioInfo) elements.consultorioInfo.textContent = 'Seleccione fecha y hora para ver disponibilidad';
      if (elements.equipmentInfo) elements.equipmentInfo.textContent = 'Seleccione fecha y hora para ver disponibilidad';
      return;
    }

    // Actualizar consultorios
    if (elements.formConsultorio) {
      if (modality === 'virtual') {
        elements.formConsultorio.innerHTML = '<option value="">No requiere consultorio (cita virtual)</option>';
        elements.formConsultorio.disabled = true;
        if (elements.consultorioInfo) elements.consultorioInfo.innerHTML = '<span style="color: #7c3aed; font-weight: 600;">Las citas virtuales no requieren consultorio físico</span>';
      } else {
        elements.formConsultorio.disabled = false;
        const availableRooms = getAvailableRoomsForSlot(date, time, duration, state.editingId);
        if (availableRooms.length > 0) {
          const options = availableRooms.map(r => `<option value="${r.id}">${r.name} - ${r.area} (Piso ${r.floor})</option>`).join('');
          elements.formConsultorio.innerHTML = `<option value="">Sin consultorio asignado</option>${options}`;
          if (elements.consultorioInfo) elements.consultorioInfo.innerHTML = `<span class="available-slot">${icons.successCheck} ${availableRooms.length} consultorio(s) disponible(s)</span>`;
        } else {
          elements.formConsultorio.innerHTML = '<option value="">No hay consultorios disponibles</option>';
          if (elements.consultorioInfo) elements.consultorioInfo.innerHTML = `<span class="no-slots">${icons.warning} Todos los consultorios están ocupados en este horario</span>`;
        }
      }
    }

    // Actualizar equipamiento
    if (elements.formEquipment) {
      const availableEquipment = getAvailableEquipmentForSlot(date, time, duration, state.editingId);
      if (availableEquipment.length > 0) {
        const options = availableEquipment.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        elements.formEquipment.innerHTML = options;
        if (elements.equipmentInfo) elements.equipmentInfo.innerHTML = `<span class="available-slot">${icons.successCheck} Equipos disponibles en este horario</span><br><small>Ctrl+clic para selección múltiple</small>`;
      } else {
        elements.formEquipment.innerHTML = '<option value="" disabled>No hay equipos disponibles</option>';
        if (elements.equipmentInfo) elements.equipmentInfo.innerHTML = `<span class="no-slots">${icons.warning} No hay equipos disponibles</span>`;
      }
    }

    // Insumos de laboratorio: Verificar stock global
    if (elements.formSupplies) {
      const supplies = store.get('suministros') || [];
      const availableSupplies = supplies.filter(s => (s.stock || 0) > 0);
      if (availableSupplies.length === 0) {
        if (elements.suppliesInfo) elements.suppliesInfo.innerHTML = `<span class="no-slots">${icons.warning} No hay insumos de laboratorio en stock</span>`;
      } else {
        if (elements.suppliesInfo) elements.suppliesInfo.innerHTML = `Seleccione los insumos que se consumirán en esta cita`;
      }
    }
  }

  // ========== FIN FUNCIONES DE CAPACIDAD Y DISPONIBILIDAD ==========

  // Renderizar componente principal
  function render() {
    // Se agrega el rol 'nurse' a la lista de roles que pueden crear citas
    const canCreate = ['admin', 'patient', 'doctor', 'receptionist', 'nurse'].includes(role);

    root.innerHTML = `
      <div class="module-appointments">
        <!-- Estadísticas -->
        <div class="stats-auto-grid mb-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Barra de Búsqueda + Botón -->
        <div class="card" style="padding: 0.75rem 1rem; margin-bottom: 1rem;">
          <div class="flex justify-between items-center">
            ${canCreate ? `
              <button class="btn btn-primary" id="btn-new-appointment">
                ${icons.plus} Nueva Cita
              </button>
            ` : '<div></div>'}
            <div class="search-input-wrapper" style="position: relative; width: 450px;">
              <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
                ${icons.search}
              </span>
              <input type="text" class="input" id="filter-search" 
                     placeholder="Buscar por paciente, médico, área, estado, fecha o motivo..." 
                     style="padding-left: 2.8rem; border-radius: 20px; background: rgba(0,0,0,0.05); border: 1px solid transparent; transition: all 0.3s; height: 40px; width: 100%;"
                     value="${state.filters.search}">
            </div>
          </div>
          
          <div class="flex justify-between items-center mt-3">
            <div class="view-toggle">
              <button class="view-toggle-btn ${state.currentView === 'calendar' ? 'active' : ''}" id="btn-view-calendar">
                ${icons.calendar} Calendario
              </button>
              <button class="view-toggle-btn ${state.currentView === 'list' ? 'active' : ''}" id="btn-view-list">
                ${icons.clipboard} Lista
              </button>
            </div>
            <div class="text-muted text-sm" id="view-description">
              ${state.currentView === 'calendar' ? 'Vista mensual de citas' : 'Lista detallada de todas las citas'}
            </div>
          </div>
        </div>

        <!-- Vista de Calendario -->
        <div id="calendar-container" class="${state.currentView === 'calendar' ? '' : 'hidden'} mb-4"></div>

        <!-- Vista de Lista -->
        <div id="list-container" class="${state.currentView === 'list' ? '' : 'hidden'}">
          <div class="card">
            <div class="card-header">
              <h3 style="margin: 0;">Citas programadas</h3>
              <div class="text-muted" id="appointments-count">Cargando...</div>
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
                <tbody id="appointments-list"></tbody>
              </table>
            </div>
            
            <div id="empty-state" class="hidden">
              <div class="text-center" style="padding: 3rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">${icons.calendar}</div>
                <h3>No hay citas</h3>
                <p class="text-muted">No se encontraron citas con los filtros aplicados</p>
                ${canCreate ? `
                  <button class="btn btn-primary mt-3" id="btn-create-first">
                    ${icons.plus} Crear primera cita
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para nueva/editar cita -->
      <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="appointment-modal">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h3>
              <div id="modal-subtitle" style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">
                REGISTRO DE CITA MÉDICA
              </div>
            </div>
            <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-appointment-modal">&times;</button>
          </div>
          
          <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 65vh; overflow-y: auto;">
            <form id="appointment-form">
              <!-- Información básica -->
              <div style="margin-bottom: 2rem;">
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                  <span style="opacity: 0.7;">${icons.clipboard}</span> INFORMACIÓN DE LA CITA
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">PACIENTE (BUSCAR POR CÉDULA) *</label>
                    <div style="display: flex; gap: 0;">
                      <select class="input" id="form-patient-doc-type" style="width: 70px; border-radius: 4px 0 0 4px; border-right: none; background: #fff; height: 38px;">
                        <option value="V">V</option>
                        <option value="E">E</option>
                        <option value="J">J</option>
                        <option value="P">P</option>
                      </select>
                      <input type="text" class="input" id="form-patient-cedula" placeholder="Ingrese número de cédula..." style="flex: 1; border-radius: 0 4px 4px 0; height: 38px;" autocomplete="off">
                    </div>
                    <input type="hidden" id="form-patient" value="">
                    <div id="patient-search-feedback" class="hidden"></div>
                    
                    <!-- Campo Unificado para Nombre de Paciente (Registrado o Nuevo) -->
                    <div id="patient-name-group" class="hidden" style="margin-top: 1rem; animation: fadeIn 0.3s ease;">
                      <label class="form-label" id="patient-name-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.8rem;">NOMBRE DEL PACIENTE *</label>
                      <div style="position: relative; display: flex; align-items: center;">
                        <input type="text" class="input" id="form-patient-name-display" placeholder="Nombre completo..." style="height: 38px; padding-right: 40px; flex: 1;">
                        <div id="patient-status-icon-container" style="position: absolute; right: 10px; display: flex; align-items: center; justify-content: center; pointer-events: none;"></div>
                      </div>
                      <div id="patient-helper-text" style="font-size: 0.7rem; color: #64748b; margin-top: 0.35rem; display: flex; align-items: center; gap: 0.35rem;"></div>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MÉDICO *</label>
                    <select class="input" id="form-doctor" required style="border-color: var(--neutralTertiary); background: var(--white);">
                      <option value="">Seleccionar médico</option>
                    </select>
                  </div>
                </div>
                
                <div id="no-doctors-message" class="hidden" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 1rem; margin-top: 1rem; color: #856404;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="opacity: 0.7;">${icons.warning}</span>
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
                  <select class="input" id="form-area" required style="border-color: var(--neutralTertiary); background: var(--white);">
                    <option value="">Seleccionar área</option>
                  </select>
                </div>
              </div>

              <!-- Modalidad de atención -->
              <div style="margin-bottom: 2rem;" id="modality-section">
                <div style="font-size: 0.9rem; font-weight: 700; color: #7c3aed; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                  <span style="opacity: 0.7;">${icons.video}</span> MODALIDAD DE ATENCIÓN
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MODALIDAD *</label>
                    <select class="input" id="form-modality" required style="border-color: var(--neutralTertiary); background: var(--white);">
                      <option value="presencial">Presencial</option>
                      <option value="virtual">Virtual / Telemedicina</option>
                    </select>
                  </div>
                  
                  <div class="form-group" id="virtual-link-group" style="display: none;">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ENLACE DE REUNIÓN</label>
                    <input type="url" class="input" id="form-virtual-link" placeholder="https://meet.example.com/..." style="border-color: var(--neutralTertiary); background: var(--white);">
                    <div class="text-xs text-muted mt-1" id="virtual-link-info">
                      Se generará automáticamente o ingrese uno manualmente
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Fecha y Hora -->
              <div style="margin-bottom: 2rem;" id="date-time-section">
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                  <span style="opacity: 0.7;">${icons.calendar}</span> FECHA Y HORA DE LA CITA
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA *</label>
                    <input type="date" class="input" id="form-date" required style="border-color: var(--neutralTertiary); background: var(--white);">
                  </div>
                  
                  <div class="form-group" id="time-input-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">HORA *</label>
                    <select class="input" id="form-time" required style="border-color: var(--neutralTertiary); background: var(--white);">
                      <option value="">Seleccione médico y fecha</option>
                    </select>
                    <div class="text-xs text-muted mt-1" id="time-slot-info">
                      Seleccione un médico y fecha para ver horarios disponibles
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recursos Asociados -->
              <div style="margin-bottom: 2rem;" id="resources-section">
                <div style="font-size: 0.9rem; font-weight: 700; color: #2563eb; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                  <span style="opacity: 0.7;">${icons.resource}</span> RECURSOS ASOCIADOS
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <!-- Consultorio ocupando el ancho completo arriba -->
                  <div class="form-group" style="grid-column: span 2;">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CONSULTORIO</label>
                    <select class="input" id="form-consultorio" style="border-color: var(--neutralTertiary); background: var(--white);">
                      <option value="">Sin consultorio asignado</option>
                    </select>
                    <div class="text-xs text-muted mt-1" id="consultorio-info">
                      Seleccione fecha y hora para ver disponibilidad
                    </div>
                  </div>
                  
                  <!-- Equipamiento e Insumos lado a lado abajo -->
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">EQUIPAMIENTO MÉDICO</label>
                    <select class="input" id="form-equipment" style="border-color: var(--neutralTertiary); background: var(--white);">
                      <option value="">Ninguno / No requiere</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">INSUMOS / SUMINISTROS</label>
                    <select class="input" id="form-supplies" style="border-color: var(--neutralTertiary); background: var(--white);">
                      <option value="">Ninguno / No requiere</option>
                    </select>
                    <div class="text-xs text-muted mt-1" id="supplies-info">
                      Insumo a consumir en esta cita
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Duración y Estado -->
              <div style="margin-bottom: 2rem;">
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DURACIÓN *</label>
                    <select class="input" id="form-duration" required style="border-color: var(--neutralTertiary); background: var(--white);">
                      <option value="15">15 minutos</option>
                      <option value="30" selected>30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                    </select>
                  </div>
                  
                  ${state.editingId ? `
                    <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO</label>
                      <select class="input" id="form-status" style="border-color: var(--neutralTertiary); background: var(--white);">
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
                  <span style="opacity: 0.7;">${icons.clipboard}</span> INFORMACIÓN ADICIONAL
                </div>
                
                <div class="grid grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">MOTIVO DE LA CONSULTA</label>
                    <textarea class="input" id="form-reason" rows="3" placeholder="Describa el motivo de la consulta..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOTAS ADICIONALES</label>
                    <textarea class="input" id="form-notes" rows="3" placeholder="Notas importantes..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
                  </div>
                </div>
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn-circle btn-circle-cancel" id="btn-cancel" title="Cancelar">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button class="btn-circle btn-circle-save" id="btn-save" title="${state.editingId ? 'Actualizar Cita' : 'Registrar Cita'}" ${state.isLoading ? 'disabled' : ''}>
              ${state.isLoading ? '<span class="loading-spinner"></span>' : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'}
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
      filterSearch: root.querySelector('#filter-search'),
      modal: root.querySelector('#appointment-modal'),
      form: root.querySelector('#appointment-form'),
      formPatient: root.querySelector('#form-patient'),
      formPatientDocType: root.querySelector('#form-patient-doc-type'),
      formPatientCedula: root.querySelector('#form-patient-cedula'),
      patientSearchFeedback: root.querySelector('#patient-search-feedback'),
      patientNameGroup: root.querySelector('#patient-name-group'),
      formPatientNameDisplay: root.querySelector('#form-patient-name-display'),
      patientStatusIconContainer: root.querySelector('#patient-status-icon-container'),
      patientHelperText: root.querySelector('#patient-helper-text'),
      btnClearPatient: root.querySelector('#btn-clear-patient'),
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
      calendarContainer: root.querySelector('#calendar-container'),
      listContainer: root.querySelector('#list-container'),
      btnViewCalendar: root.querySelector('#btn-view-calendar'),
      btnViewList: root.querySelector('#btn-view-list'),
      viewDescription: root.querySelector('#view-description'),
      timeSlotInfo: root.querySelector('#time-slot-info'),
      availableTimes: root.querySelector('#available-times'),
      noDoctorsMessage: root.querySelector('#no-doctors-message'),
      dateTimeSection: root.querySelector('#date-time-section'),
      modalSubtitle: root.querySelector('#modal-subtitle'),
      formModality: root.querySelector('#form-modality'),
      formVirtualLink: root.querySelector('#form-virtual-link'),
      virtualLinkGroup: root.querySelector('#virtual-link-group'),
      virtualLinkInfo: root.querySelector('#virtual-link-info'),
      formConsultorio: root.querySelector('#form-consultorio'),
      formEquipment: root.querySelector('#form-equipment'),
      formSupplies: root.querySelector('#form-supplies'),
      consultorioInfo: root.querySelector('#consultorio-info'),
      equipmentInfo: root.querySelector('#equipment-info'),
      suppliesInfo: root.querySelector('#supplies-info'),
      resourcesSection: root.querySelector('#resources-section'),
      modalitySection: root.querySelector('#modality-section')
    };

    loadSelectData();
    checkExternalFilters();

    if (role === 'patient' && user?.patientId) {
      const patient = store.find('patients', user.patientId);
      if (patient) {
        if (elements.formPatientDocType) {
          elements.formPatientDocType.value = patient.docType || 'V';
          elements.formPatientDocType.disabled = true;
        }
        if (elements.formPatientCedula) {
          elements.formPatientCedula.value = patient.dni || '';
          elements.formPatientCedula.disabled = true;
        }
        if (elements.formPatient) elements.formPatient.value = patient.id;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    if (elements.formDate) elements.formDate.min = today;

    loadAppointments();
  }

  // Cargar datos en selects
  function loadSelectData() {
    if (elements.filterPatient) {
      const patients = store.get('patients');
      const options = patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
      elements.filterPatient.innerHTML = `<option value="">Todos los pacientes</option>${options}`;
    }

    // Ya no necesitamos cargar un <select> de pacientes, la búsqueda se hace por cédula

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

    if (elements.formArea) {
      const areas = store.get('areas');
      const options = areas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      elements.formArea.innerHTML = `<option value="">Seleccionar área</option>${options}`;
    }

    // Cargar consultorios disponibles
    if (elements.formConsultorio) {
      const rooms = store.get('consultorios') || [];
      const availableRooms = rooms.filter(r => r.status === 'available' || r.status === 'disponible');
      const options = availableRooms.map(r => `<option value="${r.id}">${r.name} - ${r.area} (Piso ${r.floor})</option>`).join('');
      elements.formConsultorio.innerHTML = `<option value="">Sin consultorio asignado</option>${options}`;
    }

    // Cargar equipamiento disponible
    if (elements.formEquipment) {
      const equipment = store.get('equiposMedicos') || [];
      const availableEquipment = equipment.filter(e => e.status === 'available' || e.status === 'disponible');
      const options = availableEquipment.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
      elements.formEquipment.innerHTML = `<option value="">Ninguno / No requiere</option>${options}`;
    }

    // Cargar suministros con stock
    if (elements.formSupplies) {
      const supplies = store.get('suministros') || [];
      const availableSupplies = supplies.filter(s => (s.stock || 0) > 0);
      const options = availableSupplies.map(s => `<option value="${s.id}">${s.name} (${s.stock} ${s.unit})</option>`).join('');
      elements.formSupplies.innerHTML = `<option value="">Sin insumos adicionales</option>${options}`;
    }
  }

  // Verificar filtros externos
  function checkExternalFilters() {
    const doctorFilter = localStorage.getItem('appointment_doctor_filter');
    if (doctorFilter) {
      state.filters.doctorId = doctorFilter;
      if (elements.filterDoctor) elements.filterDoctor.value = doctorFilter;
      localStorage.removeItem('appointment_doctor_filter');
    }

    // Soporte para crear cita desde el módulo de pacientes
    const formDataStr = localStorage.getItem('appointment_form_data');
    if (formDataStr) {
      try {
        const formData = JSON.parse(formDataStr);
        localStorage.removeItem('appointment_form_data');

        if (formData.patientId) {
          // Usar un pequeño delay para asegurar que el módulo se haya montado correctamente
          setTimeout(() => {
            openModal(null, {
              preselectedPatientId: formData.patientId,
              preselectedDoctorId: formData.doctorId || null
            });
          }, 200);
        }
      } catch (e) {
        console.error('Error parsing appointment_form_data:', e);
      }
    }
  }

  // Renderizar lista de citas
  function renderAppointmentsList() {
    if (!elements.appointmentsList) return;

    if (state.appointments.length === 0) {
      elements.emptyState.classList.remove('hidden');
      elements.appointmentsTable.classList.add('hidden');
      if (elements.appointmentsCount) elements.appointmentsCount.textContent = '0 citas';
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.appointmentsTable.classList.remove('hidden');
    if (elements.appointmentsCount) elements.appointmentsCount.textContent = `${state.appointments.length} ${state.appointments.length === 1 ? 'cita' : 'citas'}`;

    const canEditBase = role === 'admin' ||
      role === 'receptionist' ||
      role === 'nurse' ||
      (role === 'doctor' && user?.doctorId) ||
      (role === 'patient' && user?.patientId);

    const rows = state.appointments.map(appointment => {
      const patient = store.find('patients', appointment.patientId);
      const doctor = store.find('doctors', appointment.doctorId);
      const area = store.find('areas', appointment.areaId);

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

      const canEdit = canEditBase &&
        !(role === 'doctor' && user?.doctorId !== appointment.doctorId) &&
        !(role === 'patient' && user?.patientId !== appointment.patientId);

      const canCancel = canEdit && appointment.status !== 'completed' && appointment.status !== 'cancelled';

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
            <div class="text-xs text-muted">${icons.clock} ${timeStr}</div>
            ${appointment.modality === 'virtual' ? `<div class="text-xs" style="color: #7c3aed; font-weight: 600; display: flex; align-items: center; gap: 3px; margin-top: 2px;">${icons.video} Virtual</div>` : ''}
          </td>
          <td data-label="Duración">${appointment.duration} min</td>
          <td data-label="Estado">${getStatusBadge(appointment.status)}</td>
          <td data-label="Acciones">
            <div class="flex gap-2">
              ${canEdit ? `
                <button class="btn-circle btn-circle-edit" data-action="edit" data-id="${appointment.id}" title="Editar">
                  ${icons.edit}
                </button>
              ` : ''}
              ${canCancel ? `
                <button class="btn-circle btn-circle-cancel" data-action="cancel" data-id="${appointment.id}" title="Cancelar">
                  ${icons.cancel}
                </button>
              ` : ''}
              <button class="btn-circle btn-circle-status" data-action="view" data-id="${appointment.id}" title="Ver">
                ${icons.view}
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
      <div class="stat-info-card">
        <span class="stat-info-label">Total de citas</span>
        <span class="stat-info-value">${stats.total}</span>
        <span class="stat-info-sub">${icons.clipboard} Registradas</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Citas hoy</span>
        <span class="stat-info-value">${stats.today}</span>
        <span class="stat-info-sub">${icons.calendar} Sesiones para hoy</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Próximos 7 días</span>
        <span class="stat-info-value">${stats.upcoming}</span>
        <span class="stat-info-sub">${icons.clock} Pendientes</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Completadas</span>
        <span class="stat-info-value">${stats.completed}</span>
        <span class="stat-info-sub">${icons.successCheck} Atendidas</span>
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

    let icon = '';
    switch (status) {
      case 'completed': icon = icons.successCheck; break;
      case 'scheduled': icon = icons.info; break;
      case 'confirmed': icon = icons.warning; break;
      case 'cancelled': icon = icons.cancel; break;
    }

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

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const daysInMonth = lastDay.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    container.innerHTML = `
      <div class="calendar-view card">
        <div class="calendar-header">
          <div class="flex items-center gap-4">
            <h3 style="margin: 0; min-width: 150px;">${icons.calendar} ${capitalizedMonth} ${year}</h3>
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

    container.querySelectorAll('.calendar-appointment').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        const appointment = store.find('appointments', id);
        if (appointment) viewAppointment(appointment);
      };
    });

    const canCreate = ['admin', 'patient', 'doctor', 'receptionist', 'nurse'].includes(role);
    container.querySelectorAll('.calendar-day').forEach(el => {
      el.onclick = () => {
        const date = el.dataset.date;
        if (date) {
          if (el.classList.contains('day-past')) {
            showNotification('No se pueden agendar o modificar citas en fechas pasadas', 'warning');
            return;
          }
          showDaySchedule(date);
        }
      };
    });
  }

  function showDaySchedule(dateStr) {
    const appointments = store.get('appointments');
    const dayAppointments = appointments.filter(apt => {
      const d = new Date(apt.dateTime);
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const aptDateStr = `${d.getFullYear()}-${m}-${day}`;
      return aptDateStr === dateStr && apt.status !== 'cancelled';
    });

    const modalContainer = document.createElement('div');
    modalContainer.id = 'day-schedule-modal';
    modalContainer.className = 'modal-overlay';
    modalContainer.style.zIndex = '2500';

    const formattedDate = new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const dayIndex = new Date(dateStr + 'T12:00:00').getDay();
    const englishDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const spanishDays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const dayEn = englishDays[dayIndex];
    const dayEs = spanishDays[dayIndex];

    const activeDoctors = store.get('doctors').filter(d => d.isActive !== false);

    const doctorsWorkingToday = activeDoctors.filter(d => isDoctorWorkingAt(d, dateStr));


    // Determinar el rango de horas
    let minHour = 8;
    let maxHour = 18;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const isToday = (dateStr === todayStr);
    const currentHour = now.getHours();

    if (doctorsWorkingToday.length > 0) {
      const allStarts = doctorsWorkingToday.map(d => {
        if (d.schedule && d.schedule[dayEn]) return parseInt(d.schedule[dayEn].start.split(':')[0]);
        return parseInt((d.scheduleStart || '08:00').split(':')[0]);
      });
      const allEnds = doctorsWorkingToday.map(d => {
        if (d.schedule && d.schedule[dayEn]) return parseInt(d.schedule[dayEn].end.split(':')[0]);
        return parseInt((d.scheduleEnd || '17:00').split(':')[0]);
      });
      minHour = Math.min(...allStarts, 8);
      maxHour = Math.max(...allEnds, 18);
    }

    const timeSlots = [];
    for (let h = minHour; h <= maxHour; h++) {
      const timeStr = `${h.toString().padStart(2, '0')}:00`;
      const appointmentsAtHour = dayAppointments.filter(apt => {
        const d = new Date(apt.dateTime);
        return d.getHours() === h;
      });

      const doctorsAtThisHour = doctorsWorkingToday.filter(d => {
        if (!isDoctorWorkingAt(d, dateStr, timeStr)) return false;

        // Verificar si tiene citas que solapen con este slot (h:00)
        const slotStartMin = h * 60;
        const slotEndMin = slotStartMin + 60; // Slot de 1 hora en la vista de agenda

        const hasConflict = dayAppointments.some(apt => {
          if (apt.doctorId !== d.id || apt.status === 'cancelled') return false;
          const aptDate = new Date(apt.dateTime);
          const aptStartMin = aptDate.getHours() * 60 + aptDate.getMinutes();
          const aptEndMin = aptStartMin + (apt.duration || 30);

          return (aptStartMin < slotEndMin && aptEndMin > slotStartMin);
        });

        return !hasConflict;
      });


      const isWorkingHour = doctorsAtThisHour.length > 0;

      timeSlots.push({
        time: timeStr,
        appointments: appointmentsAtHour,
        isWorkingHour,
        availableDoctors: doctorsAtThisHour
      });
    }

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 550px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Agenda del Día</h3>
            <p style="margin: 0.25rem 0 0; opacity: 0.8; font-size: 0.875rem; font-weight: 500;">${formattedDate}</p>
          </div>
          <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="close-schedule">&times;</button>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem; max-height: 500px; overflow-y: auto;">
          <div class="schedule-grid" style="display: flex; flex-direction: column; gap: 1rem;">
            ${timeSlots.map(slot => {
      const isOccupied = slot.appointments.length > 0;
      const [sh, sm] = slot.time.split(':').map(Number);
      const slotIsPast = isToday && (sh < currentHour || (sh === currentHour && sm < now.getMinutes()));
      const isWorking = slot.isWorkingHour && !slotIsPast;

      let statusText = isOccupied
        ? (slot.appointments.length === 1 ? '1 Cita Programada' : `${slot.appointments.length} Citas Programadas`)
        : (isWorking ? 'Horario Disponible' : (slotIsPast ? 'Horario Pasado' : 'Fuera de Horario'));

      const statusColor = isOccupied ? '#dc2626' : (isWorking ? '#16a34a' : '#64748b');
      const background = isOccupied ? '#fef2f2' : (isWorking ? '#f0fdf4' : '#f1f5f9');
      const border = isOccupied ? '#fecaca' : (isWorking ? '#bbf7d0' : '#e2e8f0');
      const badgeBg = isOccupied ? '#fee2e2' : (isWorking ? '#dcfce7' : '#e2e8f0');
      const badgeText = isOccupied ? '#dc2626' : (isWorking ? '#16a34a' : '#475569');

      return `
                <div class="schedule-slot ${isOccupied ? 'occupied' : (isWorking ? 'available' : 'off-hours')}" 
                     data-time="${slot.time}" 
                     data-working="${isWorking}"
                     style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1rem; border-radius: 12px; border: 1px solid ${border}; background: ${background}; cursor: ${isWorking ? 'pointer' : 'not-allowed'}; transition: all 0.2s ease;">
                  
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <div style="background: ${badgeBg}; color: ${badgeText}; padding: 0.25rem 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.9rem;">
                        ${slot.time}
                      </div>
                      <span style="font-weight: 600; color: ${isOccupied ? '#991b1b' : (isWorking ? '#166534' : '#475569')};">
                        ${statusText}
                      </span>
                    </div>
                    ${(isWorking && !isOccupied) ? `<span style="font-size: 0.75rem; color: #15803d; font-weight: 500;">Agendar ${icons.plus}</span>` : ''}
                  </div>

                  ${isOccupied ? `
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; border-top: 1px solid rgba(239, 68, 68, 0.1); padding-top: 0.5rem;">
                      ${slot.appointments.map(apt => {
        const patient = store.find('patients', apt.patientId);
        const doctor = store.find('doctors', apt.doctorId);
        return `
                          <div style="background: white; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem; border-left: 3px solid #ef4444; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                            <div style="font-weight: 700; color: #1e293b;">${patient?.name || 'Paciente N/A'}</div>
                            <div style="color: #64748b; font-size: 0.75rem;">Dr. ${doctor?.name || 'Médico N/A'}</div>
                          </div>
                        `;
      }).join('')}
                    </div>
                  ` : ''}
                  
                  ${(!isOccupied && isWorking) ? `
                    <div style="font-size: 0.7rem; color: #166534; opacity: 0.8;">
                      Médicos disponibles: ${slot.availableDoctors.map(d => d.name).join(', ')}
                    </div>
                  ` : ''}
                </div>
              `;
    }).join('')}
          </div>
        </div>
        
        <div class="modal-footer">
          <button id="close-schedule-footer" class="btn-circle btn-circle-cancel" title="Cerrar Calendario">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const close = () => {
      modalContainer.style.opacity = '0';
      setTimeout(() => modalContainer.remove(), 200);
    };

    modalContainer.querySelector('#close-schedule').onclick = close;
    modalContainer.querySelector('#close-schedule-footer').onclick = close;
    modalContainer.onclick = (e) => { if (e.target === modalContainer) close(); };

    modalContainer.querySelectorAll('.schedule-slot').forEach(el => {
      el.onclick = () => {
        if (el.dataset.working === 'false') {
          showNotification('Este horario está fuera del horario laboral de los médicos para el día de hoy', 'info');
          return;
        }
        const time = el.dataset.time;
        close();
        openModalWithDate(dateStr, time);
      };
    });
  }

  function renderCalendarDays(year, month, startDay, daysInMonth, prevMonthLastDay) {
    let html = '';
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      html += `<div class="calendar-day outside"><div class="day-number">${d}</div></div>`;
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const isToday = dateStr === `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

      const dayAppointments = state.appointments.filter(apt => {
        const d = new Date(apt.dateTime);
        const aptDateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        return aptDateStr === dateStr;
      });

      const availableDoctors = getAvailableDoctorsForDate(dateStr);
      const isAvailable = availableDoctors.length > 0;

      const dayDate = new Date(year, month, i);
      const isPast = dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${isPast ? 'day-past' : (isAvailable ? 'day-available' : 'day-full')}" data-date="${dateStr}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div class="day-number">${i}</div>
            <div class="day-status-indicator" style="color: ${isPast ? '#64748b' : (isAvailable ? '#16a34a' : '#dc2626')}">
              ${isPast ? 'Pasado' : (isAvailable ? 'Libre' : 'Lleno')}
            </div>
          </div>
          <div class="calendar-appointments">
            ${dayAppointments.slice(0, 3).map(apt => {
        const patient = store.find('patients', apt.patientId);
        return `
                <div class="calendar-appointment ${apt.status}" data-id="${apt.id}" title="${patient?.name || 'Cita'}">
                  ${icons.clock} ${new Date(apt.dateTime).getHours()}:${new Date(apt.dateTime).getMinutes().toString().padStart(2, '0')} ${patient?.name || 'Cita'}
                </div>
              `;
      }).join('')}
            ${dayAppointments.length > 3 ? `<div class="text-xs text-muted mt-1">+ ${dayAppointments.length - 3} más</div>` : ''}
          </div>
        </div>
      `;
    }

    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (startDay + daysInMonth);
    for (let i = 1; i <= remainingCells; i++) {
      html += `<div class="calendar-day outside"><div class="day-number">${i}</div></div>`;
    }

    return html;
  }

  function openModalWithDate(dateStr, timeStr = null) {
    if (elements.dateTimeSection) {
      elements.dateTimeSection.classList.remove('hidden');
    }

    // Usar skipAutoSlot: true porque ya tenemos una fecha/hora específica
    openModal(null, { skipAutoSlot: true });

    if (elements.formDate) {
      elements.formDate.value = dateStr;

      // Importante: Guardar el tiempo solicitado en un atributo temporal para recuperarlo al seleccionar doctor
      if (timeStr) {
        elements.formTime.dataset.requestedTime = timeStr;
      }

      // Actualizar áreas y médicos del día
      updateAvailableAreas();
      updateDoctorsByAreaAndDate();

      // Forzar la hora si es posible
      if (timeStr && elements.formTime) {
        // Asegurarnos de que el select tenga el item para poder seleccionarlo
        const option = document.createElement('option');
        option.value = timeStr;
        option.textContent = timeStr;
        elements.formTime.appendChild(option);
        elements.formTime.value = timeStr;
      }

      updateModalSubtitle();
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

      const timeField = elements.formTime;
      if (timeField && timeField.parentNode) {
        timeField.parentNode.parentNode.insertBefore(warningElement, timeField.parentNode.nextSibling);
      }
    }

    warningElement.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <div style="font-size: 1.25rem; opacity: 0.7;">${icons.conflict}</div>
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
    if (warningElement) warningElement.remove();
  }

  // ========== FIN FUNCIONES DE VALIDACIÓN Y ADVERTENCIA ==========

  // Configurar event listeners
  function setupEventListeners() {
    if (elements.filterSearch) {
      elements.filterSearch.addEventListener('input', debounce(applyFiltersHandler, 300));
    }
    // El manejador de limpieza de filtros ha sido eliminado en la refactorización unificada.
    if (elements.btnNewAppointment) {
      elements.btnNewAppointment.addEventListener('click', () => openModal(null, { preselectedDoctorId: state.filters.doctorId }));
    }
    if (elements.btnCreateFirst) {
      elements.btnCreateFirst.addEventListener('click', () => openModal(null, { preselectedDoctorId: state.filters.doctorId }));
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
    if (elements.appointmentsList) {
      elements.appointmentsList.addEventListener('click', handleListAction);
    }

    // ===== BÚSQUEDA POR CÉDULA DEL PACIENTE =====
    if (elements.formPatientCedula) {
      elements.formPatientCedula.addEventListener('input', debounce(() => {
        searchPatientByCedula();
      }, 350));
    }
    if (elements.formPatientDocType) {
      elements.formPatientDocType.addEventListener('change', () => {
        if (elements.formPatientCedula && elements.formPatientCedula.value.trim()) {
          searchPatientByCedula();
        }
      });
    }
    if (elements.btnClearPatient) {
      elements.btnClearPatient.addEventListener('click', () => {
        clearPatientSelection();
      });
    }

    if (elements.formArea) {
      elements.formArea.addEventListener('change', updateDoctorsByAreaAndDate);
    }
    if (elements.formDate) {
      elements.formDate.addEventListener('change', () => {
        updateAvailableAreas();
        updateDoctorsByAreaAndDate();
        updateAvailableResources();

        // Si hay un médico seleccionado, actualizar sus slots
        if (elements.formDoctor && elements.formDoctor.value) {
          updateAvailableTimeSlots();

          // Intentar pre-seleccionar el primer horario libre del médico en esta nueva fecha
          if (!state.editingId) {
            const slots = getAvailableTimeSlots(elements.formDoctor.value, elements.formDate.value, 30);
            if (slots.length > 0 && !elements.formTime.value) {
              elements.formTime.value = slots[0];
              updateModalSubtitle();
            }
          }
        }
      });
    }
    if (elements.formDoctor) {
      elements.formDoctor.addEventListener('change', () => {
        updateAvailableTimeSlots();

        // Si no estamos editando, intentar buscar el primer horario libre de ese médico
        if (!state.editingId && elements.formDoctor.value && elements.formDate.value) {
          const doctorId = elements.formDoctor.value;
          const date = elements.formDate.value;
          const slots = getAvailableTimeSlots(doctorId, date, 30, state.editingId);

          // Prioridad 1: Requested Time (del calendario)
          const requestedTime = elements.formTime.dataset.requestedTime;
          // Prioridad 2: Current selection
          const currentTime = elements.formTime.value;

          const targetTime = requestedTime || currentTime;

          if (slots.length > 0) {
            // Si el objetivo no está disponible para este médico, buscar el siguiente
            if (!targetTime || !slots.includes(targetTime)) {
              const nextAvailable = targetTime ? (slots.find(s => s >= targetTime) || slots[0]) : slots[0];
              elements.formTime.value = nextAvailable;

              if (requestedTime && nextAvailable !== requestedTime) {
                showNotification(`El horario ${requestedTime} no está disponible para el Dr. seleccionado. Se asignó ${nextAvailable}.`, 'info');
              }
            } else {
              elements.formTime.value = targetTime;
            }

            // Limpiar el requested time una vez usado para un doctor
            delete elements.formTime.dataset.requestedTime;
            updateModalSubtitle();
          } else {
            // Si no hay slots hoy, buscar en los próximos días
            const nextSlot = findNextAvailableSlot(doctorId);
            if (nextSlot) {
              elements.formDate.value = nextSlot.date;
              updateAvailableTimeSlots();
              elements.formTime.value = nextSlot.time;
              updateModalSubtitle();
              showNotification(`No hay disponibilidad hoy para el Dr. seleccionado. Se sugirió el ${nextSlot.date} a las ${nextSlot.time}.`, 'success');
            }
          }
        }
      });
    }
    if (elements.formTime) {
      elements.formTime.addEventListener('change', () => {
        validateDoctorSchedule();
        updateAvailableAreas();
        updateDoctorsByAreaAndDate();
        updateAvailableResources();
      });
    }
    if (elements.formDuration) {
      elements.formDuration.addEventListener('change', () => {
        updateAvailableTimeSlots();
        validateDoctorSchedule();
        updateAvailableResources();
      });
    }
    if (elements.formModality) {
      elements.formModality.addEventListener('change', () => {
        const isVirtual = elements.formModality.value === 'virtual';
        if (elements.virtualLinkGroup) {
          elements.virtualLinkGroup.style.display = isVirtual ? 'block' : 'none';
        }
        if (isVirtual && elements.formVirtualLink && !elements.formVirtualLink.value) {
          const meetId = `humnt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
          elements.formVirtualLink.value = `https://meet.hospital-humnt.com/${meetId}`;
        }
        updateAvailableResources();
      });
    }
    if (elements.btnViewCalendar) {
      elements.btnViewCalendar.addEventListener('click', () => switchView('calendar'));
    }
    if (elements.btnViewList) {
      elements.btnViewList.addEventListener('click', () => switchView('list'));
    }

    const style = document.createElement('style');
    style.textContent = `
      select option:disabled {
        background-color: #f8d7da;
        color: #721c24;
        font-style: italic;
      }
      .doctor-available { color: #38a169 !important; }
      .doctor-full { color: #e53e3e !important; text-decoration: line-through; }
      .error-field { border-color: #e53e3e !important; background-color: #fff5f5 !important; }
      .available-slot { color: #38a169 !important; font-weight: 600; }
      .no-slots { color: #e53e3e !important; font-weight: 600; }
      
      /* Estilos para disponibilidad en el calendario */
      .calendar-day.day-available {
        background-color: #f0fdf4 !important;
      }
      .calendar-day.day-full {
        background-color: #fef2f2 !important;
      }
      .calendar-day.day-available:hover {
        background-color: #dcfce7 !important;
      }
      .calendar-day.day-full:hover {
        background-color: #fee2e2 !important;
      }
      .calendar-day.day-past {
        background-color: #f1f5f9 !important;
        opacity: 0.6;
        cursor: not-allowed !important;
      }
      .day-status-indicator {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        margin-top: 2px;
      }
      
      @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(style);
  }

  // ===== FUNCIONES DE BÚSQUEDA POR CÉDULA =====

  /**
   * Busca un paciente en el store por su número de cédula y tipo de documento.
   * Si lo encuentra, precarga sus datos en la tarjeta visual y establece el patientId.
   */
  function searchPatientByCedula() {
    const cedulaValue = elements.formPatientCedula?.value.trim();
    const docType = elements.formPatientDocType?.value || 'V';

    if (!cedulaValue) {
      clearPatientSelection();
      return;
    }

    // Buscar el paciente por cédula en el store
    const patients = store.get('patients');
    const foundPatient = patients.find(p => {
      const pDni = (p.dni || '').trim();
      const pDocType = (p.docType || 'V').trim();
      return pDni === cedulaValue && pDocType === docType;
    });

    if (foundPatient) {
      // PACIENTE REGISTRADO
      if (elements.formPatient) elements.formPatient.value = foundPatient.id;

      // Configurar campo visual
      if (elements.patientNameGroup) elements.patientNameGroup.classList.remove('hidden');
      if (elements.formPatientNameDisplay) {
        elements.formPatientNameDisplay.value = foundPatient.name;
        elements.formPatientNameDisplay.readOnly = true;
        elements.formPatientNameDisplay.style.borderColor = '#16a34a';
        elements.formPatientNameDisplay.style.backgroundColor = '#f0fdf4';
        elements.formPatientNameDisplay.style.color = '#166534';
      }

      if (elements.patientStatusIconContainer) {
        elements.patientStatusIconContainer.innerHTML = `<span style="color: #16a34a;">${icons.successCheck}</span>`;
      }

      if (elements.patientHelperText) {
        elements.patientHelperText.innerHTML = `${icons.info} Paciente ya registrado en el sistema.`;
        elements.patientHelperText.style.color = '#16a34a';
      }

      // Estilos del input de cédula
      if (elements.formPatientCedula) {
        elements.formPatientCedula.style.borderColor = '#16a34a';
        elements.formPatientCedula.style.backgroundColor = '#f0fdf4';
      }
    } else {
      // PACIENTE NO REGISTRADO - BUSCAR EN REGISTRO EXTERNO
      const registryEntry = store.fetchFromRegistry(docType, cedulaValue);

      if (elements.formPatient) elements.formPatient.value = '';
      if (elements.patientNameGroup) elements.patientNameGroup.classList.remove('hidden');

      if (elements.formPatientNameDisplay) {
        elements.formPatientNameDisplay.readOnly = false;
        elements.formPatientNameDisplay.style.borderColor = registryEntry ? '#3b82f6' : '#f97316';
        elements.formPatientNameDisplay.style.backgroundColor = registryEntry ? '#eff6ff' : '#fff7ed';
        elements.formPatientNameDisplay.style.color = 'inherit';

        // Si se encuentra en el registro externo, pre-rellenar el nombre
        if (registryEntry) {
          elements.formPatientNameDisplay.value = registryEntry.name;
        } else {
          // Si no se encuentra en el registro externo, limpiar el campo de nombre si la cédula es lo suficientemente larga
          if (cedulaValue.length >= 3) {
            // No limpiar si el usuario ya ha escrito algo, solo si está vacío
            if (!elements.formPatientNameDisplay.value) {
              elements.formPatientNameDisplay.value = '';
            }
          } else {
            elements.formPatientNameDisplay.value = ''; // Limpiar si la cédula es muy corta
          }
        }
      }

      if (elements.patientStatusIconContainer) {
        elements.patientStatusIconContainer.innerHTML = `<span style="color: ${registryEntry ? '#3b82f6' : '#f97316'};">${registryEntry ? icons.info : icons.warning}</span>`;
      }

      if (elements.patientHelperText) {
        elements.patientHelperText.innerHTML = registryEntry
          ? `${icons.info} Paciente identificado en Registro Civil. El sistema creará su acceso automáticamente.`
          : `${icons.warning} El paciente no está registrado. Ingrese su nombre para crearlo automáticamente.`;
        elements.patientHelperText.style.color = registryEntry ? '#1d4ed8' : '#c2410c';
      }

      if (elements.formPatientCedula) {
        elements.formPatientCedula.style.borderColor = registryEntry ? '#3b82f6' : (cedulaValue.length >= 3 ? '#f97316' : '');
        elements.formPatientCedula.style.backgroundColor = registryEntry ? '#eff6ff' : (cedulaValue.length >= 3 ? '#fff7ed' : '');
      }
    }
  }

  /**
   * Limpia la selección del paciente (cédula, tarjeta, campos)
   */
  function clearPatientSelection() {
    if (elements.formPatient) elements.formPatient.value = '';
    if (elements.formPatientCedula) {
      elements.formPatientCedula.value = '';
      elements.formPatientCedula.style.borderColor = '';
      elements.formPatientCedula.style.backgroundColor = '';
    }
    if (elements.patientNameGroup) elements.patientNameGroup.classList.add('hidden');
    if (elements.formPatientNameDisplay) {
      elements.formPatientNameDisplay.value = '';
      elements.formPatientNameDisplay.style.borderColor = '';
      elements.formPatientNameDisplay.style.backgroundColor = '';
      elements.formPatientNameDisplay.style.color = 'inherit';
      elements.formPatientNameDisplay.readOnly = false;
    }
    if (elements.patientStatusIconContainer) elements.patientStatusIconContainer.innerHTML = '';
    if (elements.patientHelperText) elements.patientHelperText.innerHTML = '';
  }

  function switchView(view) {
    state.currentView = view;
    elements.btnViewCalendar.classList.toggle('active', view === 'calendar');
    elements.btnViewList.classList.toggle('active', view === 'list');
    elements.calendarContainer.classList.toggle('hidden', view !== 'calendar');
    elements.listContainer.classList.toggle('hidden', view !== 'list');
    if (elements.viewDescription) {
      elements.viewDescription.textContent = view === 'calendar'
        ? 'Vista mensual de citas'
        : 'Lista detallada de todas las citas';
    }
    if (view === 'calendar') renderCalendar();
  }

  function applyFiltersHandler() {
    state.filters.search = elements.filterSearch?.value || '';
    loadAppointments();
  }

  // El manejador de limpieza de filtros ha sido eliminado en la refactorización unificada.

  function handleListAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const appointmentId = button.dataset.id;
    const appointment = store.find('appointments', appointmentId);

    switch (action) {
      case 'edit': editAppointment(appointment); break;
      case 'cancel': cancelAppointment(appointment); break;
      case 'view': viewAppointment(appointment); break;
    }
  }

  // Encontrar próxima cita disponible para un médico
  function findNextAvailableSlot(doctorId) {
    const doctor = store.find('doctors', doctorId);
    if (!doctor) return null;

    const today = new Date();
    let current = new Date(today);

    // Si ya es tarde para hoy, arrancar desde mañana
    if (today.getHours() >= 17) {
      current.setDate(current.getDate() + 1);
    }

    // Buscar en los próximos 15 días
    for (let i = 0; i < 15; i++) {
      const dateStr = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
      const slots = getAvailableTimeSlots(doctorId, dateStr);

      if (slots.length > 0) {
        // Si es hoy, filtrar slots que ya pasaron
        const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        if (dateStr === todayStr) {
          const nowMinutes = today.getHours() * 60 + today.getMinutes();
          const futureSlot = slots.find(s => {
            const [h, m] = s.split(':').map(Number);
            return (h * 60 + m) > nowMinutes + 15; // Dar un margen de 15 min
          });
          if (futureSlot) return { date: dateStr, time: futureSlot };
        } else {
          // Si es otro día, primer slot disponible
          return { date: dateStr, time: slots[0] };
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return null;
  }

  function findNextAvailableDateForArea(areaId, startDate) {
    let current = startDate ? new Date(startDate + 'T12:00:00') : new Date();
    current.setDate(current.getDate() + 1); // Empezar a buscar desde el día siguiente

    // Buscar en los próximos 15 días
    for (let i = 0; i < 15; i++) {
      const dateStr = `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`;
      const availableDoctors = getAvailableDoctorsForDate(dateStr, areaId);

      if (availableDoctors.length > 0) {
        return dateStr;
      }
      current.setDate(current.getDate() + 1);
    }
    return null;
  }

  function openModal(appointment = null, options = {}) {
    const { preselectedDoctorId = null, preselectedPatientId = null, skipAutoSlot = false } = options;
    state.editingId = appointment?.id || null;
    state.showModal = true;
    if (elements.modal) elements.modal.classList.remove('hidden');

    if (elements.dateTimeSection) elements.dateTimeSection.classList.remove('hidden');

    if (elements.modalSubtitle) {
      elements.modalSubtitle.textContent = state.editingId ? 'ACTUALIZACIÓN DE CITA' : 'REGISTRO DE CITA MÉDICA';
    }

    if (appointment) {
      populateForm(appointment);
    } else {
      clearForm();

      // Prioridad 1: Paciente preseleccionado (desde el módulo de pacientes)
      if (preselectedPatientId) {
        const patient = store.find('patients', preselectedPatientId);
        if (patient) {
          if (elements.formPatientDocType) elements.formPatientDocType.value = patient.docType || 'V';
          if (elements.formPatientCedula) elements.formPatientCedula.value = patient.dni || '';
          if (elements.formPatient) elements.formPatient.value = patient.id;
          searchPatientByCedula();
        }
      }
      // Prioridad 2: Usuario logueado como paciente
      else if (role === 'patient' && user?.patientId) {
        const patient = store.find('patients', user.patientId);
        if (patient) {
          if (elements.formPatientDocType) {
            elements.formPatientDocType.value = patient.docType || 'V';
            elements.formPatientDocType.disabled = true;
          }
          if (elements.formPatientCedula) {
            elements.formPatientCedula.value = patient.dni || '';
            elements.formPatientCedula.disabled = true;
          }
          if (elements.formPatient) elements.formPatient.value = patient.id;
          searchPatientByCedula();
        }
      }

      // Si hay un médico preseleccionado o el usuario es un médico
      const doctorId = preselectedDoctorId || (role === 'doctor' ? user?.doctorId : null);

      if (doctorId && elements.formDoctor && !skipAutoSlot) {
        const doctor = store.find('doctors', doctorId);
        if (doctor) {
          // Seleccionar médico y área
          elements.formDoctor.value = doctor.id;
          if (elements.formArea && doctor.areaId) {
            elements.formArea.value = doctor.areaId;
          }

          if (role === 'doctor') {
            elements.formDoctor.disabled = true;
          }

          // Buscar automáticamente el próximo horario disponible
          const nextSlot = findNextAvailableSlot(doctorId);
          if (nextSlot && elements.formDate && elements.formTime) {
            elements.formDate.value = nextSlot.date;
            updateAvailableTimeSlots();
            elements.formTime.value = nextSlot.time;
            updateModalSubtitle();

            showNotification(`Proxima disponibilidad para el ${nextSlot.date} a las ${nextSlot.time}`, 'success');
          }
        }
      } else if (doctorId && elements.formDoctor && skipAutoSlot) {
        // Si saltamos el auto-slot pero hay un doctor (ej: desde filtro o rol doctor), solo pre-seleccionamos
        const doctor = store.find('doctors', doctorId);
        if (doctor) {
          elements.formDoctor.value = doctor.id;
          if (elements.formArea && doctor.areaId) elements.formArea.value = doctor.areaId;
          if (role === 'doctor') elements.formDoctor.disabled = true;
        }
      }

      // Si no se encontró slot o no había médico, poner hoy por defecto
      if (elements.formDate && !elements.formDate.value) {
        const today = new Date().toISOString().split('T')[0];
        elements.formDate.min = today;
        elements.formDate.value = today;
        setTimeout(() => updateDoctorsByAreaAndDate(), 100);
      }
    }
    hideNoDoctorsMessage();
    hideScheduleConflictWarning();
  }

  function updateModalSubtitle() {
    if (!elements.modalSubtitle || !elements.formDate || !elements.formTime) return;

    const date = elements.formDate.value;
    const time = elements.formTime.value;
    const isEditing = !!state.editingId;

    let text = isEditing ? 'ACTUALIZACIÓN DE CITA' : 'REGISTRO DE CITA MÉDICA';
    if (date && time) {
      const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      text += ` - ${formattedDate} a las ${time}`;
    }

    elements.modalSubtitle.textContent = text;
  }

  function closeModal() {
    state.showModal = false;
    state.editingId = null;
    if (elements.modal) elements.modal.classList.add('hidden');
    clearForm();
  }

  function populateForm(appointment) {
    const date = new Date(appointment.dateTime);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().slice(0, 5);

    // Precargar paciente por cédula
    if (appointment.patientId) {
      const patient = store.find('patients', appointment.patientId);
      if (patient) {
        if (elements.formPatientDocType) elements.formPatientDocType.value = patient.docType || 'V';
        if (elements.formPatientCedula) elements.formPatientCedula.value = patient.dni || '';
        if (elements.formPatient) elements.formPatient.value = patient.id;

        // Precargar campo unificado de nombre
        if (elements.patientNameGroup) elements.patientNameGroup.classList.remove('hidden');
        if (elements.formPatientNameDisplay) {
          elements.formPatientNameDisplay.value = patient.name;
          elements.formPatientNameDisplay.readOnly = true;
          elements.formPatientNameDisplay.style.borderColor = '#166534';
          elements.formPatientNameDisplay.style.backgroundColor = '#f0fdf4';
          elements.formPatientNameDisplay.style.color = '#166534';
        }

        if (elements.patientStatusIconContainer) {
          elements.patientStatusIconContainer.innerHTML = `<span style="color: #16a34a;">${icons.successCheck}</span>`;
        }

        if (elements.patientHelperText) {
          elements.patientHelperText.innerHTML = `${icons.info} Paciente ya registrado en el sistema.`;
          elements.patientHelperText.style.color = '#16a34a';
        }

        if (elements.formPatientCedula) {
          elements.formPatientCedula.style.borderColor = '#86efac';
          elements.formPatientCedula.style.backgroundColor = '#f0fdf4';
        }

        if (role === 'patient' && user?.patientId === appointment.patientId) {
          if (elements.formPatientCedula) elements.formPatientCedula.disabled = true;
          if (elements.formPatientDocType) elements.formPatientDocType.disabled = true;
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

    // Modalidad y enlace virtual
    if (elements.formModality) {
      elements.formModality.value = appointment.modality || 'presencial';
      const isVirtual = (appointment.modality === 'virtual');
      if (elements.virtualLinkGroup) {
        elements.virtualLinkGroup.style.display = isVirtual ? 'block' : 'none';
      }
    }
    if (elements.formVirtualLink) {
      elements.formVirtualLink.value = appointment.virtualLink || '';
    }

    // Recursos asociados
    if (elements.formConsultorio && appointment.consultorioId) {
      setTimeout(() => {
        updateAvailableResources();
        setTimeout(() => {
          if (elements.formConsultorio) elements.formConsultorio.value = appointment.consultorioId;
        }, 50);
      }, 150);
    }
    if (elements.formEquipment) {
      elements.formEquipment.value = (appointment.equipmentIds && appointment.equipmentIds[0]) || '';
    }
    if (elements.formSupplies) {
      elements.formSupplies.value = (appointment.supplyIds && appointment.supplyIds[0]) || '';
    }

    updateDoctorsByAreaAndDate();
    if (elements.formDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.formDate.min = today;
    }
    updateAvailableTimeSlots();
    setTimeout(() => validateDoctorSchedule(), 100);
  }

  function clearForm() {
    if (elements.form) elements.form.reset();
    loadSelectData();
    clearPatientSelection();
    if (elements.formDate) {
      const today = new Date().toISOString().split('T')[0];
      elements.formDate.min = today;
      elements.formDate.value = today;
    }
    if (role === 'patient' && user?.patientId) {
      // Precargar la cédula del paciente logueado
      const patient = store.find('patients', user.patientId);
      if (patient) {
        if (elements.formPatientDocType) {
          elements.formPatientDocType.value = patient.docType || 'V';
          elements.formPatientDocType.disabled = true;
        }
        if (elements.formPatientCedula) {
          elements.formPatientCedula.value = patient.dni || '';
          elements.formPatientCedula.disabled = true;
        }
        if (elements.formPatient) elements.formPatient.value = patient.id;
        // Precargar tarjeta
        searchPatientByCedula();
      }
    }
    if (role === 'doctor' && user?.doctorId && elements.formDoctor) {
      const today = new Date().toISOString().split('T')[0];
      if (hasDoctorAvailability(user.doctorId, today, state.editingId)) {
        elements.formDoctor.value = user.doctorId;
      }
    }
    hideNoDoctorsMessage();
    hideScheduleConflictWarning();
    if (elements.formDoctor) elements.formDoctor.classList.remove('error-field');
    if (elements.formDate) elements.formDate.classList.remove('error-field');
    if (elements.formTime) elements.formTime.classList.remove('error-field');
    if (elements.formDuration) elements.formDuration.classList.remove('error-field');
    if (elements.timeSlotInfo) {
      elements.timeSlotInfo.textContent = 'Seleccione un médico y fecha para ver horarios disponibles';
    }
    if (elements.availableTimes) {
      elements.availableTimes.innerHTML = '';
    }
    // Limpiar campos de modalidad
    if (elements.formModality) elements.formModality.value = 'presencial';
    if (elements.virtualLinkGroup) elements.virtualLinkGroup.style.display = 'none';
    if (elements.formVirtualLink) elements.formVirtualLink.value = '';
    // Limpiar campos de recursos
    if (elements.formConsultorio) {
      elements.formConsultorio.disabled = false;
      elements.formConsultorio.value = '';
    }
    if (elements.consultorioInfo) elements.consultorioInfo.textContent = 'Seleccione fecha y hora para ver disponibilidad';
    if (elements.equipmentInfo) elements.equipmentInfo.textContent = 'Ctrl+clic para seleccionar múltiples equipos';
  }

  function updateAvailableAreas() {
    if (!elements.formArea) return;

    const date = elements.formDate?.value;
    const time = elements.formTime?.value;
    const duration = elements.formDuration ? parseInt(elements.formDuration.value) : 30;

    const allAreas = store.get('areas');

    // Si no hay fecha y hora activas, cargar todas las áreas como de costumbre
    if (!date || !time) {
      const options = allAreas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      elements.formArea.innerHTML = `<option value="">Seleccionar área</option>${options}`;
      return;
    }

    // Encontrar médicos disponibles para ese slot específico
    const availableDoctors = getAvailableDoctorsForDate(date, null, state.editingId, time, duration);
    const availableAreaIds = new Set();

    availableDoctors.forEach(d => {
      availableAreaIds.add(d.areaId);
      if (d.otherAreas && Array.isArray(d.otherAreas)) {
        d.otherAreas.forEach(aid => availableAreaIds.add(aid));
      }
    });

    const currentArea = elements.formArea.value;

    // Solo mostrar áreas con médicos disponibles
    const filteredAreas = allAreas.filter(a => availableAreaIds.has(a.id));

    elements.formArea.innerHTML = '<option value="">Seleccionar área (disponibles)</option>' +
      filteredAreas.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

    // Intentar mantener el área seleccionada si sigue disponible
    if (availableAreaIds.has(currentArea)) {
      elements.formArea.value = currentArea;
    }
  }

  function updateDoctorsByAreaAndDate() {
    if (!elements.formDoctor || !elements.formArea) return;

    const areaId = elements.formArea.value;
    const selectedDate = elements.formDate ? elements.formDate.value : null;
    const selectedTime = elements.formTime ? elements.formTime.value : null;
    const selectedDuration = elements.formDuration ? parseInt(elements.formDuration.value) : 30;

    if (!selectedDate) {
      const doctors = store.get('doctors');
      let filteredDoctors = doctors;
      if (areaId) filteredDoctors = doctors.filter(d => d.areaId === areaId || (d.otherAreas && d.otherAreas.includes(areaId)));
      const options = filteredDoctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
      elements.formDoctor.innerHTML = `<option value="">Seleccionar médico</option>${options}`;
      hideNoDoctorsMessage();
      return;
    }

    const availableDoctors = getAvailableDoctorsForDate(selectedDate, areaId, state.editingId, selectedTime, selectedDuration);

    if (availableDoctors.length === 0) {
      elements.formDoctor.innerHTML = `<option value="">Sin médicos disponibles hoy</option>`;

      // Si hay área seleccionada pero no hay médicos, sugerir cambio de fecha
      if (areaId) {
        showNoDoctorsMessage();
        if (elements.noDoctorsMessage) {
          const area = store.find('areas', areaId);
          elements.noDoctorsMessage.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.85rem;">
              <div style="background: #fff; border-radius: 50%; padding: 0.5rem; display: flex;">${icons.warning}</div>
              <div style="flex:1;">
                <strong>No hay médicos de ${area?.name || 'esta área'} disponibles para hoy.</strong>
                <div style="font-size: 0.85rem; margin-top: 0.25rem;">
                  Todos los especialistas están fuera de turno o tienen cupo lleno.
                </div>
              </div>
              <button type="button" id="btn-suggest-next-day" class="btn btn-sm" style="background:#856404; color:white; border:none; padding: 5px 10px; border-radius:4px; font-size:0.75rem;">
                Buscar próximo día
              </button>
            </div>
          `;

          const btnSuggest = elements.noDoctorsMessage.querySelector('#btn-suggest-next-day');
          if (btnSuggest) {
            btnSuggest.onclick = () => {
              const nextDate = findNextAvailableDateForArea(areaId, selectedDate);
              if (nextDate) {
                elements.formDate.value = nextDate;
                updateAvailableAreas();
                updateDoctorsByAreaAndDate();
                showNotification(`Se cambió al ${nextDate} donde hay médicos disponibles`, 'success');
              } else {
                showNotification('No se encontró disponibilidad próxima en esta área', 'warning');
              }
            };
          }
        }
      } else {
        hideNoDoctorsMessage();
      }
    } else {
      const options = availableDoctors.map(d => {
        const remaining = getDoctorRemainingAvailability(d.id, selectedDate, state.editingId);
        const dailyCapacity = d.dailyCapacity || 20;
        return `<option value="${d.id}" class="doctor-available">
          ${d.name} - ${d.specialty} (${remaining}/${dailyCapacity} cupos)
        </option>`;
      }).join('');

      elements.formDoctor.innerHTML = `<option value="">Seleccionar médico</option>${options}`;
      hideNoDoctorsMessage();

      if (state.editingId && elements.formDoctor.value) {
        const currentDoctor = store.find('doctors', elements.formDoctor.value);
        if (currentDoctor && !availableDoctors.some(d => d.id === currentDoctor.id)) {
          elements.formDoctor.value = '';
          showNotification(
            `El Dr. ${currentDoctor.name} no tiene disponibilidad para el ${selectedDate}. seleccione otro médico.`,
            'warning'
          );
        }
      }

      if (role === 'doctor' && user?.doctorId && !state.editingId) {
        const isSelectedWorking = availableDoctors.some(d => d.id === user.doctorId);
        if (isSelectedWorking) {
          elements.formDoctor.value = user.doctorId;
          updateAvailableTimeSlots();
        }
      }
    }
  }

  function updateAvailableTimeSlots() {
    if (!elements.formDoctor || !elements.formDate || !elements.formDate.value) {
      if (elements.timeSlotInfo) {
        elements.timeSlotInfo.textContent = 'Seleccione un médico y fecha para ver horarios disponibles';
      }
      if (elements.availableTimes) elements.availableTimes.innerHTML = '';
      return;
    }

    const doctorId = elements.formDoctor.value;
    const date = elements.formDate.value;
    const duration = elements.formDuration ? parseInt(elements.formDuration.value) : 30;

    // Si no hay doctor seleccionado todavía, pero hay un requestedTime (ej: del calendario)
    if (!doctorId) {
      const requestedTime = elements.formTime.dataset.requestedTime;
      if (requestedTime && elements.formTime) {
        elements.formTime.innerHTML = `<option value="${requestedTime}">${requestedTime}</option>`;
        elements.formTime.value = requestedTime;
      }
      return;
    }

    const availableSlots = getAvailableTimeSlots(doctorId, date, duration, state.editingId);

    if (elements.formTime) {
      const currentTime = elements.formTime.value;
      const requestedTime = elements.formTime.dataset.requestedTime;
      const targetTime = requestedTime || currentTime;

      if (availableSlots.length > 0) {
        elements.formTime.innerHTML = '<option value="">Seleccionar horario</option>' +
          availableSlots.map(slot => `<option value="${slot}">${slot}</option>`).join('');

        // Si ya había una hora seleccionada (o solicitada) y sigue estando disponible, mantenerla
        if (targetTime && availableSlots.includes(targetTime)) {
          elements.formTime.value = targetTime;
        } else if (targetTime && !availableSlots.includes(targetTime)) {
          // Si el horario ya no está disponible, limpiar pero dar opción de buscar
          elements.formTime.value = '';
        }
      } else {
        elements.formTime.innerHTML = '<option value="">No hay disponibilidad</option>';
        elements.formTime.value = '';
      }
    }

    if (elements.availableTimes) {
      elements.availableTimes.innerHTML = ''; // Limpiar datalist legado
    }

    if (elements.timeSlotInfo) {
      if (availableSlots.length > 0) {
        elements.timeSlotInfo.innerHTML = `
          <span class="available-slot">${icons.successCheck} ${availableSlots.length} horarios disponibles</span>
          <br>
          <small>Seleccione un horario de la lista o ingrese manualmente</small>
        `;

        const isTimeFieldVisible = elements.dateTimeSection && !elements.dateTimeSection.classList.contains('hidden');
        if (isTimeFieldVisible && elements.formTime && elements.formTime.value && !availableSlots.includes(elements.formTime.value)) {
          elements.formTime.value = '';
          showNotification('El horario seleccionado ya no está disponible. Por favor, seleccione otro.', 'warning');
        }
      } else {
        elements.timeSlotInfo.innerHTML = `
          <span class="no-slots">${icons.warning} No hay horarios disponibles para esta fecha</span>
          <br>
          <small>El médico no tiene horarios libres en esta fecha. Seleccione otra fecha.</small>
        `;

        const isTimeFieldVisible = elements.dateTimeSection && !elements.dateTimeSection.classList.contains('hidden');
        if (isTimeFieldVisible && elements.formTime) {
          elements.formTime.value = '';
        }
      }
    }
  }

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

      if (hasScheduleConflict(doctorId, date, time, duration, state.editingId)) {
        const doctor = store.find('doctors', doctorId);
        showScheduleConflictWarning(doctor, date, time, duration);
        if (elements.formTime) elements.formTime.classList.add('error-field');
        if (elements.formDuration) elements.formDuration.classList.add('error-field');
      }

      const doctor = store.find('doctors', doctorId);
      if (doctor && !isDoctorWorkingAt(doctor, date, time, duration)) {
        showNotification(`El médico no trabaja en este horario o la cita excede su turno (${time})`, 'warning');
        if (elements.formTime) elements.formTime.classList.add('error-field');
      }
    }
  }

  async function validateForm() {
    let isValid = true;
    window.hospitalFieldValidation.clearAll(elements.form);

    // Validar paciente (existente o nuevo)
    const hasExistingPatient = elements.formPatient?.value;
    const hasNewPatientName = elements.formPatientNameDisplay?.value?.trim();
    const isPatientGroupVisible = elements.patientNameGroup && !elements.patientNameGroup.classList.contains('hidden');

    if (!hasExistingPatient && (!isPatientGroupVisible || !hasNewPatientName)) {
      if (elements.formPatientCedula && !hasExistingPatient) {
        window.hospitalFieldValidation.show(elements.formPatientCedula, 'Paciente no identificado');
      }
      if (isPatientGroupVisible && !hasNewPatientName) {
        window.hospitalFieldValidation.show(elements.formPatientNameDisplay, 'Nombre completo requerido');
      }
      isValid = false;
    }

    const requiredFields = [
      { field: elements.formDoctor, label: 'Debe seleccionar médico' },
      { field: elements.formArea, label: 'Debe seleccionar área' },
      { field: elements.formDate, label: 'Fecha requerida' },
      { field: elements.formTime, label: 'Hora requerida' },
      { field: elements.formDuration, label: 'Duración requerida' }
    ];

    requiredFields.forEach(({ field, label }) => {
      if (field) {
        if (!field.value.trim()) {
          window.hospitalFieldValidation.show(field, label);
          isValid = false;
        }
      }
    });

    if (elements.formDoctor?.value && elements.formDate?.value && elements.formTime?.value) {
      const doctor = store.find('doctors', elements.formDoctor.value);
      const duration = parseInt(elements.formDuration?.value || 30);
      if (doctor && !isDoctorWorkingAt(doctor, elements.formDate.value, elements.formTime.value, duration)) {
        window.hospitalFieldValidation.show(elements.formTime, 'Fuera de horario laboral');
        isValid = false;
      }
    }

    if (elements.formDate?.value && elements.formTime?.value) {
      const selectedDate = new Date(`${elements.formDate.value}T${elements.formTime.value}`);
      const now = new Date();
      if (selectedDate < now) {
        window.hospitalFieldValidation.show(elements.formDate, 'No puede ser fecha pasada');
        isValid = false;
      }
    }

    if (elements.formDoctor?.value && elements.formDate?.value) {
      if (isDoctorFullyBooked(elements.formDoctor.value, elements.formDate.value, state.editingId)) {
        window.hospitalFieldValidation.show(elements.formDate, 'Médico sin disponibilidad este día');
        isValid = false;
      }
    }

    if (elements.formDoctor?.value && elements.formDate?.value && elements.formTime?.value && elements.formDuration?.value) {
      if (hasScheduleConflict(elements.formDoctor.value, elements.formDate.value, elements.formTime.value, parseInt(elements.formDuration.value), state.editingId)) {
        window.hospitalFieldValidation.show(elements.formTime, 'Conflicto: ya existe otra cita');
        isValid = false;
      }
    }

    if (!isValid) {
      const firstError = elements.form.querySelector('.error-field');
      if (firstError) firstError.focus();
    }

    return isValid;
  }

  function getFormData() {
    const date = new Date(`${elements.formDate.value}T${elements.formTime.value}`);
    const modality = elements.formModality ? elements.formModality.value : 'presencial';
    const equipmentIds = elements.formEquipment && elements.formEquipment.value
      ? [elements.formEquipment.value]
      : [];
    const supplyIds = elements.formSupplies && elements.formSupplies.value
      ? [elements.formSupplies.value]
      : [];

    return {
      patientId: elements.formPatient.value,
      doctorId: elements.formDoctor.value,
      areaId: elements.formArea.value,
      dateTime: date.getTime(),
      duration: parseInt(elements.formDuration.value),
      reason: elements.formReason.value || '',
      notes: elements.formNotes.value || '',
      status: elements.formStatus ? elements.formStatus.value : 'scheduled',
      createdBy: user.id,
      modality: modality,
      virtualLink: modality === 'virtual' ? (elements.formVirtualLink ? elements.formVirtualLink.value : '') : '',
      consultorioId: modality === 'presencial' ? (elements.formConsultorio ? elements.formConsultorio.value : '') : '',
      equipmentIds: equipmentIds,
      supplyIds: supplyIds
    };
  }

  async function saveAppointment() {
    if (!await validateForm()) {
      return;
    }

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
      elements.btnSave.innerHTML = '<span class="loading-spinner"></span>';
    }

    try {
      // Si es un nuevo paciente, crearlo primero junto con su usuario
      if (!elements.formPatient?.value && elements.formPatientNameDisplay?.value?.trim()) {
        const patientName = elements.formPatientNameDisplay.value.trim();
        const cedula = (elements.formPatientCedula?.value || '').trim();
        const docType = elements.formPatientDocType?.value || 'V';

        // 1. Crear el paciente
        const newPatient = await store.add('patients', {
          name: patientName,
          dni: cedula,
          docType: docType,
          isActive: true,
          createdAt: new Date().toISOString()
        });

        // 2. Crear su usuario asociado (Cédula como user/pass)
        await store.add('users', {
          username: cedula,
          password: cedula,
          name: patientName,
          role: 'patient',
          patientId: newPatient.id,
          isActive: true
        });

        // 3. Vincular al formulario
        if (elements.formPatient) elements.formPatient.value = newPatient.id;

        Logger.log(store, user, {
          action: Logger.Actions.CREATE,
          module: Logger.Modules.PATIENTS,
          description: `Paciente creado desde cita: ${patientName}`,
          details: { patientId: newPatient.id, cedula }
        });
      }

      const formData = getFormData();
      if (state.editingId) {
        await updateAppointment(state.editingId, formData);
        showNotification('Cita actualizada correctamente', 'success');
      } else {
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
        elements.btnSave.innerHTML = icons.successCheck;
      }
    }
  }

  async function createAppointment(data) {
    // Si hay insumos seleccionados, descontar stock
    if (data.supplyIds && data.supplyIds.length > 0) {
      for (const sId of data.supplyIds) {
        const supply = store.find('suministros', sId);
        if (supply) {
          await store.update('suministros', sId, {
            stock: Math.max(0, (supply.stock || 0) - 1)
          });
        }
      }
    }

    const result = await store.add('appointments', data);
    Logger.log(store, user, {
      action: Logger.Actions.CREATE,
      module: Logger.Modules.APPOINTMENTS,
      description: `Cita médica creada para el paciente ID: ${data.patientId}`,
      details: { appointmentId: result.id, ...data }
    });
    return result;
  }

  async function updateAppointment(id, data) {
    const result = await store.update('appointments', id, data);
    Logger.log(store, user, {
      action: Logger.Actions.UPDATE,
      module: Logger.Modules.APPOINTMENTS,
      description: `Cita médica actualizada ID: ${id}`,
      details: { appointmentId: id, changes: data }
    });
    return result;
  }

  async function cancelAppointment(appointment) {
    if (!await hospitalConfirm(`¿Está seguro de cancelar la cita del ${new Date(appointment.dateTime).toLocaleDateString('es-ES')}?`, 'danger')) {
      return;
    }

    try {
      await store.update('appointments', appointment.id, {
        status: 'cancelled',
        cancelledAt: Date.now(),
        cancelledBy: user.id,
        consultorioId: '',
        equipmentIds: [],
        supplyIds: []
      });

      // Devolver stock de insumos
      if (appointment.supplyIds && appointment.supplyIds.length > 0) {
        for (const sId of appointment.supplyIds) {
          const supply = store.find('suministros', sId);
          if (supply) {
            await store.update('suministros', sId, {
              stock: (supply.stock || 0) + 1
            });
          }
        }
      }
      Logger.log(store, user, {
        action: Logger.Actions.DELETE,
        module: Logger.Modules.APPOINTMENTS,
        description: `Cita médica cancelada ID: ${appointment.id}. Recursos liberados.`,
        details: {
          appointmentId: appointment.id,
          reason: 'Cancelado por usuario',
          freedConsultorio: appointment.consultorioId || null,
          freedEquipment: appointment.equipmentIds || []
        }
      });
      showNotification('Cita cancelada correctamente. Los recursos han sido liberados.', 'success');
      loadAppointments();
    } catch (error) {
      console.error('Error cancelando cita:', error);
      showNotification('Error al cancelar la cita', 'error');
    }
  }

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

    const canCreateClinical = (role === 'admin' || role === 'doctor') &&
      appointment.status === 'completed' &&
      !hasClinicalRecord(appointment.id);

    function hasClinicalRecord(appointmentId) {
      const clinicalRecords = store.get('clinicalRecords');
      return clinicalRecords.some(record => record.appointmentId === appointmentId);
    }

    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-appointment-modal';
    modalContainer.className = 'modal-overlay';
    modalContainer.style.zIndex = '2000';

    const canEdit = role === 'admin' ||
      role === 'receptionist' ||
      role === 'nurse' ||
      (role === 'doctor' && user?.doctorId === appointment.doctorId) ||
      (role === 'patient' && user?.patientId === appointment.patientId);

    const canCancel = canEdit && appointment.status !== 'completed' && appointment.status !== 'cancelled';

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h3>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">INFORME DE CITA MÉDICA</div>
          </div>
          <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="close-view-modal">&times;</button>
        </div>
        
        <div class="modal-body" style="padding: 2rem; max-height: 70vh; overflow-y: auto;">
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
                ${icons.clock} ${timeStr} • ${appointment.duration} minutos
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div style="background: var(--card-patient); border-radius: 4px; padding: 1.25rem; position: relative;">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ${icons.patient}
                </div>
                <div>
                  <div style="font-size: 0.7rem; font-weight: 700; color: var(--modal-text-muted);">PACIENTE</div>
                  <div style="font-weight: 700; font-size: 1.1rem;">${patient?.name || 'N/A'}</div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; font-size: 0.8rem;">
                <div>
                  <div style="font-weight: 700; color: var(--modal-text-muted);">CÉDULA</div>
                  <div>${patient?.docType ? patient.docType + '-' : ''}${patient?.dni || 'No disponible'}</div>
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
                <div style="width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  ${icons.doctor}
                </div>
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

          <div style="margin-bottom: 2rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #666; margin-bottom: 0.5rem;">ESTADO ACTUAL</div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              ${getStatusBadge(appointment.status)}
              <span class="badge" style="background: ${appointment.modality === 'virtual' ? '#7c3aed' : '#059669'}; color: white; font-size: 0.7rem; padding: 0.25rem 0.5rem;">
                ${appointment.modality === 'virtual' ? `${icons.video} VIRTUAL` : `${icons.hospital} PRESENCIAL`}
              </span>
              <div style="font-size: 0.85rem; color: #666;">
                ${appointment.cancelledAt ? `Cancelada el ${new Date(appointment.cancelledAt).toLocaleDateString('es-ES')}` : ''}
              </div>
            </div>
          </div>

          ${appointment.modality === 'virtual' && appointment.virtualLink ? `
          <div style="margin-bottom: 2rem;">
            <div style="font-size: 0.9rem; font-weight: 700; color: #7c3aed; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              ${icons.video} CITA VIRTUAL - ENLACE DE REUNIÓN
            </div>
            <div style="background: #f5f3ff; border: 1px solid #c4b5fd; border-radius: 8px; padding: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 40px; height: 40px; background: #7c3aed; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white;">
                  ${icons.video}
                </div>
                <div style="flex: 1;">
                  <div style="font-size: 0.75rem; font-weight: 700; color: #6d28d9; margin-bottom: 0.25rem;">ENLACE DE VIDEOCONFERENCIA</div>
                  <a href="${appointment.virtualLink}" target="_blank" style="color: #7c3aed; word-break: break-all; font-size: 0.85rem;">${appointment.virtualLink}</a>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          ${(appointment.consultorioId || (appointment.equipmentIds && appointment.equipmentIds.length > 0)) ? `
          <div style="margin-bottom: 2rem;">
            <div style="font-size: 0.9rem; font-weight: 700; color: #2563eb; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              ${icons.resource} RECURSOS ASIGNADOS
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              ${appointment.consultorioId ? (() => {
          const room = store.find('consultorios', appointment.consultorioId);
          return room ? `
                  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 1rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: #1d4ed8; margin-bottom: 0.25rem;">CONSULTORIO</div>
                    <div style="font-weight: 600;">${room.name}</div>
                    <div style="font-size: 0.8rem; color: #666;">${room.area} - Piso ${room.floor}</div>
                  </div>` : '';
        })() : ''}
              ${appointment.equipmentIds && appointment.equipmentIds.length > 0 ? (() => {
          const eqNames = appointment.equipmentIds.map(eqId => {
            const eq = store.find('equiposMedicos', eqId);
            return eq ? eq.name : eqId;
          });
          return `
                  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 1rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: #15803d; margin-bottom: 0.25rem;">EQUIPAMIENTO</div>
                    ${eqNames.map(name => `<div style="font-size: 0.85rem; padding: 0.15rem 0;">• ${name}</div>`).join('')}
                  </div>`;
        })() : ''}
              ${appointment.supplyIds && appointment.supplyIds.length > 0 ? (() => {
          const supplyNames = appointment.supplyIds.map(sId => {
            const s = store.find('suministros', sId);
            return s ? s.name : sId;
          });
          return `
                  <div style="background: #fff7ed; border: 1px solid #ffedd5; border-radius: 4px; padding: 1rem;">
                    <div style="font-size: 0.75rem; font-weight: 700; color: #9a3412; margin-bottom: 0.25rem;">INSUMOS USADOS</div>
                    ${supplyNames.map(name => `<div style="font-size: 0.85rem; padding: 0.15rem 0;">• ${name}</div>`).join('')}
                  </div>`;
        })() : ''}
            </div>
          </div>
          ` : ''}

          <div style="margin-bottom: 2rem;">
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              <span style="opacity: 0.7;">${icons.clipboard}</span> INFORMACIÓN DE LA CONSULTA
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

          ${hasClinicalRecord(appointment.id) ? `
            <div style="background: var(--modal-section-forest-light); border: 1px solid var(--modal-section-forest); border-radius: 4px; padding: 1rem; margin-top: 1.5rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="font-size: 1.25rem; opacity: 0.7;">${icons.clinical}</div>
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
          Documento administrativo • Generado automáticamente por Hospital Universitario Manuel Núñez Tovar
        </div>

        <div class="modal-footer">
          <div style="display: flex; gap: 0.75rem;">
            ${canCancel ? `
              <button class="btn-circle btn-circle-danger" id="cancel-appointment-btn" data-id="${appointment.id}" title="Anular Cita">
                ${icons.cancel}
              </button>
            ` : ''}
            
            ${canEdit ? `
              <button class="btn-circle btn-circle-edit" id="edit-appointment-btn" data-id="${appointment.id}" title="Editar Cita">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            ` : ''}
          </div>
          
          <div style="display: flex; gap: 0.75rem;">
            ${canCreateClinical ? `
              <button class="btn-circle btn-circle-save" id="create-clinical-from-appointment" data-id="${appointment.id}" title="Crear Consulta Clínica">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </button>
            ` : ''}
            
            ${hasClinicalRecord(appointment.id) ? `
              <button class="btn-circle btn-circle-view" id="view-clinical-record" data-id="${appointment.id}" title="Ver Historia Clínica">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            ` : ''}
            
            <button class="btn-circle" id="close-appointment-modal" title="Cerrar" style="background-color: #64748b;">
              ${icons.close}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    function escHandler(e) {
      if (e.key === 'Escape') extendedCloseModal();
    }

    function extendedCloseModal() {
      if (modalContainer.parentNode) modalContainer.parentNode.removeChild(modalContainer);
      document.removeEventListener('keydown', escHandler);
    }

    document.addEventListener('keydown', escHandler);

    const closeBtnHeader = modalContainer.querySelector('#close-view-modal');
    const closeBtnFooter = modalContainer.querySelector('#close-appointment-modal');
    const editBtn = modalContainer.querySelector('#edit-appointment-btn');
    const cancelBtn = modalContainer.querySelector('#cancel-appointment-btn');
    const createClinicalBtn = modalContainer.querySelector('#create-clinical-from-appointment');
    const viewClinicalBtn = modalContainer.querySelector('#view-clinical-record');

    if (closeBtnHeader) closeBtnHeader.addEventListener('click', extendedCloseModal);
    if (closeBtnFooter) closeBtnFooter.addEventListener('click', extendedCloseModal);

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        editAppointment(appointment);
        extendedCloseModal();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        cancelAppointment(appointment);
        extendedCloseModal();
      });
    }

    if (createClinicalBtn) {
      createClinicalBtn.addEventListener('click', () => {
        createClinicalFromAppointment(appointment);
        extendedCloseModal();
      });
    }

    if (viewClinicalBtn) {
      viewClinicalBtn.addEventListener('click', () => {
        viewClinicalRecordFromAppointment(appointment);
        extendedCloseModal();
      });
    }

    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) extendedCloseModal();
    });

    function createClinicalFromAppointment(appointment) {
      if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
        window.APP_STATE.appShell.navigateTo('clinical');

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

        setTimeout(() => {
          const patientName = patient?.name || 'el paciente';
          showNotification(`Creando consulta para ${patientName}...`, 'info');
        }, 300);
      }
    }

    function viewClinicalRecordFromAppointment(appointment) {
      const clinicalRecords = store.get('clinicalRecords');
      const clinicalRecord = clinicalRecords.find(record => record.appointmentId === appointment.id);

      if (clinicalRecord) {
        if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
          window.APP_STATE.appShell.navigateTo('clinical');
          localStorage.setItem('clinical_view_record', clinicalRecord.id);
          setTimeout(() => showNotification('Cargando registro clínico...', 'info'), 300);
        }
      } else {
        showNotification('No se encontró el registro clínico', 'warning');
      }
    }
  }

  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    let icon = icons.info;
    let bgColor = 'var(--info)';

    switch (type) {
      case 'success':
        bgColor = 'var(--success)';
        icon = icons.successCheck;
        break;
      case 'error':
        bgColor = 'var(--danger)';
        icon = icons.cancel;
        break;
      case 'warning':
        bgColor = 'var(--warning)';
        icon = icons.warning;
        break;
      default:
        bgColor = 'var(--info)';
        icon = icons.info;
    }

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${bgColor};
      color: white;
      border-radius: var(--radius);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    `;

    notification.innerHTML = `${icon} ${message}`;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);

    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
      `;
      document.head.appendChild(style);
    }
  }

  function editAppointment(appointment) {
    openModal(appointment);
  }

  function hasClinicalRecord(appointmentId) {
    const clinicalRecords = store.get('clinicalRecords');
    return clinicalRecords.some(record => record.appointmentId === appointmentId);
  }

  const unsubscribe = init();

  return {
    refresh: loadAppointments,
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}