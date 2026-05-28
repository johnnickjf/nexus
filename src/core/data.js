window.DATA = (function() {

  const COLORS = {
    bg: '#060614',
    bgSecondary: '#101028',
    bgPanel: '#161636',
    bgPanelTop: '#1d1d44',
    border: '#2c2c54',
    borderStrong: '#42427a',
    borderHover: '#7070c8',

    textPrimary: '#eef0ff',
    textSecondary: '#b4b6dc',
    textMuted: '#8a8cb8',
    textDim: '#4a4c7a',

    rail: '#2dffc8',
    ice: '#5dc8ff',
    sniper: '#f0c040',
    nova: '#ff5544',

    glowRail: '#1ad8a8',
    glowIce: '#3aa6e0',
    glowSniper: '#d0a020',
    glowNova: '#e0392a',

    drone: '#ff7733',
    shield: '#ff5533',
    tank: '#ff8844',
    ghost: '#cc44ff',
    boss: '#ff2233',

    shieldBlue: '#5dc8ff',
    shieldGold: '#f0c040',
    shieldRed: '#ff3344',

    gold: '#f0c040',
    danger: '#ff3344',
    success: '#2dffc8',

    pathFill: '#14143a',
    pathEdge: '#2a2a52',

    starsAccent: '#f0c040'
  };

  const TOWERS = {
    rail: {
      name: 'RAIL',
      tagline: 'Cadência alta',
      color: COLORS.rail,
      shape: 'square',
      cost: 70,
      damage: 8,
      range: 150,
      cooldown: 0.45,
      critChance: 0.04,
      critMul: 1.5,
      projectile: {
        type: 'linear',
        speed: 650,
        pierce: 0
      }
    },
    ice: {
      name: 'ICE',
      tagline: 'Slow · controle',
      color: COLORS.ice,
      shape: 'circle',
      cost: 65,
      damage: 2,
      range: 140,
      cooldown: 1.10,
      critChance: 0,
      projectile: {
        type: 'linear',
        speed: 520,
        aoeRadius: 10,
        slow: { percent: 0.38, duration: 0.5 }
      }
    },
    sniper: {
      name: 'SNIPER',
      tagline: 'Dano alto',
      color: COLORS.sniper,
      shape: 'triangle',
      cost: 90,
      damage: 24,
      range: 240,
      cooldown: 2.25,
      critChance: 0.08,
      projectile: {
        type: 'hitscan',
        visualDuration: 0.12
      }
    },
    nova: {
      name: 'NOVA',
      tagline: 'AoE · burn',
      color: COLORS.nova,
      shape: 'hexagon',
      cost: 160,
      damage: 16,
      range: 130,
      cooldown: 1.9,
      critChance: 0,
      projectile: {
        type: 'arc',
        speed: 320,
        aoeRadius: 40,
        burn: { dps: 5, duration: 2.4 }
      }
    }
  };

  const ENEMIES = {
    drone: {
      name: 'Drone',
      shape: 'circle',
      size: 9,
      color: COLORS.drone,
      baseHp: 12,
      speed: 75,
      hpPerWave: 4,
      coreDamage: 1,
      coinReward: 5,
      isBoss: false
    },
    shield: {
      name: 'Shield',
      shape: 'circleRing',
      size: 10,
      color: COLORS.shield,
      baseHp: 40,
      speed: 55,
      hpPerWave: 9,
      coreDamage: 2,
      coinReward: 10,
      isBoss: false
    },
    tank: {
      name: 'Tank',
      shape: 'square',
      size: 12,
      color: COLORS.tank,
      baseHp: 120,
      speed: 32,
      hpPerWave: 20,
      coreDamage: 5,
      coinReward: 22,
      isBoss: false
    },
    ghost: {
      name: 'Ghost',
      shape: 'circleDashed',
      size: 9,
      color: COLORS.ghost,
      baseHp: 35,
      speed: 70,
      hpPerWave: 8,
      coreDamage: 3,
      coinReward: 14,
      isBoss: false
    },
    boss: {
      name: 'Boss',
      shape: 'hexagon',
      size: 18,
      color: COLORS.boss,
      baseHp: 450,
      speed: 28,
      hpPerWave: 80,
      coreDamage: 10,
      coinReward: 80,
      isBoss: true
    }
  };

  const SHIELDS = {
    blue: { hp: 3, color: COLORS.shieldBlue, name: 'Azul' },
    gold: { hp: 8, color: COLORS.shieldGold, name: 'Dourado' },
    red:  { hp: 15, color: COLORS.shieldRed, name: 'Vermelho' }
  };

  const MODIFIERS = {
    lightningSpeedMul: 1.7,
    blink: { vulnerableTime: 2.0, immuneTime: 0.5 }
  };

  const ECONOMY = {
    startingCoins: 150,
    waveCompleteBonus: 40,
    sellRefundPercent: 0.7,
    starsPerWave: 5,
    bossWaveStarBonus: 5,
    mapCompleteStarBonus: 50,
    waveBreakDuration: 12,
    firstWaveDelay: 15,
    repositionsPerMap: 3
  };

  // 10 nodes per path: root(0), row2(1-3), row3(4-5), row4(6-8), final(9)
  // Nós 0-3: 5 estrelas | Nós 4-8: 8 estrelas | Final (9): 40 estrelas = 100 total por tower
  const TREE_NODE_COSTS = [5, 5, 5, 5, 8, 8, 8, 8, 8, 40];

  const TREE_LAYOUT = {
    nodes: [
      { id: 0, relX: 0,   relY: 0   },
      { id: 1, relX: -80, relY: 70  },
      { id: 2, relX: 0,   relY: 70  },
      { id: 3, relX: 80,  relY: 70  },
      { id: 4, relX: -45, relY: 150 },
      { id: 5, relX: 45,  relY: 150 },
      { id: 6, relX: -80, relY: 230 },
      { id: 7, relX: 0,   relY: 230 },
      { id: 8, relX: 80,  relY: 230 },
      { id: 9, relX: 0,   relY: 310 }
    ],
    edges: [
      [0,1],[0,2],[0,3],
      [1,4],[2,4],[2,5],[3,5],
      [4,6],[4,7],[5,7],[5,8],
      [6,9],[7,9],[8,9]
    ],
    prereqs: {
      0: [],
      1: [0], 2: [0], 3: [0],
      4: [1, 2],
      5: [2, 3],
      6: [4],
      7: [4, 5],
      8: [5],
      9: [6, 7, 8]
    }
  };

  // TREE_EFFECTS — árvore global (estrelas). Display: label/desc/nodeText/finalText
  // (lidos pela skillTreeScene). Lógica: apply(tower, n, fin) onde n = nº de nós
  // adquiridos no path e fin = se o nó final está adquirido.
  const TREE_EFFECTS = {
    rail: {
      A: { label: 'Velocidade', desc: 'Cadência de tiro', nodeText: '-0.020s cd', finalText: 'cd ×0.6 (piso 0.20s)',
           apply: (t, n, fin) => { t.cooldown = Math.max(0.20, t.cooldown - 0.020 * n); if (fin) t.cooldown = Math.max(0.20, t.cooldown * 0.6); } },
      B: { label: 'Perfuração', desc: 'Inimigos atravessados', nodeText: '+0.15 alvo', finalText: '+4 alvos (combina com run)',
           apply: (t, n, fin) => { t.pierceBase += 0.15 * n; if (fin) t.pierceBase = 4; } },
      C: { label: 'Crítico', desc: 'Chance de acerto crítico', nodeText: '+2% crit', finalText: '+10% crit (cap 30%)',
           apply: (t, n, fin) => { t.critChance = Math.min(0.30, t.critChance + 0.02 * n); if (fin) t.critChance = Math.min(0.30, t.critChance + 0.10); } }
    },
    ice: {
      A: { label: 'Slow', desc: 'Intensidade do slow', nodeText: '+4% slow', finalText: 'Slow 85%',
           apply: (t, n, fin) => { if (!t.slowEffect) return; t.slowEffect.percent = Math.min(0.85, t.slowEffect.percent + 0.04 * n); if (fin) t.slowEffect.percent = 0.85; } },
      B: { label: 'Fragilidade', desc: 'Dano em inimigos lentos', nodeText: '+3% frag', finalText: '35% frag (todas as torres)',
           apply: (t, n, fin) => { t.fragilityBonus = Math.min(0.35, 0.03 * n); if (fin) t.fragilityBonus = 0.35; } },
      C: { label: 'Duração', desc: 'Duração do slow', nodeText: '+0.11s dur', finalText: '2.5s total (+1s)',
           apply: (t, n, fin) => { if (!t.slowEffect) return; t.slowEffect.duration = Math.min(1.5, 0.5 + 0.11 * n); if (fin) t.slowEffect.duration = 2.5; } }
    },
    sniper: {
      A: { label: 'Range', desc: 'Alcance do tiro', nodeText: '+8 range', finalText: 'Range ilimitado',
           apply: (t, n, fin) => { t.range += 8 * n; if (fin) t.range = Infinity; } },
      B: { label: 'Dano', desc: 'Dano por tiro', nodeText: '+3 dmg', finalText: 'Execução <20%',
           apply: (t, n, fin) => { t.damage += 3 * n; if (fin) t.canExecute = true; } },
      C: { label: 'Quebra-escudo', desc: 'Dano em escudo', nodeText: '+1.5 escudo', finalText: 'Ignora escudo',
           apply: (t, n, fin) => { t.shieldBreakBonus += 1.5 * n; if (fin) t.ignoresShield = true; } }
    },
    nova: {
      A: { label: 'Dano', desc: 'Dano da explosão', nodeText: '+4 dmg', finalText: '+15 dmg total',
           apply: (t, n, fin) => { t.damage += 4 * n; if (fin) t.damage += 15; } },
      B: { label: 'Queimadura', desc: 'Dano por segundo', nodeText: '+0.5 dps', finalText: 'Inferno ×1.3 (+1.5s burn)',
           apply: (t, n, fin) => { if (!t.burnEffect) return; t.burnEffect.dps += 0.5 * n; if (fin) { t.burnEffect.dps *= 1.3; t.burnEffect.duration += 1.5; } } },
      C: { label: 'Raio', desc: 'Raio de explosão', nodeText: '+3 raio', finalText: 'Raio ×1.2',
           apply: (t, n, fin) => { t.aoeRadius += 3 * n; if (fin) t.aoeRadius *= 1.2; } }
    }
  };

  // RUN_UPGRADES — upgrades comprados na partida com moedas.
  // Estrutura data-driven: cada path define `levels` (cost + valores nomeados),
  // `apply(tower, levelData)` que aplica o efeito, e `desc(levelData, tower)` que
  // gera o texto a partir dos MESMOS valores. Single source of truth: mudar o
  // número em `levels` atualiza efeito e descrição juntos.
  const pct = v => Math.round(v * 100);
  const cdDesc = d => `Cooldown ×${d.mul.toFixed(2)} (−${pct(1 - d.mul)}%)`;

  const RUN_UPGRADES = {
    rail: {
      A: {
        label: 'Rajada', icon: 'burst',
        levels: [{every: 8 }, {every: 6 }, {every: 4 }],
        desc: d => `A cada ${d.every} tiros, dispara 3 projéteis em leque`,
        apply: (t, d) => { t.burstEvery = d.every; }
      },
      B: {
        label: 'Velocidade', icon: 'speed',
        levels: [{mul: 0.85 }, {mul: 0.70 }, {mul: 0.40 }],
        desc: cdDesc,
        apply: (t, d) => { t.cooldown = Math.max(0.15, t._baseCooldown * d.mul); }
      },
      C: {
        label: 'Dano Crítico', icon: 'crit',
        levels: [{mul: 2.0 }, {mul: 3.0 }, {mul: 5.0 }],
        desc: d => `Crítico causa ${pct(d.mul)}% do dano (×${d.mul})`,
        apply: (t, d) => { t.critMul = d.mul; }
      }
    },
    ice: {
      A: {
        label: 'Slow forte', icon: 'slow',
        levels: [{add: 0.08 }, {add: 0.16 }, {add: 0.45 }],
        desc: d => `+${pct(d.add)}% slow`,
        apply: (t, d) => { t.slowEffect.percent = MATH_UTILS.clamp(t._baseSlowPercent + d.add, 0, 0.90); }
      },
      B: {
        label: 'Raio', icon: 'aoe',
        levels: [{add: 15 }, {add: 30 }, {add: 50 }],
        desc: (d, t) => `Raio AoE ${(t ? t._baseAoeRadius : 10) + d.add} (+${d.add})`,
        apply: (t, d) => { t.aoeRadius = t._baseAoeRadius + d.add; }
      },
      C: {
        label: 'Dano', icon: 'damage',
        levels: [{add: 2 }, {add: 5 }, {add: 10 }],
        desc: d => `+${d.add} dano`,
        apply: (t, d) => { t.damage = t._baseDamage + d.add; }
      }
    },
    sniper: {
      A: {
        label: 'Precisão', icon: 'speed',
        levels: [{mul: 0.92 }, {mul: 0.83 }, {mul: 0.65 }],
        desc: cdDesc,
        apply: (t, d) => { t.cooldown = Math.max(1.4, t._baseCooldown * d.mul); }
      },
      B: {
        label: 'Headshot', icon: 'crit',
        levels: [{chance: 0.08 }, {chance: 0.15 }, {chance: 0.30 }],
        desc: d => `${pct(d.chance)}% instakill`,
        apply: (t, d) => { t.headshotChance = d.chance; }
      },
      C: {
        label: 'Multi-tiro', icon: 'multi',
        levels: [{shots: 2, dmgMul: 1 }, {shots: 3, dmgMul: 1 }, {shots: 3, dmgMul: 1.30 }],
        desc: d => d.dmgMul > 1
          ? `${d.shots} disparos, +${pct(d.dmgMul - 1)}% dano`
          : `${d.shots} disparos por ataque`,
        apply: (t, d) => { t.multiShot = d.shots - 1; t.damage = Math.round(t._baseDamage * d.dmgMul); }
      }
    },
    nova: {
      A: {
        label: 'Burn forte', icon: 'burn',
        levels: [{add: 2 }, {add: 4 }, {add: 9 }],
        desc: d => `+${d.add} dps de queimadura`,
        apply: (t, d) => { t.burnEffect.dps = t._baseBurnDps + d.add; }
      },
      B: {
        label: 'Cooldown', icon: 'speed',
        levels: [{mul: 0.85 }, {mul: 0.72 }, {mul: 0.50 }],
        desc: cdDesc,
        apply: (t, d) => { t.cooldown = Math.max(0.9, t._baseCooldown * d.mul); }
      },
      C: {
        label: 'Chain', icon: 'chain',
        levels: [{chains: 1 }, {chains: 2 }, {chains: 3 }],
        desc: d => `+${d.chains} ${d.chains === 1 ? 'explosão' : 'explosões'} em cadeia`,
        apply: (t, d) => { t.chainCount = d.chains; }
      }
    }
  };

  // Custo dos upgrades de partida, por torre: [nível1, nível2, nível3].
  // Curva exponencial ancorada no custo de construção da torre:
  //   construir uma torre nova custa ENTRE o upgrade 1 e o upgrade 2 — é aí que
  //   mora a dúvida "evoluir ou construir?". L1 ≈ 0.5× build, L2 ≈ 1.25× build,
  //   L3 ≈ 2.5× build (pesado, e só 1 caminho chega ao nível 3).
  // Single source of truth: ajuste um número aqui e os 3 caminhos seguem.
  const UPGRADE_COSTS = {
    rail:   [35, 90, 180],   // build 70
    ice:    [30, 80, 165],   // build 65
    sniper: [45, 110, 225],  // build 90
    nova:   [80, 200, 400]   // build 160
  };
  Object.keys(RUN_UPGRADES).forEach(type => {
    ['A', 'B', 'C'].forEach(path => {
      RUN_UPGRADES[type][path].levels.forEach((lv, i) => {
        lv.cost = UPGRADE_COSTS[type][i];
      });
    });
  });

  function computeHp(baseHp, hpPerWave, wave) {
    return Math.floor(baseHp + hpPerWave * wave);
  }

  return {
    COLORS,
    TOWERS,
    ENEMIES,
    SHIELDS,
    MODIFIERS,
    ECONOMY,
    TREE_NODE_COSTS,
    TREE_LAYOUT,
    TREE_EFFECTS,
    RUN_UPGRADES,
    computeHp,

    VIRTUAL_WIDTH: 1280,
    VIRTUAL_HEIGHT: 720,

    SUPPORT_URL: 'https://links.johnnick.com.br/'
  };
})();
