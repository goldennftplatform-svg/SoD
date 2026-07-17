import { palette } from './brand'

export type TileType =
  | 'grass'
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

export function tileColor(t: TileType): string {
  switch (t) {
    case 'grass':
      return palette.lightGreen
    case 'road':
      return '#5a5a5a'
    case 'sidewalk':
      return '#c8bca0'
    case 'ramp':
      return palette.brown
    case 'halfpipe':
      return '#3d3d3d'
    case 'rail':
      return '#b8c0c8'
    case 'hazard':
      return palette.gold
    case 'building':
      return '#6f7d5e'
    case 'water':
      return '#3b6d8f'
    case 'dirt':
      return '#a88b65'
    case 'park':
      return '#4a8f52'
    default:
      return palette.cream
  }
}

export function tileHeight(t: TileType): number {
  switch (t) {
    case 'building':
      return 36
    case 'halfpipe':
      return 28
    case 'ramp':
      return 14
    case 'rail':
      return 10
    default:
      return 0
  }
}

export function createMap(id: string): MapDef {
  switch (id) {
    case 'downtown':
      return makeDowntown()
    case 'graveyard':
      return makeGraveyard()
    case 'neighborhood':
    default:
      return makeNeighborhood()
  }
}

function blank(w: number, h: number, fill: TileType = 'grass'): TileType[][] {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => fill))
}

function roadH(tiles: TileType[][], y: number, x0: number, x1: number) {
  for (let x = x0; x <= x1; x++) {
    tiles[y][x] = 'road'
    if (y + 1 < tiles.length) tiles[y + 1][x] = 'road'
  }
}

function roadV(tiles: TileType[][], x: number, y0: number, y1: number) {
  for (let y = y0; y <= y1; y++) {
    tiles[y][x] = 'road'
    if (x + 1 < tiles[0].length) tiles[y][x + 1] = 'road'
  }
}

function sidewalkAroundRoad(tiles: TileType[][]) {
  const h = tiles.length
  const w = tiles[0].length
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (tiles[y][x] !== 'grass' && tiles[y][x] !== 'dirt' && tiles[y][x] !== 'park') continue
      const nearRoad =
        tiles[y - 1][x] === 'road' ||
        tiles[y + 1][x] === 'road' ||
        tiles[y][x - 1] === 'road' ||
        tiles[y][x + 1] === 'road'
      if (nearRoad) tiles[y][x] = 'sidewalk'
    }
  }
}

function blockBuildings(tiles: TileType[][], x0: number, y0: number, bw: number, bh: number) {
  for (let y = y0; y < y0 + bh; y++) {
    for (let x = x0; x < x0 + bw; x++) {
      if (tiles[y]?.[x] === 'grass' || tiles[y]?.[x] === 'sidewalk' || tiles[y]?.[x] === 'dirt') {
        tiles[y][x] = 'building'
      }
    }
  }
}

function paintHalfpipe(tiles: TileType[][], cx: number, cy: number) {
  // U-shaped halfpipe bowl ~8x6
  for (let y = cy; y < cy + 6; y++) {
    for (let x = cx; x < cx + 8; x++) {
      if (!tiles[y]?.[x]) continue
      const edge = x === cx || x === cx + 7 || y === cy || y === cy + 5
      tiles[y][x] = edge ? 'halfpipe' : 'park'
    }
  }
  // transition ramps into the pipe
  tiles[cy + 2][cx - 1] = 'ramp'
  tiles[cy + 3][cx - 1] = 'ramp'
  tiles[cy + 2][cx + 8] = 'ramp'
  tiles[cy + 3][cx + 8] = 'ramp'
  // grind rail across the lip
  for (let x = cx + 1; x < cx + 7; x++) {
    tiles[cy][x] = 'rail'
    tiles[cy + 5][x] = 'rail'
  }
}

function scatter(
  count: number,
  w: number,
  h: number,
  avoid: Set<string>,
  prefer?: (x: number, y: number) => boolean,
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  let tries = 0
  while (out.length < count && tries < count * 40) {
    tries++
    const x = 2 + Math.floor(Math.random() * (w - 4))
    const y = 2 + Math.floor(Math.random() * (h - 4))
    const key = `${x},${y}`
    if (avoid.has(key)) continue
    if (prefer && !prefer(x, y)) continue
    avoid.add(key)
    out.push({ x, y })
  }
  return out
}

function makeNeighborhood(): MapDef {
  const w = 48
  const h = 48
  const tiles = blank(w, h, 'grass')

  // big street grid
  for (let i = 0; i < 5; i++) {
    roadH(tiles, 4 + i * 9, 2, w - 3)
    roadV(tiles, 4 + i * 9, 2, h - 3)
  }
  sidewalkAroundRoad(tiles)

  // housing blocks
  for (let by = 7; by < h - 8; by += 9) {
    for (let bx = 7; bx < w - 8; bx += 9) {
      blockBuildings(tiles, bx, by, 3, 3)
    }
  }

  // SKATE PARK / HALF PIPE — centerpiece
  paintHalfpipe(tiles, 20, 20)
  // extra mini ramps around town
  const rampSpots = [
    { x: 10, y: 10 },
    { x: 34, y: 12 },
    { x: 12, y: 34 },
    { x: 36, y: 36 },
    { x: 28, y: 8 },
    { x: 8, y: 28 },
  ]
  rampSpots.forEach((r) => {
    tiles[r.y][r.x] = 'ramp'
    tiles[r.y][r.x + 1] = 'ramp'
  })

  // alley rails
  for (let x = 14; x < 20; x++) tiles[15][x] = 'rail'
  for (let y = 30; y < 36; y++) tiles[y][32] = 'rail'

  const avoid = new Set<string>()
  ;[
    [3, 3],
    [44, 44],
    [20, 20],
  ].forEach(([x, y]) => avoid.add(`${x},${y}`))

  const deliveries = [
    { x: 6, y: 3 },
    { x: 15, y: 3 },
    { x: 24, y: 3 },
    { x: 33, y: 3 },
    { x: 42, y: 6 },
    { x: 3, y: 12 },
    { x: 3, y: 21 },
    { x: 3, y: 30 },
    { x: 3, y: 39 },
    { x: 12, y: 44 },
    { x: 21, y: 44 },
    { x: 30, y: 44 },
    { x: 39, y: 44 },
    { x: 44, y: 18 },
    { x: 44, y: 27 },
    { x: 44, y: 36 },
    { x: 18, y: 18 },
    { x: 27, y: 27 },
  ]
  deliveries.forEach((d) => avoid.add(`${d.x},${d.y}`))

  const tokens = scatter(40, w, h, avoid, (x, y) => {
    const t = tiles[y][x]
    return t === 'road' || t === 'sidewalk' || t === 'park' || t === 'rail' || t === 'ramp'
  })
  const hearts = scatter(4, w, h, avoid)
  const hazards = [
    { x: 9, y: 5 },
    { x: 18, y: 14 },
    { x: 27, y: 5 },
    { x: 36, y: 23 },
    { x: 14, y: 32 },
    { x: 41, y: 14 },
    { x: 23, y: 41 },
    { x: 32, y: 32 },
    { x: 8, y: 23 },
    { x: 40, y: 40 },
  ]

  return {
    id: 'neighborhood',
    name: 'Neighborhood',
    blurb: '48x48 streets + halfpipe park',
    width: w,
    height: h,
    start: { x: 3, y: 3 },
    goal: { x: 44, y: 44 },
    deliveries,
    tokens,
    hearts,
    ramps: rampSpots,
    halfpipes: [
      { x: 20, y: 20 },
      { x: 24, y: 22 },
      { x: 27, y: 24 },
    ],
    hazards,
    tiles,
  }
}

function makeDowntown(): MapDef {
  const w = 56
  const h = 56
  const tiles = blank(w, h, 'sidewalk')

  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      tiles[y][x] = 'road'
    }
  }
  // dense building blocks
  for (let by = 5; by < h - 8; by += 8) {
    for (let bx = 5; bx < w - 8; bx += 8) {
      blockBuildings(tiles, bx, by, 4, 4)
    }
  }
  // arterial roads keep clear
  for (let i = 0; i < 4; i++) {
    roadH(tiles, 8 + i * 12, 2, w - 3)
    roadV(tiles, 8 + i * 12, 2, h - 3)
  }

  // mega halfpipe plaza
  paintHalfpipe(tiles, 24, 24)
  paintHalfpipe(tiles, 38, 10)

  const rampSpots = [
    { x: 12, y: 12 },
    { x: 20, y: 20 },
    { x: 40, y: 40 },
    { x: 16, y: 40 },
    { x: 40, y: 16 },
    { x: 30, y: 8 },
    { x: 8, y: 30 },
  ]
  rampSpots.forEach((r) => {
    tiles[r.y][r.x] = 'ramp'
  })

  // long grind lines
  for (let x = 10; x < 22; x++) tiles[18][x] = 'rail'
  for (let y = 30; y < 45; y++) tiles[y][28] = 'rail'

  const avoid = new Set<string>(['3,3', '52,52'])
  const deliveries = scatter(24, w, h, avoid, (x, y) => tiles[y][x] === 'sidewalk' || tiles[y][x] === 'road')
  const tokens = scatter(55, w, h, avoid, (x, y) => tiles[y][x] !== 'building' && tiles[y][x] !== 'water')
  const hearts = scatter(5, w, h, avoid)
  const hazards = scatter(16, w, h, avoid, (x, y) => tiles[y][x] === 'road')

  return {
    id: 'downtown',
    name: 'Downtown',
    blurb: '56x56 mega grid, twin halfpipes',
    width: w,
    height: h,
    start: { x: 3, y: 3 },
    goal: { x: 52, y: 52 },
    deliveries,
    tokens,
    hearts,
    ramps: rampSpots,
    halfpipes: [
      { x: 24, y: 24 },
      { x: 38, y: 10 },
    ],
    hazards,
    tiles,
  }
}

function makeGraveyard(): MapDef {
  const w = 52
  const h = 52
  const tiles = blank(w, h, 'dirt')

  // winding cemetery roads
  roadH(tiles, 8, 2, 48)
  roadH(tiles, 24, 2, 48)
  roadH(tiles, 40, 2, 48)
  roadV(tiles, 8, 2, 48)
  roadV(tiles, 26, 2, 48)
  roadV(tiles, 42, 2, 48)
  sidewalkAroundRoad(tiles)

  // tombstone building clumps
  for (let i = 0; i < 12; i++) {
    const bx = 4 + (i % 4) * 12
    const by = 4 + Math.floor(i / 4) * 14
    blockBuildings(tiles, bx + 2, by + 2, 2, 2)
  }

  // water crypt
  for (let y = 18; y < 24; y++) {
    for (let x = 18; x < 24; x++) tiles[y][x] = 'water'
  }

  // GRAVEYARD HALFPIPE under the bridge vibe
  paintHalfpipe(tiles, 30, 28)
  // second bowl
  paintHalfpipe(tiles, 10, 32)

  const rampSpots = [
    { x: 12, y: 10 },
    { x: 36, y: 12 },
    { x: 20, y: 36 },
    { x: 44, y: 44 },
    { x: 6, y: 44 },
  ]
  rampSpots.forEach((r) => {
    tiles[r.y][r.x] = 'ramp'
    if (tiles[r.y][r.x + 1]) tiles[r.y][r.x + 1] = 'ramp'
  })

  const avoid = new Set<string>(['4,8', '46,46'])
  const deliveries = scatter(16, w, h, avoid, (x, y) => tiles[y][x] === 'sidewalk' || tiles[y][x] === 'road')
  const tokens = scatter(45, w, h, avoid, (x, y) => tiles[y][x] !== 'building' && tiles[y][x] !== 'water')
  const hearts = scatter(4, w, h, avoid)
  const hazards = scatter(14, w, h, avoid)

  return {
    id: 'graveyard',
    name: 'Graveyard Ramp',
    blurb: '52x52 crypt roads + twin bowls',
    width: w,
    height: h,
    start: { x: 4, y: 8 },
    goal: { x: 46, y: 46 },
    deliveries,
    tokens,
    hearts,
    ramps: rampSpots,
    halfpipes: [
      { x: 30, y: 28 },
      { x: 10, y: 32 },
    ],
    hazards,
    tiles,
  }
}
