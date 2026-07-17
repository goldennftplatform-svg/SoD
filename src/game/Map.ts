import { palette } from './brand'

export type TileType = 'grass' | 'road' | 'sidewalk' | 'ramp' | 'rail' | 'hazard' | 'building' | 'water' | 'dirt'

export interface MapDef {
  id: string
  name: string
  width: number
  height: number
  start: { x: number; y: number }
  goal: { x: number; y: number }
  deliveries: { x: number; y: number }[]
  tokens: { x: number; y: number }[]
  hearts: { x: number; y: number }[]
  ramps: { x: number; y: number }[]
  hazards: { x: number; y: number }[]
  tiles: TileType[][]
}

export function tileColor(t: TileType): string {
  switch (t) {
    case 'grass':
      return palette.lightGreen
    case 'road':
      return '#6d6d6d'
    case 'sidewalk':
      return '#c8bca0'
    case 'ramp':
      return palette.brown
    case 'rail':
      return '#9ca3a8'
    case 'hazard':
      return palette.gold
    case 'building':
      return '#7d8c6a'
    case 'water':
      return '#3b6d8f'
    case 'dirt':
      return '#a88b65'
    default:
      return palette.cream
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

function makeNeighborhood(): MapDef {
  const w = 24
  const h = 24
  const tiles: TileType[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => 'grass'))

  // carve roads in a loop
  for (let x = 2; x < 22; x++) {
    tiles[4][x] = 'road'
    tiles[5][x] = 'road'
    tiles[18][x] = 'road'
    tiles[19][x] = 'road'
  }
  for (let y = 4; y < 20; y++) {
    tiles[y][2] = 'road'
    tiles[y][3] = 'road'
    tiles[y][20] = 'road'
    tiles[y][21] = 'road'
  }
  // sidewalks
  for (let x = 2; x < 22; x++) {
    tiles[3][x] = 'sidewalk'
    tiles[6][x] = 'sidewalk'
    tiles[17][x] = 'sidewalk'
    tiles[20][x] = 'sidewalk'
  }
  for (let y = 4; y < 20; y++) {
    tiles[y][1] = 'sidewalk'
    tiles[y][4] = 'sidewalk'
    tiles[y][19] = 'sidewalk'
    tiles[y][22] = 'sidewalk'
  }
  // buildings inside blocks
  for (let y = 7; y < 17; y += 4) {
    for (let x = 7; x < 17; x += 4) {
      tiles[y][x] = 'building'
      tiles[y][x + 1] = 'building'
      tiles[y + 1][x] = 'building'
      tiles[y + 1][x + 1] = 'building'
    }
  }
  // central skate park ramp
  tiles[11][11] = 'ramp'
  tiles[11][12] = 'ramp'
  tiles[12][11] = 'ramp'
  tiles[12][12] = 'ramp'

  return {
    id: 'neighborhood',
    name: 'Neighborhood',
    width: w,
    height: h,
    start: { x: 3, y: 3 },
    goal: { x: 20, y: 18 },
    deliveries: [
      { x: 6, y: 3 },
      { x: 14, y: 3 },
      { x: 3, y: 10 },
      { x: 3, y: 16 },
      { x: 20, y: 10 },
      { x: 20, y: 16 },
      { x: 9, y: 20 },
      { x: 17, y: 20 },
    ],
    tokens: [
      { x: 8, y: 8 },
      { x: 15, y: 9 },
      { x: 10, y: 15 },
      { x: 16, y: 14 },
      { x: 11, y: 11 },
      { x: 12, y: 12 },
      { x: 5, y: 5 },
      { x: 18, y: 17 },
    ],
    hearts: [{ x: 2, y: 18 }, { x: 21, y: 4 }],
    ramps: [
      { x: 11, y: 11 },
      { x: 12, y: 12 },
    ],
    hazards: [
      { x: 7, y: 4 },
      { x: 18, y: 5 },
      { x: 4, y: 14 },
      { x: 19, y: 15 },
    ],
    tiles,
  }
}

function makeDowntown(): MapDef {
  const w = 28
  const h = 28
  const tiles: TileType[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => 'sidewalk'))

  for (let y = 2; y < 26; y++) {
    for (let x = 2; x < 26; x++) {
      tiles[y][x] = (x + y) % 7 === 0 ? 'hazard' : 'road'
    }
  }
  // cross streets
  for (let x = 2; x < 26; x++) tiles[8][x] = 'road'
  for (let x = 2; x < 26; x++) tiles[18][x] = 'road'
  for (let y = 2; y < 26; y++) tiles[y][8] = 'road'
  for (let y = 2; y < 26; y++) tiles[y][18] = 'road'
  // building blocks
  for (let y = 4; y < 24; y += 6) {
    for (let x = 4; x < 24; x += 6) {
      for (let dy = 0; dy < 3; dy++) {
        for (let dx = 0; dx < 3; dx++) {
          tiles[y + dy][x + dx] = 'building'
        }
      }
    }
  }
  // rails
  tiles[13][13] = 'rail'
  tiles[14][14] = 'rail'
  tiles[15][15] = 'rail'

  return {
    id: 'downtown',
    name: 'Downtown',
    width: w,
    height: h,
    start: { x: 3, y: 3 },
    goal: { x: 23, y: 23 },
    deliveries: [
      { x: 6, y: 5 },
      { x: 12, y: 5 },
      { x: 22, y: 5 },
      { x: 5, y: 12 },
      { x: 22, y: 16 },
      { x: 6, y: 22 },
      { x: 16, y: 22 },
      { x: 22, y: 22 },
    ],
    tokens: Array.from({ length: 14 }, () => ({
      x: 3 + Math.floor(Math.random() * 22),
      y: 3 + Math.floor(Math.random() * 22),
    })),
    hearts: [{ x: 2, y: 2 }, { x: 25, y: 25 }],
    ramps: [{ x: 13, y: 12 }, { x: 16, y: 15 }],
    hazards: [
      { x: 10, y: 8 },
      { x: 8, y: 10 },
      { x: 20, y: 18 },
      { x: 18, y: 20 },
      { x: 14, y: 14 },
    ],
    tiles,
  }
}

function makeGraveyard(): MapDef {
  const w = 26
  const h = 26
  const tiles: TileType[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => 'dirt'))

  // winding road
  for (let x = 2; x < 24; x++) tiles[12][x] = 'road'
  for (let y = 2; y < 12; y++) tiles[y][22] = 'road'
  for (let y = 12; y < 24; y++) tiles[y][4] = 'road'
  for (let x = 4; x < 22; x++) tiles[22][x] = 'road'
  // ramps over tombs
  tiles[6][6] = 'ramp'
  tiles[7][7] = 'ramp'
  tiles[18][18] = 'ramp'
  tiles[19][19] = 'ramp'
  // water hazards
  for (let x = 10; x < 16; x++) {
    for (let y = 10; y < 16; y++) {
      tiles[y][x] = 'water'
    }
  }

  return {
    id: 'graveyard',
    name: 'Graveyard Ramp',
    width: w,
    height: h,
    start: { x: 3, y: 12 },
    goal: { x: 22, y: 22 },
    deliveries: [
      { x: 6, y: 12 },
      { x: 14, y: 12 },
      { x: 22, y: 6 },
      { x: 4, y: 18 },
      { x: 12, y: 22 },
      { x: 20, y: 22 },
    ],
    tokens: [
      { x: 6, y: 6 },
      { x: 19, y: 19 },
      { x: 13, y: 13 },
      { x: 8, y: 18 },
      { x: 18, y: 8 },
      { x: 22, y: 3 },
    ],
    hearts: [{ x: 2, y: 22 }, { x: 23, y: 2 }],
    ramps: [
      { x: 6, y: 6 },
      { x: 7, y: 7 },
      { x: 18, y: 18 },
      { x: 19, y: 19 },
    ],
    hazards: [
      { x: 11, y: 11 },
      { x: 14, y: 14 },
      { x: 9, y: 13 },
      { x: 15, y: 12 },
      { x: 18, y: 12 },
    ],
    tiles,
  }
}
