/**
 * Copy dos frames de sucesso das telas de autenticação.
 *
 * Fica num único lugar porque o Login (506:1739) e a redefinição de senha
 * (760:726) mostram o mesmo painel verde e o CTA de um leva ao outro. Antes
 * cada tela repetia as strings à mão.
 */
export const introSucessoConta = {
  titulo: 'Conta criada com sucesso!',
  titulo2: '',
} as const

export const introSucessoReset = {
  titulo: 'Senha redefinida com sucesso!',
  titulo2: '',
  descricao: 'Agora você pode entrar com sua nova senha',
  descricao2: 'e continuar se conectando com outros estudantes.',
} as const
