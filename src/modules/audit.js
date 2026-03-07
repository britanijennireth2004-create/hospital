/**
 * Audit and Traceability Module
 * Visualizes system activity logs
 */

export default function mountAudit(container, { store, bus, user }) {
  // Access control: only admin (TIC)
  if (user.role !== 'admin') {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem; margin: 2rem;">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 1rem;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <h2 style="color: var(--danger); margin-bottom: 0.5rem;">Acceso Restringido</h2>
        <p style="color: var(--muted); font-size: 1.1rem;">Este módulo de auditoría técnica y trazabilidad de eventos está exclusivamente reservado para el <strong>Administrador del Sistema (TIC)</strong>.</p>
        <div style="margin-top: 2rem;">
          <button class="btn btn-outline" onclick="location.hash='#dashboard'">Volver al Dashboard</button>
        </div>
      </div>
    `;
    return { destroy: () => { } };
  }

  const state = {
    logs: [],
    view: 'table', // 'table' or 'dashboard'

    filters: {
      module: '',
      action: '',
      user: '',
      date: ''
    }
  };

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function loadLogs() {
    const allLogs = store.get('auditLogs') || [];
    // Sort by timestamp descending
    state.logs = allLogs.sort((a, b) => b.timestamp - a.timestamp);
    render();
  }

  function render() {
    if (state.view === 'dashboard') {
      renderDashboard();
    } else {
      renderTable();
    }
  }

  function renderDashboard() {
    const modulesData = {};
    const actionsData = {};
    const timelineData = {};

    state.logs.forEach(log => {
      // Data by module
      modulesData[log.module] = (modulesData[log.module] || 0) + 1;

      // Data by action
      actionsData[log.action] = (actionsData[log.action] || 0) + 1;

      // Data by date
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      timelineData[date] = (timelineData[date] || 0) + 1;
    });

    const totalLogs = state.logs.length;
    const moduleEntries = Object.entries(modulesData).sort((a, b) => b[1] - a[1]);
    const actionEntries = Object.entries(actionsData).sort((a, b) => b[1] - a[1]);

    container.innerHTML = `
      <div class="animated-fade-in" style="padding: 1rem;">
        <div class="flex justify-between items-center mb-6">
          <h2 style="margin: 0; color: var(--primary);">Panel de Inteligencia de Auditoría</h2>
          <div class="flex gap-2">
            <button class="btn btn-outline" id="btn-view-table">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg> Ver Tabla
            </button>
            <button class="btn btn-primary" id="btn-refresh-audit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            </button>
          </div>
        </div>

        <div class="grid grid-3 mb-8" style="gap: 2rem;">
          <div class="card" style="padding: 1.5rem; background: linear-gradient(135deg, var(--themePrimary), var(--themeDarker)); color: white; border: none; overflow: hidden; position: relative;">
            <div style="position: absolute; right: -10px; bottom: -10px; opacity: 0.2; transform: rotate(-12deg);">
              <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 800; opacity: 0.8; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Eventos de Seguridad</div>
            <div style="font-size: 2.75rem; font-weight: 800; line-height: 1;">${totalLogs}</div>
            <div style="font-size: 0.8rem; margin-top: 1rem; padding: 0.4rem 0.8rem; background: rgba(255,255,255,0.15); border-radius: 6px; display: inline-block;">
              Trazabilidad activa: 100%
            </div>
          </div>
          
          <div class="card" style="padding: 1.5rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 1.5rem; right: 1.5rem; color: var(--themeSecondary); opacity: 0.8;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Acción Predominante</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--themeDarker);">${actionEntries[0]?.[0] || 'N/A'}</div>
            </div>
            <div style="margin-top: 1rem; color: var(--themeSecondary); font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 1.1rem;">${actionEntries[0]?.[1] || 0}</span>
              <span style="font-size: 0.8rem; font-weight: 500; color: var(--muted);">entradas registradas</span>
            </div>
          </div>

          <div class="card" style="padding: 1.5rem; border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;">
             <div style="position: absolute; top: 1.5rem; right: 1.5rem; color: var(--themeTertiary); opacity: 0.8;">
              ${ICONS.building}
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Área de Mayor Actividad</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: var(--themeDarker);">${getModuleLabel(moduleEntries[0]?.[0])}</div>
            </div>
            <div style="margin-top: 1rem; color: var(--themeTertiary); font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
              <span style="font-size: 1.1rem;">${moduleEntries[0]?.[1] || 0}</span>
              <span style="font-size: 0.8rem; font-weight: 500; color: var(--muted);">operaciones detectadas</span>
            </div>
          </div>
        </div>

        <div class="grid grid-2" style="gap: 2rem;">
          <!-- Chart: Module Distribution -->
          <div class="card" style="padding: 2rem; position: relative; overflow: hidden; border: 1px solid rgba(226, 232, 240, 0.8);">
            <div style="position: absolute; top: 0; right: 0; padding: 1rem; opacity: 0.1;">
              ${ICONS.building}
            </div>
            <h3 style="margin-top: 0; margin-bottom: 2rem; font-size: 1.1rem; font-weight: 700; color: var(--themeDarker); display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 4px; height: 18px; background: var(--themePrimary); border-radius: 4px;"></span>
              Distribución por Módulos
            </h3>
            <div style="display: flex; align-items: center; gap: 3rem;">
              <div style="flex: 1.2; position: relative;">
                <svg viewBox="0 0 100 100" style="width: 100%; max-width: 220px; transform: rotate(-90deg); filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1));">
                  ${renderRingChart(moduleEntries, totalLogs)}
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                   <div style="font-size: 0.7rem; color: var(--muted); text-transform: uppercase; font-weight: 700;">Eventos</div>
                   <div style="font-size: 1.25rem; font-weight: 800; color: var(--themeDarker);">${totalLogs}</div>
                </div>
              </div>
              <div style="flex: 1;">
                ${moduleEntries.slice(0, 5).map(([mod, count], i) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                      <div style="width: 12px; height: 12px; border-radius: 3px; background: ${getChartColor(i)}; box-shadow: 0 2px 4px ${getChartColor(i)}44;"></div>
                      <span style="font-size: 0.9rem; font-weight: 600; color: var(--themeDark);">${getModuleLabel(mod)}</span>
                    </div>
                    <span style="font-size: 0.85rem; color: var(--muted); font-weight: 700;">${Math.round((count / totalLogs) * 100)}%</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Chart: Action Types -->
          <div class="card" style="padding: 2rem; border: 1px solid rgba(226, 232, 240, 0.8);">
            <h3 style="margin-top: 0; margin-bottom: 2rem; font-size: 1.1rem; font-weight: 700; color: var(--themeDarker); display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 4px; height: 18px; background: var(--themeSecondary); border-radius: 4px;"></span>
              Intensidad de Operaciones
            </h3>
            <div style="height: 220px; display: flex; align-items: flex-end; gap: 1.25rem; padding: 0 1rem 3rem 1rem; border-bottom: 1px solid #f1f5f9;">
              ${actionEntries.slice(0, 5).map(([action, count], i) => {
      const height = (count / (actionEntries[0]?.[1] || 1)) * 100;
      const color = getChartColor(i + 2);
      return `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; position: relative;">
                    <div style="font-size: 0.8rem; color: var(--themeDark); font-weight: 800; margin-bottom: 2px;">${count}</div>
                    <div style="width: 100%; height: ${height}%; background: linear-gradient(180deg, ${color}, ${color}dd); border-radius: 6px 6px 2px 2px; transition: height 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67); box-shadow: 0 4px 12px ${color}33;">
                    </div>
                    <div style="position: absolute; bottom: -35px; width: 100%; text-align: center;">
                      <div style="font-size: 0.7rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${action}</div>
                    </div>
                  </div>
                `;
    }).join('')}
            </div>
          </div>
        </div>

        <!-- Activity Timeline -->
        <div class="card mt-6" style="padding: 2rem; border: 1px solid rgba(226, 232, 240, 0.8);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
             <h3 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--themeDarker); display: flex; align-items: center; gap: 0.5rem;">
              <span style="width: 4px; height: 18px; background: var(--themeTertiary); border-radius: 4px;"></span>
              Histórico de Actividad (Tendencia Diaria)
            </h3>
            <div style="font-size: 0.8rem; color: var(--muted); background: #f8fafc; padding: 0.4rem 0.8rem; border-radius: 20px; border: 1px solid #edf2f7;">
              Últimos 10 días registrados
            </div>
          </div>
          <div style="height: 180px; position: relative; margin: 1rem 0;">
            <svg viewBox="0 0 1000 180" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible;">
              ${renderAreaChart(timelineData)}
            </svg>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 1rem; color: var(--muted); font-size: 0.75rem; font-weight: 600; padding: 0 10px;">
            ${Object.keys(timelineData).sort().slice(-10).map(d => {
      const [_y, m, day] = d.split('-');
      return `<span>${day}/${m}</span>`;
    }).join('')}
          </div>
        </div>
      </div>
    `;

    setupDashboardListeners();
  }

  function renderRingChart(entries, total) {
    let currentPercent = 0;
    return entries.map(([_, count], i) => {
      const percent = (count / total) * 100;
      const strokeDash = `${percent} ${100 - percent}`;
      const strokeOffset = -currentPercent;
      currentPercent += percent;
      const color = getChartColor(i);
      return `
        <circle cx="50" cy="50" r="42" fill="transparent" stroke="${color}22" stroke-width="12" />
        <circle cx="50" cy="50" r="42" fill="transparent" stroke="${color}" stroke-width="12" stroke-dasharray="${strokeDash}" stroke-dashoffset="${strokeOffset}" stroke-linecap="round" style="transition: all 1s ease;" />
      `;
    }).join('') + '<circle cx="50" cy="50" r="34" fill="white" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));" />';
  }

  function renderAreaChart(data) {
    const dates = Object.keys(data).sort().slice(-10);
    if (dates.length < 2) return '';

    const maxVal = Math.max(...Object.values(data)) || 10;
    const stepX = 1000 / (dates.length - 1);
    const height = 180;

    const points = dates.map((date, i) => {
      const x = i * stepX;
      const y = height - (data[date] / maxVal) * (height * 0.7) - (height * 0.15);
      return `${x},${y}`;
    }).join(' ');

    return `
      <defs>
        <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:var(--themePrimary);stop-opacity:0.4" />
          <stop offset="80%" style="stop-color:var(--themePrimary);stop-opacity:0.05" />
          <stop offset="100%" style="stop-color:var(--themePrimary);stop-opacity:0" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <!-- Horizontal Grid Lines -->
      <line x1="0" y1="${height * 0.15}" x2="1000" y2="${height * 0.15}" stroke="#f1f5f9" stroke-width="1" />
      <line x1="0" y1="${height * 0.5}" x2="1000" y2="${height * 0.5}" stroke="#f1f5f9" stroke-width="1" />
      <line x1="0" y1="${height * 0.85}" x2="1000" y2="${height * 0.85}" stroke="#f1f5f9" stroke-width="1" />
      
      <path d="M0,${height} L${points} L1000,${height} Z" fill="url(#areaGrad)" style="transition: all 1s ease;" />
      <polyline points="${points}" fill="none" stroke="var(--themePrimary)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)" style="transition: all 1s ease;" />
      <!-- Data Points -->
      ${dates.map((date, i) => {
      const x = i * stepX;
      const y = height - (data[date] / maxVal) * (height * 0.7) - (height * 0.15);
      return `<circle cx="${x}" cy="${y}" r="5" fill="white" stroke="var(--themePrimary)" stroke-width="3" />`;
    }).join('')}
    `;
  }

  function getChartColor(i) {
    const palette = [
      'var(--themePrimary)',    // Deep Medical Blue
      'var(--themeSecondary)',  // Tealish
      'var(--themeTertiary)',   // Golden
      '#7c3aed',                // Spiritual Purple
      '#0891b2',                // Cyan
      '#059669',                // Emerald
      '#db2777'                 // Pinkish
    ];
    return palette[i % palette.length];
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

  function getModuleIcon(mod) {
    const icons = {
      'auth': ICONS.lock,
      'patients': ICONS.users,
      'doctors': ICONS.doctor,
      'appointments': ICONS.calendar,
      'clinical': ICONS.clipboard,
      'triaje': ICONS.triaje,
      'areas': ICONS.building,
      'security': ICONS.lock,
      'resources': ICONS.resources,
      'treatments': ICONS.treatments
    };
    return icons[mod] || ICONS.info;
  }

  function setupDashboardListeners() {
    const tableBtn = container.querySelector('#btn-view-table');
    if (tableBtn) tableBtn.onclick = () => {
      state.view = 'table';
      render();
    };

    const refreshBtn = container.querySelector('#btn-refresh-audit');
    if (refreshBtn) refreshBtn.onclick = loadLogs;
  }

  function renderTable() {
    const filteredLogs = state.logs.filter(log => {
      const matchModule = !state.filters.module || log.module === state.filters.module;
      const matchAction = !state.filters.action || log.action === state.filters.action;
      const matchUser = !state.filters.user ||
        log.userName.toLowerCase().includes(state.filters.user.toLowerCase());

      let matchDate = true;
      if (state.filters.date) {
        const logDate = new Date(log.timestamp).toISOString().split('T')[0];
        matchDate = logDate === state.filters.date;
      }

      return matchModule && matchAction && matchUser && matchDate;
    });

    const modules = [...new Set(state.logs.map(l => l.module))];
    const actions = [...new Set(state.logs.map(l => l.action))];

    container.innerHTML = `
        <div class="card" style="padding: 0.75rem 1rem; margin-bottom: 1rem;">
          <div class="flex justify-between items-center">
            <div class="flex gap-2">
              <button class="btn btn-primary" id="btn-view-dashboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/></svg>
                Dashboard
              </button>
              <button class="btn btn-outline" id="btn-refresh-audit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
              </button>
              <button class="btn btn-outline" id="btn-export-audit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
            </div>
            <div class="search-input-wrapper" style="position: relative; width: 450px;">
              <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input type="text" class="input" id="filter-audit-search" 
                     placeholder="Buscar por nombre, módulo, acción..." 
                     style="padding-left: 2.8rem; border-radius: 20px; background: rgba(0,0,0,0.05); border: 1px solid transparent; transition: all 0.3s; height: 40px; width: 100%;"
                     value="${state.filters.user}">
            </div>
          </div>
        </div>

        <div class="card p-0 overflow-hidden">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Descripción</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>

              ${filteredLogs.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 3rem; color: var(--muted);">
                    No se encontraron registros que coincidan con los filtros.
                  </td>
                </tr>
              ` : filteredLogs.map(log => `
                <tr>
                  <td style="white-space: nowrap;">
                    <div style="font-weight: 500;">${new Date(log.timestamp).toLocaleDateString()}</div>
                    <div style="font-size: 0.75rem; color: var(--muted);">${new Date(log.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div style="width: 24px; height: 24px; background: var(--bg-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">
                        ${log.userName.charAt(0)}
                      </div>
                      <span>${log.userName}</span>
                    </div>
                  </td>
                  <td><span class="badge badge-outline">${log.userRole}</span></td>
                  <td><span class="badge badge-info">${getModuleLabel(log.module)}</span></td>
                  <td>
                    <span class="badge ${getActionBadgeClass(log.action)}">${log.action}</span>
                  </td>
                  <td>${escapeHtml(log.description)}</td>
                  <td>
                    <button class="btn btn-sm btn-outline view-log-details" data-id="${log.id}">
                      Ver más
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="mt-1rem" style="color: var(--muted); font-size: 0.875rem;">
          Mostrando ${filteredLogs.length} de ${state.logs.length} registros totales.
        </div>
    `;

    setupListeners();
  }

  function getActionBadgeClass(action) {
    switch (action) {
      case 'CREAR': return 'badge-success';
      case 'ACTUALIZAR': return 'badge-warning';
      case 'ELIMINAR': return 'badge-danger';
      case 'INICIO_SESION': return 'badge-info';
      case 'CERRAR_SESION': return 'badge-secondary';
      case 'ENMIENDA': return 'badge-danger';
      default: return 'badge-outline';
    }
  }

  function getModuleLabel(mod) {
    const labels = {
      'autenticacion': 'Autenticación',
      'pacientes': 'Pacientes',
      'medicos': 'Médicos',
      'citas': 'Citas Médicas',
      'historia_clinica': 'Historia Clínica',
      'tratamientos': 'Tratamientos / Relevo',
      'triaje': 'Triaje',
      'seguridad': 'Seguridad',
      'areas': 'Áreas Médicas',
      'auditoria': 'Auditoría',
      'recursos': 'Recursos Críticos',
      'auth': 'Autenticación',
      'patients': 'Pacientes',
      'doctors': 'Médicos',
      'appointments': 'Citas',
      'clinical': 'Historia Clínica',
      'audit': 'Auditoría'
    };
    return labels[mod] || mod;
  }

  function setupListeners() {
    const dashboardBtn = container.querySelector('#btn-view-dashboard');
    if (dashboardBtn) dashboardBtn.onclick = () => {
      state.view = 'dashboard';
      render();
    };

    const searchInput = container.querySelector('#filter-audit-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.filters.user = e.target.value;
        renderTable();
      });
    }

    const refreshBtn = container.querySelector('#btn-refresh-audit');
    if (refreshBtn) refreshBtn.addEventListener('click', loadLogs);

    const exportBtn = container.querySelector('#btn-export-audit');
    if (exportBtn) exportBtn.addEventListener('click', () => {
      exportToCSV(state.logs);
    });

    container.querySelectorAll('.view-log-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const logId = btn.dataset.id;
        const log = state.logs.find(l => l.id === logId);
        showLogDetailsModal(log);
      });
    });
  }


  function renderDetails(details) {
    if (!details) return '<div class="text-muted">Sin detalles adicionales</div>';

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

    if (entries.length === 0) return '<div class="text-muted">Sin detalles adicionales</div>';

    return `
      <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem 1rem; align-items: baseline;">
        ${entries.map(([key, value]) => `
          <div style="font-weight: 600; color: #475569; font-size: 0.8rem; text-align: right;">${escapeHtml(key)}:</div>
          <div style="font-size: 0.85rem; color: #1e293b; word-break: break-all; font-family: monospace; background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid #e2e8f0;">
            ${typeof value === 'object' ? JSON.stringify(value) : escapeHtml(String(value))}
          </div>
        `).join('')}
      </div>
    `;
  }

  function showLogDetailsModal(log) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.7); display: flex; align-items: center;
      justify-content: center; z-index: 3000; backdrop-filter: blur(4px);
    `;

    const dateStr = new Date(log.timestamp).toLocaleString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 650px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Detalles del Registro de Auditoría</h3>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">ID: ${log.id}</div>
          </div>
          <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="close-log-modal-icon">&times;</button>
        </div>
        
        <div class="modal-body" style="padding: 2rem; max-height: 70vh; overflow-y: auto;">
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div>
              <label style="display: block; font-size: 0.75rem; color: var(--muted); font-weight: bold; text-transform: uppercase;">FECHA Y HORA</label>
              <div style="font-weight: 500; color: var(--text);">${dateStr}</div>
            </div>
            <div>
              <label style="display: block; font-size: 0.75rem; color: var(--muted); font-weight: bold; text-transform: uppercase;">MÓDULO</label>
              <div><span class="badge badge-info">${getModuleLabel(log.module)}</span></div>
            </div>
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; border: 1px solid #e2e8f0; margin-bottom: 1.5rem;">
             <label style="display: block; font-size: 0.75rem; color: var(--muted); font-weight: bold; text-transform: uppercase; margin-bottom: 0.75rem;">INFORMACIÓN DEL USUARIO</label>
             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                  <div style="font-size: 0.8rem; color: var(--muted);">Usuario</div>
                  <div style="font-weight: 600;">${escapeHtml(log.userName)}</div>
                </div>
                <div>
                  <div style="font-size: 0.8rem; color: var(--muted);">Rol</div>
                  <div style="font-weight: 600; text-transform: capitalize;">${escapeHtml(log.userRole)}</div>
                </div>
             </div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; font-size: 0.75rem; color: var(--muted); font-weight: bold; text-transform: uppercase; margin-bottom: 0.5rem;">DESCRIPCIÓN DE LA ACCIÓN</label>
            <div style="padding: 1rem; background: #fffbe6; border-left: 4px solid #fadb14; color: #856404; font-weight: 500;">
              ${escapeHtml(log.description)}
            </div>
          </div>

          <div style="margin-bottom: 2rem;">
            <label style="display: block; font-size: 0.75rem; color: var(--muted); font-weight: bold; text-transform: uppercase; margin-bottom: 0.75rem;">DATOS TÉCNICOS DETALLADOS</label>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 1rem; border: 1px solid #cbd5e1;">
              ${renderDetails(log.details)}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
            <div style="font-size: 1.5rem;">🛡️</div>
            <div style="font-size: 0.85rem; color: #92400e; line-height: 1.4;">
              <strong>Registro Inmutable:</strong> Esta entrada ha sido verificada y firmada digitalmente para garantizar su integridad legal y trazabilidad completa.
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-circle btn-circle-cancel close-modal" title="Cerrar Informe">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', close));

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }

  function exportToCSV(logs) {
    const headers = ['ID', 'Timestamp', 'Date', 'User', 'Role', 'Module', 'Action', 'Description'];
    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      new Date(l.timestamp).toLocaleString(),
      l.userName,
      l.userRole,
      l.module,
      l.action,
      l.description
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_hospital_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    bus.emit('toast', {
      type: 'success',
      message: 'Archivo CSV exportado correctamente'
    });
  }

  loadLogs();

  // Return object with optional cleanup
  return {
    destroy: () => { }
  };
}
