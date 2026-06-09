enum Admin {
  dashboard = 'admin.home',
  library = 'admin.library',
  events = 'admin.events',
  tournaments = 'admin.tournaments',
  tickets = 'admin.tickets',
  orders = 'admin.orders',
  stripeCallback = 'admin.stripe.callback',
  settings = 'admin.settings',
  settingsOrganization = 'admin.settings.organization',
  settingsEdition = 'admin.settings.edition',
  settingsFeatures = 'admin.settings.features',
  settingsLibrary = 'admin.settings.library',
  settingsTournaments = 'admin.settings.tournaments',
  settingsTickets = 'admin.settings.tickets',
  settingsEventsModule = 'admin.settings.events-module',
  settingsFleaMarket = 'admin.settings.flea-market',
  settingsAdvanced = 'admin.settings.advanced',
}

enum Public {
  root = 'root',
  home = 'public.home',
  tickets = 'public.tickets',
  library = 'public.library',
  tournaments = 'public.tournaments',
  prototypes = 'public.prototypes',
  fleaMarket = 'public.flea-market',
  user = 'public.user',
  checkout = 'public.checkout',
}

enum Landing {
  home = 'landing.home',
  checkout = 'landing.checkout',
}

enum Auth {
  signIn = 'auth.sign-in',
  signUp = 'auth.sign-up',
  checkInbox = 'auth.check-inbox',
  confirm = 'auth.confirm',
}

enum ErrorRoutes {
  notFound = 'error.not-found',
}

export const RouteNames = {
  admin: Admin,
  public: Public,
  landing: Landing,
  auth: Auth,
  error: ErrorRoutes,
}
