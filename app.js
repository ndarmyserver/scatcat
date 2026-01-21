let data = [];
let index = 0;

const TOTAL_TIME = 120;
let remaining = TOTAL_TIME;
let running = false;
let lastTick = null;
let lastDisplayedSecond = Math.ceil(remaining);
const markers = { minute: 60, thirty: 30, ten: 10 };
let audioUnlocked = false;

const wordOvalEl = document.getElementById("wordOvalText");
const wordEl = document.getElementById("word");
const descEl = document.getElementById("description");
const toggleBtn = document.getElementById("toggleDescription");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const timerEl = document.getElementById("timer");
const startStopBtn = document.getElementById("startStop");
const resetBtn = document.getElementById("reset");
const progressFill = document.getElementById("progressFill");

const beep = document.getElementById("beep");
const buzzer = document.getElementById("buzzer");

const beepsTriggered = new Set();

fetch("data.json")
  .then(res => res.json())
  .then(json => {
    // data = shuffle(json);
    data = json;
    render();
  });

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function render() {
  const item = data[index];
  descEl.classList.add("hidden");
  wordEl.textContent = formatWordForVertical(item.word.toUpperCase());
  descEl.textContent = item.description;
  toggleBtn.textContent = "SHOW";
  wordOvalEl.textContent = item.word.toUpperCase();

  // Update empty squares text
  const emptySquares = Math.max(13 - item.word.replace(/[“”]/g, "").replace(/\s+/g, "").length, 0);
  const emptySquaresTextEl = document.getElementById("emptySquaresText");
  emptySquaresTextEl.textContent = `You should have ${emptySquares} empty squares.`;

  prevBtn.style.visibility = index === 0 ? "hidden" : "visible";
  nextBtn.style.visibility = index === data.length - 1 ? "hidden" : "visible";
}

toggleBtn.onclick = () => {
  descEl.classList.toggle("hidden");
  toggleBtn.textContent = descEl.classList.contains("hidden") ? "SHOW" : "HIDE";
};

prevBtn.onclick = () => {
  if (index > 0) index--;
  render();
  resetTimer();
};

nextBtn.onclick = () => {
  if (index < data.length - 1) index++;
  render();
  resetTimer();
};

function formatWordForVertical(word) {
  // Remove spaces, split letters
  return word
    .replace(/[“”]/g, "") // remove angled double quotes
    .replace(/\s+/g, "")  // remove spaces
    .split("")
    .join("\n");
}

for (const [name, seconds] of Object.entries(markers)) {
  const barHeightPercent = (seconds / TOTAL_TIME) * 100;
  const topPercent = 100 - barHeightPercent; // convert to top offset
  const el = document.querySelector(`.marker.${name}`);
  if (el) el.style.top = topPercent + '%';
}

/* TIMER */
startStopBtn.onclick = () => {
  if (!running) {
    // START
    if (!audioUnlocked) {
      unlockAudio(beep);
      unlockAudio(buzzer);
      audioUnlocked = true;
    }

    running = true;
    lastTick = performance.now(); // initialize timing here

    startStopBtn.textContent = "STOP";
    startStopBtn.className = "stop";
  } else {
    // STOP
    running = false;

    startStopBtn.textContent = "START";
    startStopBtn.className = "start";
  }
};

resetBtn.onclick = resetTimer;

function resetTimer() {
  running = false;
  remaining = TOTAL_TIME;
  lastDisplayedSecond = TOTAL_TIME + 1; // so first beep triggers
  beepsTriggered.clear();
  updateTimer(Math.ceil(remaining), 1); // full progress bar
  startStopBtn.textContent = "START";
  startStopBtn.className = "start";
  startStopBtn.style.visibility = "visible";
};

function updateTimer(displayedSecond, progressFraction) {
  const min = Math.floor(displayedSecond / 60);
  const sec = (displayedSecond % 60).toString().padStart(2, "0");
  timerEl.textContent = `${min}:${sec}`;

  progressFill.style.height = `${progressFraction * 100}%`;
}

function tick(now) {
  if (running) {
    const delta = (now - lastTick) / 1000;
    lastTick = now;
    remaining -= delta;

    const displayedSecond = Math.max(Math.ceil(remaining), 0);
    const progressFraction = Math.max(remaining / TOTAL_TIME, 0);

    // Beep checks
    checkBeeps(displayedSecond);

    // Buzzer at zero
    if (displayedSecond === 0 && lastDisplayedSecond > 0) {
      buzzer.play();
    }

    updateTimer(displayedSecond, progressFraction);

    lastDisplayedSecond = displayedSecond;

    if (remaining <= 0) {
      remaining = 0;
      running = false;
      startStopBtn.style.visibility = "hidden";
      startStopBtn.textContent = "START";
      startStopBtn.className = "start";
    }
  }
  requestAnimationFrame(tick);
}

function checkBeeps(displayedSecond) {
  const marks = [60, 30, 10];

  marks.forEach(m => {
    if (
      displayedSecond === m &&
      lastDisplayedSecond > m &&
      !beepsTriggered.has(m)
    ) {
      beep.play();
      beepsTriggered.add(m);
    }
  });
}

function unlockAudio(audioEl) {
  audioEl.muted = true;
  audioEl.play().then(() => {
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.muted = false;
  }).catch(() => { });
}

// Set toggle button width to be the larger of the width of the two words
const toggleLabels = ['SHOW', 'HIDE'];
const navLabels = ['PREVIOUS', 'NEXT'];
function getButtonWidth(labels, whichButton) {
  let maxTextWidth = 0;

  labels.forEach(label => {
    const span = document.createElement('span');
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.fontSize = window.getComputedStyle(whichButton).fontSize;
    span.style.fontWeight = window.getComputedStyle(whichButton).fontWeight;
    span.innerText = label;
    document.body.appendChild(span);
    const width = span.getBoundingClientRect().width;
    if (width > maxTextWidth) maxTextWidth = width;
    document.body.removeChild(span);
  });

  const paddingLeft = parseFloat(window.getComputedStyle(whichButton).paddingLeft);
  const paddingRight = parseFloat(window.getComputedStyle(whichButton).paddingRight);

  whichButton.style.width = `${maxTextWidth + paddingLeft + paddingRight}px`;
}

function resizeButtons() {
  getButtonWidth(toggleLabels, toggleBtn);
  getButtonWidth(navLabels, prevBtn);
  getButtonWidth(navLabels, nextBtn);
}

// Run once on page load
resizeButtons();

// Re-run whenever the window resizes
window.addEventListener('resize', () => {
  resizeButtons();
});

updateTimer(lastDisplayedSecond);
requestAnimationFrame(tick);