document.addEventListener("DOMContentLoaded", () => {
    let mediaRecorder;
    let audioChunks = [];

    const startButton = document.getElementById("start-recording");
    const stopButton = document.getElementById("stop-recording");
    const transcriptionText = document.getElementById("transcription");

    if (!startButton || !stopButton || !transcriptionText) {
        console.error("No se encontraron los elementos en popup.html");
        return;
    }

    async function requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); 
            console.log("Permiso de micrófono concedido.");
            return true;
        } catch (error) {
            console.error("Permiso de micrófono denegado:", error);
            alert("Permiso de micrófono denegado. Habilítalo en la configuración del navegador.");
            return false;
        }
    }

    startButton.addEventListener("click", async () => {
        const permissionGranted = await requestMicrophonePermission();
        if (!permissionGranted) return;

        try {
            console.log("Iniciando grabación de audio...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log("Deteniendo grabación de audio...");
                const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            
                console.log("Blob de audio generado:", audioBlob);
                console.log("Tipo de Blob:", audioBlob.type);
                console.log("Tamaño del Blob:", audioBlob.size, "bytes");
            
                // 🔥 Enviar directamente el Blob sin convertirlo en ArrayBuffer
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob); // Convertimos el audio en base64 para evitar pérdida de datos
            
                reader.onloadend = () => {
                    console.log("Enviando audio al background.js...");
                    chrome.runtime.sendMessage(
                        {
                            action: "transcribeAudio",
                            audioData: reader.result // Ahora enviamos una URL en base64
                        },
                        response => {
                            if (chrome.runtime.lastError) {
                                console.error("Error en el mensaje a background.js:", chrome.runtime.lastError.message);
                                transcriptionText.innerText = "Error en la comunicación con la API.";
                                return;
                            }
            
                            if (response && response.transcription) {
                                transcriptionText.innerText = response.transcription;
                            } else {
                                transcriptionText.innerText = "Error en la transcripción.";
                            }
                        }
                    );
                };
            };
            
            
            
            mediaRecorder.start();
            startButton.disabled = true;
            stopButton.disabled = false;
        } catch (error) {
            console.error("Error al acceder al micrófono:", error);
            alert("Ocurrió un error al intentar acceder al micrófono.");
            transcriptionText.innerText = "Error al acceder al micrófono.";
        }
    });

    stopButton.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            startButton.disabled = false;
            stopButton.disabled = true;
        }
    });
});