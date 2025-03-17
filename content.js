// content.js

let caliopeButton;
let mediaRecorder;
let audioChunks = [];
let audioContext;
let streamMicrofono;
let isRecording = false;
let isPaused = false;
let isDeleted = false;
let setBoton = false;

// Function to apply button style
function applyButtonStyle(button) {
    button.style.fontSize = '30px';
    button.style.marginLeft = '10px';
    button.style.color = '#8696a0';
    button.style.backgroundColor = 'transparent';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.padding = '5px 10px';
    button.style.cursor = 'pointer';
    button.style.fontFamily = 'Inter, sans-serif';
}

function injectUI(whatsappContainer) {
    if (!whatsappContainer) {
        console.warn("⚠️ No se encontró el contenedor principal de WhatsApp.");
        return;
    }

    // 2. Crear el botón que activará la grabación
    caliopeButton = document.createElement('button');
    caliopeButton.innerHTML = '<i class="bi bi-soundwave"></i>'; // Usar el icono de Bootstrap
    applyButtonStyle(caliopeButton); // Apply style here
    caliopeButton.id = 'caliope-button';

    // 3. Añadir el botón al lado del elemento _ak1r
    whatsappContainer.parentNode.insertBefore(caliopeButton, whatsappContainer.nextSibling);

    console.log("✅ Botón de Caliope IA inyectado en WhatsApp Web.");

    // --- Event Listener para el botón ---
    caliopeButton.addEventListener('click', () => {
        // Ocultar el botón de Caliope IA
        caliopeButton.style.display = 'none';

        // Crear los controles de grabación
        createRecordingControls();
    });

    setBoton = true;
}

function createRecordingControls() {
     // 1. Intentar encontrar el contenedor principal de la conversación
     let whatsappContainer = document.querySelector('._ak1r');

     if (!whatsappContainer) {
         console.warn("⚠️ No se encontró el contenedor principal de WhatsApp para los controles. Reintentando...");
         return;
     }
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
        console.log("El botón de basura se ha seleccionado");
        isDeleted = true;
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
    audioWaves.style.width = '80px'; // Aumentar el ancho para más ondas
    audioWaves.style.height = '20px';
    audioWaves.style.backgroundColor = '#7c8c95'; // Gris claro
    audioWaves.style.display = 'flex'; // Usar flexbox para las ondas
    audioWaves.style.borderRadius = '3px';
    audioWaves.style.padding = '5px 0px'; // Espacio entre los controles
    audioWaves.style.alignItems = 'center';
    audioWaves.style.justifyContent = 'center'; // Espacio entre las ondas

    const waves = []; // Almacenar las ondas
    for (let i = 0; i < 5; i++) { // Crear 5 ondas
        const wave = document.createElement('div');
        wave.classList.add('caliope-wave');
        wave.style.width = '5px';
        wave.style.margin = '0 2px'; // Espacio entre las ondas
        wave.style.backgroundColor = '#202c33'; 
        audioWaves.appendChild(wave);
        waves.push(wave); // Guardar la referencia a la onda
    }

    // --- Botón de Pausa/Reanudar ---
    const pauseButton = document.createElement('button');
    pauseButton.innerHTML = '<i class="bi bi-pause"></i>';
    applyButtonStyle(pauseButton);
    pauseButton.addEventListener('click', () => {
        console.log("Se ha seleccionado el botón de pausa");
        if (isPaused) {
            console.log("Reinciando grabación");
            mediaRecorder.resume();
            console.log("Se ha reiniciado el grabado");
            pauseButton.innerHTML = '<i class="bi bi-pause"></i>';
        } else {
            console.log("Deteniendo grabación");
            mediaRecorder.pause();
            console.log("Se ha detenido la grabación");
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
            isDeleted = false;
            console.log("El valor de isDeleted es "+isDeleted);
            controlsContainer.remove(); // Eliminar los controles
            caliopeButton.style.display = 'inline-block'; // Mostrar el botón de Caliope IA
         });
     });

    // --- Añadir los controles al contenedor ---
    controlsContainer.appendChild(trashButton);
    controlsContainer.appendChild(audioWaves);
    controlsContainer.appendChild(pauseButton);
    controlsContainer.appendChild(stopButton); // Añadir el botón de detener

    // 1. Intentar encontrar el contenedor principal de la conversación
    let whatsappContainerToControl = document.querySelector('._ak1r');

        if (!whatsappContainerToControl) {
            console.warn("⚠️ No se encontró el contenedor principal de WhatsApp para los controles. Reintentando...");
            return;
        }

    // --- Insertar el contenedor de controles en el DOM ---
    whatsappContainerToControl.parentNode.insertBefore(controlsContainer, whatsappContainerToControl.nextSibling);

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

        // Crear el contexto de audio
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(streamMicrofono);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Solo conectar al analizador, no a los altavoces
        source.connect(analyser);

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
                waves[i].style.height = `${normalizedValue * maxHeight}px`;
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
            if(!isDeleted){
                // Detener el stream de audio y procesarlo
                source.disconnect(analyser);
                analyser.disconnect(audioContext);
                audioContext.close();

                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);

                reader.onloadend = () => {
                    console.log("🚀 Enviando audio al background.js...");
                    chrome.runtime.sendMessage(
                        { action: "transcribeAudio", audioData: reader.result },
                        response => {
                            if (response && response.transcription) {
                                insertText(response.respuesta);
                                stopRecording(true);
                            }
                        }
                    );
                };
            }

        };

        mediaRecorder.start();
        isRecording = true;
        console.log("Iniciando grabación del mediaRecorder");
    } catch (error) {
        console.error("❌ Error al acceder al micrófono:", error);
        alert("Ocurrió un error al intentar acceder al micrófono.");
    }
}


function stopRecording(liberarMicrofono = false, callback = () => {}) {
    console.log("Entrando en stopRecording");

    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        console.log("🎤 Deteniendo grabación de audio...");
        mediaRecorder.stop(); // Detener el recorder
        isRecording = false; // Cambiar el estado de grabación a falso

        // Asegurarse de que todas las conexiones de audio se detienen
        if (streamMicrofono) {
            // Si existe, desconectar todas las pistas del stream
            streamMicrofono.getTracks().forEach(track => track.stop()); // Detener todas las pistas de audio
            streamMicrofono = null; // Limpiar la variable del stream
            console.log("🎤 Micrófono liberado.");
        }

        // Limpiar los chunks de audio
        audioChunks = [];
        
        // Desconectar cualquier fuente de audio
        if (audioContext) {
            audioContext.close().then(() => {
                console.log("🎤 Contexto de audio cerrado.");
            }).catch((error) => {
                console.error("❌ Error al cerrar el contexto de audio:", error);
            });
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
    const textarea = document.querySelector("div[aria-label='Escribe un mensaje'][contenteditable='true']");

    
    if (textarea) {
        // 3. Simular la entrada de texto
        textarea.focus();
        document.execCommand('insertText', false, text);

        // 4. Disparar un evento de input para que WhatsApp detecte el cambio
        const event = new Event('input', { bubbles: true });
        textarea.dispatchEvent(event);


        console.log("✅ Texto insertado en el chat:", text);
        injectReformular(text);
    } else {
        console.error("❌ No se encontró el textarea del chat o el botón de enviar.");
    }
}

function insertReformular(text){
    console.log("Reformulando el mensaje");
    chrome.runtime.sendMessage(
        { action: "reformularMensaje", mensaje: text },
        response => {
            if (response && response.reformulado) {
                console.log("✅ Mensaje reformulado:", response.reformulado);
                //Reemplazar el texto actual en el textarea con el texto reformulado
                const textarea = document.querySelector("div[aria-label='Escribe un mensaje'][contenteditable='true']");
                if (textarea) {
                    textarea.focus(); // Asegurarse de que el textarea tiene el foco
                    document.execCommand('selectAll', false, null); // Seleccionar todo el texto
                    document.execCommand('insertText', false, response.reformulado); // Insertar el texto reformulado
                    textarea.dispatchEvent(new Event('input', { bubbles: true })); // Disparar el evento 'input'
                }
            }
        }
    );
}
function injectReformular(text) {
    console.log("Inyectando el botón de reformular");
    const messageContainer = document.querySelector('div.x78zum5.x98rzlu.xuk3077.xpvyfi4.x1iji9kk');

    if (!messageContainer) {
        console.warn("⚠️ No se encontró el contenedor del mensaje.");
        return;
    }

    // Crear el botón que activará la reformulación
    const reformularButton = document.createElement('button');
    reformularButton.innerHTML = '<i class="bi bi-repeat" style="width: 24px; height: 24px;"></i>'; // Usar el icono de Bootstrap
    applyButtonStyle(reformularButton); // Apply style here
    reformularButton.id = 'reformular-button';
    reformularButton.style.width = '24px';
    reformularButton.style.height = '24px';
    reformularButton.style.fontSize = '20px';
    reformularButton.style.margin = '0';
    reformularButton.style.padding = '0px 0px 0px 10px';
    reformularButton.style.title = 'Reformular mensaje';
    console.log("Container", messageContainer);
    // Insertar el botón después del texto, dentro del contenedor del mensaje.
    messageContainer.appendChild(reformularButton);  // o insertBefore si necesitas una posición específica

    console.log("✅ Botón de reformular inyectado en WhatsApp Web.");

    // Event Listener para el botón
    reformularButton.addEventListener('click', () => {
        insertReformular(text);
    });

    setBoton = true;
}

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

// Function to observe and reinject UI
function observeAndInject() {
    setInterval(() => {
        let whatsappContainer = document.querySelector('._ak1r');

        let botonCaliope = document.getElementById('caliope-button');
        if (whatsappContainer && !botonCaliope) {
            injectUI(whatsappContainer);

        }
    }, 100); // Check every 2 seconds
}

// Call the function to start observing and inject the UI
observeAndInject();