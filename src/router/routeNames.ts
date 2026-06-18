const AdminOrders = {
  overview: 'admin.orders.overview',
  details: 'admin.orders.details',
} as const

const Admin = {
  dashboard: 'admin.home',
  library: 'admin.library',
  events: 'admin.events',
  tournaments: 'admin.tournaments',
  tickets: 'admin.tickets',
  ordersRoot: 'admin.orders',
  orders: AdminOrders,
  stripeCallback: 'admin.stripe.callback',
  settings: 'admin.settings',
  settingsOrganization: 'admin.settings.organization',
  settingsEdition: 'admin.settings.edition',
  settingsFeatures: 'admin.settings.features',
  settingsLibrary: 'admin.settings.library',
  settingsTournaments: 'admin.settings.tournaments',
  settingsTickets: 'admin.settings.tickets',
  settingsEventsModule: 'admin.settings.events-module',
  settingsFleaMarket: 'admin.settings.flea-market',
  settingsAdvanced: 'admin.settings.advanced',
} as const

const Public = {
  root: 'root',
  home: 'public.home',
  tickets: 'public.tickets',
  library: 'public.library',
  tournaments: 'public.tournaments',
  prototypes: 'public.prototypes',
  fleaMarket: 'public.flea-market',
  user: 'public.user',
  checkout: 'public.checkout',
} as const

const Landing = {
  home: 'landing.home',
  checkout: 'landing.checkout',
} as const

const Auth = {
  signIn: 'auth.sign-in',
  signUp: 'auth.sign-up',
  checkInbox: 'auth.check-inbox',
  confirm: 'auth.confirm',
} as const

const ErrorRoutes = {
  notFound: 'error.not-found',
} as const

export const RouteNames = {
  admin: Admin,
  public: Public,
  landing: Landing,
  auth: Auth,
  error: ErrorRoutes,
} as const
