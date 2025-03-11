<script setup>
import Popup from './components/Popup.vue';
</script>

<template>
  <div class="caliope-container">
    <h2>✅ Vue está funcionando</h2>
    <Popup />
  </div>
</template>

<style scoped>
h2{
  color:greenyellow
}
.caliope-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(30, 30, 30, 0.95);
  color: white;
  padding: 20px;
  border-radius: 12px;
  width: 350px;
  text-align: center;
  z-index: 999999;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.3);
  display: block;
  opacity: 1;
}
</style>
