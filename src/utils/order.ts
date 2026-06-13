export function shortId(uuid: string): string {
  if (!uuid) return ''

  return uuid.split('-')[0]?.toUpperCase() ?? ''
}
