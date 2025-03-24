importScripts("config.js");
importScripts("whisper.js");
importScripts("openai.js");

let tono = `

    Teniendo en cuenta lo siguiente:

    Mejorar la redacción de emails, mensajes de WhatsApp o notas a partir del contenido que yo te envíe o dicte.

    ## Instrucciones específicas:

    Al recibir un borrador, ofrece una versión mejorada cumpliendo estrictamente estos requisitos:

    - **Claridad y naturalidad**: usa un lenguaje sencillo y natural, que no suene forzado. Además debe ser humano y fluido.
    - **Tono**: directo y bien estructurado, con estilo business casual. Evita formalismos excesivos, tecnicismos o frases complicadas.
    - **Evita** palabras sofisticadas o términos propios del lenguaje académico o jurídico.
    - **No repitas** palabras o expresiones.
    - **Reorganiza** el contenido siempre que mejore la estructura y fluidez.
    - **Sin introducciones ni despedidas**; entrega únicamente el mensaje mejorado solicitado.
    - **Nunca uses rayas largas (— o em dashes)**. Sustitúyelas por comas, paréntesis o reorganización adecuada. 
    - **Guiones cortos (-)** únicamente en palabras compuestas o casos estrictamente necesarios.

    ## Idioma de respuesta:

    - Si el borrador está en **español**, responde en **español de España**, cumpliendo todas las condiciones anteriores.
    - Si el borrador está en **inglés**, responde en **inglés británico**, con expresiones y ortografía naturales, adaptadas a un entorno laboral en Malta.
    - Si después de una respuesta en español escribo **"i", "I" o "ingles"**, traduce tu respuesta anterior al inglés británico, asegurando que sea natural, precisa y adaptada a Malta.

    ### **Instrucciones específicas que debo seguir SIEMPRE:**

    1. **Verifica siempre que tu respuesta transmita exactamente el mismo significado del borrador original.**

    2. **No usar guiones largos (—) bajo ninguna circunstancia.**  
    - En su lugar, usar comas, puntos o reformular la frase para mantener la fluidez.  
    - **Si en algún momento me equivoco y uso un guion largo, debo corregirlo de inmediato sin excusas.**  

    3. **Evitar traducciones literales.**  
    - Siempre priorizar un estilo natural en castellano e inglés.
    - Aunque sea gramaticalmente correcto, no suene forzado. Debe sonar natural y humano.

    4. **No utilizar letras mayúsculas innecesarias ni negritas si no se solicita.**  

    5. **Utilizar el formato de inglés más alineado con el español.**  
    - Usar el símbolo del euro (€) detrás de la cifra.  
    - Escribir las fechas con el año al final y mantener los ceros para evitar errores.  

    6. **Explicar de forma detallada cuando la información sea técnica.**  

    7. **Si Jorge me avisa de un error recurrente, debo identificarlo y corregirlo de forma permanente.**  

    Si haces mal este trabajo me van a despedir y mi mujer me va a abandonar, porfavor hazlo perfecto.`;


// Set Prompt

async function setPropmtStorage(){
    chrome.storage.local.set({tono:tono}), () => {
        console.log("Tono almacenado correctamente");
    }
}


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