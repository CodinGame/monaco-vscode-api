export function changeUrlDomain (url: string, domain?: string): string {
  if (domain == null) {
    return url
  }
  const _url = new URL(url, domain)
  _url.host = new URL(domain).hostname
  return _url.toString()
}
