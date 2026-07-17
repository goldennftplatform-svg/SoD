// Isometric 2:1 projection helpers
export const TILE_W = 64
export const TILE_H = 32

export function isoToScreen(mx: number, my: number, cx: number, cy: number) {
  return {
    x: (mx - my) * (TILE_W / 2) + cx,
    y: (mx + my) * (TILE_H / 2) + cy,
  }
}

export function screenToIso(sx: number, sy: number, cx: number, cy: number) {
  const x = (sx - cx) / (TILE_W / 2)
  const y = (sy - cy) / (TILE_H / 2)
  return {
    mx: (x + y) / 2,
    my: (y - x) / 2,
  }
}

export function drawIsoTile(
  ctx: CanvasRenderingContext2D,
  mx: number,
  my: number,
  cx: number,
  cy: number,
  color: string,
  height = 0,
) {
  const { x, y } = isoToScreen(mx, my, cx, cy)
  const hw = TILE_W / 2
  const hh = TILE_H / 2

  // top face
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, y - height)
  ctx.lineTo(x + hw, y - hh - height)
  ctx.lineTo(x, y - TILE_H - height)
  ctx.lineTo(x - hw, y - hh - height)
  ctx.closePath()
  ctx.fill()

  // left face
  ctx.fillStyle = shadeColor(color, -20)
  ctx.beginPath()
  ctx.moveTo(x - hw, y - hh - height)
  ctx.lineTo(x, y - TILE_H - height)
  ctx.lineTo(x, y - TILE_H + height)
  ctx.lineTo(x - hw, y - hh + height)
  ctx.closePath()
  ctx.fill()

  // right face
  ctx.fillStyle = shadeColor(color, -40)
  ctx.beginPath()
  ctx.moveTo(x, y - TILE_H - height)
  ctx.lineTo(x + hw, y - hh - height)
  ctx.lineTo(x + hw, y - hh + height)
  ctx.lineTo(x, y - TILE_H + height)
  ctx.closePath()
  ctx.fill()

  // outline
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y - height)
  ctx.lineTo(x + hw, y - hh - height)
  ctx.lineTo(x, y - TILE_H - height)
  ctx.lineTo(x - hw, y - hh - height)
  ctx.closePath()
  ctx.stroke()
}

export function shadeColor(color: string, percent: number) {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
}

export function drawIsoCube(
  ctx: CanvasRenderingContext2D,
  mx: number,
  my: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  d: number,
  color: string,
) {
  const { x, y } = isoToScreen(mx, my, cx, cy)
  const hw = w / 2
  const hh = h / 2
  const topY = y - d

  // top
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(x, topY)
  ctx.lineTo(x + hw, topY - hh)
  ctx.lineTo(x, topY - h)
  ctx.lineTo(x - hw, topY - hh)
  ctx.closePath()
  ctx.fill()

  // left
  ctx.fillStyle = shadeColor(color, -20)
  ctx.beginPath()
  ctx.moveTo(x - hw, topY - hh)
  ctx.lineTo(x, topY - h)
  ctx.lineTo(x, y - h)
  ctx.lineTo(x - hw, y - hh)
  ctx.closePath()
  ctx.fill()

  // right
  ctx.fillStyle = shadeColor(color, -40)
  ctx.beginPath()
  ctx.moveTo(x, topY - h)
  ctx.lineTo(x + hw, topY - hh)
  ctx.lineTo(x + hw, y - hh)
  ctx.lineTo(x, y - h)
  ctx.closePath()
  ctx.fill()
}
