import { palette } from './brand'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export class ParticleSystem {
  particles: Particle[] = []

  emit(x: number, y: number, count: number, color: string = palette.cream, speed = 3) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const sp = Math.random() * speed + 1
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp - 1,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        color,
        size: 2 + Math.random() * 4,
      })
    }
  }

  emitSpark(x: number, y: number, count: number) {
    this.emit(x, y, count, palette.gold, 5)
  }

  emitGrind(x: number, y: number, count: number) {
    this.emit(x, y, count, '#9ca3a8', 2)
  }

  emitDelivery(x: number, y: number) {
    this.emit(x, y, 12, palette.brown, 3)
  }

  update() {
    this.particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.15
      p.life--
    })
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
    })
    ctx.globalAlpha = 1
  }
}
