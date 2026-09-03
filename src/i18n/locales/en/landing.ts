/** Marketing site + checkout flow (src/views/landing) */
export default {
  hero: {
    liveNow: 'Live Now',
    defaultTitle: 'Board Game Convention',
    defaultDescription: 'The ultimate board gaming experience awaits you',
    discoverMore: 'Discover More',
    enterLibrary: 'Enter the Library',
    getTickets: 'Get Your Tickets',
    exploreLibrary: 'Explore the Library',
    joinCommunity: 'Join the Community',
  },
  poster: {
    viewPoster: 'View event poster',
    eventPoster: 'Event poster',
    altText: '{name} event poster',
  },
  gallery: {
    title: 'Moments from Our Community',
    subtitle: 'Capturing the joy of gaming together',
  },
  countdown: {
    title: 'The countdown begins',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
  },
  tickets: {
    sectionTitle: 'Get Your Access',
    sectionSubtitle: 'Choose your ticket',
    comingSoonDescription: 'Check back soon to get your tickets.',
    popular: 'Popular',
    getTicket: 'Get This Ticket',
    total: 'Total',
    checkout: 'Proceed to Checkout',
    ticketsLeft: 'Only {count} tickets left!',
    signInRequired: 'Sign in to purchase tickets',
    signIn: 'Sign in',
    validPeriod: 'Valid: {from} - {until}',
    libraryAccess: 'Full library access',
    tournamentAccess: 'Tournament participation',
    weekend: 'Weekend',
  },
  features: {
    sectionTitle: 'The Platform',
    sectionSubtitle: 'Everything in one place',
    sectionDescription:
      'Access all convention features from your pocket. Reserve games, join tournaments, and connect with fellow enthusiasts.',
    library: {
      name: 'Game Library',
      description:
        'Browse and reserve from hundreds of board games. Find your next favorite!',
    },
    tournaments: {
      name: 'Tournaments',
      description:
        'Compete for glory in our organized tournaments. Prizes await the champions!',
    },
    fleaMarket: {
      name: 'Flea Market',
      description:
        'Buy, sell, or trade games. Find rare gems or give your games a new home.',
    },
    explore: 'Explore',
  },
  games: {
    sectionTitle: 'Game Library',
    sectionSubtitle: 'Discover amazing games',
    viewAll: 'View all games',
    available: 'Available',
  },
  tournaments: {
    sectionTitle: 'Tournaments',
    sectionSubtitle: 'Compete for glory',
    sectionDescription:
      'Sign up at the venue and battle it out for the top spot.',
    viewAll: 'View all tournaments',
    organizedBy: 'by {name}',
  },
  map: {
    sectionTitle: 'Location',
    sectionSubtitle: 'Find us here',
    getDirections: 'Get Directions',
    until: 'Until {date}',
  },
  schedule: {
    sectionTitle: 'Schedule',
    sectionSubtitle: 'Plan your days at the event',
    imageAlt: 'Schedule image {index}',
  },
  cta: {
    badge: 'Join the community',
    title: 'Ready for an',
    titleHighlight: 'unforgettable experience?',
    description:
      'Create your free account to reserve games, join tournaments, and get the most out of the convention.',
    button: 'Create Free Account',
  },
  footer: {
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    copyright: '© {year} {name}. All rights reserved.',
  },
  header: {
    dashboard: 'Dashboard',
    logoAltFallback: 'Logo',
    primaryNavAriaLabel: 'Primary navigation',
    mobileNavAriaLabel: 'Mobile navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    accountMenu: 'Account menu',
    signInToViewAccount: 'Sign in to view your account',
    accountFallbackName: 'Account',
  },
  cart: {
    title: 'Shopping cart',
    closePanel: 'Close panel',
    qty: 'Qty {count}',
    remove: 'Remove',
    subtotal: 'Subtotal',
    checkout: 'Checkout',
    or: 'or',
    continueShopping: 'Continue Shopping',
  },
  // Enum-label map — keys match landing section ids verbatim
  nav: {
    home: 'Home',
    gallery: 'Gallery',
    location: 'Location',
    schedule: 'Schedule',
    tickets: 'Tickets',
    countdown: 'Countdown',
    features: 'Features',
    library: 'Library',
    tournaments: 'Tournaments',
  },
  checkout: {
    title: 'Checkout',
    subtitle: 'Complete your purchase in a few steps.',
    section: {
      account: 'Account',
      tickets: 'Ticket Holders',
      payment: 'Payment',
      summary: 'Summary',
      completed: 'Completed',
    },
    account: {
      description: 'Use your details to receive confirmations and updates.',
      loading: 'Checking your account...',
      name: 'Full name',
      email: 'Email address',
      terms: 'I agree with the terms and privacy policy.',
    },
    tickets: {
      description: 'Set the name and email for each ticket in your cart.',
      ticketNumber: 'Ticket #{number}',
    },
    payment: {
      description:
        'The payment processing is done securely by Stripe. We do not store your payment details.',
      cardDetails: 'Card details',
      cardName: 'Name on card',
      cardNumber: 'Card number',
      expiry: 'Expiry date',
      cvv: 'CVV',
      invoiceAddress: 'Invoicing address',
      companyName: 'Company name (optional)',
      vatNumber: 'VAT number (optional)',
      address: 'Address',
      city: 'City',
      postalCode: 'Postal code',
      country: 'Country',
      cancelled:
        'Payment was cancelled. Your details are saved — you can try again.',
      failed:
        'We could not process your payment. Your details are saved — please try again.',
      confirmationTimeout:
        'We could not confirm your payment in time... Sometimes the validation may take longer than expected. Try refreshing the page to check again. If you have any doubts contact us at {email}',
    },
    confirming: {
      title: 'Confirming your payment…',
      description:
        'This may take a few seconds. Please do not close this page.',
    },
    summary: {
      quantity: 'Qty: {count}',
      subtotal: 'Subtotal',
      taxes: 'Taxes',
      total: 'Total',
    },
    completed: {
      success: 'Payment approved',
      title: 'Order completed successfully',
      description:
        'Your tickets are confirmed. We sent a confirmation email with all details.',
      reference: 'Reference',
      total: 'Paid amount',
      attendees: 'Ticket holders',
      backHome: 'Back to home',
      buyMore: 'Buy more tickets',
    },
    emptyCart: {
      title: 'Your cart is empty',
      description: 'Add at least one ticket to continue to checkout.',
      action: 'Back to tickets',
    },
    actions: {
      payNow: 'Pay now',
      processing: 'Processing payment...',
    },
    validation: {
      termsRequired: 'You must accept the terms and privacy policy',
    },
  },
}
