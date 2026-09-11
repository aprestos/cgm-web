import type { DeepPartial } from '../../types'
import type enCommon from '../en/common'

export default {
  actions: {
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    saving: 'A guardar...',
    delete: 'Apagar',
    edit: 'Editar',
    close: 'Fechar',
    update: 'Atualizar',
    updating: 'A atualizar...',
    back: 'Voltar',
    next: 'Seguinte',
    continue: 'Continuar',
    optional: 'Opcional',
    remove: 'Remover',
    clearAll: 'Limpar tudo',
    clear: 'Limpar',
  },
  comingSoon: {
    title: 'Em breve',
    message:
      'Esta funcionalidade ainda está a ser construída e ficará disponível em breve.',
  },
  state: {
    yes: 'Sim',
    no: 'Não',
    loading: 'A carregar...',
    error: 'Ocorreu um erro',
    success: 'Sucesso',
  },
  validation: {
    required: 'Este campo é obrigatório',
    emailInvalid: 'Por favor, insere um endereço de email válido',
  },
  personPicker: {
    tabSearch: 'Pesquisar',
    tabManual: 'Criar',
    personLabel: 'Pessoa',
    personPlaceholder: 'Pesquisar por nome ou email',
    ticketLabel: 'Bilhete',
    ticketPlaceholder: 'Pesquisar por nome ou email do participante',
    nameLabel: 'Nome',
    namePlaceholder: 'Nome completo',
    // `@` starts a linked message in vue-i18n, so a bare one throws at
    // compile time and takes the whole form down with it. `{'@'}` is the
    // literal-interpolation escape.
    emailPlaceholder: "nome{'@'}email.com",
    emailLabel: 'Email',
  },
} satisfies DeepPartial<typeof enCommon>
