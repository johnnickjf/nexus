window.TowerSystem = class TowerSystem {
  constructor() {
    this.towers = [];
  }

  add(tower) {
    this.towers.push(tower);
  }

  remove(tower) {
    const idx = this.towers.indexOf(tower);
    if (idx >= 0) this.towers.splice(idx, 1);
  }

  tick(dt, gameTime, enemySystem, projectileSystem) {
    for (const tower of this.towers) {
      if (!tower.canFire(gameTime)) continue;
      const target = enemySystem.findClosestToEnd(tower.x, tower.y, tower.range, tower.type);
      if (!target) continue;
      this.fire(tower, target, gameTime, projectileSystem);
    }
  }

  fire(tower, target, gameTime, projectileSystem) {
    tower.recordShot(gameTime);

    const def = tower.projectileDef;

    if (tower.type === 'sniper') {
      AUDIO.sfx.sniperShot();
      this.fireSniper(tower, target, projectileSystem);
      return;
    }

    if (tower.type === 'nova') {
      AUDIO.sfx.novaShot();
      this.fireNova(tower, target, projectileSystem);
      return;
    }

    if (tower.type === 'ice') {
      AUDIO.sfx.iceShot();
      this.fireIce(tower, target, projectileSystem);
      return;
    }

    AUDIO.sfx.railShot();
    this.fireRail(tower, target, projectileSystem);
  }

  fireRail(tower, target, projectileSystem) {
    tower.shotCounter = (tower.shotCounter || 0) + 1;

    // Rajada: no N-ésimo tiro dispara 3 projéteis em leque
    if ((tower.burstEvery || 0) > 0 && tower.shotCounter % tower.burstEvery === 0) {
      this.fireRailBurst(tower, target, projectileSystem);
      return;
    }

    const isCrit = Math.random() < tower.critChance;
    const pierce = Math.floor(tower.pierceBase);

    projectileSystem.add(new Projectile({
      sourceTowerType: 'rail',
      x: tower.x, y: tower.y,
      targetX: target.x, targetY: target.y,
      speed: tower.projectileDef.speed,
      damage: tower.damage,
      isCrit,
      critMul: tower.critMul,
      pierceLeft: pierce,
      kind: 'linear'
    }));
  }

  fireRailBurst(tower, target, projectileSystem) {
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    const baseAngle = Math.atan2(dy, dx);
    const spread = 0.16; // ~9° entre cada projétil
    const pierce = Math.floor(tower.pierceBase);

    for (let i = -1; i <= 1; i++) {
      const angle = baseAngle + i * spread;
      const isCrit = Math.random() < tower.critChance;
      projectileSystem.add(new Projectile({
        sourceTowerType: 'rail',
        x: tower.x, y: tower.y,
        targetX: tower.x + Math.cos(angle) * 1500,
        targetY: tower.y + Math.sin(angle) * 1500,
        speed: tower.projectileDef.speed,
        damage: tower.damage,
        isCrit,
        critMul: tower.critMul,
        pierceLeft: pierce,
        kind: 'linear'
      }));
    }
  }

  fireIce(tower, target, projectileSystem) {
    projectileSystem.add(new Projectile({
      sourceTowerType: 'ice',
      x: tower.x, y: tower.y,
      targetX: target.x, targetY: target.y,
      speed: tower.projectileDef.speed,
      damage: tower.damage,
      isCrit: false,
      slow: tower.slowEffect ? { ...tower.slowEffect } : null,
      aoeRadius: tower.aoeRadius,
      kind: 'linear',
      fragilityBonus: tower.fragilityBonus || 0
    }));
  }

  fireSniper(tower, target, projectileSystem) {
    const shots = 1 + (tower.multiShot || 0);

    // Cor do tiro baseada no nível do upgrade C (Tiro Duplo)
    const shotColors = ['#f0c040', '#cc8820', '#e04810', '#cc1100'];
    const colorLevel = tower.abilities?.C?.level ?? 0;
    const shotColor = shotColors[colorLevel] || DATA.COLORS.sniper;

    for (let i = 0; i < shots; i++) {
      const isCrit = Math.random() < tower.critChance;
      const headshotKill = tower.headshotChance && Math.random() < tower.headshotChance;

      // ignoresShield vem da árvore global (Sniper C final). Quebra-escudo
      // parcial é tratado por shieldBreakBonus no projectileSystem.
      const ignoresShield = tower.ignoresShield;

      projectileSystem.add(new Projectile({
        sourceTowerType: 'sniper',
        x: tower.x, y: tower.y,
        targetX: target.x, targetY: target.y,
        damage: tower.damage,
        isCrit,
        critMul: tower.critMul,
        ignoresShield,
        kind: 'hitscan',
        visualDuration: tower.projectileDef.visualDuration,
        shieldBreakBonus: tower.shieldBreakBonus,
        canExecute: tower.canExecute,
        headshotKill,
        color: shotColor
      }));
    }
  }

  fireNova(tower, target, projectileSystem) {
    projectileSystem.add(new Projectile({
      sourceTowerType: 'nova',
      x: tower.x, y: tower.y,
      targetX: target.x, targetY: target.y,
      speed: tower.projectileDef.speed,
      damage: tower.damage,
      aoeRadius: tower.aoeRadius,
      burn: tower.burnEffect ? { ...tower.burnEffect } : null,
      chainCount: tower.chainCount || 0,
      kind: 'arc'
    }));
  }

  render(ctx, hoveredTower = null) {
    this.towers.forEach(t => t.render(ctx));
  }

  findAt(x, y, threshold = 22) {
    for (const t of this.towers) {
      const dx = t.x - x, dy = t.y - y;
      if (dx * dx + dy * dy <= threshold * threshold) return t;
    }
    return null;
  }

  clear() {
    this.towers = [];
  }
};
