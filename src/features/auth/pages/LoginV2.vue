<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { LoginUser, registerUser } from '../services/auth'
import { isAuthenticated, saveSession } from '../../../shared/services/session'
import AppAuthTabs from '../../../shared/ui/AppAuthTabs.vue'
import AppButton from '../../../shared/ui/AppButton.vue'
import AppLink from '../../../shared/ui/AppLink.vue'
import AppLogo from '../../../shared/ui/AppLogo.vue'
import ProfileSetupModal from '../../profile/ProfileSetupModal.vue'
import coletiveIcon from '../../../assets/icons/coletive-white.svg'
import orbitOuter from '../../../assets/decorations/orbit2.svg'
import orbitInner from '../../../assets/decorations/orbit.svg'

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
 * O layout original era um canvas fixo de 1920x910. Aqui ele é responsivo:
 * empilha no mobile (painel compacto no topo) e vira duas colunas a partir de
 * `lg` (painel 750 / formulário 1170, como no Figma).
 *
 * Tokens do Figma: gap 32 no form, 5 no label→input, inputs 50px raio 10,
 * botão coral 50px raio 10 com seta 16x12 a 15px do label, aba ativa em co-blue
 * com underline de 3px, eyebrow 14 (coral + azul), título 32 SemiBold.
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
const mostrarSenha = ref(false)
const erro = ref('')
const erroSenha = ref('')
const enviando = ref(false)
const criado = ref(props.estadoInicial === 'criado')

/** Usuário já autenticado (cadastro faz login automático). */
const sessaoAtiva = ref(isAuthenticated())

/**
 * Transição formulário → "Conta criada com sucesso!".
 *
 * No Figma o botão `468:230` usa: Ação "Mudar para", Animação "Animação
 * inteligente", Suavização "Desaceleração", 300 ms. Aqui o sucesso entra como
 * um painel verde de tela cheia com fade/scale de 300ms ease-out, mantendo o
 * ritmo e as camadas (logo, orbitais, textos) da animação original.
 */
const transicionando = ref(false)

/** Modal de perfil aberto após o cadastro (mesmo fluxo da tela legada). */
const modalPerfilAberto = ref(false)

/** A Landpage manda `?modo=register` (Inscreva-se / Quero participar / Começar agora). */
onMounted(() => {
  const pedido = route.query.modo
  if (pedido === 'register' || pedido === 'login') {
    modo.value = pedido
  }
})

const titulo = computed(() =>
  modo.value === 'register' ? 'Que bom ter você aqui.' : 'Que bom ter você aqui de volta!',
)
const subtitulo = computed(() =>
  modo.value === 'register'
    ? 'Comece a se conectar com outros estudantes.'
    : 'Entre para continuar de onde parou.',
)

function trocarModo(novo: Modo) {
  modo.value = novo
  erro.value = ''
  erroSenha.value = ''
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

      // O cadastro autentica na sequência para o usuário já sair com sessão.
      const loginResponse = await LoginUser({
        email: email.value.trim(),
        password: senha.value,
      })
      saveSession(loginResponse.user, loginResponse.accessToken)
      sessaoAtiva.value = true

      // Smart Animate: "Mudar para" a tela de sucesso (ease out, 300ms).
      transicionando.value = true
      criado.value = true
      modalPerfilAberto.value = true
      window.setTimeout(() => {
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

function irParaLogin() {
  criado.value = false
  transicionando.value = false
  modo.value = 'login'
  nome.value = ''
  email.value = ''
  senha.value = ''
  confirmarSenha.value = ''
  erro.value = ''
  erroSenha.value = ''
}

function irParaDashboard() {
  router.push('/dashboard')
}

/** CTA do estado de sucesso: quem já tem sessão vai direto para o dashboard. */
function acaoSucesso() {
  if (sessaoAtiva.value) {
    irParaDashboard()
    return
  }

  irParaLogin()
}

const rotuloSucesso = computed(() =>
  sessaoAtiva.value ? 'Ir para o dashboard' : 'Entrar na minha conta',
)

function finalizarPerfil() {
  modalPerfilAberto.value = false
  irParaDashboard()
}

function voltarAoInicio() {
  router.push('/')
}

/** Classes compartilhadas dos campos (frame: label 14, input 50px raio 10). */
const inputBase =
  'flex h-[50px] w-full items-center rounded-[10px] border border-[rgba(0,0,0,0.16)] bg-[rgba(255,255,255,0.8)] px-3 text-h6 text-text-1 outline-none placeholder:text-text-2/50 focus:border-co-coral'
</script>

<template>
  <div
    class="auth-shell relative flex min-h-dvh flex-col bg-co-white lg:grid lg:grid-cols-[minmax(0,750px)_minmax(0,1fr)]"
    :class="{ 'auth-shell--criado': criado, 'auth-shell--saindo': transicionando }"
  >
    <!-- ========== Painel (468:187 azul) ========== -->
    <section
      class="auth-panel relative flex shrink-0 flex-col justify-between overflow-hidden bg-co-blue px-6 py-6 text-co-white transition-colors duration-300 ease-out sm:px-12 sm:py-8 lg:min-h-dvh lg:px-[clamp(40px,7vw,91px)] lg:py-8"
    >
      <!-- Orbitais decorativos (468:204/468:205) — só a partir de sm -->
      <img
        :src="orbitInner"
        alt=""
        class="pointer-events-none absolute -bottom-40 -left-16 hidden size-[420px] opacity-80 sm:block lg:-bottom-32 lg:-left-10 lg:size-[590px]"
        draggable="false"
      />
      <img
        :src="orbitOuter"
        alt=""
        class="pointer-events-none absolute -bottom-48 -left-24 hidden size-[500px] opacity-60 sm:block lg:-bottom-40 lg:-left-20 lg:size-[670px]"
        draggable="false"
      />

      <button
        type="button"
        class="relative z-10 flex w-fit cursor-pointer items-center gap-2.5 border-0 bg-transparent p-0 text-co-white"
        aria-label="Voltar ao início"
        @click="voltarAoInicio"
      >
        <AppLogo variant="logo-2" :width="100" :height="55" alt="" />
      </button>

      <div class="relative z-10 flex flex-col items-start gap-4 py-6 sm:gap-5 sm:py-8 lg:py-0">
        <p
          class="text-[32px] leading-[1.05] tracking-[-1.5px] text-co-white sm:text-[48px] sm:tracking-[-2.5px] lg:text-h1"
        >
          Conecte-se com<br />quem entende você.
        </p>
        <p class="text-h5 leading-[1.4] text-s-coral sm:text-h4 sm:leading-[normal]">
          Conheça novos estudantes, encontre seu grupo<br class="hidden sm:block" />
          e construa novas histórias dentro e fora da sala.
        </p>
        <div class="hidden shrink-0 items-center justify-center gap-[10px] sm:flex">
          <img :src="coletiveIcon" alt="" class="size-[50px] shrink-0" draggable="false" />
          <p class="text-h6 leading-[normal] text-s-blue">Comunidade feita para você</p>
        </div>
      </div>

      <p class="relative z-10 hidden text-h6 leading-[normal] text-s-blue lg:block">
        Conversa que aproxima. Conexão que transforma.
      </p>
    </section>

    <!-- ========== Formulário (454:99 / 468:206) ========== -->
    <section
      class="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16 lg:py-[123px]"
    >
      <form
        class="flex w-full max-w-[710px] flex-col items-start gap-6 lg:gap-8"
        @submit.prevent="enviar"
      >
        <button
          type="button"
          class="group inline-flex shrink-0 cursor-pointer items-center gap-[3px] border-0 bg-transparent p-0 font-sans text-h6 leading-[normal] whitespace-nowrap text-text-2 transition-colors duration-300 ease-[cubic-bezier(0,0,0.58,1)] hover:text-co-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-co-blue motion-reduce:transition-none"
          @click="voltarAoInicio"
        >
          <span
            class="inline-block font-arrow text-arrow transition-transform duration-300 ease-[cubic-bezier(0,0,0.58,1)] group-hover:-translate-x-1 motion-reduce:transition-none"
            >←</span
          >
          Voltar para o início
        </button>

        <p class="text-h6 leading-[normal] text-co-coral">
          BEM-VINDO AO <span class="text-co-blue">CONECTA.</span>
        </p>

        <p class="text-title text-text-1">{{ titulo }}</p>

        <p class="text-h6 leading-[normal] text-text-2">{{ subtitulo }}</p>

        <!-- Tabs Entrar / Criar conta (554:177) — componente compartilhado -->
        <AppAuthTabs :mode="modo" @select="trocarModo" />

        <!-- Separador (454:105 / 468:218) — linha de 710x1 em traceline -->
        <div class="h-px w-full shrink-0 bg-traceline" aria-hidden="true" />

        <!-- Campos -->
        <label
          v-if="modo === 'register'"
          class="flex w-full shrink-0 flex-col gap-[5px] text-h6 leading-[normal] text-text-2"
        >
          Nome completo
          <input
            v-model="nome"
            type="text"
            class="font-sans"
            :class="inputBase"
            placeholder="Como podemos chamar você?"
            autocomplete="name"
            maxlength="100"
            required
          />
        </label>

        <label class="flex w-full shrink-0 flex-col gap-[5px] text-h6 leading-[normal] text-text-2">
          E-mail
          <input
            v-model="email"
            type="email"
            class="font-sans"
            :class="inputBase"
            placeholder="✉ voce@email.com"
            autocomplete="email"
            maxlength="150"
            required
          />
        </label>

        <label class="flex w-full shrink-0 flex-col gap-[5px] text-h6 leading-[normal] text-text-2">
          Senha
          <span class="relative flex w-full items-center">
            <input
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              class="font-sans"
              :class="inputBase"
              placeholder="▣ Digite sua senha"
              :autocomplete="modo === 'register' ? 'new-password' : 'current-password'"
              maxlength="20"
              minlength="8"
              required
            />
            <button
              type="button"
              class="absolute right-3 cursor-pointer border-0 bg-transparent p-0 text-h6 text-text-2"
              :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
              @click="mostrarSenha = !mostrarSenha"
            >
              {{ mostrarSenha ? 'ocultar' : 'ver' }}
            </button>
          </span>
          <p
            v-if="modo === 'login' && erro"
            class="text-h6 leading-[normal] text-[rgba(255,0,4,0.65)]"
            role="alert"
          >
            {{ erro }}
          </p>
        </label>

        <label
          v-if="modo === 'register'"
          class="flex w-full shrink-0 flex-col gap-[5px] text-h6 leading-[normal] text-text-2"
        >
          Confirmar Senha
          <input
            v-model="confirmarSenha"
            :type="mostrarSenha ? 'text' : 'password'"
            class="font-sans"
            :class="inputBase"
            placeholder="▣ Digite novamente sua senha"
            autocomplete="new-password"
            maxlength="20"
            minlength="8"
            required
          />
          <p
            v-if="erroSenha || erro"
            class="text-h6 leading-[normal] text-[rgba(255,0,4,0.65)]"
            role="alert"
          >
            {{ erroSenha || erro }}
          </p>
        </label>

        <!-- "Esqueci minha senha" só existe no Login (468:97); o Register não tem. -->
        <div v-if="modo === 'login'" class="flex w-full shrink-0 items-center justify-end">
          <AppLink href="/forgot-password" size="h5" :arrow="false">Esqueci minha senha</AppLink>
        </div>

        <!-- Botão principal + link alternativo -->
        <div class="flex w-full shrink-0 flex-col items-center gap-[5px]">
          <AppButton
            type="submit"
            variant="coral"
            :disabled="enviando"
            :width="modo === 'register' ? 225 : 250"
            :padding-left="40"
            :gap="15"
            :gap-hover="23"
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
      </form>
    </section>

    <!-- ========== Sucesso (506:1739) — painel verde de tela cheia ========== -->
    <div
      v-if="criado"
      class="auth-success fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-tree-green px-7 py-8 text-co-white sm:px-12 lg:px-[91px]"
      role="status"
      aria-live="polite"
    >
      <img
        :src="orbitInner"
        alt=""
        class="pointer-events-none absolute -right-24 -top-32 size-[420px] opacity-70 sm:size-[520px] lg:-right-16 lg:-top-24 lg:size-[590px]"
        draggable="false"
      />
      <img
        :src="orbitOuter"
        alt=""
        class="pointer-events-none absolute -right-32 -top-40 hidden size-[620px] opacity-50 sm:block lg:-right-24 lg:-top-32 lg:size-[670px]"
        draggable="false"
      />

      <AppLogo variant="logo-1" :width="100" :height="55" alt="" class="relative z-10" />

      <div class="relative z-10 flex flex-col items-start gap-4 sm:gap-5">
        <p
          class="text-[32px] leading-[1.05] tracking-[-1.5px] text-co-white sm:text-[48px] sm:tracking-[-2.5px] lg:text-h1"
        >
          Conta criada com sucesso!
        </p>
        <p class="text-h5 leading-[1.4] text-s-coral sm:text-h4 sm:leading-[normal]">
          Conheça novos estudantes, encontre seu grupo<br class="hidden sm:block" />
          e construa novas histórias dentro e fora da sala.
        </p>
        <div class="hidden shrink-0 items-center justify-center gap-[10px] sm:flex">
          <img :src="coletiveIcon" alt="" class="size-[50px] shrink-0" draggable="false" />
          <p class="text-h6 leading-[normal] text-s-blue">Comunidade feita para você</p>
        </div>
      </div>

      <div class="relative z-10 flex w-full justify-end">
        <AppButton variant="blue" :width="260" :padding-left="40" @click="acaoSucesso">
          {{ rotuloSucesso }}
        </AppButton>
      </div>
    </div>

    <!-- Perfil pós-cadastro (mesmo fluxo da tela legada) -->
    <ProfileSetupModal v-model="modalPerfilAberto" @save="finalizarPerfil" />
  </div>
</template>

<style scoped>
.auth-shell {
  --smart-animate: 300ms;
  --smart-ease: ease-out;
}

/* Sucesso entra como no Smart Animate do protótipo: 300ms, ease out. */
.auth-success {
  animation: auth-sucesso var(--smart-animate) var(--smart-ease) both;
}

@keyframes auth-sucesso {
  from {
    opacity: 0;
    transform: scale(1.02);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.auth-shell--saindo {
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .auth-success {
    animation: none;
  }
  .auth-shell,
  .auth-shell * {
    transition-duration: 0.01ms !important;
  }
}
</style>
