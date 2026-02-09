/**
 * Módulo de Seguridad Avanzada
 * Auditoría, Gestión de Sesiones, Políticas de Contraseña, Logs de Acceso
 */

export default function mountSecurity(root, { bus, store, user, role }) {
  // Estado local
  const state = {
    activeTab: 'audit',
    auditLogs: [],
    loginHistory: [],
    sessions: [],
    policies: {},
    filters: {
      search: '',
      action: '',
      module: '',
      dateFrom: '',
      dateTo: ''
    },
    currentPage: 1,
    itemsPerPage: 10
  };

  // Inicializar
  function init() {
    loadData();
    render();
    setupEventListeners();
  }

  // Cargar datos
  function loadData() {
    state.auditLogs = store.get('auditLogs') || [];
    state.loginHistory = store.get('loginHistory') || [];
    state.sessions = store.get('sessions') || [];
    // passwordPolicies es un objeto, no un array
    const policies = store.get('passwordPolicies');
    state.policies = (policies && typeof policies === 'object' && !Array.isArray(policies))
      ? policies
      : {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: 90,
        preventReuse: 3,
        sessionTimeoutMinutes: 480
      };
  }

  // Formatear fecha
  function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // Formatear tiempo relativo
  function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Hace unos segundos';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
    return `Hace ${Math.floor(seconds / 86400)} días`;
  }

  // Obtener badge de acción
  function getActionBadge(action) {
    const badges = {
      'LOGIN': '<span class="badge badge-success">🔓 Login</span>',
      'LOGOUT': '<span class="badge badge-info">🔒 Logout</span>',
      'CREATE': '<span class="badge badge-primary">➕ Crear</span>',
      'UPDATE': '<span class="badge badge-warning">✏️ Editar</span>',
      'DELETE': '<span class="badge badge-danger">🗑️ Eliminar</span>',
      'VIEW': '<span class="badge badge-info">👁️ Ver</span>'
    };
    return badges[action] || `<span class="badge">${action}</span>`;
  }

  // Obtener badge de módulo
  function getModuleBadge(module) {
    const modules = {
      'auth': '🔐 Autenticación',
      'patients': '👤 Pacientes',
      'doctors': '👨‍⚕️ Médicos',
      'appointments': '📅 Citas',
      'clinical': '📋 Historia Clínica',
      'triage': '🚨 Triage',
      'areas': '🏥 Áreas'
    };
    return modules[module] || module;
  }

  // Filtrar logs de auditoría
  function getFilteredAuditLogs() {
    let logs = [...state.auditLogs];

    if (state.filters.search) {
      const search = state.filters.search.toLowerCase();
      logs = logs.filter(log =>
        log.userName?.toLowerCase().includes(search) ||
        log.description?.toLowerCase().includes(search)
      );
    }
    if (state.filters.action) {
      logs = logs.filter(log => log.action === state.filters.action);
    }
    if (state.filters.module) {
      logs = logs.filter(log => log.module === state.filters.module);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Renderizar
  function render() {
    const filteredLogs = getFilteredAuditLogs();
    const totalPages = Math.ceil(filteredLogs.length / state.itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
      (state.currentPage - 1) * state.itemsPerPage,
      state.currentPage * state.itemsPerPage
    );

    root.innerHTML = `
      <div class="security-module">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h1 style="margin: 0; color: var(--text);">🔐 Seguridad del Sistema</h1>
            <p style="color: var(--muted); margin-top: 0.25rem;">Auditoría, sesiones y políticas de seguridad</p>
          </div>
          <button class="btn btn-primary" id="btn-export-logs">
            📥 Exportar Logs
          </button>
        </div>

        <!-- Stats Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="stats-card" style="background: var(--card); padding: 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow);">
            <div style="font-size: 2rem; font-weight: bold; color: var(--accent);">${state.auditLogs.length}</div>
            <div style="color: var(--muted); font-size: 0.875rem;">Eventos Registrados</div>
          </div>
          <div class="stats-card" style="background: var(--card); padding: 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow);">
            <div style="font-size: 2rem; font-weight: bold; color: var(--info);">${state.sessions.filter(s => s.isActive).length}</div>
            <div style="color: var(--muted); font-size: 0.875rem;">Sesiones Activas</div>
          </div>
          <div class="stats-card" style="background: var(--card); padding: 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow);">
            <div style="font-size: 2rem; font-weight: bold; color: var(--success);">${state.loginHistory.filter(l => l.success).length}</div>
            <div style="color: var(--muted); font-size: 0.875rem;">Accesos Exitosos</div>
          </div>
          <div class="stats-card" style="background: var(--card); padding: 1.25rem; border-radius: var(--radius); box-shadow: var(--shadow);">
            <div style="font-size: 2rem; font-weight: bold; color: var(--warning);">${state.policies.sessionTimeoutMinutes || 480} min</div>
            <div style="color: var(--muted); font-size: 0.875rem;">Timeout de Sesión</div>
          </div>
        </div>

        <!-- Tabs -->
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem; border-bottom: 2px solid var(--border); padding-bottom: 0;">
          <button class="tab-btn ${state.activeTab === 'audit' ? 'active' : ''}" data-tab="audit" 
            style="padding: 0.75rem 1.25rem; border: none; background: ${state.activeTab === 'audit' ? 'var(--accent)' : 'transparent'}; color: ${state.activeTab === 'audit' ? 'white' : 'var(--text)'}; border-radius: var(--radius) var(--radius) 0 0; cursor: pointer; font-weight: 500;">
            📋 Auditoría
          </button>
          <button class="tab-btn ${state.activeTab === 'sessions' ? 'active' : ''}" data-tab="sessions"
            style="padding: 0.75rem 1.25rem; border: none; background: ${state.activeTab === 'sessions' ? 'var(--accent)' : 'transparent'}; color: ${state.activeTab === 'sessions' ? 'white' : 'var(--text)'}; border-radius: var(--radius) var(--radius) 0 0; cursor: pointer; font-weight: 500;">
            💻 Sesiones
          </button>
          <button class="tab-btn ${state.activeTab === 'logins' ? 'active' : ''}" data-tab="logins"
            style="padding: 0.75rem 1.25rem; border: none; background: ${state.activeTab === 'logins' ? 'var(--accent)' : 'transparent'}; color: ${state.activeTab === 'logins' ? 'white' : 'var(--text)'}; border-radius: var(--radius) var(--radius) 0 0; cursor: pointer; font-weight: 500;">
            🔑 Historial de Acceso
          </button>
          <button class="tab-btn ${state.activeTab === 'policies' ? 'active' : ''}" data-tab="policies"
            style="padding: 0.75rem 1.25rem; border: none; background: ${state.activeTab === 'policies' ? 'var(--accent)' : 'transparent'}; color: ${state.activeTab === 'policies' ? 'white' : 'var(--text)'}; border-radius: var(--radius) var(--radius) 0 0; cursor: pointer; font-weight: 500;">
            ⚙️ Políticas
          </button>
        </div>

        <!-- Content -->
        <div class="tab-content" style="background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 1.5rem;">
          ${renderTabContent(paginatedLogs, totalPages)}
        </div>
      </div>
    `;
  }

  // Renderizar contenido de tab
  function renderTabContent(paginatedLogs, totalPages) {
    switch (state.activeTab) {
      case 'audit': return renderAuditTab(paginatedLogs, totalPages);
      case 'sessions': return renderSessionsTab();
      case 'logins': return renderLoginsTab();
      case 'policies': return renderPoliciesTab();
      default: return '';
    }
  }

  // Tab de Auditoría
  function renderAuditTab(logs, totalPages) {
    return `
      <!-- Filtros -->
      <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <input type="text" id="filter-search" placeholder="🔍 Buscar..." value="${state.filters.search}"
          style="flex: 1; min-width: 200px; padding: 0.625rem 1rem; border: 1px solid var(--border); border-radius: var(--radius); font-size: 0.875rem;">
        <select id="filter-action" style="padding: 0.625rem 1rem; border: 1px solid var(--border); border-radius: var(--radius);">
          <option value="">Todas las acciones</option>
          <option value="LOGIN" ${state.filters.action === 'LOGIN' ? 'selected' : ''}>Login</option>
          <option value="LOGOUT" ${state.filters.action === 'LOGOUT' ? 'selected' : ''}>Logout</option>
          <option value="CREATE" ${state.filters.action === 'CREATE' ? 'selected' : ''}>Crear</option>
          <option value="UPDATE" ${state.filters.action === 'UPDATE' ? 'selected' : ''}>Editar</option>
          <option value="DELETE" ${state.filters.action === 'DELETE' ? 'selected' : ''}>Eliminar</option>
        </select>
        <select id="filter-module" style="padding: 0.625rem 1rem; border: 1px solid var(--border); border-radius: var(--radius);">
          <option value="">Todos los módulos</option>
          <option value="auth" ${state.filters.module === 'auth' ? 'selected' : ''}>Autenticación</option>
          <option value="patients" ${state.filters.module === 'patients' ? 'selected' : ''}>Pacientes</option>
          <option value="appointments" ${state.filters.module === 'appointments' ? 'selected' : ''}>Citas</option>
          <option value="clinical" ${state.filters.module === 'clinical' ? 'selected' : ''}>Historia Clínica</option>
        </select>
        <button class="btn btn-outline btn-sm" id="btn-clear-filters">Limpiar</button>
      </div>

      <!-- Tabla -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--bg-light); text-align: left;">
              <th style="padding: 0.875rem; font-weight: 600; color: var(--text);">Fecha/Hora</th>
              <th style="padding: 0.875rem; font-weight: 600; color: var(--text);">Usuario</th>
              <th style="padding: 0.875rem; font-weight: 600; color: var(--text);">Acción</th>
              <th style="padding: 0.875rem; font-weight: 600; color: var(--text);">Módulo</th>
              <th style="padding: 0.875rem; font-weight: 600; color: var(--text);">Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length ? logs.map(log => `
              <tr style="border-bottom: 1px solid var(--border);" class="table-row-hover">
                <td style="padding: 0.875rem;">
                  <div style="font-size: 0.875rem;">${formatDateTime(log.timestamp)}</div>
                  <div style="font-size: 0.75rem; color: var(--muted);">${timeAgo(log.timestamp)}</div>
                </td>
                <td style="padding: 0.875rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div class="avatar avatar-sm">${log.userName?.charAt(0) || '?'}</div>
                    <div>
                      <div style="font-weight: 500;">${log.userName || 'Desconocido'}</div>
                      <div style="font-size: 0.75rem; color: var(--muted);">${log.userRole || ''}</div>
                    </div>
                  </div>
                </td>
                <td style="padding: 0.875rem;">${getActionBadge(log.action)}</td>
                <td style="padding: 0.875rem; font-size: 0.875rem;">${getModuleBadge(log.module)}</td>
                <td style="padding: 0.875rem; font-size: 0.875rem; max-width: 250px;">${log.description || '-'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="padding: 3rem; text-align: center; color: var(--muted);">
                  <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                  <div>No hay registros de auditoría</div>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      ${totalPages > 1 ? `
        <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-outline btn-sm page-btn" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''}>←</button>
          ${Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => `
            <button class="btn btn-sm page-btn ${page === state.currentPage ? 'btn-primary' : 'btn-outline'}" data-page="${page}">${page}</button>
          `).join('')}
          <button class="btn btn-outline btn-sm page-btn" data-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? 'disabled' : ''}>→</button>
        </div>
      ` : ''}
    `;
  }

  // Tab de Sesiones
  function renderSessionsTab() {
    const sessions = state.sessions;
    return `
      <div style="margin-bottom: 1rem;">
        <h3 style="margin: 0 0 0.5rem 0;">💻 Sesiones Activas</h3>
        <p style="color: var(--muted); margin: 0;">Gestiona las sesiones de usuario activas en el sistema</p>
      </div>

      <div style="display: grid; gap: 1rem;">
        ${sessions.length ? sessions.map(session => `
          <div style="background: white; border-radius: var(--radius); padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--modal-border); border-left: 4px solid ${session.isActive ? 'var(--success)' : 'var(--muted)'};">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="avatar" style="background: var(--modal-header); color: white;">${session.userName?.charAt(0) || '?'}</div>
              <div>
                <div style="font-weight: 600; color: var(--modal-text);">${session.userName} ${session.userId === user.id ? '<small>(Tú)</small>' : ''}</div>
                <div style="font-size: 0.875rem; color: var(--modal-text-muted);">${session.userRole} • ${session.device}</div>
                <div style="font-size: 0.75rem; color: var(--modal-text-muted); margin-top: 0.25rem;">
                  📍 ${session.ipAddress} • 🌐 ${session.browser}
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
              <div style="font-size: 0.875rem;">
                ${session.isActive ? '<span class="badge badge-success">● Activa</span>' : '<span class="badge">Inactiva</span>'}
              </div>
              <div style="text-align: right; font-size: 0.75rem; color: var(--modal-text-muted);">
                <div>Inicio: ${formatDateTime(session.startTime)}</div>
                <div>Última: ${timeAgo(session.lastActivity)}</div>
              </div>
              ${session.userId !== user.id ? `
                <button class="btn btn-sm btn-outline btn-terminate-session" data-id="${session.id}" style="border-color: var(--danger); color: var(--danger); margin-top: 0.25rem;">
                  🚫 Terminar Sesión
                </button>
              ` : ''}
            </div>
          </div>
        `).join('') : `
          <div style="text-align: center; padding: 3rem; color: var(--muted);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💻</div>
            <div>No hay sesiones activas</div>
          </div>
        `}
      </div>
    `;
  }

  // Tab de Historial de Login
  function renderLoginsTab() {
    const logins = [...state.loginHistory].sort((a, b) => b.timestamp - a.timestamp);
    return `
      <div style="margin-bottom: 1rem;">
        <h3 style="margin: 0 0 0.5rem 0;">🔑 Historial de Acceso</h3>
        <p style="color: var(--muted); margin: 0;">Registro de todos los inicios y cierres de sesión</p>
      </div>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--bg-light); text-align: left;">
              <th style="padding: 0.875rem;">Fecha/Hora</th>
              <th style="padding: 0.875rem;">Usuario</th>
              <th style="padding: 0.875rem;">Acción</th>
              <th style="padding: 0.875rem;">Estado</th>
              <th style="padding: 0.875rem;">Dispositivo</th>
              <th style="padding: 0.875rem;">IP</th>
            </tr>
          </thead>
          <tbody>
            ${logins.length ? logins.map(login => `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 0.875rem;">
                  <div style="font-size: 0.875rem;">${formatDateTime(login.timestamp)}</div>
                </td>
                <td style="padding: 0.875rem;">
                  <div style="font-weight: 500;">${login.userName}</div>
                  <div style="font-size: 0.75rem; color: var(--muted);">${login.userRole}</div>
                </td>
                <td style="padding: 0.875rem;">
                  ${login.action === 'login' ? '<span class="badge badge-success">🔓 Ingreso</span>' : '<span class="badge badge-info">🔒 Salida</span>'}
                </td>
                <td style="padding: 0.875rem;">
                  ${login.success ? '<span class="badge badge-success">✓ Exitoso</span>' : '<span class="badge badge-danger">✗ Fallido</span>'}
                </td>
                <td style="padding: 0.875rem; font-size: 0.875rem;">
                  <div>${login.device}</div>
                  <div style="font-size: 0.75rem; color: var(--muted);">${login.browser}</div>
                </td>
                <td style="padding: 0.875rem; font-size: 0.875rem; font-family: monospace;">${login.ipAddress}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" style="padding: 3rem; text-align: center; color: var(--muted);">
                  <div style="font-size: 3rem; margin-bottom: 1rem;">🔑</div>
                  <div>No hay historial de acceso</div>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;
  }

  // Tab de Políticas
  function renderPoliciesTab() {
    const p = state.policies;
    return `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem 0;">⚙️ Políticas de Seguridad</h3>
        <p style="color: var(--muted); margin: 0;">Configuración de contraseñas y sesiones</p>
      </div>

      <form id="policies-form" style="display: grid; gap: 1.5rem;">
        <!-- Políticas de Contraseña -->
        <div style="background: var(--bg-light); padding: 1.25rem; border-radius: var(--radius);">
          <h4 style="margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
            🔑 Políticas de Contraseña
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Longitud mínima</label>
              <input type="number" name="minLength" value="${p.minLength || 8}" min="6" max="20"
                style="width: 100%; padding: 0.625rem; border: 1px solid var(--border); border-radius: var(--radius);">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Días de expiración</label>
              <input type="number" name="expirationDays" value="${p.expirationDays || 90}" min="30" max="365"
                style="width: 100%; padding: 0.625rem; border: 1px solid var(--border); border-radius: var(--radius);">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Historial de contraseñas</label>
              <input type="number" name="preventReuse" value="${p.preventReuse || 3}" min="1" max="10"
                style="width: 100%; padding: 0.625rem; border: 1px solid var(--border); border-radius: var(--radius);">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" name="requireUppercase" ${p.requireUppercase ? 'checked' : ''}>
              <span>Requiere mayúsculas</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" name="requireLowercase" ${p.requireLowercase ? 'checked' : ''}>
              <span>Requiere minúsculas</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" name="requireNumbers" ${p.requireNumbers ? 'checked' : ''}>
              <span>Requiere números</span>
            </label>
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" name="requireSpecialChars" ${p.requireSpecialChars ? 'checked' : ''}>
              <span>Requiere caracteres especiales</span>
            </label>
          </div>
        </div>

        <!-- Políticas de Sesión -->
        <div style="background: var(--bg-light); padding: 1.25rem; border-radius: var(--radius);">
          <h4 style="margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
            💻 Políticas de Sesión
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Timeout de sesión (minutos)</label>
              <input type="number" name="sessionTimeoutMinutes" value="${p.sessionTimeoutMinutes || 480}" min="15" max="1440"
                style="width: 100%; padding: 0.625rem; border: 1px solid var(--border); border-radius: var(--radius);">
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
          <button type="button" class="btn btn-outline" id="btn-reset-policies">Restaurar valores</button>
          <button type="submit" class="btn btn-primary">💾 Guardar Políticas</button>
        </div>
      </form>
    `;
  }

  // Setup Event Listeners
  function setupEventListeners() {
    root.addEventListener('click', handleClick);
    root.addEventListener('change', handleChange);
    root.addEventListener('input', handleInput);
    root.addEventListener('submit', handleSubmit);
  }

  function handleClick(e) {
    // Tabs
    if (e.target.classList.contains('tab-btn')) {
      state.activeTab = e.target.dataset.tab;
      state.currentPage = 1;
      render();
      setupEventListeners();
    }

    // Paginación
    if (e.target.classList.contains('page-btn')) {
      const page = parseInt(e.target.dataset.page);
      if (page >= 1) {
        state.currentPage = page;
        render();
        setupEventListeners();
      }
    }

    // Limpiar filtros
    if (e.target.id === 'btn-clear-filters') {
      state.filters = { search: '', action: '', module: '', dateFrom: '', dateTo: '' };
      state.currentPage = 1;
      render();
      setupEventListeners();
    }

    // Exportar logs
    if (e.target.id === 'btn-export-logs') {
      exportLogs();
    }

    // Reset políticas
    if (e.target.id === 'btn-reset-policies') {
      state.policies = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        expirationDays: 90,
        preventReuse: 3,
        sessionTimeoutMinutes: 480
      };
      render();
      setupEventListeners();
      showNotification('Políticas restauradas a valores predeterminados', 'info');
    }

    // Terminar sesión
    if (e.target.classList.contains('btn-terminate-session')) {
      const sessionId = e.target.dataset.id;
      const session = state.sessions.find(s => s.id === sessionId);

      if (session && confirm(`¿Estás seguro de terminar la sesión de ${session.userName}?`)) {
        store.remove('sessions', sessionId);
        state.sessions = store.get('sessions') || [];

        addAuditLog('LOGOUT', 'security', `Sesión de ${session.userName} terminada manualmente por el administrador`);

        render();
        setupEventListeners();
        showNotification('Sesión terminada satisfactoriamente', 'success');
      }
    }
  }

  function handleChange(e) {
    if (e.target.id === 'filter-action') {
      state.filters.action = e.target.value;
      state.currentPage = 1;
      render();
      setupEventListeners();
    }
    if (e.target.id === 'filter-module') {
      state.filters.module = e.target.value;
      state.currentPage = 1;
      render();
      setupEventListeners();
    }
  }

  function handleInput(e) {
    if (e.target.id === 'filter-search') {
      state.filters.search = e.target.value;
      state.currentPage = 1;
      render();
      setupEventListeners();
    }
  }

  function handleSubmit(e) {
    if (e.target.id === 'policies-form') {
      e.preventDefault();
      const formData = new FormData(e.target);

      state.policies = {
        minLength: parseInt(formData.get('minLength')) || 8,
        requireUppercase: formData.has('requireUppercase'),
        requireLowercase: formData.has('requireLowercase'),
        requireNumbers: formData.has('requireNumbers'),
        requireSpecialChars: formData.has('requireSpecialChars'),
        expirationDays: parseInt(formData.get('expirationDays')) || 90,
        preventReuse: parseInt(formData.get('preventReuse')) || 3,
        sessionTimeoutMinutes: parseInt(formData.get('sessionTimeoutMinutes')) || 480
      };

      // Guardar en localStorage (passwordPolicies no es una colección de arrays)
      try {
        const storageKey = 'hospital_prototype_v3';
        const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
        data.passwordPolicies = state.policies;
        localStorage.setItem(storageKey, JSON.stringify(data));
      } catch (err) {
        console.error('Error guardando políticas:', err);
      }

      // Registrar en auditoría
      addAuditLog('UPDATE', 'security', 'Políticas de seguridad actualizadas');

      showNotification('Políticas guardadas correctamente', 'success');
    }
  }

  // Exportar logs
  function exportLogs() {
    const logs = getFilteredAuditLogs();
    const csvContent = [
      ['Fecha', 'Usuario', 'Rol', 'Acción', 'Módulo', 'Descripción'].join(','),
      ...logs.map(log => [
        formatDateTime(log.timestamp),
        log.userName,
        log.userRole,
        log.action,
        log.module,
        `"${log.description || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    showNotification('Logs exportados correctamente', 'success');
  }

  // Agregar log de auditoría
  function addAuditLog(action, module, description, details = {}) {
    const log = {
      id: `audit_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      module,
      description,
      details,
      timestamp: Date.now()
    };
    store.add('auditLogs', log);
    state.auditLogs = store.get('auditLogs');
  }

  // Mostrar notificación
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `toast toast-${type}`;
    notification.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; padding: 1rem 1.5rem; border-radius: var(--radius); box-shadow: var(--shadow-lg); background: var(--card); animation: toastSlideIn 0.3s ease;';

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    notification.innerHTML = `<span>${icons[type] || 'ℹ️'} ${message}</span>`;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  // Destroy
  function destroy() {
    root.removeEventListener('click', handleClick);
    root.removeEventListener('change', handleChange);
    root.removeEventListener('input', handleInput);
    root.removeEventListener('submit', handleSubmit);
  }

  // Inicializar
  init();

  return { destroy };
}
