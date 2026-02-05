/**
 * Módulo de Áreas - Placeholder
 */

export default function mountAreas(root, { bus, store, user, role }) {
  root.innerHTML = `
    <div class="module-areas">
      <div class="card">
        <h2>Áreas Médicas</h2>
        <p class="text-muted">Departamentos y especialidades del hospital</p>
      </div>
      
      <div class="grid grid-4">
        ${store.get('areas').map(area => `
          <div class="card" style="border-left: 4px solid ${area.color || 'var(--accent)'};">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 40px; height: 40px; background: ${area.color || 'var(--accent)'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem;">
                ${area.name.charAt(0)}
              </div>
              <div style="font-weight: 500; font-size: 1.125rem;">${area.name}</div>
            </div>
            
            <p style="color: var(--muted); font-size: 0.875rem; margin-bottom: 1rem;">
              ${area.description || 'Sin descripción'}
            </p>
            
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: var(--muted);">Médicos:</span>
              <span style="font-weight: 500;">
                ${store.get('doctors').filter(d => d.areaId === area.id).length}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <h3>Gestión de áreas</h3>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Área</th>
                <th>Descripción</th>
                <th>Médicos asignados</th>
                <th>Citas este mes</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${store.get('areas').map(area => {
                const doctors = store.get('doctors').filter(d => d.areaId === area.id);
                const appointments = store.get('appointments').filter(a => a.areaId === area.id);
                
                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: ${area.color}; border-radius: 50%;"></div>
                        <span>${area.name}</span>
                      </div>
                    </td>
                    <td>${area.description || '-'}</td>
                    <td>${doctors.length}</td>
                    <td>${appointments.length}</td>
                    <td>
                      <span class="badge ${area.isActive ? 'badge-success' : 'badge-danger'}">
                        ${area.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  return {
    destroy() {
      // Limpiar recursos si es necesario
    }
  };
}