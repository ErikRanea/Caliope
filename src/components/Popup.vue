<template>
  <div class="popup">
    <h2>Dicta tu mensaje</h2>
    <button @click="startRecording">🎙️ Grabar</button>
    <button v-if="isRecording" @click="stopRecording">⏹️ Detener</button>
    <p>{{ transcription }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isRecording = ref(false);
const transcription = ref("Tu mensaje aparecerá aquí...");

const startRecording = () => {
  isRecording.value = true;
  transcription.value = "🎤 Grabando...";
  console.log("🎤 Iniciando grabación...");
};

const stopRecording = () => {
  isRecording.value = false;
  transcription.value = "⏹️ Grabación detenida.";
  console.log("⏹️ Deteniendo grabación...");
};
</script>

<style scoped>
.popup {
  background: #1E1E1E;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 300px;
  text-align: center;
}
button {
  margin: 10px;
  padding: 10px;
  cursor: pointer;
}
</style>
