<script setup lang="ts">
/**
 * Figma — eyebrow das telas de autenticação (454:102 / 760:647 / 760:702).
 *
 * H6 em co-coral com o sufixo da marca em co-blue: "BEM-VINDO AO CONECTA.",
 * "RECUPERAÇÃO DE CONTA CONECTA." e "SEGURANÇA DA CONTA CONECTA.".
 *
 * Variante `dashboard`: "CONECTA · ..." em co-blue, usado pelo PageHeader.
 */
defineProps<{
  /** Texto antes do "CONECTA." (ex.: "SEGURANÇA DA CONTA"). */
  texto: string
  /** 'auth' (default) reproduz o eyebrow das telas de login; 'dashboard' o do cabeçalho interno. */
  variante?: 'auth' | 'dashboard'
}>()
</script>

<template>
  <p v-if="variante === 'dashboard'" class="m-0 text-h6 leading-4 font-medium text-co-blue">
    CONECTA · {{ texto }}
  </p>
  <p v-else class="text-h6 leading-[normal] text-co-coral">
    {{ texto }} <span class="text-co-blue">CONECTA.</span>
  </p>
</template>
