let video;
// Create a KNN classifier
const knnClassifier = ml5.KNNClassifier();
let facemesh;
let predictions = [];
let normalized = new Array(468);

function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("videoContainer");
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create the UI buttons
  createButtons();

  // Create a new poseNet method with a single detection
  facemesh = ml5.facemesh(video, modelReady);
  // This sets up an event that fills the global variable "predictions"
  // with an array every time new predictions are made
  facemesh.on("face", results => {
    predictions = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawBoxes();
  drawKeypoints();
}

function drawBoxes() {
  for (let i = 0; i < predictions.length; i += 1) {
      let x = predictions[i].boundingBox.topLeft[0][0];
      let y = predictions[i].boundingBox.topLeft[0][1];
      let r = predictions[i].boundingBox.bottomRight[0][0];
      let t = predictions[i].boundingBox.bottomRight[0][1]; 

      stroke(44, 169, 225);
      strokeWeight(1);
      noFill();
      rect(x, y, r-x, t-y);
  }
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
  for (let i = 0; i < predictions.length; i += 1) {
    const keypoints = predictions[i].scaledMesh;

    // Draw facial keypoints.
    for (let j = 0; j < keypoints.length; j += 1) {
      const [x, y] = keypoints[j];

      fill(0, 255, 0);
      ellipse(x, y, 5, 5);
    }
  }
}

function modelReady() {
  select("#status").html("model Loaded");
}

// Add the current frame from the video to the classifier
function addExample(label) {
  // Add an example with a label to the classifier

  for (let j = 0; j < predictions[0].scaledMesh.length; j += 1) {
    normalized[j]=[predictions[0].scaledMesh[j][0]-predictions[0].boundingBox.topLeft[0][0], predictions[0].scaledMesh[j][1]-predictions[0].boundingBox.topLeft[0][1],predictions[0].scaledMesh[j][2]];
  } 

  // console.log(normalized)
  // console.log(predictions[0].scaledMesh)
  
  knnClassifier.addExample(normalized, label);
  updateCounts();
}

// Predict the current frame.
function classify() {
  // Get the total number of labels from knnClassifier
  const numLabels = knnClassifier.getNumLabels();
  if (numLabels <= 0) {
    console.error("There is no examples in any label");
    return;
  }
  
  for (let j = 0; j < predictions[0].scaledMesh.length; j += 1) {
    normalized[j]=[predictions[0].scaledMesh[j][0]-predictions[0].boundingBox.topLeft[0][0], predictions[0].scaledMesh[j][1]-predictions[0].boundingBox.topLeft[0][1],predictions[0].scaledMesh[j][2]];
  } 

  // Use knnClassifier to classify which label do these features belong to
  // You can pass in a callback function `gotResults` to knnClassifier.classify function
  knnClassifier.classify(normalized, gotResults);
}

// A util function to create UI buttons
function createButtons() {
  // When the A button is pressed, add the current frame
  // from the video with a label of "A" to the classifier
  buttonA = select("#addClassA");
  buttonA.mousePressed(function() {
    addExample("A");
  });

  // When the B button is pressed, add the current frame
  // from the video with a label of "B" to the classifier
  buttonB = select("#addClassB");
  buttonB.mousePressed(function() {
    addExample("B");
  });

  // Reset buttons
  resetBtnA = select("#resetA");
  resetBtnA.mousePressed(function() {
    clearLabel("A");
  });

  resetBtnB = select("#resetB");
  resetBtnB.mousePressed(function() {
    clearLabel("B");
  });

  // Predict button
  buttonPredict = select("#buttonPredict");
  buttonPredict.mousePressed(classify);

  // Clear all classes button
  buttonClearAll = select("#clearAll");
  buttonClearAll.mousePressed(clearAllLabels);
}

// Show the results
function gotResults(err, result) {
  // Display any error
  if (err) {
    console.error(err);
  }

  if (result.confidencesByLabel) {
    const confidences = result.confidencesByLabel;
    // result.label is the label that has the highest confidence
    if (result.label) {
      select("#result").html(result.label);
      select("#confidence").html(`${confidences[result.label] * 100} %`);
    }

    select("#confidenceA").html(`${confidences.A ? confidences.A * 100 : 0} %`);
    select("#confidenceB").html(`${confidences.B ? confidences.B * 100 : 0} %`);
  }

  classify();
}

// Update the example count for each label
function updateCounts() {
  const counts = knnClassifier.getCountByLabel();

  select("#exampleA").html(counts.A || 0);
  select("#exampleB").html(counts.B || 0);
}

// Clear the examples in one label
function clearLabel(classLabel) {
  knnClassifier.clearLabel(classLabel);
  updateCounts();
}

// Clear all the examples in all labels
function clearAllLabels() {
  knnClassifier.clearAllLabels();
  updateCounts();
}

