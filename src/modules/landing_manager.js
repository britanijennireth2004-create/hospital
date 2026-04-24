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
    const config = store.get('landingConfig');
    // Asegurar que sea un objeto y no un array vacío (comportamiento por defecto del store.get)
    state.config = (config && !Array.isArray(config)) ? config : null;
    
    if (!state.config) {
      console.warn('Landing config not found in store, using defaults');
      state.config = {
        hero: { title: '', subtitle: '', description: '', backgroundImage: '' },
        contact: { email: '', phone: '', address: '' },
        social: { instagram: '', telegram: '', whatsapp: '', facebook: '' }
      };
    }
    
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
        <!-- Estadísticas Automatizadas -->
        <div class="stats-auto-grid mb-4">
          <div class="stat-info-card">
            <span class="stat-info-label">Pacientes</span>
            <span class="stat-info-value">${counts.patients}</span>
            <span class="stat-info-sub">${ICONS.user || ''} Total registrados</span>
          </div>
          <div class="stat-info-card">
            <span class="stat-info-label">Médicos</span>
            <span class="stat-info-value">${counts.doctors}</span>
            <span class="stat-info-sub">${ICONS.doctor || ''} Personal activo</span>
          </div>
          <div class="stat-info-card">
            <span class="stat-info-label">Citas</span>
            <span class="stat-info-value">${counts.appointments}</span>
            <span class="stat-info-sub">${ICONS.calendar || ''} Gestionadas</span>
          </div>
          <div class="stat-info-card">
            <span class="stat-info-label">Áreas Médicas</span>
            <span class="stat-info-value">${counts.areas}</span>
            <span class="stat-info-sub">${ICONS.area || ''} Servicios disponibles</span>
          </div>
        </div>

        <div class="alineado mb-4">
          <button class="btn-circle btn-circle-cancel" id="btn-reset-config" title="Reiniciar Cambios">
            ${ICONS.sync}
          </button>
          <button class="btn-circle btn-circle-save" id="btn-save-config" title="Guardar Cambios">
              ${ICONS.save}
          </button>
        </div>

        <div class="responsive-grid">
            <!-- Sección Hero e Imagen -->
            <div class="card mb-4">
              <div class="card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h3 class="mb-0 flex items-center gap-2" style="margin: 0;">
                  <span style="color: var(--themeDark);">${ICONS.rocket}</span> 
                  Identidad Visual (Hero)
                </h3>
              </div>
              
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
                    <div class="upload-actions">
                      <input type="file" id="hero-file-input" accept="image/*" style="display: none;">
                      <button class="btn btn-outline flex-1" id="btn-trigger-upload">
                        📁 <span class="btn-text">Subir Imagen</span>
                      </button>
                      <button class="btn btn-outline btn-reset" id="btn-reset-img" title="Restaurar por defecto">
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

            <!-- Contacto -->
            <div class="card mb-4">
              <div class="card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h3 class="mb-0 flex items-center gap-2" style="margin: 0;">
                  <span style="color: var(--themeDark);">${ICONS.phone}</span> 
                  Información de Contacto
                </h3>
              </div>
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
            <div class="card mb-4">
              <div class="card-header" style="border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h3 class="mb-0 flex items-center gap-2" style="margin: 0;">
                  <span style="color: var(--themeDark);">${ICONS.users}</span> 
                  Redes Sociales
                </h3>
              </div>
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
        .responsive-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }
        .hero-preview-small {
          width: 100%;
          height: 180px;
          border-radius: 12px;
          background-size: cover;
          background-position: center;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          overflow: hidden;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }
        .upload-actions {
          display: flex;
          gap: 0.5rem;
        }
        .alineado {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          align-items: center;
        }
        .btn-save-custom {
          background-color: var(--themePrimary) !important;
          color: white !important;
          border-radius: 50px !important;
          width: 45px;
          height: 45px;
          padding: 0;
        }
        .btn-reset-custom {
          background-color: var(--red) !important;
          color: white !important;
          border-radius: 50px !important;
          width: 45px;
          height: 45px;
          padding: 0;
          border: none;
        }
        @media (max-width: 768px) {
          .responsive-grid {
            grid-template-columns: 1fr;
          }
          .card-header .flex.justify-between {
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }
          .alineado {
            width: 100%;
            justify-content: center;
          }
          .btn-text {
            display: none;
          }
          .btn-trigger-upload::after {
            content: ' Subir';
          }
        }
      </style>
    `;

    // Guardar referencias
    elements = {
      btnSave: root.querySelector('#btn-save-config'),
      btnReset: root.querySelector('#btn-reset-config'),
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

    if (elements.btnReset) {
      elements.btnReset.addEventListener('click', () => {
        const config = store.get('landingConfig');
        state.config = (config && !Array.isArray(config)) ? config : null;
        state.tempBackgroundImage = null;
        render();
        setupEventListeners();
        window.hospitalAlert('Cambios descartados. Configuración recargada.', 'info');
      });
    }

    if (elements.btnResetImg) {
      elements.btnResetImg.addEventListener('click', () => {
        state.tempBackgroundImage = 'img/hospital.jpg';
        if (elements.previewBox) {
          elements.previewBox.style.backgroundImage = `url('img/hospital.jpg')`;
        }
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
    // Validaciones básicas
    if (!elements.heroTitle || !elements.contactEmail) {
      window.hospitalAlert('Error: No se pudieron capturar los campos del formulario', 'error');
      return;
    }

    const newConfig = {
      hero: {
        title: elements.heroTitle.value.trim(),
        subtitle: elements.heroSubtitle.value.trim(),
        description: elements.heroDescription.value.trim(),
        backgroundImage: state.tempBackgroundImage || (state.config.hero ? state.config.hero.backgroundImage : '')
      },
      stats: [
        { label: 'Pacientes registrados', value: 'auto' },
        { label: 'Médicos especialistas', value: 'auto' },
        { label: 'Citas gestionadas', value: 'auto' },
        { label: 'Áreas activas', value: 'auto' }
      ],
      contact: {
        email: elements.contactEmail.value.trim(),
        phone: elements.contactPhone.value.trim(),
        address: elements.contactAddress.value.trim()
      },
      social: {
        instagram: elements.socialInstagram.value.trim(),
        telegram: elements.socialTelegram.value.trim(),
        facebook: (state.config.social && state.config.social.facebook) ? state.config.social.facebook : '',
        whatsapp: elements.socialWhatsapp.value.trim()
      }
    };

    try {
      // Usar exportData/importData es seguro para claves de nivel superior
      const data = store.exportData();
      data.landingConfig = newConfig;
      store.importData(data);

      // Actualizar estado local
      state.config = newConfig;
      state.tempBackgroundImage = null;

      await window.hospitalAlert('¡Portal actualizado correctamente!', 'success');

      Logger.log(store, user, {
        action: Logger.Actions.UPDATE,
        module: 'LANDING_MANAGER',
        description: 'Actualización general del portal con nueva imagen y estadísticas',
        details: { hasNewImage: !!state.tempBackgroundImage }
      });

      // Re-renderizar para limpiar estados temporales y reflejar cambios
      render();
      setupEventListeners();
    } catch (error) {
      console.error('Error al guardar config landing:', error);
      window.hospitalAlert('Error al guardar la configuración: ' + error.message, 'error');
    }
  }

  init();

  return {
    destroy: () => { }
  };
}
