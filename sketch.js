// Rubik Cube Clock — always a connected cube, no on-canvas text
// Hour   -> "solvedness" (how many stickers match their face color)
// Minute -> cube rotation (as a whole, still a cube)
// Second -> moving scan highlight across stickers
// Requirement: log minute() only when minute changes

let lastLoggedMinute = null;

const PALETTE = {
  W: [245, 245, 245],
  Y: [245, 210, 60],
  R: [235, 70, 70],
  O: [245, 140, 50],
  B: [70, 140, 235],
  G: [80, 200, 120],
  K: [14, 16, 20]
};

// Three visible faces: Top (U), Front (F), Right (R)
const FACE_KEYS = ["U", "F", "R"];

const SOLVED = {
  U: Array(9).fill("W"),
  F: Array(9).fill("G"),
  R: Array(9).fill("R")
};

let STATES = []; // 0..20 (scrambled -> solved)

// --- Shared isometric basis (ALL faces use this; no drifting)
const ISO_X = { x: 1, y: 0.5 };
const ISO_Y = { x: -1, y: 0.5 };

function iso(x, y) {
  return {
    x: x * ISO_X.x + y * ISO_Y.x,
    y: x * ISO_X.y + y * ISO_Y.y
  };
}

function setup() {
  const c = createCanvas(900, 650);
  c.parent("app");
  angleMode(RADIANS);
  STATES = buildStates20Moves();
}

function draw() {
  background(...PALETTE.K);

  const h24 = hour();   // 0..23
  const m = minute();   // 0..59
  const s = second();   // 0..59

  // Log minute only when it changes
  if (lastLoggedMinute === null || m !== lastLoggedMinute) {
    console.log(m);
    lastLoggedMinute = m;
  }

  // Hour -> solvedness 0..1
  const solvedness = map(h24 + m / 60, 0, 24, 0, 1, true); // 0..1
  const stepFloat = solvedness * 20;                       // 0..20
  const a = floor(stepFloat);
  const b = min(a + 1, 20);
  const t = stepFloat - a;

  const state = lerpState(STATES[a], STATES[b], t);

  // Minute -> rotate the entire cube (still a cube)
  const rot = map(m + s / 60, 0, 60, -PI / 10, PI / 10); // subtle, keeps cube readable

  // Second -> scan 0..1
  const scan01 = (s + (millis() % 1000) / 1000) / 60;

  push();
  translate(width * 0.52, height * 0.56);
  rotate(rot);

  // Draw a connected isometric cube (U, F, R share edges)
  drawCube(state, scan01);

  pop();
}

// ---------------- Cube drawing (always connected) ----------------

function drawCube(state, scan01) {
  const sticker = 34;
  const gap = 4;
  const faceSize = sticker * 3 + gap * 2;

  // One cube origin; all faces positioned relative to it
  // Front face origin at (0,0)
  const oF = { x: 0, y: 0 };
  // Right face shares the front's right edge: shift by +faceSize in "x" axis of the grid
  const oR = iso(faceSize, 0);
  // Top face shares the front's top edge: shift by -faceSize in "y" axis of the grid
  const oU = iso(0, -faceSize);

  // Depth ordering: top, right, then front
  drawFace(state.U, oU.x, oU.y, sticker, gap, scan01, "U");
  drawFace(state.R, oR.x, oR.y, sticker, gap, scan01, "R");
  drawFace(state.F, oF.x, oF.y, sticker, gap, scan01, "F");

  // Outline the cube silhouette for readability
  drawCubeOutline(faceSize);
}

function drawFace(stickers, ox, oy, sticker, gap, scan01, tag) {
  stroke(10, 12, 16, 160);
  strokeWeight(2);

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const key = stickers[idx];
      const rgb = PALETTE[key];

      const x = c * (sticker + gap);
      const y = r * (sticker + gap);
      const p = iso(x, y);

      // scan highlight (seconds): a band moving diagonally across each face
      const u = (c + r * 0.85) / 3;             // 0..~1
      const phase = tag === "U" ? 0.18 : tag === "R" ? 0.35 : 0.0;
      const d = abs(u - ((scan01 + phase) % 1));
      const glow = constrain(map(d, 0.0, 0.22, 1.35, 1.0), 1.0, 1.35);

      fill(rgb[0] * glow, rgb[1] * glow, rgb[2] * glow, 245);

      // Draw a skewed sticker quad using the same iso basis
      const q0 = iso(0, 0);
      const q1 = iso(sticker, 0);
      const q2 = iso(sticker, sticker);
      const q3 = iso(0, sticker);

      beginShape();
      vertex(ox + p.x + q0.x, oy + p.y + q0.y);
      vertex(ox + p.x + q1.x, oy + p.y + q1.y);
      vertex(ox + p.x + q2.x, oy + p.y + q2.y);
      vertex(ox + p.x + q3.x, oy + p.y + q3.y);
      endShape(CLOSE);
    }
  }
}

function drawCubeOutline(faceSize) {
  // Outline front face rect in iso-space plus the top/right extensions
  noFill();
  stroke(240, 245, 255, 70);
  strokeWeight(2);

  const F0 = iso(0, 0);
  const F1 = iso(faceSize, 0);
  const F2 = iso(faceSize, faceSize);
  const F3 = iso(0, faceSize);

  const U0 = iso(0, -faceSize);
  const U1 = iso(faceSize, -faceSize);

  const R0 = iso(faceSize, 0);
  const R2 = iso(faceSize * 2, faceSize);

  // front
  beginShape();
  vertex(F0.x, F0.y);
  vertex(F1.x, F1.y);
  vertex(F2.x, F2.y);
  vertex(F3.x, F3.y);
  endShape(CLOSE);

  // top edge connection
  line(U0.x, U0.y, U1.x, U1.y);
  line(U0.x, U0.y, F0.x, F0.y);
  line(U1.x, U1.y, F1.x, F1.y);

  // right edge connection
  line(R0.x, R0.y, R2.x, R2.y);
  line(R0.x, R0.y, F1.x, F1.y);
  line(R2.x, R2.y, F2.x, F2.y);
}

// ---------------- States: “20 moves or fewer” metaphor ----------------

function buildStates20Moves() {
  const solved = deepCopyState(SOLVED);

  // Create a deterministic "scrambled" state for visible stickers
  const scrambled = deepCopyState(SOLVED);

  const all = [];
  for (const f of FACE_KEYS) for (const v of scrambled[f]) all.push(v);

  const perm = fixedPermutation(all.length);
  const shuffled = perm.map(i => all[i]);

  let k = 0;
  for (const f of FACE_KEYS) {
    scrambled[f] = scrambled[f].map(() => shuffled[k++]);
  }

  // Create 21 states from scrambled -> solved by progressively “locking” stickers
  const order = correctionOrder(); // 27 entries

  const states = [];
  for (let step = 0; step <= 20; step++) {
    const p = step / 20;
    const st = deepCopyState(scrambled);

    const corrected = floor(p * 27);
    for (let i = 0; i < corrected; i++) {
      const { face, idx } = order[i];
      st[face][idx] = solved[face][idx];
    }
    states.push(st);
  }
  return states;
}

function correctionOrder() {
  // Center -> edges -> corners per face
  const priority = [4, 1, 3, 5, 7, 0, 2, 6, 8];
  const out = [];
  for (const face of FACE_KEYS) {
    for (const idx of priority) out.push({ face, idx });
  }
  return out;
}

function fixedPermutation(n) {
  // deterministic permutation
  const arr = [...Array(n).keys()];
  const out = new Array(n);
  let j = 0;
  const step = 11; // co-prime with 27
  for (let i = 0; i < n; i++) {
    j = (j + step) % n;
    out[i] = arr[j];
  }
  return out;
}

function deepCopyState(st) {
  return { U: st.U.slice(), F: st.F.slice(), R: st.R.slice() };
}

function lerpState(a, b, t) {
  // keep colors crisp: choose a or b (no muddy blends)
  const pick = (va, vb) => (t < 0.5 ? va : vb);
  const out = { U: [], F: [], R: [] };
  for (const f of FACE_KEYS) {
    for (let i = 0; i < 9; i++) out[f][i] = pick(a[f][i], b[f][i]);
  }
  return out;
}