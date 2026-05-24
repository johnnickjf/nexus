window.MAPS = (function() {

  const W = DATA.VIRTUAL_WIDTH;
  const H = DATA.VIRTUAL_HEIGHT;

  const PATH_TOP_Y_START = 110;
  const PATH_BOTTOM_Y_END = 110;

  function makeBaseWave(num, composition) {
    const enemies = [];
    let delay = 0;
    composition.forEach(({ type, count, gap = 0.8, mods = [] }) => {
      for (let i = 0; i < count; i++) {
        enemies.push({ type, delay, modifiers: mods });
        delay += gap;
      }
      delay += 1.0;
    });
    return { number: num, enemies };
  }

  function withMod(comp, modList) {
    return comp.map(c => ({ ...c, mods: [...(c.mods || []), ...modList] }));
  }

  function defaultWaveGenerator(mapId, waveNumber) {

    if (waveNumber === 1) {
      return makeBaseWave(1, [{ type: 'drone', count: 5, gap: 1.4 }]);
    }
    if (waveNumber === 2) {
      return makeBaseWave(2, [{ type: 'drone', count: 8, gap: 1.0 }]);
    }
    if (waveNumber === 3) {
      return makeBaseWave(3, [
        { type: 'drone', count: 6, gap: 0.8 },
        { type: 'shield', count: 2, gap: 1.8 }
      ]);
    }
    if (waveNumber === 4) {
      return makeBaseWave(4, [
        { type: 'drone', count: 6, gap: 0.5 },
        { type: 'shield', count: 4, gap: 1.0 },
        { type: 'tank', count: 1, gap: 2.0 }
      ]);
    }
    if (waveNumber === 5) {
      return makeBaseWave(5, [
        { type: 'shield', count: 4, gap: 0.8 },
        { type: 'boss', count: 1, gap: 0 }
      ]);
    }
    if (waveNumber === 6) {
      const comp = withMod([{ type: 'drone', count: 8, gap: 0.5 }], ['shield_blue']);
      return makeBaseWave(6, [
        ...comp,
        { type: 'shield', count: 3, gap: 1.2 },
        { type: 'tank', count: 2, gap: 1.8 }
      ]);
    }
    if (waveNumber === 7) {
      return makeBaseWave(7, [
        { type: 'drone', count: 10, gap: 0.4 },
        { type: 'ghost', count: 4, gap: 1.0 },
        { type: 'tank', count: 2, gap: 1.5 }
      ]);
    }
    if (waveNumber === 8) {
      const shielded = withMod([{ type: 'shield', count: 4, gap: 1.0 }], ['shield_blue']);
      return makeBaseWave(8, [
        { type: 'drone', count: 8, gap: 0.4 },
        ...shielded,
        { type: 'ghost', count: 4, gap: 0.8 }
      ]);
    }
    if (waveNumber === 9) {
      return makeBaseWave(9, [
        { type: 'drone', count: 12, gap: 0.4 },
        { type: 'tank', count: 4, gap: 1.5 },
        { type: 'ghost', count: 5, gap: 0.8 }
      ]);
    }
    if (waveNumber === 10) {
      const shieldedBoss = withMod([{ type: 'boss', count: 1, gap: 0 }], ['shield_gold']);
      return makeBaseWave(10, [
        { type: 'shield', count: 6, gap: 0.7 },
        { type: 'tank', count: 3, gap: 1.0 },
        ...shieldedBoss
      ]);
    }

    const enemies = [];
    let delay = 0;
    const totalEnemies = 10 + Math.floor(waveNumber * 0.6);
    const types = ['drone', 'shield', 'tank', 'ghost'];

    for (let i = 0; i < totalEnemies; i++) {
      const r = Math.random();
      let type;
      if (r < 0.4) type = 'drone';
      else if (r < 0.65) type = 'shield';
      else if (r < 0.85) type = 'ghost';
      else type = 'tank';

      const modifiers = [];
      if (Math.random() < 0.15 + waveNumber * 0.01) {
        modifiers.push('shield_blue');
      } else if (Math.random() < 0.08 + waveNumber * 0.005) {
        modifiers.push('shield_gold');
      }
      if (Math.random() < 0.08) modifiers.push('lightning');
      if (Math.random() < 0.05) modifiers.push('blink');

      enemies.push({ type, delay, modifiers });
      delay += 0.4 + Math.random() * 0.5;
    }

    if (waveNumber % 5 === 0) {
      enemies.push({ type: 'boss', delay: delay + 2, modifiers: waveNumber >= 15 ? ['shield_red'] : [] });
    }

    return { number: waveNumber, enemies };
  }

  const MAP_DEFS = {

    1: {
      id: 1,
      name: 'Setor 01',
      tagline: 'Caminho linear',
      coreHp: 20,
      totalWaves: 10,
      path: [
        { x: 0, y: 360 },
        { x: 1140, y: 360 },
        { x: 1180, y: 360 }
      ],
      slots: [
        { x: 180, y: 310 }, { x: 360, y: 310 }, { x: 540, y: 310 }, { x: 720, y: 310 }, { x: 900, y: 310 }, { x: 1060, y: 310 },
        { x: 180, y: 410 }, { x: 360, y: 410 }, { x: 540, y: 410 }, { x: 720, y: 410 }, { x: 900, y: 410 }, { x: 1060, y: 410 },
        { x: 270, y: 230 }, { x: 630, y: 230 }, { x: 990, y: 230 },
        { x: 270, y: 490 }, { x: 630, y: 490 }, { x: 990, y: 490 }
      ]
    },

    2: {
      id: 2,
      name: 'Setor 02',
      tagline: 'Curva em L',
      coreHp: 20,
      totalWaves: 10,
      path: [
        { x: 0, y: 250 },
        { x: 700, y: 250 },
        { x: 700, y: 500 },
        { x: 1180, y: 500 }
      ],
      slots: [
        { x: 150, y: 200 }, { x: 320, y: 200 }, { x: 490, y: 200 },
        { x: 150, y: 300 }, { x: 320, y: 300 }, { x: 490, y: 300 },
        { x: 620, y: 360 }, { x: 620, y: 440 },
        { x: 780, y: 360 }, { x: 780, y: 440 },
        { x: 850, y: 450 }, { x: 1020, y: 450 },
        { x: 850, y: 550 }, { x: 1020, y: 550 }
      ]
    },

    3: {
      id: 3,
      name: 'Setor 03',
      tagline: 'Forma de S',
      coreHp: 20,
      totalWaves: 10,
      path: [
        { x: 0, y: 200 },
        { x: 350, y: 200 },
        { x: 350, y: 500 },
        { x: 920, y: 500 },
        { x: 920, y: 200 },
        { x: 1180, y: 200 }
      ],
      slots: [
        { x: 150, y: 150 }, { x: 250, y: 150 },
        { x: 150, y: 250 }, { x: 250, y: 250 },
        { x: 430, y: 350 }, { x: 600, y: 350 }, { x: 770, y: 350 }, { x: 850, y: 350 },
        { x: 430, y: 450 }, { x: 600, y: 450 }, { x: 770, y: 450 },
        { x: 430, y: 560 }, { x: 600, y: 560 }, { x: 770, y: 560 },
        { x: 1000, y: 150 }, { x: 1100, y: 150 },
        { x: 1000, y: 250 }, { x: 1100, y: 250 }
      ]
    }
  };

  for (let i = 4; i <= 10; i++) {
    MAP_DEFS[i] = {
      id: i,
      name: `Setor 0${i}`,
      tagline: 'Em construção',
      coreHp: 20,
      totalWaves: 10,
      path: MAP_DEFS[1].path,
      slots: MAP_DEFS[1].slots,
      placeholder: true
    };
  }

  for (const id in MAP_DEFS) {
    const m = MAP_DEFS[id];
    m.pathLength = MATH_UTILS.pathLength(m.path);
    m.waveGenerator = defaultWaveGenerator.bind(null, parseInt(id));
  }

  function get(id) {
    return MAP_DEFS[id];
  }

  function allMapIds() {
    return Object.keys(MAP_DEFS).map(k => parseInt(k));
  }

  return { get, allMapIds };
})();
