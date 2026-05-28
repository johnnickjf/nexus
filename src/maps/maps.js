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
      let bossCount = 1;
      if (waveNumber >= 100) bossCount = 4;
      else if (waveNumber >= 50) bossCount = 3;
      else if (waveNumber >= 25) bossCount = 2;
      let bd = delay + 2;
      for (let b = 0; b < bossCount; b++) {
        enemies.push({ type: 'boss', delay: bd, modifiers: waveNumber >= 15 ? ['shield_red'] : [] });
        bd += 1.8;
      }
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
        // acima do caminho (y=300 → 60px acima do path em y=360)
        { x: 100,  y: 300 }, { x: 330,  y: 300 }, { x: 600,  y: 300 },
        { x: 870,  y: 300 }, { x: 1110, y: 300 },
        // abaixo do caminho (y=420 → 60px abaixo), interleaved com os de cima
        { x: 210,  y: 420 }, { x: 460,  y: 420 },
        { x: 740,  y: 420 }, { x: 1000, y: 420 }
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
        // Seg. 1 horizontal (path y=250) — 60 px de afastamento
        { x: 80,  y: 190 }, { x: 340, y: 190 }, { x: 590, y: 190 }, // acima
        { x: 210, y: 310 }, { x: 470, y: 310 },                      // abaixo, intercalado

        // Seg. 2 vertical (path x=700) — flancos centrados
        { x: 635, y: 375 }, { x: 765, y: 375 },

        // Seg. 3 horizontal (path y=500) — 60 px de afastamento
        { x: 870,  y: 440 }, { x: 1130, y: 440 }, // acima
        { x: 1010, y: 565 }                        // abaixo, intercalado
      ]
    },

    3: {
      id: 3,
      name: 'Setor 03',
      tagline: 'Forma de S',
      coreHp: 16,
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
        // Seg.1 horizontal (path y=200, x=0→350) — 60 px de afastamento
        { x: 90,  y: 140 }, { x: 280, y: 140 }, // acima, bem distribuídos
        { x: 175, y: 260 },                      // abaixo, intercalado

        // Seg.2 vertical esq (path x=350, y=200→500) — ambos os flancos
        { x: 285, y: 350 }, { x: 415, y: 350 },

        // Seg.3 horizontal mid (path y=500, x=350→920) — alternado cima/baixo
        { x: 500, y: 440 }, { x: 690, y: 560 }, { x: 840, y: 440 },

        // Seg.4 vertical dir (path x=920, y=500→200) — ambos os flancos
        { x: 855, y: 350 }, { x: 985, y: 350 },

        // Seg.5 horizontal dir (path y=200, x=920→1180) — cobre todo o trecho final
        { x: 1060, y: 140 }
      ]
    }
  };

  function makeTieredGenerator(tier) {
    const difficulty = tier - 3;
    const extraMax = difficulty * 2;
    return function(waveNumber) {
      // ramp extras so early waves aren't immediately brutal on hard maps
      const extraPerWave = Math.min(extraMax, Math.floor(1 + extraMax * 0.18 * waveNumber));
      const base = defaultWaveGenerator(tier, waveNumber);
      const added = [];
      let d = base.enemies.length > 0 ? base.enemies[base.enemies.length - 1].delay + 0.7 : 0;
      for (let i = 0; i < extraPerWave; i++) {
        const r = Math.random();
        let type;
        if (waveNumber <= 3)      type = r < 0.7 ? 'drone' : 'shield';
        else if (waveNumber <= 7) type = r < 0.3 ? 'drone' : r < 0.6 ? 'shield' : r < 0.85 ? 'ghost' : 'tank';
        else                      type = r < 0.2 ? 'drone' : r < 0.45 ? 'shield' : r < 0.65 ? 'ghost' : 'tank';
        const mods = [];
        const mr = Math.random();
        if (mr < 0.10 + difficulty * 0.03) mods.push('shield_blue');
        else if (mr < 0.13 + difficulty * 0.02) mods.push('shield_gold');
        if (Math.random() < 0.06 + difficulty * 0.01) mods.push('lightning');
        if (Math.random() < 0.04 + difficulty * 0.008) mods.push('blink');
        added.push({ type, delay: d, modifiers: mods });
        d += 0.35 + Math.random() * 0.35;
      }
      const bossEvery = Math.max(3, 6 - Math.floor(difficulty / 2));
      if (waveNumber % bossEvery === 0 && !base.enemies.some(e => e.type === 'boss')) {
        let bossCount = 1;
        if (waveNumber >= 100) bossCount = 4;
        else if (waveNumber >= 50) bossCount = 3;
        else if (waveNumber >= 25) bossCount = 2;
        const bossMods = difficulty >= 5 ? ['shield_red'] : difficulty >= 3 ? ['shield_gold'] : [];
        let bd = d + 1.5;
        for (let b = 0; b < bossCount; b++) {
          added.push({ type: 'boss', delay: bd, modifiers: bossMods });
          bd += 1.8;
        }
      }
      return { number: waveNumber, enemies: [...base.enemies, ...added] };
    };
  }

  MAP_DEFS[4] = {
    id: 4, name: 'Setor 04', tagline: 'Duplo Z',
    coreHp: 18, totalWaves: 12, hpMult: 1.08,
    path: [
      { x: 0,    y: 300 }, { x: 300,  y: 300 }, { x: 300,  y: 500 },
      { x: 650,  y: 500 }, { x: 650,  y: 180 }, { x: 950,  y: 180 },
      { x: 950,  y: 420 }, { x: 1180, y: 420 }
    ],
    slots: [
      // H1 (path y=300, x=0→300)
      { x: 90,  y: 240 }, { x: 220, y: 360 },  // acima e abaixo

      // V1 (path x=300, y=300→500) — flanco dir + canto sup já coberto por (220,360)
      { x: 365, y: 400 },

      // H2 (path y=500, x=300→650)
      { x: 460, y: 440 }, { x: 570, y: 560 },  // acima e abaixo, bem distribuídos

      // V2 (path x=650, y=500→180) — ambos os flancos
      { x: 585, y: 340 }, { x: 715, y: 120 },  // esq centro + dir no canto V2/H3

      // H3 (path y=180, x=650→950)
      { x: 850, y: 240 },                       // abaixo, cobre centro-dir de H3

      // V3 (path x=950, y=180→420) — ambos os flancos
      { x: 885, y: 300 }, { x: 1015, y: 300 },

      // H4 final (path y=420, x=950→1180)
      { x: 1080, y: 360 }, { x: 1150, y: 480 } // acima e abaixo, defesa do CORE
    ]
  };

  MAP_DEFS[5] = {
    id: 5, name: 'Setor 05', tagline: 'Cascata',
    coreHp: 16, totalWaves: 13, hpMult: 1.15,
    path: [
      { x: 0,    y: 160 }, { x: 220,  y: 160 }, { x: 220,  y: 400 },
      { x: 500,  y: 400 }, { x: 500,  y: 160 }, { x: 780,  y: 160 },
      { x: 780,  y: 440 }, { x: 1060, y: 440 }, { x: 1060, y: 250 }, { x: 1180, y: 250 }
    ],
    slots: [
      // H1 (path y=160, x=0→220)
      { x: 110, y: 100 },                      // acima, centro

      // V1 (path x=220, y=160→400) — ambos os flancos
      { x: 155, y: 280 }, { x: 285, y: 280 },  // esq e dir, centrados

      // H2 (path y=400, x=220→500) — flancos de V1/V2 cobrem o acima; só abaixo
      { x: 360, y: 460 },                       // abaixo, centro

      // V2 (path x=500, y=400→160) — ambos os flancos
      { x: 435, y: 280 }, { x: 565, y: 280 },  // esq e dir, centrados

      // H3 (path y=160, x=500→780)
      { x: 640, y: 220 },                       // abaixo, centro

      // V3 (path x=780, y=160→440) — ambos os flancos
      { x: 715, y: 300 },                       // flanco esq, cobre inferior
      { x: 845, y: 250 },                       // flanco dir, cobre superior + fim H3

      // H4 (path y=440, x=780→1060) — bem distribuídos
      { x: 870, y: 380 }, { x: 1000, y: 500 }, // acima esq e abaixo dir

      // V4 (path x=1060, y=440→250) + H5 final (120px)
      { x: 1130, y: 345 }                       // flanco dir, cobre V4 inteiro + H5
    ]
  };

  MAP_DEFS[6] = {
    id: 6, name: 'Setor 06', tagline: 'Labirinto',
    coreHp: 15, totalWaves: 14, hpMult: 1.20, speedMult: 1.05,
    path: [
      { x: 0,    y: 360 }, { x: 180,  y: 360 }, { x: 180,  y: 140 },
      { x: 460,  y: 140 }, { x: 460,  y: 530 }, { x: 740,  y: 530 },
      { x: 740,  y: 240 }, { x: 1000, y: 240 }, { x: 1000, y: 480 }, { x: 1180, y: 480 }
    ],
    slots: [
      { x: 90, y: 300 }, { x: 90, y: 430 },
      { x: 260, y: 80 }, { x: 390, y: 80 },
      { x: 520, y: 320 }, { x: 520, y: 460 },
      { x: 600, y: 460 },
      { x: 670, y: 300 },
      { x: 800, y: 300 }, { x: 870, y: 180 },
      { x: 1070, y: 380 }, { x: 1080, y: 540 }
    ]
  };

  MAP_DEFS[7] = {
    id: 7, name: 'Setor 07', tagline: 'Retrocesso',
    coreHp: 12, totalWaves: 15, hpMult: 1.28, speedMult: 1.08, coinMult: 0.92,
    path: [
      { x: 0,    y: 200 }, { x: 520,  y: 200 }, { x: 520,  y: 380 },
      { x: 140,  y: 380 }, { x: 140,  y: 540 }, { x: 680,  y: 540 },
      { x: 680,  y: 300 }, { x: 980,  y: 300 }, { x: 980,  y: 150 }, { x: 1180, y: 150 }
    ],
    slots: [
      { x: 200, y: 140 }, { x: 400, y: 140 },
      { x: 300, y: 260 },
      { x: 80,  y: 460 }, { x: 200, y: 480 }, { x: 300, y: 460 },
      { x: 500, y: 480 }, { x: 580, y: 480 },
      { x: 820, y: 240 }, { x: 870, y: 360 },
      { x: 1080, y: 90 }, { x: 1080, y: 210 }, { x: 1150, y: 210 }
    ]
  };

  MAP_DEFS[8] = {
    id: 8, name: 'Setor 08', tagline: 'Espiral',
    coreHp: 10, totalWaves: 16, hpMult: 1.38, speedMult: 1.12, coinMult: 0.85,
    path: [
      { x: 0,    y: 300 }, { x: 160,  y: 300 }, { x: 160,  y: 140 },
      { x: 700,  y: 140 }, { x: 700,  y: 560 }, { x: 260,  y: 560 },
      { x: 260,  y: 400 }, { x: 860,  y: 400 }, { x: 860,  y: 200 },
      { x: 1100, y: 200 }, { x: 1100, y: 500 }, { x: 1180, y: 500 }
    ],
    slots: [
      { x: 80,  y: 240 }, { x: 80,  y: 360 },
      { x: 230, y: 200 },
      { x: 380, y: 80 }, { x: 580, y: 80 },
      { x: 430, y: 200 },
      { x: 430, y: 460 },
      { x: 770, y: 340 }, { x: 800, y: 490 },
      { x: 560, y: 490 },
      { x: 990, y: 130 }, { x: 990, y: 270 },
      { x: 1170, y: 350 }, { x: 1140, y: 560 }
    ]
  };

  MAP_DEFS[9] = {
    id: 9, name: 'Setor 09', tagline: 'Serpente',
    coreHp: 8, totalWaves: 18, hpMult: 1.50, speedMult: 1.16, coinMult: 0.78,
    path: [
      { x: 0,   y: 200 }, { x: 140, y: 200 }, { x: 140, y: 520 },
      { x: 420, y: 520 }, { x: 420, y: 300 }, { x: 260, y: 300 },
      { x: 260, y: 160 }, { x: 700, y: 160 }, { x: 700, y: 480 },
      { x: 860, y: 480 }, { x: 860, y: 300 }, { x: 1080, y: 300 },
      { x: 1080, y: 530 }, { x: 1180, y: 530 }
    ],
    slots: [
      { x: 70, y: 140 }, { x: 70, y: 320 },
      { x: 200, y: 240 }, { x: 200, y: 440 },
      { x: 340, y: 230 }, { x: 340, y: 360 }, { x: 340, y: 460 },
      { x: 520, y: 100 }, { x: 820, y: 100 },
      { x: 630, y: 360 },
      { x: 770, y: 400 },
      { x: 930, y: 390 }, { x: 980, y: 240 },
      { x: 1000, y: 420 }, { x: 1150, y: 420 }
    ]
  };

  MAP_DEFS[10] = {
    id: 10, name: 'Setor 10', tagline: 'Caos Total',
    coreHp: 8, totalWaves: 20, hpMult: 1.65, speedMult: 1.20, coinMult: 0.72,
    path: [
      { x: 0,    y: 340 }, { x: 120,  y: 340 }, { x: 120,  y: 160 },
      { x: 340,  y: 160 }, { x: 340,  y: 520 }, { x: 560,  y: 520 },
      { x: 560,  y: 280 }, { x: 220,  y: 280 }, { x: 220,  y: 430 },
      { x: 680,  y: 430 }, { x: 680,  y: 160 }, { x: 940,  y: 160 },
      { x: 940,  y: 500 }, { x: 1100, y: 500 }, { x: 1100, y: 280 }, { x: 1180, y: 280 }
    ],
    slots: [
      { x: 60, y: 280 }, { x: 60, y: 400 },
      { x: 180, y: 100 }, { x: 290, y: 100 },
      { x: 200, y: 220 },
      { x: 280, y: 360 }, { x: 300, y: 490 },
      { x: 450, y: 580 }, { x: 450, y: 360 },
      { x: 490, y: 220 }, { x: 610, y: 220 },
      { x: 780, y: 360 }, { x: 810, y: 100 }, { x: 810, y: 230 },
      { x: 1010, y: 380 }, { x: 1010, y: 580 }, { x: 1160, y: 390 }
    ]
  };

  for (const id in MAP_DEFS) {
    const m = MAP_DEFS[id];
    m.pathLength = MATH_UTILS.pathLength(m.path);
    m.waveGenerator = defaultWaveGenerator.bind(null, parseInt(id));
  }

  for (let t = 4; t <= 10; t++) {
    MAP_DEFS[t].waveGenerator = makeTieredGenerator(t);
  }

  function get(id) {
    return MAP_DEFS[id];
  }

  function allMapIds() {
    return Object.keys(MAP_DEFS).map(k => parseInt(k));
  }

  return { get, allMapIds };
})();
