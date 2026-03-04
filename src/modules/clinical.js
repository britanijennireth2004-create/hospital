/**
 * Módulo de Historia Clínica Electrónica
 * Vista principal: lista de pacientes (igual que módulo de pacientes)
 * Vista secundaria: expediente completo del paciente con timeline de registros
 */
export default function mountClinical(root, { bus, store, user, role }) {

  // ── Estado ────────────────────────────────────────────────────────────────
  const state = {
    patients: [],
    filtered: [],
    paginated: [],
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10,
    search: '',
    sortBy: 'name',
    selectedPatient: null,   // paciente cuyo expediente estamos viendo
    editingRecord: null,     // registro que se está editando (null = nuevo)
    showRecordModal: false
  };

  // ── Iconos ────────────────────────────────────────────────────────────────
  const ic = {
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M13 13l4 4"/></svg>`,
    clinical: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><rect x="3.25" y="2.75" width="13.5" height="14.5" rx="1.75" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6.5 6h7M6.5 10h7M6.5 14h4"/></svg>`,
    plus: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M4 10h12M10 4v12"/></svg>`,
    back: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M12 4L6 10l6 6"/></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M5 5l10 10M15 5L5 15"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M4 10l4 4 8-8"/></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M14.5 2.5l3 3L6 17H3v-3L14.5 2.5z"/></svg>`,
    pdf: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    sort: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M6 7l4-4 4 4M14 13l-4 4-4-4"/></svg>`,
    blood: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>`,
    vitals: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-width="1.5" d="M2 13l4-4 3 3 5-6 4 5"/></svg>`
  };

  // Tipos de entrada para el timeline
  const ENTRY_TYPES = {
    consultation: { label: 'Consulta', color: '#0a6e2e', bg: '#f0fdf4', border: '#6ee7b7' },
    treatment: { label: 'Tratamiento', color: '#059669', bg: '#ecfdf5', border: '#34d399' },
    medication: { label: 'Medicación', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
    observation: { label: 'Observación', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
    followup: { label: 'Seguimiento', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd' },
    emergency: { label: 'Urgencia', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
    lab: { label: 'Laboratorio', color: '#0891b2', bg: '#ecfeff', border: '#67e8f9' },
    prescription: { label: 'Receta', color: '#92400e', bg: '#fff7ed', border: '#fdba74' }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  function calcAge(bd) {
    if (!bd) return '—';
    const b = new Date(bd), t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  }
  function canCreate() { return ['admin', 'doctor', 'nurse'].includes(role); }
  function canEdit(rec) {
    if (role === 'admin') return true;
    if (role === 'doctor') return rec.doctorId === user.doctorId;
    return false;
  }
  function notify(msg, type = 'info') {
    const n = document.createElement('div');
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:1rem 1.5rem;background:${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--info)'};color:white;border-radius:var(--radius);box-shadow:var(--shadow-lg);z-index:10000;animation:slideIn 0.3s ease;`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 3000);
  }
  function typeLabel(type) { return ENTRY_TYPES[type]?.label || type; }
  function typeCfg(type) { return ENTRY_TYPES[type] || ENTRY_TYPES.observation; }

  // ── SUSCRIPCIONES ────────────────────────────────────────────────────────
  const unsub = store.subscribe('patients', reload);
  const unsubCR = store.subscribe('clinicalRecords', () => {
    // Si el modal del expediente está abierto, refrescar su contenido
    const hcModal = document.getElementById('hc-modal-overlay');
    if (hcModal && state.selectedPatient) refreshHCModal();
  });

  reload();

  function reload() {
    state.patients = store.get('patients') || [];
    applyFilters();
    renderList();
    renderStats();
  }

  // ── FILTROS Y PAGINACIÓN ──────────────────────────────────────────────────
  function applyFilters() {
    let list = [...state.patients];
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(p =>
        [p.name, p.dni, p.email, p.phone, p.bloodType].filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (state.sortBy === 'name') return a.name.localeCompare(b.name);
      if (state.sortBy === 'age') return calcAge(b.birthDate) - calcAge(a.birthDate);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    state.filtered = list;
    state.totalPages = Math.ceil(list.length / state.itemsPerPage);
    if (state.currentPage > state.totalPages && state.totalPages > 0) state.currentPage = state.totalPages;
    const s = (state.currentPage - 1) * state.itemsPerPage;
    state.paginated = list.slice(s, s + state.itemsPerPage);
  }

  // ── RENDER: ESTADÍSTICAS ─────────────────────────────────────────────────
  function renderStats() {
    const el = root.querySelector('#cl-stats');
    if (!el) return;
    const records = store.get('clinicalRecords') || [];
    const withHC = new Set(records.map(r => r.patientId)).size;
    const total = state.patients.length;
    const hoy = records.filter(r => {
      const d = new Date(r.date); const n = new Date();
      return d.toDateString() === n.toDateString();
    }).length;
    el.innerHTML = `
      <div class="stat-info-card">
        <span class="stat-info-label">Total Pacientes</span>
        <span class="stat-info-value">${total}</span>
        <span class="stat-info-sub">${ic.search} registrados</span>
      </div>
      <div class="stat-info-card">
        <span class="stat-info-label">Con Historia Clínica</span>
        <span class="stat-info-value">${withHC}</span>
        <span class="stat-info-sub">${ic.clinical} expedientes</span>
      </div>
      <div class="stat-info-card">
        <span class="stat-info-label">Total Consultas</span>
        <span class="stat-info-value">${records.length}</span>
        <span class="stat-info-sub">${ic.vitals} registros</span>
      </div>
      <div class="stat-info-card">
        <span class="stat-info-label">Consultas Hoy</span>
        <span class="stat-info-value">${hoy}</span>
        <span class="stat-info-sub">${ic.clinical} atenciones</span>
      </div>`;
  }

  // ── RENDER: LISTA DE PACIENTES ────────────────────────────────────────────
  function renderList() {
    root.innerHTML = `
      <div class="module-clinical">
        <div class="stats-auto-grid mb-4" id="cl-stats"></div>
        <div class="card" style="padding:0.75rem 1rem;">
          <div class="flex justify-between items-center">
            <div></div>
            <div style="position:relative;width:450px;">
              <span style="position:absolute;left:1rem;top:50%;transform:translateY(-50%);color:var(--muted);opacity:0.7;">${ic.search}</span>
              <input type="text" class="input" id="cl-search"
                placeholder="Buscar paciente por nombre, cédula, teléfono..."
                style="padding-left:2.8rem;border-radius:20px;background:rgba(0,0,0,0.05);border:1px solid transparent;height:40px;width:100%;"
                value="${state.search}">
            </div>
          </div>
        </div>
        <div class="flex justify-between mt-3 items-center">
          <div class="flex items-center gap-2">
            <label class="text-xs font-bold text-muted" style="text-transform:uppercase;">${ic.sort} Ordenar:</label>
            <select class="input" id="cl-sort" style="padding:0.25rem 2rem 0.25rem 0.75rem;font-size:0.8rem;width:auto;height:32px;">
              <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Nombre</option>
              <option value="age"  ${state.sortBy === 'age' ? 'selected' : ''}>Edad</option>
              <option value="recent" ${state.sortBy === 'recent' ? 'selected' : ''}>Más recientes</option>
            </select>
          </div>
          <div class="text-sm text-muted" id="cl-count">Mostrando ${state.paginated.length} de ${state.filtered.length} pacientes</div>
        </div>
        <div class="card" style="padding:0;overflow:hidden;margin-top:0.75rem;">
          <div class="card-header" style="padding:1rem 1.5rem;">
            <h3 style="margin:0;display:flex;align-items:center;gap:0.5rem;">${ic.clinical} Pacientes — Historia Clínica</h3>
          </div>
          <div id="cl-list-body">${renderRows()}</div>
        </div>
        <div class="card ${state.totalPages <= 1 ? 'hidden' : ''}" id="cl-pagination" style="padding:1rem;">
          <div class="flex justify-between items-center">
            <div class="text-sm text-muted" id="cl-page-info">Página ${state.currentPage} de ${state.totalPages}</div>
            <div class="flex gap-1" id="cl-page-controls">${renderPageControls()}</div>
          </div>
        </div>
      </div>`;
    renderStats();
    bindListEvents();
  }

  function renderRows() {
    if (state.paginated.length === 0) return `
      <div style="padding:4rem;text-align:center;color:var(--muted);">
        <div style="opacity:0.2;margin-bottom:1rem;">${ic.clinical}</div>
        <h3>Sin pacientes</h3><p>No se encontraron resultados.</p>
      </div>`;
    return state.paginated.map(p => {
      const age = calcAge(p.birthDate);
      const recs = (store.get('clinicalRecords') || []).filter(r => r.patientId === p.id);
      return `
        <div class="cl-patient-row" data-id="${p.id}" style="display:flex;align-items:center;gap:1rem;padding:1rem 1.5rem;border-bottom:1px solid var(--border);cursor:pointer;">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#0a6e2e);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.1rem;flex-shrink:0;">${p.name.charAt(0)}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:0.95rem;">${p.name}</div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:0.2rem;">
              <span class="text-xs text-muted">CI: ${p.docType || 'V'}-${p.dni || '—'}</span>
              <span class="text-xs text-muted">${age} años</span>
              ${p.bloodType ? `<span style="font-size:0.7rem;font-weight:700;padding:0 6px;border-radius:10px;background:rgba(220,38,38,0.1);color:#dc2626;">${p.bloodType}</span>` : ''}
              ${(p.allergies || []).length ? `<span style="font-size:0.7rem;font-weight:700;padding:0 6px;border-radius:10px;background:rgba(245,158,11,0.1);color:#d97706;">⚠ Alergias</span>` : ''}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:0.75rem;color:var(--muted);margin-bottom:0.35rem;">${recs.length} registro${recs.length !== 1 ? 's' : ''}</div>
            <button class="btn-circle btn-circle-status btn-view-hc" data-id="${p.id}" title="Ver Historia Clínica" style="width:38px;height:38px;" onclick="event.stopPropagation()">${ic.clinical}</button>
          </div>
        </div>`;
    }).join('');
  }

  function renderPageControls() {
    if (state.totalPages <= 1) return '';
    let h = `<button class="btn btn-outline btn-sm" data-page="prev" ${state.currentPage === 1 ? 'disabled' : ''}>← Ant</button>`;
    for (let i = 1; i <= Math.min(state.totalPages, 7); i++) h += `<button class="btn btn-sm ${state.currentPage === i ? 'btn-primary' : 'btn-outline'}" data-page="${i}">${i}</button>`;
    h += `<button class="btn btn-outline btn-sm" data-page="next" ${state.currentPage === state.totalPages ? 'disabled' : ''}>Sig →</button>`;
    return h;
  }

  // ── MODAL DE HISTORIA CLÍNICA (se abre sobre la lista) ────────────────────
  function openHCModal(patientId) {
    const p = state.patients.find(x => x.id === patientId);
    if (!p) return;
    state.selectedPatient = p;
    // Eliminar modal previo si existe
    document.getElementById('hc-modal-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'hc-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.55);z-index:1100;display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:modalSlideIn 0.3s ease;';
    overlay.innerHTML = buildHCModalContent(p);
    document.body.appendChild(overlay);
    bindHCModalEvents(overlay);
  }

  function refreshHCModal() {
    if (!state.selectedPatient) return;
    openHCModal(state.selectedPatient.id);
  }

  function buildHCModalContent(p) {
    const records = (store.get('clinicalRecords') || [])
      .filter(r => r.patientId === p.id)
      .sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));
    const age = calcAge(p.birthDate);
    const canAdd = canCreate();
    return `
      <div class="modal-content" style="max-width:1100px;background:var(--modal-bg);border:none;overflow:hidden;box-shadow:var(--shadow-lg);display:flex;flex-direction:column;max-height:92vh;padding:0;width:100%;">
        <div class="modal-header" style="background:var(--modal-header);flex-direction:column;align-items:center;padding:1.5rem;position:relative;flex-shrink:0;width:100%;box-sizing:border-box;">
          <h2 style="margin:0;color:white;letter-spacing:0.08em;font-size:1.4rem;font-weight:700;">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h2>
          <div style="color:rgba(255,255,255,0.9);font-size:0.85rem;margin-top:0.25rem;font-weight:500;">HISTORIA CLÍNICA — ${p.name.toUpperCase()}</div>
          <button id="hc-btn-close" style="position:absolute;top:1rem;right:1rem;background:rgba(0,0,0,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">${ic.close}</button>
        </div>
        
        <!-- Info del paciente -->
        <div style="padding:1rem 1.5rem;background:white;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:1.5rem;flex-shrink:0;">
          <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--primary),#0a6e2e);display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.8rem;flex-shrink:0;box-shadow:0 4px 10px rgba(0,0,0,0.1);">${p.name.charAt(0)}</div>
          <div style="flex:1;">
            <div style="font-weight:800;font-size:1.2rem;color:var(--text);">${p.name}</div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:0.35rem;">
              <span style="font-size:0.8rem;color:var(--muted);font-weight:600;">CI: ${p.docType || 'V'}-${p.dni || '—'}</span>
              <span style="font-size:0.8rem;color:var(--muted);font-weight:600;">Edad: ${age} años</span>
              ${p.bloodType ? `<span style="font-size:0.75rem;font-weight:700;padding:2px 8px;border-radius:12px;background:rgba(220,38,38,0.1);color:#dc2626;">Sangre: ${p.bloodType}</span>` : ''}
              ${(p.allergies || []).length ? `<span style="font-size:0.75rem;font-weight:700;padding:2px 8px;border-radius:12px;background:rgba(245,158,11,0.15);color:#d97706;">⚠ Alergias: ${p.allergies.join(', ')}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Cuerpo con timeline -->
        <div style="flex:1;overflow-y:auto;padding:0;background:var(--body-bg);">
          ${renderRecordTimeline(records, p)}
        </div>
        
        <!-- Footer con botones de acción -->
        <div class="modal-footer" style="padding:1.25rem 1.5rem;display:flex;justify-content:flex-end;gap:1.5rem;border-top:1px solid var(--border);background:white;flex-shrink:0;">
          ${records.length > 0 ? `<button class="btn-circle btn-circle-view" id="hc-btn-pdf" title="Imprimir Historia Médica Completa">${ic.pdf}</button>` : ''}
          ${canAdd ? `<button class="btn-circle btn-circle-save" id="hc-btn-new" title="Agregar Nuevo Registro">${ic.plus}</button>` : ''}
        </div>
      </div>`;
  }

  function renderRecordTimeline(records, p) {
    if (records.length === 0) return `
      <div style="padding:4rem;text-align:center;color:var(--muted);">
        <div style="opacity:0.2;margin-bottom:1rem;">${ic.clinical}</div>
        <h3>Sin registros</h3>
        <p>Aún no hay consultas registradas para este paciente.</p>
      </div>`;

    return records.map(r => {
      const dr = store.find('doctors', r.doctorId);
      const date = new Date(r.date);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const vitals = r.vitalSigns || {};
      const typeStr = typeLabel(r.type).toUpperCase();

      const presHtml = (Array.isArray(r.prescriptions) && r.prescriptions.length > 0)
        ? r.prescriptions.map((px, i) => `<div style="margin-bottom:0.25rem;">${i + 1}. <strong>${px.medication}</strong> — Dosis: ${px.dosage} — Frecuencia: ${px.frequency} — Duración: ${px.duration}</div>`).join('')
        : (r.prescriptions ? `<div>${r.prescriptions.replace(/\n/g, '<br>')}</div>` : `<div style="font-style:italic;color:var(--muted);">Sin prescripciones activas</div>`);

      return `
        <div class="cl-record-entry" style="margin: 1.5rem; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <!-- Header del Registro -->
          <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:1rem 1.5rem;">
            <div>
              <div style="font-weight:800;font-size:1rem;color:var(--text);">${typeStr}</div>
              <div style="font-size:0.75rem;color:var(--muted);margin-top:0.25rem;">${dateStr} · Responsable: ${r.creatorName ? (r.creatorRole === 'nurse' ? 'Lic.' : r.creatorRole === 'doctor' ? 'Dr.' : '') + ' ' + r.creatorName : 'Dr. ' + (dr?.name || 'No especificado')} ${dr?.license ? '· Mat. ' + dr.license : ''}</div>
            </div>
          </div>
          
          <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Signos vitales -->
            ${(vitals.bloodPressure || vitals.heartRate || vitals.temperature || vitals.spo2 || vitals.weight || vitals.height) ? `
            <div style="background:var(--modal-section-forest-light,#f0fdf4);border-radius:8px;padding:1rem;border:1px solid var(--modal-section-forest,#6ee7b7);">
              <div style="font-size:0.75rem;font-weight:800;color:var(--modal-section-forest,#059669);margin-bottom:0.75rem;text-transform:uppercase;">SIGNOS VITALES</div>
              <div style="display:flex;gap:1.5rem;flex-wrap:wrap;">
                ${vitals.bloodPressure ? `<div><div style="font-size:0.7rem;font-weight:700;color:var(--muted);">PRESIÓN ARTERIAL</div><div style="font-weight:600;font-size:0.9rem;">${vitals.bloodPressure}</div></div>` : ''}
                ${vitals.heartRate ? `<div><div style="font-size:0.7rem;font-weight:700;color:var(--muted);">F. CARDÍACA</div><div style="font-weight:600;font-size:0.9rem;">${vitals.heartRate} lpm</div></div>` : ''}
                ${vitals.temperature ? `<div><div style="font-size:0.7rem;font-weight:700;color:var(--muted);">TEMPERATURA</div><div style="font-weight:600;font-size:0.9rem;">${vitals.temperature} °C</div></div>` : ''}
                ${vitals.spo2 ? `<div><div style="font-size:0.7rem;font-weight:700;color:var(--muted);">SAT. O₂</div><div style="font-weight:600;font-size:0.9rem;">${vitals.spo2} %</div></div>` : ''}
                ${vitals.weight ? `<div><div style="font-size:0.7rem;font-weight:700;color:var(--muted);">PESO</div><div style="font-weight:600;font-size:0.9rem;">${vitals.weight} kg</div></div>` : ''}
                ${vitals.height ? `<div><div style="font-size:0.7rem;font-weight:700;color:var(--muted);">TALLA</div><div style="font-weight:600;font-size:0.9rem;">${vitals.height} cm</div></div>` : ''}
              </div>
            </div>` : ''}

            <!-- Evaluación clínica -->
            <div style="background:var(--modal-section-gold-light,#fffbeb);border-radius:8px;padding:1rem;border:1px solid var(--modal-section-gold,#fcd34d);">
              <div style="display:grid;grid-template-columns:1fr;gap:1rem;">
                <div>
                  <div style="font-size:0.75rem;font-weight:800;color:#b8860b;margin-bottom:0.4rem;text-transform:uppercase;">MOTIVO DE CONSULTA</div>
                  <div style="font-size:0.9rem;line-height:1.4;">${r.reason || 'No especificado'}</div>
                </div>
                <div>
                  <div style="font-size:0.75rem;font-weight:800;color:#b8860b;margin-bottom:0.4rem;text-transform:uppercase;">DIAGNÓSTICO PRINCIPAL</div>
                  <div style="font-size:0.9rem;line-height:1.4;font-weight:600;">${r.diagnosis || 'Pendiente'}</div>
                </div>
              </div>
            </div>

            <!-- Plan y Recetas -->
            <div style="background:var(--modal-section-olive-light,#f1f8e9);border-radius:8px;padding:1rem;border:1px solid var(--modal-section-olive,#aed581);">
              <div style="display:grid;grid-template-columns:1fr;gap:1.25rem;">
                <div>
                  <div style="font-size:0.75rem;font-weight:800;color:var(--modal-section-olive,#558b2f);margin-bottom:0.4rem;text-transform:uppercase;">PLAN DE TRATAMIENTO</div>
                  <div style="font-size:0.9rem;line-height:1.4;">${r.treatment || '—'}</div>
                </div>
                <div>
                  <div style="font-size:0.75rem;font-weight:800;color:var(--modal-section-olive,#558b2f);margin-bottom:0.4rem;text-transform:uppercase;">RECETAS MÉDICAS</div>
                  <div style="font-size:0.9rem;line-height:1.4;">${presHtml}</div>
                </div>
                ${r.followUp || r.notes ? `
                <div style="border-top:1px dashed var(--border);padding-top:1rem;display:flex;gap:2rem;">
                  ${r.followUp ? `<div><div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;">Próximo Control</div><div style="font-size:0.85rem;font-weight:600;margin-top:0.25rem;">${new Date(r.followUp).toLocaleDateString('es-ES')}</div></div>` : ''}
                  ${r.notes ? `<div><div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;">Notas Adicionales</div><div style="font-size:0.85rem;margin-top:0.25rem;">${r.notes}</div></div>` : ''}
                </div>` : ''}
              </div>
            </div>
            
          </div>
        </div>`;
    }).join('');
  }

  // ── FORMULARIO DE REGISTRO ────────────────────────────────────────────────
  function renderRecordForm(p) {
    const isEditing = !!state.editingRecord;
    const r = state.editingRecord || {};
    const doctors = store.get('doctors') || [];
    const vitals = r.vitalSigns || {};
    return `
      <div class="modal-content" style="max-width:950px;background:var(--modal-bg);border:none;overflow:hidden;box-shadow:var(--shadow-lg);">
        <div class="modal-header" style="background:var(--modal-header);flex-direction:column;align-items:center;padding:1.5rem;position:relative;">
          <h2 style="margin:0;color:white;letter-spacing:0.08em;font-size:1.4rem;font-weight:700;">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h2>
          <div style="color:rgba(255,255,255,0.9);font-size:0.85rem;margin-top:0.25rem;font-weight:500;">NUEVO REGISTRO DE ATENCIÓN MÉDICA</div>
          <button id="btn-close-record-modal" style="position:absolute;top:1rem;right:1rem;background:rgba(0,0,0,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;">${ic.close}</button>
        </div>
        <div style="background:white;margin:1.5rem;border-radius:8px;padding:2rem;max-height:70vh;overflow-y:auto;">
          <form id="cl-record-form">
            <!-- Cabecera general -->
            <div style="background:#f8fafc;border-radius:8px;padding:1.25rem;border:1px solid #e2e8f0;margin-bottom:1.5rem;">
              <div style="font-size:0.8rem;font-weight:700;color:var(--modal-header);margin-bottom:1rem;text-transform:uppercase;">Datos de la Atención</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight:700;font-size:0.78rem;">PROFESIONAL RESPONSABLE *</label>
                  <input type="text" class="input" value="${user.name} (${role === 'doctor' ? 'Médico' : role === 'nurse' ? 'Enfermera/o' : 'Administrador'})" readonly style="background:#edf2f7;color:var(--text);font-weight:600;">
                  <input type="hidden" id="rf-doctor" value="${role === 'doctor' ? (user.doctorId || user.id) : user.id}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-weight:700;font-size:0.78rem;">FECHA *</label>
                  <input type="date" class="input" id="rf-date" required value="${r.date ? new Date(r.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-weight:700;font-size:0.78rem;">TIPO *</label>
                  <select class="input" id="rf-type" required>
                    ${Object.entries(ENTRY_TYPES).map(([k, v]) => `<option value="${k}" ${(r.type || 'consultation') === k ? 'selected' : ''}>${v.label}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div style="margin-top:0.75rem;">
                <div class="form-group">
                  <label class="form-label" style="font-weight:700;font-size:0.78rem;">ESTADO</label>
                  <select class="input" id="rf-status" style="width:200px;">
                    <option value="draft" ${(r.status || 'draft') === 'draft' ? 'selected' : ''}>Borrador</option>
                    <option value="finalized" ${r.status === 'finalized' ? 'selected' : ''}>Finalizado</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Signos vitales -->
            <div style="background:var(--modal-section-forest-light,#f0fdf4);border-radius:8px;padding:1.25rem;border:1px solid var(--modal-section-forest,#6ee7b7);margin-bottom:1.5rem;">
              <div style="font-size:0.8rem;font-weight:700;color:var(--modal-section-forest,#059669);margin-bottom:1rem;text-transform:uppercase;">Signos Vitales y Biometría</div>
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;">
                <div class="form-group"><label class="form-label" style="font-size:0.75rem;font-weight:700;">PRESIÓN ARTERIAL</label><input type="text" class="input" id="rf-bp" placeholder="120/80" value="${vitals.bloodPressure || ''}"></div>
                <div class="form-group"><label class="form-label" style="font-size:0.75rem;font-weight:700;">FREC. CARDÍACA (lpm)</label><input type="number" class="input" id="rf-hr" placeholder="72" value="${vitals.heartRate || ''}"></div>
                <div class="form-group"><label class="form-label" style="font-size:0.75rem;font-weight:700;">TEMPERATURA (°C)</label><input type="number" class="input" id="rf-temp" placeholder="36.5" step="0.1" value="${vitals.temperature || ''}"></div>
                <div class="form-group"><label class="form-label" style="font-size:0.75rem;font-weight:700;">SAT. O₂ (%)</label><input type="number" class="input" id="rf-spo2" placeholder="98" value="${vitals.spo2 || ''}"></div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:0.75rem;">
                <div class="form-group"><label class="form-label" style="font-size:0.75rem;font-weight:700;">PESO (kg)</label><input type="number" class="input" id="rf-weight" step="0.1" value="${vitals.weight || ''}"></div>
                <div class="form-group"><label class="form-label" style="font-size:0.75rem;font-weight:700;">TALLA (cm)</label><input type="number" class="input" id="rf-height" value="${vitals.height || ''}"></div>
              </div>
            </div>

            <!-- Evaluación clínica -->
            <div style="background:var(--modal-section-gold-light,#fffbeb);border-radius:8px;padding:1.25rem;border:1px solid var(--modal-section-gold,#fcd34d);margin-bottom:1.5rem;">
              <div style="font-size:0.8rem;font-weight:700;color:#b8860b;margin-bottom:1rem;text-transform:uppercase;">Motivo y Evaluación</div>
              <div class="form-group" style="margin-bottom:0.75rem;">
                <label class="form-label" style="font-size:0.75rem;font-weight:700;">MOTIVO DE CONSULTA</label>
                <textarea class="input" id="rf-reason" rows="2">${r.reason || ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem;font-weight:700;">DIAGNÓSTICO PRINCIPAL *</label>
                <textarea class="input" id="rf-diagnosis" rows="2" required>${r.diagnosis || ''}</textarea>
              </div>
            </div>

            <!-- Plan -->
            <div style="background:var(--modal-section-olive-light,#f1f8e9);border-radius:8px;padding:1.25rem;border:1px solid var(--modal-section-olive,#aed581);">
              <div style="font-size:0.8rem;font-weight:700;color:var(--modal-section-olive,#558b2f);margin-bottom:1rem;text-transform:uppercase;">Plan y Seguimiento</div>
              <div class="form-group" style="margin-bottom:0.75rem;">
                <label class="form-label" style="font-size:0.75rem;font-weight:700;">PLAN DE TRATAMIENTO</label>
                <textarea class="input" id="rf-treatment" rows="2">${r.treatment || ''}</textarea>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem;font-weight:700;">MEDICACIÓN PRESCRITA</label>
                  <textarea class="input" id="rf-prescriptions" rows="2" placeholder="Medicamento - Dosis - Frecuencia - Duración">${Array.isArray(r.prescriptions) ? r.prescriptions.map(x => `${x.medication} - ${x.dosage} - ${x.frequency} - ${x.duration}`).join('\n') : (r.prescriptions || '')}</textarea>
                </div>
                <div>
                  <div class="form-group">
                    <label class="form-label" style="font-size:0.75rem;font-weight:700;">PRÓXIMO CONTROL</label>
                    <input type="date" class="input" id="rf-followup" value="${r.followUp ? new Date(r.followUp).toISOString().split('T')[0] : ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label" style="font-size:0.75rem;font-weight:700;">NOTAS</label>
                    <textarea class="input" id="rf-notes" rows="1">${r.notes || ''}</textarea>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer" style="padding:1.25rem 1.5rem;display:flex;justify-content:flex-end;gap:1rem;border:none;">
          <button class="btn-circle btn-circle-cancel" id="btn-cancel-record" title="Cancelar">${ic.close}</button>
          <button class="btn-circle btn-circle-save" id="btn-save-record" title="Guardar Registro">${ic.check}</button>
        </div>
      </div>`;
  }

  // ── GUARDAR REGISTRO ──────────────────────────────────────────────────────
  function saveRecord() {
    const p = state.selectedPatient;
    const authorEl = document.getElementById('rf-doctor');
    const dateEl = document.getElementById('rf-date');
    const typeEl = document.getElementById('rf-type');
    const diagEl = document.getElementById('rf-diagnosis');

    if (!dateEl?.value || !diagEl?.value) {
      notify('Complete los campos obligatorios (Fecha y Diagnóstico)', 'error');
      return;
    }

    const presEl = document.getElementById('rf-prescriptions');
    const rawPres = presEl?.value.trim() || '';
    const prescriptions = rawPres ? rawPres.split('\n').map(line => {
      const parts = line.split('-').map(x => x.trim());
      return { medication: parts[0] || '', dosage: parts[1] || '', frequency: parts[2] || '', duration: parts[3] || '' };
    }).filter(x => x.medication) : null;

    const data = {
      patientId: p.id,
      doctorId: authorEl?.value || user.id, // Compatibilidad retroactiva
      creatorId: user.id,
      creatorName: user.name,
      creatorRole: role,
      date: new Date(dateEl.value).getTime(),
      timestamp: Date.now(), // Marca de tiempo exacta para ordenamiento
      type: typeEl?.value || 'consultation',
      status: document.getElementById('rf-status')?.value || 'draft',
      reason: document.getElementById('rf-reason')?.value || '',
      diagnosis: diagEl.value,
      treatment: document.getElementById('rf-treatment')?.value || '',
      prescriptions,
      notes: document.getElementById('rf-notes')?.value || '',
      followUp: document.getElementById('rf-followup')?.value ? new Date(document.getElementById('rf-followup').value).getTime() : null,
      vitalSigns: {
        bloodPressure: document.getElementById('rf-bp')?.value || null,
        heartRate: document.getElementById('rf-hr')?.value || null,
        temperature: document.getElementById('rf-temp')?.value || null,
        spo2: document.getElementById('rf-spo2')?.value || null,
        weight: document.getElementById('rf-weight')?.value || null,
        height: document.getElementById('rf-height')?.value || null
      },
      createdBy: user.id
    };

    if (state.editingRecord) {
      store.update('clinicalRecords', state.editingRecord.id, data);
      notify('Registro actualizado', 'success');
    } else {
      store.add('clinicalRecords', data);
      notify('Registro creado', 'success');
    }

    // Cerrar modal de nuevo registro
    document.getElementById('cl-record-modal')?.remove();
    state.editingRecord = null;
    refreshHCModal();
  }

  // ── GENERADOR PDF (mismo diseño aprobado, escala grises) ─────────────────
  async function generatePDF(records, p) {
    notify('Generando PDF en escala de grises...', 'info');
    try {
      if (typeof window.jspdf === 'undefined') {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        await new Promise((res, rej) => { s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      const pW = doc.internal.pageSize.getWidth();
      const margin = 15;
      const cW = pW - 2 * margin;

      const gs = (r, g, b) => { const v = Math.round(r * .299 + g * .587 + b * .114); return [v, v, v]; };
      const fill = (r, g, b) => { const [a] = gs(r, g, b); doc.setFillColor(a, a, a); };
      const text = (r, g, b) => { const [a] = gs(r, g, b); doc.setTextColor(a, a, a); };

      const recsToExport = Array.isArray(records) ? records : [records];

      recsToExport.forEach((record, idx) => {
        if (idx > 0) doc.addPage();
        const dr = store.find('doctors', record.doctorId);
        const date = new Date(record.date);
        const vitals = record.vitalSigns || {};
        let y = margin;

        // Encabezado
        doc.setFontSize(16); text(10, 40, 80); doc.setFont('helvetica', 'bold');
        doc.text('HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR', pW / 2, y + 5, { align: 'center' });
        doc.setFontSize(10); text(80, 80, 80);
        doc.text('HISTORIA CLÍNICA ELECTRÓNICA', pW / 2, y + 12, { align: 'center' });
        const [lr, lg, lb] = gs(10, 40, 80);
        doc.setDrawColor(lr, lg, lb); doc.setLineWidth(0.5);
        doc.line(margin, y + 18, pW - margin, y + 18);
        y += 26;

        doc.setFontSize(9); text(100, 100, 100); doc.setFont('helvetica', 'normal');
        doc.text(`Registro ID: ${record.id?.split('_').pop() || '—'}`, margin, y);
        doc.text(`Fecha: ${date.toLocaleDateString('es-ES')}`, pW - margin, y, { align: 'right' });
        doc.text(`Tipo: ${typeLabel(record.type)}`, pW / 2, y, { align: 'center' });
        y += 8;

        // Paciente y Responsable
        fill(240, 245, 240); doc.rect(margin, y, cW / 2 - 2, 32, 'F');
        fill(240, 240, 245); doc.rect(pW / 2 + 2, y, cW / 2 - 2, 32, 'F');
        doc.setFont('helvetica', 'bold'); text(40, 80, 40);
        doc.text('PACIENTE', margin + 3, y + 6);
        doc.setFont('helvetica', 'normal'); text(0, 0, 0);
        doc.text(`${p.name}`, margin + 3, y + 12);
        doc.text(`CI: ${p.docType || 'V'}-${p.dni || '—'}`, margin + 3, y + 18);
        doc.text(`Edad: ${calcAge(p.birthDate)} años`, margin + 3, y + 24);
        doc.text(`Tel: ${p.phone || '—'}`, margin + 3, y + 30);
        doc.setFont('helvetica', 'bold'); text(40, 40, 80);
        doc.text('PROFESIONAL RESPONSABLE', pW / 2 + 5, y + 6);
        doc.setFont('helvetica', 'normal'); text(0, 0, 0);
        const respName = record.creatorName ? ((record.creatorRole === 'nurse' ? 'Lic. ' : record.creatorRole === 'doctor' ? 'Dr. ' : '') + record.creatorName) : ('Dr. ' + (dr?.name || '—'));
        doc.text(respName, pW / 2 + 5, y + 12);
        doc.text(`${record.creatorRole === 'nurse' ? 'Área de Enfermería' : dr?.specialty || 'Medicina General'}`, pW / 2 + 5, y + 18);
        if (dr?.license) doc.text(`Mat: ${dr.license}`, pW / 2 + 5, y + 24);
        y += 40;

        // Signos vitales
        fill(90, 137, 115); doc.rect(margin, y, cW, 7, 'F');
        text(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('SIGNOS VITALES', margin + 3, y + 5);
        y += 7;
        const vLabs = ['P. Arterial', 'F. Cardíaca', 'Temp.', 'Sat. O2', 'Peso', 'Talla'];
        const vVals = [`${vitals.bloodPressure || '-'}`, `${vitals.heartRate || '-'} lpm`, `${vitals.temperature || '-'}°C`, `${vitals.spo2 || '-'}%`, `${vitals.weight || '-'} kg`, `${vitals.height || '-'} cm`];
        doc.setFontSize(8); text(0, 0, 0);
        let xo = margin; const colW = cW / 6;
        vLabs.forEach((l, i) => {
          doc.setFont('helvetica', 'bold'); doc.text(l, xo + colW / 2, y + 5, { align: 'center' });
          doc.setFont('helvetica', 'normal'); doc.text(vVals[i], xo + colW / 2, y + 10, { align: 'center' });
          xo += colW;
        });
        y += 18;

        // Secciones clínicas
        const secs = [
          { title: 'MOTIVO DE CONSULTA', content: record.reason || 'No especificado', color: [214, 158, 46] },
          { title: 'DIAGNÓSTICO', content: record.diagnosis || 'Pendiente', color: [104, 159, 56] },
          { title: 'PLAN DE TRATAMIENTO', content: record.treatment || '—', color: [104, 159, 56] }
        ];
        doc.setFontSize(9);
        secs.forEach(sec => {
          fill(...sec.color); doc.rect(margin, y, cW, 7, 'F');
          text(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.text(sec.title, margin + 3, y + 5);
          y += 7; text(0, 0, 0); doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(sec.content, cW - 6);
          doc.text(lines, margin + 3, y + 5);
          y += (lines.length * 5) + 8;
        });

        // Recetas
        fill(39, 103, 73); doc.rect(margin, y, cW, 7, 'F');
        text(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.text('RECETAS MÉDICAS', margin + 3, y + 5);
        y += 7; text(0, 0, 0); doc.setFont('helvetica', 'normal');
        const pres = record.prescriptions;
        if (pres && pres.length > 0) {
          pres.forEach((px, i) => {
            doc.text(`${i + 1}. ${px.medication} — ${px.dosage} — ${px.frequency} — ${px.duration}`, margin + 3, y + 5);
            y += 6;
          });
        } else {
          doc.setFont('helvetica', 'italic'); doc.text('Sin prescripciones activas', margin + 3, y + 5);
          y += 6;
        }
        y += 10;

        // Firma
        doc.setLineWidth(0.2); doc.line(margin, y, pW - margin, y);
        y += 15;
        doc.line(pW - margin - 60, y, pW - margin, y);
        doc.text(record.creatorName ? ((record.creatorRole === 'nurse' ? 'Lic. ' : record.creatorRole === 'doctor' ? 'Dr. ' : '') + record.creatorName) : ('Dr. ' + (dr?.name || 'Médico Tratante')), pW - margin - 30, y + 4, { align: 'center' });
        if (dr?.license) doc.text(`Mat. ${dr.license}`, pW - margin - 30, y + 9, { align: 'center' });
      });

      const fname = `HC_${p.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fname);
      notify('PDF generado exitosamente', 'success');
    } catch (e) {
      console.error(e);
      notify('Error al generar PDF', 'error');
    }
  }

  // ── EVENT LISTENERS ───────────────────────────────────────────────────────
  function bindListEvents() {
    const searchEl = root.querySelector('#cl-search');
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        state.search = e.target.value;
        state.currentPage = 1;
        applyFilters();
        const body = root.querySelector('#cl-list-body');
        const countEl = root.querySelector('#cl-count');
        const pag = root.querySelector('#cl-pagination');
        const pgInfo = root.querySelector('#cl-page-info');
        const pgCtrl = root.querySelector('#cl-page-controls');
        if (body) body.innerHTML = renderRows();
        if (countEl) countEl.textContent = `Mostrando ${state.paginated.length} de ${state.filtered.length} pacientes`;
        if (pag) pag.classList.toggle('hidden', state.totalPages <= 1);
        if (pgInfo) pgInfo.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
        if (pgCtrl) pgCtrl.innerHTML = renderPageControls();
        bindRowEvents();
      });
    }

    const sortEl = root.querySelector('#cl-sort');
    if (sortEl) {
      sortEl.addEventListener('change', e => {
        state.sortBy = e.target.value;
        state.currentPage = 1;
        applyFilters();
        const body = root.querySelector('#cl-list-body');
        if (body) body.innerHTML = renderRows();
        bindRowEvents();
      });
    }

    const pagCtrl = root.querySelector('#cl-page-controls');
    if (pagCtrl) {
      pagCtrl.addEventListener('click', e => {
        const btn = e.target.closest('button[data-page]');
        if (!btn) return;
        const pg = btn.dataset.page;
        if (pg === 'prev' && state.currentPage > 1) state.currentPage--;
        else if (pg === 'next' && state.currentPage < state.totalPages) state.currentPage++;
        else if (!isNaN(+pg)) state.currentPage = +pg;
        applyFilters();
        const body = root.querySelector('#cl-list-body');
        const pgInfo = root.querySelector('#cl-page-info');
        if (body) body.innerHTML = renderRows();
        if (pgInfo) pgInfo.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
        pagCtrl.innerHTML = renderPageControls();
        bindRowEvents();
      });
    }

    bindRowEvents();
  }

  function bindRowEvents() {
    root.querySelectorAll('.btn-view-hc').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openHCModal(btn.dataset.id);
      });
    });
    root.querySelectorAll('.cl-patient-row').forEach(row => {
      row.addEventListener('click', () => {
        openHCModal(row.dataset.id);
      });
    });
  }

  function bindHCModalEvents(overlay) {
    overlay.querySelector('#hc-btn-close')?.addEventListener('click', () => {
      state.selectedPatient = null;
      overlay.remove();
      renderList();
    });

    const openFormModal = (record = null) => {
      if (!canCreate()) { notify('Sin permiso para crear registros', 'error'); return; }
      state.editingRecord = record;
      // Añadir modal encima del HC modal
      const formOverlay = document.createElement('div');
      formOverlay.id = 'cl-record-modal';
      formOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1200;display:flex;align-items:center;justify-content:center;padding:1.5rem;animation:modalSlideIn 0.3s ease;';
      formOverlay.innerHTML = renderRecordForm(state.selectedPatient);
      document.body.appendChild(formOverlay);

      // Eventos del form modal
      const closeForm = () => { formOverlay.remove(); state.editingRecord = null; };
      formOverlay.querySelector('#btn-close-record-modal')?.addEventListener('click', closeForm);
      formOverlay.querySelector('#btn-cancel-record')?.addEventListener('click', closeForm);
      formOverlay.querySelector('#btn-save-record')?.addEventListener('click', saveRecord);
      formOverlay.addEventListener('click', e => { if (e.target === formOverlay) closeForm(); });
    };

    overlay.querySelector('#hc-btn-new')?.addEventListener('click', () => openFormModal());
    overlay.querySelector('#btn-new-record-empty')?.addEventListener('click', () => openFormModal());

    overlay.querySelector('#hc-btn-pdf')?.addEventListener('click', () => {
      const records = (store.get('clinicalRecords') || []).filter(r => r.patientId === state.selectedPatient.id);
      generatePDF(records, state.selectedPatient);
    });

    // Cerrar haciendo clic afuera si el usuario hace clic en el overlay de HC
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        state.selectedPatient = null;
        overlay.remove();
        renderList();
      }
    });
  }

  // ── API pública ───────────────────────────────────────────────────────────
  return {
    refresh() { reload(); },
    destroy() {
      unsub();
      unsubCR();
    }
  };
}