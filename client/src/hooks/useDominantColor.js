import { useEffect, useRef, useState } from 'react'

const DEFAULT_COLOR = { r: 88, g: 80, b: 180, hex: '#5850B4', isDark: true }

function toHex(value) {
  return value.toString(16).padStart(2, '0')
}

function useDominantColor(imageUrl) {
  const [color, setColor] = useState(DEFAULT_COLOR)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!imageUrl) {
      setColor(DEFAULT_COLOR)
      return
    }

    // Lazily create a single off-screen canvas and reuse it
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    let cancelled = false

    img.onload = () => {
      if (cancelled) return

      try {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { willReadFrequently: true })

        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)

        // Sample a 10×10 region from the center
        const sampleSize = 10
        const startX = Math.max(0, Math.floor(img.naturalWidth / 2 - sampleSize / 2))
        const startY = Math.max(0, Math.floor(img.naturalHeight / 2 - sampleSize / 2))
        const w = Math.min(sampleSize, img.naturalWidth - startX)
        const h = Math.min(sampleSize, img.naturalHeight - startY)

        const imageData = ctx.getImageData(startX, startY, w, h)
        const data = imageData.data
        const pixelCount = w * h

        let totalR = 0
        let totalG = 0
        let totalB = 0

        for (let i = 0; i < pixelCount; i++) {
          totalR += data[i * 4]
          totalG += data[i * 4 + 1]
          totalB += data[i * 4 + 2]
        }

        const r = Math.round(totalR / pixelCount)
        const g = Math.round(totalG / pixelCount)
        const b = Math.round(totalB / pixelCount)
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`
        const isDark = r * 0.299 + g * 0.587 + b * 0.114 < 128

        setColor({ r, g, b, hex, isDark })
      } catch {
        setColor(DEFAULT_COLOR)
      }
    }

    img.onerror = () => {
      if (!cancelled) setColor(DEFAULT_COLOR)
    }

    img.src = imageUrl

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  return color
}

export default useDominantColor
