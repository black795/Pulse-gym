# Pulse Gym
## Qué incluye

| | Qué hace |
|---|---|
| **Login** | Correo + contraseña, "Recordarme", mensajes de error claros, cuentas de prueba |
| **Registro** | Solo crea **clientes** (nadie puede auto-registrarse como dueño). Exige consentimiento de datos de salud |
| **4 roles** | Dueño (administrador), Recepcionista, Entrenador, Cliente |
| **Menú por rol** | El menú lateral se arma solo con las opciones permitidas |
| **Rutas protegidas** | Si escribes una URL sin permiso, ves "No tienes acceso" |
| **Roles y permisos** | El dueño agrega personal, cambia roles y activa/desactiva cuentas (con historial) |
| **Cerrar sesión** | Desde la barra superior (panel) o desde Perfil (móvil) |

---

## Cómo arrancarlo (2 terminales)

Necesitas **Python 3.11+** y **Node 20+**.

**Terminal 1 — Backend (la "cocina")**
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate     Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # en Windows: copy .env.example .env
uvicorn app.main:app --reload
```
Queda en http://localhost:8000 — y la documentación interactiva de la API en **http://localhost:8000/docs**

**Terminal 2 — Frontend (el "comedor")**
```bash
cd frontend
npm install
npm run dev
```
Abre **http://localhost:5173**

> No necesitas instalar PostgreSQL para empezar: por defecto usa SQLite (un archivo `pulse_gym.db`).
> Cuando quieras PostgreSQL, mira la sección más abajo.

### Cuentas de prueba (contraseña: `Pulse2026!`)

| Correo | Rol | Entra a |
|---|---|---|
| carlos@pulsegym.com | Dueño | Panel completo |
| pati@pulsegym.com | Recepcionista | Panel: clientes, pagos, asistencia |
| javier@pulsegym.com | Entrenador | Panel: rutinas, mediciones, lesiones |
| daniela@pulsegym.com | Cliente | App móvil |

En la pantalla de login (solo en desarrollo) hay botones para rellenarlas con un clic.

---

## Estructura del proyecto

```
pulse-gym/
├── backend/                     ← FastAPI (Python)
│   ├── app/
│   │   ├── main.py              Punto de entrada: arma la app y crea tablas
│   │   ├── core/
│   │   │   ├── config.py        Configuración (lee el archivo .env)
│   │   │   ├── permisos.py      ★ ROLES Y PERMISOS: la única fuente de verdad
│   │   │   └── security.py      Contraseñas cifradas (bcrypt) y tokens (JWT)
│   │   ├── db/                  Conexión a la base de datos y datos iniciales
│   │   ├── models/              Tablas: sedes, roles, estados_usuario, usuarios, historial_estado_usuario
│   │   ├── schemas/             Qué datos entran y salen de la API (y sus validaciones)
│   │   ├── services/            Reglas de negocio (crear usuario, cambiar estado…)
│   │   └── api/
│   │       ├── deps.py          "Porteros": ¿quién eres? ¿tienes la llave?
│   │       └── routes/          Endpoints: auth, usuarios, roles
│   └── tests/                   22 pruebas automáticas
│
└── frontend/                    ← Tu diseño (React + Vite + Tailwind)
    └── src/
        ├── lib/http.ts          Único lugar que habla con el backend
        ├── features/auth/       ★ Todo el login: sesión, permisos, porteros de rutas
        ├── config/rutasAdmin.ts ★ Mapa del panel: pantalla + permiso + menú en una línea
        ├── routes.tsx           Todas las rutas y quién puede entrar a cada una
        ├── components/          Sidebar, Topbar, Avatar, Badge, Iconos
        └── pages/               public/ (login, registro) · admin/ · mobile/ · sistema/ (403, 404, carga)
```

## Cómo funcionan los roles (en simple)

Piensa en un **llavero**: cada rol es un llavero y cada permiso es una llave (`pagos:gestionar`, `rutinas:gestionar`…).

1. El backend define los llaveros en `backend/app/core/permisos.py`.
2. Al iniciar sesión, el backend le dice al frontend qué llaves tiene ese usuario.
3. El frontend usa esas llaves para mostrar u ocultar menús y pantallas.
4. **Pero quien realmente decide es el backend**: aunque alguien "hackee" el frontend, cada petición
   se vuelve a revisar en el servidor. El frontend solo hace que la experiencia sea cómoda.

| Pantalla | Dueño | Recepción | Entrenador | Cliente |
|---|:-:|:-:|:-:|:-:|
| Dashboard, Clientes, Máquinas, Asistencia | ✓ | ✓ | ✓ | |
| Membresías | ✓ | ✓ | | |
| Pagos | ✓ | ✓ | | |
| Rutinas, Mediciones y lesiones | ✓ | | ✓ | |
| Reportes, Roles y permisos | ✓ | | | |
| App móvil | | | | ✓ |

### Agregar una pantalla nueva protegida (3 pasos)

1. Si necesita una llave nueva, agrégala en `backend/app/core/permisos.py` (y dásela a los roles que correspondan).
2. Copia la misma llave en `frontend/src/features/auth/permisos.ts`.
3. Agrega una línea en `frontend/src/config/rutasAdmin.ts`. Listo: ruta, protección y menú quedan hechos.

En el backend, cada endpoint nuevo se protege así:
```python
@router.get("/pagos", dependencies=[Depends(requiere_permiso(PAGOS_GESTIONAR))])
```

---

## API de este sprint

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| POST | `/api/auth/login` | Todos | Iniciar sesión → token + usuario + permisos |
| POST | `/api/auth/registro` | Público | Crear cuenta de cliente |
| GET | `/api/auth/me` | Con sesión | ¿Quién soy? |
| GET | `/api/roles` | Dueño | Roles y sus permisos |
| GET | `/api/usuarios?solo_personal=true` | Dueño | Lista del equipo |
| POST | `/api/usuarios` | Dueño | Agregar personal |
| PATCH | `/api/usuarios/{id}/rol` | Dueño | Cambiar rol |
| PATCH | `/api/usuarios/{id}/estado` | Dueño | Activar / desactivar / suspender |

## Seguridad incluida

- Contraseñas guardadas con **bcrypt** (nunca en texto plano).
- Mismo mensaje si el correo no existe o la contraseña está mal (no se puede adivinar quién está registrado).
- Si el dueño desactiva una cuenta, **su sesión se corta al instante**, no cuando venza el token.
- El dueño no puede quitarse su propio rol ni desactivarse (evita quedarse fuera del sistema).
- El registro público rechaza cualquier intento de enviar un `rol`.
- En producción (`ENTORNO=produccion`) el servidor no arranca con una clave secreta débil ni con usuarios de prueba.

## Pruebas

```bash
cd backend
pytest -q          # 22 pruebas: login, registro, permisos por rol, cambios de estado
```

## PostgreSQL (cuando lo necesites)

```bash
docker compose up -d     # desde la carpeta pulse-gym/
```
Y en `backend/.env`:
```
DATABASE_URL=postgresql+psycopg://pulse:pulse@localhost:5432/pulse_gym
```
Las tablas usan **los mismos nombres y columnas de tu script SQL** (`roles`, `usuarios`, `estados_usuario`,
`historial_estado_usuario`, `sedes`), así que también funciona sobre una base donde ya corriste ese script.

---

## Pendientes para próximos sprints

- **Guardar el consentimiento**: hoy se exige al registrarse, pero tu esquema aún no tiene dónde guardarlo.
  Lo ideal es agregar `consentimiento_salud_at` en la tabla de clientes cuando hagamos ese módulo.
- **Paso 2 del registro**: peso, altura (IMC), lesiones y objetivo → módulo Clientes.
- **Restablecer contraseña** (por el dueño o por correo).
- **Límite de intentos de login** (bloquear tras varios intentos fallidos).
- **Migraciones con Alembic** en lugar de crear tablas al iniciar.
