<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    labelledBy?: string
    describedBy?: string
    role?: 'dialog' | 'alertdialog'
    maxWidth?: 'md' | '2xl'
  }>(),
  {
    title: undefined,
    labelledBy: undefined,
    describedBy: undefined,
    role: 'dialog',
    maxWidth: 'md',
  },
)

defineEmits<{ backdrop: [] }>()
</script>

<template>
  <div
    class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-overlay/55 p-3 backdrop-blur-sm sm:items-center sm:p-4"
    @click.self="$emit('backdrop')"
  >
    <section
      :role="role"
      aria-modal="true"
      :aria-labelledby="labelledBy"
      :aria-describedby="describedBy"
      class="my-auto max-h-[calc(100dvh-1.5rem)] w-full overflow-y-auto overscroll-contain rounded-card border border-traceline bg-co-white shadow-[0_30px_90px_rgba(22,31,55,0.22)] sm:max-h-[calc(100dvh-2rem)]"
      :class="maxWidth === '2xl' ? 'max-w-2xl' : 'max-w-md'"
    >
      <header
        v-if="title"
        class="flex items-center justify-between gap-4 border-b border-traceline px-5 py-4 sm:px-7"
      >
        <h2 :id="labelledBy" class="text-h3 font-semibold text-co-blue">{{ title }}</h2>
        <slot name="header-actions" />
      </header>
      <slot />
      <footer v-if="$slots.footer"><slot name="footer" /></footer>
    </section>
  </div>
</template>
