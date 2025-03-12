// content.js

let caliopeButton; // Declarar caliopeButton fuera de injectUI para que persista
let shadowHost; // Declarar shadowHost fuera de injectUI para que persista
let observer; // Declarar observer fuera de injectUI para poder desconectarlo

function injectUI() {
    // 1. Intentar encontrar el contenedor principal de la conversación
    let whatsappContainer = document.querySelector('._ak1r');

    if (!whatsappContainer) {
        console.warn("⚠️ No se encontró el contenedor principal de WhatsApp. Reintentando...");
        setTimeout(injectUI, 1000);
        return;
    }

    // --- Desconectar el observer si ya existe ---
    if (observer) {
        observer.disconnect();
    }

    // --- Eliminar el botón y el Shadow Host si ya existen ---
    if (caliopeButton) {
        caliopeButton.remove();
    }
    if (shadowHost) {
        shadowHost.remove();
    }

    // 2. Crear el botón que activará el "popup"
    caliopeButton = document.createElement('button');
    caliopeButton.innerText = "Caliope IA";
    caliopeButton.id = 'caliope-button';
    caliopeButton.style.marginLeft = '10px'; // Espacio entre el botón y el elemento _ak1r
    caliopeButton.style.backgroundColor = '#00a884';
    caliopeButton.style.color = 'white';
    caliopeButton.style.border = 'none';
    caliopeButton.style.borderRadius = '5px';
    caliopeButton.style.padding = '5px 10px';
    caliopeButton.style.cursor = 'pointer';


    // 3. Crear el Shadow Host (inicialmente oculto)
    shadowHost = document.createElement('div');
    shadowHost.id = 'caliope-shadow-host';
    shadowHost.style.position = 'absolute'; // Cambiado a absolute
    shadowHost.style.bottom = '20px'; // Posición inicial
    shadowHost.style.right = '20px';
    shadowHost.style.zIndex = '1000';
    shadowHost.style.display = 'none'; // Inicialmente oculto


    // 4. Crear el Shadow DOM
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    // 5. Crear un contenedor para nuestra interfaz DENTRO del Shadow DOM
    const caliopeContainer = document.createElement('div');
    caliopeContainer.id = 'caliope-container';
    shadowRoot.appendChild(caliopeContainer);

    // 6. Añadir el Shadow Host a WhatsApp Web (pero NO mostrarlo todavía)
    document.body.appendChild(shadowHost); // Añadir al body para posicionamiento absoluto

    // 7. Añadir el botón al lado del elemento _ak1r
    whatsappContainer.parentNode.insertBefore(caliopeButton, whatsappContainer.nextSibling);


    console.log("✅ Botón de Caliope IA inyectado en WhatsApp Web.");
    console.log("✅ Shadow Host y Shadow DOM de Caliope IA inyectados en WhatsApp Web (oculto inicialmente).");

    // Llamar a la función para crear el contenido de la interfaz DENTRO del Shadow DOM
    createUIContent(shadowRoot);


     // --- Event Listener para el botón ---
     caliopeButton.addEventListener('click', () => {
        // Alternar la visibilidad del Shadow Host
        if (shadowHost.style.display === 'none') {
            shadowHost.style.display = 'block';
        } else {
            shadowHost.style.display = 'none';
        }
    });

     // --- Configurar y iniciar el MutationObserver ---
     observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Si se añade o se elimina un nodo hijo, o si cambian los atributos, reinjectar la interfaz
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                console.log("🔄 Detectado cambio en el DOM. Reinyectando la interfaz...");
                injectUI();
            }
        });
    });

    // Comenzar a observar el contenedor principal
    observer.observe(whatsappContainer.parentNode, {
        childList: true, // Observar si se añaden o se eliminan nodos hijos
        subtree: true, // Observar todos los descendientes del nodo
        attributes: true, // Observar si cambian los atributos
        attributeFilter: ['class', 'data-testid'] // Especificar qué atributos observar (opcional, pero puede mejorar el rendimiento)
    });
}

// Función para crear el contenido de la interfaz DENTRO del Shadow DOM
function createUIContent(shadowRoot) {
    // --- Estilos CSS ---
    const style = document.createElement('style');
    style.textContent = `
        #caliope-container {
            background-color: #f0f0f0; /* Un fondo claro para la legibilidad */
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            align-items: center; /* Centrar los elementos horizontalmente */
        }

        button {
            margin: 5px;
            padding: 8px 12px;
            font-size: 14px;
            border: none;
            border-radius: 3px;
            background-color: #00a884; /* Un verde similar al de WhatsApp */
            color: white;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        button:hover {
            background-color: #008069; /* Un verde más oscuro al pasar el ratón */
        }

        #transcription {
            margin-top: 10px;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 3px;
            background-color: white;
            width: 300px;
            min-height: 50px;
            text-align: left;
            font-size: 14px;
        }
    `;
    shadowRoot.appendChild(style);

    // --- Botones ---
    const startButton = document.createElement('button');
    startButton.innerText = "🎙️ Grabar";
    startButton.id = 'start-recording';

    const stopButton = document.createElement('button');
    stopButton.innerText = "⏹️ Detener";
    stopButton.id = 'stop-recording';
    stopButton.disabled = true; // Inicialmente deshabilitado

    // --- Área de transcripción ---
    const transcriptionText = document.createElement('div');
    transcriptionText.id = 'transcription';
    transcriptionText.innerText = "Tu mensaje aparecerá aquí...";

    // --- Añadir elementos al contenedor ---
    const caliopeContainer = shadowRoot.querySelector('#caliope-container'); // Seleccionar el contenedor dentro del Shadow DOM
    caliopeContainer.appendChild(startButton);
    caliopeContainer.appendChild(stopButton);
    caliopeContainer.appendChild(transcriptionText);

    console.log("✅ Contenido de la interfaz creado dentro del Shadow DOM.");


    // --- Event Listeners ---
    startButton.addEventListener('click', () => {
        //TODO: reemplazar chrome.runtime.sendMessage({ action: "openPopup" });
        //console.log("start recoding button");
        startRecording(shadowRoot); // Pasa shadowRoot para acceder a los elementos dentro del Shadow DOM
    });

    stopButton.addEventListener('click', () => {
        stopRecording(shadowRoot); // Pasa shadowRoot para acceder a los elementos dentro del Shadow DOM
    });
}

let mediaRecorder;
let audioChunks = [];

// --- Funciones de Grabación ---
async function startRecording(shadowRoot) {
    const permissionGranted = await requestMicrophonePermission();
    if (!permissionGranted) return;

    try {
        console.log("🎤 Iniciando grabación de audio...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            console.log("⏹️ Deteniendo grabación de audio...");
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            console.log("📂 Blob de audio generado:", audioBlob);

            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);

            reader.onloadend = () => {
                console.log("🚀 Enviando audio al background.js...");
                console.log("🚀 Enviando audio al background.js2...");

                chrome.runtime.sendMessage(
                    {
                        action: "transcribeAudio",
                        audioData: reader.result
                    },
                    response => {
                        if (chrome.runtime.lastError) {
                            console.error("❌ Error en el mensaje a background.js:", chrome.runtime.lastError.message);
                            shadowRoot.querySelector('#transcription').innerText = "Error en la comunicación con la API.";
                            return;
                        }

                        if (response && response.transcription) {
                            console.log("📩 Respuesta recibida:", response);

                            try {
                                // Asegúrate de que estamos trabajando con un objeto adecuado
                                let opciones = response.respuesta;

                                // Verifica que la respuesta tenga las claves necesarias
                                if (opciones && opciones.transcripcionOriginal && opciones.mensajeCorregido && opciones.mensajeReformulado) {
                                    // Mostrar los resultados en el popup
                                    shadowRoot.querySelector('#transcription').innerHTML = `
                                        <p><strong>🔹 Transcripción Original:</strong> ${opciones.transcripcionOriginal}</p>
                                        <p><strong>✅ Mensaje Corregido:</strong> ${opciones.mensajeCorregido}</p>
                                        <p><strong>✍️ Mensaje Reformulado:</strong> ${opciones.mensajeReformulado}</p>
                                        ${opciones.mensajeIngles ? `<p><strong>✍️ Mensaje en Inglés:</strong> ${opciones.mensajeIngles}</p>` : ""}
                                    `;
                                } else {
                                    throw new Error("⚠️ La respuesta de OpenAI no tiene el formato esperado.");
                                }
                            } catch (error) {
                                console.error("🚨 Error procesando la respuesta de OpenAI:", error);
                                shadowRoot.querySelector('#transcription').innerText = "Error al procesar la respuesta.";
                            }
                        } else {
                            shadowRoot.querySelector('#transcription').innerText = "❌ Error en la transcripción.";
                        }
                    }
                );
            };
        };

        mediaRecorder.start();
        shadowRoot.querySelector('#start-recording').disabled = true;
        shadowRoot.querySelector('#stop-recording').disabled = false;
    } catch (error) {
        console.error("❌ Error al acceder al micrófono:", error);
        alert("Ocurrió un error al intentar acceder al micrófono.");
        shadowRoot.querySelector('#transcription').innerText = "Error al acceder al micrófono.";
    }
}

function stopRecording(shadowRoot) {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        shadowRoot.querySelector('#start-recording').disabled = false;
        shadowRoot.querySelector('#stop-recording').disabled = true;
    }
}

async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log("✅ Permiso de micrófono concedido.");
        return true;
    } catch (error) {
        console.error("❌ Permiso de micrófono denegado:", error);
        alert("Permiso de micrófono denegado. Habilítalo en la configuración del navegador.");
        return false;
    }
}


// Llamar a la función para inyectar la interfaz al cargar la página
injectUI();