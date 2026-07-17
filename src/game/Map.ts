import { palette } from './brand'

export type TileType =
  | 'grass' // yard — solid, not rideable
  | 'road'
  | 'sidewalk'
  | 'ramp'
  | 'halfpipe'
  | 'rail'
  | 'hazard'
  | 'building'
  | 'water'
  | 'dirt'
  | 'park'

export interface MapDef {
  id: string
  name: string
  blurb: string
  width: number
  height: number
  start: { x: number; y: number }
  goal: { x: number; y: number }
  deliveries: { x: number; y: number }[]
  tokens: { x: number; y: number }[]
  hearts: { x: number; y: number }[]
  ramps: { x: number; y: number }[]
  halfpipes: { x: number; y: number }[]
  hazards: { x: number; y: number }[]
  tiles: TileType[][]
}

/** Paperboy rule: you ride streets/sidewalks/park features only */
export function isRideable(t: TileType | null | undefined): boolean {
  if (!t) return false
  return (
    t === 'road' ||
    t === 'sidewalk' ||
    t === 'ramp' ||
    t === 'rail' ||
    t === 'halfpipe' ||
    t === 'park' ||
    t === 'hazard' // can hit but still stand on
  )
}

export function isSolid(t: TileType | null | undefined): boolean {
  return !isRideable(t)
}

export function tileColor(t: TileType): string {
  switch (t) {
    case 'grass':
      return '#5a9a5e'
    case 'road':
      return '#4a4a4a'
    case 'sidewalk':
      return '#cfc4ae'
    case 'ramp':
      return palette.brown
    case 'halfpipe':
      return '#333333'
    case 'rail':
      return '#c5ced6'
    case 'hazard':
      return palette.gold
    case 'building':
      return '#6a7858'
    case 'water':
      return '#3b6d8f'
    case 'dirt':
      return '#9a7d58'
    case 'park':
      return '#3d7a45'
    default:
      return palette.cream
  }
}

export function tileHeight(t: TileType): number {
  switch (t) {
    case 'building':
      return 40
    case 'halfpipe':
      return 26
    case 'ramp':
      return 12
    case 'rail':
      return 8
    default:
      return 0
  }
}

export function createMap(id: string): MapDef {
  switch (id) {
    case 'downtown':
      return makeCityRoute('downtown', 'Downtown', '5 blocks · Hard Way', 4, 5, 0.55)
    case 'graveyard':
      return makeCityRoute('graveyard', 'Graveyard Ramp', '5 blocks · crypt route', 3, 5, 0.4, true)
    case 'neighborhood':
    default:
      return makeCityRoute('neighborhood', 'Neighborhood', '5 blocks · Easy Street', 3, 5, 0.35)
  }
}

/**
 * Paperboy-style city: streets between building blocks.
 * blocksY = 5 city blocks deep (the delivery run).
 * blocksX = how many blocks wide.
 */
function makeCityRoute(
  id: string,
  name: string,
  blurb: string,
  blocksX: number,
  blocksY: number,
  hazardDensity: number,
  spooky = false,
): MapDef {
  // Scale: each city block is a chunk of houses; streets are wide enough to skate
  const HOUSE = 10 // building footprint per block (tiles)
  const STREET = 6 // street width (lanes) — Paperboy road scale
  const YARD = 2 // front yard depth (solid grass) between sidewalk and building

  const w = blocksX * HOUSE + (blocksX + 1) * STREET
  const h = blocksY * HOUSE + (blocksY + 1) * STREET

  const fill: TileType = spooky ? 'dirt' : 'grass'
  const tiles: TileType[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => fill))

  // Paint all streets (horizontal + vertical grid)
  for (let by = 0; by <= blocksY; by++) {
    const y0 = by * (HOUSE + STREET)
    for (let y = y0; y < y0 + STREET && y < h; y++) {
      for (let x = 0; x < w; x++) tiles[y][x] = 'road'
    }
  }
  for (let bx = 0; bx <= blocksX; bx++) {
    const x0 = bx * (HOUSE + STREET)
    for (let x = x0; x < x0 + STREET && x < w; x++) {
      for (let y = 0; y < h; y++) tiles[y][x] = 'road'
    }
  }

  // Building blocks with yards + sidewalks facing the street (Paperboy houses)
  const deliveries: { x: number; y: number }[] = []
  const ramps: { x: number; y: number }[] = []
  const hazards: { x: number; y: number }[] = []

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      const ox = STREET + bx * (HOUSE + STREET)
      const oy = STREET + by * (HOUSE + STREET)

      // Fill block as yard first
      for (let y = oy; y < oy + HOUSE; y++) {
        for (let x = ox; x < ox + HOUSE; x++) {
          tiles[y][x] = spooky ? 'dirt' : 'grass'
        }
      }

      // Inner building mass (houses) — leave yard ring
      for (let y = oy + YARD; y < oy + HOUSE - YARD; y++) {
        for (let x = ox + YARD; x < ox + HOUSE - YARD; x++) {
          tiles[y][x] = 'building'
        }
      }

      // Sidewalks on the street-facing edges of each block
      for (let x = ox; x < ox + HOUSE; x++) {
        // north & south edges of block (face horizontal streets)
        if (oy - 1 >= 0 && tiles[oy - 1][x] === 'road') {
          // sidewalk is the first yard row
          tiles[oy][x] = 'sidewalk'
        }
        if (oy + HOUSE < h && tiles[oy + HOUSE][x] === 'road') {
          tiles[oy + HOUSE - 1][x] = 'sidewalk'
        }
      }
      for (let y = oy; y < oy + HOUSE; y++) {
        if (ox - 1 >= 0 && tiles[y][ox - 1] === 'road') {
          tiles[y][ox] = 'sidewalk'
        }
        if (ox + HOUSE < w && tiles[y][ox + HOUSE] === 'road') {
          tiles[y][ox + HOUSE - 1] = 'sidewalk'
        }
      }

      // Subscriber mailboxes along sidewalks (Paperboy deliveries) — every other house slot
      for (let i = 1; i < HOUSE - 1; i += 2) {
        // south-facing sidewalk of block (top of next street)
        const sx = ox + i
        const sy = oy + HOUSE - 1
        if (tiles[sy]?.[sx] === 'sidewalk') {
          deliveries.push({ x: sx, y: sy })
        }
        // north-facing
        const ny = oy
        if (tiles[ny]?.[sx] === 'sidewalk' && i % 4 === 1) {
          deliveries.push({ x: sx, y: ny })
        }
      }
    }
  }

  // Main Paperboy run: the center vertical street gets the halfpipe training course at the end
  const mainStreetX = Math.floor(STREET / 2) + Math.floor(blocksX / 2) * (HOUSE + STREET)
  const start = { x: mainStreetX, y: Math.floor(STREET / 2) }
  const goal = { x: mainStreetX, y: h - Math.floor(STREET / 2) - 1 }

  // Halfpipe / training course at end of route (classic Paperboy bonus stage vibe)
  const pipeY = h - STREET - 8
  const pipeX = Math.max(2, mainStreetX - 4)
  paintHalfpipe(tiles, pipeX, pipeY, 10, 7)
  const halfpipes = [
    { x: pipeX + 2, y: pipeY + 2 },
    { x: pipeX + 5, y: pipeY + 3 },
  ]

  // Ramps at each block intersection (skate flavor on the paper route)
  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx <= blocksX; bx++) {
      const ix = bx * (HOUSE + STREET) + Math.floor(STREET / 2)
      const iy = STREET + by * (HOUSE + STREET) + Math.floor(HOUSE / 2)
      if (tiles[iy]?.[ix] === 'road') {
        tiles[iy][ix] = 'ramp'
        ramps.push({ x: ix, y: iy })
      }
    }
  }

  // Grind rails along long stretches of the main street curb
  for (let y = STREET; y < h - STREET; y++) {
    if (y % 7 === 0) {
      const rx = mainStreetX - 2
      if (tiles[y]?.[rx] === 'road') tiles[y][rx] = 'rail'
    }
  }

  // Hazards on the road (cars / breaks) — Paperboy obstacles
  for (let y = STREET + 2; y < h - STREET - 2; y += 5) {
    for (let bx = 0; bx <= blocksX; bx++) {
      if (Math.random() > hazardDensity) continue
      const hx = bx * (HOUSE + STREET) + 1 + Math.floor(Math.random() * (STREET - 2))
      if (tiles[y]?.[hx] === 'road') {
        tiles[y][hx] = 'hazard'
        hazards.push({ x: hx, y })
      }
    }
  }

  // Tokens on the road (papers bundles / coins)
  const tokens: { x: number; y: number }[] = []
  const hearts: { x: number; y: number }[] = []
  for (let y = 2; y < h - 2; y++) {
    for (let x = 0; x < w; x++) {
      if (tiles[y][x] !== 'road' && tiles[y][x] !== 'sidewalk') continue
      if ((x + y * 3) % 11 === 0) tokens.push({ x, y })
      if ((x + y) % 53 === 0) hearts.push({ x, y })
    }
  }

  // Restock bags mid-route (extra delivery pickups as tokens already cover score)

  return {
    id,
    name,
    blurb: `${blurb} · ${w}×${h}`,
    width: w,
    height: h,
    start,
    goal,
    deliveries: deliveries.slice(0, spooky ? 28 : 36),
    tokens: tokens.slice(0, 80),
    hearts: hearts.slice(0, 6),
    ramps,
    halfpipes,
    hazards,
    tiles,
  }
}

function paintHalfpipe(tiles: TileType[][], cx: number, cy: number, pw: number, ph: number) {
  for (let y = cy; y < cy + ph && y < tiles.length; y++) {
    for (let x = cx; x < cx + pw && x < tiles[0].length; x++) {
      const edge = x === cx || x === cx + pw - 1 || y === cy || y === cy + ph - 1
      tiles[y][x] = edge ? 'halfpipe' : 'park'
    }
  }
  // entrance ramps from the street
  if (tiles[cy + Math.floor(ph / 2)]?.[cx - 1] === 'road') {
    tiles[cy + Math.floor(ph / 2)][cx - 1] = 'ramp'
  }
  if (tiles[cy + Math.floor(ph / 2)]?.[cx + pw] === 'road') {
    tiles[cy + Math.floor(ph / 2)][cx + pw] = 'ramp'
  }
  // lip rails
  for (let x = cx + 1; x < cx + pw - 1; x++) {
    if (tiles[cy]?.[x]) tiles[cy][x] = 'rail'
    if (tiles[cy + ph - 1]?.[x]) tiles[cy + ph - 1][x] = 'rail'
  }
}
