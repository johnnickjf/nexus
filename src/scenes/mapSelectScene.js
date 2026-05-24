window.MapSelectScene = class MapSelectScene {
  constructor() {
    this.time = 0;
    this.selectedMap = null;
  }
  enter() { this.time = 0; this.selectedMap = null; }
  update(dt) { this.time += dt; }

  render(ctx) {
    RENDER.gridBackground(ctx, this.time);

    let backClicked = false;
    if (RENDER.button(ctx, 24, 24, 100, 36, '← VOLTAR', {
      color: DATA.COLORS.textSecondary, size: 12
    })) backClicked = true;

    RENDER.text(ctx, 'CAPÍTULO 01', DATA.VIRTUAL_WIDTH / 2, 80, {
      size: 22, color: DATA.COLORS.textPrimary, weight: 700,
      align: 'center', baseline: 'middle', font: 'Orbitron', letterSpacing: 8
    });
    RENDER.text(ctx, 'selecione um setor', DATA.VIRTUAL_WIDTH / 2, 108, {
      size: 11, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle', letterSpacing: 4
    });

    const save = SAVE.get();
    RENDER.starIcon(ctx, DATA.VIRTUAL_WIDTH - 130, 42, 14);
    RENDER.text(ctx, String(save.stars), DATA.VIRTUAL_WIDTH - 112, 42,
      { size: 14, color: DATA.COLORS.gold, baseline: 'middle', weight: 700 });

    if (RENDER.button(ctx, DATA.VIRTUAL_WIDTH - 80, 24, 60, 36, '✦', {
      color: DATA.COLORS.sniper, size: 16
    })) return 'skills';

    const dotsY = 320;
    const totalW = 1000;
    const startX = (DATA.VIRTUAL_WIDTH - totalW) / 2;
    const gap = totalW / 9;

    ctx.save();
    ctx.strokeStyle = DATA.COLORS.borderStrong;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(startX, dotsY);
    ctx.lineTo(startX + totalW, dotsY);
    ctx.stroke();
    ctx.restore();

    let mapClicked = null;

    for (let i = 1; i <= 10; i++) {
      const cx = startX + (i - 1) * gap;
      const cy = dotsY;
      const unlocked = SAVE.isMapUnlocked(i);
      const completed = SAVE.isMapCompleted(i);
      const isNext = unlocked && !completed && (i === 1 || SAVE.isMapCompleted(i - 1));

      const mouse = INPUT.getMouse();
      const hovered = MATH_UTILS.pointInCircle(mouse.x, mouse.y, cx, cy, 22);

      if (completed) {
        ctx.save();
        ctx.fillStyle = DATA.COLORS.rail;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = DATA.COLORS.rail;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (isNext) {
        ctx.save();
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 3);
        ctx.fillStyle = DATA.COLORS.gold;
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = DATA.COLORS.gold;
        ctx.globalAlpha = 0.3 + 0.3 * pulse;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 18 + pulse * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (unlocked) {
        ctx.fillStyle = DATA.COLORS.borderStrong;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = DATA.COLORS.bg;
        ctx.strokeStyle = DATA.COLORS.textMuted;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (hovered && unlocked) {
        ctx.save();
        ctx.strokeStyle = DATA.COLORS.rail;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      RENDER.text(ctx, String(i).padStart(2, '0'), cx, cy + 38,
        { size: 11, color: unlocked ? DATA.COLORS.textSecondary : DATA.COLORS.textMuted,
          align: 'center', baseline: 'middle', weight: 500 });

      if (hovered && unlocked && INPUT.wasClicked()) {
        mapClicked = i;
      }
    }

    if (mapClicked) this.selectedMap = mapClicked;

    if (this.selectedMap) {
      const popupResult = this.renderModePopup(ctx);
      if (popupResult) return popupResult;
    }

    if (backClicked) return 'chapters';
    return null;
  }

  renderModePopup(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 5, 16, 0.85)';
    ctx.fillRect(0, 0, DATA.VIRTUAL_WIDTH, DATA.VIRTUAL_HEIGHT);
    ctx.restore();

    const mapData = MAPS.get(this.selectedMap);
    const w = 460, h = 320;
    const x = (DATA.VIRTUAL_WIDTH - w) / 2;
    const y = (DATA.VIRTUAL_HEIGHT - h) / 2;

    RENDER.panel(ctx, x, y, w, h, { border: DATA.COLORS.rail, fill: '#0a0a18', radius: 12 });

    RENDER.text(ctx, `SETOR ${String(this.selectedMap).padStart(2, '0')}`, x + w / 2, y + 50, {
      size: 22, color: DATA.COLORS.rail, weight: 700,
      align: 'center', baseline: 'middle', font: 'Orbitron', letterSpacing: 6
    });
    RENDER.text(ctx, mapData.tagline, x + w / 2, y + 80, {
      size: 12, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle', letterSpacing: 2
    });

    RENDER.text(ctx, `${mapData.slots.length} slots de torre  ·  ${mapData.totalWaves} waves`,
      x + w / 2, y + 108, {
      size: 11, color: DATA.COLORS.textSecondary, align: 'center', baseline: 'middle'
    });

    let result = null;

    const btnW = 180, btnH = 56;
    const btnY = y + 150;

    if (RENDER.button(ctx, x + 30, btnY, btnW, btnH, '▸ MODO NORMAL', {
      color: DATA.COLORS.rail, size: 13
    })) {
      result = { action: 'startMap', id: this.selectedMap, mode: 'normal' };
    }

    const infiniteUnlocked = SAVE.get().infiniteUnlocked;
    if (RENDER.button(ctx, x + w - 30 - btnW, btnY, btnW, btnH,
        infiniteUnlocked ? '∞ INFINITO' : '◊ INFINITO', {
      color: infiniteUnlocked ? DATA.COLORS.gold : DATA.COLORS.textMuted,
      size: 13,
      disabled: !infiniteUnlocked
    })) {
      result = { action: 'startMap', id: this.selectedMap, mode: 'infinite' };
    }

    RENDER.text(ctx, infiniteUnlocked ? 'modo sem fim · sobreviva o máximo'
                                       : 'libere zerando todos os setores',
      x + w / 2, btnY + btnH + 24,
      { size: 10, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle' });

    if (RENDER.button(ctx, x + (w - 120) / 2, y + h - 50, 120, 30, '× cancelar', {
      color: DATA.COLORS.textMuted, size: 11
    })) {
      this.selectedMap = null;
    }

    return result;
  }

  handleAction(action, game) {
    if (action === 'chapters') game.changeScene('chapterSelect');
    else if (action === 'skills') game.changeScene('skillTree');
    else if (action && action.action === 'startMap') {
      game.startMap(action.id, action.mode);
    }
  }
};
