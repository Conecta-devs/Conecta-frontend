<script setup lang="ts">
defineProps<{
  kind: 'loading' | 'error' | 'empty'
  message: string
}>()
</script>

<template>
  <p
    :role="kind === 'error' ? 'alert' : 'status'"
    :class="kind === 'error' ? 'text-danger' : 'text-text-2'"
  >
    {{ message }}
    <slot name="action" />
  </p>
</template>
