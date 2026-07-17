import { palette } from './brand'
import { tileColor } from './Map'
import type { Player } from './Player'
import type { MapDef } from './Map'

export class Hud {
  draw(ctx: CanvasRenderingContext2D, player: Player, _time: number, map?: MapDef, deliveriesLeft = 0) {
    // top bar
    ctx.fillStyle = palette.black
    ctx.fillRect(0, 0, 960, 56)
    ctx.fillStyle = palette.cream
    ctx.fillRect(0, 56, 960, 4)

    // Score
    ctx.fillStyle = palette.cream
    ctx.font = '12px "Press Start 2P"'
    ctx.fillText('SCORE', 16, 18)
    ctx.fillStyle = palette.lightGreen
    ctx.font = '18px "Press Start 2P"'
    ctx.fillText(String(player.score).padStart(6, '0'), 16, 42)

    // Health
    ctx.fillStyle = palette.cream
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText('HP', 220, 16)
    for (let i = 0; i < player.maxHealth; i++) {
      this.drawHeart(ctx, 216 + i * 28, 24, i < player.health ? palette.red : '#444')
    }

    // Bags
    ctx.fillStyle = palette.cream
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText('BAGS', 330, 16)
    ctx.fillStyle = palette.brown
    ctx.fillRect(330, 24, 16, 20)
    ctx.fillStyle = palette.cream
    ctx.fillRect(332, 26, 12, 12)
    ctx.fillStyle = palette.cream
    ctx.font = '14px "Press Start 2P"'
    ctx.fillText(`${player.bags}/${player.maxBags}`, 352, 40)

    // Tokens
    ctx.fillStyle = palette.cream
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText('TOKENS', 450, 16)
    this.drawToken(ctx, 460, 32)
    ctx.fillStyle = palette.gold
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText('x ' + String(player.tokens).padStart(2, '0'), 488, 40)

    // Time/Energy
    ctx.fillStyle = palette.cream
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText('ENERGY', 610, 16)
    // lightning
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.moveTo(616, 26)
    ctx.lineTo(624, 26)
    ctx.lineTo(618, 34)
    ctx.lineTo(626, 34)
    ctx.lineTo(616, 46)
    ctx.lineTo(620, 38)
    ctx.lineTo(612, 38)
    ctx.closePath()
    ctx.fill()
    const segments = 12
    const segW = 14
    const segGap = 2
    const full = Math.ceil((player.energy / player.maxEnergy) * segments)
    for (let i = 0; i < segments; i++) {
      ctx.fillStyle = i < full ? palette.lightGreen : '#444'
      ctx.fillRect(640 + i * (segW + segGap), 28, segW, 14)
    }

    // Lives
    ctx.fillStyle = palette.cream
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText('LIVES', 850, 16)
    this.drawSkull(ctx, 860, 28)
    ctx.fillStyle = palette.cream
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText('x ' + String(player.lives).padStart(2, '0'), 884, 40)

    // Map info / deliveries
    if (map) {
      ctx.fillStyle = palette.black
      ctx.fillRect(16, 64, 220, 32)
      ctx.fillStyle = palette.cream
      ctx.font = '10px "Press Start 2P"'
      ctx.fillText(map.name.toUpperCase(), 26, 78)
      ctx.fillStyle = palette.gold
      ctx.fillText(`DELIVERIES ${map.deliveries.length - deliveriesLeft}/${map.deliveries.length}`, 26, 90)
    }

    // controls
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(16, 500, 420, 26)
    ctx.fillStyle = palette.cream
    ctx.font = '9px "Press Start 2P"'
    ctx.fillText('WASD/ARROWS ride  SPACE ollie  F ray gun  D throw bag', 26, 517)
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
    ctx.fillStyle = palette.cream
    ctx.fillRect(0, 0, 960, 540)

    // checkered border
    ctx.fillStyle = palette.black
    for (let i = 0; i < 960; i += 32) {
      ctx.fillRect(i, 0, 16, 16)
      ctx.fillRect(i + 16, 16, 16, 16)
      ctx.fillRect(i, 524, 16, 16)
      ctx.fillRect(i + 16, 508, 16, 16)
    }

    ctx.fillStyle = palette.black
    ctx.font = '72px "Rubik Mono One"'
    ctx.textAlign = 'center'
    ctx.fillText('SKULL', 480, 150)
    ctx.fillStyle = palette.darkGreen
    ctx.fillText('OR DIE', 480, 230)

    ctx.fillStyle = palette.black
    ctx.font = '16px "Press Start 2P"'
    ctx.fillText('PAPERBOY MEETS SKATE OR DIE', 480, 290)
    ctx.font = '14px "Press Start 2P"'
    ctx.fillText('DELIVER CHAOS. COLLECT TOKENS. OWN THE STREETS.', 480, 320)

    ctx.font = '14px "Press Start 2P"'
    ctx.fillText('PRESS SPACE TO ROLL', 480, 390)

    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.arc(480, 450, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 5
    ctx.strokeStyle = palette.black
    ctx.stroke()
    ctx.fillStyle = palette.black
    ctx.font = '12px "Press Start 2P"'
    ctx.fillText('8-BIT', 480, 442)
    ctx.fillText('PUNK', 480, 460)

    ctx.textAlign = 'left'
  }

  drawMapSelect(ctx: CanvasRenderingContext2D, maps: MapDef[], selected: number) {
    ctx.fillStyle = palette.cream
    ctx.fillRect(0, 0, 960, 540)

    ctx.fillStyle = palette.black
    ctx.font = '36px "Rubik Mono One"'
    ctx.textAlign = 'center'
    ctx.fillText('PICK A ROUTE', 480, 80)

    maps.forEach((m, i) => {
      const x = 180 + i * 260
      const y = 180
      const w = 220
      const h = 240
      const isSelected = i === selected

      ctx.fillStyle = isSelected ? palette.lightGreen : palette.white
      ctx.fillRect(x, y, w, h)
      ctx.lineWidth = isSelected ? 6 : 3
      ctx.strokeStyle = palette.black
      ctx.strokeRect(x, y, w, h)

      // mini map preview
      const px = x + w / 2
      const py = y + 110
      const scale = 8
      for (let gy = 0; gy < m.height; gy++) {
        for (let gx = 0; gx < m.width; gx++) {
          const t = m.tiles[gy][gx]
          const sx = px + (gx - gy) * (scale / 2)
          const sy = py + (gx + gy) * (scale / 4)
          ctx.fillStyle = tileColor(t)
          ctx.fillRect(sx - scale / 4, sy - scale / 4, scale / 2, scale / 2)
        }
      }
      // route pins
      ctx.fillStyle = palette.red
      ctx.beginPath()
      ctx.arc(px + (m.start.x - m.start.y) * (scale / 2), py + (m.start.x + m.start.y) * (scale / 4), 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = palette.darkGreen
      ctx.beginPath()
      ctx.arc(px + (m.goal.x - m.goal.y) * (scale / 2), py + (m.goal.x + m.goal.y) * (scale / 4), 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = palette.black
      ctx.font = '16px "Rubik Mono One"'
      ctx.fillText(m.name.toUpperCase(), x + w / 2, y + 200)
      ctx.font = '10px "Press Start 2P"'
      ctx.fillText(`${m.deliveries.length} deliveries`, x + w / 2, y + 220)
      ctx.fillText(`${m.tokens.length} tokens`, x + w / 2, y + 234)
    })

    ctx.font = '12px "Press Start 2P"'
    ctx.fillStyle = palette.black
    ctx.fillText('LEFT / RIGHT to select  SPACE to ride', 480, 480)
    ctx.textAlign = 'left'
  }

  drawGameOver(ctx: CanvasRenderingContext2D, player: Player, won: boolean) {
    ctx.fillStyle = 'rgba(0,0,0,0.72)'
    ctx.fillRect(0, 0, 960, 540)

    ctx.fillStyle = won ? palette.lightGreen : palette.red
    ctx.font = '48px "Rubik Mono One"'
    ctx.textAlign = 'center'
    ctx.fillText(won ? 'ROUTE COMPLETE' : 'WIPED OUT', 480, 220)

    ctx.fillStyle = palette.cream
    ctx.font = '20px "Press Start 2P"'
    ctx.fillText('SCORE ' + String(player.score).padStart(6, '0'), 480, 290)

    ctx.font = '14px "Press Start 2P"'
    ctx.fillText('PRESS SPACE TO RIDE AGAIN', 480, 360)
    ctx.textAlign = 'left'
  }
}
