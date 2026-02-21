import { ICONS } from '../app/icons.js';
import { Logger } from '../utils/logger.js';

/**
 * Módulo de Gestión de Contenido de la Página Principal (Landing Page)
 */
export default function mountLandingManager(root, { store, user, role }) {
  const state = {
    config: null,
    tempBackgroundImage: null
  };

  let elements = {};

  function init() {
    state.config = store.get('landingConfig');
    render();
    setupEventListeners();
  }

  function render() {
    const c = state.config;
    if (!c) {
      root.innerHTML = '<div class="p-4">Error: Configuración no encontrada.</div>';
      return;
    }

    // Calcular conteos reales para mostrar al admin
    const counts = {
      patients: store.get('patients').length,
      doctors: store.get('doctors').length,
      appointments: store.get('appointments').length,
      areas: store.get('areas').length,
      users: store.get('users').length,
      nurses: store.get('nurses') ? store.get('nurses').length : 0
    };

    root.innerHTML = `
      <div class="module-landing-manager">
        <div class="card mb-4">
          <div class="flex justify-between items-center">
            <div>
              <h2>Configuración del Portal Público</h2>
              <p class="text-muted">Gestión de identidad visual y estadísticas del hospital</p>
            </div>
            <button class="btn btn-primary" id="btn-save-config">
              ${ICONS.save || ''} Publicar Cambios
            </button>
          </div>
        </div>

        <div class="grid grid-2 gap-4">
          <!-- Sección Hero e Imagen -->
          <div class="card">
            <h3 class="mb-4 flex items-center gap-2">
              <span style="color: var(--accent);">${ICONS.rocket}</span> 
              Identidad Visual (Hero)
            </h3>
            
            <div class="form-group mb-3">
              <label class="form-label">Título Principal</label>
              <input type="text" class="input" id="hero-title" value="${c.hero.title}">
            </div>
            
            <div class="form-group mb-4">
              <label class="form-label">Imagen de Fondo</label>
              <div class="upload-container mb-2">
                <div class="hero-preview-small mb-2" id="hero-preview-box" style="background-image: url('${c.hero.backgroundImage || 'img/hospital.jpg'}');">
                  ${!c.hero.backgroundImage ? '<span>Sin imagen</span>' : ''}
                </div>
                <div class="flex gap-2">
                  <input type="file" id="hero-file-input" accept="image/*" style="display: none;">
                  <button class="btn btn-outline flex-1" id="btn-trigger-upload">
                    📁 Subir Imagen desde Dispositivo
                  </button>
                  <button class="btn btn-outline" id="btn-reset-img" title="Restaurar por defecto">
                    🔄
                  </button>
                </div>
              </div>
              <p class="text-xs text-muted">Se recomienda una imagen horizontal de alta resolución (mínimo 1200x600px).</p>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">Subtítulo</label>
              <input type="text" class="input" id="hero-subtitle" value="${c.hero.subtitle}">
            </div>
            
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea class="input" id="hero-description" rows="3">${c.hero.description}</textarea>
            </div>
          </div>

          <!-- Estadísticas Automatizadas -->
          <div class="card">
            <h3 class="mb-4 flex items-center gap-2">
              <span style="color: var(--accent);">${ICONS.chart || ''}</span> 
              Estadísticas del Sistema (Auto)
            </h3>
            <p class="text-sm mb-4">El portal mostrará automáticamente el total de registros detectados en cada módulo:</p>
            
            <div class="grid grid-2 gap-3">
              <div class="stat-info-card">
                <span class="stat-info-label">Pacientes</span>
                <span class="stat-info-value">${counts.patients}</span>
              </div>
              <div class="stat-info-card">
                <span class="stat-info-label">Médicos</span>
                <span class="stat-info-value">${counts.doctors}</span>
              </div>
              <div class="stat-info-card">
                <span class="stat-info-label">Citas</span>
                <span class="stat-info-value">${counts.appointments}</span>
              </div>
              <div class="stat-info-card">
                <span class="stat-info-label">Áreas Médicas</span>
                <span class="stat-info-value">${counts.areas}</span>
              </div>
            </div>

            <div class="mt-4 p-3 info-box" style="background: var(--bg-light); border-radius: 8px; border-left: 4px solid var(--accent);">
              <p class="text-xs"><strong>Nota:</strong> No es necesario editar estos números. Se actualizan automáticamente cuando se agregan o eliminan registros en los módulos respectivos.</p>
            </div>
          </div>

          <!-- Contacto -->
          <div class="card">
            <h3 class="mb-4 flex items-center gap-2">
              <span style="color: var(--accent);">${ICONS.phone}</span> 
              Información de Contacto
            </h3>
            <div class="form-group mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="input" id="contact-email" value="${c.contact.email}">
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Teléfono</label>
              <input type="text" class="input" id="contact-phone" value="${c.contact.phone}">
            </div>
            <div class="form-group">
              <label class="form-label">Dirección</label>
              <input type="text" class="input" id="contact-address" value="${c.contact.address}">
            </div>
          </div>

          <!-- Redes Sociales -->
          <div class="card">
            <h3 class="mb-4 flex items-center gap-2">
              <span style="color: var(--accent);">${ICONS.users}</span> 
              Redes Sociales
            </h3>
            <div class="form-group mb-3">
              <label class="form-label">Instagram</label>
              <input type="text" class="input" id="social-instagram" value="${c.social.instagram}">
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Telegram</label>
              <input type="text" class="input" id="social-telegram" value="${c.social.telegram}">
            </div>
            <div class="form-group mb-3">
              <label class="form-label">WhatsApp</label>
              <input type="text" class="input" id="social-whatsapp" value="${c.social.whatsapp}">
            </div>
          </div>
        </div>
      </div>

      <style>
        .hero-preview-small {
          width: 100%;
          height: 150px;
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          overflow: hidden;
        }
        .stat-info-card {
          background: white;
          border: 1px solid var(--border);
          padding: 1rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: transform 0.2s;
        }
        .stat-info-card:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }
        .stat-info-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stat-info-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
        }
      </style>
    `;

    // Guardar referencias
    elements = {
      btnSave: root.querySelector('#btn-save-config'),
      btnTriggerUpload: root.querySelector('#btn-trigger-upload'),
      btnResetImg: root.querySelector('#btn-reset-img'),
      fileInput: root.querySelector('#hero-file-input'),
      previewBox: root.querySelector('#hero-preview-box'),
      heroTitle: root.querySelector('#hero-title'),
      heroSubtitle: root.querySelector('#hero-subtitle'),
      heroDescription: root.querySelector('#hero-description'),
      contactEmail: root.querySelector('#contact-email'),
      contactPhone: root.querySelector('#contact-phone'),
      contactAddress: root.querySelector('#contact-address'),
      socialInstagram: root.querySelector('#social-instagram'),
      socialTelegram: root.querySelector('#social-telegram'),
      socialWhatsapp: root.querySelector('#social-whatsapp')
    };
  }

  function setupEventListeners() {
    if (elements.btnSave) {
      elements.btnSave.addEventListener('click', saveConfig);
    }

    if (elements.btnTriggerUpload) {
      elements.btnTriggerUpload.addEventListener('click', () => {
        elements.fileInput.click();
      });
    }

    if (elements.fileInput) {
      elements.fileInput.addEventListener('change', handleFileSelect);
    }

    if (elements.btnResetImg) {
      elements.btnResetImg.addEventListener('click', () => {
        state.tempBackgroundImage = 'img/hospital.jpg';
        elements.previewBox.style.backgroundImage = `url('img/hospital.jpg')`;
        window.hospitalAlert('Imagen restaurada. Debe guardar para aplicar.', 'info');
      });
    }
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.hospitalAlert('Por favor seleccione un archivo de imagen válido', 'error');
      return;
    }

    // Limitar tamaño a 2MB para LocalStorage
    if (file.size > 2 * 1024 * 1024) {
      window.hospitalAlert('La imagen es demasiado grande. Máximo 2MB para rendimiento óptimo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      state.tempBackgroundImage = e.target.result;
      elements.previewBox.style.backgroundImage = `url('${e.target.result}')`;
      window.hospitalAlert('Imagen cargada localmente. Haga clic en Publicar para finalizar.', 'success');
    };
    reader.readAsDataURL(file);
  }

  async function saveConfig() {
    const newConfig = {
      hero: {
        title: elements.heroTitle.value,
        subtitle: elements.heroSubtitle.value,
        description: elements.heroDescription.value,
        backgroundImage: state.tempBackgroundImage || state.config.hero.backgroundImage
      },
      stats: [
        { label: 'Pacientes registrados', value: 'auto' },
        { label: 'Médicos especialistas', value: 'auto' },
        { label: 'Citas gestionadas', value: 'auto' },
        { label: 'Áreas activas', value: 'auto' }
      ],
      contact: {
        email: elements.contactEmail.value,
        phone: elements.contactPhone.value,
        address: elements.contactAddress.value
      },
      social: {
        instagram: elements.socialInstagram.value,
        telegram: elements.socialTelegram.value,
        facebook: state.config.social.facebook, // Mantener para no perder datos si no hay input
        whatsapp: elements.socialWhatsapp.value
      }
    };

    try {
      const data = store.exportData();
      data.landingConfig = newConfig;
      store.importData(data);

      window.hospitalAlert('¡Portal actualizado correctamente!', 'success');

      Logger.log(store, user, {
        action: Logger.Actions.UPDATE,
        module: 'LANDING_MANAGER',
        description: 'Actualización general del portal con nueva imagen y estadísticas',
        details: { hasNewImage: !!state.tempBackgroundImage }
      });

      // Actualizar estado local
      state.config = newConfig;
      state.tempBackgroundImage = null;
    } catch (error) {
      console.error(error);
      window.hospitalAlert('Error al guardar la configuración', 'error');
    }
  }

  init();

  return {
    destroy: () => { }
  };
}
