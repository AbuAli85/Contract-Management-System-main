// Custom image loader for Supabase images
export default function supabaseLoader({ src, width, quality }: {
  src: string
  width: number
  quality?: number
}) {
  // For Supabase storage URLs, return as-is since they're already optimized
  if (src.includes('supabase.co/storage')) {
    return src
  }
  
  // For other URLs, you could add custom optimization logic here
  return src
}
