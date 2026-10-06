/**
 * Cliente HTTP único para hablar con el backend.
 * Agrega el token automáticamente y traduce los errores a mensajes legibles.
 */
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

let obtenerToken: () => string | null = () => null;
let alPerderSesion: () => void = () => {};

/** La capa de autenticación se "enchufa" aquí al iniciar la app. */
export function configurarHttp(opciones: { obtenerToken: () => string | null; alPerderSesion: () => void }) {
  obtenerToken = opciones.obtenerToken;
  alPerderSesion = opciones.alPerderSesion;
}

type Opciones = { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; conToken?: boolean };

export async function api<T>(ruta: string, { method = 'GET', body, conToken = true }: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = conToken ? obtenerToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}/api${ruta}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. ¿Está encendido el backend?');
  }

  if (respuesta.status === 401 && token) alPerderSesion(); // token vencido o cuenta desactivada

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);
  if (!respuesta.ok) throw new ApiError(respuesta.status, mensajeDeError(datos, respuesta.status));
  return datos as T;
}

/** FastAPI devuelve {detail: "texto"} o, si falla una validación, {detail: [{msg: ...}]}. */
function mensajeDeError(datos: unknown, status: number): string {
  const detalle = (datos as { detail?: unknown } | null)?.detail;
  if (typeof detalle === 'string') return detalle;
  if (Array.isArray(detalle) && detalle[0]?.msg) {
    return String(detalle[0].msg).replace(/^Value error, /, '');
  }
  return status >= 500 ? 'Ocurrió un error en el servidor. Intenta de nuevo.' : 'No se pudo completar la acción.';
}
