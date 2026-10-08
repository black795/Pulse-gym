"""Panel de inicio: indicadores, alertas y actividad reales, recortados a lo que cada rol puede ver."""
from app.core.tiempo import hoy
from tests.test_clientes import ADMIN, CLIENTE, ENTRENADOR, RECEPCION, ficha


def dashboard(client, entrar, email):
    r = client.get("/api/dashboard", headers=entrar(email))
    assert r.status_code == 200, r.text
    return r.json()


def test_indicadores_con_los_datos_de_ejemplo(client, entrar):
    d = dashboard(client, entrar, ADMIN)
    assert d["hoy"] == hoy().isoformat()
    assert d["indicadores"] == {
        "clientes_total": 3, "clientes_activos": 1,  # solo Daniela vino en los últimos 14 días
        "membresias_vigentes": 2,                     # vigente + por vencer; la vencida no cuenta
        "asistencias_hoy": 0, "entrenadores_activos": 3,
    }


def test_los_indicadores_reaccionan_a_un_check_in_y_a_un_cliente_nuevo(client, entrar):
    h = entrar(RECEPCION)
    nuevo = client.post("/api/clientes", headers=h, json=ficha()).json()["id"]
    assert client.post("/api/asistencias", headers=h, json={"cliente_id": nuevo}).status_code == 201
    i = dashboard(client, entrar, RECEPCION)["indicadores"]
    assert i["clientes_total"] == 4 and i["clientes_activos"] == 2 and i["asistencias_hoy"] == 1


def test_un_entrenador_desactivado_deja_de_contar(client, entrar):
    h = entrar(ADMIN)
    javier = next(u["id"] for u in client.get("/api/usuarios?solo_personal=true", headers=h).json() if u["email"] == ENTRENADOR)
    r = client.patch(f"/api/usuarios/{javier}/estado", headers=h, json={"estado": "inactivo", "motivo": "Prueba"})
    assert r.status_code == 200, r.text
    assert dashboard(client, entrar, ADMIN)["indicadores"]["entrenadores_activos"] == 2


def test_alertas_del_dueno(client, entrar):
    textos = {a["texto"]: a for a in dashboard(client, entrar, ADMIN)["alertas"]}
    assert textos["1 cliente tiene la membresía vencida"]["tipo"] == "peligro"
    assert textos["1 membresía vence en los próximos 7 días"]["ruta"] == "/admin/memberships"
    assert textos["1 cliente lleva más de 30 días sin venir"]["ruta"] == "/admin/attendance"
    assert not any("lesi" in t for t in textos)  # no hay lesiones en los datos de ejemplo


def test_alerta_de_lesiones_activas_en_plural(client, entrar):
    h = entrar(ENTRENADOR)
    cliente = client.get("/api/clientes", headers=h).json()[0]["id"]
    for nombre in ("Rodilla", "Hombro"):
        client.post(f"/api/clientes/{cliente}/lesiones", headers=h, json={"tipo": "lesion", "nombre": nombre})
    alertas = [a["texto"] for a in dashboard(client, entrar, ENTRENADOR)["alertas"]]
    assert "2 lesiones o limitaciones activas" in alertas


def test_cada_rol_solo_recibe_lo_que_puede_ver(client, entrar):
    h = entrar(ENTRENADOR)
    cliente = client.get("/api/clientes", headers=h).json()[0]["id"]
    client.post(f"/api/clientes/{cliente}/lesiones", headers=h, json={"tipo": "lesion", "nombre": "Rodilla"})

    entrenador = dashboard(client, entrar, ENTRENADOR)
    assert entrenador["indicadores"]["membresias_vigentes"] is None
    assert not any("membresía" in a["texto"] for a in entrenador["alertas"])
    assert any("lesión" in a["texto"] for a in entrenador["alertas"])
    assert "pago" not in {e["tipo"] for e in entrenador["actividad"]}
    assert "lesion" in {e["tipo"] for e in entrenador["actividad"]}

    recepcion = dashboard(client, entrar, RECEPCION)
    assert recepcion["indicadores"]["membresias_vigentes"] == 2
    assert not any("lesi" in a["texto"] for a in recepcion["alertas"])
    assert "lesion" not in {e["tipo"] for e in recepcion["actividad"]}
    assert "pago" in {e["tipo"] for e in recepcion["actividad"]}


def test_la_actividad_reciente_va_de_lo_mas_nuevo_a_lo_mas_antiguo(client, entrar):
    h = entrar(RECEPCION)
    nuevo = client.post("/api/clientes", headers=h, json=ficha()).json()["id"]
    client.post("/api/asistencias", headers=h, json={"cliente_id": nuevo})
    actividad = dashboard(client, entrar, RECEPCION)["actividad"]
    assert 0 < len(actividad) <= 6
    fechas = [e["fecha_hora"] for e in actividad]
    assert fechas == sorted(fechas, reverse=True)
    assert actividad[0]["tipo"] == "asistencia" and actividad[0]["texto"] == "Marco Quispe registró ingreso"
    assert actividad[1]["tipo"] == "cliente" and actividad[1]["texto"] == "Nuevo cliente: Marco Quispe"


def test_una_entrada_anulada_no_aparece_en_la_actividad(client, entrar):
    h = entrar(RECEPCION)
    nuevo = client.post("/api/clientes", headers=h, json=ficha()).json()["id"]
    a = client.post("/api/asistencias", headers=h, json={"cliente_id": nuevo}).json()
    client.delete(f"/api/asistencias/{a['id']}", headers=h)
    d = dashboard(client, entrar, RECEPCION)
    assert d["indicadores"]["asistencias_hoy"] == 0
    assert "Marco Quispe registró ingreso" not in [e["texto"] for e in d["actividad"]]


def test_el_cliente_no_accede(client, entrar):
    assert client.get("/api/dashboard", headers=entrar(CLIENTE)).status_code == 403
    assert client.get("/api/dashboard").status_code == 401
