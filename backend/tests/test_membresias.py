"""REQ-64 — Cálculo automático de vencimiento de membresía según plan."""
from datetime import date, timedelta

import pytest

from app.services.membresia_service import calcular_estado, calcular_vencimiento

ADMIN, RECEPCION, ENTRENADOR, CLIENTE = (
    "carlos@pulsegym.com", "pati@pulsegym.com", "javier@pulsegym.com", "daniela@pulsegym.com",
)


def plan_id(client, headers, nombre):
    return next(p["id"] for p in client.get("/api/planes", headers=headers).json() if p["nombre"] == nombre)


def cliente_nuevo(client, headers, carnet="9000001 LP"):
    r = client.post("/api/clientes", headers=headers, json={
        "nombre": "Marco Quispe", "carnet": carnet, "fecha_nacimiento": "1998-05-20",
        "peso_kg": 72, "altura_cm": 174,
    })
    return r.json()["id"]


def pagar(client, headers, cliente_id, plan, fecha_pago=None):
    cuerpo = {"cliente_id": cliente_id, "plan_id": plan_id(client, headers, plan)}
    if fecha_pago:
        cuerpo["fecha_pago"] = fecha_pago.isoformat()
    return client.post("/api/membresias", headers=headers, json=cuerpo)


# ---- Criterio 1: el vencimiento se calcula según la duración del plan ----

@pytest.mark.parametrize("pago, meses, vence", [
    (date(2026, 9, 1), 1, date(2026, 9, 30)),
    (date(2026, 7, 1), 3, date(2026, 9, 30)),
    (date(2026, 4, 1), 6, date(2026, 9, 30)),
    (date(2026, 1, 31), 1, date(2026, 2, 27)),    # febrero no tiene día 31
    (date(2026, 11, 15), 3, date(2027, 2, 14)),   # cruza de año
    (date(2024, 8, 29), 6, date(2025, 2, 27)),
])
def test_vencimiento_segun_fecha_de_pago_y_duracion(pago, meses, vence):
    assert calcular_vencimiento(pago, meses) == vence


def test_al_registrar_el_pago_el_sistema_calcula_el_vencimiento(client, entrar):
    h = entrar(RECEPCION)
    r = pagar(client, h, cliente_nuevo(client, h), "Trimestral", date(2026, 7, 1))
    assert r.status_code == 201, r.text
    m = r.json()
    assert m["plan"] == "Trimestral" and m["fecha_pago"] == "2026-07-01"
    assert m["fecha_inicio"] == "2026-07-01" and m["fecha_vencimiento"] == "2026-09-30"


def test_sin_fecha_de_pago_se_usa_hoy(client, entrar):
    h = entrar(RECEPCION)
    m = pagar(client, h, cliente_nuevo(client, h), "Mensual").json()
    assert m["fecha_pago"] == date.today().isoformat()
    assert m["estado"] == "vigente" and m["dias_restantes"] >= 27


def test_el_vencimiento_no_se_puede_enviar_a_mano(client, entrar):
    h = entrar(RECEPCION)
    cuerpo = {"cliente_id": cliente_nuevo(client, h), "plan_id": plan_id(client, h, "Mensual"),
              "fecha_vencimiento": "2030-01-01"}
    assert client.post("/api/membresias", headers=h, json=cuerpo).status_code == 422


@pytest.mark.parametrize("cuerpo", [
    {"cliente_id": 9999, "plan_id": 1},
    {"cliente_id": 1, "plan_id": 9999},
])
def test_cliente_o_plan_inexistente(client, entrar, cuerpo):
    assert client.post("/api/membresias", headers=entrar(RECEPCION), json=cuerpo).status_code == 404


def test_rechaza_fecha_de_pago_futura(client, entrar):
    h = entrar(RECEPCION)
    r = pagar(client, h, cliente_nuevo(client, h), "Mensual", date.today() + timedelta(days=1))
    assert r.status_code == 422


# ---- Criterio 2: mostrar clientes próximos a vencer o vencidos ----

@pytest.mark.parametrize("dias, estado", [
    (-1, "vencida"), (0, "por_vencer"), (7, "por_vencer"), (8, "vigente"), (90, "vigente"),
])
def test_estado_segun_dias_para_vencer(dias, estado):
    hoy = date(2026, 10, 1)
    assert calcular_estado(hoy + timedelta(days=dias), hoy) == estado


def test_el_listado_muestra_por_vencer_y_vencidos(client, entrar):
    h = entrar(RECEPCION)
    hoy = date.today()
    por_vencer = cliente_nuevo(client, h, "9000001 LP")
    vencida = cliente_nuevo(client, h, "9000002 LP")
    vigente = cliente_nuevo(client, h, "9000003 LP")
    pagar(client, h, por_vencer, "Mensual", hoy - timedelta(days=26))   # vence en 4 días
    pagar(client, h, vencida, "Mensual", hoy - timedelta(days=60))      # venció hace ~30 días
    pagar(client, h, vigente, "Semestral", hoy)

    def ids(estado):
        r = client.get("/api/membresias", headers=h, params={"estado": estado})
        assert r.status_code == 200
        return [m["cliente_id"] for m in r.json()]

    assert por_vencer in ids("por_vencer") and por_vencer not in ids("vencida")
    assert vencida in ids("vencida") and vencida not in ids("por_vencer")
    assert vigente in ids("vigente") and vigente not in ids("por_vencer") + ids("vencida")


def test_los_datos_de_ejemplo_traen_los_tres_estados(client, entrar):
    estados = {m["estado"] for m in client.get("/api/membresias", headers=entrar(RECEPCION)).json()}
    assert estados == {"vigente", "por_vencer", "vencida"}


def test_el_listado_va_ordenado_por_vencimiento(client, entrar):
    fechas = [m["fecha_vencimiento"] for m in client.get("/api/membresias", headers=entrar(RECEPCION)).json()]
    assert fechas == sorted(fechas)


def test_una_renovacion_reemplaza_a_la_vencida_en_el_listado(client, entrar):
    h = entrar(RECEPCION)
    c = cliente_nuevo(client, h)
    pagar(client, h, c, "Mensual", date.today() - timedelta(days=60))
    assert c in [m["cliente_id"] for m in client.get("/api/membresias", headers=h, params={"estado": "vencida"}).json()]

    pagar(client, h, c, "Trimestral")  # renueva hoy
    assert c not in [m["cliente_id"] for m in client.get("/api/membresias", headers=h, params={"estado": "vencida"}).json()]
    actual = [m for m in client.get("/api/membresias", headers=h).json() if m["cliente_id"] == c]
    assert len(actual) == 1 and actual[0]["plan"] == "Trimestral" and actual[0]["estado"] == "vigente"
    # el historial conserva ambos pagos
    assert len(client.get("/api/membresias", headers=h, params={"cliente_id": c}).json()) == 2


def test_estado_invalido_se_rechaza(client, entrar):
    assert client.get("/api/membresias", headers=entrar(RECEPCION), params={"estado": "otro"}).status_code == 422


# ---- Permisos ----

def test_recepcion_y_dueno_registran_pagos_y_entrenador_no(client, entrar):
    h = entrar(RECEPCION)
    c = cliente_nuevo(client, h)
    assert pagar(client, entrar(ADMIN), c, "Mensual").status_code == 201
    assert pagar(client, h, c, "Mensual").status_code == 201
    r = client.post("/api/membresias", headers=entrar(ENTRENADOR), json={"cliente_id": c, "plan_id": 1})
    assert r.status_code == 403


def test_entrenador_y_cliente_no_ven_membresias(client, entrar):
    assert client.get("/api/membresias", headers=entrar(ENTRENADOR)).status_code == 403
    assert client.get("/api/membresias", headers=entrar(CLIENTE)).status_code == 403
    assert client.get("/api/planes", headers=entrar(CLIENTE)).status_code == 403
    assert client.get("/api/membresias").status_code == 401


def test_catalogo_de_planes(client, entrar):
    planes = client.get("/api/planes", headers=entrar(RECEPCION)).json()
    assert [(p["nombre"], p["duracion_meses"], p["precio"]) for p in planes] == [
        ("Mensual", 1, 150), ("Trimestral", 3, 400), ("Semestral", 6, 700),
    ]


# ---- Revisión: "hoy" según la zona del gimnasio, fechas absurdas y año bisiesto ----

def test_hoy_usa_la_zona_horaria_del_gimnasio(monkeypatch):
    from datetime import datetime, timezone

    from app.core import tiempo

    class Falso(datetime):
        @classmethod
        def now(cls, tz=None):  # 02:30 UTC del 9 oct = 22:30 del 8 oct en La Paz (UTC-4)
            return datetime(2026, 10, 9, 2, 30, tzinfo=timezone.utc).astimezone(tz)

    monkeypatch.setattr(tiempo, "datetime", Falso)
    assert tiempo.hoy() == date(2026, 10, 8)


def test_rechaza_fecha_de_pago_muy_antigua(client, entrar):
    h = entrar(RECEPCION)
    c = cliente_nuevo(client, h)
    assert pagar(client, h, c, "Mensual", date(2002, 3, 1)).status_code == 422
    assert pagar(client, h, c, "Mensual", date.today() - timedelta(days=366)).status_code == 201


def test_vencimiento_en_ano_bisiesto():
    assert calcular_vencimiento(date(2024, 1, 31), 1) == date(2024, 2, 28)  # 29 feb - 1 día
    assert calcular_vencimiento(date(2024, 1, 30), 1) == date(2024, 2, 28)
    assert calcular_vencimiento(date(2023, 12, 31), 1) == date(2024, 1, 30)


# ---- Renovación: no se pierden los días que le quedaban ----

def test_renovar_antes_de_vencer_suma_los_dias_que_le_quedaban(client, entrar):
    h = entrar(RECEPCION)
    c = cliente_nuevo(client, h)
    primera = pagar(client, h, c, "Mensual", date.today() - timedelta(days=26)).json()  # vence en 4 días
    segunda = pagar(client, h, c, "Mensual").json()  # renueva hoy, antes de vencer
    assert segunda["fecha_pago"] == date.today().isoformat()
    assert segunda["fecha_inicio"] == (date.fromisoformat(primera["fecha_vencimiento"]) + timedelta(days=1)).isoformat()
    assert segunda["fecha_vencimiento"] == calcular_vencimiento(date.fromisoformat(segunda["fecha_inicio"]), 1).isoformat()
    assert segunda["dias_restantes"] > primera["dias_restantes"] + 27


def test_renovar_el_mismo_dia_del_vencimiento_empieza_manana(client, entrar):
    h = entrar(RECEPCION)
    c = cliente_nuevo(client, h)
    # un pago de hace 27 a 31 días cuyo último día de acceso es justo hoy
    pago = next((date.today() - timedelta(days=d) for d in range(27, 32)
                 if calcular_vencimiento(date.today() - timedelta(days=d), 1) == date.today()), None)
    if pago is None:
        pytest.skip("hoy no puede ser el último día de un plan mensual (fin de mes corto)")
    primera = pagar(client, h, c, "Mensual", pago).json()
    assert primera["dias_restantes"] == 0  # hoy es su último día
    assert pagar(client, h, c, "Mensual").json()["fecha_inicio"] == (date.today() + timedelta(days=1)).isoformat()


def test_renovar_una_vencida_empieza_el_dia_del_pago(client, entrar):
    h = entrar(RECEPCION)
    c = cliente_nuevo(client, h)
    pagar(client, h, c, "Mensual", date.today() - timedelta(days=90))
    nueva = pagar(client, h, c, "Mensual").json()
    assert nueva["fecha_inicio"] == date.today().isoformat() and nueva["estado"] == "vigente"


def test_renovaciones_seguidas_se_encadenan_y_el_pago_nuevo_nunca_queda_oculto(client, entrar):
    h = entrar(RECEPCION)
    c = cliente_nuevo(client, h)
    pagar(client, h, c, "Semestral")
    corta = pagar(client, h, c, "Mensual").json()  # menor que la vigente, pero se suma al final
    actual = [m for m in client.get("/api/membresias", headers=h).json() if m["cliente_id"] == c]
    assert len(actual) == 1 and actual[0]["id"] == corta["id"]
    historial = client.get("/api/membresias", headers=h, params={"cliente_id": c}).json()
    for anterior, siguiente in zip(historial, historial[1:]):
        assert siguiente["fecha_inicio"] == (date.fromisoformat(anterior["fecha_vencimiento"]) + timedelta(days=1)).isoformat()


# ---- Días restantes en la app del cliente ----

def test_el_cliente_ve_su_membresia_y_sus_dias_restantes(client, entrar):
    m = client.get("/api/membresias/mia", headers=entrar(CLIENTE)).json()
    assert m["cliente_nombre"] == "Daniela Vargas" and m["plan"] == "Trimestral"
    assert m["estado"] == "vigente" and m["dias_restantes"] > 60


def test_cliente_sin_pagos_recibe_null(client, entrar):
    client.post("/api/auth/registro", json={
        "nombre": "Nuevo Cliente", "email": "nuevo@correo.com", "password": "Pulse2026!", "acepta_consentimiento": True,
    })
    r = client.get("/api/membresias/mia", headers=entrar("nuevo@correo.com"))
    assert r.status_code == 200 and r.json() is None


def test_solo_el_cliente_usa_mia(client, entrar):
    for personal in (ADMIN, RECEPCION, ENTRENADOR):
        assert client.get("/api/membresias/mia", headers=entrar(personal)).status_code == 403
    assert client.get("/api/membresias/mia").status_code == 401
