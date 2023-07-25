// Variables to store audio elements and animation triggers
const dropArea1 = document.getElementById('dropArea1');
const dropArea2 = document.getElementById('dropArea2');
const animationTrigger1 = document.getElementById('animationTrigger1');
const animationTrigger2 = document.getElementById('animationTrigger2');
const compileAudioBtn = document.getElementById('compileAudio');
const compiledAudio = document.getElementById('compiledAudio');
let audioClips = [];

// Function to handle drag and drop events
function handleDrop(event) {
  event.preventDefault();
  const audioFile = event.dataTransfer.files[0];
  let audioElement; // Declare the audioElement variable here

  if (audioFile instanceof File) {
    const reader = new FileReader();

    reader.onload = function (e) {
      const audioData = e.target.result;
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      audioContext.decodeAudioData(audioData)
        .then((audioBuffer) => {
          audioElement = document.createElement('audio');
          audioElement.src = URL.createObjectURL(audioFile);
          audioElement.controls = true;
          audioElement.preload = 'auto';
          audioElement.draggable = true;
          audioClips.push(audioBuffer);

          // Clear the 'Drag and drop audio here' text and append the audio element
          event.currentTarget.innerHTML = '';
          event.currentTarget.appendChild(audioElement);
        })
        .catch((error) => console.error('Error decoding audio data:', error));
    };

    reader.readAsArrayBuffer(audioFile);
  }

  // Remove the draggable attribute from audioElement if it's defined
  if (audioElement) {
    audioElement.removeAttribute('draggable');
  }
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDragEnter(event) {
  event.preventDefault();
}

// Function to trigger animation based on button click
function triggerAnimation1() {
  // Code to trigger animation 1
  document.querySelector('.mixer').style.backgroundColor = 'red';
}

function triggerAnimation2() {
  // Code to trigger animation 2
  document.querySelectorAll('.drop-area').forEach((dropArea) => {
    dropArea.style.color = 'blue';
  });
}

// Function to compile audio tracks and play the compiled track
function compileAudio() {
  if (audioClips.length > 0) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioContext.createGain();
    const destination = audioContext.destination;

    // Connect the gain node to the audio context's destination (speakers)
    gainNode.connect(destination);

    // Create an array to store the audio buffers
    const buffers = [];

    // Load each audio clip as a buffer and push it to the buffers array
    Promise.all(
      audioClips.map((clip) => {
        return fetch(clip.src)
          .then((response) => response.arrayBuffer())
          .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
          .then((audioBuffer) => buffers.push(audioBuffer));
      })
    )
      .then(() => {
        // Concatenate the audio buffers
        const finalBufferLength = buffers.reduce((acc, buffer) => acc + buffer.length, 0);
        const finalBuffer = audioContext.createBuffer(2, finalBufferLength, audioContext.sampleRate);
        let offset = 0;
        buffers.forEach((buffer) => {
          finalBuffer.getChannelData(0).set(buffer.getChannelData(0), offset);
          finalBuffer.getChannelData(1).set(buffer.getChannelData(1), offset);
          offset += buffer.length;
        });

        // Set the buffer to the audio source node and connect it to the gain node
        const source = audioContext.createBufferSource();
        source.buffer = finalBuffer;
        source.connect(gainNode);

        // Start playing the audio
        source.start();

        // Set the gain node's gain value (volume)
        gainNode.gain.value = 1.0; // Adjust the value (0.0 to 1.0) for desired volume

        // Set the source to the compiledAudio element for controls
        compiledAudio.srcObject = audioContext;
      })
      .catch((error) => console.error('Error loading audio:', error));
  }
}

// Function to handle the "Reset" button click event
function resetMixer() {
  // Stop and remove any compiled audio playing
  if (compiledAudio.srcObject) {
    const audioContext = compiledAudio.srcObject;
    audioContext.close().then(() => {
      compiledAudio.srcObject = null;
    });
  }

  // Reset the audioClips array and remove any draggable attribute from audio elements
  audioClips.forEach((audioElement) => {
    audioElement.removeAttribute('draggable');
  });
  audioClips = [];

  // Clear the drop areas
  dropArea1.innerHTML = 'Drag and drop audio here';
  dropArea2.innerHTML = 'Drag and drop audio here';
}

// Add event listeners for drag and drop functionality
dropArea1.addEventListener('drop', handleDrop);
dropArea1.addEventListener('dragover', handleDragOver);
dropArea1.addEventListener('dragenter', handleDragEnter);
dropArea2.addEventListener('drop', handleDrop);
dropArea2.addEventListener('dragover', handleDragOver);
dropArea2.addEventListener('dragenter', handleDragEnter);

// Add event listeners for animation triggers
animationTrigger1.addEventListener('click', triggerAnimation1);
animationTrigger2.addEventListener('click', triggerAnimation2);

// Add event listener for the "Reset" button
const resetButton = document.getElementById('resetButton');
resetButton.addEventListener('click', resetMixer);

// Add event listener for audio compilation
compileAudioBtn.addEventListener('click', compileAudio);
