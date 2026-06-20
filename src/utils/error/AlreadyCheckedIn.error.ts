export class AlreadyCheckedInError extends Error {
  constructor(message: string) {
    super(message)
  }
}
