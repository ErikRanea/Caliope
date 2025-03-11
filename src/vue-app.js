import { createApp, nextTick } from 'vue';
import App from './App.vue';

async function mountVueApp() {
    console.log("📌 Intentando montar Vue en el Shadow DOM...");

    let retries = 0;
    const interval = setInterval(async () => {
        const shadowRoot = document.getElementById("caliope-app")?.shadowRoot;
        if (shadowRoot) {
            clearInterval(interval);
            console.log("✅ Shadow DOM encontrado.");

            const appContainer = shadowRoot.getElementById("caliope-vue");
            if (appContainer) {
                console.log("✅ Montando Vue en #caliope-vue...");

                // Asegurar que Vue se monta correctamente después de que el DOM esté listo
                await nextTick();
                
                try {
                    createApp(App).mount(appContainer);
                    console.log("✅ Vue montado correctamente en el Shadow DOM.");
                } catch (error) {
                    console.error("❌ Error al montar Vue:", error);
                }
            } else {
                console.error("❌ No se encontró #caliope-vue en el Shadow DOM.");
            }
        }

        retries++;
        if (retries > 10) {
            clearInterval(interval);
            console.error("❌ No se pudo montar Vue en el Shadow DOM después de 10 intentos.");
        }
    }, 500);
}

// Asegurar que Vue se monta cuando la página esté lista
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountVueApp);
} else {
    mountVueApp();
}
