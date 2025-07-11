// Simple QR code generation for TOTP
export async function generateQRCode(text: string): Promise<string> {
  // For now, we'll use a QR code API service
  // In production, you might want to use a proper QR library
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(text)}`
  
  // Convert to base64 data URL
  try {
    const response = await fetch(qrApiUrl)
    const blob = await response.blob()
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    // Fallback: return the URL directly
    return qrApiUrl
  }
}