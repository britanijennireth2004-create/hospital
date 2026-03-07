/**
 * Módulo de Seguridad Avanzada
 * Auditoría, Gestión de Sesiones, Políticas de Contraseña, Logs de Acceso
 */

export default function mountSecurity(root, { bus, store, user, role }) {
  // Estado local
  const state = {
    activeTab: 'charts',
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
    if (!state.listenersInitialized) {
      setupEventListeners();
      state.listenersInitialized = true;
    }
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
    const modules = {
      'auth': 'Autenticación',
      'patients': 'Pacientes',
      'doctors': 'Médicos',
      'appointments': 'Citas',
      'clinical': 'Historia Clínica',
      'triaje': 'Triaje',
      'areas': 'Áreas',
      'security': 'Seguridad',
      'resources': 'Recursos',
      'treatments': 'Tratamientos'
    };
    return modules[module] || module;
  }

  function getModuleLabel(mod) {
    if (!mod) return 'SISTEMA';
    const labels = {
      'auth': 'AUTENTICACIÓN',
      'patients': 'GESTIÓN DE PACIENTES',
      'doctors': 'MÉDICOS Y TURNOS',
      'appointments': 'CITAS MÉDICAS',
      'clinical': 'HISTORIAS CLÍNICAS',
      'triaje': 'TRIAJE Y EMERGENCIAS',
      'areas': 'INFRAESTRUCTURA',
      'security': 'SEGURIDAD Y PERMISOS',
      'resources': 'RECURSOS Y EQUIPOS',
      'treatments': 'TRATAMIENTOS',
      'landpage': 'PÁGINA PÚBLICA'
    };
    return labels[mod] || mod.toUpperCase();
  }

  function getChartColor(i) {
    const palette = [
      'var(--themePrimary)',   // Azul institucional
      'var(--themeSecondary)', // Azul secundario
      '#7c3aed',               // Violeta
      '#0891b2',               // Cian
      '#059669',               // Esmeralda
      '#db2777',               // Rosa
      '#ea580c',               // Naranja
      '#4f46e5',               // Indigo
      '#9333ea',               // Púrpura
      '#16a34a',               // Verde
      '#2563eb',               // Azul real
      '#be123c'                // Carmesí
    ];
    return palette[i % palette.length];
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        <div style="background: white; padding: 0.5rem; border-radius: 12px 12px 0 0; display: flex; gap: 0.25rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 0;">
          <button class="tab-btn ${state.activeTab === 'charts' ? 'active' : ''}" data-tab="charts" 
            style="padding: 0.75rem 1.25rem; border: none; background: ${state.activeTab === 'charts' ? '#f1f5f9' : 'transparent'}; color: ${state.activeTab === 'charts' ? 'var(--themePrimary)' : '#64748b'}; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.8rem; letter-spacing: 0.05em;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            GRÁFICOS
          </button>
          <button class="tab-btn ${state.activeTab === 'audit' ? 'active' : ''}" data-tab="audit" 
            style="padding: 0.75rem 1.25rem; border: none; background: ${state.activeTab === 'audit' ? '#f1f5f9' : 'transparent'}; color: ${state.activeTab === 'audit' ? 'var(--themePrimary)' : '#64748b'}; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.8rem; letter-spacing: 0.05em;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            LOGS DE AUDITORÍA
          </button>
          <button class="tab-btn ${state.activeTab === 'sessions' ? 'active' : ''}" data-tab="sessions"
            style="padding: 0.75rem 1.25rem; border: none; background: ${state.activeTab === 'sessions' ? '#f1f5f9' : 'transparent'}; color: ${state.activeTab === 'sessions' ? 'var(--themePrimary)' : '#64748b'}; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.8rem; letter-spacing: 0.05em;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            SESIONES
          </button>
          <button class="tab-btn ${state.activeTab === 'policies' ? 'active' : ''}" data-tab="policies"
            style="padding: 0.75rem 1.25rem; border: none; background: ${state.activeTab === 'policies' ? '#f1f5f9' : 'transparent'}; color: ${state.activeTab === 'policies' ? 'var(--themePrimary)' : '#64748b'}; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.8rem; letter-spacing: 0.05em;">
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
      case 'charts': return renderChartsTab();
      case 'audit': return renderAuditTab(paginatedLogs, totalPages);
      case 'sessions': return renderSessionsTab();
      case 'policies': return renderPoliciesTab();
      default: return '';
    }
  }

  function renderChartsTab() {
    const totalLogs = state.auditLogs.length;
    const activeSessions = state.sessions.filter(s => s.isActive).length;
    const totalLoginsToday = state.loginHistory.filter(l => {
      const d = new Date(l.timestamp);
      return d.toDateString() === new Date().toDateString();
    }).length;

    // Procesar datos para gráficos
    const modulesData = {};
    const actionsData = {};
    const rolesData = {};
    const timelineData = {};

    // Pre-llenar los últimos 7 días con 0 para asegurar que el gráfico siempre sea visible
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      timelineData[dateStr] = 0;
    }

    state.auditLogs.forEach(log => {
      modulesData[log.module] = (modulesData[log.module] || 0) + 1;
      actionsData[log.action] = (actionsData[log.action] || 0) + 1;
      rolesData[log.userRole] = (rolesData[log.userRole] || 0) + 1;
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      // Solo sumamos si cae dentro del rango de los últimos 7 días
      if (timelineData.hasOwnProperty(date)) {
        timelineData[date]++;
      }
    });

    const moduleEntries = Object.entries(modulesData).sort((a, b) => b[1] - a[1]);
    const actionEntries = Object.entries(actionsData).sort((a, b) => b[1] - a[1]);
    const roleEntries = Object.entries(rolesData).sort((a, b) => b[1] - a[1]);

    // Preparar Leyenda de Módulos (Top 6 + Otros)
    const moduleLegend = moduleEntries.slice(0, 6);
    if (moduleEntries.length > 6) {
      const othersCount = moduleEntries.slice(6).reduce((acc, curr) => acc + curr[1], 0);
      moduleLegend.push(['OTROS', othersCount]);
    }

    // Preparar Leyenda de Roles (Top 6 + Otros)
    const roleLegend = roleEntries.slice(0, 6);
    if (roleEntries.length > 6) {
      const othersCount = roleEntries.slice(6).reduce((acc, curr) => acc + curr[1], 0);
      roleLegend.push(['OTROS', othersCount]);
    }

    return `
      <div class="animated-fade-in">
        <!-- Bloque de Gráficos de Auditoría -->
        <div class="grid grid-2" style="gap: 2rem; margin-bottom: 2rem;">
          <div class="card" style="padding: 2rem; border: 1px solid rgba(226, 232, 240, 0.8);">
            <h3 style="margin-top: 0; margin-bottom: 2rem; font-size: 1rem; font-weight: 700; color: var(--themeDarker); display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 4px; height: 16px; background: var(--themePrimary); border-radius: 4px;"></span>
              Actividad por Módulo
            </h3>
            <div style="display: flex; align-items: center; gap: 2.5rem;">
              <div style="flex: 1.2; position: relative; max-width: 180px;">
                <svg viewBox="0 0 100 100" style="width: 100%; transform: rotate(-90deg); filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15)); overflow: visible;">
                  ${renderPieChart(moduleEntries, totalLogs, 0)}
                </svg>
              </div>
              <div style="flex: 1;">
                ${moduleLegend.map(([mod, count], i) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem; overflow: hidden;">
                      <div style="width: 12px; height: 12px; border-radius: 3px; background: ${getChartColor(i)}; flex-shrink: 0;"></div>
                      <span style="font-size: 0.7rem; font-weight: 700; color: var(--themeDark); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${getModuleBadge(mod)}">${getModuleBadge(mod)}</span>
                    </div>
                    <span style="font-size: 0.7rem; color: var(--muted); font-weight: 800; flex-shrink: 0;">${Math.round((count / (totalLogs || 1)) * 100)}%</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="card" style="padding: 2rem; border: 1px solid rgba(226, 232, 240, 0.8);">
            <h3 style="margin-top: 0; margin-bottom: 2rem; font-size: 1rem; font-weight: 700; color: var(--themeDarker); display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 4px; height: 16px; background: var(--themeSecondary); border-radius: 4px;"></span>
              Impacto por Roles de Usuario
            </h3>
            <div style="display: flex; align-items: center; gap: 2.5rem;">
               <div style="flex: 1.2; position: relative; max-width: 180px;">
                <svg viewBox="0 0 100 100" style="width: 100%; transform: rotate(-90deg); filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15)); overflow: visible;">
                  ${renderPieChart(roleEntries, totalLogs, 2)}
                </svg>
              </div>
              <div style="flex: 1;">
                ${roleLegend.map(([role, count], i) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.8rem;">
                    <div style="display: flex; align-items: center; gap: 0.6rem; overflow: hidden;">
                      <div style="width: 12px; height: 12px; border-radius: 3px; background: ${getChartColor(i + 2)}; flex-shrink: 0;"></div>
                      <span style="font-size: 0.7rem; font-weight: 700; color: var(--themeDark); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${role || 'SISTEMA'}">${role || 'SISTEMA'}</span>
                    </div>
                    <span style="font-size: 0.7rem; color: var(--muted); font-weight: 800; flex-shrink: 0;">${Math.round((count / (totalLogs || 1)) * 100)}%</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="padding: 2rem; border: 1px solid rgba(226, 232, 240, 0.8); margin-bottom: 2rem;">
            <h3 style="margin-top: 0; margin-bottom: 2rem; font-size: 1rem; font-weight: 700; color: var(--themeDarker); display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 4px; height: 16px; background: var(--themePrimary); border-radius: 4px;"></span>
              Tendencia de Seguridad (Actividad Diaria)
            </h3>
            <div style="height: 120px;">
              <svg viewBox="0 0 1000 120" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible;">
                ${renderAreaChart(timelineData)}
              </svg>
            </div>
          </div>
      </div>
    `;
  }

  function renderDashboardTab() { return ''; }

  function renderPieChart(entries, total, colorOffset = 0) {
    if (!total || total === 0) return '<circle cx="50" cy="50" r="45" fill="#f1f5f9" />';

    let currentAngle = 0;
    const paths = entries.map(([_, count], i) => {
      const percent = count / total;
      if (percent <= 0) return '';

      // Convertir porcentaje a radianes
      const angle = percent * 2 * Math.PI;

      // Calcular puntos (r=45 para dejar un pequeño margen)
      const r = 45;
      const x1 = 50 + r * Math.cos(currentAngle);
      const y1 = 50 + r * Math.sin(currentAngle);

      currentAngle += angle;

      const x2 = 50 + r * Math.cos(currentAngle);
      const y2 = 50 + r * Math.sin(currentAngle);

      // Flag para arcos mayores a 180 grados
      const largeArcFlag = percent > 0.5 ? 1 : 0;

      const color = getChartColor(i + colorOffset);
      const label = entries[i][0];
      const tooltipText = `${getModuleBadge(label)}: ${count} (${Math.round(percent * 100)}%)`;

      // Construir comando de path: M centro L p1 A r r 0 largeArc 1 p2 Z
      return `
      <path d="M 50 50 L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z" 
        fill="${color}" stroke="${color}" stroke-width="0.5" 
        style="cursor: pointer; transition: opacity 0.2s;" 
        onmouseover="this.style.opacity='0.8'" 
        onmouseout="this.style.opacity='1'">
        <title>${tooltipText}</title>
      </path>
    `;
    }).join('');

    return `<g>${paths}</g><circle cx="50" cy="50" r="2.5" fill="white" />`;
  }

  function renderAreaChart(data) {
    const dates = Object.keys(data).sort().slice(-7);
    if (dates.length < 2) return '<div style="text-align:center; padding: 2rem; color: var(--muted);">Sin actividad suficiente para graficar tendencias</div>';

    const maxVal = Math.max(...Object.values(data)) || 10;
    const stepX = 1000 / (dates.length - 1);
    const chartHeight = 100; // Altura interna del gráfico
    const totalHeight = 130; // Altura total con labels

    const points = dates.map((date, i) => {
      const x = i * stepX;
      // Normalizar Y (dejando margen arriba y abajo)
      const y = chartHeight - (data[date] / maxVal) * (chartHeight * 0.7) - (chartHeight * 0.15);
      return `${x},${y}`;
    }).join(' ');

    return `
      <defs>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:var(--themePrimary);stop-opacity:0.35" />
          <stop offset="100%" style="stop-color:var(--themePrimary);stop-opacity:0" />
        </linearGradient>
      </defs>
      
      <!-- Ejes de referencia (líneas horizontales tenues) -->
      <line x1="0" y1="${chartHeight * 0.15}" x2="1000" y2="${chartHeight * 0.15}" stroke="#f1f5f9" stroke-width="1" />
      <line x1="0" y1="${chartHeight * 0.5}" x2="1000" y2="${chartHeight * 0.5}" stroke="#f1f5f9" stroke-width="1" />
      <line x1="0" y1="${chartHeight * 0.85}" x2="1000" y2="${chartHeight * 0.85}" stroke="#f1f5f9" stroke-width="1" />
      
      <!-- Área y Línea -->
      <path d="M0,${chartHeight} L${points} L1000,${chartHeight} Z" fill="url(#areaGrad)" />
      <polyline points="${points}" fill="none" stroke="var(--themePrimary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));" />
      
      <!-- Puntos y Etiquetas -->
      ${dates.map((date, i) => {
      const x = i * stepX;
      const val = data[date];
      const y = chartHeight - (val / maxVal) * (chartHeight * 0.7) - (chartHeight * 0.15);
      const dayLabel = date.split('-').slice(1).reverse().join('/'); // DD/MM

      return `
          <circle cx="${x}" cy="${y}" r="6" fill="white" stroke="var(--themePrimary)" stroke-width="2.5" style="cursor: pointer;">
            <title>Día: ${dayLabel} - Actividad: ${val} eventos</title>
          </circle>
          <text x="${x}" y="${totalHeight - 5}" text-anchor="${i === 0 ? 'start' : (i === dates.length - 1 ? 'end' : 'middle')}" fill="#64748b" style="font-size: 14px; font-weight: 600;">${dayLabel}</text>
          ${val > 0 ? `<text x="${x}" y="${y - 12}" text-anchor="middle" fill="var(--themePrimary)" style="font-size: 12px; font-weight: 800; pointer-events: none;">${val}</text>` : ''}
        `;
    }).join('')}
    `;
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

      <!--Tabla -->
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

      <!--Paginación -->
      ${totalPages > 1 ? `
        <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-outline btn-sm page-btn" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''}>←</button>
          ${Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => `
            <button class="btn btn-sm page-btn ${page === state.currentPage ? 'btn-primary' : 'btn-outline'}" data-page="${page}">${page}</button>
          `).join('')}
          <button class="btn btn-outline btn-sm page-btn" data-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? 'disabled' : ''}>→</button>
        </div>
      ` : ''
      }
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.25rem;"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg> Políticas de Contraseña
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.25rem;"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> Políticas de Sesión
          </h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Timeout de sesión (minutos)</label>
              <input type="number" name="sessionTimeoutMinutes" value="${p.sessionTimeoutMinutes || 480}" min="15" max="1440"
                style="width: 100%; padding: 0.625rem; border-width: 0 0 2px 0; border-color: var(--neutralTertiary); border-radius: var(--radius); background: var(--white);">
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 1rem; align-items: center;">
          <button type="button" class="btn-circle btn-circle-cancel" id="btn-reset-policies" title="Restaurar valores">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
          </button>
          <button type="submit" class="btn-circle btn-circle-save" title="Guardar Políticas">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
          </button>
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
    if (e.target.closest('#btn-clear-filters')) {
      state.filters = { search: '', action: '', module: '', dateFrom: '', dateTo: '' };
      state.currentPage = 1;
      render();
    }

    // Exportar logs
    if (e.target.closest('#btn-export-logs')) {
      exportLogs();
    }

    // Reset políticas
    if (e.target.closest('#btn-reset-policies')) {
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
      id: `audit_${Date.now()} `,
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
    if (!details) return '<div style="color: #64748b; font-size: 0.875rem; font-style: italic;">Sin detalles adicionales</div>';

    let entries = [];
    if (typeof details === 'string') {
      try {
        const parsed = JSON.parse(details);
        entries = Object.entries(parsed);
      } catch (e) {
        return `<div style="word-break: break-all;">${escapeHtml(details)}</div>`;
      }
    } else if (typeof details === 'object') {
      entries = Object.entries(details);
    }

    if (entries.length === 0) return '<div style="color: #64748b; font-size: 0.875rem; font-style: italic;">Sin detalles adicionales</div>';

    return `
      <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; align-items: baseline;">
        ${entries.map(([key, value]) => `
          <div style="font-weight: 700; color: #475569; font-size: 0.75rem; text-transform: uppercase; text-align: right;">${escapeHtml(key)}:</div>
          <div style="font-size: 0.85rem; color: #1e293b; font-family: 'JetBrains Mono', monospace; background: #fff; padding: 4px 8px; border-radius: 4px; border: 1px solid #e2e8f0; word-break: break-all;">
            ${typeof value === 'object' ? JSON.stringify(value, null, 2) : escapeHtml(String(value))}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Mostrar modal de detalles de log
  function showLogDetailsModal(log) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(15, 23, 42, 0.75); display: flex; align-items: center;
      justify-content: center; z-index: 5000; backdrop-filter: blur(8px);
      padding: 1rem; animation: fadeIn 0.15s ease-out;
    `;

    const dateStr = new Date(log.timestamp).toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 650px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Informe Detallado de Auditoría</h3>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">Evento ID: ${log.id}</div>
          </div>
          <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="close-log-modal-icon">&times;</button>
        </div>
        
        <div class="modal-body" style="padding: 2rem; max-height: 75vh; overflow-y: auto;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div>
              <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Fecha y Hora</div>
              <div style="font-weight: 600; color: var(--neutralDark);">${dateStr}</div>
            </div>
            <div>
              <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.25rem;">Módulo Operativo</div>
              <div>${getModuleBadge(log.module)}</div>
            </div>
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; border: 1px solid #e2e8f0; margin-bottom: 1.5rem;">
            <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 700; margin-bottom: 0.75rem;">Responsable de la Acción</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div>
                <div style="font-size: 0.8rem; color: var(--muted);">Usuario</div>
                <div style="font-weight: 700;">${escapeHtml(log.userName)}</div>
              </div>
              <div>
                <div style="font-size: 0.8rem; color: var(--muted);">Rol</div>
                <div style="font-weight: 700; text-transform: uppercase;">${escapeHtml(log.userRole)}</div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 700; margin-bottom: 0.5rem;">Descripción del Evento</div>
            <div style="padding: 1.25rem; background: #fffbe6; border-left: 4px solid var(--themeTertiary); color: #856404; font-weight: 600; line-height: 1.5; border-radius: 0 4px 4px 0;">
              ${escapeHtml(log.description)}
            </div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 700; margin-bottom: 0.75rem;">Trazabilidad Técnica (Detalles JSON)</div>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 1.25rem; border: 1px solid #cbd5e1; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);">
              ${renderLogDetails(log.details)}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: #eff6fc; border: 1px solid var(--themeLight); border-radius: 8px;">
            <div style="font-size: 1.5rem;">🛡️</div>
            <div style="font-size: 0.85rem; color: var(--themeDark); line-height: 1.4;">
              <strong>Registro de Auditoría Verificado:</strong> Esta entrada ha sido generada automáticamente por el motor de seguridad y es inmutable para fines legales y de cumplimiento técnico.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-circle btn-circle-cancel close-modal" id="close-log-btn" title="Cerrar Informe">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.style.opacity = '0';
      setTimeout(() => modal.remove(), 150);
    };

    modal.querySelector('#close-log-modal-icon').addEventListener('click', closeModal);
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
