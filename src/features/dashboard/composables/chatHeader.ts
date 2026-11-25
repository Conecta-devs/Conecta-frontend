import { ref } from 'vue'

/**
 * Estado do cabeçalho do dashboard no mobile.
 *
 * O scroll pode acontecer na janela ou em containers internos (histórico do
 * chat, listas curtas, tabelas etc.), então o estado é compartilhado e as
 * páginas usam `createHeaderScrollHandlers()` para controlá-lo.
 */
export const chatHeaderCollapsed = ref(false)
export const mobileKeyboardOpen = ref(false)
export const mobileKeyboardHeight = ref(0)

let viewportHeightWithoutKeyboard = 0
let collapsedBeforeKeyboard = false

export function expandChatHeader() {
  if (mobileKeyboardOpen.value) return
  chatHeaderCollapsed.value = false
}

function setMobileKeyboardOpen(open: boolean, height: number) {
  if (open === mobileKeyboardOpen.value) {
    if (open) mobileKeyboardHeight.value = height
    return
  }

  if (open) {
    collapsedBeforeKeyboard = chatHeaderCollapsed.value
    chatHeaderCollapsed.value = true
    mobileKeyboardHeight.value = height
    // O teclado pode empurrar o viewport; volta ao topo para manter a seta e o nome visíveis.
    window.scrollTo(0, 0)
  } else {
    chatHeaderCollapsed.value = collapsedBeforeKeyboard
    mobileKeyboardHeight.value = 0
  }

  mobileKeyboardOpen.value = open
}

/** Impede que um gesto no cabeçalho ou no form rol a página com o teclado aberto. */
export function preventKeyboardScroll(event: TouchEvent) {
  if (mobileKeyboardOpen.value) event.preventDefault()
}

/**
 * Detecta o teclado pelo visualViewport e recolhe o header enquanto ele estiver
 * ativo. A queda de altura só conta como teclado quando o campo da mensagem está
 * focado: esconder a barra do navegador não pode travar o scroll nem mexer no header.
 */
export function setupMobileKeyboardDetection(isMessageInputFocused: () => boolean) {
  if (typeof window === 'undefined' || !window.visualViewport) return () => {}

  const viewport = window.visualViewport
  viewportHeightWithoutKeyboard = viewport.height || window.innerHeight

  const update = () => {
    if (!isMobileHeader()) {
      viewportHeightWithoutKeyboard = viewport.height || window.innerHeight
      if (mobileKeyboardOpen.value) setMobileKeyboardOpen(false, 0)
      return
    }

    const height = viewport.height || window.innerHeight
    if (!isMessageInputFocused()) {
      viewportHeightWithoutKeyboard = height
      if (mobileKeyboardOpen.value) setMobileKeyboardOpen(false, 0)
      return
    }

    if (height > viewportHeightWithoutKeyboard) viewportHeightWithoutKeyboard = height
    const open = viewportHeightWithoutKeyboard - height > 120
    setMobileKeyboardOpen(open, height)
  }

  viewport.addEventListener('resize', update)
  viewport.addEventListener('scroll', update)
  window.addEventListener('resize', update)
  update()

  return () => {
    viewport.removeEventListener('resize', update)
    viewport.removeEventListener('scroll', update)
    window.removeEventListener('resize', update)
    if (mobileKeyboardOpen.value) setMobileKeyboardOpen(false, 0)
  }
}

function isMobileHeader() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 620px)').matches
}

function scrollableAncestor(target: EventTarget | null): HTMLElement | null {
  let element = target instanceof HTMLElement ? target : null
  const chatPage = element?.closest('.chat-page') ?? null
  const stopAt = chatPage?.parentElement ?? document.body
  while (element && element !== stopAt && element !== document.body) {
    const overflowY = getComputedStyle(element).overflowY
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      element.scrollHeight > element.clientHeight + 1
    ) {
      return element
    }
    element = element.parentElement
  }
  return null
}

/**
 * Cria um conjunto independente de handlers para um container rolável.
 * Use uma instância por container para não misturar o `scrollTop` de um com o
 * outro quando o usuário troca de seção.
 */
export function createHeaderScrollHandlers() {
  let touchStartY = 0
  let touchLastY = 0

  function onScroll(event: Event) {
    if (!isMobileHeader()) return
    const target = event.target
    if (!(target instanceof HTMLElement)) return

    const scrollTop = target.scrollTop
    if (scrollTop > 24) chatHeaderCollapsed.value = true
    else if (!mobileKeyboardOpen.value && scrollTop <= 8) chatHeaderCollapsed.value = false
  }

  function onTouchStart(event: Event) {
    const touchEvent = event as TouchEvent
    touchStartY = touchEvent.touches[0]?.clientY ?? 0
    touchLastY = touchStartY
  }

  function onTouchMove(event: Event) {
    if (!isMobileHeader()) return
    // Se existe conteúdo para rolar, o scroll já controla o cabeçalho.
    if (scrollableAncestor(event.target)) return

    const touchEvent = event as TouchEvent
    const y = touchEvent.touches[0]?.clientY ?? 0
    const delta = y - touchLastY
    if (Math.abs(delta) < 1) return

    // A área não é rolável: o gesto é do header, não da página (nem pull-to-refresh).
    event.preventDefault()
    touchLastY = y

    const total = y - touchStartY
    // Dedo para cima equivale a rolar para baixo na página.
    if (total < -24) chatHeaderCollapsed.value = true
    else if (!mobileKeyboardOpen.value && total > 24) chatHeaderCollapsed.value = false
  }

  function onTouchEnd() {
    touchStartY = 0
    touchLastY = 0
  }

  function reset() {
    onTouchEnd()
  }

  return { onScroll, onTouchStart, onTouchMove, onTouchEnd, reset }
}
