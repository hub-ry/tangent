// Function to generate the track
function generateTrack(controlPoints, segments) {
  let trackPoints = [];
  let totalPoints = controlPoints.length;

  for (let i = 0; i < totalPoints; i++) {
    // Get the four points needed for the Catmull-Rom calculation
    // This handles the looping for a closed track
    const p0 = controlPoints[(i - 1 + totalPoints) % totalPoints];
    const p1 = controlPoints[i];
    const p2 = controlPoints[(i + 1) % totalPoints];
    const p3 = controlPoints[(i + 2) % totalPoints];

    // Calculate 'segments' points for this curve section
    for (let j = 0; j < segments; j++) {
      const t = j / segments;
      const t2 = t * t;
      const t3 = t2 * t;

      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      
      trackPoints.push(createVector(x, y));
    }
  }
  return trackPoints;
}

function generateBoundaries(trackPoints, trackWidth) {
  let innerPoints = [];
  let outerPoints = [];

  for (let i = 0; i < trackPoints.length; i++) {
    const p1 = trackPoints[i];
    const p2 = trackPoints[(i + 1) % trackPoints.length];
    
    // Calculate the direction vector of the line segment
    const direction = p5.Vector.sub(p2, p1).normalize();
    
    // Calculate the normal (perpendicular) vector
    const normal = createVector(-direction.y, direction.x);

    // Get the inner and outer points
    const inner = p5.Vector.sub(p1, p5.Vector.mult(normal, trackWidth / 2));
    const outer = p5.Vector.add(p1, p5.Vector.mult(normal, trackWidth / 2));

    innerPoints.push(inner);
    outerPoints.push(outer);
  }
  return { inner: innerPoints, outer: outerPoints };
}

// A function to find the tight corners and generate a realistic ideal racing line
function generateIdealRacingLine(centerlinePoints, trackBoundaries) {
  let idealRacingLine = [];
  const minAngleDiff = 0.5; // Threshold for identifying a corner
  const idealOffset = 0.4; // 40% offset from centerline

  // Step 1: Find the tight corners
  let cornerIndices = [];
  for (let i = 0; i < centerlinePoints.length; i++) {
    const p_prev = centerlinePoints[ (i - 1 + centerlinePoints.length) % centerlinePoints.length];
    const p_curr = centerlinePoints[i];
    const p_next = centerlinePoints[ (i + 1) % centerlinePoints.length];

    const angle1 = atan2(p_curr.y - p_prev.y, p_curr.x - p_prev.x);
    const angle2 = atan2(p_next.y - p_curr.y, p_next.x - p_curr.x);
    let angleDiff = abs(angle2 - angle1);
    if (angleDiff > PI) angleDiff = 2 * PI - angleDiff;
    
    if (angleDiff > minAngleDiff) {
      cornerIndices.push(i);
    }
  }

  if (cornerIndices.length < 2) {
      return centerlinePoints; // Fallback to centerline if no corners found
  }

  // Step 2: Create a new line connecting the "outside-apex-outside" points
  for (let i = 0; i < centerlinePoints.length; i++) {
    const p_curr = centerlinePoints[i];

    // Check if the current point is a corner
    const isCorner = cornerIndices.includes(i);
    const isStraight = !isCorner && !cornerIndices.includes((i - 1 + centerlinePoints.length) % centerlinePoints.length);

    if (isCorner) {
      // Find the apex point on the inner boundary
      const innerBoundaryPoint = trackBoundaries.inner[i];
      idealRacingLine.push(innerBoundaryPoint);
    } else if (isStraight) {
      // For straights, stay on the centerline
      idealRacingLine.push(p_curr);
    } else {
      // This is a transition point, move towards the outside
      const outerBoundaryPoint = trackBoundaries.outer[i];
      idealRacingLine.push(outerBoundaryPoint);
    }
  }

  return idealRacingLine;
}