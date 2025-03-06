async function transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("response_format", "text"); // Formato optimizado
    formData.append("prompt", "Utiliza un tono corporativo y preciso en la transcripción."); // Prompt de ayuda

    const response = await fetchWithTimeout("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: formData
    });
    
    const data = await response.json();
    if (data.text) {
        return data.text;
    } else {
        throw new Error("Error en la transcripción de audio.");
    }
}