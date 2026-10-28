<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { resetPassword } from '../services/auth'
import AuthField from '../components/AuthField.vue'
import AuthFormColumn from '../components/AuthFormColumn.vue'
import AuthShowcase from '../components/AuthShowcase.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppLink from '../../../shared/ui/AppLink.vue'

/**
 * Figma — Criar nova senha (760:666) e Senha redefinida com sucesso (760:726).
 *
 * O formulário (760:699) repete a estrutura de "Esqueci minha senha": voltar,
 * eyebrow, título, orientação, divisor, dois campos, botão coral de 250 × 50 e
 * link de volta. A mensagem da API ocupa o frame do 2º campo.
 *
 * Ao redefinir, o painel azul de 750px expande para a tela verde inteira
 * (Smart Animate de 300ms) e o formulário sai com fade + translateY(-12px).
 * A URL passa para `/senha-redefinida`, que abre direto no estado verde.
 *
 * Ícones: o Figma usa `mail` nos dois campos (754:418/754:415), o que parece
 * um erro de design — aqui os dois usam `lock`, como no Login.
 */
const route = useRoute()
const router = useRouter()

const props = withDefaults(
  defineProps<{
    /** Abre já no estado de sucesso (frame 760:726). */
    estadoInicial?: 'form' | 'redefinida'
  }>(),
  {
    estadoInicial: 'form',
  },
)

const LINK_INVALIDO = 'Este link é inválido, expirou ou já foi utilizado. Solicite outro link.'

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const isTokenValid = computed(() => /^[A-Za-z0-9_-]{43}$/.test(token.value))

const password = ref('')
const passwordConfirmation = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const redefinida = ref(props.estadoInicial === 'redefinida')

async function submitReset() {
  if (isSubmitting.value || redefinida.value) return

  errorMessage.value = ''

  if (!isTokenValid.value) {
    errorMessage.value = LINK_INVALIDO
    return
  }
  if (password.value.length < 8) {
    errorMessage.value = 'A senha precisa ter pelo menos 8 caracteres.'
    return
  }
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'As senhas devem coincidir entre si.'
    return
  }

  isSubmitting.value = true
  try {
    await resetPassword(token.value, password.value)
    password.value = ''
    passwordConfirmation.value = ''
    redefinida.value = true
    await router.replace('/senha-redefinida')
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível redefinir a senha agora.'
  } finally {
    isSubmitting.value = false
  }
}

function voltarAoLogin() {
  void router.push('/login')
}
</script>

<template>
  <div
    class="relative flex min-h-dvh flex-col bg-co-white lg:block"
    :class="redefinida ? 'h-dvh overflow-hidden bg-tree-green' : ''"
  >
    <AuthShowcase :estado="redefinida ? 'sucesso' : 'form'" />

    <AuthFormColumn :escondido="redefinida">
      <form class="flex w-full flex-col items-start gap-6 lg:gap-8" @submit.prevent="submitReset">
        <!-- 760:701 -->
        <button
          type="button"
          class="group inline-flex shrink-0 cursor-pointer items-center gap-[3px] border-0 bg-transparent p-0 font-sans text-h6 leading-[normal] whitespace-nowrap text-text-2 transition-colors duration-300 ease-[cubic-bezier(0,0,0.58,1)] hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-co-blue motion-reduce:transition-none"
          @click="voltarAoLogin"
        >
          <span
            class="inline-block font-arrow text-arrow transition-transform duration-300 ease-[cubic-bezier(0,0,0.58,1)] group-hover:-translate-x-1 motion-reduce:transition-none"
            >←</span
          >
          Voltar ao login
        </button>

        <!-- 760:702 -->
        <p class="text-h6 leading-[normal] text-co-coral">
          SEGURANÇA DA CONTA <span class="text-co-blue">CONECTA.</span>
        </p>

        <!-- 760:703 -->
        <h1 class="text-title leading-[normal] text-text-1">Criar nova senha</h1>

        <!-- 760:704 -->
        <p class="text-h6 leading-[normal] text-text-2">
          Escolha uma senha com pelo menos 8 caracteres.
        </p>

        <!-- 760:705 -->
        <div class="h-px w-full shrink-0 bg-traceline" aria-hidden="true" />

        <!-- 760:706 -->
        <AuthField
          id="new-password"
          v-model="password"
          label="Nova senha"
          icon="lock"
          type="password"
          autocomplete="new-password"
          placeholder="Digite sua nova senha"
          :minlength="8"
          :maxlength="20"
        />

        <!-- 760:711 — mensagem da API no frame do 2º campo -->
        <AuthField
          id="confirm-password"
          v-model="passwordConfirmation"
          label="Confirmar nova senha"
          icon="lock"
          type="password"
          autocomplete="new-password"
          placeholder="Digite novamente sua senha"
          :minlength="8"
          :maxlength="20"
        >
          <p
            v-if="errorMessage"
            class="text-h6 leading-[normal] text-[rgba(255,0,4,0.65)]"
            role="alert"
          >
            {{ errorMessage }}
          </p>
        </AuthField>

        <!-- 760:716 -->
        <div class="flex w-full shrink-0 flex-col items-center gap-[3px]">
          <AppButton
            type="submit"
            variant="coral"
            :disabled="isSubmitting"
            :width="250"
            :padding-left="40"
            :gap="15"
            :gap-hover="23"
          >
            {{ isSubmitting ? 'Redefinindo...' : 'Redefinir senha' }}
          </AppButton>

          <AppLink href="/login" size="h6" @click.prevent="voltarAoLogin">
            Voltar ao login
          </AppLink>
        </div>
      </form>
    </AuthFormColumn>
  </div>
</template>
