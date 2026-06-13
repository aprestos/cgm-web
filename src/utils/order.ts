export const shortId = (uuid: string) => {
  if (!uuid) return ''

  const parts: string[] = uuid.split('-')

  return parts?.[0]?.toUpperCase()
}
