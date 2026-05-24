window.Tower = class Tower {
  constructor(type, slotIndex, slot, globalBonuses) {
    this.id = Tower.nextId++;
    this.type = type;
    this.slotIndex = slotIndex;
    this.x = slot.x;
    this.y = slot.y;

    const def = DATA.TOWERS[type];
    this.damage = def.damage;
    this.range = def.range;
    this.cooldown = def.cooldown;
    this.critChance = def.critChance;
    this.projectileDef = def.projectile;
    this.color = def.color;

    this.pierceBase = 0;
    this.aoeRadius = def.projectile.aoeRadius || 0;
    this.slowEffect = def.projectile.slow ? { ...def.projectile.slow } : null;
    this.burnEffect = def.projectile.burn ? { ...def.projectile.burn } : null;
    this.ignoresShield = false;
    this.canExecute = false;
    this.shieldBreakBonus = 0;

    this.applyGlobalBonuses(globalBonuses);

    this.abilities = {
      A: { level: 0 },
      B: { level: 0 },
      C: { level: 0 }
    };

    this.totalSpent = def.cost;
    this.lastShotTime = 0;
    this.selected = false;
  }

  applyGlobalBonuses(bonuses) {
    if (!bonuses) return;
    const myBonus = bonuses[this.type];
    if (!myBonus) return;

    const treeEffects = {
      rail: {
        A: (n) => {
          this.cooldown = Math.max(0.05, this.cooldown - 0.008 * Math.min(n, 29));
          if (n === 30) this.cooldown = Math.max(0.05, this.cooldown * 0.3);
        },
        B: (n) => { this.pierceBase += 0.1 * Math.min(n, 29); if (n === 30) this.pierceBase = Infinity; },
        C: (n) => { this.critChance += 0.01 * Math.min(n, 29); if (n === 30) this.critChance += 0.05; }
      },
      ice: {
        A: (n) => {
          if (n < 30) this.slowEffect.percent += 0.02 * n;
          else { this.slowEffect.percent = 1.0; this.slowEffect.duration = 1.5; }
        },
        B: (n) => {
          if (n < 30) this.aoeRadius += 1.5 * n;
          else { this.aoeRadius = (this.aoeRadius + 1.5 * 29) * 2; }
        },
        C: (n) => {
          if (n < 30) this.damage += 0.4 * n;
          else this.damage += 0.4 * 29 + 4;
        }
      },
      sniper: {
        A: (n) => {
          if (n < 30) this.range += 6 * n;
          else this.range = Infinity;
        },
        B: (n) => {
          if (n < 30) this.damage += 4 * n;
          else { this.damage += 4 * 29; this.canExecute = true; }
        },
        C: (n) => {
          if (n < 30) this.shieldBreakBonus += Math.min(n, 29);
          else this.ignoresShield = true;
        }
      },
      nova: {
        A: (n) => {
          if (n < 30) this.damage += 3 * n;
          else this.damage += 3 * 29 + 25;
        },
        B: (n) => {
          if (n < 30) this.burnEffect.dps += 0.4 * n;
          else { this.burnEffect.dps = this.burnEffect.dps * 2; this.burnEffect.duration += 3; }
        },
        C: (n) => {
          if (n < 30) this.aoeRadius += 2 * n;
          else this.aoeRadius = (this.aoeRadius + 2 * 29) * 2;
        }
      }
    };

    ['A', 'B', 'C'].forEach(path => {
      const owned = myBonus[path].filter(Boolean).length;
      if (owned > 0 && treeEffects[this.type][path]) {
        treeEffects[this.type][path](owned);
      }
    });
  }

  canFire(gameTime) {
    return gameTime - this.lastShotTime >= this.cooldown;
  }

  recordShot(gameTime) {
    this.lastShotTime = gameTime;
  }

  upgradeAbility(path) {
    const ab = this.abilities[path];
    if (ab.level >= 3) return { ok: false, reason: 'max' };
    const cfg = DATA.RUN_UPGRADES[this.type][path].levels[ab.level];

    return { ok: true, cost: cfg.cost, applyFn: () => {
      ab.level++;
      this.totalSpent += cfg.cost;
      this.applyRunUpgradeEffect(path, ab.level);
    }};
  }

  applyRunUpgradeEffect(path, newLevel) {
    if (this.type === 'rail') {
      if (path === 'A') {
        const pierceLevels = [0, 1, 2, Infinity];
        this.runPierce = pierceLevels[newLevel];
      } else if (path === 'B') {
        const cdMul = [1, 0.8, 0.6, 0.4][newLevel];
        const def = DATA.TOWERS.rail;
        this.cooldown = def.cooldown * cdMul;
      } else if (path === 'C') {
        const critBonus = [0, 0.10, 0.20, 0.35][newLevel];
        const def = DATA.TOWERS.rail;
        this.critChance = def.critChance + critBonus;
      }
    } else if (this.type === 'ice') {
      if (path === 'A') {
        const slowBonus = [0, 0.15, 0.30, 0.50][newLevel];
        this.slowEffect.percent = MATH_UTILS.clamp(DATA.TOWERS.ice.projectile.slow.percent + slowBonus, 0, 1);
      } else if (path === 'B') {
        const aoeBonus = [0, 10, 25, 50][newLevel];
        this.aoeRadius = aoeBonus;
      } else if (path === 'C') {
        const dmgBonus = [0, 2, 5, 10][newLevel];
        this.damage = DATA.TOWERS.ice.damage + dmgBonus;
      }
    } else if (this.type === 'sniper') {
      if (path === 'A') {
        this.shieldIgnoreLevel = newLevel;
      } else if (path === 'B') {
        const insta = [0, 0.10, 0.20, 0.30][newLevel];
        this.headshotChance = insta;
      } else if (path === 'C') {
        this.multiShot = newLevel;
      }
    } else if (this.type === 'nova') {
      if (path === 'A') {
        const burnBonus = [0, 2, 5, 10][newLevel];
        this.burnEffect.dps = DATA.TOWERS.nova.projectile.burn.dps + burnBonus;
      } else if (path === 'B') {
        const cdMul = [1, 0.8, 0.65, 0.5][newLevel];
        this.cooldown = DATA.TOWERS.nova.cooldown * cdMul;
      } else if (path === 'C') {
        this.chainCount = newLevel;
      }
    }
  }

  render(ctx) {
    if (this.selected) {
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.10;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 5]);
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const animTime = (typeof window !== 'undefined' && window.game && window.game.scenes && window.game.scenes.game) ? window.game.scenes.game.gameTime : 0;
    RENDER.towerShape(ctx, this.type, this.x, this.y, 13, this.color, { selected: this.selected, time: animTime });

    const upCount = this.abilities.A.level + this.abilities.B.level + this.abilities.C.level;
    if (upCount > 0) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 4;
      for (let i = 0; i < Math.min(upCount, 9); i++) {
        const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
        const dx = Math.cos(a) * 18;
        const dy = Math.sin(a) * 18;
        ctx.beginPath();
        ctx.arc(this.x + dx, this.y + dy, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
};

window.Tower.nextId = 1;
