window.SettingsScene = class SettingsScene {
  constructor() {
    this.time = 0;
    this.dragging = null;
  }
  enter() { this.time = 0; }
  update(dt) { this.time += dt; }

  render(ctx) {
    RENDER.gridBackground(ctx, this.time);

    let backClicked = false;
    if (RENDER.button(ctx, 24, 24, 100, 36, '← VOLTAR', {
      color: DATA.COLORS.textSecondary, size: 12
    })) backClicked = true;

    RENDER.text(ctx, 'CONFIGURAÇÕES', DATA.VIRTUAL_WIDTH / 2, 80, {
      size: 22, color: DATA.COLORS.textPrimary, weight: 700,
      align: 'center', baseline: 'middle', font: 'Orbitron', letterSpacing: 8
    });

    const settings = SAVE.get().settings;
    const cx = DATA.VIRTUAL_WIDTH / 2;
    const panelW = 480;
    const panelX = cx - panelW / 2;
    let py = 180;

    RENDER.panel(ctx, panelX, py, panelW, 380, { fill: '#0a0a18', border: DATA.COLORS.borderStrong });

    py += 30;
    this.renderSlider(ctx, panelX + 30, py, panelW - 60, 'Volume principal',
      settings.masterVolume, 'masterVolume');

    py += 70;
    this.renderSlider(ctx, panelX + 30, py, panelW - 60, 'Volume de efeitos',
      settings.sfxVolume, 'sfxVolume');

    py += 70;
    this.renderToggle(ctx, panelX + 30, py, panelW - 60, 'Mostrar FPS',
      settings.showFps, 'showFps');

    py += 50;
    ctx.fillStyle = DATA.COLORS.border;
    ctx.fillRect(panelX + 30, py, panelW - 60, 1);

    py += 30;
    RENDER.text(ctx, 'PROGRESSO', panelX + 30, py,
      { size: 11, color: DATA.COLORS.textMuted, baseline: 'middle', letterSpacing: 4 });

    py += 30;
    const save = SAVE.get();
    RENDER.text(ctx, `mapas concluídos: ${save.completedMaps.length}/10`,
      panelX + 30, py, { size: 12, color: DATA.COLORS.textSecondary, baseline: 'middle' });
    RENDER.text(ctx, `estrelas: ${save.stars} ✦`,
      panelX + 30, py + 20, { size: 12, color: DATA.COLORS.textSecondary, baseline: 'middle' });

    let resetClicked = false;
    if (RENDER.button(ctx, panelX + panelW - 170, py - 4, 140, 32, '⚠ APAGAR SAVE', {
      color: DATA.COLORS.danger, size: 10
    })) resetClicked = true;

    if (resetClicked) {
      if (confirm('Apagar TODO o progresso? Esta ação é permanente.')) {
        SAVE.resetAll();
      }
    }

    if (backClicked) return 'menu';
    return null;
  }

  renderSlider(ctx, x, y, w, label, value, key) {
    RENDER.text(ctx, label, x, y, { size: 12, color: DATA.COLORS.textSecondary, baseline: 'middle' });
    RENDER.text(ctx, `${Math.round(value * 100)}%`, x + w, y,
      { size: 12, color: DATA.COLORS.rail, align: 'right', baseline: 'middle', weight: 700 });

    const trackY = y + 22;
    const trackH = 4;
    ctx.fillStyle = DATA.COLORS.bg;
    ctx.fillRect(x, trackY, w, trackH);
    ctx.fillStyle = DATA.COLORS.rail;
    ctx.fillRect(x, trackY, w * value, trackH);

    const handleX = x + w * value;
    ctx.fillStyle = DATA.COLORS.rail;
    ctx.beginPath();
    ctx.arc(handleX, trackY + trackH / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = DATA.COLORS.bg;
    ctx.beginPath();
    ctx.arc(handleX, trackY + trackH / 2, 4, 0, Math.PI * 2);
    ctx.fill();

    const mouse = INPUT.getMouse();
    const overTrack = mouse.x >= x - 10 && mouse.x <= x + w + 10 &&
                      mouse.y >= trackY - 12 && mouse.y <= trackY + 16;

    if (overTrack && INPUT.wasClicked()) {
      const t = MATH_UTILS.clamp((mouse.x - x) / w, 0, 1);
      const update = {};
      update[key] = t;
      SAVE.updateSettings(update);
      if (window.AUDIO) AUDIO.updateVolumes();
      INPUT.consumeClick();
    }
  }

  renderToggle(ctx, x, y, w, label, value, key) {
    RENDER.text(ctx, label, x, y, { size: 12, color: DATA.COLORS.textSecondary, baseline: 'middle' });

    const toggleW = 44, toggleH = 22;
    const tx = x + w - toggleW;
    const ty = y - toggleH / 2;

    ctx.fillStyle = value ? DATA.COLORS.rail : DATA.COLORS.bgPanel;
    ctx.strokeStyle = value ? DATA.COLORS.rail : DATA.COLORS.borderStrong;
    ctx.lineWidth = 1;
    RENDER.roundedRect(ctx, tx, ty, toggleW, toggleH, toggleH / 2);
    ctx.fill();
    ctx.stroke();

    const knobX = value ? tx + toggleW - toggleH / 2 : tx + toggleH / 2;
    ctx.fillStyle = value ? DATA.COLORS.bg : DATA.COLORS.textSecondary;
    ctx.beginPath();
    ctx.arc(knobX, ty + toggleH / 2, toggleH / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    const mouse = INPUT.getMouse();
    if (MATH_UTILS.pointInRect(mouse.x, mouse.y, tx, ty, toggleW, toggleH) && INPUT.wasClicked()) {
      const update = {};
      update[key] = !value;
      SAVE.updateSettings(update);
    }
  }

  handleAction(action, game) {
    if (action === 'menu') game.changeScene('menu');
  }
};
