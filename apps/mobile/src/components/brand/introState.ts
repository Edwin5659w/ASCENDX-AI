/**
 * Avisa cuándo terminó la animación de inicio, para que las animaciones de
 * la primera pantalla (p. ej. la gráfica de la bienvenida) no se reproduzcan
 * escondidas detrás del logo.
 */

let done = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  if (done) return;
  done = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

/** Ejecuta `callback` cuando la intro terminó (de inmediato si ya terminó). Devuelve la cancelación. */
export function whenIntroDone(callback: () => void): () => void {
  if (done) {
    callback();
    return () => undefined;
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
}
