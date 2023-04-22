
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractPathsFromExtensionManifest (manifest: any): string[] {
  const paths: string[] = []
  for (const [key, value] of Object.entries(manifest)) {
    if (typeof value === 'string' && (key === 'path' || value.startsWith('./'))) {
      paths.push(value)
    }
    if (value != null && typeof value === 'object') {
      paths.push(...extractPathsFromExtensionManifest(value))
    }
  }
  return paths
}
