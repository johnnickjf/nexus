window.EnemySystem = class EnemySystem {
  constructor() {
    this.enemies = [];
    this.deathFx = [];
  }

  spawn(type, modifiers, wave, mapData, mode) {
    const e = new Enemy(type, wave, modifiers, mapData, mode);
    this.enemies.push(e);
    return e;
  }

  tick(dt, onReachedEnd) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.tick(dt);
      if (e.reachedEnd) {
        onReachedEnd(e);
        this.enemies.splice(i, 1);
      } else if (e.dead) {
        this.deathFx.push({ x: e.x, y: e.y, size: e.size, color: e.color, life: 0.3, max: 0.3, boss: e.isBoss });
        this.enemies.splice(i, 1);
      }
    }
    for (let i = this.deathFx.length - 1; i >= 0; i--) {
      this.deathFx[i].life -= dt;
      if (this.deathFx[i].life <= 0) this.deathFx.splice(i, 1);
    }
  }

  render(ctx) {
    this.enemies.forEach(e => e.render(ctx));
    // death flashes — expanding white ring + fading circle
    this.deathFx.forEach(f => {
      const t = f.life / f.max;
      const grow = 1 - t;
      ctx.save();
      ctx.globalAlpha = t * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = f.color;
      ctx.shadowBlur = f.boss ? 28 : 16;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size * (0.6 + grow * 1.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = t * 0.6;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size * (1 + grow * 2.5), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  count() {
    return this.enemies.length;
  }

  findClosestToEnd(x, y, range, towerType) {
    let best = null;
    let bestProgress = -1;
    for (const e of this.enemies) {
      if (e.dead || e.reachedEnd) continue;
      if (e.immunities.includes(towerType)) continue;
      if (e.invulnerable) continue;
      const dx = e.x - x, dy = e.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > range * range) continue;
      if (e.pathProgress > bestProgress) {
        bestProgress = e.pathProgress;
        best = e;
      }
    }
    return best;
  }

  enemiesInRadius(cx, cy, radius) {
    const out = [];
    for (const e of this.enemies) {
      if (e.dead || e.reachedEnd) continue;
      const dx = e.x - cx, dy = e.y - cy;
      if (dx * dx + dy * dy <= radius * radius) out.push(e);
    }
    return out;
  }

  clear() {
    this.enemies = [];
    this.deathFx = [];
  }
};
