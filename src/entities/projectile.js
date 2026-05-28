window.Projectile = class Projectile {
  constructor(opts) {
    this.id = Projectile.nextId++;
    this.sourceTowerType = opts.sourceTowerType;
    this.x = opts.x;
    this.y = opts.y;
    this.startX = opts.x;
    this.startY = opts.y;
    this.targetX = opts.targetX;
    this.targetY = opts.targetY;
    this.speed = opts.speed || 600;
    this.damage = opts.damage;
    this.isCrit = !!opts.isCrit;
    this.critMul = opts.critMul !== undefined ? opts.critMul : 2.0;
    this.ignoresShield = !!opts.ignoresShield;
    this.pierceLeft = opts.pierceLeft || 0;
    this.hitEnemies = new Set();

    this.kind = opts.kind || 'linear';
    this.aoeRadius = opts.aoeRadius || 0;
    this.slow = opts.slow || null;
    this.burn = opts.burn || null;
    this.fragilityBonus = opts.fragilityBonus || 0;

    this.dead = false;
    this.life = 3.0;
    this.trail = [];

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / len) * this.speed;
    this.vy = (dy / len) * this.speed;

    if (this.kind === 'arc') {
      this.totalDist = len;
      this.traveled = 0;
      this.dirX = dx / len;
      this.dirY = dy / len;
    }

    if (this.kind === 'hitscan') {
      this.visualDuration = opts.visualDuration || 0.12;
      this.visualTime = this.visualDuration;
      this.color = opts.color || DATA.COLORS.sniper;
    }
  }

  tick(dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }

    if (this.kind === 'hitscan') {
      this.visualTime -= dt;
      if (this.visualTime <= 0) this.dead = true;
      return;
    }

    if (this.kind === 'arc') {
      this.x += this.dirX * this.speed * dt;
      this.y += this.dirY * this.speed * dt;
      this.traveled += this.speed * dt;
      this.trail.push({ x: this.x, y: this.y, life: 0.25 });
      if (this.trail.length > 12) this.trail.shift();
      for (let i = this.trail.length - 1; i >= 0; i--) {
        this.trail[i].life -= dt;
        if (this.trail[i].life <= 0) this.trail.splice(i, 1);
      }
      if (this.traveled >= this.totalDist) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.exploded = true;
        this.dead = true;
      }
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // trail for linear
    this.trail.push({ x: this.x, y: this.y, life: 0.12 });
    if (this.trail.length > 6) this.trail.shift();
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }

    const dxToTarget = this.targetX - this.x;
    const dyToTarget = this.targetY - this.y;
    const goingPast = (dxToTarget * this.vx + dyToTarget * this.vy) < 0;
    if (goingPast && this.pierceLeft <= 0) {
      this.dead = true;
    }
  }

  render(ctx) {
    if (this.kind === 'hitscan') {
      const alpha = this.visualTime / this.visualDuration;
      const hitscanColor = this.color || DATA.COLORS.sniper;
      ctx.save();
      // wide soft outer pass
      ctx.globalAlpha = alpha * 0.35;
      ctx.strokeStyle = hitscanColor;
      ctx.shadowColor = hitscanColor;
      ctx.shadowBlur = 18;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.lineTo(this.targetX, this.targetY);
      ctx.stroke();
      // narrow bright inner
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#fff8d0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.startX, this.startY);
      ctx.lineTo(this.targetX, this.targetY);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (this.kind === 'arc') {
      const color = DATA.COLORS.nova;
      ctx.save();
      // particle trail
      this.trail.forEach((t, i) => {
        const a = (t.life / 0.25);
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 3 * a + 1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const color = this.sourceTowerType === 'ice' ? DATA.COLORS.ice : DATA.COLORS.rail;
    ctx.save();
    // trail
    this.trail.forEach((t, i) => {
      const a = (t.life / 0.12) * 0.7;
      ctx.globalAlpha = a;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 2 * a + 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
    // tip
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

window.Projectile.nextId = 1;
