import os
import tempfile

# Variables de entorno ANTES de importar la app (usa una base de datos temporal).
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
os.environ.update(
    DATABASE_URL=f"sqlite:///{_tmp.name}",
    SECRET_KEY="clave-de-pruebas-clave-de-pruebas-1234567890",
    SEED_DEMO="true",
    DEMO_PASSWORD="Pulse2026!",
    BCRYPT_ROUNDS="4",  # rápido en pruebas
    ENTORNO="desarrollo",
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402

PASSWORD = "Pulse2026!"


@pytest.fixture()
def client():
    """Cada prueba empieza con la base de datos limpia y los usuarios de demostración."""
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def entrar(client):
    """entrar('carlos@pulsegym.com') → encabezados con el token de ese usuario."""

    def _entrar(email: str, password: str = PASSWORD) -> dict:
        r = client.post("/api/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['access_token']}"}

    return _entrar
