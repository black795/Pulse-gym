"""App del cliente: cada uno ve solo sus propios datos reales (ficha, membresía, lesiones y asistencia)."""
from datetime import date, datetime, timedelta

import pytest
from sqlalchemy import select

from app.core.tiempo import hoy
from app.db.session import SessionLocal
from app.models import Usuario
from app.services import asistencia_service, cliente_service, mi_cuenta_service
from app.services.mi_cuenta_service import calcular_racha
from tests.test_clientes import ADMIN, CLIENTE, ENTRENADOR, RECEPCION, ficha

NUEVO = "nuevo@correo.com"


def registrar_cuenta(client, email=NUEVO):
    r = client.post("/api/auth/registro", json={
        "nombre": "Luis Mamani", "email": email, "password": "Pulse2026!", "acepta_consentimiento": True,
    })
    assert r.status_code in (200, 201), r.text


def mi_cuenta(client, entrar, email):
    r = client.get("/api/mi-cuenta", headers=entrar(email))
    assert r.status_code == 200, r.text
    return r.json()


def id_de(client, headers, nombre):
    return next(c["id"] for c in client.get("/api/clientes", headers=headers).json() if c["nombre"] == nombre)


def test_el_cliente_ve_su_ficha_membresia_y_asistencia(client, entrar):
    c = mi_cuenta(client, entrar, CLIENTE)
    assert c["hoy"] == hoy().isoformat()
    assert c["ficha"]["nombre"] == "Daniela Vargas" and c["ficha"]["peso_kg"] == 58 and c["ficha"]["objetivo"] == "Fuerza"
    assert c["membresia"]["plan"] == "Trimestral" and c["membresia"]["estado"] == "vigente"
    assert c["ultima_asistencia"] == (hoy() - timedelta(days=1)).isoformat()  # datos de ejemplo: vino ayer
    assert c["racha_dias"] == 2  # ayer y anteayer
    assert c["lesiones_activas"] == []


def test_la_semana_va_de_lunes_a_domingo_y_marca_los_dias_asistidos(client, entrar):
    c = mi_cuenta(client, entrar, CLIENTE)
    dias = [date.fromisoformat(d["fecha"]) for d in c["semana"]]
    assert len(dias) == 7 and dias[0].weekday() == 0 and dias[-1].weekday() == 6
    assert dias[0] <= hoy() <= dias[-1]
    ayer = hoy() - timedelta(days=1)
    for d in c["semana"]:
        if date.fromisoformat(d["fecha"]) == ayer:
            assert d["asistio"] is True
        if date.fromisoformat(d["fecha"]) >= hoy():
            assert d["asistio"] is False


def test_un_check_in_de_hoy_aparece_de_inmediato(client, entrar):
    antes = mi_cuenta(client, entrar, CLIENTE)
    h = entrar(RECEPCION)
    daniela = id_de(client, h, "Daniela Vargas")
    assert client.post("/api/asistencias", headers=h, json={"cliente_id": daniela}).status_code == 201
    c = mi_cuenta(client, entrar, CLIENTE)
    assert c["ultima_asistencia"] == hoy().isoformat()
    assert c["racha_dias"] == antes["racha_dias"] + 1
    assert c["asistencias_mes"] == antes["asistencias_mes"] + 1
    assert next(d for d in c["semana"] if d["fecha"] == hoy().isoformat())["asistio"] is True


def test_una_entrada_anulada_no_cuenta_para_el_cliente(client, entrar):
    antes = mi_cuenta(client, entrar, CLIENTE)
    h = entrar(RECEPCION)
    a = client.post("/api/asistencias", headers=h, json={"cliente_id": id_de(client, h, "Daniela Vargas")}).json()
    client.delete(f"/api/asistencias/{a['id']}", headers=h)
    despues = mi_cuenta(client, entrar, CLIENTE)
    assert despues["racha_dias"] == antes["racha_dias"] and despues["asistencias_mes"] == antes["asistencias_mes"]


def test_ve_sus_lesiones_activas_pero_no_las_resueltas_ni_las_de_otros(client, entrar):
    h = entrar(ENTRENADOR)
    daniela, emerson = id_de(client, h, "Daniela Vargas"), id_de(client, h, "Emerson Choque")
    rodilla = client.post(f"/api/clientes/{daniela}/lesiones", headers=h, json={"tipo": "lesion", "nombre": "Rodilla derecha"}).json()
    hombro = client.post(f"/api/clientes/{daniela}/lesiones", headers=h, json={"tipo": "limitacion", "nombre": "Hombro"}).json()
    client.post(f"/api/clientes/{emerson}/lesiones", headers=h, json={"tipo": "lesion", "nombre": "Espalda"})
    client.patch(f"/api/lesiones/{hombro['id']}", headers=h, json={"estado": "resuelta"})

    assert mi_cuenta(client, entrar, CLIENTE)["lesiones_activas"] == [
        {"id": rodilla["id"], "tipo": "lesion", "nombre": "Rodilla derecha"},
    ]


def test_cuenta_recien_registrada_sin_ficha_recibe_todo_vacio(client, entrar):
    registrar_cuenta(client)
    c = mi_cuenta(client, entrar, NUEVO)
    assert c["ficha"] is None and c["membresia"] is None and c["lesiones_activas"] == []
    assert c["racha_dias"] == 0 and c["asistencias_mes"] == 0 and c["ultima_asistencia"] is None
    assert len(c["semana"]) == 7 and not any(d["asistio"] for d in c["semana"])


def test_cuando_recepcion_crea_la_ficha_con_su_correo_la_cuenta_queda_enlazada(client, entrar):
    registrar_cuenta(client)
    r = client.post("/api/clientes", headers=entrar(RECEPCION), json=ficha(nombre="Luis Mamani", email="Nuevo@Correo.com"))
    assert r.status_code == 201
    c = mi_cuenta(client, entrar, NUEVO)
    assert c["ficha"]["id"] == r.json()["id"] and c["ficha"]["carnet"] == "8899001 LP"
    assert c["membresia"] is None


@pytest.mark.parametrize("dias_asistidos, racha", [
    ([], 0), ([0], 1), ([1], 1), ([2], 0), ([0, 1, 2], 3), ([1, 2, 3], 3), ([0, 2, 3], 1), ([1, 3, 4], 1),
])
def test_racha_de_dias_seguidos(dias_asistidos, racha):
    hoy_fijo = date(2026, 10, 8)
    assert calcular_racha({hoy_fijo - timedelta(days=d) for d in dias_asistidos}, hoy_fijo) == racha


def test_asistencias_del_mes_solo_cuenta_el_mes_en_curso(client):
    with SessionLocal() as db:
        usuario = db.scalar(select(Usuario).where(Usuario.email == CLIENTE))
        cliente = cliente_service.de_usuario(db, usuario)
        for momento in (datetime(2031, 3, 1, 15, 0), datetime(2031, 3, 9, 15, 0), datetime(2031, 2, 27, 15, 0)):
            asistencia_service.registrar(db, cliente.id, momento=momento)
        c = mi_cuenta_service.resumen(db, usuario, hoy=date(2031, 3, 10))
    assert c.asistencias_mes == 2 and c.ultima_asistencia == date(2031, 3, 9) and c.racha_dias == 1
    assert [d.asistio for d in c.semana] == [False] * 7  # el 9 de marzo de 2031 fue domingo, de la semana anterior


@pytest.mark.parametrize("email", [ADMIN, RECEPCION, ENTRENADOR])
def test_el_personal_no_usa_mi_cuenta(client, entrar, email):
    assert client.get("/api/mi-cuenta", headers=entrar(email)).status_code == 403


def test_sin_sesion(client):
    assert client.get("/api/mi-cuenta").status_code == 401
