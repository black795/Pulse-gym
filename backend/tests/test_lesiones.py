"""REQ-03: permisos, validaciones, estado actual e historial de fotografías."""
from datetime import datetime

import pytest

from tests.test_clientes import ADMIN, CLIENTE, ENTRENADOR, RECEPCION, ficha


@pytest.fixture()
def cliente_id(client, entrar):
    return client.post('/api/clientes', headers=entrar(RECEPCION), json=ficha()).json()['id']


def crear(client, headers, cliente_id, **cambios):
    return client.post(f'/api/clientes/{cliente_id}/lesiones', headers=headers,
                       json={'tipo': 'lesion', 'nombre': 'Rodilla derecha', **cambios})


@pytest.mark.parametrize('email', [ADMIN, ENTRENADOR])
def test_roles_autorizados_registran(client, entrar, cliente_id, email):
    h = entrar(email)
    actor = client.get('/api/auth/me', headers=h).json()
    r = crear(client, h, cliente_id)
    assert r.status_code == 201, r.text
    lesion = r.json()
    assert lesion['estado'] == 'activa' and lesion['cliente_nombre'] == 'Marco Quispe'
    assert lesion['registrado_por'] == actor['id'] == lesion['actualizado_por']
    historial = client.get(f"/api/lesiones/{lesion['id']}/historial", headers=h).json()
    assert len(historial) == 1
    assert historial[0]['usuario_id'] == actor['id']
    assert historial[0]['created_at'] == lesion['created_at'] == lesion['updated_at']


@pytest.mark.parametrize('email', [RECEPCION, CLIENTE])
def test_sin_permiso_no_lee_ni_escribe(client, entrar, cliente_id, email):
    lesion = crear(client, entrar(ADMIN), cliente_id).json()
    h = entrar(email)
    assert crear(client, h, cliente_id).status_code == 403
    assert client.get(f'/api/clientes/{cliente_id}/lesiones', headers=h).status_code == 403
    assert client.get('/api/lesiones?solo_vigentes=true', headers=h).status_code == 403
    assert client.patch(f"/api/lesiones/{lesion['id']}", headers=h, json={'estado': 'resuelta'}).status_code == 403
    assert client.get(f"/api/lesiones/{lesion['id']}/historial", headers=h).status_code == 403


def test_sin_sesion(client):
    assert crear(client, {}, 1).status_code == 401
    assert client.get('/api/clientes/1/lesiones').status_code == 401
    assert client.get('/api/lesiones').status_code == 401
    assert client.patch('/api/lesiones/1', json={}).status_code == 401
    assert client.get('/api/lesiones/1/historial').status_code == 401


def test_no_encontrados(client, entrar):
    h = entrar(ADMIN)
    assert crear(client, h, 99999).status_code == 404
    assert client.get('/api/clientes/99999/lesiones', headers=h).status_code == 404
    assert client.patch('/api/lesiones/99999', headers=h, json={'nombre': 'Nueva'}).status_code == 404
    assert client.get('/api/lesiones/99999/historial', headers=h).status_code == 404


def test_versiones_conservan_datos_fecha_y_actor(client, entrar, cliente_id):
    admin, entrenador = entrar(ADMIN), entrar(ENTRENADOR)
    original = crear(client, admin, cliente_id, descripcion='Dolor al flexionar').json()
    lid = original['id']
    actualizado = client.patch(f'/api/lesiones/{lid}', headers=entrenador,
                              json={'estado': 'resuelta', 'descripcion': 'Sin molestias'}).json()
    assert actualizado['estado'] == 'resuelta'
    assert actualizado['registrado_por'] == original['registrado_por']
    assert actualizado['actualizado_por'] != original['actualizado_por']
    eventos = client.get(f'/api/lesiones/{lid}/historial', headers=admin).json()
    assert len(eventos) == 2
    assert [e['estado'] for e in eventos] == ['activa', 'resuelta']
    assert [e['descripcion'] for e in eventos] == ['Dolor al flexionar', 'Sin molestias']
    assert eventos[0]['usuario_id'] == original['registrado_por']
    assert eventos[1]['usuario_id'] == actualizado['actualizado_por']
    assert eventos[1]['created_at'] == actualizado['updated_at']
    assert datetime.fromisoformat(eventos[1]['created_at']) >= datetime.fromisoformat(eventos[0]['created_at'])
    assert client.get(f'/api/clientes/{cliente_id}/lesiones', headers=admin).json() == [actualizado]
    # Una descripción se puede borrar; el tipo y nombre también se pueden corregir.
    r = client.patch(f'/api/lesiones/{lid}', headers=admin,
                     json={'tipo': 'limitacion', 'nombre': 'Movilidad', 'descripcion': None, 'estado': 'activa'})
    assert r.status_code == 200
    eventos_nuevos = client.get(f'/api/lesiones/{lid}/historial', headers=admin).json()
    assert eventos_nuevos[:2] == eventos
    assert eventos_nuevos[-1]['descripcion'] is None
    assert eventos_nuevos[-1]['tipo'] == 'limitacion'


@pytest.mark.parametrize('cambios', [{}, {'nombre': '  Rodilla derecha  '}, {'estado': 'activa'}, {'descripcion': '  '}])
def test_sin_cambios_no_genera_evento(client, entrar, cliente_id, cambios):
    h = entrar(ADMIN)
    original = crear(client, h, cliente_id).json()
    r = client.patch(f"/api/lesiones/{original['id']}", headers=entrar(ENTRENADOR), json=cambios)
    assert r.status_code == 200 and r.json() == original
    assert len(client.get(f"/api/lesiones/{original['id']}/historial", headers=h).json()) == 1


def test_multiples_lesiones_listados_y_filtro(client, entrar, cliente_id):
    h = entrar(ENTRENADOR)
    activa = crear(client, h, cliente_id).json()
    resuelta = crear(client, h, cliente_id, tipo='limitacion', nombre='Hombro', estado='resuelta').json()
    otro_id = client.post('/api/clientes', headers=entrar(ADMIN), json=ficha(carnet='9876543')).json()['id']
    otra = crear(client, h, otro_id).json()
    assert {l['id'] for l in client.get(f'/api/clientes/{cliente_id}/lesiones', headers=h).json()} == {activa['id'], resuelta['id']}
    assert client.get(f'/api/clientes/{cliente_id}/lesiones?solo_vigentes=true', headers=h).json() == [activa]
    assert {l['id'] for l in client.get('/api/lesiones?solo_vigentes=true', headers=h).json()} == {activa['id'], otra['id']}
    assert len(client.get('/api/lesiones', headers=h).json()) == 3


@pytest.mark.parametrize('datos', [
    {'nombre': ''}, {'nombre': '   '}, {'nombre': None}, {'nombre': 'x' * 101},
    {'tipo': 'otra'}, {'tipo': None}, {'estado': 'pendiente'}, {'estado': None},
    {'descripcion': 'x' * 5001}, {'registrado_por': 99},
])
def test_valida_alta_y_edicion(client, entrar, cliente_id, datos):
    h = entrar(ADMIN)
    assert crear(client, h, cliente_id, **datos).status_code == 422
    lesion = crear(client, h, cliente_id).json()
    assert client.patch(f"/api/lesiones/{lesion['id']}", headers=h, json=datos).status_code == 422
    assert len(client.get(f"/api/lesiones/{lesion['id']}/historial", headers=h).json()) == 1


@pytest.mark.parametrize('campo', ['tipo', 'nombre'])
def test_obligatorios(client, entrar, cliente_id, campo):
    datos = {'tipo': 'lesion', 'nombre': 'Rodilla'}
    del datos[campo]
    assert client.post(f'/api/clientes/{cliente_id}/lesiones', headers=entrar(ADMIN), json=datos).status_code == 422


def test_cliente_sin_lesiones(client, entrar, cliente_id):
    h = entrar(ENTRENADOR)
    assert client.get(f'/api/clientes/{cliente_id}/lesiones', headers=h).json() == []
    assert client.get('/api/lesiones?solo_vigentes=true', headers=h).json() == []
