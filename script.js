let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let tracks = {
  track1: {
    element: new Audio(),
    source: null,
    filter: null,
    gainNode: null,
    analyser: null,
    playbackRate: 1
  },
  track2: {
    element: new Audio(),
    source: null,
    filter: null,
    gainNode: null,
    analyser: null,
    playbackRate: 1
  }
};

// Map songs to their corresponding images
const songImages = {
  "assets/audio/ta-turbinada.mp3": "assets/images/images.jpeg",
  "assets/audio/senhor-senhor.mp3": "assets/images/maxresdefault.jpg",
  "assets/audio/deixei-tudo-por-ela.mp3": "assets/images/naom_65e6ef9f3f5e5.jpg",
  "assets/audio/pao-com-manteiga.mp3": "assets/images/sddefault.jpg",
  "assets/audio/ja-nao-doi.mp3": "assets/images/maxresdefault-2.jpg",
  "assets/audio/filho-do-recluso.mp3": "assets/images/ab67616d0000b2732f745b855da1bdf508ecd09b.jpg",
  "assets/audio/o-bacalhau-quer-alho.mp3": "assets/images/ab67616d0000b273d0a1f2a12d8287e031739a57.jpg",
  "assets/audio/obrigado-jose-socrates.mp3": "assets/images/ljieao2tuana.jpg",
  "assets/audio/fui-cagar-ao-cemiterio.mp3": "assets/images/1200x1200bf-60.jpg",
  "assets/audio/freaky.mp3": "assets/images/img_1200x1200$2018_06_09_19_52_00_746199.jpg",
  "assets/audio/o-preco-certo.mp3": "assets/images/naom_640ae51715f21.jpg"
};

// Ensure the audio context is resumed upon user interaction
document.addEventListener('click', () => {
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed.');
    });
  }
});

function loadTrack(trackId) {
  const track = tracks[trackId];
  const trackUrl = document.getElementById(trackId).value;

  if (track.element.src !== trackUrl) {
    track.element.src = trackUrl;
    track.element.load();

    // Add event listener for error handling
    track.element.addEventListener('error', (event) => {
      console.error('Error loading track:', event);
    });
  }
}

function playTrack(trackId) {
  const track = tracks[trackId];
  const disc = document.getElementById(trackId === 'track1' ? 'disc1' : 'disc2');
  const trackUrl = document.getElementById(trackId).value;

  // Check if a source node already exists
  if (!track.source) {
    track.source = audioContext.createMediaElementSource(track.element);
    track.filter = audioContext.createBiquadFilter();
    track.gainNode = audioContext.createGain();
    track.analyser = audioContext.createAnalyser();
    track.filter.type = 'lowpass';
    track.filter.frequency.value = 10000;
    track.source.connect(track.filter);
    track.filter.connect(track.gainNode);
    track.gainNode.connect(track.analyser);
    track.analyser.connect(audioContext.destination);
    visualize();
  }

  // Ensure the playback rate is set correctly
  track.element.playbackRate = track.playbackRate;

  track.element.addEventListener('canplaythrough', () => {
    track.element.play().then(() => {
      console.log('Track is playing.');
      disc.style.backgroundImage = `url(${songImages[trackUrl]})`;
      disc.classList.add('spinning'); // Add spinning class
    }).catch(error => {
      console.error('Error playing track:', error);
    });
  }, { once: true });

  track.element.addEventListener('error', (event) => {
    console.error('Error loading track:', event);
  });

  track.element.addEventListener('abort', (event) => {
    console.error('Playback aborted:', event);
  });
}

function pauseTrack(trackId) {
  const track = tracks[trackId];
  const disc = document.getElementById(trackId === 'track1' ? 'disc1' : 'disc2');
  track.element.pause();
  disc.classList.remove('spinning'); // Remove spinning class
}

function stopTrack(trackId) {
  const track = tracks[trackId];
  const disc = document.getElementById(trackId === 'track1' ? 'disc1' : 'disc2');
  track.element.pause();
  track.element.currentTime = 0;
  disc.classList.remove('spinning'); // Remove spinning class

  // Disconnect the source node
  if (track.source) {
    track.source.disconnect();
    track.source = null;
  }
}

function changeVolume(trackId) {
  const volume = document.getElementById('volume' + trackId.slice(-1)).value;
  tracks[trackId].gainNode.gain.value = volume;
}

function crossfade() {
  const crossfadeValue = document.getElementById('crossfade').value;
  tracks.track1.gainNode.gain.value = 1 - crossfadeValue;
  tracks.track2.gainNode.gain.value = crossfadeValue;
}

function applyFilter(filterType) {
  for (let trackId in tracks) {
    if (tracks[trackId].filter) {
      tracks[trackId].filter.type = filterType;
    }
  }
}

function visualize() {
  const canvas = document.getElementById('visualizer');
  const canvasCtx = canvas.getContext('2d');
  const analyser = tracks.track1.analyser || tracks.track2.analyser;
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    const barWidth = (width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];

      const r = barHeight + 25 * (i / bufferLength);
      const g = 250 * (i / bufferLength);
      const b = 50;

      canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
      canvasCtx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);

      x += barWidth + 1;
    }
  }

  draw();
}

// Scratching functionality
const discs = document.querySelectorAll('.disc');

discs.forEach(disc => {
  disc.addEventListener('mousedown', () => {
    document.addEventListener('mousemove', scratch);
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', scratch);
    });
  });
});

function scratch(event) {
  const disc = event.target;
  const trackId = disc.id === 'disc1' ? 'track1' : 'track2';
  const track = tracks[trackId];
  const speed = (event.movementX + event.movementY) * 0.1;
  track.element.playbackRate += speed;
}
