/**
 * Strings shared across all areas of the app.
 * Only add a key here when the exact same wording is used in more than one area.
 */
export default {
  actions: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    saving: 'Saving...',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    update: 'Update',
    updating: 'Updating...',
    back: 'Back',
    next: 'Next',
    continue: 'Continue',
    optional: 'Optional',
    remove: 'Remove',
    clearAll: 'Clear all',
    clear: 'Clear',
  },
  // The one wording for anything that is not built yet — every button that
  // has nothing to do yet says exactly this.
  comingSoon: {
    title: 'Coming soon',
    message: 'This is still being built and will be available soon.',
  },
  state: {
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
  },
  validation: {
    required: 'This field is required',
    emailInvalid: 'Please enter a valid email address',
  },
  // PersonPicker's own wording. Naming a person reads the same wherever it is
  // done, so these are not passed in; what is done with the person afterwards
  // is the screen's own button, and its own wording.
  personPicker: {
    tabSearch: 'Search',
    tabManual: 'Create',
    personLabel: 'Person',
    personPlaceholder: 'Search by name or email',
    ticketLabel: 'Ticket',
    ticketPlaceholder: 'Search by attendee name or email',
    nameLabel: 'Name',
    namePlaceholder: 'Full name',
    // `@` starts a linked message in vue-i18n, so a bare one throws at
    // compile time and takes the whole form down with it. `{'@'}` is the
    // literal-interpolation escape.
    emailPlaceholder: "name{'@'}email.com",
    emailLabel: 'Email',
  },
}
