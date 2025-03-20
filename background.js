importScripts("config.js");
importScripts("whisper.js");
importScripts("openai.js");


/*
let vectorBase = [];

// Base de conocimientos (sin cambios)
const baseConocimientos = [
    "Nuestros cursos de inglés en Malta tienen diferentes precios según la duración y el nivel.",
    "Ofrecemos alojamiento en residencias, familias anfitrionas y apartamentos compartidos.",
    "Para viajar a Malta, los ciudadanos de la UE no necesitan visa, pero otros países sí.",
    "Tenemos actividades extracurriculares como excursiones, deportes y eventos sociales.",
    "El transporte público en Malta incluye autobuses y servicios de ferry.",
    "Para inscribirse en un curso, se requiere un depósito inicial del 20%."
];

// Cargar `vectorBase` (sin cambios)
async function cargarBaseDesdeStorage() {
    return new Promise(resolve => {
        chrome.storage.local.get(["vectorBase"], (result) => {
            if (result.vectorBase && result.vectorBase.length > 0) {
                vectorBase = result.vectorBase;
                console.log("✅ Base vectorizada cargada desde `chrome.storage`.");
                resolve(true);
            } else {
                console.warn("⚠️ No se encontró una base vectorizada en `chrome.storage`. Se generará una nueva.");
                resolve(false);
            }
        });
    });
}

// Vectorizar y almacenar (sin cambios)
/*
async function vectorizarBaseConocimientos() {
    console.log("🛠️ Iniciando vectorización de la base de conocimientos...");

    let nuevaVectorizacion = [];
    for (let tema of baseConocimientos) {
        try {
            const embedding = await obtenerEmbeddings(tema);
            nuevaVectorizacion.push({ texto: tema, embedding: embedding });
        } catch (error) {
            console.error(`🚨 Error al vectorizar "${tema}":`, error);
        }
    }


    if (nuevaVectorizacion.length > 0) {
        vectorBase = nuevaVectorizacion;
        chrome.storage.local.set({ vectorBase: vectorBase }, () => {
            console.log("✅ Base vectorizada almacenada en `chrome.storage`.");
        });
    } else {
        console.error("❌ Error: No se pudo generar una base de conocimientos vectorizada.");
    }
}
*/
// Inicializar base (sin cambios)
/*
async function inicializarBase() {
    const existeEnStorage = await cargarBaseDesdeStorage();
    if (!existeEnStorage) {
        console.log("🔄 Recalculando embeddings...");
        await vectorizarBaseConocimientos();
    }
}

inicializarBase();
*/
// Manejo de mensajes entrantes (con LOGS)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Mensaje recibido en `background.js`:", request.action, request); // LOG COMPLETO

    if (request.action === "transcribeAudio") {
        // ... (lógica de transcripción, sin cambios importantes aquí) ...
         if (request.audioData) {
            console.log("🔍 Convirtiendo Base64 en Blob...");

            try {
                const byteCharacters = atob(request.audioData.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const audioBlob = new Blob([byteArray], { type: "audio/webm" });

                console.log("📂 Archivo de audio reconstruido:", audioBlob);
                console.log("📏 Tamaño reconstruido:", audioBlob.size, "bytes");

                transcribeAudio(audioBlob)
                    .then(async transcription => {
                        console.log("✅ Transcripción recibida:", transcription);

                        const respuesta = await respuestaTonalizada(transcription);
                        console.log("La respuesta tonalizada es");

                        sendResponse({ transcription, respuesta });
                    })
                    .catch(error => {
                        console.error("🚨 Error en la transcripción:", error);
                        sendResponse({ error: error.message });
                    });

            } catch (error) {
                console.error("❌ Error procesando audio:", error);
                sendResponse({ error: "Error procesando el audio." });
            }

            return true; // Permite respuestas asíncronas
        } else {
            console.error("❌ No se recibió audio en la solicitud.");
            sendResponse({ error: "No se recibió audio válido." });
        }
    }
/*
    if (request.action === "regenerarVectorBase") {
        // ... (lógica de regeneración, sin cambios) ...
         console.log("🔄 Regenerando base de conocimientos...");
        vectorizarBaseConocimientos().then(() => {
            sendResponse({ status: "VectorBase regenerado correctamente." });
        }).catch(error => {
            console.error("❌ Error regenerando la base vectorizada:", error);
            sendResponse({ error: "No se pudo regenerar VectorBase." });
        });

        return true;
    }

    if (request.action === "reformularMensaje") {
        console.log("Reformulando el mensaje (background.js):", request.mensaje); // LOG del mensaje original
        reformularMensaje(request.mensaje)
            .then((response) => {
                console.log("El mensaje ha sido reformulado con éxito (background.js):", response); // LOG de la respuesta
                sendResponse({ reformulado: response });
            })
            .catch((error) => {
                console.error("Hubo un error al reformular el mensaje (background.js):", error);
                sendResponse({ error: "Error al reformular el mensaje: " + error.message });
            });

        return true; // MUY IMPORTANTE
    }
        */
});


// Crear ventana emergente (sin cambios)
chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        url: "popup.html",
        type: "popup",
        width: 400,
        height: 500,
        top: 100,
        left: 100
    });
});