import type { DeepPartial } from '../../types'
import type enAuth from '../en/auth'

export default {
  signIn: 'Entrar',
  signOut: 'Terminar sessão',
  signUp: 'Registar',
  email: 'Email',
  password: 'Palavra-passe',
  forgotPassword: 'Esqueceste-te da palavra-passe?',
  authenticationRequired: 'Autenticação Necessária',
  authenticationRequiredMessage:
    'Precisas de estar autenticado para reservar jogos.',
  signInToAccount: 'Acede à tua conta',
  signInDescription:
    'Insere o teu endereço de e-mail e receberás um código de verificação para concluíres o início de sessão.',
  emailAddress: 'Endereço de email',
  enterEmailPlaceholder: 'Insere o teu endereço de email',
  sendMagicLink: 'Enviar código',
  sendingMagicLink: 'A enviar email...',
  orContinueWith: 'Ou continua com',
  google: 'Google',
  apple: 'Apple',
  checkInbox: 'Verifica a tua caixa de entrada!',
  verificationCodeSent: 'Enviámos um código de acesso seguro para',
  enterCodeDescription:
    'Insere o código abaixo para iniciares sessão na tua conta.',
  enterVerificationCode: 'Insere o código de verificação',
  verifyCode: 'Verificar código',
  verifying: 'A verificar...',
  didntReceiveCode: 'Não recebeste o código? Verifica se não está no SPAM ou',
  tryAgain: 'tenta novamente',
  codeExpiresNote:
    'Este código expira em 20 minutos por motivos de segurança. Se não o usares dentro desse tempo, terás de solicitar um novo.',
  sendToDifferentEmail: 'Enviar para email diferente',
  confirmingSignIn: 'A confirmar...',
  pleaseWaitVerify: 'Por favor aguarda enquanto verificamos o código.',
  welcomeBack: 'Bem-vindo!',
  successfullySignedIn: 'O início de sessão foi efetuado com sucesso.',
  redirectingIn:
    'A redirecionar para a página inicial em {seconds} segundos...',
  continueToHome: 'Continuar para a página inicial',
  almostThere: 'Quase lá!',
  provideDisplayName: 'Por favor, insere um nome para completar o teu perfil.',
  displayName: 'Nome',
  enterDisplayName: 'Insere o teu nome',
  updateDisplayName: 'Guardar',
  updating: 'A guardar...',
  authenticationFailed: 'Algo errado',
  verifySignInFailed:
    'Não conseguimos verificar o código. Pode ter expirado ou já ter sido usado.',
  backToSignIn: 'Voltar ao Início de Sessão',
  displayNameRequired: 'O nome é obrigatório',
  displayNameMinLength: 'O nome deve ter pelo menos 2 caracteres',
} satisfies DeepPartial<typeof enAuth>
