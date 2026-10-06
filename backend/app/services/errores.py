class ErrorNegocio(Exception):
    """Error esperado (ej. 'correo ya registrado'). La API lo convierte en una respuesta clara."""

    def __init__(self, mensaje: str, status: int = 400):
        super().__init__(mensaje)
        self.mensaje = mensaje
        self.status = status
