// Punto de entrada principal con routing básico

import { createBus } from '../core/bus.js';
import { createStore } from '../core/store.js';
import { ICONS } from './icons.js';
import { Logger } from '../utils/logger.js';

// Estado global
const APP_STATE = {
  bus: null,
  store: null,
  user: null,
  role: null,
  currentModule: null,
  modules: {}
};

// ===== SISTEMA DE ROUTING =====
const ROUTES = {
  dashboard: {
    label: 'Dashboard',
    icon: ICONS.dashboard,
    module: () => import('../modules/dashboard.js'),
    permission: () => true
  },
  appointments: {
    label: 'Citas',
    icon: ICONS.calendar,
    module: () => import('../modules/appointments.js'),
    permission: (role) => ['admin', 'doctor', 'patient', 'receptionist', 'nurse'].includes(role)
  },
  patients: {
    label: 'Pacientes',
    icon: ICONS.users,
    module: () => import('../modules/patients.js'),
    permission: (role) => ['admin', 'doctor', 'receptionist', 'nurse'].includes(role)
  },
  doctors: {
    label: 'Médicos',
    icon: ICONS.doctor,
    module: () => import('../modules/doctors.js'),
    permission: (role) => ['admin', 'receptionist', 'doctor'].includes(role),
    parent: 'personal'
  },
  nurses: {
    label: 'Enfermeras',
    icon: ICONS.nurse,
    module: () => import('../modules/nurses.js'),
    permission: (role) => ['admin', 'receptionist', 'nurse'].includes(role),
    parent: 'personal'
  },
  receptionists: {
    label: 'Recepcionistas',
    icon: ICONS.receptionist,
    module: () => import('../modules/receptionists.js'),
    permission: (role) => ['admin', 'receptionist'].includes(role),
    parent: 'personal'
  },
  areas: {
    label: 'Áreas',
    icon: ICONS.building,
    module: () => import('../modules/areas.js'),
    permission: (role) => ['admin', 'doctor', 'receptionist', 'nurse', 'patient'].includes(role)
  },
  clinical: {
    label: 'Historia Clínica',
    icon: ICONS.clipboard,
    module: () => import('../modules/clinical.js'),
    permission: (role) => ['admin', 'doctor', 'patient', 'nurse'].includes(role)
  },
  triage: {
    label: 'Triage',
    icon: ICONS.triage,
    module: () => import('../modules/triage.js'),
    permission: (role) => ['admin', 'doctor', 'nurse', 'receptionist'].includes(role)
  },
  resources: {
    label: 'Recursos',
    icon: ICONS.resources,
    module: () => import('../modules/resources.js'),
    permission: (role) => ['admin', 'receptionist'].includes(role)
  },
  notif_inbox: {
    label: 'Bandeja de entrada',
    icon: ICONS.inbox,
    module: () => import('../modules/notifications.js'),
    permission: (role) => ['admin', 'doctor', 'receptionist', 'nurse', 'patient'].includes(role),
    parent: 'comunicaciones'
  },
  notif_sent: {
    label: 'Enviados',
    icon: ICONS.sendIcon,
    module: () => import('../modules/notifications.js'),
    permission: (role) => ['admin', 'doctor', 'receptionist', 'nurse'].includes(role),
    parent: 'comunicaciones'
  },
  notif_reminders: {
    label: 'Recordatorios',
    icon: ICONS.clockIcon,
    module: () => import('../modules/notifications.js'),
    permission: (role) => ['admin', 'doctor', 'receptionist', 'nurse', 'patient'].includes(role),
    parent: 'comunicaciones'
  },
  notif_alerts: {
    label: 'Alertas',
    icon: ICONS.alertIcon,
    module: () => import('../modules/notifications.js'),
    permission: (role) => ['admin', 'doctor', 'receptionist', 'nurse'].includes(role),
    parent: 'comunicaciones'
  },
  security: {
    label: 'Seguridad',
    icon: ICONS.lock,
    module: () => import('../modules/security.js'),
    permission: (role) => ['admin'].includes(role)
  }
};

// ===== FUNCIONES PRINCIPALES =====
function showLoading(show) {
  let loadingEl = document.getElementById('loading');
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.id = 'loading';
    loadingEl.className = 'loading-overlay';
    loadingEl.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Cargando aplicación...</p>
    `;
    document.body.appendChild(loadingEl);
  }
  loadingEl.style.display = show ? 'flex' : 'none';
}

function showError(message) {
  const appElement = document.getElementById('app');
  appElement.innerHTML = `
    <div class="error-state" style="padding: 2rem; text-align: center; max-width: 500px; margin: 3rem auto;">
      <h2 style="color: var(--danger); margin-bottom: 1rem;">¡Error!</h2>
      <p style="margin-bottom: 1.5rem; color: var(--text);">${message}</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <button onclick="location.reload()" class="btn btn-primary">
          Reintentar
        </button>
        <button onclick="localStorage.clear(); location.reload()" class="btn btn-outline">
          Limpiar datos
        </button>
      </div>
    </div>
  `;
}

// ===== LOGIN CON VALIDACIÓN REAL, BLOQUEO Y RECUPERACIÓN =====
function mountLogin(root, { onSuccess }) {
  const store = APP_STATE.store;
  const MAX_ATTEMPTS = 3;
  const LOCK_SECONDS = 30;

  const ls = {
    attempts: 0,
    lockedUntil: 0,
    lockInterval: null,
    view: 'login', // login | recover-email | recover-verify | recover-reset | recover-success
    recUser: null
  };

  // Iconos del módulo de autenticación
  const ai = {
    eye: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
    lock: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    mail: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    back: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>`,
    warn: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    key: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`
  };

  function getPassStrength(pw) {
    if (!pw) return null;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 8) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (s <= 1) return { label: 'Débil', color: '#ef4444', w: '25%' };
    if (s <= 2) return { label: 'Regular', color: '#f59e0b', w: '50%' };
    if (s <= 3) return { label: 'Buena', color: '#3b82f6', w: '75%' };
    return { label: 'Fuerte', color: '#10b981', w: '100%' };
  }

  function getLockRemaining() {
    return Math.max(0, Math.ceil((ls.lockedUntil - Date.now()) / 1000));
  }

  function validateCredentials(username, password) {
    const users = store.get('users');
    const user = users.find(u => u.username === username);
    if (!user) return { ok: false, msg: 'Usuario no encontrado. Verifique sus credenciales.' };
    if (user.isActive === false) return { ok: false, msg: 'Esta cuenta ha sido desactivada. Contacte al administrador del sistema.' };
    if (user.password !== password) return { ok: false, msg: 'Contraseña incorrecta. Verifique e intente nuevamente.' };
    return { ok: true, user };
  }

  function loginAs(role) {
    const users = store.get('users');
    const user = users.find(u => u.role === role && u.isActive !== false) || {
      id: `${role}_1`, username: role,
      name: role === 'admin' ? 'Administrador' : role === 'doctor' ? 'Dra. Ana Ruiz' : role === 'nurse' ? 'Enf. Elena Soler' : role === 'receptionist' ? 'Recepcionista Carla' : 'María Gómez',
      role, email: `${role}@hospital.com`,
      patientId: role === 'patient' ? 'p_1' : null,
      doctorId: role === 'doctor' ? 'd_1' : null
    };
    Logger.log(store, user, { action: Logger.Actions.LOGIN, module: Logger.Modules.AUTH, description: `Inicio de sesión exitoso: ${user.name}`, details: { username: user.username, role: user.role } });
    onSuccess(user);
  }

  // ====== RENDER PRINCIPAL (siempre muestra login) ======
  function render() {
    const isLocked = ls.lockedUntil > Date.now();
    root.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-form-panel">
          <h1 class="login-title">Hospital Universitario Manuel Núñez Tovar</h1>
          <p class="login-subtitle">Sistema de Gestión de Citas Médicas</p>
          <form id="login-form" class="login-form" autocomplete="off">
            <div class="login-field">
              <label class="login-label" for="login-user">Usuario</label>
              <input class="login-input" type="text" id="login-user" placeholder="Ingrese su usuario" required ${isLocked ? 'disabled' : ''} />
            </div>
            <div class="login-field">
              <label class="login-label" for="login-pass">Contraseña</label>
              <div class="auth-pw-wrap">
                <input class="login-input" type="password" id="login-pass" placeholder="Ingrese su contraseña" required ${isLocked ? 'disabled' : ''} style="padding-right:2.5rem;" />
                <button type="button" class="auth-eye" id="eye-login" tabindex="-1">${ai.eye}</button>
              </div>
            </div>
            <div id="login-error" class="auth-msg auth-err" style="display:none;"></div>
            <div id="login-warn" class="auth-msg auth-warn-msg" style="display:none;"></div>
            <div id="login-lock" class="auth-msg auth-lock-msg" style="display:${isLocked ? 'flex' : 'none'};">
              ${ai.lock}
              <span>Cuenta bloqueada temporalmente. Espere <strong id="lock-countdown">${getLockRemaining()}</strong> segundos para intentar de nuevo.</span>
            </div>
            <button type="submit" class="login-submit-btn" ${isLocked ? 'disabled' : ''}>INICIAR SESIÓN</button>
            <div class="login-recover">
              <a href="#" id="recover-link">¿Olvidó su contraseña? Recuperar acceso</a>
            </div>
          </form>
          <div class="login-footer-note">
            <strong>Prototipo de demostración:</strong> Los datos se almacenan localmente en tu navegador.
          </div>
        </div>
        <div class="login-image-panel">
          <img src="img/hospital.jpg" alt="Hospital Universitario" />
          <div class="login-image-overlay">
            <div class="brand-title">HUMNT</div>
            <div class="brand-desc">Hospital Universitario Manuel Núñez Tovar. Sistema de gestión de citas médicas.</div>
          </div>
        </div>
      </div>
      <div class="quick-access-bar">
        <span class="quick-access-label">Acceso rápido:</span>
        <button class="quick-access-btn login-btn" data-role="admin" title="Administrador">Admin</button>
        <button class="quick-access-btn login-btn" data-role="doctor" title="Médico">Médico</button>
        <button class="quick-access-btn login-btn" data-role="patient" title="Paciente">Paciente</button>
        <button class="quick-access-btn login-btn" data-role="nurse" title="Enfermera">Enfermera</button>
        <button class="quick-access-btn login-btn" data-role="receptionist" title="Recepcionista">Recepción</button>
      </div>
    </div>
    <!-- Modal de recuperación -->
    <div id="recover-modal-overlay" class="auth-modal-overlay" style="display:none;">
      <div class="auth-modal" id="recover-modal-box">
        <button class="auth-modal-close" id="recover-modal-close">${ai.back} Cerrar</button>
        <div id="recover-modal-body"></div>
      </div>
    </div>
    ${authCSS()}`;
    bindEvents();
    if (isLocked) startLockTimer();
  }

  // ====== ABRIR / CERRAR MODAL DE RECUPERACIÓN ======
  function openRecoverModal() {
    ls.view = 'recover-email';
    ls.recUser = null;
    const overlay = root.querySelector('#recover-modal-overlay');
    if (overlay) { overlay.style.display = 'flex'; }
    renderRecoverStep();
  }

  function closeRecoverModal() {
    ls.view = 'login';
    ls.recUser = null;
    const overlay = root.querySelector('#recover-modal-overlay');
    if (overlay) { overlay.style.display = 'none'; }
  }

  // ====== RENDERIZAR PASO ACTUAL DENTRO DEL MODAL ======
  function renderRecoverStep() {
    const body = root.querySelector('#recover-modal-body');
    if (!body) return;
    body.innerHTML = getRecoverStepHTML();
    bindRecoverEvents();
  }

  function getRecoverStepHTML() {
    if (ls.view === 'recover-email') return `
      <div class="auth-rec">
        <div class="auth-rec-head">
          <span class="auth-rec-ico">${ai.mail}</span>
          <h3>Recuperar Acceso</h3>
          <p>Ingrese el correo electrónico asociado a su cuenta para buscarla en el sistema</p>
        </div>
        <form id="rec-email-form">
          <div class="login-field">
            <label class="login-label" for="rec-email">Correo electrónico</label>
            <input class="login-input" type="email" id="rec-email" placeholder="ejemplo@hospital.com" required />
          </div>
          <div id="rec-error" class="auth-msg auth-err" style="display:none;"></div>
          <button type="submit" class="login-submit-btn" style="width:100%;">BUSCAR CUENTA</button>
        </form>
      </div>`;

    if (ls.view === 'recover-verify') return `
      <div class="auth-rec">
        <div class="auth-rec-head">
          <span class="auth-rec-ico">${ai.shield}</span>
          <h3>Verificación de Identidad</h3>
          <p>Cuenta encontrada: <strong>${ls.recUser.name}</strong><br>Para verificar su identidad, ingrese su nombre de usuario registrado</p>
        </div>
        <form id="rec-verify-form">
          <div class="login-field">
            <label class="login-label" for="verify-user">Nombre de usuario</label>
            <input class="login-input" type="text" id="verify-user" placeholder="Ingrese su nombre de usuario" required />
          </div>
          <div id="verify-error" class="auth-msg auth-err" style="display:none;"></div>
          <button type="submit" class="login-submit-btn" style="width:100%;">VERIFICAR IDENTIDAD</button>
        </form>
      </div>`;

    if (ls.view === 'recover-reset') return `
      <div class="auth-rec">
        <div class="auth-rec-head">
          <span class="auth-rec-ico">${ai.key}</span>
          <h3>Nueva Contraseña</h3>
          <p>Establezca una nueva contraseña para la cuenta de <strong>${ls.recUser.name}</strong></p>
        </div>
        <form id="rec-reset-form">
          <div class="login-field">
            <label class="login-label" for="new-pass">Nueva contraseña</label>
            <div class="auth-pw-wrap">
              <input class="login-input" type="password" id="new-pass" placeholder="Mínimo 6 caracteres" required minlength="6" style="padding-right:2.5rem;" />
              <button type="button" class="auth-eye" id="eye-new" tabindex="-1">${ai.eye}</button>
            </div>
            <div class="auth-str" id="pw-strength" style="display:none;">
              <div class="auth-str-bar"><div class="auth-str-fill" id="str-fill"></div></div>
              <span class="auth-str-lbl" id="str-label"></span>
            </div>
          </div>
          <div class="login-field">
            <label class="login-label" for="confirm-pass">Confirmar contraseña</label>
            <div class="auth-pw-wrap">
              <input class="login-input" type="password" id="confirm-pass" placeholder="Repita la contraseña" required minlength="6" style="padding-right:2.5rem;" />
              <button type="button" class="auth-eye" id="eye-confirm" tabindex="-1">${ai.eye}</button>
            </div>
          </div>
          <div id="reset-error" class="auth-msg auth-err" style="display:none;"></div>
          <button type="submit" class="login-submit-btn" style="width:100%;">CAMBIAR CONTRASEÑA</button>
        </form>
      </div>`;

    if (ls.view === 'recover-success') return `
      <div class="auth-rec">
        <div class="auth-rec-head">
          <span class="auth-rec-ico auth-ico-ok">${ai.check}</span>
          <h3>¡Contraseña Actualizada!</h3>
          <p>Su contraseña ha sido cambiada exitosamente.<br>Ya puede iniciar sesión con su nueva contraseña.</p>
        </div>
        <button class="login-submit-btn" id="close-success-btn" style="width:100%;">VOLVER AL LOGIN</button>
      </div>`;

    return '';
  }

  // ====== CSS ADICIONAL ======
  function authCSS() {
    return `<style>
    .auth-pw-wrap{position:relative;}
    .auth-eye{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#999;padding:4px;display:flex;align-items:center;justify-content:center;}
    .auth-eye:hover{color:#333;}
    .auth-msg{display:flex;align-items:center;gap:8px;padding:0.6rem 0.85rem;border-radius:8px;font-size:0.78rem;margin-bottom:0.65rem;animation:authIn .3s ease;line-height:1.45;}
    @keyframes authIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
    .auth-err{background:#fef2f2;color:#dc2626;border:1px solid #fecaca;}
    .auth-warn-msg{background:#fffbeb;color:#d97706;border:1px solid #fde68a;}
    .auth-lock-msg{background:#fef2f2;color:#b91c1c;border:1px solid #fca5a5;font-weight:500;}
    .auth-rec{animation:authSlide .35s ease;}
    @keyframes authSlide{from{opacity:0;transform:translateX(20px);}to{opacity:1;transform:translateX(0);}}
    .auth-rec-head{text-align:center;margin-bottom:1.5rem;}
    .auth-rec-head h3{margin:0.75rem 0 0.25rem;font-size:1.15rem;color:#1a202c;}
    .auth-rec-head p{margin:0;font-size:0.82rem;color:#6b7280;line-height:1.55;}
    .auth-rec-ico{display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#166534,#10b981);color:white;box-shadow:0 4px 12px rgba(16,185,129,0.25);}
    .auth-ico-ok{background:linear-gradient(135deg,#059669,#34d399);}
    .auth-str{display:flex;align-items:center;gap:8px;margin-top:6px;}
    .auth-str-bar{flex:1;height:4px;background:#e5e7eb;border-radius:4px;overflow:hidden;}
    .auth-str-fill{height:100%;border-radius:4px;transition:all .3s ease;}
    .auth-str-lbl{font-size:0.68rem;font-weight:600;white-space:nowrap;}
    @keyframes authShake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(8px);}60%{transform:translateX(-5px);}80%{transform:translateX(5px);}}
    .auth-shake{animation:authShake .4s ease;}
    /* ====== MODAL DE RECUPERACIÓN ====== */
    .auth-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:9999;align-items:center;justify-content:center;animation:authModalFadeIn .25s ease;}
    @keyframes authModalFadeIn{from{opacity:0;}to{opacity:1;}}
    .auth-modal{background:#fff;border-radius:16px;width:100%;max-width:440px;padding:2rem;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.25);animation:authModalSlideUp .3s ease;}
    @keyframes authModalSlideUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
    .auth-modal-close{position:absolute;top:12px;right:14px;background:none;border:none;cursor:pointer;color:#6b7280;font-size:0.8rem;display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:6px;transition:all .2s;}
    .auth-modal-close:hover{background:#f3f4f6;color:#1f2937;}
    .auth-modal .login-field{margin-bottom:1rem;}
    .auth-modal .login-label{display:block;margin-bottom:0.35rem;font-size:0.8rem;font-weight:600;color:#374151;}
    .auth-modal .login-input{width:100%;padding:0.65rem 0.85rem;border:1.5px solid #d1d5db;border-radius:8px;font-size:0.88rem;transition:border-color .2s;background:#f9fafb;box-sizing:border-box;}
    .auth-modal .login-input:focus{outline:none;border-color:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,0.1);}
    .auth-modal .login-submit-btn{display:block;width:100%;padding:0.7rem;background:linear-gradient(135deg,#166534,#10b981);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:0.88rem;cursor:pointer;transition:all .2s;letter-spacing:0.03em;}
    .auth-modal .login-submit-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(16,185,129,0.3);}
    @media(max-width:500px){.auth-modal{max-width:95%;margin:1rem;padding:1.5rem;}}
    </style>`;
  }

  // ====== EVENTOS PRINCIPALES (login + apertura modal) ======
  function bindEvents() {
    // --- Toggle password (login) ---
    const eyeBtn = root.querySelector('#eye-login');
    const passInput = root.querySelector('#login-pass');
    if (eyeBtn && passInput) eyeBtn.onclick = () => { const v = passInput.type === 'password'; passInput.type = v ? 'text' : 'password'; eyeBtn.innerHTML = v ? ai.eyeOff : ai.eye; };

    // --- Mostrar error inline ---
    function showErr(id, msg) {
      const el = root.querySelector('#' + id) || document.querySelector('#' + id);
      if (el) { el.innerHTML = `${ai.warn} <span>${msg}</span>`; el.style.display = 'flex'; }
    }

    // --- LOGIN FORM ---
    const loginForm = root.querySelector('#login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (ls.lockedUntil > Date.now()) return;

        const username = root.querySelector('#login-user').value.trim();
        const password = root.querySelector('#login-pass').value;
        const result = validateCredentials(username, password);

        if (result.ok) {
          ls.attempts = 0;
          Logger.log(store, result.user, { action: Logger.Actions.LOGIN, module: Logger.Modules.AUTH, description: `Inicio de sesión exitoso: ${result.user.name}`, details: { username: result.user.username, role: result.user.role } });
          onSuccess(result.user);
        } else {
          ls.attempts++;
          loginForm.classList.add('auth-shake');
          setTimeout(() => loginForm.classList.remove('auth-shake'), 450);

          if (ls.attempts >= MAX_ATTEMPTS) {
            ls.lockedUntil = Date.now() + LOCK_SECONDS * 1000;
            ls.attempts = 0;
            Logger.log(store, { id: 'system', name: 'Sistema' }, { action: Logger.Actions.UPDATE, module: Logger.Modules.AUTH, description: `Cuenta bloqueada por múltiples intentos fallidos: ${username}`, details: { username } });
            render();
          } else {
            showErr('login-error', result.msg);
            const warnEl = root.querySelector('#login-warn');
            if (warnEl) {
              warnEl.innerHTML = `${ai.warn} <span>Intento ${ls.attempts} de ${MAX_ATTEMPTS}. Después de ${MAX_ATTEMPTS} intentos fallidos la cuenta se bloqueará temporalmente.</span>`;
              warnEl.style.display = 'flex';
            }
          }
        }
      });
    }

    // --- ABRIR MODAL RECUPERACIÓN ---
    const recLink = root.querySelector('#recover-link');
    if (recLink) recLink.onclick = (e) => { e.preventDefault(); openRecoverModal(); };

    // --- CERRAR MODAL ---
    const closeBtn = root.querySelector('#recover-modal-close');
    if (closeBtn) closeBtn.onclick = () => closeRecoverModal();

    // --- Cerrar modal al hacer click en el backdrop ---
    const overlay = root.querySelector('#recover-modal-overlay');
    if (overlay) overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeRecoverModal();
    });

    // --- QUICK ACCESS ---
    root.querySelectorAll('.login-btn').forEach(btn => {
      btn.addEventListener('click', () => { const r = btn.dataset.role; if (r) loginAs(r); });
    });
  }

  // ====== EVENTOS DEL MODAL DE RECUPERACIÓN (se re-bindean en cada paso) ======
  function bindRecoverEvents() {
    function showErr(id, msg) {
      const el = document.querySelector('#' + id);
      if (el) { el.innerHTML = `${ai.warn} <span>${msg}</span>`; el.style.display = 'flex'; }
    }

    // Toggle eyes dentro del modal
    function bindEye(eyeId, inputId) {
      const btn = document.querySelector('#' + eyeId);
      const inp = document.querySelector('#' + inputId);
      if (btn && inp) btn.onclick = () => { const v = inp.type === 'password'; inp.type = v ? 'text' : 'password'; btn.innerHTML = v ? ai.eyeOff : ai.eye; };
    }
    bindEye('eye-new', 'new-pass');
    bindEye('eye-confirm', 'confirm-pass');

    // PASO 1 — Buscar email
    const emailForm = document.querySelector('#rec-email-form');
    if (emailForm) {
      emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.querySelector('#rec-email').value.trim().toLowerCase();
        const users = store.get('users');
        const user = users.find(u => u.email && u.email.toLowerCase() === email);
        if (!user) { showErr('rec-error', 'No se encontró una cuenta asociada a este correo electrónico.'); return; }
        if (user.isActive === false) { showErr('rec-error', 'Esta cuenta está desactivada. Contacte al administrador.'); return; }
        ls.recUser = user;
        ls.view = 'recover-verify';
        renderRecoverStep();
      });
    }

    // PASO 2 — Verificar username
    const verifyForm = document.querySelector('#rec-verify-form');
    if (verifyForm) {
      verifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.querySelector('#verify-user').value.trim();
        if (input !== ls.recUser.username) { showErr('verify-error', 'El nombre de usuario no coincide. Verifique e intente nuevamente.'); return; }
        ls.view = 'recover-reset';
        renderRecoverStep();
      });
    }

    // PASO 3 — Nueva contraseña
    const resetForm = document.querySelector('#rec-reset-form');
    if (resetForm) {
      const newPw = document.querySelector('#new-pass');
      if (newPw) newPw.addEventListener('input', () => {
        const s = getPassStrength(newPw.value);
        const strDiv = document.querySelector('#pw-strength');
        const fill = document.querySelector('#str-fill');
        const lbl = document.querySelector('#str-label');
        if (!strDiv) return;
        if (!newPw.value) { strDiv.style.display = 'none'; return; }
        if (s) { strDiv.style.display = 'flex'; fill.style.width = s.w; fill.style.background = s.color; lbl.textContent = s.label; lbl.style.color = s.color; }
      });

      resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const np = document.querySelector('#new-pass').value;
        const cp = document.querySelector('#confirm-pass').value;
        if (np.length < 6) { showErr('reset-error', 'La contraseña debe tener al menos 6 caracteres.'); return; }
        if (np !== cp) { showErr('reset-error', 'Las contraseñas no coinciden. Verifique e intente nuevamente.'); return; }
        store.update('users', ls.recUser.id, { password: np });
        Logger.log(store, ls.recUser, { action: Logger.Actions.UPDATE, module: Logger.Modules.AUTH, description: `Contraseña recuperada exitosamente: ${ls.recUser.name}`, details: { userId: ls.recUser.id } });
        ls.view = 'recover-success';
        renderRecoverStep();
      });
    }

    // Éxito — cerrar modal
    const closeSuccess = document.querySelector('#close-success-btn');
    if (closeSuccess) closeSuccess.onclick = () => closeRecoverModal();
  }

  // ====== LOCK COUNTDOWN ======
  function startLockTimer() {
    if (ls.lockInterval) clearInterval(ls.lockInterval);
    ls.lockInterval = setInterval(() => {
      const rem = getLockRemaining();
      const el = root.querySelector('#lock-countdown');
      if (el) el.textContent = rem;
      if (rem <= 0) { clearInterval(ls.lockInterval); ls.lockInterval = null; ls.lockedUntil = 0; render(); }
    }, 1000);
  }

  // Render inicial
  render();
}

// ===== APP SHELL =====
async function mountAppShell(root, { user, bus, store }) {
  const state = {
    currentRoute: 'dashboard'
  };

  // Renderizar shell
  function render() {
    root.innerHTML = `
      <div class="app-shell">
        <!-- Header -->
        <header class="app-header">
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-left: 1rem;">
            <div style="font-weight: bold;">Hospital Universitario Manuel Núñez Tovar</div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div class="user-info" style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="text-align: right;">
                <div style="font-weight: 500;">${user.name}</div>
                <div style="font-size: 0.875rem; color: var(--card);">${user.role.toUpperCase()}</div>
              </div>
              <div style="width: 36px; height: 36px; background: var(--modal-section-green-light); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                ${user.name.charAt(0)}
              </div>
            </div>
            <button class="btn btn-sm" id="btn-logout" title="Cerrar Sesión" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; border-radius: 50%; border: none; background: transparent;">
              <!-- Span que aplica el color mediante la variable CSS --danger -->
              <span style="display: flex; align-items: center; justify-content: center; color: var(--danger);">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <!-- Icono de logout (salida) -->
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </span>
            </button>
          </div>
        </header>

        <!-- Main content -->
        <main class="app-main">
          <!-- Sidebar siempre visible -->
          <nav class="app-sidebar">
            <div class="nav-menu">
              <div style="font-weight: bold; font-size: 0.75rem; margin-bottom: 0.5rem; color: var(--muted); padding: 0 0.75rem; letter-spacing: 0.05em;">MENÚ PRINCIPAL</div>
              <div id="nav-links">
                ${(() => {
        const items = [];
        const personalRoutes = Object.entries(ROUTES).filter(([_, r]) => r.parent === 'personal' && r.permission(user.role));
        const comRoutes = Object.entries(ROUTES).filter(([_, r]) => r.parent === 'comunicaciones' && r.permission(user.role));

        const renderRoute = (id, r) => `
                    <button class="nav-btn ${state.currentRoute === id ? 'active' : ''}" data-route="${id}">
                      <span>${r.icon}</span>
                      <span>${r.label}</span>
                    </button>
                  `;

        const renderDropdown = (id, label, icon, routes) => {
          if (routes.length === 0) return '';
          const isSubActive = routes.some(([subId]) => state.currentRoute === subId);
          return `
                      <div class="nav-dropdown-container ${isSubActive ? 'open' : ''}" id="${id}-dropdown-container">
                        <button class="nav-btn dropdown-trigger" id="${id}-dropdown-btn">
                          <span>${icon}</span>
                          <span>${label}</span>
                          <span id="${id}-badge-total" class="nav-badge-total"></span>
                          <span class="chevron" style="margin-left: auto;">${ICONS.chevronDown}</span>
                        </button>
                        <div class="nav-dropdown-content">
                          ${routes.map(([subId, subR]) => `
                            <button class="nav-btn sub-btn ${state.currentRoute === subId ? 'active' : ''}" data-route="${subId}">
                              <span>${subR.icon}</span>
                              <span>${subR.label}</span>
                              <span id="nav-badge-${subId}" class="nav-badge-sub"></span>
                            </button>
                          `).join('')}
                        </div>
                      </div>
                    `;
        };

        const mainRoutes = Object.entries(ROUTES).filter(([_, r]) => !r.parent && r.permission(user.role));

        mainRoutes.forEach(([id, r]) => {
          items.push(renderRoute(id, r));
          if (id === 'patients') {
            items.push(renderDropdown('personal', 'Personal', ICONS.staff, personalRoutes));
          }
          if (id === 'resources') {
            items.push(renderDropdown('comunicaciones', 'Comunicaciones', ICONS.notifications, comRoutes));
          }
        });

        if (!mainRoutes.some(([id]) => id === 'patients') && personalRoutes.length > 0) {
          items.push(renderDropdown('personal', 'Personal', ICONS.staff, personalRoutes));
        }
        if (!mainRoutes.some(([id]) => id === 'resources') && comRoutes.length > 0) {
          items.push(renderDropdown('comunicaciones', 'Comunicaciones', ICONS.notifications, comRoutes));
        }

        return items.join('');
      })()}
              </div>
            </div>
          </nav>

          <!-- Content area -->
          <div class="app-content">
            <div id="module-container"></div>
          </div>
        </main>
      </div>

      <style>
        .nav-dropdown-container { display: flex; flex-direction: column; overflow: hidden; }
        .nav-dropdown-content { 
          display: none; 
          flex-direction: column; 
          padding-left: 0.75rem; 
          background: rgba(0,0,0,0.03); 
          border-radius: 8px;
          margin: 0.25rem 0.75rem;
        }
        .nav-dropdown-container.open .nav-dropdown-content { display: flex; }
        .nav-dropdown-container.open .chevron { transform: rotate(180deg); }
        .chevron { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .sub-btn { font-size: 0.8rem !important; height: 38px !important; margin: 2px 0 !important; }
        .dropdown-trigger { width: 100% !important; cursor: pointer; }
        .nav-badge-total {
          display: none;
          min-width: 18px; height: 18px;
          background: #ef4444; color: white;
          font-size: 0.6rem; font-weight: 700;
          border-radius: 50%; padding: 0 4px;
          align-items: center; justify-content: center;
          margin-left: auto;
          line-height: 18px; text-align: center;
        }
        .nav-badge-total.visible { display: inline-flex; }
        .nav-badge-sub {
          display: none;
          min-width: 16px; height: 16px;
          background: #ef4444; color: white;
          font-size: 0.55rem; font-weight: 700;
          border-radius: 50%; padding: 0 3px;
          align-items: center; justify-content: center;
          margin-left: auto;
          line-height: 16px; text-align: center;
        }
        .nav-badge-sub.visible { display: inline-flex; }
      </style>
    `;

    // Configurar navegación
    root.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.classList.contains('dropdown-trigger')) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const containerId = btn.id.replace('-dropdown-btn', '-dropdown-container');
          const container = document.getElementById(containerId);
          if (container) container.classList.toggle('open');
        });
        return;
      }
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        navigateTo(route);
      });
    });

    // === Sistema de badges de notificaciones ===
    function getUnreadCounts() {
      const msgs = store.get('messages') || [];
      const notifs = store.get('notifications') || [];
      const rems = store.get('reminders') || [];
      const all = [...msgs, ...notifs, ...rems].filter(i => !i.deleted);
      const isUnread = i => i.status === 'pending' || i.status === 'sent' || i.status === 'scheduled';
      // Filtrar por rol
      let visible = all;
      if (user.role === 'patient') visible = all.filter(i => i.recipientId === user.patientId || i.recipientId === user.id || i.createdBy === user.id);
      else if (user.role === 'doctor') visible = all.filter(i => i.recipientId === user.doctorId || i.recipientId === user.id || i.createdBy === user.id);
      const inbox = visible.filter(i => i.createdBy !== user.id && isUnread(i)).length;
      const sent = 0;
      const reminders = rems.filter(i => !i.deleted && isUnread(i)).length;
      const alerts = visible.filter(i => (i.priority === 'critical' || i.priority === 'high') && isUnread(i)).length;
      return { inbox, sent, reminders, alerts, total: inbox + reminders + alerts };
    }

    function updateNotifBadges() {
      const counts = getUnreadCounts();
      // Badge total en Comunicaciones
      const totalBadge = document.getElementById('comunicaciones-badge-total');
      if (totalBadge) {
        if (counts.total > 0) {
          totalBadge.textContent = counts.total > 99 ? '99+' : counts.total;
          totalBadge.classList.add('visible');
        } else {
          totalBadge.classList.remove('visible');
        }
      }
      // Badges por sub-ruta
      const badgeMap = { notif_inbox: counts.inbox, notif_sent: counts.sent, notif_reminders: counts.reminders, notif_alerts: counts.alerts };
      Object.entries(badgeMap).forEach(([routeId, count]) => {
        const el = document.getElementById(`nav-badge-${routeId}`);
        if (el) {
          if (count > 0) {
            el.textContent = count > 99 ? '99+' : count;
            el.classList.add('visible');
          } else {
            el.classList.remove('visible');
          }
        }
      });
    }

    // Actualizar badges inicialmente y al cambiar datos
    updateNotifBadges();
    store.subscribe('messages', updateNotifBadges);
    store.subscribe('notifications', updateNotifBadges);
    store.subscribe('reminders', updateNotifBadges);

    // Configurar logout
    root.querySelector('#btn-logout').addEventListener('click', () => {
      if (confirm('¿Estás seguro de cerrar sesión?')) {
        Logger.log(store, user, {
          action: Logger.Actions.LOGOUT,
          module: Logger.Modules.AUTH,
          description: `Cerrar sesión: ${user.name}`,
          details: { userId: user.id }
        });
        localStorage.removeItem('hospital_user');
        APP_STATE.user = null;
        APP_STATE.role = null;
        initApp();
      }
    });

    // Cargar módulo inicial
    navigateTo(state.currentRoute);
  }

  // Navegar a una ruta
  async function navigateTo(routeId) {
    if (!ROUTES[routeId] || !ROUTES[routeId].permission(user.role)) {
      routeId = 'dashboard';
    }

    state.currentRoute = routeId;

    // Actualizar UI
    root.querySelectorAll('.nav-btn').forEach(btn => {
      const isActive = btn.dataset.route === routeId;
      btn.classList.toggle('active', isActive);
      btn.style.background = isActive ? 'var(--accent-light)' : 'transparent';
      btn.style.color = isActive ? 'var(--accent)' : 'var(--text)';
    });

    // Asegurar que el dropdown esté abierto si se navega a un sub-item
    const subRoute = ROUTES[routeId];
    if (subRoute && subRoute.parent) {
      const container = document.getElementById(`${subRoute.parent}-dropdown-container`);
      if (container) container.classList.add('open');
    }

    // Cargar módulo
    await loadModule(routeId);

    // Ya no se cierra con re-render aquí, se cierra en el event listener de nav-btn
  }

  // Cargar módulo
  async function loadModule(routeId) {
    const moduleContainer = root.querySelector('#module-container');
    if (!moduleContainer) return;

    // Limpiar módulo anterior
    if (APP_STATE.currentModule && APP_STATE.currentModule.destroy) {
      try {
        await APP_STATE.currentModule.destroy();
      } catch (error) {
        console.error('Error al destruir el módulo anterior:', error);
      }
    }

    moduleContainer.innerHTML = '<div class="loading-spinner" style="margin: 2rem auto;"></div>';

    try {
      // Cargar módulo dinámicamente
      const moduleFactory = await ROUTES[routeId].module();
      APP_STATE.currentModule = moduleFactory.default(moduleContainer, {
        bus,
        store,
        user,
        role: user.role,
        routeId
      });

      // Actualizar URL
      window.history.pushState({}, '', `#${routeId}`);

    } catch (error) {
      console.error(`Error cargando módulo ${routeId}:`, error);
      moduleContainer.innerHTML = `
        <div class="error-state" style="padding: 2rem; text-align: center;">
          <h3>Error cargando módulo</h3>
          <p style="color: var(--muted); margin-bottom: 1rem;">${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">
            Recargar página
          </button>
        </div>
      `;
    }
  }

  // Manejar navegación del navegador
  window.addEventListener('popstate', () => {
    const route = window.location.hash.slice(1) || 'dashboard';
    navigateTo(route);
  });

  // Inicializar
  render();

  // Cargar ruta desde URL
  const initialRoute = window.location.hash.slice(1) || 'dashboard';
  if (initialRoute !== state.currentRoute) {
    navigateTo(initialRoute);
  }

  return {
    navigateTo,
    destroy() {
      if (APP_STATE.currentModule && APP_STATE.currentModule.destroy) {
        APP_STATE.currentModule.destroy();
      }
    }
  };
}

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
async function initApp() {
  try {
    showLoading(true);

    // 1. Inicializar core
    APP_STATE.bus = createBus();
    APP_STATE.store = await createStore(APP_STATE.bus);

    // 2. Verificar usuario guardado
    const savedUser = localStorage.getItem('hospital_user');

    if (savedUser) {
      const user = JSON.parse(savedUser);
      APP_STATE.user = user;
      APP_STATE.role = user.role;

      // 3. Montar aplicación autenticada
      await mountAuthenticatedApp(user);
    } else {
      // 4. Montar login
      await mountLoginScreen();
    }

  } catch (error) {
    console.error('Error al inicializar:', error);
    showError(`Error técnico: ${error.message}`);
  } finally {
    showLoading(false);
  }
}

async function mountLoginScreen() {
  const appElement = document.getElementById('app');
  appElement.innerHTML = '';

  mountLogin(appElement, {
    onSuccess: (user) => {
      // Guardar usuario
      localStorage.setItem('hospital_user', JSON.stringify(user));
      APP_STATE.user = user;
      APP_STATE.role = user.role;

      // Recargar para montar app autenticada
      location.reload();
    }
  });
}

async function mountAuthenticatedApp(user) {
  const appElement = document.getElementById('app');
  appElement.innerHTML = '';

  APP_STATE.appShell = await mountAppShell(appElement, {
    user,
    bus: APP_STATE.bus,
    store: APP_STATE.store
  });

  // Configurar temporizador de inactividad (Seguridad)
  setupAutoLogout(APP_STATE.store);
}

// Lógica de Logout por Inactividad
function setupAutoLogout(store) {
  let lastActivity = Date.now();
  const policies = store.get('passwordPolicies') || { sessionTimeoutMinutes: 480 };
  const timeoutMs = (policies.sessionTimeoutMinutes || 480) * 60 * 1000;

  const updateActivity = () => {
    lastActivity = Date.now();
  };

  // Eventos que cuentan como actividad
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(name => {
    document.addEventListener(name, updateActivity, { passive: true });
  });

  // Verificación periódica
  const checkInterval = setInterval(() => {
    const elapsed = Date.now() - lastActivity;

    if (elapsed >= timeoutMs) {
      clearInterval(checkInterval);
      handleAutomaticLogout();
    }
  }, 30000); // Revisar cada 30 segundos
}

function handleAutomaticLogout() {
  localStorage.removeItem('hospital_user');
  alert('Su sesión ha expirado por inactividad por motivos de seguridad.');
  location.reload();
}

// ===== INICIAR APLICACIÓN =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Exportar para debugging
window.APP_STATE = APP_STATE;
window.APP_ROUTES = ROUTES;