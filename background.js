importScripts("config.js"); // Importar el archivo con la API Key


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

// Función para enviar el audio a OpenAI Whisper y obtener la transcripción
async function transcribeAudio(audioData) {
    const apiKey = CONFIG.OPENAI_API_KEY;
    
    const formData = new FormData();
    formData.append("file", audioData);
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`
        },
        body: formData
    });

    const data = await response.json();
    if (data.text) {
        return data.text; // Retorna la transcripción
    } else {
        throw new Error("Error en la transcripción de audio.");
    }
}

// Función para enviar la transcripción a OpenAI GPT y obtener la reformulación
async function reformulateText(transcription,matices) {
    const apiKey = CONFIG.OPENAI_API_KEY;
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "system", content: matices },
                { role: "user", content: transcription }
            ]
        })
    });

    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content; // Retorna el mensaje reformulado
    } else {
        throw new Error("Error en la reformulación del mensaje.");
    }
}
