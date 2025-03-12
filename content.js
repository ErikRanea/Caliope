// content.js

let caliopeButton;
let mediaRecorder;
let audioChunks = [];
let streamMicrofono;
let isRecording = false;
let isPaused = false;

function injectUI() {
    // 1. Intentar encontrar el contenedor principal de la conversación
    let whatsappContainer = document.querySelector('._ak1r');

    if (!whatsappContainer) {
        console.warn("⚠️ No se encontró el contenedor principal de WhatsApp. Reintentando...");
        setTimeout(injectUI, 1000);
        return;
    }

    // --- Eliminar el botón si ya existe ---
    if (caliopeButton) {
        caliopeButton.remove();
    }

    // 2. Crear el botón que activará la grabación
    caliopeButton = document.createElement('button');
    caliopeButton.innerHTML = '<i class="bi bi-mic-fill"></i> Caliope IA'; // Usar el icono de Bootstrap
    caliopeButton.id = 'caliope-button';
    caliopeButton.style.marginLeft = '10px';
    caliopeButton.style.backgroundColor = '#00a884';
    caliopeButton.style.color = 'white';
    caliopeButton.style.border = 'none';
    caliopeButton.style.borderRadius = '5px';
    caliopeButton.style.padding = '5px 10px';
    caliopeButton.style.cursor = 'pointer';
    caliopeButton.style.fontFamily = 'Inter, sans-serif'; // Tipografía Inter

    // 3. Añadir el botón al lado del elemento _ak1r
    whatsappContainer.parentNode.insertBefore(caliopeButton, whatsappContainer.nextSibling);

    console.log("✅ Botón de Caliope IA inyectado en WhatsApp Web.");

    // --- Event Listener para el botón ---
    caliopeButton.addEventListener('click', () => {
        // Ocultar el botón de Caliope IA
        caliopeButton.style.display = 'none';

        // Crear los controles de grabación
        createRecordingControls(whatsappContainer.parentNode, whatsappContainer.nextSibling);
    });
}

function createRecordingControls(parent, nextSibling) {
    // --- Crear el contenedor para los controles ---
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'caliope-controls-container';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.marginLeft = '10px'; // Espacio entre los controles y el elemento _ak1r

    // --- Botón de Papelera ---
    const trashButton = document.createElement('button');
    trashButton.innerHTML = '<i class="bi bi-trash-fill"></i>';
    trashButton.style.backgroundColor = '#dc3545'; // Rojo
    trashButton.style.color = 'white';
    trashButton.style.border = 'none';
    trashButton.style.borderRadius = '5px';
    trashButton.style.padding = '5px 10px';
    trashButton.style.cursor = 'pointer';
    trashButton.addEventListener('click', () => {
        // Detener la grabación y limpiar
        stopRecording(true);
        // Eliminar los controles de grabación
        controlsContainer.remove();
        // Mostrar el botón de Caliope IA
        caliopeButton.style.display = 'inline-block';
    });

    // --- Ondas de Audio ---
    const audioWaves = document.createElement('div');
    audioWaves.id = 'caliope-audio-waves';
    audioWaves.style.width = '100px'; // Aumentar el ancho para más ondas
    audioWaves.style.height = '20px';
    audioWaves.style.display = 'flex'; // Usar flexbox para las ondas
    audioWaves.style.alignItems = 'center';
    audioWaves.style.justifyContent = 'space-around'; // Espacio entre las ondas

    // Crear las ondas
    for (let i = 0; i < 5; i++) { // Crear 5 ondas
        const wave = document.createElement('div');
        wave.classList.add('caliope-wave');
        wave.style.width = '5px';
        wave.style.backgroundColor = '#00a884'; // Verde
        wave.style.animation = `caliope-wave-animation ${Math.random() * 1 + 0.5}s infinite alternate`; // Animación aleatoria
        audioWaves.appendChild(wave);
    }

    // --- Botón de Pausa/Reanudar ---
    const pauseButton = document.createElement('button');
    pauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
    pauseButton.style.backgroundColor = '#ffc107'; // Amarillo
    pauseButton.style.color = 'black';
    pauseButton.style.border = 'none';
    pauseButton.style.borderRadius = '5px';
    pauseButton.style.padding = '5px 10px';
    pauseButton.style.cursor = 'pointer';
    pauseButton.addEventListener('click', () => {
        if (isPaused) {
            mediaRecorder.resume();
            pauseButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
        } else {
            mediaRecorder.pause();
            pauseButton.innerHTML = '<i class="bi bi-play-fill"></i>';
        }
        isPaused = !isPaused;
    });

     // --- Botón de Detener ---
     const stopButton = document.createElement('button');
     stopButton.innerHTML = '<i class="bi bi-stop-fill"></i> Detener';
     stopButton.style.backgroundColor = '#00a884'; // Verde
     stopButton.style.color = 'white';
     stopButton.style.border = 'none';
     stopButton.style.borderRadius = '5px';
     stopButton.style.padding = '5px 10px';
     stopButton.style.cursor = 'pointer';
     stopButton.addEventListener('click', () => {
         stopRecording(false, () => { // Detener la grabación y luego insertar el texto
             controlsContainer.remove(); // Eliminar los controles
             caliopeButton.style.display = 'inline-block'; // Mostrar el botón de Caliope IA
         });
     });

    // --- Añadir los controles al contenedor ---
    controlsContainer.appendChild(trashButton);
    controlsContainer.appendChild(audioWaves);
    controlsContainer.appendChild(pauseButton);
    controlsContainer.appendChild(stopButton); // Añadir el botón de detener

    // --- Insertar el contenedor de controles en el DOM ---
    parent.insertBefore(controlsContainer, nextSibling);

    // --- Iniciar la grabación ---
    startRecording();
}

// --- Funciones de Grabación ---
async function startRecording() {
    const permissionGranted = await requestMicrophonePermission();
    if (!permissionGranted) return;

    try {
        console.log("🎤 Iniciando grabación de audio...");
        streamMicrofono = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(streamMicrofono, { mimeType: "audio/webm;codecs=opus" });
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
                chrome.runtime.sendMessage(
                    {
                        action: "transcribeAudio",
                        audioData: reader.result
                    },
                    response => {
                        if (chrome.runtime.lastError) {
                            console.error("❌ Error en el mensaje a background.js:", chrome.runtime.lastError.message);
                            // TODO: Mostrar el error en la interfaz
                            return;
                        }

                        if (response && response.transcription) {
                            console.log("📩 Respuesta recibida:", response);

                            try {
                                let opciones = response.respuesta;

                                if (opciones && opciones.transcripcionOriginal && opciones.mensajeCorregido && opciones.mensajeReformulado) {
                                    // Insertar las respuestas en el chat de WhatsApp
                                    insertText(opciones.transcripcionOriginal); // Insertar la transcripción original
                                    console.log("🔹 Transcripción Original:", opciones.transcripcionOriginal);
                                    console.log("✅ Mensaje Corregido:", opciones.mensajeCorregido);
                                    console.log("✍️ Mensaje Reformulado:", opciones.mensajeReformulado);
                                    console.log("✍️ Mensaje en Inglés:", opciones.mensajeIngles);
                                } else {
                                    console.error("⚠️ La respuesta de OpenAI no tiene el formato esperado.");
                                }
                            } catch (error) {
                                console.error("🚨 Error procesando la respuesta de OpenAI:", error);
                                // TODO: Mostrar el error en la interfaz
                            }
                        } else {
                            // TODO: Mostrar el error en la interfaz
                            console.error("❌ Error en la transcripción.");
                        }
                    }
                );
            };
        };

        mediaRecorder.start();
        isRecording = true;
    } catch (error) {
        console.error("❌ Error al acceder al micrófono:", error);
        alert("Ocurrió un error al intentar acceder al micrófono.");
        // TODO: Mostrar el error en la interfaz
    }
}

function stopRecording(liberarMicrofono = false, callback = () => {}) {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        isRecording = false;

        if (liberarMicrofono && streamMicrofono) {
            streamMicrofono.getTracks().forEach(track => track.stop()); // Detener todas las pistas de audio
            streamMicrofono = null; // Limpiar la variable
            console.log("🎤 Micrófono liberado.");
        }

        callback(); // Llamar al callback después de detener la grabación
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

function insertText(text) {
    // 1. Encontrar el textarea (el selector puede variar)
    const textarea = document.querySelector("div[contenteditable='true']");

    
    if (textarea) {
        // 3. Simular la entrada de texto
        textarea.focus();
        document.execCommand('insertText', false, text);

        // 4. Disparar un evento de input para que WhatsApp detecte el cambio
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);


        console.log("✅ Texto insertado en el chat:", text);
    } else {
        console.error("❌ No se encontró el textarea del chat o el botón de enviar.");
    }
}

// Llamar a la función para inyectar la interfaz al cargar la página
injectUI();

// --- Inyectar los estilos CSS ---
const style = document.createElement('style');
style.textContent = `
    /* Importar Bootstrap Icons */
    @import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

    /* Estilos para las ondas de audio */
    .caliope-wave {
        width: 5px;
        height: 20px;
        background-color: #00a884; /* Verde */
        border-radius: 5px;
        animation: caliope-wave-animation 1s infinite alternate;
    }

    @keyframes caliope-wave-animation {
        0% {
            height: 5px;
        }
        100% {
            height: 20px;
        }
    }
`;
document.head.appendChild(style);