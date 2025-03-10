// background.js
importScripts("config.js");
importScripts("whisper.js");
importScripts("openai.js");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Mensaje recibido en background.js:", request.action);

    if (request.action === "transcribeAudio") {
        if (request.audioData) {
            console.log("🔍 Convirtiendo Base64 en Blob...");

            // Convertimos base64 a Blob
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
                .then(transcription => {
                    console.log("✅ Transcripción recibida:", transcription);
                    sendResponse({ transcription });
                })
                .catch(error => {
                    console.error("🚨 Error en la transcripción:", error);
                    sendResponse({ error: error.message });
                });

            return true; // Permite respuestas asíncronas
        } else {
            console.error("❌ No se recibió audio en la solicitud.");
            sendResponse({ error: "No se recibió audio válido." });
        }
    }
});


//Crear ventana 
chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        url: "popup.html", // La interfaz de la extensión
        type: "popup", // Ventana emergente
        width: 400,
        height: 500,
        top: 100,
        left: 100
    });
});
