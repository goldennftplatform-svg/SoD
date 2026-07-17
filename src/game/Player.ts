import { palette } from './brand'

export type PlayerAction = 'idle' | 'jump' | 'shoot' | 'deliver'

export class Player {
  x = 180
  y = 380
  width = 46
  height = 64
  vx = 0
  vy = 0
  onGround = true
  facing = 1
  health = 3
  maxHealth = 3
  lives = 3
  tokens = 0
  score = 0
  energy = 100
  maxEnergy = 100
  cooldownShoot = 0
  cooldownDeliver = 0
  invincible = 0
  animFrame = 0

  // physics tuned for a skateboard feel
  gravity = 0.72
  jumpPower = -13.5
  groundY = 380

  jump() {
    if (this.onGround) {
      this.vy = this.jumpPower
      this.onGround = false
    }
  }

  update() {
    this.vy += this.gravity
    this.y += this.vy

    if (this.y >= this.groundY) {
      this.y = this.groundY
      this.vy = 0
      this.onGround = true
    }

    if (this.cooldownShoot > 0) this.cooldownShoot--
    if (this.cooldownDeliver > 0) this.cooldownDeliver--
    if (this.invincible > 0) this.invincible--
    this.animFrame++
  }

  canShoot() {
    return this.cooldownShoot <= 0
  }

  canDeliver() {
    return this.cooldownDeliver <= 0
  }

  takeDamage() {
    if (this.invincible > 0) return false
    this.health--
    this.invincible = 90
    if (this.health <= 0) {
      this.health = this.maxHealth
      this.lives--
    }
    return true
  }

  collectToken() {
    this.tokens++
    this.score += 50
    this.energy = Math.min(this.maxEnergy, this.energy + 8)
  }

  collectHeart() {
    this.score += 100
    this.health = Math.min(this.maxHealth, this.health + 1)
  }

  deliver() {
    this.score += 250
    this.tokens += 2
    this.cooldownDeliver = 45
  }

  bounds() {
    return { x: this.x, y: this.y, w: this.width, h: this.height }
  }

  draw(ctx: CanvasRenderingContext2D) {
    const bob = this.onGround ? Math.sin(this.animFrame * 0.18) * 3 : 0
    const px = this.x
    const py = this.y + bob

    // flicker when invincible
    if (this.invincible > 0 && Math.floor(this.animFrame / 4) % 2 === 0) return

    ctx.save()

    // skateboard
    ctx.fillStyle = palette.black
    ctx.fillRect(px - 22, py + 54, 48, 8)
    ctx.fillStyle = palette.grey
    ctx.fillRect(px - 26, py + 52, 56, 6)
    // wheels
    ctx.fillStyle = palette.darkGreen
    ctx.beginPath()
    ctx.arc(px - 18, py + 64, 5, 0, Math.PI * 2)
    ctx.arc(px + 18, py + 64, 5, 0, Math.PI * 2)
    ctx.fill()

    // legs
    ctx.fillStyle = palette.white
    ctx.fillRect(px - 14, py + 34, 8, 20)
    ctx.fillRect(px + 6, py + 34, 8, 20)

    // body / ribs
    ctx.fillStyle = palette.white
    ctx.fillRect(px - 16, py + 8, 32, 32)
    // brown strap
    ctx.fillStyle = palette.brown
    ctx.fillRect(px - 6, py + 8, 12, 32)
    ctx.fillRect(px - 16, py + 16, 32, 6)

    // green glove hand
    ctx.fillStyle = palette.lightGreen
    ctx.fillRect(px + 18, py + 16, 14, 14)

    // ray gun
    ctx.fillStyle = palette.grey
    ctx.fillRect(px + 28, py + 12, 28, 10)
    ctx.fillStyle = palette.black
    ctx.fillRect(px + 52, py + 10, 6, 14)
    // yellow rings
    ctx.fillStyle = palette.orange
    ctx.fillRect(px + 34, py + 10, 4, 14)
    ctx.fillRect(px + 40, py + 10, 4, 14)

    // head/skull
    ctx.fillStyle = palette.white
    ctx.beginPath()
    ctx.arc(px, py - 8, 22, 0, Math.PI * 2)
    ctx.fill()
    // green brain/face paint
    ctx.fillStyle = palette.lightGreen
    ctx.beginPath()
    ctx.arc(px, py - 22, 12, 0, Math.PI * 2)
    ctx.fill()
    // eyes
    ctx.fillStyle = palette.black
    ctx.beginPath()
    ctx.arc(px - 8, py - 8, 5, 0, Math.PI * 2)
    ctx.arc(px + 8, py - 8, 5, 0, Math.PI * 2)
    ctx.fill()
    // grin
    ctx.fillStyle = palette.black
    ctx.fillRect(px - 12, py + 2, 24, 6)
    ctx.fillStyle = palette.white
    for (let i = -8; i <= 8; i += 4) {
      ctx.fillRect(px + i - 1, py + 3, 2, 3)
    }

    // daisy crown
    ctx.fillStyle = palette.white
    for (let i = -14; i <= 14; i += 7) {
      ctx.beginPath()
      ctx.arc(px + i, py - 28, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = palette.gold
    ctx.beginPath()
    ctx.arc(px, py - 28, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
