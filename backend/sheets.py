
import gspread

# Conectar con Google usando las credenciales
gc = gspread.service_account(
    filename="credentials.json"
)

# Abrir el documento de Google Sheets
hoja_calculo = gc.open("MiniVentas")

# Seleccionar la pestaña Ventas
hoja_ventas = hoja_calculo.worksheet("Ventas")


def consultar_ventas():
    return hoja_ventas.get_all_records()


def guardar_venta(venta):
    # Consultar los ID de las ventas que ya existen
    ventas = consultar_ventas()

    for venta_existente in ventas:
        if str(venta_existente.get("id_venta", "")) == str(venta["id_venta"]):
            # La venta ya fue registrada
            return False

    # Guardar la venta con su identificador único
    hoja_ventas.append_row([
        venta["fecha"],
        venta["producto"],
        venta["cantidad"],
        venta["precio"],
        venta["total"],
        venta["id_venta"]
    ], value_input_option="USER_ENTERED")

    return True
