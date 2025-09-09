// These are your global variables, accessible by all functions
let controlPoints = [];
let trackCurvePoints = [];
let trackBoundaries;
let idealRacingLine = []; // The new, intelligent ideal line
let playerLinePoints = [];
let startTime = 0;
let isGameOver = false;
let finalScore;
let zoomedViewActive = false;
let startLinePoint1;
let startLinePoint2;

// Game constants
const boxes = 16;
const canvas_size = 800;
const POINT_PROBABILITY = 0.5;
const CORNER_PROBABILITY = 0.3;
const TRACK_WIDTH = 25; 
const ZOOM_FACTOR = 3;

function setup() {
  createCanvas(canvas_size, canvas_size);
  
  // Calculate grid dimensions
  const sections = sqrt(boxes);
  const spacing = canvas_size / sections;

  // Generate the random control points with a probability check
  for (let y = 0; y < sections; y++) {
    for (let x = 0; x < sections; x++) {
      if (random() < POINT_PROBABILITY) {
        const box_x_start = x * spacing;
        const box_y_start = y * spacing;
        const px = random(box_x_start, box_x_start + spacing);
        const py = random(box_y_start, box_y_start + spacing);
        
        // Add a "isCorner" property with a random chance
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

  // Ensure there are at least 3 points to prevent errors
  if (controlPoints.length < 3) {
      for (let i = 0; i < 4; i++) {
        controlPoints.push(createVector(random(width), random(height)));
      }
  }
  
  // Sort the points by angle to prevent track overlap
  controlPoints = sortPoints(controlPoints);

  // Generate the smooth centerline and the track boundaries
  trackCurvePoints = generateTrack(controlPoints, 100);
  trackBoundaries = generateBoundaries(trackCurvePoints, TRACK_WIDTH);

  // Calculate the more intelligent ideal racing line
  idealRacingLine = generateIdealRacingLine(trackCurvePoints, trackBoundaries);

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
  // Clear the canvas on every frame
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
  
  // Player's drawing logic (only when game is not over)
  if (!isGameOver) {
    if (mouseIsPressed) {
      playerLinePoints.push(createVector(mouseX, mouseY));
      
      if (startTime === 0) {
        startTime = frameCount; 
      }
      zoomedViewActive = true;
    } else {
      zoomedViewActive = false;
      
      // End of game trigger: if mouse is released and a line has been drawn
      if (playerLinePoints.length > 0 && !isGameOver) {
        const finalTime = (frameCount - startTime) / 60;
        // Pass the NEW idealRacingLine to the scoring function
        finalScore = calculateFinalScore(playerLinePoints, idealRacingLine, finalTime);
        isGameOver = true;
        console.log("Final Score:", finalScore);
      }
    }
  }
  
  // Draw the player's drawn line
  noFill();
  stroke(0, 0, 255); 
  strokeWeight(5);
  beginShape();
  for (let point of playerLinePoints) {
    vertex(point.x, point.y);
  }
  endShape();
  
  // Stopwatch logic
  if (startTime > 0 && !isGameOver) {
    let elapsedFrames = frameCount - startTime;
    let elapsedSeconds = (elapsedFrames / 60).toFixed(2);
    
    textSize(32);
    fill(0);
    text(elapsedSeconds, 10, 30);
  }

  // Display the final score when the game is over
  if (isGameOver) {
    textSize(48);
    textAlign(CENTER);
    fill(0);
    text("Final Score: " + finalScore.total, width / 2, height / 2);
    textSize(24);
    text("Accuracy: " + finalScore.accuracy + " / 720", width / 2, height / 2 + 50);
    text("Time: " + finalScore.time + " / 480", width / 2, height / 2 + 80);
    
    // Draw the ideal racing line to show the player
    noFill();
    stroke(255, 0, 0); // Draw in red
    strokeWeight(5);
    beginShape();
    for (let point of idealRacingLine) {
      vertex(point.x, point.y);
    }
    endShape();
  }

  // Zoomed-in view (only when active and not over)
  if (zoomedViewActive && !isGameOver) {
    push();
    translate(mouseX, mouseY);
    scale(ZOOM_FACTOR);
    translate(-mouseX, -mouseY);

    fill(255, 255, 255, 150);
    stroke(0);
    strokeWeight(1);
    circle(mouseX, mouseY, 100);

    noFill();
    stroke(0, 0, 255);
    strokeWeight(5 / ZOOM_FACTOR);
    beginShape();
    for (let point of playerLinePoints) {
      vertex(point.x, point.y);
    }
    endShape();

    stroke(100, 100, 100);
    strokeWeight(2 / ZOOM_FACTOR);
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

    fill(255, 0, 0);
    noStroke();
    circle(mouseX, mouseY, 4 / ZOOM_FACTOR);

    pop();
  }
}

// Function to sort points by angle (needed for a non-overlapping track)
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