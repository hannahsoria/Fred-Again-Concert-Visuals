// Hannah Soria
// ATLS 5660 
// Final
// User Controlled Concert Visuals for Fred Again

// Documentation is in the txt file

// Intructions: Create concert visuals for Fred Again! Click on the desired song and then you can chose your visuals. You can have one visual, one background, and one text at a time. The visuals, color, and volume is adjustable.

// Global variables

// array to hold the songs
let songs = [];

let songFiles = [
  "assets/jan.mp3","assets/eyelar.mp3","assets/delilah.mp3","assets/kammy.mp3",
  "assets/berwyn.mp3","assets/bleu.mp3","assets/nathan.mp3","assets/danielle.mp3",
  "assets/kelly.mp3","assets/mustafa.mp3","assets/clara.mp3","assets/winnie.mp3","assets/sep.mp3"
];

let songLabels = [
  "January 1st 2022","Eyelar (Shutters)","Delilah (pull me out of this)","Kammy (like i do)",
  "Berwyn (all i got is you)","Bleu (better with time)","Nathan (still breathing)","Danielle (smile on my face)",
  "Kelly (end of a nightmare)","Mustafa (time to move you)","Clara (the night is dark)","Winnie (end of me)",
  "September 9th 2022"
];

// vars for color slider; starting at the album blue
let currR = 31;
let currG = 58;
let currB = 184;

// variable for the spectrum slider
let specSize = 0;

// sound variables

// FFT -> analyzes audio frequencies
// waveform -> amplitude over time
// amplitude -> volume level
let fft, waveform, amplitude;

// track if audio is playing
let started = false;

// threshold that the audio must exceed for a beat to be detected
let beatCutoff = 0;

// minimum vol that counts as a beat
let beatThreshold = 0.12;

// time to go back to normal threshold
let beatDecayRate = 0.95;

// number of frames to hold a detected beat before decay
// prevents multiple detections of the same beat
let beatHoldFrames = 20;

// counter for how many frames the beat has been held
let beatFrames = 0;

// var to visually enlarge objects
let beatScale = 1;

// the largest an object gets
let maxScale = 1.2;

// rate that object returns to normal size
let decaySpeed = 0.1;

// check of current color
let textIsBlack = true;

// check is beat happened
let beatTriggered = false;

// check what str is active
let fred = true;

// ref to canvas
let visualCanvas;

// current song being played
let currentSongIndex = 0;
let volumeSlider;
let specSlider;

// video obj
let video;

// grid gloabl vars
// current scale for grid circles
let gridBeatScale = 1;
// how big circles get on beat
let gridMaxScale = 2;
// speed of returning to normal size
let gridDecaySpeed = 0.1;
// will increment to animate circles
let timeOffset = 0;

// Visual mode and buttons
let currentVisual = null;
let currentBG = null; 
let currentTxt = null; 
let spectrumBtn, waveformBtn, ampBarBtn, strobeBtn, gridBtn, againFlashBtn;

// Song buttons for highlighting
let songButtons = [];

// ------------------------ Preload ------------------------
function preload() {
  // load all of the song files in
  for (let file of songFiles) {
    songs.push(loadSound(file));
  }
}

// ------------------------ Setup ------------------------
function setup() {
  // TOP CANVAS
  visualCanvas = createCanvas(900, 500);
  visualCanvas.parent("visual-container");
  

  // sound set up; collect all of the different aspects
  fft = new p5.FFT(0.9, 1024);
  waveform = new p5.FFT(0.9, 1024);
  amplitude = new p5.Amplitude();
  
  // controls how quickly amplitude responds to the sound
  amplitude.smooth(0.7);

  // suspend audio context until user interacts
  getAudioContext().suspend();

  // ------------------------ Controls (songs) ------------------------
  // overall controls
  // * I used AI to initally understand how to start this lower canvas and draw the buttons
  let controlHolder = createDiv();
  controlHolder.parent("control-container");
  controlHolder.style("background-color", "#212121");
  controlHolder.style("padding", "20px");
  controlHolder.style("width", "860px");

  // tracks
  let songColumn = createDiv();
  songColumn.parent(controlHolder);
  songColumn.style("display", "inline-block");
  songColumn.style("vertical-align", "top");
  songColumn.style("margin-right", "30px");

  // tracks label
  let songLabelDiv = createDiv("Tracks");
  songLabelDiv.parent(songColumn);
  songLabelDiv.style("color", "white");
  songLabelDiv.style("text-align", "center");
  songLabelDiv.style("margin-bottom", "6px");

  // song buttons
  for (let i = 0; i < songLabels.length; i++) {
    let btn = createButton(songLabels[i]);
    btn.parent(songColumn);
    styleButton(btn);
    
    // if mouse is pressed play the song and highlight the button
    btn.mousePressed(() => {
      startAudio(i);
      highlightActiveSongButton(btn);
    });
    
    // store the song buttons
    songButtons.push(btn);
  }
 
  // ------------------------ Controls (sound and color) ------------------------
  // controls column
  let controlsColumn = createDiv();
  controlsColumn.parent(controlHolder);
  controlsColumn.style("display", "inline-block");
  controlsColumn.style("vertical-align", "top");
  
  // sound label
  let controlLabel = createDiv("Sound Controls");
  controlLabel.parent(controlsColumn);
  controlLabel.style("color", "white");
  controlLabel.style("text-align", "center");
  controlLabel.style("margin-bottom", "6px");

  // next song
  let nextBtn = createButton("Next Song");
  nextBtn.parent(controlsColumn);
  styleButton(nextBtn);
  nextBtn.mousePressed(nextSong);

  // previous song
  let prevBtn = createButton("Previous Song");
  prevBtn.parent(controlsColumn);
  styleButton(prevBtn);
  prevBtn.mousePressed(previousSong);
  
  // pause / play
  let pauseBtn = createButton("Pause/Play");
  pauseBtn.parent(controlsColumn);
  styleButton(pauseBtn);
  pauseBtn.mousePressed(pausePlay);

  // stop
  let stopBtn = createButton("Stop");
  stopBtn.parent(controlsColumn);
  styleButton(stopBtn);
  stopBtn.mousePressed(stopAudio);
  
  // label for volume slider
  let volumeLabel = createDiv("Volume");
  volumeLabel.parent(controlsColumn);
  volumeLabel.style("color", "white");
  volumeLabel.style("text-align", "center");
  volumeLabel.style("margin-bottom", "6px");

  // volume slider
  volumeSlider = createSlider(0, 1, 0.5, 0.01);
  volumeSlider.parent(controlsColumn);
  volumeSlider.elt.style.height = "2px"; // force thin track
  volumeSlider.elt.style.webkitAppearance = 'none';
  volumeSlider.elt.style.mozAppearance = 'none';
  volumeSlider.elt.style.appearance = 'none';
  volumeSlider.elt.style.width = '180px';
  volumeSlider.elt.style.marginBottom = '15px';
  
  // color control label
  let colorLabel = createDiv("Color Controls");
  colorLabel.parent(controlsColumn);
  colorLabel.style("color", "white");
  colorLabel.style("text-align", "center");
  colorLabel.style("margin-bottom", "6px");
  
  // R label
  let colorLabelR = createDiv("R");
  colorLabelR.parent(controlsColumn);
  colorLabelR.style("color", "white");
  colorLabelR.style("text-align", "center");
  colorLabelR.style("margin-bottom", "6px");
  
  // R slider (starts at 31/255 -> default blue)
  colorSlider = createSlider(0, 1, 31/255, 0.01);
  colorSlider.parent(controlsColumn);
  colorSlider.elt.style.height = "2px";
  colorSlider.elt.style.width = "180px";
  colorSlider.elt.style.marginBottom = "15px";
  colorSlider.elt.style.webkitAppearance = 'none';
  colorSlider.elt.style.mozAppearance = 'none';
  colorSlider.elt.style.appearance = 'none';
  
  // G label
  let colorLabelG = createDiv("G");
  colorLabelG.parent(controlsColumn);
  colorLabelG.style("color", "white");
  colorLabelG.style("text-align", "center");
  colorLabelG.style("margin-bottom", "6px");
  
  // G slider (starts at 58/255 -> default blue)
  colorSlider2 = createSlider(0, 1, 58/255, 0.01);
  colorSlider2.parent(controlsColumn);
  colorSlider2.elt.style.height = "2px";
  colorSlider2.elt.style.width = "180px";
  colorSlider2.elt.style.marginBottom = "15px";
  colorSlider2.elt.style.webkitAppearance = 'none';
  colorSlider2.elt.style.mozAppearance = 'none';
  colorSlider2.elt.style.appearance = 'none';
  
  // B label
  let colorLabelB = createDiv("B");
  colorLabelB.parent(controlsColumn);
  colorLabelB.style("color", "white");
  colorLabelB.style("text-align", "center");
  colorLabelB.style("margin-bottom", "6px");

  // B slider (starts at 184/255 -> default blue)
  colorSlider3 = createSlider(0, 1, 184/255, 0.01);
  colorSlider3.parent(controlsColumn);
  colorSlider3.elt.style.height = "2px";
  colorSlider3.elt.style.width = "180px";
  colorSlider3.elt.style.marginBottom = "15px";
  colorSlider3.elt.style.webkitAppearance = 'none';
  colorSlider3.elt.style.mozAppearance = 'none';
  colorSlider3.elt.style.appearance = 'none';
  
  // reset to original blue color
  resetColorBtn = createButton("Reset Background Color");
  resetColorBtn.parent(controlsColumn);
  styleButton(resetColorBtn);
  resetColorBtn.mousePressed(resetColor);

  // ------------------------ Controls (visuals) ------------------------
  let visualColumn = createDiv();
  visualColumn.parent(controlHolder);
  visualColumn.style("display", "inline-block");
  visualColumn.style("vertical-align", "top");
  visualColumn.style("margin-left", "30px");
  
  // control label
  let visualLabel = createDiv("Visual Controls");
  visualLabel.parent(visualColumn);
  visualLabel.style("color", "white");
  visualLabel.style("text-align", "center");
  visualLabel.style("margin-bottom", "6px");

  // spectrum rings button
  spectrumBtn = createButton("Spectrum Rings");
  spectrumBtn.parent(visualColumn);
  styleButton(spectrumBtn);
  spectrumBtn.mousePressed(() => toggleVisual("spectrum"));
  
  // wavefrom line button
  wavelineBtn = createButton("Wavefrom Line");
  wavelineBtn.parent(visualColumn);
  styleButton(wavelineBtn);
  wavelineBtn.mousePressed(() => toggleVisual("line"));

  // waveform circle button
  waveformBtn = createButton("Waveform Circle");
  waveformBtn.parent(visualColumn);
  styleButton(waveformBtn);
  waveformBtn.mousePressed(() => toggleVisual("waveform"));
  
  // amplitude bar button
  ampBarBtn = createButton("Amplitude Bar");
  ampBarBtn.parent(visualColumn);
  styleButton(ampBarBtn);
  ampBarBtn.mousePressed(() => toggleVisual("amplitudebar"));
  
  // grid button
  gridBtn = createButton("Grid of Circles");
  gridBtn.parent(visualColumn);
  styleButton(gridBtn);
  gridBtn.mousePressed(() => toggleVisual("grid"));
  
  // ------------------------ Controls (background) ------------------------
  let backgroundLabel = createDiv("Background Controls");
  backgroundLabel.parent(visualColumn);
  backgroundLabel.style("color", "white");
  backgroundLabel.style("text-align", "center");
  backgroundLabel.style("margin-top", "62px");
  
  // background beat
  strobeBtn = createButton("Background Strobe");
  strobeBtn.parent(visualColumn);
  styleButton(strobeBtn);
  strobeBtn.mousePressed(() => toggleBG("strobe"));
  
  // background circles
  circleBtn = createButton("Circle Strobe");
  circleBtn.parent(visualColumn);
  styleButton(circleBtn);
  circleBtn.mousePressed(() => toggleBG("circle"));
  
  // beat Pulse
  pulseBtn = createButton("Screen Pulse");
  pulseBtn.parent(visualColumn);
  styleButton(pulseBtn);
  pulseBtn.mousePressed(() => toggleBG("pulse"));
  
  againBtn = createButton("Again wave");
  againBtn.parent(visualColumn);
  styleButton(againBtn);
  againBtn.mousePressed(() => toggleBG("again"));
  
  // crowd
  crowdBtn = createButton("Crowd");
  crowdBtn.parent(visualColumn);
  styleButton(crowdBtn);
  crowdBtn.mousePressed(() => toggleBG("crowd"));
  
  // ------------------------ Controls (visual sliders) ------------------------
  let textColumn = createDiv();
  textColumn.parent(controlHolder);
  textColumn.style("display", "inline-block");
  textColumn.style("vertical-align", "top");
  textColumn.style("margin-left", "30px"); // spacing from Visual Controls
  
  // spectrum size label
  let spectrumLabel = createDiv("Spectrum Size");
  spectrumLabel.parent(textColumn);
  spectrumLabel.style("color", "white");
  spectrumLabel.style("text-align", "center");
  spectrumLabel.style("margin-bottom", "6px");
  
  // spectrum slider 
  specSlider = createSlider(10, 200, 50, 1); // min 10, max 200, default 50
  specSlider.parent(textColumn);
  specSlider.elt.style.height = "2px";
  specSlider.elt.style.width = "180px";
  specSlider.elt.style.marginBottom = "15px";
  specSlider.elt.style.webkitAppearance = 'none';
  specSlider.elt.style.mozAppearance = 'none';
  specSlider.elt.style.appearance = 'none';
  
  // waveform size label
  let waveLabel = createDiv("Waveform Size");
  waveLabel.parent(textColumn);
  waveLabel.style("color", "white");
  waveLabel.style("text-align", "center");
  waveLabel.style("margin-bottom", "6px");
  
  // waveform size slider 
  waveCircleSlider = createSlider(10, 200, 70, 1); // min 10, max 200, default 70
  waveCircleSlider.parent(textColumn);
  waveCircleSlider.elt.style.height = "2px";
  waveCircleSlider.elt.style.width = "180px";
  waveCircleSlider.elt.style.marginBottom = "15px";
  waveCircleSlider.elt.style.webkitAppearance = 'none';
  waveCircleSlider.elt.style.mozAppearance = 'none';
  waveCircleSlider.elt.style.appearance = 'none';
  
  // waveform amplifier label
  let waveAmpLabel = createDiv("Waveform Amplifier Size");
  waveAmpLabel.parent(textColumn);
  waveAmpLabel.style("color", "white");
  waveAmpLabel.style("text-align", "center");
  waveAmpLabel.style("margin-bottom", "6px");
  
  // waveform amplifier slider
  waveAmpSlider = createSlider(0.5, 5, 3, 0.1);
  waveAmpSlider.parent(textColumn);
  waveAmpSlider.elt.style.height = "2px";
  waveAmpSlider.elt.style.width = "180px";
  waveAmpSlider.elt.style.marginBottom = "15px";
  waveAmpSlider.elt.style.webkitAppearance = 'none';
  waveAmpSlider.elt.style.mozAppearance = 'none';
  waveAmpSlider.elt.style.appearance = 'none';
  
  // amplitude bar label
  let barLabel = createDiv("Amplitude Bar Height");
  barLabel.parent(textColumn);
  barLabel.style("color", "white");
  barLabel.style("text-align", "center");
  barLabel.style("margin-bottom", "6px");
  
  // amplitude bar slider
  barHeightSlider = createSlider(0.1, 2, 1, 0.01); // min, max, default, step
  barHeightSlider.parent(textColumn);
  barHeightSlider.elt.style.height = "2px";
  barHeightSlider.elt.style.width = "180px";
  barHeightSlider.elt.style.marginBottom = "15px";
  barHeightSlider.elt.style.webkitAppearance = 'none';
  barHeightSlider.elt.style.mozAppearance = 'none';
  barHeightSlider.elt.style.appearance = 'none';
  
  // ------------------------ Controls (text) ------------------------
  let textLabel = createDiv("Texts Controls");
  textLabel.parent(textColumn);
  textLabel.style("color", "white");
  textLabel.style("text-align", "center");
  textLabel.style("margin-top", "20px");
  
  // fred again glitch
  glitchBtn = createButton("Fred Again Glitch");
  glitchBtn.parent(textColumn);
  styleButton(glitchBtn);
  glitchBtn.mousePressed(() => toggleText("glitch"));
  
  // sonog title glitch
  glitchTitleBtn = createButton("Song Title Glitch");
  glitchTitleBtn.parent(textColumn);
  styleButton(glitchTitleBtn);
  glitchTitleBtn.mousePressed(() => toggleText("song glitch"));
  
  // beat color
  beatColorBtn = createButton("Beat Color");
  beatColorBtn.parent(textColumn);
  styleButton(beatColorBtn);
  beatColorBtn.mousePressed(() => toggleText("color"));
  
  // again flashing
  againFlashBtn = createButton("Again Flash");
  againFlashBtn.parent(textColumn);
  styleButton(againFlashBtn);
  againFlashBtn.mousePressed(() => toggleText("flash"));
  
  // alternating color
  alternateBtn = createButton("Alternate");
  alternateBtn.parent(textColumn);
  styleButton(alternateBtn);
  alternateBtn.mousePressed(() => toggleText("alternate"));
}

// ------------------------ button styling ------------------------
function styleButton(btn) {
  btn.style("background-color", "#333333");
  btn.style("color", "white");
  btn.style("border", "2px solid white");
  btn.style("padding", "5px");
  btn.style("font-size", "12px");
  btn.style("border-radius", "6px");
  btn.style("margin", "2px");
  btn.style("width", "175px");
  btn.style("display", "block");
}

// ------------------------ visual toggle ------------------------
// changes the color of the buttons according to clicks
// these are separate so that one from each category can be on at a time

// toggle visuals
function toggleVisual(mode) {
  if (currentVisual === mode) {
    currentVisual = null; // turn off
  } else {
    currentVisual = mode; // activate
  }
  updateVisualButtonStyles();
}

// toggle background
function toggleBG(mode) {
  if (currentBG === mode) {
    currentBG = null;
  } else {
    currentBG = mode;
  }
  updateVisualButtonStyles();
}

// toggle texts
function toggleText(mode) {
  if (currentTxt === mode) {
    currentTxt = null;
  } else {
    currentTxt = mode;
  }
  updateVisualButtonStyles();
}

// update the color of the button based on clicks
function updateVisualButtonStyles() {
  // visuals
  if (currentVisual === "spectrum") {
    spectrumBtn.style("background-color", "#5555ff"); // active highlight
    waveformBtn.style("background-color", "#333333");
    ampBarBtn.style("background-color", "#333333");
    gridBtn.style("background-color", "#333333");
    wavelineBtn.style("background-color", "#333333");
  } else if (currentVisual === "line") {
    wavelineBtn.style("background-color", "#5555ff"); // active highlight
    spectrumBtn.style("background-color", "#333333"); 
    waveformBtn.style("background-color", "#333333");
    ampBarBtn.style("background-color", "#333333");
    gridBtn.style("background-color", "#333333");
  }else if (currentVisual === "waveform") {
    waveformBtn.style("background-color", "#5555ff");
    spectrumBtn.style("background-color", "#333333");
    ampBarBtn.style("background-color", "#333333");
    gridBtn.style("background-color", "#333333");
    wavelineBtn.style("background-color", "#333333");
  } else if (currentVisual === "amplitudebar") {
    ampBarBtn.style("background-color", "#5555ff");
    spectrumBtn.style("background-color", "#333333");
    waveformBtn.style("background-color", "#333333");
    gridBtn.style("background-color", "#333333");
    wavelineBtn.style("background-color", "#333333");
  } else if (currentVisual === "grid") {
    gridBtn.style("background-color", "#5555ff");
    ampBarBtn.style("background-color", "#333333");
    spectrumBtn.style("background-color", "#333333");
    waveformBtn.style("background-color", "#333333");
    wavelineBtn.style("background-color", "#333333");
  } else {
    spectrumBtn.style("background-color", "#333333");
    waveformBtn.style("background-color", "#333333");
    ampBarBtn.style("background-color", "#333333");
    gridBtn.style("background-color", "#333333");
    wavelineBtn.style("background-color", "#333333");
  }
  
  // background
  if (currentBG === "strobe") {
    strobeBtn.style("background-color", "#5555ff"); // active 
    circleBtn.style("background-color", "#333333");
    pulseBtn.style("background-color", "#333333");
    crowdBtn.style("background-color", "#333333");
    againBtn.style("background-color", "#333333");
  } else if (currentBG === "circle") {
    circleBtn.style("background-color", "#5555ff");
    strobeBtn.style("background-color", "#333333"); // active 
    pulseBtn.style("background-color", "#333333");
    crowdBtn.style("background-color", "#333333");
    againBtn.style("background-color", "#333333");
  } else if (currentBG === "pulse"){
    pulseBtn.style("background-color", "#5555ff");
    circleBtn.style("background-color", "#333333");
    strobeBtn.style("background-color", "#333333"); // active 
    crowdBtn.style("background-color", "#333333");
    againBtn.style("background-color", "#333333");
  } else if (currentBG === "again"){
    againBtn.style("background-color", "#5555ff");
    strobeBtn.style("background-color", "#333333"); // active 
    circleBtn.style("background-color", "#333333");
    pulseBtn.style("background-color", "#333333");
    crowdBtn.style("background-color", "#333333");
  } else if (currentBG === "crowd"){
    crowdBtn.style("background-color", "#5555ff");
    strobeBtn.style("background-color", "#333333"); // active 
    circleBtn.style("background-color", "#333333");
    pulseBtn.style("background-color", "#333333");
    againBtn.style("background-color", "#333333");
  } else {
    crowdBtn.style("background-color", "#333333");
    strobeBtn.style("background-color", "#333333"); // active 
    circleBtn.style("background-color", "#333333");
    pulseBtn.style("background-color", "#333333");
    againBtn.style("background-color", "#333333");
  }
  
  // text
  if (currentTxt === "glitch") {
    glitchBtn.style("background-color", "#5555ff");
    beatColorBtn.style("background-color", "#333333");
    againFlashBtn.style("background-color", "#333333");
    alternateBtn.style("background-color", "#333333");
    glitchTitleBtn.style("background-color", "#333333");
  } else if (currentTxt === "color") {
    beatColorBtn.style("background-color", "#5555ff");
    glitchBtn.style("background-color", "#333333");
    againFlashBtn.style("background-color", "#333333");
    alternateBtn.style("background-color", "#333333");
    glitchTitleBtn.style("background-color", "#333333");
  } else if (currentTxt === "flash") {
    againFlashBtn.style("background-color", "#5555ff");
    glitchBtn.style("background-color", "#333333");
    beatColorBtn.style("background-color", "#333333");
    alternateBtn.style("background-color", "#333333");
    glitchTitleBtn.style("background-color", "#333333");
  } else if (currentTxt === "alternate") {
    alternateBtn.style("background-color", "#5555ff");
    glitchBtn.style("background-color", "#333333");
    beatColorBtn.style("background-color", "#333333");
    againFlashBtn.style("background-color", "#333333");
    glitchTitleBtn.style("background-color", "#333333");
  } else if (currentTxt === "song glitch"){
    glitchTitleBtn.style("background-color", "#5555ff");
    alternateBtn.style("background-color", "#333333");
    glitchBtn.style("background-color", "#333333");
    beatColorBtn.style("background-color", "#333333");
    againFlashBtn.style("background-color", "#333333");
  } else {
    alternateBtn.style("background-color", "#333333");
    glitchBtn.style("background-color", "#333333");
    beatColorBtn.style("background-color", "#333333");
    againFlashBtn.style("background-color", "#333333");
    glitchTitleBtn.style("background-color", "#333333");
  }
}

// ------------------------ Song Highlight ------------------------
// change the color of the button for the song currently playing
function highlightActiveSongButton(activeBtn) {
  for (let btn of songButtons) {
    if (btn === activeBtn) {
      btn.style("background-color", "#5555ff"); // active
    } else {
      btn.style("background-color", "#333333"); // inactive
    }
  }
}

// ------------------------ Audio Controls ------------------------
function startAudio(i) {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }

  // stop any song currently playing
  for (let s of songs) s.stop();
  
  // plays selected song on a loop
  songs[i].loop();
  
  // set the vol with the slider
  songs[i].setVolume(volumeSlider.value());
  
  // song is started
  started = true;
  
  // keep track of what song is playing
  currentSongIndex = i;
}

// go to the next song in the list
function nextSong() {
  // get the next song in the list
  // % ensures that if its the last song it returns to the start (0)
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  // play song
  startAudio(currentSongIndex);
  // highlight button
  highlightActiveSongButton(songButtons[currentSongIndex]);
}

// go back to the previous song
function previousSong() {
  // get the prev song in the list
  // % ensures that if its the first song it returns to the end
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  // play song
  startAudio(currentSongIndex);
  // highlight button
  highlightActiveSongButton(songButtons[currentSongIndex]);
}

// if the song is playing pause; if it is paused then play
function pausePlay() {
  let s = songs[currentSongIndex];
  if (s.isPlaying()) {
    s.pause();
  } else {
    s.play();
  }
}

// stop the audio
function stopAudio() {
  for (let s of songs) s.stop();
  started = false;
  // remove song button highlight
  for (let btn of songButtons) {
    btn.style("background-color", "#333333");
  }
}

// ------------------------ Draw Loop ------------------------
let firstFrameAfterStart = true;

function draw() {
  if (!started) {
    // Before music starts: show intro text
    background("black");
    fill(255);
    textFont("helvetica");
    textSize(100);
    text("Fred again..", 20, 250);
    textSize(40);
    text("Actual Life 3 (January 1 - September 9 2022)", 20, 325);
    return;
  }
  
  // update color from sliders
  currR = colorSlider.value() * 255;
  currG = colorSlider2.value() * 255;
  currB = colorSlider3.value() * 255;
  
  // clear text first frame after song starts = original  blue
  if (firstFrameAfterStart) {
    background(31, 58, 184);
    firstFrameAfterStart = false;
  } 
  else if (currentBG !== "strobe") {
    // normal background (with trail)
    background(currR, currG, currB, 40);
  }

  // ppdate volume from slider
  songs[currentSongIndex].setVolume(volumeSlider.value());

  // draw visuals if button pressed
  if (currentVisual === "spectrum") spectrumRings();
  else if (currentVisual === "line") waveformLine();
  else if (currentVisual === "waveform") waveformCircle();
  else if (currentVisual === "amplitudebar") amplitudeBar();
  else if (currentVisual === "grid") grid();
  
  // set background if button pressed
  if (currentBG === "strobe") strobeBG();
  else if (currentBG === "circle") circleBG();
  else if (currentBG === "pulse") beatPulse();
  else if (currentBG === "again") againRepeat();
  else if (currentBG === "crowd") crowd();
  
  // show text if button pressed
  if (currentTxt === "glitch") textGlitch();
  else if (currentTxt === "song glitch") currSong();
  else if (currentTxt === "color") beatColor();
  else if (currentTxt === "flash") againFlash();
  else if (currentTxt === "alternate") alternate();
}

// reset the color back to the album blue
function resetColor() {
  // set sliders back to default blue
  colorSlider.value(31/255);
  colorSlider2.value(58/255);
  colorSlider3.value(184/255);

  // reset vars
  currR = 31;
  currG = 58;
  currB = 184;
}

// ------------------------ beat detection ------------------------
// * I used AI to help me figure out this function
function detectBeat(level) {
  // if level above cutoff and threshold
  if (level > beatCutoff && level > beatThreshold) {
    // raise cutoff -> to keep from triggering right away
    beatCutoff = level * 1.5;
    // reset counter
    beatFrames = 0;
    // beat detected
    return true;
  }
  // if no beat
  // wait to detect again
  if (beatFrames <= beatHoldFrames) beatFrames++;
  // applies a smoothness to detection
  else beatCutoff *= beatDecayRate;
  // ensure cutoff is never too low
  beatCutoff = max(beatCutoff, beatThreshold);
  // no beat
  return false;
}

// ------------------------ visualizer functions ------------------------
// creates three rings to visualize spectrum
// * I used AI to help me figure out this function
function spectrumRings() {
  // get the spectrum
  let spectrum = fft.analyze();
  // read slider value
  let spikeBase = specSlider.value();

  // set color
  let baseColor = color(currR, currG, currB);
  // max color (brighter)
  let maxColor = color(
    min(currR + 80, 255),
    min(currG + 80, 255),
    min(currB + 80, 255)
  );

  // decides the color based on the volume
  function volColor(level, factor) {
    return lerpColor(baseColor, maxColor, level * factor);
  }

  //move to the center
  push();
  translate(width / 2, height / 2);
  noFill();

  // draw a ring for the spectrum
  function drawRing(level, baseR, spikeSize, intensity) {
    // depends on volume
    stroke(volColor(level, intensity));
    strokeWeight(5);

    // draw the circle
    beginShape();
    for (let i = 0; i < 180; i++) {
      let angle = (i / 180) * TWO_PI;
      let val = spectrum[i];
      let spike = map(val, 0, 255, 0, spikeSize * level);
      let r = baseR + spike;
      vertex(r * cos(angle), r * sin(angle));
    }
    endShape(CLOSE);
  }

  // draw 3 rings using the slider for spike size
  drawRing(1, 275, spikeBase, 0.15);
  drawRing(1, 200, spikeBase * 0.75, 0.25);
  drawRing(1, 130, spikeBase * 0.5, 0.35);

  pop();
}

// creates a wavefrom line across the middle of the screen
function waveformLine() {
  // safety check
  if (!waveform) return;
  // get waveform array
  let wave = waveform.waveform(); 
  // get slider value
  let ampMultiplier = waveAmpSlider.value(); 

  push();
  // center vertically
  translate(0, height / 2); 
  noFill();
  // use current color
  stroke(currR + 100, currG + 100, currB + 100); 
  strokeWeight(2);

  beginShape();
  // go through the entire array
  for (let i = 0; i < wave.length; i++) {
    // map waveform across the screen for the x vals
    let x = map(i, 0, wave.length, 0, width);
    // convert amplitude value between -1 and 1 to canvas values
    let y = map(wave[i], -1, 1, -100 * ampMultiplier, 100 * ampMultiplier);
    vertex(x, y);
  }
  endShape();
  pop();
}

// visualize the waveform in a circle
// * I used AI to help me figure out this function
function waveformCircle() {
  // read in the data
  let wave = waveform.waveform();
  // blue album color
  let baseColor = color(31, 58, 184);
  // white
  let maxColor = color(255, 255, 255);

  // loudness -> used for color
  let rms = amplitude.getLevel(); 
  // closer to quiet blue; louder is white
  let waveColor = lerpColor(baseColor, maxColor, min(rms * 10, 1)); 

  // controls size of visual
  let baseRadius = waveCircleSlider.value();  
  // control size of spikes
  let ampMultiplier = waveAmpSlider.value();  

  push();
  // move to center
  translate(width / 2, height / 2);
  stroke(waveColor);
  strokeWeight(2);

  for (let i = 0; i < wave.length; i += 2) {
    // convert array index to angle
    let angle = map(i, 0, wave.length, 0, TWO_PI);
    // convert waveform amplitude into radial spike length
    let len = baseRadius + map(wave[i], -1, 1, -80, 80) * ampMultiplier;
    // draw spike
    line(0, 0, len * cos(angle), len * sin(angle));
  }
  pop();
}

// visualize a bar corresponding volume
function amplitudeBar() {
  let level = amplitude.getLevel();
  
  // detect if a beat is happening
  let isBeat = detectBeat(level);

  // map amplitude to screen height
  let baseBarHeight = map(level, 0, 0.5, 0, height); 
  
  // get slider value for scaling the height
  let scale = barHeightSlider.value();
  let barHeight = baseBarHeight * scale;
  
  push();
  // origin at bottom
  translate(0, height); 
  noStroke();

  // change color on beat
  if (isBeat) {
    // reddish when beat hits
    fill(255, 100, 100, 200); 
  } else {
    // normal light blue
    fill(200, 58, 184, 40); 
  }

  // draw rectangle spanning full width
  rect(0, -barHeight, width, barHeight); 
  pop();
}

// visualize a grid of circles reacting to beat
function grid() {
  // num of cols and rows
  let cols = 60;
  let rows = 30;
  // spacing
  let spacingX = width / cols + 1;
  let spacingY = height / rows + 1;

  // check amplitude for beat
  let level = amplitude.getLevel();
  let isBeat = detectBeat(level);

  // beat pulse scaling
  if (isBeat) {
    gridBeatScale = gridMaxScale;
  }
  gridBeatScale = lerp(gridBeatScale, 1, gridDecaySpeed);

  // increment time offset for continuous motion
  timeOffset += 0.02;

  // for each circle location
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      fill("white");
      noStroke();

      // tiny oscillation offsets to give movement
      // * I used AI to help me figure out this part
      let offsetX = sin(timeOffset + i * 0.3 + j * 0.2) * 3; 
      let offsetY = cos(timeOffset + i * 0.3 + j * 0.2) * 3;

      // size of circle depends on beats
      let circleSize = 10 * gridBeatScale;
      // draw the circle
      circle(i * spacingX + offsetX, j * spacingY + offsetY, circleSize);
    }
  }
}

// ------------------------ background functions ------------------------
// strobe on beat
function strobeBG() {
  // get info
  let level = amplitude.getLevel();
  let isBeat = detectBeat(level);

  // if there is a beat
  if (isBeat) {
    // white
    background(255, 255, 255, 150);
  } else {
    // color from slider
    background(currR, currG, currB, 40);
  }
}

// random circles placed on beat
function circleBG() {
  // get ingo
  let level = amplitude.getLevel();
  let isBeat = detectBeat(level);

  // if there is a beat
  if (isBeat) {
    fill("white");
    // random location and size
    circle(random(600), random(300), random(100, 400))
  }
}

// screen scales in on a beat
function beatPulse() {
  // get info
  let level = amplitude.getLevel();
  let isBeat = detectBeat(level);

  // if there's a beat, instantly scale up
  if (isBeat) {
    beatScale = maxScale;
  }

  // smoothly return to normal scale
  beatScale = lerp(beatScale, 1, decaySpeed);

  // apply scaling to the canvas content
  push();
  translate(width / 2, height / 2);
  scale(beatScale);
  translate(-width / 2, -height / 2);
}

// grid of "again" that moves slightly
function againRepeat() {
  // track time for movement
  timeOffset += 0.02;
  // loop through each text spot
  for (let i = 0; i < 90; i ++){
    for (let j = 0; j < 60; j ++){
      
      // Tiny oscillation offsets
      // * I used AI to help me figure out this part
      let offsetX = sin(timeOffset + i * 0.5 + j * 0.2) * 10; 
      let offsetY = cos(timeOffset + i * 0.5 + j * 0.2) * 8;
      
      // draw again
      textSize(20);
      text("again", i * 50 + offsetX, j * 20 + offsetY);
    }
  }
}

// enable crowd view with filter
function crowd() {
  let scl = 6;

  // acqquire the video set size and hide 
  if (!video) {
    video = createCapture(VIDEO);
    video.size(150, 100);
    video.hide();
  }

  video.loadPixels();
  // loop though the pixels
  for (let y = 0; y < video.height; y++) {
    for (let x = 0; x < video.width; x++) {

      // read pixel color from pixels array
      // * I used AI to help me figure out this part down to the lerp functions
      let index = (y * video.width + x) * 4;
      let r = video.pixels[index];
      let g = video.pixels[index + 1];
      let b = video.pixels[index + 2];

      // calculate brightness
      let bright = (r + g + b) / 3;
      // convert value to a 0-1 range
      let t = map(bright, 0, 255, 0, 1);  
      // gamma to preserve detail
      //Raising to the power of 2.2 makes the brightness curve more natural and helps preserve detail in shadows.
      t = pow(t, 2.2);
      // lerp means blend a and b depending on t
      let newR = lerp(currR, 255, t);
      let newG = lerp(currG, 255, t);
      let newB = lerp(currB, 255, t);

      // fill with new color values
      fill(newR, newG, newB);
      noStroke();

      // draw circle
      circle(x * scl, y * scl, scl);
    }
  }
}

// ------------------------ text functions ------------------------
// display fred again name with glitch effect
function textGlitch() {
  // text location
  let baseX = 180;
  let baseY = 270;

  // randomly choose color: either white or black
  let c;
  // gives a number between 0 and 1
  let coinFlip = random(); 

  if (coinFlip < 0.5) {
    //black
    c = color(0)
  } else {
    //white
    c = color(255);
  }
  fill(c);

  textFont("helvetica");
  textSize(100);

  // slight side-to-side glitch offset
  
  let offsetX = random(-3, 3);
  let offsetY = random(-2, 2);

  // draw text with glitching
  text("Fred again..", baseX + offsetX, baseY + offsetY);
}

// display song name with glitch effect
function currSong(){
  push();
  // get the current song index
  let curr = currentSongIndex;
  // get the song name from index
  let name = songLabels[curr];
  
  // randomly choose color: either white or black
  let c;
  // gives a number between 0 and 1
  let coinFlip = random(); 

  if (coinFlip < 0.5) {
    //black
    c = color(0)
  } else {
    //white
    c = color(255);
  }
  fill(c);

  // slight side-to-side glitch offset
  // * I used AI to help me figure out this part
  let offsetX = random(-3, 3);
  let offsetY = random(-2, 2);
  
  // place the text in the center
  textAlign(CENTER, CENTER);
  textSize(50);
  text(name, width / 2 + offsetX, height / 2 + offsetY);
  pop();
}

// change the color of the text on the beat
function beatColor() {
  // get info
  let level = amplitude.getLevel();
  let isBeat = detectBeat(level);

  // flip color only once per beat
  // * I used AI to help me figure out this part
  if (isBeat && !beatTriggered) {
    textIsBlack = !textIsBlack;
    // mark that we've handled this beat
    beatTriggered = true; 
  }

  // reset the trigger when no beat
  if (!isBeat) {
    beatTriggered = false;
  }

  // draw text
  fill(textIsBlack ? "black" : "white");
  textFont("helvetica");
  textSize(200);
  text("Fred", 180, 225);
  text("again..", 180, 400);
}

// flashing grid of again
function againFlash() {
  // get info
  let level = amplitude.getLevel();
  let isBeat = detectBeat(level);

  // for each again spot
  for (let i = 0; i < 3; i ++){
    for (let j = 0; j < 5; j ++){
      // make the middle again white
      if (i == 1 && j == 2){
        fill("white");
      } else {
        // the rest are black
        fill("black");
        if (isBeat ) {
          // on the beat they flash white
          fill("white")
        }
      }
      // draw text
      textSize(120);
      text("again", i * 300 , j * 100 + 80);
    }
  }
}

// switch balc and forth through fred and again
function alternate(){
  // get info 
  let level = amplitude.getLevel();
  let isBeat = detectBeat(level);

  // flip color only once per beat
  // * I used AI to help me figure out this part
  if (isBeat && !beatTriggered) {
    // check which word is displayed
    fred = !fred;
    // mark that we've handled this beat
    beatTriggered = true; 
  }

  // reset the trigger when no beat
  if (!isBeat) {
    beatTriggered = false;
  }

  // draw text
  fill(fred ? "black" : "white");
  textFont("helvetica");
  textSize(250);
  if (fred === true){
    text("Fred", 150, 350);
  } else {
    text("again..", 80, 350);
  }
}

// function to scale canvas provided by Justin Gitlin
function scaleCanvas(displayScale) {
  let cnv = select("canvas").elt;
  canvas.style.setProperty("transform", "scale(" + displayScale + ")");
  canvas.style.setProperty("transform-origin", "left top");
}
