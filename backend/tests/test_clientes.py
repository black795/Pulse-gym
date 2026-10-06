"""REQ-01 — Registro de ficha de cliente. Hay al menos una prueba por criterio de aceptación."""
from datetime import date

import pytest

from app.services.cliente_service import calcular_edad

ADMIN, RECEPCION, ENTRENADOR, CLIENTE = (
    "carlos@pulsegym.com", "pati@pulsegym.com", "javier@pulsegym.com", "daniela@pulsegym.com",
)
OBLIGATORIOS = ["nombre", "carnet", "fecha_nacimiento", "peso_kg", "altura_cm"]


def ficha(**cambios) -> dict:
    base = {"nombre": "Marco Quispe", "carnet": "8899001 LP", "fecha_nacimiento": "1998-05-20",
            "peso_kg": 72.5, "altura_cm": 174}
    return {**base, **cambios}


def crear(client, headers, **cambios):
    return client.post("/api/clientes", headers=headers, json=ficha(**cambios))


# ---- Criterio 1: se puede crear un cliente desde el módulo de clientes ----

def test_recepcion_crea_una_ficha_completa(client, entrar):
    r = crear(client, entrar(RECEPCION), telefono="+591 70000001", email="Marco@Correo.com", objetivo="Fuerza")
    assert r.status_code == 201, r.text
    c = r.json()
    assert c["id"] > 0 and c["nombre"] == "Marco Quispe" and c["carnet"] == "8899001 LP"
    assert c["telefono"] == "+591 70000001" and c["email"] == "marco@correo.com"
    assert c["peso_kg"] == 72.5 and c["altura_cm"] == 174 and c["objetivo"] == "Fuerza"
    assert c["edad"] == calcular_edad(date(1998, 5, 20))


def test_la_edad_se_calcula_desde_la_fecha_de_nacimiento():
    assert calcular_edad(date(2000, 6, 15), hoy=date(2026, 6, 14)) == 25  # aún no cumple
    assert calcular_edad(date(2000, 6, 15), hoy=date(2026, 6, 15)) == 26  # cumple hoy


# ---- Criterio 2: los campos obligatorios se validan antes de guardar ----

@pytest.mark.parametrize("campo", OBLIGATORIOS)
def test_no_guarda_si_falta_un_obligatorio_e_indica_cual(client, entrar, campo):
    h = entrar(RECEPCION)
    datos = ficha()
    del datos[campo]
    r = client.post("/api/clientes", headers=h, json=datos)
    assert r.status_code == 422
    assert campo in [e["loc"][-1] for e in r.json()["detail"]]
    assert all(c["carnet"] != "8899001 LP" for c in client.get("/api/clientes", headers=h).json())


def test_telefono_y_correo_son_opcionales(client, entrar):
    r = crear(client, entrar(RECEPCION), telefono="", email=None)
    assert r.status_code == 201
    assert r.json()["telefono"] is None and r.json()["email"] is None


@pytest.mark.parametrize("cambio", [
    {"peso_kg": 5}, {"peso_kg": 900}, {"altura_cm": 20}, {"altura_cm": 400},
    {"fecha_nacimiento": "2999-01-01"}, {"fecha_nacimiento": "1800-01-01"},
    {"nombre": " "}, {"carnet": "1"}, {"email": "no-es-correo"}, {"rol": "administrador"},
])
def test_rechaza_valores_que_no_tienen_sentido(client, entrar, cambio):
    assert crear(client, entrar(RECEPCION), **cambio).status_code == 422


# ---- Criterio 3: se evita registrar un cliente duplicado según el carnet ----

def test_no_permite_dos_clientes_con_el_mismo_carnet(client, entrar):
    h = entrar(RECEPCION)
    assert crear(client, h).status_code == 201
    repetido = crear(client, h, nombre="Otra Persona")
    assert repetido.status_code == 409 and "carnet" in repetido.json()["detail"]
    # mismo carnet escrito con otros espacios o minúsculas
    assert crear(client, h, nombre="Otra Persona", carnet="  8899001   lp ").status_code == 409
    assert sum(c["carnet"] == "8899001 LP" for c in client.get("/api/clientes", headers=h).json()) == 1


# ---- Criterio 4: al guardar, aparece en el listado y su ficha puede consultarse ----

def test_el_cliente_nuevo_aparece_en_el_listado_y_su_ficha_se_consulta(client, entrar):
    h = entrar(RECEPCION)
    nuevo = crear(client, h).json()
    assert nuevo["id"] in [c["id"] for c in client.get("/api/clientes", headers=h).json()]
    ficha_guardada = client.get(f"/api/clientes/{nuevo['id']}", headers=h)
    assert ficha_guardada.status_code == 200 and ficha_guardada.json() == nuevo
    # el entrenador también la ve de inmediato
    assert client.get(f"/api/clientes/{nuevo['id']}", headers=entrar(ENTRENADOR)).status_code == 200


def test_el_listado_se_puede_buscar_por_nombre_o_carnet(client, entrar):
    h = entrar(RECEPCION)
    crear(client, h)
    nombres = lambda q: [c["nombre"] for c in client.get(f"/api/clientes?buscar={q}", headers=h).json()]
    assert nombres("quispe") == ["Marco Quispe"]
    assert nombres("8899001") == ["Marco Quispe"]
    assert nombres("no-existe") == []


def test_una_ficha_que_no_existe_da_404(client, entrar):
    assert client.get("/api/clientes/99999", headers=entrar(RECEPCION)).status_code == 404


# ---- Criterio 5: los datos se editan únicamente según los permisos del usuario ----

@pytest.mark.parametrize("email", [ADMIN, RECEPCION])
def test_dueno_y_recepcion_pueden_editar(client, entrar, email):
    cid = crear(client, entrar(RECEPCION)).json()["id"]
    r = client.patch(f"/api/clientes/{cid}", headers=entrar(email), json={"telefono": "+591 71111111", "peso_kg": 70})
    assert r.status_code == 200
    assert r.json()["telefono"] == "+591 71111111" and r.json()["peso_kg"] == 70
    assert r.json()["nombre"] == "Marco Quispe"  # lo que no se envía no cambia


def test_el_entrenador_ve_pero_no_crea_ni_edita(client, entrar):
    cid = crear(client, entrar(RECEPCION)).json()["id"]
    h = entrar(ENTRENADOR)
    assert client.get("/api/clientes", headers=h).status_code == 200
    assert crear(client, h, carnet="5550001 SC").status_code == 403
    assert client.patch(f"/api/clientes/{cid}", headers=h, json={"peso_kg": 60}).status_code == 403
    assert client.get(f"/api/clientes/{cid}", headers=h).json()["peso_kg"] == 72.5


def test_un_cliente_de_la_app_no_entra_al_modulo(client, entrar):
    cid = crear(client, entrar(RECEPCION)).json()["id"]
    h = entrar(CLIENTE)
    assert client.get("/api/clientes", headers=h).status_code == 403
    assert client.get(f"/api/clientes/{cid}", headers=h).status_code == 403
    assert crear(client, h, carnet="5550002 SC").status_code == 403
    assert client.patch(f"/api/clientes/{cid}", headers=h, json={"peso_kg": 60}).status_code == 403


def test_sin_sesion_no_se_ve_ni_se_toca_nada(client):
    assert client.get("/api/clientes").status_code == 401
    assert client.post("/api/clientes", json=ficha()).status_code == 401
    assert client.patch("/api/clientes/1", json={"peso_kg": 60}).status_code == 401


def test_al_editar_no_se_puede_vaciar_un_obligatorio_ni_repetir_carnet(client, entrar):
    h = entrar(RECEPCION)
    cid = crear(client, h).json()["id"]
    crear(client, h, nombre="Lucía Mamani", carnet="4440001 OR")
    assert client.patch(f"/api/clientes/{cid}", headers=h, json={"nombre": None}).status_code == 422
    assert client.patch(f"/api/clientes/{cid}", headers=h, json={"peso_kg": 1}).status_code == 422
    assert client.patch(f"/api/clientes/{cid}", headers=h, json={"carnet": "4440001 or"}).status_code == 409
    assert client.patch(f"/api/clientes/{cid}", headers=h, json={"carnet": "8899001 lp"}).status_code == 200
