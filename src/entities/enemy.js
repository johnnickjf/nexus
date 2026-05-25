window.Enemy = class Enemy {
  constructor(type, wave, modifiers = [], mapData, mode = 'normal') {
    this.id = Enemy.nextId++;
    this.type = type;
    const def = DATA.ENEMIES[type];

    this.spawnWave = wave;
    this.spawnMode = mode;

    let scaledHp = DATA.computeHp(def.baseHp, def.hpPerWave, wave);
    if (mode === 'infinite' && wave > 15) {
      const w = wave - 15;
      let mul = 1 + w * 0.04 + Math.sqrt(w) * 0.3;
      // Boss já escala muito no linear (hpPerWave 80) — amortece o mul pra não virar invivével
      if (def.isBoss) mul = 1 + (mul - 1) * 0.45;
      scaledHp = Math.floor(scaledHp * mul);
    }
    this.maxHp = scaledHp;
    this.hp = this.maxHp;
    this.baseSpeed = def.speed;
    this.size = def.size;
    this.color = def.color;
    this.shape = def.shape;
    this.isBoss = def.isBoss;
    this.coreDamage = def.coreDamage;
    this.coinReward = def.coinReward;
    this.name = def.name;

    // Inimigos pesados resistem ao slow do ICE (multiplica a porcentagem aplicada)
    this.slowResist = def.isBoss ? 0.4 : (type === 'tank' ? 0.5 : 1.0);

    this.pathProgress = 0;
    this.mapData = mapData;
    this.x = mapData.path[0].x;
    this.y = mapData.path[0].y;

    this.shield = null;
    this.hasLightning = false;
    this.blink = null;
    this.immunities = [];

    modifiers.forEach(m => this.applyModifier(m));

    this.slow = null;
    this.burn = null;

    this.dead = false;
    this.reachedEnd = false;
    this.hitFlash = 0;
    this.dieFlash = 0;
    this.pulseTime = Math.random() * Math.PI * 2;
  }

  applyModifier(mod) {
    if (mod === 'shield_blue') this.shield = { hp: 3, maxHp: 3, color: DATA.SHIELDS.blue.color, type: 'blue' };
    else if (mod === 'shield_gold') this.shield = { hp: 8, maxHp: 8, color: DATA.SHIELDS.gold.color, type: 'gold' };
    else if (mod === 'shield_red') this.shield = { hp: 15, maxHp: 15, color: DATA.SHIELDS.red.color, type: 'red' };
    else if (mod === 'lightning') this.hasLightning = true;
    else if (mod === 'blink') this.blink = { phase: 'vulnerable', timeLeft: DATA.MODIFIERS.blink.vulnerableTime };
    else if (mod.startsWith('immune_')) {
      const tower = mod.replace('immune_', '');
      this.immunities.push(tower);
    }
  }

  get invulnerable() {
    return this.blink && this.blink.phase === 'immune';
  }

  get currentSpeed() {
    let s = this.baseSpeed;
    // Speed escala +1% por wave acima de 20, cap 2.5x (1.8x pra boss)
    if (this.spawnWave > 20) {
      const cap = this.isBoss ? 1.8 : 2.5;
      const speedMul = Math.min(cap, 1 + (this.spawnWave - 20) * 0.01);
      s *= speedMul;
    }
    if (this.hasLightning) s *= DATA.MODIFIERS.lightningSpeedMul;
    if (this.slow) s *= (1 - this.slow.percent);
    return s;
  }

  tick(dt) {
    if (this.blink) {
      this.blink.timeLeft -= dt;
      if (this.blink.timeLeft <= 0) {
        if (this.blink.phase === 'vulnerable') {
          this.blink.phase = 'immune';
          this.blink.timeLeft = DATA.MODIFIERS.blink.immuneTime;
        } else {
          this.blink.phase = 'vulnerable';
          this.blink.timeLeft = DATA.MODIFIERS.blink.vulnerableTime;
        }
      }
    }

    if (this.slow) {
      this.slow.timeLeft -= dt;
      if (this.slow.timeLeft <= 0) this.slow = null;
    }

    if (this.burn) {
      this.burn.timeLeft -= dt;
      this.hp -= this.burn.dps * dt;
      if (this.burn.timeLeft <= 0) this.burn = null;
      if (this.hp <= 0 && !this.dead) {
        this.dead = true;
        return;
      }
    }

    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.dieFlash > 0) this.dieFlash -= dt;
    this.pulseTime += dt;

    const move = this.currentSpeed * dt;
    this.pathProgress += move / this.mapData.pathLength;

    if (this.pathProgress >= 1) {
      this.pathProgress = 1;
      this.reachedEnd = true;
      return;
    }

    const pos = MATH_UTILS.positionOnPath(this.mapData.path, this.mapData.pathLength, this.pathProgress);
    this.x = pos.x;
    this.y = pos.y;
  }

  render(ctx) {
    const flashing = this.hitFlash > 0;
    const invu = this.invulnerable;

    if (invu) {
      ctx.save();
      ctx.globalAlpha = 0.35;
    }

    // Boss aura
    if (this.isBoss) {
      RENDER.glowCircle(ctx, this.x, this.y, this.size * 2.4, this.color, 0.9);
    }

    ctx.save();
    ctx.fillStyle = flashing ? '#ffffff' : this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;

    if (this.shape === 'circle' || this.shape === 'circleRing' || this.shape === 'circleDashed') {
      ctx.beginPath();
      if (this.shape === 'circleDashed') {
        ctx.setLineDash([3, 2]);
        ctx.fillStyle = flashing ? '#ffffff' : this.color;
        ctx.globalAlpha = invu ? 0.35 : 0.5;
      }
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      if (this.shape === 'circleRing') {
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (this.shape === 'circleDashed') {
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    } else if (this.shape === 'square') {
      RENDER.roundedRect(ctx, this.x - this.size, this.y - this.size, this.size * 2, this.size * 2, 2);
      ctx.fill();
    } else if (this.shape === 'hexagon') {
      RENDER.hexagon(ctx, this.x, this.y, this.size);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.globalAlpha = 0.3;
      ctx.stroke();
    }
    ctx.restore();

    // Boss crown
    if (this.isBoss) {
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      const cy = this.y - this.size - 4;
      ctx.beginPath();
      ctx.moveTo(this.x - 6, cy + 3);
      ctx.lineTo(this.x - 4, cy - 3);
      ctx.lineTo(this.x - 2, cy + 1);
      ctx.lineTo(this.x, cy - 4);
      ctx.lineTo(this.x + 2, cy + 1);
      ctx.lineTo(this.x + 4, cy - 3);
      ctx.lineTo(this.x + 6, cy + 3);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.restore();
    }

    if (this.shield && this.shield.hp > 0) {
      const pulse = 0.55 + 0.45 * Math.sin(this.pulseTime * 3);
      ctx.save();
      // outer pulsing ring
      ctx.strokeStyle = this.shield.color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35 * pulse;
      ctx.shadowColor = this.shield.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 7, 0, Math.PI * 2);
      ctx.stroke();
      // inner solid shield
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.hasLightning) {
      ctx.save();
      ctx.strokeStyle = '#ffff44';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(this.x - 3, this.y - this.size - 4);
      ctx.lineTo(this.x + 1, this.y - this.size - 1);
      ctx.lineTo(this.x - 1, this.y - this.size - 1);
      ctx.lineTo(this.x + 3, this.y - this.size + 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.burn) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 80);
      ctx.fillStyle = '#ff6622';
      ctx.beginPath();
      ctx.arc(this.x + this.size, this.y - this.size, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.slow) {
      ctx.save();
      ctx.fillStyle = DATA.COLORS.ice;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(this.x - this.size, this.y - this.size, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const barW = Math.max(this.size * 2.4, 22);
    const barY = this.y - this.size - 10;
    const hpRatio = this.hp / this.maxHp;
    const hpColor = hpRatio < 0.3 ? DATA.COLORS.danger : this.color;
    RENDER.hpBar(ctx, this.x - barW / 2, barY, barW, this.isBoss ? 5 : 4, hpRatio, hpColor,
      { glow: this.isBoss, pulseTime: this.pulseTime });

    // Death flash
    if (this.dieFlash > 0) {
      ctx.save();
      const t = this.dieFlash / 0.3;
      ctx.globalAlpha = t;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * (1 + (1 - t) * 1.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (invu) ctx.restore();
  }

  die() {
    this.dead = true;
    this.dieFlash = 0.3;
  }
};

window.Enemy.nextId = 1;
