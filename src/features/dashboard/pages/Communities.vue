<script setup lang="ts">
// O estado "em breve" é deliberado: não há endpoint de comunidades no backend.
import PageHeader from '../components/PageHeader.vue'
</script>

<template>
  <section
    class="flex w-full flex-col gap-6 bg-co-white px-page-gutter py-8"
    aria-labelledby="comunidades-titulo"
  >
    <PageHeader
      eyebrow="COMUNIDADES"
      title="Comunidades"
      description="Encontre estudantes com interesses em comum, compartilhe conhecimentos e participe de comunidades de estudo."
      id="comunidades-titulo"
    />

    <section
      class="flex h-[180px] w-full flex-col items-center justify-center gap-4 rounded-card border border-traceline bg-co-white p-6 text-center"
      aria-label="Comunidades em breve"
    >
      <h2 class="m-0 text-h3 leading-[23px] font-semibold text-co-blue">
        Sua próxima comunidade começa aqui
      </h2>

      <p class="m-0 text-h5 leading-[19px] font-medium text-text-2">
        Em breve, você poderá explorar e participar de comunidades de estudantes.
      </p>
    </section>
  </section>
</template>
