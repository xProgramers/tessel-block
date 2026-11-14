// Poliminós descritos como padrões de texto: linhas separadas por "/", "X" = bloco.
const PATTERNS = [
  ['X', 2],
  ['XX', 3], ['X/X', 3],
  ['XXX', 3], ['X/X/X', 3],
  ['XXXX', 2], ['X/X/X/X', 2],
  ['XXXXX', 1], ['X/X/X/X/X', 1],
  ['XX/XX', 4],
  ['XXX/XXX/XXX', 1],
  ['XXX/XXX', 1.4], ['XX/XX/XX', 1.4],
  // L pequeno (2x2 sem um canto)
  ['XX/X.', 1.4], ['XX/.X', 1.4], ['X./XX', 1.4], ['.X/XX', 1.4],
  // L / J
  ['X./X./XX', 1], ['.X/.X/XX', 1], ['XX/X./X.', 1], ['XX/.X/.X', 1],
  ['XXX/X..', 1], ['XXX/..X', 1], ['X../XXX', 1], ['..X/XXX', 1],
  // L grande (canto 3x3)
  ['X../X../XXX', 0.7], ['..X/..X/XXX', 0.7], ['XXX/X../X..', 0.7], ['XXX/..X/..X', 0.7],
  // T
  ['XXX/.X.', 1], ['.X./XXX', 1], ['X./XX/X.', 1], ['.X/XX/.X', 1],
  // Z / S
  ['XX./.XX', 1], ['.XX/XX.', 1], ['X./XX/.X', 1], ['.X/XX/X.', 1],
];

const SHAPES = PATTERNS.map(([pattern, weight]) => {
  const rows = pattern.split('/');
  const cells = [];
  rows.forEach((row, r) => [...row].forEach((ch, c) => ch === 'X' && cells.push([r, c])));
  return { cells, h: rows.length, w: Math.max(...rows.map((r) => r.length)), weight };
});

const TOTAL_WEIGHT = SHAPES.reduce((s, x) => s + x.weight, 0);
let nextId = 1;

export const COLOR_COUNT = 7;

export function randomPiece() {
  let roll = Math.random() * TOTAL_WEIGHT;
  let shape = SHAPES[0];
  for (const s of SHAPES) {
    roll -= s.weight;
    if (roll <= 0) { shape = s; break; }
  }
  return {
    id: nextId++,
    cells: shape.cells,
    w: shape.w,
    h: shape.h,
    color: Math.floor(Math.random() * COLOR_COUNT),
  };
}
