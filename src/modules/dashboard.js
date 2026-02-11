/**
 * Módulo Dashboard - Vista principal mejorada
 */

// SVG ICONS DEFINITIONS (puedes usar una función helper para obtenerlos)
const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><rect x="2.25" y="3.75" width="15.5" height="14" rx="2.25" stroke="#888" stroke-width="1.5"/><path stroke="#888" stroke-width="1.5" d="M6 1.75v3.5M14 1.75v3.5"/><path stroke="#888" stroke-width="1.5" stroke-linecap="round" d="M2 7.5h16"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><rect x="4.25" y="3.75" width="11.5" height="14" rx="2.25" stroke="#888" stroke-width="1.5"/><rect x="6.75" y="2" width="6.5" height="3.5" rx="1.25" stroke="#888" stroke-width="1.5"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="7" r="4" stroke="#888" stroke-width="1.5"/><path stroke="#888" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3.5" stroke="#888" stroke-width="1.5"/><path stroke="#888" stroke-width="1.5" d="M10 1.75v2.5M10 15.75v2.5M3.64 3.64l1.77 1.77M14.59 14.59l1.77 1.77M1.75 10h2.5M15.75 10h2.5M3.64 16.36l1.77-1.77M14.59 5.41l1.77-1.77"/></svg>`,
  doctor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="6" r="4" stroke="#249" stroke-width="1.5"/><path stroke="#249" stroke-width="1.5" d="M3.5 18c0-3.037 2.486-5.5 6.5-5.5s6.5 2.463 6.5 5.5"/></svg>`,
  patient: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="7" r="4" stroke="#38a169" stroke-width="1.5"/><path stroke="#38a169" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,
  area: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" fill="none" viewBox="0 0 20 20"><rect x="2.25" y="4.25" width="15.5" height="10.5" rx="1.75" stroke="#d69e2e" stroke-width="1.5"/><path stroke="#d69e2e" stroke-width="1.5" d="M6.5 15.75V17a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-1.25"/></svg>`,
  successCheck: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#38a169" stroke-width="2"/><path stroke="#38a169" stroke-width="2" d="M6 10.5l2.5 2 5-5"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><path stroke="#d69e2e" stroke-width="1.5" d="M10 3v8"/><circle cx="10" cy="15" r="1" fill="#d69e2e"/><circle cx="10" cy="10" r="9" stroke="#d69e2e" stroke-width="1.5"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#249" stroke-width="2"/><path stroke="#249" stroke-width="2" d="M10 7v5"/><circle cx="10" cy="14" r="1" fill="#249"/></svg>`,
  // ... agrega otros iconos si es necesario
};

export default function mountDashboard(root, { bus, store, user, role }) {
  const state = {
    stats: {},
    recentAppointments: [],
    isLoading: true
  };

  // Renderizar
  function render() {
    root.innerHTML = `
      <div class="module-dashboard">
        <!-- Header -->
        <div class="card">
          <h1>Bienvenido, ${user.name}</h1>
          <p class="text-muted">Sistema de Gestión Hospitalaria - ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Contenido principal -->
        <div class="grid grid-2">
          <!-- Citas recientes -->
          <div class="card">
            <div class="card-header">
              <h3 style="margin: 0;">Citas recientes</h3>
              <a href="#appointments" class="btn btn-outline btn-sm">Ver todas</a>
            </div>
            <div id="recent-appointments" style="min-height: 200px;">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>

          <!-- Acciones rápidas -->
          <div class="card">
            <div class="card-header">
              <h3 style="margin: 0;">Acciones rápidas</h3>
            </div>
            <div id="quick-actions" style="padding: 0.5rem;">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>
        </div>

        <!-- Información del sistema -->
        <div class="card">
          <h3>Información del sistema</h3>
          <div class="grid grid-3">
            <div>
              <div class="text-muted text-sm">Usuario</div>
              <div class="font-bold">${user.name}</div>
            </div>
            <div>
              <div class="text-muted text-sm">Rol</div>
              <div class="font-bold">${role}</div>
            </div>
            <div>
              <div class="text-muted text-sm">Último acceso</div>
              <div class="font-bold">${new Date().toLocaleTimeString('es-ES')}</div>
            </div>
          </div>
        </div>
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
      
      // Cargar citas recientes
      await loadRecentAppointments();
      
      // Renderizar componentes
      renderStats();
      renderRecentAppointments();
      renderQuickActions();
      
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      showError('Error al cargar los datos');
    } finally {
      state.isLoading = false;
    }
  }

  // Cargar estadísticas
  async function loadStats() {
    const appointments = store.get('appointments');
    const patients = store.get('patients');
    const doctors = store.get('doctors');
    const areas = store.get('areas');
    
    // Filtrar por rol si es necesario
    let filteredAppointments = appointments;
    if (role === 'patient' && user.patientId) {
      filteredAppointments = appointments.filter(a => a.patientId === user.patientId);
    } else if (role === 'doctor' && user.doctorId) {
      filteredAppointments = appointments.filter(a => a.doctorId === user.doctorId);
    }
    
    state.stats = {
      totalAppointments: filteredAppointments.length,
      todayAppointments: store.getTodayAppointments().length,
      upcomingAppointments: store.getUpcomingAppointments(7).length,
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      totalAreas: areas.length,
      pendingAppointments: filteredAppointments.filter(a => a.status === 'scheduled').length,
      completedAppointments: filteredAppointments.filter(a => a.status === 'completed').length
    };
  }

  // Cargar citas recientes
  async function loadRecentAppointments() {
    let appointments = store.get('appointments');
    
    // Filtrar por rol
    if (role === 'patient' && user.patientId) {
      appointments = appointments.filter(a => a.patientId === user.patientId);
    } else if (role === 'doctor' && user.doctorId) {
      appointments = appointments.filter(a => a.doctorId === user.doctorId);
    }
    
    // Ordenar por fecha y limitar
    state.recentAppointments = appointments
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime))
      .slice(0, 5);
  }

  // Renderizar estadísticas
  function renderStats() {
    const container = root.querySelector('#stats-container');
    if (!container) return;
    
    const { stats } = state;
    
    container.innerHTML = `
      <div class="card">
        <div class="text-muted text-sm">Citas totales</div>
        <div class="text-2xl font-bold" style="color: var(--accent);">${stats.totalAppointments}</div>
        <div class="text-xs text-muted mt-1">${icons.calendar} ${stats.todayAppointments} hoy</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Pacientes</div>
        <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.totalPatients}</div>
        <div class="text-xs text-muted mt-1">${icons.user} Registrados</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Médicos</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${stats.totalDoctors}</div>
        <div class="text-xs text-muted mt-1">${icons.doctor} Activos</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Próximas citas</div>
        <div class="text-2xl font-bold" style="color: var(--warning);">${stats.upcomingAppointments}</div>
        <div class="text-xs text-muted mt-1">${icons.warning} 7 días</div>
      </div>
    `;
  }

  // Renderizar citas recientes
  function renderRecentAppointments() {
    const container = root.querySelector('#recent-appointments');
    if (!container) return;
    
    if (state.recentAppointments.length === 0) {
      container.innerHTML = `
        <div class="text-center" style="padding: 3rem 1rem; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;">${icons.calendar}</div>
          <p>No hay citas recientes</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = state.recentAppointments.map(appointment => {
      const patient = store.find('patients', appointment.patientId);
      const doctor = store.find('doctors', appointment.doctorId);
      
      const date = new Date(appointment.dateTime);
      const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      
      // Badge de estado
      const statusColor = {
        scheduled: 'var(--info)',
        confirmed: 'var(--warning)',
        completed: 'var(--success)',
        cancelled: 'var(--danger)'
      };
      
      // Icon for status (use check/alert/info)
      let statusIcon = '';
      switch (appointment.status) {
        case 'completed':
          statusIcon = icons.successCheck;
          break;
        case 'scheduled':
          statusIcon = icons.info;
          break;
        case 'confirmed':
          statusIcon = icons.warning;
          break;
        case 'cancelled':
          statusIcon = '';
          break;
      }
      
      return `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid var(--border);">
          <div style="width: 40px; height: 40px; background: ${statusColor[appointment.status] || 'var(--muted)'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.875rem;">
            ${statusIcon || timeStr}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 500;">${patient?.name || 'Paciente'}</div>
            <div style="font-size: 0.875rem; color: var(--muted);">${doctor?.name || 'Médico'}</div>
          </div>
          <div style="font-size: 0.875rem; color: var(--muted);">${dateStr}</div>
        </div>
      `;
    }).join('');
  }

  // Renderizar acciones rápidas
  function renderQuickActions() {
    const container = root.querySelector('#quick-actions');
    if (!container) return;
    
    const actions = [];
    
    // Acciones según rol
    if (role === 'admin' || role === 'doctor' || role === 'patient') {
      actions.push({
        label: 'Nueva cita',
        icon: icons.calendar,
        href: '#appointments',
        color: 'var(--accent)'
      });
    }
    
    if (role === 'admin' || role === 'doctor') {
      actions.push({
        label: 'Registrar paciente',
        icon: icons.patient,
        href: '#patients',
        color: 'var(--accent-2)'
      });
    }
    
    if (role === 'admin') {
      actions.push({
        label: 'Gestionar médicos',
        icon: icons.doctor,
        href: '#doctors',
        color: 'var(--info)'
      });
      
      actions.push({
        label: 'Gestionar áreas',
        icon: icons.area,
        href: '#areas',
        color: 'var(--warning)'
      });
    }
    
    if (role === 'patient') {
      actions.push({
        label: 'Mi historial',
        icon: icons.clipboard,
        href: '#clinical',
        color: 'var(--success)'
      });
    }

    if (role === 'admin' || role === 'doctor') {
      actions.push({
        label: 'Historia Clínica',
        icon: icons.clipboard,
        href: '#clinical',
        color: 'var(--info)'
      });
    }
    
    actions.push({
      label: 'Configuración',
      icon: icons.settings,
      href: '#settings',
      color: 'var(--muted)'
    });
    
    container.innerHTML = `
      <div class="grid grid-2" style="gap: 0.5rem;">
        ${actions.map(action => `
          <a href="${action.href}" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; text-align: left;">
            <span style="font-size: 1.25rem; display:inline-block;vertical-align:middle">${action.icon}</span>
            <span>${action.label}</span>
          </a>
        `).join('')}
      </div>
    `;
  }

  // Mostrar error
  function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'alert alert-danger';
    errorEl.textContent = message;
    errorEl.style.margin = '1rem 0';
    
    root.appendChild(errorEl);
    
    setTimeout(() => {
      errorEl.remove();
    }, 5000);
  }

  // Suscribirse a eventos
  const unsubscribe = store.subscribe('appointments', () => {
    loadData();
  });

  // Inicializar
  render();
  
  // Retornar API
  return {
    refresh: loadData,
    
    destroy() {
      if (unsubscribe) unsubscribe();
    }
  };
}