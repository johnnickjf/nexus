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
      tagline: 'Cadência alta · perfura',
      color: COLORS.rail,
      shape: 'square',
      cost: 40,
      damage: 8,
      range: 150,
      cooldown: 0.35,
      critChance: 0.05,
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
      cost: 55,
      damage: 3,
      range: 140,
      cooldown: 0.6,
      critChance: 0,
      projectile: {
        type: 'linear',
        speed: 520,
        slow: { percent: 0.30, duration: 1.8 }
      }
    },
    sniper: {
      name: 'SNIPER',
      tagline: 'Dano alto · quebra escudo',
      color: COLORS.sniper,
      shape: 'triangle',
      cost: 110,
      damage: 28,
      range: 240,
      cooldown: 1.8,
      critChance: 0.10,
      projectile: {
        type: 'hitscan',
        visualDuration: 0.12
      }
    },
    nova: {
      name: 'NOVA',
      tagline: 'AoE · dano contínuo',
      color: COLORS.nova,
      shape: 'hexagon',
      cost: 160,
      damage: 22,
      range: 130,
      cooldown: 1.5,
      critChance: 0,
      projectile: {
        type: 'arc',
        speed: 320,
        aoeRadius: 55,
        burn: { dps: 4, duration: 2.5 }
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
    startingCoins: 180,
    waveCompleteBonus: 35,
    sellRefundPercent: 0.7,
    starsPerWave: 1,
    bossWaveStarBonus: 5,
    mapCompleteStarBonus: 25,
    waveBreakDuration: 15,
    firstWaveDelay: 25
  };

  const TREE_NODE_COSTS = (function() {
    const arr = [];
    for (let i = 1; i <= 30; i++) {
      if (i <= 10) arr.push(5);
      else if (i <= 20) arr.push(12);
      else if (i <= 29) arr.push(25);
      else arr.push(60);
    }
    return arr;
  })();

  const TREE_EFFECTS = {
    rail: {
      A: { label: 'Velocidade', desc: 'Cadência de tiro', nodeText: '-0.008s cd', finalText: 'Modo Gatling' },
      B: { label: 'Perfuração', desc: 'Inimigos atravessados', nodeText: '+0.1 alvo', finalText: 'Perfura todos' },
      C: { label: 'Crítico', desc: 'Chance de dano dobrado', nodeText: '+1% crit', finalText: '+5% crit' }
    },
    ice: {
      A: { label: 'Slow', desc: 'Intensidade do slow', nodeText: '+2% slow', finalText: 'Freeze 1.5s' },
      B: { label: 'Raio', desc: 'Área do efeito', nodeText: '+1.5 raio', finalText: 'Raio dobrado' },
      C: { label: 'Dano', desc: 'Dano base', nodeText: '+0.4 dmg', finalText: '+4 dmg' }
    },
    sniper: {
      A: { label: 'Range', desc: 'Alcance do tiro', nodeText: '+6 range', finalText: 'Range ilimitado' },
      B: { label: 'Dano', desc: 'Dano por tiro', nodeText: '+4 dmg', finalText: 'Execução <20%' },
      C: { label: 'Quebra-escudo', desc: 'Dano em escudo', nodeText: '+1 dmg escudo', finalText: 'Ignora escudo' }
    },
    nova: {
      A: { label: 'Dano', desc: 'Dano da explosão', nodeText: '+3 dmg', finalText: '+25 dmg' },
      B: { label: 'Queimadura', desc: 'Dano por segundo', nodeText: '+0.4 dps', finalText: 'Inferno' },
      C: { label: 'Raio', desc: 'Raio de explosão', nodeText: '+2 raio', finalText: 'Raio dobrado' }
    }
  };

  const RUN_UPGRADES = {
    rail: {
      A: { label: 'Perfuração', icon: 'pierce',
           levels: [
             { cost: 20, desc: '+1 alvo perfurado' },
             { cost: 50, desc: '+2 alvos perfurados' },
             { cost: 120, desc: 'Perfura toda a linha' }
           ]},
      B: { label: 'Velocidade', icon: 'speed',
           levels: [
             { cost: 20, desc: 'Cooldown ×0.8' },
             { cost: 50, desc: 'Cooldown ×0.6' },
             { cost: 120, desc: 'Cooldown ×0.4' }
           ]},
      C: { label: 'Crit', icon: 'crit',
           levels: [
             { cost: 20, desc: '+10% crit' },
             { cost: 50, desc: '+20% crit' },
             { cost: 120, desc: '+35% crit' }
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
             { cost: 20, desc: '+10 raio AoE' },
             { cost: 50, desc: '+25 raio AoE' },
             { cost: 120, desc: '+50 raio AoE' }
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
             { cost: 120, desc: '+10 dps burn' }
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
    TREE_EFFECTS,
    RUN_UPGRADES,
    computeHp,

    VIRTUAL_WIDTH: 1280,
    VIRTUAL_HEIGHT: 720,

    SUPPORT_URL: 'https://buymeacoffee.com/seu-usuario'
  };
})();
