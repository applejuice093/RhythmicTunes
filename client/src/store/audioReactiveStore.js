import { create } from 'zustand'

/**
 * Audio Reactive Store
 * Provides real-time audio frequency data from the Web Audio API.
 * Components subscribe to bass/mid/treble/volume levels for reactive UI.
 */
export const useAudioReactiveStore = create((set) => ({
  // Frequency band levels (0–1 normalized)
  bass: 0,
  mid: 0,
  treble: 0,
  volume: 0,
  isAnalyserActive: false,

  setBands: (bass, mid, treble, volume) =>
    set({ bass, mid, treble, volume }),

  setAnalyserActive: (active) =>
    set({ isAnalyserActive: active }),
}))

// ── Singleton AudioContext + AnalyserNode ────────────────────────
let audioContext = null
let analyserNode = null
let sourceNode = null
let connectedElement = null
let rafId = null

let isSimulating = false

// ── Raw Data Export for Canvas Visualizers ───────────────
export const rawFrequencyData = new Uint8Array(128)
export function getRawFrequencyData() {
  return rawFrequencyData
}

/**
 * Connect an <audio> element to the Web Audio API analyser.
 * Call this once when the audio element is ready.
 * Handles cross-origin by setting crossOrigin on the element if possible,
 * or simulating if not possible.
 */
export function connectAudioAnalyser(audioElement) {
  if (!audioElement || connectedElement === audioElement) return

  // Clean up previous connection
  disconnectAudioAnalyser()

  connectedElement = audioElement
  
  const src = audioElement.src || ''
  // Check if it's external cross-origin
  const isExternal = src.startsWith('http') && !src.includes(window.location.hostname)

  if (isExternal) {
    // Cannot safely use Web Audio API without muting if no CORS headers exist.
    // Instead of tainting the context, we simulate the visualizer data.
    isSimulating = true
    useAudioReactiveStore.getState().setAnalyserActive(true)
    startAnalysisLoop()
    return
  }

  try {
    isSimulating = false
    // Create AudioContext on first call (requires user interaction)
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }

    // Resume if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    // Create analyser
    analyserNode = audioContext.createAnalyser()
    analyserNode.fftSize = 256 // 128 frequency bins
    analyserNode.smoothingTimeConstant = 0.8

    // Create source from audio element
    sourceNode = audioContext.createMediaElementSource(audioElement)
    sourceNode.connect(analyserNode)
    analyserNode.connect(audioContext.destination)

    useAudioReactiveStore.getState().setAnalyserActive(true)

    // Start the analysis loop
    startAnalysisLoop()
  } catch (err) {
    console.warn('Audio analyser setup failed, switching to simulation:', err.message)
    isSimulating = true
    startAnalysisLoop()
  }
}

/**
 * Disconnect and clean up the analyser.
 */
export function disconnectAudioAnalyser() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  if (sourceNode) {
    try { sourceNode.disconnect() } catch (e) { /* ignore */ }
    sourceNode = null
  }

  if (analyserNode) {
    try { analyserNode.disconnect() } catch (e) { /* ignore */ }
    analyserNode = null
  }

  connectedElement = null
  isSimulating = false
  useAudioReactiveStore.getState().setAnalyserActive(false)
  useAudioReactiveStore.getState().setBands(0, 0, 0, 0)
}

/**
 * Main rAF loop that reads frequency data and updates the store.
 */
function startAnalysisLoop() {
  if (!connectedElement) return

  const bufferLength = 128 // 128 bins
  let simulatedTime = 0

  function tick() {
    if (!connectedElement || connectedElement.paused || connectedElement.ended) {
      // Just slowly decay the visualizer when paused/stopped
      const current = useAudioReactiveStore.getState()
      useAudioReactiveStore.getState().setBands(
        Math.max(0, current.bass - 0.05),
        Math.max(0, current.mid - 0.05),
        Math.max(0, current.treble - 0.05),
        Math.max(0, current.volume - 0.05)
      )
      rafId = requestAnimationFrame(tick)
      return
    }

    let bass = 0, mid = 0, treble = 0, volume = 0

    if (isSimulating || !analyserNode) {
      // Simulate data with some Perlin-like noise waves for realistic bounces
      simulatedTime += 0.1
      const baseVol = connectedElement.volume || 1
      
      bass = (Math.sin(simulatedTime * 2.1) * 0.3 + 0.4 + Math.random() * 0.3) * baseVol
      mid = (Math.cos(simulatedTime * 1.5) * 0.2 + 0.3 + Math.random() * 0.2) * baseVol
      treble = (Math.sin(simulatedTime * 3.3) * 0.1 + 0.2 + Math.random() * 0.2) * baseVol
      volume = (bass * 0.5 + mid * 0.3 + treble * 0.2)
      
      // Clamp values
      bass = Math.max(0, Math.min(1, bass))
      mid = Math.max(0, Math.min(1, mid))
      treble = Math.max(0, Math.min(1, treble))
      volume = Math.max(0, Math.min(1, volume))

      // Write simulated noisy waves into rawFrequencyData so simulated visualizers bounce
      for (let i = 0; i < bufferLength; i++) {
        const factor = 1 - (i / bufferLength); // more bass energy at the beginning
        const noise = (Math.sin(simulatedTime * 5 + i * 0.2) + 1) / 2;
        rawFrequencyData[i] = Math.min(255, (volume * 180 + noise * factor * 100));
      }
    } else {
      analyserNode.getByteFrequencyData(rawFrequencyData)

      let bassSum = 0, midSum = 0, trebleSum = 0, totalSum = 0
      for (let i = 0; i < bufferLength; i++) {
        const val = rawFrequencyData[i]
        totalSum += val
        if (i <= 8) bassSum += val
        else if (i <= 40) midSum += val
        else trebleSum += val
      }

      bass = Math.min(bassSum / (9 * 255), 1)
      mid = Math.min(midSum / (32 * 255), 1)
      treble = Math.min(trebleSum / (87 * 255), 1)
      volume = Math.min(totalSum / (bufferLength * 255), 1)
    }

    useAudioReactiveStore.getState().setBands(bass, mid, treble, volume)
    rafId = requestAnimationFrame(tick)
  }

  tick()
}
