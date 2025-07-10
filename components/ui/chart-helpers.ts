// Utility to get a safe key for legend items
export function getLegendItemKey(item: any, nameKey?: string): string {
  // Try to use nameKey, then item.value, then fallback to 'value'
  if (nameKey) return String(nameKey)
  if (item && typeof item.value !== 'undefined') return String(item.value)
  return 'value'
}
