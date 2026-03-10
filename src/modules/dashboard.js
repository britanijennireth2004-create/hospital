/**
 * Módulo Dashboard - Vista principal mejorada
 */

// SVG ICONS DEFINITIONS (puedes usar una función helper para obtenerlos)
const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><rect x="2.25" y="3.75" width="15.5" height="14" rx="2.25" stroke="var(--muted)" stroke-width="1.5"/><path stroke="var(--muted)" stroke-width="1.5" d="M6 1.75v3.5M14 1.75v3.5"/><path stroke="var(--muted)" stroke-width="1.5" stroke-linecap="round" d="M2 7.5h16"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><rect x="4.25" y="3.75" width="11.5" height="14" rx="2.25" stroke="#ea4632" stroke-width="1.5"/><rect x="6.75" y="2" width="6.5" height="3.5" rx="1.25" stroke="#ea4632" stroke-width="1.5"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="7" r="4" stroke="var(--muted)" stroke-width="1.5"/><path stroke="var(--muted)" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5" stroke="#888" stroke-width="1.5"/><path stroke="#888" stroke-width="1.5" d="M10 1.75v2.5M10 15.75v2.5M3.64 3.64l1.77 1.77M14.59 14.59l1.77 1.77M1.75 10h2.5M15.75 10h2.5M3.64 16.36l1.77-1.77M14.59 5.41l1.77-1.77"/></svg>`,
  doctor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="6" r="4" stroke="var(--muted)" stroke-width="1.5"/><path stroke="var(--muted)" stroke-width="1.5" d="M3.5 18c0-3.037 2.486-5.5 6.5-5.5s6.5 2.463 6.5 5.5"/></svg>`,
  patient: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="7" r="4" stroke="#38a169" stroke-width="1.5"/><path stroke="#38a169" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,
  area: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" fill="none" viewBox="0 0 20 20"><rect x="2.25" y="4.25" width="15.5" height="10.5" rx="1.75" stroke="#d69e2e" stroke-width="1.5"/><path stroke="#d69e2e" stroke-width="1.5" d="M6.5 15.75V17a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-1.25"/></svg>`,
  successCheck: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#38a169" stroke-width="2"/><path stroke="#38a169" stroke-width="2" d="M6 10.5l2.5 2 5-5"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><path stroke="var(--muted)" stroke-width="1.5" d="M10 3v8"/><circle cx="10" cy="15" r="1" fill="var(--muted)"/><circle cx="10" cy="10" r="9" stroke="var(--muted)" stroke-width="1.5"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#249" stroke-width="2"/><path stroke="#249" stroke-width="2" d="M10 7v5"/><circle cx="10" cy="14" r="1" fill="#249"/></svg>`,
  // Iconos adicionales
  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  triaje: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  history: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
};

export default function mountDashboard(root, { bus, store, user, role }) {
  const state = {
    stats: {},
    chartData: [],
    isLoading: true
  };

  // Renderizar
  function render() {
    root.innerHTML = `
      <div class="module-dashboard">
        <!-- Estadísticas -->
        <div class="stats-auto-grid mb-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Gráfico de Citas -->
        <div class="card mb-4">
          <div class="card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">
              <span>${icons.calendar}</span>
              Proyección de Citas (Próximos 30 días)
            </h3>
            <div class="text-muted text-sm">Frecuencia estimada de actividad asistencial</div>
          </div>
          <div id="appointments-chart-container" style="min-height: 350px; padding: 1rem 0;">
            <!-- El gráfico SVG se renderizará aquí -->
          </div>
        </div>

        <style>
          /* El estilo de .stats-auto-grid y .stat-info-card se hereda de base.css */
        </style>
      </div>
    `;

    // Cargar datos
    loadData();
  }

  // Cargar datos
  async function loadData() {
    state.isLoading = true;

    try {
      // Cargar estadísticas
      await loadStats();

      // Renderizar componentes
      renderStats();
      renderAppointmentsChart();

    } catch (error) {
      console.error('Error cargando dashboard:', error);
      showError('Error al cargar los datos');
    } finally {
      state.isLoading = false;
    }
  }

  // Cargar estadísticas
  async function loadStats() {
    const appointments = store.get('appointments') || [];
    const patients = store.get('patients') || [];
    const doctors = store.get('doctors') || [];
    const areas = store.get('areas') || [];
    const triajeRecords = store.get('triaje') || [];

    // Filtrar por rol si es necesario
    let filteredAppointments = appointments;
    if (role === 'patient' && user.patientId) {
      filteredAppointments = appointments.filter(a => a.patientId === user.patientId);
    } else if (role === 'doctor' && user.doctorId) {
      filteredAppointments = appointments.filter(a => a.doctorId === user.doctorId);
    }

    state.stats = {
      totalAppointments: filteredAppointments.length,
      todayAppointments: filteredAppointments.filter(a => {
        const today = new Date().toDateString();
        return new Date(a.dateTime).toDateString() === today;
      }).length,
      upcomingAppointments: filteredAppointments.filter(a => {
        const appointmentDate = new Date(a.dateTime);
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return appointmentDate >= today && appointmentDate <= nextWeek && a.status === 'scheduled';
      }).length,
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      totalAreas: areas.length,
      pendingAppointments: filteredAppointments.filter(a => a.status === 'scheduled').length,
      completedAppointments: filteredAppointments.filter(a => a.status === 'completed').length,
      triajePending: triajeRecords.filter(t => t.status === 'waiting').length
    };
  }

  // Renderizar gráfico de citas
  function renderAppointmentsChart() {
    const container = root.querySelector('#appointments-chart-container');
    if (!container) return;

    const appointments = store.get('appointments') || [];

    // Filtrar por rol
    let myAppointments = appointments;
    if (role === 'patient' && user.patientId) {
      myAppointments = appointments.filter(a => a.patientId === user.patientId);
    } else if (role === 'doctor' && user.doctorId) {
      myAppointments = appointments.filter(a => a.doctorId === user.doctorId);
    }

    // Calcular datos para los próximos 30 días
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + i);
      const dayStr = currentDay.toISOString().split('T')[0];

      const count = myAppointments.filter(a => {
        const aDate = new Date(a.dateTime);
        aDate.setHours(0, 0, 0, 0);
        return aDate.getTime() === currentDay.getTime();
      }).length;

      data.push({
        date: currentDay,
        label: i % 5 === 0 ? currentDay.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '',
        count
      });
    }

    state.chartData = data;

    // Dibujar SVG
    const width = container.clientWidth || 800;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 40 };

    const maxCount = Math.max(...data.map(d => d.count), 5); // Al menos escala 5

    const getX = (index) => padding.left + (index * (width - padding.left - padding.right) / (data.length - 1));
    const getY = (count) => height - padding.bottom - (count * (height - padding.top - padding.bottom) / maxCount);

    // Generar puntos para la línea
    const points = data.map((d, i) => `${getX(i)},${getY(d.count)}`).join(' ');

    // Generar etiquetas de fondo (líneas horizontales)
    const yLines = [];
    for (let i = 0; i <= maxCount; i += Math.ceil(maxCount / 5)) {
      const y = getY(i);
      yLines.push(`
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border)" stroke-dasharray="4" />
        <text x="${padding.left - 10}" y="${y + 5}" font-size="12" fill="var(--muted)" text-anchor="end">${i}</text>
      `);
    }

    // Generar etiquetas de fechas
    const xLabels = data.map((d, i) => d.label ? `
      <text x="${getX(i)}" y="${height - 10}" font-size="11" fill="var(--muted)" text-anchor="middle">${d.label}</text>
    ` : '').join('');

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="overflow: visible;">
        <!-- Líneas de fondo -->
        ${yLines.join('')}
        
        <!-- Área bajo la curva (gradiente) -->
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.2" />
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
          </linearGradient>
        </defs>
        <polyline
          points="${padding.left},${height - padding.bottom} ${points} ${width - padding.right},${height - padding.bottom}"
          fill="url(#chartGradient)"
        />
        
        <!-- Línea del gráfico -->
        <polyline
          points="${points}"
          fill="none"
          stroke="var(--themeTertiary)"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
        <!-- Puntos del gráfico -->
        ${data.map((d, i) => `
          <circle cx="${getX(i)}" cy="${getY(d.count)}" r="4" fill="white" stroke="var(--themeTertiary)" stroke-width="2">
            <title>${d.date.toLocaleDateString()}: ${d.count} citas</title>
          </circle>
        `).join('')}
        
        <!-- Etiquetas de fechas -->
        ${xLabels}
      </svg>
    `;
  }

  // Renderizar estadísticas
  function renderStats() {
    const container = root.querySelector('#stats-container');
    if (!container) return;

    const { stats } = state;

    // Estadísticas según rol
    let statsHTML = '';

    if (role === 'patient') {
      statsHTML = `
        <div class="stat-info-card">
          <span class="stat-info-label">Mis Citas</span>
          <span class="stat-info-value">${stats.totalAppointments}</span>
          <span class="stat-info-sub">${icons.calendar} Programadas</span>
        </div>
        
        <div class="stat-info-card">
          <span class="stat-info-label">Historias Clínicas</span>
          <span class="stat-info-value">${store.get('clinicalRecords')?.filter(r => r.patientId === user.patientId).length || 0}</span>
          <span class="stat-info-sub">${icons.clipboard} Registros propios</span>
        </div>
        
        <div class="stat-info-card">
          <span class="stat-info-label">Próxima Visita</span>
          <span class="stat-info-value" style="font-size: 1.5rem;">${stats.upcomingAppointments > 0 ? 'Programada' : 'No hay'}</span>
          <span class="stat-info-sub">${icons.info} Ver detalle abajo</span>
        </div>
      `;
    } else {
      // Estadísticas para personal (admin, doctor, nurse, receptionist)
      statsHTML = `
        <div class="stat-info-card">
          <span class="stat-info-label">Citas totales</span>
          <span class="stat-info-value">${stats.totalAppointments}</span>
          <span class="stat-info-sub">${icons.calendar} ${stats.todayAppointments} hoy</span>
        </div>
        
        <div class="stat-info-card">
          <span class="stat-info-label">Pacientes</span>
          <span class="stat-info-value">${stats.totalPatients}</span>
          <span class="stat-info-sub">${icons.user} Registrados</span>
        </div>
        
        <div class="stat-info-card">
          <span class="stat-info-label">Médicos</span>
          <span class="stat-info-value">${stats.totalDoctors}</span>
          <span class="stat-info-sub">${icons.doctor} Activos</span>
        </div>
      `;

      if (role === 'nurse') {
        statsHTML += `
          <div class="stat-info-card">
            <span class="stat-info-label">Pacientes en triaje</span>
            <span class="stat-info-value">${stats.triajePending || 0}</span>
            <span class="stat-info-sub">${icons.triaje} Pendientes</span>
          </div>
        `;
      } else {
        statsHTML += `
          <div class="stat-info-card">
            <span class="stat-info-label">Próximas citas</span>
            <span class="stat-info-value">${stats.upcomingAppointments}</span>
            <span class="stat-info-sub">${icons.warning} 7 días</span>
          </div>
        `;
      }
    }

    container.innerHTML = statsHTML;
  }

  // Mostrar mensaje de error
  function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'alert alert-danger';
    errorEl.textContent = message;
    errorEl.style.margin = '1rem 0';
    root.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 5000);
  }

  // Suscribirse a cambios en el store
  const unsubscribe = store.subscribe('appointments', () => {
    loadData();
  });

  // Inicializar el render
  render();

  return {
    refresh: loadData,
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}