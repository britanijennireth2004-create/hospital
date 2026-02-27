/**
 * Módulo de Triage - Sistema de priorización en Urgencias
 */

export default function mountTriage(root, { bus, store, user, role }) {
  const state = {
    patientsInQueue: [],
    currentTriage: null,
    showModal: false,
    selectedPatient: null,
    filters: {
      status: 'all',
      priority: 'all',
      search: ''
    },
    sortBy: 'priority',
    stats: {},
    // Nuevo estado para controlar si estamos creando paciente rápido
    isCreatingPatient: false,
    suggestedPriority: null,
    // Para prevenir cierre accidental
    isApplyingSuggestion: false,
    // Nuevo estado para controlar si estamos exportando PDF
    isExportingPDF: false
  };

  // Constantes de triage con colores mejorados (más suaves)
  const TRIAGE_LEVELS = {
    red: {
      name: 'Rojo - Inmediato',
      color: 'var(--triage-red)',
      lightColor: 'var(--bg-light)',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--triage-red)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      time: '0-10 min',
      description: 'Amenaza vital inmediata',
      criteria: ['paro cardiorespiratorio', 'convulsiones', 'hemorragia masiva', 'shock', 'coma', 'pso2 < 90%', 'fr > 30 o < 10', 'ta sistólica < 90', 'dolor 10/10']
    },
    orange: {
      name: 'Naranja - Muy urgente',
      color: 'var(--triage-orange)',
      lightColor: 'var(--bg-light)',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--triage-orange)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>',
      time: '10-60 min',
      description: 'Riesgo vital potencial',
      criteria: ['dolor torácico', 'disnea moderada', 'trauma severo', 'alteración conciencia', 'pso2 90-94%', 'fr 25-30', 'ta 90-100', 'dolor 8-9/10']
    },
    yellow: {
      name: 'Amarillo - Urgente',
      color: 'var(--triage-yellow)',
      lightColor: 'var(--bg-light)',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--triage-yellow)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      time: '60-120 min',
      description: 'Urgente pero estable',
      criteria: ['fiebre alta', 'dolor abdominal', 'vómitos persistentes', 'infecciones moderadas', 'pso2 95-97%', 'fr 20-24', 'ta normal', 'dolor 5-7/10']
    },
    green: {
      name: 'Verde - Poco urgente',
      color: 'var(--triage-green)',
      lightColor: 'var(--bg-light)',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--triage-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="18 8 12 16 9 13"/></svg>',
      time: '2-4 horas',
      description: 'No urgente',
      criteria: ['resfriado común', 'dolor leve', 'consulta general', 'control rutinario', 'pso2 > 97%', 'fr normal', 'ta normal', 'dolor < 4/10']
    },
    blue: {
      name: 'Azul - No urgente',
      color: 'var(--triage-blue)',
      lightColor: 'var(--bg-light)',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--triage-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
      time: '4+ horas',
      description: 'Consulta simple',
      criteria: ['certificados', 'recetas', 'consultas administrativas']
    }
  };

  // Colores RGB predefinidos para jsPDF (evita problemas de conversión)
  const TRIAGE_LEVELS_RGB = {
    red: [229, 62, 62],     // #e53e3e
    orange: [221, 107, 32], // #dd6b20
    yellow: [214, 158, 46], // #d69e2e
    green: [56, 161, 105],  // #38a169
    blue: [49, 130, 206]    // #3182ce
  };

  // Función auxiliar para convertir colores de forma segura
  function parseColor(color) {
    if (!color) return [0, 0, 0];
    if (Array.isArray(color) && color.length === 3) return color;
    if (typeof color === 'string' && TRIAGE_LEVELS_RGB[color]) return TRIAGE_LEVELS_RGB[color];
    if (typeof color === 'string' && color.startsWith('#')) {
      const hex = color.replace('#', '');
      const fullHex = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
      const r = parseInt(fullHex.substring(0, 2), 16);
      const g = parseInt(fullHex.substring(2, 4), 16);
      const b = parseInt(fullHex.substring(4, 6), 16);
      return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
    }
    return [0, 0, 0];
  }

  // Función para cargar scripts dinámicamente (NECESARIA PARA PDF)
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Estilos Fluent UI para Triage
  const CSS = `
    <style>
      .module-triage { max-width: 1400px; margin: 0 auto; color: var(--neutralPrimary); }
      
      .f-command-bar {
        background: var(--white);
        display: flex;
        align-items: center;
        padding: 0 16px;
        height: 44px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        margin-bottom: 1rem;
        border-radius: 4px;
      }
      .f-command-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        height: 100%;
        cursor: pointer;
        font-size: 14px;
        color: var(--neutralPrimary);
        transition: background 0.1s;
        border: none;
        background: transparent;
      }
      .f-command-item:hover { background: var(--neutralLighter); }
      .f-command-item svg { color: var(--themePrimary); }
      .f-command-item.danger:hover { background: #fde7e9; color: var(--redDark); }
      
      .f-pivot-container {
        display: flex;
        gap: 20px;
        border-bottom: 1px solid var(--neutralLight);
        margin-bottom: 1rem;
        padding: 0 4px;
      }
      .f-pivot-item {
        padding: 12px 8px;
        cursor: pointer;
        font-size: 14px;
        color: var(--neutralSecondary);
        position: relative;
        transition: color 0.2s;
        border: none;
        background: transparent;
      }
      .f-pivot-item.active {
        color: var(--neutralPrimary);
        font-weight: 600;
      }
      .f-pivot-item.active::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--themePrimary);
      }
      
      .f-table { width: 100%; border-collapse: collapse; }
      .f-table th { 
        padding: 12px 16px; 
        text-align: left; 
        font-size: 12px; 
        font-weight: 600; 
        color: var(--neutralSecondary);
        border-bottom: 1px solid var(--neutralLight);
      }
      .f-table td { padding: 12px 16px; border-bottom: 1px solid var(--neutralLighter); font-size: 14px; }
      .f-table tr:hover { background: var(--neutralLighterAlt); }
      
      .f-priority-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin: 0 auto;
      }
      
      .f-priority-label {
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        text-transform: uppercase;
        display: inline-block;
      }
      
      .f-row { transition: background 0.1s; }
      .f-row:hover { background: #f3f2f1; cursor: default; }

      .suggestion-badge {
         background: white;
         border-radius: 50%;
         width: 20px;
         height: 20px;
         display: flex;
         align-items: center;
         justify-content: center;
         box-shadow: 0 2px 4px rgba(0,0,0,0.15);
         border: 1px solid var(--neutralLight);
      }

      .f-stat-card {
        background: white;
        border: 1px solid var(--border);
        padding: 1.5rem 1rem;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      .f-stat-card:hover {
        border-color: var(--themePrimary);
        box-shadow: 0 10px 20px rgba(0,0,0,0.05);
      }
      .f-stat-label {
        font-size: 0.75rem;
        color: var(--neutralSecondary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 0.5rem;
        font-weight: 700;
      }
      .f-stat-value {
        font-size: 2.25rem;
        font-weight: 800;
        color: var(--neutralPrimary);
        line-height: 1;
        margin-bottom: 0.5rem;
      }
      .f-stat-sub {
        font-size: 0.7rem;
        color: var(--neutralSecondary);
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      
      .f-search-box {
        position: relative;
        flex: 1;
        max-width: 450px;
        margin-left: auto;
      }
      .f-search-box input {
        width: 100%;
        height: 40px;
        padding-left: 2.8rem;
        border-radius: 20px;
        background: rgba(0,0,0,0.05);
        border: 1px solid transparent;
        transition: all 0.3s;
        font-size: 14px;
      }
      .f-search-box input:focus {
        background: white;
        border-color: var(--themePrimary);
        box-shadow: 0 0 0 2px rgba(0, 120, 212, 0.1);
        outline: none;
      }
      .f-search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--neutralSecondary);
        opacity: 0.7;
        pointer-events: none;
      }
    </style>
  `;

  // Referencias a elementos DOM
  let elements = {};

  // Inicializar
  function init() {
    render();
    loadData();
    setupEventListeners();

    // Suscribirse a cambios
    const unsubscribePatients = store.subscribe('patients', loadData);
    const unsubscribeTriage = store.subscribe('triage', loadData);

    // Actualizar cada 30 segundos
    const intervalId = setInterval(updateStats, 30000);

    return {
      destroy: () => {
        unsubscribePatients();
        unsubscribeTriage();
        clearInterval(intervalId);
      }
    };
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Cargar datos
  function loadData() {
    const patients = store.get('patients');
    const triageRecords = store.get('triage') || [];

    // Combinar datos de triage con pacientes
    state.patientsInQueue = triageRecords.map(record => {
      const patient = patients.find(p => p.id === record.patientId);

      // Calcular tiempo de espera
      const waitingTime = calculateWaitingTime(record.createdAt);
      const waitingTimeFormatted = formatWaitingTime(waitingTime);

      return {
        ...record,
        patient,
        waitingTime,
        waitingTimeFormatted,
        fullName: patient?.name || 'Paciente desconocido',
        age: patient?.birthDate ? calculateAge(patient.birthDate) : '?',
        gender: patient?.gender || 'N/A',
        bloodType: patient?.bloodType || 'Desconocido',
        allergies: patient?.allergies || []
      };
    });

    // Filtrar y ordenar
    applyFilters();

    // Actualizar UI
    updateUI();

    // Actualizar contadores de niveles de triage
    updateTriageLevelCounters();
  }

  // FUNCIÓN NUEVA: Actualizar contadores de niveles de triage
  function updateTriageLevelCounters() {
    if (!elements.triageLevels) return;

    // Contar pacientes por prioridad en estado 'waiting'
    const waitingPatients = state.patientsInQueue.filter(p => p.status === 'waiting');
    const counts = {
      red: waitingPatients.filter(p => p.priority === 'red').length,
      orange: waitingPatients.filter(p => p.priority === 'orange').length,
      yellow: waitingPatients.filter(p => p.priority === 'yellow').length,
      green: waitingPatients.filter(p => p.priority === 'green').length,
      blue: waitingPatients.filter(p => p.priority === 'blue').length
    };

    // Actualizar cada contador
    Object.entries(counts).forEach(([priority, count]) => {
      const countElement = elements.triageLevels.querySelector(`.priority-count[data-priority="${priority}"]`);
      if (countElement) {
        countElement.textContent = count;
      }
    });
  }

  // Actualizar toda la UI
  function updateUI() {
    // Solo actualizar si los elementos existen
    if (elements.contentContainer) {
      renderContent();
    }
    if (elements.statsContainer) {
      renderStats();
    }
    if (elements.triageLevels) {
      renderTriageLevels();
    }

    // Actualizar contadores
    updateTriageLevelCounters();
  }

  // Calcular tiempo de espera
  function calculateWaitingTime(createdAt) {
    if (!createdAt) return 0;
    return Date.now() - new Date(createdAt).getTime();
  }

  // Formatear tiempo de espera
  function formatWaitingTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  // Calcular edad
  function calculateAge(birthDate) {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  // Aplicar filtros
  function applyFilters() {
    let filteredPatients = [...state.patientsInQueue];

    // Filtro por estado
    if (state.filters.status !== 'all') {
      filteredPatients = filteredPatients.filter(p => p.status === state.filters.status);
    }

    // Filtro por prioridad
    if (state.filters.priority !== 'all') {
      filteredPatients = filteredPatients.filter(p => p.priority === state.filters.priority);
    }

    // Filtro por búsqueda
    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filteredPatients = filteredPatients.filter(p =>
        p.fullName.toLowerCase().includes(searchTerm) ||
        p.symptoms?.toLowerCase().includes(searchTerm)
      );
    }

    // Ordenar
    const priorityOrder = { red: 0, orange: 1, yellow: 2, green: 3, blue: 4 };

    filteredPatients.sort((a, b) => {
      if (state.sortBy === 'priority') {
        if (a.priority === b.priority) {
          return a.waitingTime - b.waitingTime;
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (state.sortBy === 'waitingTime') {
        return b.waitingTime - a.waitingTime;
      } else if (state.sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName);
      }
      return 0;
    });

    state.filteredPatients = filteredPatients;
  }

  // Actualizar estadísticas
  function updateStats() {
    const triageRecords = store.get('triage') || [];

    const stats = {
      total: triageRecords.length,
      waiting: triageRecords.filter(t => t.status === 'waiting').length,
      in_progress: triageRecords.filter(t => t.status === 'in_progress').length,
      completed: triageRecords.filter(t => t.status === 'completed').length,
      byPriority: {
        red: triageRecords.filter(t => t.priority === 'red').length,
        orange: triageRecords.filter(t => t.priority === 'orange').length,
        yellow: triageRecords.filter(t => t.priority === 'yellow').length,
        green: triageRecords.filter(t => t.priority === 'green').length,
        blue: triageRecords.filter(t => t.priority === 'blue').length
      }
    };

    // Calcular tiempos de espera solo para pacientes en espera
    const waitingRecords = triageRecords.filter(t => t.status === 'waiting');
    if (waitingRecords.length > 0) {
      const totalTime = waitingRecords.reduce((sum, record) => {
        return sum + calculateWaitingTime(record.createdAt);
      }, 0);
      stats.averageWaitingTime = Math.floor(totalTime / waitingRecords.length / 60000);

      const maxTime = Math.max(...waitingRecords.map(record =>
        calculateWaitingTime(record.createdAt)
      ));
      stats.maxWaitingTime = Math.floor(maxTime / 60000);
    } else {
      stats.averageWaitingTime = 0;
      stats.maxWaitingTime = 0;
    }

    state.stats = stats;

    // Actualizar estadísticas si el elemento existe
    if (elements.statsContainer) {
      renderStats();
    }
    if (elements.triageLevels) {
      renderTriageLevels();
    }
  }

  // FUNCIÓN NUEVA: Sugerir prioridad basada en síntomas y signos vitales
  function suggestPriority(symptoms, vitalSigns) {
    const symptomsLower = symptoms.toLowerCase();

    // Extraer valores de signos vitales
    let bpSystolic = 0;
    if (vitalSigns.bloodPressure) {
      const bpParts = vitalSigns.bloodPressure.split('/');
      if (bpParts.length > 0) {
        bpSystolic = parseInt(bpParts[0]) || 0;
      }
    }
    const hr = parseInt(vitalSigns.heartRate) || 0;
    const spo2 = parseInt(vitalSigns.spo2) || 0;
    const temp = parseFloat(vitalSigns.temperature) || 0;
    const rr = parseInt(vitalSigns.respiratoryRate) || 0;
    const pain = parseInt(vitalSigns.painLevel) || 0;

    // Evaluar criterios ROJO (amenaza vital inmediata)
    const redCriteria = [
      // Síntomas
      symptomsLower.includes('paro') || symptomsLower.includes('parada cardiorespiratoria'),
      symptomsLower.includes('convulsiones'),
      symptomsLower.includes('hemorragia masiva'),
      symptomsLower.includes('shock'),
      symptomsLower.includes('coma'),
      symptomsLower.includes('inconsciente'),
      // Signos vitales
      spo2 > 0 && spo2 < 90,
      rr > 0 && (rr > 30 || rr < 10),
      pain === 10,
      // Presión arterial sistólica < 90
      bpSystolic > 0 && bpSystolic < 90,
      hr > 0 && (hr > 150 || hr < 40)
    ];

    if (redCriteria.some(criteria => criteria)) {
      return 'red';
    }

    // Evaluar criterios NARANJA (riesgo vital potencial)
    const orangeCriteria = [
      // Síntomas
      symptomsLower.includes('dolor torácico') || symptomsLower.includes('dolor de pecho'),
      symptomsLower.includes('disnea') || symptomsLower.includes('dificultad para respirar'),
      symptomsLower.includes('trauma severo') || symptomsLower.includes('trauma grave'),
      symptomsLower.includes('alteración de conciencia') || symptomsLower.includes('confusión'),
      symptomsLower.includes('hemorragia activa'),
      // Signos vitales
      spo2 >= 90 && spo2 <= 94,
      rr >= 25 && rr <= 30,
      pain >= 8 && pain <= 9,
      // Presión arterial sistólica 90-100
      bpSystolic >= 90 && bpSystolic <= 100,
      hr >= 130 && hr <= 150
    ];

    if (orangeCriteria.some(criteria => criteria)) {
      return 'orange';
    }

    // Evaluar criterios AMARILLO (urgente pero estable)
    const yellowCriteria = [
      // Síntomas
      symptomsLower.includes('fiebre alta') || (temp > 39),
      symptomsLower.includes('dolor abdominal'),
      symptomsLower.includes('vómitos persistentes'),
      symptomsLower.includes('infección'),
      symptomsLower.includes('trauma moderado'),
      // Signos vitales
      spo2 >= 95 && spo2 <= 97,
      rr >= 20 && rr <= 24,
      pain >= 5 && pain <= 7,
      temp >= 38 && temp <= 39,
      hr >= 100 && hr <= 130
    ];

    if (yellowCriteria.some(criteria => criteria)) {
      return 'yellow';
    }

    // Evaluar criterios VERDE (poco urgente)
    const greenCriteria = [
      // Síntomas
      symptomsLower.includes('resfriado') || symptomsLower.includes('gripe'),
      symptomsLower.includes('dolor leve'),
      symptomsLower.includes('consulta general'),
      symptomsLower.includes('control'),
      symptomsLower.includes('tos'),
      // Signos vitales
      spo2 > 97,
      pain <= 4,
      temp < 38,
      hr >= 60 && hr <= 100
    ];

    if (greenCriteria.some(criteria => criteria)) {
      return 'green';
    }

    // Por defecto, AZUL (no urgente)
    return 'blue';
  }

  // Renderizar componente principal
  function render() {
    const canCreate = ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);
    const canProcess = ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);

    root.innerHTML = CSS + `
      <div class="module-triage animated-fade-in">
        <!-- Estadísticas -->
        <div class="stats-auto-grid mb-4" id="stats-container">
          <!-- Dinámico -->
        </div>

        <!-- Fluent Command Bar -->
        <div class="f-command-bar" style="margin-bottom: 1.5rem;">
          ${canCreate ? `
          <button class="f-command-item" id="btn-new-triage">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Triage
          </button>
          ` : ''}
          
          ${canProcess ? `
          <button class="f-command-item danger" id="btn-emergency-alert" style="color: var(--red);">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Alerta de Emergencia
          </button>
          ` : ''}

          <button class="f-command-item" id="btn-export-pdf">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Exportar reporte
          </button>

          <button class="f-command-item" id="btn-refresh">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            Actualizar
          </button>

          <div class="f-search-box">
            <span class="f-search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" id="filter-search" placeholder="Buscar por nombre, prioridad o síntomas..." value="${state.filters.search}">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 320px 1fr; gap: 24px;">
          <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
            <h3 style="margin-top: 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--themePrimary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Protocolo de Clasificación
            </h3>
            <div id="triage-levels" style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Dinámico -->
            </div>
          </div>

          <div style="background: white; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 2px 4px rgba(0,0,0,0.02); overflow: hidden;">
            <div class="f-pivot-container" id="pivot-filters">
              <button class="f-pivot-item ${state.filters.status === 'all' ? 'active' : ''}" data-status="all">Todos</button>
              <button class="f-pivot-item ${state.filters.status === 'waiting' ? 'active' : ''}" data-status="waiting">En Espera</button>
              <button class="f-pivot-item ${state.filters.status === 'in_progress' ? 'active' : ''}" data-status="in_progress">En Atención</button>
              <button class="f-pivot-item ${state.filters.status === 'completed' ? 'active' : ''}" data-status="completed">Completados</button>
            </div>

            <div class="table-responsive">
              <table class="f-table">
                <thead>
                  <tr>
                    <th style="width:10px"></th>
                    <th>Prioridad</th>
                    <th>Paciente</th>
                    <th>Síntomas</th>
                    <th>Espera</th>
                    <th style="text-align: right;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="triage-queue">
                  <!-- Dinámico -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <!-- Modales Fluent -->
        <div class="modal-overlay hidden" id="triage-modal">
          <div class="modal-content" style="max-width: 900px; border-radius: 4px; border: none; box-shadow: 0 32px 64px rgba(0,0,0,0.24), 0 2px 21px rgba(0,0,0,0.22);">
            <div class="modal-header" style="background: var(--themePrimary); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
              <h2 style="margin: 0; color: white; font-size: 20px; font-weight: 600;">Nuevo Registro de Triage</h2>
              <button class="btn-close-modal" id="btn-close-modal" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            
            <div class="modal-body" style="padding: 24px; background: #faf9f8;">
              <div class="f-pivot-container" style="margin-bottom: 24px;">
                <button type="button" class="f-pivot-item ${!state.isCreatingPatient ? 'active' : ''}" id="tab-existing-patient">PACIENTE EXISTENTE</button>
                <button type="button" class="f-pivot-item ${state.isCreatingPatient ? 'active' : ''}" id="tab-new-patient">+ NUEVO PACIENTE</button>
              </div>
              
              <div style="background: white; padding: 24px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div id="existing-patient-form" style="${state.isCreatingPatient ? 'display: none;' : ''}">
                  <form id="triage-form">
                    <div class="form-group mb-4">
                      <label class="form-label" style="font-weight: 600; color: var(--neutralPrimary);">SELECCIONAR PACIENTE *</label>
                      <select class="input" id="patient-select" required></select>
                    </div>
                    <!-- Resto de campos con estilo minimalista -->
                    <div class="grid grid-2 gap-4 mb-4">
                       <div class="form-group">
                          <label class="form-label">Síntomas Principales *</label>
                          <textarea class="input" id="symptoms" rows="3" required oninput="window.triageModule?.updatePrioritySuggestion()"></textarea>
                       </div>
                       <div class="form-group">
                          <label class="form-label">Observaciones</label>
                          <textarea class="input" id="observations" rows="3"></textarea>
                       </div>
                    </div>

                    <div class="form-group mb-4">
                      <label class="form-label" style="font-weight: 600;">SIGNOS VITALES INICIALES</label>
                      <div class="grid grid-4 gap-3">
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">PA (mmHg)</label>
                           <input type="text" class="input" id="blood-pressure" placeholder="120/80" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">FC (LPM)</label>
                           <input type="number" class="input" id="heart-rate" placeholder="80" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">T° (°C)</label>
                           <input type="number" step="0.1" class="input" id="temperature" placeholder="37.0" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">SpO2 (%)</label>
                           <input type="number" class="input" id="spo2" placeholder="98" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">FR (RPM)</label>
                           <input type="number" class="input" id="respiratory-rate" placeholder="18" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">DOLOR (0-10)</label>
                           <input type="number" class="input" id="pain-level" placeholder="0" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                      </div>
                    </div>

                    <!-- AI Suggestion Area -->
                    <div id="priority-suggestion-container" class="mb-4" style="display:none; padding: 12px; border-radius: 4px; border-left: 4px solid var(--themePrimary); background: var(--neutralLighter);">
                       <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">Sugerencia de Inteligencia del Sistema:</div>
                       <div id="priority-suggestion"></div>
                       <div id="suggestion-reason" style="font-size: 12px; color: var(--neutralSecondary); margin-top: 4px;"></div>
                    </div>

                    <div class="form-group">
                      <label class="form-label" style="font-weight: 600;">ASIGNAR PRIORIDAD MANUAL *</label>
                      <div style="display: flex; gap: 8px; margin-top: 8px;">
                        ${Object.entries(TRIAGE_LEVELS).map(([key, level]) => `
                          <div class="priority-option compact" data-priority="${key}" 
                               style="flex: 1; border: 1px solid ${level.color}40; background: ${level.color}05; border-radius: 4px; padding: 12px; text-align: center; cursor: pointer; transition: all 0.2s;">
                            <div style="color: ${level.color}; font-weight: 700; font-size: 12px;">${key.toUpperCase()}</div>
                            <div style="font-size: 10px; color: var(--neutralSecondary);">${level.time}</div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </form>
                </div>

                <div id="new-patient-form" style="${state.isCreatingPatient ? '' : 'display: none;'}">
                  <form id="quick-patient-form" style="padding: 10px 0;">
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                      <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: var(--neutralPrimary); display: flex; align-items: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        DATOS IDENTIFICATIVOS
                      </h4>
                      
                      <div class="grid grid-2 gap-4 mb-4">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; font-size: 12px;">NOMBRE COMPLETO *</label>
                          <input type="text" class="input" id="quick-name" placeholder="Ej: Juan Antonio Pérez" required style="height: 38px;">
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; font-size: 12px;">DOCUMENTO DE IDENTIDAD *</label>
                          <div class="doc-group" style="display: flex; gap: 0;">
                            <select class="input" id="quick-doc-type" required style="width: 70px; border-radius: 4px 0 0 4px; border-right: none; background: #fff; height: 38px;">
                              <option value="V">V</option>
                              <option value="E">E</option>
                              <option value="P">P</option>
                              <option value="J">J</option>
                            </select>
                            <input type="text" class="input" id="quick-dni" placeholder="Número de cédula" required style="flex: 1; border-radius: 0 4px 4px 0; height: 38px;">
                          </div>
                        </div>
                      </div>

                      <div class="grid grid-3 gap-4">
                         <div class="form-group">
                            <label class="form-label" style="font-weight: 600; font-size: 11px;">FECHA NACIMIENTO *</label>
                            <input type="date" class="input" id="quick-birthdate" required style="height: 38px;">
                         </div>
                         <div class="form-group">
                            <label class="form-label" style="font-weight: 600; font-size: 11px;">GÉNERO *</label>
                            <select class="input" id="quick-gender" required style="height: 38px;">
                               <option value="M">Masculino</option>
                               <option value="F">Femenino</option>
                               <option value="O">Otro</option>
                            </select>
                         </div>
                         <div class="form-group">
                            <label class="form-label" style="font-weight: 600; font-size: 11px;">GRUPO SANGUÍNEO</label>
                            <select class="input" id="quick-blood-type" style="height: 38px;">
                               <option value="">Desconocido</option>
                               <option value="ORH+">O+</option>
                               <option value="ORH-">O-</option>
                               <option value="ARH+">A+</option>
                               <option value="ARH-">A-</option>
                               <option value="BRH+">B+</option>
                               <option value="BRH-">B-</option>
                               <option value="ABRH+">AB+</option>
                               <option value="ABRH-">AB-</option>
                            </select>
                         </div>
                      </div>
                    </div>

                    <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; border: 1px solid #c2e0ff; margin-bottom: 20px;">
                      <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #005a9e; display: flex; align-items: center; gap: 8px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        INFORMACIÓN DE CONTACTO
                      </h4>
                      <div class="grid grid-2 gap-4">
                         <div class="form-group">
                            <label class="form-label" style="font-weight: 600; font-size: 12px;">TELÉFONO *</label>
                            <input type="tel" class="input" id="quick-phone" placeholder="Ej: 0412 1234567" required style="height: 38px;">
                         </div>
                         <div class="form-group">
                            <label class="form-label" style="font-weight: 600; font-size: 12px;">CORREO ELECTRÓNICO</label>
                            <input type="email" class="input" id="quick-email" placeholder="ejemplo@correo.com" style="height: 38px;">
                         </div>
                      </div>
                    </div>

                    <div class="form-group mb-4">
                       <label class="form-label" style="font-weight: 700; color: var(--themePrimary);">MOTIVO DE CONSULTA / SÍNTOMAS *</label>
                       <textarea class="input" id="quick-symptoms" rows="3" placeholder="Describa el motivo de la urgencia de forma detallada..." required oninput="window.triageModule?.updatePrioritySuggestion()" style="resize: none; border-left: 4px solid var(--themePrimary); padding: 10px;"></textarea>
                    </div>

                    <!-- Campos Ocultos/Adicionales para evitar errores de referencia -->
                    <div style="display:none;">
                      <input type="text" id="quick-address" value="">
                      <input type="text" id="quick-city" value="">
                      <input type="text" id="quick-zip" value="">
                      <input type="text" id="quick-emergency-name" value="">
                      <input type="text" id="quick-emergency-phone" value="">
                      <input type="text" id="quick-emergency-relation" value="">
                      <input type="text" id="quick-insurance-company" value="">
                      <input type="text" id="quick-insurance-number" value="">
                      <input type="text" id="quick-chronic-diseases" value="">
                      <input type="text" id="quick-regular-meds" value="">
                      <input type="text" id="quick-surgeries" value="">
                      <input type="text" id="quick-medical-notes" value="">
                    </div>
                    <div class="form-group mb-4">
                      <label class="form-label" style="font-weight: 600;">SIGNOS VITALES INICIALES</label>
                      <div class="grid grid-4 gap-3">
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">PA (mmHg)</label>
                           <input type="text" class="input" id="quick-bp" placeholder="120/80" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">FC (LPM)</label>
                           <input type="number" class="input" id="quick-hr" placeholder="80" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">T° (°C)</label>
                           <input type="number" step="0.1" class="input" id="quick-temp" placeholder="37.0" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">SpO2 (%)</label>
                           <input type="number" class="input" id="quick-spo2" placeholder="98" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">FR (RPM)</label>
                           <input type="number" class="input" id="quick-rr" placeholder="18" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                        <div class="form-group-sm">
                           <label style="font-size: 10px; color: var(--neutralSecondary); font-weight: 600;">DOLOR (0-10)</label>
                           <input type="number" class="input" id="quick-pain" placeholder="0" oninput="window.triageModule?.updatePrioritySuggestion()">
                        </div>
                      </div>
                    </div>
                    <div id="quick-priority-suggestion-container" class="mb-4" style="display:none; padding: 12px; border-radius: 4px; border-left: 4px solid var(--themePrimary); background: var(--neutralLighter);">
                       <div id="quick-priority-suggestion"></div>
                    </div>
                    <div class="form-group">
                      <label class="form-label" style="font-weight: 600;">PRIORIDAD *</label>
                      <div style="display: flex; gap: 8px; margin-top: 8px;">
                        ${Object.entries(TRIAGE_LEVELS).map(([key, level]) => `
                          <div class="priority-option quick compact" data-priority="${key}" 
                               style="flex: 1; border: 1px solid ${level.color}40; background: ${level.color}05; border-radius: 4px; padding: 12px; text-align: center; cursor: pointer;">
                            <div style="color: ${level.color}; font-weight: 700; font-size: 11px;">${key.toUpperCase()}</div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            
            <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--neutralLight); background: #f3f2f1; display: flex; justify-content: flex-end; gap: 12px;">
              <button class="btn-circle btn-circle-cancel" id="btn-cancel-triage" title="Cancelar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <button class="btn-circle btn-circle-save" id="btn-save-triage" title="Guardar Registro">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Emergency Alert Modal (Diseño Simplificado y Claro) -->
        <div class="modal-overlay hidden" id="emergency-modal">
          <div class="modal-content" style="max-width: 450px; border-radius: 8px; border: none; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
             <div class="modal-header" style="background: var(--red); padding: 16px 20px; color: white; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 0.5px;">ALERTA DE EMERGENCIA</h2>
                <button class="btn-close-modal" id="btn-close-emergency" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">&times;</button>
             </div>
             <div class="modal-body" style="padding: 24px; background: white;">
                <div style="text-align: center; margin-bottom: 20px;">
                   <div style="color: var(--red); margin-bottom: 10px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                   </div>
                   <p style="font-size: 14px; font-weight: 600; color: var(--neutralPrimary);">¿Activar protocolo de respuesta inmediata?</p>
                </div>
                
                <div class="form-group mb-4">
                   <label class="form-label" style="font-size: 12px; font-weight: 700;">TIPO DE EMERGENCIA</label>
                   <select class="input" id="emergency-type" style="border-radius: 4px;">
                      <option value="code_blue">CÓDIGO AZUL (Cardiorrespiratorio)</option>
                      <option value="trauma">TRAUMA SHOCK / ACCIDENTE</option>
                      <option value="mass_casualty">TRIAGE MASIVO</option>
                      <option value="other">OTRA EMERGENCIA CRÍTICA</option>
                   </select>
                </div>
                
                <div class="form-group">
                   <label class="form-label" style="font-size: 12px; font-weight: 700;">UBICACIÓN EXACTA *</label>
                   <input type="text" class="input" id="emergency-location" placeholder="Ej: Pasillo B, Triaje, Entrada" style="border-radius: 4px;">
                </div>
             </div>
             <div class="modal-footer" style="padding: 16px 20px; background: #fdf2f2; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #fee2e2;">
                <button class="btn-circle btn-circle-cancel" id="btn-cancel-emergency" title="Cancelar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <button class="btn-circle" id="btn-activate-emergency" style="background: var(--red); color: white;" title="Activar Alerta de Emergencia">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </button>
             </div>
          </div>
        </div>
      </div>
    `;

    // Guardar referencias (Mapeo Completo para evitar errores funcionales)
    elements = {
      statsContainer: root.querySelector('#stats-container'),
      triageLevels: root.querySelector('#triage-levels'),
      contentContainer: root.querySelector('#triage-queue'),
      pivotFilters: root.querySelector('#pivot-filters'),
      filterSearch: root.querySelector('#filter-search'),
      btnNewTriage: root.querySelector('#btn-new-triage'),
      btnEmergencyAlert: root.querySelector('#btn-emergency-alert'),
      btnExportPdf: root.querySelector('#btn-export-pdf'),
      btnRefresh: root.querySelector('#btn-refresh'),
      triageModal: root.querySelector('#triage-modal'),
      emergencyModal: root.querySelector('#emergency-modal'),

      // Tabs y Contenedores de Formulario
      tabExistingPatient: root.querySelector('#tab-existing-patient'),
      tabNewPatient: root.querySelector('#tab-new-patient'),
      existingPatientForm: root.querySelector('#existing-patient-form'),
      newPatientForm: root.querySelector('#new-patient-form'),

      // Campos Formulario Existente
      patientSelect: root.querySelector('#patient-select'),
      symptoms: root.querySelector('#symptoms'),
      observations: root.querySelector('#observations'),
      bloodPressure: root.querySelector('#blood-pressure'),
      heartRate: root.querySelector('#heart-rate'),
      temperature: root.querySelector('#temperature'),
      spo2: root.querySelector('#spo2'),
      respiratoryRate: root.querySelector('#respiratory-rate'),
      painLevel: root.querySelector('#pain-level'),
      prioritySuggestionContainer: root.querySelector('#priority-suggestion-container'),
      prioritySuggestion: root.querySelector('#priority-suggestion'),
      suggestionReason: root.querySelector('#suggestion-reason'),
      suggestionConfidence: root.querySelector('#suggestion-confidence'),

      // Campos Formulario Nuevo (Quick)
      quickName: root.querySelector('#quick-name'),
      quickDni: root.querySelector('#quick-dni'),
      quickDocType: root.querySelector('#quick-doc-type'),
      quickBirthdate: root.querySelector('#quick-birthdate'),
      quickGender: root.querySelector('#quick-gender'),
      quickBloodType: root.querySelector('#quick-blood-type'),
      quickPhone: root.querySelector('#quick-phone'),
      quickEmail: root.querySelector('#quick-email'),
      quickAddress: root.querySelector('#quick-address'),
      quickCity: root.querySelector('#quick-city'),
      quickZip: root.querySelector('#quick-zip'),
      quickEmergencyName: root.querySelector('#quick-emergency-name'),
      quickEmergencyPhone: root.querySelector('#quick-emergency-phone'),
      quickEmergencyRelation: root.querySelector('#quick-emergency-relation'),
      quickInsuranceCompany: root.querySelector('#quick-insurance-company'),
      quickInsuranceNumber: root.querySelector('#quick-insurance-number'),
      quickSymptoms: root.querySelector('#quick-symptoms'),
      quickBp: root.querySelector('#quick-bp'),
      quickHr: root.querySelector('#quick-hr'),
      quickTemp: root.querySelector('#quick-temp'),
      quickSpo2: root.querySelector('#quick-spo2'),
      quickRr: root.querySelector('#quick-rr'),
      quickPain: root.querySelector('#quick-pain'),
      quickChronicDiseases: root.querySelector('#quick-chronic-diseases'),
      quickRegularMeds: root.querySelector('#quick-regular-meds'),
      quickSurgeries: root.querySelector('#quick-surgeries'),
      quickMedicalNotes: root.querySelector('#quick-medical-notes'),
      quickPrioritySuggestionContainer: root.querySelector('#quick-priority-suggestion-container'),
      quickPrioritySuggestion: root.querySelector('#quick-priority-suggestion'),
      quickSuggestionReason: root.querySelector('#quick-suggestion-reason'),
      quickSuggestionConfidence: root.querySelector('#quick-suggestion-confidence'),
      btnQuickAddAllergy: root.querySelector('#btn-quick-add-allergy'),
      quickAllergiesContainer: root.querySelector('#quick-allergies-container'),

      // Botones Alerta de Emergencia
      btnCancelEmergency: root.querySelector('#btn-cancel-emergency'),
      btnActivateEmergency: root.querySelector('#btn-activate-emergency'),
      btnCloseEmergency: root.querySelector('#btn-close-emergency')
    };

    updateUI();
  }

  // FUNCIÓN MEJORADA: Actualizar sugerencia de prioridad
  function updatePrioritySuggestion() {
    // Prevenir múltiples llamadas
    if (state.isApplyingSuggestion) {
      state.isApplyingSuggestion = false;
      return;
    }

    const isQuickForm = state.isCreatingPatient;

    const symptoms = isQuickForm ?
      (elements.quickSymptoms?.value || '') :
      (elements.symptoms?.value || '');

    const vitalSigns = {
      bloodPressure: isQuickForm ?
        (elements.quickBp?.value || '') :
        (elements.bloodPressure?.value || ''),
      heartRate: isQuickForm ?
        (elements.quickHr?.value || '') :
        (elements.heartRate?.value || ''),
      temperature: isQuickForm ?
        (elements.quickTemp?.value || '') :
        (elements.temperature?.value || ''),
      spo2: isQuickForm ?
        (elements.quickSpo2?.value || '') :
        (elements.spo2?.value || ''),
      respiratoryRate: isQuickForm ?
        (elements.quickRr?.value || '') :
        (elements.respiratoryRate?.value || ''),
      painLevel: isQuickForm ?
        (elements.quickPain?.value || '') :
        (elements.painLevel?.value || '')
    };

    // Solo sugerir si hay síntomas
    if (!symptoms.trim()) {
      return;
    }

    const suggestedPriority = suggestPriority(symptoms, vitalSigns);
    state.suggestedPriority = suggestedPriority;

    const triageLevel = TRIAGE_LEVELS[suggestedPriority];

    // Determinar confianza
    let confidence = 'Media';
    let confidenceColor = '#ca8a04';
    let reason = '';

    // Generar razón basada en los datos
    const reasons = [];

    const symptomsLower = symptoms.toLowerCase();

    if (symptomsLower.includes('paro') || symptomsLower.includes('parada')) {
      reasons.push('Paro cardiorespiratorio reportado');
      confidence = 'Alta';
      confidenceColor = '#e53e3e';
    }
    if (symptomsLower.includes('dolor torácico') || symptomsLower.includes('dolor de pecho')) {
      reasons.push('Dolor torácico presente');
      confidence = 'Alta';
      confidenceColor = '#e53e3e';
    }
    if (symptomsLower.includes('disnea') || symptomsLower.includes('dificultad para respirar')) {
      reasons.push('Dificultad respiratoria reportada');
    }
    if (vitalSigns.spo2 && parseInt(vitalSigns.spo2) < 90) {
      reasons.push('SpO₂ bajo (< 90%)');
      confidence = 'Alta';
      confidenceColor = '#e53e3e';
    }
    if (vitalSigns.painLevel && parseInt(vitalSigns.painLevel) >= 8) {
      reasons.push('Dolor intenso (≥ 8/10)');
    }
    if (vitalSigns.bloodPressure) {
      const bpParts = vitalSigns.bloodPressure.split('/');
      if (bpParts.length > 0) {
        const systolic = parseInt(bpParts[0]);
        if (systolic < 90) {
          reasons.push('Presión arterial sistólica baja (< 90)');
          confidence = 'Alta';
          confidenceColor = '#e53e3e';
        } else if (systolic >= 90 && systolic <= 100) {
          reasons.push('Presión arterial limítrofe');
        }
      }
    }

    reason = reasons.length > 0 ? reasons.join(', ') : 'Basado en síntomas reportados';

    // Actualizar UI de sugerencia
    if (isQuickForm) {
      if (elements.quickPrioritySuggestionContainer) {
        elements.quickPrioritySuggestionContainer.style.display = 'block';
        elements.quickPrioritySuggestion.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: ${triageLevel.lightColor}; border: 2px solid ${triageLevel.color}; border-radius: var(--radius);">
            <div style="font-size: 1.5rem;">${triageLevel.icon}</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 1rem; color: ${triageLevel.color};">${triageLevel.name}</div>
              <div style="font-size: 0.75rem; color: var(--muted);">${triageLevel.description}</div>
            </div>
          </div>
        `;
        elements.quickSuggestionReason.textContent = reason;
        elements.quickSuggestionConfidence.innerHTML = `· Confianza: <span style="color: ${confidenceColor}; font-weight: 500;">${confidence}</span>`;
      }
    } else {
      if (elements.prioritySuggestionContainer) {
        elements.prioritySuggestionContainer.style.display = 'block';
        elements.prioritySuggestion.innerHTML = `
          <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: ${triageLevel.lightColor}; border: 2px solid ${triageLevel.color}; border-radius: var(--radius);">
            <div style="font-size: 1.5rem;">${triageLevel.icon}</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 1rem; color: ${triageLevel.color};">${triageLevel.name}</div>
              <div style="font-size: 0.75rem; color: var(--muted);">${triageLevel.description}</div>
            </div>
          </div>
        `;
        elements.suggestionReason.textContent = reason;
        elements.suggestionConfidence.innerHTML = `· Confianza: <span style="color: ${confidenceColor}; font-weight: 500;">${confidence}</span>`;
      }
    }
  }

  // FUNCIÓN MEJORADA: Aplicar sugerencia de prioridad
  function applySuggestion(suggestedPriority, isQuickForm = false) {
    state.isApplyingSuggestion = true;

    const selector = isQuickForm ? '.priority-option.quick.compact' : '.priority-option.compact';
    const options = document.querySelectorAll(selector);

    options.forEach(option => {
      const priority = option.dataset.priority;
      const triageLevel = TRIAGE_LEVELS[priority];

      option.style.background = triageLevel.lightColor;
      option.style.boxShadow = '';
      option.style.transform = '';

      // Eliminar indicador visual anterior
      const existingBadge = option.querySelector('.suggestion-badge');
      if (existingBadge) existingBadge.remove();

      if (priority === suggestedPriority) {
        option.style.boxShadow = `0 0 0 2px ${triageLevel.color}`;
        option.style.transform = 'scale(1.02)';
        option.style.transition = 'all 0.2s ease';

        // Agregar indicador visual
        const badge = document.createElement('div');
        badge.className = 'suggestion-badge';
        badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';
        badge.style.position = 'absolute';
        badge.style.top = '-8px';
        badge.style.right = '-8px';
        badge.style.fontSize = '0.9rem';
        badge.style.background = 'white';
        badge.style.borderRadius = '50%';
        badge.style.width = '24px';
        badge.style.height = '24px';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        badge.style.zIndex = '1';
        option.style.position = 'relative';
        option.appendChild(badge);
      }
    });

    // Guardar la prioridad seleccionada
    state.selectedPriority = suggestedPriority;

    // Ocultar la sugerencia
    if (isQuickForm && elements.quickPrioritySuggestionContainer) {
      elements.quickPrioritySuggestionContainer.style.display = 'none';
    } else if (!isQuickForm && elements.prioritySuggestionContainer) {
      elements.prioritySuggestionContainer.style.display = 'none';
    }

    // Mostrar notificación
    showMiniNotification(`Prioridad ${TRIAGE_LEVELS[suggestedPriority].name} aplicada`, 'success');
  }

  // FUNCIÓN NUEVA: Mostrar mini notificación dentro del modal
  function showMiniNotification(message, type = 'info') {
    const modal = root.querySelector('#triage-modal');
    if (!modal) return;

    // Eliminar notificación anterior si existe
    const existingNotification = modal.querySelector('.mini-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'mini-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      padding: 0.5rem 1rem;
      background: ${type === 'success' ? '#38a169' :
        type === 'error' ? '#e53e3e' :
          type === 'warning' ? '#d69e2e' : '#3182ce'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10001;
      font-size: 0.875rem;
      animation: slideInUp 0.3s ease;
    `;

    notification.textContent = message;
    modal.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutDown 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // FUNCIÓN NUEVA: Agregar campo de alergia en formulario rápido
  function addQuickAllergyField(value = '', index = null) {
    if (!elements.quickAllergiesContainer) return;

    const allergyIndex = index !== null ? index : elements.quickAllergiesContainer.children.length;
    const allergyId = `quick-allergy-${allergyIndex}`;

    const allergyDiv = document.createElement('div');
    allergyDiv.className = 'flex items-center gap-2 mb-2';
    allergyDiv.innerHTML = `
      <input type="text" class="input input-sm" id="${allergyId}" 
             placeholder="Ej: Penicilina" 
             value="${value}"
             style="flex: 1;">
      <button type="button" class="btn btn-outline btn-sm remove-allergy" 
              style="color: var(--danger); padding: 0.25rem 0.5rem;" data-index="${allergyIndex}">
        ×
      </button>
    `;

    elements.quickAllergiesContainer.appendChild(allergyDiv);

    // Configurar evento para eliminar
    const removeBtn = allergyDiv.querySelector('.remove-allergy');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        allergyDiv.remove();
      });
    }
  }

  // FUNCIÓN NUEVA: Cambiar pestaña interna en formulario rápido
  function switchQuickTab(tabName) {
    const tabBtns = document.querySelectorAll('.tab-btn-sm');
    const tabPanes = document.querySelectorAll('.tab-pane-sm');

    // Actualizar botones de pestaña
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Actualizar contenido de pestañas
    tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.dataset.tab === tabName);
    });
  }

  // Renderizar estadísticas
  function renderStats() {
    if (!elements.statsContainer) return;

    elements.statsContainer.innerHTML = `
      <div class="stat-info-card">
        <span class="stat-info-label">EN ESPERA</span>
        <span class="stat-info-value">${state.stats.waiting || 0}</span>
        <span class="stat-info-sub">
          <svg style="opacity:0.7" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Total: ${state.stats.total || 0} registrados
        </span>
      </div>
      <div class="stat-info-card">
        <span class="stat-info-label">EN ATENCIÓN</span>
        <span class="stat-info-value">${state.stats.in_progress || 0}</span>
        <span class="stat-info-sub">
          <svg style="opacity:0.7" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Pacientes activos
        </span>
      </div>
      <div class="stat-info-card">
        <span class="stat-info-label">ESPERA PROMEDIO</span>
        <span class="stat-info-value">${state.stats.averageWaitingTime || 0}<span style="font-size: 1rem; margin-left: 2px;">min</span></span>
        <span class="stat-info-sub">
          <svg style="opacity:0.7" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          Flujo de hoy
        </span>
      </div>
      <div class="stat-info-card" style="border-bottom: 4px solid var(--red);">
        <span class="stat-info-label" style="color: var(--red);">TIEMPO MÁXIMO</span>
        <span class="stat-info-value" style="color: var(--red);">${state.stats.maxWaitingTime || 0}<span style="font-size: 1rem; margin-left: 2px;">min</span></span>
        <span class="stat-info-sub" style="color: var(--red);">
          <svg style="opacity:0.7" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Requiere atención
        </span>
      </div>
    `;
  }

  // Renderizar niveles de triage
  function renderTriageLevels() {
    if (!elements.triageLevels) return;

    elements.triageLevels.innerHTML = Object.entries(TRIAGE_LEVELS).map(([key, level]) => `
      <div style="border-left: 4px solid ${level.color}; padding: 12px; background: #faf9f8; border-radius: 2px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">${level.icon}</span>
            ${level.name}
          </div>
          <div style="font-size: 12px; color: var(--neutralSecondary); margin-top: 2px;">${level.time} de respuesta</div>
        </div>
        <div style="padding: 4px 10px; background: white; border: 1px solid var(--neutralLight); border-radius: 12px; font-weight: 600; font-size: 14px;">
          ${state.stats.byPriority?.[key] || 0}
        </div>
      </div>
    `).join('');
  }

  // Renderizar contenido
  function renderContent() {
    if (!elements.contentContainer) return;

    if (!state.filteredPatients || state.filteredPatients.length === 0) {
      elements.contentContainer.innerHTML = `
        <tr>
          <td colspan="7" style="padding: 4rem; text-align: center;">
            <div style="opacity: 0.5; margin-bottom: 1rem;">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div style="color: var(--neutralSecondary); font-size: 14px;">No hay pacientes en la cola</div>
          </td>
        </tr>
      `;
      return;
    }

    elements.contentContainer.innerHTML = state.filteredPatients.map(patient => {
      const triageLevel = TRIAGE_LEVELS[patient.priority];

      let timeColor = 'var(--neutralSecondary)';
      if (patient.waitingTime > 3600000) timeColor = 'var(--red)';
      else if (patient.waitingTime > 1800000) timeColor = 'var(--orange)';

      return `
        <tr class="f-row" data-id="${patient.id}">
          <td>
            <div class="f-priority-dot" style="background: ${triageLevel.color};"></div>
          </td>
          <td>
            <span class="f-priority-label" style="background: ${triageLevel.color}20; color: ${triageLevel.color};">
              ${patient.priority.toUpperCase()}
            </span>
          </td>
          <td>
            <div style="font-weight: 600;">${patient.fullName}</div>
            <div style="font-size: 12px; color: var(--neutralSecondary);">${patient.age} años • ${patient.gender}</div>
          </td>
          <td style="max-width: 250px;">
            <div style="font-size: 13px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
              ${patient.symptoms || '—'}
            </div>
          </td>
          <td>
            <div style="font-weight: 600; color: ${timeColor};">${patient.waitingTimeFormatted}</div>
          </td>
          <td style="text-align: right;">
             <div class="flex justify-end gap-2">
                ${patient.status === 'waiting' ? `<button class="btn-circle btn-circle-save" data-action="start" data-id="${patient.id}" title="Atender">${ICONS.check || 'Atender'}</button>` : ''}
                ${patient.status === 'in_progress' ? `<button class="btn-circle btn-circle-status" data-action="complete" data-id="${patient.id}" title="Cerrar">${ICONS.close || 'Cerrar'}</button>` : ''}
                <button class="btn-circle btn-circle-view" data-action="view" data-id="${patient.id}" title="Ver">${ICONS.eye || 'Ver'}</button>
             </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Pivot Filters (Status)
    if (elements.pivotFilters) {
      elements.pivotFilters.addEventListener('click', (e) => {
        const item = e.target.closest('.f-pivot-item');
        if (item) {
          state.filters.status = item.dataset.status;
          elements.pivotFilters.querySelectorAll('.f-pivot-item').forEach(b => b.classList.remove('active'));
          item.classList.add('active');
          applyFilters();
          renderContent();
        }
      });
    }

    // Búsqueda en tiempo real con debounce
    const debouncedFilter = debounce(() => {
      state.filters.search = elements.filterSearch.value;
      applyFilters();
      updateUI();
    }, 300);

    if (elements.filterSearch) {
      elements.filterSearch.addEventListener('input', debouncedFilter);
    }

    if (elements.btnSearch) {
      elements.btnSearch.addEventListener('click', () => {
        state.filters.search = elements.filterSearch.value;
        applyFilters();
        renderContent();
      });
    }

    if (elements.btnRefresh) {
      elements.btnRefresh.addEventListener('click', loadData);
    }

    // Botones principales
    if (elements.btnNewTriage) {
      elements.btnNewTriage.addEventListener('click', openNewTriageModal);
    }

    if (elements.btnEmergencyAlert) {
      elements.btnEmergencyAlert.addEventListener('click', openEmergencyModal);
    }

    if (elements.btnExportPdf) {
      elements.btnExportPdf.addEventListener('click', exportToPDF);
    }

    if (elements.btnNextPatient) {
      elements.btnNextPatient.addEventListener('click', nextPatient);
    }

    if (elements.btnClearCompleted) {
      elements.btnClearCompleted.addEventListener('click', clearCompleted);
    }

    // Delegación de eventos en la tabla
    if (elements.contentContainer) {
      elements.contentContainer.addEventListener('click', handleQueueAction);
    }

    // Modales
    setupModalListeners();

    // Botones Alerta Emergencia Listeners adicionales
    if (elements.btnCancelEmergency) {
      elements.btnCancelEmergency.addEventListener('click', closeEmergencyModal);
    }
    if (elements.btnCloseEmergency) {
      elements.btnCloseEmergency.addEventListener('click', closeEmergencyModal);
    }
    if (elements.btnActivateEmergency) {
      elements.btnActivateEmergency.addEventListener('click', activateEmergency);
    }
  }

  // Cerrar modal de emergencia
  function closeEmergencyModal() {
    if (elements.emergencyModal) elements.emergencyModal.classList.add('hidden');
  }

  // Configurar listeners de modales
  function setupModalListeners() {
    // Modal de nuevo triage
    const triageModal = root.querySelector('#triage-modal');
    if (triageModal) {
      // Tabs de paciente existente/nuevo
      if (elements.tabExistingPatient) {
        elements.tabExistingPatient.addEventListener('click', () => {
          state.isCreatingPatient = false;
          elements.tabExistingPatient.classList.add('active');
          elements.tabNewPatient.classList.remove('active');
          elements.existingPatientForm.style.display = 'block';
          elements.newPatientForm.style.display = 'none';
          if (elements.btnBackToExisting) {
            elements.btnBackToExisting.style.display = 'none';
          }
        });
      }

      if (elements.tabNewPatient) {
        elements.tabNewPatient.addEventListener('click', () => {
          state.isCreatingPatient = true;
          elements.tabNewPatient.classList.add('active');
          elements.tabExistingPatient.classList.remove('active');
          elements.existingPatientForm.style.display = 'none';
          elements.newPatientForm.style.display = 'block';
          if (elements.btnBackToExisting) {
            elements.btnBackToExisting.style.display = 'inline-block';
          }

          // Inicializar pestañas internas
          switchQuickTab('quick-basic');
        });
      }

      if (elements.btnSwitchToNew) {
        elements.btnSwitchToNew.addEventListener('click', () => {
          state.isCreatingPatient = true;
          elements.tabNewPatient.classList.add('active');
          elements.tabExistingPatient.classList.remove('active');
          elements.existingPatientForm.style.display = 'none';
          elements.newPatientForm.style.display = 'block';
          if (elements.btnBackToExisting) {
            elements.btnBackToExisting.style.display = 'inline-block';
          }

          // Inicializar pestañas internas
          switchQuickTab('quick-basic');
        });
      }

      if (elements.btnBackToExisting) {
        elements.btnBackToExisting.addEventListener('click', () => {
          state.isCreatingPatient = false;
          elements.tabExistingPatient.classList.add('active');
          elements.tabNewPatient.classList.remove('active');
          elements.existingPatientForm.style.display = 'block';
          elements.newPatientForm.style.display = 'none';
          elements.btnBackToExisting.style.display = 'none';
        });
      }

      // Botones del modal
      const btnClose = triageModal.querySelector('#btn-close-modal');
      const btnCancel = triageModal.querySelector('#btn-cancel-triage');
      const btnSave = triageModal.querySelector('#btn-save-triage');
      const priorityOptions = triageModal.querySelectorAll('.priority-option:not(.quick)');
      const quickPriorityOptions = triageModal.querySelectorAll('.priority-option.quick');

      if (btnClose) btnClose.addEventListener('click', closeTriageModal);
      if (btnCancel) btnCancel.addEventListener('click', closeTriageModal);
      if (btnSave) btnSave.addEventListener('click', saveTriage);

      // Opciones de prioridad para formulario existente
      priorityOptions.forEach(option => {
        if (!option.classList.contains('quick')) {
          option.addEventListener('click', () => {
            const priority = option.dataset.priority;
            const triageLevel = TRIAGE_LEVELS[priority];

            priorityOptions.forEach(o => {
              if (!o.classList.contains('quick')) {
                const p = o.dataset.priority;
                const tl = TRIAGE_LEVELS[p];
                o.style.background = tl.lightColor;
                o.style.boxShadow = '';
                o.style.transform = '';
                const badge = o.querySelector('.suggestion-badge');
                if (badge) badge.remove();
              }
            });

            option.style.boxShadow = `0 0 0 2px ${triageLevel.color}`;
            option.style.transform = 'scale(1.02)';
            state.selectedPriority = priority;
          });
        }
      });

      // Opciones de prioridad para formulario rápido
      quickPriorityOptions.forEach(option => {
        option.addEventListener('click', () => {
          const priority = option.dataset.priority;
          const triageLevel = TRIAGE_LEVELS[priority];

          quickPriorityOptions.forEach(o => {
            const p = o.dataset.priority;
            const tl = TRIAGE_LEVELS[p];
            o.style.background = tl.lightColor;
            o.style.boxShadow = '';
            o.style.transform = '';
            const badge = o.querySelector('.suggestion-badge');
            if (badge) badge.remove();
          });

          option.style.boxShadow = `0 0 0 2px ${triageLevel.color}`;
          option.style.transform = 'scale(1.02)';
          state.selectedPriority = priority;
        });
      });

      // Eventos de entrada para sugerencias
      const inputElements = [
        'symptoms', 'blood-pressure', 'heart-rate', 'temperature', 'spo2', 'respiratory-rate', 'pain-level',
        'quick-symptoms', 'quick-bp', 'quick-hr', 'quick-temp', 'quick-spo2', 'quick-rr', 'quick-pain'
      ];

      inputElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener('input', updatePrioritySuggestion);
        }
      });

      // Agregar alergia en formulario rápido
      if (elements.btnQuickAddAllergy) {
        elements.btnQuickAddAllergy.addEventListener('click', () => addQuickAllergyField());
      }

      // Pestañas internas para formulario rápido
      const quickTabBtns = triageModal.querySelectorAll('.tab-btn-sm');
      quickTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.dataset.tab;
          switchQuickTab(tab);
        });
      });
    }

    // Modal de emergencia
    const emergencyModal = root.querySelector('#emergency-modal');
    if (emergencyModal) {
      const btnClose = emergencyModal.querySelector('#btn-close-emergency');
      const btnCancel = emergencyModal.querySelector('#btn-cancel-emergency');
      const btnActivate = emergencyModal.querySelector('#btn-activate-emergency');

      if (btnClose) btnClose.addEventListener('click', closeEmergencyModal);
      if (btnCancel) btnCancel.addEventListener('click', closeEmergencyModal);
      if (btnActivate) btnActivate.addEventListener('click', activateEmergency);
    }
  }

  // Función debounce para búsqueda
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Manejar acciones en la cola
  function handleQueueAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const triageId = button.dataset.id;
    const triageRecord = state.patientsInQueue.find(p => p.id === triageId);

    if (!triageRecord) return;

    switch (action) {
      case 'start':
        startTriage(triageRecord);
        break;
      case 'complete':
        completeTriage(triageRecord);
        break;
      case 'view':
        viewTriageDetails(triageRecord);
        break;
    }
  }

  // Abrir modal de nuevo triage
  function openNewTriageModal() {
    const modal = root.querySelector('#triage-modal');
    if (!modal) return;

    // Resetear estado
    state.isCreatingPatient = false;
    state.selectedPriority = null;
    state.suggestedPriority = null;
    state.isApplyingSuggestion = false;

    // Mostrar formulario de paciente existente por defecto
    if (elements.tabExistingPatient) {
      elements.tabExistingPatient.classList.add('active');
      elements.tabNewPatient.classList.remove('active');
    }
    if (elements.existingPatientForm) {
      elements.existingPatientForm.style.display = 'block';
    }
    if (elements.newPatientForm) {
      elements.newPatientForm.style.display = 'none';
    }
    if (elements.btnBackToExisting) {
      elements.btnBackToExisting.style.display = 'none';
    }

    // Cargar lista de pacientes
    if (elements.patientSelect) {
      const patients = store.get('patients').filter(p => p.isActive);
      elements.patientSelect.innerHTML = `
        <option value="">Seleccione un paciente</option>
        ${patients.map(patient => `
          <option value="${patient.id}">
            ${patient.name} (${patient.docType || 'V'}-${patient.dni || '0'}) - ${calculateAge(patient.birthDate)} años
          </option>
        `).join('')}
      `;
    }

    // Resetear formularios
    const form = modal.querySelector('#triage-form');
    if (form) form.reset();

    const quickForm = modal.querySelector('#quick-patient-form');
    if (quickForm) quickForm.reset();

    // Resetear contenedor de alergias
    if (elements.quickAllergiesContainer) {
      elements.quickAllergiesContainer.innerHTML = '';
      addQuickAllergyField(); // Una alergia por defecto
    }

    // Resetear selección de prioridad
    const priorityOptions = modal.querySelectorAll('.priority-option');
    priorityOptions.forEach(o => {
      const priority = o.dataset.priority;
      const triageLevel = TRIAGE_LEVELS[priority];
      o.style.background = triageLevel.lightColor;
      o.style.boxShadow = '';
      o.style.transform = '';
      const badge = o.querySelector('.suggestion-badge');
      if (badge) badge.remove();
    });

    // Ocultar sugerencias
    if (elements.prioritySuggestionContainer) {
      elements.prioritySuggestionContainer.style.display = 'none';
    }
    if (elements.quickPrioritySuggestionContainer) {
      elements.quickPrioritySuggestionContainer.style.display = 'none';
    }

    // Inicializar pestañas internas
    switchQuickTab('quick-basic');

    modal.classList.remove('hidden');
  }

  // Cerrar modal de triage
  function closeTriageModal() {
    const modal = root.querySelector('#triage-modal');
    if (modal) modal.classList.add('hidden');
  }

  // Guardar triage
  async function saveTriage() {
    const modal = root.querySelector('#triage-modal');
    if (!modal) return;

    if (state.isCreatingPatient) {
      // Guardar paciente nuevo y triage
      await saveNewPatientAndTriage();
    } else {
      // Guardar triage para paciente existente
      await saveExistingPatientTriage();
    }
  }

  // Guardar triage para paciente existente
  async function saveExistingPatientTriage() {
    const modal = root.querySelector('#triage-modal');
    if (!modal) return;

    const patientSelect = modal.querySelector('#patient-select');
    const symptoms = modal.querySelector('#symptoms');
    const observations = modal.querySelector('#observations');

    if (!patientSelect.value || !symptoms.value || !state.selectedPriority) {
      showNotification('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    const patient = store.find('patients', patientSelect.value);
    if (!patient) {
      showNotification('Paciente no encontrado', 'error');
      return;
    }

    // Recopilar signos vitales
    const vitalSigns = {
      bloodPressure: modal.querySelector('#blood-pressure').value || null,
      heartRate: parseInt(modal.querySelector('#heart-rate').value) || null,
      temperature: parseFloat(modal.querySelector('#temperature').value) || null,
      spo2: parseInt(modal.querySelector('#spo2').value) || null,
      respiratoryRate: parseInt(modal.querySelector('#respiratory-rate').value) || null,
      painLevel: parseInt(modal.querySelector('#pain-level').value) || null
    };

    try {
      const triageData = {
        patientId: patient.id,
        priority: state.selectedPriority,
        symptoms: symptoms.value,
        observations: observations.value,
        vitalSigns: Object.keys(vitalSigns).every(k => vitalSigns[k] === null) ? null : vitalSigns,
        status: 'waiting',
        triagedBy: user.id,
        triagedByName: user.name,
        createdAt: Date.now()
      };

      await store.add('triage', triageData);

      closeTriageModal();
      showNotification('Triage registrado correctamente', 'success');
      loadData(); // Esto actualizará automáticamente los contadores

    } catch (error) {
      console.error('Error guardando triage:', error);
      showNotification('Error al guardar el triage', 'error');
    }
  }

  // Guardar paciente nuevo y su triage
  async function saveNewPatientAndTriage() {
    const modal = root.querySelector('#triage-modal');
    if (!modal) return;

    // Validar datos básicos del paciente
    const patientFields = [
      { field: elements.quickName, label: 'Nombre requerido' },
      { field: elements.quickDni, label: 'Cédula requerida' },
      { field: elements.quickBirthdate, label: 'Fecha requerida' },
      { field: elements.quickGender, label: 'Género requerido' },
      { field: elements.quickPhone, label: 'Teléfono requerido' }
    ];

    let isValid = true;
    window.hospitalFieldValidation.clearAll(modal);

    patientFields.forEach(({ field, label }) => {
      if (field && !field.value.trim()) {
        window.hospitalFieldValidation.show(field, label);
        isValid = false;
      }
    });

    if (!elements.quickSymptoms?.value.trim()) {
      window.hospitalFieldValidation.show(elements.quickSymptoms, 'Debe describir los síntomas');
      isValid = false;
    }

    if (!state.selectedPriority) {
      // Para la prioridad que es un conjunto de botones, podemos mostrar un mensaje general debajo del contenedor
      const priorityContainer = modal.querySelector('.priority-grid');
      if (priorityContainer) {
        window.hospitalFieldValidation.show(priorityContainer, 'Debe seleccionar un nivel de prioridad');
      }
      isValid = false;
    }

    if (!isValid) {
      const firstError = modal.querySelector('.error-field, .error-field-msg');
      if (firstError && firstError.focus) firstError.focus();
      return;
    }

    // Verificar si el paciente ya existe por cédula
    const existingPatient = store.get('patients').find(p =>
      p.dni === elements.quickDni.value.trim() &&
      p.docType === elements.quickDocType.value
    );
    if (existingPatient) {
      if (await hospitalConfirm(`Ya existe un paciente con C.I. ${elements.quickDocType.value}-${elements.quickDni.value}. ¿Desea usar el paciente existente?`, 'question')) {
        // Cambiar a formulario de paciente existente
        state.isCreatingPatient = false;
        elements.tabExistingPatient.click();
        elements.patientSelect.value = existingPatient.id;
        return;
      } else {
        return;
      }
    }

    try {
      // Obtener alergias
      const allergies = [];
      if (elements.quickAllergiesContainer) {
        const allergyInputs = elements.quickAllergiesContainer.querySelectorAll('input[type="text"]');
        allergyInputs.forEach(input => {
          if (input.value.trim()) {
            allergies.push(input.value.trim());
          }
        });
      }

      // Crear paciente con todos los campos del módulo de pacientes
      const patientData = {
        name: elements.quickName.value.trim(),
        docType: elements.quickDocType.value,
        dni: elements.quickDni.value.trim(),
        birthDate: elements.quickBirthdate.value,
        gender: elements.quickGender.value,
        bloodType: elements.quickBloodType.value || null,
        phone: elements.quickPhone.value,
        email: elements.quickEmail.value || '',
        address: elements.quickAddress.value || '',
        city: elements.quickCity.value || '',
        zipCode: elements.quickZip.value || '',
        emergencyContact: {
          name: elements.quickEmergencyName.value || '',
          phone: elements.quickEmergencyPhone.value || '',
          relation: elements.quickEmergencyRelation.value || ''
        },
        insurance: {
          company: elements.quickInsuranceCompany.value || '',
          policyNumber: elements.quickInsuranceNumber.value || ''
        },
        allergies: allergies,
        chronicDiseases: elements.quickChronicDiseases.value || '',
        regularMeds: elements.quickRegularMeds.value || '',
        surgeries: elements.quickSurgeries.value || '',
        medicalNotes: elements.quickMedicalNotes.value || '',
        isActive: true,
        createdAt: Date.now(),
        createdBy: user.id
      };

      const newPatient = await store.add('patients', patientData);

      // Crear triage
      const vitalSigns = {
        bloodPressure: elements.quickBp?.value || null,
        heartRate: parseInt(elements.quickHr?.value) || null,
        temperature: parseFloat(elements.quickTemp?.value) || null,
        spo2: parseInt(elements.quickSpo2?.value) || null,
        respiratoryRate: parseInt(elements.quickRr?.value) || null,
        painLevel: parseInt(elements.quickPain?.value) || null
      };

      const triageData = {
        patientId: newPatient.id,
        priority: state.selectedPriority,
        symptoms: elements.quickSymptoms.value,
        observations: '',
        vitalSigns: Object.keys(vitalSigns).every(k => vitalSigns[k] === null) ? null : vitalSigns,
        status: 'waiting',
        triagedBy: user.id,
        triagedByName: user.name,
        createdAt: Date.now()
      };

      await store.add('triage', triageData);

      closeTriageModal();
      showNotification('Paciente y triage registrados correctamente', 'success');
      loadData(); // Esto actualizará automáticamente los contadores

    } catch (error) {
      console.error('Error guardando paciente y triage:', error);
      showNotification('Error al guardar el paciente y triage', 'error');
    }
  }

  // Iniciar atención de triage
  async function startTriage(triageRecord) {
    if (!await hospitalConfirm(`¿Iniciar atención de ${triageRecord.fullName}?`, 'question')) return;

    try {
      await store.update('triage', triageRecord.id, {
        status: 'in_progress',
        startedAt: Date.now(),
        attendedBy: user.id
      });

      showNotification(`Atención iniciada para ${triageRecord.fullName}`, 'success');
      loadData(); // Actualizar contadores
    } catch (error) {
      showNotification('Error al iniciar atención', 'error');
    }
  }

  // Completar triage
  async function completeTriage(triageRecord) {
    if (!await hospitalConfirm(`¿Marcar como completada la atención de ${triageRecord.fullName}?`, 'question')) return;

    try {
      await store.update('triage', triageRecord.id, {
        status: 'completed',
        completedAt: Date.now()
      });

      showNotification(`Triage completado para ${triageRecord.fullName}`, 'success');
      loadData(); // Actualizar contadores
    } catch (error) {
      showNotification('Error al completar triage', 'error');
    }
  }

  // Ver detalles de triage (DISEÑO FLUENT UI)
  function viewTriageDetails(triageRecord) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-triage-modal';
    modalContainer.className = 'modal-overlay';
    modalContainer.style.zIndex = '1000';

    const triageLevel = TRIAGE_LEVELS[triageRecord.priority];

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 800px; border-radius: 4px; border: none; box-shadow: 0 32px 64px rgba(0,0,0,0.24);">
        <div class="modal-header" style="background: ${triageLevel.color}; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; color: white; font-size: 18px; font-weight: 600;">Informe de Clasificación: ${triageRecord.fullName}</h2>
          <button id="close-view-triage-btn" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
        </div>
        
        <div class="modal-body" style="padding: 24px; background: #faf9f8; max-height: 80vh; overflow-y: auto;">
          <!-- Cabecera de Clasificación -->
          <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; border-left: 6px solid ${triageLevel.color};">
            <div>
              <div style="font-size: 12px; font-weight: 600; color: var(--neutralSecondary); text-transform: uppercase;">Prioridad Asignada</div>
              <div style="font-size: 24px; font-weight: 700; color: ${triageLevel.color};">${triageLevel.icon} ${triageLevel.name}</div>
              <div style="font-size: 13px; color: var(--neutralSecondary); margin-top: 4px;">Tiempo de respuesta objetivo: <strong>${triageLevel.time}</strong></div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 600; color: var(--neutralSecondary);">FECHA Y HORA</div>
              <div style="font-size: 16px; font-weight: 600;">${new Date(triageRecord.createdAt).toLocaleString()}</div>
              <div style="font-size: 12px; color: var(--neutralSecondary); margin-top: 4px;">ID Registro: #${triageRecord.id.substring(0, 8)}</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- Información Personal -->
            <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <h4 style="margin: 0 0 16px 0; font-size: 14px; border-bottom: 1px solid var(--neutralLight); padding-bottom: 8px;">Datos del Paciente</h4>
              <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px; font-size: 13px;">
                <div style="color: var(--neutralSecondary);">Nombre:</div>
                <div style="font-weight: 600;">${triageRecord.fullName}</div>
                <div style="color: var(--neutralSecondary);">Edad:</div>
                <div style="font-weight: 600;">${triageRecord.age} años</div>
                <div style="color: var(--neutralSecondary);">Género:</div>
                <div style="font-weight: 600;">${triageRecord.gender === 'M' ? 'Masculino' : 'Femenino'}</div>
                <div style="color: var(--neutralSecondary);">Estado:</div>
                <div>
                   <span style="padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; background: ${triageRecord.status === 'completed' ? '#dff6dd' : '#deecf9'}; color: ${triageRecord.status === 'completed' ? '#107c10' : '#0078d4'};">
                     ${triageRecord.status.toUpperCase()}
                   </span>
                </div>
              </div>
            </div>

            <!-- Signos Vitales -->
            <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <h4 style="margin: 0 0 16px 0; font-size: 14px; border-bottom: 1px solid var(--neutralLight); padding-bottom: 8px;">Signos Vitales</h4>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div style="padding: 10px; background: #f3f2f1; border-radius: 2px; text-align: center;">
                  <div style="font-size: 10px; color: var(--neutralSecondary);">TENSIÓN ART.</div>
                  <div style="font-weight: 700;">${triageRecord.vitalSigns?.bloodPressure || '—'}</div>
                </div>
                <div style="padding: 10px; background: #f3f2f1; border-radius: 2px; text-align: center;">
                  <div style="font-size: 10px; color: var(--neutralSecondary);">FC (LPM)</div>
                  <div style="font-weight: 700;">${triageRecord.vitalSigns?.heartRate || '—'}</div>
                </div>
                <div style="padding: 10px; background: #f3f2f1; border-radius: 2px; text-align: center;">
                  <div style="font-size: 10px; color: var(--neutralSecondary);">TEMP (°C)</div>
                  <div style="font-weight: 700;">${triageRecord.vitalSigns?.temperature || '—'}</div>
                </div>
                <div style="padding: 10px; background: #f3f2f1; border-radius: 2px; text-align: center;">
                  <div style="font-size: 10px; color: var(--neutralSecondary);">SPO2 (%)</div>
                  <div style="font-weight: 700;">${triageRecord.vitalSigns?.spo2 || '—'}</div>
                </div>
                <div style="padding: 10px; background: #f3f2f1; border-radius: 2px; text-align: center;">
                  <div style="font-size: 10px; color: var(--neutralSecondary);">FR (RPM)</div>
                  <div style="font-weight: 700;">${triageRecord.vitalSigns?.respiratoryRate || '—'}</div>
                </div>
                <div style="padding: 10px; background: #f3f2f1; border-radius: 2px; text-align: center;">
                  <div style="font-size: 10px; color: var(--neutralSecondary);">DOLOR (0-10)</div>
                  <div style="font-weight: 700;">${triageRecord.vitalSigns?.painLevel !== undefined ? triageRecord.vitalSigns.painLevel : '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Evaluación Clínica -->
          <div style="background: white; padding: 20px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-top: 20px;">
            <h4 style="margin: 0 0 12px 0; font-size: 14px;">Evaluación y Motivo</h4>
            <div style="font-size: 14px; line-height: 1.5; color: var(--neutralPrimary); background: #f8f8f8; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
              <strong>Síntomas:</strong><br>
              ${triageRecord.symptoms}
            </div>
            ${triageRecord.observations ? `
              <div style="font-size: 13px; line-height: 1.5; color: var(--neutralSecondary); border-left: 3px solid var(--neutralTertiary); padding-left: 12px;">
                <strong>Observaciones:</strong><br>
                ${triageRecord.observations}
              </div>
            ` : ''}
          </div>

          <!-- Personal Responsable -->
          <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 40px; border-top: 1px solid var(--neutralLight); padding-top: 16px; font-size: 12px; color: var(--neutralSecondary);">
            <div><strong>Personal de Triage:</strong> ${triageRecord.triagedByName || 'Sistema'}</div>
            ${triageRecord.attendedBy ? `<div><strong>Atendido por:</strong> ID:${triageRecord.attendedBy}</div>` : ''}
          </div>
        </div>
        
        <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid var(--neutralLight); background: #f3f2f1; display: flex; justify-content: flex-end; gap: 12px;">
          <button class="btn-circle btn-circle-view" id="btn-print-record-details" title="Imprimir Informe">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </button>
          <button class="btn-circle btn-circle-cancel" id="btn-close-view-triage" title="Cerrar Informe">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    root.appendChild(modalContainer);

    // Eventos
    const closeBtn = modalContainer.querySelector('#close-view-triage-btn');
    const closeBtnFooter = modalContainer.querySelector('#btn-close-view-triage');
    const printBtn = modalContainer.querySelector('#btn-print-record-details');

    const closeModal = () => {
      modalContainer.classList.add('hidden');
      setTimeout(() => modalContainer.remove(), 200);
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (closeBtnFooter) closeBtnFooter.onclick = closeModal;
    if (printBtn) {
      printBtn.onclick = () => generateIndividualPDF(triageRecord);
    }

    // FUNCIÓN: Generar PDF Individual (Diseño Oficial Blanco y Negro)
    async function generateIndividualPDF(record) {
      if (!record) return;
      try {
        showNotification('Generando informe oficial...', 'info');

        // Cargar dependencias si no están presentes
        if (!window.jspdf) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        if (!window.jspdf_autotable) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const triageLevel = TRIAGE_LEVELS[record.priority] || { name: 'Desconocido', time: 'N/A' };
        const dateStr = new Date(record.createdAt || Date.now()).toLocaleString();
        const patientName = record.fullName || 'Paciente Sin Nombre';

        // --- ENCABEZADO (Estilo Tradicional) ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR', 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text('DEPARTAMENTO DE EMERGENCIAS Y SERVICIO DE TRIAGE', 105, 21, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text('Maturín, Estado Monagas - Venezuela', 105, 26, { align: 'center' });

        doc.setLineWidth(0.5);
        doc.line(20, 30, 190, 30);
        doc.setLineWidth(0.2);
        doc.line(20, 31.5, 190, 31.5); // Doble línea

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('INFORME INDIVIDUAL DE CLASIFICACIÓN CLÍNICA', 105, 40, { align: 'center' });

        // --- DATOS DEL REGISTRO ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`NRO. REGISTRO: #${(record.id || '').substring(0, 8).toUpperCase()}`, 20, 50);
        doc.text(`FECHA/HORA: ${dateStr}`, 190, 50, { align: 'right' });

        // --- SECCIÓN: DATOS DEL PACIENTE ---
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 55, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('I. INFORMACIÓN DEL PACIENTE', 25, 60);

        doc.setFont('helvetica', 'normal');
        doc.text(`Nombre Completo:`, 20, 70);
        doc.setFont('helvetica', 'bold');
        doc.text(`${patientName}`, 55, 70);

        doc.setFont('helvetica', 'normal');
        doc.text(`Cédula / ID:`, 20, 76);
        const dniText = record.patient?.dni || record.dni || 'N/A';
        const docType = record.patient?.docType || record.docType || 'V';
        doc.setFont('helvetica', 'bold');
        doc.text(`${docType}-${dniText}`, 55, 76);

        doc.setFont('helvetica', 'normal');
        doc.text(`Edad:`, 120, 70);
        doc.setFont('helvetica', 'bold');
        doc.text(`${record.age || 'N/A'} años`, 145, 70);

        doc.setFont('helvetica', 'normal');
        doc.text(`Género:`, 120, 76);
        doc.setFont('helvetica', 'bold');
        doc.text(`${record.gender === 'M' ? 'Masculino' : 'Femenino'}`, 145, 76);

        // --- SECCIÓN: CLASIFICACIÓN (TRIAGE) ---
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 85, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('II. NIVEL DE PRIORIDAD ASIGNADO', 25, 90);

        doc.setFontSize(12);
        doc.rect(20, 95, 170, 12);
        doc.text(`${triageLevel.name.toUpperCase()}`, 105, 103, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Tiempo de respuesta esperado: ${triageLevel.time || 'N/A'}`, 105, 112, { align: 'center' });

        // --- SECCIÓN: SIGNOS VITALES ---
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 118, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('III. VALORACIÓN DE SIGNOS VITALES', 25, 123);

        const vs = record.vitalSigns || {};
        const vsRows = [
          ['PARÁMETRO', 'VALOR REGISTRADO', 'RANGO NORMAL'],
          ['Presión Arterial', vs.bloodPressure || '—', '120/80 mmHg'],
          ['Frecuencia Cardíaca', vs.heartRate ? `${vs.heartRate} LPM` : '—', '60-100 LPM'],
          ['Temperatura Corp.', vs.temperature ? `${vs.temperature} °C` : '—', '36.5 - 37.5 °C'],
          ['Saturación O2', vs.spo2 ? `${vs.spo2} %` : '—', '95 - 100 %'],
          ['Frec. Respiratoria', vs.respiratoryRate ? `${vs.respiratoryRate} RPM` : '—', '12 - 20 RPM'],
          ['Escala de Dolor', vs.painLevel !== undefined ? `${vs.painLevel} / 10` : '—', '0 / 10']
        ];

        doc.autoTable({
          startY: 128,
          head: [vsRows[0]],
          body: vsRows.slice(1),
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 2, textColor: 0 },
          headStyles: { fillColor: 0, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: 250 }
        });

        // --- SECCIÓN: EVALUACIÓN CLÍNICA ---
        const lastY = doc.lastAutoTable.finalY + 10;
        doc.setFillColor(240, 240, 240);
        doc.rect(20, lastY, 170, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text('IV. EVALUACIÓN Y MOTIVO DE CONSULTA', 25, lastY + 5);

        doc.setFont('helvetica', 'normal');
        const symptomsText = doc.splitTextToSize(`SÍNTOMAS REPORTADOS: ${record.symptoms || 'No descritos'}`, 170);
        doc.text(symptomsText, 20, lastY + 15);

        let obsY = lastY + 15 + (symptomsText.length * 5) + 5;
        if (record.observations) {
          const obsText = doc.splitTextToSize(`OBSERVACIONES ADICIONALES: ${record.observations}`, 170);
          doc.text(obsText, 20, obsY);
          obsY += (obsText.length * 5) + 10;
        }

        // --- FINALIZACIÓN Y FIRMAS ---
        const signatureY = 260;
        doc.setLineWidth(0.1);
        doc.line(25, signatureY, 85, signatureY);
        doc.line(125, signatureY, 185, signatureY);

        doc.setFontSize(8);
        doc.text('PERSONAL RESPONSABLE DE TRIAGE', 55, signatureY + 5, { align: 'center' });
        doc.text(`${record.triagedByName || 'Personal de Guardia'}`, 55, signatureY + 9, { align: 'center' });

        doc.text('FIRMA DEL PACIENTE / REPRESENTANTE', 155, signatureY + 5, { align: 'center' });

        // Pie de Página
        doc.setFontSize(7);
        doc.setTextColor(100);
        doc.text('Este documento es una valoración inicial de urgencias y no sustituye el diagnóstico médico final ni la historia clínica.', 105, 285, { align: 'center' });
        doc.text('Sistema de Gestión Hospitalaria HUMNT - 2026', 105, 290, { align: 'center' });

        // Guardar
        const fileName = `INFORME_TRIAGE_${patientName.replace(/\s+/g, '_').toUpperCase()}.pdf`;
        doc.save(fileName);
        showNotification('Informe oficial generado y descargado', 'success');

      } catch (err) {
        console.error('Error Generando Reporte:', err);
        showNotification('No se pudo generar el reporte en PDF', 'error');
      }
    }

    // Cerrar al hacer clic fuera
    modalContainer.onclick = (e) => {
      if (e.target === modalContainer) closeModal();
    };
  }

  // Abrir modal de emergencia
  function openEmergencyModal() {
    const modal = root.querySelector('#emergency-modal');
    if (modal) modal.classList.remove('hidden');
  }

  // Cerrar modal de emergencia
  function closeEmergencyModal() {
    const modal = root.querySelector('#emergency-modal');
    if (modal) modal.classList.add('hidden');
  }

  // Activar emergencia
  async function activateEmergency() {
    const modal = root.querySelector('#emergency-modal');
    if (!modal) return;

    const location = modal.querySelector('#emergency-location').value;
    const type = modal.querySelector('#emergency-type').value;
    const description = modal.querySelector('#emergency-description').value;

    if (!location.trim()) {
      alert('Debe especificar la ubicación');
      return;
    }

    try {
      const emergencyAlert = {
        type: type,
        location: location,
        description: description,
        activatedBy: user.id,
        activatedByName: user.name,
        activatedAt: Date.now(),
        status: 'active'
      };

      await store.add('emergency_alerts', emergencyAlert);
      closeEmergencyModal();

      // Mostrar alerta visual
      showEmergencyAlert(type, location);

      showNotification('Alerta de emergencia activada', 'success');

    } catch (error) {
      showNotification('Error al activar alerta', 'error');
    }
  }

  // Mostrar alerta visual
  function showEmergencyAlert(type, location) {
    const alertTypes = {
      'code_blue': { title: 'CÓDIGO AZUL', color: '#3182ce' },
      'code_red': { title: 'CÓDIGO ROJO', color: '#e53e3e' },
      'code_black': { title: 'CÓDIGO NEGRO', color: '#000000' },
      'mass_casualty': { title: 'MÚLTIPLES VÍCTIMAS', color: '#d69e2e' },
      'evacuation': { title: 'EVACUACIÓN', color: '#38a169' }
    };

    const alertInfo = alertTypes[type] || { title: 'EMERGENCIA', color: '#e53e3e' };

    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: ${alertInfo.color};
      color: white;
      padding: 1rem;
      z-index: 10000;
      text-align: center;
      font-weight: bold;
      font-size: 1.25rem;
      animation: flash 1s infinite;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    `;

    alertDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      ${alertInfo.title} - ${location}
      <button onclick="this.parentElement.remove()" style="position: absolute; right: 1rem; background: transparent; border: 1px solid white; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
        &times;
      </button>
    `;

    document.body.appendChild(alertDiv);

    // Remover después de 5 minutos
    setTimeout(() => {
      if (document.contains(alertDiv)) {
        alertDiv.remove();
      }
    }, 5 * 60 * 1000);
  }

  // Exportar a PDF (FUNCIÓN COMPLETA Y MEJORADA)
  function exportToPDF() {
    if (state.isExportingPDF) return;

    state.isExportingPDF = true;

    try {
      // Verificar si jsPDF está disponible
      if (typeof window.jspdf === 'undefined') {
        // Cargar jsPDF dinámicamente
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
          generatePDF();
          state.isExportingPDF = false;
        };
        script.onerror = () => {
          showNotification('Error al cargar la librería PDF. Por favor, intente nuevamente.', 'error');
          state.isExportingPDF = false;
        };
        document.head.appendChild(script);
      } else {
        generatePDF();
        state.isExportingPDF = false;
      }
    } catch (error) {
      console.error('Error exportando PDF:', error);
      showNotification('Error al generar el PDF', 'error');
      state.isExportingPDF = false;
    }
  }

  // FUNCIÓN MEJORADA: Generar PDF formal para hospital
  function generatePDF() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      // Configuración
      const pageWidth = doc.internal.pageSize.width;
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      const lineHeight = 5;

      // Función auxiliar para convertir a escala de grises
      const toGrayscale = (r, g, b) => {
        const gsc = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
        return [gsc, gsc, gsc];
      };

      // Función auxiliar para establecer colores de forma segura (SOPORTA ESCALA DE GRISES)
      const safeSetFillColor = (color) => {
        try {
          let r, g, b;
          if (Array.isArray(color) && color.length === 3) {
            [r, g, b] = color;
          } else if (typeof color === 'string' && color.startsWith('#')) {
            const hex = color.replace('#', '');
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
          } else if (typeof color === 'number') {
            [r, g, b] = [color, color, color];
          } else {
            [r, g, b] = [0, 0, 0];
          }
          const [gr, gg, gb] = toGrayscale(r, g, b);
          doc.setFillColor(gr, gg, gb);
        } catch (error) {
          doc.setFillColor(0, 0, 0);
        }
      };

      const safeSetTextColor = (color) => {
        try {
          let r, g, b;
          if (Array.isArray(color) && color.length === 3) {
            [r, g, b] = color;
          } else if (typeof color === 'string' && color.startsWith('#')) {
            const hex = color.replace('#', '');
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
          } else if (typeof color === 'number') {
            [r, g, b] = [color, color, color];
          } else {
            [r, g, b] = [0, 0, 0];
          }
          const [gr, gg, gb] = toGrayscale(r, g, b);
          doc.setTextColor(gr, gg, gb);
        } catch (error) {
          doc.setTextColor(0, 0, 0);
        }
      };

      // --- ENCABEZADO FORMAL ---
      doc.setFontSize(16);
      safeSetTextColor([0, 51, 102]);
      doc.setFont('helvetica', 'bold');
      doc.text('HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR', pageWidth / 2, margin, { align: 'center' });

      doc.setFontSize(10);
      safeSetTextColor([102, 102, 102]);
      doc.setFont('helvetica', 'normal');
      doc.text('SERVICIO DE URGENCIAS - SISTEMA DE TRIAGE', pageWidth / 2, margin + 6, { align: 'center' });
      doc.text('Reporte Oficial', pageWidth / 2, margin + 11, { align: 'center' });

      // Línea separadora
      const [gr, gg, gb] = toGrayscale(0, 51, 102);
      doc.setDrawColor(gr, gg, gb);
      doc.setLineWidth(0.5);
      doc.line(margin, margin + 15, pageWidth - margin, margin + 15);

      let yPos = margin + 25;

      // --- INFORMACIÓN DEL REPORTE ---
      doc.setFontSize(9);
      safeSetTextColor([0, 0, 0]);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL REPORTE', margin, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      const reportInfo = [
        `Fecha de generación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} `,
        `Generado por: ${user.name} (${user.role || 'Personal médico'})`,
        `Período: Últimas 24 horas`,
        `Hospital: Hospital Universitario Manuel Nuñez Tovar - Servicio de Urgencias`
      ];

      reportInfo.forEach((text, i) => {
        const colWidth = contentWidth / 2;
        const xPos = margin + (i % 2) * colWidth;
        const rowY = yPos + Math.floor(i / 2) * lineHeight;
        doc.text(text, xPos, rowY);
      });

      yPos += 10 + Math.ceil(reportInfo.length / 2) * lineHeight;

      // --- RESUMEN ESTADÍSTICO EN TABLA COMPACTA ---
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN ESTADÍSTICO', margin, yPos);
      yPos += 8;

      // Tabla de estadísticas
      const statsData = [
        ['MÉTRICA', 'VALOR', 'OBSERVACIÓN'],
        ['Pacientes totales', `${state.stats.total || 0} `, 'Todos los casos'],
        ['En espera', `${state.stats.waiting || 0} `, 'Pendientes de atención'],
        ['En atención', `${state.stats.in_progress || 0} `, 'Actualmente siendo atendidos'],
        ['Atendidos', `${state.stats.completed || 0} `, 'Finalizados'],
        ['Tiempo promedio', `${state.stats.averageWaitingTime || 0} min`, 'Espera promedio'],
        ['Tiempo máximo', `${state.stats.maxWaitingTime || 0} min`, 'Caso más crítico']
      ];

      const colWidths = [50, 30, 70];
      const rowHeight = 7;

      // Encabezado de tabla
      safeSetFillColor([0, 51, 102]);
      doc.rect(margin, yPos - 3, contentWidth, rowHeight, 'F');
      safeSetTextColor([255, 255, 255]);
      doc.setFont('helvetica', 'bold');

      let xOffset = margin;
      statsData[0].forEach((header, i) => {
        doc.text(header, xOffset + 2, yPos);
        xOffset += colWidths[i];
      });

      yPos += rowHeight;

      // Filas de datos
      doc.setFont('helvetica', 'normal');
      statsData.slice(1).forEach((row, rowIndex) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = margin + 10;
        }

        // Fondo alternado
        safeSetFillColor(rowIndex % 2 === 0 ? [245, 245, 245] : [255, 255, 255]);
        doc.rect(margin, yPos - 3, contentWidth, rowHeight, 'F');

        safeSetTextColor([0, 0, 0]);

        xOffset = margin;
        row.forEach((cell, colIndex) => {
          doc.text(cell.toString(), xOffset + 2, yPos);
          xOffset += colWidths[colIndex];
        });

        yPos += rowHeight;
      });

      yPos += 10;

      // --- DISTRIBUCIÓN POR PRIORIDAD ---
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      safeSetTextColor([0, 0, 0]);
      doc.text('DISTRIBUCIÓN POR NIVEL DE PRIORIDAD', margin, yPos);
      yPos += 8;

      // Tabla de prioridades
      const priorityData = Object.entries(TRIAGE_LEVELS).map(([key, level]) => ({
        priority: key,
        name: level.name.split(' - ')[1] || level.name,
        color: TRIAGE_LEVELS_RGB[key] || [0, 0, 0],
        count: state.stats.byPriority?.[key] || 0,
        time: level.time
      }));

      const priorityColWidths = [25, 50, 25, 40, 30];

      // Encabezado
      safeSetFillColor([77, 77, 77]);
      doc.rect(margin, yPos - 3, contentWidth, rowHeight, 'F');
      safeSetTextColor([255, 255, 255]);
      doc.text('NIVEL', margin + 2, yPos);
      doc.text('DESCRIPCIÓN', margin + 27, yPos);
      doc.text('PAC.', margin + 77, yPos);
      doc.text('TIEMPO OBJ.', margin + 102, yPos);
      doc.text('%', margin + 142, yPos);

      yPos += rowHeight;

      // Calcular porcentajes
      const totalPriorityPatients = priorityData.reduce((sum, item) => sum + item.count, 0);

      // Filas de prioridades
      priorityData.forEach((item, index) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = margin + 10;
        }

        // Fondo alternado
        safeSetFillColor(index % 2 === 0 ? [250, 250, 250] : [255, 255, 255]);
        doc.rect(margin, yPos - 3, contentWidth, rowHeight, 'F');

        // Color de la prioridad
        safeSetTextColor([0, 0, 0]);
        doc.setFont('helvetica', 'bold');
        doc.text(item.priority.toUpperCase(), margin + 2, yPos);

        doc.setFont('helvetica', 'normal');
        doc.text(item.name, margin + 27, yPos);
        doc.text(item.count.toString(), margin + 77, yPos);
        doc.text(item.time, margin + 102, yPos);

        // Porcentaje
        const percentage = totalPriorityPatients > 0 ?
          Math.round((item.count / totalPriorityPatients) * 100) : 0;
        doc.text(`${percentage}% `, margin + 142, yPos);

        // Barra de porcentaje visual
        const barWidth = 30;
        const barHeight = 3;
        const fillWidth = (percentage / 100) * barWidth;

        // Fondo de la barra
        safeSetFillColor([230, 230, 230]);
        doc.rect(margin + 150, yPos - 2, barWidth, barHeight, 'F');

        // Barra de progreso con color de la prioridad - CORREGIDO
        safeSetFillColor(item.color);
        doc.rect(margin + 150, yPos - 2, fillWidth, barHeight, 'F');

        yPos += rowHeight;
      });

      yPos += 10;

      // --- LISTA DETALLADA DE PACIENTES EN ESPERA ---
      if (state.filteredPatients && state.filteredPatients.length > 0) {
        const waitingPatients = state.filteredPatients.filter(p => p.status === 'waiting');

        if (waitingPatients.length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.text('PACIENTES EN ESPERA DE ATENCIÓN', margin, yPos);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(`(Ordenados por prioridad y tiempo de espera)`, margin, yPos + 4);
          yPos += 12;

          // Encabezado compacto
          const patientColWidths = [45, 20, 15, 35, 35, 25];

          safeSetFillColor([77, 77, 77]);
          doc.rect(margin, yPos - 3, contentWidth, 6, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(7);

          let xPos = margin + 2;
          const headers = ['PACIENTE', 'EDAD', 'GÉN.', 'PRIORIDAD', 'SÍNTOMAS PRINCIPALES', 'ESPERA'];
          headers.forEach((header, i) => {
            doc.text(header, xPos, yPos);
            xPos += patientColWidths[i];
          });

          yPos += 6;

          // Datos de pacientes
          doc.setFontSize(7);
          waitingPatients.forEach((patient, index) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = margin + 10;
              // Repetir encabezado en nueva página
              safeSetFillColor([77, 77, 77]);
              doc.rect(margin, yPos - 3, contentWidth, 6, 'F');
              doc.setTextColor(255, 255, 255);

              xPos = margin + 2;
              headers.forEach((header, i) => {
                doc.text(header, xPos, yPos);
                xPos += patientColWidths[i];
              });

              yPos += 6;
            }

            // Fondo alternado
            safeSetFillColor(index % 2 === 0 ? [255, 255, 255] : [250, 250, 250]);
            doc.rect(margin, yPos - 2, contentWidth, 5, 'F');

            // Color según prioridad
            const rgbColor = TRIAGE_LEVELS_RGB[patient.priority] || [0, 0, 0];
            safeSetTextColor(rgbColor);
            doc.setFont('helvetica', 'bold');

            xPos = margin + 2;

            // Nombre
            const shortName = patient.fullName.length > 20 ?
              patient.fullName.substring(0, 20) + '...' : patient.fullName;
            doc.text(shortName, xPos, yPos);
            xPos += patientColWidths[0];

            // Edad y género
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(patient.age.toString(), xPos, yPos);
            xPos += patientColWidths[1];

            const genderSymbol = patient.gender === 'M' ? 'MASCULINO' : patient.gender === 'F' ? 'FEMENINO' : 'OTRO';
            doc.text(genderSymbol, xPos, yPos);
            xPos += patientColWidths[2];

            // Prioridad
            doc.setFont('helvetica', 'bold');
            safeSetTextColor(rgbColor);
            const shortPriority = patient.priority.toUpperCase();
            doc.text(shortPriority, xPos, yPos);
            xPos += patientColWidths[3];

            // Síntomas
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            const shortSymptoms = patient.symptoms ?
              (patient.symptoms.length > 25 ? patient.symptoms.substring(0, 25) + '...' : patient.symptoms) :
              'No especificado';
            doc.text(shortSymptoms, xPos, yPos);
            xPos += patientColWidths[4];

            // Tiempo de espera
            const waitingColor = patient.waitingTime > 7200000 ?
              [220, 38, 38] : [0, 0, 0];
            doc.setTextColor(waitingColor[0], waitingColor[1], waitingColor[2]);
            doc.text(patient.waitingTimeFormatted, xPos, yPos);

            yPos += 5;
          });

          yPos += 10;
        }
      }

      // --- ANÁLISIS Y RECOMENDACIONES ---
      if (yPos > 200) {
        doc.addPage();
        yPos = margin + 10;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text('ANÁLISIS Y RECOMENDACIONES', margin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      const recommendations = [];

      // Análisis basado en estadísticas
      if (state.stats.waiting > 10) {
        recommendations.push(`• Alto volumen de pacientes en espera(${state.stats.waiting}).Considere activar personal adicional.`);
      }

      if (state.stats.maxWaitingTime > 120) {
        recommendations.push(`• Paciente(s) con espera crítica(> ${state.stats.maxWaitingTime} min).Revisión inmediata requerida.`);
      }

      if (state.stats.byPriority?.red > 0) {
        recommendations.push(`• ${state.stats.byPriority.red} paciente(s) en nivel ROJO.Atención inmediata obligatoria.`);
      }

      if (state.stats.byPriority?.orange > 3) {
        recommendations.push(`• ${state.stats.byPriority.orange} paciente(s) en nivel NARANJA.Atención prioritaria recomendada.`);
      }

      // Recomendaciones generales si no hay específicas
      if (recommendations.length === 0) {
        recommendations.push(
          '• Situación controlada en el servicio de urgencias.',
          '• Tiempos de espera dentro de parámetros aceptables.',
          '• Continuar con el protocolo estándar de atención.'
        );
      }

      recommendations.push(
        '• Este reporte es un documento oficial del Hospital Universitario Manuel Nuñez Tovar.',
        '• Los tiempos son aproximados y pueden variar según la situación clínica.'
      );

      recommendations.forEach((rec, i) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = margin + 10;
        }
        doc.text(rec, margin + 5, yPos);
        yPos += 5;
      });

      yPos += 10;

      // --- FIRMA Y VALIDACIÓN ---
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text('Documento generado automáticamente por el Sistema de Triage del Hospital Universitario Manuel Nuñez Tovar',
        pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
      doc.text('Válido como documentación interna del servicio de urgencias',
        pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
      doc.text(`ID de reporte: TRI - ${Date.now().toString().slice(-8)} `,
        pageWidth / 2, yPos, { align: 'center' });

      // --- PIE DE PÁGINA EN TODAS LAS PÁGINAS ---
      const totalPages = doc.internal.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Número de página
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        doc.text(`Página ${i} de ${totalPages} `, pageWidth - margin - 10, 290, { align: 'right' });

        // Sello del hospital
        doc.setFontSize(6);
        doc.text('HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR - CONFIDENCIAL', margin, 290);

        // Fecha en pie de página
        const now = new Date();
        const formattedDate = now.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(`Generado: ${formattedDate} `, pageWidth / 2, 290, { align: 'center' });
      }

      // --- GUARDAR PDF ---
      const now = new Date();
      const filename = `Reporte_Triage_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.pdf`;

      doc.save(filename);

      showNotification('Reporte PDF generado exitosamente', 'success');

    } catch (error) {
      console.error('Error en generatePDF:', error);
      showNotification('Error al generar el PDF', 'error');

      // Fallback a texto
      try {
        const blob = new Blob([generateFormalTextReport()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Triage_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Se descargó versión en texto como respaldo', 'warning');
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
      }
    }
  }

  // Función mejorada para reporte de texto (fallback)
  function generateFormalTextReport() {
    const now = new Date();
    let report = '='.repeat(80) + '\n';
    report += 'HOSPITAL CENTRAL - SERVICIO DE URGENCIAS\n';
    report += 'REPORTE OFICIAL DE TRIAGE\n';
    report += '='.repeat(80) + '\n\n';

    report += `Fecha de generación: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} \n`;
    report += `Generado por: ${user.name} \n`;
    report += `Hospital: Hospital Universitario Manuel Nuñez Tovar - Servicio de Urgencias\n`;
    report += '-'.repeat(80) + '\n\n';

    report += 'RESUMEN ESTADÍSTICO:\n';
    report += '-'.repeat(40) + '\n';
    report += `Total de pacientes: ${state.stats.total || 0} \n`;
    report += `En espera: ${state.stats.waiting || 0} \n`;
    report += `En atención: ${state.stats.in_progress || 0} \n`;
    report += `Atendidos: ${state.stats.completed || 0} \n`;
    report += `Tiempo promedio de espera: ${state.stats.averageWaitingTime || 0} minutos\n`;
    report += `Tiempo máximo de espera: ${state.stats.maxWaitingTime || 0} minutos\n\n`;

    report += 'DISTRIBUCIÓN POR PRIORIDAD:\n';
    report += '-'.repeat(40) + '\n';
    Object.entries(TRIAGE_LEVELS).forEach(([key, level]) => {
      const count = state.stats.byPriority?.[key] || 0;
      report += `${level.name}: ${count} pacientes\n`;
    });
    report += '\n';

    const waitingPatients = state.filteredPatients?.filter(p => p.status === 'waiting') || [];
    if (waitingPatients.length > 0) {
      report += 'PACIENTES EN ESPERA DE ATENCIÓN:\n';
      report += '-'.repeat(80) + '\n';
      report += 'No. | Paciente                     | Edad | Prioridad | Síntomas principales                  | Espera\n';
      report += '-'.repeat(80) + '\n';

      waitingPatients.forEach((patient, index) => {
        const shortSymptoms = patient.symptoms ?
          (patient.symptoms.length > 35 ? patient.symptoms.substring(0, 35) + '...' : patient.symptoms) :
          'No especificado';

        report += `${(index + 1).toString().padStart(3)} | `;
        report += `${patient.fullName.padEnd(25)} | `;
        report += `${patient.age.toString().padStart(4)} | `;
        report += `${patient.priority.toUpperCase().padStart(9)} | `;
        report += `${shortSymptoms.padEnd(35)} | `;
        report += `${patient.waitingTimeFormatted} \n`;
      });
      report += '\n';
    }

    report += 'ANÁLISIS Y RECOMENDACIONES:\n';
    report += '-'.repeat(40) + '\n';

    if (state.stats.waiting > 10) {
      report += `• Alto volumen de pacientes en espera(${state.stats.waiting}).Considere activar personal adicional.\n`;
    }
    if (state.stats.maxWaitingTime > 120) {
      report += `• Paciente(s) con espera crítica(> ${state.stats.maxWaitingTime} min).Revisión inmediata requerida.\n`;
    }
    if (state.stats.byPriority?.red > 0) {
      report += `• ${state.stats.byPriority.red} paciente(s) en nivel ROJO.Atención inmediata obligatoria.\n`;
    }

    report += '\n';
    report += 'FIRMA Y VALIDACIÓN:\n';
    report += '-'.repeat(40) + '\n';
    report += 'Documento generado automáticamente por el Sistema de Triage\n';
    report += 'Válido como documentación interna del servicio de urgencias\n';
    report += `ID de reporte: TRI - ${Date.now().toString().slice(-8)} \n\n`;

    report += '='.repeat(80) + '\n';
    report += 'HOSPITAL CENTRAL - CONFIDENCIAL\n';
    report += 'Documento oficial del servicio de urgencias\n';
    report += '='.repeat(80) + '\n';

    return report;
  }

  // Siguiente paciente
  async function nextPatient() {
    const nextPatient = state.filteredPatients
      .filter(p => p.status === 'waiting')
      .sort((a, b) => {
        const priorityOrder = { red: 0, orange: 1, yellow: 2, green: 3, blue: 4 };
        if (a.priority === b.priority) {
          return a.waitingTime - b.waitingTime;
        }
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })[0];

    if (!nextPatient) {
      showNotification('No hay pacientes esperando atención', 'info');
      return;
    }

    if (await hospitalConfirm(`¿Atender a ${nextPatient.fullName} (${TRIAGE_LEVELS[nextPatient.priority].name})?`, 'question')) {
      startTriage(nextPatient);
    }
  }

  // Limpiar completados
  async function clearCompleted() {
    if (!await hospitalConfirm('¿Eliminar todos los registros de triage completados? Esta acción no se puede deshacer.', 'danger')) {
      return;
    }

    try {
      const triageRecords = store.get('triage') || [];
      const completedRecords = triageRecords.filter(t => t.status === 'completed');

      for (const record of completedRecords) {
        await store.remove('triage', record.id);
      }

      showNotification(`${completedRecords.length} registros eliminados`, 'success');
      loadData(); // Actualizar contadores
    } catch (error) {
      showNotification('Error al limpiar registros', 'error');
    }
  }

  // Mostrar notificación
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  background: ${type === 'success' ? 'var(--success)' :
        type === 'error' ? 'var(--danger)' :
          type === 'warning' ? 'var(--warning)' : 'var(--info)'
      };
  color: white;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  z-index: 10000;
  animation: slideIn 0.3s ease;
  `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Inicializar módulo
  const moduleInstance = init();

  // Exponer funciones globales
  window.triageModule = {
    updatePrioritySuggestion: updatePrioritySuggestion,
    applySuggestion: applySuggestion
  };

  return {
    refresh: loadData,

    destroy() {
      if (moduleInstance && moduleInstance.destroy) moduleInstance.destroy();

      // Remover banner de emergencia si existe
      const emergencyBanner = document.querySelector('#emergency-banner');
      if (emergencyBanner) emergencyBanner.remove();

      // Limpiar referencia global
      delete window.triageModule;
    }
  };
}