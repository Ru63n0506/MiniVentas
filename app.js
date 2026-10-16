console.log("Mi archivo app.js se está ejecutando");

const formulario = document.getElementById("formularioVenta");
const listaVentas = document.getElementById("listaVentas");
const URL_API = "http://127.0.0.1:8000";

// Enviar una venta a Google Sheets

async function enviarVenta(venta) {
    try {
        const respuesta = await fetch(`${URL_API}/api/ventas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(venta)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.detail || "No se pudo guardar la venta"
            );
        }

        console.log("Venta registrada:", resultado.venta);
        return true;

    } catch (error) {
        console.error("Error al enviar la venta:", error);
        return false;
    }
}

// Recuperar las ventas guardadas

let ventas = [];

async function cargarVentas() {
    try {
        const respuesta = await fetch(`${URL_API}/api/ventas`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron recuperar las ventas");
        }

        const datos = await respuesta.json();

        ventas = datos.ventas;

        mostrarVentas();
        actualizarResumen();

    } catch (error) {
        console.error("Error al cargar las ventas:", error);
    }
}


// Mostrar las ventas guardadas al abrir la página
function mostrarVentas() {
    listaVentas.innerHTML = "";

    ventas.forEach(function(venta) {
        const fila = document.createElement("tr");
     
        const celdaFecha = document.createElement("td");
        const celdaProducto = document.createElement("td");
        const celdaCantidad = document.createElement("td");
        const celdaTotal = document.createElement("td");

        celdaFecha.textContent = venta.fecha || "Sin fecha";
        celdaProducto.textContent = venta.producto;
        celdaCantidad.textContent = venta.cantidad;
        
        const total = Number(venta.total) || 0;
        celdaTotal.textContent = "$" + total.toFixed(2);

        fila.appendChild(celdaFecha);
        fila.appendChild(celdaProducto);
        fila.appendChild(celdaCantidad);
        fila.appendChild(celdaTotal);

        listaVentas.appendChild(fila);
    });
}


function actualizarResumen() {
    const cantidadVentas = ventas.length;

    const cantidadProductos = ventas.reduce(function(acumulado, venta) {
        return acumulado + venta.cantidad;
    }, 0);

    const ingresos = ventas.reduce(function(acumulado, venta) {
        return acumulado + venta.total;
    }, 0);

    document.getElementById("totalVentas").textContent = cantidadVentas;

    document.getElementById("totalProductos").textContent = cantidadProductos;

    document.getElementById("ingresosTotales").textContent =
        "$" + ingresos.toFixed(2);
}

formulario.addEventListener("submit", async function(event) {
    event.preventDefault();

    const producto = document.getElementById("producto").value.trim();
    const cantidad = Number(document.getElementById("cantidad").value);
    const precio = Number(document.getElementById("precio").value);

    if (
    producto === "" ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0 ||
    !Number.isFinite(precio) ||
    precio <= 0
    ) {
        alert("Ingresa un producto, una cantidad entera y un precio válido.");
        return;
    }

    const total = cantidad * precio;
    const fecha = new Date().toLocaleString("es-MX");

    const venta = {
        producto: producto,
        cantidad: cantidad,
        precio: precio,
        total: total,
        fecha: fecha
    };

    // Enviar la venta a Google Sheets
    const enviada = await enviarVenta(venta);

    if (enviada) 
    {
        await cargarVentas();

        formulario.reset();

        alert("Venta registrada correctamente.");
    } else {
        alert("No se pudo registrar la venta. Revisa la conexión con el servidor.");
    }
});


// Mostrar el historial inicial
cargarVentas();

fetch(`${URL_API}/`)
    .then(response => response.json())
    .then(datos => {
        console.log("Conexión con FastAPI exitosa:", datos);
    })
    .catch(error => {
        console.error("Error al conectar con FastAPI:", error);
    });