let loadingComplete = false;

let currentProgress = 0; // 0..1 tracked by Pace



/* --- Config (same style/values you used originally) --- */
const DURATION = 20000; // loading time ms
const SPIN_TIME = 1500, PAUSE_TIME = 250, INITIAL_SPIN_DELAY = 0;
const WAVE_AMP = [10, 14, 18];
const WAVE_LENGTH = [80, 110, 150];
const WAVE_SPEED = [0.12, 0.24, 0.04];
const WAVE_SAMPLES = 140;



/* Fill geometry (matches the large SVG coordinate system) */
const FILL_TOP_Y = 35;      // top target (visually above)
const FILL_BOTTOM_Y = 400;   // starting point below SVG so waves animate upward

/* DOM refs */
const overlay = document.getElementById('overlay');
const loader = document.getElementById('loader');
const maskedWavesGroup = document.getElementById('maskedWaves');
const waveEls = [
  document.getElementById('wave1'),
  document.getElementById('wave2'),
  document.getElementById('wave3')
];















/* --- FROZEN WAVES: simple, one-time fade-ins at progress thresholds --- */
const FROZEN_THRESHOLDS = [0.35, 0.55, 0.75, 0.95]; // 25%, 50%, 75%, 95%
const frozenEls = [
  document.getElementById('frozenWave1'),
  document.getElementById('frozenWave2'),
  document.getElementById('frozenWave3'),
  document.getElementById('frozenWave4')
];
// solid fills for ez
const FROZEN_FILLS = [
  'rgba(15, 76, 117,0.9)',     // red
  'rgba(27, 107, 163,0.9)',  // bright blue
  'rgba(46, 139, 192,0.9)',  // neon pink
  'rgba(135, 206, 235,0.85)',   // neon green
];
const frozenShown = [false, false, false, false];





// -------------------- (progress wiring) --------------------
Pace.on('progress', function(progress) {
  // Pace gives a float 0..100 (v1.2.4), convert to 0..1
  currentProgress = Math.min(Math.max(progress / 100, 0), 1);

  // simple explicit checks (keeps logic obvious and ordered)
  if (!frozenShown[0] && currentProgress >= FROZEN_THRESHOLDS[0]) showFrozen(0);
  if (!frozenShown[1] && currentProgress >= FROZEN_THRESHOLDS[1]) showFrozen(1);
  if (!frozenShown[2] && currentProgress >= FROZEN_THRESHOLDS[2]) showFrozen(2);
  if (!frozenShown[3] && currentProgress >= FROZEN_THRESHOLDS[3]) showFrozen(3);
});
// --------------------------------------------------------------------s




/* ---------- helper: reorder frozen DOM so index 0 is topmost ---------- */
/* We want the visual top (last child) to be lowest threshold (index 0).
   Append elements in order bottom->top: [n-1, n-2, ..., 0]. */
function reorderFrozenDOM() {
  if (!maskedWavesGroup) return;
  const n = frozenEls.length;
  // iterate bottom->top and append existing elements in that order
  for (let k = n - 1; k >= 0; k--) {
    const node = frozenEls[k];
    if (node && node.parentNode !== maskedWavesGroup) {
      // If it isn't yet appended, append it (putting it into stack)
      maskedWavesGroup.appendChild(node);
    } else if (node) {
      // ensure correct order by re-appending in needed order
      maskedWavesGroup.appendChild(node);
    }
  }
}

/* ---------- improved showFrozen with paint-before-fade + reordering ---------- */
function showFrozen(i) {
  const el = frozenEls[i];
  if (!el || frozenShown[i]) return;

  // ensure we have an element (defensive — your markup already creates them)
  // set geometry + fill BEFORE making visible
  el.setAttribute('d', buildWavePath(FROZEN_THRESHOLDS[i], WAVE_AMP[0], WAVE_LENGTH[0], 0));
  el.setAttribute('fill', FROZEN_FILLS[i] || FROZEN_FILLS[FROZEN_FILLS.length - 1]);

  // ensure it's in the maskedWavesGroup (so the mask applies)
  if (maskedWavesGroup && el.parentNode !== maskedWavesGroup) {
    maskedWavesGroup.appendChild(el);
  }

  // reorder all frozen elements so index 0 ends up topmost (last child)
  reorderFrozenDOM();

  // ensure CSS transition is present
  el.style.transition = el.style.transition || 'opacity 260ms ease-out';

  // start hidden (use style property so subsequent RAF flip triggers transition)
  el.style.opacity = '0';

  // debug: print progress and index so you can confirm in console
  console.log(`[frozen] scheduling show index=${i} threshold=${Math.round(FROZEN_THRESHOLDS[i]*100)}% current=${Math.round(currentProgress*100)}%`);

  // flip to visible in next frame so the browser paints the 0->1 transition
  requestAnimationFrame(() => {
    // double-check element still exists before flipping
    if (!el) return;
    el.style.opacity = '1';
    frozenShown[i] = true;
  });
}







// On load complete, only reveal those whose thresholds are <= currentProgress.
// We iterate *in reverse* so if many reveal at once, re-ordering + RAF ensure proper stacking + fade.
Pace.once('done', function () {
  loadingComplete = true;

  // if progress is <1, use the currentProgress we've been tracking; otherwise use 1.0
  const finalProgress = Math.min(Math.max(currentProgress, 0), 1) || 1.0;

  // Reveal in reverse index order to avoid transient wrong stacking
  for (let i = frozenEls.length - 1; i >= 0; i--) {
    if (!frozenShown[i] && finalProgress >= FROZEN_THRESHOLDS[i]) {
      showFrozen(i);
    }
  }
});



















/* Flower groups we must rotate and keep in sync:
   - maskFlowerGroup is inside <mask> (white shapes)
   - visibleFlowerGroup is drawn visibly on top
   Both groups already include the translate(63 63) to center the 0..274 viewBox at 200,200 */
const maskFlowerGroup = document.getElementById('maskFlowerGroup');
const visibleFlowerGroup = document.getElementById('visibleFlowerGroup');

/* (optional) debug SVG if you want to re-enable visual-only copy */
const debugFlowerSvg = document.getElementById('debugFlower');

let startTs = null;
let loaded = false;
let running = true;
let firstSpin = true;
let phases = [0,0,0];




// When Pace is fully done, trigger loader complete
Pace.once('done', function() {
  // when finished, enable click to reveal
  
    loadingComplete = true;
    loaded = true;
    
    if (visibleFlowerGroup) {
  // 1) give the flower a real hitbox:
  //    paths currently have fill="none", so clicks don’t register by default.
  const paths = visibleFlowerGroup.querySelectorAll('path');
  paths.forEach(p => {
    // transparent paint still counts as "painted", so pointer hits it
    p.setAttribute('fill', 'rgba(0,0,0,0.001)');
    // if you also have strokes later, this keeps it simple:
    p.style.pointerEvents = 'visiblePainted';
  });

  // 2) now make the flower group interactive
  visibleFlowerGroup.style.pointerEvents = 'auto';
  visibleFlowerGroup.style.cursor = 'pointer';
  visibleFlowerGroup.addEventListener('click', startRevealSequence);
}
});


/* Helper to build wave path (same math as original) */
function buildWavePath(fillFraction, amp, wavelength, phase){
  const fillTopY = FILL_BOTTOM_Y - fillFraction * (FILL_BOTTOM_Y - FILL_TOP_Y);
  const leftX = -300, rightX = 700;
  const step = (rightX - leftX) / WAVE_SAMPLES;
  let d = `M ${leftX} ${fillTopY} `;
  for(let i=0;i<=WAVE_SAMPLES;i++){
    const x = leftX + i*step;
    const y = fillTopY + Math.sin((x / wavelength) * Math.PI * 2 + phase) * amp;
    d += `L ${x} ${y} `;
  }
  d += `L ${rightX} 800 L ${leftX} 800 Z`;
  return d;
}

// Example ease-in-out function
function easeInOutQuad(t) {
  return t < 0.5
    ? 2 * t * t
    : -1 + (4 - 2 * t) * t;
}

let lastAngle = 0;
let stopping = false;
let stopAt = 0;

function easeInOut(t) {
  return t < 0.5
    ? 2 * t * t
    : -1 + (4 - 2 * t) * t;
}

function computeSpinAngle(elapsed) {
  const cycle = SPIN_TIME + PAUSE_TIME;

  // Start stopping sequence when loading is marked complete
  if (loadingComplete && !stopping) {
    stopping = true;
    stopAt = Math.ceil((elapsed - INITIAL_SPIN_DELAY) / cycle) * cycle + INITIAL_SPIN_DELAY;
  }

  // Once we've passed the stop point, freeze at last eased angle
  if (stopping && elapsed >= stopAt) {
    return lastAngle;
  }

  let angle = 0;
  if (firstSpin) {
    if (elapsed > INITIAL_SPIN_DELAY) {
      const spinElapsed = elapsed - INITIAL_SPIN_DELAY;
      const cyclePos = spinElapsed % cycle;
      if (cyclePos < SPIN_TIME) {
        const t = cyclePos / SPIN_TIME;
        angle = easeInOut(t) * 90;
      }
    }
  } else {
    const cyclePos = elapsed % cycle;
    if (cyclePos < SPIN_TIME) {
      const t = cyclePos / SPIN_TIME;
      angle = easeInOut(t) * 90;
    }
  }

  if (elapsed > INITIAL_SPIN_DELAY + cycle) firstSpin = false;

  lastAngle = angle;
  return angle;
}



/* Apply same transform to both mask group and visible group.
   Note: both groups already include translate(63 63) in their markup,
   so we apply only the rotate(...) around the local 137,137 coordinate.
   To avoid replacing their existing translate, we set the entire transform
   attribute to `translate(63 63) rotate(angle 137 137)`. */
function setFlowerRotation(angleDeg){
  const t = `translate(63 63) rotate(${angleDeg} 137 137)`;
  if (maskFlowerGroup) maskFlowerGroup.setAttribute('transform', t);
  if (visibleFlowerGroup) visibleFlowerGroup.setAttribute('transform', t);
  // Optionally rotate debug copy as well (if visible)
  if (debugFlowerSvg && debugFlowerSvg.style.display !== 'none') {
    // debug is a separate SVG element — rotate via CSS to keep behavior identical
    debugFlowerSvg.style.transform = `rotate(${angleDeg}deg)`;
  }
}

/* RAF loop */
function frame(ts){
  if(!running) return;
  if(!startTs) startTs = ts;
  const elapsed = ts - startTs;

  const eased = currentProgress;

  // rotation angle for flower (spin-pause-spin behavior)
  const angle = computeSpinAngle(elapsed);

  // apply rotation to mask + visible groups (keeps mask & visible in sync and centered)
  setFlowerRotation(angle);





























// visible fills for the frozen waves (different opacities for depth)



  phases = phases.map((ph, i) => ph + WAVE_SPEED[i]);
  waveEls.forEach((el, i) => {
    if (!el) return;
    const d = buildWavePath(eased, WAVE_AMP[i], WAVE_LENGTH[i], phases[i]);
    el.setAttribute('d', d);
  });



  // --------------------  (animate frozen waves at fixed heights) --------------------
  // Ensure frozen waves animate (move) but stay at their threshold fill fraction.
  for (let i = 0; i < frozenEls.length; i++) {
    const el = frozenEls[i];
    if (!el || !frozenShown[i]) continue;

    // choose per-index amplitude/wavelength to create visual separation
    const amp = (WAVE_AMP[0] * 0.6) + i * 2;
    const wavelength = WAVE_LENGTH[0] + i * 10;

    // give each frozen wave its own horizontal phase offset
    const PHASE_OFFSETS = [0, Math.PI / 3, Math.PI * 2/3, Math.PI]; 
    const phase = (phases[0] || 0) + (PHASE_OFFSETS[i] || 0);

    // threshold is the fixed vertical fill fraction for this frozen wave
    const fillFrac = (FROZEN_THRESHOLDS[i] !== undefined) ? FROZEN_THRESHOLDS[i] : 0.5;

    // rebuild and write path every frame
    const dFrozen = buildWavePath(fillFrac, amp, wavelength, phase);
    try { el.setAttribute('d', dFrozen); } catch(e) { /* defensive */ }
  }
  // -----------------------------------------------------------------------------------------










  

  
  requestAnimationFrame(frame);
}

/* Reveal sequence */
function startRevealSequence(){
  // remove click listeners to prevent spam
  document.getElementById('visibleFlowerGroup').removeEventListener('click', startRevealSequence);  
  visibleFlowerGroup.style.cursor = 'auto'; // reset cursor

  var elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }

  running = false;

  /* play audio */
  const audio = document.getElementById('myAudioStart');
  if (audio) {
    audio.currentTime = 0; // reset to start
    audio.play().catch(err => console.warn('Audio play failed:', err));
  }

  document.getElementById('loader').classList.add('faded');

  setTimeout(()=>{
    overlay.classList.add('split');

    setTimeout(()=> {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 800);
  }, 600);
}

/* Entrance animation: show loader & waves group */
setTimeout(()=>{
  document.getElementById('loader').classList.add('show');
  // The maskedWaves group is used for the masked waves
  const masked = document.getElementById('maskedWaves');
  if (masked) masked.classList.add('show');
}, 100);

/* Kick off RAF */
requestAnimationFrame(frame);

/* Debug helper: expose current state to console if needed */
window.__FLOWER_LOADER = {
  setFlowerRotation,
  buildWavePath,
  config: {
    DURATION, SPIN_TIME, PAUSE_TIME, INITIAL_SPIN_DELAY,
    WAVE_AMP, WAVE_LENGTH, WAVE_SPEED, WAVE_SAMPLES
  }
};

/* End of script: large-file padding/comments below for verbosity */
/* Additional notes:
   - The flower coordinates live in a 0..274 viewBox. The loader SVG center is at (200,200).
     To center the flower we translate it by (63,63) (200 - 137 = 63).
   - We rotate both the mask group (inside <mask>) and the visible duplicate with the exact
     same transform string so the mask and visible flowers always match.
   - Rotating the whole parent SVG can clip things in some browsers; rotating the groups avoids
     that and keeps the mask geometry working reliably.
   - If you later move the loader SVG or change viewBoxes, update the translate offset accordingly.
*/
(function _debug_padding(){
  // no-op block to make the file longer / easier to grep while debugging
  const _notes = [
    'Mask+visible groups are transformed identically.',
    'Translate(63 63) centers 0..274 flower at loader center (200,200).',
    'If you change viewBoxes adjust translate and rotation pivot accordingly.'
  ];
  window.__LOADER_DEBUG_NOTES = _notes;
})();