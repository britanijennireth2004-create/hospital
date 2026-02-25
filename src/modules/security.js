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
    // Validación de acceso: solo admin
    if (role !== 'admin') {
      root.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <h3 style="color: var(--danger);">Acceso Denegado</h3>
          <p class="text-muted">No tienes permisos para acceder al módulo de Seguridad y Auditoría.</p>
        </div>
      `;
      return;
    }

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
    const svgLock = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    const svgUnlock = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';
    const svgPlus = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    const svgEdit = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    const svgTrash = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    const svgEye = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    const badges = {
      'LOGIN': `<span class="badge badge-success">${svgUnlock} Login</span>`,
      'LOGOUT': `<span class="badge badge-info">${svgLock} Logout</span>`,
      'CREATE': `<span class="badge badge-primary">${svgPlus} Crear</span>`,
      'UPDATE': `<span class="badge badge-warning">${svgEdit} Editar</span>`,
      'DELETE': `<span class="badge badge-danger">${svgTrash} Eliminar</span>`,
      'VIEW': `<span class="badge badge-info">${svgEye} Ver</span>`
    };
    return badges[action] || `<span class="badge">${action}</span>`;
  }

  // Obtener badge de módulo
  function getModuleBadge(module) {
    const svgShield = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    const svgUser = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    const svgDocMed = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
    const svgCal = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
    const svgClip = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>';
    const svgPulse = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    const svgBldg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/></svg>';
    const modules = {
      'auth': `${svgShield} Autenticaci\u00f3n`,
      'patients': `${svgUser} Pacientes`,
      'doctors': `${svgDocMed} M\u00e9dicos`,
      'appointments': `${svgCal} Citas`,
      'clinical': `${svgClip} Historia Cl\u00ednica`,
      'triage': `${svgPulse} Triage`,
      'areas': `${svgBldg} \u00c1reas`
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
      <div class="security-module animated-fade-in" style="max-width: 1400px; margin: 0 auto; padding: 1rem;">
        <!-- Stats Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
          <div class="stats-card" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 8px solid var(--triage-red);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="color: #64748b; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Eventos Totales</div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-top: 0.25rem;">${state.auditLogs.length}</div>
              </div>
              <div style="background: transparent; padding: 0.4rem; border-radius: 8px; color: var(--triage-red);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 21L15 15"/><circle cx="10" cy="10" r="7"/></svg>
              </div>
            </div>
          </div>

          <div class="stats-card" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 8px solid var(--triage-green);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="color: #64748b; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Sesiones Activas</div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-top: 0.25rem;">${state.sessions.filter(s => s.isActive).length}</div>
              </div>
              <div style="background: transparent; padding: 0.4rem; border-radius: 8px; color: var(--triage-green);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
            </div>
          </div>

          <div class="stats-card" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 8px solid var(--triage-yellow);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="color: #64748b; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Accesos Hoy</div>
                <div style="font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-top: 0.25rem;">${state.loginHistory.filter(l => {
      const d = new Date(l.timestamp);
      return d.toDateString() === new Date().toDateString();
    }).length}</div>
              </div>
              <div style="background: transparent; padding: 0.4rem; border-radius: 8px; color: var(--triage-yellow);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </div>
            </div>
          </div>

          <div class="stats-card" style="background: white; padding: 1.25rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 8px solid var(--triage-blue);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="color: #64748b; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Seguridad</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #10b981; margin-top: 0.25rem;">PROTEGIDO</div>
              </div>
              <div style="background: transparent; padding: 0.4rem; border-radius: 8px; color: var(--triage-blue);">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Premium -->
        <div style="background: white; padding: 0.5rem; border-radius: 12px 12px 0 0; display: flex; gap: 0.25rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 0;">
          <button class="tab-btn ${state.activeTab === 'audit' ? 'active' : ''}" data-tab="audit" 
            style="padding: 0.75rem 1.5rem; border: none; background: ${state.activeTab === 'audit' ? '#f1f5f9' : 'transparent'}; color: ${state.activeTab === 'audit' ? '#3b82f6' : '#64748b'}; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
            AUDITORÍA
          </button>
          <button class="tab-btn ${state.activeTab === 'sessions' ? 'active' : ''}" data-tab="sessions"
            style="padding: 0.75rem 1.5rem; border: none; background: ${state.activeTab === 'sessions' ? '#f1f5f9' : 'transparent'}; color: ${state.activeTab === 'sessions' ? '#3b82f6' : '#64748b'}; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            SESIONES ACTIVAS
          </button>
          <button class="tab-btn ${state.activeTab === 'logins' ? 'active' : ''}" data-tab="logins"
            style="padding: 0.75rem 1.5rem; border: none; background: ${state.activeTab === 'logins' ? '#f1f5f9' : 'transparent'}; color: ${state.activeTab === 'logins' ? '#3b82f6' : '#64748b'}; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            HISTORIAL DE ACCESO
          </button>
          <button class="tab-btn ${state.activeTab === 'policies' ? 'active' : ''}" data-tab="policies"
            style="padding: 0.75rem 1.5rem; border: none; background: ${state.activeTab === 'policies' ? '#f1f5f9' : 'transparent'}; color: ${state.activeTab === 'policies' ? '#3b82f6' : '#64748b'}; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            POLÍTICAS
          </button>
        </div>

        <!-- Content -->
        <div class="tab-content" style="background: white; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 2rem; min-height: 500px; border: 1px solid #e2e8f0; border-top: none;">
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <button class="btn btn-outline" id="btn-export-logs">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.5rem;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Exportar Logs
        </button>
        <div class="search-input-wrapper" style="position: relative; width: 450px;">
          <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input type="text" id="filter-search" placeholder="Buscar por usuario o descripción..." value="${state.filters.search}"
            style="padding: 0.625rem 1rem 0.625rem 2.8rem; border: 1px solid transparent; border-radius: 20px; font-size: 0.875rem; background: rgba(0,0,0,0.05); transition: all 0.3s; width: 100%; height: 40px;">
        </div>
      </div>

      <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: center;">
        <select id="filter-action" style="padding: 0.625rem 1rem; border: 1px solid var(--border); border-radius: var(--radius); flex: 1;">
          <option value="">Todas las acciones</option>
          <option value="LOGIN" ${state.filters.action === 'LOGIN' ? 'selected' : ''}>Login</option>
          <option value="LOGOUT" ${state.filters.action === 'LOGOUT' ? 'selected' : ''}>Logout</option>
          <option value="CREATE" ${state.filters.action === 'CREATE' ? 'selected' : ''}>Crear</option>
          <option value="UPDATE" ${state.filters.action === 'UPDATE' ? 'selected' : ''}>Editar</option>
          <option value="DELETE" ${state.filters.action === 'DELETE' ? 'selected' : ''}>Eliminar</option>
        </select>
        <select id="filter-module" style="padding: 0.625rem 1rem; border: 1px solid var(--border); border-radius: var(--radius); flex: 1;">
          <option value="">Todos los módulos</option>
          <option value="auth" ${state.filters.module === 'auth' ? 'selected' : ''}>Autenticación</option>
          <option value="patients" ${state.filters.module === 'patients' ? 'selected' : ''}>Pacientes</option>
          <option value="appointments" ${state.filters.module === 'appointments' ? 'selected' : ''}>Citas</option>
          <option value="clinical" ${state.filters.module === 'clinical' ? 'selected' : ''}>Historia Clínica</option>
        </select>
        <button class="btn btn-outline" id="btn-clear-filters" style="white-space: nowrap;">Limpiar</button>
      </div>

      <!-- Tabla -->
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--bg-light); text-align: left;">
              <th style="padding: 0.875rem;">Fecha/Hora</th>
              <th style="padding: 0.875rem;">Usuario</th>
              <th style="padding: 0.875rem;">Módulo</th>
              <th style="padding: 0.875rem;">Acción</th>
              <th style="padding: 0.875rem;">Descripción</th>
              <th style="padding: 0.875rem; text-align: right;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${logs.length ? logs.map(log => `
              <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 0.875rem;">
                  <div style="font-size: 0.875rem;">${formatDateTime(log.timestamp)}</div>
                </td>
                <td style="padding: 0.875rem;">
                  <div style="font-weight: 500;">${log.userName}</div>
                  <div style="font-size: 0.75rem; color: var(--muted);">${log.userRole}</div>
                </td>
                <td style="padding: 0.875rem;">
                  ${getModuleBadge(log.module)}
                </td>
                <td style="padding: 0.875rem;">
                  ${getActionBadge(log.action)}
                </td>
                <td style="padding: 0.875rem;">
                  <div style="font-size: 0.875rem; color: var(--muted);">${log.description}</div>
                </td>
                <td style="padding: 0.875rem; text-align: right;">
                  <button class="btn btn-outline btn-sm btn-view-log" data-id="${log.id}">
                    Ver detalles
                  </button>
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="6" style="padding: 3rem; text-align: center; color: var(--muted);">
                  No hay registros de auditoría
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
        <h3 style="margin: 0 0 0.5rem 0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.25rem;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Sesiones Activas</h3>
        <p style="color: var(--muted); margin: 0;">Gestiona las sesiones de usuario activas en el sistema</p>
      </div>

      <div style="display: grid; gap: 1rem;">
        ${sessions.length ? sessions.map(session => `
          <div style="background: white; border-radius: var(--radius); padding: 1.25rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--modal-border); border-left: 4px solid ${session.isActive ? 'var(--success)' : 'var(--muted)'}; transition: all 0.2s;">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <div class="avatar" style="background: var(--modal-header); color: white;">${session.userName?.charAt(0) || '?'}</div>
              <div>
                <div style="font-weight: 600; color: var(--modal-text);">${session.userName} ${session.userId === user.id ? '<small>(Tú)</small>' : ''}</div>
                <div style="font-size: 0.875rem; color: var(--modal-text-muted);">${session.userRole} • ${session.device}</div>
                <div style="font-size: 0.75rem; color: var(--modal-text-muted); margin-top: 0.25rem;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${session.ipAddress} • <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> ${session.browser}
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
                <button class="btn btn-sm btn-outline btn-terminate-session" data-id="${session.id}" style="border-color: var(--danger); color: var(--danger); margin-top: 0.25rem; font-weight: 600;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.15rem;"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Terminar Sesión
                </button>
              ` : ''}
            </div>
          </div>
        `).join('') : `
          <div style="text-align: center; padding: 3rem; color: var(--muted);">
            <div style="margin-bottom: 1rem;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
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
        <h3 style="margin: 0 0 0.5rem 0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.25rem;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Historial de Acceso</h3>
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
                  ${login.action === 'login' ? '<span class="badge badge-success">Ingreso</span>' : '<span class="badge badge-info">Salida</span>'}
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
                  <div style="margin-bottom: 1rem;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg></div>
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
        <h3 style="margin: 0 0 0.5rem 0;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.25rem;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Políticas de Seguridad</h3>
        <p style="color: var(--muted); margin: 0;">Configuración de contraseñas y sesiones</p>
      </div>

      <form id="policies-form" style="display: grid; gap: 1.5rem;">
        <!-- Políticas de Contraseña -->
        <div style="background: var(--bg-light); padding: 1.25rem; border-radius: var(--radius);">
          <h4 style="margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.25rem;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Políticas de Contraseña
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Longitud mínima</label>
              <input type="number" name="minLength" value="${p.minLength || 8}" min="6" max="20"
                style="width: 100%; padding: 0.625rem; border-width: 0 0 2px 0; border-color: var(--neutralTertiary); border-radius: var(--radius); background: var(--white);">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Días de expiración</label>
              <input type="number" name="expirationDays" value="${p.expirationDays || 90}" min="30" max="365"
                style="width: 100%; padding: 0.625rem; border-width: 0 0 2px 0; border-color: var(--neutralTertiary); border-radius: var(--radius); background: var(--white);">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Historial de contraseñas</label>
              <input type="number" name="preventReuse" value="${p.preventReuse || 3}" min="1" max="10"
                style="width: 100%; padding: 0.625rem; border-width: 0 0 2px 0; border-color: var(--neutralTertiary); border-radius: var(--radius); background: var(--white);">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.25rem;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Políticas de Sesión
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Timeout de sesión (minutos)</label>
              <input type="number" name="sessionTimeoutMinutes" value="${p.sessionTimeoutMinutes || 480}" min="15" max="1440"
                style="width: 100%; padding: 0.625rem; border-width: 0 0 2px 0; border-color: var(--neutralTertiary); border-radius: var(--radius); background: var(--white);">
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem;">
          <button type="button" class="btn btn-outline" id="btn-reset-policies">Restaurar valores</button>
          <button type="submit" class="btn btn-primary"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.25rem;"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar Políticas</button>
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

  async function handleClick(e) {
    // Tabs
    if (e.target.classList.contains('tab-btn')) {
      state.activeTab = e.target.dataset.tab;
      state.currentPage = 1;
      render();
    }

    // Paginación
    if (e.target.classList.contains('page-btn')) {
      const page = parseInt(e.target.dataset.page);
      if (page >= 1) {
        state.currentPage = page;
        render();
      }
    }

    // Limpiar filtros
    if (e.target.id === 'btn-clear-filters') {
      state.filters = { search: '', action: '', module: '', dateFrom: '', dateTo: '' };
      state.currentPage = 1;
      render();
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

    // Ver detalles de log
    if (e.target.classList.contains('btn-view-log')) {
      const logId = e.target.dataset.id;
      const log = state.auditLogs.find(l => l.id === logId);
      if (log) showLogDetailsModal(log);
    }

    // Terminar sesión
    if (e.target.classList.contains('btn-terminate-session')) {
      const sessionId = e.target.dataset.id;
      const session = state.sessions.find(s => s.id === sessionId);

      if (session && await hospitalConfirm(`¿Estás seguro de terminar la sesión de ${session.userName}?`, 'danger')) {
        store.remove('sessions', sessionId);
        state.sessions = store.get('sessions') || [];

        addAuditLog('LOGOUT', 'security', `Sesión de ${session.userName} terminada manualmente por el administrador`);

        render();
        showNotification('Sesión terminada satisfactoriamente', 'success');
      }
    }
  }

  function handleChange(e) {
    if (e.target.id === 'filter-action') {
      state.filters.action = e.target.value;
      state.currentPage = 1;
      render();
    }
    if (e.target.id === 'filter-module') {
      state.filters.module = e.target.value;
      state.currentPage = 1;
      render();
    }
  }

  function handleInput(e) {
    if (e.target.id === 'filter-search') {
      state.filters.search = e.target.value;
      state.currentPage = 1;
      render();
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

      showNotification('Políticas de seguridad actualizadas', 'success');
      render();
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

  // Renderizar detalles de log (JSON)
  function renderLogDetails(details) {
    if (!details || Object.keys(details).length === 0) {
      return '<div style="color: #64748b; font-size: 0.875rem; font-style: italic;">Sin detalles adicionales</div>';
    }

    let entries = Object.entries(details);

    return `
      <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.75rem 1.5rem; align-items: baseline;">
        ${entries.map(([key, value]) => `
          <div style="font-weight: 700; color: #475569; font-size: 0.75rem; text-transform: uppercase; text-align: right;">${key}:</div>
          <div style="font-size: 0.85rem; color: #1e293b; font-family: 'JetBrains Mono', monospace; background: #f8fafc; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; word-break: break-all;">
            ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Mostrar modal de detalles de log
  function showLogDetailsModal(log) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.75); display: flex; align-items: center;
      justify-content: center; z-index: 5000; backdrop-filter: blur(8px);
      padding: 1rem; animation: fadeIn 0.2s ease-out;
    `;

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 700px;">
        <div class="modal-header">
          <h3 class="modal-title">Detalles del Evento de Auditoría</h3>
          <button class="close-modal" id="close-log-modal">&times;</button>
        </div>
        
        <div class="modal-body" style="padding: 1.5rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 600;">Fecha y Hora</div>
              <div style="font-weight: 500;">${formatDateTime(log.timestamp)}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 600;">Módulo</div>
              <div>${getModuleBadge(log.module)}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 600;">Usuario</div>
              <div style="font-weight: 500;">${log.userName} (${log.userRole})</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 600;">Acción</div>
              <div>${getActionBadge(log.action)}</div>
            </div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Descripción</div>
            <div style="padding: 1rem; background: var(--bg-light); border-radius: 4px; border-left: 4px solid var(--accent);">${log.description}</div>
          </div>

          <div>
            <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem;">Detalles Técnicos</div>
            <div style="background: #f1f5f9; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 0.85rem; overflow-x: auto;">
              ${renderLogDetails(log.details)}
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" id="close-log-btn">Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 200);
    };

    modal.querySelector('#close-log-modal').addEventListener('click', closeModal);
    modal.querySelector('#close-log-btn').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  }

  // Mostrar notificación
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `toast toast-${type}`;
    notification.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; padding: 1rem 1.5rem; border-radius: var(--radius); box-shadow: var(--shadow-lg); background: var(--card); animation: toastSlideIn 0.3s ease;';

    const svgCheck = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38a169" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
    const svgX = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    const svgWarn = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d69e2e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    const svgInfo = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3182ce" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    const icons = { success: svgCheck, error: svgX, warning: svgWarn, info: svgInfo };
    notification.innerHTML = `<span>${icons[type] || svgInfo} ${message}</span>`;

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
