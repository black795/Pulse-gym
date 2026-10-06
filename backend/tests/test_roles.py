import pytest

# (rol, correo) del seed
STAFF_NO_ADMIN = [("recepcionista", "pati@pulsegym.com"), ("entrenador", "javier@pulsegym.com"),
                  ("cliente", "daniela@pulsegym.com")]


def _id(client, headers, email):
    return next(u["id"] for u in client.get("/api/usuarios", headers=headers).json() if u["email"] == email)


@pytest.mark.parametrize("rol,email", STAFF_NO_ADMIN)
def test_solo_el_administrador_gestiona_usuarios_y_roles(client, entrar, rol, email):
    h = entrar(email)
    assert client.get("/api/usuarios", headers=h).status_code == 403
    assert client.get("/api/roles", headers=h).status_code == 403
    assert client.post("/api/usuarios", headers=h, json={
        "nombre": "Nuevo", "email": "n@pulsegym.com", "password": "Clave1234", "rol": "entrenador"}).status_code == 403


def test_sin_token_es_401_no_403(client):
    assert client.get("/api/usuarios").status_code == 401


def test_catalogo_de_roles_tiene_los_cuatro_roles(client, entrar):
    r = client.get("/api/roles", headers=entrar("carlos@pulsegym.com"))
    assert [x["nombre"] for x in r.json()] == ["administrador", "recepcionista", "entrenador", "cliente"]


def test_permisos_por_rol_coinciden_con_el_diseno(client, entrar):
    permisos = lambda e: set(client.get("/api/auth/me", headers=entrar(e)).json()["permisos"])
    recep, entre, clie = permisos("pati@pulsegym.com"), permisos("javier@pulsegym.com"), permisos("daniela@pulsegym.com")
    assert "pagos:gestionar" in recep and "rutinas:gestionar" not in recep
    assert "rutinas:gestionar" in entre and "pagos:gestionar" not in entre
    assert "reportes:ver" not in recep | entre | clie
    assert "dashboard:ver" not in clie and "rutina_propia:ver" in clie


def test_admin_crea_personal_pero_no_puede_crear_otro_rol_invalido(client, entrar):
    h = entrar("carlos@pulsegym.com")
    ok = client.post("/api/usuarios", headers=h, json={
        "nombre": "Nuevo Coach", "email": "coach@pulsegym.com", "password": "Clave1234", "rol": "entrenador"})
    assert ok.status_code == 201 and ok.json()["rol"] == "entrenador"
    # y ese nuevo entrenador ya puede entrar
    assert client.post("/api/auth/login", json={"email": "coach@pulsegym.com", "password": "Clave1234"}).status_code == 200
    # "cliente" no se da de alta por aquí (los clientes se auto-registran o los crea recepción más adelante)
    mal = client.post("/api/usuarios", headers=h, json={
        "nombre": "X", "email": "x@pulsegym.com", "password": "Clave1234", "rol": "cliente"})
    assert mal.status_code == 422


def test_cambiar_rol_tiene_efecto_inmediato(client, entrar):
    admin = entrar("carlos@pulsegym.com")
    pati = entrar("pati@pulsegym.com")
    uid = _id(client, admin, "pati@pulsegym.com")
    assert client.patch(f"/api/usuarios/{uid}/rol", headers=admin, json={"rol": "entrenador"}).status_code == 200
    assert client.get("/api/auth/me", headers=pati).json()["rol"] == "entrenador"


def test_el_admin_no_puede_cambiarse_rol_ni_estado_a_si_mismo(client, entrar):
    h = entrar("carlos@pulsegym.com")
    yo = client.get("/api/auth/me", headers=h).json()["id"]
    assert client.patch(f"/api/usuarios/{yo}/rol", headers=h, json={"rol": "cliente"}).status_code == 400
    assert client.patch(f"/api/usuarios/{yo}/estado", headers=h, json={"estado": "inactivo"}).status_code == 400


def test_historial_de_estado_deja_un_solo_estado_vigente(client, entrar):
    from sqlalchemy import select
    from app.db.session import SessionLocal
    from app.models import HistorialEstadoUsuario

    h = entrar("carlos@pulsegym.com")
    uid = _id(client, h, "javier@pulsegym.com")
    client.patch(f"/api/usuarios/{uid}/estado", headers=h, json={"estado": "inactivo", "motivo": "vacaciones"})
    client.patch(f"/api/usuarios/{uid}/estado", headers=h, json={"estado": "activo"})
    repetido = client.patch(f"/api/usuarios/{uid}/estado", headers=h, json={"estado": "activo"})
    assert repetido.status_code == 400

    with SessionLocal() as db:
        filas = db.scalars(select(HistorialEstadoUsuario).where(HistorialEstadoUsuario.usuario_id == uid)).all()
        assert len(filas) == 3  # alta, inactivo, activo
        assert sum(1 for f in filas if f.hasta is None) == 1


def test_listar_solo_personal_excluye_clientes(client, entrar):
    h = entrar("carlos@pulsegym.com")
    roles = {u["rol"] for u in client.get("/api/usuarios?solo_personal=true", headers=h).json()}
    assert "cliente" not in roles and roles == {"administrador", "recepcionista", "entrenador"}
