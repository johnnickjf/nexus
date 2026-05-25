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

    // Snapshot post-tree values so run upgrades scale from these, not raw def values
    this._baseCooldown = this.cooldown;
    this._baseDamage = this.damage;
    this._baseCritChance = this.critChance;
    this._baseAoeRadius = this.aoeRadius;
    this._baseSlowPercent = this.slowEffect ? this.slowEffect.percent : 0;
    this._baseBurnDps = this.burnEffect ? this.burnEffect.dps : 0;

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
        A: (n, fin) => {
          this.cooldown = Math.max(0.20, this.cooldown - 0.020 * n);
          if (fin) this.cooldown = Math.max(0.15, this.cooldown * 0.6);
        },
        B: (n, fin) => {
          this.pierceBase += 0.15 * n;
          if (fin) this.pierceBase = 5;
        },
        C: (n, fin) => {
          this.critChance = Math.min(0.50, this.critChance + 0.02 * n);
          if (fin) this.critChance = Math.min(0.50, this.critChance + 0.10);
        }
      },
      ice: {
        A: (n, fin) => {
          if (!this.slowEffect) return;
          this.slowEffect.percent = Math.min(0.85, this.slowEffect.percent + 0.04 * n);
          if (fin) { this.slowEffect.percent = 0.85; this.slowEffect.duration = 1.5; }
        },
        B: (n, fin) => {
          this.aoeRadius += 1.5 * n;
          if (fin) this.aoeRadius *= 2;
        },
        C: (n, fin) => {
          this.damage += 0.8 * n;
          if (fin) this.damage += 8;
        }
      },
      sniper: {
        A: (n, fin) => {
          this.range += 8 * n;
          if (fin) this.range = Infinity;
        },
        B: (n, fin) => {
          this.damage += 4 * n;
          if (fin) this.canExecute = true;
        },
        C: (n, fin) => {
          this.shieldBreakBonus += 1.5 * n;
          if (fin) this.ignoresShield = true;
        }
      },
      nova: {
        A: (n, fin) => {
          this.damage += 4 * n;
          if (fin) this.damage += 30;
        },
        B: (n, fin) => {
          if (!this.burnEffect) return;
          this.burnEffect.dps += 0.5 * n;
          if (fin) { this.burnEffect.dps *= 2; this.burnEffect.duration += 3; }
        },
        C: (n, fin) => {
          this.aoeRadius += 3 * n;
          if (fin) this.aoeRadius *= 1.5;
        }
      }
    };

    ['A', 'B', 'C'].forEach(path => {
      const branch = myBonus[path];
      const owned = branch.filter(Boolean).length;
      if (owned > 0 && treeEffects[this.type]?.[path]) {
        treeEffects[this.type][path](owned, branch[9] === true);
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
        const pierceLevels = [0, 1, 2, 3];
        this.runPierce = pierceLevels[newLevel];
      } else if (path === 'B') {
        const cdMul = [1, 0.8, 0.6, 0.4][newLevel];
        this.cooldown = Math.max(0.18, this._baseCooldown * cdMul);
      } else if (path === 'C') {
        const critBonus = [0, 0.10, 0.20, 0.35][newLevel];
        this.critChance = Math.min(0.50, this._baseCritChance + critBonus);
      }
    } else if (this.type === 'ice') {
      if (path === 'A') {
        const slowBonus = [0, 0.15, 0.30, 0.50][newLevel];
        this.slowEffect.percent = MATH_UTILS.clamp(this._baseSlowPercent + slowBonus, 0, 0.90);
      } else if (path === 'B') {
        const aoeBonus = [0, 5, 12, 25][newLevel];
        this.aoeRadius = this._baseAoeRadius + aoeBonus;
      } else if (path === 'C') {
        const dmgBonus = [0, 2, 5, 10][newLevel];
        this.damage = this._baseDamage + dmgBonus;
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
        const burnBonus = [0, 2, 5, 6][newLevel];
        this.burnEffect.dps = this._baseBurnDps + burnBonus;
      } else if (path === 'B') {
        const cdMul = [1, 0.8, 0.65, 0.5][newLevel];
        this.cooldown = Math.max(0.9, this._baseCooldown * cdMul);
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

      // AOE radius preview (ice/nova) — only when > 0
      if (this.aoeRadius > 0) {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.06;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.aoeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.aoeRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
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
