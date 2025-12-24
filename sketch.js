// Rubik Clock (p5.js)
// Hour   -> cube "solvedness" across 20 steps
// Minute -> cube rotation
// Second -> scanning highlight
// Requirement: log minute() ONLY when minute changes (not more frequently)

let lastLoggedMinute = null;

// Sticker colors (classic Rubik palette)
const PALETTE = {
  W: [245, 245, 245], // white
  Y: [245, 210, 60],  // yellow
  R: [235, 70, 70],   // red
  O: [245, 140, 50],  // orange
  B: [70, 140, 235],  // blue
  G: [80, 200, 120],  // green
  K: [20, 22, 26]     // background-ish
};

// Three visible faces (U = top, F = front, R = right)
const FACE_KEYS = ["U", "F", "R"];
const SOLVED = {
  U: Array(9).fill("W"),
  F: Array(9).fill("G"),
  R: Array(9).fill("R")
};

// We build 21 states: 0 = scrambled, 20 = solved
let STATES = []; // each: {U:[9], F:[9], R:[9]}

function setup() {
  const c = createCanvas(900, 650);
  c.parent("app");
  angleMode(RADIANS);
  noStroke();

  STATES = buildStates20Moves();
}

function draw() {
  background(PALETTE.K[0], PALETTE.K[1], PALETTE.K[2]);

  // Time
  const h24 = hour();     // 0..23
  const m = minute();     // 0..59
  const s = second();     // 0..59

  // Requirement: log minute only when minute changes
  if (lastLoggedMinute === null || m !== lastLoggedMinute) {
    console.log(m);
    lastLoggedMinute = m;
  }

  // Map time -> visual parameters
  const solvedness = map(h24 + m / 60, 0, 24, 0, 1, true); // 0..1 over day
  const stepFloat = solvedness * 20;                      // 0..20
  const stepA = floor(stepFloat);
  const stepB = min(stepA + 1, 20);
  const t = stepFloat - stepA;

  const rot = map(m + s / 60, 0, 60, -PI * 0.85, PI * 1.15, false);

  // Seconds scan: 0..1 sweep
  const scan = (s + (millis() % 1000) / 1000) / 60;

  // Interpolated cube state between stepA and stepB
  const state = lerpState(STATES[stepA], STATES[stepB], t);

  // Layout
  push();
  translate(width * 0.52, height * 0.52);

  // Subtle shadow bloom
  push();
  noFill();
  stroke(255, 255, 255, 25);
  strokeWeight(10);
  ellipse(0, 120, 520, 220);
  pop();

  // Draw isometric cube-like net (3 faces) with minute rotation
  drawIsometricCube(state, rot, scan);

  pop();

  // Minimal legend (optional but helps viewers)
  drawLegend(h24, m, s);
}

function drawLegend(h24, m, s) {
  push();
  noStroke();
  fill(233, 238, 245, 180);
  textSize(14);
  textAlign(LEFT, TOP);
  text(
    "Rubik Clock\n" +
    "Hour: cube assembles through day\n" +
    "Minute: cube rotation\n" +
    "Second: scanning highlight",
    20, 20
  );

  fill(233, 238, 245, 120);
  textSize(12);
  text(`Time now: ${nf(h24, 2)}:${nf(m, 2)}:${nf(s, 2)}`, 20, 100);
  pop();
}

function drawIsometricCube(state, rot, scan01) {
  // Geometry
  const sticker = 34;
  const gap = 4;
  const faceSize = sticker * 3 + gap * 2;

  // Isometric-ish vectors
  // We'll fake 3D by skewing faces into parallelograms.
  // Minute rotation modulates the skew direction, so the cube appears to rotate.
  const skewX = cos(rot) * 0.65;
  const skewY = sin(rot) * 0.22;

  // Face planes:
  // Front face: mostly straight
  // Right face: skewed to the right
  // Top face: skewed upward
  const origin = createVector(-faceSize * 0.20, faceSize * 0.10);

  // Draw order: top -> right -> front for a plausible overlap
  drawFaceParallelogram("U", state.U, origin.x + 40 * skewX, origin.y - 160, sticker, gap, {
    ax: 1.0, ay: 0.0,
    bx: skewX * 0.9, by: -0.75,
    scan01, faceTag: "U"
  });

  drawFaceParallelogram("R", state.R, origin.x + 190, origin.y - 50, sticker, gap, {
    ax: 0.95, ay: 0.05,
    bx: 0.62 + skewX * 0.45, by: 0.22 + skewY * 0.55,
    scan01, faceTag: "R"
  });

  drawFaceParallelogram("F", state.F, origin.x, origin.y, sticker, gap, {
    ax: 1.0, ay: 0.0,
    bx: 0.05 + skewX * 0.15, by: 1.0,
    scan01, faceTag: "F"
  });

  // Cube frame outline (helps legibility)
  push();
  noFill();
  stroke(233, 238, 245, 55);
  strokeWeight(2);

  // Front outline
  rect(origin.x - 2, origin.y - 2, faceSize + 4, faceSize + 4, 10);

  pop();
}

function drawFaceParallelogram(faceName, stickers, ox, oy, sticker, gap, geom) {
  const { ax, ay, bx, by, scan01, faceTag } = geom;

  // Frame
  push();
  noFill();
  stroke(233, 238, 245, 70);
  strokeWeight(2);
  const faceW = sticker * 3 + gap * 2;
  // Approx outline using corners in skew space
  const p0 = skewPoint(0, 0, ax, ay, bx, by);
  const p1 = skewPoint(faceW, 0, ax, ay, bx, by);
  const p2 = skewPoint(faceW, faceW, ax, ay, bx, by);
  const p3 = skewPoint(0, faceW, ax, ay, bx, by);
  beginShape();
  vertex(ox + p0.x, oy + p0.y);
  vertex(ox + p1.x, oy + p1.y);
  vertex(ox + p2.x, oy + p2.y);
  vertex(ox + p3.x, oy + p3.y);
  endShape(CLOSE);
  pop();

  // Stickers
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const idx = r * 3 + c;
      const key = stickers[idx];

      const x = c * (sticker + gap);
      const y = r * (sticker + gap);

      const p = skewPoint(x, y, ax, ay, bx, by);

      // Seconds scan highlight: a soft band that moves across each face
      const u = (c + r * 0.35) / 3; // 0..~1
      const scanDist = abs(u - scan01);
      const glow = constrain(map(scanDist, 0.0, 0.22, 1.0, 0.0), 0, 1);

      // Face-specific scan phase so they don't look identical
      const facePhase = faceTag === "U" ? 0.10 : (faceTag === "R" ? 0.22 : 0.00);
      const glow2 = constrain(glow + 0.25 * sin(TAU * (scan01 + facePhase)), 0, 1);

      // Base color
      const rgb = PALETTE[key];
      const br = 1.0 + 0.35 * glow2;

      push();
      noStroke();
      fill(rgb[0] * br, rgb[1] * br, rgb[2] * br, 240);

      const stickerW = sticker;
      const q0 = skewPoint(0, 0, ax, ay, bx, by);
      const q1 = skewPoint(stickerW, 0, ax, ay, bx, by);
      const q2 = skewPoint(stickerW, stickerW, ax, ay, bx, by);
      const q3 = skewPoint(0, stickerW, ax, ay, bx, by);

      beginShape();
      vertex(ox + p.x + q0.x, oy + p.y + q0.y);
      vertex(ox + p.x + q1.x, oy + p.y + q1.y);
      vertex(ox + p.x + q2.x, oy + p.y + q2.y);
      vertex(ox + p.x + q3.x, oy + p.y + q3.y);
      endShape(CLOSE);

      // Sticker border
      noFill();
      stroke(0, 0, 0, 110);
      strokeWeight(2);
      beginShape();
      vertex(ox + p.x + q0.x, oy + p.y + q0.y);
      vertex(ox + p.x + q1.x, oy + p.y + q1.y);
      vertex(ox + p.x + q2.x, oy + p.y + q2.y);
      vertex(ox + p.x + q3.x, oy + p.y + q3.y);
      endShape(CLOSE);

      pop();
    }
  }
}

// Simple linear combination basis for a skewed plane
function skewPoint(x, y, ax, ay, bx, by) {
  return createVector(x * ax + y * bx, x * ay + y * by);
}

// Build states: scrambled -> solved in 20 "moves"
function buildStates20Moves() {
  // Start from solved, create a "scrambled" visible-face state by shuffling
  // Then define 20 deterministic partial unshuffles back to solved.
  // This is a visual analogy to 20-move solving (God’s number).
  const solved = deepCopyState(SOLVED);

  const scrambled = deepCopyState(SOLVED);
  // Scramble by permuting visible stickers
  const all = [];
  for (const f of FACE_KEYS) for (const v of scrambled[f]) all.push(v);

  // Deterministic shuffle (seedless but consistent): a fixed permutation
  const perm = fixedPermutation(all.length);
  const shuffled = perm.map(i => all[i]);

  let k = 0;
  for (const f of FACE_KEYS) {
    scrambled[f] = scrambled[f].map(() => shuffled[k++]);
  }

  // Now create 21 states: gradually restore stickers to solved positions.
  // Each step "locks" more stickers into their solved face color.
  const states = [];
  for (let step = 0; step <= 20; step++) {
    const p = step / 20; // 0..1
    const st = deepCopyState(scrambled);

    // Number of stickers corrected at this step (0..27)
    const totalVisible = 27;
    const corrected = floor(p * totalVisible);

    // Deterministic correction order: center first, then edges, then corners, face by face
    const order = correctionOrder();

    for (let i = 0; i < corrected; i++) {
      const { face, idx } = order[i];
      st[face][idx] = solved[face][idx];
    }

    states.push(st);
  }
  return states;
}

function correctionOrder() {
  // 27 entries: 9 per face, deterministic order emphasizing "assembling"
  // indices in a 3x3: [0..8]
  const priority = [4, 1, 3, 5, 7, 0, 2, 6, 8]; // center, edges, corners
  const out = [];
  for (const face of FACE_KEYS) {
    for (const idx of priority) out.push({ face, idx });
  }
  return out;
}

function fixedPermutation(n) {
  // A fixed, reproducible permutation without randomness
  // Uses a simple modular arithmetic shuffle.
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
  return {
    U: st.U.slice(),
    F: st.F.slice(),
    R: st.R.slice()
  };
}

function lerpState(a, b, t) {
  // For discrete sticker colors, interpolate by choosing a or b based on t threshold.
  // This avoids muddy blending that hurts legibility.
  const pick = (va, vb) => (t < 0.5 ? va : vb);

  const out = { U: [], F: [], R: [] };
  for (const f of FACE_KEYS) {
    for (let i = 0; i < 9; i++) {
      out[f][i] = pick(a[f][i], b[f][i]);
    }
  }
  return out;
}
