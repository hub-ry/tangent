const boxes = 16;
const canvas_size = 400;

function setup() {
  /* call a function from track.js to creat the track */

  createCanvas(400, 400);
}

function draw() {
  background(220);
  if (mouseIsPressed === true) {
  fill(0);
} else {
  fill(255);
}

circle(mouseX, mouseY, 100);

const partitions = sqrt(boxes);
const one_x = canvas_size/sections;
const three_x = one_x * 3;
const two_x = one_x * 2;

line(0, one_x, canvas_size, one_x);
line(0, two_x, canvas_size, two_x);
line(0, three_x, canvas_size, three_x);

line(one_x, 0, one_x, canvas_size);
line(two_x, 0, two_x, canvas_size);
line(three_x, 0, three_x, canvas_size);
}

