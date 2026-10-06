from tests.conftest import PASSWORD


def test_login_correcto_devuelve_token_rol_y_permisos(client):
    r = client.post("/api/auth/login", json={"email": "carlos@pulsegym.com", "password": PASSWORD})
    assert r.status_code == 200
    datos = r.json()
    assert datos["token_type"] == "bearer" and datos["access_token"]
    assert datos["usuario"]["rol"] == "administrador"
    assert "usuarios:gestionar" in datos["usuario"]["permisos"]
    assert "password_hash" not in str(datos)


def test_login_ignora_mayusculas_y_espacios_en_el_correo(client):
    r = client.post("/api/auth/login", json={"email": "  CARLOS@PulseGym.com ", "password": PASSWORD})
    assert r.status_code == 200


def test_password_incorrecta_y_correo_inexistente_dan_el_mismo_mensaje(client):
    mala = client.post("/api/auth/login", json={"email": "carlos@pulsegym.com", "password": "otra-cosa1"})
    nadie = client.post("/api/auth/login", json={"email": "nadie@pulsegym.com", "password": "otra-cosa1"})
    assert mala.status_code == nadie.status_code == 401
    assert mala.json() == nadie.json()


def test_me_exige_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer falso"}).status_code == 401


def test_me_devuelve_el_usuario_logueado(client, entrar):
    r = client.get("/api/auth/me", headers=entrar("pati@pulsegym.com"))
    assert r.status_code == 200 and r.json()["rol"] == "recepcionista"


def test_registro_crea_siempre_un_cliente_y_ya_inicia_sesion(client):
    r = client.post("/api/auth/registro", json={
        "nombre": "Ana  Paredes", "email": "ana@correo.com", "password": "Clave1234",
        "acepta_consentimiento": True,
    })
    assert r.status_code == 201
    u = r.json()["usuario"]
    assert u["rol"] == "cliente" and u["nombre"] == "Ana Paredes"
    assert "usuarios:gestionar" not in u["permisos"]
    # y puede volver a entrar con esas credenciales
    assert client.post("/api/auth/login", json={"email": "ana@correo.com", "password": "Clave1234"}).status_code == 200


def test_registro_no_permite_elegir_rol(client):
    r = client.post("/api/auth/registro", json={
        "nombre": "Hacker", "email": "h@correo.com", "password": "Clave1234",
        "acepta_consentimiento": True, "rol": "administrador",
    })
    assert r.status_code == 422


def test_registro_exige_consentimiento(client):
    r = client.post("/api/auth/registro", json={
        "nombre": "Ana", "email": "ana@correo.com", "password": "Clave1234", "acepta_consentimiento": False,
    })
    assert r.status_code == 422


def test_registro_rechaza_correo_repetido_y_password_debil(client):
    base = {"nombre": "Ana", "acepta_consentimiento": True}
    repetido = client.post("/api/auth/registro", json={**base, "email": "carlos@pulsegym.com", "password": "Clave1234"})
    assert repetido.status_code == 409
    debil = client.post("/api/auth/registro", json={**base, "email": "x@correo.com", "password": "sololetras"})
    assert debil.status_code == 422


def test_cuenta_inactiva_no_entra_pero_solo_se_le_dice_con_password_correcta(client, entrar):
    admin = entrar("carlos@pulsegym.com")
    uid = next(u["id"] for u in client.get("/api/usuarios", headers=admin).json() if u["email"] == "daniela@pulsegym.com")
    assert client.patch(f"/api/usuarios/{uid}/estado", headers=admin, json={"estado": "inactivo"}).status_code == 200

    ok = client.post("/api/auth/login", json={"email": "daniela@pulsegym.com", "password": PASSWORD})
    assert ok.status_code == 403 and "inactivo" in ok.json()["detail"]
    mala = client.post("/api/auth/login", json={"email": "daniela@pulsegym.com", "password": "incorrecta1"})
    assert mala.status_code == 401


def test_token_deja_de_servir_apenas_desactivan_la_cuenta(client, entrar):
    admin = entrar("carlos@pulsegym.com")
    headers_pati = entrar("pati@pulsegym.com")
    assert client.get("/api/auth/me", headers=headers_pati).status_code == 200

    uid = next(u["id"] for u in client.get("/api/usuarios", headers=admin).json() if u["email"] == "pati@pulsegym.com")
    client.patch(f"/api/usuarios/{uid}/estado", headers=admin, json={"estado": "suspendido", "motivo": "prueba"})
    assert client.get("/api/auth/me", headers=headers_pati).status_code == 401
