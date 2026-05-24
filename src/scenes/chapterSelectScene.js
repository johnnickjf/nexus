window.ChapterSelectScene = class ChapterSelectScene {
  constructor() { this.time = 0; }
  enter() { this.time = 0; }
  update(dt) { this.time += dt; }

  render(ctx) {
    RENDER.gridBackground(ctx, this.time);

    let backClicked = false;
    if (RENDER.button(ctx, 24, 24, 100, 36, '← MENU', {
      color: DATA.COLORS.textSecondary, size: 12
    })) backClicked = true;

    RENDER.text(ctx, 'CAPÍTULOS', DATA.VIRTUAL_WIDTH / 2, 100, {
      size: 28, color: DATA.COLORS.textPrimary, weight: 700,
      align: 'center', baseline: 'middle', font: 'Orbitron', letterSpacing: 8
    });
    RENDER.text(ctx, 'escolha sua jornada', DATA.VIRTUAL_WIDTH / 2, 132, {
      size: 12, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle', letterSpacing: 4
    });

    const save = SAVE.get();
    RENDER.starIcon(ctx, DATA.VIRTUAL_WIDTH - 130, 42, 14);
    RENDER.text(ctx, String(save.stars), DATA.VIRTUAL_WIDTH - 112, 42,
      { size: 14, color: DATA.COLORS.gold, baseline: 'middle', weight: 700 });

    if (RENDER.button(ctx, DATA.VIRTUAL_WIDTH - 80, 24, 60, 36, '✦', {
      color: DATA.COLORS.sniper, size: 16
    })) return 'skills';

    let chapterClicked = null;

    const chapters = [
      { id: 1, name: 'CAPÍTULO 1', subtitle: 'Os primeiros setores', unlocked: true },
      { id: 2, name: 'CAPÍTULO 2', subtitle: 'Em breve', unlocked: false },
      { id: 3, name: 'CAPÍTULO 3', subtitle: 'Em breve', unlocked: false }
    ];

    const cardW = 340;
    const cardH = 280;
    const startY = 220;
    const startX = (DATA.VIRTUAL_WIDTH - (cardW * 3 + 24)) / 2;

    chapters.forEach((ch, i) => {
      const x = startX + i * (cardW + 12);
      const y = startY;
      const mouse = INPUT.getMouse();
      const hovered = MATH_UTILS.pointInRect(mouse.x, mouse.y, x, y, cardW, cardH);
      const completedInChapter = ch.id === 1 ? save.completedMaps.filter(m => m <= 10).length : 0;

      ctx.save();
      ctx.fillStyle = ch.unlocked ? (hovered ? '#0d1a18' : DATA.COLORS.bgPanel) : DATA.COLORS.bg;
      ctx.strokeStyle = ch.unlocked ? (hovered ? DATA.COLORS.rail : DATA.COLORS.borderStrong) : DATA.COLORS.border;
      ctx.lineWidth = hovered && ch.unlocked ? 1.5 : 0.8;
      RENDER.roundedRect(ctx, x, y, cardW, cardH, 10);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = ch.unlocked ? DATA.COLORS.rail : DATA.COLORS.textMuted;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = ch.unlocked ? 0.4 : 0.2;
      const sz = 16;
      ctx.beginPath();
      ctx.moveTo(x + 12, y + 12 + sz); ctx.lineTo(x + 12, y + 12); ctx.lineTo(x + 12 + sz, y + 12);
      ctx.moveTo(x + cardW - 12, y + 12 + sz); ctx.lineTo(x + cardW - 12, y + 12); ctx.lineTo(x + cardW - 12 - sz, y + 12);
      ctx.moveTo(x + 12, y + cardH - 12 - sz); ctx.lineTo(x + 12, y + cardH - 12); ctx.lineTo(x + 12 + sz, y + cardH - 12);
      ctx.moveTo(x + cardW - 12, y + cardH - 12 - sz); ctx.lineTo(x + cardW - 12, y + cardH - 12); ctx.lineTo(x + cardW - 12 - sz, y + cardH - 12);
      ctx.stroke();
      ctx.restore();

      RENDER.text(ctx, `0${ch.id}`, x + cardW / 2, y + 80, {
        size: 64, color: ch.unlocked ? DATA.COLORS.rail : DATA.COLORS.textMuted,
        align: 'center', baseline: 'middle', weight: 700, font: 'Orbitron', letterSpacing: 4
      });

      RENDER.text(ctx, ch.name, x + cardW / 2, y + 156, {
        size: 14, color: ch.unlocked ? DATA.COLORS.textPrimary : DATA.COLORS.textMuted,
        align: 'center', baseline: 'middle', weight: 500, letterSpacing: 4
      });
      RENDER.text(ctx, ch.subtitle, x + cardW / 2, y + 180, {
        size: 11, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle'
      });

      if (ch.unlocked) {
        RENDER.text(ctx, `${completedInChapter}/10 setores`, x + cardW / 2, y + cardH - 50,
          { size: 11, color: DATA.COLORS.rail, align: 'center', baseline: 'middle', weight: 500 });

        const barX = x + 60;
        const barW = cardW - 120;
        const barY = y + cardH - 30;
        ctx.fillStyle = DATA.COLORS.bg;
        ctx.fillRect(barX, barY, barW, 3);
        ctx.fillStyle = DATA.COLORS.rail;
        ctx.fillRect(barX, barY, barW * (completedInChapter / 10), 3);
      } else {
        RENDER.text(ctx, '◊  BLOQUEADO', x + cardW / 2, y + cardH - 40,
          { size: 12, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle', letterSpacing: 3 });
      }

      if (hovered && ch.unlocked && INPUT.wasClicked()) {
        const cp = INPUT.clickPos();
        if (MATH_UTILS.pointInRect(cp.x, cp.y, x, y, cardW, cardH)) {
          chapterClicked = ch.id;
        }
      }
    });

    if (backClicked) return 'menu';
    if (chapterClicked) return { action: 'chapter', id: chapterClicked };
    return null;
  }

  handleAction(action, game) {
    if (action === 'menu') game.changeScene('menu');
    else if (action === 'skills') game.changeScene('skillTree');
    else if (action && action.action === 'chapter') {
      game.selectedChapter = action.id;
      game.changeScene('mapSelect');
    }
  }
};
