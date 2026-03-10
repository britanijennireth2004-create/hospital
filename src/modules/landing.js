// Módulo de página de bienvenida/landing
import { ICONS } from '../app/icons.js';

export default function mountLanding(container, { onGetStarted, store }) {
  let state = {
    currentSlide: 0,
    slides: []
  };

  // Cargar áreas médicas del store
  function loadMedicalAreas() {
    // Verificar que store existe
    if (!store) {
      console.warn('Store no disponible, usando datos de ejemplo');
      // Datos de ejemplo por si no hay store
      state.slides = [
        {
          title: 'Medicina Interna',
          description: 'Diagnóstico y tratamiento de enfermedades en adultos',
          icon: ICONS.building,
          color: '#64748b',
          stats: { doctors: 12, appointments: 45 }
        },
        {
          title: 'Pediatría',
          description: 'Atención médica integral para niños y adolescentes',
          icon: ICONS.building,
          color: '#578e7e',
          stats: { doctors: 8, appointments: 32 }
        },
        {
          title: 'Cardiología',
          description: 'Especialidad en enfermedades del corazón y sistema circulatorio',
          icon: ICONS.building,
          color: '#9f7373',
          stats: { doctors: 6, appointments: 28 }
        },
        {
          title: 'Traumatología',
          description: 'Tratamiento de lesiones del sistema musculoesquelético',
          icon: ICONS.building,
          color: '#b48464',
          stats: { doctors: 5, appointments: 21 }
        },
        {
          title: 'Ginecología',
          description: 'Atención especializada en salud femenina',
          icon: ICONS.building,
          color: '#87769e',
          stats: { doctors: 7, appointments: 38 }
        },
        {
          title: 'Neurología',
          description: 'Diagnóstico y tratamiento de trastornos neurológicos',
          icon: ICONS.building,
          color: '#6b979c',
          stats: { doctors: 4, appointments: 19 }
        }
      ];
      return;
    }

    try {
      const areas = store.get('areas') || [];
      console.log('Áreas cargadas:', areas); // Para depuración

      // Filtrar solo áreas principales y activas
      const mainAreas = areas.filter(area => !area.parentId && area.isActive !== false);

      // Crear slides con las áreas disponibles
      if (mainAreas.length > 0) {
        state.slides = mainAreas.slice(0, 12).map(area => {
          const doctors = store.get('doctors') || [];
          const appointments = store.get('appointments') || [];

          return {
            title: area.name,
            description: area.description || 'Área médica especializada del Hospital Universitario',
            icon: ICONS.building,
            color: area.color || '#578e7e',
            stats: {
              doctors: doctors.filter(d => d.areaId === area.id || (d.otherAreas && d.otherAreas.includes(area.id))).length,
              appointments: appointments.filter(a => a.areaId === area.id).length
            }
          };
        });
      } else {
        // Si no hay áreas, usar datos de ejemplo del store
        state.slides = [
          {
            title: 'Medicina General',
            description: 'Atención médica general y consultas',
            icon: ICONS.building,
            color: '#0f8d3a',
            stats: { doctors: 1, appointments: 1 }
          },
          {
            title: 'Pediatría',
            description: 'Especialidad en atención infantil',
            icon: ICONS.building,
            color: '#3b82f6',
            stats: { doctors: 0, appointments: 0 }
          },
          {
            title: 'Cardiología',
            description: 'Especialidad en enfermedades del corazón',
            icon: ICONS.building,
            color: '#ef4444',
            stats: { doctors: 1, appointments: 1 }
          },
          {
            title: 'Traumatología',
            description: 'Especialidad en lesiones óseas y musculares',
            icon: ICONS.building,
            color: '#f59e0b',
            stats: { doctors: 0, appointments: 0 }
          },
          {
            title: 'Ginecología',
            description: 'Atención especializada en salud femenina',
            icon: ICONS.building,
            color: '#9C27B0',
            stats: { doctors: 0, appointments: 0 }
          },
          {
            title: 'Neurología',
            description: 'Diagnóstico y tratamiento de trastornos neurológicos',
            icon: ICONS.building,
            color: '#00BCD4',
            stats: { doctors: 0, appointments: 0 }
          }
        ];
      }
    } catch (error) {
      console.error('Error cargando áreas médicas:', error);
      // Datos de ejemplo por si hay error
      state.slides = [
        {
          title: 'Medicina General',
          description: 'Atención médica general y consultas',
          icon: ICONS.building,
          color: '#0f8d3a',
          stats: { doctors: 5, appointments: 25 }
        },
        {
          title: 'Pediatría',
          description: 'Especialidad en atención infantil',
          icon: ICONS.building,
          color: '#3b82f6',
          stats: { doctors: 3, appointments: 18 }
        },
        {
          title: 'Cardiología',
          description: 'Especialidad en enfermedades del corazón',
          icon: ICONS.building,
          color: '#ef4444',
          stats: { doctors: 4, appointments: 22 }
        },
        {
          title: 'Traumatología',
          description: 'Especialidad en lesiones óseas y musculares',
          icon: ICONS.building,
          color: '#f59e0b',
          stats: { doctors: 2, appointments: 15 }
        }
      ];
    }
  }

  function render() {
    loadMedicalAreas();

    const configData = store ? store.get('landingConfig') : null;
    const config = (configData && !Array.isArray(configData)) ? configData : null;

    const hero = config ? config.hero : {
      title: 'Sistema de Gestión de Citas Médicas',
      subtitle: 'Hospital Universitario Manuel Núñez Tovar',
      description: 'Plataforma integral para la administración eficiente de citas, historias clínicas y comunicaciones en el entorno hospitalario.',
      backgroundImage: 'img/hospital.jpg'
    };

    // Calcular estadísticas automatizadas con precisión total
    const getAutoValue = (label) => {
      if (!store) return '0';
      const l = label.toLowerCase();
      if (l.includes('paciente')) return store.get('patients').length;
      if (l.includes('médico') || l.includes('doctor')) return store.get('doctors').length;
      if (l.includes('cita')) return store.get('appointments').length;
      if (l.includes('área')) return store.get('areas').length;
      return '0';
    };

    const stats = config ? config.stats : [
      { label: 'Pacientes registrados', value: 'auto' },
      { label: 'Médicos especialistas', value: 'auto' },
      { label: 'Citas gestionadas', value: 'auto' },
      { label: 'Áreas médicas', value: 'auto' }
    ];

    container.innerHTML = `
      <div class="landing-container">
        <!-- Header con logo SVG -->
        <header class="landing-header">
          <div class="landing-logo">
            <img src="img/logotipo.png" alt="Logo HUMNT" style="height: 48px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));" />
          </div>
          <nav class="landing-nav">
            <a href="#inicio" class="landing-nav-link active">Inicio</a>
            <a href="#areas" class="landing-nav-link">Áreas Médicas</a>
            <a href="#contacto" class="landing-nav-link">Contacto</a>
          </nav>
          <div class="landing-actions">
            <button class="landing-btn landing-btn-outline radios" id="landing-login-btn">
              <span>${ICONS.user}</span>
            </button>
          </div>
        </header>

        <!-- Hero Section unificada con imagen de fondo y gradiente -->
        <section class="landing-hero" id="inicio">
          <div class="landing-hero-background">
            <img src="${hero.backgroundImage || 'img/hospital.jpg'}" alt="${hero.subtitle}" onerror="this.src='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22600%22%20viewBox%3D%220%200%201200%20600%22%3E%3Crect%20width%3D%221200%22%20height%3D%22600%22%20fill%3D%22%230078b4%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%20font-size%3D%2236%22%20font-family%3D%22Arial%22%3EHospital%20Universitario%3C%2Ftext%3E%3C%2Fsvg%3E'">
          </div>
          <div class="landing-hero-overlay"></div>
          <div class="landing-hero-content">
            <h1 class="landing-hero-title">
              <span class="landing-hero-title-main">${hero.title}</span>
              <span class="landing-hero-title-sub">${hero.subtitle}</span>
            </h1>
            <p class="landing-hero-description">
              ${hero.description}
            </p>
            <div class="landing-hero-buttons">
              <button class="landing-btn landing-btn-primary landing-btn-large" id="hero-start-btn">
                <span>${ICONS.rocket}</span>
                Comenzar Ahora
              </button>
            </div>
            <div class="landing-stats">
              ${stats.map(s => `
                <div class="landing-stat-item">
                  <span class="landing-stat-number">${s.value === 'auto' ? getAutoValue(s.label) : s.value}</span>
                  <span class="landing-stat-label">${s.label}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <!-- Áreas Médicas - Scroll horizontal interactivo -->
        <section class="landing-areas" id="areas">
          <h2 class="landing-section-title">Áreas Médicas</h2>
          <p class="landing-section-subtitle">Departamentos y servicios especializados de nuestro hospital</p>
          
          <div class="landing-areas-scroll-container" id="areas-scroll-container">
            <div class="landing-areas-scroll" id="areas-scroll">
              ${renderAreaCards()}
            </div>
          </div>
        </section>

        <!-- Redes Sociales -->
        <section class="landing-social" id="contacto">
          <h2 class="landing-section-title">Redes Sociales</h2>
          <p class="landing-section-subtitle">Síguenos en nuestras plataformas oficiales</p>
          
          <div class="landing-social-grid">
            <a href="https://instagram.com/${config ? config.social.instagram.replace('@', '') : 'humnt'}" target="_blank" rel="noopener noreferrer" class="landing-social-card">
              <div class="landing-social-icon instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </div>
              <h3>Instagram</h3>
              <p>${config ? config.social.instagram : '@humnt_oficial'}</p>
            </a>

            <a href="https://t.me/${config ? config.social.telegram.replace('@', '') : 'humnt'}" target="_blank" rel="noopener noreferrer" class="landing-social-card">
              <div class="landing-social-icon telegram">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <h3>Telegram</h3>
              <p>${config ? config.social.telegram : '@humnt_citas'}</p>
            </a>

            <a href="https://facebook.com/${config ? config.social.facebook.replace('/', '') : 'humnt'}" target="_blank" rel="noopener noreferrer" class="landing-social-card">
              <div class="landing-social-icon facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </div>
              <h3>Facebook</h3>
              <p>${config ? config.social.facebook : '/hospitalmanuelnunez'}</p>
            </a>

            <a href="https://wa.me/${config ? config.social.whatsapp.replace(/[^0-9]/g, '') : '584241234567'}" target="_blank" rel="noopener noreferrer" class="landing-social-card">
              <div class="landing-social-icon whatsapp">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <h3>WhatsApp</h3>
              <p>${config ? config.social.whatsapp : '+58 424-1234567'}</p>
            </a>
          </div>
        </section>

        <!-- CTA Final -->
        <section class="landing-cta">
          <h2>¿Listo para optimizar la gestión de tu salud?</h2>
          <p>Accede a nuestro sistema de citas en línea y agenda tus consultas de forma rápida y segura</p>
          <button class="landing-btn landing-btn-primary landing-btn-large" id="cta-start-btn">
            <span>${ICONS.rocket}</span>
            Comenzar Ahora
          </button>
        </section>

        <!-- Footer con iconos SVG del módulo -->
        <footer class="landing-footer">
          <div class="landing-footer-content">
            <div class="landing-footer-section">
              <div class="landing-footer-logo">
                <img src="img/logotipo_blanco.png" alt="Logo HUMNT" style="height: 52px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));" />
              </div>
              <p class="landing-footer-description">Sistema de Gestión de Citas Médicas del Hospital Universitario Manuel Núñez Tovar</p>
              <p class="landing-footer-copyright">© 2024 HUMNT. Todos los derechos reservados.</p>
            </div>
            <div class="landing-footer-section">
              <h4>Contacto</h4>
              <div class="landing-footer-contact-item">
                <span class="footer-icon">${ICONS.email}</span>
                <span>${config ? config.contact.email : 'info@humnt.gob.ve'}</span>
              </div>
              <div class="landing-footer-contact-item">
                <span class="footer-icon">${ICONS.phone}</span>
                <span>${config ? config.contact.phone : '+58 (123) 456-7890'}</span>
              </div>
              <div class="landing-footer-contact-item">
                <span class="footer-icon">${ICONS.location}</span>
                <span>${config ? config.contact.address : 'Av. Universidad, Maturín, Venezuela'}</span>
              </div>
            </div>
            <div class="landing-footer-section">
              <h4>Enlaces Rápidos</h4>
              <div class="landing-footer-links">
                <a href="#inicio" class="landing-footer-link">
                  <span class="footer-link-icon">${ICONS.home}</span>
                  Inicio
                </a>
                <a href="#areas" class="landing-footer-link">
                  <span class="footer-link-icon">${ICONS.building}</span>
                  Áreas Médicas
                </a>
                <a href="#contacto" class="landing-footer-link">
                  <span class="footer-link-icon">${ICONS.location}</span>
                  Contacto
                </a>
                <a href="#" class="landing-footer-link" id="footer-login-btn">
                  <span class="footer-link-icon">${ICONS.user}</span>
                  Iniciar Sesión
                </a>
              </div>
            </div>
          </div>
          <div class="landing-footer-bottom">
            <p>Hospital Universitario Manuel Núñez Tovar - Comprometidos con tu salud</p>
          </div>
        </footer>
      </div>

      ${landingStyles()}
    `;

    bindEvents();
  }

  function renderAreaCards() {
    return state.slides.map((area, index) => `
      <div class="landing-area-card-wrapper">
        <div class="landing-area-card" style="border-left: 3px solid ${area.color};">
          <h3 class="landing-area-title">${area.title}</h3>
          <p class="landing-area-description">${area.description}</p>
          <div class="landing-area-stats">
            <div class="landing-area-stat">
              <span class="landing-area-stat-value">${area.stats.doctors}</span>
              <span class="landing-area-stat-label">Médicos</span>
            </div>
            <div class="landing-area-stat">
              <span class="landing-area-stat-value">${area.stats.appointments}</span>
              <span class="landing-area-stat-label">Citas</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function bindEvents() {
    const loginButtons = [
      'landing-login-btn',
      'hero-start-btn',
      'cta-start-btn',
      'footer-login-btn'
    ];

    loginButtons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (onGetStarted) onGetStarted();
        });
      }
    });

    // Navegación suave
    document.querySelectorAll('.landing-nav-link, .landing-footer-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const section = document.querySelector(href);
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });

    // Scroll horizontal con la rueda del mouse
    const scrollContainer = document.getElementById('areas-scroll-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          scrollContainer.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }
  }

  function landingStyles() {
    return `
      <style>
        .landing-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0f7f4 0%, #d1e2d9 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }

        /* Header */
        .landing-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 20px rgba(0,0,0,0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .landing-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .landing-logo-text {
          background: linear-gradient(135deg, var(--themeDarker), var(--themePrimary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .landing-nav {
          display: flex;
          gap: 2rem;
        }

        .landing-nav-link {
          text-decoration: none;
          color: #1f2937;
          font-weight: 500;
          padding: 0.5rem 0;
          position: relative;
        }

        .landing-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--themePrimary);
          transition: width 0.3s ease;
        }

        .landing-nav-link:hover::after,
        .landing-nav-link.active::after {
          width: 100%;
        }

        .landing-actions {
          display: flex;
          gap: 1rem;
        }

        .landing-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .radios {
          border-radius: 100%;
        }

        .landing-btn svg {
          width: 18px;
          height: 18px;
        }

        .landing-btn-primary {
          background: linear-gradient(135deg, var(--themeDarker), var(--themePrimary));
          color: white;
        }

        .landing-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 120, 180, 0.3);
        }

        .landing-btn-outline {
          background: transparent;
          border: 2px solid var(--themePrimary);
          color: var(--themeDark);
        }

        .landing-btn-outline:hover {
          background: rgba(0, 120, 180, 0.1);
        }

        .landing-btn-large {
          padding: 1rem 2rem;
          font-size: 1.1rem;
        }

        /* Hero Section */
        .landing-hero {
          position: relative;
          min-height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .landing-hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .landing-hero-background img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .landing-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0, 32, 80, 0.85) 0%, rgba(0, 69, 120, 0.75) 40%, rgba(0, 120, 180, 0.65) 100%);
          z-index: 1;
        }

        .landing-hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          padding: 2.5rem;
          text-align: center;
          color: white;
        }

        .landing-hero-title {
          margin-bottom: 1.5rem;
          color: var(--bg-light);
        }

        .landing-hero-title-main {
          display: block;
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.2;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .landing-hero-title-sub {
          display: block;
          font-size: 1.2rem;
          margin-top: 0.5rem;
          font-weight: 400;
          opacity: 0.95;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .landing-hero-description {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          line-height: 1.6;
          opacity: 0.95;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }

        .landing-hero-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .landing-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .landing-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .landing-stat-number {
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
        }

        .landing-stat-label {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.9);
        }

        /* Áreas Médicas */
        .landing-areas {
          padding: 4rem 2rem;
          background: white;
          position: relative;
        }

        .landing-section-title {
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .landing-section-subtitle {
          text-align: center;
          color: #6b7280;
          margin-bottom: 3rem;
          font-size: 1.1rem;
        }

        .landing-areas-scroll-container {
          position: relative;
          max-width: 1200px;
          margin: 0 auto;
          overflow-x: auto;
          padding: 1rem 0 3rem 0;
          margin-top: 2rem;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE and Edge */
        }

        .landing-areas-scroll-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }

        .landing-areas-scroll {
          display: flex;
          gap: 1.5rem;
          /* Removed overflow-x: auto, scroll-behavior, and scrollbar hiding from here */
          padding: 0.5rem 0.25rem 1.5rem 0.25rem;
        }

        .landing-areas-scroll::-webkit-scrollbar {
          display: none;
        }

        .landing-area-card-wrapper {
          flex: 0 0 280px;
          min-width: 280px;
        }

        .landing-area-card {
          background: #ffffff;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
          border-left: 3px solid transparent;
        }

        .landing-area-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }

        .landing-area-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          font-size: 1.25rem;
        }

        .landing-area-icon svg {
          width: 24px;
          height: 24px;
        }

        .landing-area-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .landing-area-description {
          font-size: 0.9rem;
          color: #6b7280;
          line-height: 1.5;
          flex-grow: 1;
        }

        .landing-area-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: var(--radius);
          margin-top: auto;
          border-top: 1px solid var(--neutralQuaternaryAlt);
        }

        .landing-area-stat {
          text-align: center;
        }

        .landing-area-stat-value {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
          color: #10b981;
        }

        .landing-area-stat-label {
          font-size: 0.7rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Redes Sociales */
        .landing-social {
          padding: 4rem 2rem;
          background: linear-gradient(135deg, #f8fafc, #e2e8f0);
        }

        .landing-social-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }

        .landing-social-card {
          text-decoration: none;
          color: inherit;
          background: white;
          padding: 2rem;
          border-radius: 16px;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .landing-social-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .landing-social-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .landing-social-icon.instagram {
          background: linear-gradient(45deg, #f09433, #d62976, #962fbf);
        }

        .landing-social-icon.telegram {
          background: #0088cc;
        }

        .landing-social-icon.facebook {
          background: #1877f2;
        }

        .landing-social-icon.whatsapp {
          background: #25d366;
        }

        .landing-social-card h3 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .landing-social-card p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        /* CTA Section */
        .landing-cta {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
        }

        .landing-cta h2 {
          font-size: 2rem;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .landing-cta p {
          color: #6b7280;
          margin-bottom: 2rem;
          font-size: 1.1rem;
        }

        /* Footer con iconos SVG */
        .landing-footer {
          background: #1f2937;
          color: white;
          padding: 3rem 2rem 1rem;
        }

        .landing-footer-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .landing-footer-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .landing-footer-logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .landing-footer-description {
          color: #9ca3af;
          font-size: 0.9rem;
          line-height: 1.5;
          margin-bottom: 1rem;
        }

        .landing-footer-copyright {
          color: #6b7280;
          font-size: 0.8rem;
        }

        .landing-footer-section h4 {
          color: #10b981;
          margin-bottom: 1rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .landing-footer-contact-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: #9ca3af;
          font-size: 0.9rem;
        }

        .footer-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
        }

        .footer-icon svg {
          width: 18px;
          height: 18px;
        }

        .landing-footer-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .landing-footer-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #9ca3af;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .footer-link-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          transition: transform 0.3s ease;
        }

        .footer-link-icon svg {
          width: 16px;
          height: 16px;
        }

        .landing-footer-link:hover {
          color: #10b981;
        }

        .landing-footer-link:hover .footer-link-icon {
          transform: translateX(4px);
        }

        .landing-footer-bottom {
          text-align: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #374151;
          color: #6b7280;
          font-size: 0.8rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .landing-social-grid {
            grid-template-columns: repeat(2, 1fr);
            max-width: 600px;
          }
        }

        @media (max-width: 768px) {
          .landing-header {
            flex-direction: column;
            gap: 1rem;
          }

          .landing-nav {
            flex-wrap: wrap;
            justify-content: center;
          }

          .landing-hero-title-main {
            font-size: 2rem;
          }

          .landing-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .landing-footer-content {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .landing-footer-logo {
            justify-content: center;
          }

          .landing-footer-contact-item {
            justify-content: center;
          }

          .landing-footer-links {
            align-items: center;
          }
        }

        @media (max-width: 480px) {
          .landing-area-card-wrapper {
            flex: 0 0 260px;
            min-width: 260px;
          }

          .landing-social-grid {
            grid-template-columns: 1fr;
          }

          .landing-hero-content {
            padding: 1.5rem;
          }

          .landing-hero-title-main {
            font-size: 1.5rem;
          }
        }
      </style>
    `;
  }

  render();

  return {
    destroy() {
      container.innerHTML = '';
    }
  };
}