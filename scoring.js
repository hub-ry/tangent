// Function to calculate the final score
function calculateFinalScore(playerLine, idealLine, userTime, trackLength, trackBoundaries) {
  // Constants for scoring adjustments
  const minRequiredLineLength = trackLength * 0.98; // 98% of track length
  const closedLoopTolerance = 30; // Max distance for a closed loop

  // Early exits for unfinished attempts
  if (playerLine.length < minRequiredLineLength) {
    return { accuracy: 0, time: 0, total: 400, message: "Line is too short." };
  }
  
  const lastPlayerPoint = playerLine[playerLine.length - 1];
  const firstIdealPoint = idealLine[0];
  const loopDistance = dist(lastPlayerPoint.x, lastPlayerPoint.y, firstIdealPoint.x, firstIdealPoint.y);
  if (loopDistance > closedLoopTolerance) {
    return { accuracy: 0, time: 0, total: 400, message: "Line did not close the loop." };
  }

  // --- New Off-Track Check and Penalty ---
  const offTrackPenalty = checkOffTrack(playerLine, trackBoundaries);
  const totalOffTrackPenalty = offTrackPenalty > 0 ? 500 : 0; // A severe penalty for going off track

  if (totalOffTrackPenalty > 0) {
      return { accuracy: 0, time: 0, total: 400 - totalOffTrackPenalty, message: "You went off the track!" };
  }

  // --- Accuracy Score (60% weight) ---
  const max_acceptable_deviation = 50;
  let totalDeviation = 0;
  for (let playerPoint of playerLine) {
    let minDistance = Infinity;
    for (let idealPoint of idealLine) {
      let d = dist(playerPoint.x, playerPoint.y, idealPoint.x, idealPoint.y);
      if (d < minDistance) {
        minDistance = d;
      }
    }
    totalDeviation += minDistance;
  }
  const averageDeviation = totalDeviation / playerLine.length;
  const accuracyPercentage = max(0, 1 - (averageDeviation / max_acceptable_deviation));
  const accuracyScore = accuracyPercentage * 720;

  // --- Smoothness/Velocity Score (Penalty) ---
  const maxPointDensity = 25; // Max points per 100 pixels
  const playerLineLength = calculateLineLength(playerLine);
  const pointDensity = (playerLine.length / playerLineLength) * 100;
  
  let smoothnessPenalty = 0;
  if (pointDensity > maxPointDensity) {
    smoothnessPenalty = (pointDensity - maxPointDensity) * 5;
  }

  // --- Time Score (40% weight) ---
  const targetTime = 60;
  const timePercentage = min(1, targetTime / userTime);
  const timeScore = timePercentage * 480;

  // --- Calculate Final Score ---
  const finalScore = 400 + accuracyScore + timeScore - smoothnessPenalty;

  return {
    accuracy: round(accuracyScore),
    time: round(timeScore),
    total: round(finalScore),
    message: "Success!"
  };
}

// Helper function to check if a line is outside the boundaries
function checkOffTrack(playerLine, trackBoundaries) {
  for (let playerPoint of playerLine) {
    let isInside = false;
    let minDistanceToOuter = Infinity;
    let minDistanceToInner = Infinity;
    
    // Find the minimum distance to both boundaries
    for (let i = 0; i < trackBoundaries.outer.length; i++) {
        const outerPoint = trackBoundaries.outer[i];
        const innerPoint = trackBoundaries.inner[i];
        
        let dOuter = dist(playerPoint.x, playerPoint.y, outerPoint.x, outerPoint.y);
        let dInner = dist(playerPoint.x, playerPoint.y, innerPoint.x, innerPoint.y);
        
        if (dOuter < minDistanceToOuter) minDistanceToOuter = dOuter;
        if (dInner < minDistanceToInner) minDistanceToInner = dInner;
    }
    
    // Simple check: if a point is outside both boundaries, it's off track
    if (minDistanceToOuter > 10 && minDistanceToInner > 10) { // Using a tolerance
      // This is a simple heuristic. A more robust check would involve checking which side of the line the point is on.
      return true;
    }
  }
  return false;
}

// Helper function to calculate the length of a line
function calculateLineLength(points) {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
        length += dist(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
    }
    return length;
}