async function transcribeAudio(audioBlob) {
    if (!(audioBlob instanceof Blob)) {
        throw new Error("El archivo de audio no es un Blob válido.");
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("response_format", "text");

    try {
        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.OPENAI_API_KEY}`
            },
            body: formData
        });

        // Verificamos si la respuesta es exitosa
        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // 🛠️ Debugging: Imprimir la respuesta de OpenAI de forma clara
        console.log("🔍 Respuesta completa de Whisper:\n", JSON.stringify(data, null, 2));

        // Validamos si `text` está en la respuesta
        if (data.text) {
            return data.text;
        } else {
            throw new Error("❌ La API de Whisper no devolvió 'text'. Revisa la respuesta en la consola.");
        }
    } catch (error) {
        console.error("🚨 Error en la transcripción de audio:", error);
        return `Error en la transcripción: ${error.message}`;
    }
}
