import { createApp } from 'vue';
import App from './App.vue';

function mountVueApp() {
    console.log("📌 Intentando montar Vue en el Shadow DOM...");

    const shadowRoot = document.getElementById("caliope-app")?.shadowRoot;
    if (!shadowRoot) {
        console.error("❌ No se encontró el Shadow DOM.");
        return;
    }

    const appContainer = shadowRoot.getElementById("caliope-vue");
    if (!appContainer) {
        console.error("❌ No se encontró #caliope-vue en el Shadow DOM.");
        return;
    }

    console.log("✅ Montando Vue en #caliope-vue...");
    createApp(App).mount(appContainer);
    console.log("✅ Vue montado correctamente en el Shadow DOM.");
}

// Esperar a que la página cargue
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountVueApp);
} else {
    mountVueApp();
}
