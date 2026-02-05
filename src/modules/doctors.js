/**
 * Módulo de Médicos - Placeholder
 */

export default function mountDoctors(root, { bus, store, user, role }) {
  root.innerHTML = `
    <div class="module-doctors">
      <div class="card">
        <h2>Médicos</h2>
        <p class="text-muted">Gestión del personal médico</p>
      </div>
      
      <div class="grid grid-3">
        ${store.get('doctors').map(doctor => `
          <div class="card">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <div style="width: 60px; height: 60px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">
                ${doctor.name.charAt(0)}
              </div>
              <div>
                <div style="font-weight: 500; font-size: 1.125rem;">${doctor.name}</div>
                <div style="color: var(--muted); font-size: 0.875rem;">${doctor.specialty}</div>
              </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--muted);">Licencia:</span>
                <span style="font-weight: 500;">${doctor.license}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--muted);">Horario:</span>
                <span style="font-weight: 500;">${doctor.schedule}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--muted);">Teléfono:</span>
                <span style="font-weight: 500;">${doctor.phone}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--muted);">Email:</span>
                <span style="font-weight: 500;">${doctor.email}</span>
              </div>
            </div>
            
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
              <button class="btn btn-outline btn-sm" style="flex: 1;">Ver agenda</button>
              <button class="btn btn-outline btn-sm" style="flex: 1;">Contactar</button>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <div class="text-center" style="padding: 2rem;">
          <h3>Gestión de médicos</h3>
          <p class="text-muted" style="margin-bottom: 1.5rem;">
            Esta funcionalidad completa estará disponible próximamente
          </p>
          <div style="display: inline-flex; gap: 1rem;">
            <button class="btn btn-outline" disabled>Agregar médico</button>
            <button class="btn btn-outline" disabled>Asignar horarios</button>
            <button class="btn btn-outline" disabled>Generar reportes</button>
          </div>
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