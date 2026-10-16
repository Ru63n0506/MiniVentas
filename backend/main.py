from datetime import datetime

from fastapi import FastAPI
from pydantic import BaseModel

from sheets import consultar_ventas, guardar_venta

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origenes_permitidos = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://172.17.59.96:5500"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"]
)

class Venta(BaseModel):
    producto: str
    cantidad: int
    precio: float


@app.get("/")
def inicio():
    return {"mensaje": "¡Mi API de MiniVentas funciona!"}


@app.post("/api/ventas")
def registrar_venta(venta: Venta):
    total = venta.cantidad * venta.precio

    nueva_venta = {
        "fecha": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
        "producto": venta.producto,
        "cantidad": venta.cantidad,
        "precio": venta.precio,
        "total": total
    }

    guardar_venta(nueva_venta)

    return {
        "mensaje": "Venta registrada correctamente",
        "venta": nueva_venta
    }


@app.get("/api/ventas")
def obtener_ventas():
    ventas = consultar_ventas()

    return {
        "cantidad_ventas": len(ventas),
        "ventas": ventas
    }
