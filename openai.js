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
// Enviar a ChatGPT
async function enviarGPT(text, context) {
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
            ],
            temperature: 0.7
        })
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
        // Aquí ajustamos para asegurarnos de que la respuesta esté en formato JSON
        const message = data.choices[0].message.content;

        // Asegúrate de que la respuesta esté estructurada como un objeto JSON, no un array
        try {
            // Limpiar delimitadores de código (```json```) de la respuesta
            let cleanedMessage = message.replace(/```json|```/g, "").trim();

            // Asegúrate de que la respuesta esté en formato JSON
            const parsedResponse = JSON.parse(cleanedMessage);

            // Verificar si la respuesta contiene las claves correctas
            if (parsedResponse.transcripcionOriginal && parsedResponse.mensajeCorregido && parsedResponse.mensajeReformulado) {
                return parsedResponse;
            } else {
                throw new Error("⚠️ La respuesta de OpenAI no tiene el formato esperado.");
            }
        } catch (error) {
            console.error("Error al parsear la respuesta de OpenAI: ", error);
            return null;
        }
    } else {
        throw new Error("Error en la respuesta de OpenAI.");
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
    - La **cuarta respuesta** debe reformular la segunda respuesta pero en inglés.

     **Formato de salida esperado**:
    {
        "transcripcionOriginal": "(Aquí va el mensaje sin modificaciones)",
        "mensajeCorregido": "(Aquí va la versión corregida con datos precisos)",
        "mensajeReformulado": "(Aquí va la reformulación profesional)",
        "mensajeIngles": "(Aquí va la reformulación en Inglés)"
    }

    Devuelve **únicamente** estos valores como un objeto JSON.
    `;

    return await enviarGPT(transcripcion, prompt);
}
