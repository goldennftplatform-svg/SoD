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

  speed = 0.18
  maxSpeed = 0.32
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
  bags = 12
  maxBags = 12
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
    this.vx += dx * 0.04
    this.vy += dy * 0.04
    const mag = Math.hypot(this.vx, this.vy)
    if (mag > this.maxSpeed) {
      this.vx = (this.vx / mag) * this.maxSpeed
      this.vy = (this.vy / mag) * this.maxSpeed
    }
    this.facing = dx > 0 ? 1 : dx < 0 ? -1 : this.facing
  }

  update() {
    // friction
    this.vx *= 0.88
    this.vy *= 0.88

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

    if (this.invincible > 0 && Math.floor(this.animFrame / 4) % 2 === 0) return

    ctx.save()

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(px, screenY - 6, 16, 8, 0, 0, Math.PI * 2)
    ctx.fill()

    // skateboard (isometric cube-ish)
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.moveTo(px - 16, py + 32)
    ctx.lineTo(px + 16, py + 24)
    ctx.lineTo(px + 16, py + 30)
    ctx.lineTo(px - 16, py + 38)
    ctx.closePath()
    ctx.fill()
    // wheels
    ctx.fillStyle = palette.darkGreen
    ctx.beginPath()
    ctx.arc(px - 12, py + 36, 4, 0, Math.PI * 2)
    ctx.arc(px + 12, py + 28, 4, 0, Math.PI * 2)
    ctx.fill()

    // legs
    ctx.fillStyle = palette.white
    ctx.fillRect(px - 10, py + 12, 6, 18)
    ctx.fillRect(px + 2, py + 12, 6, 18)

    // body
    ctx.fillStyle = palette.white
    ctx.fillRect(px - 12, py - 14, 24, 30)
    // brown strap
    ctx.fillStyle = palette.brown
    ctx.fillRect(px - 4, py - 14, 8, 30)
    ctx.fillRect(px - 12, py - 4, 24, 6)
    // delivery bag on back
    ctx.fillStyle = palette.brown
    ctx.fillRect(this.facing > 0 ? px - 22 : px + 14, py - 10, 14, 18)
    ctx.fillStyle = palette.cream
    ctx.fillRect(this.facing > 0 ? px - 20 : px + 16, py - 6, 10, 10)

    // green glove + ray gun
    ctx.fillStyle = palette.lightGreen
    const gunArmX = this.facing > 0 ? px + 14 : px - 20
    ctx.fillRect(gunArmX, py - 6, 16, 12)
    ctx.fillStyle = palette.grey
    ctx.fillRect(gunArmX + (this.facing > 0 ? 8 : -20), py - 10, 24, 8)
    ctx.fillStyle = palette.orange
    ctx.fillRect(gunArmX + (this.facing > 0 ? 28 : -8), py - 12, 6, 12)

    // head/skull
    ctx.fillStyle = palette.white
    ctx.beginPath()
    ctx.arc(px, py - 32, 14, 0, Math.PI * 2)
    ctx.fill()
    // green brain
    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.arc(px, py - 42, 7, 0, Math.PI * 2)
    ctx.fill()
    // eyes
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(px - 5, py - 32, 3, 0, Math.PI * 2)
    ctx.arc(px + 5, py - 32, 3, 0, Math.PI * 2)
    ctx.fill()
    // grin
    ctx.fillStyle = palette.black
    ctx.fillRect(px - 8, py - 24, 16, 4)

    // daisy crown
    ctx.fillStyle = palette.white
    for (let i = -10; i <= 10; i += 5) {
      ctx.beginPath()
      ctx.arc(px + i, py - 46, 3, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.arc(px, py - 46, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
