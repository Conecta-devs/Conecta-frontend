import { onMounted, onUnmounted } from 'vue'

interface ScrollLockSnapshot {
  htmlOverflow: string
  htmlHeight: string
  bodyOverflow: string
  bodyHeight: string
  bodyMargin: string
}

/**
 * Trava html/body enquanto um canvas de tela cheia está montado.
 * O scroll acontece dentro do wrapper do canvas, não na página.
 */
export function useBodyScrollLock() {
  let snapshot: ScrollLockSnapshot | null = null

  onMounted(() => {
    const html = document.documentElement
    const body = document.body

    snapshot = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyMargin: body.style.margin,
    }

    html.style.overflow = 'hidden'
    html.style.height = '100vh'
    body.style.overflow = 'hidden'
    body.style.height = '100vh'
    body.style.margin = '0'
  })

  onUnmounted(() => {
    if (!snapshot) return

    const html = document.documentElement
    const body = document.body

    html.style.overflow = snapshot.htmlOverflow
    html.style.height = snapshot.htmlHeight
    body.style.overflow = snapshot.bodyOverflow
    body.style.height = snapshot.bodyHeight
    body.style.margin = snapshot.bodyMargin
    snapshot = null
  })
}
