import { palette } from './brand'

export type EntityType = 'hazard' | 'enemy' | 'token' | 'heart' | 'delivery' | 'boss'

export interface Entity {
  type: EntityType
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  alive: boolean
  delivered?: boolean
  health?: number
  animFrame: number
}

export interface Projectile {
  x: number
  y: number
  vx: number
  w: number
  h: number
  alive: boolean
  isDelivery?: boolean
}

export class World {
  width: number
  height: number
  groundY: number
  speed = 5
  distance = 0
  spawnTimer = 0
  deliveryTimer = 0
  bossTimer = 0
  entities: Entity[] = []
  projectiles: Projectile[] = []
  buildings: { x: number; w: number; h: number; color: string }[] = []
  checkers: { x: number }[] = []
  segment = 0

  constructor(width: number, height: number, groundY: number) {
    this.width = width
    this.height = height
    this.groundY = groundY
    this.reset()
  }

  reset() {
    this.speed = 5
    this.distance = 0
    this.spawnTimer = 0
    this.deliveryTimer = 120
    this.bossTimer = 0
    this.entities = []
    this.projectiles = []
    this.buildings = []
    this.checkers = []
    for (let i = 0; i < 8; i++) {
      this.pushBuilding(i * 260)
    }
    for (let i = 0; i < 40; i++) {
      this.checkers.push({ x: i * 48 })
    }
  }

  pushBuilding(x: number) {
    const w = 140 + Math.random() * 120
    const h = 120 + Math.random() * 180
    const colors = [palette.cream, palette.lightGreen, palette.grey, palette.brown]
    this.buildings.push({ x, w, h, color: colors[Math.floor(Math.random() * colors.length)] })
  }

  update() {
    this.distance += this.speed * 0.1
    this.speed = Math.min(14, 5 + this.distance * 0.003)

    // scroll buildings
    this.buildings.forEach((b) => (b.x -= this.speed * 0.25))
    this.buildings = this.buildings.filter((b) => b.x + b.w > -200)
    if (this.buildings[this.buildings.length - 1]?.x < this.width - 200) {
      this.pushBuilding(this.width + Math.random() * 200)
    }

    // scroll checkered street
    this.checkers.forEach((c) => (c.x -= this.speed))
    this.checkers = this.checkers.filter((c) => c.x > -80)
    if (this.checkers.length < 40) {
      this.checkers.push({ x: this.checkers[this.checkers.length - 1]?.x + 48 || 0 })
    }

    // spawn entities
    this.spawnTimer--
    if (this.spawnTimer <= 0) {
      this.spawnEntity()
      this.spawnTimer = 45 + Math.random() * 70 - Math.min(30, this.distance * 0.02)
    }

    this.deliveryTimer--
    if (this.deliveryTimer <= 0) {
      this.spawnDelivery()
      this.deliveryTimer = 240 + Math.random() * 180
    }

    this.bossTimer--
    if (this.bossTimer <= 0 && this.distance > 400) {
      this.spawnBoss()
      this.bossTimer = 900 + Math.random() * 600
    }

    // update entities
    this.entities.forEach((e) => {
      e.x -= this.speed
      e.animFrame++
      if (e.type === 'enemy' || e.type === 'boss') {
        e.y += Math.sin(e.animFrame * 0.08) * 0.8
      }
      if (e.type === 'token' || e.type === 'heart') {
        e.y += Math.sin(e.animFrame * 0.12) * 0.6
      }
    })
    this.entities = this.entities.filter((e) => e.x + e.w > -120 && e.alive)

    // update projectiles
    this.projectiles.forEach((p) => {
      p.x += p.vx
    })
    this.projectiles = this.projectiles.filter((p) => p.x > -40 && p.x < this.width + 40 && p.alive)
  }

  spawnEntity() {
    const roll = Math.random()
    const x = this.width + 40 + Math.random() * 100
    if (roll < 0.42) {
      this.entities.push({
        type: 'hazard',
        x,
        y: this.groundY + 30,
        w: 34,
        h: 34,
        vx: 0,
        vy: 0,
        alive: true,
        animFrame: 0,
      })
    } else if (roll < 0.65) {
      this.entities.push({
        type: 'enemy',
        x,
        y: this.groundY - 10,
        w: 40,
        h: 54,
        vx: 0,
        vy: 0,
        alive: true,
        animFrame: 0,
      })
    } else if (roll < 0.85) {
      this.entities.push({
        type: 'token',
        x,
        y: this.groundY - 60 - Math.random() * 80,
        w: 28,
        h: 28,
        vx: 0,
        vy: 0,
        alive: true,
        animFrame: 0,
      })
    } else {
      this.entities.push({
        type: 'heart',
        x,
        y: this.groundY - 50 - Math.random() * 60,
        w: 30,
        h: 26,
        vx: 0,
        vy: 0,
        alive: true,
        animFrame: 0,
      })
    }
  }

  spawnDelivery() {
    this.entities.push({
      type: 'delivery',
      x: this.width + 60,
      y: this.groundY - 20,
      w: 52,
      h: 76,
      vx: 0,
      vy: 0,
      alive: true,
      delivered: false,
      animFrame: 0,
    })
  }

  spawnBoss() {
    this.entities.push({
      type: 'boss',
      x: this.width + 80,
      y: this.groundY - 60,
      w: 96,
      h: 110,
      vx: 0,
      vy: 0,
      alive: true,
      health: 5,
      animFrame: 0,
    })
  }

  addProjectile(x: number, y: number, vx: number, isDelivery = false) {
    this.projectiles.push({ x, y, vx, w: isDelivery ? 22 : 34, h: isDelivery ? 18 : 10, alive: true, isDelivery })
  }

  draw(ctx: CanvasRenderingContext2D) {
    // sky
    ctx.fillStyle = palette.cream
    ctx.fillRect(0, 0, this.width, this.height)

    // distant city buildings
    this.buildings.forEach((b) => {
      ctx.fillStyle = b.color
      ctx.fillRect(b.x, this.groundY - b.h, b.w, b.h)
      // windows
      ctx.fillStyle = palette.black
      for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 24) {
        for (let wy = this.groundY - b.h + 16; wy < this.groundY - 12; wy += 28) {
          if (Math.random() > 0.7) ctx.fillRect(wx, wy, 12, 16)
        }
      }
      // roofline
      ctx.fillStyle = palette.black
      ctx.fillRect(b.x, this.groundY - b.h - 8, b.w, 8)
    })

    // street
    ctx.fillStyle = palette.black
    ctx.fillRect(0, this.groundY + 60, this.width, this.height - this.groundY - 60)
    // checkered curb
    ctx.fillStyle = palette.white
    this.checkers.forEach((c) => {
      ctx.fillRect(c.x, this.groundY + 60, 24, 14)
    })
    ctx.fillStyle = palette.black
    this.checkers.forEach((c) => {
      ctx.fillRect(c.x + 24, this.groundY + 60, 24, 14)
    })

    // sidewalk
    ctx.fillStyle = palette.grey
    ctx.fillRect(0, this.groundY + 74, this.width, this.height - this.groundY - 74)

    // draw entities
    this.entities.forEach((e) => this.drawEntity(ctx, e))
    this.projectiles.forEach((p) => this.drawProjectile(ctx, p))
  }

  drawEntity(ctx: CanvasRenderingContext2D, e: Entity) {
    switch (e.type) {
      case 'hazard':
        this.drawHazard(ctx, e)
        break
      case 'enemy':
        this.drawEnemy(ctx, e)
        break
      case 'token':
        this.drawToken(ctx, e)
        break
      case 'heart':
        this.drawHeart(ctx, e)
        break
      case 'delivery':
        this.drawDelivery(ctx, e)
        break
      case 'boss':
        this.drawBoss(ctx, e)
        break
    }
  }

  drawHazard(ctx: CanvasRenderingContext2D, e: Entity) {
    // yellow warning sign
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.moveTo(e.x + e.w / 2, e.y)
    ctx.lineTo(e.x + e.w, e.y + e.h)
    ctx.lineTo(e.x, e.y + e.h)
    ctx.closePath()
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = palette.black
    ctx.stroke()
    // skull icon
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2 + 2, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(e.x + e.w / 2 - 5, e.y + e.h / 2 + 6, 10, 4)
  }

  drawEnemy(ctx: CanvasRenderingContext2D, e: Entity) {
    // punk ghoul
    ctx.fillStyle = palette.lightGreen
    ctx.fillRect(e.x, e.y, e.w, e.h)
    // red mohawk
    ctx.fillStyle = palette.red
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(e.x + e.w / 2 - 4 + i * 2 - 4, e.y - 8 - i * 3, 6, 10)
    }
    // eyes
    ctx.fillStyle = palette.black
    ctx.fillRect(e.x + 6, e.y + 12, 8, 8)
    ctx.fillRect(e.x + e.w - 14, e.y + 12, 8, 8)
    // mouth
    ctx.fillStyle = palette.black
    ctx.fillRect(e.x + 8, e.y + 30, e.w - 16, 6)
    // arms
    ctx.fillStyle = palette.red
    ctx.fillRect(e.x - 8, e.y + 24, 10, 8)
    ctx.fillRect(e.x + e.w - 2, e.y + 24, 10, 8)
  }

  drawToken(ctx: CanvasRenderingContext2D, e: Entity) {
    const bob = Math.sin(e.animFrame * 0.15) * 3
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2 + bob, e.w / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = palette.black
    ctx.stroke()
    // skull imprint
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(e.x + e.w / 2, e.y + e.h / 2 + bob - 1, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillRect(e.x + e.w / 2 - 4, e.y + e.h / 2 + bob + 4, 8, 3)
  }

  drawHeart(ctx: CanvasRenderingContext2D, e: Entity) {
    const bob = Math.sin(e.animFrame * 0.15) * 3
    const cx = e.x + e.w / 2
    const cy = e.y + e.h / 2 + bob
    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.moveTo(cx, cy + 8)
    ctx.bezierCurveTo(cx - 14, cy - 6, cx - 14, cy - 14, cx - 6, cy - 14)
    ctx.bezierCurveTo(cx - 2, cy - 14, cx, cy - 10, cx, cy - 8)
    ctx.bezierCurveTo(cx, cy - 10, cx + 2, cy - 14, cx + 6, cy - 14)
    ctx.bezierCurveTo(cx + 14, cy - 14, cx + 14, cy - 6, cx, cy + 8)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = palette.black
    ctx.stroke()
    ctx.fillStyle = palette.black
    ctx.font = '8px "Press Start 2P"'
    ctx.fillText('1UP', cx - 10, cy + 2)
  }

  drawDelivery(ctx: CanvasRenderingContext2D, e: Entity) {
    // newspaper box / mailbox
    ctx.fillStyle = palette.brown
    ctx.fillRect(e.x + 10, e.y, e.w - 20, e.h)
    ctx.fillStyle = palette.black
    ctx.fillRect(e.x + 6, e.y + e.h - 10, e.w - 12, 10)
    // label
    ctx.fillStyle = palette.cream
    ctx.fillRect(e.x + 12, e.y + 18, e.w - 24, 20)
    ctx.fillStyle = palette.black
    ctx.font = '10px "Press Start 2P"'
    ctx.fillText('DAILY', e.x + 14, e.y + 32)
    // delivery indicator
    if (!e.delivered) {
      ctx.fillStyle = palette.red
      ctx.beginPath()
      ctx.moveTo(e.x + e.w / 2, e.y - 16)
      ctx.lineTo(e.x + e.w / 2 + 8, e.y - 6)
      ctx.lineTo(e.x + e.w / 2 - 8, e.y - 6)
      ctx.closePath()
      ctx.fill()
    }
  }

  drawBoss(ctx: CanvasRenderingContext2D, e: Entity) {
    // big green mohawk monster
    ctx.fillStyle = palette.lightGreen
    ctx.fillRect(e.x, e.y, e.w, e.h)
    // mohawk
    ctx.fillStyle = palette.red
    for (let i = 0; i < 7; i++) {
      ctx.fillRect(e.x + e.w / 2 - 6 + i * 3 - 9, e.y - 16 - i * 4, 10, 14)
    }
    // multiple eyes
    ctx.fillStyle = palette.black
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.arc(e.x + 18 + i * 22, e.y + 28, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = palette.red
      ctx.beginPath()
      ctx.arc(e.x + 18 + i * 22, e.y + 28, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = palette.black
    }
    // mouth
    ctx.fillStyle = palette.black
    ctx.fillRect(e.x + 10, e.y + 54, e.w - 20, 12)
    // health bar
    const bw = e.w - 20
    const bh = 8
    ctx.fillStyle = palette.black
    ctx.fillRect(e.x + 10, e.y - 28, bw, bh)
    ctx.fillStyle = palette.red
    ctx.fillRect(e.x + 12, e.y - 26, bw * ((e.health || 1) / 5), bh - 4)
  }

  drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
    if (p.isDelivery) {
      ctx.fillStyle = palette.brown
      ctx.fillRect(p.x, p.y, p.w, p.h)
      ctx.fillStyle = palette.cream
      ctx.fillRect(p.x + 4, p.y + 3, p.w - 8, p.h - 6)
      ctx.fillStyle = palette.black
      ctx.font = '6px "Press Start 2P"'
      ctx.fillText('DAILY', p.x + 5, p.y + 12)
    } else {
      ctx.fillStyle = palette.orange
      ctx.fillRect(p.x, p.y, p.w, p.h)
      ctx.fillStyle = palette.lightGreen
      ctx.fillRect(p.x + p.w, p.y - 3, 8, p.h + 6)
    }
  }
}
