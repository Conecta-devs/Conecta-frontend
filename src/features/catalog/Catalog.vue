<script setup lang="ts">
import AppArticle from '../../shared/ui/AppArticle.vue'
import AppAuthTabs from '../../shared/ui/AppAuthTabs.vue'
import AppButton from '../../shared/ui/AppButton.vue'
import AppCartaz from '../../shared/ui/AppCartaz.vue'
import AppIcon from '../../shared/ui/AppIcon.vue'
import AppLink from '../../shared/ui/AppLink.vue'
import AppLogo from '../../shared/ui/AppLogo.vue'
</script>

<template>
  <main class="flex min-h-screen flex-col items-center gap-16 p-10">
    <div class="flex flex-wrap items-center justify-center gap-10">
      <AppButton variant="coral">Button 1</AppButton>
      <AppButton variant="blue">Button 2</AppButton>
      <AppButton variant="coral-outline">Button 3</AppButton>
      <AppButton variant="blue-outline">Button 4</AppButton>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-10">
      <AppLink href="#" variant="blue">Text</AppLink>
      <AppLink href="#" variant="coral">Text</AppLink>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-10 text-co-coral">
      <AppIcon variant="hands" />
      <AppIcon variant="book" />
      <AppIcon variant="coletive" />
    </div>

    <div class="flex max-w-[1280px] flex-wrap items-center justify-center gap-10">
      <AppArticle icon="hands" title="Text" text="Text" />
      <AppArticle icon="book" title="Text" text="Text" />
      <AppArticle icon="coletive" title="Text" text="Text" />
    </div>

    <div class="flex flex-wrap items-center justify-center gap-12">
      <AppLogo variant="logo-1" />
      <AppLogo variant="logo-2" />
      <AppLogo variant="logo-3" />
      <AppLogo variant="conecta" />
    </div>

    <img src="../../assets/images/hero-tree.svg" alt="" class="h-auto w-[365.265px]" />

    <!-- Preview em tamanho real (1280); em telas menores a faixa rola na horizontal. -->
    <!-- Textos de placeholder: os defaults reais do Cartaz ficam para a landing. -->
    <div class="w-full overflow-x-auto">
      <AppCartaz
        class="mx-auto min-w-[1280px]"
        eyebrow="Text"
        title-start="Text"
        title-middle="Text"
        title-end="Text"
        cta="Text"
        :cta-padding-left="60"
      />
    </div>

    <div class="flex flex-col items-center gap-10">
      <AppAuthTabs mode="login" />
      <AppAuthTabs mode="register" />
    </div>
  </main>
</template>