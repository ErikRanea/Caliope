(async function () {
    if (document.getElementById("caliope-app")) {
        console.log("✅ caliope-app ya existe en el DOM.");
        return;
    }

    console.log("📌 Inyectando Vue en WhatsApp Web...");

    // Crear el contenedor principal
    const appContainer = document.createElement("div");
    appContainer.id = "caliope-app";
    document.body.appendChild(appContainer);

    // Crear un Shadow DOM para evitar conflictos con los estilos de WhatsApp
    const shadowRoot = appContainer.attachShadow({ mode: "open" });

    // Crear el div donde se montará Vue
    const vueMount = document.createElement("div");
    vueMount.id = "caliope-vue";
    shadowRoot.appendChild(vueMount);

    // Agregar estilos básicos para asegurar visibilidad
    const style = document.createElement("style");
    style.textContent = `
        #caliope-vue {
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            background: rgba(30, 30, 30, 0.95) !important;
            color: white !important;
            padding: 20px !important;
            border-radius: 12px !important;
            width: 350px !important;
            text-align: center !important;
            z-index: 999999 !important;
            box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3) !important;
            display: block !important;
            opacity: 1 !important;
        }
    `;
    shadowRoot.appendChild(style);

    console.log("✅ Shadow DOM creado con éxito.");

    // Inyectar Vue directamente desde la extensión
    const script = document.createElement("script");
    script.type = "module";
    script.src = chrome.runtime.getURL("vue-app.js");
    script.onload = () => {
        console.log("✅ Vue-app.js cargado correctamente.");
    };
    shadowRoot.appendChild(script);
})();
