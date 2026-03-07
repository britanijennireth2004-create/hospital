/**
 * Módulo de Registro de Tratamientos y Relevo de Turno
 *
 * Reglas de negocio:
 *  - Los registros son INMUTABLES: no se borran ni se editan.
 *  - Los errores se corrigen mediante una "Enmienda" vinculada al log original.
 *  - Médicos y Enfermeras tienen permiso de escritura (create:treatments).
 *  - Los datos persisten en localStorage de inmediato (store.add).
 *  - Cada escritura genera un auditLog en la tabla auditLogs (criterio técnico).
 *  - La vista de Relevo muestra una línea de tiempo cronológica descendente.
 */

import { Logger } from '../utils/logger.js';
import { can } from '../core/permissions.js';

export default function mountTreatments(root, { bus, store, user, role }) {

    // ─── Estado ────────────────────────────────────────────────────────────────
    const state = {
        patients: [],
        selectedPatientId: null,
        logs: [],
        filterType: 'all',
        showModal: false,
        amendingLogId: null
    };

    // ─── Permisos ───────────────────────────────────────────────────────────────
    const canWrite = can(role, 'create:treatments');

    // ─── Iconos SVG institucionales ────────────────────────────────────────────
    const SVG = {
        pill: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
        syringe: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 2 4 4"/><path d="m17 7 3-3"/><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/><path d="m9 11 4 4"/><path d="m5 19-3 3"/><path d="m14 4 6 6"/></svg>`,
        clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
        pencil: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
        lock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
        list: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
        inbox: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`,
        hospital: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v4"/><path d="M14 14h-4"/><path d="M14 18h-4"/><path d="M14 8h-4"/><path d="M18 12h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2"/><path d="M18 22V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v18"/></svg>`,
        refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`,
        alert: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
        clock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        blood: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/><path d="M12 2a14.5 14.5 0 0 1 0 20"/><path d="M2 12h20"/></svg>`,
        user: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
        plus: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
        activity: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
        heart: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
    };

    // ─── Tipos de entrada ───────────────────────────────────────────────────────
    const ENTRY_TYPES = {
        treatment: { label: 'Tratamiento', color: '#059669', bg: '#f0fdf4', border: '#6ee7b7', svgIcon: SVG.pill },
        medication: { label: 'Medicación', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd', svgIcon: SVG.syringe },
        observation: { label: 'Observación', color: '#d97706', bg: '#fffbeb', border: '#fcd34d', svgIcon: SVG.clipboard },
        vitals: { label: 'Signos Vitales', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', svgIcon: SVG.heart },
        amendment: { label: 'Enmienda', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', svgIcon: SVG.pencil }
    };

    const SHIFTS = ['Turno Mañana', 'Turno Tarde', 'Turno Noche', 'Guardia'];

    // Opciones estructuradas de formulario
    const ROUTES = ['Oral', 'IV (Intravenosa)', 'IM (Intramuscular)', 'SC (Subcutánea)', 'Tópica', 'Inhalatoria', 'Rectal', 'Sublingual'];
    const PROCEDURE_TYPES = ['Curación de herida', 'Fisioterapia', 'Catéter / Sonda', 'Nebulización', 'Terapia IV', 'Drenaje', 'Transfusión', 'Oxigenoterapia', 'Otro'];
    const PATIENT_RESPONSES = ['Buena tolerancia', 'Tolerancia regular', 'Mala tolerancia', 'Sin respuesta observable'];
    const PATIENT_STATES = ['Estable', 'Alerta / Leve deterioro', 'Reservado', 'Crítico'];
    const CONSCIOUSNESS = ['Alerta (orientado)', 'Somnoliento', 'Confuso / Desorientado', 'Estuporoso', 'Comatoso'];
    const RESPIRATORY = ['Normal', 'Disnea leve', 'Disnea moderada', 'Taquipnea', 'Bradipnea', 'Apnea'];
    const SKIN_COND = ['Normal / Rosada', 'Pálida', 'Cianótica', 'Ictérica', 'Rubicunda', 'Diaforética'];

    // ─── Helpers ────────────────────────────────────────────────────────────────
    function fmt(ts) {
        return new Date(ts).toLocaleString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function timeDiff(ts) {
        const m = Math.floor((Date.now() - ts) / 60000);
        if (m < 1) return 'hace un momento';
        if (m < 60) return `hace ${m} min`;
        const h = Math.floor(m / 60);
        if (h < 24) return `hace ${h}h`;
        return `hace ${Math.floor(h / 24)}d`;
    }

    function roleLabel(r) {
        return { doctor: 'Médico', nurse: 'Enfermera', admin: 'Admin' }[r] || r;
    }

    function genId() {
        return 'tlog_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function autoShift() {
        const h = new Date().getHours();
        return h < 14 ? 'Turno Mañana' : h < 22 ? 'Turno Tarde' : 'Turno Noche';
    }

    function selectedPatient() {
        return state.patients.find(p => p.id === state.selectedPatientId) || null;
    }

    // ─── Carga ──────────────────────────────────────────────────────────────────
    function loadPatients() {
        state.patients = store.get('patients');
    }

    function loadLogs() {
        if (!state.selectedPatientId) { state.logs = []; return; }
        const all = store.get('treatmentLogs');
        state.logs = all
            .filter(l => l.patientId === state.selectedPatientId)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    // ─── Guardar (INMUTABLE) ─────────────────────────────────────────────────────
    /**
     * Criterio técnico:
     *   1) Se escribe en Medical_History → store.add('treatmentLogs', entry)
     *   2) Se genera entrada en Audit_Logs → Logger.log(...) → store.add('auditLogs', ...)
     */
    function saveTreatmentLog(data) {
        // Construir detalle legible estandarizado según tipo
        let detail = '';
        if (data.entryType === 'treatment') {
            const parts = [];
            if (data.procedureType) parts.push(`Procedimiento: ${data.procedureType}`);
            if (data.bodyRegion) parts.push(`Región: ${data.bodyRegion}`);
            if (data.materials) parts.push(`Materiales: ${data.materials}`);
            if (data.procedureDetail) parts.push(data.procedureDetail);
            if (data.patientResponse) parts.push(`Respuesta: ${data.patientResponse}`);
            if (data.complications) parts.push(`Complicaciones: ${data.complications}`);
            if (data.nextSteps) parts.push(`Próximos pasos: ${data.nextSteps}`);
            detail = parts.filter(Boolean).join(' | ');
        } else if (data.entryType === 'medication') {
            const parts = [];
            const med = [data.medication, data.medGeneric ? `(${data.medGeneric})` : ''].filter(Boolean).join(' ');
            if (med) parts.push(`Medicamento: ${med}`);
            if (data.dose) parts.push(`Dosis: ${data.dose}`);
            if (data.route) parts.push(`Vía: ${data.route}`);
            if (data.frequency) parts.push(`Frecuencia: ${data.frequency}`);
            if (data.adminTime) parts.push(`Hora: ${data.adminTime}`);
            if (data.tolerance) parts.push(`Tolerancia: ${data.tolerance}`);
            if (data.adverse) parts.push(`Efectos adversos: ${data.adverse}`);
            detail = parts.filter(Boolean).join(' | ');
        } else if (data.entryType === 'observation') {
            const parts = [];
            if (data.patientState) parts.push(`Estado: ${data.patientState}`);
            if (data.consciousness) parts.push(`Consciencia: ${data.consciousness}`);
            const vs = [data.bp && `TA:${data.bp}`, data.hr && `FC:${data.hr}`, data.temp && `T:${data.temp}°C`, data.spo2 && `SpO2:${data.spo2}%`, data.rr && `FR:${data.rr}`, data.glucose && `Gluc:${data.glucose}`, data.pain != null && data.pain !== '' && `Dolor:${data.pain}/10`].filter(Boolean);
            if (vs.length) parts.push(`Signos vitales — ${vs.join(' | ')}`);
            if (data.respiratory) parts.push(`Respiración: ${data.respiratory}`);
            if (data.skin) parts.push(`Piel: ${data.skin}`);
            if (data.specificObs) parts.push(data.specificObs);
            if (data.alerts) parts.push(`ALERTAS: ${data.alerts}`);
            detail = parts.filter(Boolean).join(' | ');
        } else if (data.entryType === 'vitals') {
            const parts = [];
            const bp = (data.vfBpSys && data.vfBpDia) ? `${data.vfBpSys}/${data.vfBpDia}` : (data.vfBpSys || '');
            if (bp) parts.push(`T/A: ${bp} mmHg`);
            if (data.vfHr) parts.push(`FC: ${data.vfHr} lpm`);
            if (data.vfSpo2) parts.push(`SpO₂: ${data.vfSpo2}%`);
            if (data.vfTemp) parts.push(`Temp: ${data.vfTemp}°C`);
            if (data.vfRr) parts.push(`FR: ${data.vfRr} rpm`);
            if (data.vfGlucose) parts.push(`Gluc: ${data.vfGlucose} mg/dL`);
            if (data.vfWeight) parts.push(`Peso: ${data.vfWeight} kg`);
            if (data.vfPain != null && data.vfPain !== '') parts.push(`Dolor: ${data.vfPain}/10`);
            if (data.vfAvpu) parts.push(`AVPU: ${data.vfAvpu}`);
            if (data.vfRespiratory) parts.push(`Resp: ${data.vfRespiratory}`);
            if (data.vfSkin) parts.push(`Piel: ${data.vfSkin}`);
            if (data.vfNotes) parts.push(data.vfNotes);
            detail = parts.filter(Boolean).join(' | ');
        } else {
            detail = (data.detail || '').trim();
        }

        // Agregar signos vitales compartidos al detail (si los ingresaron y el tipo no es 'vitals')
        if (data.entryType !== 'vitals') {
            const svParts = [];
            const svBp = (data.svBpSys && data.svBpDia) ? `${data.svBpSys}/${data.svBpDia}` : (data.svBpSys || '');
            if (svBp) svParts.push(`TA:${svBp}mmHg`);
            if (data.svHr) svParts.push(`FC:${data.svHr}lpm`);
            if (data.svSpo2) svParts.push(`SpO\u2082:${data.svSpo2}%`);
            if (data.svTemp) svParts.push(`T:${data.svTemp}\u00b0C`);
            if (data.svRr) svParts.push(`FR:${data.svRr}rpm`);
            if (data.svGlucose) svParts.push(`Gluc:${data.svGlucose}mg/dL`);
            if (data.svPain != null && data.svPain !== '') svParts.push(`Dolor:${data.svPain}/10`);
            if (svParts.length) detail += ` | SV \u2014 ${svParts.join(' | ')}`;
        }

        const entry = {
            id: genId(),
            patientId: state.selectedPatientId,
            entryType: data.entryType,
            userId: user.id,
            userName: user.name,
            userRole: role,
            shift: data.shift,
            detail: detail || (data.detail || '').trim(),
            // Campos estructurados guardados para referencia futura
            structured: data,
            timestamp: Date.now(),
            isAmendment: data.isAmendment || false,
            amendedLogId: data.amendedLogId || null
        };

        store.add('treatmentLogs', entry);

        Logger.log(store, user, {
            action: data.isAmendment ? Logger.Actions.UPDATE : Logger.Actions.CREATE,
            module: Logger.Modules.CLINICAL,
            description: `${data.isAmendment ? 'Enmienda' : 'Registro'} de ${ENTRY_TYPES[entry.entryType]?.label || entry.entryType} para paciente ${state.selectedPatientId}.`,
            details: { treatmentLogId: entry.id, patientId: entry.patientId, entryType: entry.entryType, shift: entry.shift, isAmendment: entry.isAmendment }
        });

        return entry;
    }

    // ─── Render principal ────────────────────────────────────────────────────────
    function render() {
        loadPatients();
        loadLogs();
        root.innerHTML = buildShell();
        setupListeners();
        refreshTimeline();
        refreshStats();
    }

    function buildShell() {
        const pat = selectedPatient();
        const patOptions = state.patients.map(p =>
            `<option value="${p.id}" ${p.id === state.selectedPatientId ? 'selected' : ''}>${p.name} — ${p.dni || 'S/DNI'}</option>`
        ).join('');

        const filterButtons = [
            { key: 'all', svg: SVG.list, label: 'Todos', color: 'var(--primary)' },
            ...Object.entries(ENTRY_TYPES).map(([key, c]) => ({ key, svg: c.svgIcon, label: c.label, color: c.color }))
        ].map(f => {
            const active = state.filterType === f.key;
            return `<button class="filter-chip ${active ? 'active' : ''}" data-filter="${f.key}"
                style="border-color:${f.color};${active ? `background:${f.color};color:#fff;` : `color:${f.color};`}">
                ${f.svg} ${f.label}
            </button>`;
        }).join('');

        const patientContext = pat ? `
        <div class="patient-context-bar">
            <div class="pcb-avatar">${pat.name.charAt(0)}</div>
            <div class="pcb-info">
                <div class="pcb-name">${pat.name}</div>
                <div class="pcb-meta">
                    ${pat.bloodType ? `<span class="pcb-tag red">${SVG.blood} ${pat.bloodType}</span>` : ''}
                    ${pat.allergies?.length ? `<span class="pcb-tag amber">${SVG.alert} Alergias: ${pat.allergies.join(', ')}</span>` : `<span class="pcb-tag green">${SVG.check} Sin alergias registradas</span>`}
                    ${pat.dni ? `<span class="pcb-tag neutral">${SVG.user} ${pat.dni}</span>` : ''}
                </div>
            </div>
            <div class="pcb-sync">
                <span class="sync-dot"></span>
                <span style="font-size:0.72rem;color:var(--muted);">Sincronizado</span>
            </div>
        </div>` : '';

        return `
<style>
.module-treatments { display:flex; flex-direction:column; gap:1rem; }
/* Patient context bar */
.patient-context-bar {
    display:flex; align-items:center; gap:1rem;
    background:linear-gradient(135deg,var(--primary) 0%,#0a6e2e 100%);
    border-radius:var(--radius); padding:0.85rem 1.25rem; color:white;
    box-shadow:0 4px 16px rgba(15,141,58,0.25); flex-wrap:wrap;
}
.pcb-avatar {
    width:42px; height:42px; border-radius:50%;
    background:rgba(255,255,255,0.2); border:2px solid rgba(255,255,255,0.4);
    display:flex; align-items:center; justify-content:center;
    font-size:1.2rem; font-weight:800; color:white; flex-shrink:0;
}
.pcb-info { flex:1; min-width:0; }
.pcb-name { font-weight:700; font-size:1rem; }
.pcb-meta { display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.3rem; }
.pcb-tag {
    font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:20px;
    border:1px solid rgba(255,255,255,0.3);
}
.pcb-tag.red    { background:rgba(239,68,68,0.3); }
.pcb-tag.amber  { background:rgba(245,158,11,0.3); }
.pcb-tag.green  { background:rgba(16,185,129,0.3); }
.pcb-tag.neutral{ background:rgba(255,255,255,0.15); }
.pcb-sync { display:flex; align-items:center; gap:0.4rem; }
.sync-dot {
    width:8px; height:8px; border-radius:50%; background:#4ade80;
    box-shadow:0 0 0 3px rgba(74,222,128,0.3);
    animation:syncPulse 2s ease infinite;
}
@keyframes syncPulse { 0%,100%{box-shadow:0 0 0 3px rgba(74,222,128,0.3);} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0.1);} }
/* Filter chips */
.filter-chip {
    font-size:0.75rem; font-weight:700; padding:0.35rem 0.85rem;
    border-radius:20px; border:1.5px solid; cursor:pointer;
    background:transparent; transition:all 0.2s; white-space:nowrap;
}
.filter-chip:hover { opacity:0.85; transform:translateY(-1px); }
/* Timeline */
.tl-entry {
    display:flex; gap:1rem; padding:1rem 0; border-bottom:1px solid var(--border);
    animation:tlFadeIn 0.3s ease;
}
@keyframes tlFadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
.tl-entry:last-child { border-bottom:none; }
.tl-pin {
    display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:40px;
}
.tl-icon {
    width:38px; height:38px; border-radius:50%; display:flex; align-items:center;
    justify-content:center; font-size:1.1rem; flex-shrink:0; border:2px solid;
}
.tl-line { width:2px; flex:1; margin-top:4px; min-height:20px; }
.tl-body { flex:1; min-width:0; }
.tl-header { display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.4rem; }
.tl-badges { display:flex; gap:0.35rem; flex-wrap:wrap; }
.badge-pill {
    font-size:0.68rem; font-weight:800; padding:2px 9px; border-radius:12px;
    border:1px solid; letter-spacing:0.04em;
}
.tl-time { font-size:0.72rem; color:var(--muted); white-space:nowrap; }
.tl-detail { margin:0.4rem 0 0; font-size:0.88rem; color:var(--text); line-height:1.55; }
.tl-signature {
    display:flex; justify-content:space-between; align-items:center;
    margin-top:0.6rem; flex-wrap:wrap; gap:0.25rem;
}
.sig-info { display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:var(--muted); }
.sig-avatar {
    width:24px; height:24px; border-radius:50%; background:var(--bg-light);
    display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:800;
}
.shift-divider {
    display:flex; align-items:center; gap:0.75rem; margin:1.25rem 0 0.5rem;
}
.shift-divider::before,.shift-divider::after {
    content:''; flex:1; height:1px; background:var(--border);
}
.shift-label {
    font-size:0.68rem; font-weight:800; color:var(--muted); letter-spacing:0.1em;
    background:var(--bg-light); padding:3px 12px; border-radius:20px; white-space:nowrap;
}
/* Stats grid */
.stats-auto-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:0.75rem; }
.stat-info-card {
    background:white; border:1px solid var(--border); border-radius:var(--radius);
    padding:1rem; display:flex; flex-direction:column; gap:0.25rem;
    transition:transform 0.2s, box-shadow 0.2s;
}
.stat-info-card:hover { transform:translateY(-2px); box-shadow:var(--shadow); }
.stat-info-label { font-size:0.72rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; }
.stat-info-value { font-size:1.8rem; font-weight:800; color:var(--primary); line-height:1; }
.stat-info-sub { font-size:0.72rem; color:var(--muted); margin-top:2px; }
</style>

<div class="module-treatments">

    <!-- STATS -->
    <div class="stats-auto-grid" id="trx-stats"></div>

    <!-- BARRA DE CONTROL -->
    <div class="card" style="padding:1rem 1.25rem;">

        <!-- Encabezado con buscador de paciente -->
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:${state.selectedPatientId ? '0.85rem' : '0'};">
            <div style="display:flex;align-items:center;gap:0.6rem;flex-shrink:0;">
                <span style="color:var(--primary);">${SVG.user}</span>
                <span style="font-size:0.75rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;">Paciente</span>
            </div>

            <!-- Wrapper buscador (PATRÓN CÉDULA) -->
            <div style="display: flex; gap: 0; flex: 1; max-width: 420px; position: relative;">
                <select class="input" id="patient-doc-type" 
                        style="width: 70px; border-radius: 4px 0 0 4px; border-right: none; background: #fff; height: 40px; border: 1.5px solid var(--border);">
                    <option value="V">V</option>
                    <option value="E">E</option>
                    <option value="J">J</option>
                    <option value="P">P</option>
                </select>
                <input type="text" id="patient-cedula-input" class="input"
                    placeholder="Identificar paciente por cédula..."
                    style="flex: 1; border-radius: 0 4px 4px 0; height: 40px; background: #fff; border: 1.5px solid var(--border); padding-left: 1rem;"
                    autocomplete="off">
                
                <!-- Feedback de búsqueda -->
                <div id="patient-search-feedback" style="position: absolute; top: calc(100% + 5px); left: 0; font-size: 0.72rem; z-index: 10;"></div>
            </div>

            <!-- Tarjeta de datos precargados (Pattern Consistente) -->
            <div id="patient-preloaded-mini-card" class="hidden" 
                 style="background: white; border: 1px solid #86efac; border-radius: 8px; padding: 0.5rem 1rem; 
                        display: flex; align-items: center; gap: 1rem; animation: tlFadeIn 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="width: 32px; height: 32px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; font-weight: 800;">
                    <span id="mini-card-initial">P</span>
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div id="mini-card-name" style="font-weight: 700; font-size: 0.85rem; color: #166534; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                    <div id="mini-card-cedula" style="font-size: 0.72rem; color: #15803d; font-weight: 600;"></div>
                </div>
                <button type="button" id="btn-clear-patient" 
                        style="background: #fee2e2; border: 1px solid #fca5a5; color: #b91c1c; width: 24px; height: 24px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700;" title="Limpiar selección">×</button>
            </div>

            ${canWrite && state.selectedPatientId ? `
            <button class="btn btn-primary" id="btn-new-treatment" style="margin-left:auto;display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
                ${SVG.plus} Registrar Novedad
            </button>` : ''}
        </div>

        ${state.selectedPatientId ? `
        <div style="display:flex;gap:0.5rem;margin-top:0.85rem;flex-wrap:wrap;">
            ${filterButtons}
        </div>` : ''}
    </div>

    <!-- CONTEXTO DEL PACIENTE -->
    ${patientContext}

    <!-- TIMELINE -->
    <div class="card" id="timeline-card">
        <div style="display:flex;justify-content:space-between;align-items:center;
                    border-bottom:1px solid var(--border);padding-bottom:0.85rem;margin-bottom:1rem;">
            <div style="display:flex;align-items:center;gap:0.75rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <h3 style="margin:0;font-size:1rem;">Línea de Tiempo — Relevo de Turno</h3>
            </div>
            <span class="text-muted" id="timeline-count" style="font-size:0.8rem;"></span>
        </div>
        <div id="timeline-container">
            ${!state.selectedPatientId ? `
            <div style="padding:3rem;text-align:center;color:var(--muted);">
                <div style="margin-bottom:1rem;opacity:0.4;">${SVG.hospital}</div>
                <h3 style="color:var(--muted);">Seleccione un paciente</h3>
                <p class="text-muted">Elija un paciente para ver y registrar su historial de tratamientos y novedades de turno.</p>
            </div>` : '<div id="timeline-list">Cargando...</div>'}
        </div>
    </div>

    <!-- MODAL: NUEVO REGISTRO -->
    <div class="modal-overlay hidden" id="treatment-modal">
        <div class="modal-content" style="max-width:680px;">
            <div class="modal-header">
                <div>
                    <h3 class="modal-title">REGISTRO DE TRATAMIENTO / NOVEDAD</h3>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;" id="modal-patient-name">—</div>
                </div>
                <button class="close-modal btn-circle" id="close-treatment-modal" style="background: rgba(255,255,255,0.2); border: none; color: white;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 2rem;">
                <!-- Aviso inmutabilidad -->
                <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:0.75rem 1rem;margin-bottom: 1.5rem;display:flex;gap:0.75rem;align-items:center;">
                    <span style="color:#d97706;flex-shrink:0;">${SVG.lock}</span>
                    <span style="font-size:0.82rem;color:#92400e;line-height:1.5;"><strong>Registro Inmutable.</strong> Una vez guardado, no podrá modificarse. Para corregir un error, use la opción "Enmienda".</span>
                </div>

                <form id="treatment-form" style="display:flex;flex-direction:column;gap:1rem;">

                    <!-- Tipo + Turno -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:700;font-size:0.75rem;">TIPO DE REGISTRO *</label>
                            <select class="input" id="form-entry-type" required>
                                <option value="treatment">Tratamiento Clínico</option>
                                <option value="medication">Administración de Medicamento</option>
                                <option value="observation">Observación / Estado del Paciente</option>
                                <option value="vitals">Registro de Signos Vitales</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-weight:700;font-size:0.75rem;">TURNO *</label>
                            <select class="input" id="form-shift" required>
                                ${SHIFTS.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- ══ SECCIÓN: TRATAMIENTO ══ -->
                    <div id="section-treatment" style="display:flex;flex-direction:column;gap:0.85rem;background:#f0fdf4;border:1px solid #6ee7b7;border-radius:8px;padding:1rem;">
                        <div style="font-size:0.72rem;font-weight:800;color:#059669;letter-spacing:0.08em;display:flex;align-items:center;gap:0.5rem;"><span style="color:#059669;">${SVG.pill}</span> DATOS DEL TRATAMIENTO</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">TIPO DE PROCEDIMIENTO</label>
                                <select class="input" id="form-procedure-type" style="background:white;">
                                    <option value="">— Seleccionar —</option>
                                    ${PROCEDURE_TYPES.map(p => `<option>${p}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">REGIÓN / ÁREA CORPORAL</label>
                                <input type="text" class="input" id="form-body-region" placeholder="Ej: Miembro inferior derecho" style="background:white;">
                            </div>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:0.73rem;font-weight:700;">MATERIALES / INSUMOS UTILIZADOS</label>
                            <input type="text" class="input" id="form-materials" placeholder="Ej: Gasas estériles, solución fisiológica, guantes" style="background:white;">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:0.73rem;font-weight:700;">DESCRIPCIÓN DEL PROCEDIMIENTO *</label>
                            <textarea class="input" id="form-procedure-detail" rows="3" placeholder="Describa paso a paso el procedimiento realizado, hallazgos y condición encontrada..." style="background:white;"></textarea>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">RESPUESTA DEL PACIENTE</label>
                                <select class="input" id="form-patient-response" style="background:white;">
                                    <option value="">— Seleccionar —</option>
                                    ${PATIENT_RESPONSES.map(r => `<option>${r}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">COMPLICACIONES OBSERVADAS</label>
                                <input type="text" class="input" id="form-complications" placeholder="Ninguna / Especificar" style="background:white;">
                            </div>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:0.73rem;font-weight:700;">PRÓXIMOS PASOS / RECOMENDACIONES</label>
                            <textarea class="input" id="form-next-steps" rows="2" placeholder="Indicaciones para el próximo turno..." style="background:white;"></textarea>
                        </div>
                    </div>

                    <!-- ══ SECCIÓN: MEDICACIÓN ══ -->
                    <div id="section-medication" style="display:none;flex-direction:column;gap:0.85rem;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:1rem;">
                        <div style="font-size:0.72rem;font-weight:800;color:#2563eb;letter-spacing:0.08em;display:flex;align-items:center;gap:0.5rem;"><span style="color:#2563eb;">${SVG.syringe}</span> DATOS DEL MEDICAMENTO</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">NOMBRE DEL MEDICAMENTO *</label>
                                <input type="text" class="input" id="form-medication" placeholder="Ej: Paracetamol" style="background:white;">
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">NOMBRE GENÉRICO</label>
                                <input type="text" class="input" id="form-med-generic" placeholder="Ej: Acetaminofén" style="background:white;">
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.85rem;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">DOSIS *</label>
                                <input type="text" class="input" id="form-dose" placeholder="Ej: 500 mg" style="background:white;">
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">VÍA DE ADMINISTRACIÓN *</label>
                                <select class="input" id="form-route" style="background:white;">
                                    <option value="">—</option>
                                    ${ROUTES.map(r => `<option>${r}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">FRECUENCIA</label>
                                <input type="text" class="input" id="form-frequency" placeholder="Ej: c/8h, SOS" style="background:white;">
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">HORA DE ADMINISTRACIÓN</label>
                                <input type="time" class="input" id="form-admin-time" style="background:white;">
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">TOLERANCIA DEL PACIENTE</label>
                                <select class="input" id="form-tolerance" style="background:white;">
                                    <option value="">— Seleccionar —</option>
                                    ${PATIENT_RESPONSES.map(r => `<option>${r}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:0.73rem;font-weight:700;">EFECTOS ADVERSOS / OBSERVACIONES</label>
                            <textarea class="input" id="form-adverse" rows="2" placeholder="Ninguno / Especificar reacciones observadas..." style="background:white;"></textarea>
                        </div>
                    </div>

                    <!-- ══ SECCIÓN: OBSERVACIÓN ══ -->
                    <div id="section-observation" style="display:none;flex-direction:column;gap:0.85rem;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:1rem;">
                        <div style="font-size:0.72rem;font-weight:800;color:#d97706;letter-spacing:0.08em;display:flex;align-items:center;gap:0.5rem;"><span style="color:#d97706;">${SVG.activity}</span> ESTADO CLÍNICO DEL PACIENTE</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">ESTADO GENERAL *</label>
                                <select class="input" id="form-patient-state" style="background:white;">
                                    <option value="">— Seleccionar —</option>
                                    ${PATIENT_STATES.map(s => `<option>${s}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">NIVEL DE CONSCIENCIA</label>
                                <select class="input" id="form-consciousness" style="background:white;">
                                    <option value="">— Seleccionar —</option>
                                    ${CONSCIOUSNESS.map(c => `<option>${c}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <!-- Signos Vitales -->
                        <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:0.85rem;">
                            <div style="font-size:0.72rem;font-weight:800;color:#475569;margin-bottom:0.65rem;letter-spacing:0.06em;">SIGNOS VITALES</div>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#64748b;">T/A (mmHg)</label>
                                    <input type="text" class="input" id="form-bp" placeholder="120/80" style="font-family:monospace;">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#64748b;">FC (lpm)</label>
                                    <input type="number" class="input" id="form-hr" placeholder="72" min="0" max="300">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#64748b;">Temp (°C)</label>
                                    <input type="number" class="input" id="form-temp" placeholder="36.5" min="30" max="45" step="0.1">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#64748b;">SpO2 (%)</label>
                                    <input type="number" class="input" id="form-spo2" placeholder="98" min="0" max="100">
                                </div>
                            </div>
                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;margin-top:0.65rem;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#64748b;">FR (rpm)</label>
                                    <input type="number" class="input" id="form-rr" placeholder="16" min="0" max="60">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#64748b;">GLUCEMIA (mg/dL)</label>
                                    <input type="number" class="input" id="form-glucose" placeholder="90" min="0">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#64748b;">DOLOR (0-10)</label>
                                    <input type="number" class="input" id="form-pain" placeholder="0" min="0" max="10">
                                </div>
                            </div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.85rem;">
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">PATRÓN RESPIRATORIO</label>
                                <select class="input" id="form-respiratory" style="background:white;">
                                    <option value="">— Seleccionar —</option>
                                    ${RESPIRATORY.map(r => `<option>${r}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group" style="margin:0;">
                                <label class="form-label" style="font-size:0.73rem;font-weight:700;">CONDICIÓN DE LA PIEL</label>
                                <select class="input" id="form-skin" style="background:white;">
                                    <option value="">— Seleccionar —</option>
                                    ${SKIN_COND.map(s => `<option>${s}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:0.73rem;font-weight:700;">OBSERVACIONES CLÍNICAS ESPECÍFICAS *</label>
                            <textarea class="input" id="form-specific-obs" rows="3" placeholder="Describa detalladamente el estado del paciente, comportamiento, quejas, condición general observada durante el turno..." style="background:white;"></textarea>
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:0.73rem;font-weight:700;">ALERTAS / PENDIENTES PARA EL TURNO SIGUIENTE</label>
                            <textarea class="input" id="form-alerts" rows="2" placeholder="Indicar cualquier situación que requiera atención prioritaria en el próximo turno..." style="background:white;"></textarea>
                        </div>
                    </div>

                    <!-- ══ SECCIÓN: SIGNOS VITALES ══ -->
                    <div id="section-vitals" style="display:none;flex-direction:column;gap:0.85rem;background:#f5f3ff;border:1px solid #c4b5fd;border-radius:8px;padding:1rem;">
                        <div style="font-size:0.72rem;font-weight:800;color:#7c3aed;letter-spacing:0.08em;display:flex;align-items:center;gap:0.5rem;">${SVG.heart} REGISTRO DE SIGNOS VITALES</div>

                        <!-- Bloque: Tensión Arterial y Hemodinámicos -->
                        <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:0.85rem;">
                            <div style="font-size:0.67rem;font-weight:800;color:#7c3aed;letter-spacing:0.06em;margin-bottom:0.6rem;text-transform:uppercase;">Tensión Arterial y Hemodinámicos</div>
                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">T/A SISTÓLICA (mmHg)</label>
                                    <input type="number" class="input" id="vf-bp-sys" placeholder="120" min="0" max="300" style="font-family:monospace;">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">T/A DIASTÓLICA (mmHg)</label>
                                    <input type="number" class="input" id="vf-bp-dia" placeholder="80" min="0" max="200" style="font-family:monospace;">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">FREC. CARDÍACA (lpm)</label>
                                    <input type="number" class="input" id="vf-hr" placeholder="72" min="0" max="300">
                                </div>
                            </div>
                        </div>

                        <!-- Bloque: Respiración y Temperatura -->
                        <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:0.85rem;">
                            <div style="font-size:0.67rem;font-weight:800;color:#7c3aed;letter-spacing:0.06em;margin-bottom:0.6rem;text-transform:uppercase;">Temperatura, Respiración y Oxigenación</div>
                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">TEMPERATURA (°C)</label>
                                    <input type="number" class="input" id="vf-temp" placeholder="36.5" min="30" max="45" step="0.1">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">FREC. RESPIRATORIA (rpm)</label>
                                    <input type="number" class="input" id="vf-rr" placeholder="16" min="0" max="60">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">SpO₂ (%)</label>
                                    <input type="number" class="input" id="vf-spo2" placeholder="98" min="0" max="100">
                                </div>
                            </div>
                        </div>

                        <!-- Bloque: Glucemia, Peso, Dolor -->
                        <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:0.85rem;">
                            <div style="font-size:0.67rem;font-weight:800;color:#7c3aed;letter-spacing:0.06em;margin-bottom:0.6rem;text-transform:uppercase;">Glucemia, Peso y Dolor</div>
                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">GLUCEMIA (mg/dL)</label>
                                    <input type="number" class="input" id="vf-glucose" placeholder="90" min="0">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">PESO (kg)</label>
                                    <input type="number" class="input" id="vf-weight" placeholder="70" min="0" max="300" step="0.1">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">DOLOR (Escala 0-10)</label>
                                    <input type="number" class="input" id="vf-pain" placeholder="0" min="0" max="10">
                                </div>
                            </div>
                        </div>

                        <!-- Bloque: Evaluación clínica -->
                        <div style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:0.85rem;">
                            <div style="font-size:0.67rem;font-weight:800;color:#7c3aed;letter-spacing:0.06em;margin-bottom:0.6rem;text-transform:uppercase;">Evaluación Clínica</div>
                            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.75rem;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">NIVEL CONSCIENCIA (AVPU)</label>
                                    <select class="input" id="vf-avpu">
                                        <option value="">—</option>
                                        <option value="A">A — Alerta</option>
                                        <option value="V">V — Responde a voz</option>
                                        <option value="P">P — Responde a dolor</option>
                                        <option value="U">U — Inconsciente</option>
                                    </select>
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">PATRÓN RESPIRATORIO</label>
                                    <select class="input" id="vf-respiratory">
                                        <option value="">—</option>
                                        ${RESPIRATORY.map(r => `<option>${r}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.69rem;font-weight:700;color:#64748b;">CONDICIÓN DE PIEL</label>
                                    <select class="input" id="vf-skin">
                                        <option value="">—</option>
                                        ${SKIN_COND.map(s => `<option>${s}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Notas -->
                        <div class="form-group" style="margin:0;">
                            <label class="form-label" style="font-size:0.73rem;font-weight:700;">OBSERVACIONES / NOTAS CLÍNICAS</label>
                            <textarea class="input" id="vf-notes" rows="2" placeholder="Observaciones adicionales sobre los signos vitales registrados, contexto clínico relevante..." style="background:white;"></textarea>
                        </div>
                    </div>


                    <!-- ══ PANEL COMPARTIDO: SIGNOS VITALES AL MOMENTO ══ -->
                    <!-- Visible en Tratamiento, Medicación y Observación (oculto en Vitals puro) -->
                    <div id="section-shared-vitals" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
                        <!-- Cabecera colapsable -->
                        <button type="button" id="toggle-shared-vitals"
                                style="width:100%;display:flex;align-items:center;justify-content:space-between;
                                       background:#f8fafc;border:none;padding:0.65rem 1rem;cursor:pointer;
                                       font-size:0.72rem;font-weight:800;color:#475569;letter-spacing:0.07em;
                                       border-bottom:1px solid transparent;transition:all 0.2s;">
                            <span style="display:flex;align-items:center;gap:0.5rem;">
                                <span style="color:#7c3aed;">${SVG.heart}</span>
                                SIGNOS VITALES AL MOMENTO DEL REGISTRO
                                <span style="font-weight:400;color:var(--muted);font-size:0.68rem;">(opcional)</span>
                            </span>
                            <span id="svitals-chevron" style="color:var(--muted);transition:transform 0.2s;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" stroke-width="2.5"
                                     stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </span>
                        </button>
                        <!-- Contenido expandible -->
                        <div id="shared-vitals-body" style="display:none;padding:0.85rem 1rem;
                             background:white;display:none;flex-direction:column;gap:0.75rem;">
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.65rem;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#7c3aed;">T/A SIST. (mmHg)</label>
                                    <input type="number" class="input" id="sv-bp-sys" placeholder="120" min="0" max="300" style="font-family:monospace;">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#7c3aed;">T/A DIAST. (mmHg)</label>
                                    <input type="number" class="input" id="sv-bp-dia" placeholder="80" min="0" max="200" style="font-family:monospace;">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#7c3aed;">FC (lpm)</label>
                                    <input type="number" class="input" id="sv-hr" placeholder="72" min="0" max="300">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#7c3aed;">SpO₂ (%)</label>
                                    <input type="number" class="input" id="sv-spo2" placeholder="98" min="0" max="100">
                                </div>
                            </div>
                            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.65rem;">
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#7c3aed;">TEMP. (°C)</label>
                                    <input type="number" class="input" id="sv-temp" placeholder="36.5" min="30" max="45" step="0.1">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#7c3aed;">FR (rpm)</label>
                                    <input type="number" class="input" id="sv-rr" placeholder="16" min="0" max="60">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#7c3aed;">GLUCEMIA (mg/dL)</label>
                                    <input type="number" class="input" id="sv-glucose" placeholder="90" min="0">
                                </div>
                                <div class="form-group" style="margin:0;">
                                    <label class="form-label" style="font-size:0.68rem;font-weight:700;color:#7c3aed;">DOLOR (0-10)</label>
                                    <input type="number" class="input" id="sv-pain" placeholder="0" min="0" max="10">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Firma automática -->
                    <div style="background:#f8fafc;border-radius:8px;padding:0.85rem 1rem;border:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;">
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            <span style="color:var(--muted);">${SVG.user}</span>
                            <div>
                                <div style="font-weight:700;color:#475569;font-size:0.72rem;">FIRMADO POR</div>
                                <div style="color:#1e293b;">${user.name} (${roleLabel(role)})</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:0.5rem;text-align:right;">
                            <div>
                                <div style="font-weight:700;color:#475569;font-size:0.72rem;">TIMESTAMP</div>
                                <div style="color:#1e293b;font-family:monospace;" id="modal-timestamp">${fmt(Date.now())}</div>
                            </div>
                            <span style="color:var(--muted);">${SVG.clock}</span>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn-circle btn-circle-cancel" id="cancel-treatment-btn" title="Cancelar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <button class="btn-circle btn-circle-save" id="save-treatment-btn" title="Guardar Registro">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
            </div>
        </div>
    </div>

    <!-- MODAL: ENMIENDA -->
    <div class="modal-overlay hidden" id="amend-modal">
        <div class="modal-content" style="max-width:560px;">
            <div class="modal-header" style="background:#dc2626;">
                <div>
                    <h3 class="modal-title" style="display:flex;align-items:center;gap:0.6rem;">${SVG.pencil} NOTA ACLARATORIA / ENMIENDA</h3>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">El registro original es inmutable y permanece intacto</div>
                </div>
                <button class="close-modal btn-circle" id="close-amend-modal" style="background: rgba(255,255,255,0.2); border: none; color: white;">&times;</button>
            </div>
            <div class="modal-body" style="padding: 2rem;">
                <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:0.85rem 1rem;margin-bottom:1rem;">
                    <div style="font-size:0.72rem;font-weight:800;color:#dc2626;margin-bottom:0.4rem;">REGISTRO ORIGINAL A ENMENDAR</div>
                    <div style="font-size:0.85rem;color:#1e293b;" id="amend-original-text">—</div>
                </div>
                <div class="form-group">
                    <label class="form-label" style="font-weight:700;font-size:0.78rem;">NOTA ACLARATORIA / CORRECCIÓN *</label>
                    <textarea class="input" id="amend-detail" rows="4" required
                        placeholder="Explique el error y la corrección correspondiente..."></textarea>
                </div>
                <div style="background:#f8fafc;border-radius:8px;padding:0.75rem 1rem;border:1px solid #e2e8f0;font-size:0.8rem;">
                    <strong>Firmado por:</strong> ${user.name} (${roleLabel(role)}) — ${fmt(Date.now())}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-circle btn-circle-cancel" id="cancel-amend-btn" title="Cancelar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <button class="btn-circle btn-circle-save" id="save-amend-btn" title="Guardar Enmienda"
                        style="background:white;color:#dc2626;border:2px solid white;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
            </div>
        </div>
    </div>

</div><!-- /module-treatments -->
        `;
    }

    // ─── Timeline ────────────────────────────────────────────────────────────────
    function refreshTimeline() {
        const container = root.querySelector('#timeline-list');
        const countEl = root.querySelector('#timeline-count');
        if (!container) return;

        let logs = state.filterType === 'all'
            ? [...state.logs]
            : state.logs.filter(l => l.entryType === state.filterType);

        if (countEl) countEl.textContent = `${logs.length} entrada${logs.length !== 1 ? 's' : ''}`;

        if (logs.length === 0) {
            if (canWrite) {
                container.innerHTML = `
            <div style="padding:3rem;text-align:center;color:var(--muted);">
                <div style="margin-bottom:1rem;opacity:0.35;">${SVG.inbox}</div>
                <h3 style="color:var(--muted);">Sin registros</h3>
                <p class="text-muted">Aún no hay entradas${state.filterType !== 'all' ? ' de este tipo' : ''} para este paciente.</p>
                <button class="btn btn-primary mt-3" id="btn-empty-new" style="display:inline-flex;align-items:center;gap:0.5rem;">${SVG.plus} Primer Registro</button>
            </div>`;
            } else {
                container.innerHTML = `
            <div style="padding:3rem;text-align:center;color:var(--muted);">
                <div style="margin-bottom:1rem;opacity:0.35;">${SVG.inbox}</div>
                <h3 style="color:var(--muted);">Sin registros disponibles</h3>
            </div>`;
            }
            container.querySelector('#btn-empty-new')?.addEventListener('click', openTreatmentModal);
            return;
        }

        let lastShift = null;
        let html = '';

        for (const log of logs) {
            const cfg = ENTRY_TYPES[log.entryType] || ENTRY_TYPES.observation;
            const isNew = (Date.now() - log.timestamp) < 3600000;

            if (log.shift !== lastShift) {
                html += `<div class="shift-divider"><span class="shift-label">${SVG.refresh} ${log.shift}</span></div>`;
                lastShift = log.shift;
            }

            // Formatear resumen estructurado del detail para la tarjeta
            const lines = log.detail ? log.detail.split(' | ') : [];
            const mainLine = lines[0] || '';
            const extraLines = lines.slice(1);

            html += `
            <div class="tl-entry" data-id="${log.id}">
                <div class="tl-pin">
                    <div class="tl-icon" style="background:${cfg.bg};border-color:${cfg.border};color:${cfg.color};">${cfg.svgIcon}</div>
                    <div class="tl-line" style="background:${cfg.border};"></div>
                </div>
                <div class="tl-body">
                    <div class="tl-header">
                        <div class="tl-badges">
                            <span class="badge-pill" style="background:${cfg.bg};color:${cfg.color};border-color:${cfg.border};">
                                ${cfg.label.toUpperCase()}
                            </span>
                            ${isNew ? `<span class="badge-pill" style="background:#fef3c7;color:#d97706;border-color:#fcd34d;">NUEVO</span>` : ''}
                            ${log.isAmendment ? `<span class="badge-pill" style="background:#fef2f2;color:#dc2626;border-color:#fca5a5;">ENMIENDA</span>` : ''}
                        </div>
                        <span class="tl-time">${SVG.clock} ${timeDiff(log.timestamp)}</span>
                    </div>

                    <p class="tl-detail" style="${log.isAmendment ? 'font-style:italic;' : ''}">${mainLine}</p>
                    ${extraLines.length ? `<div style="margin-top:0.4rem;display:flex;flex-direction:column;gap:0.2rem;">${extraLines.map(l => `<span style="font-size:0.78rem;color:var(--muted);">${l}</span>`).join('')}</div>` : ''}

                    <div class="tl-signature">
                        <div class="sig-info">
                            <div class="sig-avatar">${log.userName.charAt(0)}</div>
                            <span><strong>${log.userName}</strong> · ${roleLabel(log.userRole)}</span>
                            <span>·</span>
                            <span>${fmt(log.timestamp)}</span>
                        </div>
                        ${canWrite && !log.isAmendment ? `
                        <button class="btn btn-sm btn-outline amend-btn" data-id="${log.id}"
                                style="font-size:0.72rem;padding:2px 10px;color:#dc2626;border-color:#dc2626;display:flex;align-items:center;gap:4px;">
                            ${SVG.pencil} Enmienda
                        </button>` : ''}
                    </div>
                </div>
            </div>`;
        }

        container.innerHTML = html;
        container.querySelectorAll('.amend-btn').forEach(btn =>
            btn.addEventListener('click', () => openAmendModal(btn.dataset.id))
        );
    }

    // ─── Stats ───────────────────────────────────────────────────────────────────
    function refreshStats() {
        const el = root.querySelector('#trx-stats');
        if (!el) return;
        const total = state.logs.length;
        const byType = t => state.logs.filter(l => l.entryType === t).length;
        const last24h = state.logs.filter(l => Date.now() - l.timestamp < 86400000).length;
        el.innerHTML = `
        <div class="stat-info-card"><span class="stat-info-label">Total Entradas</span><span class="stat-info-value">${total}</span><span class="stat-info-sub" style="display:flex;align-items:center;gap:4px;">${SVG.list} Historia completa</span></div>
        <div class="stat-info-card"><span class="stat-info-label">Tratamientos</span><span class="stat-info-value">${byType('treatment') + byType('medication')}</span><span class="stat-info-sub" style="display:flex;align-items:center;gap:4px;">${SVG.pill} Aplicados</span></div>
        <div class="stat-info-card"><span class="stat-info-label">Observaciones</span><span class="stat-info-value">${byType('observation')}</span><span class="stat-info-sub" style="display:flex;align-items:center;gap:4px;">${SVG.clipboard} Del turno</span></div>
        <div class="stat-info-card"><span class="stat-info-label">Últimas 24h</span><span class="stat-info-value">${last24h}</span><span class="stat-info-sub" style="display:flex;align-items:center;gap:4px;">${SVG.clock} Actividad reciente</span></div>`;
    }

    // ─── Modales ─────────────────────────────────────────────────────────────────
    function openTreatmentModal() {
        if (!canWrite) return;
        const modal = root.querySelector('#treatment-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        const pat = selectedPatient();
        const nameEl = root.querySelector('#modal-patient-name');
        if (nameEl && pat) nameEl.textContent = `Paciente: ${pat.name}`;
        const tsEl = root.querySelector('#modal-timestamp');
        if (tsEl) tsEl.textContent = fmt(Date.now());
        const shiftSel = root.querySelector('#form-shift');
        if (shiftSel) shiftSel.value = autoShift();
        const typeSel = root.querySelector('#form-entry-type');
        toggleSection(typeSel?.value || 'treatment');
    }

    function closeTreatmentModal() {
        root.querySelector('#treatment-modal')?.classList.add('hidden');
        root.querySelector('#treatment-form')?.reset();
    }

    function openAmendModal(logId) {
        if (!canWrite) return;
        state.amendingLogId = logId;
        const log = state.logs.find(l => l.id === logId);
        if (!log) return;
        const modal = root.querySelector('#amend-modal');
        if (!modal) return;
        modal.classList.remove('hidden');
        const origEl = root.querySelector('#amend-original-text');
        if (origEl) origEl.textContent = log.detail;
        const detailEl = root.querySelector('#amend-detail');
        if (detailEl) { detailEl.value = ''; detailEl.focus(); }
    }

    function closeAmendModal() {
        root.querySelector('#amend-modal')?.classList.add('hidden');
        state.amendingLogId = null;
    }

    function toggleSection(type) {
        ['treatment', 'medication', 'observation', 'vitals'].forEach(t => {
            const el = root.querySelector(`#section-${t}`);
            if (el) el.style.display = (t === type) ? 'flex' : 'none';
        });
    }

    // ─── Listeners ───────────────────────────────────────────────────────────────
    function setupListeners() {

        // ── Búsqueda de paciente por Cédula (Refactorizado) ────────────────
        function searchPatientByCedula() {
            const cedulaInput = root.querySelector('#patient-cedula-input');
            const docTypeSelect = root.querySelector('#patient-doc-type');
            const feedback = root.querySelector('#patient-search-feedback');
            const miniCard = root.querySelector('#patient-preloaded-mini-card');

            const cedulaValue = cedulaInput?.value.trim();
            const docType = docTypeSelect?.value || 'V';

            if (!cedulaValue) {
                clearPatientSelection();
                return;
            }

            const foundPatient = state.patients.find(p => {
                const pDni = (p.dni || '').trim();
                const pDocType = (p.docType || 'V').trim();
                return pDni === cedulaValue && pDocType === docType;
            });

            if (foundPatient) {
                // Actualizar mini tarjeta
                const nameEl = root.querySelector('#mini-card-name');
                const initialEl = root.querySelector('#mini-card-initial');
                const cedulaEl = root.querySelector('#mini-card-cedula');

                if (nameEl) nameEl.textContent = foundPatient.name;
                if (initialEl) initialEl.textContent = foundPatient.name.charAt(0).toUpperCase();
                if (cedulaEl) cedulaEl.textContent = `${foundPatient.docType || 'V'}-${foundPatient.dni}`;

                if (miniCard) miniCard.classList.remove('hidden');
                if (cedulaInput) {
                    cedulaInput.style.borderColor = '#86efac';
                    cedulaInput.style.backgroundColor = '#f0fdf4';
                    cedulaInput.closest('div').style.display = 'none'; // Ocultar input búsqueda al identificar
                }

                if (feedback) feedback.innerHTML = '';

                // Establecer paciente seleccionado
                state.selectedPatientId = foundPatient.id;
                state.filterType = 'all';
                loadLogs();
                render();
                notify(`Paciente ${foundPatient.name} identificado`, 'success');
            } else {
                // No se encontró localmente, buscar en el registro nacional simulado
                const registryEntry = store.fetchFromRegistry(docType, cedulaValue);

                if (registryEntry) {
                    if (feedback) {
                        feedback.innerHTML = `
                            <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:8px;margin-top:8px;font-size:0.8rem;">
                                <span style="color:#1d4ed8;font-weight:700;">Identificado en Registro Civil</span><br>
                                <span style="color:#1e40af;">${registryEntry.name}</span><br>
                                <em style="font-size:0.75rem;color:#6b7280;">No registrado en este hospital.</em>
                            </div>
                        `;
                    }
                    if (cedulaInput) {
                        cedulaInput.style.borderColor = '#bfdbfe';
                        cedulaInput.style.backgroundColor = '#eff6ff';
                    }
                } else {
                    if (feedback && cedulaValue.length >= 3) {
                        feedback.innerHTML = `<span style="color:#dc2626;font-weight:700;">No encontrado</span>`;
                    } else if (feedback) {
                        feedback.innerHTML = '';
                    }
                    if (cedulaInput) {
                        cedulaInput.style.borderColor = cedulaValue.length >= 3 ? '#fca5a5' : '';
                        cedulaInput.style.backgroundColor = '';
                    }
                }
            }
        }

        function clearPatientSelection() {
            state.selectedPatientId = null;
            state.logs = [];
            state.filterType = 'all';
            render();
        }

        const cedulaInput = root.querySelector('#patient-cedula-input');
        const docTypeSelect = root.querySelector('#patient-doc-type');

        cedulaInput?.addEventListener('input', debounce(() => {
            searchPatientByCedula();
        }, 350));

        docTypeSelect?.addEventListener('change', () => {
            if (cedulaInput?.value.trim()) searchPatientByCedula();
        });

        root.querySelector('#btn-clear-patient')?.addEventListener('click', () => {
            clearPatientSelection();
        });

        // Filtros de tipo
        root.querySelectorAll('.filter-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                state.filterType = btn.dataset.filter;
                refreshTimeline();
                // Actualizar estilos de chips
                root.querySelectorAll('.filter-chip').forEach(b => {
                    const active = b === btn;
                    const key = b.dataset.filter;
                    const color = key === 'all' ? 'var(--primary)' : (ENTRY_TYPES[key]?.color || 'var(--primary)');
                    b.style.background = active ? color : '';
                    b.style.color = active ? '#fff' : color;
                    b.classList.toggle('active', active);
                });
            });
        });

        // Botón nuevo tratamiento
        root.querySelector('#btn-new-treatment')?.addEventListener('click', openTreatmentModal);

        // Cerrar modal tratamiento
        root.querySelector('#close-treatment-modal')?.addEventListener('click', closeTreatmentModal);
        root.querySelector('#cancel-treatment-btn')?.addEventListener('click', closeTreatmentModal);
        root.querySelector('#treatment-modal')?.addEventListener('click', e => {
            if (e.target.id === 'treatment-modal') closeTreatmentModal();
        });

        // Cambio de tipo → toggleSection + visibilidad del panel compartido
        root.querySelector('#form-entry-type')?.addEventListener('change', e => {
            toggleSection(e.target.value);
            // El panel de SV compartido se oculta cuando el tipo ya ES 'vitals'
            const sharedPanel = root.querySelector('#section-shared-vitals');
            if (sharedPanel) sharedPanel.style.display = (e.target.value === 'vitals') ? 'none' : 'block';
        });

        // Acordeón signos vitales compartidos
        root.querySelector('#toggle-shared-vitals')?.addEventListener('click', () => {
            const body = root.querySelector('#shared-vitals-body');
            const chevron = root.querySelector('#svitals-chevron');
            const btn = root.querySelector('#toggle-shared-vitals');
            const open = body?.style.display !== 'none';
            if (body) { body.style.display = open ? 'none' : 'flex'; }
            if (chevron) { chevron.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)'; }
            if (btn) { btn.style.borderBottomColor = open ? 'transparent' : '#e2e8f0'; btn.style.background = open ? '#f8fafc' : '#f5f3ff'; btn.style.color = open ? '#475569' : '#7c3aed'; }
        });

        root.querySelector('#save-treatment-btn')?.addEventListener('click', () => {
            const entryType = root.querySelector('#form-entry-type')?.value;
            // Validación por tipo
            let valid = true;
            if (entryType === 'treatment') {
                const d = root.querySelector('#form-procedure-detail')?.value?.trim();
                if (!d) { notify('Describa el procedimiento realizado.', 'error'); root.querySelector('#form-procedure-detail')?.focus(); valid = false; }
            } else if (entryType === 'medication') {
                const m = root.querySelector('#form-medication')?.value?.trim();
                const d = root.querySelector('#form-dose')?.value?.trim();
                if (!m || !d) { notify('El nombre del medicamento y la dosis son obligatorios.', 'error'); valid = false; }
            } else if (entryType === 'observation') {
                const s = root.querySelector('#form-patient-state')?.value;
                const o = root.querySelector('#form-specific-obs')?.value?.trim();
                if (!s || !o) { notify('El estado general y las observaciones clínicas son obligatorios.', 'error'); valid = false; }
            } else if (entryType === 'vitals') {
                const sys = root.querySelector('#vf-bp-sys')?.value;
                const hr = root.querySelector('#vf-hr')?.value;
                if (!sys && !hr) { notify('Ingrese al menos la Tensión Arterial o la Frecuencia Cardíaca.', 'error'); valid = false; }
            }
            if (!valid) return;

            saveTreatmentLog({
                entryType,
                shift: root.querySelector('#form-shift')?.value,
                // Tratamiento
                procedureType: root.querySelector('#form-procedure-type')?.value,
                bodyRegion: root.querySelector('#form-body-region')?.value,
                materials: root.querySelector('#form-materials')?.value,
                procedureDetail: root.querySelector('#form-procedure-detail')?.value,
                patientResponse: root.querySelector('#form-patient-response')?.value,
                complications: root.querySelector('#form-complications')?.value,
                nextSteps: root.querySelector('#form-next-steps')?.value,
                // Medicación
                medication: root.querySelector('#form-medication')?.value,
                medGeneric: root.querySelector('#form-med-generic')?.value,
                dose: root.querySelector('#form-dose')?.value,
                route: root.querySelector('#form-route')?.value,
                frequency: root.querySelector('#form-frequency')?.value,
                adminTime: root.querySelector('#form-admin-time')?.value,
                tolerance: root.querySelector('#form-tolerance')?.value,
                adverse: root.querySelector('#form-adverse')?.value,
                // Observación
                patientState: root.querySelector('#form-patient-state')?.value,
                consciousness: root.querySelector('#form-consciousness')?.value,
                bp: root.querySelector('#form-bp')?.value,
                hr: root.querySelector('#form-hr')?.value,
                temp: root.querySelector('#form-temp')?.value,
                spo2: root.querySelector('#form-spo2')?.value,
                rr: root.querySelector('#form-rr')?.value,
                glucose: root.querySelector('#form-glucose')?.value,
                pain: root.querySelector('#form-pain')?.value,
                respiratory: root.querySelector('#form-respiratory')?.value,
                skin: root.querySelector('#form-skin')?.value,
                specificObs: root.querySelector('#form-specific-obs')?.value,
                alerts: root.querySelector('#form-alerts')?.value,
                // Signos Vitales
                vfBpSys: root.querySelector('#vf-bp-sys')?.value,
                vfBpDia: root.querySelector('#vf-bp-dia')?.value,
                vfHr: root.querySelector('#vf-hr')?.value,
                vfSpo2: root.querySelector('#vf-spo2')?.value,
                vfTemp: root.querySelector('#vf-temp')?.value,
                vfRr: root.querySelector('#vf-rr')?.value,
                vfGlucose: root.querySelector('#vf-glucose')?.value,
                vfWeight: root.querySelector('#vf-weight')?.value,
                vfPain: root.querySelector('#vf-pain')?.value,
                vfAvpu: root.querySelector('#vf-avpu')?.value,
                vfRespiratory: root.querySelector('#vf-respiratory')?.value,
                vfSkin: root.querySelector('#vf-skin')?.value,
                vfNotes: root.querySelector('#vf-notes')?.value,
                // Signos Vitales compartidos (sv-*) — en Tratamiento, Medicación y Observación
                svBpSys: root.querySelector('#sv-bp-sys')?.value,
                svBpDia: root.querySelector('#sv-bp-dia')?.value,
                svHr: root.querySelector('#sv-hr')?.value,
                svSpo2: root.querySelector('#sv-spo2')?.value,
                svTemp: root.querySelector('#sv-temp')?.value,
                svRr: root.querySelector('#sv-rr')?.value,
                svGlucose: root.querySelector('#sv-glucose')?.value,
                svPain: root.querySelector('#sv-pain')?.value
            });
            closeTreatmentModal();
            loadLogs();
            refreshTimeline();
            refreshStats();
            notify('Registro guardado e inmutable. Visible para el turno entrante.', 'success');
        });

        // Cerrar modal enmienda
        root.querySelector('#close-amend-modal')?.addEventListener('click', closeAmendModal);
        root.querySelector('#cancel-amend-btn')?.addEventListener('click', closeAmendModal);
        root.querySelector('#amend-modal')?.addEventListener('click', e => {
            if (e.target.id === 'amend-modal') closeAmendModal();
        });

        // Guardar enmienda
        root.querySelector('#save-amend-btn')?.addEventListener('click', () => {
            const detail = root.querySelector('#amend-detail')?.value?.trim();
            if (!detail) { notify('Describa la corrección antes de guardar.', 'error'); return; }
            const origLog = state.logs.find(l => l.id === state.amendingLogId);
            saveTreatmentLog({
                entryType: 'amendment',
                shift: origLog?.shift || SHIFTS[0],
                detail: `ENMIENDA al registro anterior: ${detail}`,
                isAmendment: true,
                amendedLogId: state.amendingLogId
            });
            closeAmendModal();
            loadLogs();
            refreshTimeline();
            refreshStats();
            notify('✏️ Enmienda registrada. El registro original permanece intacto.', 'success');
        });
    }

    // ─── Notificación toast ──────────────────────────────────────────────────────
    function notify(message, type = 'info') {
        const colors = { success: 'var(--success)', error: 'var(--danger)', warning: 'var(--warning)', info: 'var(--info)' };
        const n = document.createElement('div');
        n.style.cssText = `position:fixed;top:20px;right:20px;padding:1rem 1.5rem;
            background:${colors[type] || colors.info};color:white;border-radius:var(--radius);
            box-shadow:var(--shadow-lg);z-index:10000;animation:slideIn 0.3s ease;
            max-width:380px;font-size:0.88rem;line-height:1.4;`;
        n.textContent = message;
        document.body.appendChild(n);
        setTimeout(() => { n.style.opacity = '0'; n.style.transition = 'opacity 0.3s'; setTimeout(() => n.remove(), 300); }, 4500);
    }

    // ─── Suscripción reactiva ────────────────────────────────────────────────────
    const unsub = store.subscribe('treatmentLogs', () => {
        loadLogs();
        refreshTimeline();
        refreshStats();
    });

    // ─── Init ────────────────────────────────────────────────────────────────────
    render();

    return {
        refresh: render,
        destroy() { unsub && unsub(); }
    };
}
