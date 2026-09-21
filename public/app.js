const root = document.documentElement;

// Keep one example open at a time, with native details as the no-script fallback.
const featureExamples = [...document.querySelectorAll('.feature-example')];
featureExamples.forEach((example) => {
  example.addEventListener('toggle', () => {
    if (example.open) featureExamples.forEach((other) => {
      if (other !== example) other.open = false;
    });
  });
});

const copyEmail = document.querySelector('.copy-email');
const copyStatus = document.querySelector('.copy-status');
if (copyEmail && copyStatus && navigator.clipboard?.writeText) {
  copyEmail.hidden = false;
  let resetCopy;
  copyEmail.addEventListener('click', async () => {
    clearTimeout(resetCopy);
    try {
      await navigator.clipboard.writeText('alexbrittain9@gmail.com');
      copyEmail.textContent = 'Copied';
      copyStatus.textContent = 'Email address copied to clipboard.';
      resetCopy = setTimeout(() => {
        copyEmail.textContent = 'Copy email';
        copyStatus.textContent = '';
      }, 3000);
    } catch (_) {
      copyEmail.textContent = 'Copy email';
      copyStatus.textContent = 'Could not copy. Email me at alexbrittain9@gmail.com.';
    }
  });
}

// Original monochrome desert-bird silhouette, drawn on a small pixel grid.
function installRunner() {
  const section = document.querySelector('.approach');
  if (!section) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'approach-runner';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  section.append(canvas);
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const touch = matchMedia('(hover: none), (pointer: coarse)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const windupDuration = .48;
  const runDuration = 1.5;
  const resetDuration = .12;
  let hovered = false, visible = false, mobileTriggered = false, mobileRunning = false, frame = 0, previous = 0, elapsed = 0;
  let ink = '';

  function shape(points) {
    ctx.beginPath();
    points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.closePath(); ctx.fill();
  }
  function smooth(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }
  function leg(phase, back, spin) {
    const stride = Math.sin(phase);
    const lift = Math.max(0, Math.cos(phase));
    const runX = 31 + stride * 10;
    const runY = 28 - lift * 8;
    const footX = runX + (30 + Math.cos(phase) * 9 - runX) * spin;
    const footY = runY + (23 + Math.sin(phase) * 6 - runY) * spin;
    ctx.globalAlpha = back ? .65 : 1;
    ctx.lineWidth = 1.5;
    const kneeX = (29 + footX) / 2 + 2;
    const kneeY = (18 + footY) / 2;
    ctx.beginPath();ctx.moveTo(29,18);ctx.lineTo(kneeX,kneeY);ctx.lineTo(footX,footY);
    ctx.lineTo(footX + 4 * (1 - spin) - Math.sin(phase) * 3 * spin,footY + Math.cos(phase) * 2 * spin);ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function revTrails(phase, strength) {
    // Faint motion trails support the connected legs rather than replacing them.
    ctx.lineWidth = .7;
    ctx.globalAlpha = .24 * strength;
    for (const offset of [0, Math.PI]) {
      ctx.beginPath();
      ctx.ellipse(30,23,10,6.5,0,phase + offset - .9,phase + offset);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function paint(time, loop = true) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const cycleTime = reduced.matches ? 0 : loop ? time % (windupDuration + runDuration + resetDuration) : time;
    const revving = !reduced.matches && cycleTime < windupDuration;
    const runTime = Math.max(0,cycleTime - windupDuration);
    if (!reduced.matches && runTime >= runDuration) return false;
    const progress = runTime / runDuration;
    // Integrate a short acceleration, then keep the dash quick and even.
    const ramp = .12;
    const travel = reduced.matches ? .38 : progress < ramp
      ? progress * progress / (2 * ramp * (1 - ramp / 2))
      : (progress - ramp / 2) / (1 - ramp / 2);
    const windup = cycleTime / windupDuration;
    const spin = reduced.matches ? 0 : revving ? smooth(windup / .35) : 1 - smooth(runTime / .18);
    const crouch = reduced.matches ? 0 : revving ? Math.sin(windup * Math.PI) : 0;
    // Continuous phase avoids a leg-pose jump at launch; rotation builds in speed.
    const revPhase = 16 * windupDuration + 24 * windupDuration;
    const phase = reduced.matches ? .8 : revving
      ? 16 * cycleTime + 24 * cycleTime * cycleTime / windupDuration
      : revPhase + 24 * runTime + 4 * (1 - Math.exp(-runTime * 10));
    const x = reduced.matches ? travel * Math.max(0,canvas.width - 56)
      : 5 + travel * (canvas.width + 3) - crouch * 2;
    const bob = reduced.matches ? 0 : (1 - spin) * Math.sin(phase * 2) * .45;
    ctx.save();ctx.translate(x,1 + bob);
    ctx.fillStyle = ink;ctx.strokeStyle = ink;
    if (spin > 0) revTrails(phase,spin);
    leg(phase + Math.PI,true,spin);
    ctx.save();
    ctx.translate(29,18);
    const lean = reduced.matches ? 0 : revving ? -.035 * crouch : .06 * (1 - smooth(runTime / .3));
    ctx.rotate(lean);
    ctx.scale(1 + crouch * .035,1 - crouch * .09);
    ctx.translate(-29,-18);
    // Long tail, forward-leaning body, arched neck, pointed beak and crest.
    shape([[24,17],[2,8],[5,7],[23,11],[5,4],[10,4],[29,12]]);
    ctx.beginPath();ctx.ellipse(28,15,9,5,-.2,0,Math.PI*2);ctx.fill();
    shape([[31,15],[36,7],[36,5],[41,4],[43,8],[39,12],[35,18]]);
    ctx.beginPath();ctx.ellipse(40,6,5,3.5,0,0,Math.PI*2);ctx.fill();
    shape([[43,5],[54,7],[43,8]]);
    shape([[37,5],[29,1],[37,2],[32,0],[40,2],[37,0],[43,3],[42,5]]);
    // Cutouts stay transparent so both site themes use the same silhouette.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(41,5,1,1);
    ctx.lineWidth = .7;ctx.beginPath();ctx.moveTo(24,14);ctx.quadraticCurveTo(29,17,33,13);ctx.stroke();
    ctx.restore();
    leg(phase,false,spin);
    ctx.restore();
    return true;
  }
  function tick(now) {
    elapsed += Math.min(40,now - previous) / 1000;previous = now;
    paint(elapsed);frame = requestAnimationFrame(tick);
  }
  function mobileTick(now) {
    elapsed += Math.min(40,now - previous) / 1000;previous = now;
    if (paint(elapsed,false)) frame = requestAnimationFrame(mobileTick);
    else { mobileRunning = false; sync(); }
  }
  function sync() {
    cancelAnimationFrame(frame);frame = 0;
    const desktopActive = hovered && visible && pointer.matches;
    const mobileActive = touch.matches && visible && mobileTriggered && (mobileRunning || reduced.matches);
    const active = (desktopActive || mobileActive) && !document.hidden;
    section.classList.toggle('runner-active',active);
    if (!active) return;
    ink = getComputedStyle(section).getPropertyValue('--ink').trim();
    if (touch.matches) {
      paint(reduced.matches ? 0 : elapsed,false);
      if (mobileRunning && !reduced.matches) { previous = performance.now();frame = requestAnimationFrame(mobileTick); }
    } else {
      paint(elapsed);
      if (!reduced.matches) { previous = performance.now();frame = requestAnimationFrame(tick); }
    }
  }
  new ResizeObserver(() => {canvas.width = Math.max(56,Math.round(section.clientWidth / 2));canvas.height = 32;sync();}).observe(section);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (touch.matches) {
      if (!visible) { mobileTriggered = false; mobileRunning = false; elapsed = 0; }
      else if (entry.intersectionRatio >= .35 && !mobileTriggered) {
        mobileTriggered = true;
        if (!reduced.matches) { mobileRunning = true; elapsed = 0; }
      }
    }
    sync();
  }, {threshold:[0,.35]}).observe(section);
  section.addEventListener('pointerenter',event => {
    hovered = event.pointerType !== 'touch';
    if (hovered) elapsed = 0;
    sync();
  });
  section.addEventListener('pointerleave',() => {hovered = false;sync();});
  pointer.addEventListener('change',() => {hovered = false;sync();});
  touch.addEventListener('change',() => {
    if (touch.matches && visible) { mobileTriggered = true; if (!reduced.matches) { mobileRunning = true; elapsed = 0; } }
    else { mobileTriggered = false; mobileRunning = false; }
    sync();
  });
  reduced.addEventListener('change',() => {
    if (reduced.matches) mobileRunning = false;
    else if (touch.matches && visible && mobileTriggered) { mobileRunning = true; elapsed = 0; }
    sync();
  });
  document.addEventListener('visibilitychange',sync);
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-theme']});
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',sync);
}
installRunner();
// Render at one pixel per three CSS pixels: sharp pixel art with very little work.
const artPointer = matchMedia('(hover: hover) and (pointer: fine)');
const artTouch = matchMedia('(hover: none), (pointer: coarse)');
const artReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobileArtDuration = 1700;

document.querySelectorAll('[data-art]').forEach((row) => {
  const layer = document.createElement('div');
  layer.className = 'work-art';
  layer.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  layer.append(canvas);
  row.prepend(layer);
  let hovered = false;
  let visible = false;
  let frame = 0;
  let lastPaint = -Infinity;
  let mobileStart = 0;
  let mobileRevealed = false;

  let renderArtwork;
  function draw(time) {
    if (renderArtwork) context.putImageData(renderArtwork(time), 0, 0);
  }

  function tick(now) {
    if (now - lastPaint >= 1000 / 30) {
      draw(now / 1000);
      lastPaint = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function mobileTick(now) {
    if (now - lastPaint >= 1000 / 30) {
      draw((now - mobileStart) / 1000);
      lastPaint = now;
    }
    if (now - mobileStart < mobileArtDuration) frame = requestAnimationFrame(mobileTick);
  }

  function sync() {
    cancelAnimationFrame(frame);
    frame = 0;
    const desktopActive = hovered && visible && artPointer.matches;
    const mobileActive = artTouch.matches && visible && mobileRevealed;
    const active = (desktopActive || mobileActive) && !document.hidden;
    row.classList.toggle('art-active', desktopActive && !document.hidden);
    row.classList.toggle('art-mobile-active', mobileActive && !document.hidden);
    if (!active) return;
    if (mobileActive) {
      if (!mobileStart) mobileStart = performance.now();
      draw(artReducedMotion.matches ? 0 : (performance.now() - mobileStart) / 1000);
      lastPaint = performance.now();
      if (!artReducedMotion.matches && performance.now() - mobileStart < mobileArtDuration) frame = requestAnimationFrame(mobileTick);
    } else {
      draw(artReducedMotion.matches ? 0 : performance.now() / 1000);
      if (!artReducedMotion.matches) frame = requestAnimationFrame(tick);
    }
  }

  new ResizeObserver(() => {
    canvas.width = Math.max(1, Math.ceil(layer.clientWidth / 3));
    canvas.height = Math.max(1, Math.ceil(layer.clientHeight / 3));
    renderArtwork = createExperienceArtwork(row.dataset.art, canvas.width, canvas.height);
    sync();
  }).observe(row);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (artTouch.matches) {
      if (!visible) { mobileRevealed = false; mobileStart = 0; }
      else if (entry.intersectionRatio >= .35 && !mobileRevealed) { mobileRevealed = true; mobileStart = performance.now(); lastPaint = -Infinity; }
    }
    sync();
  }, {threshold:[0,.35]}).observe(row);
  row.addEventListener('pointerenter', (event) => { hovered = event.pointerType !== 'touch'; sync(); });
  row.addEventListener('pointerleave', () => { hovered = false; sync(); });
  artPointer.addEventListener('change', () => { hovered = false; sync(); });
  artTouch.addEventListener('change', () => { mobileRevealed = visible && artTouch.matches; mobileStart = mobileRevealed ? performance.now() : 0; lastPaint = -Infinity; sync(); });
  artReducedMotion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
});

const themeButton = document.querySelector('.theme-toggle');
const themeColor = document.querySelector('meta[name="theme-color"]');
const systemTheme = matchMedia('(prefers-color-scheme: dark)');

function getTheme() {
  return root.dataset.theme || (systemTheme.matches ? 'dark' : 'light');
}

function renderTheme(theme) {
  themeColor.content = theme === 'light' ? '#d6dcdf' : '#101917';
  themeButton.setAttribute('aria-pressed', String(theme === 'light'));
  themeButton.setAttribute('aria-label', theme === 'light' ? 'Light theme enabled. Switch to dark theme' : 'Dark theme enabled. Switch to light theme');
  themeButton.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
}

function setTheme(theme, persist) {
  root.dataset.theme = theme;
  renderTheme(theme);
  if (persist) {
    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch (_) {}
  }
}

if (themeButton) {
  renderTheme(getTheme());
  themeButton.addEventListener('click', () => setTheme(getTheme() === 'light' ? 'dark' : 'light', true));
  systemTheme.addEventListener('change', () => {
    try {
      if (!localStorage.getItem('portfolio-theme')) renderTheme(getTheme());
    } catch (_) {
      renderTheme(getTheme());
    }
  });
}

// Fixed grid: only the dots' color intensity responds to the cursor.
const hero = document.querySelector('.hero');
if (hero) {
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-dots';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (context) {
    hero.prepend(canvas);
    const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let dots = [], pointer = null, frame = 0, previous = 0;
    let width = 0, height = 0, visible = true;
    let color = '';
    let baseOpacity = .19, hoverOpacity = .42, radius = .8;

    function draw(now) {
      frame = 0;
      const step = 1 - Math.exp(-Math.min(50, now - previous || 16) / 95);
      previous = now;
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      let unsettled = false;
      for (const dot of dots) {
        const dx = pointer ? dot.x - pointer.x : 0;
        const dy = pointer ? dot.y - pointer.y : 0;
        const distance = Math.hypot(dx, dy);
        const influence = pointer ? Math.max(0, 1 - distance / 150) ** 2 : 0;
        dot.light += (influence - dot.light) * step;
        if (Math.abs(influence - dot.light) > .005) unsettled = true;
        context.globalAlpha = baseOpacity + dot.light * hoverOpacity;
        context.beginPath();
        context.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      if (unsettled) frame = requestAnimationFrame(draw);
    }

    function schedule() {
      if (!frame && motion.matches && visible && !document.hidden) {
        previous = performance.now();
        frame = requestAnimationFrame(draw);
      }
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      hero.classList.toggle('dots-ready', motion.matches);
      if (!motion.matches) return;
      width = hero.clientWidth;
      height = hero.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const styles = getComputedStyle(hero);
      color = styles.getPropertyValue('--accent').trim();
      baseOpacity = Number.parseFloat(styles.getPropertyValue('--hero-dot-base')) || .19;
      hoverOpacity = Number.parseFloat(styles.getPropertyValue('--hero-dot-hover')) || .42;
      radius = Number.parseFloat(styles.getPropertyValue('--hero-dot-radius')) || .8;
      dots = [];
      for (let y = 9.5; y < height; y += 19) {
        for (let x = 9.5; x < width; x += 19) dots.push({x, y, light:0});
      }
      schedule();
    }

    hero.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || !motion.matches) return;
      const bounds = hero.getBoundingClientRect();
      pointer = {x:event.clientX - bounds.left - hero.clientLeft, y:event.clientY - bounds.top - hero.clientTop};
      schedule();
    });
    hero.addEventListener('pointerleave', () => { pointer = null; schedule(); });
    new ResizeObserver(reset).observe(hero);
    new MutationObserver(reset).observe(root, {attributes:true, attributeFilter:['data-theme']});
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; reset(); }).observe(hero);
    motion.addEventListener('change', reset);
    systemTheme.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    reset();
  }
}
