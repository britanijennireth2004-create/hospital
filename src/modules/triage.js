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
      color: '#e53e3e', // Rojo más suave
      lightColor: '#fed7d7', // Fondo claro
      icon: '🟥',
      time: '0-10 min',
      description: 'Amenaza vital inmediata',
      criteria: ['paro cardiorespiratorio', 'convulsiones', 'hemorragia masiva', 'shock', 'coma', 'pso2 < 90%', 'fr > 30 o < 10', 'ta sistólica < 90', 'dolor 10/10']
    },
    orange: {
      name: 'Naranja - Muy urgente',
      color: '#dd6b20', // Naranja más suave
      lightColor: '#feebc8',
      icon: '🟧',
      time: '10-60 min',
      description: 'Riesgo vital potencial',
      criteria: ['dolor torácico', 'disnea moderada', 'trauma severo', 'alteración conciencia', 'pso2 90-94%', 'fr 25-30', 'ta 90-100', 'dolor 8-9/10']
    },
    yellow: {
      name: 'Amarillo - Urgente',
      color: '#d69e2e', // Amarillo más suave
      lightColor: '#fefcbf',
      icon: '🟨',
      time: '60-120 min',
      description: 'Urgente pero estable',
      criteria: ['fiebre alta', 'dolor abdominal', 'vómitos persistentes', 'infecciones moderadas', 'pso2 95-97%', 'fr 20-24', 'ta normal', 'dolor 5-7/10']
    },
    green: {
      name: 'Verde - Poco urgente',
      color: '#38a169', // Verde más suave
      lightColor: '#c6f6d5',
      icon: '🟩',
      time: '2-4 horas',
      description: 'No urgente',
      criteria: ['resfriado común', 'dolor leve', 'consulta general', 'control rutinario', 'pso2 > 97%', 'fr normal', 'ta normal', 'dolor < 4/10']
    },
    blue: {
      name: 'Azul - No urgente',
      color: '#3182ce', // Azul más suave
      lightColor: '#bee3f8',
      icon: '🟦',
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

    // Si ya es un array, devolverlo
    if (Array.isArray(color) && color.length === 3) {
      return color;
    }

    // Si es una clave de TRIAGE_LEVELS_RGB
    if (typeof color === 'string' && TRIAGE_LEVELS_RGB[color]) {
      return TRIAGE_LEVELS_RGB[color];
    }

    // Si es string hexadecimal
    if (typeof color === 'string' && color.startsWith('#')) {
      const hex = color.replace('#', '');

      // Expandir formato corto si es necesario
      const fullHex = hex.length === 3
        ? hex.split('').map(c => c + c).join('')
        : hex;

      // Convertir a RGB
      const r = parseInt(fullHex.substring(0, 2), 16);
      const g = parseInt(fullHex.substring(2, 4), 16);
      const b = parseInt(fullHex.substring(4, 6), 16);

      return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
    }

    // Por defecto negro
    return [0, 0, 0];
  }

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

    return { unsubscribePatients, unsubscribeTriage, intervalId };
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
    const canCreate = ['admin', 'doctor', 'nurse'].includes(role);
    const canProcess = ['admin', 'doctor', 'nurse'].includes(role);

    root.innerHTML = `
      <div class="module-triage">
        <!-- Header -->
        <div class="card">
          <div class="flex justify-between items-center">
            <div>
              <h2>Triage de Urgencias</h2>
              <p class="text-muted">Sistema de priorización de pacientes en emergencias</p>
            </div>
            ${canCreate ? `
            <button class="btn btn-primary" id="btn-new-triage">
              <span>+</span> Nuevo Triage
            </button>
            ` : ''}
          </div>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-4" id="stats-container">
          <!-- Se llenará dinámicamente -->
        </div>

        <!-- Panel de control -->
        <div class="grid grid-2">
          <!-- Niveles de triage -->
          <div class="card">
            <h3>Niveles de Triage</h3>
            <div class="triage-levels" id="triage-levels">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>

          <!-- Acciones rápidas -->
          <div class="card">
            <h3>Acciones Rápidas</h3>
            <div class="quick-actions">
              ${canProcess ? `
              <button class="btn btn-danger" id="btn-emergency-alert">
                ⚠️ Alerta de Emergencia
              </button>
              ` : ''}
              <button class="btn btn-outline" id="btn-export-pdf">
                📊 Exportar Reporte
              </button>
              ${canProcess ? `
              <button class="btn btn-outline" id="btn-next-patient">
                ⏭️ Siguiente Paciente
              </button>
              ` : ''}
              ${role === 'admin' ? `
                <button class="btn btn-outline" id="btn-clear-completed">
                  🧹 Limpiar Completados
                </button>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Filtros y búsqueda -->
        <div class="card">
          <div class="flex justify-between items-center mb-4">
            <h3 style="margin: 0;">Pacientes en Espera</h3>
            <div class="flex gap-2">
              <div class="input-group">
                <input type="text" class="input" id="filter-search" placeholder="Buscar paciente..." value="${state.filters.search}">
                <button class="btn btn-outline" id="btn-search">🔍</button>
              </div>
            </div>
          </div>
          
          <div class="grid grid-4">
            <div class="form-group">
              <label class="form-label">Filtrar por estado</label>
              <select class="input" id="filter-status">
                <option value="all" ${state.filters.status === 'all' ? 'selected' : ''}>Todos los estados</option>
                <option value="waiting" ${state.filters.status === 'waiting' ? 'selected' : ''}>Esperando</option>
                <option value="in_progress" ${state.filters.status === 'in_progress' ? 'selected' : ''}>En atención</option>
                <option value="completed" ${state.filters.status === 'completed' ? 'selected' : ''}>Atendido</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Filtrar por prioridad</label>
              <select class="input" id="filter-priority">
                <option value="all" ${state.filters.priority === 'all' ? 'selected' : ''}>Todas las prioridades</option>
                ${Object.entries(TRIAGE_LEVELS).map(([key, level]) => `
                  <option value="${key}" ${state.filters.priority === key ? 'selected' : ''}>${level.name}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Ordenar por</label>
              <select class="input" id="sort-by">
                <option value="priority" ${state.sortBy === 'priority' ? 'selected' : ''}>Prioridad</option>
                <option value="waitingTime" ${state.sortBy === 'waitingTime' ? 'selected' : ''}>Tiempo de espera</option>
                <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Nombre</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Acciones</label>
              <button class="btn btn-outline" id="btn-refresh" style="width: 100%;">
                🔄 Actualizar
              </button>
            </div>
          </div>
        </div>

        <!-- Contenido principal -->
        <div class="card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Prioridad</th>
                  <th>Paciente</th>
                  <th>Síntomas</th>
                  <th>Tiempo de espera</th>
                  <th>Estado</th>
                  <th>Vitales</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="triage-queue">
                <!-- Se llenará dinámicamente -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal para nuevo triage -->
        <div class="modal-overlay hidden" id="triage-modal">
          <div class="modal-content" style="max-width: 900px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
            <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
              <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL GENERAL</h2>
              <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">SISTEMA DE TRIAGE Y PRIORIZACIÓN</div>
              <button class="btn-close-modal" id="btn-close-modal" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
            </div>
            
            <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 70vh; overflow-y: auto;">
              <!-- Pestañas para elegir paciente existente o crear nuevo -->
              <div class="flex border-b mb-6" style="gap: 1rem; justify-content: center;">
                <button type="button" class="tab-btn ${!state.isCreatingPatient ? 'active' : ''}" id="tab-existing-patient" style="padding: 0.5rem 1.5rem; border-radius: 20px 20px 0 0; font-weight: 600; border: none; background: transparent; cursor: pointer;">
                  PACIENTE EXISTENTE
                </button>
                <button type="button" class="tab-btn ${state.isCreatingPatient ? 'active' : ''}" id="tab-new-patient" style="padding: 0.5rem 1.5rem; border-radius: 20px 20px 0 0; font-weight: 600; border: none; background: transparent; cursor: pointer;">
                  + NUEVO PACIENTE
                </button>
              </div>
              
              <!-- Formulario para paciente existente -->
              <div id="existing-patient-form" style="${state.isCreatingPatient ? 'display: none;' : ''}">
                <form id="triage-form">
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">SELECCIONAR PACIENTE *</label>
                    <div class="flex gap-2">
                      <select class="input" id="patient-select" required style="flex: 1;">
                        <option value="">Seleccione un paciente</option>
                      </select>
                      <button type="button" class="btn btn-outline" id="btn-switch-to-new">
                        + Nuevo
                      </button>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">SÍNTOMAS PRINCIPALES *</label>
                    <textarea class="input" id="symptoms" rows="3" required 
                              placeholder="Describa los síntomas..." 
                              oninput="window.triageModule?.updatePrioritySuggestion()"></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">OBSERVACIONES</label>
                    <textarea class="input" id="observations" rows="2" placeholder="Observaciones adicionales..."></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">SIGNOS VITALES</label>
                    <div class="grid grid-3">
                      <input type="text" class="input" id="blood-pressure" placeholder="PA (120/80)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" class="input" id="heart-rate" placeholder="FC (72)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" step="0.1" class="input" id="temperature" placeholder="T° (36.5)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" class="input" id="spo2" placeholder="SpO₂ (98)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" class="input" id="respiratory-rate" placeholder="FR (16)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" class="input" id="pain-level" min="0" max="10" placeholder="Dolor (0-10)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                    </div>
                  </div>
                  
                  <!-- Sugerencia de prioridad MEJORADA -->
                  <div class="form-group" id="priority-suggestion-container" style="display: none;">
                    <label class="form-label">
                      🎯 Sugerencia de Prioridad
                      <span id="suggestion-confidence" style="font-size: 0.75rem; color: var(--muted);"></span>
                    </label>
                    <div class="priority-suggestion" id="priority-suggestion">
                      <!-- Se llenará dinámicamente -->
                    </div>
                    <div class="text-xs text-muted mt-1" id="suggestion-reason">
                      <!-- Razón de la sugerencia -->
                    </div>
                    <div class="mt-2 text-xs text-muted">
                        Esta sugerencia es solo informativa. Seleccione manualmente el nivel de prioridad.
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">PRIORIDAD *</label>
                    <div style="display: flex; gap: 0.5rem; justify-content: space-between; margin-top: 0.5rem;">
                      ${Object.entries(TRIAGE_LEVELS).map(([key, level]) => `
                        <div class="priority-option compact" data-priority="${key}" 
                             style="flex: 1; border: 2px solid ${level.color}; background: ${level.lightColor}; border-radius: var(--radius); padding: 0.5rem; text-align: center; cursor: pointer; position: relative; min-width: 0;">
                          <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">${level.icon}</div>
                          <div style="font-size: 0.7rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${key.toUpperCase()}</div>
                          <div style="font-size: 0.65rem; color: var(--muted); margin-top: 0.1rem;">${level.time}</div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </form>
              </div>
              
              <!-- Formulario para nuevo paciente rápido -->
              <div id="new-patient-form" style="${state.isCreatingPatient ? '' : 'display: none;'}">
                <form id="quick-patient-form">
                  <!-- Pestañas internas para nuevo paciente -->
                  <div class="flex border-b mb-4" style="margin-top: 1rem;">
                    <button type="button" class="tab-btn-sm active" data-tab="quick-basic">
                      Datos Básicos
                    </button>
                    <button type="button" class="tab-btn-sm" data-tab="quick-contact">
                      Contacto
                    </button>
                    <button type="button" class="tab-btn-sm" data-tab="quick-medical">
                      Información Médica
                    </button>
                  </div>
                  
                  <!-- Pestaña: Datos Básicos -->
                  <div class="tab-pane-sm active" data-tab="quick-basic">
                    <div class="grid grid-2">
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOMBRE COMPLETO *</label>
                        <input type="text" class="input" id="quick-name" required>
                      </div>
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DNI/NIE *</label>
                        <input type="text" class="input" id="quick-dni" required>
                      </div>
                    </div>
                    
                    <div class="grid grid-3">
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA DE NACIMIENTO *</label>
                        <input type="date" class="input" id="quick-birthdate" required>
                      </div>
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">GÉNERO *</label>
                        <select class="input" id="quick-gender" required>
                          <option value="">Seleccionar</option>
                          <option value="M">Masculino</option>
                          <option value="F">Femenino</option>
                          <option value="O">Otro</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">TIPO DE SANGRE</label>
                        <select class="input" id="quick-blood-type">
                          <option value="">Desconocido</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Pestaña: Contacto -->
                  <div class="tab-pane-sm" data-tab="quick-contact">
                    <div class="grid grid-2">
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">TELÉFONO *</label>
                        <input type="tel" class="input" id="quick-phone" required>
                      </div>
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">EMAIL</label>
                        <input type="email" class="input" id="quick-email">
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">DIRECCIÓN</label>
                      <textarea class="input" id="quick-address" rows="2"></textarea>
                    </div>
                    
                    <div class="grid grid-2">
                      <div class="form-group">
                        <label class="form-label">Ciudad</label>
                        <input type="text" class="input" id="quick-city">
                      </div>
                      <div class="form-group">
                        <label class="form-label">Código postal</label>
                        <input type="text" class="input" id="quick-zip">
                      </div>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Contacto de emergencia</label>
                      <div class="grid grid-2">
                        <input type="text" class="input" id="quick-emergency-name" placeholder="Nombre">
                        <input type="tel" class="input" id="quick-emergency-phone" placeholder="Teléfono">
                      </div>
                      <textarea class="input mt-2" id="quick-emergency-relation" rows="1" 
                                placeholder="Parentesco/Relación"></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Seguro médico</label>
                      <div class="grid grid-2">
                        <input type="text" class="input" id="quick-insurance-company" placeholder="Compañía">
                        <input type="text" class="input" id="quick-insurance-number" placeholder="Número de póliza">
                      </div>
                    </div>
                  </div>
                  
                  <!-- Pestaña: Información Médica -->
                  <div class="tab-pane-sm" data-tab="quick-medical">
                    <div class="form-group">
                      <label class="form-label">Alergias conocidas</label>
                      <div id="quick-allergies-container">
                        <!-- Alergias se agregarán dinámicamente -->
                      </div>
                      <button type="button" class="btn btn-outline btn-sm mt-2" id="btn-quick-add-allergy">
                        + Agregar alergia
                      </button>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Enfermedades crónicas</label>
                      <textarea class="input" id="quick-chronic-diseases" rows="2" 
                                placeholder="Ej: Hipertensión, Diabetes, Asma..."></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Medicación habitual</label>
                      <textarea class="input" id="quick-regular-meds" rows="2" 
                                placeholder="Medicamentos que toma regularmente..."></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Cirugías previas</label>
                      <textarea class="input" id="quick-surgeries" rows="2" 
                                placeholder="Cirugías realizadas, fechas..."></textarea>
                    </div>
                    
                    <div class="form-group">
                      <label class="form-label">Observaciones médicas</label>
                      <textarea class="input" id="quick-medical-notes" rows="2" 
                                placeholder="Otras observaciones importantes..."></textarea>
                    </div>
                  </div>
                  
                  <div class="form-group mt-4">
                    <label class="form-label">Síntomas principales *</label>
                    <textarea class="input" id="quick-symptoms" rows="3" required 
                              placeholder="Describa los síntomas..."
                              oninput="window.triageModule?.updatePrioritySuggestion()"></textarea>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Signos vitales</label>
                    <div class="grid grid-3">
                      <input type="text" class="input" id="quick-bp" placeholder="PA (120/80)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" class="input" id="quick-hr" placeholder="FC (72)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" step="0.1" class="input" id="quick-temp" placeholder="T° (36.5)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" class="input" id="quick-spo2" placeholder="SpO₂ (98)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" class="input" id="quick-rr" placeholder="FR (16)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                      <input type="number" class="input" id="quick-pain" min="0" max="10" placeholder="Dolor (0-10)"
                             oninput="window.triageModule?.updatePrioritySuggestion()">
                    </div>
                  </div>
                  
                  <!-- Sugerencia de prioridad para nuevo paciente -->
                  <div class="form-group" id="quick-priority-suggestion-container" style="display: none;">
                    <label class="form-label">
                      🎯 Sugerencia de Prioridad
                      <span id="quick-suggestion-confidence" style="font-size: 0.75rem; color: var(--muted);"></span>
                    </label>
                    <div class="priority-suggestion" id="quick-priority-suggestion">
                      <!-- Se llenará dinámicamente -->
                    </div>
                    <div class="text-xs text-muted mt-1" id="quick-suggestion-reason">
                      <!-- Razón de la sugerencia -->
                    </div>
                    <div class="mt-2 text-xs text-muted">
                        Esta sugerencia es solo informativa. Seleccione manualmente el nivel de prioridad.
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">Prioridad *</label>
                    <div style="display: flex; gap: 0.5rem; justify-content: space-between; margin-top: 0.5rem;">
                      ${Object.entries(TRIAGE_LEVELS).map(([key, level]) => `
                        <div class="priority-option quick compact" data-priority="${key}" 
                             style="flex: 1; border: 2px solid ${level.color}; background: ${level.lightColor}; border-radius: var(--radius); padding: 0.5rem; text-align: center; cursor: pointer; position: relative; min-width: 0;">
                          <div style="font-size: 1.25rem; margin-bottom: 0.25rem;">${level.icon}</div>
                          <div style="font-size: 0.7rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${key.toUpperCase()}</div>
                          <div style="font-size: 0.65rem; color: var(--muted); margin-top: 0.1rem;">${level.time}</div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </form>
              </div>
            </div>
            
            <div class="modal-footer" style="background: var(--modal-header); padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
              ${state.isCreatingPatient ? `
                <button class="btn" id="btn-back-to-existing" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 0.75rem 1.5rem; font-weight: 600;">
                  ← VOLVER
                </button>
              ` : ''}
              <button class="btn" id="btn-cancel-triage" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
              <button class="btn" id="btn-save-triage" style="background: white; color: var(--modal-header); border: none; padding: 0.75rem 2rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                ${state.isCreatingPatient ? 'REGISTRAR PACIENTE Y TRIAGE' : 'GUARDAR TRIAGE'}
              </button>
            </div>
          </div>
        </div>

        <!-- Modal de alerta de emergencia -->
        <div class="modal-overlay hidden" id="emergency-modal">
          <div class="modal-content" style="max-width: 550px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.4);">
            <div class="modal-header" style="background: #e53e3e; flex-direction: column; align-items: center; padding: 2rem; position: relative;">
               <div style="font-size: 3rem; margin-bottom: 0.5rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">🚨</div>
               <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 800;">ALERTA DE EMERGENCIA</h2>
               <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; font-weight: 500;">SISTEMA DE NOTIFICACIÓN CRÍTICA</div>
               <button class="btn-close-modal" id="btn-close-emergency" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
            </div>
            
            <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 70vh; overflow-y: auto;">
              <div style="background: #fff5f5; border: 1px solid #feb2b2; color: #c53030; padding: 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; margin-bottom: 1.5rem; text-align: center;">
                ATENCIÓN: Esta acción notificará a todo el personal de guardia de forma inmediata.
              </div>
              
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" style="font-weight: 700; color: #4a5568; font-size: 0.85rem;">TIPO DE EMERGENCIA / CÓDIGO *</label>
                <select class="input" id="emergency-type" style="border-color: #feb2b2; background: #fffaf0; font-weight: 700; color: #c53030;">
                  <option value="code_blue">🔵 Código Azul - Paro cardiorrespiratorio</option>
                  <option value="code_red">🔴 Código Rojo - Incendio / Fuego</option>
                  <option value="code_black">⚫ Código Negro - Amenaza Violenta</option>
                  <option value="mass_casualty">⚠️ Múltiples Víctimas / Triaje Masivo</option>
                  <option value="evacuation">📢 Evacuación Inmediata</option>
                </select>
              </div>
              
              <div class="form-group" style="margin-bottom: 1rem;">
                <label class="form-label" style="font-weight: 700; color: #4a5568; font-size: 0.85rem;">UBICACIÓN EXACTA *</label>
                <input type="text" class="input" id="emergency-location" required 
                       placeholder="Ej: Quirófano 2, Pasillo Ala Norte, Piso 3" style="border-color: #e2e8f0;">
              </div>
              
              <div class="form-group">
                <label class="form-label" style="font-weight: 700; color: #4a5568; font-size: 0.85rem;">DESCRIPCIÓN DE LA SITUACIÓN</label>
                <textarea class="input" id="emergency-description" rows="3" 
                          placeholder="Indique detalles relevantes para el equipo de respuesta..." style="border-color: #e2e8f0;"></textarea>
              </div>
            </div>
            
            <div class="modal-footer" style="background: #f7fafc; padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #edf2f7;">
              <button class="btn" id="btn-cancel-emergency" style="background: white; color: #4a5568; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; font-weight: 600;">CANCELAR</button>
              <button class="btn" id="btn-activate-emergency" style="background: #e53e3e; color: white; border: none; padding: 0.75rem 2rem; font-weight: 800; border-radius: 4px; box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);">
                ACTIVAR ALERTA AHORA
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Guardar referencias a elementos importantes
    elements = {
      statsContainer: root.querySelector('#stats-container'),
      triageLevels: root.querySelector('#triage-levels'),
      contentContainer: root.querySelector('#triage-queue'),

      // Filtros
      filterSearch: root.querySelector('#filter-search'),
      filterStatus: root.querySelector('#filter-status'),
      filterPriority: root.querySelector('#filter-priority'),
      sortBy: root.querySelector('#sort-by'),
      btnSearch: root.querySelector('#btn-search'),
      btnRefresh: root.querySelector('#btn-refresh'),

      // Botones principales
      btnNewTriage: root.querySelector('#btn-new-triage'),
      btnEmergencyAlert: root.querySelector('#btn-emergency-alert'),
      btnExportPdf: root.querySelector('#btn-export-pdf'),
      btnNextPatient: root.querySelector('#btn-next-patient'),
      btnClearCompleted: root.querySelector('#btn-clear-completed'),

      // Modales
      triageModal: root.querySelector('#triage-modal'),
      emergencyModal: root.querySelector('#emergency-modal'),

      // Elementos del modal de triage
      tabExistingPatient: root.querySelector('#tab-existing-patient'),
      tabNewPatient: root.querySelector('#tab-new-patient'),
      existingPatientForm: root.querySelector('#existing-patient-form'),
      newPatientForm: root.querySelector('#new-patient-form'),
      btnSwitchToNew: root.querySelector('#btn-switch-to-new'),
      btnBackToExisting: root.querySelector('#btn-back-to-existing'),

      // Formulario paciente existente
      patientSelect: root.querySelector('#patient-select'),
      symptoms: root.querySelector('#symptoms'),
      observations: root.querySelector('#observations'),
      bloodPressure: root.querySelector('#blood-pressure'),
      heartRate: root.querySelector('#heart-rate'),
      temperature: root.querySelector('#temperature'),
      spo2: root.querySelector('#spo2'),
      respiratoryRate: root.querySelector('#respiratory-rate'),
      painLevel: root.querySelector('#pain-level'),

      // Formulario paciente nuevo
      quickName: root.querySelector('#quick-name'),
      quickDni: root.querySelector('#quick-dni'),
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
      quickAllergiesContainer: root.querySelector('#quick-allergies-container'),
      quickChronicDiseases: root.querySelector('#quick-chronic-diseases'),
      quickRegularMeds: root.querySelector('#quick-regular-meds'),
      quickSurgeries: root.querySelector('#quick-surgeries'),
      quickMedicalNotes: root.querySelector('#quick-medical-notes'),
      quickSymptoms: root.querySelector('#quick-symptoms'),
      quickBp: root.querySelector('#quick-bp'),
      quickHr: root.querySelector('#quick-hr'),
      quickTemp: root.querySelector('#quick-temp'),
      quickSpo2: root.querySelector('#quick-spo2'),
      quickRr: root.querySelector('#quick-rr'),
      quickPain: root.querySelector('#quick-pain'),
      btnQuickAddAllergy: root.querySelector('#btn-quick-add-allergy'),

      // Sugerencias de prioridad
      prioritySuggestionContainer: root.querySelector('#priority-suggestion-container'),
      prioritySuggestion: root.querySelector('#priority-suggestion'),
      suggestionReason: root.querySelector('#suggestion-reason'),
      suggestionConfidence: root.querySelector('#suggestion-confidence'),
      quickPrioritySuggestionContainer: root.querySelector('#quick-priority-suggestion-container'),
      quickPrioritySuggestion: root.querySelector('#quick-priority-suggestion'),
      quickSuggestionReason: root.querySelector('#quick-suggestion-reason'),
      quickSuggestionConfidence: root.querySelector('#quick-suggestion-confidence')
    };

    // Inicializar datos
    loadData();
    setupEventListeners();
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
        badge.innerHTML = '🎯';
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
      <div class="card">
        <div class="text-muted text-sm">Total en espera</div>
        <div class="text-2xl font-bold" style="color: var(--warning);">${state.stats.waiting || 0}</div>
        <div class="text-xs text-muted mt-1">de ${state.stats.total || 0} pacientes</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">En atención</div>
        <div class="text-2xl font-bold" style="color: var(--info);">${state.stats.in_progress || 0}</div>
        <div class="text-xs text-muted mt-1">Pacientes activos</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Tiempo promedio</div>
        <div class="text-2xl font-bold" style="color: var(--accent);">${state.stats.averageWaitingTime || 0}m</div>
        <div class="text-xs text-muted mt-1">de espera</div>
      </div>
      
      <div class="card">
        <div class="text-muted text-sm">Máximo esperando</div>
        <div class="text-2xl font-bold" style="color: var(--danger);">${state.stats.maxWaitingTime || 0}m</div>
        <div class="text-xs text-muted mt-1">Tiempo crítico</div>
      </div>
    `;
  }

  // Renderizar niveles de triage
  function renderTriageLevels() {
    if (!elements.triageLevels) return;

    elements.triageLevels.innerHTML = Object.entries(TRIAGE_LEVELS).map(([key, level]) => `
      <div class="triage-level" style="border-left: 4px solid ${level.color}; background: ${level.lightColor};">
        <div class="flex justify-between items-center">
          <div>
            <div style="font-weight: 600;">${level.icon} ${level.name}</div>
            <div style="font-size: 0.875rem; color: var(--muted);">${level.description}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 600; font-size: 1.25rem;" class="priority-count" data-priority="${key}">
              ${state.stats.byPriority?.[key] || 0}
            </div>
            <div style="font-size: 0.75rem; color: var(--muted);">pacientes</div>
          </div>
        </div>
        <div class="flex justify-between items-center mt-2" style="font-size: 0.875rem;">
          <span style="color: var(--muted);">Tiempo objetivo:</span>
          <span style="font-weight: 500;">${level.time}</span>
        </div>
        <div style="font-size: 0.7rem; color: var(--muted); margin-top: 0.25rem; line-height: 1.2;">
          ${level.criteria.slice(0, 2).join(', ')}...
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
          <td colspan="7">
            <div class="text-center" style="padding: 3rem;">
              <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">🏥</div>
              <h3>No hay pacientes en triage</h3>
              <p class="text-muted">No hay pacientes en la cola de urgencias con los filtros aplicados</p>
              <button class="btn btn-primary mt-3" id="btn-add-first-triage">
                Registrar primer paciente
              </button>
            </div>
          </td>
        </tr>
      `;

      // Configurar evento para el botón
      const btn = root.querySelector('#btn-add-first-triage');
      if (btn) {
        btn.addEventListener('click', openNewTriageModal);
      }

      return;
    }

    elements.contentContainer.innerHTML = state.filteredPatients.map(patient => {
      const triageLevel = TRIAGE_LEVELS[patient.priority];

      // Determinar clase de estado
      let statusClass = 'badge-secondary';
      let statusText = 'Esperando';

      if (patient.status === 'in_progress') {
        statusClass = 'badge-info';
        statusText = 'En atención';
      } else if (patient.status === 'completed') {
        statusClass = 'badge-success';
        statusText = 'Atendido';
      }

      // Formatear signos vitales
      const vitalSigns = patient.vitalSigns ? `
        <div style="font-size: 0.875rem;">
          <div>PA: ${patient.vitalSigns.bloodPressure || 'N/A'}</div>
          <div>FC: ${patient.vitalSigns.heartRate || 'N/A'} lpm</div>
        </div>
      ` : 'No registrados';

      return `
        <tr>
          <td data-label="Prioridad">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 12px; height: 12px; background: ${triageLevel.color}; border-radius: 50%;"></div>
              <span style="font-weight: 500;">${triageLevel.icon} ${patient.priority.toUpperCase()}</span>
            </div>
          </td>
          <td data-label="Paciente">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 40px; height: 40px; background: ${triageLevel.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 500;">
                ${patient.fullName.charAt(0)}
              </div>
              <div>
                <div style="font-weight: 500;">${patient.fullName}</div>
                <div style="font-size: 0.75rem; color: var(--muted);">
                  ${patient.age} años • ${patient.gender === 'M' ? '♂' : patient.gender === 'F' ? '♀' : '⚧'}
                </div>
              </div>
            </div>
          </td>
          <td data-label="Síntomas">
            <div>${patient.symptoms?.substring(0, 50) || 'No especificado'}${patient.symptoms?.length > 50 ? '...' : ''}</div>
          </td>
          <td data-label="Espera">
            <div style="font-weight: 500; ${patient.waitingTime > 7200000 ? 'color: var(--danger);' : ''}">
              ${patient.waitingTimeFormatted}
            </div>
            <div style="font-size: 0.75rem; color: var(--muted);">
              ${new Date(patient.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </td>
          <td data-label="Estado">
            <span class="badge ${statusClass}">${statusText}</span>
          </td>
          <td data-label="Signos">${vitalSigns}</td>
          <td data-label="Acciones">
            <div class="flex gap-2">
              ${patient.status === 'waiting' ? `
                <button class="btn btn-outline btn-sm" data-action="start" data-id="${patient.id}">
                  Iniciar
                </button>
              ` : patient.status === 'in_progress' ? `
                <button class="btn btn-outline btn-sm" data-action="complete" data-id="${patient.id}">
                  Completar
                </button>
              ` : ''}
              <button class="btn btn-outline btn-sm" data-action="view" data-id="${patient.id}">
                Ver
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Filtros
    if (elements.filterStatus) {
      elements.filterStatus.addEventListener('change', () => {
        state.filters.status = elements.filterStatus.value;
        applyFilters();
        renderContent();
      });
    }

    if (elements.filterPriority) {
      elements.filterPriority.addEventListener('change', () => {
        state.filters.priority = elements.filterPriority.value;
        applyFilters();
        renderContent();
      });
    }

    if (elements.sortBy) {
      elements.sortBy.addEventListener('change', () => {
        state.sortBy = elements.sortBy.value;
        applyFilters();
        renderContent();
      });
    }

    if (elements.filterSearch) {
      elements.filterSearch.addEventListener('input', debounce(() => {
        state.filters.search = elements.filterSearch.value;
        applyFilters();
        renderContent();
      }, 300));
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
            ${patient.name} (${patient.dni || 'Sin DNI'}) - ${calculateAge(patient.birthDate)} años
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
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    const patient = store.find('patients', patientSelect.value);
    if (!patient) {
      alert('Paciente no encontrado');
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
    if (!elements.quickName?.value || !elements.quickDni?.value ||
      !elements.quickBirthdate?.value || !elements.quickGender?.value ||
      !elements.quickPhone?.value) {
      alert('Por favor complete los datos básicos requeridos del paciente');
      return;
    }

    if (!elements.quickSymptoms?.value || !state.selectedPriority) {
      alert('Por favor complete los síntomas y seleccione una prioridad');
      return;
    }

    // Verificar si el DNI ya existe
    const existingPatient = store.get('patients').find(p => p.dni === elements.quickDni.value.toUpperCase());
    if (existingPatient) {
      if (confirm(`Ya existe un paciente con DNI ${elements.quickDni.value}. ¿Desea usar el paciente existente?`)) {
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
        name: elements.quickName.value,
        dni: elements.quickDni.value.toUpperCase(),
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
    if (!confirm(`¿Iniciar atención de ${triageRecord.fullName}?`)) return;

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
    if (!confirm(`¿Marcar como completada la atención de ${triageRecord.fullName}?`)) return;

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

  // Ver detalles de triage (FUNCIÓN COMPLETA)
  function viewTriageDetails(triageRecord) {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-triage-modal';
    modalContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    `;

    const triageLevel = TRIAGE_LEVELS[triageRecord.priority];

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 850px; background: var(--modal-bg); border: none; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="modal-header" style="background: var(--modal-header); flex-direction: column; align-items: center; padding: 1.5rem; position: relative;">
          <h2 style="margin: 0; color: white; letter-spacing: 0.1em; font-size: 1.5rem; font-weight: 700;">HOSPITAL GENERAL</h2>
          <div style="color: rgba(255,255,255,0.9); font-size: 0.85rem; margin-top: 0.25rem; letter-spacing: 0.05em; font-weight: 500;">INFORME DE CLASIFICACIÓN DE TRIAGE</div>
          <button class="btn-close-modal" id="close-view-triage-btn" style="position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">×</button>
        </div>
        
        <div class="modal-body" style="background: white; margin: 1.5rem; border-radius: 8px; padding: 2rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 70vh; overflow-y: auto;">
          <!-- Encabezado de Clasificación -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1.5rem;">
              <div style="width: 70px; height: 70px; background: ${triageLevel.color}; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; box-shadow: 0 4px 10px ${triageLevel.color}44;">
                ${triageLevel.icon}
              </div>
              <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: #666; letter-spacing: 0.05em;"> NIVEL DE PRIORIDAD</div>
                <h3 style="margin: 0; color: ${triageLevel.color}; font-size: 1.75rem; font-weight: 800;">${triageLevel.name}</h3>
                <div style="font-size: 0.85rem; color: #888; margin-top: 0.25rem;">Tiempo objetivo: ${triageLevel.time}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; font-weight: 700; color: #666;">FECHA DE REGISTRO</div>
              <div style="font-size: 1.1rem; font-weight: 700;">${new Date(triageRecord.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              <div style="font-size: 0.9rem; color: #555;">${new Date(triageRecord.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          <!-- Información del Paciente -->
          <div style="background: var(--card-patient); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; border-left: 5px solid rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
              <div style="width: 45px; height: 45px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">👤</div>
              <div>
                <div style="font-size: 0.7rem; font-weight: 700; color: var(--modal-text-muted);">DATOS DEL PACIENTE</div>
                <div style="font-weight: 700; font-size: 1.25rem; color: var(--modal-text);">${triageRecord.fullName}</div>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; font-size: 0.85rem;">
              <div>
                <div style="font-weight: 700; color: var(--modal-text-muted); font-size: 0.7rem;">EDAD</div>
                <div style="font-weight: 600;">${triageRecord.age} años</div>
              </div>
              <div>
                <div style="font-weight: 700; color: var(--modal-text-muted); font-size: 0.7rem;">GÉNERO</div>
                <div style="font-weight: 600;">${triageRecord.gender === 'M' ? 'Masculino' : triageRecord.gender === 'F' ? 'Femenino' : 'Otro'}</div>
              </div>
              <div>
                <div style="font-weight: 700; color: var(--modal-text-muted); font-size: 0.7rem;">SANGRE</div>
                <div style="font-weight: 600;">${triageRecord.bloodType || 'N/A'}</div>
              </div>
              <div>
                <div style="font-weight: 700; color: var(--modal-text-muted); font-size: 0.7rem;">ESTADO</div>
                <div>
                   <span class="badge ${triageRecord.status === 'waiting' ? 'badge-secondary' : triageRecord.status === 'in_progress' ? 'badge-info' : 'badge-success'}" style="font-size: 0.7rem; padding: 2px 8px;">
                     ${triageRecord.status === 'waiting' ? 'En Espera' : triageRecord.status === 'in_progress' ? 'Atendiendo' : 'Completado'}
                   </span>
                </div>
              </div>
            </div>
            
            ${triageRecord.allergies && triageRecord.allergies.length > 0 ? `
              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dotted rgba(0,0,0,0.1);">
                <div style="font-weight: 700; color: #e53e3e; font-size: 0.7rem;">ALERGIAS</div>
                <div style="font-weight: 600; color: #e53e3e;">${triageRecord.allergies.join(', ')}</div>
              </div>
            ` : ''}
          </div>

          <!-- Cuadro Clínico -->
          <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--modal-section-gold); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                📋 SÍNTOMAS Y MOTIVO
              </div>
              <div style="background: var(--modal-section-gold-light); border: 1px solid var(--modal-section-gold); border-radius: 6px; padding: 1.25rem;">
                <div style="font-size: 0.95rem; line-height: 1.6; color: #444;">${triageRecord.symptoms || 'No especificado'}</div>
                ${triageRecord.observations ? `
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(184, 134, 11, 0.2);">
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--modal-highlight); margin-bottom: 0.5rem;">OBSERVACIONES MÉDICAS</div>
                    <div style="font-size: 0.9rem; font-style: italic;">${triageRecord.observations}</div>
                  </div>
                ` : ''}
              </div>
            </div>

            <div>
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--modal-section-forest); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                💓 SIGNOS VITALES
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 1rem;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  ${triageRecord.vitalSigns?.bloodPressure ? `
                    <div>
                      <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">TENSIÓN ART.</div>
                      <div style="font-weight: 700; font-family: monospace;">${triageRecord.vitalSigns.bloodPressure}</div>
                    </div>
                  ` : ''}
                  ${triageRecord.vitalSigns?.heartRate ? `
                    <div>
                      <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">FRECUENCIA C.</div>
                      <div style="font-weight: 700; font-family: monospace;">${triageRecord.vitalSigns.heartRate} LPM</div>
                    </div>
                  ` : ''}
                  ${triageRecord.vitalSigns?.temperature ? `
                    <div>
                      <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">TEMPERATURA</div>
                      <div style="font-weight: 700; font-family: monospace;">${triageRecord.vitalSigns.temperature} °C</div>
                    </div>
                  ` : ''}
                  ${triageRecord.vitalSigns?.spo2 ? `
                    <div>
                      <div style="font-size: 0.7rem; color: #64748b; font-weight: 700;">SAT. O₂</div>
                      <div style="font-weight: 700; font-family: monospace;">${triageRecord.vitalSigns.spo2} %</div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>

          <!-- Auditoría -->
          <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; display: flex; justify-content: space-between; font-size: 0.75rem; color: #999;">
            <div>
              <div style="font-weight: 700; color: #666;">REALIZADO POR</div>
              <div style="font-weight: 500;">${triageRecord.triagedByName || 'Personal de Urgencias'}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; color: #666;">TIEMPO EN ESPERA</div>
              <div style="font-weight: 600; color: #4a5568;">${triageRecord.waitingTimeFormatted}</div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer" style="background: var(--modal-header); padding: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem; border: none;">
          <button class="btn" id="close-view-triage-btn-2" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.75rem 1.5rem; font-weight: 600;">CERRAR</button>
          
          ${triageRecord.status === 'waiting' ? `
            <button class="btn" id="btn-start-from-view" data-id="${triageRecord.id}" style="background: white; color: var(--modal-header); border: none; padding: 0.75rem 2rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
              INICIAR ATENCIÓN
            </button>
          ` : triageRecord.status === 'in_progress' ? `
            <button class="btn" id="btn-complete-from-view" data-id="${triageRecord.id}" style="background: var(--modal-section-forest); color: white; border: none; padding: 0.75rem 2rem; font-weight: 700;">
              COMPLETAR ATENCIÓN
            </button>
          ` : ''}
        </div>
      </div>
    `;

    // Agregar al DOM
    document.body.appendChild(modalContainer);

    // Configurar event listeners
    const closeModal = () => modalContainer.remove();

    const closeBtn1 = modalContainer.querySelector('#close-view-triage-btn');
    const closeBtn2 = modalContainer.querySelector('#close-view-triage-btn-2');
    const startBtn = modalContainer.querySelector('#btn-start-from-view');
    const completeBtn = modalContainer.querySelector('#btn-complete-from-view');

    if (closeBtn1) closeBtn1.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        closeModal();
        startTriage(triageRecord);
      });
    }

    if (completeBtn) {
      completeBtn.addEventListener('click', () => {
        closeModal();
        completeTriage(triageRecord);
      });
    }

    // Cerrar al hacer clic fuera o con ESC
    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
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
      'code_blue': { title: '🚨 CÓDIGO AZUL', color: '#3182ce' },
      'code_red': { title: '🔥 CÓDIGO ROJO', color: '#e53e3e' },
      'code_black': { title: '⚫ CÓDIGO NEGRO', color: '#000000' },
      'mass_casualty': { title: '🆘 MÚLTIPLES VÍCTIMAS', color: '#d69e2e' },
      'evacuation': { title: '🚨 EVACUACIÓN', color: '#38a169' }
    };

    const alertInfo = alertTypes[type] || { title: '⚠️ EMERGENCIA', color: '#e53e3e' };

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
    `;

    alertDiv.innerHTML = `
      ${alertInfo.title} - ${location}
      <button onclick="this.parentElement.remove()" 
              style="position: absolute; right: 1rem; background: transparent; border: 1px solid white; color: white; border-radius: 50%; width: 30px; height: 30px;">
        ×
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
  // FUNCIÓN MEJORADA: Generar PDF formal para hospital - VERSIÓN CORREGIDA
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
      doc.text('HOSPITAL CENTRAL', pageWidth / 2, margin, { align: 'center' });

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
        `Fecha de generación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
        `Generado por: ${user.name} (${user.role || 'Personal médico'})`,
        `Período: Últimas 24 horas`,
        `Hospital: Hospital Central - Servicio de Urgencias`
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
        ['Pacientes totales', `${state.stats.total || 0}`, 'Todos los casos'],
        ['En espera', `${state.stats.waiting || 0}`, 'Pendientes de atención'],
        ['En atención', `${state.stats.in_progress || 0}`, 'Actualmente siendo atendidos'],
        ['Atendidos', `${state.stats.completed || 0}`, 'Finalizados'],
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
        doc.text(`${percentage}%`, margin + 142, yPos);

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

            const genderSymbol = patient.gender === 'M' ? '♂' : patient.gender === 'F' ? '♀' : '⚧';
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
        recommendations.push(`• Alto volumen de pacientes en espera (${state.stats.waiting}). Considere activar personal adicional.`);
      }

      if (state.stats.maxWaitingTime > 120) {
        recommendations.push(`• Paciente(s) con espera crítica (>${state.stats.maxWaitingTime} min). Revisión inmediata requerida.`);
      }

      if (state.stats.byPriority?.red > 0) {
        recommendations.push(`• ${state.stats.byPriority.red} paciente(s) en nivel ROJO. Atención inmediata obligatoria.`);
      }

      if (state.stats.byPriority?.orange > 3) {
        recommendations.push(`• ${state.stats.byPriority.orange} paciente(s) en nivel NARANJA. Atención prioritaria recomendada.`);
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
        '• Este reporte es un documento oficial del Hospital Central.',
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
      doc.text('Documento generado automáticamente por el Sistema de Triage del Hospital Central',
        pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
      doc.text('Válido como documentación interna del servicio de urgencias',
        pageWidth / 2, yPos, { align: 'center' });
      yPos += 4;
      doc.text(`ID de reporte: TRI-${Date.now().toString().slice(-8)}`,
        pageWidth / 2, yPos, { align: 'center' });

      // --- PIE DE PÁGINA EN TODAS LAS PÁGINAS ---
      const totalPages = doc.internal.getNumberOfPages();

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Número de página
        doc.setFontSize(8);
        doc.setTextColor(102, 102, 102);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 10, 290, { align: 'right' });

        // Sello del hospital
        doc.setFontSize(6);
        doc.text('HOSPITAL CENTRAL - CONFIDENCIAL', margin, 290);

        // Fecha en pie de página
        const now = new Date();
        const formattedDate = now.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        doc.text(`Generado: ${formattedDate}`, pageWidth / 2, 290, { align: 'center' });
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

    report += `Fecha de generación: ${now.toLocaleDateString('es-ES')} ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}\n`;
    report += `Generado por: ${user.name}\n`;
    report += `Hospital: Hospital Central - Servicio de Urgencias\n`;
    report += '-'.repeat(80) + '\n\n';

    report += 'RESUMEN ESTADÍSTICO:\n';
    report += '-'.repeat(40) + '\n';
    report += `Total de pacientes: ${state.stats.total || 0}\n`;
    report += `En espera: ${state.stats.waiting || 0}\n`;
    report += `En atención: ${state.stats.in_progress || 0}\n`;
    report += `Atendidos: ${state.stats.completed || 0}\n`;
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
        report += `${patient.waitingTimeFormatted}\n`;
      });
      report += '\n';
    }

    report += 'ANÁLISIS Y RECOMENDACIONES:\n';
    report += '-'.repeat(40) + '\n';

    if (state.stats.waiting > 10) {
      report += `• Alto volumen de pacientes en espera (${state.stats.waiting}). Considere activar personal adicional.\n`;
    }
    if (state.stats.maxWaitingTime > 120) {
      report += `• Paciente(s) con espera crítica (>${state.stats.maxWaitingTime} min). Revisión inmediata requerida.\n`;
    }
    if (state.stats.byPriority?.red > 0) {
      report += `• ${state.stats.byPriority.red} paciente(s) en nivel ROJO. Atención inmediata obligatoria.\n`;
    }

    report += '\n';
    report += 'FIRMA Y VALIDACIÓN:\n';
    report += '-'.repeat(40) + '\n';
    report += 'Documento generado automáticamente por el Sistema de Triage\n';
    report += 'Válido como documentación interna del servicio de urgencias\n';
    report += `ID de reporte: TRI-${Date.now().toString().slice(-8)}\n\n`;

    report += '='.repeat(80) + '\n';
    report += 'HOSPITAL CENTRAL - CONFIDENCIAL\n';
    report += 'Documento oficial del servicio de urgencias\n';
    report += '='.repeat(80) + '\n';

    return report;
  }

  // Generar reporte en texto plano (fallback)
  function generateTextReport() {
    let report = 'REPORTE DE TRIAGE - HOSPITAL CENTRAL\n';
    report += '='.repeat(50) + '\n\n';
    report += `Generado por: ${user.name}\n`;
    report += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n`;

    report += 'ESTADÍSTICAS:\n';
    report += `- Total en espera: ${state.stats.waiting || 0}\n`;
    report += `- En atención: ${state.stats.in_progress || 0}\n`;
    report += `- Atendidos: ${state.stats.completed || 0}\n`;
    report += `- Tiempo promedio: ${state.stats.averageWaitingTime || 0} min\n`;
    report += `- Tiempo máximo: ${state.stats.maxWaitingTime || 0} min\n\n`;

    report += 'DISTRIBUCIÓN POR PRIORIDAD:\n';
    Object.entries(state.stats.byPriority || {}).forEach(([priority, count]) => {
      const level = TRIAGE_LEVELS[priority];
      if (level) {
        report += `- ${level.name}: ${count}\n`;
      }
    });
    report += '\n';

    if (state.filteredPatients && state.filteredPatients.length > 0) {
      report += 'PACIENTES EN TRIAGE:\n';
      report += '-'.repeat(80) + '\n';

      state.filteredPatients.forEach(patient => {
        report += `\nNombre: ${patient.fullName}\n`;
        report += `Prioridad: ${patient.priority.toUpperCase()}\n`;
        report += `Síntomas: ${patient.symptoms || 'N/A'}\n`;
        report += `Tiempo de espera: ${patient.waitingTimeFormatted}\n`;
        report += `Estado: ${patient.status === 'waiting' ? 'Esperando' :
          patient.status === 'in_progress' ? 'En atención' : 'Atendido'}\n`;
        report += '-'.repeat(40) + '\n';
      });
    }

    report += '\n\n--- FIN DEL REPORTE ---\n';
    report += 'Hospital Central - Sistema de Triage\n';

    return report;
  }

  // Siguiente paciente
  function nextPatient() {
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
      alert('No hay pacientes esperando atención');
      return;
    }

    if (confirm(`¿Atender a ${nextPatient.fullName} (${TRIAGE_LEVELS[nextPatient.priority].name})?`)) {
      startTriage(nextPatient);
    }
  }

  // Limpiar completados
  async function clearCompleted() {
    if (!confirm('¿Eliminar todos los registros de triage completados? Esta acción no se puede deshacer.')) {
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
      background: ${type === 'success' ? '#38a169' :
        type === 'error' ? '#e53e3e' :
          type === 'warning' ? '#d69e2e' : '#3182ce'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
  const { unsubscribePatients, unsubscribeTriage, intervalId } = init();

  // Exponer funciones globales
  window.triageModule = {
    updatePrioritySuggestion: updatePrioritySuggestion,
    applySuggestion: applySuggestion
  };

  return {
    refresh: loadData,

    destroy() {
      if (unsubscribePatients) unsubscribePatients();
      if (unsubscribeTriage) unsubscribeTriage();
      if (intervalId) clearInterval(intervalId);

      // Remover banner de emergencia si existe
      const emergencyBanner = document.querySelector('#emergency-banner');
      if (emergencyBanner) emergencyBanner.remove();

      // Limpiar referencia global
      delete window.triageModule;
    }
  };
}