import type { DeepPartial } from '../../types'
import type enLanding from '../en/landing'

export default {
  hero: {
    liveNow: 'A Decorrer',
    comingSoon: 'Em Breve',
    defaultTitle: 'Convenção de Jogos de Tabuleiro',
    defaultDescription:
      'A melhor experiência de jogos de tabuleiro espera por ti',
    discoverMore: 'Descobrir Mais',
    enterLibrary: 'Entrar na Ludoteca',
    getTickets: 'Obter Bilhetes',
    exploreLibrary: 'Explorar a Ludoteca',
    joinCommunity: 'Juntar-me à Comunidade',
  },
  poster: {
    viewPoster: 'Ver cartaz do evento',
    eventPoster: 'Cartaz do evento',
    altText: 'Cartaz do evento {name}',
  },
  gallery: {
    title: 'Momentos dos eventos anteriores',
    subtitle: 'Viagem ao passado',
  },
  countdown: {
    title: 'O evento começa em:',
    days: 'Dias',
    hours: 'Horas',
    minutes: 'Minutos',
  },
  tickets: {
    sectionTitle: 'Garante o Teu Acesso',
    sectionSubtitle: 'Escolhe o teu bilhete',
    comingSoonTitle: 'Em breve',
    comingSoonDescription: 'Volta em breve para garantires os teus bilhetes.',
    popular: 'Popular',
    getTicket: 'Adicionar ao carrinho',
    total: 'Total',
    checkout: 'Finalizar Compra',
    ticketsLeft: 'Apenas {count} bilhetes restantes!',
    signInRequired: 'Inicia sessão para comprar bilhetes',
    signIn: 'Iniciar sessão',
    validPeriod: 'Válido: {from} - {until}',
    libraryAccess: 'Acesso completo à ludoteca',
    tournamentAccess: 'Participação em torneios',
    weekend: 'Fim de semana',
  },
  features: {
    sectionTitle: 'A Plataforma',
    sectionSubtitle: 'Tudo num só lugar',
    sectionDescription:
      'Acede a todas as funcionalidades da convenção no teu bolso. Reserva jogos, participa em torneios e conecta-te com outros entusiastas.',
    library: {
      name: 'Ludoteca',
      description:
        'Explora e reserva entre centenas de jogos de tabuleiro. Encontra o teu próximo favorito!',
    },
    tournaments: {
      name: 'Torneios',
      description:
        'Compete pela glória nos nossos torneios organizados. Prémios aguardam os campeões!',
    },
    fleaMarket: {
      name: 'Feira de Usados',
      description:
        'Compra, vende ou troca jogos. Encontra raridades ou dá uma nova casa aos teus jogos.',
    },
    explore: 'Explorar',
  },
  games: {
    sectionTitle: 'Ludoteca',
    sectionSubtitle: 'Descobre jogos incríveis',
    viewAll: 'Ver todos os jogos',
    available: 'Disponível',
  },
  tournaments: {
    sectionTitle: 'Torneios',
    sectionSubtitle: 'Compete pela glória',
    sectionDescription:
      'Inscreve-te no local e luta pelo primeiro lugar do pódio.',
    organizedBy: 'por {name}',
  },
  map: {
    sectionTitle: 'Localização',
    sectionSubtitle: 'Encontra-nos aqui',
    getDirections: 'Obter Direções',
    until: 'Até {date}',
  },
  schedule: {
    sectionTitle: 'Programa',
    sectionSubtitle: 'Planeia os teus dias no evento',
    imageAlt: 'Imagem do programa {index}',
  },
  cta: {
    badge: 'Junta-te à comunidade',
    title: 'Pronto para uma',
    titleHighlight: 'experiência inesquecível?',
    description:
      'Cria a tua conta gratuita para reservar jogos, participar em torneios e aproveitar ao máximo a convenção.',
    button: 'Criar Conta Gratuita',
  },
  footer: {
    privacy: 'Privacidade',
    terms: 'Termos',
    contact: 'Contacto',
    copyright: '© {year} {name}. Todos os direitos reservados.',
  },
  header: {
    dashboard: 'Painel de administração',
    logoAltFallback: 'Logotipo',
    primaryNavAriaLabel: 'Navegação principal',
    mobileNavAriaLabel: 'Navegação mobile',
    openMenu: 'Abrir menu',
    closeMenu: 'Fechar menu',
    accountMenu: 'Menu da conta',
    signInToViewAccount: 'Entrar para ver a conta',
    accountFallbackName: 'Conta',
  },
  cart: {
    title: 'Carrinho de compras',
    closePanel: 'Fechar painel',
    qty: 'Qtd {count}',
    remove: 'Remover',
    subtotal: 'Subtotal',
    checkout: 'Finalizar compra',
    or: 'ou',
    continueShopping: 'Continuar a comprar',
  },
  nav: {
    home: 'Início',
    gallery: 'Galeria',
    location: 'Localização',
    schedule: 'Programa',
    tickets: 'Bilhetes',
    countdown: 'Contagem',
    features: 'Funcionalidades',
    library: 'Ludoteca',
    tournaments: 'Torneios',
  },
  checkout: {
    title: 'Finalizar compra',
    subtitle: 'Conclui a tua compra em poucos passos.',
    section: {
      account: 'Conta',
      tickets: 'Titulares dos Bilhetes',
      payment: 'Pagamento',
      summary: 'Resumo',
      completed: 'Concluído',
    },
    account: {
      description:
        'Usa os teus dados para receber confirmações e atualizações.',
      loading: 'A verificar a tua conta...',
      name: 'Nome completo',
      email: 'Email',
      terms: 'Concordo com os termos e política de privacidade.',
    },
    tickets: {
      description: 'Define o nome e o email para cada bilhete no teu carrinho.',
      ticketNumber: 'Bilhete #{number}',
    },
    payment: {
      description:
        'O processamento do pagamento é feito através da plataforma Stripe. ' +
        'Os teus dados de pagamento não serão armazenados por nós.',
      cancelled: 'O pagamento foi cancelado. Os teus dados foram guardados.',
      failed:
        'Não foi possível processar o pagamento. Tenta novamente mais tarde.',
      confirmationTimeout:
        'Não foi possível confirmar o pagamento. Por vezes a confirmação pode demorar mais do que o esperado. Podes atualizar a página para tentar novamente. Em caso de dúvidas, por favor contacta-nos pelo email {email}.',
    },
    confirming: {
      title: 'A confirmar o pagamento…',
      description: 'Pode demorar alguns segundos.',
    },
    summary: {
      quantity: 'Qtd: {count}',
      subtotal: 'Subtotal',
      taxes: 'Impostos',
      total: 'Total',
    },
    completed: {
      success: 'Pagamento aprovado',
      title: 'Compra concluída com sucesso',
      description:
        'Os teus bilhetes estão confirmados. Mais tarde receberás um email com os detalhes do teu pedido.',
      reference: 'Referência',
      total: 'Valor pago',
      attendees: 'Titulares dos bilhetes',
      backHome: 'Voltar ao início',
      buyMore: 'Comprar mais bilhetes',
    },
    emptyCart: {
      title: 'O teu carrinho está vazio',
      description: 'Adiciona pelo menos um bilhete para continuar.',
      action: 'Voltar aos bilhetes',
    },
    actions: {
      payNow: 'Pagar agora',
      processing: 'A redirecionar...',
    },
    validation: {
      termsRequired: 'Tens de aceitar os termos e a política de privacidade',
    },
  },
} satisfies DeepPartial<typeof enLanding>
