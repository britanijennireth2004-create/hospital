import { Logger } from '../utils/logger.js';

/**
 * Módulo de Comunicación y Notificaciones — Estilo Gmail
 * Sin sidebar interno, carpetas controladas por routeId del menú principal
 */

const ico = {
  inbox: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>`,
  sent: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 20.49 12 17.77 5.82 20.49 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starFill: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 20.49 12 17.77 5.82 20.49 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  alert: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`,
  compose: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  back: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
  refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  markRead: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/></svg>`,
  reply: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>`,
  selectAll: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>`,
  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
};

const CSS = `
<style>
.notif-module { display:flex; flex-direction:column; height:calc(100vh - var(--header-height) - 2rem); background:#fff; border-radius:var(--radius-lg); box-shadow:var(--shadow-lg); overflow:hidden; }
.notif-toolbar { display:flex; align-items:center; gap:0.5rem; padding:0.5rem 1rem; border-bottom:1px solid var(--border); background:var(--card); min-height:48px; flex-shrink:0; }
.notif-toolbar-btn { width:32px; height:32px; border:none; background:transparent; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); transition:all .15s; }
.notif-toolbar-btn:hover { background:var(--border); color:var(--text); }
.notif-new-btn { display:flex; align-items:center; gap:8px; padding:0.5rem 1.25rem; background:var(--accent); color:white; border:none; border-radius:var(--radius); font-size:0.82rem; font-weight:600; cursor:pointer; transition:all .2s; box-shadow:0 2px 6px rgba(0,0,0,0.1); }
.notif-new-btn:hover { box-shadow:0 4px 12px rgba(0,0,0,0.18); transform:translateY(-1px); }
.notif-search { flex:1; max-width:500px; position:relative; }
.notif-search input { width:100%; padding:0.45rem 0.75rem 0.45rem 2.25rem; border:1px solid var(--border); border-radius:24px; font-size:0.8rem; background:var(--bg-light); box-sizing:border-box; transition:all .2s; }
.notif-search input:focus { background:white; box-shadow:0 2px 8px rgba(0,0,0,0.08); border-color:var(--accent); outline:none; }
.notif-search-icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; }
.notif-info { font-size:0.72rem; color:var(--muted); white-space:nowrap; margin-left:auto; }
.notif-list { flex:1; overflow-y:auto; }
.notif-row { display:flex; align-items:center; gap:0; padding:0; border-bottom:1px solid #f0f0f0; cursor:pointer; transition:background .1s; }
.notif-row:hover { background:#f8faf8; box-shadow:inset 0 -1px 0 #e8e8e8, inset 0 1px 0 #e8e8e8; z-index:1; }
.notif-row.unread { background:#f0f7f0; }
.notif-row.unread .msg-sender, .notif-row.unread .msg-subject { font-weight:700; }
.notif-row.selected { background:#c2e7ff !important; }
.notif-row .row-check { width:44px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.notif-row .row-check input { width:16px; height:16px; cursor:pointer; accent-color:var(--accent); }
.notif-row .row-star { width:32px; display:flex; align-items:center; justify-content:center; flex-shrink:0; cursor:pointer; }
.notif-row .row-star:hover svg { transform:scale(1.2); }
.notif-row .msg-sender { width:180px; font-size:0.82rem; color:var(--text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; padding:0.65rem 0.5rem; flex-shrink:0; }
.notif-row .msg-content { flex:1; display:flex; align-items:baseline; gap:6px; padding:0.65rem 0.5rem; min-width:0; overflow:hidden; }
.notif-row .msg-subject { font-size:0.82rem; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex-shrink:0; max-width:260px; }
.notif-row .msg-preview { font-size:0.78rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
.notif-row .msg-badges { display:flex; gap:4px; align-items:center; flex-shrink:0; padding:0 4px; }
.notif-row .msg-date { width:80px; text-align:right; font-size:0.72rem; padding:0.65rem 0.5rem 0.65rem 0; flex-shrink:0; color:var(--muted); }
.notif-row.unread .msg-date { color:var(--text); font-weight:600; }
.notif-row .row-actions { display:flex; gap:2px; flex-shrink:0; padding-right:0.5rem; }
.notif-row .row-actions .notif-toolbar-btn { width:28px; height:28px; }
.notif-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4rem 2rem; color:var(--muted); flex:1; }
.notif-empty svg { opacity:0.15; margin-bottom:1rem; transform:scale(3); }
.notif-detail { flex:1; overflow-y:auto; display:flex; flex-direction:column; }
.notif-detail-header { padding:1.25rem 1.5rem; border-bottom:1px solid var(--border); display:flex; align-items:flex-start; gap:1rem; }
.notif-detail-body { padding:1.5rem; flex:1; }
.notif-avatar { width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.1rem; color:white; flex-shrink:0; }
.badge-ch { display:inline-flex; padding:1px 8px; border-radius:12px; font-size:0.65rem; font-weight:600; }
.badge-pr { display:inline-flex; padding:1px 8px; border-radius:12px; font-size:0.65rem; font-weight:600; }
.notif-compose { flex:1; display:flex; flex-direction:column; overflow:hidden; }
.notif-compose-header { padding:0.85rem 1.25rem; background:var(--bg-light); border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
.notif-compose-form { flex:1; display:flex; flex-direction:column; }
.notif-compose-field { display:flex; align-items:center; gap:8px; padding:0 1.25rem; border-bottom:1px solid #f0f0f0; }
.notif-compose-field label { font-size:0.78rem; color:var(--muted); width:55px; font-weight:500; flex-shrink:0; }
.notif-compose-field input, .notif-compose-field select { flex:1; border:none; padding:0.6rem 0; font-size:0.85rem; outline:none; background:transparent; font-family:inherit; }
.notif-compose-field select { cursor:pointer; }
.notif-compose-textarea { flex:1; border:none; padding:1rem 1.25rem; font-size:0.88rem; resize:none; outline:none; font-family:inherit; line-height:1.65; }
.notif-compose-footer { padding:0.65rem 1.25rem; border-top:1px solid var(--border); display:flex; align-items:center; gap:0.75rem; }
.notif-send-btn { padding:0.5rem 2rem; background:var(--accent); color:white; border:none; border-radius:var(--radius); font-size:0.85rem; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .2s; }
.notif-send-btn:hover { box-shadow:0 3px 10px rgba(0,0,0,0.15); }
.notif-discard-btn { margin-left:auto; width:32px; height:32px; border:none; background:transparent; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); }
.notif-discard-btn:hover { background:#fee2e2; color:#ef4444; }
@media(max-width:768px){ .notif-row .msg-sender{width:100px;} .notif-row .msg-subject{max-width:140px;} }
</style>
`;

const ROUTE_MAP = { notif_inbox: 'inbox', notif_sent: 'sent', notif_reminders: 'reminders', notif_alerts: 'alerts' };

export default function mountNotifications(root, { bus, store, user, role, routeId }) {
  const state = {
    folder: ROUTE_MAP[routeId] || 'inbox',
    search: '',
    selectedIds: new Set(),
    view: 'list',       // 'list' | 'detail' | 'compose'
    viewingId: null,
    replyTo: null
  };

  const canSend = ['admin', 'receptionist', 'doctor', 'nurse'].includes(role);
  const canManage = ['admin', 'receptionist'].includes(role);
  let allData = { messages: [], notifications: [], reminders: [] };
  let subs = [];

  // === HELPERS ===
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  function fmtDate(ts) {
    if (!ts) return '';
    const d = new Date(ts), now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
    return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' });
  }

  function fmtFull(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
  }

  function getActorName(id) {
    if (!id || id === 'system') return 'Sistema';
    const u = store.find('users', id); if (u) return u.name;
    const d = store.find('doctors', id); if (d) return d.name;
    const p = store.find('patients', id); if (p) return p.name;
    return id;
  }

  function avatarColor(name) {
    const colors = ['#0f8d3a', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#6366f1'];
    let h = 0; for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return colors[Math.abs(h) % colors.length];
  }

  function chBadge(ch) {
    const m = { email: { l: 'Email', c: '#3b82f6', b: '#dbeafe' }, sms: { l: 'SMS', c: '#8b5cf6', b: '#ede9fe' }, push: { l: 'Push', c: '#f59e0b', b: '#fef3c7' }, internal: { l: 'Interna', c: '#10b981', b: '#d1fae5' }, system: { l: 'Sistema', c: '#6b7280', b: '#f3f4f6' } };
    const v = m[ch] || m.system;
    return `<span class="badge-ch" style="color:${v.c};background:${v.b};">${v.l}</span>`;
  }

  function prBadge(p) {
    const m = { critical: { l: 'Urgente', c: '#dc2626', b: '#fee2e2' }, high: { l: 'Alta', c: '#ea580c', b: '#ffedd5' }, normal: { l: 'Normal', c: '#3b82f6', b: '#dbeafe' }, low: { l: 'Baja', c: '#6b7280', b: '#f3f4f6' } };
    const v = m[p] || m.normal;
    return `<span class="badge-pr" style="color:${v.c};background:${v.b};">${v.l}</span>`;
  }

  // === DATA ===
  function loadData() {
    allData.messages = store.get('messages') || [];
    allData.notifications = store.get('notifications') || [];
    allData.reminders = store.get('reminders') || [];
    generateAutoReminders();
  }

  function generateAutoReminders() {
    const apts = store.get('appointments') || [];
    const now = Date.now(), in48 = now + 48 * 3600000;
    const existing = new Set(allData.reminders.map(r => r.appointmentId));
    apts.forEach(a => {
      if (a.status !== 'scheduled' || existing.has(a.id)) return;
      const t = new Date(a.dateTime).getTime();
      if (t > now && t <= in48) {
        const p = store.find('patients', a.patientId), d = store.find('doctors', a.doctorId);
        if (!p || !d) return;
        store.add('reminders', { appointmentId: a.id, recipientId: a.patientId, recipientName: p.name, title: 'Recordatorio de cita médica', content: `Tiene una cita con ${d.name} el ${fmtFull(a.dateTime)}.`, channel: 'internal', priority: 'normal', status: 'pending', type: 'appointment_reminder', createdBy: 'system', createdAt: now });
      }
    });
    allData.reminders = store.get('reminders') || [];
  }

  function getAllItems() {
    const all = [
      ...allData.messages.map(m => ({ ...m, _src: 'messages' })),
      ...allData.notifications.map(n => ({ ...n, _src: 'notifications' })),
      ...allData.reminders.map(r => ({ ...r, _src: 'reminders' }))
    ];
    if (role === 'patient') return all.filter(i => i.recipientId === user.patientId || i.recipientId === user.id || i.createdBy === user.id);
    if (role === 'doctor') return all.filter(i => i.recipientId === user.doctorId || i.recipientId === user.id || i.createdBy === user.id);
    return all;
  }

  function getFolderItems() {
    let items = getAllItems();
    if (state.folder === 'inbox') items = items.filter(i => i.createdBy !== user.id && !i.deleted);
    else if (state.folder === 'sent') items = items.filter(i => i.createdBy === user.id && !i.deleted);
    else if (state.folder === 'reminders') items = items.filter(i => i._src === 'reminders' && !i.deleted);
    else if (state.folder === 'alerts') items = items.filter(i => (i.priority === 'critical' || i.priority === 'high' || i._src === 'notifications') && !i.deleted);
    if (state.search) {
      const s = state.search.toLowerCase();
      items = items.filter(i => (i.title || '').toLowerCase().includes(s) || (i.content || '').toLowerCase().includes(s) || (i.recipientName || '').toLowerCase().includes(s) || getActorName(i.createdBy).toLowerCase().includes(s));
    }
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return items;
  }

  function folderTitle() {
    const map = { inbox: 'Bandeja de entrada', sent: 'Enviados', reminders: 'Recordatorios', alerts: 'Alertas' };
    return map[state.folder] || 'Bandeja de entrada';
  }

  // === RENDER PRINCIPAL ===
  function render() {
    const items = getFolderItems();
    root.innerHTML = CSS + `
    <div class="notif-module">
      ${state.view === 'compose' ? renderCompose() : state.view === 'detail' ? renderDetail() : renderList(items)}
    </div>`;
    setupEvents();
  }

  // === VISTA LISTA ===
  function renderList(items) {
    return `
      <div class="notif-toolbar">
        ${canSend ? `<button class="notif-new-btn" id="btn-new">${ico.plus} Nuevo</button>` : ''}
        <div style="width:1px;height:24px;background:var(--border);margin:0 0.25rem;"></div>
        <button class="notif-toolbar-btn" id="tb-selectall" title="Seleccionar todo">${ico.selectAll}</button>
        <button class="notif-toolbar-btn" id="tb-refresh" title="Actualizar">${ico.refresh}</button>
        ${state.selectedIds.size > 0 ? `
          <button class="notif-toolbar-btn" id="tb-markread" title="Marcar como leído" style="color:var(--accent);">${ico.markRead}</button>
          <button class="notif-toolbar-btn" id="tb-delete" title="Eliminar" style="color:var(--danger);">${ico.trash}</button>
          <span style="font-size:0.75rem;color:var(--muted);font-weight:500;">${state.selectedIds.size} seleccionados</span>
        ` : ''}
        <div class="notif-search">
          <span class="notif-search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input id="notif-search" type="text" placeholder="Buscar en ${folderTitle().toLowerCase()}..." value="${state.search}">
        </div>
        <span class="notif-info">${folderTitle()} — ${items.length} mensaje${items.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="notif-list">
        ${items.length === 0 ? renderEmpty() : items.map(i => renderRow(i)).join('')}
      </div>`;
  }

  function renderRow(item) {
    const sender = state.folder === 'sent' ? `Para: ${item.recipientName || '—'}` : getActorName(item.createdBy);
    const isUnread = item.status === 'pending' || item.status === 'sent';
    const isSelected = state.selectedIds.has(item.id);
    return `
    <div class="notif-row ${isUnread ? 'unread' : ''} ${isSelected ? 'selected' : ''}" data-id="${item.id}">
      <div class="row-check"><input type="checkbox" ${isSelected ? 'checked' : ''} data-check="${item.id}"></div>
      <div class="row-star" data-star="${item.id}" title="Destacar">${item.starred ? ico.starFill : ico.star}</div>
      <div class="msg-sender">${sender}</div>
      <div class="msg-content">
        <span class="msg-subject">${item.title || '(sin asunto)'}</span>
        <span style="color:var(--muted);font-size:0.78rem;">—</span>
        <span class="msg-preview">${(item.content || '').replace(/\n/g, ' ')}</span>
      </div>
      <div class="msg-badges">
        ${chBadge(item.channel)}
        ${item.priority && item.priority !== 'normal' ? prBadge(item.priority) : ''}
      </div>
      <div class="msg-date">${fmtDate(item.createdAt)}</div>
      <div class="row-actions">
        <button class="notif-toolbar-btn" data-action="read" data-aid="${item.id}" title="Marcar leído">${ico.markRead}</button>
        <button class="notif-toolbar-btn" data-action="delete" data-aid="${item.id}" title="Eliminar">${ico.trash}</button>
      </div>
    </div>`;
  }

  function renderEmpty() {
    const folderIco = { inbox: ico.inbox, sent: ico.sent, reminders: ico.clock, alerts: ico.alert };
    return `<div class="notif-empty">
      ${folderIco[state.folder] || ico.inbox}
      <p style="font-size:0.95rem;margin:0.75rem 0 0.25rem;">No hay mensajes en <strong>${folderTitle()}</strong></p>
      <p style="font-size:0.78rem;margin:0;">Los mensajes que reciba aparecerán aquí</p>
    </div>`;
  }

  // === VISTA DETALLE ===
  function renderDetail() {
    const item = findItem(state.viewingId);
    if (!item) return `<div class="notif-empty"><p>Mensaje no encontrado</p></div>`;
    const senderName = getActorName(item.createdBy);
    const ac = avatarColor(senderName);
    return `
      <div class="notif-toolbar">
        <button class="notif-toolbar-btn" id="detail-back" title="Volver">${ico.back}</button>
        <div style="width:1px;height:24px;background:var(--border);margin:0 0.25rem;"></div>
        <button class="notif-toolbar-btn" data-action="delete" data-aid="${item.id}" title="Eliminar">${ico.trash}</button>
        <button class="notif-toolbar-btn" data-action="read" data-aid="${item.id}" title="Marcar como leído">${ico.markRead}</button>
        <button class="notif-toolbar-btn" data-star="${item.id}" title="Destacar">${item.starred ? ico.starFill : ico.star}</button>
        <span class="notif-info">${fmtFull(item.createdAt)}</span>
      </div>
      <div class="notif-detail">
        <div class="notif-detail-header">
          <div class="notif-avatar" style="background:${ac};">${(senderName || 'S').charAt(0).toUpperCase()}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <h3 style="margin:0;font-size:1.15rem;color:var(--text);font-weight:600;">${item.title || '(sin asunto)'}</h3>
              ${chBadge(item.channel)} ${prBadge(item.priority)}
            </div>
            <div style="margin-top:4px;font-size:0.8rem;color:var(--muted);display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
              <strong style="color:var(--text);">${senderName}</strong>
              <span>→</span>
              <span>${item.recipientName || '—'}</span>
              <span style="margin-left:auto;font-size:0.72rem;">${fmtFull(item.createdAt)}</span>
            </div>
          </div>
        </div>
        <div class="notif-detail-body">
          <div style="font-size:0.88rem;color:var(--text);line-height:1.75;white-space:pre-wrap;padding:0.5rem 0;">${item.content || 'Sin contenido'}</div>
          ${item.appointmentId ? `<div style="margin-top:1.5rem;padding:0.75rem 1rem;background:var(--modal-section-green-light);border-left:3px solid var(--accent);border-radius:0 var(--radius-sm) var(--radius-sm) 0;font-size:0.8rem;color:var(--accent-dark);"><strong>Cita vinculada:</strong> ${item.appointmentId}</div>` : ''}
          ${canSend ? `
          <div style="margin-top:2rem;padding-top:1.5rem;border-top:1px solid var(--border);">
            <button class="notif-new-btn" id="detail-reply" style="font-size:0.82rem;">${ico.reply} Responder</button>
          </div>` : ''}
        </div>
      </div>`;
  }

  // === VISTA COMPOSICIÓN (pantalla completa dentro del módulo) ===
  function renderCompose() {
    const replyTo = state.replyTo;
    const patients = store.get('patients') || [];
    const doctors = store.get('doctors') || [];
    return `
      <div class="notif-compose-header">
        <h3 style="margin:0;font-size:1rem;color:var(--text);font-weight:600;display:flex;align-items:center;gap:8px;">${ico.compose} ${replyTo ? 'Responder mensaje' : 'Nuevo mensaje'}</h3>
        <button class="notif-toolbar-btn" id="compose-cancel" title="Cancelar">${ico.close}</button>
      </div>
      <form id="compose-form" class="notif-compose-form">
        <div class="notif-compose-field">
          <label>Para</label>
          <select id="cmp-to" required>
            <option value="">Seleccionar destinatario...</option>
            <optgroup label="Pacientes">${patients.map(p => `<option value="${p.id}" data-name="${p.name}" ${replyTo && replyTo.createdBy === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}</optgroup>
            <optgroup label="Doctores">${doctors.map(d => `<option value="${d.id}" data-name="${d.name}" ${replyTo && replyTo.createdBy === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</optgroup>
          </select>
        </div>
        <div class="notif-compose-field">
          <label>Asunto</label>
          <input id="cmp-subj" required placeholder="Asunto del mensaje" value="${replyTo ? 'Re: ' + (replyTo.title || '') : ''}">
        </div>
        <div class="notif-compose-field">
          <label>Canal</label>
          <select id="cmp-ch">
            <option value="internal">Interna</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
          </select>
        </div>
        <div class="notif-compose-field">
          <label>Prioridad</label>
          <select id="cmp-pri">
            <option value="normal">Normal</option>
            <option value="low">Baja</option>
            <option value="high">Alta</option>
            <option value="critical">Urgente</option>
          </select>
        </div>
        <textarea id="cmp-body" class="notif-compose-textarea" required placeholder="Escriba el contenido del mensaje..."></textarea>
        <div class="notif-compose-footer">
          <button type="submit" class="notif-send-btn">${ico.sent} Enviar</button>
          <button type="button" class="notif-discard-btn" id="compose-discard" title="Descartar">${ico.trash}</button>
        </div>
      </form>`;
  }

  // === ACCIONES ===
  function findItem(id) { return [...allData.messages, ...allData.notifications, ...allData.reminders].find(i => i.id === id); }
  function findSrc(id) { for (const src of ['messages', 'notifications', 'reminders']) { if ((allData[src] || []).find(i => i.id === id)) return src; } return null; }

  function markRead(id) { const src = findSrc(id); if (src) store.update(src, id, { status: 'read' }); loadData(); }
  function toggleStar(id) { const src = findSrc(id); const item = findItem(id); if (src && item) store.update(src, id, { starred: !item.starred }); loadData(); }
  function deleteItem(id) { const src = findSrc(id); if (src) store.update(src, id, { deleted: true }); loadData(); }

  function bulkMarkRead() { state.selectedIds.forEach(id => markRead(id)); state.selectedIds.clear(); }
  function bulkDelete() { if (!confirm(`¿Eliminar ${state.selectedIds.size} mensajes?`)) return; state.selectedIds.forEach(id => deleteItem(id)); state.selectedIds.clear(); }

  function sendMessage(form) {
    const toSel = form.querySelector('#cmp-to');
    const rName = toSel.options[toSel.selectedIndex]?.dataset?.name || '';
    const msg = {
      recipientId: toSel.value,
      recipientName: rName,
      title: form.querySelector('#cmp-subj').value.trim(),
      content: form.querySelector('#cmp-body').value.trim(),
      channel: form.querySelector('#cmp-ch').value,
      priority: form.querySelector('#cmp-pri').value,
      status: 'sent',
      type: 'manual',
      createdBy: user.id,
      createdAt: Date.now()
    };
    store.add('messages', msg);
    store.add('communicationLogs', {
      messageId: msg.id, title: 'Mensaje enviado', content: msg.title,
      channel: msg.channel, recipientId: msg.recipientId, recipientName: rName,
      status: 'sent', type: 'log', priority: msg.priority, createdBy: user.id, createdAt: Date.now()
    });
    Logger.log(store, user, {
      action: Logger.Actions.CREATE, module: 'notifications',
      description: `Mensaje enviado a ${rName}: ${msg.title}`,
      details: { channel: msg.channel }
    });
    showToast('Mensaje enviado correctamente');
    state.view = 'list';
    state.replyTo = null;
    loadData();
    render();
  }

  function showToast(msg) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);padding:0.65rem 1.5rem;border-radius:8px;background:var(--text);color:white;font-size:0.82rem;box-shadow:var(--shadow-lg);z-index:99999;display:flex;align-items:center;gap:8px;';
    el.innerHTML = `${ico.check} ${msg}`;
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2500);
  }

  // === EVENTOS ===
  function setupEvents() {
    // --- Vista Lista ---
    const btnNew = root.querySelector('#btn-new');
    if (btnNew) btnNew.onclick = () => { state.view = 'compose'; state.replyTo = null; render(); };

    const search = root.querySelector('#notif-search');
    if (search) search.addEventListener('input', debounce(() => { state.search = search.value; render(); }, 300));

    const tbSel = root.querySelector('#tb-selectall');
    if (tbSel) tbSel.onclick = () => { const items = getFolderItems(); if (state.selectedIds.size === items.length) { state.selectedIds.clear(); } else { items.forEach(i => state.selectedIds.add(i.id)); } render(); };

    const tbRef = root.querySelector('#tb-refresh');
    if (tbRef) tbRef.onclick = () => { loadData(); render(); showToast('Actualizado'); };

    const tbMr = root.querySelector('#tb-markread');
    if (tbMr) tbMr.onclick = () => { bulkMarkRead(); render(); showToast('Marcados como leídos'); };

    const tbDel = root.querySelector('#tb-delete');
    if (tbDel) tbDel.onclick = () => { bulkDelete(); render(); };

    // Filas
    root.querySelectorAll('.notif-row').forEach(row => {
      const id = row.dataset.id;
      const chk = row.querySelector(`[data-check="${id}"]`);
      if (chk) chk.addEventListener('change', e => { e.stopPropagation(); if (e.target.checked) state.selectedIds.add(id); else state.selectedIds.delete(id); render(); });

      const starBtn = row.querySelector(`[data-star="${id}"]`);
      if (starBtn) starBtn.addEventListener('click', e => { e.stopPropagation(); toggleStar(id); render(); });

      row.addEventListener('click', e => {
        if (e.target.closest('[data-check]') || e.target.closest('[data-star]') || e.target.closest('.row-actions')) return;
        markRead(id); state.view = 'detail'; state.viewingId = id; render();
      });
    });

    // Acciones en filas (estáticas, siempre visibles)
    root.querySelectorAll('[data-action="delete"]').forEach(b => {
      b.onclick = e => { e.stopPropagation(); deleteItem(b.dataset.aid); render(); showToast('Movido a papelera'); };
    });
    root.querySelectorAll('[data-action="read"]').forEach(b => {
      b.onclick = e => { e.stopPropagation(); markRead(b.dataset.aid); render(); showToast('Marcado como leído'); };
    });

    // --- Vista Detalle ---
    const back = root.querySelector('#detail-back');
    if (back) back.onclick = () => { state.view = 'list'; state.viewingId = null; render(); };

    const detReply = root.querySelector('#detail-reply');
    if (detReply) detReply.onclick = () => { const item = findItem(state.viewingId); state.replyTo = item || null; state.view = 'compose'; render(); };

    // Star en detalle
    root.querySelectorAll('.notif-toolbar [data-star]').forEach(b => {
      b.onclick = e => { e.stopPropagation(); toggleStar(b.dataset.star); render(); };
    });

    // --- Vista Composición ---
    const compForm = root.querySelector('#compose-form');
    if (compForm) compForm.onsubmit = e => { e.preventDefault(); sendMessage(compForm); };

    const compCancel = root.querySelector('#compose-cancel');
    if (compCancel) compCancel.onclick = () => { state.view = 'list'; state.replyTo = null; render(); };

    const compDiscard = root.querySelector('#compose-discard');
    if (compDiscard) compDiscard.onclick = () => { state.view = 'list'; state.replyTo = null; render(); };
  }

  // === INIT ===
  function init() {
    loadData();
    render();
    const u1 = store.subscribe('messages', () => { loadData(); if (state.view === 'list') render(); });
    subs.push(u1);
    const u2 = store.subscribe('notifications', () => { loadData(); if (state.view === 'list') render(); });
    subs.push(u2);
    const u3 = store.subscribe('reminders', () => { loadData(); if (state.view === 'list') render(); });
    subs.push(u3);
    return { destroy() { subs.forEach(u => u()); } };
  }

  return init();
}
