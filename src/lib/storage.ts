import { supabase } from './supabase'

// In-memory cache for signed URLs so we don't repeat network roundtrips on every component re-render
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

/**
 * Compresses an image file client-side using an offscreen canvas
 * Keeps maximum dimension at 1920px and outputs a clean JPEG
 */
export async function compressImage(file: File, maxDimension = 1920, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          resolve(file)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

/**
 * Uploads a photo to the PRIVATE Supabase Storage bucket 'photos'
 * Path structure: {spaceId}/{timestamp}_{random}.jpg
 */
export async function uploadPhotoToStorage(
  spaceId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ path: string; width: number; height: number }> {
  onProgress?.(10)
  
  // Compress image client-side
  const compressedBlob = await compressImage(file)
  onProgress?.(40)

  // Enforce space-scoped storage path
  const filename = `${spaceId}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(filename, compressedBlob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  onProgress?.(80)

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Measure dimensions
  const dimensions = await getImageDimensions(URL.createObjectURL(compressedBlob))
  onProgress?.(100)

  return {
    path: data.path,
    width: dimensions.width,
    height: dimensions.height,
  }
}

/**
 * Creates a secure, time-limited signed URL for a private photo
 * Uses client-side cache with 10-minute safety margin before expiry
 */
export async function getPrivatePhotoSignedUrl(
  storagePath: string,
  expiresInSeconds = 7200 // 2 hours
): Promise<string> {
  if (!storagePath) return ''

  // If already an HTTP URL (e.g. Unsplash demo photos or external previews)
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://') || storagePath.startsWith('blob:')) {
    return storagePath
  }

  const now = Date.now()
  const cached = signedUrlCache.get(storagePath)
  // If cache is valid for more than 10 minutes, return cached
  if (cached && cached.expiresAt > now + 10 * 60 * 1000) {
    return cached.url
  }

  const { data, error } = await supabase.storage
    .from('photos')
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    console.error('Failed to create signed URL for path:', storagePath, error)
    return ''
  }

  signedUrlCache.set(storagePath, {
    url: data.signedUrl,
    expiresAt: now + expiresInSeconds * 1000,
  })

  return data.signedUrl
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 1200, height: 800 })
  })
}
