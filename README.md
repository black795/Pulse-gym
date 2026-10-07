## 🔄 Flujo de trabajo del equipo

Para mantener el desarrollo organizado, cada integrante debe seguir este flujo de trabajo al implementar una o varias historias de usuario.

### 1. Seleccionar historias en Trello

Antes de comenzar a programar, cada integrante debe seleccionar en Trello las historias de usuario que va a desarrollar.

Una vez seleccionadas, las tarjetas deben moverse desde:

```text
Product Backlog / Por hacer → En proceso
```

Esto permite que el equipo sepa qué historias están siendo trabajadas y evita que dos personas implementen la misma funcionalidad al mismo tiempo.

---

### 2. Actualizar la rama `develop`

Antes de crear una nueva rama, se debe asegurar que la rama local `develop` esté actualizada:

```bash
git checkout develop
git pull origin develop
```

La rama `develop` contiene la versión más reciente del proyecto sobre la cual se desarrollan las nuevas funcionalidades.

---

### 3. Crear una rama de trabajo

Cada conjunto de historias debe desarrollarse en una rama creada a partir de `develop`.

Formato recomendado:

```text
feature/<historias>-<descripcion>
```

Ejemplos:

```text
feature/S1-02-registro-clientes
feature/S1-03-S1-05-lesiones
feature/S1-06-validacion-lesiones
```

Ejemplo de creación:

```bash
git checkout -b feature/S1-02-registro-clientes
```

> No se debe desarrollar directamente sobre las ramas `main` o `develop`.

---

### 4. Implementar la historia

Durante el desarrollo se deben realizar commits pequeños y descriptivos.

Ejemplos:

```bash
git commit -m "feat: agrega modelo de cliente"
git commit -m "feat: agrega endpoint para registrar clientes"
git commit -m "fix: corrige validacion de lesiones"
```

Cuando sea posible, una historia debe implementarse de forma completa siguiendo este flujo:

```text
Frontend
   ↓
API REST
   ↓
Servicio / lógica de negocio
   ↓
ORM
   ↓
Base de datos
```

---

### 5. Subir la rama

Al terminar el desarrollo:

```bash
git push origin feature/S1-02-registro-clientes
```

---

### 6. Crear Pull Request

Cuando la historia esté terminada, se debe crear un **Pull Request hacia la rama `develop`**.

El Pull Request debe incluir:

- Historia o historias de usuario implementadas.
- Breve descripción de los cambios realizados.
- Evidencia o capturas si corresponde.
- Instrucciones especiales para probar la funcionalidad.
- Cambios realizados en la base de datos, si existen.

Ejemplo:

```text
Título:
S1-02 — Registro de clientes

Descripción:
Implementa el registro de clientes desde frontend hasta base de datos.

Incluye:
- DTOs con Pydantic
- Modelo SQLAlchemy
- Endpoint POST /api/clientes
- Servicio de clientes
- Formulario de registro
- Validaciones
```

---

### 7. Notificar al equipo

Después de crear el Pull Request, se debe enviar un mensaje al grupo del equipo notificando que está listo para revisión.

Ejemplo:

```text
PR listo para revisión.

Historia: S1-02 — Registro de clientes
Rama: feature/S1-02-registro-clientes

Cambios principales:
- Modelo de cliente
- DTOs
- API REST
- Formulario de registro

PR: <enlace al Pull Request>

Revisor: Lucas / Josué
```

---

### 8. Revisión de código

Los responsables principales de revisar los Pull Requests serán:

- **Lucas**
- **Josué**

El revisor debe comprobar:

- Que las historias solicitadas hayan sido implementadas.
- Que el código sea comprensible y esté organizado.
- Que no se hayan incluido archivos sensibles como `.env`.
- Que la funcionalidad pueda ejecutarse correctamente.
- Que no se rompan funcionalidades existentes.
- Que los cambios de base de datos sean coherentes.
- Que no existan conflictos con `develop`.

Si existen observaciones, el desarrollador debe corregirlas en la misma rama y volver a subir los cambios:

```bash
git add .
git commit -m "fix: corrige observaciones del pull request"
git push
```

El Pull Request se actualizará automáticamente.

---

### 9. Merge hacia `develop`

Cuando Lucas o Josué aprueben el Pull Request, se podrá realizar el merge hacia:

```text
develop
```

> No se debe hacer merge de un Pull Request propio sin revisión, salvo que el equipo lo acuerde previamente.

---

### 10. Finalizar la historia en Trello

Una vez que el Pull Request haya sido aprobado y mergeado, las historias correspondientes deben moverse en Trello a:

```text
En proceso → Terminado
```

De esta forma, Trello representa el estado real del código integrado al proyecto.

---

## 🧭 Resumen del flujo

```text
Elegir historia en Trello
          ↓
Mover a "En proceso"
          ↓
Actualizar develop
          ↓
Crear rama feature/*
          ↓
Implementar historia
          ↓
Commits
          ↓
Push
          ↓
Pull Request → develop
          ↓
Notificar al equipo
          ↓
Revisión: Lucas / Josué
          ↓
Correcciones si existen
          ↓
Aprobación
          ↓
Merge a develop
          ↓
Mover historia a "Terminado"
```

---

## 📌 Reglas importantes

- No desarrollar directamente en `main`.
- No desarrollar directamente en `develop`.
- Todo cambio funcional debe entrar mediante Pull Request.
- Los Pull Requests deben apuntar a `develop`.
- No hacer merge sin revisión.
- Mantener Trello actualizado con el estado real de las historias.
- No subir contraseñas, tokens, archivos `.env` ni otros secretos al repositorio.

---

## 🌿 Estructura de ramas

```text
main
 ↑
develop
 ↑
feature/S1-02-registro-clientes
feature/S1-03-lesiones
feature/S1-04-maquinas
```

- `main`: representa la versión estable del proyecto.
- `develop`: representa la versión de integración del equipo.
- `feature/*`: ramas creadas desde `develop` para implementar historias de usuario.





# Pulse Gym

Sistema de gestión de gimnasio. Hoy permite **iniciar sesión, registrarse y que cada rol vea solo lo que le corresponde.**
El resto de pantallas ya están conectadas al login, pero todavía muestran datos de ejemplo
(se irán conectando poco a poco).

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
│   │   ├── models/              Tablas: sedes, roles, estados_usuario, usuarios, historial_estado_usuario, clientes
│   │   ├── schemas/             Qué datos entran y salen de la API (y sus validaciones)
│   │   ├── services/            Reglas de negocio (crear usuario, cambiar estado…)
│   │   └── api/
│   │       ├── deps.py          "Porteros": ¿quién eres? ¿tienes la llave?
│   │       └── routes/          Endpoints: auth, usuarios, roles, clientes
│   └── tests/                   50 pruebas automáticas
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

## API

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
| GET | `/api/clientes?buscar=` | Dueño, recepción, entrenador | Listado de clientes (busca por nombre o carnet) |
| GET | `/api/clientes/{id}` | Dueño, recepción, entrenador | Ficha de un cliente |
| POST | `/api/clientes` | Dueño, recepción | Registrar ficha (el carnet no se puede repetir) |
| PATCH | `/api/clientes/{id}` | Dueño, recepción | Editar ficha |

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
pytest -q          # 50 pruebas: login, registro, permisos por rol, cambios de estado, ficha de cliente
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

## Pendientes

- **Guardar el consentimiento**: hoy se exige al registrarse, pero tu esquema aún no tiene dónde guardarlo.
  Lo ideal es agregar `consentimiento_salud_at` en la tabla de clientes cuando hagamos ese módulo.
- **Paso 2 del registro**: peso, altura (IMC), lesiones y objetivo → módulo Clientes.
- **Restablecer contraseña** (por el dueño o por correo).
- **Límite de intentos de login** (bloquear tras varios intentos fallidos).
- **Migraciones con Alembic** en lugar de crear tablas al iniciar.
