<script setup lang="ts">
defineProps<{ texto: string }>()
</script>

<template>
  <p class="m-0 text-h6 leading-4 font-medium text-co-blue">CONECTA · {{ texto }}</p>
</template>
