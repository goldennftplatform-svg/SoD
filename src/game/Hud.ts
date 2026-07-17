import { palette } from './brand'
import { tileColor } from './Map'
import type { Player } from './Player'
import type { MapDef } from './Map'

const FONT = '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif'
const DISPLAY = '"Syne", -apple-system, BlinkMacSystemFont, sans-serif'

export class Hud {
  anim = 0

  tick() {
    this.anim++
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
  }

  private glass(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r = 16,
    fill = 'rgba(255,255,255,0.72)',
  ) {
    ctx.save()
    this.roundRect(ctx, x, y, w, h, r)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 1
    ctx.stroke()
    // soft inner top highlight
    ctx.beginPath()
    this.roundRect(ctx, x + 1, y + 1, w - 2, h * 0.35, r)
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fill()
    ctx.restore()
  }

  draw(
    ctx: CanvasRenderingContext2D,
    player: Player,
    _time: number,
    map?: MapDef,
    deliveriesLeft = 0,
    combo = 0,
    nearest?: { x: number; y: number } | null,
  ) {
    // frosted top bar
    this.glass(ctx, 12, 12, 936, 52, 18, 'rgba(20,28,22,0.72)')

    ctx.textAlign = 'left'
    ctx.fillStyle = '#fff'
    ctx.font = `600 11px ${FONT}`
    ctx.fillText('SCORE', 28, 32)
    ctx.font = `700 22px ${DISPLAY}`
    ctx.fillStyle = '#7DDA82'
    ctx.fillText(String(player.score).padStart(6, '0'), 28, 52)

    // HP pills
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `600 11px ${FONT}`
    ctx.fillText('HEALTH', 180, 32)
    for (let i = 0; i < player.maxHealth; i++) {
      this.drawHeart(ctx, 176 + i * 26, 36, i < player.health ? '#FF453A' : 'rgba(255,255,255,0.2)')
    }

    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.fillText('BAGS', 290, 32)
    ctx.fillStyle = '#fff'
    ctx.font = `700 18px ${DISPLAY}`
    ctx.fillText(`${player.bags}`, 290, 52)

    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `600 11px ${FONT}`
    ctx.fillText('TOKENS', 360, 32)
    ctx.fillStyle = '#FFD60A'
    ctx.font = `700 18px ${DISPLAY}`
    ctx.fillText(String(player.tokens), 360, 52)

    // energy bar — iOS style
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `600 11px ${FONT}`
    ctx.fillText('ENERGY', 460, 32)
    this.roundRect(ctx, 460, 38, 200, 12, 6)
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fill()
    const ew = Math.max(0, (player.energy / player.maxEnergy) * 200)
    this.roundRect(ctx, 460, 38, ew, 12, 6)
    ctx.fillStyle = '#30D158'
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = `600 11px ${FONT}`
    ctx.fillText('LIVES', 700, 32)
    ctx.fillStyle = '#fff'
    ctx.font = `700 18px ${DISPLAY}`
    ctx.fillText(String(player.lives), 700, 52)

    if (combo > 1) {
      ctx.fillStyle = '#FF9F0A'
      ctx.font = `800 20px ${DISPLAY}`
      ctx.textAlign = 'right'
      ctx.fillText(`${combo}x COMBO`, 930, 48)
      ctx.textAlign = 'left'
    }

    if (map) {
      this.glass(ctx, 12, 74, 260, 44, 14, 'rgba(20,28,22,0.65)')
      ctx.fillStyle = '#fff'
      ctx.font = `700 14px ${DISPLAY}`
      ctx.fillText(map.name, 28, 94)
      const done = map.deliveries.length - deliveriesLeft
      ctx.fillStyle = '#FFD60A'
      ctx.font = `600 12px ${FONT}`
      ctx.fillText(`${done} / ${map.deliveries.length} deliveries`, 28, 110)
    }

    // waypoint chip
    if (nearest) {
      this.glass(ctx, 720, 74, 228, 36, 14, 'rgba(20,28,22,0.65)')
      ctx.fillStyle = '#7DDA82'
      ctx.font = `600 12px ${FONT}`
      ctx.fillText('Next drop → ride close, press D', 736, 96)
    }

    // bottom hint — quiet
    this.glass(ctx, 12, 496, 520, 32, 12, 'rgba(20,28,22,0.55)')
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = `500 12px ${FONT}`
    ctx.fillText('WASD  move   Space  ollie   F  shoot   D  deliver', 28, 516)
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

  drawTitle(ctx: CanvasRenderingContext2D) {
    // soft vertical gradient — no checker chaos
    const g = ctx.createLinearGradient(0, 0, 0, 540)
    g.addColorStop(0, '#F7F1E3')
    g.addColorStop(0.55, '#E8F0E4')
    g.addColorStop(1, '#2E6E3E')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 960, 540)

    // ambient orbs
    ctx.fillStyle = 'rgba(107,175,110,0.25)'
    ctx.beginPath()
    ctx.arc(160, 120, 120, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,242,179,0.35)'
    ctx.beginPath()
    ctx.arc(820, 400, 160, 0, Math.PI * 2)
    ctx.fill()

    // center glass card
    this.glass(ctx, 180, 80, 600, 380, 28, 'rgba(255,255,255,0.55)')

    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.font = `600 13px ${FONT}`
    ctx.fillText('SKATE · DELIVER · DESTROY', 480, 130)

    ctx.fillStyle = '#111'
    ctx.font = `800 64px ${DISPLAY}`
    ctx.fillText('SKULL', 480, 210)
    ctx.fillStyle = palette.darkGreen
    ctx.fillText('OR DIE', 480, 280)

    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.font = `500 16px ${FONT}`
    ctx.fillText('Paperboy meets Skate or Die.', 480, 320)
    ctx.fillText('Deliver the Daily. Own the streets.', 480, 344)

    // primary CTA — Apple style capsule
    const pulse = 0.5 + Math.sin(this.anim * 0.08) * 0.08
    this.roundRect(ctx, 330, 380, 300, 52, 26)
    ctx.fillStyle = `rgba(46,110,62,${0.92 + pulse * 0.05})`
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `700 17px ${FONT}`
    ctx.fillText('Press Space to Play', 480, 412)

    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.font = `500 12px ${FONT}`
    ctx.fillText('or tap anywhere', 480, 440)

    ctx.textAlign = 'left'
  }

  drawMapSelect(ctx: CanvasRenderingContext2D, maps: MapDef[], selected: number) {
    const g = ctx.createLinearGradient(0, 0, 0, 540)
    g.addColorStop(0, '#F4F6F5')
    g.addColorStop(1, '#DDE8DF')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 960, 540)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#111'
    ctx.font = `800 36px ${DISPLAY}`
    ctx.fillText('Choose a Route', 480, 64)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.font = `500 14px ${FONT}`
    ctx.fillText('Arrow keys to browse · Space to ride', 480, 90)

    const cardW = 260
    const cardH = 320
    const gap = 28
    const total = maps.length * cardW + (maps.length - 1) * gap
    const startX = (960 - total) / 2

    maps.forEach((m, i) => {
      const x = startX + i * (cardW + gap)
      const y = 120
      const isSelected = i === selected
      const lift = isSelected ? -6 : 0

      // shadow
      ctx.save()
      ctx.shadowColor = isSelected ? 'rgba(46,110,62,0.35)' : 'rgba(0,0,0,0.12)'
      ctx.shadowBlur = isSelected ? 28 : 16
      ctx.shadowOffsetY = 10
      this.roundRect(ctx, x, y + lift, cardW, cardH, 22)
      ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.85)'
      ctx.fill()
      ctx.restore()

      if (isSelected) {
        this.roundRect(ctx, x, y + lift, cardW, cardH, 22)
        ctx.strokeStyle = palette.darkGreen
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // TOP-DOWN mini map (not isometric — no slant)
      const mapPad = 18
      const mapBox = cardW - mapPad * 2
      const mapY = y + lift + 20
      this.roundRect(ctx, x + mapPad, mapY, mapBox, 150, 14)
      ctx.fillStyle = '#1a2e22'
      ctx.fill()

      const cell = mapBox / Math.max(m.width, m.height)
      const ox = x + mapPad + (mapBox - m.width * cell) / 2
      const oy = mapY + (150 - m.height * cell) / 2
      for (let gy = 0; gy < m.height; gy += 2) {
        for (let gx = 0; gx < m.width; gx += 2) {
          ctx.fillStyle = tileColor(m.tiles[gy][gx])
          ctx.fillRect(ox + gx * cell, oy + gy * cell, cell * 2 + 0.5, cell * 2 + 0.5)
        }
      }
      // start / goal
      ctx.fillStyle = '#FF453A'
      ctx.beginPath()
      ctx.arc(ox + m.start.x * cell, oy + m.start.y * cell, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#30D158'
      ctx.beginPath()
      ctx.arc(ox + m.goal.x * cell, oy + m.goal.y * cell, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#111'
      ctx.font = `800 22px ${DISPLAY}`
      ctx.fillText(m.name, x + cardW / 2, y + lift + 200)

      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.font = `500 12px ${FONT}`
      ctx.fillText(m.blurb, x + cardW / 2, y + lift + 224)

      ctx.fillStyle = 'rgba(0,0,0,0.7)'
      ctx.font = `600 13px ${FONT}`
      ctx.fillText(`${m.deliveries.length} drops · ${m.halfpipes.length} pipes`, x + cardW / 2, y + lift + 252)

      if (isSelected) {
        this.roundRect(ctx, x + 40, y + lift + 270, cardW - 80, 36, 18)
        ctx.fillStyle = palette.darkGreen
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = `700 14px ${FONT}`
        ctx.fillText('Ride', x + cardW / 2, y + lift + 293)
      }
    })

    ctx.textAlign = 'left'
  }

  drawGameOver(ctx: CanvasRenderingContext2D, player: Player, won: boolean) {
    ctx.fillStyle = 'rgba(10,14,12,0.55)'
    ctx.fillRect(0, 0, 960, 540)

    this.glass(ctx, 230, 140, 500, 260, 28, 'rgba(255,255,255,0.82)')

    ctx.textAlign = 'center'
    ctx.fillStyle = won ? palette.darkGreen : '#FF453A'
    ctx.font = `800 40px ${DISPLAY}`
    ctx.fillText(won ? 'Route Clear' : 'Wiped Out', 480, 210)

    ctx.fillStyle = '#111'
    ctx.font = `700 28px ${DISPLAY}`
    ctx.fillText(String(player.score).padStart(6, '0'), 480, 260)

    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.font = `500 14px ${FONT}`
    ctx.fillText(won ? 'All bags dropped. Streets owned.' : 'Energy gone. Try another route.', 480, 290)

    this.roundRect(ctx, 355, 320, 250, 44, 22)
    ctx.fillStyle = palette.darkGreen
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `700 15px ${FONT}`
    ctx.fillText('Press Space', 480, 347)

    ctx.textAlign = 'left'
  }

  /** Draw a floating arrow toward nearest delivery */
  drawWaypoint(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ) {
    const dx = toX - fromX
    const dy = toY - fromY
    const dist = Math.hypot(dx, dy)
    if (dist < 40) return
    const ang = Math.atan2(dy, dx)
    const ax = fromX + Math.cos(ang) * 36
    const ay = fromY + Math.sin(ang) * 36

    ctx.save()
    ctx.translate(ax, ay)
    ctx.rotate(ang)
    ctx.fillStyle = 'rgba(255,214,10,0.9)'
    ctx.beginPath()
    ctx.moveTo(14, 0)
    ctx.lineTo(-8, 8)
    ctx.lineTo(-4, 0)
    ctx.lineTo(-8, -8)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}
