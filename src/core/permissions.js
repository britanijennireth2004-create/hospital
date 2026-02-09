// Permisos simplificados

export function can(role, action) {
  if (!role) return false;

  // Admin tiene todo
  if (role === 'admin') return true;

  // Permisos básicos
  const permissions = {
    'view:dashboard': ['admin', 'doctor', 'patient'],
    'view:appointments': ['admin', 'doctor', 'patient'],
    'create:appointments': ['admin', 'patient', 'doctor'],
    'view:patients': ['admin', 'doctor'],
    'view:doctors': ['admin', 'doctor', 'patient'],
    'view:areas': ['admin', 'doctor', 'patient'],
    'manage:users': ['admin'],
    'view:clinical': ['admin', 'doctor', 'patient'],
    'create:clinical': ['admin', 'doctor'],
    'edit:clinical': ['admin', 'doctor'],
    'delete:clinical': ['admin'],
    'view:security': ['admin'],
    'manage:security': ['admin'],
    'view:audit': ['admin'],
    'manage:sessions': ['admin'],
    'manage:policies': ['admin']
  };

  const allowedRoles = permissions[action];
  return allowedRoles ? allowedRoles.includes(role) : false;
}