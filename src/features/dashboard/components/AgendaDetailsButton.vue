<script setup lang="ts">
defineProps<{ disabled?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="h-[50px] w-[150px] rounded-button border border-co-blue bg-co-white text-h5 font-medium text-co-blue transition-colors hover:bg-s-blue/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-co-blue"
    :disabled="disabled"
    @click="$emit('click')"
  >
    Detalhes
  </button>
</template>
