<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { resetPassword } from '../services/auth'
import AuthField from '../components/AuthField.vue'
import AuthFormColumn from '../components/AuthFormColumn.vue'
import AuthIntro from '../components/AuthIntro.vue'
import AuthMessage from '../components/AuthMessage.vue'
import AuthShowcase from '../components/AuthShowcase.vue'
import AppBackLink from '../../../shared/ui/AppBackLink.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppDivider from '../../../shared/ui/AppDivider.vue'
import AppEyebrow from '../../../shared/ui/AppEyebrow.vue'
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

/**
 * Transição formulário → "Senha redefinida com sucesso!".
 *
 * Mesma animação do "Conta criada com sucesso!" (Login): o painel é uma camada
 * persistente, largura 750 → 100% e cor azul → verde, intros em cross-fade e
 * o formulário sai com fade + translateY(-12px) — 300ms, ease out.
 *
 * A URL só muda para `/senha-redefinida` ao fim da transição: assim a troca de
 * rota não interrompe o Smart Animate (e um refresh nesse meio-tempo ainda cai
 * no estado verde, que também é o padrão da rota de destino).
 */
const transicionando = ref(false)

let timerTransicao: number | undefined

onBeforeUnmount(() => {
  window.clearTimeout(timerTransicao)
})

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

    // Smart Animate: "Mudar para" a tela de sucesso (ease out, 300ms).
    transicionando.value = true
    redefinida.value = true
    window.clearTimeout(timerTransicao)
    timerTransicao = window.setTimeout(() => {
      transicionando.value = false
      void router.replace('/senha-redefinida')
    }, 320)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Não foi possível redefinir a senha agora.'
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Links "Voltar ao login" de dentro do formulário: troca de rota direta.
 * O CTA do sucesso usa `entrarNaMinhaConta`, que preserva a animação.
 */
function voltarAoLogin() {
  void router.push('/login')
}

/**
 * CTA da tela de sucesso.
 *
 * Repete o fluxo de "Conta criada com sucesso!" (Login): a rota para `/login`
 * muda na hora e o Login recebe `state.sucessoReset`, abrindo no painel verde
 * para reverter o Smart Animate (verde de largura total → azul de 750px +
 * formulário entrando). Trocar de rota aqui desmontaria esta tela e cortaria
 * a animação no meio.
 */
function entrarNaMinhaConta() {
  void router.push({
    path: '/login',
    query: { modo: 'login' },
    state: { sucessoReset: true },
  })
}
</script>

<template>
  <div
    class="auth-shell relative flex min-h-dvh flex-col bg-co-white lg:block"
    :class="{
      'auth-shell--saindo': transicionando,
      'h-dvh overflow-hidden bg-tree-green': redefinida,
    }"
  >
    <AuthShowcase
      :estado="redefinida ? 'sucesso' : 'form'"
      cta-label="Entrar na minha conta"
      @cta="entrarNaMinhaConta"
    >
      <div class="grid w-full">
        <AuthIntro
          class="col-start-1 row-start-1 transition-opacity duration-300 ease-out motion-reduce:transition-none"
          :class="redefinida ? 'pointer-events-none opacity-0' : 'opacity-100'"
          :aria-hidden="redefinida ? 'true' : undefined"
        />
        <AuthIntro
          titulo="Senha redefinida com sucesso!"
          titulo2=""
          descricao="Agora você pode entrar com sua nova senha"
          descricao2="e continuar se conectando com outros estudantes."
          class="col-start-1 row-start-1 transition-opacity duration-300 ease-out motion-reduce:transition-none"
          :class="redefinida ? 'opacity-100' : 'pointer-events-none opacity-0'"
          :aria-hidden="redefinida ? undefined : 'true'"
          role="status"
          aria-live="polite"
        />
      </div>
    </AuthShowcase>

    <AuthFormColumn :escondido="redefinida" @submit="submitReset">
      <!-- 760:701 -->
      <AppBackLink @click="voltarAoLogin" />

      <!-- 760:702 -->
      <AppEyebrow texto="SEGURANÇA DA CONTA" />

      <!-- 760:703 -->
      <h1 class="text-title leading-[normal] text-text-1">Criar nova senha</h1>

      <!-- 760:704 -->
      <p class="text-h6 leading-[normal] text-text-2">
        Escolha uma senha com pelo menos 8 caracteres.
      </p>

      <!-- 760:705 -->
      <AppDivider />

      <!-- 760:706 -->
      <AuthField
        id="new-password"
        v-model="password"
        label="Nova senha"
        icon="lock"
        type="password"
        revelavel
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
        revelavel
        autocomplete="new-password"
        placeholder="Digite novamente sua senha"
        :minlength="8"
        :maxlength="20"
      >
        <AuthMessage v-if="errorMessage">{{ errorMessage }}</AuthMessage>
      </AuthField>

      <!-- 760:716 -->
      <div class="flex w-full shrink-0 flex-col items-center gap-[5px]">
        <AppButton type="submit" variant="coral" :disabled="isSubmitting" :width="250">
          {{ isSubmitting ? 'Redefinindo...' : 'Redefinir senha' }}
        </AppButton>

        <AppLink href="/login" size="h6" @click.prevent="voltarAoLogin"> Voltar ao login </AppLink>
      </div>
    </AuthFormColumn>
  </div>
</template>

<style scoped>
/* Igual ao Login: durante o Smart Animate o formulário não recebe cliques. */
.auth-shell--saindo {
  pointer-events: none;
}
</style>
