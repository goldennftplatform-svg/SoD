import { palette } from './brand'
import type { Player } from './Player'

export class Hud {
  draw(ctx: CanvasRenderingContext2D, player: Player, time: number) {
    // top bar backing
    ctx.fillStyle = palette.black
    ctx.fillRect(0, 0, 960, 54)
    ctx.fillStyle = palette.cream
    ctx.fillRect(0, 54, 960, 4)

    // Score
    ctx.fillStyle = palette.cream
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText('SCORE', 20, 20)
    ctx.fillStyle = palette.lightGreen
    ctx.font = '20px "Press Start 2P"'
    ctx.fillText(String(player.score).padStart(6, '0'), 20, 44)

    // Health hearts
    ctx.fillStyle = palette.cream
    ctx.font = '12px "Press Start 2P"'
    ctx.fillText('HEALTH', 280, 18)
    for (let i = 0; i < player.maxHealth; i++) {
      this.drawHeart(ctx, 280 + i * 32, 28, i < player.health ? palette.red : palette.grey)
    }

    // Tokens
    ctx.fillStyle = palette.cream
    ctx.font = '12px "Press Start 2P"'
    ctx.fillText('TOKENS', 430, 18)
    this.drawToken(ctx, 440, 32)
    ctx.fillStyle = palette.gold
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText('x ' + String(player.tokens).padStart(2, '0'), 468, 40)

    // Time / Energy
    ctx.fillStyle = palette.cream
    ctx.font = '12px "Press Start 2P"'
    ctx.fillText('TIME', 610, 18)
    // lightning bolt
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.moveTo(615, 28)
    ctx.lineTo(625, 28)
    ctx.lineTo(618, 36)
    ctx.lineTo(628, 36)
    ctx.lineTo(616, 48)
    ctx.lineTo(620, 40)
    ctx.lineTo(610, 40)
    ctx.closePath()
    ctx.fill()
    // segmented energy bar
    const segments = 10
    const segW = 14
    const segGap = 3
    const full = Math.ceil((player.energy / player.maxEnergy) * segments)
    for (let i = 0; i < segments; i++) {
      ctx.fillStyle = i < full ? palette.lightGreen : palette.grey
      ctx.fillRect(640 + i * (segW + segGap), 30, segW, 14)
    }
    ctx.fillStyle = palette.cream
    ctx.font = '14px "Press Start 2P"'
    ctx.fillText(String(Math.max(0, Math.floor(time / 60))).padStart(2, '0'), 810, 40)

    // Lives
    ctx.fillStyle = palette.cream
    ctx.font = '12px "Press Start 2P"'
    ctx.fillText('LIVES', 860, 18)
    this.drawSkull(ctx, 870, 30)
    ctx.fillStyle = palette.cream
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText('x ' + String(player.lives).padStart(2, '0'), 894, 40)

    // controls hint
    ctx.fillStyle = palette.black
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText('[SPACE] JUMP  [F] RAY GUN  [D] DELIVER', 20, 520)
  }

  drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(x + 8, y + 14)
    ctx.bezierCurveTo(x - 2, y + 4, x - 2, y - 2, x + 4, y - 2)
    ctx.bezierCurveTo(x + 7, y - 2, x + 8, y + 1, x + 8, y + 3)
    ctx.bezierCurveTo(x + 8, y + 1, x + 9, y - 2, x + 12, y - 2)
    ctx.bezierCurveTo(x + 18, y - 2, x + 18, y + 4, x + 8, y + 14)
    ctx.fill()
  }

  drawToken(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.arc(x + 8, y + 8, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(x + 8, y + 7, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  drawSkull(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = palette.cream
    ctx.beginPath()
    ctx.arc(x + 8, y + 8, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(x + 5, y + 7, 2, 0, Math.PI * 2)
    ctx.arc(x + 11, y + 7, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x + 4, y + 12, 8, 3)
  }

  drawTitle(ctx: CanvasRenderingContext2D) {
    // big title card
    ctx.fillStyle = palette.cream
    ctx.fillRect(0, 0, 960, 540)

    // checkered border top/bottom
    ctx.fillStyle = palette.black
    for (let i = 0; i < 960; i += 32) {
      ctx.fillRect(i, 0, 16, 16)
      ctx.fillRect(i + 16, 16, 16, 16)
      ctx.fillRect(i, 524, 16, 16)
      ctx.fillRect(i + 16, 508, 16, 16)
    }

    ctx.fillStyle = palette.black
    ctx.font = '64px "Rubik Mono One"'
    ctx.textAlign = 'center'
    ctx.fillText('SKULL', 480, 160)
    ctx.fillStyle = palette.darkGreen
    ctx.fillText('OR DIE', 480, 240)

    ctx.fillStyle = palette.black
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText('SKATE. DELIVER. DESTROY. REPEAT.', 480, 300)

    ctx.font = '14px "Press Start 2P"'
    ctx.fillText('PRESS SPACE TO ROLL', 480, 380)

    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.arc(480, 440, 46, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = palette.black
    ctx.stroke()
    ctx.fillStyle = palette.black
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText('8-BIT', 480, 432)
    ctx.fillText('PUNK', 480, 448)

    ctx.textAlign = 'left'
  }

  drawGameOver(ctx: CanvasRenderingContext2D, player: Player) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, 0, 960, 540)

    ctx.fillStyle = palette.red
    ctx.font = '48px "Rubik Mono One"'
    ctx.textAlign = 'center'
    ctx.fillText('WIPED OUT', 480, 220)

    ctx.fillStyle = palette.cream
    ctx.font = '20px "Press Start 2P"'
    ctx.fillText('SCORE ' + String(player.score).padStart(6, '0'), 480, 290)

    ctx.font = '14px "Press Start 2P"'
    ctx.fillText('PRESS SPACE TO RIDE AGAIN', 480, 360)

    ctx.textAlign = 'left'
  }
}
