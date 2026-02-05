// Archivo vacío por ahora
export function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
export function mergeDeep(target, source) { return { ...target, ...source }; }