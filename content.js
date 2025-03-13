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
    caliopeButton.innerHTML = '<i class="bi bi-soundwave"></i>'; // Usar el icono de Bootstrap
    caliopeButton.style.fontSize = '30px'; // Aumentar el tamaño de la fuente
    caliopeButton.id = 'caliope-button';
    caliopeButton.style.marginLeft = '10px';
    caliopeButton.style.color = '#8696a0';
    caliopeButton.style.backgroundColor = 'transparent';
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
    applyButtonStyle(trashButton);
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
    audioWaves.style.justifyContent = 'center'; // Espacio entre las ondas

    const waves = []; // Almacenar las ondas
    for (let i = 0; i < 5; i++) { // Crear 5 ondas
        const wave = document.createElement('div');
        wave.classList.add('caliope-wave');
        wave.style.width = '5px';
        wave.style.margin = '0 2px'; // Espacio entre las ondas
        wave.style.backgroundColor = '#00a884'; // Verde
        audioWaves.appendChild(wave);
        waves.push(wave); // Guardar la referencia a la onda
    }

    // --- Botón de Pausa/Reanudar ---
    const pauseButton = document.createElement('button');
    pauseButton.innerHTML = '<i class="bi bi-pause"></i>';
    applyButtonStyle(pauseButton);
    pauseButton.addEventListener('click', () => {
        if (isPaused) {
            mediaRecorder.resume();
            pauseButton.innerHTML = '<i class="bi bi-pause"></i>';
        } else {
            mediaRecorder.pause();
            pauseButton.innerHTML = '<i class="bi bi-play"></i>';
        }
        isPaused = !isPaused;
    });

     // --- Botón de Detener ---
     const stopButton = document.createElement('button');
     stopButton.innerHTML = '<i class="bi bi-stop-fill"></i>';
     applyButtonStyle(stopButton);
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
    startRecording(waves, audioWaves); // Pasa las ondas y el contenedor a la función startRecording
}

// --- Funciones de Grabación ---
async function startRecording(waves, audioWaves) {
    const permissionGranted = await requestMicrophonePermission();
    if (!permissionGranted) return;

    try {
        console.log("🎤 Iniciando grabación de audio...");
        streamMicrofono = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(streamMicrofono, { mimeType: "audio/webm;codecs=opus" });
        audioChunks = [];

        // --- Crear el contexto de audio y el analizador ---
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(streamMicrofono);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        // --- Función para actualizar las ondas de audio ---
        function updateAudioWaves() {
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

             // Normalizar el valor promedio a un rango de 0 a 1
             const normalizedValue = average / 128;
           
             // Establecer una altura máxima para las ondas
             const maxHeight = 20;

            for (let i = 0; i < waves.length; i++) {
                const wave = waves[i];
                 // Establecer la altura de la onda basada en el valor normalizado y la altura máxima
                wave.style.height = `${normalizedValue * maxHeight}px`;
            }

            requestAnimationFrame(updateAudioWaves);
        }

        updateAudioWaves(); // Iniciar la animación

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            //Detener el stream de audio
            source.disconnect(analyser);
            analyser.disconnect(audioContext);
            audioContext.close();

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
                            console.log("📩 Respuesta recibida:", JSON.stringify(response));

                            try {
                                


                                if (response && response.respuesta) {
                                    // Insertar las respuestas en el chat de WhatsApp
                                    insertText(response.respuesta); // Insertar la transcripción original
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

        audioChunks = []; // Resetear los chunks de audio

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
    const textarea = document.querySelector("div[aria-label='Escribe un mensaje'][contenteditable='true']");

    
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

function applyButtonStyle(button) {
    button.style.fontSize = '30px'; // Aumentar el tamaño de la fuente
    button.style.marginLeft = '10px';
    button.style.color = '#8696a0';
    button.style.backgroundColor = 'transparent';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.padding = '5px 10px';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'Inter, sans-serif'; // Tipografía Inter
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
        
    }
`;
document.head.appendChild(style);