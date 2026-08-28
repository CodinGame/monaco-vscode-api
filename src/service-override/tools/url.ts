export function changeUrlDomain(url: string | URL, domain?: string): string {
  if (domain == null) {
    return url.toString()
  }
  const _url = new URL(url, domain)
  _url.host = new URL(domain).host
  return _url.toString()
}
