import { Player } from './Player'
import { World } from './World'
import { Hud } from './Hud'

export type GameState = 'title' | 'playing' | 'gameover'

export class Game {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  player: Player
  world: World
  hud: Hud
  state: GameState = 'title'
  time = 0
  keys = new Set<string>()
  lastTime = 0
  raf = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')
    this.ctx = ctx

    this.player = new Player()
    this.world = new World(canvas.width, canvas.height, this.player.groundY)
    this.hud = new Hud()

    this.bindInput()
    this.raf = requestAnimationFrame((t) => this.loop(t))
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code)
      if (e.code === 'Space') {
        e.preventDefault()
        if (this.state === 'title' || this.state === 'gameover') {
          this.start()
        } else if (this.state === 'playing') {
          this.player.jump()
        }
      }
      if (this.state === 'playing') {
        if (e.code === 'KeyF' && this.player.canShoot()) {
          this.player.cooldownShoot = 18
          this.world.addProjectile(this.player.x + 54, this.player.y + 12, 14)
        }
        if (e.code === 'KeyD' && this.player.canDeliver()) {
          this.world.addProjectile(this.player.x + 40, this.player.y + 10, 10, true)
          this.player.cooldownDeliver = 45
        }
      }
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.code))

    // touch / click jump
    this.canvas.addEventListener('pointerdown', () => {
      if (this.state === 'title' || this.state === 'gameover') {
        this.start()
      } else {
        this.player.jump()
      }
    })
  }

  start() {
    this.player = new Player()
    this.world.reset()
    this.state = 'playing'
    this.time = 0
  }

  loop(timestamp: number) {
    const dt = timestamp - this.lastTime
    this.lastTime = timestamp

    this.update(dt)
    this.draw()

    this.raf = requestAnimationFrame((t) => this.loop(t))
  }

  update(_dt: number) {
    if (this.state !== 'playing') return
    this.time++

    this.player.update()
    this.world.update()

    // energy drains over time, tokens refill it
    this.player.energy = Math.max(0, this.player.energy - 0.05)

    // projectiles vs entities
    this.world.projectiles.forEach((p) => {
      this.world.entities.forEach((e) => {
        if (!p.alive || !e.alive) return
        if (this.overlap(p, e)) {
          if (p.isDelivery && e.type === 'delivery') {
            p.alive = false
            e.alive = false
            this.player.deliver()
          } else if (!p.isDelivery && (e.type === 'enemy' || e.type === 'boss' || e.type === 'hazard')) {
            p.alive = false
            if (e.type === 'boss') {
              e.health = (e.health || 1) - 1
              if (e.health && e.health <= 0) {
                e.alive = false
                this.player.score += 1000
              }
            } else {
              e.alive = false
              this.player.score += 150
            }
          }
        }
      })
    })

    // player vs entities
    this.world.entities.forEach((e) => {
      if (!e.alive) return
      if (this.overlap(this.player.bounds(), e)) {
        if (e.type === 'token') {
          e.alive = false
          this.player.collectToken()
        } else if (e.type === 'heart') {
          e.alive = false
          this.player.collectHeart()
        } else if (e.type === 'delivery') {
          // deliveries must be done with a thrown bag, not by touching
        } else if (e.type === 'hazard' || e.type === 'enemy' || e.type === 'boss') {
          if (this.player.takeDamage()) {
            this.player.score = Math.max(0, this.player.score - 50)
          }
          if (e.type !== 'boss') e.alive = false
        }
      }
    })

    if (this.player.lives <= 0) {
      this.state = 'gameover'
    }
  }

  overlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.world.draw(this.ctx)
    this.player.draw(this.ctx)

    if (this.state === 'playing') {
      this.hud.draw(this.ctx, this.player, this.time)
    } else if (this.state === 'title') {
      this.hud.drawTitle(this.ctx)
    } else if (this.state === 'gameover') {
      this.hud.draw(this.ctx, this.player, this.time)
      this.hud.drawGameOver(this.ctx, this.player)
    }
  }

  destroy() {
    cancelAnimationFrame(this.raf)
  }
}
