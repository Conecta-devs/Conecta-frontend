<script setup lang="ts">
import logo from './assets/logo3.svg'
</script>

<template>
  <img class="logo" :src="logo" alt="Logo Conecta" />
</template>

<style>
.logo {
  width: 350px;
}

body {
  margin: 0;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>