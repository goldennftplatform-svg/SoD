import { palette } from './brand'

export type PlayerAction = 'idle' | 'push' | 'ollie' | 'grind' | 'fall'

export class Player {
  // grid position (continuous)
  gx = 3
  gy = 3
  // pixel offset within tile
  ox = 0
  oy = 0
  width = 28
  height = 48

  speed = 0.22
  maxSpeed = 0.42
  angle = 0 // moving angle
  vx = 0
  vy = 0

  health = 3
  maxHealth = 3
  lives = 3
  tokens = 0
  score = 0
  energy = 100
  maxEnergy = 100
  bags = 16
  maxBags = 16
  cooldownShoot = 0
  cooldownDeliver = 0

  z = 0 // air height
  vz = 0
  onGround = true
  trickTimer = 0
  trickScore = 0
  invincible = 0
  animFrame = 0
  action: PlayerAction = 'idle'
  facing = 1

  jump() {
    if (this.onGround) {
      this.vz = 7
      this.onGround = false
      this.action = 'ollie'
      this.trickTimer = 20
    }
  }

  move(dx: number, dy: number) {
    if (dx === 0 && dy === 0) return
    // normalize diagonal so diagonals aren't turbo
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    this.vx += dx * 0.055
    this.vy += dy * 0.055
    const mag = Math.hypot(this.vx, this.vy)
    if (mag > this.maxSpeed) {
      this.vx = (this.vx / mag) * this.maxSpeed
      this.vy = (this.vy / mag) * this.maxSpeed
    }
    this.facing = dx > 0 ? 1 : dx < 0 ? -1 : this.facing
  }

  update() {
    // snappier friction — still drifts like a board
    this.vx *= 0.9
    this.vy *= 0.9

    this.gx += this.vx
    this.gy += this.vy

    this.ox += this.vx * 64
    this.oy += this.vy * 32

    // air physics
    if (!this.onGround) {
      this.z += this.vz
      this.vz -= 0.35
      if (this.z <= 0) {
        this.z = 0
        this.onGround = true
        this.vz = 0
        this.action = 'idle'
      }
    }

    if (this.trickTimer > 0) this.trickTimer--
    if (this.invincible > 0) this.invincible--
    if (this.cooldownShoot > 0) this.cooldownShoot--
    if (this.cooldownDeliver > 0) this.cooldownDeliver--
    this.animFrame++

    // energy drains when moving
    const moving = Math.abs(this.vx) > 0.01 || Math.abs(this.vy) > 0.01
    if (moving) this.energy = Math.max(0, this.energy - 0.08)
  }

  takeDamage() {
    if (this.invincible > 0) return false
    this.health--
    this.invincible = 90
    this.action = 'fall'
    this.vz = 4
    this.onGround = false
    if (this.health <= 0) {
      this.health = this.maxHealth
      this.lives--
    }
    return true
  }

  collectToken() {
    this.tokens++
    this.score += 50
    this.energy = Math.min(this.maxEnergy, this.energy + 12)
    // Paperboy restock bundles on the route
    if (this.tokens % 4 === 0) {
      this.bags = Math.min(this.maxBags, this.bags + 3)
    }
  }

  collectHeart() {
    this.score += 100
    this.health = Math.min(this.maxHealth, this.health + 1)
  }

  canShoot() {
    return this.cooldownShoot <= 0
  }

  canDeliver() {
    return this.cooldownDeliver <= 0
  }

  deliver() {
    if (this.bags <= 0) return false
    this.bags--
    this.score += 350
    this.tokens += 3
    this.energy = Math.min(this.maxEnergy, this.energy + 20)
    return true
  }

  bounds() {
    return { x: this.gx, y: this.gy, w: this.width / 64, h: this.height / 64 }
  }

  draw(ctx: CanvasRenderingContext2D, screenX: number, screenY: number) {
    const bob = this.onGround ? Math.sin(this.animFrame * 0.15) * 2 : 0
    const px = screenX
    const py = screenY - this.z - 24 - bob
    const dir = this.facing > 0 ? 1 : -1

    if (this.invincible > 0 && Math.floor(this.animFrame / 4) % 2 === 0) return

    ctx.save()
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // ink stroke helper
    const ink = (fn: () => void) => {
      ctx.save()
      ctx.strokeStyle = palette.black
      ctx.lineWidth = 3
      fn()
      ctx.stroke()
      ctx.restore()
    }

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.beginPath()
    ctx.ellipse(px, screenY - 4, 20, 9, 0, 0, Math.PI * 2)
    ctx.fill()

    // skateboard with checkered nose
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.moveTo(px - 20, py + 34)
    ctx.lineTo(px + 20, py + 24)
    ctx.lineTo(px + 20, py + 32)
    ctx.lineTo(px - 20, py + 42)
    ctx.closePath()
    ctx.fill()
    ink(() => {
      ctx.beginPath()
      ctx.moveTo(px - 20, py + 34)
      ctx.lineTo(px + 20, py + 24)
      ctx.lineTo(px + 20, py + 32)
      ctx.lineTo(px - 20, py + 42)
      ctx.closePath()
    })
    // green deck top
    ctx.fillStyle = palette.darkGreen
    ctx.beginPath()
    ctx.moveTo(px - 18, py + 34)
    ctx.lineTo(px + 18, py + 25)
    ctx.lineTo(px + 18, py + 29)
    ctx.lineTo(px - 18, py + 38)
    ctx.closePath()
    ctx.fill()
    // checker tip
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = i % 2 === 0 ? palette.white : palette.black
      ctx.fillRect(px + 8 + i * 3, py + 26, 3, 3)
    }
    // wheels
    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.arc(px - 14, py + 40, 5, 0, Math.PI * 2)
    ctx.arc(px + 14, py + 30, 5, 0, Math.PI * 2)
    ctx.fill()
    ink(() => {
      ctx.beginPath()
      ctx.arc(px - 14, py + 40, 5, 0, Math.PI * 2)
      ctx.arc(px + 14, py + 30, 5, 0, Math.PI * 2)
    })

    // legs
    ctx.fillStyle = palette.cream
    ctx.fillRect(px - 12, py + 10, 8, 22)
    ctx.fillRect(px + 4, py + 10, 8, 22)
    ink(() => {
      ctx.strokeRect(px - 12, py + 10, 8, 22)
      ctx.strokeRect(px + 4, py + 10, 8, 22)
    })

    // torso + ribs
    ctx.fillStyle = palette.cream
    ctx.fillRect(px - 14, py - 18, 28, 34)
    ink(() => ctx.strokeRect(px - 14, py - 18, 28, 34))
    ctx.fillStyle = palette.black
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(px - 12, py - 10 + i * 7, 24, 3)
    }
    // brown harness
    ctx.fillStyle = palette.brown
    ctx.fillRect(px - 5, py - 18, 10, 34)
    ctx.fillRect(px - 14, py - 2, 28, 8)
    ink(() => {
      ctx.strokeRect(px - 5, py - 18, 10, 34)
      ctx.strokeRect(px - 14, py - 2, 28, 8)
    })
    // gold buckle
    ctx.fillStyle = palette.gold
    ctx.fillRect(px - 4, py - 1, 8, 6)

    // delivery bag
    const bagX = dir > 0 ? px - 26 : px + 14
    ctx.fillStyle = palette.brown
    ctx.fillRect(bagX, py - 12, 16, 22)
    ink(() => ctx.strokeRect(bagX, py - 12, 16, 22))
    ctx.fillStyle = palette.cream
    ctx.fillRect(bagX + 2, py - 8, 12, 12)
    ctx.fillStyle = palette.black
    ctx.fillRect(bagX + 3, py - 4, 10, 2)

    // green glove + chunky ray gun
    const gunX = dir > 0 ? px + 16 : px - 40
    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.arc(dir > 0 ? px + 18 : px - 18, py - 2, 8, 0, Math.PI * 2)
    ctx.fill()
    ink(() => {
      ctx.beginPath()
      ctx.arc(dir > 0 ? px + 18 : px - 18, py - 2, 8, 0, Math.PI * 2)
    })
    ctx.fillStyle = palette.grey
    ctx.fillRect(gunX, py - 10, 28, 10)
    ink(() => ctx.strokeRect(gunX, py - 10, 28, 10))
    ctx.fillStyle = palette.orange
    ctx.fillRect(gunX + (dir > 0 ? 20 : 0), py - 13, 5, 16)
    ctx.fillRect(gunX + (dir > 0 ? 26 : -2), py - 13, 5, 16)
    ctx.fillStyle = palette.black
    ctx.fillRect(gunX + (dir > 0 ? 30 : -6), py - 12, 8, 14)

    // BIG skull head
    ctx.fillStyle = palette.cream
    ctx.beginPath()
    ctx.arc(px, py - 36, 18, 0, Math.PI * 2)
    ctx.fill()
    ink(() => {
      ctx.beginPath()
      ctx.arc(px, py - 36, 18, 0, Math.PI * 2)
    })
    // pepe green scalp + cheeks
    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.ellipse(px, py - 48, 14, 9, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px - 12, py - 34, 5, 0, Math.PI * 2)
    ctx.arc(px + 12, py - 34, 5, 0, Math.PI * 2)
    ctx.fill()
    // huge eyes + shine
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(px - 7, py - 36, 5, 0, Math.PI * 2)
    ctx.arc(px + 7, py - 36, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = palette.white
    ctx.beginPath()
    ctx.arc(px - 5, py - 38, 2, 0, Math.PI * 2)
    ctx.arc(px + 9, py - 38, 2, 0, Math.PI * 2)
    ctx.fill()
    // wide grin + teeth
    ctx.fillStyle = palette.black
    ctx.fillRect(px - 11, py - 26, 22, 7)
    ctx.fillStyle = palette.cream
    for (let i = -8; i <= 8; i += 4) {
      ctx.fillRect(px + i - 1, py - 25, 2, 5)
    }

    // daisy crown (proper flowers)
    for (let i = -14; i <= 14; i += 7) {
      const cx = px + i
      const cy = py - 56
      ctx.fillStyle = palette.cream
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2
        ctx.beginPath()
        ctx.arc(cx + Math.cos(ang) * 4, cy + Math.sin(ang) * 3, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.fillStyle = palette.gold
      ctx.beginPath()
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }
}
