// ============================================================
//  MÓDULO: MI PERFIL (Paciente)
//  Permite al paciente ver y editar su información personal.
// ============================================================

export default function mountProfile(root, { bus, store, user, role }) {

  // ── Encontrar el registro del paciente vinculado al usuario ──
  function getPatient() {
    // El usuario paciente lleva patientId en su registro
    if (user.patientId) return store.find('patients', user.patientId);
    // Fallback: buscar por email o nombre
    const all = store.get('patients');
    return all.find(p => p.email === user.email || p.name === user.name) || null;
  }

  // ── Estado local ─────────────────────────────────────────────
  const state = { editing: false, patient: getPatient() };

  // ── SVG Icons ────────────────────────────────────────────────
  const I = {
    user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 12 19.79 19.79 0 0 1 1.04 3.38 2 2 0 0 1 3 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    mail: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    map: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    heart: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
    save: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    cancel: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    id: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
  };

  // ── Helpers ──────────────────────────────────────────────────
  function age(birthDate) {
    if (!birthDate) return '—';
    const d = new Date(birthDate);
    const y = new Date().getFullYear() - d.getFullYear();
    return y > 0 ? `${y} años` : '—';
  }
  function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  function notify(msg, type = 'success') {
    bus.emit && bus.emit('notify', { message: msg, type });
  }

  // ── Render ───────────────────────────────────────────────────
  function render() {
    state.patient = getPatient();
    const p = state.patient;

    if (!p) {
      root.innerHTML = `
        <div style="padding:3rem;text-align:center;color:var(--muted);">
          <div style="font-size:3rem;margin-bottom:1rem;opacity:0.3;">${I.user}</div>
          <h3>No se encontró su perfil de paciente</h3>
          <p>Contacte a recepción para vincular su cuenta.</p>
        </div>`;
      return;
    }

    root.innerHTML = state.editing ? renderEditForm(p) : renderView(p);
    setupListeners();
  }

  // ── Vista de solo lectura ─────────────────────────────────────
  function renderView(p) {
    const initials = p.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return `
<style>
.profile-wrap { display:flex; flex-direction:column; gap:1.25rem; max-width:860px; margin:0 auto; }
.profile-hero {
  background: #ffffff;
  border-radius: var(--radius);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border: 1px solid #e2e8f0;
  border-left: 5px solid #059669;
  box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  position: relative;
  overflow: hidden;
}
.profile-hero::before { content: none; }
.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #059669 0%, #065f46 100%);
  border: 3px solid #d1fae5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
  letter-spacing: -1px;
}
.profile-card { background:var(--card-bg); border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; }
.profile-card-header {
  display:flex; align-items:center; gap:0.6rem;
  padding:0.85rem 1.25rem; border-bottom:1px solid var(--border);
  background:var(--sidebar-bg,#f8fafc); font-size:0.72rem;
  font-weight:800; color:var(--muted); letter-spacing:0.07em; text-transform:uppercase;
}
.profile-grid { display:grid; grid-template-columns:1fr 1fr; gap:0; }
.profile-field {
  padding:0.9rem 1.25rem; border-bottom:1px solid var(--border);
  display:flex; flex-direction:column; gap:0.25rem;
}
.profile-field:nth-child(odd) { border-right: 1px solid var(--border); }
.profile-field label { font-size:0.7rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.06em; display:flex; align-items:center; gap:0.35rem; }
.profile-field span  { font-size:0.9rem; color:var(--text); font-weight:500; }
.badge-allergy { display:inline-flex; align-items:center; gap:4px; background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; border-radius:20px; padding:2px 10px; font-size:0.75rem; font-weight:700; margin:2px; }
.badge-ok      { display:inline-flex; align-items:center; gap:4px; background:#f0fdf4; color:#059669; border:1px solid #6ee7b7; border-radius:20px; padding:2px 10px; font-size:0.75rem; font-weight:700; }
.btn-edit-profile {
  display:inline-flex; align-items:center; gap:0.5rem;
  background:#059669; border:none;
  color:#ffffff; padding:0.5rem 1.1rem; border-radius:20px; cursor:pointer;
  font-size:0.82rem; font-weight:700; transition:all 0.2s; margin-left:auto; flex-shrink:0;
}
.btn-edit-profile:hover { background:#047857; }
</style>

<div class="profile-wrap">

  <!-- HERO -->
  <div class="profile-hero">
    <div class="profile-avatar">${initials}</div>
    <div style="flex:1;min-width:0;">
      <h2 style="margin:0;font-size:1.35rem;font-weight:800;color:#1e293b;">${p.name}</h2>
      <p style="margin:0.35rem 0 0;font-size:0.85rem;color:#475569;display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
        <span style="display:inline-flex;align-items:center;gap:0.25rem;">${I.id}<span>DNI: ${p.dni || '—'}</span></span>
        <span style="color:#cbd5e1;">·</span>
        <span style="display:inline-flex;align-items:center;gap:0.25rem;">${I.calendar}<span>${fmtDate(p.birthDate)}</span></span>
        <span style="color:#cbd5e1;">·</span>
        <span style="font-weight:600;color:#334155;">${age(p.birthDate)}</span>
      </p>
      ${p.bloodType ? `
      <p style="margin:0.4rem 0 0;font-size:0.82rem;color:#475569;display:inline-flex;align-items:center;gap:0.3rem;">
        ${I.heart}<span>Grupo sanguíneo:</span>
        <strong style="color:#059669;font-size:0.9rem;">${p.bloodType}</strong>
      </p>` : ''}
    </div>
    <button class="btn-edit-profile" id="btn-edit-profile">${I.edit} Editar Perfil</button>
  </div>

  <!-- DATOS PERSONALES -->
  <div class="profile-card">
    <div class="profile-card-header">${I.user} Datos Personales</div>
    <div class="profile-grid">
      <div class="profile-field"><label>${I.id} DNI / Cédula</label><span>${p.dni || '—'}</span></div>
      <div class="profile-field"><label>${I.calendar} Fecha de Nacimiento</label><span>${fmtDate(p.birthDate)}&nbsp; <small style="color:var(--muted);">(${age(p.birthDate)})</small></span></div>
      <div class="profile-field"><label>Lugar de Nacimiento</label><span>${p.birthPlace || '—'}</span></div>
      <div class="profile-field"><label>Nacionalidad</label><span>${p.nationality || '—'}</span></div>
      <div class="profile-field"><label>Género</label><span>${p.gender === 'M' ? 'Masculino' : p.gender === 'F' ? 'Femenino' : p.gender || '—'}</span></div>
      <div class="profile-field"><label>Estado Civil</label><span>${p.civilStatus || '—'}</span></div>
    </div>
  </div>

  <!-- CONTACTO -->
  <div class="profile-card">
    <div class="profile-card-header">${I.phone} Información de Contacto</div>
    <div class="profile-grid">
      <div class="profile-field"><label>${I.phone} Teléfono</label><span>${p.phone || '—'}</span></div>
      <div class="profile-field"><label>${I.mail} Correo Electrónico</label><span>${p.email || '—'}</span></div>
      <div class="profile-field" style="grid-column:1/-1;border-right:none;"><label>${I.map} Dirección</label><span>${p.address || '—'}</span></div>
    </div>
  </div>

  <!-- DATOS CLÍNICOS -->
  <div class="profile-card">
    <div class="profile-card-header">${I.heart} Datos Clínicos</div>
    <div class="profile-grid">
      <div class="profile-field"><label>${I.heart} Grupo Sanguíneo</label><span>${p.bloodType || '—'}</span></div>
      <div class="profile-field"><label>${I.alert} Alergias</label>
        <span>
          ${p.allergies?.length
        ? p.allergies.map(a => `<span class="badge-allergy">${I.alert} ${a}</span>`).join('')
        : `<span class="badge-ok">${I.check} Sin alergias registradas</span>`}
        </span>
      </div>
    </div>
  </div>

  <!-- CONTACTO DE EMERGENCIA -->
  <div class="profile-card">
    <div class="profile-card-header">${I.alert} Contacto de Emergencia</div>
    <div class="profile-grid">
      <div class="profile-field"><label>Nombre</label><span>${p.emergencyContact?.name || '—'}</span></div>
      <div class="profile-field"><label>Parentesco</label><span>${p.emergencyContact?.relation || '—'}</span></div>
      <div class="profile-field" style="grid-column:1/-1;border-right:none;"><label>${I.phone} Teléfono</label><span>${p.emergencyContact?.phone || '—'}</span></div>
    </div>
  </div>

  <!-- CONSENTIMIENTO -->
  <div class="profile-card">
    <div class="profile-card-header">${I.shield} Consentimiento Informado</div>
    <div class="profile-grid">
      <div class="profile-field">
        <label>Estado</label>
        <span>
          ${p.consent?.granted
        ? `<span class="badge-ok">${I.check} Consentimiento otorgado</span>`
        : `<span class="badge-allergy">${I.alert} Sin consentimiento</span>`}
        </span>
      </div>
      <div class="profile-field"><label>Fecha</label><span>${p.consent?.date ? fmtDate(p.consent.date) : '—'}</span></div>
      <div class="profile-field" style="grid-column:1/-1;border-right:none;border-bottom:none;"><label>Alcance</label><span>${p.consent?.scope || '—'}</span></div>
    </div>
  </div>

</div>`;
  }

  // ── Formulario de edición ─────────────────────────────────────
  function renderEditForm(p) {
    const allergiesStr = (p.allergies || []).join(', ');
    return `
<style>
.profile-edit-wrap { max-width:860px; margin:0 auto; display:flex; flex-direction:column; gap:1.25rem; }
.edit-card  { background:var(--card-bg); border-radius:var(--radius); border:1px solid var(--border); overflow:hidden; }
.edit-hdr   {
  display:flex; align-items:center; gap:0.6rem; padding:0.85rem 1.25rem;
  border-bottom:1px solid var(--border); background:var(--sidebar-bg,#f8fafc);
  font-size:0.72rem; font-weight:800; color:var(--muted); letter-spacing:0.07em; text-transform:uppercase;
}
.edit-body  { padding:1.25rem; display:flex; flex-direction:column; gap:1rem; }
.edit-row   { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.edit-row.full { grid-template-columns:1fr; }
.edit-row.tri  { grid-template-columns:1fr 1fr 1fr; }
.edit-notice {
  background:#eff6ff; border:1px solid #93c5fd; border-radius:8px;
  padding:0.75rem 1rem; font-size:0.82rem; color:#1e40af;
  display:flex; gap:0.6rem; align-items:center;
}
.form-label { font-size:0.72rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; display:block; margin-bottom:0.3rem; }
.edit-actions {
  display:flex; gap:0.75rem; justify-content:flex-end; padding:1rem 1.25rem;
  background:var(--sidebar-bg,#f8fafc); border-top:1px solid var(--border);
}
</style>

<div class="profile-edit-wrap">
  <!-- DATOS PERSONALES -->
  <div class="edit-card">
    <div class="edit-hdr">${I.user} Datos Personales</div>
    <div class="edit-body">
      <div class="edit-row">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Nombre Completo</label>
          <input class="input" id="ef-name" type="text" value="${p.name || ''}" placeholder="Nombre y apellido">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">DNI / Cédula</label>
          <input class="input" id="ef-dni" type="text" value="${p.dni || ''}" placeholder="Ej: 12345678A">
        </div>
      </div>
      <div class="edit-row">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Fecha de Nacimiento</label>
          <input class="input" id="ef-birthdate" type="date" value="${p.birthDate || ''}">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Lugar de Nacimiento</label>
          <input class="input" id="ef-birthplace" type="text" value="${p.birthPlace || ''}" placeholder="Ciudad, Estado">
        </div>
      </div>
      <div class="edit-row">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Género</label>
          <select class="input" id="ef-gender">
            <option value="">— Seleccionar —</option>
            <option value="F" ${p.gender === 'F' ? 'selected' : ''}>Femenino</option>
            <option value="M" ${p.gender === 'M' ? 'selected' : ''}>Masculino</option>
            <option value="Otro" ${p.gender === 'Otro' ? 'selected' : ''}>Otro / No especificado</option>
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Estado Civil</label>
          <select class="input" id="ef-civil">
            <option value="">— Seleccionar —</option>
            ${['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión Libre'].map(o =>
      `<option ${p.civilStatus === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="edit-row">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Nacionalidad</label>
          <input class="input" id="ef-nationality" type="text" value="${p.nationality || ''}" placeholder="País de ciudadanía">
        </div>
      </div>
    </div>
  </div>

  <!-- CONTACTO -->
  <div class="edit-card">
    <div class="edit-hdr">${I.phone} Información de Contacto</div>
    <div class="edit-body">
      <div class="edit-row">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Teléfono</label>
          <input class="input" id="ef-phone" type="tel" value="${p.phone || ''}" placeholder="Ej: 555-0101">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Correo Electrónico</label>
          <input class="input" id="ef-email" type="email" value="${p.email || ''}" placeholder="correo@ejemplo.com">
        </div>
      </div>
      <div class="edit-row full">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Dirección de Residencia</label>
          <input class="input" id="ef-address" type="text" value="${p.address || ''}" placeholder="Calle, número, ciudad">
        </div>
      </div>
    </div>
  </div>

  <!-- DATOS CLÍNICOS (solo alergias editables) -->
  <div class="edit-card">
    <div class="edit-hdr">${I.heart} Datos Clínicos</div>
    <div class="edit-body">
      <div class="edit-row">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Grupo Sanguíneo</label>
          <select class="input" id="ef-blood">
            <option value="">— No especificado —</option>
            ${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bt =>
        `<option ${p.bloodType === bt ? 'selected' : ''}>${bt}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Alergias conocidas <span style="font-weight:400;">(separar por coma)</span></label>
          <input class="input" id="ef-allergies" type="text" value="${allergiesStr}"
                 placeholder="Ej: Penicilina, Ibuprofeno, Mariscos">
        </div>
      </div>
    </div>
  </div>

  <!-- CONTACTO DE EMERGENCIA -->
  <div class="edit-card">
    <div class="edit-hdr">${I.alert} Contacto de Emergencia</div>
    <div class="edit-body">
      <div class="edit-row tri">
        <div class="form-group" style="margin:0;">
          <label class="form-label">Nombre</label>
          <input class="input" id="ef-ec-name" type="text" value="${p.emergencyContact?.name || ''}" placeholder="Nombre completo">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Parentesco</label>
          <input class="input" id="ef-ec-rel" type="text" value="${p.emergencyContact?.relation || ''}" placeholder="Ej: Madre, Cónyuge">
        </div>
        <div class="form-group" style="margin:0;">
          <label class="form-label">Teléfono</label>
          <input class="input" id="ef-ec-phone" type="tel" value="${p.emergencyContact?.phone || ''}" placeholder="555-0000">
        </div>
      </div>
    </div>
  </div>

  <!-- ACCIONES -->
  <div class="edit-card">
    <div class="edit-actions">
      <button class="btn-circle btn-circle-cancel" id="btn-cancel-edit" title="Cancelar">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <button class="btn-circle btn-circle-save" id="btn-save-profile" title="Guardar cambios">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </div>
  </div>

</div>`;
  }

  // ── Event Listeners ───────────────────────────────────────────
  function setupListeners() {
    // Botón editar (vista lectura)
    root.querySelector('#btn-edit-profile')?.addEventListener('click', () => {
      state.editing = true;
      render();
    });

    // Cancelar edición
    root.querySelector('#btn-cancel-edit')?.addEventListener('click', () => {
      state.editing = false;
      render();
    });

    // Guardar cambios
    root.querySelector('#btn-save-profile')?.addEventListener('click', () => {
      const p = state.patient;
      if (!p) return;

      const name = root.querySelector('#ef-name')?.value?.trim();
      if (!name) { notify('El nombre no puede estar vacío.', 'error'); return; }

      // Construir objeto actualizado
      const updated = {
        ...p,
        name,
        dni: root.querySelector('#ef-dni')?.value?.trim() || p.dni,
        birthDate: root.querySelector('#ef-birthdate')?.value || p.birthDate,
        birthPlace: root.querySelector('#ef-birthplace')?.value?.trim() || p.birthPlace,
        gender: root.querySelector('#ef-gender')?.value || p.gender,
        civilStatus: root.querySelector('#ef-civil')?.value || p.civilStatus,
        nationality: root.querySelector('#ef-nationality')?.value?.trim() || p.nationality,
        phone: root.querySelector('#ef-phone')?.value?.trim() || p.phone,
        email: root.querySelector('#ef-email')?.value?.trim() || p.email,
        address: root.querySelector('#ef-address')?.value?.trim() || p.address,
        bloodType: root.querySelector('#ef-blood')?.value || p.bloodType,
        allergies: root.querySelector('#ef-allergies')?.value
          .split(',').map(a => a.trim()).filter(Boolean),
        emergencyContact: {
          name: root.querySelector('#ef-ec-name')?.value?.trim() || p.emergencyContact?.name,
          relation: root.querySelector('#ef-ec-rel')?.value?.trim() || p.emergencyContact?.relation,
          phone: root.querySelector('#ef-ec-phone')?.value?.trim() || p.emergencyContact?.phone,
        },
        updatedAt: Date.now()
      };

      store.update('patients', p.id, updated);
      state.editing = false;
      notify('Perfil actualizado correctamente.', 'success');
      render();
    });
  }

  // ── Iniciar ───────────────────────────────────────────────────
  render();

  return {
    destroy() { root.innerHTML = ''; }
  };
}
