import { Player } from './Player'
import { World } from './World'
import { Hud } from './Hud'
import { ParticleSystem } from './Particle'
import { createMap, type MapDef } from './Map'
import { isoToScreen } from './iso'

export type GameState = 'title' | 'mapselect' | 'playing' | 'gameover' | 'won'

export class Game {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  player: Player
  world: World
  hud: Hud
  particles: ParticleSystem
  state: GameState = 'title'
  selectedMap = 0
  maps: MapDef[] = []
  time = 0
  keys = new Set<string>()
  lastTime = 0
  raf = 0
  camX = 480
  camY = 270
  screenShake = 0
  combo = 0
  comboTimer = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')
    this.ctx = ctx

    this.maps = [createMap('neighborhood'), createMap('downtown'), createMap('graveyard')]
    this.player = new Player()
    this.world = new World(this.maps[0], canvas.width, canvas.height)
    this.hud = new Hud()
    this.particles = new ParticleSystem()

    this.bindInput()
    this.raf = requestAnimationFrame((t) => this.loop(t))
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      if (e.code === 'Space') {
        e.preventDefault()
        if (this.state === 'title') {
          this.state = 'mapselect'
        } else if (this.state === 'mapselect') {
          this.start(this.maps[this.selectedMap])
        } else if (this.state === 'playing') {
          this.player.jump()
        } else if (this.state === 'gameover' || this.state === 'won') {
          this.state = 'mapselect'
        }
      }
      if (this.state === 'mapselect') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          this.selectedMap = (this.selectedMap - 1 + this.maps.length) % this.maps.length
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          this.selectedMap = (this.selectedMap + 1) % this.maps.length
        }
      }
      if (this.state === 'playing') {
        if (e.code === 'KeyF') {
          this.shootRay()
        }
        if (e.code === 'KeyD') {
          this.throwBag()
        }
      }
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.code))

    this.canvas.addEventListener('pointerdown', () => {
      if (this.state === 'title') this.state = 'mapselect'
      else if (this.state === 'mapselect') this.start(this.maps[this.selectedMap])
      else if (this.state === 'gameover' || this.state === 'won') this.state = 'mapselect'
      else if (this.state === 'playing') this.player.jump()
    })
  }

  start(map: MapDef) {
    this.player = new Player()
    this.player.gx = map.start.x
    this.player.gy = map.start.y
    this.world = new World(map, this.canvas.width, this.canvas.height)
    this.particles = new ParticleSystem()
    this.state = 'playing'
    this.time = 0
    this.combo = 0
    this.comboTimer = 0
  }

  nearestDelivery() {
    let best: { x: number; y: number; dist: number } | null = null
    for (const e of this.world.entities) {
      if (!e.alive || e.type !== 'delivery') continue
      const dist = Math.hypot(this.player.gx - e.gx, this.player.gy - e.gy)
      if (!best || dist < best.dist) best = { x: e.gx, y: e.gy, dist }
    }
    return best
  }

  bumpCombo(points: number) {
    this.combo = Math.min(12, this.combo + 1)
    this.comboTimer = 180
    const mult = Math.max(1, this.combo)
    this.player.score += Math.floor(points * (mult - 1))
  }

  shootRay() {
    if (!this.player.canShoot()) return
    this.player.cooldownShoot = 18
    const { x, y } = isoToScreen(this.player.gx, this.player.gy, 0, 0)
    this.world.addProjectile(
      this.player.gx,
      this.player.gy,
      this.player.z + 0.3,
      this.player.facing > 0 ? 0.25 : -0.25,
      0,
      0,
      false,
    )
    this.particles.emitSpark(x + 20, y - 40 - this.player.z, 6)
  }

  throwBag() {
    if (!this.player.canDeliver() || this.player.bags <= 0) return

    // auto-assist: if near a mailbox, land the delivery instantly
    const near = this.nearestDelivery()
    if (near && near.dist < 2.4) {
      let box = null as (typeof this.world.entities)[number] | null
      let best = 999
      for (const e of this.world.entities) {
        if (!e.alive || e.type !== 'delivery') continue
        const d = Math.hypot(e.gx - near.x, e.gy - near.y)
        if (d < best) {
          best = d
          box = e
        }
      }
      if (box) {
        this.player.deliver()
        this.player.cooldownDeliver = 20
        box.alive = false
        box.delivered = true
        this.bumpCombo(350)
        this.player.score += 350
        this.player.tokens += 3
        const { x, y } = isoToScreen(box.gx, box.gy, this.camX, this.camY)
        this.particles.emitDelivery(x, y - 20)
        return
      }
    }

    this.player.deliver()
    const aim = near && near.dist < 8 ? near : null
    const tx = aim ? aim.x - this.player.gx : this.player.facing > 0 ? 0.18 : -0.18
    const ty = aim ? aim.y - this.player.gy : 0.06
    const mag = Math.hypot(tx, ty) || 1
    this.world.addProjectile(
      this.player.gx,
      this.player.gy,
      this.player.z + 0.4,
      (tx / mag) * 0.22,
      (ty / mag) * 0.22,
      0.1,
      true,
    )
  }

  loop(timestamp: number) {
    const dt = timestamp - this.lastTime
    this.lastTime = timestamp

    this.update(dt)
    this.draw()

    this.raf = requestAnimationFrame((t) => this.loop(t))
  }

  update(_dt: number) {
    this.particles.update()
    this.hud.tick()

    if (this.state === 'playing') {
      this.time++
      if (this.comboTimer > 0) {
        this.comboTimer--
        if (this.comboTimer <= 0) this.combo = 0
      }

      // input movement
      let dx = 0
      let dy = 0
      if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dy = -1
      if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dy = 1
      if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dx = -1
      if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dx = 1
      this.player.move(dx, dy)

      this.player.update()
      this.world.update()

      // clamp to map
      this.player.gx = Math.max(0, Math.min(this.world.map.width - 1, this.player.gx))
      this.player.gy = Math.max(0, Math.min(this.world.map.height - 1, this.player.gy))

      // building collision
      const tile = this.world.tileAt(Math.round(this.player.gx), Math.round(this.player.gy))
      if (tile === 'building') {
        // bounce back to previous position
        this.player.gx -= this.player.vx * 1.5
        this.player.gy -= this.player.vy * 1.5
        this.player.vx *= -0.5
        this.player.vy *= -0.5
      }

      // tile effects — Skate or Die energy
      if (tile === 'ramp' && this.player.onGround) {
        this.player.vz = 10
        this.player.onGround = false
        this.player.action = 'ollie'
        this.player.trickScore += 200
        this.player.score += 200
        const { x, y } = isoToScreen(this.player.gx, this.player.gy, this.camX, this.camY)
        this.particles.emitSpark(x, y - 10, 10)
      }
      if (tile === 'halfpipe' && this.player.onGround) {
        // launch hard off the pipe wall
        this.player.vz = 14
        this.player.onGround = false
        this.player.action = 'ollie'
        this.player.trickScore += 500
        this.player.score += 500
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 15)
        const { x, y } = isoToScreen(this.player.gx, this.player.gy, this.camX, this.camY)
        this.particles.emitSpark(x, y - 20, 18)
        this.screenShake = 6
      }
      if (tile === 'rail') {
        this.player.action = 'grind'
        this.player.score += 2
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 0.3)
        if (this.time % 4 === 0) {
          const { x, y } = isoToScreen(this.player.gx, this.player.gy, this.camX, this.camY)
          this.particles.emitGrind(x, y - 8, 3)
        }
      }
      if (tile === 'park') {
        // bowl floor — slight speed buff
        this.player.vx *= 1.02
        this.player.vy *= 1.02
      }
      if (tile === 'water' || tile === 'hazard') {
        if (this.player.takeDamage()) {
          this.screenShake = 10
        }
      }

      // camera follow
      const target = isoToScreen(this.player.gx, this.player.gy, 0, 0)
      this.camX += (480 - target.x - this.camX) * 0.08
      this.camY += (300 - target.y - this.camY) * 0.08

      if (this.screenShake > 0) this.screenShake--

      // projectiles vs entities
      this.world.projectiles.forEach((p) => {
        this.world.entities.forEach((e) => {
          if (!p.alive || !e.alive) return
          const dist = Math.hypot(p.x - e.gx, p.y - e.gy)
          if (dist < 0.6) {
            if (p.isDelivery && e.type === 'delivery') {
              p.alive = false
              e.alive = false
              e.delivered = true
              this.bumpCombo(350)
              this.player.score += 350
              this.player.tokens += 3
              const { x, y } = isoToScreen(e.gx, e.gy, this.camX, this.camY)
              this.particles.emitDelivery(x, y - 20)
            } else if (!p.isDelivery && (e.type === 'enemy' || e.type === 'hazard')) {
              p.alive = false
              e.alive = false
              this.bumpCombo(200)
              this.player.score += 200
              const { x, y } = isoToScreen(e.gx, e.gy, this.camX, this.camY)
              this.particles.emitSpark(x, y - 20, 10)
            }
          }
        })
      })

      // player vs entities
      this.world.entities.forEach((e) => {
        if (!e.alive) return
        const dist = Math.hypot(this.player.gx - e.gx, this.player.gy - e.gy)
        if (dist < 0.7) {
          if (e.type === 'token') {
            e.alive = false
            this.player.collectToken()
            this.bumpCombo(50)
            const { x, y } = isoToScreen(e.gx, e.gy, this.camX, this.camY)
            this.particles.emitSpark(x, y - 20, 8)
          } else if (e.type === 'heart') {
            e.alive = false
            this.player.collectHeart()
          } else if (e.type === 'hazard' || e.type === 'enemy') {
            if (this.player.takeDamage()) {
              this.screenShake = 10
              this.combo = 0
              this.comboTimer = 0
            }
          }
        }
      })

      // goal check
      const goalDist = Math.hypot(this.player.gx - this.world.map.goal.x, this.player.gy - this.world.map.goal.y)
      if (goalDist < 1.2) {
        const allDelivered = this.world.entities.filter((e) => e.type === 'delivery').every((e) => !e.alive)
        if (allDelivered) {
          this.player.score += 2000
          this.state = 'won'
        }
      }

      if (this.player.lives <= 0 || this.player.energy <= 0) {
        this.state = 'gameover'
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.save()
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake
      const sy = (Math.random() - 0.5) * this.screenShake
      this.ctx.translate(sx, sy)
    }

    if (this.state === 'title') {
      this.hud.drawTitle(this.ctx)
    } else if (this.state === 'mapselect') {
      this.hud.drawMapSelect(this.ctx, this.maps, this.selectedMap)
    } else if (this.state === 'playing' || this.state === 'gameover' || this.state === 'won') {
      const { x, y } = isoToScreen(this.player.gx, this.player.gy, 0, 0)
      const px = this.camX + x
      const py = this.camY + y
      this.world.draw(this.ctx, this.camX, this.camY, this.player.gx, this.player.gy)
      this.player.draw(this.ctx, px, py)
      this.particles.draw(this.ctx)

      const near = this.nearestDelivery()
      if (this.state === 'playing' && near) {
        const target = isoToScreen(near.x, near.y, this.camX, this.camY)
        this.hud.drawWaypoint(this.ctx, px, py - 20, target.x, target.y)
      }

      const deliveriesLeft = this.world.entities.filter((e) => e.type === 'delivery' && e.alive).length
      this.hud.draw(this.ctx, this.player, this.time, this.world.map, deliveriesLeft, this.combo, near)
    }

    if (this.state === 'gameover') {
      this.hud.drawGameOver(this.ctx, this.player, false)
    } else if (this.state === 'won') {
      this.hud.drawGameOver(this.ctx, this.player, true)
    }

    this.ctx.restore()
  }

  destroy() {
    cancelAnimationFrame(this.raf)
  }
}
