/**
 * Utility for system auditing and logging
 */
export const Logger = {
    /**
     * Log an action to the store
     * @param {Object} store - The store instance
     * @param {Object} user - Current user performing the action
     * @param {Object} options - Log details
     */
    log(store, user, { action, module, description, details = {} }) {
        if (!store || !user) {
            console.warn('Audit Log: Store or User missing');
            return;
        }

        const logEntry = {
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action, // e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'
            module, // e.g., 'appointments', 'patients', 'clinical'
            description,
            details,
            timestamp: Date.now()
        };

        try {
            store.add('auditLogs', logEntry);
        } catch (error) {
            console.error('Failed to save audit log:', error);
        }
    },

    // Acciones predefinidas para consistencia
    Actions: {
        CREATE: 'CREAR',
        UPDATE: 'ACTUALIZAR',
        DELETE: 'ELIMINAR',
        LOGIN: 'INICIO_SESION',
        LOGOUT: 'CERRAR_SESION',
        VIEW: 'VER',
        PRINT: 'IMPRIMIR',
        EXPORT: 'EXPORTAR',
        IMPORT: 'IMPORTAR',
        AMEND: 'ENMIENDA'       // Corrección inmutable de un registro clínico
    },

    // Módulos predefinidos para consistencia
    Modules: {
        AUTH: 'autenticacion',
        PATIENTS: 'pacientes',
        DOCTORS: 'medicos',
        APPOINTMENTS: 'citas',
        CLINICAL: 'historia_clinica',
        TREATMENTS: 'tratamientos',   // Relevo de turno / registro de tratamientos
        TRIAJE: 'triaje',
        SECURITY: 'seguridad',
        AREAS: 'areas',
        AUDIT: 'auditoria',
        RESOURCES: 'recursos'
    }
};
