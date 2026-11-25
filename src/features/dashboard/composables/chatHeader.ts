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

/**
 * Detecta o teclado pelo visualViewport e recolhe o header enquanto ele estiver
 * ativo. Chamado apenas no chat; a nav móvel some e o painel usa a altura visível.
 */
export function setupMobileKeyboardDetection() {
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
  while (element && element !== document.body) {
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
  let lastScrollTop = 0
  let touchStartY = 0
  let touchLastY = 0

  function onScroll(event: Event) {
    if (!isMobileHeader()) return
    const target = event.target
    const element =
      target instanceof HTMLElement
        ? target
        : (document.scrollingElement as HTMLElement | null)
    if (!element || typeof element.scrollTop !== 'number') return

    const scrollTop = element.scrollTop
    const delta = scrollTop - lastScrollTop
    lastScrollTop = scrollTop

    // Um fling no mobile pode avançar mais de 100px entre dois eventos.
    if (delta > 3 && scrollTop > 24) chatHeaderCollapsed.value = true
    else if (!mobileKeyboardOpen.value && delta < -3 && scrollTop <= 8) {
      chatHeaderCollapsed.value = false
    }
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
    const scrollingElement = document.scrollingElement
    if (
      scrollingElement &&
      scrollingElement.scrollHeight > scrollingElement.clientHeight + 1
    ) {
      return
    }

    const touchEvent = event as TouchEvent
    const y = touchEvent.touches[0]?.clientY ?? 0
    const delta = y - touchLastY
    touchLastY = y
    if (Math.abs(delta) < 1) return

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
    lastScrollTop = 0
    onTouchEnd()
  }

  return { onScroll, onTouchStart, onTouchMove, onTouchEnd, reset }
}
