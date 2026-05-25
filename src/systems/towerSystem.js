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
    const isCrit = Math.random() < tower.critChance;
    // Pierce: soma tree + run. Tree max = 5, Run max = 3 → combinado = 8 alvos.
    let pierce = Math.floor(tower.pierceBase);
    if (tower.runPierce !== undefined) {
      pierce += tower.runPierce;
    }

    projectileSystem.add(new Projectile({
      sourceTowerType: 'rail',
      x: tower.x, y: tower.y,
      targetX: target.x, targetY: target.y,
      speed: tower.projectileDef.speed,
      damage: tower.damage,
      isCrit,
      pierceLeft: pierce,
      kind: 'linear'
    }));
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
      kind: 'linear'
    }));
  }

  fireSniper(tower, target, projectileSystem) {
    const shots = 1 + (tower.multiShot || 0);

    for (let i = 0; i < shots; i++) {
      const isCrit = Math.random() < tower.critChance;
      const headshotKill = tower.headshotChance && Math.random() < tower.headshotChance;

      const ignoresShield = tower.ignoresShield ||
        (tower.shieldIgnoreLevel >= 1 && target.shield?.type === 'blue') ||
        (tower.shieldIgnoreLevel >= 2 && target.shield?.type === 'gold') ||
        (tower.shieldIgnoreLevel >= 3);

      projectileSystem.add(new Projectile({
        sourceTowerType: 'sniper',
        x: tower.x, y: tower.y,
        targetX: target.x, targetY: target.y,
        damage: tower.damage,
        isCrit,
        ignoresShield,
        kind: 'hitscan',
        visualDuration: tower.projectileDef.visualDuration,
        shieldBreakBonus: tower.shieldBreakBonus,
        canExecute: tower.canExecute,
        headshotKill
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
