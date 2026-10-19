
console.log("Mi archivo app.js se está ejecutando");

const formulario = document.getElementById("formularioVenta");
const listaVentas = document.getElementById("listaVentas");
const URL_API = "https://miniventas.onrender.com";

// Base de datos local
const NOMBRE_BD = "MiniVentasDB";
const NOMBRE_ALMACEN = "ventas";

let bd;
let ventas = [];

// Abrir la base de datos local
function abrirBaseDatos() {
    return new Promise(function(resolve, reject) {
        const solicitud = indexedDB.open(NOMBRE_BD, 1);

        solicitud.onupgradeneeded = function(event) {
            const baseDatos = event.target.result;

            if (!baseDatos.objectStoreNames.contains(NOMBRE_ALMACEN)) {
                baseDatos.createObjectStore(NOMBRE_ALMACEN, {
                    keyPath: "id_venta"
                });
            }
        };

        solicitud.onsuccess = function(event) {
            bd = event.target.result;
            resolve(bd);
        };

        solicitud.onerror = function() {
            reject(solicitud.error);
        };
    });
}

// Guardar una venta en el dispositivo
function guardarVentaLocal(venta) {
    return new Promise(function(resolve, reject) {
        const transaccion = bd.transaction(NOMBRE_ALMACEN, "readwrite");
        const almacen = transaccion.objectStore(NOMBRE_ALMACEN);

        almacen.put(venta);

        transaccion.oncomplete = function() {
            resolve();
        };

        transaccion.onerror = function() {
            reject(transaccion.error);
        };
    });
}

// Recuperar las ventas locales
function consultarVentasLocales() {
    return new Promise(function(resolve, reject) {
        const transaccion = bd.transaction(NOMBRE_ALMACEN, "readonly");
        const almacen = transaccion.objectStore(NOMBRE_ALMACEN);
        const solicitud = almacen.getAll();

        solicitud.onsuccess = function() {
            resolve(solicitud.result);
        };

        solicitud.onerror = function() {
            reject(solicitud.error);
        };
    });
}

// Enviar una venta al servidor
async function enviarVenta(venta) {
    try {
        const respuesta = await fetch(`${URL_API}/api/ventas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_venta: venta.id_venta,
                producto: venta.producto,
                cantidad: venta.cantidad,
                precio: venta.precio
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.sincronizada !== true) {
            throw new Error(
                resultado.detail || "No se confirmó la sincronización"
            );
        }

        console.log("Venta confirmada por el servidor:", venta.id_venta);
        return true;

    } catch (error) {
        console.error("No se pudo sincronizar la venta:", error);
        return false;
    }
}

// Sincronizar ventas pendientes
async function sincronizarVentas() {
    if (!navigator.onLine || !bd) {
        return;
    }

    const ventasLocales = await consultarVentasLocales();

    for (const venta of ventasLocales) {
        if (venta.sincronizada === true) {
            continue;
        }

        const confirmada = await enviarVenta(venta);

        if (confirmada) {
            venta.sincronizada = true;
            await guardarVentaLocal(venta);
        }
    }

    await cargarVentas();
}

// Recuperar ventas del servidor y del dispositivo
async function cargarVentas() {
    let ventasServidor = [];

    try {
        const respuesta = await fetch(`${URL_API}/api/ventas`);

        if (!respuesta.ok) {
            throw new Error("No se pudieron recuperar las ventas");
        }

        const datos = await respuesta.json();
        ventasServidor = datos.ventas;

    } catch (error) {
        console.error("No se pudieron cargar las ventas del servidor:", error);
    }

    const ventasLocales = await consultarVentasLocales();
    const ventasCombinadas = new Map();

    // Conservar las ventas antiguas que no tienen ID
    ventasServidor.forEach(function(venta, indice) {
        const id = venta.id_venta;

        if (id !== undefined && id !== null && String(id).trim() !== "") {
            ventasCombinadas.set(String(id), venta);
        } else {
            ventasCombinadas.set(
                `antigua-${indice}`,
                venta
            );
        }
    });

    // Las ventas locales pendientes también deben aparecer
    ventasLocales.forEach(function(venta) {
        ventasCombinadas.set(String(venta.id_venta), venta);
    });

    ventas = Array.from(ventasCombinadas.values());

    mostrarVentas();
    actualizarResumen();
}

// Mostrar las ventas en la tabla
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

// Actualizar los resúmenes
function actualizarResumen() {
    const cantidadVentas = ventas.length;

    const cantidadProductos = ventas.reduce(function(acumulado, venta) {
        return acumulado + Number(venta.cantidad || 0);
    }, 0);

    const ingresos = ventas.reduce(function(acumulado, venta) {
        return acumulado + Number(venta.total || 0);
    }, 0);

    document.getElementById("totalVentas").textContent = cantidadVentas;
    document.getElementById("totalProductos").textContent = cantidadProductos;

    document.getElementById("ingresosTotales").textContent =
        "$" + ingresos.toFixed(2);
}

// Registrar una venta
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

    const venta = {
        id_venta: crypto.randomUUID(),
        fecha: new Date().toLocaleString("es-MX"),
        producto: producto,
        cantidad: cantidad,
        precio: precio,
        total: cantidad * precio,
        sincronizada: false
    };

    try {
        // Guardar primero en el dispositivo
        await guardarVentaLocal(venta);

        formulario.reset();

        if (navigator.onLine) {
            await sincronizarVentas();
        } else {
            await cargarVentas();
        }

        // Consultar el estado actualizado en la base local
        const ventasLocales = await consultarVentasLocales();

        const ventaActualizada = ventasLocales.find(function(item) {
            return item.id_venta === venta.id_venta;
        });

        if (ventaActualizada && ventaActualizada.sincronizada === true) {
            alert("Venta registrada y sincronizada correctamente.");
        } else {
            alert(
                "Venta guardada en este dispositivo. " +
                "Queda pendiente de sincronización."
            );
        }

    } catch (error) {
        console.error("Error al registrar la venta:", error);

        alert(
            "No se pudo confirmar el registro local. " +
            "Revisa el historial antes de intentar registrar otra vez."
        );
    }
});

// Intentar sincronizar cuando vuelve internet
window.addEventListener("online", function() {
    sincronizarVentas().catch(function(error) {
        console.error("Error durante la sincronización:", error);
    });
});

// Inicializar la aplicación
async function iniciarAplicacion() {
    try {
        await abrirBaseDatos();
        await cargarVentas();

        if (navigator.onLine) {
            await sincronizarVentas();
        }

    } catch (error) {
        console.error("Error al iniciar MiniVentas:", error);

        alert(
            "No se pudo iniciar el almacenamiento local de MiniVentas."
        );
    }
}

iniciarAplicacion();
