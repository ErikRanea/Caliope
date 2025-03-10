async function fetchWithTimeout(url, options, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
}

//Obtener embeddings de OpenAI
async function obtenerEmbeddings(texto) {
    try {
        const apiKey = CONFIG.OPENAI_API_KEY;
        
        const response = await fetchWithTimeout("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "text-embedding-ada-002",
                input: texto
            })
        });

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error) {
        console.error("🚨 Error obteniendo embeddings:", error);
        return null;
    }
}

//Enviar a chatgpt
async function enviarGPT(text, context) {
    try {
        const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: context },
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            console.log("La respuesta de ChatGPT-4o es: "+JSON.stringify(data));
            return data.choices[0].message.content;
        } else {
            throw new Error("Error a la hora de enviar el promp a ChatGPT-4o.");
        }
    } catch (error) {
        console.error("🚨 Error a la hora de enviar el promp a ChatGPT-4o:", error);
        return "Error a la hora de enviar el promp a ChatGPT-4o. Da este error: ."+error.message;
    }
}

//Calcular similitud de coseno
function cosineSimilarity(vec1, vec2) {
    let dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
    let magnitude1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
    let magnitude2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));

    return magnitude1 > 0 && magnitude2 > 0 ? dotProduct / (magnitude1 * magnitude2) : 0;
}

//Buscar los temas más relevantes en `vectorBase`
async function encontrarTemasRelacionados(transcripcion, vectorBase) {
    const embeddingTranscripcion = await obtenerEmbeddings(transcripcion);
    if (!embeddingTranscripcion) return [];

    let similitudes = vectorBase.map((item, index) => {
        return {
            texto: item.texto,
            similitud: cosineSimilarity(item.embedding, embeddingTranscripcion)
        };
    });

    similitudes.sort((a, b) => b.similitud - a.similitud);
    return similitudes.slice(0, 2); // Retorna los 2 temas más relevantes
}

//Optimizar estructura de `vectorBase` para búsqueda rápida
function convertirVectorBaseALista(vectorBase) {
    return vectorBase.map(item => item.embedding);
}

// Devolver dos opciones más

async function respuestaYRecomendaciones(transcripcion, vectorBase) {
    const temasRelacionados = await encontrarTemasRelacionados(transcripcion, vectorBase);
    
    if (temasRelacionados.length === 0) {
        return "No se encontraron temas relacionados en la base de conocimientos.";
    }

    const prompt = `
    Un cliente ha enviado el siguiente mensaje: "${transcripcion}".

    Basado en nuestra base de conocimientos, hemos identificado los siguientes temas relacionados:
    1. ${temasRelacionados[0].texto}
    2. ${temasRelacionados[1].texto}

     **Instrucciones**:
    - La **primera respuesta** debe ser la transcripción original sin cambios.
    - La **segunda respuesta** debe corregir cualquier dato erróneo basándose en los temas relevantes manteniendo la estructura del mensaje original.
    - La **tercera respuesta** debe reformular el mensaje con un tono profesional y corporativo.
    - La **cuarta respuesta** debe reformular la segunda respuesta pero en inglés

     **Formato de salida esperado**:
    transcripcionOriginal: (Aquí va el mensaje sin modificaciones)
    mensajeCorregido: (Aquí va la versión corregida con datos precisos)
    mensajeReformulado: (Aquí va la reformulación profesional)
    mensajeIngles: (Aquí va la reformulación en Inglés)

    Devuelve **únicamente** estos tres mensajes en formato de lista.
    `;

    return await enviarGPT(transcripcion, prompt);
}
