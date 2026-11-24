import { ref } from 'vue'

/**
 * Estado do cabeçalho do chat no mobile.
 *
 * O histórico de mensagens rola dentro do painel, então o scroll da janela não
 * serve para controlar o recolhimento. A barra de navegação móvel usa
 * `expandChatHeader()` para trazer o cabeçalho de volta sem precisar rolar o
 * histórico até o topo.
 */
export const chatHeaderCollapsed = ref(false)

export function expandChatHeader() {
  chatHeaderCollapsed.value = false
}
