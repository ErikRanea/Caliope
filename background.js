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
                      // Enviar la transcripción y la respuesta al background.js
                      chrome.runtime.sendMessage({
                          action: "mostrarResultados",
                          transcription: response.transcription,
                          respuesta: response.respuesta
                      });
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

       // injectReformular(textarea); //Pasamos el textarea

    } else {
        console.error("❌ No se encontró el textarea del chat.");
    }
}

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

// Escucha los mensajes del background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Mensaje recibido en `content.js`:", request.action, request);

    if (request.action === "createDraggablePopup") {
        createDraggableCaliopePopup();
    }

    if (request.action === "mostrarResultados") {
        mostrarResultados(request.transcription, request.respuesta);
    }
});

function createDraggableCaliopePopup() {
    // Agrega un ID único al contenedor para verificar si ya existe.
    const popupId = 'caliope-draggable-popup';

    // Función para evitar duplicados
    function removeExistingPopup() {
        const existingPopup = document.getElementById(popupId);
        if (existingPopup) {
            existingPopup.remove();
        }
    }

    // Antes de crear uno nuevo, verifica y elimina el popup existente.
    removeExistingPopup();

    // Crear el contenedor del popup
    const popupContainer = document.createElement('div');
    popupContainer.id = popupId;

    // Crear el Shadow DOM
    const shadow = popupContainer.attachShadow({ mode: 'open' });

    // Crear un elemento link para cargar el CSS
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', chrome.runtime.getURL('popup.css')); // Reemplaza con la URL de tu archivo CSS
    shadow.appendChild(linkElem);

    // Crear el HTML del popup
    const popup = document.createElement('div');
    popup.classList.add('popup'); // Usamos una clase para aplicar los estilos

    const header = document.createElement('div');
    header.classList.add('header');
    header.textContent = 'Caliope IA | Configuración';
    popup.appendChild(header);

    const promptLabel = document.createElement('label');
    promptLabel.textContent = 'Prompt:';
    popup.appendChild(promptLabel);

    const promptTextarea = document.createElement('textarea');
    promptTextarea.id = 'caliope-prompt'; // ID para acceder al textarea
    promptTextarea.rows = 5;
    promptTextarea.cols = 30;
    popup.appendChild(promptTextarea);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar';
    saveButton.addEventListener('click', () => {
        const prompt = shadow.getElementById('caliope-prompt').value;
        localStorage.setItem('caliopePrompt', prompt);
        alert('Prompt guardado!');
    });
    popup.appendChild(saveButton);

    // Añadir el popup al Shadow DOM
    shadow.appendChild(popup);

    // Lógica de arrastre
    let offsetX, offsetY;
    header.addEventListener('mousedown', (e) => {
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;

        function drag(e) {
            popup.style.left = (e.clientX - offsetX) + 'px';
            popup.style.top = (e.clientY - offsetY) + 'px';
        }

        document.addEventListener('mousemove', drag);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', drag);
        });
    });

    // Inicializar el prompt desde localStorage
    const storedPrompt = localStorage.getItem('caliopePrompt');
    if (storedPrompt) {
        shadow.getElementById('caliope-prompt').value = storedPrompt;
    }

    // Finalmente, añade el popup al DOM.
    document.body.appendChild(popupContainer);
}

// Función para mostrar los resultados en un nuevo popup
function mostrarResultados(transcription, respuesta) {
    console.log("mostrarResultados se está ejecutando en content.js");
    // Agrega un ID único al contenedor para verificar si ya existe.
    const popupResultId = 'caliope-resultados-popup';

    // Función para evitar duplicados
    function removeExistingPopup() {
        const existingPopup = document.getElementById(popupResultId);
        if (existingPopup) {
            existingPopup.remove();
        }
    }

    // Antes de crear uno nuevo, verifica y elimina el popup existente.
    removeExistingPopup();

    // Crear el contenedor del popup
    const popupContainer = document.createElement('div');
    popupContainer.id = popupResultId;

    // Crear el Shadow DOM
    const shadow = popupContainer.attachShadow({ mode: 'open' });

    // Crear un elemento link para cargar el CSS
    const linkElem = document.createElement('link');
    linkElem.setAttribute('rel', 'stylesheet');
    linkElem.setAttribute('href', chrome.runtime.getURL('popup.css')); // Reemplaza con la URL de tu archivo CSS
    shadow.appendChild(linkElem);

    // Crear el HTML del popup
    const popup = document.createElement('div');
    popup.classList.add('popup');

    const header = document.createElement('div');
    header.classList.add('header');
    header.textContent = 'Resultados de Caliope IA';
    popup.appendChild(header);

    const transcriptionDiv = document.createElement('div');
    transcriptionDiv.classList.add('content');
    transcriptionDiv.innerHTML = `<p><strong>Transcripción:</strong></p><p>${transcription}</p>`;
    popup.appendChild(transcriptionDiv);

    const respuestaDiv = document.createElement('div');
    respuestaDiv.classList.add('content');
    respuestaDiv.innerHTML = `<p><strong>Respuesta:</strong></p><p>${respuesta}</p>`;
    popup.appendChild(respuestaDiv);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('button-container');

    const copiarButton = document.createElement('button');
    copiarButton.textContent = 'Copiar Respuesta';
    copiarButton.addEventListener('click', () => {
        navigator.clipboard.writeText(respuesta).then(() => {
            alert('Respuesta copiada al portapapeles!');
        });
    });
    buttonContainer.appendChild(copiarButton);
    popup.appendChild(buttonContainer);

    // Añadir el popup al Shadow DOM
    shadow.appendChild(popup);

    // Lógica de arrastre
    let offsetX, offsetY;
    header.addEventListener('mousedown', (e) => {
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;

        function drag(e) {
            popup.style.left = (e.clientX - offsetX) + 'px';
            popup.style.top = (e.clientY - offsetY) + 'px';
        }

        document.addEventListener('mousemove', drag);

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', drag);
        });
    });

    // Finalmente, añade el popup al DOM
    document.body.appendChild(popupContainer);
}

// Inject button
function injectButton() {
    console.log("Intentando inyectar el botón...");
    const target = document.querySelector('div.x78zum5.x6s0dn4.x1afcbsf.x6s6g2w');

    if (target) {
        console.log("✅ Elemento objetivo encontrado.");
        const button = document.createElement('button');
        button.textContent = 'Caliope IA Config';
        button.classList.add('xjb2p0i', 'xk390pu', 'x1heor9g', 'x1ypdohk', 'xjbqb8w', 'x972fbf', 'xcfux6l', 'x1qhh985', 'xm0m39n', 'xexx8yu', 'x4uap5', 'x18d9i69', 'xkhd6sd'); // Clases de WhatsApp

        button.addEventListener('click', () => {
            createDraggableCaliopePopup();
        });

        target.appendChild(button);
        console.log("✅ Botón inyectado correctamente.");
    } else {
        console.log('Target not found, retrying');
        setTimeout(injectButton, 1000);
    }
}

setTimeout(injectButton, 1000);