<script setup lang="ts">
import DashboardEyebrow from './DashboardEyebrow.vue'

defineProps<{
  eyebrow: string
  title: string
  description: string
  id?: string
}>()
</script>

<template>
  <header class="flex flex-wrap items-end gap-6">
    <div class="flex min-w-0 flex-1 flex-col items-start gap-2.5">
      <DashboardEyebrow :texto="eyebrow" />
      <h1 :id="id" class="m-0 text-title font-semibold text-co-blue">{{ title }}</h1>
      <p class="m-0 text-h5 font-medium text-text-2">{{ description }}</p>
    </div>
    <slot name="actions" />
  </header>
</template>
