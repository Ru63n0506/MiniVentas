
const CACHE_NAME = "miniventas-v1";

const ARCHIVOS_APP = [
    "./",
    "./index.html",
    "./styles.css",
    "./app.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// Instalar y guardar los archivos de la aplicación
self.addEventListener("install", function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(ARCHIVOS_APP);
            })
            .then(function() {
                return self.skipWaiting();
            })
    );
});

// Activar la versión nueva y eliminar cachés antiguas
self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.keys()
            .then(function(nombres) {
                return Promise.all(
                    nombres
                        .filter(function(nombre) {
                            return nombre.startsWith("miniventas-") &&
                                   nombre !== CACHE_NAME;
                        })
                        .map(function(nombre) {
                            return caches.delete(nombre);
                        })
                );
            })
            .then(function() {
                return self.clients.claim();
            })
    );
});

// Intentar cargar los archivos guardados cuando no hay conexión
self.addEventListener("fetch", function(event) {
    const solicitud = event.request;
    const url = new URL(solicitud.url);

    // No interceptar solicitudes a la API ni otros dominios
    if (url.origin !== self.location.origin) {
        return;
    }

    // Para navegar, usar la página guardada si no hay conexión
    if (solicitud.mode === "navigate") {
        event.respondWith(
            fetch(solicitud)
                .catch(function() {
                    return caches.match("./index.html");
                })
        );
        return;
    }

    // Para CSS, JS, iconos y otros recursos, usar caché como respaldo
    event.respondWith(
        caches.match(solicitud)
            .then(function(respuestaGuardada) {
                const solicitudRed = fetch(solicitud)
                    .then(function(respuesta) {
                        if (respuesta.ok) {
                            const copia = respuesta.clone();

                            caches.open(CACHE_NAME)
                                .then(function(cache) {
                                    cache.put(solicitud, copia);
                                });
                        }

                        return respuesta;
                    });

                return respuestaGuardada || solicitudRed;
            })
    );
});
