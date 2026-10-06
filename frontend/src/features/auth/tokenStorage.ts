/**
 * Dónde se guarda el token:
 *  - "Recordarme" activado  → localStorage   (sobrevive a cerrar el navegador)
 *  - "Recordarme" apagado   → sessionStorage (se borra al cerrar la pestaña)
 */
const CLAVE = 'pulse_gym_token';

function seguro<T>(fn: () => T, porDefecto: T): T {
  try {
    return fn();
  } catch {
    return porDefecto; // navegación privada u otros bloqueos de almacenamiento
  }
}

export const tokenStorage = {
  leer(): string | null {
    return seguro(() => localStorage.getItem(CLAVE) ?? sessionStorage.getItem(CLAVE), null);
  },
  guardar(token: string, recordar: boolean) {
    seguro(() => {
      this.borrar();
      (recordar ? localStorage : sessionStorage).setItem(CLAVE, token);
    }, undefined);
  },
  borrar() {
    seguro(() => {
      localStorage.removeItem(CLAVE);
      sessionStorage.removeItem(CLAVE);
    }, undefined);
  },
};
