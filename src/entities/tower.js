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
    this.critMul = def.critMul !== undefined ? def.critMul : 2.0;
    this.fragilityBonus = 0;
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
    this._baseSlowDuration = this.slowEffect ? this.slowEffect.duration : 0;
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

    // Efeitos vivem em DATA.TREE_EFFECTS[type][path].apply(tower, n, fin)
    ['A', 'B', 'C'].forEach(path => {
      const branch = myBonus[path];
      const owned = branch.filter(Boolean).length;
      const cfg = DATA.TREE_EFFECTS[this.type]?.[path];
      if (owned > 0 && cfg?.apply) {
        cfg.apply(this, owned, branch[9] === true);
      }
    });
  }

  canFire(gameTime) {
    return gameTime - this.lastShotTime >= this.cooldown;
  }

  recordShot(gameTime) {
    this.lastShotTime = gameTime;
  }

  isPathLocked(path) {
    // Nível 3 bloqueado se outro caminho já está no máximo
    if (this.abilities[path].level !== 2) return false;
    return ['A', 'B', 'C'].filter(p => p !== path)
                           .some(p => this.abilities[p].level >= 3);
  }

  upgradeAbility(path) {
    const ab = this.abilities[path];
    if (ab.level >= 3) return { ok: false, reason: 'max' };
    if (this.isPathLocked(path)) return { ok: false, reason: 'locked' };
    const cfg = DATA.RUN_UPGRADES[this.type][path].levels[ab.level];

    return { ok: true, cost: cfg.cost, applyFn: () => {
      ab.level++;
      this.totalSpent += cfg.cost;
      this.applyRunUpgradeEffect(path, ab.level);
    }};
  }

  applyRunUpgradeEffect(path, newLevel) {
    // Efeito vive em DATA.RUN_UPGRADES[type][path].apply(tower, levelData)
    const cfg = DATA.RUN_UPGRADES[this.type]?.[path];
    if (!cfg?.apply) return;
    cfg.apply(this, cfg.levels[newLevel - 1], newLevel);
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
