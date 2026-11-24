<script setup lang="ts">
import { getInitials } from '@/features/dashboard/utils/format'

withDefaults(
  defineProps<{
    name: string
    image?: string | null
  }>(),
  { image: null },
)
</script>

<template>
  <span class="grid shrink-0 place-items-center rounded-full">
    <img v-if="image" :src="image" :alt="`Foto de ${name}`" class="size-full object-cover" />
    <span v-else>{{ getInitials(name) }}</span>
  </span>
</template>
