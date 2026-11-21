<script setup lang="ts">
/**
 * Figma — eyebrow das telas de autenticação (454:102 / 760:647 / 760:702).
 *
 * H6 em co-coral com o sufixo da marca em co-blue: "BEM-VINDO AO CONECTA.",
 * "RECUPERAÇÃO DE CONTA CONECTA." e "SEGURANÇA DA CONTA CONECTA.".
 */
defineProps<{
  /** Texto antes do "CONECTA." (ex.: "SEGURANÇA DA CONTA"). */
  texto: string
}>()
</script>

<template>
  <p class="text-h6 leading-[normal] text-co-coral">
    {{ texto }} <span class="text-co-blue">CONECTA.</span>
  </p>
</template>
