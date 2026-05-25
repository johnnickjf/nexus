window.HudSystem = class HudSystem {
  constructor() {
    this.selectedTowerType = null;
    this.selectedPlacedTower = null;
    this.hoveredButtonId = null;
    this.lastClickAction = null;
    this.showingStats = false;
    this.time = 0;
  }

  setSelectedTowerType(type) {
    this.selectedTowerType = type;
    this.selectedPlacedTower = null;
  }

  selectPlacedTower(tower) {
    this.selectedPlacedTower = tower;
    this.selectedTowerType = null;
    this.showingStats = false;
    if (tower) tower.selected = true;
  }

  deselectAll(towerSystem) {
    if (this.selectedPlacedTower) this.selectedPlacedTower.selected = false;
    this.selectedPlacedTower = null;
    this.selectedTowerType = null;
    this.showingStats = false;
    towerSystem?.towers.forEach(t => t.selected = false);
  }

  render(ctx, state) {
    this.time += 1/60;
    this.renderTopBar(ctx, state);
    this.renderBottomPanel(ctx, state);
    if (this.selectedPlacedTower) {
      this.renderTowerPanel(ctx, this.selectedPlacedTower, state);
    }
    this.renderRangePreview(ctx, state);
  }

  renderTopBar(ctx, state) {
    const w = DATA.VIRTUAL_WIDTH;
    // gradient bg
    const g = ctx.createLinearGradient(0, 0, 0, 56);
    g.addColorStop(0, DATA.COLORS.bgSecondary);
    g.addColorStop(0.75, DATA.COLORS.bgSecondary);
    g.addColorStop(1, 'rgba(11, 11, 30, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, 60);
    // glowing separator
    ctx.save();
    ctx.fillStyle = DATA.COLORS.rail;
    ctx.globalAlpha = 0.35;
    ctx.shadowColor = DATA.COLORS.rail;
    ctx.shadowBlur = 6;
    ctx.fillRect(0, 56, w, 1);
    ctx.restore();

    RENDER.text(ctx, 'NEXUS LAND.', 24, 28, {
      size: 18, color: DATA.COLORS.rail, weight: 700, baseline: 'middle',
      font: 'Orbitron', letterSpacing: 2
    });

    ctx.fillStyle = DATA.COLORS.borderStrong;
    ctx.fillRect(178, 16, 1, 24);

    RENDER.text(ctx, state.mapName, 196, 22, { size: 11, color: DATA.COLORS.textMuted, baseline: 'middle' });
    RENDER.text(ctx, `WAVE ${String(state.wave).padStart(2,'0')}/${state.totalWaves === Infinity ? '∞' : String(state.totalWaves).padStart(2,'0')}`,
      196, 38, { size: 13, color: DATA.COLORS.textPrimary, baseline: 'middle', weight: 500 });

    const dotsStart = 345;
    const dotMax = Math.min(state.totalWaves, 15);
    for (let i = 0; i < dotMax; i++) {
      const active = i < state.wave;
      const current = i === state.wave - 1 && state.waveState !== 'betweenWaves';
      const baseR = active ? 3.5 : 3;
      const r = current ? baseR + 1.2 * (0.5 + 0.5 * Math.sin(this.time * 5)) : baseR;
      ctx.save();
      if (current) {
        ctx.shadowColor = DATA.COLORS.gold;
        ctx.shadowBlur = 10;
      } else if (active) {
        ctx.shadowColor = DATA.COLORS.rail;
        ctx.shadowBlur = 5;
      }
      ctx.beginPath();
      ctx.arc(dotsStart + i * 14, 28, r, 0, Math.PI * 2);
      ctx.fillStyle = current ? DATA.COLORS.gold : (active ? DATA.COLORS.rail : DATA.COLORS.borderStrong);
      ctx.fill();
      ctx.restore();
    }

    const coreX = 560;
    ctx.save();
    ctx.shadowColor = DATA.COLORS.rail;
    ctx.shadowBlur = 8;
    RENDER.diamond(ctx, coreX, 28, 7);
    ctx.fillStyle = DATA.COLORS.rail;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.restore();
    RENDER.text(ctx, 'CORE', coreX + 14, 28, { size: 10, color: DATA.COLORS.textSecondary, baseline: 'middle', letterSpacing: 1 });

    const barX = coreX + 50;
    const ratio = state.coreHp / state.coreMaxHp;
    const hpColor = ratio > 0.5 ? DATA.COLORS.rail : (ratio > 0.25 ? DATA.COLORS.sniper : DATA.COLORS.danger);
    RENDER.hpBar(ctx, barX, 21, 110, 12, ratio, hpColor, { glow: true, pulseTime: this.time });
    RENDER.text(ctx, `${state.coreHp}/${state.coreMaxHp}`, barX + 120, 28,
      { size: 12, color: DATA.COLORS.textPrimary, baseline: 'middle', weight: 600 });

    const coinX = 850;
    RENDER.coinIcon(ctx, coinX, 28, 14);
    RENDER.text(ctx, String(state.coins), coinX + 14, 28,
      { size: 16, color: DATA.COLORS.gold, baseline: 'middle', weight: 700 });

    const starX = coinX + 100;
    RENDER.starIcon(ctx, starX, 28, 14);
    RENDER.text(ctx, String(state.stars), starX + 14, 28,
      { size: 14, color: DATA.COLORS.textPrimary, baseline: 'middle', weight: 500 });

    const speedX = 1060;
    this.lastClickAction = null;
    const speedBgActive = '#1f3a36';
    if (RENDER.button(ctx, speedX, 14, 36, 28, '1×', {
      bg: state.speed === 1 ? speedBgActive : DATA.COLORS.bgPanel,
      color: state.speed === 1 ? DATA.COLORS.rail : DATA.COLORS.textSecondary,
      size: 12
    })) this.lastClickAction = { type: 'speed', value: 1 };
    if (RENDER.button(ctx, speedX + 42, 14, 36, 28, '2×', {
      bg: state.speed === 2 ? speedBgActive : DATA.COLORS.bgPanel,
      color: state.speed === 2 ? DATA.COLORS.rail : DATA.COLORS.textSecondary,
      size: 12
    })) this.lastClickAction = { type: 'speed', value: 2 };
    if (RENDER.button(ctx, speedX + 84, 14, 36, 28, state.paused ? '▶' : '⏸', {
      bg: state.paused ? '#3a3015' : DATA.COLORS.bgPanel,
      color: state.paused ? DATA.COLORS.gold : DATA.COLORS.textSecondary,
      size: 12
    })) this.lastClickAction = { type: 'togglePause' };

    if (RENDER.button(ctx, 1206, 14, 60, 28, '× MENU', {
      color: DATA.COLORS.textSecondary, size: 11
    })) this.lastClickAction = { type: 'exit' };

    if (state.waveState === 'betweenWaves') {
      const breakLeft = Math.ceil(state.waveBreakLeft);
      const isFirstWave = state.wave === 0;
      const pulse = 0.6 + 0.4 * Math.sin(this.time * 4);
      const nextWaveBoxW = 420;
      const nextWaveBoxH = 52;
      const nx = (w - nextWaveBoxW) / 2;
      const ny = 70;
      RENDER.panel(ctx, nx, ny, nextWaveBoxW, nextWaveBoxH, {
        border: DATA.COLORS.gold, fill: '#1a1428', glowBorder: DATA.COLORS.gold, radius: 8
      });
      ctx.save();
      ctx.globalAlpha = pulse;
      const label = isFirstWave
        ? `⚠  POSICIONE SUAS TORRES  ·  ${breakLeft}s`
        : `⚠  WAVE ${state.wave + 1} EM ${breakLeft}s`;
      RENDER.text(ctx, label, nx + nextWaveBoxW / 2, ny + nextWaveBoxH / 2, {
        size: 15, color: DATA.COLORS.gold, align: 'center', baseline: 'middle',
        weight: 700, letterSpacing: 2, glow: DATA.COLORS.gold, glowStrength: 0.7
      });
      ctx.restore();

      const skipX = nx + nextWaveBoxW + 8;
      if (RENDER.button(ctx, skipX, ny + 6, 100, 40, '▶ INICIAR', {
        color: DATA.COLORS.rail, size: 12
      })) this.lastClickAction = { type: 'skipBreak' };
    }
  }

  renderBottomPanel(ctx, state) {
    const y = DATA.VIRTUAL_HEIGHT - 100;
    const w = DATA.VIRTUAL_WIDTH;
    // gradient panel bg
    const g = ctx.createLinearGradient(0, y, 0, y + 100);
    g.addColorStop(0, 'rgba(11,11,30,0)');
    g.addColorStop(0.25, DATA.COLORS.bgSecondary);
    g.addColorStop(1, DATA.COLORS.bgSecondary);
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 14, w, 114);
    ctx.save();
    ctx.fillStyle = DATA.COLORS.rail;
    ctx.globalAlpha = 0.35;
    ctx.shadowColor = DATA.COLORS.rail;
    ctx.shadowBlur = 6;
    ctx.fillRect(0, y, w, 1);
    ctx.restore();

    const towerTypes = ['rail', 'ice', 'sniper', 'nova'];
    const cardW = 200;
    const startX = (w - (cardW * 4 + 24)) / 2;

    towerTypes.forEach((type, i) => {
      const def = DATA.TOWERS[type];
      const cx = startX + i * (cardW + 8);
      const cy = y + 14;
      const ch = 72;
      const selected = this.selectedTowerType === type;
      const affordable = state.coins >= def.cost;
      const mouse = INPUT.getMouse();
      const hovered = MATH_UTILS.pointInRect(mouse.x, mouse.y, cx, cy, cardW, ch);

      // panel
      ctx.save();
      RENDER.roundedRect(ctx, cx, cy, cardW, ch, 7);
      const fg = ctx.createLinearGradient(0, cy, 0, cy + ch);
      if (selected) {
        fg.addColorStop(0, RENDER._lighten('#10221f', 0.10));
        fg.addColorStop(1, '#10221f');
      } else if (hovered) {
        fg.addColorStop(0, RENDER._lighten('#13133a', 0.12));
        fg.addColorStop(1, '#13133a');
      } else {
        fg.addColorStop(0, RENDER._lighten(DATA.COLORS.bgPanel, 0.08));
        fg.addColorStop(1, DATA.COLORS.bgPanel);
      }
      ctx.fillStyle = fg;
      ctx.fill();
      if (selected) {
        ctx.shadowColor = def.color;
        ctx.shadowBlur = 16;
      }
      ctx.strokeStyle = selected ? def.color : (hovered ? DATA.COLORS.borderHover : DATA.COLORS.borderStrong);
      ctx.lineWidth = selected ? 1.5 : 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
      // top inner highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 1.5);
      ctx.lineTo(cx + cardW - 8, cy + 1.5);
      ctx.stroke();
      ctx.restore();

      // colored top border for selected
      if (selected) {
        ctx.save();
        ctx.fillStyle = def.color;
        ctx.shadowColor = def.color;
        ctx.shadowBlur = 10;
        RENDER.roundedRect(ctx, cx + 4, cy, cardW - 8, 3, 1.5);
        ctx.fill();
        ctx.restore();
      }

      RENDER.towerShape(ctx, type, cx + 28, cy + 36, 12, def.color, { time: this.time });

      RENDER.text(ctx, def.name, cx + 56, cy + 22, {
        size: 15, color: def.color, weight: 700, baseline: 'middle',
        glow: selected ? def.color : null, glowStrength: 0.5
      });
      RENDER.text(ctx, def.tagline, cx + 56, cy + 44, {
        size: 11, color: DATA.COLORS.textSecondary, baseline: 'middle'
      });

      ctx.save();
      RENDER.coinIcon(ctx, cx + cardW - 50, cy + 32, 11);
      RENDER.text(ctx, String(def.cost), cx + cardW - 38, cy + 32, {
        size: 14, color: affordable ? DATA.COLORS.gold : DATA.COLORS.danger,
        baseline: 'middle', weight: 700
      });
      ctx.restore();

      if (hovered && INPUT.wasClicked()) {
        const cp = INPUT.clickPos();
        if (MATH_UTILS.pointInRect(cp.x, cp.y, cx, cy, cardW, ch)) {
          this.lastClickAction = { type: 'selectTowerType', value: type };
          INPUT.consumeClick();
        }
      }
    });
  }

  renderTowerPanel(ctx, tower, state) {
    const panelW = 260;
    const panelH = 290;
    const px = DATA.VIRTUAL_WIDTH - panelW - 16;
    const py = 76;

    RENDER.panel(ctx, px, py, panelW, panelH, {
      fill: '#0e0e22',
      border: tower.color,
      glowBorder: tower.color,
      radius: 10
    });

    RENDER.text(ctx, DATA.TOWERS[tower.type].name, px + 16, py + 22, {
      size: 17, color: tower.color, weight: 700, baseline: 'middle',
      letterSpacing: 2, glow: tower.color, glowStrength: 0.5
    });

    // Tab: UPS | ?
    const tabW = 46, tabH = 20;
    if (RENDER.button(ctx, px + panelW - 100, py + 8, tabW, tabH, 'UPS', {
      color: !this.showingStats ? tower.color : DATA.COLORS.textMuted,
      bg: !this.showingStats ? '#0d2020' : DATA.COLORS.bgPanel,
      size: 10
    })) this.showingStats = false;
    if (RENDER.button(ctx, px + panelW - 50, py + 8, tabW, tabH, '?', {
      color: this.showingStats ? DATA.COLORS.gold : DATA.COLORS.textMuted,
      bg: this.showingStats ? '#201a06' : DATA.COLORS.bgPanel,
      size: 12
    })) this.showingStats = true;

    RENDER.text(ctx, `dmg ${Math.round(tower.damage)}`, px + 16, py + 48,
      { size: 11, color: DATA.COLORS.textSecondary, baseline: 'middle' });
    RENDER.text(ctx, `rng ${tower.range === Infinity ? '∞' : Math.round(tower.range)}`, px + 76, py + 48,
      { size: 11, color: DATA.COLORS.textSecondary, baseline: 'middle' });
    RENDER.text(ctx, `cd ${tower.cooldown.toFixed(2)}s`, px + 132, py + 48,
      { size: 11, color: DATA.COLORS.textSecondary, baseline: 'middle' });
    if (tower.aoeRadius > 0) {
      RENDER.text(ctx, `aoe ${Math.round(tower.aoeRadius)}`, px + 200, py + 48,
        { size: 11, color: tower.color, baseline: 'middle', weight: 600 });
    }

    ctx.fillStyle = DATA.COLORS.border;
    ctx.fillRect(px + 16, py + 62, panelW - 32, 1);

    if (this.showingStats) {
      this.renderTowerStats(ctx, tower, px, py, panelW);
    } else {
      const paths = ['A', 'B', 'C'];
      paths.forEach((p, i) => {
        const ay = py + 76 + i * 56;
        const ab = tower.abilities[p];
        const cfg = DATA.RUN_UPGRADES[tower.type][p];
        const isMax = ab.level >= 3;
        const nextCost = isMax ? null : cfg.levels[ab.level].cost;
        const nextDesc = isMax ? '— MAX —' : cfg.levels[ab.level].desc;
        const canBuy = !isMax && state.coins >= nextCost;

        RENDER.text(ctx, cfg.label, px + 16, ay + 12,
          { size: 12, color: tower.color, weight: 700, baseline: 'middle' });

        for (let lv = 0; lv < 3; lv++) {
          const filled = lv < ab.level;
          ctx.save();
          if (filled) {
            ctx.shadowColor = tower.color;
            ctx.shadowBlur = 6;
          }
          ctx.fillStyle = filled ? tower.color : DATA.COLORS.bg;
          ctx.strokeStyle = filled ? tower.color : DATA.COLORS.borderStrong;
          ctx.lineWidth = 1;
          RENDER.roundedRect(ctx, px + 130 + lv * 14, ay + 6, 10, 12, 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        RENDER.text(ctx, nextDesc, px + 16, ay + 30,
          { size: 10, color: DATA.COLORS.textMuted, baseline: 'middle' });

        if (!isMax) {
          const btnX = px + panelW - 80;
          const btnY = ay + 2;
          if (RENDER.button(ctx, btnX, btnY, 64, 30, `◈ ${nextCost}`, {
            color: canBuy ? tower.color : DATA.COLORS.textMuted,
            size: 11,
            disabled: !canBuy
          })) {
            this.lastClickAction = { type: 'upgradeAbility', path: p };
          }
        } else {
          const btnX = px + panelW - 80;
          const btnY = ay + 2;
          ctx.save();
          ctx.shadowColor = tower.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = DATA.COLORS.bg;
          ctx.strokeStyle = tower.color;
          ctx.lineWidth = 1;
          RENDER.roundedRect(ctx, btnX, btnY, 64, 30, 4);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          RENDER.text(ctx, 'MAX', btnX + 32, btnY + 15,
            { size: 11, color: tower.color, align: 'center', baseline: 'middle', weight: 700 });
        }
      });
    }

    const sellY = py + panelH - 40;
    const refund = Math.floor(tower.totalSpent * DATA.ECONOMY.sellRefundPercent);
    if (RENDER.button(ctx, px + 16, sellY, panelW - 32, 28, `✕ VENDER (+◈ ${refund})`, {
      color: DATA.COLORS.danger, size: 11
    })) {
      this.lastClickAction = { type: 'sellTower' };
    }
  }

  renderTowerStats(ctx, tower, px, py, panelW) {
    const pierce = Math.floor(tower.pierceBase) + (tower.runPierce || 0);
    const shots  = 1 + (tower.multiShot || 0);

    // DPS estimate (single target, sustained)
    let dps;
    if (tower.type === 'rail') {
      dps = tower.damage * (1 + tower.critChance) / tower.cooldown;
    } else if (tower.type === 'sniper') {
      dps = tower.damage * (1 + tower.critChance) * shots / tower.cooldown;
    } else if (tower.type === 'nova') {
      dps = tower.damage / tower.cooldown + (tower.burnEffect?.dps ?? 0);
    } else {
      dps = tower.damage / tower.cooldown;
    }

    const dpsLabel = tower.type === 'rail' && pierce > 0 ? 'DPS total' : 'DPS est.';
    const dpsDisplay = tower.type === 'rail' ? dps * (pierce + 1) : dps;

    const rows = [];
    rows.push(['DANO',     Math.round(tower.damage),         false]);
    rows.push(['COOLDOWN', tower.cooldown.toFixed(2)+'s',    false]);
    rows.push([dpsLabel,   dpsDisplay.toFixed(1),            true]);
    rows.push(['ALCANCE',  tower.range === Infinity ? '∞' : Math.round(tower.range), false]);

    if (tower.critChance > 0)
      rows.push(['CRÍTICO', Math.round(tower.critChance * 100) + '%', false]);

    if (tower.type === 'rail') {
      rows.push(['PIERCE', pierce + (pierce === 1 ? ' alvo' : ' alvos'), false]);
    }

    if (tower.type === 'ice' && tower.slowEffect) {
      rows.push(['SLOW',    Math.round(tower.slowEffect.percent * 100) + '%', false]);
      rows.push(['S-DUR',   tower.slowEffect.duration.toFixed(1) + 's',       false]);
      if (tower.aoeRadius > 0)
        rows.push(['RAIO AoE', Math.round(tower.aoeRadius), false]);
    }

    if (tower.type === 'sniper') {
      if (shots > 1)
        rows.push(['TIROS/CD', shots, false]);
      if (tower.headshotChance > 0)
        rows.push(['HEADSHOT', Math.round(tower.headshotChance * 100) + '%', false]);
      rows.push(['ESCUDO', tower.ignoresShield
        ? 'ignora tudo'
        : tower.shieldBreakBonus > 0 ? '+' + Math.round(tower.shieldBreakBonus) : '—', false]);
    }

    if (tower.type === 'nova' && tower.burnEffect) {
      rows.push(['BURN DPS',  tower.burnEffect.dps.toFixed(1) + '/s', false]);
      rows.push(['B-DURAÇÃO', tower.burnEffect.duration.toFixed(1) + 's', false]);
      rows.push(['RAIO AoE',  Math.round(tower.aoeRadius), false]);
      if ((tower.chainCount || 0) > 0)
        rows.push(['CHAIN', '×' + tower.chainCount, false]);
    }

    const startY = py + 78;
    const rowH   = 20;
    const col1X  = px + 16;
    const col2X  = px + 148;

    rows.forEach(([label, value, hi], i) => {
      const x = i % 2 === 0 ? col1X : col2X;
      const y = startY + Math.floor(i / 2) * rowH;
      RENDER.text(ctx, label, x, y, {
        size: 9, color: DATA.COLORS.textMuted, baseline: 'middle'
      });
      RENDER.text(ctx, String(value), x, y + 11, {
        size: 12, color: hi ? DATA.COLORS.gold : DATA.COLORS.textPrimary,
        baseline: 'middle', weight: 600
      });
    });

    // Investido
    const invY = startY + Math.ceil(rows.length / 2) * rowH + 6;
    if (invY + 18 < py + 246) {
      ctx.fillStyle = DATA.COLORS.border;
      ctx.fillRect(px + 16, invY, panelW - 32, 1);
      RENDER.text(ctx, 'INVESTIDO', px + 16, invY + 12, {
        size: 9, color: DATA.COLORS.textMuted, baseline: 'middle'
      });
      RENDER.text(ctx, '◈ ' + tower.totalSpent, px + 82, invY + 12, {
        size: 12, color: DATA.COLORS.gold, baseline: 'middle', weight: 600
      });
    }
  }

  renderRangePreview(ctx, state) {
    if (!this.selectedTowerType) return;
    const mouse = INPUT.getMouse();
    if (mouse.y < 60 || mouse.y > DATA.VIRTUAL_HEIGHT - 100) return;

    const def = DATA.TOWERS[this.selectedTowerType];

    let nearSlot = null;
    for (const slot of state.mapData.slots) {
      if (state.slotOccupied[slot.x + ',' + slot.y]) continue;
      const d = MATH_UTILS.dist(mouse.x, mouse.y, slot.x, slot.y);
      if (d < 30) {
        if (!nearSlot || d < nearSlot.dist) nearSlot = { slot, dist: d };
      }
    }

    if (nearSlot) {
      const { slot } = nearSlot;
      ctx.save();
      ctx.strokeStyle = def.color;
      ctx.lineWidth = 1;
      ctx.fillStyle = def.color;
      ctx.globalAlpha = 0.11;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, def.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.shadowColor = def.color;
      ctx.shadowBlur = 8;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, def.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      RENDER.towerShape(ctx, this.selectedTowerType, slot.x, slot.y, 13, def.color, { alpha: 0.85, time: this.time });
    } else {
      ctx.save();
      RENDER.towerShape(ctx, this.selectedTowerType, mouse.x, mouse.y, 11, def.color, { alpha: 0.4 });
      ctx.restore();
    }
  }

  consumeAction() {
    const a = this.lastClickAction;
    this.lastClickAction = null;
    return a;
  }
};
