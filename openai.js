async function fetchWithTimeout(url, options, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
}

//Obtener embeddings de OpenAI
/*
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
*/

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
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content; // Devolver solo el contenido del mensaje
        } else {
            throw new Error("⚠️ La respuesta de OpenAI no tiene el formato esperado.");
        }
    } catch (error) {
        console.error("Error al procesar la respuesta de OpenAI: ", error);
        return null;
    }
}



/* 
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
*/

async function respuestaTonalizada(transcripcion,tono) {
    

    const prompt = `
    Mejora la redacción de esta transcripción:"${transcripcion}".
    Teniendo en cuenta las siguientes instrucciones
    ${tono}
    `;

    return await enviarGPT(transcripcion, prompt);
}

async function enviarGPTconSesion(sesion) {
    try {
        const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: sesion.messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Error al procesar la respuesta de OpenAI (enviarGPTconSesion):", error);
        return null;
    }
}

/*

async function reformularMensaje(mensajeOriginal){
    const prompt = `
    Al solicitarte que me reformules una transcripción me has devuelto esto -> ${mensajeOriginal}.

    Quiero que me reformules ese mensaje teniendo en cuenta las siguientes instrucciones:

    ## Instrucciones específicas:

    Al recibir un borrador, ofrece una versión mejorada cumpliendo estrictamente estos requisitos:

    - **Claridad y naturalidad**: usa un lenguaje sencillo y natural, que no suene forzado. Además debe ser humano y fluido.
    - **Tono**: directo y bien estructurado, con estilo business casual. Evita formalismos excesivos, tecnicismos o frases complicadas.
    - **Evita** palabras sofisticadas o términos propios del lenguaje académico o jurídico.
    - **No repitas** palabras o expresiones.
    - **Reorganiza** el contenido siempre que mejore la estructura y fluidez.
    - **Sin introducciones ni despedidas**; entrega únicamente el mensaje mejorado solicitado.
    - **Nunca uses rayas largas (— o em dashes)**. Sustitúyelas por comas, paréntesis o reorganización adecuada. 
    - **Guiones cortos (-)** únicamente en palabras compuestas o casos estrictamente necesarios.

    ## Idioma de respuesta:

    - Si el borrador está en **español**, responde en **español de España**, cumpliendo todas las condiciones anteriores.
    - Si el borrador está en **inglés**, responde en **inglés británico**, con expresiones y ortografía naturales, adaptadas a un entorno laboral en Malta.
    - Si después de una respuesta en español escribo **"i", "I" o "ingles"**, traduce tu respuesta anterior al inglés británico, asegurando que sea natural, precisa y adaptada a Malta.

    ### **Instrucciones específicas que debo seguir SIEMPRE:**

    1. **Verifica siempre que tu respuesta transmita exactamente el mismo significado del borrador original.**

    2. **No usar guiones largos (—) bajo ninguna circunstancia.**  
    - En su lugar, usar comas, puntos o reformular la frase para mantener la fluidez.  
    - **Si en algún momento me equivoco y uso un guion largo, debo corregirlo de inmediato sin excusas.**  

    3. **Evitar traducciones literales.**  
    - Siempre priorizar un estilo natural en castellano e inglés.
    - Aunque sea gramaticalmente correcto, no suene forzado. Debe sonar natural y humano.

    4. **No utilizar letras mayúsculas innecesarias ni negritas si no se solicita.**  

    5. **Utilizar el formato de inglés más alineado con el español.**  
    - Usar el símbolo del euro (€) detrás de la cifra.  
    - Escribir las fechas con el año al final y mantener los ceros para evitar errores.  

    6. **Explicar de forma detallada cuando la información sea técnica.**  

    7. **Si Jorge me avisa de un error recurrente, debo identificarlo y corregirlo de forma permanente.**  

    Si haces mal este trabajo me van a despedir y mi mujer me va a abandonar, porfavor hazlo perfecto.

    `;

    return await enviarGPT(mensajeOriginal,prompt);

}
*/