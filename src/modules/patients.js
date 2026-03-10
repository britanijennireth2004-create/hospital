import { Logger } from '../utils/logger.js';

/**
 * Módulo de Gestión de Pacientes - CRUD Completo
 */

// SVG iconos ejecutivos con currentColor para heredar color del texto
const icons = {
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="2.25" y="3.75" width="15.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6 1.75v3.5M14 1.75v3.5"/><path stroke="currentColor" stroke-width="1.5" stroke-linecap="round" d="M2 7.5h16"/></svg>`,
  clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="4.25" y="3.75" width="11.5" height="14" rx="2.25" stroke="currentColor" stroke-width="1.5"/><rect x="6.75" y="2" width="6.5" height="3.5" rx="1.25" stroke="currentColor" stroke-width="1.5"/></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,
  doctor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="6" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3.5 18c0-3.037 2.486-5.5 6.5-5.5s6.5 2.463 6.5 5.5"/></svg>`,
  patient: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3.75 17A6.25 6.25 0 0116.25 17"/></svg>`,
  area: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" fill="none" viewBox="0 0 20 20"><rect x="2.25" y="4.25" width="15.5" height="10.5" rx="1.75" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6.5 15.75V17a1.5 1.5 0 001.5 1.5h4a1.5 1.5 0 001.5-1.5v-1.25"/></svg>`,
  successCheck: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M6 10.5l2.5 2 5-5"/></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M10 3v8"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2"/><path stroke="currentColor" stroke-width="2" d="M10 7v5"/><circle cx="10" cy="14" r="1" fill="currentColor"/></svg>`,
  edit: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M14.5 2.5l3 3L6 17H3v-3L14.5 2.5z"/></svg>`,
  cancel: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M7 7l6 6M13 7l-6 6"/></svg>`,
  view: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M2 10s2.5-6 8-6 8 6 8 6-2.5 6-8 6-8-6-8-6z"/></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M10 4v6l3 3"/></svg>`,
  plus: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M4 10h12M10 4v12"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M5 5l10 10M15 5L5 15"/></svg>`,
  conflict: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M10 6v5"/><circle cx="10" cy="13" r="1" fill="currentColor"/></svg>`,
  clinical: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="3.25" y="2.75" width="13.5" height="14.5" rx="1.75" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6.5 6h7M6.5 10h7M6.5 14h4"/></svg>`,
  male: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M16 4l-4 4M16 4h-3M16 4v3"/></svg>`,
  female: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M10 11v7M7 15h6"/></svg>`,
  allergy: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="6" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="6" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="14" r="2" stroke="currentColor" stroke-width="1.5"/><circle cx="14" cy="14" r="2" stroke="currentColor" stroke-width="1.5"/></svg>`,
  medication: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="5" y="3" width="10" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M8 9h4M8 13h2"/></svg>`,
  surgery: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M3 17L17 3M5 7l8 8M7 5l8 8M3 13l4-4M13 3l4 4"/></svg>`,
  address: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M10 2.5L3 7v9a1.5 1.5 0 001.5 1.5h11A1.5 1.5 0 0017 16V7l-7-4.5z"/><circle cx="10" cy="11" r="2" stroke="currentColor" stroke-width="1.5"/></svg>`,
  phone: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="5" y="2" width="10" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="15" r="1" fill="currentColor"/></svg>`,
  email: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="4" width="15" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M3 5l7 6 7-6"/></svg>`,
  emergency: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><polygon points="10,2 2,16 18,16" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="12" r="1" fill="currentColor"/><path stroke="currentColor" stroke-width="1.5" d="M10 7v3"/></svg>`,
  insurance: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="3" y="5" width="14" height="11" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M6 8h8M6 11h8M6 14h5"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="6" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M13 13l4 4"/></svg>`,
  filter: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="2" rx="1" fill="currentColor"/><rect x="5" y="9" width="10" height="2" rx="1" fill="currentColor"/><rect x="7" y="14" width="6" height="2" rx="1" fill="currentColor"/></svg>`,
  sort: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M6 7l4-4 4 4M14 13l-4 4-4-4"/></svg>`,
  arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M12 4L6 10l6 6"/></svg>`,
  arrowRight: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M8 4l6 6-6 6"/></svg>`,
  cardView: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11.5" y="2.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="2.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/><rect x="11.5" y="11.5" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/></svg>`,
  listView: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="3" y="4" width="14" height="2" rx="1" fill="currentColor"/><rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor"/><rect x="3" y="14" width="14" height="2" rx="1" fill="currentColor"/></svg>`,
  vitalSigns: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M2 13l4-4 3 3 5-6 4 5"/></svg>`,
  diagnosis: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path stroke="currentColor" stroke-width="1.5" d="M7 10h6M10 7v6"/></svg>`,
  treatment: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" viewBox="0 0 20 20" fill="none"><path stroke="currentColor" stroke-width="1.5" d="M16 4l-2 2-2-2-2 2-2-2-2 2-2-2-2 2v8a2 2 0 002 2h10a2 2 0 002-2V4z"/></svg>`
};

export default function mountPatients(root, { bus, store, user, role }) {
  const state = {
    patients: [],
    clinicalRecords: [],
    appointments: [],
    editingId: null,
    showModal: false,
    viewMode: 'list',
    filters: {
      search: ''
    },
    sortBy: 'name',
    currentPage: 1,
    itemsPerPage: 10,
    selectedPatient: null,
    showClinicalHistory: false,
    filteredPatients: [],
    paginatedPatients: [],
    totalPages: 0
  };

  // Elementos DOM
  let elements = {};

  // Inicializar
  function init() {
    render();
    setupEventListeners();
    loadData();

    const unsubscribe = store.subscribe('patients', () => {
      loadData();
    });

    return {
      destroy: () => {
        unsubscribe();
      }
    };
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Cargar datos
  function loadData() {
    state.patients = store.get('patients') || [];
    state.clinicalRecords = store.get('clinicalRecords') || [];
    state.appointments = store.get('appointments') || [];

    applyFilters();
    renderContent();
    renderStats();
  }

  // Aplicar filtros
  function applyFilters() {
    let filteredPatients = state.patients;

    if (state.filters.search) {
      const searchTerm = state.filters.search.toLowerCase();
      filteredPatients = filteredPatients.filter(patient => {
        const genderMap = { 'M': 'masculino', 'F': 'femenino', 'O': 'otro' };
        const statusMap = { 'active': 'activo', 'inactive': 'inactivo' };

        const searchFields = [
          patient.name,
          patient.dni,
          patient.email,
          patient.phone,
          genderMap[patient.gender],
          patient.isActive ? 'activo' : 'inactivo',
          patient.bloodType,
          patient.city,
          patient.address
        ].filter(Boolean).join(' ').toLowerCase();

        return searchFields.includes(searchTerm);
      });
    }

    filteredPatients.sort((a, b) => {
      switch (state.sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'age': return calculateAge(b.birthDate) - calculateAge(a.birthDate);
        case 'recent': return new Date(b.createdAt) - new Date(a.createdAt);
        default: return 0;
      }
    });

    state.filteredPatients = filteredPatients;
    updatePagination();
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

  // Actualizar paginación
  function updatePagination() {
    const totalPages = Math.ceil(state.filteredPatients.length / state.itemsPerPage);
    state.totalPages = totalPages;

    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    state.paginatedPatients = state.filteredPatients.slice(start, end);
  }

  // Renderizar componente principal
  function render() {
    const canEdit = ['admin', 'doctor', 'receptionist'].includes(role);

    root.innerHTML = `
      <div class="module-patients">
      <!-- Estadísticas -->
        <div class="stats-auto-grid mb-4" id="stats-container"></div>
        <div class="card" style="padding: 0.75rem 1rem;">
          <div class="flex justify-between items-center">
            ${canEdit ? `
              <button class="btn btn-primary" id="btn-new-patient">
                ${icons.plus} Nuevo Paciente
              </button>
            ` : '<div></div>'}
            <div class="search-input-wrapper" style="position: relative; width: 450px;">
              <span style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--muted); opacity: 0.7;">
                ${icons.search}
              </span>
              <input type="text" class="input" id="filter-search" 
                     placeholder="Buscar por nombre, cédula, teléfono, género, estado..." 
                     style="padding-left: 2.8rem; border-radius: 20px; background: rgba(0,0,0,0.05); border: 1px solid transparent; transition: all 0.3s; height: 40px; width: 100%;"
                     value="${state.filters.search}">
            </div>
          </div>
        </div>

        
          
          <div class="flex justify-between mt-3 items-center">
            <div class="flex gap-2 items-center">
              
              <div class="flex items-center gap-2 ml-2" style="border-left: 1px solid var(--border); padding-left: 1rem;">
                <label class="text-xs font-bold text-muted" style="text-transform: uppercase;">${icons.sort} Ordenar:</label>
                <select class="input" id="sort-by" style="padding: 0.25rem 2rem 0.25rem 0.75rem; font-size: 0.8rem; width: auto; height: 32px;">
                  <option value="name" ${state.sortBy === 'name' ? 'selected' : ''}>Nombre</option>
                  <option value="age" ${state.sortBy === 'age' ? 'selected' : ''}>Edad</option>
                  <option value="recent" ${state.sortBy === 'recent' ? 'selected' : ''}>Más recientes</option>
                </select>
              </div>
            </div>
            <div class="text-sm text-muted" id="filter-count">
              Mostrando 0 de 0 pacientes
            </div>
          </div>

        <!-- Contenido principal -->
        <div id="content-container"></div>

        <!-- Paginación -->
        <div class="card hidden" id="pagination-container" style="padding: 1rem;">
          <div class="flex justify-between items-center">
            <div class="text-sm text-muted" id="page-info">
              Página 1 de 1
            </div>
            <div class="flex gap-1" id="pagination-controls"></div>
          </div>
        </div>

        <!-- Modal para nuevo / editar paciente -->
        <div class="modal-overlay ${state.showModal ? '' : 'hidden'}" id="patient-modal">
          <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h3>
                <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">
                  ${state.editingId ? 'EDICIÓN DE FICHA DE PACIENTE' : 'REGISTRO DE NUEVO PACIENTE'}
                </div>
              </div>
              <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-modal">&times;</button>
            </div>
            
            <div class="modal-body" style="padding: 2rem; overflow-y: auto; max-height: 70vh;">
              <form id="patient-form">
                
                <!-- Contenido de secciones -->
                <div id="tab-content">
                  <!-- Sección 1: Datos Básicos -->
                  <div class="form-section">
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef; margin-bottom: 20px;">
                      <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: var(--neutralPrimary); display: flex; align-items: center; gap: 8px;">
                        ${icons.user} DATOS IDENTIFICATIVOS
                      </h4>
                      <div class="grid grid-2 gap-4 mb-4">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NOMBRE COMPLETO *</label>
                          <input type="text" class="input" id="form-name" required style="height: 38px;">
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CÉDULA / C.I. *</label>
                          <div class="doc-group" style="display: flex; gap: 0;">
                            <select class="input" id="form-doc-type" required style="width: 70px; border-radius: 4px 0 0 4px; border-right: none; background: #fff; height: 38px;">
                              <option value="V">V</option>
                              <option value="E">E</option>
                              <option value="J">J</option>
                              <option value="P">P</option>
                            </select>
                            <input type="text" class="input" id="form-dni" required placeholder="Número de cédula" style="flex: 1; border-radius: 0 4px 4px 0; height: 38px;">
                          </div>
                        </div>
                      </div>
                      
                      <div class="grid grid-2 gap-4">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">LUGAR DE NACIMIENTO</label>
                          <input type="text" class="input" id="form-birthplace" placeholder="Ciudad, Estado/Provincia" style="height: 38px;">
                        </div>
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">NACIONALIDAD</label>
                          <input type="text" class="input" id="form-nationality" placeholder="Ej: Venezolana" style="height: 38px;">
                        </div>
                      </div>
                    </div>

                    <div style="background: #fffcf5; padding: 20px; border-radius: 8px; border: 1px solid #fff1c1; margin-bottom: 20px;">
                      <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #856404; display: flex; align-items: center; gap: 8px;">
                         ${icons.calendar} FECHAS Y ESTADO CIVIL
                      </h4>
                      <div class="grid grid-2 gap-4 mb-4">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">FECHA NACIMIENTO *</label>
                          <input type="date" class="input" id="form-birthdate" required style="height: 38px;">
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">VENCIMIENTO DEL CARNET</label>
                          <input type="date" class="input" id="form-carnet-expiry" style="height: 38px;" placeholder="Fecha de vencimiento">
                        </div>
                      </div>

                      <div class="grid grid-2 gap-4">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">GÉNERO *</label>
                          <select class="input" id="form-gender" required style="height: 38px;">
                            <option value="">Seleccionar</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="O">Otro</option>
                          </select>
                        </div>

                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO CIVIL</label>
                          <select class="input" id="form-civil-status" style="height: 38px;">
                            <option value="">Seleccionar</option>
                            <option value="Soltero/a">Soltero/a</option>
                            <option value="Casado/a">Casado/a</option>
                            <option value="Divorciado/a">Divorciado/a</option>
                            <option value="Viudo/a">Viudo/a</option>
                            <option value="Concubinato">Concubinato</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #c6f6d5; margin-bottom: 20px;">
                      <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 8px;">
                         ${icons.clinical} INFORMACIÓN CLÍNICA BÁSICA
                      </h4>
                      <div class="grid grid-2 gap-4">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">GRUPO SANGUÍNEO</label>
                          <select class="input" id="form-blood-type" style="height: 38px;">
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

                        <div class="form-group" style="display: flex; flex-direction: column; justify-content: flex-end;">
                          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; background: rgba(255,255,255,0.7); border: 1px solid #c6f6d5; border-radius: 4px; height: 38px;">
                            <input type="checkbox" id="form-consent" style="width: 18px; height: 18px;">
                            <span style="font-size: 0.85rem; font-weight: 600; color: var(--modal-section-forest);">CONSENTIMIENTO FIRMADO</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Sección 2: Historial Médico -->
                  <div class="form-section">
                    <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #856404; display: flex; align-items: center; gap: 8px; background: #fffcf5; padding: 12px; border-radius: 4px; border: 1px solid #fff1c1;">
                      ${icons.clinical} HISTORIAL MÉDICO
                    </h4>
                    <div class="form-group">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">${icons.allergy} ALERGIAS CONOCIDAS</label>
                      <div id="allergies-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;"></div>
                      <button type="button" class="btn" id="btn-add-allergy" style="background: var(--modal-section-gold); color: white; border: none; padding: 0.4rem 1rem; font-size: 0.8rem; border-radius: 4px; cursor: pointer;">
                        ${icons.plus} Agregar alergia
                      </button>
                    </div>
                    
                    <div class="form-group" style="margin-top: 1rem;">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">${icons.diagnosis} ENFERMEDADES CRÓNICAS</label>
                      <textarea class="input" id="form-chronic-diseases" rows="2" 
                                placeholder="Ej: Hipertensión, Diabetes, Asma..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-top: 1rem;">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">${icons.medication} MEDICACIÓN HABITUAL</label>
                      <textarea class="input" id="form-regular-meds" rows="2" 
                                placeholder="Medicamentos que toma regularmente..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
                    </div>

                    <div class="form-group" style="margin-top: 1rem;">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">${icons.surgery} CIRUGÍAS PREVIAS</label>
                      <textarea class="input" id="form-surgeries" rows="2" 
                                placeholder="Cirugías o intervenciones quirúrgicas previas..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
                    </div>
                    
                    <div class="form-group" style="margin-top: 1rem;">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">${icons.clinical} NOTAS MÉDICAS</label>
                      <textarea class="input" id="form-medical-notes" rows="3" 
                                placeholder="Observaciones médicas adicionales..." style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
                    </div>
                  </div>
                  
                  <!-- Sección 3: Contacto -->
                  <div class="form-section">
                    <h4 style="margin: 0 0 15px 0; font-size: 13px; font-weight: 700; color: #1e40af; display: flex; align-items: center; gap: 8px; background: #eff6ff; padding: 12px; border-radius: 4px; border: 1px solid #bfdbfe;">
                      ${icons.address} INFORMACIÓN DE CONTACTO Y OTROS
                    </h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">${icons.phone} TELÉFONO *</label>
                        <input type="tel" class="input" id="form-phone" required style="border-color: var(--neutralTertiary); background: var(--white);">
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">${icons.email} EMAIL</label>
                        <input type="email" class="input" id="form-email" style="border-color: var(--neutralTertiary); background: var(--white);">
                      </div>
                    </div>
                    
                    <div class="form-group" style="margin-top: 1rem;">
                      <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">${icons.address} DIRECCIÓN</label>
                      <textarea class="input" id="form-address" rows="2" style="border-color: var(--neutralTertiary); background: var(--white);"></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CIUDAD</label>
                        <input type="text" class="input" id="form-city" style="border-color: var(--neutralTertiary); background: var(--white);">
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">CÓDIGO POSTAL</label>
                        <input type="text" class="input" id="form-zip" style="border-color: var(--neutralTertiary); background: var(--white);">
                      </div>
                    </div>

                    <div style="background: #f8fafc; padding: 1rem; border-radius: 4px; margin-top: 1rem; border: 1px solid #e2e8f0;">
                      <div style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem; margin-bottom: 0.75rem;">${icons.emergency} CONTACTO DE EMERGENCIA</div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; color: #4a5568; font-size: 0.8rem;">Nombre</label>
                          <input type="text" class="input" id="form-emergency-name" style="border-color: var(--muted);">
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; color: #4a5568; font-size: 0.8rem;">Teléfono</label>
                          <input type="tel" class="input" id="form-emergency-phone" style="border-color: var(--muted);">
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; color: #4a5568; font-size: 0.8rem;">Parentesco</label>
                          <input type="text" class="input" id="form-emergency-relation" placeholder="Ej: Esposa, Hijo..." style="border-color: var(--muted);">
                        </div>
                      </div>
                    </div>

                    <div style="background: #f0fff4; padding: 1rem; border-radius: 4px; margin-top: 1rem; border: 1px solid #c6f6d5;">
                      <div style="font-weight: 700; color: var(--modal-section-forest); font-size: 0.85rem; margin-bottom: 0.75rem;">${icons.insurance} SEGURO MÉDICO</div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; color: #4a5568; font-size: 0.8rem;">Compañía</label>
                          <input type="text" class="input" id="form-insurance-company" placeholder="Ej: Sanitas, Adeslas..." style="border-color: var(--muted);">
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; color: #4a5568; font-size: 0.8rem;">Número de póliza</label>
                          <input type="text" class="input" id="form-insurance-number" style="border-color: var(--muted);">
                        </div>
                      </div>
                    </div>

                    <!-- Credenciales de Acceso -->
                    <div style="background: #eff6ff; padding: 1rem; border-radius: 4px; margin-top: 1rem; border: 1px solid #bfdbfe;">
                      <div style="font-weight: 700; color: #1e40af; font-size: 0.85rem; margin-bottom: 0.75rem;">${icons.settings || ''} CREDENCIALES DE ACCESO</div>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; color: #4a5568; font-size: 0.8rem;">Usuario (Email por defecto)</label>
                          <input type="text" class="input" id="form-username" placeholder="Nombre de usuario" style="border-color: var(--muted);">
                        </div>
                        
                        <div class="form-group">
                          <label class="form-label" style="font-weight: 600; color: #4a5568; font-size: 0.8rem;">Contraseña *</label>
                          <input type="password" class="input" id="form-password" placeholder="Mínimo 6 caracteres" style="border-color: var(--muted);">
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                ${state.editingId ? `
                  <div class="form-group mt-6" style="background: var(--modal-bg); padding: 1rem; border-radius: 4px;">
                    <label class="form-label" style="font-weight: 700; color: var(--modal-text); font-size: 0.85rem;">ESTADO DE LA FICHA</label>
                    <select class="input" id="form-status" style="border-color: var(--modal-border); background: white;">
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div>
                ` : ''}
              </form>
            </div>
            
            <div class="modal-footer">
              <button class="btn-circle btn-circle-cancel" id="btn-cancel" title="Cancelar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <button class="btn-circle btn-circle-save" id="btn-save" title="${state.editingId ? 'Actualizar Ficha' : 'Registrar Paciente'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Modal para historial clínico -->
      <div class="modal-overlay ${state.showClinicalHistory ? '' : 'hidden'}" id="clinical-history-modal">
        <div class="modal-content" style="max-width: 900px;">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h3>
              <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">HISTORIAL CLÍNICO: <span id="patient-history-name"></span></div>
            </div>
            <button class="close-modal btn-circle" style="background: rgba(255,255,255,0.2); border: none; color: white;" id="btn-close-history">&times;</button>
          </div>

          <div class="modal-body" id="clinical-history-content" style="padding: 2rem;"></div>

          <div class="modal-footer">
            <button class="btn-circle" id="btn-close-history-footer" title="Cerrar" style="background-color: #64748b;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </div>
      </div>
      `;

    // Guardar referencias
    elements = {
      statsContainer: root.querySelector('#stats-container'),
      contentContainer: root.querySelector('#content-container'),
      paginationContainer: root.querySelector('#pagination-container'),
      pageInfo: root.querySelector('#page-info'),
      paginationControls: root.querySelector('#pagination-controls'),
      filterCount: root.querySelector('#filter-count'),
      filterSearch: root.querySelector('#filter-search'),
      btnToggleView: root.querySelector('#btn-toggle-view'),
      sortBy: root.querySelector('#sort-by'),
      modal: root.querySelector('#patient-modal'),
      form: root.querySelector('#patient-form'),
      formName: root.querySelector('#form-name'),
      formDocType: root.querySelector('#form-doc-type'),
      formDni: root.querySelector('#form-dni'),
      formBirthdate: root.querySelector('#form-birthdate'),
      formGender: root.querySelector('#form-gender'),
      formBloodType: root.querySelector('#form-blood-type'),
      formBirthPlace: root.querySelector('#form-birthplace'),
      formNationality: root.querySelector('#form-nationality'),
      formCivilStatus: root.querySelector('#form-civil-status'),
      formCarnetExpiry: root.querySelector('#form-carnet-expiry'),
      formConsent: root.querySelector('#form-consent'),
      allergiesContainer: root.querySelector('#allergies-container'),
      formChronicDiseases: root.querySelector('#form-chronic-diseases'),
      formRegularMeds: root.querySelector('#form-regular-meds'),
      formSurgeries: root.querySelector('#form-surgeries'),
      formMedicalNotes: root.querySelector('#form-medical-notes'),
      formPhone: root.querySelector('#form-phone'),
      formEmail: root.querySelector('#form-email'),
      formAddress: root.querySelector('#form-address'),
      formCity: root.querySelector('#form-city'),
      formZip: root.querySelector('#form-zip'),
      formEmergencyName: root.querySelector('#form-emergency-name'),
      formEmergencyPhone: root.querySelector('#form-emergency-phone'),
      formEmergencyRelation: root.querySelector('#form-emergency-relation'),
      formInsuranceCompany: root.querySelector('#form-insurance-company'),
      formInsuranceNumber: root.querySelector('#form-insurance-number'),
      formStatus: root.querySelector('#form-status'),
      formUsername: root.querySelector('#form-username'),
      formPassword: root.querySelector('#form-password'),
      btnAddAllergy: root.querySelector('#btn-add-allergy'),
      btnCloseModal: root.querySelector('#btn-close-modal'),
      btnCancel: root.querySelector('#btn-cancel'),
      btnSave: root.querySelector('#btn-save'),
      btnNewPatient: root.querySelector('#btn-new-patient'),
      clinicalHistoryModal: root.querySelector('#clinical-history-modal'),
      clinicalHistoryContent: root.querySelector('#clinical-history-content'),
      patientHistoryName: root.querySelector('#patient-history-name'),
      btnCloseHistory: root.querySelector('#btn-close-history'),
      btnCloseHistoryFooter: root.querySelector('#btn-close-history-footer')
    };

    if (elements.allergiesContainer && elements.allergiesContainer.children.length === 0) {
      addAllergyField();
    }
  }

  // Renderizar contenido según modo de vista
  function renderContent() {
    if (!elements.contentContainer) return;

    if (state.filteredPatients.length === 0) {
      renderEmptyState();
      return;
    }

    if (state.viewMode === 'list') {
      renderListView();
    } else {
      renderCardsView();
    }

    renderPagination();
  }

  // Renderizar vista de lista
  function renderListView() {
    elements.contentContainer.innerHTML = `
      <div class="card" >
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>CÉDULA</th>
                <th>Edad</th>
                <th>Género</th>
                <th>Contacto</th>
                <th>Última visita</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="patients-list">
              ${state.paginatedPatients.map(patient => renderPatientRow(patient)).join('')}
            </tbody>
          </table>
        </div>
      </div>
      `;
  }

  // Renderizar fila de paciente - CON BOTÓN DE HISTORIAL
  function renderPatientRow(patient) {
    const age = calculateAge(patient.birthDate);
    const lastVisit = getLastVisit(patient.id);
    const clinicalCount = state.clinicalRecords.filter(cr => cr.patientId === patient.id).length;
    const appointmentCount = state.appointments.filter(apt => apt.patientId === patient.id).length;

    return `
      <tr>
        <td data-label="Paciente">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <div style="width: 32px; height: 32px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
              ${icons.user}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 0.85rem;">${patient.name}</div>
              <div style="font-size: 0.7rem; color: var(--muted); display: flex; gap: 0.4rem;">
                <span>${clinicalCount} reg.</span> • <span>${appointmentCount} citas</span>
              </div>
            </div>
          </div>
        </td>
        <td data-label="CÉDULA">${patient.docType || 'V'}-${patient.dni || '-'}</td>
        <td data-label="Edad">${age || '?'} años</td>
        <td data-label="Género">
          <span class="badge ${patient.gender === 'M' ? 'badge-info' : patient.gender === 'F' ? 'badge-warning' : 'badge-secondary'}">
            ${patient.gender === 'M' ? `${icons.male} Masculino` : patient.gender === 'F' ? `${icons.female} Femenino` : 'Otro'}
          </span>
        </td>
        <td data-label="Contacto">
          <div style="font-size: 0.8rem;">
            <div style="font-weight: 500;">${patient.phone || '-'}</div>
            <div class="text-muted" style="font-size: 0.7rem;">${patient.email || ''}</div>
          </div>
        </td>
        <td data-label="Última visita">
          ${lastVisit ? `
            <div style="font-size: 0.8rem;">
              <div style="font-weight: 500;">${lastVisit.toLocaleDateString('es-ES')}</div>
              <div class="text-muted" style="font-size: 0.7rem;">${lastVisit.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
            </div>
          ` : '<span class="text-muted" style="font-size: 0.75rem;">-</span>'}
        </td>
        <td data-label="Estado">
          <span class="badge ${patient.isActive ? 'badge-success' : 'badge-danger'}">
            ${patient.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </td>
        <td data-label="Acciones">
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="btn-circle btn-circle-status" data-action="view" data-id="${patient.id}" title="Ver Detalles">
              ${icons.view || ICONS.eye}
            </button>
            ${role === 'admin' || role === 'receptionist' ? `
              <button class="btn-circle btn-circle-cancel" data-action="status" data-id="${patient.id}" title="${patient.isActive ? 'Desactivar Paciente' : 'Activar Paciente'}">
                ${ICONS.sync}
              </button>
            ` : ''}
            ${role === 'admin' || role === 'doctor' || role === 'receptionist' ? `
              <button class="btn-circle btn-circle-edit" data-action="edit" data-id="${patient.id}" title="Modificar">
                ${icons.edit || ICONS.edit}
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
      `;
  }

  // Renderizar vista de tarjetas - CON BOTÓN DE HISTORIAL
  function renderCardsView() {
    elements.contentContainer.innerHTML = `
      <div class="grid grid-3" >
        ${state.paginatedPatients.map(patient => renderPatientCard(patient)).join('')}
      </div>
      `;

    state.paginatedPatients.forEach(patient => {
      const card = elements.contentContainer.querySelector(`.patient-card[data-id="${patient.id}"]`);
      if (card) {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.card-actions')) {
            viewPatientDetails(patient);
          }
        });
      }
    });
  }

  // Renderizar tarjeta de paciente - CON BOTÓN DE HISTORIAL
  function renderPatientCard(patient) {
    const age = calculateAge(patient.birthDate);
    const clinicalCount = state.clinicalRecords.filter(cr => cr.patientId === patient.id).length;
    const appointmentCount = state.appointments.filter(apt => apt.patientId === patient.id).length;
    const lastVisit = getLastVisit(patient.id);

    const genderColor = patient.gender === 'M' ? 'var(--info)' :
      patient.gender === 'F' ? 'var(--warning)' : 'var(--muted)';

    return `
      <div class="card patient-card" data-id="${patient.id}" style="cursor: pointer;">
        <div class="card-header" style="padding: 0; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="width: 60px; height: 60px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              ${icons.patient}
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 600; font-size: 1.125rem;">${patient.name}</div>
                <span class="text-xs text-muted font-bold" style="letter-spacing: 0.1em; opacity: 0.8;">CÉDULA / ID</span>
                <span style="font-weight: 700; color: var(--modal-text);">${patient.docType || 'V'}-${patient.dni || '0'}</span>
                •
                <span style="color: ${genderColor};">
                  ${patient.gender === 'M' ? icons.male : patient.gender === 'F' ? icons.female : '⚧'} 
                  ${age || '?'} años
                </span>
              </div>
            </div>
          </div>
        
        <div style="margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--muted); font-size: 0.875rem;">${icons.phone} Contacto:</span>
            <span style="font-weight: 500; font-size: 0.875rem;">${patient.phone || 'No especificado'}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--muted); font-size: 0.875rem;">Tipo de sangre:</span>
            <span style="font-weight: 500; font-size: 0.875rem;">${patient.bloodType || 'Desconocido'}</span>
          </div>
          
          ${patient.allergies && patient.allergies.length > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--muted); font-size: 0.875rem;">${icons.allergy} Alergias:</span>
              <span style="font-weight: 500; font-size: 0.875rem; color: var(--danger);">
                ${patient.allergies.length}
              </span>
            </div>
          ` : ''}
          
          ${lastVisit ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--muted); font-size: 0.875rem;">${icons.calendar} Última visita:</span>
              <span style="font-weight: 500; font-size: 0.875rem;">
                ${lastVisit.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ` : ''}
        </div>
        
        <div style="border-top: 1px solid var(--border); padding-top: 1rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">${icons.clinical} Registros</div>
              <div style="font-weight: 600; font-size: 1.25rem;">${clinicalCount}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">${icons.calendar} Citas</div>
              <div style="font-weight: 600; font-size: 1.25rem;">${appointmentCount}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--muted);">Estado</div>
              <div>
                <span class="badge ${patient.isActive ? 'badge-success' : 'badge-danger'}">
                  ${patient.isActive ? icons.successCheck : icons.cancel} ${patient.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          
          <div class="card-actions flex gap-2 justify-center" style="margin-top: 1rem;">
            <button class="btn-circle btn-circle-status" data-action="view" data-id="${patient.id}" title="Ver Detalles">
              ${icons.view || ICONS.eye}
            </button>
            ${role === 'admin' || role === 'receptionist' ? `
              <button class="btn-circle btn-circle-status" data-action="status" data-id="${patient.id}" title="${patient.isActive ? 'Desactivar' : 'Activar'}">
                ${ICONS.sync}
              </button>
            ` : ''}
            ${role === 'admin' || role === 'doctor' || role === 'receptionist' ? `
              <button class="btn-circle btn-circle-edit" data-action="edit" data-id="${patient.id}" title="Editar">
                ${icons.edit || ICONS.edit}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
      `;
  }

  // Renderizar estado vacío
  function renderEmptyState() {
    elements.contentContainer.innerHTML = `
      <div class="card">
        <div class="text-center" style="padding: 3rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">${icons.user}</div>
          <h3>No hay pacientes</h3>
          <p class="text-muted" style="margin-bottom: 1.5rem;">
            ${state.filters.search || state.filters.gender || state.filters.ageRange ?
        'No se encontraron pacientes con los filtros aplicados' :
        'No hay pacientes registrados en el sistema'}
          </p>
          ${role === 'admin' || role === 'doctor' ? `
            <button class="btn btn-primary" id="btn-create-first-patient">
              ${icons.plus} Registrar primer paciente
            </button>
          ` : ''}
        </div>
      </div>
      `;

    const btn = elements.contentContainer.querySelector('#btn-create-first-patient');
    if (btn) {
      btn.addEventListener('click', () => openModal());
    }

    elements.paginationContainer.classList.add('hidden');
    if (elements.filterCount) {
      elements.filterCount.textContent = `Mostrando 0 de 0 pacientes`;
    }
  }

  // Renderizar paginación
  function renderPagination() {
    const start = (state.currentPage - 1) * state.itemsPerPage + 1;
    const end = Math.min(state.currentPage * state.itemsPerPage, state.filteredPatients.length);
    const total = state.filteredPatients.length;

    if (elements.filterCount) {
      elements.filterCount.textContent = total > 0 ? `Mostrando ${start}-${end} de ${total} pacientes` : `Mostrando 0 de 0 pacientes`;
    }

    if (state.filteredPatients.length <= state.itemsPerPage && state.currentPage === 1) {
      elements.paginationContainer.classList.add('hidden');
      return;
    }

    elements.paginationContainer.classList.remove('hidden');

    if (elements.pageInfo) {
      elements.pageInfo.textContent = `Página ${state.currentPage} de ${state.totalPages}`;
    }

    let paginationHTML = '';

    paginationHTML += `
      <button class="btn btn-outline btn-sm ${state.currentPage === 1 ? 'disabled' : ''}" 
              id="btn-prev" ${state.currentPage === 1 ? 'disabled' : ''}>
        ${icons.arrowLeft}
      </button>
      `;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, state.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(state.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
      <button class="btn btn-outline btn-sm ${state.currentPage === i ? 'active' : ''}"
              data-page="${i}">${i}</button>
      `;
    }

    paginationHTML += `
      <button class="btn btn-outline btn-sm ${state.currentPage === state.totalPages ? 'disabled' : ''}"
    id="btn-next" ${state.currentPage === state.totalPages ? 'disabled' : ''}>
      ${icons.arrowRight}
      </button>
      `;

    if (elements.paginationControls) {
      elements.paginationControls.innerHTML = paginationHTML;
    }
  }

  // Renderizar estadísticas
  function renderStats() {
    if (!elements.statsContainer) return;

    const totalPatients = state.patients.length;
    const activePatients = state.patients.filter(p => p.isActive).length;
    const patientsWithAppointments = state.patients.filter(p =>
      state.appointments.some(apt => apt.patientId === p.id)
    ).length;
    const patientsWithRecords = state.patients.filter(p =>
      state.clinicalRecords.some(cr => cr.patientId === p.id)
    ).length;

    const genderCount = {
      M: state.patients.filter(p => p.gender === 'M').length,
      F: state.patients.filter(p => p.gender === 'F').length,
      O: state.patients.filter(p => p.gender === 'O').length
    };

    elements.statsContainer.innerHTML = `
      <div class="stat-info-card">
        <span class="stat-info-label">Total de pacientes</span>
        <span class="stat-info-value">${totalPatients}</span>
        <span class="stat-info-sub">${icons.user} ${activePatients} activos</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Con Citas</span>
        <span class="stat-info-value">${patientsWithAppointments}</span>
        <span class="stat-info-sub">${icons.calendar} ${patientsWithRecords} con historial</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Género Femenino</span>
        <span class="stat-info-value">${genderCount.F}</span>
        <span class="stat-info-sub">${icons.female} ${Math.round((genderCount.F / totalPatients) * 100) || 0}% del total</span>
      </div>
      
      <div class="stat-info-card">
        <span class="stat-info-label">Edad Promedio</span>
        <span class="stat-info-value">${calculateAverageAge()} años</span>
        <span class="stat-info-sub">${icons.clipboard} Población total</span>
      </div>
    `;
  }

  // Calcular edad promedio
  function calculateAverageAge() {
    const ages = state.patients
      .map(p => calculateAge(p.birthDate))
      .filter(age => age > 0);

    if (ages.length === 0) return 0;

    const average = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    return Math.round(average);
  }

  // Obtener última visita
  function getLastVisit(patientId) {
    const patientAppointments = state.appointments
      .filter(apt => apt.patientId === patientId && apt.status === 'completed')
      .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    if (patientAppointments.length === 0) return null;

    return new Date(patientAppointments[0].dateTime);
  }

  // Configurar event listeners
  function setupEventListeners() {
    // Búsqueda unificada
    if (elements.filterSearch) {
      elements.filterSearch.addEventListener('input', debounce((e) => {
        state.filters.search = e.target.value;
        state.currentPage = 1;
        applyFilters();
        renderContent();
        renderStats();
      }, 300));
    }

    // Ordenar
    if (elements.sortBy) {
      elements.sortBy.addEventListener('change', () => {
        state.sortBy = elements.sortBy.value;
        state.currentPage = 1;
        applyFilters();
        renderContent();
        renderStats();
      });
    }

    // Paginación (event delegation)
    if (elements.paginationContainer) {
      elements.paginationContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.id === 'btn-prev') {
          if (state.currentPage > 1) {
            state.currentPage--;
            updatePagination();
            renderContent();
          }
        } else if (btn.id === 'btn-next') {
          if (state.currentPage < state.totalPages) {
            state.currentPage++;
            updatePagination();
            renderContent();
          }
        } else if (btn.dataset.page) {
          state.currentPage = parseInt(btn.dataset.page);
          updatePagination();
          renderContent();
        }
      });
    }

    // Cambio de vista
    if (elements.btnToggleView) {
      elements.btnToggleView.addEventListener('click', toggleViewMode);
    }

    // Modal de paciente
    if (elements.btnNewPatient) {
      elements.btnNewPatient.addEventListener('click', () => openModal());
    }

    if (elements.btnCloseModal) {
      elements.btnCloseModal.addEventListener('click', closeModal);
    }

    if (elements.btnCancel) {
      elements.btnCancel.addEventListener('click', closeModal);
    }

    // --- Lógica de Precarga por Cédula (SAIME Simulation) ---
    function handleRegistryLookup() {
      if (state.editingId) return; // No precargar si estamos editando

      const docType = elements.formDocType?.value || 'V';
      const dni = elements.formDni?.value.trim();

      if (dni && dni.length >= 6) {
        // Indicador de carga sutil en el input
        if (elements.formDni) elements.formDni.style.opacity = '0.7';

        setTimeout(() => {
          const found = store.fetchFromRegistry(docType, dni);
          if (elements.formDni) elements.formDni.style.opacity = '1';

          if (found) {
            showNotification(`Datos encontrados para C.I. ${docType}-${dni}. Precargando...`, 'success');

            if (elements.formName) elements.formName.value = found.name;
            if (elements.formBirthdate) elements.formBirthdate.value = found.birthDate;
            if (elements.formBirthPlace) elements.formBirthPlace.value = found.birthPlace;
            if (elements.formNationality) elements.formNationality.value = found.nationality;
            if (elements.formGender) elements.formGender.value = found.gender;
            if (elements.formCivilStatus && found.civilStatus) elements.formCivilStatus.value = found.civilStatus;
            if (elements.formCarnetExpiry) elements.formCarnetExpiry.value = found.carnetExpiry;
            if (elements.formPhone && !elements.formPhone.value) elements.formPhone.value = found.phone || '';
            if (elements.formEmail && !elements.formEmail.value) elements.formEmail.value = found.email || '';

            // Efecto visual de resaltado
            const fields = [elements.formName, elements.formBirthdate, elements.formGender, elements.formCivilStatus, elements.formBirthPlace, elements.formNationality];
            fields.forEach(f => {
              if (f) {
                f.style.transition = 'background 0.5s';
                f.style.backgroundColor = '#f0fdf4';
                setTimeout(() => f.style.backgroundColor = '', 1500);
              }
            });
          }
        }, 700);
      }
    }

    elements.formDni?.addEventListener('input', debounce(handleRegistryLookup, 500));
    elements.formDocType?.addEventListener('change', handleRegistryLookup);

    if (elements.btnSave) {
      elements.btnSave.addEventListener('click', savePatient);
    }



    // Alergias
    if (elements.btnAddAllergy) {
      elements.btnAddAllergy.addEventListener('click', () => addAllergyField());
    }

    // Historial clínico
    if (elements.btnCloseHistory) {
      elements.btnCloseHistory.addEventListener('click', closeClinicalHistoryModal);
    }

    if (elements.btnCloseHistoryFooter) {
      elements.btnCloseHistoryFooter.addEventListener('click', closeClinicalHistoryModal);
    }

    // Acciones en la lista
    if (elements.contentContainer) {
      elements.contentContainer.addEventListener('click', handleContentAction);
    }
  }

  // Manejar acciones en el contenido
  function handleContentAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    event.stopPropagation();

    const action = button.dataset.action;
    const patientId = button.dataset.id;
    const patient = store.find('patients', patientId);

    switch (action) {
      case 'edit':
        editPatient(patient);
        break;
      case 'view':
        viewPatientDetails(patient);
        break;
      case 'history':
        viewClinicalHistory(patient);
        break;
      case 'status':
        if (role === 'admin' || role === 'receptionist') {
          togglePatientStatus(patient);
        }
        break;
    }
  }

  // Los antiguos manejadores de filtros han sido eliminados en la refactorización unificada.

  // Cambiar estado activo/inactivo de un paciente
  function togglePatientStatus(patient) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 440px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">CAMBIAR ESTADO</h3>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">${patient.name}</div>
          </div>
          <button class="close-modal btn-circle" id="close-status-modal-hdr" style="background: rgba(255,255,255,0.2); border: none; color: white;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${patient.isActive ? 'var(--success)' : 'var(--danger)'}"></div>
            <span style="font-weight: 600;">Estado actual: ${patient.isActive ? 'ACTIVO' : 'INACTIVO'}</span>
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">NUEVO ESTADO *</label>
            <select class="input" id="patient-status-select">
              <option value="active" ${patient.isActive ? '' : 'selected'}>Activo</option>
              <option value="inactive" ${patient.isActive ? 'selected' : ''}>Inactivo</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-circle" id="btn-cancel-patient-status" title="Cancelar" style="background-color: #64748b; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button class="btn-circle" id="btn-save-patient-status" title="Confirmar Cambio" style="background-color: var(--success); color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#close-status-modal-hdr').onclick = () => modal.remove();
    modal.querySelector('#btn-cancel-patient-status').onclick = () => modal.remove();
    modal.querySelector('#btn-save-patient-status').onclick = async () => {
      const newStatus = modal.querySelector('#patient-status-select').value;
      const isActive = newStatus === 'active';
      try {
        await store.update('patients', patient.id, { isActive, updatedAt: Date.now() });
        showNotification(`Paciente ${isActive ? 'activado' : 'desactivado'} correctamente`, 'success');
        modal.remove();
        applyFilters();
        renderContent();
        renderStats();
      } catch (e) {
        showNotification('Error al actualizar estado del paciente', 'error');
      }
    };
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }

  function toggleViewMode() {
    state.viewMode = state.viewMode === 'list' ? 'cards' : 'list';

    if (elements.btnToggleView) {
      elements.btnToggleView.innerHTML = state.viewMode === 'list'
        ? `${icons.cardView} Vista Tarjetas`
        : `${icons.listView} Vista Lista`;
    }

    renderContent();
  }



  // Agregar campo de alergia
  function addAllergyField(value = '', index = null) {
    if (!elements.allergiesContainer) return;

    const allergyIndex = index !== null ? index : elements.allergiesContainer.children.length;
    const allergyId = `allergy-${allergyIndex}`;

    const allergyDiv = document.createElement('div');
    allergyDiv.className = 'flex items-center gap-2 mb-2';
    allergyDiv.innerHTML = `
      <input type="text" class="input" id="${allergyId}"
             placeholder="Ej: Penicilina"
             value="${value}"
             style="flex: 1;">
      <select class="input" style="width: 120px;">
        <option value="mild">Leve</option>
        <option value="moderate">Moderada</option>
        <option value="severe" selected>Severa</option>
      </select>
      <button type="button" class="btn btn-outline btn-sm remove-allergy" 
              style="color: var(--danger);" data-index="${allergyIndex}">
        ${icons.close}
      </button>
    `;

    elements.allergiesContainer.appendChild(allergyDiv);

    const removeBtn = allergyDiv.querySelector('.remove-allergy');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        allergyDiv.remove();
      });
    }
  }

  // Abrir modal
  function openModal(patient = null) {
    state.editingId = patient?.id || null;
    state.showModal = true;

    if (elements.modal) {
      elements.modal.classList.remove('hidden');
    }

    if (patient) {
      populateForm(patient);
    } else {
      clearForm();
    }


  }

  // Cerrar modal
  function closeModal() {
    state.showModal = false;
    state.editingId = null;

    if (elements.modal) {
      elements.modal.classList.add('hidden');
    }

    clearForm();
  }

  // Rellenar formulario
  function populateForm(patient) {
    if (elements.formName) elements.formName.value = patient.name || '';
    if (elements.formDocType) elements.formDocType.value = patient.docType || 'V';
    if (elements.formDni) elements.formDni.value = patient.dni || '';
    if (elements.formBirthdate) elements.formBirthdate.value = patient.birthDate || '';
    if (elements.formGender) elements.formGender.value = patient.gender || '';
    if (elements.formBloodType) elements.formBloodType.value = patient.bloodType || '';
    if (elements.formBirthPlace) elements.formBirthPlace.value = patient.birthPlace || '';
    if (elements.formNationality) elements.formNationality.value = patient.nationality || '';
    if (elements.formCivilStatus) elements.formCivilStatus.value = patient.civilStatus || '';
    if (elements.formCarnetExpiry) elements.formCarnetExpiry.value = patient.carnetExpiry || '';
    if (elements.formConsent) elements.formConsent.checked = patient.consent?.granted || false;

    if (elements.allergiesContainer && patient.allergies) {
      elements.allergiesContainer.innerHTML = '';
      patient.allergies.forEach((allergy, index) => {
        if (typeof allergy === 'string') {
          addAllergyField(allergy, index);
        } else if (allergy.name) {
          addAllergyField(allergy.name, index);
        }
      });
    }

    if (elements.formChronicDiseases) elements.formChronicDiseases.value = patient.chronicDiseases || '';
    if (elements.formRegularMeds) elements.formRegularMeds.value = patient.regularMeds || '';
    if (elements.formSurgeries) elements.formSurgeries.value = patient.surgeries || '';
    if (elements.formMedicalNotes) elements.formMedicalNotes.value = patient.medicalNotes || '';

    if (elements.formPhone) elements.formPhone.value = patient.phone || '';
    if (elements.formEmail) elements.formEmail.value = patient.email || '';
    if (elements.formAddress) elements.formAddress.value = patient.address || '';
    if (elements.formCity) elements.formCity.value = patient.city || '';
    if (elements.formZip) elements.formZip.value = patient.zipCode || '';
    if (elements.formEmergencyName) elements.formEmergencyName.value = patient.emergencyContact?.name || '';
    if (elements.formEmergencyPhone) elements.formEmergencyPhone.value = patient.emergencyContact?.phone || '';
    if (elements.formEmergencyRelation) elements.formEmergencyRelation.value = patient.emergencyContact?.relation || '';
    if (elements.formInsuranceCompany) elements.formInsuranceCompany.value = patient.insurance?.company || '';
    if (elements.formInsuranceNumber) elements.formInsuranceNumber.value = patient.insurance?.policyNumber || '';

    if (elements.formStatus) elements.formStatus.value = patient.isActive ? 'active' : 'inactive';
  }

  // Limpiar formulario
  function clearForm() {
    if (elements.form) elements.form.reset();
    if (elements.allergiesContainer) {
      elements.allergiesContainer.innerHTML = '';
      addAllergyField();
    }
  }

  // Guardar paciente
  async function savePatient() {
    if (!await validateForm()) {
      return;
    }

    // Validar permisos: solo admin, doctor y receptionist pueden crear/editar pacientes
    const canSave = role === 'admin' || role === 'doctor' || role === 'receptionist';
    if (!canSave) {
      showNotification('No tienes permiso para realizar esta acción', 'error');
      return;
    }

    const formData = getFormData();

    try {
      if (state.editingId) {
        await store.update('patients', state.editingId, formData);
        Logger.log(store, user, {
          action: Logger.Actions.UPDATE,
          module: Logger.Modules.PATIENTS,
          description: `Paciente actualizado: ${formData.name} `,
          details: { patientId: state.editingId, ...formData }
        });
        showNotification('Paciente actualizado correctamente', 'success');
      } else {
        const result = await store.add('patients', formData);

        // Crear usuario asociado
        const username = (elements.formUsername && elements.formUsername.value) || formData.email.split('@')[0] || `paciente_${result.id.split('_').pop()} `;
        const password = (elements.formPassword && elements.formPassword.value) || 'demo123';

        store.add('users', {
          username,
          password,
          name: formData.name,
          role: 'patient',
          email: formData.email,
          patientId: result.id,
          isActive: true
        });

        Logger.log(store, user, {
          action: Logger.Actions.CREATE,
          module: Logger.Modules.PATIENTS,
          description: `Paciente creado con acceso: ${formData.name} `,
          details: { patientId: result.id, ...formData }
        });
        showNotification('Paciente y usuario creados correctamente', 'success');
      }

      closeModal();
      loadData();

    } catch (error) {
      console.error('Error guardando paciente:', error);
      showNotification('Error al guardar el paciente', 'error');
    }
  }

  // Validar formulario
  async function validateForm() {
    let isValid = true;
    window.hospitalFieldValidation.clearAll(elements.form);

    const requiredFields = [
      { field: elements.formName, label: 'Este campo es obligatorio' },
      { field: elements.formDni, label: 'Cédula requerida' },
      { field: elements.formBirthdate, label: 'Fecha requerida' },
      { field: elements.formGender, label: 'Debe seleccionar género' },
      { field: elements.formPhone, label: 'Teléfono requerido' }
    ];

    requiredFields.forEach(({ field, label }) => {
      if (field) {
        if (!field.value.trim()) {
          window.hospitalFieldValidation.show(field, label);
          isValid = false;
        }
      }
    });

    if (elements.formDni && elements.formDni.value.trim() && !/^\d+$/.test(elements.formDni.value.trim())) {
      window.hospitalFieldValidation.show(elements.formDni, 'Solo números permitidos');
      isValid = false;
    }

    if (elements.formBirthdate && elements.formBirthdate.value) {
      const birthDate = new Date(elements.formBirthdate.value);
      const today = new Date();
      if (birthDate > today) {
        window.hospitalFieldValidation.show(elements.formBirthdate, 'No puede ser fecha futura');
        isValid = false;
      }
    }

    if (!isValid) {
      const firstError = elements.form.querySelector('.error-field');
      if (firstError) firstError.focus();
    }

    return isValid;
  }

  // Validar DNI/NIE
  function validateDNI(dni) {
    if (!dni) return false;

    const dniRegex = /^[0-9]{8}[A-Za-z]$/;
    const nieRegex = /^[XYZ][0-9]{7}[A-Za-z]$/;

    return dniRegex.test(dni) || nieRegex.test(dni);
  }

  // Obtener datos del formulario
  function getFormData() {
    const allergies = [];
    if (elements.allergiesContainer) {
      const allergyInputs = elements.allergiesContainer.querySelectorAll('input[type="text"]');
      allergyInputs.forEach(input => {
        if (input.value.trim()) {
          allergies.push(input.value.trim());
        }
      });
    }

    return {
      name: elements.formName?.value.trim() || '',
      docType: elements.formDocType?.value || 'V',
      dni: elements.formDni?.value.trim() || '',
      birthDate: elements.formBirthdate?.value || '',
      gender: elements.formGender?.value || '',
      bloodType: elements.formBloodType?.value || null,
      birthPlace: elements.formBirthPlace?.value || '',
      nationality: elements.formNationality?.value || '',
      civilStatus: elements.formCivilStatus?.value || '',
      carnetExpiry: elements.formCarnetExpiry?.value || '',
      consent: {
        granted: elements.formConsent?.checked || false,
        date: elements.formConsent?.checked ? (state.editingId ? (store.find('patients', state.editingId)?.consent?.date || Date.now()) : Date.now()) : null,
        scope: 'Tratamiento de datos personales y sensibles según normativa vigente'
      },
      allergies: allergies,
      chronicDiseases: elements.formChronicDiseases?.value || '',
      regularMeds: elements.formRegularMeds?.value || '',
      surgeries: elements.formSurgeries?.value || '',
      medicalNotes: elements.formMedicalNotes?.value || '',
      phone: elements.formPhone?.value || '',
      email: elements.formEmail?.value || '',
      address: elements.formAddress?.value || '',
      city: elements.formCity?.value || '',
      zipCode: elements.formZip?.value || '',
      emergencyContact: {
        name: elements.formEmergencyName?.value || '',
        phone: elements.formEmergencyPhone?.value || '',
        relation: elements.formEmergencyRelation?.value || ''
      },
      insurance: {
        company: elements.formInsuranceCompany?.value || '',
        policyNumber: elements.formInsuranceNumber?.value || ''
      },
      isActive: elements.formStatus ? elements.formStatus.value === 'active' : true,
      createdAt: state.editingId ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Editar paciente
  function editPatient(patient) {
    openModal(patient);
  }

  // Ver detalles del paciente - VERSIÓN REDISEÑADA
  function viewPatientDetails(patient) {
    const clinicalRecords = state.clinicalRecords.filter(cr => cr.patientId === patient.id);
    const appointments = state.appointments.filter(apt => apt.patientId === patient.id);
    const age = calculateAge(patient.birthDate);

    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-patient-modal';
    modalContainer.className = 'modal-overlay';

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 900px;">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR</h3>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">
              EXPEDIENTE DIGITAL DEL PACIENTE
            </div>
          </div>
          <button class="close-modal btn-circle" id="close-view-patient-btn" style="background: rgba(255,255,255,0.2); border: none; color: white;">&times;</button>
        </div>
        
        <div class="modal-body" style="padding: 2rem;">
          
          <!-- ENCABEZADO DE PERFIL -->
          <div style="display: flex; align-items: center; gap: 2rem; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 2rem;">
            <div style="width: 100px; height: 100px; background: var(--themePrimary); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <div style="font-size: 0.8rem; font-weight: 700; color: var(--themePrimary); letter-spacing: 0.1em; margin-bottom: 0.5rem;">PACIENTE</div>
              <h3 style="margin: 0; font-size: 1.75rem; color: #1a202c; font-weight: 800;">${patient.name}</h3>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
                <span class="badge badge-info" style="font-size: 0.75rem; font-weight: 700;">
                  ${patient.docType || 'V'}-${patient.dni || 'N/A'}
                </span>
                <span style="color: #4a5568; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                   ${age} años
                </span>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                <span class="badge ${patient.isActive ? 'badge-success' : 'badge-danger'}" style="font-size: 0.75rem;">
                  ${patient.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <span class="badge badge-info" style="font-size: 0.75rem;">
                  HC: ${patient.id.split('_').pop()}
                </span>
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
            <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--themePrimary);">
              <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; margin-bottom: 1rem; letter-spacing: 0.05em;">INFORMACIÓN PERSONAL</div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">FECHA NACIMIENTO</div>
                  <div style="font-weight: 600; font-size: 0.95rem;">${patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('es-ES') : 'No registrada'}</div>
                </div>
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">NACIONALIDAD</div>
                  <div style="font-weight: 600;">${patient.nationality || 'Venezolana'}</div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">ESTADO CIVIL</div>
                  <div style="font-weight: 600;">${patient.civilStatus || 'No especificado'}</div>
                </div>
                <div>
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem;">GRUPO SANGUÍNEO</div>
                  <div style="font-weight: 600;">${patient.bloodType || 'Desconocido'}</div>
                </div>
              </div>

              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                <div style="font-weight: 700; color: #334155; font-size: 0.75rem; margin-bottom: 0.5rem;">CONTACTO</div>
                <div style="font-size: 0.85rem; color: #475569; display: flex; flex-direction: column; gap: 0.35rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    ${patient.phone || 'No registrado'}
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    ${patient.email || 'No registrado'}
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    ${patient.address || 'No registrada'}
                  </div>
                </div>
              </div>
            </div>

            <div style="background: #f0fdf4; border-radius: 8px; padding: 1.5rem; border-left: 4px solid var(--success);">
              <div style="font-size: 0.75rem; font-weight: 800; color: var(--success); margin-bottom: 1rem; letter-spacing: 0.05em;">INFORMACIÓN MÉDICA</div>
              
              <div style="margin-bottom: 1.5rem;">
                <div style="font-weight: 700; color: #334155; font-size: 0.75rem; margin-bottom: 0.5rem;">ALERGIAS</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${patient.allergies && patient.allergies.length > 0
        ? patient.allergies.map(allergy => `<span class="badge badge-danger" style="font-size: 0.75rem;">${allergy}</span>`).join('')
        : '<span style="color: #64748b; font-size: 0.85rem;">Sin alergias registradas</span>'}
                </div>
              </div>
              
              ${patient.chronicDiseases ? `
                <div style="margin-bottom: 1.5rem;">
                  <div style="font-weight: 700; color: #334155; font-size: 0.75rem; margin-bottom: 0.25rem;">ENFERMEDADES CRÓNICAS</div>
                  <div style="font-size: 0.9rem;">${patient.chronicDiseases}</div>
                </div>
              ` : ''}
              
              <div style="background: white; border-radius: 4px; padding: 1rem; margin-top: 1rem;">
                <div style="font-weight: 700; color: var(--success); font-size: 0.75rem; margin-bottom: 0.5rem;">SEGURO MÉDICO</div>
                ${patient.insurance?.company ? `
                  <div style="font-weight: 600; font-size: 0.95rem;">${patient.insurance.company}</div>
                  <div style="font-size: 0.8rem; color: #64748b;">Póliza: ${patient.insurance.policyNumber || 'N/A'}</div>
                ` : '<div style="font-size: 0.85rem; color: #64748b;">Particular / Sin seguro</div>'}
              </div>

              <div style="background: #fff5f5; border-radius: 4px; padding: 1rem; margin-top: 1rem;">
                <div style="font-weight: 700; color: #c53030; font-size: 0.75rem; margin-bottom: 0.5rem;">CONTACTO DE EMERGENCIA</div>
                ${patient.emergencyContact?.name ? `
                  <div style="font-weight: 600; font-size: 0.95rem;">${patient.emergencyContact.name}</div>
                  <div style="font-size: 0.8rem; color: #64748b;">${patient.emergencyContact.relation || ''} • ${patient.emergencyContact.phone || ''}</div>
                ` : '<div style="font-size: 0.85rem; color: #64748b;">No registrado</div>'}
              </div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2.5rem;">
            <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; text-align: center;">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">TOTAL CITAS</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--themePrimary);">${appointments.length}</div>
            </div>
            <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; text-align: center;">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">REGISTROS CLÍNICOS</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">${clinicalRecords.length}</div>
            </div>
            <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; text-align: center;">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">ÚLTIMA VISITA</div>
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--info);">
                ${getLastVisit(patient.id) ? getLastVisit(patient.id).toLocaleDateString() : 'Ninguna'}
              </div>
            </div>
            <div style="background: #f8fafc; border-radius: 8px; padding: 1rem; text-align: center;">
              <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.5rem;">ESTADO</div>
              <div style="font-size: 0.9rem; font-weight: 700; color: ${patient.isActive ? 'var(--success)' : 'var(--danger)'};">
                ${patient.isActive ? 'ACTIVO' : 'INACTIVO'}
              </div>
            </div>
          </div>

          <!-- PRÓXIMAS CITAS -->
          <div>
            <div style="font-size: 0.85rem; font-weight: 800; color: var(--themePrimary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              RESUMEN DE AGENDA
            </div>
            <div style="background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead style="background: #edf2f7;">
                  <tr style="text-align: left;">
                    <th style="padding: 0.75rem 1rem;">FECHA</th>
                    <th style="padding: 0.75rem 1rem;">ÁREA</th>
                    <th style="padding: 0.75rem 1rem;">ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  ${appointments.length > 0 ? appointments.slice(0, 3).map(app => {
          const area = store.find('areas', app.areaId);
          return `
                      <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 0.75rem 1rem;">${new Date(app.dateTime).toLocaleDateString()} ${new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style="padding: 0.75rem 1rem;">${area?.name || 'N/A'}</td>
                        <td style="padding: 0.75rem 1rem;"><span class="badge ${app.status === 'completed' ? 'badge-success' : 'badge-info'}" style="font-size: 0.7rem;">${app.status.toUpperCase()}</span></td>
                      </tr>
                    `;
        }).join('') : '<tr><td colspan="3" style="padding: 1.5rem; text-align: center; color: #64748b;">No hay citas registradas</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div style="display: flex; gap: 0.75rem;">
            ${role === 'admin' || role === 'doctor' || role === 'receptionist' ? `
              <button class="btn-circle btn-circle-edit" id="btn-edit-patient" data-id="${patient.id}" title="Editar Ficha">
                ${icons.edit}
              </button>
              <button class="btn-circle btn-circle-save" id="btn-new-appointment-for-patient" data-id="${patient.id}" title="Nueva Cita">
                ${icons.plus}
              </button>
            ` : ''}
            ${role === 'admin' || role === 'doctor' ? `
              <button class="btn-circle btn-circle-status" id="btn-view-clinical-history" data-id="${patient.id}" title="Historial Clínico">
                ${icons.clinical}
              </button>
            ` : ''}
          </div>
          <button class="btn-circle" id="close-view-patient-btn-2" title="Cerrar" style="background-color: #64748b;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const closeModal = () => modalContainer.remove();

    const closeBtn1 = modalContainer.querySelector('#close-view-patient-btn');
    const closeBtn2 = modalContainer.querySelector('#close-view-patient-btn-2');
    const editBtn = modalContainer.querySelector('#btn-edit-patient');
    const newAppointmentBtn = modalContainer.querySelector('#btn-new-appointment-for-patient');
    const clinicalHistoryBtn = modalContainer.querySelector('#btn-view-clinical-history');

    if (closeBtn1) closeBtn1.addEventListener('click', closeModal);
    if (closeBtn2) closeBtn2.addEventListener('click', closeModal);

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        closeModal();
        editPatient(patient);
      });
    }

    if (newAppointmentBtn) {
      newAppointmentBtn.addEventListener('click', () => {
        closeModal();
        createAppointmentForPatient(patient);
      });
    }

    if (clinicalHistoryBtn) {
      clinicalHistoryBtn.addEventListener('click', () => {
        closeModal();
        viewClinicalHistory(patient);
      });
    }

    modalContainer.addEventListener('click', (e) => {
      if (e.target === modalContainer) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    }, { once: true });
  }

  // Ver historial clínico completo
  function viewClinicalHistory(patient) {
    state.selectedPatient = patient;
    state.showClinicalHistory = true;

    if (elements.clinicalHistoryModal) {
      elements.clinicalHistoryModal.classList.remove('hidden');
    }

    if (elements.patientHistoryName) {
      elements.patientHistoryName.textContent = patient.name;
    }

    renderClinicalHistory();
  }

  // Cerrar historial clínico
  function closeClinicalHistoryModal() {
    state.showClinicalHistory = false;
    state.selectedPatient = null;

    if (elements.clinicalHistoryModal) {
      elements.clinicalHistoryModal.classList.add('hidden');
    }
  }

  // Renderizar historial clínico
  function renderClinicalHistory() {
    if (!elements.clinicalHistoryContent || !state.selectedPatient) return;

    const patientRecords = state.clinicalRecords
      .filter(cr => cr.patientId === state.selectedPatient.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (patientRecords.length === 0) {
      elements.clinicalHistoryContent.innerHTML = `
      <div class="text-center" style = "padding: 3rem;" >
          <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">${icons.clinical}</div>
          <h3>No hay historial clínico</h3>
          <p class="text-muted">Este paciente no tiene registros clínicos</p>
        </div>
      `;
      return;
    }

    elements.clinicalHistoryContent.innerHTML = `
      <div class="timeline" >
        ${patientRecords.map(record => {
      const doctor = store.find('doctors', record.doctorId);
      const date = new Date(record.date);

      return `
            <div class="timeline-item">
              <div class="timeline-date">
                ${icons.calendar} ${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                <span style="color: var(--muted);"> • ${icons.clock} ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div class="timeline-content">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                  <div>
                    <h4 style="margin: 0;">
                      ${record.type === 'consultation' ? `${icons.doctor} Consulta médica` :
          record.type === 'emergency' ? `${icons.emergency} Urgencia` :
            record.type === 'followup' ? `${icons.calendar} Control de seguimiento` :
              record.type === 'lab' ? `${icons.diagnosis} Resultados de laboratorio` : `${icons.medication} Prescripción médica`}
                    </h4>
                    <div style="font-size: 0.875rem; color: var(--muted);">
                      ${icons.doctor} ${doctor?.name || 'Médico no especificado'}
                    </div>
                  </div>
                  <span class="badge ${record.type === 'consultation' ? 'badge-info' :
          record.type === 'emergency' ? 'badge-danger' :
            record.type === 'followup' ? 'badge-success' : 'badge-warning'}">
                    ${record.type === 'consultation' ? 'Consulta' :
          record.type === 'emergency' ? 'Urgencia' :
            record.type === 'followup' ? 'Control' :
              record.type === 'lab' ? 'Laboratorio' : 'Prescripción'}
                  </span>
                </div>
                
                ${record.symptoms ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">${icons.diagnosis} Síntomas</div>
                    <div>${record.symptoms}</div>
                  </div>
                ` : ''}
                
                ${record.diagnosis ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">${icons.diagnosis} Diagnóstico</div>
                    <div>${record.diagnosis}</div>
                  </div>
                ` : ''}
                
                ${record.treatment ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">${icons.treatment} Tratamiento</div>
                    <div>${record.treatment}</div>
                  </div>
                ` : ''}
                
                ${record.prescriptions && record.prescriptions.length > 0 ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">${icons.medication} Medicamentos recetados</div>
                    <ul style="padding-left: 1.5rem; margin: 0;">
                      ${record.prescriptions.map(p => `
                        <li>${p.medication} - ${p.dosage} (${p.frequency}, ${p.duration})</li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                
                ${record.notes ? `
                  <div style="margin-bottom: 0.75rem;">
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">${icons.clinical} Notas</div>
                    <div>${record.notes}</div>
                  </div>
                ` : ''}
                
                ${record.vitalSigns ? `
                  <div>
                    <div style="font-weight: 500; color: var(--muted); font-size: 0.875rem;">${icons.vitalSigns} Signos vitales</div>
                    <div class="grid grid-3" style="font-size: 0.875rem;">
                      ${record.vitalSigns.bloodPressure ? `
                        <div>
                          <span style="color: var(--muted);">Presión:</span>
                          <span style="font-weight: 500;">${record.vitalSigns.bloodPressure}</span>
                        </div>
                      ` : ''}
                      ${record.vitalSigns.heartRate ? `
                        <div>
                          <span style="color: var(--muted);">Ritmo cardíaco:</span>
                          <span style="font-weight: 500;">${record.vitalSigns.heartRate} lpm</span>
                        </div>
                      ` : ''}
                      ${record.vitalSigns.temperature ? `
                        <div>
                          <span style="color: var(--muted);">Temperatura:</span>
                          <span style="font-weight: 500;">${record.vitalSigns.temperature}°C</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                ` : ''}
                
                <div style="border-top: 1px solid var(--border); margin-top: 1rem; padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-size: 0.75rem; color: var(--muted);">
                    ${icons.calendar} Registrado el ${new Date(record.createdAt).toLocaleDateString('es-ES')}
                  </div>
                  <button class="btn btn-outline btn-sm" onclick="window.viewFullRecord('${record.id}')">
                    ${icons.view} Ver completo
                  </button>
                </div>
              </div>
            </div>
          `;
    }).join('')
      }
      </div>
      `;
  }

  // ===== FUNCIONES AUXILIARES PARA EL MODAL DE HISTORIA CLÍNICA =====
  function _clinicalGetTypeText(type) {
    const types = { consultation: 'Consulta', followup: 'Seguimiento', emergency: 'Urgencia', lab: 'Laboratorio', prescription: 'Receta' };
    return types[type] || type;
  }

  function _clinicalCalculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function _clinicalDaysUntil(followUpDate) {
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffDays = Math.ceil((followUp - today) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return `En ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    if (diffDays === 0) return 'Hoy';
    return `Vencido hace ${Math.abs(diffDays)} días`;
  }

  // Ver registro clínico completo — mismo modal profesional que clinical.js
  function viewClinicalRecord(recordId) {
    const record = store.find('clinicalRecords', recordId);
    if (!record) {
      showNotification('Registro clínico no encontrado', 'error');
      return;
    }

    const patient = store.find('patients', record.patientId);
    const doctor = store.find('doctors', record.doctorId);
    const date = new Date(record.date);
    const vitals = record.vitalSigns || {};

    const modalContainer = document.createElement('div');
    modalContainer.id = 'view-clinical-record-modal-patient';
    modalContainer.className = 'modal-overlay';

    modalContainer.innerHTML = `
      <div class="modal-content" style="max-width: 850px;">
        <!-- CABECERA -->
        <div class="modal-header">
          <div>
            <h3 class="modal-title">HOSPITAL UNIVERSITARIO MANUEL NUÑEZ TOVAR</h3>
            <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.25rem; font-weight: 500;">HISTORIA CLÍNICA ELECTRÓNICA</div>
          </div>
          <button class="close-modal btn-circle" id="close-clin-rec-hdr" style="background: rgba(255,255,255,0.2); border: none; color: white;">&times;</button>
        </div>

        <!-- CUERPO -->
        <div class="modal-body" style="padding: 2rem;">

          <!-- N° Registro y Fecha -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 2.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem;">
            <div>
              <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; letter-spacing: 0.05em;">N° DE REGISTRO</div>
              <div style="font-family: monospace; font-size: 1.25rem; font-weight: 800; color: #0f172a;">${record.id.split('_').pop()}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 0.75rem; font-weight: 800; color: #64748b; letter-spacing: 0.05em;">FECHA DE ATENCIÓN</div>
              <div style="font-size: 1.125rem; font-weight: 800; color: #0f172a;">
                ${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style="margin-top: 0.35rem; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;">
                <span class="badge badge-success" style="font-size: 0.75rem;">Finalizado</span>
                <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">• ${_clinicalGetTypeText(record.type)}</span>
              </div>
            </div>
          </div>

          <!-- Paciente y Médico -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <!-- Paciente -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; border: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 48px; height: 48px; background: var(--themePrimary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  ${icons.user}
                </div>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.1em;">PACIENTE</div>
                  <div style="font-weight: 800; font-size: 1.1rem; color: #1e293b;">${patient?.name || 'N/A'}</div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem;">
                <div><div style="font-weight: 700; color: #94a3b8;">CÉDULA</div><div style="font-weight: 600; color: #334155;">${patient?.docType || 'V'}-${patient?.dni || '0'}</div></div>
                <div><div style="font-weight: 700; color: #94a3b8;">EDAD</div><div style="font-weight: 600; color: #334155;">${patient?.birthDate ? _clinicalCalculateAge(patient.birthDate) + ' años' : 'N/A'}</div></div>
                <div><div style="font-weight: 700; color: #94a3b8;">TELÉFONO</div><div style="font-weight: 600; color: #334155;">${patient?.phone || '-'}</div></div>
                <div><div style="font-weight: 700; color: #94a3b8;">EMAIL</div><div style="word-break: break-all; font-weight: 600; color: #334155;">${patient?.email || '-'}</div></div>
              </div>
            </div>

            <!-- Médico -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 1.5rem; border: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="width: 48px; height: 48px; background: #64748b; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  ${icons.doctor}
                </div>
                <div>
                  <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.1em;">MÉDICO TRATANTE</div>
                  <div style="font-weight: 800; font-size: 1.1rem; color: #1e293b;">${doctor?.name || 'N/A'}</div>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem;">
                <div><div style="font-weight: 700; color: #94a3b8;">ESPECIALIDAD</div><div style="font-weight: 600; color: #334155;">${doctor?.specialty || '-'}</div></div>
                <div><div style="font-weight: 700; color: #94a3b8;">MATRÍCULA</div><div style="font-weight: 600; color: #334155;">${doctor?.license || '-'}</div></div>
                <div style="grid-column: span 2;"><div style="font-weight: 700; color: #94a3b8;">CITA ORIGINAL</div><div style="font-weight: 600; color: #334155;">#${record.appointmentId ? record.appointmentId.split('_').pop() : 'Directo'}</div></div>
              </div>
            </div>
          </div>

          <!-- Signos Vitales -->
          <div style="margin-bottom: 1.5rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #f1f5f9; color: #475569; padding: 0.75rem 1.25rem; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #e2e8f0;">
              ${icons.vitalSigns || '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'} SIGNOS VITALES
            </div>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); text-align: center;">
              ${[
        ['Presión Arterial', vitals.bloodPressure, 'mmHg'],
        ['Frec. Cardíaca', vitals.heartRate, 'lpm'],
        ['Temperatura', vitals.temperature, '°C'],
        ['Saturación O₂', vitals.spo2, '%'],
        ['Peso', vitals.weight, 'kg'],
        ['Altura', vitals.height, 'cm']
      ].map((v, i, arr) => `
                <div style="padding: 1.25rem 0.5rem; ${i < arr.length - 1 ? 'border-right: 1px solid #e2e8f0;' : ''}">
                  <div style="font-size: 0.65rem; font-weight: 800; color: #64748b; margin-bottom: 0.25rem;">${v[0].toUpperCase()}</div>
                  <div style="font-weight: 800; font-size: 1.2rem; color: #0f172a;">${v[1] || '-'}</div>
                  <div style="font-size: 0.7rem; font-weight: 600; color: #94a3b8;">${v[2]}</div>
                </div>`).join('')}
            </div>
          </div>

          <!-- Motivo y Síntomas -->
          <div style="margin-bottom: 1.5rem; background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid var(--themePrimary); border-radius: 8px; padding: 1.25rem;">
            <div style="color: var(--themePrimary); font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> MOTIVO DE CONSULTA Y SÍNTOMAS
            </div>
            <div style="font-size: 0.95rem; line-height: 1.6; color: #334155; font-weight: 500;">
              ${record.reason ? `<span style="font-weight: 700; color: #0f172a;">Motivo principal:</span> ${record.reason}<br/><br/>` : ''}
              ${record.symptoms || 'No hay síntomas detallados reportados.'}
            </div>
          </div>

          <!-- Diagnóstico -->
          <div style="margin-bottom: 1.5rem; background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid #ea580c; border-radius: 8px; padding: 1.25rem;">
            <div style="color: #ea580c; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> DIAGNÓSTICO
            </div>
            <div style="font-size: 0.95rem; line-height: 1.6; color: #334155; font-weight: 600;">
              ${record.diagnosis || 'Pendiente de evaluación de resultados o no registrado.'}
            </div>
          </div>

          <!-- Tratamiento -->
          <div style="margin-bottom: 1.5rem; background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid #16a34a; border-radius: 8px; padding: 1.25rem;">
            <div style="color: #16a34a; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> TRATAMIENTO PRESCRITO
            </div>
            <div style="font-size: 0.95rem; line-height: 1.6; color: #334155; font-weight: 500;">
              ${record.treatment || 'Seguimiento según evolución médica. No se definieron procedimientos adicionales.'}
            </div>
          </div>

          <!-- Recetas -->
          <div style="margin-bottom: 1.5rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: #f1f5f9; color: #475569; padding: 0.75rem 1.25rem; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #e2e8f0;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5 7 17l3.5-3.5"/><path d="M7 17h9.5a4.5 4.5 0 0 0 0-9H14"/></svg> RECETAS MÉDICAS
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; background: #fff;">
              <thead>
                <tr style="text-align: left; background: #f8fafc; color: #64748b;">
                  <th style="padding: 0.75rem 1.25rem; font-weight: 700; border-bottom: 1px solid #e2e8f0;">MEDICAMENTO</th>
                  <th style="padding: 0.75rem; font-weight: 700; border-bottom: 1px solid #e2e8f0;">DOSIS</th>
                  <th style="padding: 0.75rem; font-weight: 700; border-bottom: 1px solid #e2e8f0;">FRECUENCIA</th>
                  <th style="padding: 0.75rem; font-weight: 700; border-bottom: 1px solid #e2e8f0;">DURACIÓN</th>
                </tr>
              </thead>
              <tbody>
                ${record.prescriptions && Array.isArray(record.prescriptions) && record.prescriptions.length > 0
        ? record.prescriptions.map((p, i, arr) => `
                        <tr>
                          <td style="padding: 0.85rem 1.25rem; font-weight: 700; color: #0f172a; ${i < arr.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : ''}">${p.medication}</td>
                          <td style="padding: 0.85rem; color: #334155; font-weight: 500; ${i < arr.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : ''}">${p.dosage}</td>
                          <td style="padding: 0.85rem; color: #334155; font-weight: 500; ${i < arr.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : ''}">${p.frequency}</td>
                          <td style="padding: 0.85rem; color: #334155; font-weight: 500; ${i < arr.length - 1 ? 'border-bottom: 1px solid #f1f5f9;' : ''}">${p.duration}</td>
                        </tr>`).join('')
        : `<tr><td colspan="4" style="padding: 1.5rem; text-align: center; color: #94a3b8; font-style: italic;">Sin prescripciones farmacológicas activas para esta consulta</td></tr>`
      }
              </tbody>
            </table>
          </div>

          <!-- Observaciones y Seguimiento -->
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1rem;">
            <!-- Observaciones -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 1.25rem; border: 1px solid #e2e8f0;">
              <div style="font-size: 0.8rem; font-weight: 800; color: #64748b; letter-spacing: 0.05em; margin-bottom: 1rem;">OBSERVACIONES Y RECOMENDACIONES</div>
              <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.25rem;">NOTAS ADICIONALES</div>
                <div style="font-size: 0.9rem; color: #334155; font-weight: 500;">${record.notes || 'No se registraron notas clínicas adicionales.'}</div>
              </div>
              <div>
                <div style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.25rem;">RECOMENDACIONES</div>
                <div style="font-size: 0.9rem; color: #334155; font-weight: 500;">${record.recommendations || 'Acudir a urgencias en caso de presentar signos de alarma o complicación de los síntomas.'}</div>
              </div>
            </div>
            
            <!-- Control -->
            <div style="background: #eff6ff; border-radius: 8px; padding: 1.5rem; border: 1px solid #bfdbfe; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
              <div class="calendar-icon" style="background: white; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; color: #2563eb; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(37,99,235,0.1);">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style="font-size: 0.7rem; font-weight: 800; color: #1d4ed8; letter-spacing: 0.05em; margin-bottom: 0.5rem;">PRÓXIMO CONTROL MEDICO</div>
              <div style="font-weight: 800; font-size: 1.1rem; color: #1e3a8a;">
                ${record.followUp ? new Date(record.followUp).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'A demanda'}
              </div>
              ${record.followUp ? `<div style="font-size: 0.75rem; font-weight: 600; color: #3b82f6; margin-top: 0.5rem; background: #dbeafe; padding: 0.25rem 0.75rem; border-radius: 12px;">${_clinicalDaysUntil(record.followUp)}</div>` : ''}
            </div>
          </div>

          <!-- Info Final -->
          <div style="margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem; display: flex; justify-content: space-between; font-size: 0.75rem;">
            <div>
              <div style="font-weight: 800; color: #94a3b8; margin-bottom: 0.25rem;">REGISTRO EMITIDO VÍA SISTEMA</div>
              <div style="font-weight: 600; color: #64748b;">${new Date(record.createdAt).toLocaleString('es-ES')}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; color: #94a3b8; margin-bottom: 0.25rem;">ÚLTIMA SINCRONIZACIÓN</div>
              <div style="font-weight: 600; color: #64748b;">${record.updatedAt ? new Date(record.updatedAt).toLocaleString('es-ES') : 'Inalterado desde emisión'}</div>
            </div>
          </div>
        </div>

        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 1rem 1.5rem; text-align: center; color: #94a3b8; font-size: 0.75rem; font-weight: 600;">
          DOCUMENTO CLÍNICO ELECTRÓNICO OFICIAL • HOSPITAL UNIVERSITARIO MANUEL NÚÑEZ TOVAR
        </div>

        <!-- Footer de botones -->
        <div class="modal-footer">
          <button class="btn-circle" id="close-clin-rec-ftr" title="Cerrar" style="background-color: #64748b;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalContainer);

    const closeModal = () => modalContainer.remove();
    modalContainer.querySelector('#close-clin-rec-hdr').addEventListener('click', closeModal);
    modalContainer.querySelector('#close-clin-rec-ftr').addEventListener('click', closeModal);
    modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });
    const escH = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);
  }

  // Crear cita para paciente
  function createAppointmentForPatient(patient) {
    if (window.APP_STATE && window.APP_STATE.appShell && window.APP_STATE.appShell.navigateTo) {
      window.APP_STATE.appShell.navigateTo('appointments');

      const appointmentData = {
        patientId: patient.id,
        patientName: patient.name,
        source: 'patients'
      };

      localStorage.setItem('appointment_form_data', JSON.stringify(appointmentData));

      setTimeout(() => {
        showNotification(`Creando cita para ${patient.name}...`, 'info');
      }, 300);
    }
  }

  // Mostrar notificación
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    let icon = icons.info;
    let bgColor = 'var(--info)';

    switch (type) {
      case 'success':
        bgColor = 'var(--success)';
        icon = icons.successCheck;
        break;
      case 'error':
        bgColor = 'var(--danger)';
        icon = icons.cancel;
        break;
      case 'warning':
        bgColor = 'var(--warning)';
        icon = icons.warning;
        break;
      default:
        bgColor = 'var(--info)';
        icon = icons.info;
    }

    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${bgColor};
    color: white;
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    `;

    notification.innerHTML = `${icon} ${message} `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);

    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
    @keyframes slideIn { from { transform: translateX(100 %); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100 %); opacity: 0; } }
    `;
      document.head.appendChild(style);
    }
  }

  // Inicializar módulo
  const moduleInstance = init();

  window.viewFullRecord = viewClinicalRecord;

  return {
    refresh: loadData,
    destroy() {
      if (moduleInstance && moduleInstance.destroy) moduleInstance.destroy();
      delete window.viewFullRecord;
    }
  };
}