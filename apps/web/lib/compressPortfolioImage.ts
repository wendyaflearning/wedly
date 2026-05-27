import imageCompression from 'browser-image-compression'

export async function compressPortfolioImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: 3.5,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    })
  } catch {
    throw new Error('compress_failed')
  }
}
