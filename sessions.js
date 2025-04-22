// sessions.js

const SESSIONS_KEY = "caliope_sesiones";
const SESSION_EXPIRATION_HOURS = 24;

// Crear una nueva sesión de usuario
async function crearSesion(idUsuario, tono) {
    const sesion = {
        id: Date.now().toString(),
        usuario: idUsuario,
        tono: tono,
        createdAt: Date.now(),
        messages: [
            { role: "system", content: tono }
        ]
    };

    const sesiones = await obtenerSesiones();
    sesiones.push(sesion);
    await guardarSesiones(sesiones);
    return sesion;
}

// Obtener todas las sesiones
async function obtenerSesiones() {
    return new Promise(resolve => {
        chrome.storage.local.get([SESSIONS_KEY], (result) => {
            resolve(result[SESSIONS_KEY] || []);
        });
    });
}

// Guardar todas las sesiones
async function guardarSesiones(sesiones) {
    return new Promise(resolve => {
        chrome.storage.local.set({ [SESSIONS_KEY]: sesiones }, resolve);
    });
}

// Obtener una sesión por ID
async function obtenerSesionPorId(id) {
    const sesiones = await obtenerSesiones();
    return sesiones.find(s => s.id === id);
}

// Verificar si una sesión está expirada
function sesionExpirada(sesion) {
    const horasPasadas = (Date.now() - sesion.createdAt) / (1000 * 60 * 60);
    return horasPasadas > SESSION_EXPIRATION_HOURS;
}

// Obtener una sesión válida o crear una nueva si ha expirado o cambió el tono
async function obtenerSesionValida(idUsuario, tono) {
    return new Promise(resolve => {
        chrome.storage.local.get(["current_session_id"], async (result) => {
            let sesion = null;
            let sessionId = result["current_session_id"];

            if (sessionId) {
                sesion = await obtenerSesionPorId(sessionId);

                if (!sesion || sesionExpirada(sesion) || sesion.tono !== tono) {
                    sesion = await crearSesion(idUsuario, tono);
                    chrome.storage.local.set({ current_session_id: sesion.id });
                }
            } else {
                sesion = await crearSesion(idUsuario, tono);
                chrome.storage.local.set({ current_session_id: sesion.id });
            }

            resolve(sesion);
        });
    });
}

// Actualizar una sesión (con nuevos mensajes)
async function actualizarSesion(id, nuevoMensajeUsuario, nuevaRespuesta) {
    const sesiones = await obtenerSesiones();
    const index = sesiones.findIndex(s => s.id === id);

    if (index !== -1) {
        sesiones[index].messages.push({ role: "user", content: nuevoMensajeUsuario });
        sesiones[index].messages.push({ role: "assistant", content: nuevaRespuesta });
        await guardarSesiones(sesiones);
        return sesiones[index];
    } else {
        throw new Error("Sesión no encontrada");
    }
}

// Resetear sesión si el usuario quiere empezar desde cero
async function resetearSesion(id) {
    const sesiones = await obtenerSesiones();
    const index = sesiones.findIndex(s => s.id === id);

    if (index !== -1) {
        const tono = sesiones[index].tono;
        sesiones[index].messages = [
            { role: "system", content: tono }
        ];
        sesiones[index].createdAt = Date.now();
        await guardarSesiones(sesiones);
    }
}
