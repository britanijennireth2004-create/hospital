// Punto de entrada principal con routing básico

import { createBus } from '../core/bus.js';
import { createStore } from '../core/store.js';

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
    icon: '🏠',
    module: () => import('../modules/dashboard.js'),
    permission: () => true
  },
  appointments: {
    label: 'Citas',
    icon: '📅',
    module: () => import('../modules/appointments.js'),
    permission: (role) => ['admin', 'doctor', 'patient'].includes(role)
  },
  patients: {
    label: 'Pacientes',
    icon: '👤',
    module: () => import('../modules/patients.js'),
    permission: (role) => ['admin', 'doctor'].includes(role)
  },
  doctors: {
    label: 'Médicos',
    icon: '👨‍⚕️',
    module: () => import('../modules/doctors.js'),
    permission: (role) => ['admin', 'doctor', 'patient'].includes(role)
  },
  areas: {
    label: 'Áreas',
    icon: '🏥',
    module: () => import('../modules/areas.js'),
    permission: (role) => ['admin', 'doctor', 'patient'].includes(role)
  },
  clinical: {
    label: 'Historia Clínica',
    icon: '📋',
    module: () => import('../modules/clinical.js'),
    permission: (role) => ['admin', 'doctor', 'patient'].includes(role)
  },
  triage: {
    label: 'Triage',
    icon: '🚨',
    module: () => import('../modules/triage.js'),
    permission: (role) => ['admin', 'doctor', 'nurse'].includes(role)
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

// ===== LOGIN (mantener igual) =====
function mountLogin(root, { onSuccess }) {
  root.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🏥</div>
          <h1>Hospital Central</h1>
          <p style="color: var(--muted);">Sistema de Gestión de Citas</p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
          <button class="btn btn-primary login-btn" data-role="admin" style="text-align: left; display: flex; align-items: center; gap: 1rem; padding: 1rem;">
            <div style="font-size: 1.5rem;">👑</div>
            <div>
              <div style="font-weight: bold;">Administrador</div>
              <div style="font-size: 0.9rem; opacity: 0.9;">Acceso completo al sistema</div>
            </div>
          </button>
          
          <button class="btn login-btn" data-role="doctor" style="background: var(--accent-2); color: white; text-align: left; display: flex; align-items: center; gap: 1rem; padding: 1rem;">
            <div style="font-size: 1.5rem;">👨‍⚕️</div>
            <div>
              <div style="font-weight: bold;">Médico</div>
              <div style="font-size: 0.9rem; opacity: 0.9;">Gestión de citas y pacientes</div>
            </div>
          </button>
          
          <button class="btn login-btn" data-role="patient" style="background: #3b82f6; color: white; text-align: left; display: flex; align-items: center; gap: 1rem; padding: 1rem;">
            <div style="font-size: 1.5rem;">👤</div>
            <div>
              <div style="font-weight: bold;">Paciente</div>
              <div style="font-size: 0.9rem; opacity: 0.9;">Ver mis citas e historial</div>
            </div>
          </button>
        </div>
        
        <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
          <p style="color: var(--muted); font-size: 0.8rem; text-align: center;">
            <strong>Prototipo de demostración:</strong> Los datos se almacenan localmente en tu navegador.
          </p>
        </div>
      </div>
    </div>
  `;
  
  // Configurar event listeners
  root.querySelectorAll('.login-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      const user = {
        id: `${role}_1`,
        username: role,
        name: role === 'admin' ? 'Administrador' : 
               role === 'doctor' ? 'Dra. Ana Ruiz' : 'María Gómez',
        role: role,
        email: `${role}@hospital.com`,
        patientId: role === 'patient' ? 'p_1' : null,
        doctorId: role === 'doctor' ? 'd_1' : null
      };
      
      onSuccess(user);
    });
  });
}

// ===== APP SHELL MEJORADO =====
async function mountAppShell(root, { user, bus, store }) {
  const state = {
    currentRoute: 'dashboard',
    sidebarOpen: window.innerWidth >= 768
  };

  // Renderizar shell
  function render() {
    const routes = Object.entries(ROUTES).filter(([_, route]) => 
      route.permission(user.role)
    );
    
    root.innerHTML = `
      <div class="app-shell">
        <!-- Header -->
        <header style="position: fixed; top: 0; left: 0; right: 0; height: var(--header-height); background: var(--card); box-shadow: var(--shadow); display: flex; align-items: center; justify-content: space-between; padding: 0 1rem; z-index: 1000;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <button class="btn btn-outline btn-sm" id="menu-toggle" style="display: none;">
              ☰
            </button>
            <div style="font-size: 1.5rem;">🏥</div>
            <div style="font-weight: bold;">Hospital Central</div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="text-align: right;">
              <div style="font-weight: 500;">${user.name}</div>
              <div style="font-size: 0.875rem; color: var(--muted);">${user.role}</div>
            </div>
            <button class="btn btn-danger btn-sm" id="btn-logout">
              Salir
            </button>
          </div>
        </header>

        <!-- Main content -->
        <main style="display: flex; margin-top: var(--header-height); min-height: calc(100vh - var(--header-height));">
          <!-- Sidebar -->
          <nav style="width: ${state.sidebarOpen ? 'var(--sidebar-width)' : '0'}; background: var(--card); border-right: 1px solid var(--border); transition: width 0.3s; overflow: hidden;">
            <div style="padding: 1rem;">
              <div style="font-weight: bold; margin-bottom: 1rem; color: var(--muted); padding: 0 0.5rem;">MENÚ</div>
              <div style="display: flex; flex-direction: column; gap: 0.25rem;" id="nav-menu">
                ${routes.map(([routeId, route]) => `
                  <button 
                    class="nav-btn ${state.currentRoute === routeId ? 'active' : ''}" 
                    data-route="${routeId}"
                    style="padding: 0.75rem; border: none; background: ${state.currentRoute === routeId ? 'var(--accent-light)' : 'transparent'}; color: ${state.currentRoute === routeId ? 'var(--accent)' : 'var(--text)'}; border-radius: var(--radius); cursor: pointer; text-align: left; display: flex; align-items: center; gap: 0.5rem; width: 100%;">
                    <span>${route.icon}</span>
                    <span>${route.label}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </nav>

          <!-- Content area -->
          <div style="flex: 1; padding: 1.5rem; background: var(--bg); overflow-y: auto;">
            <div id="module-container"></div>
          </div>
        </main>
      </div>
    `;
    
    // Configurar responsive sidebar
    const menuToggle = root.querySelector('#menu-toggle');
    if (window.innerWidth < 768) {
      menuToggle.style.display = 'block';
      menuToggle.addEventListener('click', () => {
        state.sidebarOpen = !state.sidebarOpen;
        render();
      });
    }
    
    // Configurar navegación
    root.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        navigateTo(route);
      });
    });
    
    // Configurar logout
    root.querySelector('#btn-logout').addEventListener('click', () => {
      if (confirm('¿Estás seguro de cerrar sesión?')) {
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
    
    // Cargar módulo
    await loadModule(routeId);
    
    // Cerrar sidebar en móvil
    if (window.innerWidth < 768 && state.sidebarOpen) {
      state.sidebarOpen = false;
      render();
    }
  }

  // Cargar módulo
  async function loadModule(routeId) {
    const moduleContainer = root.querySelector('#module-container');
    if (!moduleContainer) return;
    
    // Limpiar módulo anterior
    if (APP_STATE.currentModule && APP_STATE.currentModule.destroy) {
      await APP_STATE.currentModule.destroy();
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