window.MenuScene = class MenuScene {
  constructor() {
    this.time = 0;
    this.particles = [];
    // depth-layered particles: some slow far, some fast near
    for (let i = 0; i < 60; i++) {
      const depth = Math.random();
      this.particles.push({
        x: Math.random() * DATA.VIRTUAL_WIDTH,
        y: Math.random() * DATA.VIRTUAL_HEIGHT,
        vy: 4 + depth * 50,                   // slow=far, fast=near
        size: 0.6 + depth * 2.5,
        alpha: 0.15 + depth * 0.6,
        depth
      });
    }
  }

  enter() { this.time = 0; }

  update(dt) {
    this.time += dt;
    this.particles.forEach(p => {
      p.y += p.vy * dt;
      if (p.y > DATA.VIRTUAL_HEIGHT) {
        p.y = -10;
        p.x = Math.random() * DATA.VIRTUAL_WIDTH;
      }
    });
  }

  render(ctx) {
    RENDER.gridBackground(ctx, this.time);

    // particles
    ctx.save();
    ctx.fillStyle = DATA.COLORS.rail;
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      if (p.depth > 0.6) {
        ctx.shadowColor = DATA.COLORS.rail;
        ctx.shadowBlur = p.size * 2;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.restore();

    this.renderCornerBrackets(ctx);

    const cx = DATA.VIRTUAL_WIDTH / 2;
    const titleY = 180;

    // atmospheric radial gradient behind title
    ctx.save();
    const grad = ctx.createRadialGradient(cx, titleY + 40, 30, cx, titleY + 40, 460);
    grad.addColorStop(0, 'rgba(45, 255, 200, 0.18)');
    grad.addColorStop(0.5, 'rgba(45, 255, 200, 0.05)');
    grad.addColorStop(1, 'rgba(45, 255, 200, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - 460, titleY - 200, 920, 460);
    ctx.restore();

    // top/bottom title rails
    ctx.save();
    ctx.fillStyle = DATA.COLORS.rail;
    ctx.shadowColor = DATA.COLORS.rail;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(cx - 460, titleY - 8, 920, 1);
    ctx.fillRect(cx - 460, titleY + 88, 920, 1);
    ctx.restore();

    // title with breathing letter spacing
    const ls = 4 + 3 * (0.5 + 0.5 * Math.sin(this.time * 0.9));
    RENDER.text(ctx, 'NEXUS LAND.', cx, titleY + 40, {
      size: 64, color: DATA.COLORS.rail, weight: 900,
      align: 'center', baseline: 'middle',
      font: 'Orbitron', letterSpacing: ls,
      glow: DATA.COLORS.rail, glowStrength: 1.4
    });

    RENDER.text(ctx, '⟨ TOWER DEFENSE / v0.1 ⟩', cx, titleY + 110, {
      size: 12, color: DATA.COLORS.textSecondary, align: 'center', baseline: 'middle',
      letterSpacing: 6, font: 'JetBrains Mono'
    });

    const buttons = [
      { id: 'play', label: '▸ PLAY', accent: DATA.COLORS.rail },
      { id: 'skills', label: '✦ HABILIDADES', accent: DATA.COLORS.sniper },
      { id: 'settings', label: '⚙ CONFIGURAÇÕES', accent: DATA.COLORS.textSecondary },
      { id: 'help', label: '? COMO JOGAR', accent: DATA.COLORS.textSecondary },
      { id: 'support', label: '♥ APOIAR O JOGO', accent: DATA.COLORS.nova }
    ];

    const btnW = 360;
    const btnH = 50;
    const startY = 360;
    const gap = 10;

    let clicked = null;
    const mouse = INPUT.getMouse();

    buttons.forEach((b, i) => {
      const x = cx - btnW / 2;
      const y = startY + i * (btnH + gap);
      const hovered = MATH_UTILS.pointInRect(mouse.x, mouse.y, x, y, btnW, btnH);

      if (RENDER.button(ctx, x, y, btnW, btnH, b.label, {
        color: b.accent,
        bg: DATA.COLORS.bgPanel,
        size: 14,
        align: 'left'
      })) {
        clicked = b.id;
      }

      // sliding arrow indicator on right edge
      const arrowBaseX = x + btnW - 30;
      const slide = hovered ? 6 * Math.min(1, (this.time * 4) % 1 + 0.5) : 0;
      ctx.save();
      ctx.fillStyle = b.accent;
      ctx.globalAlpha = hovered ? 0.95 : 0.45;
      if (hovered) {
        ctx.shadowColor = b.accent;
        ctx.shadowBlur = 8;
      }
      RENDER.text(ctx, '›', arrowBaseX + slide, y + btnH / 2, {
        size: 22, color: b.accent, weight: 700, baseline: 'middle', align: 'center'
      });
      ctx.restore();
    });

    const save = SAVE.get();
    const footerY = DATA.VIRTUAL_HEIGHT - 40;
    RENDER.starIcon(ctx, 60, footerY, 14);
    RENDER.text(ctx, `${save.stars} estrelas`, 76, footerY,
      { size: 12, color: DATA.COLORS.gold, baseline: 'middle' });

    const authorHovered = mouse.x > DATA.VIRTUAL_WIDTH - 240 && mouse.x < DATA.VIRTUAL_WIDTH - 20
      && mouse.y > footerY - 12 && mouse.y < footerY + 12;
    RENDER.text(ctx, 'Johnnick F. Landim  ·  © 2026', DATA.VIRTUAL_WIDTH - 60, footerY,
      { size: 11, color: authorHovered ? DATA.COLORS.textSecondary : DATA.COLORS.textMuted,
        align: 'right', baseline: 'middle' });
    if (authorHovered && INPUT.wasClicked()) window.open(DATA.SUPPORT_URL, '_blank');

    return clicked;
  }

  renderCornerBrackets(ctx) {
    const pulse = 0.4 + 0.3 * (0.5 + 0.5 * Math.sin(this.time * 1.5));
    ctx.save();
    ctx.strokeStyle = DATA.COLORS.rail;
    ctx.shadowColor = DATA.COLORS.rail;
    ctx.shadowBlur = 6;
    ctx.globalAlpha = pulse;
    ctx.lineWidth = 1.5;
    const sz = 38;
    const m = 40;
    const corners = [
      { x: m, y: m, dx: 1, dy: 1 },
      { x: DATA.VIRTUAL_WIDTH - m, y: m, dx: -1, dy: 1 },
      { x: m, y: DATA.VIRTUAL_HEIGHT - m, dx: 1, dy: -1 },
      { x: DATA.VIRTUAL_WIDTH - m, y: DATA.VIRTUAL_HEIGHT - m, dx: -1, dy: -1 }
    ];
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.dy * sz);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x + c.dx * sz, c.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  handleAction(action, game) {
    if (action === 'play') game.changeScene('chapterSelect');
    else if (action === 'skills') game.changeScene('skillTree');
    else if (action === 'settings') game.changeScene('settings');
    else if (action === 'help') game.changeScene('help');
    else if (action === 'support') game.changeScene('support');
  }
};
