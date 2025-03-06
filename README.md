🚀 WhatsApp Web Voice Assistant es una extensión de Chrome diseñada para optimizar la atención al cliente en WhatsApp Web. Permite a los agentes dictar respuestas por voz, transcribirlas automáticamente y reformularlas con un tono corporativo antes de insertarlas en el chat.

🔹 Características principales
✅ Dictado por voz: Agrega un botón de micrófono en la interfaz de WhatsApp Web para capturar respuestas habladas.
✅ Transcripción precisa: Usa la API de OpenAI Whisper para convertir la voz en texto con alta precisión.
✅ Reformulación inteligente: Mejora y adapta los mensajes con un tono corporativo mediante la API de OpenAI GPT.
✅ Detección de idioma: Mantiene la coherencia del idioma según el mensaje recibido.
✅ Inserción automática: Coloca la respuesta generada directamente en el campo de texto de WhatsApp Web, lista para enviarse.
✅ Opción de reformulación: Permite regenerar el mensaje en caso de que se requiera una mejor versión.

🎯 Objetivo del proyecto
Facilitar la comunicación en atención al cliente mediante la automatización del dictado de respuestas, asegurando eficiencia, coherencia y un tono profesional en cada interacción.

🛠️ Tecnologías utilizadas
Extensiones de Chrome (Manifest V3)
JavaScript (content scripts, background scripts)
OpenAI Whisper (transcripción de voz a texto)
OpenAI GPT (reformulación con tono corporativo)
Manipulación del DOM en WhatsApp Web
📌 Cómo instalar y usar
Clonar este repositorio:

bash
Copiar
Editar
git clone https://github.com/tu-usuario/whatsapp-web-voice-assistant.git
cd whatsapp-web-voice-assistant
Cargar la extensión en Chrome:

Abre chrome://extensions/ en tu navegador.
Activa el Modo Desarrollador (esquina superior derecha).
Haz clic en Cargar descomprimida y selecciona la carpeta del proyecto.
Usar la extensión:

Abre WhatsApp Web.
Haz clic en el botón de micrófono agregado a la interfaz.
Dicta tu mensaje y deja que la extensión haga el resto.
📝 Próximas mejoras
📌 Interfaz más intuitiva para mejorar la experiencia de usuario.
📌 Opciones de personalización para ajustar el tono de los mensajes.
📌 Soporte para más idiomas y variantes de reformulación.

💡 Contribuciones y feedback son bienvenidos. ¡Siéntete libre de abrir issues o hacer pull requests! 😃