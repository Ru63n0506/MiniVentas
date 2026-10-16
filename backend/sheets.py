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
    hoja_ventas.append_row([
        venta["fecha"],
        venta["producto"],
        venta["cantidad"],
        venta["precio"],
        venta["total"]
    ], value_input_option="USER_ENTERED")