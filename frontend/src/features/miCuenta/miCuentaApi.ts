import { useOutletContext } from 'react-router';
import { api } from '../../lib/http';
import type { Cliente } from '../clientes/clientesApi';
import type { Membresia } from '../membresias/membresiasApi';

/** Todo lo que la app del cliente muestra sobre él mismo. Viene en una sola petición. */
export interface MiCuenta {
  hoy: string; // AAAA-MM-DD en la zona del gimnasio
  ficha: Cliente | null; // null = recepción aún no registró su ficha
  membresia: Membresia | null; // null = nunca pagó un plan
  lesiones_activas: { id: number; tipo: 'lesion' | 'limitacion'; nombre: string }[];
  semana: { fecha: string; asistio: boolean }[]; // de lunes a domingo
  racha_dias: number;
  asistencias_mes: number;
  ultima_asistencia: string | null;
}

export const miCuentaApi = {
  obtener: () => api<MiCuenta>('/mi-cuenta'),
};

/** Lo que MobileShell comparte con cada pestaña de la app. */
export interface ContextoMovil {
  cuenta: MiCuenta | null; // null mientras carga o si falló
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

export const useMiCuenta = () => useOutletContext<ContextoMovil>();

/** "2026-10-08" → Date local de ese día (sin pasar por UTC, para que la zona horaria no mueva el día). */
export function aFecha(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/** "2026-10-08" → "Jueves, 8 oct". */
export function fechaCorta(iso: string): string {
  const texto = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'short' }).format(aFecha(iso));
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace('.', '');
}

export const imc = (ficha: Cliente) => ficha.peso_kg / (ficha.altura_cm / 100) ** 2;
