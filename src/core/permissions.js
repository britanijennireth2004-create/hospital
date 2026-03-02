// Sistema de Permisos RBAC (Role-Based Access Control)
// Basado en el documento de requisitos del Hospital Universitario Manuel Núñez Tovar
// Roles: admin (TIC), doctor (MED), patient (PAC), nurse, receptionist (ADM)

export function can(role, action) {
  if (!role) return false;

  // Admin (Administrador del Sistema / TIC) tiene acceso total
  if (role === 'admin') return true;

  // Mapa de permisos por acción
  const permissions = {
    // === Dashboard ===
    'view:dashboard': ['admin', 'doctor', 'patient', 'nurse', 'receptionist'],

    // === Citas Médicas ===
    'view:appointments': ['admin', 'doctor', 'patient', 'nurse', 'receptionist'],
    'create:appointments': ['admin', 'patient', 'doctor', 'receptionist'],
    'edit:appointments': ['admin', 'doctor', 'patient', 'receptionist'],
    'cancel:appointments': ['admin', 'doctor', 'patient', 'receptionist'],

    // === Pacientes ===
    'view:patients': ['admin', 'doctor', 'receptionist'],
    'create:patients': ['admin', 'doctor', 'receptionist'],
    'edit:patients': ['admin', 'doctor', 'receptionist'],

    // === Médicos ===
    'view:doctors': ['admin', 'doctor', 'receptionist'],
    'create:doctors': ['admin', 'receptionist'],
    'edit:doctors': ['admin', 'receptionist'],

    // === Enfermería ===
    'view:nurses': ['admin', 'nurse', 'receptionist'],
    'create:nurses': ['admin', 'receptionist'],
    'edit:nurses': ['admin', 'receptionist'],

    // === Recepcionistas ===
    'view:receptionists': ['admin', 'receptionist'],
    'create:receptionists': ['admin'],
    'edit:receptionists': ['admin'],

    // === Áreas Médicas ===
    'view:areas': ['admin', 'doctor', 'patient', 'nurse', 'receptionist'],
    'manage:areas': ['admin'],

    // === Historia Clínica ===
    'view:clinical': ['admin', 'doctor', 'patient', 'nurse'],
    'create:clinical': ['admin', 'doctor'],
    'edit:clinical': ['admin', 'doctor'],
    'delete:clinical': ['admin'],

    // === Registro de Tratamientos (Relevo de Turno) ===
    'view:treatments': ['admin', 'doctor', 'nurse'],
    'create:treatments': ['admin', 'doctor', 'nurse'],
    // Los registros de tratamiento NUNCA se eliminan (inmutabilidad)
    'amend:treatments': ['admin', 'doctor', 'nurse'],

    // === Triage ===
    'view:triage': ['admin', 'doctor', 'nurse', 'receptionist'],
    'create:triage': ['admin', 'doctor', 'nurse'],
    'edit:triage': ['admin', 'doctor', 'nurse'],

    // === Recursos ===
    'view:resources': ['admin', 'receptionist'],
    'manage:resources': ['admin'],

    // === Seguridad y Auditoría ===
    'view:security': ['admin'],
    'manage:security': ['admin'],
    'view:audit': ['admin'],
    'manage:sessions': ['admin'],
    'manage:policies': ['admin'],

    // === Comunicaciones ===
    'view:communications': ['admin', 'doctor', 'patient', 'nurse', 'receptionist'],

    // === Gestión de usuarios ===
    'manage:users': ['admin']
  };

  const allowedRoles = permissions[action];
  return allowedRoles ? allowedRoles.includes(role) : false;
}