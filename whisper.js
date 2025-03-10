async function transcribeAudio(audioBlob) {
    if (!(audioBlob instanceof Blob)) {
        throw new Error("❌ El archivo de audio no es un Blob válido.");
    }

    if (audioBlob.size === 0 || audioBlob.size < 100) {
        throw new Error(`❌ El archivo de audio está vacío o demasiado pequeño (${audioBlob.size} bytes).`);
    }

    console.log("🔍 Enviando archivo a OpenAI Whisper:");
    console.log("📂 Tipo de archivo:", audioBlob.type);
    console.log("📏 Tamaño del archivo:", audioBlob.size, "bytes");

    const audioFile = new File([audioBlob], "audio.ogg", { type: "audio/ogg" });

    const formData = new FormData();
    formData.append("file", audioFile);
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

        if (!response.ok) {
            const errorText = await response.text(); // Leer la respuesta como texto
            console.error("🚨 Error en la API de Whisper:", errorText);
            throw new Error(`Error en la API: ${response.status} - ${errorText}`);
        }

        const transcription = await response.text(); // Leer la respuesta como texto plano
        console.log("✅ Transcripción recibida:", transcription);

        return transcription; // Devolver directamente la transcripción
    } catch (error) {
        console.error("🚨 Error en la transcripción de audio:", error.message);
        return `Error en la transcripción: ${error.message}`;
    }
}
