import type { DeepPartial } from '../../types'
import type enCommon from '../en/common'

export default {
  actions: {
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Apagar',
    edit: 'Editar',
    close: 'Fechar',
    submit: 'Submeter',
    submitting: 'A submeter...',
    update: 'Atualizar',
    updating: 'A atualizar...',
    back: 'Voltar',
    next: 'Seguinte',
    continue: 'Continuar',
    optional: 'Opcional',
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
} satisfies DeepPartial<typeof enCommon>
