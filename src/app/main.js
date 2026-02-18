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
    permission: (role) => ['admin', 'doctor', 'receptionist'].includes(role)
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

// ===== LOGIN =====
function mountLogin(root, { onSuccess }) {
  root.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <!-- Left panel: form -->
        <div class="login-form-panel">
          <h1 class="login-title">Hospital Universitario Manuel Núñez Tovar</h1>
          <p class="login-subtitle">Sistema de Gestión de Citas Médicas</p>

          <form id="login-form" class="login-form" autocomplete="off">
            <div class="login-field">
              <label class="login-label" for="login-user">Usuario</label>
              <input class="login-input" type="text" id="login-user" placeholder="Ingrese su usuario" required />
            </div>
            <div class="login-field">
              <label class="login-label" for="login-pass">Contraseña</label>
              <input class="login-input" type="password" id="login-pass" placeholder="Ingrese su contraseña" required />
            </div>
            <button type="submit" class="login-submit-btn">INICIAR SESIÓN</button>
            <div class="login-recover">
              <a href="#" id="recover-link">Recuperar acceso</a>
            </div>
          </form>

          <div class="login-footer-note">
            <strong>Prototipo de demostración:</strong> Los datos se almacenan localmente en tu navegador.
          </div>
        </div>

        <!-- Right panel: image -->
        <div class="login-image-panel">
          <img src="img/hospital.jpg" alt="Hospital Universitario" />
          <div class="login-image-overlay">
            <div class="brand-title">HUMNT</div>
            <div class="brand-desc">Hospital Universitario Manuel Núñez Tovar. Sistema de gestión de citas médicas.</div>
          </div>
        </div>
      </div>

      <!-- Quick access floating bar -->
      <div class="quick-access-bar">
        <span class="quick-access-label">Acceso rápido:</span>
        <button class="quick-access-btn login-btn" data-role="admin" title="Administrador">Admin</button>
        <button class="quick-access-btn login-btn" data-role="doctor" title="Médico">Médico</button>
        <button class="quick-access-btn login-btn" data-role="patient" title="Paciente">Paciente</button>
        <button class="quick-access-btn login-btn" data-role="nurse" title="Enfermera">Enfermera</button>
        <button class="quick-access-btn login-btn" data-role="receptionist" title="Recepcionista">Recepción</button>
      </div>
    </div>
  `;

  // Helper to login with a role
  function loginAs(role) {
    const user = {
      id: `${role}_1`,
      username: role,
      name: role === 'admin' ? 'Administrador' :
        role === 'doctor' ? 'Dra. Ana Ruiz' :
          role === 'nurse' ? 'Enf. Elena Soler' :
            role === 'receptionist' ? 'Recepcionista Carla' : 'María Gómez',
      role: role,
      email: `${role}@hospital.com`,
      patientId: role === 'patient' ? 'p_1' : null,
      doctorId: role === 'doctor' ? 'd_1' : null
    };
    Logger.log(APP_STATE.store, user, {
      action: Logger.Actions.LOGIN,
      module: Logger.Modules.AUTH,
      description: `Inicio de sesión exitoso: ${user.name}`,
      details: { username: user.username, role: user.role }
    });
    onSuccess(user);
  }

  // Form submit — demo: log in as admin by default
  root.querySelector('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    loginAs('admin');
  });

  // Recover link
  root.querySelector('#recover-link').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Contacte al administrador del sistema para recuperar su acceso.');
  });

  // Quick-access buttons
  root.querySelectorAll('.login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      if (role) loginAs(role);
    });
  });
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

        const renderRoute = (id, r) => `
                    <button class="nav-btn ${state.currentRoute === id ? 'active' : ''}" data-route="${id}">
                      <span>${r.icon}</span>
                      <span>${r.label}</span>
                    </button>
                  `;

        const renderPersonal = () => {
          if (personalRoutes.length === 0) return '';
          const isSubActive = personalRoutes.some(([subId]) => state.currentRoute === subId);
          return `
                      <div class="nav-dropdown-container ${isSubActive ? 'open' : ''}" id="personal-dropdown-container">
                        <button class="nav-btn dropdown-trigger" id="personal-dropdown-btn">
                          <span>${ICONS.staff}</span>
                          <span>Personal</span>
                          <span class="chevron" style="margin-left: auto;">${ICONS.chevronDown}</span>
                        </button>
                        <div class="nav-dropdown-content">
                          ${personalRoutes.map(([subId, subR]) => `
                            <button class="nav-btn sub-btn ${state.currentRoute === subId ? 'active' : ''}" data-route="${subId}">
                              <span>${subR.icon}</span>
                              <span>${subR.label}</span>
                            </button>
                          `).join('')}
                        </div>
                      </div>
                    `;
        };

        const mainRoutes = Object.entries(ROUTES).filter(([_, r]) => !r.parent && r.permission(user.role));

        mainRoutes.forEach(([id, r]) => {
          items.push(renderRoute(id, r));
          // Si acabamos de renderizar pacientes, insertamos el Personal después
          if (id === 'patients') {
            items.push(renderPersonal());
          }
        });

        // Si por casualidad 'patients' no está permitido pero hay personal, lo ponemos al final
        if (!mainRoutes.some(([id]) => id === 'patients') && personalRoutes.length > 0) {
          items.push(renderPersonal());
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
      </style>
    `;

    // Configurar navegación
    root.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.id === 'personal-dropdown-btn') {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const container = document.getElementById('personal-dropdown-container');
          container.classList.toggle('open');
        });
        return;
      }
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        navigateTo(route);
      });
    });

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
    if (subRoute && subRoute.parent === 'personal') {
      const container = document.getElementById('personal-dropdown-container');
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
        role: user.role
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