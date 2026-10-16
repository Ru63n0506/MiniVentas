from sheets import consultar_ventas

ventas = consultar_ventas()

print("Conexión con Google Sheets exitosa")
print("Ventas encontradas:", len(ventas))
print(ventas)
