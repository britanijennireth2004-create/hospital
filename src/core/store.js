// Store mejorado con más datos y funcionalidades

export async function createStore(bus) {
  const STORAGE_KEY = 'hospital_prototype_v3';
  
  // Datos de ejemplo más completos
  const defaultData = {
    version: '3.0',
    users: [
      { 
        id: 'admin_1', 
        username: 'admin', 
        password: 'admin123', 
        role: 'admin', 
        name: 'Administrador', 
        email: 'admin@hospital.com',
        isActive: true,
        createdAt: Date.now()
      },
      { 
        id: 'patient_1', 
        username: 'maria', 
        password: 'demo123', 
        role: 'patient', 
        name: 'María Gómez', 
        email: 'maria@email.com',
        patientId: 'p_1',
        phone: '555-0101',
        birthDate: '1985-03-12',
        isActive: true,
        createdAt: Date.now()
      },
      { 
        id: 'doctor_1', 
        username: 'daruiz', 
        password: 'demo123', 
        role: 'doctor', 
        name: 'Dra. Ana Ruiz', 
        email: 'ana.ruiz@hospital.com',
        doctorId: 'd_1',
        specialty: 'Medicina General',
        license: 'MG-12345',
        isActive: true,
        createdAt: Date.now()
      }
    ],
    
    patients: [
      {
        id: 'p_1',
        dni: '12345678A',
        name: 'María Gómez',
        birthDate: '1985-03-12',
        gender: 'F',
        phone: '555-0101',
        email: 'maria@email.com',
        address: 'Calle Principal 123',
        bloodType: 'O+',
        allergies: [],
        isActive: true,
        createdAt: Date.now()
      },
      {
        id: 'p_2',
        dni: '87654321B',
        name: 'Juan López',
        birthDate: '1990-11-02',
        gender: 'M',
        phone: '555-0102',
        email: 'juan@email.com',
        address: 'Avenida Central 456',
        bloodType: 'A+',
        allergies: ['Penicilina'],
        isActive: true,
        createdAt: Date.now()
      }
    ],
    
    doctors: [
      {
        id: 'd_1',
        name: 'Dra. Ana Ruiz',
        specialty: 'Medicina General',
        areaId: 'area_1',
        license: 'MG-12345',
        email: 'ana.ruiz@hospital.com',
        phone: '555-0201',
        schedule: 'Lun-Vie 8:00-16:00',
        isActive: true,
        createdAt: Date.now()
      },
      {
        id: 'd_2',
        name: 'Dr. Luis Pérez',
        specialty: 'Cardiología',
        areaId: 'area_3',
        license: 'C-67890',
        email: 'luis.perez@hospital.com',
        phone: '555-0202',
        schedule: 'Mar-Jue 10:00-18:00',
        isActive: true,
        createdAt: Date.now()
      },
      {
        id: 'd_3',
        name: 'Dra. Laura Sánchez',
        specialty: 'Pediatría',
        areaId: 'area_2',
        license: 'P-34567',
        email: 'laura.sanchez@hospital.com',
        phone: '555-0203',
        schedule: 'Lun-Mie-Vie 9:00-17:00',
        isActive: true,
        createdAt: Date.now()
      }
    ],
    
    areas: [
      {
        id: 'area_1',
        name: 'Medicina General',
        description: 'Atención médica general y consultas',
        color: '#0f8d3a',
        isActive: true
      },
      {
        id: 'area_2',
        name: 'Pediatría',
        description: 'Especialidad en atención infantil',
        color: '#3b82f6',
        isActive: true
      },
      {
        id: 'area_3',
        name: 'Cardiología',
        description: 'Especialidad en enfermedades del corazón',
        color: '#ef4444',
        isActive: true
      },
      {
        id: 'area_4',
        name: 'Traumatología',
        description: 'Especialidad en lesiones óseas y musculares',
        color: '#f59e0b',
        isActive: true
      }
    ],
    
    appointments: [
      {
        id: 'apt_1',
        patientId: 'p_1',
        doctorId: 'd_1',
        areaId: 'area_1',
        dateTime: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 días en el futuro
        duration: 30,
        status: 'scheduled',
        reason: 'Consulta general',
        notes: '',
        createdAt: Date.now(),
        createdBy: 'admin_1'
      },
      {
        id: 'apt_2',
        patientId: 'p_2',
        doctorId: 'd_2',
        areaId: 'area_3',
        dateTime: Date.now() + 6 * 24 * 60 * 60 * 1000, // 6 días en el futuro
        duration: 45,
        status: 'scheduled',
        reason: 'Dolor en el pecho',
        notes: 'Requiere electrocardiograma',
        createdAt: Date.now(),
        createdBy: 'patient_2'
      },
      {
        id: 'apt_3',
        patientId: 'p_1',
        doctorId: 'd_3',
        areaId: 'area_2',
        dateTime: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 días en el pasado
        duration: 30,
        status: 'completed',
        reason: 'Control pediátrico',
        notes: 'Vacuna anual aplicada',
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        createdBy: 'patient_1'
      }
    ],
    
    clinicalRecords: [
      {
        id: 'cr_1',
        patientId: 'p_1',
        doctorId: 'd_1',
        appointmentId: 'apt_3',
        date: Date.now() - 3 * 24 * 60 * 60 * 1000,
        type: 'consultation',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 36.5,
          spo2: 98,
          weight: 65,
          height: 170
        },
        symptoms: 'Fiebre leve (37.8°C), dolor de cabeza, congestión nasal',
        diagnosis: 'Resfriado común (Rinofaringitis aguda)',
        treatment: 'Reposo, hidratación abundante, antitérmicos si fiebre >38°C',
        prescriptions: [
          {
            medication: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Cada 8 horas',
            duration: '3 días'
          },
          {
            medication: 'Ibuprofeno',
            dosage: '400mg',
            frequency: 'Cada 12 horas',
            duration: '2 días'
          }
        ],
        notes: 'Paciente alérgico a penicilina. Se recomienda evitar cambios bruscos de temperatura.',
        followUp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        recommendations: 'Acudir a urgencias si fiebre persiste más de 72 horas o dificultad respiratoria',
        status: 'finalized',
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        createdBy: 'doctor_1'
      },
      {
        id: 'cr_2',
        patientId: 'p_2',
        doctorId: 'd_2',
        date: Date.now() - 10 * 24 * 60 * 60 * 1000,
        type: 'emergency',
        vitalSigns: {
          bloodPressure: '140/90',
          heartRate: 95,
          temperature: 37.2,
          spo2: 96,
          weight: 78,
          height: 175
        },
        symptoms: 'Dolor precordial opresivo de 30 minutos de evolución, irradiado a brazo izquierdo',
        diagnosis: 'Síndrome coronario agudo. Derivado a unidad coronaria',
        treatment: 'Monitorización continua, oxigenoterapia, analgesia, antiagregación plaquetaria',
        prescriptions: [
          {
            medication: 'Ácido Acetilsalicílico',
            dosage: '300mg',
            frequency: 'Dosis única',
            duration: '1 dosis'
          },
          {
            medication: 'Clopidogrel',
            dosage: '300mg',
            frequency: 'Dosis de carga',
            duration: '1 dosis'
          }
        ],
        notes: 'Paciente con antecedentes de HTA y tabaquismo. ECG con elevación ST en cara anterior. Transportado en ambulancia medicalizada.',
        status: 'finalized',
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        createdBy: 'doctor_2'
      }
    ],

    // Añadir a la sección defaultData en store.js:

    triage: [
      {
        id: 'triage_1',
        patientId: 'p_1',
        priority: 'orange',
        symptoms: 'Dolor torácico intenso con irradiación al brazo izquierdo, náuseas, diaforesis',
        observations: 'Paciente con antecedentes de HTA y tabaquismo. ECG solicitado.',
        vitalSigns: {
          bloodPressure: '150/95',
          heartRate: 110,
          temperature: 37.2,
          spo2: 94,
          respiratoryRate: 22,
          painLevel: 9
        },
        status: 'in_progress',
        triagedBy: 'doctor_1',
        triagedByName: 'Dra. Ana Ruiz',
        createdAt: Date.now() - 15 * 60 * 1000, // 15 minutos atrás
        startedAt: Date.now() - 5 * 60 * 1000   // 5 minutos atrás
      },
      {
        id: 'triage_2',
        patientId: 'p_2',
        priority: 'yellow',
        symptoms: 'Fractura expuesta en pierna derecha, dolor intenso, deformidad visible',
        observations: 'Accidente de tránsito. Estable hemodinámicamente.',
        vitalSigns: {
          bloodPressure: '130/85',
          heartRate: 95,
          temperature: 36.8,
          spo2: 97,
          respiratoryRate: 18,
          painLevel: 8
        },
        status: 'waiting',
        triagedBy: 'doctor_2',
        triagedByName: 'Dr. Luis Pérez',
        createdAt: Date.now() - 30 * 60 * 1000  // 30 minutos atrás
      }
    ],

    // Colecciones vacías para funcionalidades futuras
    labResults: [],
    messages: []
  };
  
  // Cargar datos
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migración de versiones si es necesario
        if (parsed.version !== defaultData.version) {
          console.log('Migrando datos a nueva versión');
          return migrateData(parsed, defaultData);
        }
        return parsed;
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
    return defaultData;
  }
  
  // Migración simple de datos
  function migrateData(oldData, newData) {
    // Conservar datos existentes y agregar estructura nueva
    const migrated = { ...newData };
    
    // Migrar colecciones existentes
    ['users', 'patients', 'doctors', 'areas', 'appointments'].forEach(collection => {
      if (oldData[collection] && Array.isArray(oldData[collection])) {
        migrated[collection] = oldData[collection];
      }
    });
    
    return migrated;
  }
  
  // Guardar datos
  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (bus) {
        bus.emit('store:saved', { timestamp: Date.now() });
      }
    } catch (error) {
      console.error('Error guardando datos:', error);
      if (bus) {
        bus.emit('store:save:error', { error });
      }
    }
  }
  
  let data = loadData();
  
  // Funciones auxiliares
  function generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }
  
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  const store = {
    // ===== GETTERS =====
    get(collection) {
      return deepClone(data[collection] || []);
    },
    
    find(collection, id) {
      const items = data[collection] || [];
      const item = items.find(item => item.id === id);
      return item ? deepClone(item) : null;
    },
    
    query(collection, query = {}) {
      const items = data[collection] || [];
      return deepClone(items.filter(item => {
        return Object.entries(query).every(([key, value]) => {
          if (value === undefined || value === null) return true;
          if (typeof value === 'function') return value(item[key]);
          if (Array.isArray(value)) return value.includes(item[key]);
          return item[key] == value;
        });
      }));
    },
    
    // ===== MUTACIONES =====
    add(collection, itemData) {
      if (!data[collection]) {
        data[collection] = [];
      }
      
      const now = Date.now();
      const item = {
        id: itemData.id || generateId(collection.slice(0, 3)),
        ...itemData,
        createdAt: itemData.createdAt || now,
        updatedAt: now,
        isActive: itemData.isActive !== false
      };
      
      data[collection].push(item);
      saveData(data);
      
      if (bus) {
        bus.emit(`store:${collection}:added`, { item });
        bus.emit('store:changed', { collection, action: 'add', item });
      }
      
      return deepClone(item);
    },
    
    update(collection, id, changes) {
      const items = data[collection] || [];
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) {
        return null;
      }
      
      const updatedItem = {
        ...items[index],
        ...changes,
        updatedAt: Date.now()
      };
      
      items[index] = updatedItem;
      data[collection] = items;
      saveData(data);
      
      if (bus) {
        bus.emit(`store:${collection}:updated`, { item: updatedItem });
        bus.emit('store:changed', { collection, action: 'update', item: updatedItem });
      }
      
      return deepClone(updatedItem);
    },
    
    remove(collection, id) {
      const items = data[collection] || [];
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) {
        return false;
      }
      
      const [removedItem] = items.splice(index, 1);
      data[collection] = items;
      saveData(data);
      
      if (bus) {
        bus.emit(`store:${collection}:removed`, { item: removedItem });
        bus.emit('store:changed', { collection, action: 'remove', item: removedItem });
      }
      
      return true;
    },
    
    // ===== OPERACIONES ESPECIALES =====
    getStats() {
      const stats = {};
      Object.keys(data).forEach(collection => {
        if (Array.isArray(data[collection])) {
          stats[collection] = data[collection].length;
        }
      });
      return stats;
    },
    
    getTodayAppointments() {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return this.query('appointments', appointment => {
        const appointmentDate = new Date(appointment.dateTime);
        return appointmentDate >= today && appointmentDate < tomorrow;
      });
    },
    
    getUpcomingAppointments(days = 7) {
      const now = new Date();
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + days);
      
      return this.query('appointments', appointment => {
        const appointmentDate = new Date(appointment.dateTime);
        return appointmentDate >= now && appointmentDate <= futureDate;
      });
    },
    
    // ===== UTILIDADES =====
    reset() {
      if (confirm('¿Estás seguro de resetear todos los datos? Se perderá toda la información.')) {
        data = deepClone(defaultData);
        saveData(data);
        
        if (bus) {
          bus.emit('store:reset');
        }
        
        return true;
      }
      return false;
    },
    
    exportData() {
      return deepClone(data);
    },
    
    importData(newData) {
      data = deepClone(newData);
      saveData(data);
      
      if (bus) {
        bus.emit('store:imported');
      }
      
      return true;
    },
    
    // ===== SUSCRIPCIONES =====
    subscribe(collection, callback) {
      if (!bus) return () => {};
      
      const listener = (event) => {
        if (event.detail.collection === collection) {
          callback(event.detail);
        }
      };
      
      bus.on('store:changed', listener);
      
      // Retornar función para desuscribirse
      return () => {
        bus.off('store:changed', listener);
      };
    }
  };
  
  return store;
}