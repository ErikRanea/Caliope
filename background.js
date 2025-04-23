importScripts("config.js");
importScripts("whisper.js");
importScripts("openai.js");
importScripts("sessions.js");


let defaultTono = `

Recibirás una transcripción de voz y deberás redactarla como si fuera un mensaje de WhatsApp enviado desde la cuenta oficial de "Ven a Malta".

La respuesta debe ser:
- Natural y cercana, pero también profesional y empática.
- Frases cortas, claras, sin tecnicismos ni lenguaje formal excesivo.

## Reglas de estilo:
- Si en el mensaje original hay un saludo, debe conservarse sin cambios y mantenerse en la misma posición en la que aparece (inicio o final).
- El mensaje debe mantener exactamente el mismo **significado** del original.
- Reestructura frases largas o desordenadas para mayor fluidez.
- No utilices expresiones formales.
- No utilices **guiones largos (—)**. Usa comas, puntos o reformula.
- No escribas en mayúsculas innecesarias ni utilices negritas si no se piden.
- No generes despedidas a menos que estén presentes en el original.
- No modifiques los saludos ni frases informales, a menos que estén mal escritos.

## Idiomas:
- Si el mensaje está en español, responde en **español de España**.
- Si la transcripción comienza en otro idioma (como inglés), redacta la respuesta completa en ese idioma, siguiendo las mismas reglas de estilo.
- Si en cualquier parte del mensaje se indica expresamente que la respuesta debe ser en otro idioma, hazlo en ese idioma, aunque la transcripción esté en español.
- En todos los casos, si la respuesta es en inglés, utiliza **inglés británico** de forma natural.

---

Esto es muy importante para mi trabajo. Si lo haces bien te daré 200 euros de propina. Por favor, sigue todas las indicaciones.
    
    
    `;

// Set Prompt

async function setPropmtStorage(tono = null){
    if(tono != null){
        chrome.storage.local.set({tono:tono}), () => {
            console.log("Tono almacenado correctamente siendo el siguiente " + tono);
        }
    }
    else{
        chrome.storage.local.set({tono:defaultTono}), () => {
            console.log("Tono almacenado correctamente siendo el siguiente " + tono);
        }
    }
}

setPropmtStorage();

async function getTonoStorage() {
    return new Promise(resolve => {
        chrome.storage.local.get(["tono"], (result) => {
            if (result.tono) {  // Simplificado: no necesitas comprobar .length > 0
                console.log("Tono recogido del storage correctamente:", result.tono);
                resolve(result.tono); // Resuelve la promesa CON EL VALOR DEL TONO
            } else {
                console.warn("⚠️ No se encontró un tono en el storage.");
                resolve(null); // O resolve('') si prefieres una cadena vacía
            }
        });
    });
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
    if (request.action === "transcribeAudio") {
        if (request.audioData) {
            try {
                const byteCharacters = atob(request.audioData.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const audioBlob = new Blob([byteArray], { type: "audio/webm" });

                transcribeAudio(audioBlob)
                    .then(async transcription => {
                        console.log("✅ Transcripción recibida:", transcription);
                        const tono = await getTonoStorage();

                        // Obtener o crear sesión válida
                        const sesion = await obtenerSesionValida("usuario_unico", tono);
                        sesion.messages.push({ role: "user", content: transcription });

                        
                        // Usar lógica de openai.js para enviar el contexto completo y actualizar sesión
                       // const respuesta = await enviarGPTconSesion(sesion);

                        const respuesta = await respuestaTonalizada(transcription,tono);
                        
                        await actualizarSesion(sesion.id, transcription, respuesta);

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
            return true;
        } else {
            sendResponse({ error: "No se recibió audio válido." });
        }
    }

    if (request.action === "guardarTono") {
        if (request.tono) {
            setPropmtStorage(request.tono);
            sendResponse({ message: "todo correcto" });
        } else {
            sendResponse({ error: "Error al enviar el tono, no llegó correctamente" });
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


//--------------------------------------------------------------------------

//Crear popup

chrome.action.onClicked.addListener((tab) => {
    console.log("Botón de la extensión presionado");
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectShadowDom, // Inyecta una función, no un archivo
    });
});



// Listener de acciones del ShadowDOM

chrome.runtime.onMessage.addListener((request,sender,sendResponde) => {
    if(request.action === "guardarTono"){
        if(request.tono){
            console.log("Tono recibido");
            
            //guardar nuevo tono
            setPropmtStorage(request.tono);
            console.log("Tono guardado con éxito");
            sendResponde({message: "todo correcto"});
        }
        else{
            console.error("El tono no llego correctamente");
            sendResponde({error:"Error al enviar el tono, no llego correctamente"})
        }
    }
});





// Funciones para inyectar dentro del ShadowDOM

function injectShadowDom() {
    const popupId = 'caliope-ShadowDom';

    function removeExistinPopup() {
        const existingPopup = document.getElementById(popupId);
        if (existingPopup) {
            existingPopup.remove();
        }
    }

    removeExistinPopup();

    const popupContainer = document.createElement('div');
    popupContainer.id = popupId;
    const shadow = popupContainer.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
    .popup {
        position: absolute;
        top: 20px;
        left: 20px;
        width: 540px;
        min-width: 280px;
        min-height: 400px;
        background-color: rgb(202, 0, 98);
        border-radius: 5px;
        z-index: 1000;
        overflow: auto;
        display: flex;
        flex-direction: column;
    }

    .header {
        font-family: Inter, sans-serif;
        color: rgb(255, 255, 255);
        font-size: 20px;
        margin-bottom: 10px;
        cursor: move;
        letter-spacing: -0.06em;
        font-weight: 600;
        padding: 15px 10px 5px 20px;
        flex-shrink: 0;
    }

    label, textarea, button {
        font-family: "Inter", sans-serif;
        font-size: 14px;
        box-sizing: border-box;
    }

    textarea {
        width: 90%;
        flex-grow: 1;
        margin: 0 0.5rem 10px auto;
        padding: 8px;
        resize: none;
        border-radius: 5px;
        border: none;
        color: black;
        background-color: white;
        letter-spacing: -0.05em;
    }

    label {
        color: white;
        padding: 0 0 5px 20px;
    }

    button {
        margin: 0 0.5rem 10px auto;
        padding: 8px 20px;
        border-radius: 8px;
        cursor: pointer;
        border: none;
        font-weight: 600;
        letter-spacing: -0.06em;
    }

    .popup button:last-of-type {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgb(40, 40, 40);
        color: white;
        font-size: 20px;
        padding: 2px 8px;
        border-radius: 5px;
    }

    .resizer {
        width: 15px;
        height: 15px;
        position: absolute;
        right: 0;
        bottom: 0;
        cursor: se-resize;
        z-index: 10;
        background: transparent;
    }

    .linea {
        border: 1px solid rgb(255, 255, 255);
        width: 90%;
        margin: 5px auto 10px auto;
    }
`;

    shadow.appendChild(style);

    const popup = document.createElement('div');
    popup.classList.add('popup');

    const fontStyle = document.createElement('style');
    shadow.appendChild(fontStyle);

    const header = document.createElement('div');
    header.classList.add('header');
    header.textContent = 'Caliope IA   |   Configuración';
    header.style.padding = '15px 10px 5px 20px';
    popup.appendChild(header);

    const linea = document.createElement('div');
    linea.style.border = '1px solid rgb(255, 255, 255)';
   // linea.style.width = '316px';
    linea.style.margin = '5px 0px 10px 0px';
    popup.appendChild(linea);

    const promptLabel = document.createElement('label');
    promptLabel.textContent = 'Tono del mensaje';
    promptLabel.style.color = 'rgb(255, 255, 255)';
    promptLabel.style.fontFamily = '"Inter", sans-serif';
    promptLabel.style.fontSize = '14px';
    promptLabel.style.padding = '10px 10px 10px 20px';
    promptLabel.style.letterSpacing = '-0.03em';
    popup.appendChild(promptLabel);

    const promptTextarea = document.createElement('textarea');
    promptTextarea.id = 'caliope-tono';
    promptTextarea.rows = 5;
    promptTextarea.cols = 30;
    promptTextarea.style.backgroundColor = 'rgb(255, 255, 255)';
    promptTextarea.style.borderRadius = '5px';
    promptTextarea.style.color = 'black';
    promptTextarea.style.letterSpacing = '-0.05em';
    promptTextarea.style.padding = '5px';
    promptTextarea.style.border = 'none';
    promptTextarea.style.fontFamily = '"Inter", sans-serif';
    promptTextarea.style.fontSize = '14px';
    promptTextarea.style.resize = 'none';
    promptTextarea.style.boxSizing = 'border-box';
   // promptTextarea.style.width = '270px';
    promptTextarea.style.margin = '20px';

    chrome.storage.local.get(["tono"], (result) => {
        promptTextarea.value = result.tono || '';
    });
    popup.appendChild(promptTextarea);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar';
    saveButton.style.backgroundColor = 'rgb(255, 255, 255)';
    saveButton.style.color = 'rgb(202, 0, 98)';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '8px';
    saveButton.style.padding = '8px 20px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.fontFamily = 'Inter, sans-serif';
    saveButton.style.letterSpacing = '-0.06em';
    saveButton.style.fontSize = '15px';
    saveButton.style.fontWeight = '600';
    //saveButton.style.margin = '0px 0px 20px 20px';
    saveButton.addEventListener('click', () => {
        const tono = shadow.getElementById('caliope-tono').value;
        chrome.runtime.sendMessage({ action: "guardarTono", tono }, (response) => {
            if (!response.error) alert('tono guardado!');
            else alert('Error al guardar el tono: ' + response.error);
        });
    });
    popup.appendChild(saveButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.fontFamily = 'Inter, sans-serif';
    closeButton.style.backgroundColor = 'rgb(40, 40, 40)';
    closeButton.style.color = 'white';
    closeButton.style.borderRadius = '5px';
    closeButton.style.fontSize = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.addEventListener('click', () => popupContainer.remove());
    popup.appendChild(closeButton);

    // Añadir el resizer al popup
    const resizer = document.createElement('div');
    resizer.classList.add('resizer');
    popup.appendChild(resizer);

    shadow.appendChild(popup);

    let offsetX, offsetY;
    header.addEventListener('mousedown', (e) => {
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;

        function drag(e) {
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;
            newX = Math.max(0, Math.min(newX, window.innerWidth - popup.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - popup.offsetHeight));
            popup.style.left = newX + 'px';
            popup.style.top = newY + 'px';
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', () => document.removeEventListener('mousemove', drag));
    });

    // Redimensionamiento del popup
    let isResizing = false;
    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    });

    function resize(e) {
        if (!isResizing) return;
        const rect = popup.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const newHeight = e.clientY - rect.top;
        popup.style.width = Math.max(280, newWidth) + 'px';
        popup.style.height = Math.max(200, newHeight) + 'px';
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('mouseup', stopResize);
    }

    document.body.appendChild(popupContainer);
}
