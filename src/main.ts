import { Game } from './game/Game'

const canvas = document.getElementById('game') as HTMLCanvasElement
const game = new Game(canvas)

// keep canvas crisp on high-DPI screens without resizing the coordinate space
const dpr = Math.min(window.devicePixelRatio || 1, 2)
if (dpr > 1) {
  canvas.style.width = '960px'
  canvas.style.height = '540px'
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy())
}
