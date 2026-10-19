
from datetime import datetime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from sheets import consultar_ventas, guardar_venta
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origenes_permitidos = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://172.17.59.96:5500",
    "https://miniventas-web1.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes_permitidos,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"]
)


class Venta(BaseModel):
    id_venta: str = Field(min_length=1)
    producto: str = Field(min_length=1)
    cantidad: int = Field(gt=0)
    precio: float = Field(gt=0)


@app.get("/")
def inicio():
    return {"mensaje": "¡Mi API de MiniVentas funciona!"}


@app.post("/api/ventas")
def registrar_venta(venta: Venta):
    try:
        # Comprobar si la venta ya existe
        ventas_existentes = consultar_ventas()

        for existente in ventas_existentes:
            if str(existente.get("id_venta", "")) == venta.id_venta:
                return {
                    "mensaje": "La venta ya estaba registrada",
                    "sincronizada": True,
                    "venta": existente
                }

        nueva_venta = {
            "fecha": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "producto": venta.producto,
            "cantidad": venta.cantidad,
            "precio": venta.precio,
            "total": venta.cantidad * venta.precio,
            "id_venta": venta.id_venta
        }

        guardada = guardar_venta(nueva_venta)

        if not guardada:
            return {
                "mensaje": "La venta ya estaba registrada",
                "sincronizada": True,
                "venta": nueva_venta
            }

        return {
            "mensaje": "Venta registrada correctamente",
            "sincronizada": True,
            "venta": nueva_venta
        }

    except Exception as error:
        print(f"Error al registrar venta: {error}")
        raise HTTPException(
            status_code=500,
            detail="No se pudo guardar la venta en Google Sheets"
        )


@app.get("/api/ventas")
def obtener_ventas():
    ventas = consultar_ventas()

    return {
        "cantidad_ventas": len(ventas),
        "ventas": ventas
    }
