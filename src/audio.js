/* WebAudio 효과음 (합성) */
let ac = null;
let master = null;
let enabled = true;

export function initAudio() {
  if (ac) return ac;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.55;
    master.connect(ac.destination);
  } catch (e) { ac = null; }
  return ac;
}
export function setSfxEnabled(v) {
  enabled = v;
  if (master) master.gain.value = v ? 0.55 : 0;
}
export function isSfxEnabled() { return enabled; }

function now() { return ac ? ac.currentTime : 0; }

function tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0) {
  if (!enabled || !ac) return;
  const t = now() + delay;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

let noiseBuf = null;
function noise(dur, vol = 0.2, filterFreq = 1200, delay = 0) {
  if (!enabled || !ac) return;
  if (!noiseBuf) {
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = now() + delay;
  const s = ac.createBufferSource();
  s.buffer = noiseBuf;
  const f = ac.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(filterFreq, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(120, filterFreq * 0.25), t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t); s.stop(t + dur + 0.02);
}

const last = {};
function throttle(k, ms) {
  const t = performance.now();
  if (last[k] && t - last[k] < ms) return false;
  last[k] = t; return true;
}

export const SFX = {
  hit() { if (!throttle('hit', 45)) return; tone(520 + Math.random() * 160, 0.05, 'square', 0.05, 260); },
  crit() { tone(880, 0.09, 'square', 0.1, 320); noise(0.08, 0.1, 3000); },
  kill() { if (!throttle('kill', 60)) return; noise(0.1, 0.09, 1600); tone(300, 0.08, 'triangle', 0.05, 120); },
  hurt() { tone(180, 0.22, 'sawtooth', 0.16, 70); noise(0.18, 0.1, 900); },
  xp() { if (!throttle('xp', 45)) return; tone(760, 0.05, 'sine', 0.045, 980); },
  coin() { tone(1040, 0.06, 'square', 0.055, 1240); tone(1560, 0.08, 'square', 0.04, 1800, 0.05); },
  levelup() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.12, null, i * 0.07)); },
  evolve() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.32, 'sine', 0.13, null, i * 0.1)); noise(0.5, 0.06, 2600); },
  chest() { [660, 880, 1320].forEach((f, i) => tone(f, 0.16, 'square', 0.08, null, i * 0.06)); },
  boss() { tone(110, 0.9, 'sawtooth', 0.16, 55); tone(82, 1.1, 'triangle', 0.14, 40, 0.1); noise(0.7, 0.1, 500); },
  legend() { [880, 1108, 1318, 1760].forEach((f, i) => tone(f, 0.4, 'sine', 0.1, null, i * 0.12)); },
  select() { tone(660, 0.07, 'triangle', 0.09, 880); },
  back() { tone(330, 0.09, 'triangle', 0.08, 220); },
  win() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.4, 'triangle', 0.13, null, i * 0.13)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, 'sine', 0.12, null, i * 0.16)); },
  dash() { noise(0.12, 0.07, 2400); },
  explode() { noise(0.3, 0.14, 900); tone(90, 0.25, 'sawtooth', 0.1, 40); },
  beam() { tone(300, 0.45, 'sawtooth', 0.09, 900); noise(0.35, 0.07, 2200); }
};
