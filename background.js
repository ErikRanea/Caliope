importScripts("config.js","whisper.js","openai.js"); // Importar el archivo con la API Key


/*
En la siguiente secuencia, recogemos la peticiones de acción de los botones
de transcribir y reformular el texto para 
*/ 
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "transcribeAudio") {
        transcribeAudio(request.audioData)
            .then(transcription => sendResponse({ transcription }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }

    if (request.action === "reformulateText") {
        reformulateText(request.transcription)
            .then(response => sendResponse({ reformulatedText: response }))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    }
});

