window.ProjectileSystem = class ProjectileSystem {
  constructor() {
    this.projectiles = [];
    this.explosions = [];
  }

  add(p) { this.projectiles.push(p); }

  tick(dt, enemySystem, onKill, floatingTextList) {

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].life -= dt;
      if (this.explosions[i].life <= 0) this.explosions.splice(i, 1);
    }

    for (const p of this.projectiles) {
      if (p.dead) continue;

      if (p.kind === 'hitscan') {
        if (!p.hasFired) {
          this.processHitscan(p, enemySystem, onKill, floatingTextList);
          p.hasFired = true;
        }
        p.visualTime -= dt;
        if (p.visualTime <= 0) p.dead = true;
        continue;
      }

      const prevX = p.x, prevY = p.y;
      p.tick(dt);

      if (p.kind === 'arc') {
        if (p.exploded) {
          this.processExplosion(p, enemySystem, onKill, floatingTextList);
        }
        continue;
      }

      for (const e of enemySystem.enemies) {
        if (e.dead || e.reachedEnd) continue;
        if (p.hitEnemies.has(e.id)) continue;
        const hits = MATH_UTILS.lineCircleHit(prevX, prevY, p.x, p.y, e.x, e.y, e.size + 6);
        if (hits) {
          p.hitEnemies.add(e.id);
          this.applyHit(e, this.makeHit(p, e), onKill, floatingTextList);

          if (p.sourceTowerType === 'ice' && p.aoeRadius > 0) {
            // Visual burst at impact so o jogador vê a AoE crescer com upgrades
            this.explosions.push({
              x: e.x, y: e.y, radius: p.aoeRadius,
              color: DATA.COLORS.ice, life: 0.35, max: 0.35
            });
            const others = enemySystem.enemiesInRadius(e.x, e.y, p.aoeRadius);
            for (const other of others) {
              if (other.id === e.id || p.hitEnemies.has(other.id)) continue;
              p.hitEnemies.add(other.id);
              this.applyHit(other, this.makeHit(p, other), onKill, floatingTextList);
            }
          }

          if (p.pierceLeft === Infinity) {
          } else if (p.pierceLeft > 0) {
            p.pierceLeft--;
          } else {
            p.dead = true;
            break;
          }
        }
      }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      if (this.projectiles[i].dead) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  processHitscan(p, enemySystem, onKill, floatingTextList) {
    let target = null;
    let minDist = Infinity;
    for (const e of enemySystem.enemies) {
      if (e.dead || e.reachedEnd) continue;
      const d = MATH_UTILS.dist(e.x, e.y, p.targetX, p.targetY);
      if (d < (e.size + 8) && d < minDist) {
        minDist = d;
        target = e;
      }
    }
    if (target) {
      this.applyHit(target, this.makeHit(p, target), onKill, floatingTextList);
    }
  }

  processExplosion(p, enemySystem, onKill, floatingTextList) {
    AUDIO.sfx.explosion();
    this.explosions.push({
      x: p.targetX, y: p.targetY, radius: p.aoeRadius,
      color: DATA.COLORS.nova, life: 0.45, max: 0.45
    });
    const victims = enemySystem.enemiesInRadius(p.targetX, p.targetY, p.aoeRadius);
    for (const v of victims) {
      this.applyHit(v, this.makeHit(p, v), onKill, floatingTextList);
    }

    let chainsLeft = p.chainCount || 0;
    let lastX = p.targetX, lastY = p.targetY;
    let lastDamage = p.damage;
    const alreadyHit = new Set(victims.map(v => v.id));

    while (chainsLeft > 0) {
      let next = null;
      let bestD = Infinity;
      for (const e of enemySystem.enemies) {
        if (e.dead || e.reachedEnd || alreadyHit.has(e.id)) continue;
        const d = MATH_UTILS.dist(e.x, e.y, lastX, lastY);
        if (d > p.aoeRadius * 1.5) continue;
        if (d < bestD) { bestD = d; next = e; }
      }
      if (!next) break;
      lastDamage = Math.floor(lastDamage * 0.7);

      const chainVictims = enemySystem.enemiesInRadius(next.x, next.y, p.aoeRadius);
      for (const v of chainVictims) {
        if (alreadyHit.has(v.id)) continue;
        alreadyHit.add(v.id);
        const hit = this.makeHit(p, v);
        hit.damage = lastDamage;
        this.applyHit(v, hit, onKill, floatingTextList);
      }
      lastX = next.x; lastY = next.y;
      chainsLeft--;

      floatingTextList.push(new FloatingText('×', lastX, lastY - 10, DATA.COLORS.nova));
    }
  }

  makeHit(p, enemy) {
    return {
      sourceTowerType: p.sourceTowerType,
      damage: p.damage,
      isCrit: p.isCrit,
      ignoresShield: p.ignoresShield,
      slow: p.slow ? { ...p.slow } : null,
      burn: p.burn ? { ...p.burn } : null,
      shieldBreakBonus: p.shieldBreakBonus || 0,
      canExecute: p.canExecute || false,
      headshotKill: p.headshotKill || false
    };
  }

  applyHit(enemy, hit, onKill, floatingTextList) {
    if (enemy.dead) return;

    if (enemy.immunities.includes(hit.sourceTowerType)) return;

    if (enemy.invulnerable) return;

    let damageToApply = hit.isCrit ? hit.damage * 2 : hit.damage;

    if (enemy.shield && enemy.shield.hp > 0) {
      if (!hit.ignoresShield) {
        const drain = 1 + (hit.shieldBreakBonus || 0);
        enemy.shield.hp -= drain;
        if (enemy.shield.hp <= 0) enemy.shield = null;

        if (hit.sourceTowerType === 'ice' && hit.slow) {
          this.applySlowAndBurn(enemy, hit);
        }
        return;
      }
    }

    enemy.hp -= damageToApply;
    enemy.hitFlash = 0.08;

    this.applySlowAndBurn(enemy, hit);

    if (floatingTextList && hit.isCrit) {
      floatingTextList.push(new FloatingText(`CRIT`, enemy.x, enemy.y - enemy.size - 14, '#ffff88'));
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy, onKill, floatingTextList);
      return;
    }

    if (hit.headshotKill && !enemy.isBoss) {
      this.killEnemy(enemy, onKill, floatingTextList);
      return;
    }

    if (hit.canExecute && !enemy.isBoss && enemy.hp / enemy.maxHp <= 0.2) {
      this.killEnemy(enemy, onKill, floatingTextList);
      return;
    }
  }

  applySlowAndBurn(enemy, hit) {
    if (hit.slow) {
      const resistFactor = enemy.slowResist ?? 1.0;
      const effectivePercent = hit.slow.percent * resistFactor;
      const cur = enemy.slow?.percent ?? 0;
      if (effectivePercent > cur) {
        enemy.slow = { percent: effectivePercent, timeLeft: hit.slow.duration };
      } else if (effectivePercent === cur) {
        enemy.slow.timeLeft = hit.slow.duration;
      }
    }
    if (hit.burn) {
      if (!enemy.burn || hit.burn.dps > enemy.burn.dps) {
        enemy.burn = { dps: hit.burn.dps, timeLeft: hit.burn.duration };
      } else if (hit.burn.dps === enemy.burn.dps) {
        enemy.burn.timeLeft = hit.burn.duration;
      }
    }
  }

  killEnemy(enemy, onKill, floatingTextList) {
    enemy.die();
    AUDIO.sfx.enemyDeath();
    if (onKill) onKill(enemy);
    if (floatingTextList) {
      floatingTextList.push(new FloatingText(`+${enemy.coinReward} ◈`, enemy.x, enemy.y - 6, DATA.COLORS.gold));
    }
  }

  render(ctx) {
    this.projectiles.forEach(p => p.render(ctx));
    // explosions: expanding ring + radial burst
    this.explosions.forEach(ex => {
      const t = ex.life / ex.max;
      const grow = 1 - t;
      const r = ex.radius * (0.5 + grow * 1.1);
      ctx.save();
      // soft fill
      const g = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, r);
      g.addColorStop(0, RENDER._withAlpha('#fff0a0', 0.7 * t));
      g.addColorStop(0.3, RENDER._withAlpha(ex.color, 0.55 * t));
      g.addColorStop(1, RENDER._withAlpha(ex.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
      ctx.fill();

      // expanding ring
      ctx.globalAlpha = t * 0.85;
      ctx.strokeStyle = ex.color;
      ctx.shadowColor = ex.color;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2 * t + 1;
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
      ctx.stroke();

      // burst lines
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = t * 0.8;
      const lines = 10;
      for (let i = 0; i < lines; i++) {
        const a = (i / lines) * Math.PI * 2;
        const r1 = r * 0.45;
        const r2 = r * 1.0;
        ctx.beginPath();
        ctx.moveTo(ex.x + Math.cos(a) * r1, ex.y + Math.sin(a) * r1);
        ctx.lineTo(ex.x + Math.cos(a) * r2, ex.y + Math.sin(a) * r2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  clear() {
    this.projectiles = [];
    this.explosions = [];
  }
};
