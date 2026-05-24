window.FloatingText = class FloatingText {
  constructor(text, x, y, color = '#f0c040', opts = {}) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.vy = -30;
    this.life = 1.0;
    this.maxLife = 1.0;
    this.dead = false;

    // auto-detect kind
    this.isCrit = /CRIT/i.test(text);
    this.isCoin = /◈/.test(text);
    this.isStar = /✦/.test(text);
    this.size = opts.size || (this.isCrit ? 18 : 13);
    this.glow = opts.glow !== undefined ? opts.glow : (this.isCrit || this.isCoin || this.isStar);
    if (this.isCrit) {
      this.color = '#ffe88a';
      this.vy = -40;
    }
  }

  tick(dt) {
    this.y += this.vy * dt;
    this.vy *= 0.92;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  render(ctx) {
    const alpha = MATH_UTILS.clamp(this.life / this.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;

    let size = this.size;
    if (this.isCrit) {
      // pop scale in first 0.15s
      const pop = MATH_UTILS.clamp((this.maxLife - this.life) / 0.15, 0, 1);
      size = this.size * (1.4 - 0.4 * pop);
    }

    RENDER.text(ctx, this.text, this.x, this.y, {
      size,
      color: this.color,
      align: 'center',
      baseline: 'middle',
      weight: 700,
      glow: this.glow ? this.color : null,
      glowStrength: this.isCrit ? 1.2 : 0.6
    });
    ctx.restore();
  }
};
