/** Evidence can live anywhere, but links must be absolute HTTPS URLs. */
export function isEvidenceUrl(value: string): boolean {
  if (!/^https:\/\/\S+$/i.test(value)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password
      && !value.includes('\\')
  } catch {
    return false
  }
}
