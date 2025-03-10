// background.js
importScripts("config.js");
importScripts("whisper.js");
importScripts("openai.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "transcribeAudio") {
        if (request.audioData) {
            const audioBlob = new Blob([request.audioData], { type: "audio/webm" }); // Convertir de nuevo en Blob
            transcribeAudio(audioBlob)
                .then(transcription => sendResponse({ transcription }))
                .catch(error => sendResponse({ error: error.message }));
            return true;
        } else {
            sendResponse({ error: "No se recibió audio válido."});
        }
    }

    if (request.action === "reformulateText") {
        reformulateText(request.transcription, request.context)
            .then(response => sendResponse({ reformulatedText: response }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});