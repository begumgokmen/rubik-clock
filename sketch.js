let angle = 0;
let lastMinute = -1;
let cubeColors = [];

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(DEGREES);
  initCubeColors();
}

function draw() {
  background(10);
  lights();

  rotateX(-20);
  rotateY(angle);

  let cubeSize = 180;
  let small = cubeSize / 3;

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        push();
        translate(x * small, y * small, z * small);
        drawCubelet(cubeColors[x + 1][y + 1][z + 1], small * 0.95);
        pop();
      }
    }
  }

  // Rotate every minute
  let m = minute();
  if (m !== lastMinute) {
    angle += 90;
    lastMinute = m;
    console.log("Minute:", m);
    updateCubeColors();
  }
}

function initCubeColors() {
  for (let x = 0; x < 3; x++) {
    cubeColors[x] = [];
    for (let y = 0; y < 3; y++) {
      cubeColors[x][y] = [];
      for (let z = 0; z < 3; z++) {
        cubeColors[x][y][z] = {
          x: color(255, 0, 0),     // red (right)
          y: color(0, 255, 0),     // green (top)
          z: color(255, 255, 255), // white (front)
        };
      }
    }
  }
}

function updateCubeColors() {
  // Gradually solve the cube over 24 hours
  let h = hour();
  let progress = map(h % 24, 0, 24, 0, 255);

  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      for (let z = 0; z < 3; z++) {
        cubeColors[x][y][z] = {
          x: color(progress, 0, 255 - progress), // shift red to blue
          y: color(0, progress, 255 - progress), // shift green
          z: color(255 - progress),              // fade to white
        };
      }
    }
  }
}

function drawCubelet(c, size) {
  let s = size / 2;

  // Outline cube
  push();
  stroke(30);
  noFill();
  box(size);
  pop();

  // FRONT FACE (Z+)
  push();
  translate(0, 0, s + 0.5);
  fill(c.z); noStroke();
  plane(size - 4, size - 4);
  pop();

  // TOP FACE (Y-)
  push();
  translate(0, -s - 0.5, 0);
  rotateX(HALF_PI);
  fill(c.y); noStroke();
  plane(size - 4, size - 4);
  pop();

  // RIGHT FACE (X+)
  push();
  translate(s + 0.5, 0, 0);
  rotateY(HALF_PI);
  fill(c.x); noStroke();
  plane(size - 4, size - 4);
  pop();
}


