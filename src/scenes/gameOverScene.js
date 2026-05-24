window.GameOverScene = class GameOverScene {
  constructor() {
    this.time = 0;
    this.result = null;
    this.particles = [];
  }

  enter(result) {
    this.time = 0;
    this.result = result || { won: false, wave: 1, kills: 0, starsEarned: 0 };
    this.particles = [];
    if (this.result.won) {
      // victory burst — green/teal particles
      for (let i = 0; i < 80; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 50 + Math.random() * 280;
        this.particles.push({
          x: DATA.VIRTUAL_WIDTH / 2,
          y: DATA.VIRTUAL_HEIGHT / 2 - 80,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 60,
          size: 1 + Math.random() * 2.5,
          life: 0.8 + Math.random() * 1.2,
          color: Math.random() > 0.5 ? DATA.COLORS.rail : DATA.COLORS.gold
        });
      }
    }
  }

  update(dt) {
    this.time += dt;
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt; // gravity
      p.vx *= 0.985;
      p.life -= dt;
    });
    this.particles = this.particles.filter(p => p.life > 0);
  }

  render(ctx) {
    const won = this.result.won;
    const color = won ? DATA.COLORS.rail : DATA.COLORS.danger;

    // simulated screen shake on defeat for first 0.4s
    let shakeX = 0, shakeY = 0;
    if (!won && this.time < 0.4) {
      const k = 1 - this.time / 0.4;
      shakeX = (Math.random() - 0.5) * 4 * k;
      shakeY = (Math.random() - 0.5) * 4 * k;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    RENDER.gridBackground(ctx, this.time);

    // background dim
    ctx.fillStyle = 'rgba(5, 5, 16, 0.55)';
    ctx.fillRect(-10, -10, DATA.VIRTUAL_WIDTH + 20, DATA.VIRTUAL_HEIGHT + 20);

    // defeat: red vignette pulse
    if (!won) {
      const pulse = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(this.time * 2.4));
      const cx = DATA.VIRTUAL_WIDTH / 2;
      const cy = DATA.VIRTUAL_HEIGHT / 2;
      const grad = ctx.createRadialGradient(cx, cy, 200, cx, cy, 760);
      grad.addColorStop(0, 'rgba(255, 51, 68, 0)');
      grad.addColorStop(1, `rgba(255, 51, 68, ${pulse})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, DATA.VIRTUAL_WIDTH, DATA.VIRTUAL_HEIGHT);
    }

    // victory particle burst
    if (won) {
      this.particles.forEach(p => {
        const a = MATH_UTILS.clamp(p.life, 0, 1);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        ctx.restore();
      });
    }

    const cx = DATA.VIRTUAL_WIDTH / 2;

    const panelW = 560;
    const panelH = 440;
    const px = cx - panelW / 2;
    const py = (DATA.VIRTUAL_HEIGHT - panelH) / 2;

    RENDER.panel(ctx, px, py, panelW, panelH,
      { border: color, fill: '#0a0a1c', radius: 14, glowBorder: color, borderWidth: 1.5 });

    // corner accents
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    const sz = 18;
    ctx.beginPath();
    ctx.moveTo(px + 14, py + 14 + sz); ctx.lineTo(px + 14, py + 14); ctx.lineTo(px + 14 + sz, py + 14);
    ctx.moveTo(px + panelW - 14, py + 14 + sz); ctx.lineTo(px + panelW - 14, py + 14); ctx.lineTo(px + panelW - 14 - sz, py + 14);
    ctx.moveTo(px + 14, py + panelH - 14 - sz); ctx.lineTo(px + 14, py + panelH - 14); ctx.lineTo(px + 14 + sz, py + panelH - 14);
    ctx.moveTo(px + panelW - 14, py + panelH - 14 - sz); ctx.lineTo(px + panelW - 14, py + panelH - 14); ctx.lineTo(px + panelW - 14 - sz, py + panelH - 14);
    ctx.stroke();
    ctx.restore();

    // glyph — animated reveal
    const reveal = MATH_UTILS.clamp(this.time / 0.6, 0, 1);
    ctx.save();
    ctx.translate(cx, py + 80);
    const scale = 0.6 + 0.4 * reveal;
    ctx.scale(scale, scale);
    if (won) {
      // big star
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      RENDER.starIcon(ctx, 0, 0, 56, color);
      ctx.shadowBlur = 14;
      RENDER.starIcon(ctx, 0, 0, 32, '#ffffff');
    } else {
      ctx.shadowColor = color;
      ctx.shadowBlur = 22;
      RENDER.text(ctx, '✕', 0, 0, {
        size: 56, color, weight: 900, align: 'center', baseline: 'middle',
        glow: color, glowStrength: 1.2
      });
    }
    ctx.restore();

    RENDER.text(ctx, won ? 'SETOR CONCLUÍDO' : 'NÚCLEO PERDIDO', cx, py + 152, {
      size: 28, color, weight: 700,
      align: 'center', baseline: 'middle', font: 'Orbitron', letterSpacing: 6,
      glow: color, glowStrength: 0.8
    });

    RENDER.text(ctx, won ? 'a defesa resistiu até o fim' : 'os inimigos atravessaram',
      cx, py + 184, {
      size: 12, color: DATA.COLORS.textSecondary, align: 'center', baseline: 'middle',
      letterSpacing: 2
    });

    const statsY = py + 230;
    const statW = 150;
    const statsStartX = cx - statW * 1.5 - 16;

    const stats = [
      { label: 'WAVE', value: String(this.result.wave), color: DATA.COLORS.textPrimary },
      { label: 'KILLS', value: String(this.result.kills), color: DATA.COLORS.textPrimary },
      { label: 'ESTRELAS', value: '+' + this.result.starsEarned, color: DATA.COLORS.gold }
    ];

    stats.forEach((s, i) => {
      const x = statsStartX + i * (statW + 16);
      RENDER.panel(ctx, x, statsY, statW, 84, {
        border: DATA.COLORS.borderStrong, fill: '#0d0d20', radius: 8
      });
      RENDER.text(ctx, s.label, x + statW / 2, statsY + 22, {
        size: 10, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle', letterSpacing: 3
      });
      const isStars = s.label === 'ESTRELAS' && this.result.starsEarned > 0;
      RENDER.text(ctx, s.value, x + statW / 2, statsY + 54, {
        size: 26, color: s.color, weight: 700, align: 'center', baseline: 'middle',
        glow: isStars ? DATA.COLORS.gold : null, glowStrength: 0.6
      });
    });

    const btnY = py + panelH - 70;
    const btnW = 168;
    const btnH = 46;
    const gap = 8;
    const totalW = btnW * 3 + gap * 2;
    const btnStartX = px + (panelW - totalW) / 2;
    let result = null;

    if (RENDER.button(ctx, btnStartX, btnY, btnW, btnH, '↻ JOGAR NOVAMENTE', {
      color, size: 12
    })) result = 'replay';

    if (RENDER.button(ctx, btnStartX + btnW + gap, btnY, btnW, btnH, '✦ HABILIDADES', {
      color: DATA.COLORS.sniper, size: 12
    })) result = 'skills';

    const nextMapId = this.result.mapId + 1;
    const hasNext = won && nextMapId <= 10 && MAPS.get(nextMapId);
    if (hasNext) {
      if (RENDER.button(ctx, btnStartX + (btnW + gap) * 2, btnY, btnW, btnH, '▸ PRÓXIMA FASE', {
        color: DATA.COLORS.rail, size: 12
      })) result = 'nextMap';
    } else {
      if (RENDER.button(ctx, btnStartX + (btnW + gap) * 2, btnY, btnW, btnH, '◇ VOLTAR AO MENU', {
        color: DATA.COLORS.textSecondary, size: 12
      })) result = 'menu';
    }

    ctx.restore();
    return result;
  }

  handleAction(action, game) {
    if (action === 'replay') {
      game.startMap(this.result.mapId, 'normal');
    } else if (action === 'nextMap') {
      game.startMap(this.result.mapId + 1, 'normal');
    } else if (action === 'skills') {
      game.changeScene('skillTree');
    } else if (action === 'menu') {
      game.changeScene('menu');
    }
  }
};
