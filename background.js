importScripts("config.js");
importScripts("whisper.js");
importScripts("openai.js");
importScripts("sessions.js");


let defaultTono = `
# Tono por defecto para mejorar mensajes
    Al recibir un mensaje de WhatsApp, email o nota de voz, mejóralo siguiendo estas reglas. La respuesta debe sonar natural, cercana y profesional, en línea con el estilo de atención al cliente de *Ven a Malta*.
    ## Objetivo general:
    Ofrecer versiones mejoradas del mensaje original que sean claras, empáticas y humanas, adaptadas al contexto de asesoría educativa o atención al cliente.
    ##  Reglas de estilo:
    - **Mantén los saludos y frases informales si están bien escritos**. No los corrijas innecesariamente. Ej: "Saludos desde Malta!"” está perfecto así.
    - Usa un tono **cercano, profesional y amable**.
    - Frases cortas, claras, sin tecnicismos ni lenguaje formal excesivo.
    - No repitas palabras ni ideas.
    - Reestructura frases largas o desordenadas para mayor fluidez.
    - Usa siempre un estilo **business casual en español de España**.
    ##  Nunca hagas lo siguiente:
    - No uses palabras sofisticadas, rebuscadas o que suenen académicas.
    - No empieces con “Estimado”, “Le escribo para” ni expresiones demasiado formales.
    - No utilices **guiones largos (—)**. Usa comas, puntos o reformula.
    - No escribas en mayúsculas innecesarias ni utilices negritas si no se piden.
    - No generes despedidas a menos que estén presentes en el original.
    - No modifiques los saludos ni frases informales, a menos que estén mal escritos.
    - NO MODIFIQUES NI REORGANICES LOS SALUDOS
    ## Idiomas:
    - Si el mensaje está en español, responde en **español de España**.
    - Si el mensaje está en inglés, responde en **inglés británico**, con expresiones y ortografía adaptadas al entorno laboral en Malta.
    - Si después de una respuesta en español escribo **"ingles"**, traduce al inglés británico con naturalidad.
    ## Contexto y precisión:
    1. El mensaje debe mantener exactamente el mismo **significado** del original.
    2. Reformula lo necesario para que suene natural y humano.
    3. Si el mensaje incluye información técnica (visados, precios, fechas), revísala y corrígela si es necesario.
    4. Si hay algún saludo, no lo modifiques. 
    


    Si no me devuelves el mensaje correctamente, me van a despedir y mi mujer me va a abandonar. Por favor, hazlo perfecto.
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

                        //Se pasa el tono y la transcripción
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

function injectShadowDom(){

    const popupId = 'caliope-ShadowDom';

    function removeExistinPopup(){
        const existingPopup = document.getElementById(popupId);
        if(existingPopup){
            existingPopup.remove();
        }
    }


    removeExistinPopup();


    // LÓGICA DE CREACIÓN DEL SHADODOM

    const popupContainer = document.createElement('div');
    popupContainer.id = popupId;

    // Crear el Shadow DOM
    const shadow = popupContainer.attachShadow({ mode: 'open' });

    // Estilos CSS para el popup (dentro del Shadow DOM)
    const style = document.createElement('style');
    style.textContent = `
        .popup {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 320px;
            background-color:rgb(202, 0, 98);
            border-radius: 5px;
            z-index: 1000;
        }
        .header {
            font-family: Inter, sans-serif;
            color:rgb(255, 255, 255);
            font-size: 40px;
            margin-bottom: 10px;
            cursor: move;
            letter-spacing: -0.06em; /* Espaciado entre letras */
            font-size: 20px; /* Cambia el tamaño de la fuente */
            font-weight: 600; /* Cambia el grosor de la fuente */
                    }
        /* Agrega más estilos aquí */
    `;
    shadow.appendChild(style);

    // Crear el HTML del popup
    const popup = document.createElement('div');
    popup.classList.add('popup'); // Usamos una clase para aplicar los estilos

    // Importar la tipografía desde una carpeta
    const fontStyle = document.createElement('style');
    
    shadow.appendChild(fontStyle);
    const header = document.createElement('div');
    header.classList.add('header');
    header.textContent = 'Caliope IA   |   Configuración';
    header.style.padding = '15px 10px 5px 20px';

    popup.appendChild(header);

    const linea = document.createElement('div');
    linea.style.border = '1px solid rgb(255, 255, 255)'; // Cambia el color de la línea
    linea.style.width = '316px'; // Ancho completo
    linea.style.margin = '5px 0px 10px 0px'; // Sin margen
    popup.appendChild(linea);

    const promptLabel = document.createElement('label');
    promptLabel.textContent = 'Tono del mensaje';
    promptLabel.style.color = 'rgb(255, 255, 255)'; // Cambia el color del texto
    promptLabel.style.fontFamily = '"Inter", sans-serif';
    promptLabel.style.fontSize = '14px'; // Cambia el tamaño de la fuente
    promptLabel.style.padding = '10px 10px 10px 20px';
    promptLabel.style.letterSpacing = '-0.03em'; // Espaciado entre letras

    popup.appendChild(promptLabel);

    const promptTextarea = document.createElement('textarea');
    promptTextarea.id = 'caliope-tono'; // ID para acceder al textarea
    promptTextarea.rows = 5;
    promptTextarea.cols = 30;
    promptTextarea.style.backgroundColor = 'rgb(255, 255, 255)';
    promptTextarea.style.borderRadius = '5px';
    promptTextarea.placeholder = 'Un tono directo y bien estructurado, con estilo business casual...';
    promptTextarea.style.setProperty('--placeholder-color', 'rgb(0, 0, 0)');
    promptTextarea.style.color = 'var(--placeholder-color)';
    promptTextarea.style.letterSpacing = '-0.05em'; // Espaciado entre letras
    promptTextarea.style.padding = '5px 5px';
    promptTextarea.style.border = 'none';
    promptTextarea.style.fontFamily = '"Inter", sans-serif';
    promptTextarea.style.fontSize = '14px';
    promptTextarea.style.resize = 'none'; // Deshabilitar el redimensionamiento
    promptTextarea.style.boxSizing = 'border-box'; // Asegura que el padding no afecte al tamaño total
    promptTextarea.style.width = '270px'; // Asegura que el textarea ocupe todo el ancho disponible
    promptTextarea.style.margin = '20px'; // Añadir padding interno
    promptTextarea.style.fontFamily = '"Inter", sans-serif'; // Cambia la fuente a Inter
    promptTextarea.style.fontSize = '14px'; // Cambia el tamaño de la fuente
    promptTextarea.style.color = 'black'; // Cambia el color del texto
    
    popup.appendChild(promptTextarea);
    
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar';
    saveButton.style.backgroundColor = 'rgb(255, 255, 255)'; // Cambia el color de fondo
    saveButton.style.color = 'rgb(202, 0, 98)'; // Cambia el color del texto
    saveButton.style.border = 'none'; // Sin borde
    saveButton.style.borderRadius = '8px'; // Bordes redondeados
    saveButton.style.padding = '8px 20px'; // Espaciado interno
    saveButton.style.cursor = 'pointer'; // Cambia el cursor al pasar por encima
    saveButton.style.fontFamily = 'Inter, sans-serif'; // Cambia la fuente a Inter
    saveButton.style.letterSpacing = '-0.06em'; // Espaciado entre letras
    saveButton.style.fontSize = '15px'; // Cambia el tamaño de la fuente
    saveButton.style.fontWeight = '600'; // Cambia el grosor de la fuente
    saveButton.style.margin = '0px 0px 20px 20px'; // Añadir margen superior
    saveButton.addEventListener('click', () => {

        tono = shadow.getElementById('caliope-tono').value;
        console.log("El tono al enviar el botón es "+ tono);
        // Usa chrome.runtime.sendMessage para comunicarte con background.js
        chrome.runtime.sendMessage({ action: "guardarTono", tono: tono }, (response) => {
            if (!response.error) {
                alert('tono guardado!');
            } else {
                alert('Error al guardar el tono: ' + response.error);
            }
        });
    });
    popup.appendChild(saveButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.fontFamily = 'Inter, sans-serif'; // Cambia la fuente a Inter
    closeButton.style.backgroundColor = 'rgb(40, 40, 40)'; // Color del texto
    closeButton.style.color = 'white'; // Color del texto
    closeButton.style.borderRadius = '5px'; // Bordes redondeados
    closeButton.style.fontSize = '20px'; // Tamaño de la fuente
    closeButton.style.cursor = 'pointer'; // Cambia el cursor al pasar por encima
    closeButton.style.position = 'absolute'; // Posición absoluta
    closeButton.style.top = '10px'; // Posición superior
    closeButton.style.right = '10px'; // Posición derecha
    closeButton.addEventListener('click', () => {
        popupContainer.remove(); // Elimina el popup
    });
    popup.appendChild(closeButton);

    // Añadir el popup al Shadow DOM
    shadow.appendChild(popup);

    // Lógica de arrastre
    let offsetX, offsetY;
    header.addEventListener('mousedown', (e) => {
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;

        function drag(e) {
            // Límite de la posición del popup (sin desbordar la ventana)
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;
            // Evitar que el popup se mueva fuera de la ventana
            newX = Math.max(0, Math.min(newX, window.innerWidth - popup.offsetWidth));
            newY = Math.max(0, Math.min(newY, window.innerHeight - popup.offsetHeight));
            popup.style.left = newX + 'px';
            popup.style.top = newY + 'px';
        }

        document.addEventListener('mousemove', drag);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', drag);
        });
    });

    document.body.appendChild(popupContainer);

}