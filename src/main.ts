import { Game } from './game/Game'

const canvas = document.getElementById('game') as HTMLCanvasElement
const game = new Game(canvas)

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy())
}
