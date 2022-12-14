//Serial Stuff
var serial;   // variable to hold an instance of the serialport library
var portName = '/dev/tty.usbmodem14401';    // fill in your serial port name here


var socket;
let video;
let facemesh;

let predictions = [];
let normalized = new Array(468*3);

var emotions;

function setup() {
  //Set up serial communication port
  serial = new p5.SerialPort();       // make a new instance of the serialport library
  serial.on('list', printList);  // set a callback function for the serialport list event
  serial.on('connected', serverConnected); // callback for connecting to the server
  serial.on('open', portOpen);        // callback for the port opening
  serial.on('data', serialEvent);     // callback for when new data arrives
  serial.on('error', serialError);    // callback for errors
  serial.on('close', portClose);      // callback for the port closing
  serial.list();                      // list the serial ports
  serial.open(portName);              // open a serial port

  socket = io.connect(window.location.origin);
  const canvas = createCanvas(640, 480);
  canvas.parent("videoContainer");
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  facemesh = ml5.facemesh(video, modelReady);
  // This sets up an event that fills the global variable "predictions"
  // with an array every time new predictions are made
  facemesh.on("face", results => {
    predictions = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();

  socket.on('ping', function (data) {
    console.log(data);
  });

  socket.on('outputData',
    function(data) {
      emotions = data.args[0].value;

      // for(var n = 0; n < data.args.length; n++) {
      //   println(n + ": " + data.args[n].value);
      // }
    }
  );
  hellotest();
}


function draw() {
  image(video, 0, 0, width, height);
  if(emotions==1) {
    text('Calm', 10, 30);
  } else if (emotions==2){
    text('Happy', 10, 30); 
  } else if (emotions==3){
    text('Suprised', 10, 30); 
  } else if (emotions==4) {
    text('Angry', 10, 30); 
  }


 // We can call both functions to draw all keypoints and the skeletons
 drawBoxes();
 drawKeypoints();
 setInterval(hellotest(), 1000);
}

async function hellotest() {
  await sleep(1000)
  for (let j = 0; j < predictions[0].scaledMesh.length*3; j += 3) {
    const i = j/3;
    normalized[j]={type: "float", value: predictions[0].scaledMesh[i][0]-predictions[0].boundingBox.topLeft[0][0]};
    normalized[j+1]={type: "float", value: predictions[0].scaledMesh[i][1]-predictions[0].boundingBox.topLeft[0][1]}; 
    normalized[j+2]={type: "float", value: predictions[0].scaledMesh[i][2]};

  }
  socket.emit('inputData', normalized);
  //Serial Setup
  serial.write(emotions);
  // setInterval(function () {socket.emit('inputData', { x: predictions[0].boundingBox.topLeft[0][0], y: predictions[0].boundingBox.topLeft[0][1]})}, 1000);
}

// a custom 'sleep' or wait' function, that returns a Promise that resolves only after a timeout
function sleep(millisecondsDuration) {
  return new Promise((resolve) => {
    setTimeout(resolve, millisecondsDuration);
  })
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

// Following functions print the serial communication status to the console for debugging purposes
function printList(portList) {
  // portList is an array of serial port names
  for (var i = 0; i < portList.length; i++) {
  // Display the list the console:
  print(i + " " + portList[i]);
  }
 }
 
 function serverConnected() {
   print('connected to server.');
 }
 
 function portOpen() {
   print('the serial port opened.')
 }
 
 function serialEvent() {
   inData = Number(serial.read());
 }
 
 function serialError(err) {
   print('Something went wrong with the serial port. ' + err);
 }
 
 function portClose() {
   print('The serial port closed.');
 }