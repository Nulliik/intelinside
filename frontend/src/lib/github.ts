export function isGitHubUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:'
      && url.port === ''
      && (url.hostname === 'github.com' || url.hostname === 'www.github.com')
  } catch {
    return false
  }
}
