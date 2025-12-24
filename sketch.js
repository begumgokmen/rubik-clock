function setup() {
  createCanvas(600, 600);
  angleMode(DEGREES);
  noStroke();
  frameRate(1); // Update every second
}

function draw() {
  background(20);
  translate(width / 2, height / 2);

  // Time values
  let h = hour() % 24;
  let m = minute();
  let s = second();

  let tileSize = 40;
  let xOffset = -2 * tileSize;
  let yOffset = -3 * tileSize;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // Calculate color based on time and tile index
      let hueFront = map(h + row + col, 0, 24, 0, 360);
      let hueTop = map(m + row + col, 0, 60, 0, 360);
      let hueRight = map(s + row + col, 0, 60, 0, 360);

      drawIsometricSticker(
        xOffset + col * tileSize,
        yOffset + row * tileSize,
        tileSize,
        color(hueFront, 100, 100), // front
        color(hueTop, 100, 100),   // top
        color(hueRight, 100, 100)  // side
      );
    }
  }
}

function drawIsometricSticker(x, y, size, frontColor, topColor, sideColor) {
  push();
  colorMode(HSL, 360, 100, 100);
  noStroke();

  // FRONT
  fill(frontColor);
  beginShape();
  vertex(x, y);
  vertex(x + size, y);
  vertex(x + size - 20, y + 20);
  vertex(x - 20, y + 20);
  endShape(CLOSE);

  // TOP
  fill(topColor);
  beginShape();
  vertex(x, y);
  vertex(x - 20, y + 20);
  vertex(x - 20, y + 20 - size);
  vertex(x, y - size);
  endShape(CLOSE);

  // SIDE
  fill(sideColor);
  beginShape();
  vertex(x + size, y);
  vertex(x + size - 20, y + 20);
  vertex(x + size - 20, y + 20 - size);
  vertex(x + size, y - size);
  endShape(CLOSE);

  pop();
}
