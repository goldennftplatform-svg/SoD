import { palette } from './brand'
import { drawIsoTile, drawIsoCube, isoToScreen } from './iso'
import { tileColor, type MapDef, type TileType } from './Map'

export interface WorldEntity {
  type: 'delivery' | 'token' | 'heart' | 'hazard' | 'ramp' | 'enemy' | 'boss'
  gx: number
  gy: number
  alive: boolean
  delivered?: boolean
  health?: number
  animFrame: number
}

export interface Projectile {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  alive: boolean
  isDelivery?: boolean
  life: number
}

export class World {
  map: MapDef
  width: number
  height: number
  entities: WorldEntity[] = []
  projectiles: Projectile[] = []
  time = 0

  constructor(map: MapDef, canvasWidth: number, canvasHeight: number) {
    this.map = map
    this.width = canvasWidth
    this.height = canvasHeight
    this.reset()
  }

  reset() {
    this.time = 0
    this.entities = []
    this.projectiles = []

    this.map.deliveries.forEach((d) =>
      this.entities.push({ type: 'delivery', gx: d.x, gy: d.y, alive: true, delivered: false, animFrame: 0 }),
    )
    this.map.tokens.forEach((t) => this.entities.push({ type: 'token', gx: t.x, gy: t.y, alive: true, animFrame: 0 }))
    this.map.hearts.forEach((h) => this.entities.push({ type: 'heart', gx: h.x, gy: h.y, alive: true, animFrame: 0 }))
    this.map.hazards.forEach((h) => this.entities.push({ type: 'hazard', gx: h.x, gy: h.y, alive: true, animFrame: 0 }))
    this.map.ramps.forEach((r) => this.entities.push({ type: 'ramp', gx: r.x, gy: r.y, alive: true, animFrame: 0 }))
  }

  update() {
    this.time++
    this.entities.forEach((e) => {
      e.animFrame++
    })

    this.projectiles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.z += p.vz
      p.vz -= 0.25
      p.life--
      if (p.z < 0) p.vz *= -0.6
    })
    this.projectiles = this.projectiles.filter((p) => p.life > 0 && p.alive)
  }

  addProjectile(x: number, y: number, z: number, vx: number, vy: number, vz: number, isDelivery = false) {
    this.projectiles.push({ x, y, z, vx, vy, vz, alive: true, isDelivery, life: 80 })
  }

  tileAt(gx: number, gy: number): TileType | null {
    if (gx < 0 || gy < 0 || gy >= this.map.tiles.length || gx >= this.map.tiles[0].length) return null
    return this.map.tiles[gy][gx]
  }

  draw(ctx: CanvasRenderingContext2D, camX: number, camY: number) {
    // background
    ctx.fillStyle = '#2c4a36'
    ctx.fillRect(0, 0, this.width, this.height)

    // draw tiles in back-to-front order
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const t = this.map.tiles[y][x]
        if (t === 'grass' || t === 'dirt') continue
        drawIsoTile(ctx, x, y, camX, camY, tileColor(t), t === 'ramp' ? 8 : t === 'building' ? 24 : 0)

        // entities on this tile
        this.entities
          .filter((e) => e.alive && Math.round(e.gx) === x && Math.round(e.gy) === y)
          .forEach((e) => this.drawEntity(ctx, e, camX, camY))
      }
    }

    // draw ground tiles last (grass/dirt) so they sit under roads etc? No, in iso we should draw all from back to front.
    // Actually the above loop already draws everything. Grass/dirt were skipped; draw them too.
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        const t = this.map.tiles[y][x]
        if (t !== 'grass' && t !== 'dirt') continue
        drawIsoTile(ctx, x, y, camX, camY, tileColor(t), 0)
      }
    }

    // projectiles
    this.projectiles.forEach((p) => {
      const { x, y } = isoToScreen(p.x, p.y, camX, camY)
      if (p.isDelivery) {
        ctx.fillStyle = palette.brown
        ctx.fillRect(x - 6, y - p.z - 8, 12, 10)
        ctx.fillStyle = palette.cream
        ctx.fillRect(x - 4, y - p.z - 6, 8, 6)
      } else {
        ctx.fillStyle = palette.orange
        ctx.fillRect(x, y - p.z, 18, 6)
        ctx.fillStyle = palette.lightGreen
        ctx.fillRect(x + 14, y - p.z - 3, 8, 12)
      }
    })
  }

  drawEntity(ctx: CanvasRenderingContext2D, e: WorldEntity, camX: number, camY: number) {
    const { x, y } = isoToScreen(e.gx, e.gy, camX, camY)
    const bob = Math.sin(e.animFrame * 0.1) * 2
    switch (e.type) {
      case 'delivery':
        this.drawMailbox(ctx, x, y, e.delivered)
        break
      case 'token':
        this.drawToken(ctx, x, y - 12 + bob)
        break
      case 'heart':
        this.drawHeart(ctx, x, y - 16 + bob)
        break
      case 'hazard':
        this.drawHazard(ctx, x, y)
        break
      case 'ramp':
        // drawn as tile height in drawTile
        break
      case 'enemy':
        this.drawEnemy(ctx, x, y - 10 + bob)
        break
      case 'boss':
        this.drawBoss(ctx, x, y - 40 + bob)
        break
    }
  }

  drawMailbox(ctx: CanvasRenderingContext2D, x: number, y: number, delivered: boolean | undefined) {
    drawIsoCube(ctx, x, y, 0, 0, 18, 20, 22, palette.brown)
    // flag
    if (!delivered) {
      ctx.strokeStyle = palette.red
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, y - 22)
      ctx.lineTo(x, y - 40)
      ctx.stroke()
      ctx.fillStyle = palette.red
      ctx.fillRect(x, y - 40, 12, 8)
    }
    // label
    ctx.fillStyle = palette.cream
    ctx.fillRect(x - 6, y - 18, 12, 8)
    ctx.fillStyle = palette.black
    ctx.font = '5px "Press Start 2P"'
    ctx.fillText('DAILY', x - 5, y - 12)
  }

  drawToken(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.arc(x, y, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = palette.black
    ctx.stroke()
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(x, y - 1, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x - 3, y + 3, 6, 2)
  }

  drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.moveTo(x, y + 7)
    ctx.bezierCurveTo(x - 10, y - 4, x - 10, y - 10, x - 4, y - 10)
    ctx.bezierCurveTo(x - 1, y - 10, x, y - 7, x, y - 5)
    ctx.bezierCurveTo(x, y - 7, x + 1, y - 10, x + 4, y - 10)
    ctx.bezierCurveTo(x + 10, y - 10, x + 10, y - 4, x, y + 7)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = palette.black
    ctx.stroke()
    ctx.fillStyle = palette.black
    ctx.font = '6px "Press Start 2P"'
    ctx.fillText('1UP', x - 8, y - 1)
  }

  drawHazard(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // barrel / caution sign
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.moveTo(x, y - 24)
    ctx.lineTo(x + 10, y - 10)
    ctx.lineTo(x - 10, y - 10)
    ctx.closePath()
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = palette.black
    ctx.stroke()
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(x, y - 16, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(x - 3, y - 12, 6, 2)
  }

  drawEnemy(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // punk ghoul
    ctx.fillStyle = palette.lightGreen
    ctx.fillRect(x - 12, y - 24, 24, 28)
    // mohawk
    ctx.fillStyle = palette.red
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x - 2 + i * 2 - 3, y - 32 - i * 3, 4, 6)
    }
    // eyes
    ctx.fillStyle = palette.black
    ctx.fillRect(x - 7, y - 18, 5, 5)
    ctx.fillRect(x + 2, y - 18, 5, 5)
    // mouth
    ctx.fillStyle = palette.black
    ctx.fillRect(x - 6, y - 6, 12, 4)
  }

  drawBoss(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // big green monster
    ctx.fillStyle = palette.lightGreen
    ctx.fillRect(x - 30, y - 60, 60, 60)
    // mohawk
    ctx.fillStyle = palette.red
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(x - 4 + i * 3 - 8, y - 70 - i * 4, 8, 12)
    }
    // eyes
    ctx.fillStyle = palette.black
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(x - 15 + i * 15, y - 42, 6, 0, Math.PI * 2)
      ctx.fill()
    }
    // mouth
    ctx.fillStyle = palette.black
    ctx.fillRect(x - 18, y - 24, 36, 8)
    // health bar
    ctx.fillStyle = palette.black
    ctx.fillRect(x - 30, y - 80, 60, 8)
    ctx.fillStyle = palette.red
    ctx.fillRect(x - 28, y - 78, 56, 4)
  }
}
