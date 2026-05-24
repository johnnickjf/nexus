window.AUDIO = (function() {

  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let initialized = false;

  function init() {
    if (initialized) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      masterGain = ctx.createGain();
      sfxGain = ctx.createGain();
      sfxGain.connect(masterGain);
      masterGain.connect(ctx.destination);
      updateVolumes();
      initialized = true;
    } catch (e) {
      console.warn('Audio init failed', e);
    }
  }

  function updateVolumes() {
    if (!initialized) return;
    const s = SAVE.get().settings;
    masterGain.gain.value = s.masterVolume;
    sfxGain.gain.value = s.sfxVolume;
  }

  function resume() {
    if (initialized && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function tone(freq, duration, type = 'sine', volume = 0.15, attack = 0.005, release = 0.1) {
    if (!initialized) init();
    if (!initialized) return;
    resume();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function noise(duration, volume = 0.15, lowpass = 800) {
    if (!initialized) init();
    if (!initialized) return;
    resume();

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    src.start(now);
    src.stop(now + duration);
  }

  const sfx = {
    railShot:    () => tone(720, 0.06, 'square', 0.05, 0.001, 0.05),
    iceShot:     () => tone(380, 0.18, 'sine',   0.08, 0.005, 0.16),
    sniperShot:  () => { tone(180, 0.22, 'sawtooth', 0.12, 0.001, 0.2); noise(0.08, 0.06, 2000); },
    novaShot:    () => tone(140, 0.4,  'triangle', 0.1, 0.01, 0.35),
    explosion:   () => { noise(0.25, 0.18, 600); tone(80, 0.25, 'sawtooth', 0.1, 0.001, 0.22); },
    enemyHit:    () => tone(220, 0.04, 'square', 0.03, 0.001, 0.035),
    enemyDeath:  () => { tone(420, 0.08, 'triangle', 0.07, 0.001, 0.07); tone(200, 0.12, 'sine', 0.05, 0.005, 0.1); },
    coreHit:     () => { tone(120, 0.3, 'sawtooth', 0.18, 0.005, 0.25); noise(0.15, 0.1, 400); },
    waveStart:   () => { tone(440, 0.12, 'square', 0.1, 0.005, 0.1); setTimeout(() => tone(660, 0.18, 'square', 0.1, 0.005, 0.15), 80); },
    waveClear:   () => { tone(523, 0.1, 'triangle', 0.1); setTimeout(() => tone(659, 0.1, 'triangle', 0.1), 80); setTimeout(() => tone(784, 0.18, 'triangle', 0.12), 160); },
    place:       () => { tone(660, 0.05, 'square', 0.08); setTimeout(() => tone(880, 0.08, 'square', 0.08), 30); },
    sell:        () => { tone(520, 0.05, 'square', 0.07); setTimeout(() => tone(330, 0.08, 'sine', 0.06), 30); },
    upgrade:     () => { tone(523, 0.06, 'triangle', 0.1); setTimeout(() => tone(784, 0.1, 'triangle', 0.1), 50); },
    click:       () => tone(900, 0.025, 'square', 0.04, 0.001, 0.02),
    hover:       () => tone(1200, 0.015, 'sine', 0.02, 0.001, 0.012),
    error:       () => { tone(160, 0.18, 'square', 0.12, 0.005, 0.15); },
    victory:     () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'triangle', 0.14), i * 120)); },
    defeat:      () => { [440, 330, 220, 165].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sawtooth', 0.13), i * 150)); }
  };

  return {
    init, resume, updateVolumes, sfx,
    isReady: () => initialized
  };
})();
