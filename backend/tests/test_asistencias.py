"""REQ-49 — Registro de asistencia / check-in por sesión."""
from datetime import date, datetime, timedelta

import pytest

from app.core.tiempo import a_local, hoy
from app.db.base import Base, ahora
from app.db.session import SessionLocal, engine
from app.models import Asistencia, Cliente
from app.services import asistencia_service as svc
from app.services.asistencia_service import calcular_actividad
from tests.test_clientes import ADMIN, CLIENTE, ENTRENADOR, RECEPCION, ficha


@pytest.fixture()
def cliente_id(client, entrar):
    return client.post("/api/clientes", headers=entrar(RECEPCION), json=ficha()).json()["id"]


def checkin(client, headers, cliente_id):
    return client.post("/api/asistencias", headers=headers, json={"cliente_id": cliente_id})


def entrada_pasada(cliente_id: int, dias: int = 0, minutos: int = 0) -> None:
    """Registra directamente una entrada de hace `dias` días o `minutos` minutos."""
    with SessionLocal() as db:
        svc.registrar(db, cliente_id, momento=ahora() - timedelta(days=dias, minutes=minutos))


def actividad_de(client, headers, cliente_id, **params):
    filas = client.get("/api/asistencias/actividad", headers=headers, params=params).json()
    return next((f for f in filas if f["cliente_id"] == cliente_id), None)


# ---- Criterio 1: check-in rápido ----

def test_recepcion_registra_la_entrada_solo_con_el_cliente(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    actor = client.get("/api/auth/me", headers=h).json()
    r = checkin(client, h, cliente_id)
    assert r.status_code == 201, r.text
    a = r.json()
    assert a["cliente_id"] == cliente_id and a["cliente_nombre"] == "Marco Quispe" and a["cliente_carnet"] == "8899001 LP"
    assert a["metodo"] == "manual"
    assert a["registrado_por"] == actor["id"] and a["registrado_por_nombre"] == actor["nombre"]


def test_cliente_inexistente(client, entrar):
    assert checkin(client, entrar(RECEPCION), 99999).status_code == 404


@pytest.mark.parametrize("cuerpo", [
    {}, {"cliente_id": "abc"}, {"cliente_id": 1, "fecha_hora": "2020-01-01T00:00:00"}, {"cliente_id": 1, "metodo": "qr"},
])
def test_no_acepta_datos_de_mas_ni_de_menos(client, entrar, cuerpo):
    assert client.post("/api/asistencias", headers=entrar(RECEPCION), json=cuerpo).status_code == 422


def test_un_doble_clic_no_duplica_la_entrada(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    assert checkin(client, h, cliente_id).status_code == 201
    repetido = checkin(client, h, cliente_id)
    assert repetido.status_code == 409 and "ya registró su entrada" in repetido.json()["detail"]
    assert len(client.get("/api/asistencias", headers=h, params={"cliente_id": cliente_id}).json()) == 1


def test_puede_volver_a_entrar_en_otra_sesion_del_mismo_dia(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    entrada_pasada(cliente_id, minutos=svc.MINUTOS_ENTRE_CHECKINS + 1)
    assert checkin(client, h, cliente_id).status_code == 201
    assert len(client.get("/api/asistencias", headers=h, params={"cliente_id": cliente_id}).json()) == 2


def test_justo_antes_del_limite_sigue_siendo_duplicado(client, entrar, cliente_id):
    entrada_pasada(cliente_id, minutos=svc.MINUTOS_ENTRE_CHECKINS - 1)
    assert checkin(client, entrar(RECEPCION), cliente_id).status_code == 409


# ---- Criterio 2: cada registro con fecha y hora ----

def test_cada_registro_guarda_fecha_y_hora_del_sistema(client, entrar, cliente_id):
    antes = ahora()
    a = checkin(client, entrar(RECEPCION), cliente_id).json()
    momento = datetime.fromisoformat(a["fecha_hora"])
    assert antes - timedelta(seconds=2) <= momento <= ahora() + timedelta(seconds=2)
    assert a["fecha"] == hoy().isoformat()
    assert a["hora"] == a_local(momento).strftime("%H:%M")


def test_la_fecha_es_la_del_gimnasio_no_la_del_servidor(client, cliente_id):
    """02:30 UTC del 9 de octubre todavía es 8 de octubre (22:30) en La Paz."""
    with SessionLocal() as db:
        a = svc.registrar(db, cliente_id, momento=datetime(2026, 10, 9, 2, 30))
    assert a.fecha == date(2026, 10, 8) and a.hora == "22:30"


def test_las_entradas_de_hoy_van_de_la_mas_reciente_a_la_mas_antigua(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    otro = client.post("/api/clientes", headers=h, json=ficha(carnet="7700001 LP", nombre="Ana Rojas")).json()["id"]
    checkin(client, h, cliente_id)
    checkin(client, h, otro)
    hoy_ = client.get("/api/asistencias", headers=h).json()
    assert [a["cliente_id"] for a in hoy_] == [otro, cliente_id]
    assert all(a["fecha"] == hoy().isoformat() for a in hoy_)


def test_filtro_por_fecha_e_historial_del_cliente(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    entrada_pasada(cliente_id, dias=3)
    checkin(client, h, cliente_id)
    hace_3 = (hoy() - timedelta(days=3)).isoformat()

    assert [a["cliente_id"] for a in client.get("/api/asistencias", headers=h, params={"fecha": hace_3}).json()] == [cliente_id]
    historial = client.get("/api/asistencias", headers=h, params={"cliente_id": cliente_id}).json()
    assert [a["fecha"] for a in historial] == [hoy().isoformat(), hace_3]
    solo_ese_dia = client.get("/api/asistencias", headers=h, params={"cliente_id": cliente_id, "fecha": hace_3}).json()
    assert len(solo_ese_dia) == 1
    assert client.get("/api/asistencias", headers=h, params={"cliente_id": 99999}).status_code == 404
    assert client.get("/api/asistencias", headers=h, params={"fecha": "ayer"}).status_code == 422
    assert client.get("/api/asistencias", headers=h, params={"limite": 0}).status_code == 422


def test_resumen_del_dia(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    vacio = client.get("/api/asistencias/resumen", headers=h).json()
    assert vacio["asistencias_hoy"] == 0 and vacio["clientes_hoy"] == 0 and vacio["hora_pico"] is None

    entrada_pasada(cliente_id, minutos=svc.MINUTOS_ENTRE_CHECKINS + 5)
    checkin(client, h, cliente_id)
    r = client.get("/api/asistencias/resumen", headers=h).json()
    # la entrada "pasada" puede caer en el día anterior si la prueba corre justo después de medianoche
    assert r["asistencias_hoy"] in (1, 2) and r["clientes_hoy"] == 1 and r["fecha"] == hoy().isoformat()
    assert r["hora_pico"] is not None and len(r["hora_pico"]) == len("07:00–08:00")
    assert r["promedio_diario_7_dias"] > 0


def test_hora_pico_y_promedio_semanal():
    """Tres entradas a las 07h y una a las 18h (hora de La Paz) → pico 07:00–08:00."""
    Base.metadata.drop_all(engine)  # sin datos de ejemplo: solo cuentan las entradas de esta prueba
    Base.metadata.create_all(engine)

    dia = date(2026, 10, 8)
    with SessionLocal() as db:
        ids = []
        for n in range(3):
            c = Cliente(nombre=f"Cliente {n}", carnet=f"100000{n} LP", fecha_nacimiento=date(1990, 1, 1), peso_kg=70, altura_cm=170)
            db.add(c)
            db.flush()
            ids.append(c.id)
        momentos = [datetime(2026, 10, 8, 11, 5), datetime(2026, 10, 8, 11, 40), datetime(2026, 10, 8, 11, 59),
                    datetime(2026, 10, 8, 22, 10), datetime(2026, 10, 5, 12, 0), datetime(2026, 10, 1, 12, 0)]
        for n, momento in enumerate(momentos):
            db.add(Asistencia(cliente_id=ids[n % 3], fecha_hora=momento, fecha=a_local(momento).date()))
        db.commit()
        r = svc.resumen(db, hoy=dia)
    assert r.asistencias_hoy == 4 and r.clientes_hoy == 3 and r.hora_pico == "07:00–08:00"
    assert r.promedio_diario_7_dias == round(5 / 7, 1)  # la del 1 de octubre queda fuera de los 7 días


# ---- Criterio 3: alimenta "cliente activo" y "abandono" ----

@pytest.mark.parametrize("dias, estado", [
    (None, "sin_asistencias"), (0, "activo"), (14, "activo"), (15, "en_riesgo"), (30, "en_riesgo"),
    (31, "abandono"), (400, "abandono"),
])
def test_estado_segun_dias_sin_asistir(dias, estado):
    assert calcular_actividad(dias) == estado


def test_un_cliente_nuevo_aparece_sin_asistencias_y_pasa_a_activo_al_hacer_checkin(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    antes = actividad_de(client, h, cliente_id)
    assert antes["estado"] == "sin_asistencias" and antes["dias_sin_asistir"] is None
    assert antes["ultima_asistencia"] is None and antes["asistencias_30_dias"] == 0

    a = checkin(client, h, cliente_id).json()
    despues = actividad_de(client, h, cliente_id)
    assert despues["estado"] == "activo" and despues["dias_sin_asistir"] == 0
    assert despues["ultima_asistencia"] == a["fecha_hora"] and despues["asistencias_30_dias"] == 1


@pytest.mark.parametrize("dias, estado", [(10, "activo"), (20, "en_riesgo"), (45, "abandono")])
def test_dias_sin_venir_definen_activo_riesgo_o_abandono(client, entrar, cliente_id, dias, estado):
    h = entrar(RECEPCION)
    entrada_pasada(cliente_id, dias=dias)
    fila = actividad_de(client, h, cliente_id)
    assert fila["estado"] == estado and fila["dias_sin_asistir"] in (dias, dias - 1, dias + 1)  # ±1 por la zona horaria
    assert actividad_de(client, h, cliente_id, estado=estado) is not None
    otros = {"activo", "en_riesgo", "abandono", "sin_asistencias"} - {estado}
    assert all(actividad_de(client, h, cliente_id, estado=o) is None for o in otros)


def test_un_cliente_en_abandono_vuelve_a_activo_cuando_regresa(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    entrada_pasada(cliente_id, dias=60)
    assert actividad_de(client, h, cliente_id)["estado"] == "abandono"
    checkin(client, h, cliente_id)
    fila = actividad_de(client, h, cliente_id)
    assert fila["estado"] == "activo" and fila["asistencias_30_dias"] == 1  # la de hace 60 días ya no cuenta


def test_la_actividad_incluye_a_todos_los_clientes_y_el_estado_de_su_membresia(client, entrar):
    h = entrar(RECEPCION)
    filas = client.get("/api/asistencias/actividad", headers=h).json()
    assert len(filas) == len(client.get("/api/clientes", headers=h).json())
    por_nombre = {f["cliente_nombre"]: f for f in filas}
    # datos de ejemplo: uno en cada estado
    assert por_nombre["Daniela Vargas"]["estado"] == "activo" and por_nombre["Daniela Vargas"]["asistencias_30_dias"] == 6
    assert por_nombre["Emerson Choque"]["estado"] == "en_riesgo"
    assert por_nombre["Valeria Prado"]["estado"] == "abandono"
    assert por_nombre["Daniela Vargas"]["membresia_estado"] == "vigente"
    assert por_nombre["Valeria Prado"]["membresia_estado"] == "vencida"
    # primero quien lleva más días sin venir
    dias = [f["dias_sin_asistir"] for f in filas if f["dias_sin_asistir"] is not None]
    assert dias == sorted(dias, reverse=True)


def test_estado_de_actividad_invalido(client, entrar):
    assert client.get("/api/asistencias/actividad", headers=entrar(RECEPCION), params={"estado": "x"}).status_code == 422


# ---- El check-in avisa el estado de la membresía, pero no bloquea la entrada ----

def pagar(client, headers, cliente_id, plan, fecha_pago=None):
    plan_id = next(p["id"] for p in client.get("/api/planes", headers=headers).json() if p["nombre"] == plan)
    cuerpo = {"cliente_id": cliente_id, "plan_id": plan_id}
    if fecha_pago:
        cuerpo["fecha_pago"] = fecha_pago.isoformat()
    assert client.post("/api/membresias", headers=headers, json=cuerpo).status_code == 201


def test_sin_membresia_entra_con_aviso(client, entrar, cliente_id):
    a = checkin(client, entrar(RECEPCION), cliente_id).json()
    assert a["membresia_estado"] is None and a["membresia_dias_restantes"] is None
    assert a["aviso"] == "Sin membresía registrada."


def test_con_membresia_vigente_no_hay_aviso(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    pagar(client, h, cliente_id, "Trimestral")
    a = checkin(client, h, cliente_id).json()
    assert a["membresia_estado"] == "vigente" and a["aviso"] is None and a["membresia_dias_restantes"] > 60


def test_con_membresia_vencida_entra_y_avisa(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    pagar(client, h, cliente_id, "Mensual", date.today() - timedelta(days=60))
    r = checkin(client, h, cliente_id)
    assert r.status_code == 201
    assert r.json()["membresia_estado"] == "vencida" and "vencida hace" in r.json()["aviso"]


def test_con_membresia_por_vencer_avisa_cuantos_dias_quedan(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    pagar(client, h, cliente_id, "Mensual", date.today() - timedelta(days=26))
    a = checkin(client, h, cliente_id).json()
    assert a["membresia_estado"] == "por_vencer" and a["aviso"].startswith("Su membresía vence")


# ---- Anular un check-in hecho por error ----

def test_anular_una_entrada_de_hoy(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    a = checkin(client, h, cliente_id).json()
    assert client.delete(f"/api/asistencias/{a['id']}", headers=h).status_code == 204
    assert client.delete(f"/api/asistencias/{a['id']}", headers=h).status_code == 404  # ya no existe
    assert client.get("/api/asistencias", headers=h, params={"cliente_id": cliente_id}).json() == []
    assert actividad_de(client, h, cliente_id)["estado"] == "sin_asistencias"
    assert checkin(client, h, cliente_id).status_code == 201  # la anulada ya no cuenta como duplicado


def test_no_se_puede_anular_una_entrada_de_otro_dia(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    entrada_pasada(cliente_id, dias=3)
    vieja = client.get("/api/asistencias", headers=h, params={"cliente_id": cliente_id}).json()[0]
    r = client.delete(f"/api/asistencias/{vieja['id']}", headers=h)
    assert r.status_code == 409 and "hoy" in r.json()["detail"]
    assert len(client.get("/api/asistencias", headers=h, params={"cliente_id": cliente_id}).json()) == 1


# ---- Permisos ----

@pytest.mark.parametrize("email", [ADMIN, RECEPCION])
def test_dueno_y_recepcion_registran_y_anulan(client, entrar, cliente_id, email):
    h = entrar(email)
    a = checkin(client, h, cliente_id)
    assert a.status_code == 201
    assert client.delete(f"/api/asistencias/{a.json()['id']}", headers=h).status_code == 204


def test_el_entrenador_ve_pero_no_registra_ni_anula(client, entrar, cliente_id):
    a = checkin(client, entrar(RECEPCION), cliente_id).json()
    h = entrar(ENTRENADOR)
    assert client.get("/api/asistencias", headers=h).status_code == 200
    assert client.get("/api/asistencias/resumen", headers=h).status_code == 200
    assert client.get("/api/asistencias/actividad", headers=h).status_code == 200
    assert checkin(client, h, cliente_id).status_code == 403
    assert client.delete(f"/api/asistencias/{a['id']}", headers=h).status_code == 403


def test_el_cliente_no_accede(client, entrar, cliente_id):
    h = entrar(CLIENTE)
    assert checkin(client, h, cliente_id).status_code == 403
    for ruta in ("/api/asistencias", "/api/asistencias/resumen", "/api/asistencias/actividad"):
        assert client.get(ruta, headers=h).status_code == 403
    assert client.delete("/api/asistencias/1", headers=h).status_code == 403


def test_sin_sesion(client):
    assert checkin(client, {}, 1).status_code == 401
    for ruta in ("/api/asistencias", "/api/asistencias/resumen", "/api/asistencias/actividad"):
        assert client.get(ruta).status_code == 401
    assert client.delete("/api/asistencias/1").status_code == 401


# ---- Correcciones tras la revisión del PR ----

def test_check_in_simultaneos_del_mismo_cliente_solo_crean_una_entrada(client, entrar, cliente_id):
    """Dos recepciones (o un reintento de red) a la vez: la regla de duplicados debe ser atómica."""
    from concurrent.futures import ThreadPoolExecutor

    h = entrar(RECEPCION)
    with ThreadPoolExecutor(max_workers=8) as hilos:
        codigos = list(hilos.map(lambda _: checkin(client, h, cliente_id).status_code, range(8)))
    assert sorted(codigos) == [201] + [409] * 7
    assert len(client.get("/api/asistencias", headers=h, params={"cliente_id": cliente_id}).json()) == 1


def test_limite_exacto_de_la_ventana_de_duplicados(client, cliente_id):
    base = datetime(2026, 10, 8, 14, 0)
    ventana = timedelta(minutes=svc.MINUTOS_ENTRE_CHECKINS)
    with SessionLocal() as db:
        svc.registrar(db, cliente_id, momento=base)
        for dentro in (base + ventana - timedelta(seconds=1), base - ventana + timedelta(seconds=1)):
            with pytest.raises(svc.ErrorNegocio) as error:
                svc.registrar(db, cliente_id, momento=dentro)
            assert error.value.status == 409
        svc.registrar(db, cliente_id, momento=base + ventana)  # justo en el límite ya es otra sesión


def test_si_el_reloj_retrocede_sigue_detectando_el_duplicado(client, entrar, cliente_id):
    with SessionLocal() as db:
        svc.registrar(db, cliente_id, momento=ahora() + timedelta(minutes=5))  # entrada "en el futuro"
    assert checkin(client, entrar(RECEPCION), cliente_id).status_code == 409


def test_una_entrada_anulada_no_presta_su_id_a_la_siguiente(client, entrar, cliente_id):
    """Evita que una pantalla desactualizada anule por error la entrada nueva de otro cliente."""
    h = entrar(RECEPCION)
    primera = checkin(client, h, cliente_id).json()["id"]
    client.delete(f"/api/asistencias/{primera}", headers=h)
    assert checkin(client, h, cliente_id).json()["id"] != primera


@pytest.mark.parametrize("cuerpo", [{"cliente_id": 0}, {"cliente_id": -3}, {"cliente_id": 10**30}])
def test_ids_imposibles_se_rechazan_sin_error_del_servidor(client, entrar, cuerpo):
    assert client.post("/api/asistencias", headers=entrar(RECEPCION), json=cuerpo).status_code == 422


def test_limite_maximo_del_listado(client, entrar):
    h = entrar(RECEPCION)
    assert client.get("/api/asistencias", headers=h, params={"limite": svc.LIMITE_MAXIMO}).status_code == 200
    assert client.get("/api/asistencias", headers=h, params={"limite": svc.LIMITE_MAXIMO + 1}).status_code == 422


@pytest.mark.parametrize("dias, estado", [(14, "activo"), (15, "en_riesgo"), (30, "en_riesgo"), (31, "abandono")])
def test_fronteras_de_actividad_con_fecha_fija(client, cliente_id, dias, estado):
    hoy_fijo = date(2026, 10, 8)
    with SessionLocal() as db:
        svc.registrar(db, cliente_id, momento=datetime(2026, 10, 8, 15, 0) - timedelta(days=dias))
        fila = next(f for f in svc.actividad(db, hoy=hoy_fijo) if f.cliente_id == cliente_id)
    assert fila.dias_sin_asistir == dias and fila.estado == estado
    assert fila.asistencias_30_dias == (1 if dias <= 29 else 0)  # la ventana de 30 días incluye hoy


def test_quien_nunca_asistio_va_al_final_de_la_actividad(client, entrar, cliente_id):
    filas = client.get("/api/asistencias/actividad", headers=entrar(RECEPCION)).json()
    assert filas[-1]["cliente_id"] == cliente_id and filas[-1]["estado"] == "sin_asistencias"
    assert all(f["dias_sin_asistir"] is not None for f in filas[:-1])


def test_empate_de_hora_pico_gana_la_mas_temprana(client, cliente_id):
    with SessionLocal() as db:
        otro = Cliente(nombre="Otro", carnet="5550001 LP", fecha_nacimiento=date(1990, 1, 1), peso_kg=70, altura_cm=170)
        db.add(otro)
        db.commit()
        svc.registrar(db, cliente_id, momento=datetime(2026, 3, 2, 22, 10))  # 18:10 en La Paz
        svc.registrar(db, otro.id, momento=datetime(2026, 3, 2, 12, 10))     # 08:10 en La Paz
        assert svc.resumen(db, hoy=date(2026, 3, 2)).hora_pico == "08:00–09:00"


@pytest.mark.parametrize("estado, dias, texto", [
    ("vencida", -1, "Membresía vencida ayer."), ("vencida", -15, "Membresía vencida hace 15 días."),
    ("por_vencer", 0, "Su membresía vence hoy."), ("por_vencer", 1, "Su membresía vence mañana."),
    ("por_vencer", 5, "Su membresía vence en 5 días."), ("vigente", 40, None),
])
def test_textos_del_aviso_de_membresia(estado, dias, texto):
    from types import SimpleNamespace

    assert svc.aviso_de_membresia(SimpleNamespace(estado=estado, dias_restantes=dias)) == texto
    assert svc.aviso_de_membresia(None) == "Sin membresía registrada."


def test_el_entrenador_no_recibe_el_estado_de_la_membresia(client, entrar):
    """No tiene permiso de ver membresías, así que la actividad no se lo filtra por otro camino."""
    para_entrenador = client.get("/api/asistencias/actividad", headers=entrar(ENTRENADOR)).json()
    assert para_entrenador and all(f["membresia_estado"] is None for f in para_entrenador)
    para_recepcion = client.get("/api/asistencias/actividad", headers=entrar(RECEPCION)).json()
    assert any(f["membresia_estado"] is not None for f in para_recepcion)
    assert [f["estado"] for f in para_entrenador] == [f["estado"] for f in para_recepcion]


def test_anular_deja_rastro_de_quien_y_cuando(client, entrar, cliente_id):
    h = entrar(RECEPCION)
    actor = client.get("/api/auth/me", headers=h).json()
    a = checkin(client, h, cliente_id).json()
    assert client.delete(f"/api/asistencias/{a['id']}", headers=h).status_code == 204
    with SessionLocal() as db:
        fila = db.get(Asistencia, a["id"])
    assert fila is not None and fila.anulada_por == actor["id"] and fila.anulada_at is not None
    resumen = client.get("/api/asistencias/resumen", headers=h).json()
    assert resumen["asistencias_hoy"] == 0 and resumen["hora_pico"] is None
    assert client.get("/api/asistencias", headers=h).json() == []
