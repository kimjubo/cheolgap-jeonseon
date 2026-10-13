const COLS = 6, ROWS = 10, START_GOLD = 145, START_LIVES = 20, SELL_RATIO = 0.6, PERFECT_BONUS = 25, MAX_RANK = 3;
const DMG_MUL = 1.42, RATE_MUL = 0.8, DMG_COST = [50, 90, 140], RATE_COST = [45, 80, 125], COST_STEP = 0.05;
function scaledCost(base, n) { return Math.max(1, Math.round(base * (1 + COST_STEP * n))); }
const ENEMY_COUNT_MUL = 2, ENEMY_HP_MUL = 1.3, ENEMY_SPEED_STEP = 0.02;
const DIFF_HP = { easy: 1, normal: 1.25, hard: 1.6 };
const PATH = [[1,0],[1,1],[1,2],[2,2],[3,2],[4,2],[4,3],[4,4],[3,4],[2,4],[1,4],[1,5],[1,6],[2,6],[3,6],[4,6],[4,7],[4,8],[3,8],[2,8],[2,9]];
const PATH_KEY = new Set(PATH.map(([x, y]) => x + y * COLS));
const BLOCKED = new Set([0, 5, (ROWS - 1) * COLS, (ROWS - 1) * COLS + COLS - 1]);
const isPath = (x, y) => PATH_KEY.has(x + y * COLS);
const isBlocked = (x, y) => BLOCKED.has(x + y * COLS);
const ENEMIES = {
  claw: { name: "갈퀴충", hp: 30, speed: 1.18, gold: 6, armor: 0, flying: false, leak: 1, scale: 1.35 },
  spit: { name: "침충", hp: 82, speed: 0.72, gold: 12, armor: 0, flying: false, leak: 1, scale: 1.5 },
  shell: { name: "갑각충", hp: 175, speed: 0.48, gold: 18, armor: 0.35, flying: false, leak: 2, scale: 1.58 },
  wing: { name: "익충", hp: 52, speed: 1, gold: 15, armor: 0, flying: true, leak: 1, scale: 1.42 },
  titan: { name: "거대충", hp: 1280, speed: 0.36, gold: 120, armor: 0.2, flying: false, leak: 5, scale: 2.15 },
};
const TOWERS = {
  rifle: { name: "소총 요새", short: "소총", cost: 50, range: 1.65, damage: 11, interval: 0.36, shot: "bullet", shotSpeed: 9, splash: 0, vsFly: 1, armorPen: 0, blurb: "연사", special: "선두를 빠르게 깎습니다." },
  flame: { name: "화염 포대", short: "화염", cost: 80, range: 1.2, damage: 7, interval: 0.16, shot: "flame", shotSpeed: 7.2, splash: 0.5, vsFly: 0.45, armorPen: 0, blurb: "광역", special: "가까운 무리를 태웁니다. 익충에게 약합니다." },
  missile: { name: "추적 포탑", short: "추적", cost: 115, range: 2.5, damage: 28, interval: 1.05, shot: "missile", shotSpeed: 4.6, splash: 0.15, vsFly: 1.75, armorPen: 0, blurb: "대공", special: "유도탄. 익충에게 강합니다." },
  siege: { name: "곡사 전차", short: "곡사", cost: 175, range: 3.05, damage: 52, interval: 1.9, shot: "shell", shotSpeed: 3.5, splash: 0.82, vsFly: 1, armorPen: 0.55, blurb: "포격", special: "넓은 폭발. 장갑을 상당 부분 무시합니다." },
};
const ORDER = ["rifle", "flame", "missile", "siege"];
const TARGET_LABEL = { first: "선두", close: "근접", strong: "강적" };
const WAVES = [
  [{ type: "claw", count: 8, every: 0.75 }],
  [{ type: "claw", count: 12, every: 0.42 }],
  [{ type: "claw", count: 6, every: 0.5 }, { type: "spit", count: 4, every: 1.05, delay: 1.4 }],
  [{ type: "spit", count: 7, every: 0.82 }, { type: "claw", count: 8, every: 0.36, delay: 0.3 }],
  [{ type: "shell", count: 5, every: 1.15 }, { type: "claw", count: 8, every: 0.4, delay: 0.6 }],
  [{ type: "wing", count: 6, every: 0.78 }, { type: "spit", count: 5, every: 0.7, delay: 1.1 }],
  [{ type: "shell", count: 6, every: 0.95 }, { type: "wing", count: 5, every: 0.72, delay: 0.8 }],
  [{ type: "claw", count: 14, every: 0.28 }, { type: "spit", count: 6, every: 0.58, delay: 0.8 }, { type: "wing", count: 5, every: 0.7, delay: 1.6 }],
  [{ type: "shell", count: 7, every: 0.78 }, { type: "wing", count: 7, every: 0.52, delay: 0.5 }, { type: "spit", count: 6, every: 0.48, delay: 1.2 }],
  [{ type: "titan", count: 1, every: 0.4, delay: 2.4 }, { type: "claw", count: 10, every: 0.3 }, { type: "shell", count: 4, every: 1.05, delay: 1.2 }, { type: "wing", count: 4, every: 0.66, delay: 2.8 }],
  [{ type: "claw", count: 16, every: 0.26 }, { type: "spit", count: 8, every: 0.55, delay: 0.8 }],
  [{ type: "shell", count: 8, every: 0.85 }, { type: "wing", count: 10, every: 0.48, delay: 0.6 }],
  [{ type: "wing", count: 12, every: 0.42 }, { type: "spit", count: 8, every: 0.5, delay: 0.4 }, { type: "claw", count: 10, every: 0.3, delay: 1.2 }],
  [{ type: "titan", count: 1, every: 0.4, delay: 1.6 }, { type: "shell", count: 6, every: 0.9 }, { type: "wing", count: 8, every: 0.5, delay: 0.7 }],
  [{ type: "shell", count: 10, every: 0.7 }, { type: "spit", count: 10, every: 0.42, delay: 0.5 }],
  [{ type: "claw", count: 20, every: 0.22 }, { type: "shell", count: 6, every: 0.85, delay: 1.1 }],
  [{ type: "wing", count: 14, every: 0.38 }, { type: "shell", count: 6, every: 0.8, delay: 0.5 }, { type: "spit", count: 8, every: 0.46, delay: 1.4 }],
  [{ type: "titan", count: 2, every: 3.2, delay: 1.8 }, { type: "claw", count: 12, every: 0.28 }, { type: "wing", count: 6, every: 0.55, delay: 1 }],
  [{ type: "shell", count: 8, every: 0.72 }, { type: "wing", count: 12, every: 0.4, delay: 0.4 }, { type: "titan", count: 1, every: 0.4, delay: 2.2 }],
  [{ type: "titan", count: 2, every: 2.8, delay: 1.2 }, { type: "shell", count: 8, every: 0.7 }, { type: "wing", count: 10, every: 0.42, delay: 0.6 }, { type: "claw", count: 14, every: 0.24, delay: 0.3 }],
].map((wave) => wave.map((group) => ({ ...group, count: group.count * ENEMY_COUNT_MUL })));
const pts = PATH.map(([gx, gy]) => ({ x: gx + 0.5, y: gy + 0.5 }));
const cum = [0];
for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
const PATH_TOTAL = cum[cum.length - 1];
function pointOnPath(dist) {
  if (dist <= 0) {
    const a = pts[0], b = pts[1], len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: a.x + ((b.x - a.x) / len) * dist, y: a.y + ((b.y - a.y) / len) * dist };
  }
  const d = Math.min(dist, PATH_TOTAL);
  let i = 0;
  while (i < cum.length - 2 && cum[i + 1] < d) i++;
  const a = pts[i], b = pts[i + 1], seg = cum[i + 1] - cum[i] || 1, t = (d - cum[i]) / seg;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
const SAVE_KEY = "cheolgap-play-v1";
function diffName(id) { return DIFF_HP[id] ? id : "easy"; }
function loadSave() {
  try {
    const p = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!p || p.version !== 1) return { version: 1, bestWave: 0, bestKills: 0, muted: false, difficulty: "easy" };
    return { version: 1, bestWave: p.bestWave | 0, bestKills: p.bestKills | 0, muted: !!p.muted, difficulty: diffName(p.difficulty) };
  } catch { return { version: 1, bestWave: 0, bestKills: 0, muted: false, difficulty: "easy" }; }
}
function writeSave(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch { /* ignore */ } }

let difficulty = "easy";
function newGame() {
  return { phase: "menu", difficulty, time: 0, gold: START_GOLD, lives: START_LIVES, waveCursor: 0, activeWave: -1, kills: 0, leaksThisWave: 0, boostNext: false, speed: 1, towers: [], enemies: [], shots: [], particles: [], floaters: [], puffs: [], jobs: [], flashes: [], selected: null, armed: null, hover: null, shake: 0, announce: null, nextId: 1 };
}
function towerRuntime(t) {
  const b = TOWERS[t.kind];
  return { ...b, damage: b.damage * DMG_MUL ** t.dmgRank, interval: b.interval * RATE_MUL ** t.rateRank };
}
const refundOf = (t) => Math.floor(t.invested * SELL_RATIO);
const occupied = (g, x, y) => g.towers.find((t) => t.gx === x && t.gy === y) || null;
function canBuild(g, x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS && !isPath(x, y) && !isBlocked(x, y) && !occupied(g, x, y); }
function burst(g, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    if (g.particles.length > 160) return;
    const a = Math.random() * Math.PI * 2, s = speed * (0.35 + Math.random() * 0.75), life = 0.28 + Math.random() * 0.28;
    g.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, grav: 0.35, life, max: life, size: 0.05 + Math.random() * 0.07, color });
  }
}
function floater(g, x, y, text, color) {
  if (g.floaters.length > 28) g.floaters.shift();
  g.floaters.push({ x, y, text, life: 0.9, max: 0.9, color });
}
function deal(g, e, raw, pen, vsFly) {
  if (!e.alive) return;
  const dmg = raw * (e.flying ? vsFly : 1) * (1 - e.armor * (1 - pen));
  e.hp -= dmg; e.flash = 0.1;
  if (e.hp <= 0) {
    e.alive = false; g.gold += e.gold; g.kills += 1;
    burst(g, e.x, e.y, e.flying ? "#c6f25a" : "#d6457a", e.kind === "titan" ? 22 : 8, 1.4);
    floater(g, e.x, e.y - 0.2, "+" + e.gold, "#f0b429");
    sfx.kill();
  }
}
function leak(g, e) {
  e.alive = false;
  if (g.phase === "defeat") return;
  g.lives -= e.leak; g.leaksThisWave += 1; g.shake = Math.max(g.shake, e.leak >= 5 ? 14 : 7);
  const end = pointOnPath(PATH_TOTAL);
  floater(g, end.x, end.y - 0.4, "-" + e.leak, "#d6457a");
  sfx.leak();
  if (g.lives <= 0) { g.lives = 0; g.phase = "defeat"; g.announce = { text: "전선 붕괴", life: 2, max: 2 }; sfx.lose(); }
}
function pickTarget(g, t, range) {
  const tx = t.gx + 0.5, ty = t.gy + 0.5, r2 = range * range;
  let best = null, score = -Infinity;
  for (const e of g.enemies) {
    if (!e.alive || e.pathDist < 0) continue;
    const d2 = (e.x - tx) ** 2 + (e.y - ty) ** 2;
    if (d2 > r2) continue;
    const s = t.target === "first" ? e.pathDist : t.target === "close" ? -d2 : e.hp;
    if (s > score) { best = e; score = s; }
  }
  return best;
}
function aimPoint(e, sx, sy, shotSpeed) {
  let along = Math.max(0, e.pathDist), pos = pointOnPath(along);
  for (let i = 0; i < 2; i++) { along = e.pathDist + e.speed * (Math.hypot(pos.x - sx, pos.y - sy) / shotSpeed); pos = pointOnPath(along); }
  return pos;
}
function spawnEnemy(g, kind) {
  const def = ENEMIES[kind];
  let queue = 0;
  for (const e of g.enemies) if (e.alive && e.pathDist < 0.45) queue++;
  const pathDist = -queue * 0.42, pos = pointOnPath(pathDist), wave = Math.max(0, g.activeWave);
  const hp = Math.max(1, Math.round(def.hp * ENEMY_HP_MUL * (DIFF_HP[g.difficulty] || 1) * (wave < 9 ? 1 : 1 + (wave - 9) * 0.11)));
  g.enemies.push({ id: g.nextId++, kind, hp, maxHp: hp, speed: def.speed * (1 + ENEMY_SPEED_STEP * wave), gold: Math.max(1, Math.round(def.gold * (1 + Math.max(0, wave - 8) * 0.07))), armor: def.armor, flying: def.flying, leak: def.leak, pathDist, x: pos.x, y: pos.y, alive: true, flash: 0 });
  if (kind === "titan") { g.shake = Math.max(g.shake, 10); g.announce = { text: "거대충 접근", life: 1.7, max: 1.7 }; }
}
function fire(g, t) {
  const st = towerRuntime(t), target = pickTarget(g, t, st.range);
  if (!target) return;
  const sx = t.gx + 0.5, sy = t.gy + 0.5;
  const aim = st.shot === "missile" ? { x: target.x, y: target.y } : aimPoint(target, sx, sy, st.shotSpeed);
  const dx = aim.x - sx, dy = aim.y - sy, dist = Math.hypot(dx, dy) || 0.001;
  if (g.shots.length > 90) g.shots.shift();
  g.shots.push({ kind: st.shot, x: sx, y: sy, vx: (dx / dist) * st.shotSpeed, vy: (dy / dist) * st.shotSpeed, tx: aim.x, ty: aim.y, speed: st.shotSpeed, damage: st.damage, splash: st.splash, armorPen: st.armorPen, vsFly: st.vsFly, targetId: target.id, life: 3.2, traveled: 0, total: dist });
  t.recoil = 1; t.cooldown += st.interval;
  burst(g, sx, sy - 0.05, st.shot === "flame" ? "#ff8a3d" : "#9fd4ff", 3, 0.8);
  sfx.shot(st.shot);
}
function explode(g, s) {
  const rad = s.splash > 0 ? s.splash : 0.3;
  for (const e of g.enemies) {
    if (!e.alive) continue;
    const d = Math.hypot(e.x - s.x, e.y - s.y);
    if (d > rad) continue;
    deal(g, e, s.damage * (s.splash > 0 ? 1 - (d / rad) * 0.5 : 1), s.armorPen, s.vsFly);
  }
  if (g.puffs.length < 36) g.puffs.push({ x: s.x, y: s.y, life: 0.28, max: 0.28, size: s.kind === "shell" ? 1.15 : s.kind === "flame" ? 0.7 : 0.48 });
  burst(g, s.x, s.y, s.kind === "shell" ? "#ffb15a" : s.kind === "flame" ? "#ff8a3d" : "#c6f25a", s.kind === "shell" ? 12 : 5, s.kind === "shell" ? 1.8 : 1);
  if (s.kind === "shell") g.shake = Math.max(g.shake, 4.5);
  s.life = -1; sfx.hit(s.kind);
}
function moveShot(g, s, dt) {
  s.life -= dt;
  if (s.kind === "missile") {
    const target = g.enemies.find((e) => e.id === s.targetId && e.alive);
    if (target) { s.tx = target.x; s.ty = target.y; }
  }
  const dx = s.tx - s.x, dy = s.ty - s.y, dist = Math.hypot(dx, dy), step = s.speed * dt;
  if (dist <= step + 0.04) { s.x = s.tx; s.y = s.ty; explode(g, s); return; }
  if (s.life <= 0) { s.life = -1; return; }
  s.vx = (dx / dist) * s.speed; s.vy = (dy / dist) * s.speed; s.x += s.vx * dt; s.y += s.vy * dt; s.traveled += step;
}
function compact(list, dead) { let w = 0; for (const item of list) if (!dead(item)) list[w++] = item; list.length = w; }
function step(g, dt) {
  g.time += dt; g.shake = Math.max(0, g.shake - dt * 22);
  if (g.announce && (g.announce.life -= dt) <= 0) g.announce = null;
  for (const f of g.flashes) f.life -= dt; compact(g.flashes, (f) => f.life <= 0);
  for (const p of g.particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.grav * dt; }
  compact(g.particles, (p) => p.life <= 0);
  for (const f of g.floaters) { f.life -= dt; f.y -= dt * 0.45; } compact(g.floaters, (f) => f.life <= 0);
  for (const p of g.puffs) p.life -= dt; compact(g.puffs, (p) => p.life <= 0);
  for (const e of g.enemies) if (e.flash > 0) e.flash -= dt;
  for (const t of g.towers) if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 4.5);
  if (g.phase !== "combat") return;
  for (const j of g.jobs) {
    if (j.left <= 0) continue;
    if (j.delay > 0) { j.delay -= dt; continue; }
    j.acc += dt;
    while (j.left > 0 && j.acc >= j.every) { j.acc -= j.every; j.left--; spawnEnemy(g, j.type); }
  }
  for (const e of g.enemies) {
    if (!e.alive) continue;
    e.pathDist += e.speed * dt;
    if (e.pathDist >= PATH_TOTAL) { leak(g, e); continue; }
    const p = pointOnPath(e.pathDist); e.x = p.x; e.y = p.y;
  }
  if (g.phase !== "combat") { compact(g.enemies, (e) => !e.alive); return; }
  for (const t of g.towers) { t.cooldown -= dt; if (t.cooldown <= 0) { const before = t.cooldown; fire(g, t); if (t.cooldown === before) t.cooldown = 0; } }
  for (const s of g.shots) if (s.life > 0) moveShot(g, s, dt);
  compact(g.shots, (s) => s.life <= 0); compact(g.enemies, (e) => !e.alive);
  const spawning = g.jobs.some((j) => j.left > 0);
  if (!spawning && !g.enemies.some((e) => e.alive)) {
    if (g.leaksThisWave === 0) {
      g.gold += PERFECT_BONUS;
      g.boostNext = g.waveCursor < WAVES.length;
      g.announce = { text: "완벽 방어 +" + PERFECT_BONUS + (g.boostNext ? " · 다음 파도 +5%" : ""), life: 1.6, max: 1.6 };
      sfx.perfect();
    } else g.boostNext = false;
    g.shots.length = 0;
    if (g.waveCursor >= WAVES.length) { g.phase = "victory"; g.announce = { text: "전선 사수", life: 2.2, max: 2.2 }; sfx.win(); }
    else { g.phase = "prep"; g.leaksThisWave = 0; }
    paint();
  }
}
function onCell(g, x, y) {
  if (g.phase === "menu" || g.phase === "victory" || g.phase === "defeat") return;
  const occ = occupied(g, x, y);
  if (occ) { g.selected = g.selected === occ.id && !g.armed ? null : occ.id; g.armed = null; return; }
  if (g.armed) {
    if (!canBuild(g, x, y) || g.gold < scaledCost(TOWERS[g.armed].cost, g.towers.length)) { g.flashes.push({ gx: x, gy: y, life: 0.32 }); sfx.error(); return; }
    const def = TOWERS[g.armed];
    const price = scaledCost(def.cost, g.towers.length);
    g.gold -= price;
    g.towers.push({ id: g.nextId++, kind: g.armed, gx: x, gy: y, dmgRank: 0, rateRank: 0, target: "first", cooldown: Math.random() * def.interval, recoil: 0, invested: price });
    burst(g, x + 0.5, y + 0.5, "#9fd4ff", 8, 1.1); sfx.place(); return;
  }
  g.selected = null;
}
function swell(groups) {
  const counts = groups.map((group) => group.count);
  const total = counts.reduce((a, b) => a + b, 0);
  let extra = Math.round(total * 1.05) - total;
  if (extra <= 0) return groups.map((group) => ({ ...group }));
  const order = counts.map((c, i) => i).sort((a, b) => counts[b] - counts[a] || a - b);
  const out = counts.slice();
  for (let n = 0; extra > 0; n++, extra--) out[order[n % order.length]]++;
  return groups.map((group, i) => ({ ...group, count: out[i] }));
}
function nextPlan(g) {
  const base = WAVES[g.waveCursor];
  return base && g.boostNext ? swell(base) : base;
}
function startWave(g) {
  if (g.phase !== "prep" || g.waveCursor >= WAVES.length) return;
  const boosted = !!g.boostNext;
  const def = nextPlan(g);
  g.boostNext = false;
  g.activeWave = g.waveCursor++; g.phase = "combat"; g.leaksThisWave = 0;
  g.jobs = def.map((group) => ({ type: group.type, left: group.count, every: group.every, acc: 0, delay: group.delay || 0 }));
  const titan = def.some((d) => d.type === "titan");
  g.announce = { text: (titan ? "거대충 접근" : "제 " + (g.activeWave + 1) + " 파도") + (boosted ? " +5%" : ""), life: titan ? 1.7 : 1.35, max: titan ? 1.7 : 1.35 };
  sfx.wave();
}

const SHOT_FRAME = { bullet: 0, missile: 1, shell: 2, flame: 3 };
const boardCache = { key: "", canvas: null };
let view = { w: 300, h: 400, dpr: 1, cell: 40, ox: 0, oy: 0 };
function layout(w, h, dpr) {
  const pad = 4, cell = Math.max(8, Math.min((w - pad * 2) / COLS, (h - pad * 2) / ROWS));
  view = { w, h, dpr, cell, ox: Math.round((w - cell * COLS) / 2), oy: Math.round((h - cell * ROWS) / 2) };
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); roundRectPath(ctx, x, y, w, h, r);
}
function roundRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y); ctx.arcTo(x + w, y, x + w, y + h, radius); ctx.arcTo(x + w, y + h, x, y + h, radius); ctx.arcTo(x, y + h, x, y, radius); ctx.arcTo(x, y, x + w, y, radius); ctx.closePath();
}
function blit(ctx, img, cx, cy, h) { if (!img) return; const w = h * (img.width / img.height); ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); }
function blitFrame(ctx, img, frame, cx, cy, size) {
  if (!img) return;
  const fw = img.width / 2, fh = img.height / 2, col = frame % 2, row = (frame / 2) | 0;
  ctx.drawImage(img, col * fw, row * fh, fw, fh, cx - size / 2, cy - size / 2, size, size);
}
const tintCache = new WeakMap();
function redTint(img) {
  let c = tintCache.get(img);
  if (c) return c;
  c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0);
  x.globalCompositeOperation = "source-atop"; x.fillStyle = "#ff2626"; x.fillRect(0, 0, c.width, c.height);
  tintCache.set(img, c); return c;
}
const center = (gx, gy) => ({ x: view.ox + (gx + 0.5) * view.cell, y: view.oy + (gy + 0.5) * view.cell });
function shadow(ctx, x, y, rx, ry) { ctx.fillStyle = "rgba(40,24,16,0.28)"; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function hash2(x, y) { let n = (x * 374761393 + y * 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
function paintSurroundings(ctx, art) {
  const { w, h, cell, ox, oy } = view, bw = COLS * cell, bh = ROWS * cell;
  const pattern = art.ground && ctx.createPattern(art.ground, "repeat");
  if (pattern) {
    const s = (cell * 2.5) / art.ground.width;
    pattern.setTransform(new DOMMatrix().translate(ox, oy).scale(s));
    ctx.fillStyle = pattern;
  } else ctx.fillStyle = "#e4c48a";
  ctx.fillRect(0, 0, w, h);
  const x0 = Math.floor(-ox / cell) - 1, x1 = Math.ceil((w - ox) / cell), y0 = Math.floor(-oy / cell) - 1, y1 = Math.ceil((h - oy) / cell);
  for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) {
    if (gx >= -1 && gx <= COLS && gy >= -1 && gy <= ROWS) continue;
    const r = hash2(gx, gy);
    if (r > 0.2) continue;
    const jx = (hash2(gx + 91, gy) - 0.5) * 0.5, jy = (hash2(gx, gy + 57) - 0.5) * 0.5, size = cell * (0.7 + hash2(gx + 13, gy + 29) * 0.5);
    const p = { x: ox + (gx + 0.5 + jx) * cell, y: oy + (gy + 0.5 + jy) * cell };
    shadow(ctx, p.x, p.y + size * 0.17, size * 0.27, size * 0.1); blit(ctx, art.rock, p.x, p.y, size);
  }
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); roundRectPath(ctx, ox - 2, oy - 2, bw + 4, bh + 4, 14);
  ctx.fillStyle = "rgba(16,24,32,0.3)"; ctx.fill("evenodd"); ctx.restore();
}
function paintBoard(art) {
  const key = [view.w, view.h, view.dpr, Math.round(view.cell * 10), art.ground ? 1 : 0].join("|");
  if (boardCache.canvas && boardCache.key === key) return boardCache.canvas;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(view.w * view.dpr)); canvas.height = Math.max(1, Math.round(view.h * view.dpr));
  const ctx = canvas.getContext("2d"); ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  const { cell, ox, oy } = view;
  paintSurroundings(ctx, art);
  ctx.save(); roundRect(ctx, ox - 2, oy - 2, COLS * cell + 4, ROWS * cell + 4, 14); ctx.clip();
  ctx.save(); ctx.beginPath();
  for (const [gx, gy] of PATH) ctx.rect(ox + gx * cell - 0.5, oy + gy * cell - 0.5, cell + 1, cell + 1);
  ctx.clip();
  if (art.creep) ctx.drawImage(art.creep, ox, oy, COLS * cell, ROWS * cell); else { ctx.fillStyle = "#a84bc4"; ctx.fillRect(ox, oy, COLS * cell, ROWS * cell); }
  ctx.restore(); ctx.restore();
  roundRect(ctx, ox - 2, oy - 2, COLS * cell + 4, ROWS * cell + 4, 14); ctx.strokeStyle = "#f6e2b0"; ctx.lineWidth = 4; ctx.stroke();
  for (let gy = 0; gy < ROWS; gy++) for (let gx = 0; gx < COLS; gx++) {
    if (!isBlocked(gx, gy)) continue;
    const p = center(gx, gy); shadow(ctx, p.x, p.y + cell * 0.18, cell * 0.28, cell * 0.1); blit(ctx, art.rock, p.x, p.y, cell * 1.05);
  }
  const hive = center(1, 0), fort = center(2, 9);
  shadow(ctx, hive.x, hive.y + cell * 0.22, cell * 0.36, cell * 0.12); blit(ctx, art.hive, hive.x, hive.y - cell * 0.12, cell * 1.7);
  shadow(ctx, fort.x, fort.y + cell * 0.28, cell * 0.42, cell * 0.12); blit(ctx, art.fort, fort.x, fort.y - cell * 0.05, cell * 1.85);
  boardCache.key = key; boardCache.canvas = canvas; return canvas;
}
function ring(ctx, x, y, r, color) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = "rgba(58,160,255,0.1)"; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.stroke(); ctx.setLineDash([]);
}
function draw(ctx, g, art) {
  const { w, h, cell, ox, oy } = view;
  ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0); ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#101820"; ctx.fillRect(0, 0, w, h);
  const mag = Math.min(10, g.shake);
  if (mag > 0.2) ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  ctx.drawImage(paintBoard(art), 0, 0, w, h);
  if (g.phase !== "menu" && g.towers.length === 0 && g.waveCursor === 0) {
    for (const [gx, gy] of [[2, 1], [3, 3]]) {
      const p = center(gx, gy); ctx.beginPath(); ctx.arc(p.x, p.y, cell * 0.28, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(240,180,41," + (0.35 + Math.sin(g.time * 4) * 0.2) + ")"; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  if (g.armed && g.hover && g.phase !== "menu" && g.phase !== "victory" && g.phase !== "defeat") {
    const ok = canBuild(g, g.hover.gx, g.hover.gy) && g.gold >= scaledCost(TOWERS[g.armed].cost, g.towers.length);
    const c = center(g.hover.gx, g.hover.gy);
    ctx.fillStyle = ok ? "rgba(58,160,255,0.18)" : "rgba(214,69,122,0.28)";
    ctx.fillRect(ox + g.hover.gx * cell, oy + g.hover.gy * cell, cell, cell);
    ring(ctx, c.x, c.y, TOWERS[g.armed].range * cell, ok ? "#f0b429" : "#d6457a");
  }
  for (const flash of g.flashes) { ctx.fillStyle = "rgba(214,69,122," + flash.life * 1.6 + ")"; ctx.fillRect(ox + flash.gx * cell, oy + flash.gy * cell, cell, cell); }
  const show = g.selected != null ? g.towers.find((t) => t.id === g.selected) : null;
  if (show && !g.armed) { const p = center(show.gx, show.gy); ring(ctx, p.x, p.y, towerRuntime(show).range * cell, "#f0b429"); }
  const items = [];
  for (const t of g.towers) {
    const p = center(t.gx, t.gy);
    items.push({ y: p.y, draw() {
      const img = art.towers[t.kind], h = cell * (t.kind === "missile" ? 1.28 : 1.12) * (1 - t.recoil * 0.06);
      shadow(ctx, p.x, p.y + cell * 0.28, cell * 0.32, cell * 0.1);
      if (img) blit(ctx, img, p.x, p.y - cell * 0.08 + t.recoil * cell * 0.04, h);
      const pips = t.dmgRank + t.rateRank;
      for (let i = 0; i < pips; i++) { ctx.fillStyle = i < t.dmgRank ? "#f0b429" : "#3aa0ff"; ctx.fillRect(p.x - (pips * 6) / 2 + i * 6, p.y - cell * 0.62, 4, 4); }
      if (g.selected === t.id) { ctx.strokeStyle = "#f0b429"; ctx.lineWidth = 3; roundRect(ctx, p.x - cell * 0.46, p.y - cell * 0.62, cell * 0.92, cell * 1.02, 8); ctx.stroke(); }
    } });
  }
  for (const e of g.enemies) if (e.alive) {
    const sx = ox + e.x * cell, sy = oy + e.y * cell;
    items.push({ y: sy + (e.flying ? cell * 0.2 : 0), draw() {
      const def = ENEMIES[e.kind], bob = Math.sin(g.time * (e.flying ? 6 : 4.2) + e.id) * cell * (e.flying ? 0.07 : 0.03);
      const lift = e.flying ? cell * 0.18 + bob : bob, size = cell * def.scale;
      shadow(ctx, sx, sy + cell * 0.16, cell * (e.flying ? 0.16 : 0.24), cell * 0.08);
      const img = art.enemies[e.kind], frame = (Math.floor(g.time * (e.flying ? 6 : 5) + e.id * 0.7) % 4 + 4) % 4;
      if (img) blitFrame(ctx, img, frame, sx, sy - lift - size * 0.08, size);
      if (img && e.flash > 0) { ctx.save(); ctx.globalAlpha = Math.min(0.7, e.flash * 7); blitFrame(ctx, redTint(img), frame, sx, sy - lift - size * 0.08, size); ctx.restore(); }
    } });
  }
  items.sort((a, b) => a.y - b.y); for (const item of items) item.draw();
  if (g.armed && g.hover && canBuild(g, g.hover.gx, g.hover.gy)) {
    const p = center(g.hover.gx, g.hover.gy); ctx.save(); ctx.globalAlpha = 0.62; blit(ctx, art.towers[g.armed], p.x, p.y - cell * 0.08, cell * 1.12); ctx.restore();
  }
  for (const s of g.shots) {
    const lift = s.kind === "shell" ? Math.sin(Math.min(1, s.traveled / Math.max(0.2, s.total)) * Math.PI) * cell * 0.55 : 0;
    ctx.save(); ctx.translate(ox + s.x * cell, oy + s.y * cell - lift); ctx.rotate(Math.atan2(s.vy, s.vx));
    if (art.shots) blitFrame(ctx, art.shots, SHOT_FRAME[s.kind], 0, 0, cell * (s.kind === "shell" ? 0.46 : 0.38));
    ctx.restore();
  }
  for (const puff of g.puffs) {
    const t = 1 - puff.life / puff.max, frame = Math.min(3, (t * 4) | 0);
    ctx.save(); ctx.globalAlpha = 1 - t * 0.35;
    if (art.burst) blitFrame(ctx, art.burst, frame, ox + puff.x * cell, oy + puff.y * cell, cell * puff.size * (0.7 + t * 0.5));
    ctx.restore();
  }
  for (const p of g.particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(ox + p.x * cell, oy + p.y * cell, Math.max(1.5, p.size * cell), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  for (const e of g.enemies) {
    if (!e.alive || e.hp >= e.maxHp || e.pathDist < 0) continue;
    const sx = ox + e.x * cell, sy = oy + e.y * cell - cell * (ENEMIES[e.kind].scale * 0.55), bw = cell * 0.7, bh = Math.max(5, cell * 0.09);
    ctx.fillStyle = "rgba(16,24,32,0.78)"; roundRect(ctx, sx - bw / 2, sy, bw, bh, bh / 2); ctx.fill();
    const pct = Math.max(0, e.hp / e.maxHp); ctx.fillStyle = pct > 0.5 ? "#c6f25a" : pct > 0.25 ? "#f0b429" : "#d6457a";
    roundRect(ctx, sx - bw / 2, sy, Math.max(bh, bw * pct), bh, bh / 2); ctx.fill();
  }
  ctx.font = '700 13px "IBM Plex Sans KR", sans-serif'; ctx.textAlign = "center"; ctx.lineWidth = 3;
  for (const f of g.floaters) { ctx.globalAlpha = Math.max(0, f.life / f.max); ctx.strokeStyle = "#101820"; ctx.strokeText(f.text, ox + f.x * cell, oy + f.y * cell); ctx.fillStyle = f.color; ctx.fillText(f.text, ox + f.x * cell, oy + f.y * cell); ctx.globalAlpha = 1; }
  if (g.announce && g.announce.life > 0) {
    const lines = wrapChars(g.announce.text, 6);
    const fontSize = Math.max(28, cell * 0.72), lineH = fontSize * 1.15;
    const cx = ox + COLS * cell / 2, cy = oy + ROWS * cell / 2;
    ctx.globalAlpha = Math.max(0, Math.min(1, g.announce.life * 2));
    ctx.font = '400 ' + fontSize + 'px "Black Han Sans", sans-serif';
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 6; ctx.strokeStyle = "#101820"; ctx.fillStyle = "#f6f1e6";
    const top = cy - ((lines.length - 1) * lineH) / 2;
    for (let i = 0; i < lines.length; i++) { const y = top + i * lineH; ctx.strokeText(lines[i], cx, y); ctx.fillText(lines[i], cx, y); }
    ctx.textBaseline = "alphabetic"; ctx.globalAlpha = 1;
  }
}
function wrapChars(text, size) {
  const chars = Array.from(text || "");
  const lines = [];
  for (let i = 0; i < chars.length; i += size) lines.push(chars.slice(i, i + size).join(""));
  return lines.length ? lines : [""];
}
function cellFromPointer(ev, canvas) {
  const rect = canvas.getBoundingClientRect();
  const x = ((ev.clientX - rect.left) / rect.width) * view.w, y = ((ev.clientY - rect.top) / rect.height) * view.h;
  const gx = Math.floor((x - view.ox) / view.cell), gy = Math.floor((y - view.oy) / view.cell);
  if (gx < 0 || gy < 0 || gx >= COLS || gy >= ROWS) return null;
  return { gx, gy };
}

const sfx = (() => {
  let ctx, master, sfxBus, bgmBus, voices = 0, noise, muted = false;
  let bgmBuf = null, bgmSrc = null, bgmLoading = false, bgmWanted = false;
  const BGM_URL = "audio/metal-bgm.ogg";
  const BGM_GAIN = 0.32;
  const SFX_GAIN = 5;
  function limiter(threshold, ratio) {
    const c = ctx.createDynamicsCompressor();
    c.threshold.value = threshold; c.knee.value = 6; c.ratio.value = ratio; c.attack.value = 0.003; c.release.value = 0.15;
    return c;
  }
  function unlock() {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    if (!ctx) {
      ctx = new C();
      const out = limiter(-3, 20); out.connect(ctx.destination);
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.7; master.connect(out);
      const sfxLimit = limiter(-10, 12); sfxLimit.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_GAIN; sfxBus.connect(sfxLimit);
      bgmBus = ctx.createGain(); bgmBus.gain.value = BGM_GAIN; bgmBus.connect(master);
      const len = (ctx.sampleRate * 0.3) | 0; noise = ctx.createBuffer(1, len, ctx.sampleRate); const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    bgmWanted = true;
    ensureBgm();
  }
  function ensureBgm() {
    if (!ctx || !bgmWanted || muted) return;
    if (bgmSrc) return;
    if (bgmBuf) { startBgm(); return; }
    if (bgmLoading) return;
    bgmLoading = true;
    fetch(BGM_URL).then((r) => {
      if (!r.ok) throw new Error("bgm " + r.status);
      return r.arrayBuffer();
    }).then((ab) => ctx.decodeAudioData(ab.slice(0))).then((buf) => {
      bgmBuf = buf; bgmLoading = false; if (bgmWanted && !muted) startBgm();
    }).catch(() => { bgmLoading = false; });
  }
  function startBgm() {
    if (!ctx || !bgmBuf || bgmSrc || muted) return;
    const src = ctx.createBufferSource();
    src.buffer = bgmBuf; src.loop = true; src.loopStart = 0; src.loopEnd = bgmBuf.duration;
    src.connect(bgmBus); src.start(0); bgmSrc = src;
  }
  function stopBgm() {
    if (!bgmSrc) return;
    try { bgmSrc.stop(); } catch (_) {}
    try { bgmSrc.disconnect(); } catch (_) {}
    bgmSrc = null;
  }
  function tone(freq, dur, type, peak, slide) {
    if (!ctx || voices > 12) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), now = ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, now); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), now + dur);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); g.connect(sfxBus || master); voices++; o.onended = () => { voices = Math.max(0, voices - 1); }; o.start(); o.stop(now + dur + 0.02);
  }
  function noiseHit(dur, peak, freq) {
    if (!ctx || !noise || voices > 12) return;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), now = ctx.currentTime;
    src.buffer = noise; f.type = "lowpass"; f.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(peak, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f); f.connect(g); g.connect(sfxBus || master); voices++; src.onended = () => { voices = Math.max(0, voices - 1); }; src.start(); src.stop(now + dur);
  }
  return {
    unlock,
    setMuted(v) {
      muted = v;
      if (master && ctx) master.gain.setTargetAtTime(v ? 0 : 0.7, ctx.currentTime, 0.03);
      if (v) stopBgm(); else if (bgmWanted) ensureBgm();
    },
    shot(k) { if (k === "bullet") { tone(740, 0.06, "square", 0.05); noiseHit(0.05, 0.04, 2200); } else if (k === "flame") noiseHit(0.09, 0.15, 900); else if (k === "missile") tone(320, 0.16, "sawtooth", 0.05, 140); else { noiseHit(0.22, 0.1, 280); tone(90, 0.2, "sine", 0.07, 48); } },
    hit(k) { if (k === "shell") noiseHit(0.16, 0.06, 400); else tone(180, 0.04, "square", 0.045); },
    kill() { tone(880, 0.07, "sine", 0.07); tone(1320, 0.1, "sine", 0.055); },
    leak() { tone(220, 0.28, "sawtooth", 0.06, 70); }, place() { tone(520, 0.07, "square", 0.05); },
    error() { tone(140, 0.12, "square", 0.05); }, wave() { tone(196, 0.16, "triangle", 0.06); tone(294, 0.2, "triangle", 0.05); },
    perfect() { tone(523, 0.1, "triangle", 0.05); tone(784, 0.16, "triangle", 0.05); },
    win() { tone(523, 0.14, "triangle", 0.06); tone(784, 0.22, "triangle", 0.07); },
    lose() { tone(196, 0.3, "sawtooth", 0.06, 80); },
    pump() { if (bgmWanted && !muted) ensureBgm(); },
  };
})();

const g = newGame();
const save = loadSave();
difficulty = save.difficulty;
g.difficulty = difficulty;
let art = { ground: null, creep: null, rock: null, fort: null, hive: null, shots: null, burst: null, towers: {}, enemies: {} };
const canvas = document.getElementById("board");
const wrap = document.getElementById("stage");
const ctx = canvas.getContext("2d");
let pending = null, box = { w: 0, h: 0 }, acc = 0, last = performance.now();

function enemyCount() {
  let n = g.enemies.reduce((a, e) => a + (e.alive ? 1 : 0), 0);
  for (const j of g.jobs) n += j.left;
  return n;
}
let paused = false;
function canPause() { return g.phase === "prep" || g.phase === "combat"; }
function setPaused(v) {
  if (v && !canPause()) return;
  paused = !!v;
  if (paused) { g.armed = null; g.selected = null; }
  paint();
}
function paint() {
  const lives = document.getElementById("lives"), gold = document.getElementById("gold"), wave = document.getElementById("wave"), kills = document.getElementById("kills");
  lives.textContent = g.lives; gold.textContent = g.gold; kills.textContent = "처치 " + g.kills;
  const n = g.phase === "combat" ? g.activeWave + 1 : g.waveCursor + 1;
  wave.textContent = g.phase === "menu" ? "대기" : g.phase === "victory" ? "사수 완료" : g.phase === "defeat" ? "제 " + (g.activeWave + 1) + " 파도 돌파" : "제 " + n + " 파도 / " + WAVES.length;
  document.getElementById("speed").textContent = g.speed === 1 ? "×1" : "×2";
  document.getElementById("menu").hidden = g.phase !== "menu";
  document.getElementById("end").hidden = g.phase !== "victory" && g.phase !== "defeat";
  document.getElementById("pause").hidden = !paused;
  document.getElementById("dock").hidden = g.phase !== "prep" && g.phase !== "combat";
  const side = (g.phase === "prep" || g.phase === "combat") && window.matchMedia("(orientation: portrait) and (max-width: 1200px)").matches;
  document.getElementById("app").classList.toggle("side", side);
  const pauseBtn = document.getElementById("pause-btn");
  pauseBtn.disabled = !canPause();
  pauseBtn.textContent = "일시정지";
  const best = document.getElementById("best");
  best.hidden = save.bestWave <= 0;
  best.textContent = "최고 기록 " + save.bestWave + "파도 · 처치 " + save.bestKills;
  for (const b of document.querySelectorAll("#diff button")) b.dataset.on = b.dataset.diff === (g.difficulty || "easy") ? "true" : "false";
  if (g.phase === "victory" || g.phase === "defeat") {
    document.getElementById("end-kicker").textContent = g.phase === "victory" ? "승리" : "패배";
    document.getElementById("end-title").textContent = g.phase === "victory" ? "전선 사수" : "전선 붕괴";
    document.getElementById("end-copy").textContent = g.phase === "victory" ? "스무 번의 파도를 모두 막아냈습니다." : "제 " + (g.activeWave + 1) + " 파도에서 군체가 사령부를 뚫었습니다.";
    document.getElementById("end-lives").textContent = g.lives;
    document.getElementById("end-gold").textContent = g.gold;
    document.getElementById("end-kills").textContent = g.kills;
  }
  const play = document.getElementById("play");
  play.disabled = paused || g.phase !== "prep";
  play.textContent = side ? (g.phase === "prep" ? "플레이" : "교전") : (g.phase === "prep" ? "플레이 · 제 " + (g.waveCursor + 1) + " 파도" : "교전 중 · 적 " + enemyCount());
  const preview = document.getElementById("preview");
  preview.textContent = g.phase === "prep" && nextPlan(g) ? nextPlan(g).map((w) => ENEMIES[w.type].name + " " + w.count).join(" · ") : "";
  const sel = g.selected != null ? g.towers.find((t) => t.id === g.selected) : null;
  document.getElementById("shop").hidden = !!sel;
  document.getElementById("up").hidden = !sel;
  document.getElementById("coach").hidden = !(g.towers.length === 0 && g.phase === "prep" && !paused);
  document.getElementById("coach").textContent = side
    ? "오른쪽 포탑을 고르고, 지도의 노란 원을 누른 뒤 플레이를 누르세요"
    : "1. 아래 포탑을 고르고 2. 노란 원을 누른 뒤 3. 플레이를 누르세요";
  for (const id of ORDER) {
    const btn = document.getElementById("t-" + id);
    const price = scaledCost(TOWERS[id].cost, g.towers.length);
    btn.querySelector("em").textContent = price;
    btn.dataset.on = g.armed === id ? "true" : "false";
    btn.dataset.poor = g.gold < price ? "true" : "false";
    btn.disabled = paused;
  }
  if (sel) {
    const st = towerRuntime(sel);
    document.getElementById("up-name").textContent = TOWERS[sel.kind].name;
    document.getElementById("up-special").textContent = TOWERS[sel.kind].special;
    document.getElementById("up-stats").textContent = "공격 " + Math.round(st.damage) + " · 연사 " + (1 / st.interval).toFixed(1) + "/초";
    document.getElementById("up-target").textContent = TARGET_LABEL[sel.target];
    const dmg = document.getElementById("up-dmg"), rate = document.getElementById("up-rate");
    const dmgCost = sel.dmgRank >= MAX_RANK ? 0 : scaledCost(DMG_COST[sel.dmgRank], g.towers.length);
    const rateCost = sel.rateRank >= MAX_RANK ? 0 : scaledCost(RATE_COST[sel.rateRank], g.towers.length);
    dmg.disabled = paused || sel.dmgRank >= MAX_RANK || g.gold < dmgCost;
    rate.disabled = paused || sel.rateRank >= MAX_RANK || g.gold < rateCost;
    dmg.querySelector("span").textContent = "공격력 " + (sel.dmgRank >= MAX_RANK ? "최대" : dmgCost);
    rate.querySelector("span").textContent = "연사 " + (sel.rateRank >= MAX_RANK ? "최대" : rateCost);
    document.getElementById("up-sell").textContent = "판매 +" + refundOf(sel);
    paintPips("pips-dmg", sel.dmgRank); paintPips("pips-rate", sel.rateRank);
    document.getElementById("up-img").src = artURL("tower-" + sel.kind);
  }
}
function paintPips(id, n) {
  const el = document.getElementById(id); el.innerHTML = "";
  for (let i = 0; i < 3; i++) { const s = document.createElement("i"); if (i < n) s.className = "on"; el.appendChild(s); }
}
function artURL(name) { return (window.ART && window.ART[name]) || ""; }
function measure() { const r = wrap.getBoundingClientRect(); box.w = r.width; box.h = r.height; }
new ResizeObserver(measure).observe(wrap);
function frame(now) {
  const raw = Math.min(0.05, (now - last) / 1000); last = now;
  let changed = false;
  if (!paused) {
    acc += raw * (g.phase === "combat" ? g.speed : 1); if (acc > 0.2) acc = 0.2;
    while (acc >= 1 / 60) { const before = g.phase + g.gold + g.lives + g.kills; step(g, 1 / 60); acc -= 1 / 60; if (before !== g.phase + g.gold + g.lives + g.kills) changed = true; }
  } else {
    acc = 0;
  }
  if (box.w < 2) measure();
  if (box.w > 2 && box.h > 2) {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1); layout(box.w, box.h, dpr);
    const bw = Math.max(1, Math.round(box.w * dpr)), bh = Math.max(1, Math.round(box.h * dpr));
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; boardCache.key = ""; }
    draw(ctx, g, art);
  }
  sfx.pump();
  const reached = g.phase === "victory" ? WAVES.length : g.activeWave >= 0 ? g.activeWave + 1 : 0;
  if (reached > save.bestWave || g.kills > save.bestKills) { save.bestWave = Math.max(save.bestWave, reached); save.bestKills = Math.max(save.bestKills, g.kills); writeSave(save); changed = true; }
  if (changed || g.phase === "menu" || g.phase === "prep" || paused) paint();
  requestAnimationFrame(frame);
}
function begin() { sfx.unlock(); paused = false; if (g.phase === "menu") { g.phase = "prep"; sfx.wave(); } paint(); }
function restart() { sfx.unlock(); paused = false; const fresh = newGame(); Object.assign(g, fresh); g.phase = "prep"; g.towers = fresh.towers; g.enemies = fresh.enemies; g.shots = fresh.shots; paint(); }
function toMenu() { sfx.unlock(); paused = false; const fresh = newGame(); Object.assign(g, fresh); g.towers = fresh.towers; g.enemies = fresh.enemies; g.shots = fresh.shots; paint(); }

function bootImages() {
  const names = ["ground", "creep", "rock", "fort", "hive", "shots", "burst", "tower-rifle", "tower-flame", "tower-missile", "tower-siege", "e-claw", "e-spit", "e-shell", "e-wing", "e-titan"];
  return Promise.all(names.map((name) => new Promise((res) => {
    const src = artURL(name); if (!src) return res([name, null]);
    const img = new Image(); img.onload = () => res([name, img]); img.onerror = () => res([name, null]); img.src = src;
  }))).then((pairs) => {
    for (const [name, img] of pairs) {
      if (name.startsWith("tower-")) art.towers[name.slice(6)] = img;
      else if (name.startsWith("e-")) art.enemies[name.slice(2)] = img;
      else art[name] = img;
    }
    boardCache.key = "";
  });
}

document.getElementById("go").onclick = begin;
for (const b of document.querySelectorAll("#diff button")) b.onclick = () => { difficulty = b.dataset.diff; g.difficulty = difficulty; save.difficulty = difficulty; writeSave(save); paint(); };
document.getElementById("menu").onclick = (e) => { if (e.target.id === "menu") begin(); };
document.getElementById("again").onclick = restart;
document.getElementById("play").onclick = () => { if (paused) return; sfx.unlock(); startWave(g); paint(); };
document.getElementById("mute").onclick = () => { sfx.unlock(); save.muted = !save.muted; sfx.setMuted(save.muted); writeSave(save); document.getElementById("mute").textContent = save.muted ? "소리" : "음소거"; };
document.getElementById("speed").onclick = () => { if (paused) return; g.speed = g.speed === 1 ? 2 : 1; paint(); };
document.getElementById("pause-btn").onclick = () => { sfx.unlock(); if (!canPause()) return; setPaused(true); };
document.getElementById("resume").onclick = () => { sfx.unlock(); setPaused(false); };
document.getElementById("to-menu").onclick = toMenu;
document.getElementById("up-target").onclick = () => { if (paused) return; const t = g.towers.find((x) => x.id === g.selected); if (!t) return; t.target = t.target === "first" ? "close" : t.target === "close" ? "strong" : "first"; paint(); };
document.getElementById("up-dmg").onclick = () => upgrade("dmg");
document.getElementById("up-rate").onclick = () => upgrade("rate");
document.getElementById("up-close").onclick = () => { if (paused) return; g.selected = null; paint(); };
document.getElementById("up-sell").onclick = () => { if (paused) return; const i = g.towers.findIndex((t) => t.id === g.selected); if (i < 0) return; g.gold += refundOf(g.towers[i]); g.towers.splice(i, 1); g.selected = null; paint(); };
function upgrade(kind) {
  if (paused) return;
  const t = g.towers.find((x) => x.id === g.selected); if (!t) return;
  const rank = kind === "dmg" ? t.dmgRank : t.rateRank, costs = kind === "dmg" ? DMG_COST : RATE_COST;
  const price = scaledCost(costs[rank] || 0, g.towers.length);
  if (rank >= MAX_RANK || g.gold < price) { sfx.error(); return; }
  g.gold -= price; t.invested += price; if (kind === "dmg") t.dmgRank++; else t.rateRank++; sfx.place(); paint();
}
for (const id of ORDER) document.getElementById("t-" + id).onclick = () => { sfx.unlock(); if (paused || g.phase === "menu" || g.phase === "victory" || g.phase === "defeat") return; g.armed = g.armed === id ? null : id; g.selected = null; paint(); };
canvas.addEventListener("pointerdown", (e) => { if (paused) return; sfx.unlock(); canvas.setPointerCapture(e.pointerId); pending = cellFromPointer(e, canvas); g.hover = pending; });
canvas.addEventListener("pointermove", (e) => { if (paused) return; g.hover = cellFromPointer(e, canvas); });
canvas.addEventListener("pointerup", (e) => {
  if (paused) { pending = null; return; }
  if (g.phase === "menu") { begin(); return; }
  const cell = cellFromPointer(e, canvas), start = pending; pending = null;
  if (!cell || !start || cell.gx !== start.gx || cell.gy !== start.gy) return;
  onCell(g, cell.gx, cell.gy); paint();
});
canvas.addEventListener("pointerleave", () => { g.hover = null; });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    if (paused) setPaused(false);
    else if (canPause()) setPaused(true);
    else { g.armed = null; g.selected = null; paint(); }
    return;
  }
  if (paused) return;
  if (e.key === " ") { e.preventDefault(); sfx.unlock(); startWave(g); paint(); }
  else if (e.key >= "1" && e.key <= "4") { const id = ORDER[e.key - 1]; g.armed = g.armed === id ? null : id; g.selected = null; paint(); }
});
new ResizeObserver(measure).observe(wrap);
sfx.setMuted(save.muted);
document.getElementById("mute").textContent = save.muted ? "소리" : "음소거";
for (const id of ORDER) document.getElementById("t-img-" + id).src = artURL("tower-" + id);
bootImages().then(() => { measure(); paint(); requestAnimationFrame(frame); });
