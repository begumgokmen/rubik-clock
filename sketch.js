let secondsRunner;
let minutesRunner;
let hourRunners = [];

let lastMinute = -1;
let hueIndex = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSL, 360, 100, 100);
  noStroke();
  frameRate(60);

  secondsRunner = new Runner(0, height * 0.2, 8, 0);
  minutesRunner = new Runner(0, height * 0.5, 3, 0);

  // Create 3 hour runners
  for (let i = 0; i < 3; i++) {
    hourRunners.push(new Runner(i * 150, height * 0.8, 1.2, 0));
  }
}

function draw() {
  background(0);

  drawTrack(height * 0.2);
  drawTrack(height * 0.5);
  drawTrack(height * 0.8);

  secondsRunner.update();
  secondsRunner.display();

  minutesRunner.update();
  minutesRunner.display();

  for (let r of hourRunners) {
    r.update();
    r.display();
  }

  // Check every new minute
  let currentMinute = minute();
  if (currentMinute !== lastMinute) {
    lastMinute = currentMinute;
    hueIndex = (hueIndex + 1) % 24;
    minutesRunner.cycleColor(hueIndex);
    hourRunners.forEach(r => r.cycleColor(hueIndex));
    console.log("Minute:", currentMinute);
  }

  // Check if all hour runners match color → new hour tick
  let refColor = hourRunners[0].hue;
  let allSame = hourRunners.every(r => r.hue === refColor);

  if (allSame) {
    push();
    fill(0, 0, 100);
    textAlign(CENTER, CENTER);
    textSize(32);
    text("NEW HOUR!", width / 2, 50);
    pop();
  }
}

function drawTrack(y) {
  fill(30);
  rect(0, y + 10, width, 5);
}

class Runner {
  constructor(x, y, speed, hueIndex) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.hue = map(hueIndex, 0, 24, 0, 360);
  }

  update() {
    this.x += this.speed;
    if (this.x > width) this.x = 0;
  }

  cycleColor(hueIndex) {
    this.hue = map(hueIndex % 24, 0, 24, 0, 360);
  }

  display() {
    fill(this.hue, 80, 60);
    ellipse(this.x, this.y, 20);
    // Optional: add a rectangle below as body
    rect(this.x - 5, this.y + 10, 10, 15);
  }
}