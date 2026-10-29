<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { LoginUser, registerUser } from '../services/auth'
import { saveSession } from '../../../shared/services/session'
import AuthField from '../components/AuthField.vue'
import AuthFormColumn from '../components/AuthFormColumn.vue'
import AuthIntro from '../components/AuthIntro.vue'
import AuthMessage from '../components/AuthMessage.vue'
import AuthShowcase from '../components/AuthShowcase.vue'
import AppAuthTabs from '../../../shared/ui/AppAuthTabs.vue'
import AppBackLink from '../../../shared/ui/AppBackLink.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppDivider from '../../../shared/ui/AppDivider.vue'
import AppEyebrow from '../../../shared/ui/AppEyebrow.vue'
import AppLink from '../../../shared/ui/AppLink.vue'

/**
 * Figma — Login / Register (446:109, 468:187, 506:1651, 506:1917, 506:1739)
 *
 * O fluxo do Figma vive em 5 frames, mas todos compartilham o mesmo layout
 * (painel azul à esquerda + formulário à direita). Por isso aqui tudo é um
 * único componente com estados:
 *
 *   - modo:      'login' | 'register'
 *   - erro:      erro da API, exibido dentro do frame do campo
 *                (login 506:1939 → "Email ou senha incorretos.";
 *                 register 506:1693 → "As senhas devem coincidir entre si.")
 *   - erroSenha: erro inline no confirmar senha (frame 506:1693)
 *   - criado:    frame 506:1739 → tela "Conta criada com sucesso!"
 *
 * O painel, a coluna do formulário e os campos são compartilhados com as
 * telas de recuperação de senha (AuthShowcase, AuthFormColumn e AuthField).
 * Aqui ficam só as diferenças do Login: as duas intros em cross-fade no painel,
 * as abas Entrar/Criar conta e o "Esqueci minha senha".
 *
 * O layout original era um canvas fixo de 1920x910. Aqui ele é responsivo:
 * empilha no mobile (painel compacto no topo) e vira duas colunas a partir de
 * `lg` (painel 750 / formulário 1170, como no Figma).
 */

const router = useRouter()
const route = useRoute()

type Modo = 'login' | 'register'

const props = withDefaults(
  defineProps<{
    /** Abre já no estado de sucesso (frame 506:1739). */
    estadoInicial?: 'login' | 'register' | 'criado'
  }>(),
  {
    estadoInicial: 'login',
  },
)

const modo = ref<Modo>(props.estadoInicial === 'register' ? 'register' : 'login')
const nome = ref('')
const email = ref('')
const senha = ref('')
const confirmarSenha = ref('')
const erro = ref('')
const erroSenha = ref('')
const enviando = ref(false)

/**
 * Marca deixada pelo CTA de "Senha redefinida com sucesso!" (ResetPassword).
 * Vive só no `history.state` do `/login`: a tela abre no frame verde e, no
 * frame seguinte, reverte o Smart Animate — a continuação visual do clique,
 * sem desmontar a tela de origem no meio da transição.
 */
const sucessoReset = ref(window.history.state?.sucessoReset === true)

const criado = ref(props.estadoInicial === 'criado' || sucessoReset.value)

/**
 * Transição formulário → "Conta criada com sucesso!".
 *
 * No Figma o botão `468:230` usa: Ação "Mudar para", Animação "Animação
 * inteligente", Suavização "Desaceleração", 300 ms. O painel é uma camada
 * persistente: largura 750 → 100% e cor azul → verde; logo e intro fazem
 * cross-fade; o formulário sai com fade + translateY(-12px).
 */
const transicionando = ref(sucessoReset.value)

let timerTransicao: number | undefined
let frameTransicao = 0

onBeforeUnmount(() => {
  window.clearTimeout(timerTransicao)
  window.cancelAnimationFrame(frameTransicao)
})

/** A Landpage manda `?modo=register` (Inscreva-se / Quero participar / Começar agora). */
function modoDaQuery(valor: unknown): Modo | null {
  if (valor === 'register' || valor === 'cadastro') return 'register'
  if (valor === 'login' || valor === 'entrar') return 'login'
  return null
}

function aplicarModoDaQuery(valor: unknown) {
  const pedido = modoDaQuery(valor)
  if (!pedido || pedido === modo.value) return

  modo.value = pedido
  erro.value = ''
  erroSenha.value = ''
}

onMounted(() => {
  aplicarModoDaQuery(route.query.modo)

  if (!sucessoReset.value) return

  // Consome a marca: refresh e voltar/avançar não repetem a animação.
  window.history.replaceState({ ...window.history.state, sucessoReset: false }, '')

  // Pinta um frame do painel verde (igual à tela anterior) e só então reverte.
  frameTransicao = window.requestAnimationFrame(() => {
    frameTransicao = window.requestAnimationFrame(() => {
      criado.value = false
      window.clearTimeout(timerTransicao)
      timerTransicao = window.setTimeout(() => {
        transicionando.value = false
      }, 320)
    })
  })
})

/** Mantém a tela sincronizada quando o `?modo` muda (link, voltar/avançar). */
watch(
  () => route.query.modo,
  (valor) => {
    if (criado.value) return
    aplicarModoDaQuery(valor)
  },
)

const titulo = computed(() =>
  modo.value === 'register' ? 'Que bom ter você aqui.' : 'Que bom ter você aqui de volta!',
)
const subtitulo = computed(() =>
  modo.value === 'register'
    ? 'Comece a se conectar com outros estudantes.'
    : 'Entre para continuar de onde parou.',
)

/**
 * Textos do frame de sucesso; o CTA da redefinição reusa este mesmo painel.
 * `titulo2: ''` desliga a segunda linha fixa do título (sucesso é uma linha só);
 * a descrição continua sendo a padrão da intro.
 */
const introSucesso = computed(() =>
  sucessoReset.value
    ? {
        titulo: 'Senha redefinida com sucesso!',
        titulo2: '',
        descricao: 'Agora você pode entrar com sua nova senha',
        descricao2: 'e continuar se conectando com outros estudantes.',
      }
    : { titulo: 'Conta criada com sucesso!', titulo2: '' },
)

function trocarModo(novo: Modo) {
  modo.value = novo
  erro.value = ''
  erroSenha.value = ''

  // Reflete a aba na URL para o link/voltar-avançar continuarem coerentes.
  if (route.path === '/login' && route.query.modo !== novo) {
    void router.replace({ path: '/login', query: { ...route.query, modo: novo } })
  }
}

async function enviar() {
  erro.value = ''
  erroSenha.value = ''

  if (modo.value === 'register' && senha.value !== confirmarSenha.value) {
    erroSenha.value = 'As senhas devem coincidir entre si.'
    return
  }

  enviando.value = true

  try {
    if (modo.value === 'register') {
      await registerUser({
        name: nome.value.trim(),
        email: email.value.trim(),
        password: senha.value,
      })

      // Smart Animate: "Mudar para" a tela de sucesso (ease out, 300ms).
      transicionando.value = true
      criado.value = true
      window.clearTimeout(timerTransicao)
      timerTransicao = window.setTimeout(() => {
        transicionando.value = false
      }, 320)
    } else {
      const resposta = await LoginUser({ email: email.value.trim(), password: senha.value })
      saveSession(resposta.user, resposta.accessToken)
      router.push('/dashboard')
    }
  } catch (error) {
    // Mostra a mensagem da API quando existir; senão, o texto do frame de erro.
    const mensagem = error instanceof Error ? error.message.trim() : ''
    erro.value =
      mensagem ||
      (modo.value === 'register'
        ? 'Não foi possível criar sua conta. Tente novamente.'
        : 'Email ou senha incorretos.')
  } finally {
    enviando.value = false
  }
}

/** Volta para o formulário de login (o e-mail do cadastro fica preenchido). */
function irParaLogin() {
  window.clearTimeout(timerTransicao)
  criado.value = false
  transicionando.value = false
  modo.value = 'login'
  senha.value = ''
  confirmarSenha.value = ''
  erro.value = ''
  erroSenha.value = ''
  if (route.path !== '/login' || route.query.modo !== 'login') {
    void router.replace({ path: '/login', query: { modo: 'login' } })
  }
}

function voltarAoInicio() {
  router.push('/')
}
</script>

<template>
  <div
    class="auth-shell relative flex min-h-dvh flex-col bg-co-white lg:block"
    :class="{
      'auth-shell--saindo': transicionando,
      'h-dvh overflow-hidden': criado,
    }"
  >
    <!-- ========== Painel (468:187 azul 750x910 → 506:1739 verde 1920x910) ==========
         Camada persistente do Smart Animate: largura 750 → 100% e cor azul →
         verde. Só as intros (formulário × sucesso) e o CTA mudam aqui. -->
    <AuthShowcase
      :estado="criado ? 'sucesso' : 'form'"
      cta-label="Entrar na minha conta"
      @cta="irParaLogin"
    >
      <!-- As duas intros ocupam a mesma célula do grid para o painel não mudar
           de altura no meio do cross-fade. -->
      <div class="grid w-full">
        <!-- Intro do formulário (446:109 / 468:187) -->
        <AuthIntro
          class="col-start-1 row-start-1 transition-opacity duration-300 ease-out motion-reduce:transition-none"
          :class="criado ? 'pointer-events-none opacity-0' : 'opacity-100'"
          :aria-hidden="criado ? 'true' : undefined"
        />

        <!-- Intro do sucesso (506:1794) -->
        <AuthIntro
          v-bind="introSucesso"
          class="col-start-1 row-start-1 transition-opacity duration-300 ease-out motion-reduce:transition-none"
          :class="criado ? 'opacity-100' : 'pointer-events-none opacity-0'"
          :aria-hidden="criado ? undefined : 'true'"
          role="status"
          aria-live="polite"
        />
      </div>
    </AuthShowcase>

    <!-- ========== Formulário (454:99 / 468:206) — sai no Smart Animate ========== -->
    <AuthFormColumn :escondido="criado" @submit="enviar">
      <AppBackLink label="Voltar para o início" @click="voltarAoInicio" />

      <AppEyebrow texto="BEM-VINDO AO" />

      <p class="text-title text-text-1">{{ titulo }}</p>

      <p class="text-h6 leading-[normal] text-text-2">{{ subtitulo }}</p>

      <!-- Tabs Entrar / Criar conta (554:177) — componente compartilhado -->
      <AppAuthTabs :mode="modo" @select="trocarModo" />

      <!-- Separador (454:105 / 468:218) — linha de 710x1 em traceline -->
      <AppDivider />

      <AuthField
        v-if="modo === 'register'"
        id="auth-name"
        v-model="nome"
        label="Nome completo"
        icon="person"
        placeholder="Como podemos chamar você?"
        autocomplete="name"
        :maxlength="100"
      />

      <AuthField
        id="auth-email"
        v-model="email"
        label="E-mail"
        icon="mail"
        type="email"
        placeholder="voce@email.com"
        autocomplete="email"
        :maxlength="150"
      />

      <AuthField
        id="auth-password"
        v-model="senha"
        label="Senha"
        icon="lock"
        type="password"
        revelavel
        placeholder="Digite sua senha"
        :autocomplete="modo === 'register' ? 'new-password' : 'current-password'"
        :minlength="8"
        :maxlength="20"
      >
        <AuthMessage v-if="modo === 'login' && erro">{{ erro }}</AuthMessage>
      </AuthField>

      <AuthField
        v-if="modo === 'register'"
        id="auth-password-confirmation"
        v-model="confirmarSenha"
        label="Confirmar Senha"
        icon="lock"
        type="password"
        revelavel
        placeholder="Digite novamente sua senha"
        autocomplete="new-password"
        :minlength="8"
        :maxlength="20"
      >
        <!--
          Erro no frame 506:1693 (5px abaixo do input): o de senhas e o erro
          geral do cadastro (e-mail já cadastrado, validação etc.) dividem
          este slot — nunca uma linha nova acima do botão.
        -->
        <AuthMessage v-if="erroSenha || erro">{{ erroSenha || erro }}</AuthMessage>
      </AuthField>

      <!-- "Esqueci minha senha" só existe no Login (468:97); o Register não tem. -->
      <div v-if="modo === 'login'" class="flex w-full shrink-0 items-center justify-end">
        <AppLink
          href="/forgot-password"
          size="h5"
          :arrow="false"
          @click.prevent="router.push('/forgot-password')"
        >
          Esqueci minha senha
        </AppLink>
      </div>

      <!-- Botão principal + link alternativo -->
      <div class="flex w-full shrink-0 flex-col items-center gap-[5px]">
        <AppButton
          type="submit"
          variant="coral"
          :disabled="enviando"
          :centered="enviando"
          :width="modo === 'register' ? 225 : 250"
        >
          {{
            enviando
              ? 'Enviando...'
              : modo === 'register'
                ? 'Criar a minha conta'
                : 'Entrar na minha conta'
          }}
        </AppButton>

        <div
          v-if="modo === 'login' || (!erro && !erroSenha)"
          class="flex flex-wrap items-center justify-center gap-[3px] text-h6 leading-[normal]"
        >
          <p class="text-text-2">
            {{ modo === 'register' ? 'Já possui uma conta?' : 'Ainda não possui uma conta?' }}
          </p>
          <AppLink
            href="#"
            size="h6"
            :arrow="false"
            :variant="modo === 'register' ? 'blue' : 'coral'"
            @click.prevent="trocarModo(modo === 'register' ? 'login' : 'register')"
          >
            {{ modo === 'register' ? 'Entrar agora' : 'Criar Conta' }}
          </AppLink>
        </div>
      </div>
    </AuthFormColumn>
  </div>
</template>

<style scoped>
.auth-shell--saindo {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .auth-shell,
  .auth-shell * {
    transition-duration: 0.01ms !important;
  }
}
</style>
