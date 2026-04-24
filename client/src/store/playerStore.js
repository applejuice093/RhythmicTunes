import { create } from 'zustand'
import { getSongId } from '../utils/songUtils'

const findCurrentIndex = (queue, currentSong) =>
  queue.findIndex((song) => getSongId(song) === getSongId(currentSong))

export const usePlayerStore = create((set, get) => ({
  currentSong: null,
  queue: [],
  isPlaying: false,
  playSong: (song) => {
    if (!song) {
      return
    }

    const { queue } = get()
    const songExists = queue.some((queueSong) => getSongId(queueSong) === getSongId(song))

    set({
      currentSong: song,
      queue: songExists ? queue : [...queue, song],
      isPlaying: true,
    })
  },
  pauseSong: () => {
    set({ isPlaying: false })
  },
  nextSong: () => {
    const { currentSong, queue } = get()

    if (!queue.length) {
      return
    }

    const currentIndex = findCurrentIndex(queue, currentSong)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % queue.length

    set({
      currentSong: queue[nextIndex],
      isPlaying: true,
    })
  },
  prevSong: () => {
    const { currentSong, queue } = get()

    if (!queue.length) {
      return
    }

    const currentIndex = findCurrentIndex(queue, currentSong)
    const prevIndex =
      currentIndex <= 0 ? queue.length - 1 : (currentIndex - 1) % queue.length

    set({
      currentSong: queue[prevIndex],
      isPlaying: true,
    })
  },
  addToQueue: (song) => {
    if (!song) {
      return
    }

    const { queue } = get()
    const songExists = queue.some((queueSong) => getSongId(queueSong) === getSongId(song))

    if (!songExists) {
      set({ queue: [...queue, song] })
    }
  },
}))
