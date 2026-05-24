window.SupportScene = class SupportScene {
  constructor() {
    this.time = 0;
  }
  enter() { this.time = 0; }
  update(dt) { this.time += dt; }

  render(ctx) {
    RENDER.gridBackground(ctx, this.time);

    let backClicked = false;
    if (RENDER.button(ctx, 24, 24, 100, 36, '← VOLTAR', {
      color: DATA.COLORS.textSecondary, size: 12
    })) backClicked = true;

    const cx = DATA.VIRTUAL_WIDTH / 2;

    ctx.save();
    const pulse = 0.7 + 0.3 * Math.sin(this.time * 1.5);
    ctx.globalAlpha = pulse;
    RENDER.text(ctx, '♥', cx, 130, {
      size: 54, color: DATA.COLORS.nova, align: 'center', baseline: 'middle', weight: 700
    });
    ctx.restore();

    RENDER.text(ctx, 'APOIE O JOGO', cx, 200, {
      size: 26, color: DATA.COLORS.textPrimary, weight: 700,
      align: 'center', baseline: 'middle', font: 'Orbitron', letterSpacing: 8
    });

    RENDER.text(ctx, 'O NEXUS é um projeto independente feito por um desenvolvedor solo.',
      cx, 250, { size: 13, color: DATA.COLORS.textSecondary, align: 'center', baseline: 'middle' });
    RENDER.text(ctx, 'Se você curtiu o jogo, considere comprar um café — ajuda muito.',
      cx, 274, { size: 13, color: DATA.COLORS.textSecondary, align: 'center', baseline: 'middle' });

    const panelW = 480;
    const panelH = 200;
    const panelX = cx - panelW / 2;
    const panelY = 330;
    RENDER.panel(ctx, panelX, panelY, panelW, panelH,
      { border: DATA.COLORS.nova, fill: '#0a0a18', radius: 10 });

    ctx.save();
    ctx.strokeStyle = DATA.COLORS.nova;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.4;
    const sz = 14;
    ctx.beginPath();
    ctx.moveTo(panelX + 12, panelY + 12 + sz); ctx.lineTo(panelX + 12, panelY + 12); ctx.lineTo(panelX + 12 + sz, panelY + 12);
    ctx.moveTo(panelX + panelW - 12, panelY + 12 + sz); ctx.lineTo(panelX + panelW - 12, panelY + 12); ctx.lineTo(panelX + panelW - 12 - sz, panelY + 12);
    ctx.moveTo(panelX + 12, panelY + panelH - 12 - sz); ctx.lineTo(panelX + 12, panelY + panelH - 12); ctx.lineTo(panelX + 12 + sz, panelY + panelH - 12);
    ctx.moveTo(panelX + panelW - 12, panelY + panelH - 12 - sz); ctx.lineTo(panelX + panelW - 12, panelY + panelH - 12); ctx.lineTo(panelX + panelW - 12 - sz, panelY + panelH - 12);
    ctx.stroke();
    ctx.restore();

    RENDER.text(ctx, '☕  COMPRE UM CAFÉ', cx, panelY + 50,
      { size: 16, color: DATA.COLORS.nova, align: 'center', baseline: 'middle', weight: 700, letterSpacing: 4 });

    RENDER.text(ctx, 'Qualquer valor ajuda a manter o desenvolvimento ativo,',
      cx, panelY + 84, { size: 11, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle' });
    RENDER.text(ctx, 'a adicionar mais conteúdo e a lançar atualizações.',
      cx, panelY + 100, { size: 11, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle' });

    const btnW = 220, btnH = 44;
    if (RENDER.button(ctx, cx - btnW / 2, panelY + 130, btnW, btnH, '♥  APOIAR  →', {
      color: DATA.COLORS.nova,
      bg: '#1a0a18',
      bgHover: '#2a0d20',
      size: 13
    })) {
      window.open(DATA.SUPPORT_URL, '_blank');
    }

    RENDER.text(ctx, 'OUTRAS FORMAS DE AJUDAR',
      cx, panelY + panelH + 50, {
        size: 11, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle', letterSpacing: 4
      });

    const altItems = [
      'compartilhe com seus amigos',
      'reporte bugs e sugestões',
      'siga nas redes sociais'
    ];
    altItems.forEach((t, i) => {
      RENDER.text(ctx, '·  ' + t, cx, panelY + panelH + 75 + i * 20,
        { size: 11, color: DATA.COLORS.textSecondary, align: 'center', baseline: 'middle' });
    });

    if (backClicked) return 'menu';
    return null;
  }

  handleAction(action, game) {
    if (action === 'menu') game.changeScene('menu');
  }
};
