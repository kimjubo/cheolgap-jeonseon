export const COLS = 6;
export const ROWS = 10;
export const START_GOLD = 145;
export const START_LIVES = 20;
export const SELL_RATIO = 0.6;
export const PERFECT_BONUS = 25;
export const MAX_RANK = 3;
export const DMG_MUL = 1.42;
export const RATE_MUL = 0.8;
export const DMG_COST = [50, 90, 140];
export const RATE_COST = [45, 80, 125];

export const PATH: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, 1],
  [1, 2],
  [2, 2],
  [3, 2],
  [4, 2],
  [4, 3],
  [4, 4],
  [3, 4],
  [2, 4],
  [1, 4],
  [1, 5],
  [1, 6],
  [2, 6],
  [3, 6],
  [4, 6],
  [4, 7],
  [4, 8],
  [3, 8],
  [2, 8],
  [2, 9],
];

const PATH_KEY = new Set(PATH.map(([x, y]) => x + y * COLS));
const BLOCKED = new Set([0, 5, (ROWS - 1) * COLS, (ROWS - 1) * COLS + COLS - 1]);

export function isPath(x: number, y: number) {
  return PATH_KEY.has(x + y * COLS);
}

export function isBlocked(x: number, y: number) {
  return BLOCKED.has(x + y * COLS);
}

export type EnemyId = "claw" | "spit" | "shell" | "wing" | "titan";
export type TowerId = "rifle" | "flame" | "missile" | "siege";
export type ShotKind = "bullet" | "flame" | "missile" | "shell";
export type TargetMode = "first" | "close" | "strong";
export type Phase = "menu" | "prep" | "combat" | "victory" | "defeat";

export type EnemyDef = {
  name: string;
  hp: number;
  speed: number;
  gold: number;
  armor: number;
  flying: boolean;
  leak: number;
  scale: number;
};

export const ENEMIES: Record<EnemyId, EnemyDef> = {
  claw: { name: "갈퀴충", hp: 30, speed: 1.18, gold: 6, armor: 0, flying: false, leak: 1, scale: 1.35 },
  spit: { name: "침충", hp: 82, speed: 0.72, gold: 12, armor: 0, flying: false, leak: 1, scale: 1.5 },
  shell: { name: "갑각충", hp: 175, speed: 0.48, gold: 18, armor: 0.35, flying: false, leak: 2, scale: 1.58 },
  wing: { name: "익충", hp: 52, speed: 1.0, gold: 15, armor: 0, flying: true, leak: 1, scale: 1.42 },
  titan: { name: "거대충", hp: 1280, speed: 0.36, gold: 120, armor: 0.2, flying: false, leak: 5, scale: 2.15 },
};

export type TowerDef = {
  name: string;
  short: string;
  cost: number;
  range: number;
  damage: number;
  interval: number;
  shot: ShotKind;
  shotSpeed: number;
  splash: number;
  vsFly: number;
  armorPen: number;
  blurb: string;
  special: string;
};

export const TOWERS: Record<TowerId, TowerDef> = {
  rifle: {
    name: "소총 요새",
    short: "소총",
    cost: 50,
    range: 1.65,
    damage: 11,
    interval: 0.36,
    shot: "bullet",
    shotSpeed: 9,
    splash: 0,
    vsFly: 1,
    armorPen: 0,
    blurb: "연사",
    special: "선두를 빠르게 깎습니다.",
  },
  flame: {
    name: "화염 포대",
    short: "화염",
    cost: 80,
    range: 1.2,
    damage: 7,
    interval: 0.16,
    shot: "flame",
    shotSpeed: 7.2,
    splash: 0.5,
    vsFly: 0.45,
    armorPen: 0,
    blurb: "광역",
    special: "가까운 무리를 태웁니다. 익충에게 약합니다.",
  },
  missile: {
    name: "추적 포탑",
    short: "추적",
    cost: 115,
    range: 2.5,
    damage: 28,
    interval: 1.05,
    shot: "missile",
    shotSpeed: 4.6,
    splash: 0.15,
    vsFly: 1.75,
    armorPen: 0,
    blurb: "대공",
    special: "유도탄. 익충에게 강합니다.",
  },
  siege: {
    name: "곡사 전차",
    short: "곡사",
    cost: 175,
    range: 3.05,
    damage: 52,
    interval: 1.9,
    shot: "shell",
    shotSpeed: 3.5,
    splash: 0.82,
    vsFly: 1,
    armorPen: 0.55,
    blurb: "포격",
    special: "넓은 폭발. 장갑을 상당 부분 무시합니다.",
  },
};

export const TOWER_ORDER: TowerId[] = ["rifle", "flame", "missile", "siege"];

export const TARGET_LABEL: Record<TargetMode, string> = {
  first: "선두",
  close: "근접",
  strong: "강적",
};

export type WaveGroup = { type: EnemyId; count: number; every: number; delay?: number };

export const WAVES: WaveGroup[][] = [
  [{ type: "claw", count: 8, every: 0.75 }],
  [{ type: "claw", count: 12, every: 0.42 }],
  [
    { type: "claw", count: 6, every: 0.5 },
    { type: "spit", count: 4, every: 1.05, delay: 1.4 },
  ],
  [
    { type: "spit", count: 7, every: 0.82 },
    { type: "claw", count: 8, every: 0.36, delay: 0.3 },
  ],
  [
    { type: "shell", count: 5, every: 1.15 },
    { type: "claw", count: 8, every: 0.4, delay: 0.6 },
  ],
  [
    { type: "wing", count: 6, every: 0.78 },
    { type: "spit", count: 5, every: 0.7, delay: 1.1 },
  ],
  [
    { type: "shell", count: 6, every: 0.95 },
    { type: "wing", count: 5, every: 0.72, delay: 0.8 },
  ],
  [
    { type: "claw", count: 14, every: 0.28 },
    { type: "spit", count: 6, every: 0.58, delay: 0.8 },
    { type: "wing", count: 5, every: 0.7, delay: 1.6 },
  ],
  [
    { type: "shell", count: 7, every: 0.78 },
    { type: "wing", count: 7, every: 0.52, delay: 0.5 },
    { type: "spit", count: 6, every: 0.48, delay: 1.2 },
  ],
  [
    { type: "titan", count: 1, every: 0.4, delay: 2.4 },
    { type: "claw", count: 10, every: 0.3 },
    { type: "shell", count: 4, every: 1.05, delay: 1.2 },
    { type: "wing", count: 4, every: 0.66, delay: 2.8 },
  ],
  [
    { type: "claw", count: 16, every: 0.26 },
    { type: "spit", count: 8, every: 0.55, delay: 0.8 },
  ],
  [
    { type: "shell", count: 8, every: 0.85 },
    { type: "wing", count: 10, every: 0.48, delay: 0.6 },
  ],
  [
    { type: "wing", count: 12, every: 0.42 },
    { type: "spit", count: 8, every: 0.5, delay: 0.4 },
    { type: "claw", count: 10, every: 0.3, delay: 1.2 },
  ],
  [
    { type: "titan", count: 1, every: 0.4, delay: 1.6 },
    { type: "shell", count: 6, every: 0.9 },
    { type: "wing", count: 8, every: 0.5, delay: 0.7 },
  ],
  [
    { type: "shell", count: 10, every: 0.7 },
    { type: "spit", count: 10, every: 0.42, delay: 0.5 },
  ],
  [
    { type: "claw", count: 20, every: 0.22 },
    { type: "shell", count: 6, every: 0.85, delay: 1.1 },
  ],
  [
    { type: "wing", count: 14, every: 0.38 },
    { type: "shell", count: 6, every: 0.8, delay: 0.5 },
    { type: "spit", count: 8, every: 0.46, delay: 1.4 },
  ],
  [
    { type: "titan", count: 2, every: 3.2, delay: 1.8 },
    { type: "claw", count: 12, every: 0.28 },
    { type: "wing", count: 6, every: 0.55, delay: 1 },
  ],
  [
    { type: "shell", count: 8, every: 0.72 },
    { type: "wing", count: 12, every: 0.4, delay: 0.4 },
    { type: "titan", count: 1, every: 0.4, delay: 2.2 },
  ],
  [
    { type: "titan", count: 2, every: 2.8, delay: 1.2 },
    { type: "shell", count: 8, every: 0.7 },
    { type: "wing", count: 10, every: 0.42, delay: 0.6 },
    { type: "claw", count: 14, every: 0.24, delay: 0.3 },
  ],
];

export function rangeLabel(range: number) {
  if (range < 1.35) return "초근접";
  if (range < 1.9) return "근거리";
  if (range < 2.7) return "중거리";
  return "원거리";
}
