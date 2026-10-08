"""Configuración central. Todo lo que cambia entre tu laptop y producción vive aquí."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

CLAVE_POR_DEFECTO = "cambia-esta-clave-en-produccion"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    entorno: str = "desarrollo"  # "desarrollo" | "produccion"
    database_url: str = "sqlite:///./pulse_gym.db"
    secret_key: str = CLAVE_POR_DEFECTO
    access_token_minutos: int = 60
    bcrypt_rounds: int = 12  # costo del hash; más alto = más seguro y más lento
    cors_origins: str = "http://localhost:5173"
    zona_horaria: str = "America/La_Paz"  # decide qué día es "hoy" para vencimientos
    seed_demo: bool = True
    demo_password: str = "Pulse2026!"

    @property
    def cors_lista(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def validar_para_produccion(self) -> None:
        """Si estás en producción, se niega a arrancar con configuración insegura."""
        if self.entorno == "produccion":
            if self.secret_key == CLAVE_POR_DEFECTO or len(self.secret_key) < 32:
                raise RuntimeError("SECRET_KEY insegura: define una clave aleatoria de 32+ caracteres.")
            if self.seed_demo:
                raise RuntimeError("SEED_DEMO debe ser false en producción (crearía usuarios de prueba).")


@lru_cache
def get_settings() -> Settings:
    return Settings()
