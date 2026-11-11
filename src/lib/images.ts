
import { t } from './i18n'
/*
 * Prepares an uploaded picture for an email: resized to the width it is shown
 * at (twice over, for sharp screens), converted to PNG or JPEG (the formats
 * every Outlook shows), and compressed so campaigns stay small enough to save.
 */

const ACCEPTED = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

/** Larger PNGs are re-encoded as JPEG to keep saved campaigns small. */
const PNG_BUDGET_BYTES = 600 * 1024

export const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp'

export class ImageProblem extends Error {}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageProblem(t("That file could not be opened as an image.")))
    }
    image.src = url
  })
}

function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.floor((base64.length * 3) / 4)
}

/** Returns a data URL ready to store in the campaign and place in the email. */
export async function prepareImage(file: File, maxWidth: number): Promise<string> {
  if (!ACCEPTED.includes(file.type)) {
    throw new ImageProblem(t("Use a PNG, JPG, GIF, or WebP image."))
  }
  const image = await loadImage(file)
  const scale = Math.min(1, maxWidth / image.naturalWidth)
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new ImageProblem(t("This browser could not process the image."))

  // PNG keeps transparency (logos, cut-out art). Photos go to JPEG.
  if (file.type === 'image/png' || file.type === 'image/gif') {
    context.drawImage(image, 0, 0, width, height)
    const png = canvas.toDataURL('image/png')
    if (dataUrlBytes(png) <= PNG_BUDGET_BYTES) return png
    context.clearRect(0, 0, width, height)
  }
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.85)
}
