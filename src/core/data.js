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
      cooldown: 0.75,
      critChance: 0,
      projectile: {
        type: 'linear',
        speed: 520,
        slow: { percent: 0.38, duration: 2.0 }
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
  // Custo uniforme: cada nó dá o mesmo bônus, então cobra o mesmo.
  // Final (node 9) é mais caro por ter efeito especial único.
  const TREE_NODE_COSTS = [5, 5, 5, 5, 5, 5, 5, 5, 5, 30];

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

  const TREE_EFFECTS = {
    rail: {
      A: { label: 'Velocidade', desc: 'Cadência de tiro',        nodeText: '-0.020s cd',   finalText: 'cd ×0.6 (piso 0.20s)' },
      B: { label: 'Perfuração', desc: 'Inimigos atravessados',   nodeText: '+0.15 alvo',   finalText: '+5 alvos (combina com run)' },
      C: { label: 'Crítico',    desc: 'Chance de dano dobrado',  nodeText: '+2% crit',     finalText: '+10% crit (cap 50%)' }
    },
    ice: {
      A: { label: 'Slow',   desc: 'Intensidade do slow', nodeText: '+4% slow',  finalText: 'Slow 85% 1.5s' },
      B: { label: 'Raio',   desc: 'Área do efeito',      nodeText: '+1.5 raio', finalText: 'Raio dobrado' },
      C: { label: 'Dano',   desc: 'Dano base',           nodeText: '+0.8 dmg',  finalText: '+8 dmg bônus' }
    },
    sniper: {
      A: { label: 'Range',        desc: 'Alcance do tiro',  nodeText: '+8 range',       finalText: 'Range ilimitado' },
      B: { label: 'Dano',         desc: 'Dano por tiro',    nodeText: '+4 dmg',         finalText: 'Execução <20%' },
      C: { label: 'Quebra-escudo',desc: 'Dano em escudo',   nodeText: '+1.5 escudo',    finalText: 'Ignora escudo' }
    },
    nova: {
      A: { label: 'Dano',       desc: 'Dano da explosão',  nodeText: '+4 dmg',   finalText: '+20 dmg total' },
      B: { label: 'Queimadura', desc: 'Dano por segundo',  nodeText: '+0.5 dps', finalText: 'Inferno ×1.6' },
      C: { label: 'Raio',       desc: 'Raio de explosão',  nodeText: '+3 raio',  finalText: 'Raio dobrado' }
    }
  };

  const RUN_UPGRADES = {
    rail: {
      A: { label: 'Perfuração', icon: 'pierce',
           levels: [
             { cost: 20, desc: '+1 alvo perfurado' },
             { cost: 50, desc: '+2 alvos perfurados' },
             { cost: 120, desc: '+3 alvos (soma com tree)' }
           ]},
      B: { label: 'Velocidade', icon: 'speed',
           levels: [
             { cost: 20, desc: 'Cooldown ×0.8' },
             { cost: 50, desc: 'Cooldown ×0.6' },
             { cost: 120, desc: 'Cooldown ×0.4 (piso 0.15s)' }
           ]},
      C: { label: 'Crit', icon: 'crit',
           levels: [
             { cost: 20, desc: '+10% crit' },
             { cost: 50, desc: '+20% crit' },
             { cost: 120, desc: '+35% crit (cap 50%)' }
           ]}
    },
    ice: {
      A: { label: 'Slow forte', icon: 'slow',
           levels: [
             { cost: 20, desc: '+15% slow' },
             { cost: 50, desc: '+30% slow' },
             { cost: 120, desc: '+50% slow' }
           ]},
      B: { label: 'Raio', icon: 'aoe',
           levels: [
             { cost: 20, desc: '+5 raio AoE' },
             { cost: 50, desc: '+12 raio AoE' },
             { cost: 120, desc: '+25 raio AoE' }
           ]},
      C: { label: 'Dano', icon: 'damage',
           levels: [
             { cost: 20, desc: '+2 dano' },
             { cost: 50, desc: '+5 dano' },
             { cost: 120, desc: '+10 dano' }
           ]}
    },
    sniper: {
      A: { label: 'Quebra-escudo', icon: 'shield',
           levels: [
             { cost: 20, desc: 'Ignora escudo azul' },
             { cost: 50, desc: 'Ignora escudo dourado' },
             { cost: 120, desc: 'Ignora todos os escudos' }
           ]},
      B: { label: 'Headshot', icon: 'crit',
           levels: [
             { cost: 20, desc: '10% instakill' },
             { cost: 50, desc: '20% instakill' },
             { cost: 120, desc: '30% instakill' }
           ]},
      C: { label: 'Tiro duplo', icon: 'multi',
           levels: [
             { cost: 20, desc: '+1 disparo' },
             { cost: 50, desc: '+2 disparos' },
             { cost: 120, desc: '+3 disparos' }
           ]}
    },
    nova: {
      A: { label: 'Burn forte', icon: 'burn',
           levels: [
             { cost: 20, desc: '+2 dps burn' },
             { cost: 50, desc: '+5 dps burn' },
             { cost: 120, desc: '+6 dps burn' }
           ]},
      B: { label: 'Cooldown', icon: 'speed',
           levels: [
             { cost: 20, desc: 'Cooldown ×0.8' },
             { cost: 50, desc: 'Cooldown ×0.65' },
             { cost: 120, desc: 'Cooldown ×0.5' }
           ]},
      C: { label: 'Chain', icon: 'chain',
           levels: [
             { cost: 20, desc: '+1 explosão em chain' },
             { cost: 50, desc: '+2 explosões em chain' },
             { cost: 120, desc: '+3 explosões em chain' }
           ]}
    }
  };

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
