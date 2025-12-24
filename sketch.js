let platforms = [];
let secondsRunner, minutesRunner, hourRunner;
let lastMinute = -1;
let hueIndex = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSL, 360, 100, 100);
  frameRate(60);

  // Layout levels
  let levelSpacing = height / 4;
  createLevel(1, levelSpacing);
  createLevel(2, levelSpacing * 2);
  createLevel(3, levelSpacing * 3);

  // Runners
  secondsRunner = new Runner(0, levelSpacing - 40, 6, levelSpacing, 'seconds');
  minutesRunner = new Runner(0, levelSpacing * 2 - 40, 3, levelSpacing * 2, 'minutes');
  hourRunner = new Runner(0, levelSpacing * 3 - 40, 1.5, levelSpacing * 3, 'hours');
}

function draw() {
  background(0);
  drawTracks();

  for (let p of platforms) p.display();

  secondsRunner.update();
  minutesRunner.update();
  hourRunner.update();

  secondsRunner.display();
  minutesRunner.display();
  hourRunner.display();

  // Update time & colors each new minute
  let m = minute();
  if (m !== lastMinute) {
    lastMinute = m;
    hueIndex = (hueIndex + 1) % 24;
    minutesRunner.cycleColor(hueIndex);
    hourRunner.cycleColor(hueIndex);
    console.log("Minute:", m);
  }

  if (secondsRunner.looped && minutesRunner.looped && hourRunner.looped) {
    push();
    fill(0, 0, 100);
    textSize(24);
    textAlign(CENTER);
    text("Hour Complete", width / 2, 50);
    pop();
  }
}

function drawTracks() {
  stroke(40);
  strokeWeight(5);
  noFill();
  for (let i = 1; i <= 3; i++) {
    let y = i * height / 4;
    line(0, y, width, y);
  }
}

function createLevel(level, baseY) {
  // Platforms (x, y, w, h)
  platforms.push(new Platform(0, baseY - 20, 200, 10));
  platforms.push(new Platform(300, baseY - 60, 150, 10));
  platforms.push(new Platform(550, baseY - 40, 150, 10));
  platforms.push(new Platform(800, baseY - 80, 150, 10));
}

class Runner {
  constructor(x, y, speed, groundY, type) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.velY = 0;
    this.groundY = groundY;
    this.size = 20;
    this.hue = 0;
    this.type = type;
    this.looped = false;
  }

  update() {
    this.looped = false;
    this.x += this.speed;

    // Gravity
    this.velY += 0.6;
    this.y += this.velY;

    // Collision
    for (let p of platforms) {
      if (this.x + this.size > p.x && this.x < p.x + p.w) {
        if (this.y + this.size >= p.y && this.y + this.size <= p.y + p.h) {
          this.y = p.y - this.size;
          this.velY = -9; // jump!
        }
      }
    }

    // Loop around
    if (this.x > width) {
      this.x = 0;
      this.looped = true;
    }

    // Fall off screen
    if (this.y > height) {
      this.y = this.groundY - 40;
      this.velY = 0;
    }
  }

  display() {
    fill(this.hue, 80, 60);
    ellipse(this.x, this.y, this.size);
  }

  cycleColor(hueStep) {
    this.hue = map(hueStep % 24, 0, 24, 0, 360);
  }
}
class Platform {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  display() {
    fill(255);
    rect(this.x, this.y, this.w, this.h);
  }
}
