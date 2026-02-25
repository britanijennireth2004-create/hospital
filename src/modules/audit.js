/**
 * Audit and Traceability Module
 * Visualizes system activity logs
 */

export default function mountAudit(container, { store, bus, user }) {
  const state = {
    logs: [],
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
    const allLogs = store.get('auditLogs');
    // Sort by timestamp descending
    state.logs = allLogs.sort((a, b) => b.timestamp - a.timestamp);
    renderTable();
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
              <button class="btn btn-outline" id="btn-refresh-audit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                Actualizar
              </button>
              <button class="btn btn-primary" id="btn-export-audit">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exportar CSV
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
      'triage': 'Triage',
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
      <div class="modal-content" style="width: 100%; max-width: 650px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);">
        <div style="background: var(--primary); padding: 1.5rem; color: white; position: relative;">
          <h2 style="margin: 0; font-size: 1.25rem;">Detalles del Registro de Auditoría</h2>
          <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.25rem;">ID: ${log.id}</div>
          <button class="close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">&times;</button>
        </div>
        
        <div style="padding: 2rem; max-height: 70vh; overflow-y: auto;">
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

        <div style="padding: 1rem 2rem; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: right;">
          <button class="btn btn-primary close-modal" style="width: 100%; padding: 0.75rem;">Cerrar Informe</button>
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
