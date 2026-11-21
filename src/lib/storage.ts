import { supabase } from './supabase'

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
 * Uploads a photo to Supabase Storage bucket 'photos'
 */
export async function uploadPhotoToStorage(
  spaceId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ path: string; publicUrl: string; width: number; height: number }> {
  onProgress?.(10)
  
  // Compress image
  const compressedBlob = await compressImage(file)
  onProgress?.(40)

  // File naming: {spaceId}/{timestamp}_{random}.jpg
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

  const { data: publicUrlData } = supabase.storage
    .from('photos')
    .getPublicUrl(data.path)

  onProgress?.(100)

  // Measure dimensions
  const dimensions = await getImageDimensions(URL.createObjectURL(compressedBlob))

  return {
    path: data.path,
    publicUrl: publicUrlData.publicUrl,
    width: dimensions.width,
    height: dimensions.height,
  }
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => resolve({ width: 1200, height: 800 })
  })
}
