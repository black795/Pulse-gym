from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, clientes, roles, usuarios
from app.core.config import get_settings
from app.db.base import Base
from app.db.seed import sembrar_catalogos, sembrar_demo
from app.db.session import SessionLocal, engine
from app import models  # noqa: F401  (registra las tablas)
from app.services.errores import ErrorNegocio


@asynccontextmanager
async def lifespan(_: FastAPI):
    cfg = get_settings()
    cfg.validar_para_produccion()
    Base.metadata.create_all(engine)  # crea las tablas que falten (más adelante: migraciones con Alembic)
    with SessionLocal() as db:
        sembrar_catalogos(db)
        if cfg.seed_demo:
            sembrar_demo(db)
    yield


app = FastAPI(title="Pulse Gym API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_lista,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(ErrorNegocio)
async def manejar_error_negocio(_: Request, exc: ErrorNegocio):
    return JSONResponse(status_code=exc.status, content={"detail": exc.mensaje})


app.include_router(auth.router, prefix="/api")
app.include_router(roles.router, prefix="/api")
app.include_router(usuarios.router, prefix="/api")
app.include_router(clientes.router, prefix="/api")


@app.get("/api/health", tags=["Sistema"])
def health():
    return {"estado": "ok"}
