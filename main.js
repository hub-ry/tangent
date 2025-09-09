// These are your global variables, accessible by all functions
let controlPoints = [];
let trackCurvePoints = [];
let trackBoundaries;
let playerLinePoints = [];
let startTime = 0;
let zoomedViewActive = false; // New flag for the zoomed view
let startLinePoint1; // New variables for the start line
let startLinePoint2; 

// Game constants
const boxes = 16;
const canvas_size = 800;
const POINT_PROBABILITY = 0.5;
const CORNER_PROBABILITY = 0.3;
const TRACK_WIDTH = 25; 
const ZOOM_FACTOR = 3; // How much to zoom in

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
        
        let isCorner = false;
        if (random() < CORNER_PROBABILITY) {
          isCorner = true;
        }
        
        controlPoints.push({
          x: px,
          y: py,
          isCorner: isCorner 
        });
      }
    }
  }

  if (controlPoints.length < 3) {
      for (let i = 0; i < 4; i++) {
        controlPoints.push(createVector(random(width), random(height)));
      }
  }
  
  controlPoints = sortPoints(controlPoints);

  trackCurvePoints = generateTrack(controlPoints, 100);
  trackBoundaries = generateBoundaries(trackCurvePoints, TRACK_WIDTH);

  // Calculate Start Line (using the first point of the outer boundary for reference)
  if (trackBoundaries.outer.length > 0) {
    const p1_outer = trackBoundaries.outer[0];
    const p1_inner = trackBoundaries.inner[0];
    
    // The start line connects these two points
    startLinePoint1 = createVector(p1_outer.x, p1_outer.y);
    startLinePoint2 = createVector(p1_inner.x, p1_inner.y);
  }
}

function draw() {
  background(220); 
  
  // Draw the grid lines
  const sections = sqrt(boxes);
  const spacing = canvas_size / sections;
  for (let i = 1; i < sections; i++) {
    line(spacing * i, 0, spacing * i, canvas_size);
    line(0, spacing * i, canvas_size, spacing * i);
  }

  // Draw the control points
  fill(0);
  noStroke();
  for (let point of controlPoints) {
    circle(point.x, point.y, 8);
  }

  // Draw the inner and outer track boundaries
  noFill();
  stroke(100, 100, 100); 
  strokeWeight(2);
  
  beginShape();
  for (let point of trackBoundaries.outer) {
    vertex(point.x, point.y);
  }
  endShape(CLOSE);
  
  beginShape();
  for (let point of trackBoundaries.inner) {
    vertex(point.x, point.y);
  }
  endShape(CLOSE);

  // Draw the Start Line
  if (startLinePoint1 && startLinePoint2) {
    stroke(0, 200, 0); // Green color for the start line
    strokeWeight(4);
    line(startLinePoint1.x, startLinePoint1.y, startLinePoint2.x, startLinePoint2.y);
  }
  
  // Player's drawing logic
  if (mouseIsPressed) {
    playerLinePoints.push(createVector(mouseX, mouseY));
    
    // Start the timer on the first click
    if (startTime === 0) {
      startTime = frameCount; 
    }
    zoomedViewActive = true; // Activate zoomed view when mouse is pressed
  } else {
    zoomedViewActive = false; // Deactivate zoomed view when mouse is not pressed
  }
  
  // Draw the player's drawn line (always drawn on the main canvas)
  noFill();
  stroke(0, 0, 255); 
  strokeWeight(5);
  beginShape();
  for (let point of playerLinePoints) {
    vertex(point.x, point.y);
  }
  endShape();
  
  // Stopwatch logic
  if (startTime > 0) {
    let elapsedFrames = frameCount - startTime;
    let elapsedSeconds = (elapsedFrames / 60).toFixed(2);
    
    textSize(32);
    fill(0);
    text(elapsedSeconds, 10, 30);
  }

  // Zoomed-in view (only when active)
  if (zoomedViewActive) {
    push(); // Save current drawing state

    // Move to mouse position and scale up
    translate(mouseX, mouseY);
    scale(ZOOM_FACTOR);
    translate(-mouseX, -mouseY); // Translate back to keep mouse at center of zoomed view

    // Draw a magnified circle around the mouse cursor
    // The main background is already drawn, so we draw a new circle to contain the zoomed area
    fill(255, 255, 255, 150); // Semi-transparent white background for the zoomed circle
    stroke(0);
    strokeWeight(1);
    circle(mouseX, mouseY, 100); // Draw the circle for the magnified view

    // Re-draw the player's line points within the zoomed circle to make them visible
    noFill();
    stroke(0, 0, 255); // Blue
    strokeWeight(5 / ZOOM_FACTOR); // Adjust stroke weight for zoom
    beginShape();
    for (let point of playerLinePoints) {
      vertex(point.x, point.y);
    }
    endShape();

    // Re-draw the track boundaries within the zoomed circle
    stroke(100, 100, 100); // Gray
    strokeWeight(2 / ZOOM_FACTOR); // Adjust stroke weight for zoom
    beginShape();
    for (let point of trackBoundaries.outer) {
      vertex(point.x, point.y);
    }
    endShape(CLOSE);
    
    beginShape();
    for (let point of trackBoundaries.inner) {
      vertex(point.x, point.y);
    }
    endShape(CLOSE);

    // Draw a small red dot at the actual mouse position for precision
    fill(255, 0, 0); // Red
    noStroke();
    circle(mouseX, mouseY, 4 / ZOOM_FACTOR); // Smaller dot for magnified precision

    pop(); // Restore original drawing state
  }
}

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
}g