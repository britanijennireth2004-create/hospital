/**
 * Módulo Dashboard - Vista principal mejorada
 */

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
        <div class="text-xs text-muted mt-1">${stats.todayAppointments} hoy</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Pacientes</div>
        <div class="text-2xl font-bold" style="color: var(--accent-2);">${stats.totalPatients}</div>
        <div class="text-xs text-muted mt-1">Registrados</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Médicos</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${stats.totalDoctors}</div>
        <div class="text-xs text-muted mt-1">Activos</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Próximas citas</div>
        <div class="text-2xl font-bold" style="color: var(--warning);">${stats.upcomingAppointments}</div>
        <div class="text-xs text-muted mt-1">7 días</div>
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
          <div style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;">📅</div>
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
      
      return `
        <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid var(--border);">
          <div style="width: 40px; height: 40px; background: ${statusColor[appointment.status] || 'var(--muted)'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.875rem;">
            ${timeStr}
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
        icon: '📅',
        href: '#appointments',
        color: 'var(--accent)'
      });
    }
    
    if (role === 'admin' || role === 'doctor') {
      actions.push({
        label: 'Registrar paciente',
        icon: '👤',
        href: '#patients',
        color: 'var(--accent-2)'
      });
    }
    
    if (role === 'admin') {
      actions.push({
        label: 'Gestionar médicos',
        icon: '👨‍⚕️',
        href: '#doctors',
        color: 'var(--info)'
      });
      
      actions.push({
        label: 'Gestionar áreas',
        icon: '🏥',
        href: '#areas',
        color: 'var(--warning)'
      });
    }
    
    if (role === 'patient') {
      actions.push({
        label: 'Mi historial',
        icon: '📋',
        href: '#clinical',
        color: 'var(--success)'
      });
    }

    if (role === 'admin' || role === 'doctor') {
      actions.push({
        label: 'Historia Clínica',
        icon: '📋',
        href: '#clinical',
        color: 'var(--info)'
      });
    }
    
    actions.push({
      label: 'Configuración',
      icon: '⚙️',
      href: '#settings',
      color: 'var(--muted)'
    });
    
    container.innerHTML = `
      <div class="grid grid-2" style="gap: 0.5rem;">
        ${actions.map(action => `
          <a href="${action.href}" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; text-align: left;">
            <span style="font-size: 1.25rem;">${action.icon}</span>
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