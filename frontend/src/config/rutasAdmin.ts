/**
 * Mapa del panel administrativo: UNA sola lista define
 *   1) qué pantallas existen,  2) qué permiso pide cada una,  3) qué aparece en el menú.
 * Para agregar una pantalla nueva, solo se agrega una línea aquí.
 */
import type { ComponentType, SVGProps } from 'react';
import { PERMISOS, type Permiso } from '../features/auth/permisos';
import {
  IconBanknote, IconCard, IconCheck, IconDumbbell, IconFile, IconGrid, IconList,
  IconPulse, IconShield, IconUsers,
} from '../components/Icons';

import Attendance from '../pages/admin/Attendance';
import ClientProfile from '../pages/admin/ClientProfile';
import Clients from '../pages/admin/Clients';
import Dashboard from '../pages/admin/Dashboard';
import Machines from '../pages/admin/Machines';
import Measurements from '../pages/admin/Measurements';
import Memberships from '../pages/admin/Memberships';
import NewClient from '../pages/admin/NewClient';
import Payments from '../pages/admin/Payments';
import Reports from '../pages/admin/Reports';
import Roles from '../pages/admin/Roles';
import Routines from '../pages/admin/Routines';

export type GrupoMenu = 'GESTIÓN' | 'ENTRENAMIENTO' | 'CONFIGURACIÓN';
type Icono = ComponentType<SVGProps<SVGSVGElement>>;

export interface RutaAdmin {
  path: string; // relativo a /admin ('' = /admin)
  Component: ComponentType;
  permiso: Permiso;
  menu?: { label: string; icono: Icono; grupo: GrupoMenu | null };
}

export const RUTAS_ADMIN: RutaAdmin[] = [
  { path: 'dashboard', Component: Dashboard, permiso: PERMISOS.DASHBOARD_VER, menu: { label: 'Dashboard', icono: IconGrid, grupo: null } },
  { path: '', Component: Clients, permiso: PERMISOS.CLIENTES_VER, menu: { label: 'Clientes', icono: IconUsers, grupo: 'GESTIÓN' } },
  { path: 'clients/new', Component: NewClient, permiso: PERMISOS.CLIENTES_CREAR },
  { path: 'clients/:id', Component: ClientProfile, permiso: PERMISOS.CLIENTES_VER },
  { path: 'clients/:id/edit', Component: NewClient, permiso: PERMISOS.CLIENTES_EDITAR },
  { path: 'memberships', Component: Memberships, permiso: PERMISOS.MEMBRESIAS_VER, menu: { label: 'Membresías', icono: IconCard, grupo: 'GESTIÓN' } },
  { path: 'payments', Component: Payments, permiso: PERMISOS.PAGOS_GESTIONAR, menu: { label: 'Pagos', icono: IconBanknote, grupo: 'GESTIÓN' } },
  { path: 'attendance', Component: Attendance, permiso: PERMISOS.ASISTENCIA_VER, menu: { label: 'Asistencia', icono: IconCheck, grupo: 'GESTIÓN' } },
  { path: 'machines', Component: Machines, permiso: PERMISOS.MAQUINAS_VER, menu: { label: 'Máquinas', icono: IconDumbbell, grupo: 'ENTRENAMIENTO' } },
  { path: 'routines', Component: Routines, permiso: PERMISOS.RUTINAS_GESTIONAR, menu: { label: 'Rutinas', icono: IconList, grupo: 'ENTRENAMIENTO' } },
  { path: 'measurements', Component: Measurements, permiso: PERMISOS.MEDICIONES_GESTIONAR, menu: { label: 'Mediciones y lesiones', icono: IconPulse, grupo: 'ENTRENAMIENTO' } },
  { path: 'reports', Component: Reports, permiso: PERMISOS.REPORTES_VER, menu: { label: 'Reportes', icono: IconFile, grupo: 'CONFIGURACIÓN' } },
  { path: 'roles', Component: Roles, permiso: PERMISOS.USUARIOS_GESTIONAR, menu: { label: 'Roles y permisos', icono: IconShield, grupo: 'CONFIGURACIÓN' } },
];

export const GRUPOS_MENU: GrupoMenu[] = ['GESTIÓN', 'ENTRENAMIENTO', 'CONFIGURACIÓN'];

export const rutaCompleta = (path: string) => (path ? `/admin/${path}` : '/admin');
