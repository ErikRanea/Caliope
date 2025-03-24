let caliopeButton;
let mediaRecorder;
let audioChunks = [];
let audioContext;
let streamMicrofono;
let isRecording = false;
let isPaused = false;
let isDeleted = false;

// Aplica estilos a los botones
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

// Inyecta la interfaz de usuario inicial
function injectUI(whatsappContainer) {
    if (!whatsappContainer) {
        console.warn("⚠️ No se encontró el contenedor principal de WhatsApp.");
        return;
    }

    caliopeButton = document.createElement('button');
    caliopeButton.innerHTML = '<i class="bi bi-soundwave"></i>';
    applyButtonStyle(caliopeButton);
    caliopeButton.id = 'caliope-button';

    whatsappContainer.parentNode.insertBefore(caliopeButton, whatsappContainer.nextSibling);
    console.log("✅ Botón de Caliope IA inyectado en WhatsApp Web.");

    caliopeButton.addEventListener('click', () => {
        caliopeButton.style.display = 'none';
        createRecordingControls();
    });
}

// Crea los controles de grabación
function createRecordingControls() {
    let whatsappContainer = document.querySelector('._ak1r');

    if (!whatsappContainer) {
        console.warn("⚠️ No se encontró el contenedor principal de WhatsApp para los controles.");
        return;
    }

    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'caliope-controls-container';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.alignItems = 'center';
    controlsContainer.style.marginLeft = '10px';

    const trashButton = document.createElement('button');
    trashButton.innerHTML = '<i class="bi bi-trash-fill"></i>';
    applyButtonStyle(trashButton);
    trashButton.addEventListener('click', () => {
        console.log("El botón de basura se ha seleccionado");
        isDeleted = true;
        stopRecording(true);
        controlsContainer.remove();
        caliopeButton.style.display = 'inline-block';
    });

    const audioWaves = document.createElement('div');
    audioWaves.id = 'caliope-audio-waves';
    audioWaves.style.width = '80px';
    audioWaves.style.height = '20px';
    audioWaves.style.backgroundColor = '#7c8c95';
    audioWaves.style.display = 'flex';
    audioWaves.style.borderRadius = '3px';
    audioWaves.style.padding = '5px 0px';
    audioWaves.style.alignItems = 'center';
    audioWaves.style.justifyContent = 'center';

    const waves = [];
    for (let i = 0; i < 5; i++) {
        const wave = document.createElement('div');
        wave.classList.add('caliope-wave');
        wave.style.width = '5px';
        wave.style.margin = '0 2px';
        wave.style.backgroundColor = '#202c33';
        audioWaves.appendChild(wave);
        waves.push(wave);
    }

    const pauseButton = document.createElement('button');
    pauseButton.innerHTML = '<i class="bi bi-pause"></i>';
    applyButtonStyle(pauseButton);
    pauseButton.addEventListener('click', () => {
        console.log("Se ha seleccionado el botón de pausa");
        if (isPaused) {
            console.log("Reanudando grabación");
            mediaRecorder.resume();
            pauseButton.innerHTML = '<i class="bi bi-pause"></i>';
            updateAudioWaves();
        } else {
            console.log("Pausando grabación");
            mediaRecorder.pause();
            pauseButton.innerHTML = '<i class="bi bi-play"></i>';
        }
        isPaused = !isPaused;
    });

    const stopButton = document.createElement('button');
    stopButton.innerHTML = '<i class="bi bi-stop-fill"></i>';
    applyButtonStyle(stopButton);
    stopButton.addEventListener('click', () => {
        stopRecording(false, () => {
            isDeleted = false;
            console.log("El valor de isDeleted es " + isDeleted);
            controlsContainer.remove();
            caliopeButton.style.display = 'inline-block';
        });
    });

    controlsContainer.appendChild(trashButton);
    controlsContainer.appendChild(audioWaves);
    controlsContainer.appendChild(pauseButton);
    controlsContainer.appendChild(stopButton);

    let whatsappContainerToControl = document.querySelector('._ak1r');

    if (!whatsappContainerToControl) {
        console.warn("⚠️ No se encontró el contenedor principal de WhatsApp para los controles.");
        return;
    }

    whatsappContainerToControl.parentNode.insertBefore(controlsContainer, whatsappContainerToControl.nextSibling);
    startRecording(waves, audioWaves);
}

// Inicia la grabación de audio
async function startRecording(waves, audioWaves) {
    const permissionGranted = await requestMicrophonePermission();
    if (!permissionGranted) return;

    try {
        console.log("🎤 Iniciando grabación de audio...");
        streamMicrofono = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(streamMicrofono, { mimeType: "audio/webm;codecs=opus" });
        audioChunks = [];

        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(streamMicrofono);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);

        function updateAudioWaves() {
            if(!isPaused){
                    analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                const normalizedValue = average / 128;
                const maxHeight = 20;

                for (let i = 0; i < waves.length; i++) {
                    waves[i].style.height = `${normalizedValue * maxHeight}px`;
                }
                requestAnimationFrame(updateAudioWaves);
            }
            
        }

        updateAudioWaves();

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
          if (!isDeleted) {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);

            reader.onloadend = () => {
              console.log("🚀 Enviando audio al background.js...");
              chrome.runtime.sendMessage(
                { action: "transcribeAudio", audioData: reader.result },
                (response) => {
                  if (response && response.transcription) {
                    insertText(response.respuesta);
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

// Detiene la grabación de audio
function stopRecording(liberarMicrofono = false, callback = () => {}) {
    console.log("Entrando en stopRecording");
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        console.log("🎤 Deteniendo grabación de audio...");
        mediaRecorder.stop();
        isRecording = false;

        if (streamMicrofono) {
            streamMicrofono.getTracks().forEach(track => track.stop());
            streamMicrofono = null;
            console.log("🎤 Micrófono liberado.");
        }
        if (audioContext) {
            audioContext.close().then(() => {
                console.log("Audio context closed");
            }).catch(error => {
                console.error("Error closing audio context:", error);
            });
            audioContext = null;
        }
        audioChunks = [];
        callback();
    }
}

// Solicita permiso para usar el micrófono
async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log("✅ Permiso de micrófono concedido.");
        return true;
    } catch (error) {
        console.error("❌ Permiso de micrófono denegado:", error);
        alert("Permiso de micrófono denegado.  Actívalo en la configuración del navegador.");
        return false;
    }
}

// Inserta texto en el área de entrada de WhatsApp (usa execCommand)
function insertText(text) {
    const textarea = document.querySelector("div[aria-label='Escribe un mensaje'][contenteditable='true']");

    if (textarea) {
        textarea.focus();

        // --- Simular Ctrl+A (o Cmd+A) ---
        const selectAllEvent = new KeyboardEvent('keydown', {
            key: 'a',
            code: 'KeyA',
            keyCode: 65,
            which: 65,
            ctrlKey: !navigator.userAgentData.platform.includes('mac'), // Ctrl para Windows/Linux
            metaKey: navigator.userAgentData.platform.includes('mac'), // Cmd para Mac
            bubbles: true,
            cancelable: true,
            composed: true,
        });
        textarea.dispatchEvent(selectAllEvent);
        // ---------------------------------

        document.execCommand('insertText', false, text);
        console.log("Se ha insertado el siguiente texto en el textarea ->"+ text);

        // --- Ya NO necesitamos disparar el evento 'input' manualmente ---
        // --- Ya NO necesitamos manipular el DOM ---
        // --- Ya NO necesitamos restaurar la selección ---

       // injectReformular(textarea); //Pasamos el textarea

    } else {
        console.error("❌ No se encontró el textarea del chat.");
    }
}


// Reformular el mensaje (llama a insertText con el texto reformulado)
// Usamos async/await y una Promesa para asegurar el orden
/*
async function reformulateMessage(text) {
    return new Promise((resolve, reject) => {
        console.log("Reformulando el mensaje:", text);
        chrome.runtime.sendMessage(
            { action: "reformularMensaje", mensaje: text },
            (response) => {
                if (response && response.reformulado) {
                    console.log("✅ Mensaje reformulado:", response.reformulado);
                    resolve(response.reformulado); // Resuelve la Promesa con el texto reformulado
                } else {
                    console.error("Error al reformular:", response);
                    reject(new Error("Error al reformular el mensaje.")); // Rechaza la Promesa si hay error
                }
            }
        );
    });
}

/*
function injectReformular(text) {
    console.log("Inyectando el botón de reformular");
    const messageContainer = document.querySelector('div.x78zum5.x98rzlu.xuk3077.xpvyfi4.x1iji9kk');

    if (!messageContainer) {
        console.warn("⚠️ No se encontró el contenedor del mensaje.");
        return;
    }

    const reformularButton = document.createElement('button');
    reformularButton.innerHTML = '<i class="bi bi-repeat" style="width: 24px; height: 24px;"></i>';
    applyButtonStyle(reformularButton);
    reformularButton.id = 'reformular-button';
    reformularButton.style.width = '24px';
    reformularButton.style.height = '24px';
    reformularButton.style.fontSize = '20px';
    reformularButton.style.margin = '0';
    reformularButton.style.padding = '0px 0px 0px 10px';
    reformularButton.style.title = 'Reformular mensaje';
    console.log("Container", messageContainer);

    if (document.querySelector('#reformular-button')) {
        console.log("El botón ya existe");
    } else {
        messageContainer.appendChild(reformularButton);
        console.log("✅ Botón de reformular inyectado en WhatsApp Web.");
    }

    // Event Listener para el botón (CORREGIDO)
    reformularButton.addEventListener('click', async () => {
        // Obtener el textarea *DENTRO* del listener
        const textarea = document.querySelector("div[aria-label='Escribe un mensaje'][contenteditable='true']");
        if (textarea) {
            const currentText = textarea.innerText.trim(); // Obtener el texto *ACTUAL*
            console.log("Botón de reformular clickeado. Texto a reformular:", currentText);
            // Usamos await para esperar a que reformulateMessage termine.
            try {
                const reformulado = await reformulateMessage(currentText);
                insertText(reformulado); //  Llama a insertText con el texto *ACTUAL*
            } catch (error){
                console.error(error);
            }
        } else {
            console.error("No se pudo encontrar el textarea al hacer clic en reformular.");
        }
    });
}*/
// Estilos CSS
const style = document.createElement('style');
style.textContent = `
    @import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

    .caliope-wave {
        width: 5px;
        height: 20px;
        background-color: #00a884;
        border-radius: 5px;
    }
`;
document.head.appendChild(style);

// Observa y reinyecta la UI
function observeAndInject() {
    setInterval(() => {
        let whatsappContainer = document.querySelector('._ak1r');
        let botonCaliope = document.getElementById('caliope-button');
        if (whatsappContainer && !botonCaliope) {
            injectUI(whatsappContainer);
        }
    }, 100);
}

observeAndInject();





