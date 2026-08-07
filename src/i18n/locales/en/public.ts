/** Attendee-facing app: library, games, reservations (src/views/public) */
export default {
  navigation: {
    library: 'Library',
    tournaments: 'Tournaments',
    tickets: 'Tickets',
    admin: 'Admin',
    profile: 'Profile',
  },
  game: {
    reserve: 'Reserve',
    imageUnavailable: 'Image unavailable',
    coverImage: '{name} cover image',
    // Enum-label map — keys match GameStatus values verbatim
    status: {
      available: 'Available',
      reserved: 'Reserved',
      unavailable: 'Unavailable',
      notAvailable: 'Not Available',
      withdrawn: 'Withdrawn',
      inUse: 'In Use',
    },
    detail: {
      players: 'players',
      min: 'min',
      age: 'Age',
      description: 'Description',
      notAvailable: 'N/A',
      productInformation: 'Product information',
      best: 'Best',
      good: 'Good',
      playable: 'Playable',
      recommended: 'Recommended',
      // Enum-label map — keys match BGG language dependence values verbatim
      languageDependence: {
        no_necessary: 'No language dependence',
        some_necessary: 'Some necessary language dependence',
        moderate: 'Moderate language dependence',
        extensive: 'High language dependence',
      },
      viewOnBGG: 'View on BoardGameGeek',
    },
  },
  library: {
    title: 'Library',
    games: 'Games',
    search: 'Search games...',
    noGamesFound: 'No games found',
    noGamesFoundDescription:
      "Try adjusting your search or filters to find what you're looking for.",
    closeMenu: 'Close menu',
    loadingMoreGames: 'Loading more games...',
    reserveGame: 'Reserve Game',
    // Enum-label map — keys match filter category ids verbatim
    filters: {
      title: 'Filters',
      'new-arrivals': 'New arrivals',
      family: 'Family',
      classics: 'Classics',
      'two-player-only': '2-player only',
      children: 'Kids',
      players: 'Number of Players',
      playtime: 'Playtime',
    },
    // Enum-label map — keys match SortOption values verbatim
    sort: {
      sortBy: 'Sort by',
      bestRating: 'Best Rating',
      newest: 'Newest',
      name: 'Name',
      trending: 'Trending',
    },
  },
  tournaments: {
    title: 'Tournaments',
    description:
      'Browse every tournament of the convention and grab your spot before it is gone.',
    search: 'Search tournaments...',
    organizedBy: 'by {name}',
    date: 'Date',
    place: 'Place',
    slotsLeft: '{count} spots left',
    full: 'Full',
    closed: 'Sign-ups closed',
    join: 'Join tournament',
    joinSuccess: 'You\'re on the list for "{title}"',
    loadError: 'Unable to load tournaments',
    empty: 'No tournaments found',
    emptyDescription: 'Try adjusting your search or filters.',
    // Enum-label map — keys match the status tab ids verbatim
    tabs: {
      all: 'All',
      scheduled: 'Upcoming',
      ongoing: 'Ongoing',
      finished: 'Finished',
    },
    // Enum-label map — keys match TournamentStatus values verbatim
    status: {
      scheduled: 'Upcoming',
      ongoing: 'Ongoing',
      finished: 'Finished',
      cancelled: 'Cancelled',
    },
    // Format labels — keys are string ids used by tournament.format
    format: {
      swiss: 'Swiss',
      'single-elimination': 'Single Elimination',
      'double-elimination': 'Double Elimination',
      'round-robin': 'Round Robin',
      consolation: 'Consolation',
    },
    // Enum-label map — keys match SortOption values verbatim
    sort: {
      sortBy: 'Sort by',
      soonest: 'Starting soonest',
      slots: 'Most spots left',
      name: 'Name',
    },
  },
  reservation: {
    areYouSureReserve: 'Are you sure you want to reserve',
    important: 'Important:',
    reservationValid: 'This reservation is only valid for',
    minutes: 'minutes',
    oneReservationPerUser: 'Only one active reservation per user is allowed',
  },
  withdraw: {
    history: 'Withdrawal History',
    totalWithdrawals: 'total withdrawal',
    totalWithdrawalsPlural: 'total withdrawals',
    noWithdrawalsYet: 'No withdrawals yet',
    noWithdrawalsMessage: "This user hasn't withdrawn any games.",
    returned: 'Returned',
    active: 'Active',
    returnedOn: 'Returned on',
    hours: 'hours',
  },
}
