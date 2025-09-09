let controlPoints = [];
let trackCurvePoints = [];

const boxes = 16;
const canvas_size = 800;
const POINT_PROBABILITY = 0.7; 
const CORNER_PROBABILITY = 0.3;
const TRACK_WIDTH = 25;

function setup() {
  createCanvas(canvas_size, canvas_size);
  
  const sections = sqrt(boxes);
  const spacing = canvas_size / sections;

  for (let y = 0; y < sections; y++) {
    for (let x = 0; x < sections; x++) {
      if (random() < POINT_PROBABILITY) {
        const box_x_start = x * spacing;
        const box_y_start = y * spacing;
        const px = random(box_x_start, box_x_start + spacing);
        const py = random(box_y_start, box_y_start + spacing);
        controlPoints.push(createVector(px, py));
        
      }
    }
  }

  if (controlPoints.length < 3) {
      for (let i = 0; i < 4; i++) {
        controlPoints.push(createVector(random(width), random(height)));
      }
  }
  
  // The sortPoints function is now here
  controlPoints = sortPoints(controlPoints);

  trackCurvePoints = generateTrack(controlPoints, 100);
}

function draw() {
  background(220); 
  
  const sections = sqrt(boxes);
  const spacing = canvas_size / sections;
  for (let i = 1; i < sections; i++) {
    line(spacing * i, 0, spacing * i, canvas_size);
    // Corrected the line call here
    line(0, spacing * i, canvas_size, spacing * i);
  }

  fill(0);
  noStroke();
  for (let point of controlPoints) {
    circle(point.x, point.y, 8);
  }

  noFill();
  stroke(255, 0, 0);
  strokeWeight(3);
  beginShape();
  for (let point of trackCurvePoints) {
    vertex(point.x, point.y);
  }
  endShape(CLOSE);
}

// BUG FIX: This function is now in main.js so it has access to p5.js
function sortPoints(points) {
  let centerX = 0;
  let centerY = 0;
  for (let p of points) {
    centerX += p.x;
    centerY += p.y;
  }
  centerX /= points.length;
  centerY /= points.length;

  points.sort((a, b) => {
    let angleA = atan2(a.y - centerY, a.x - centerX);
    let angleB = atan2(b.y - centerY, b.x - centerX);
    return angleA - angleB;
  });

  return points;
}