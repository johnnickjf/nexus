window.RENDER = (function() {

  function clear(ctx, color) {
    ctx.fillStyle = color || DATA.COLORS.bg;
    ctx.fillRect(0, 0, DATA.VIRTUAL_WIDTH, DATA.VIRTUAL_HEIGHT);
  }

  function gridBackground(ctx, time) {
    ctx.save();
    ctx.fillStyle = DATA.COLORS.bg;
    ctx.fillRect(0, 0, DATA.VIRTUAL_WIDTH, DATA.VIRTUAL_HEIGHT);

    const offset = (time * 10) % 60;

    // base grid lines (subtle)
    ctx.strokeStyle = 'rgba(45, 255, 200, 0.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = -60 + offset; y <= DATA.VIRTUAL_HEIGHT + 60; y += 60) {
      const ry = Math.round(y) + 0.5;
      ctx.moveTo(0, ry);
      ctx.lineTo(DATA.VIRTUAL_WIDTH, ry);
    }
    for (let x = 0; x <= DATA.VIRTUAL_WIDTH + 60; x += 60) {
      const rx = Math.round(x) + 0.5;
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, DATA.VIRTUAL_HEIGHT);
    }
    ctx.stroke();

    // intersection dots — sharpens the grid
    ctx.fillStyle = 'rgba(45, 255, 200, 0.16)';
    for (let y = -60 + offset; y <= DATA.VIRTUAL_HEIGHT + 60; y += 60) {
      for (let x = 0; x <= DATA.VIRTUAL_WIDTH + 60; x += 60) {
        ctx.fillRect(Math.round(x) - 0.5, Math.round(y) - 0.5, 1.5, 1.5);
      }
    }

    // radial vignette — darken edges for focus
    const cx = DATA.VIRTUAL_WIDTH / 2;
    const cy = DATA.VIRTUAL_HEIGHT / 2;
    const grad = ctx.createRadialGradient(cx, cy, 200, cx, cy, 780);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, DATA.VIRTUAL_WIDTH, DATA.VIRTUAL_HEIGHT);

    ctx.restore();
  }

  function text(ctx, str, x, y, opts = {}) {
    const {
      size = 14,
      color = DATA.COLORS.textPrimary,
      align = 'left',
      baseline = 'top',
      weight = 400,
      font = 'JetBrains Mono',
      letterSpacing = 0,
      glow = null,
      glowStrength = 1
    } = opts;
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px "${font}", "Courier New", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (letterSpacing > 0) ctx.letterSpacing = letterSpacing + 'px';

    if (glow) {
      // soft wide pass
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 22 * glowStrength;
      ctx.globalAlpha = 0.55;
      ctx.fillText(str, x, y);
      ctx.restore();
      // narrow tight pass
      ctx.save();
      ctx.shadowColor = glow;
      ctx.shadowBlur = 8 * glowStrength;
      ctx.fillText(str, x, y);
      ctx.restore();
    }
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  // Quebra um texto em múltiplas linhas que caibam em maxWidth (fonte monospace).
  // Retorna array de linhas. Com maxLines, trunca a última com reticências.
  function wrapText(ctx, str, maxWidth, opts = {}) {
    const { size = 12, font = 'JetBrains Mono', weight = 400, maxLines = Infinity } = opts;
    ctx.save();
    ctx.font = `${weight} ${size}px "${font}", "Courier New", monospace`;
    const words = String(str).split(' ');
    const lines = [];
    let cur = '';
    for (const word of words) {
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);

    if (lines.length > maxLines) {
      const kept = lines.slice(0, maxLines);
      let last = kept[maxLines - 1];
      while (last.length > 1 && ctx.measureText(last + '…').width > maxWidth) {
        last = last.slice(0, -1);
      }
      kept[maxLines - 1] = last.trimEnd() + '…';
      ctx.restore();
      return kept;
    }
    ctx.restore();
    return lines;
  }

  function panel(ctx, x, y, w, h, opts = {}) {
    const {
      fill = DATA.COLORS.bgPanel,
      border = DATA.COLORS.border,
      radius = 6,
      borderWidth = 1,
      glowBorder = null,
      gradient = true
    } = opts;
    ctx.save();
    roundedRect(ctx, x, y, w, h, radius);

    if (gradient) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      // top 10% lighter — blend toward white
      g.addColorStop(0, _lighten(fill, 0.10));
      g.addColorStop(0.18, fill);
      g.addColorStop(1, fill);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = fill;
    }
    ctx.fill();

    if (glowBorder) {
      ctx.shadowColor = glowBorder;
      ctx.shadowBlur = 12;
    }
    ctx.strokeStyle = border;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // top inner highlight for depth
    const r = Math.min(radius, w / 2, h / 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + r + 1, y + 1.5);
    ctx.lineTo(x + w - r - 1, y + 1.5);
    ctx.stroke();
    ctx.restore();
  }

  // Lighten a #rrggbb hex by mixing with white
  function _lighten(hex, t) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
    const lr = Math.round(r + (255 - r) * t);
    const lg = Math.round(g + (255 - g) * t);
    const lb = Math.round(b + (255 - b) * t);
    return '#' + ((1 << 24) | (lr << 16) | (lg << 8) | lb).toString(16).slice(1);
  }

  function roundedRect(ctx, x, y, w, h, r) {
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function button(ctx, x, y, w, h, label, opts = {}) {
    const mouse = INPUT.getMouse();
    const hovered = MATH_UTILS.pointInRect(mouse.x, mouse.y, x, y, w, h);

    const {
      color = DATA.COLORS.rail,
      bg = DATA.COLORS.bgPanel,
      bgHover = null,
      size = 14,
      disabled = false,
      align = 'center'
    } = opts;

    const baseBg = disabled ? DATA.COLORS.bg : bg;
    const hoverBg = bgHover || _lighten(bg, 0.08);

    ctx.save();
    roundedRect(ctx, x, y, w, h, 5);

    // gradient fill
    const fillG = ctx.createLinearGradient(0, y, 0, y + h);
    if (hovered && !disabled) {
      fillG.addColorStop(0, _lighten(hoverBg, 0.10));
      fillG.addColorStop(1, hoverBg);
    } else {
      fillG.addColorStop(0, _lighten(baseBg, 0.06));
      fillG.addColorStop(1, baseBg);
    }
    ctx.fillStyle = fillG;
    ctx.fill();

    if (hovered && !disabled) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
    }
    ctx.strokeStyle = disabled ? DATA.COLORS.textDim : (hovered ? color : DATA.COLORS.borderStrong);
    ctx.lineWidth = hovered && !disabled ? 1.5 : 1;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // top inner highlight
    if (!disabled) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const rr = Math.min(5, w / 2, h / 2);
      ctx.moveTo(x + rr + 1, y + 1.5);
      ctx.lineTo(x + w - rr - 1, y + 1.5);
      ctx.stroke();
    }
    ctx.restore();

    // hover accent bar — 4px wide, full rounded
    if (hovered && !disabled) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      roundedRect(ctx, x + 2, y + 4, 4, h - 8, 2);
      ctx.fill();
      ctx.restore();
    }

    let tx;
    if (align === 'center') tx = x + w / 2;
    else if (align === 'left') tx = x + 16;
    else tx = x + w - 16;

    text(ctx, label, tx, y + h / 2, {
      size,
      color: disabled ? DATA.COLORS.textMuted : (hovered ? color : DATA.COLORS.textPrimary),
      align,
      baseline: 'middle',
      weight: 500,
      glow: hovered && !disabled ? color : null,
      glowStrength: 0.5
    });

    const clicked = hovered && !disabled && INPUT.wasClicked() &&
           MATH_UTILS.pointInRect(INPUT.clickPos()?.x, INPUT.clickPos()?.y, x, y, w, h);
    if (clicked) {
      INPUT.consumeClick();
      if (window.AUDIO) AUDIO.sfx.click();
    }
    return clicked;
  }

  function hexagon(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 3 * i - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function triangle(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function hpBar(ctx, x, y, w, h, ratio, color, opts = {}) {
    const { glow = false, danger = true, pulseTime = 0 } = opts;
    const r = Math.min(h / 2, 4);
    const clamped = MATH_UTILS.clamp(ratio, 0, 1);
    const lowHp = danger && clamped < 0.25;

    ctx.save();
    // track
    roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fill();

    // fill
    if (clamped > 0) {
      ctx.save();
      roundedRect(ctx, x, y, w, h, r);
      ctx.clip();
      let fillColor = color;
      if (lowHp) {
        const pulse = 0.5 + 0.5 * Math.sin(pulseTime * 9);
        ctx.globalAlpha = 0.7 + 0.3 * pulse;
      }
      if (glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w * clamped, h);

      // inner shine line on top half
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x, y + 0.5, w * clamped, Math.max(1, h * 0.28));
      ctx.restore();
    }

    // border
    roundedRect(ctx, x, y, w, h, r);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function glowCircle(ctx, x, y, r, color, intensity = 1) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, _withAlpha(color, 0.55 * intensity));
    g.addColorStop(0.4, _withAlpha(color, 0.25 * intensity));
    g.addColorStop(1, _withAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function _withAlpha(hex, a) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
    return `rgba(${r},${g},${b},${a})`;
  }

  function coinIcon(ctx, x, y, size = 14, color = DATA.COLORS.gold) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    hexagon(ctx, x, y, size / 2);
    ctx.fill();
    ctx.restore();
  }

  function starIcon(ctx, x, y, size = 14, color = DATA.COLORS.gold) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.beginPath();
    const r1 = size / 2;
    const r2 = size / 4;
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 === 0 ? r1 : r2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function diamond(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
  }

  function dashedLine(ctx, x1, y1, x2, y2, dash = [4, 4]) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function towerShape(ctx, type, cx, cy, size, color, opts = {}) {
    const { selected = false, alpha = 1, time = 0 } = opts;

    // selected: outer glow ring
    if (selected) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 4);
      ctx.beginPath();
      ctx.arc(cx, cy, size + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = DATA.COLORS.bg;
    ctx.strokeStyle = color;
    ctx.lineWidth = selected ? 2 : 1.5;

    if (type === 'rail') {
      const s = size;
      roundedRect(ctx, cx - s, cy - s, s * 2, s * 2, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.6;
      roundedRect(ctx, cx - s * 0.55, cy - s * 0.55, s * 1.1, s * 1.1, 2);
      ctx.fill();
    } else if (type === 'ice') {
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'sniper') {
      triangle(ctx, cx, cy + size * 0.15, size * 1.1);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.45;
      triangle(ctx, cx, cy + size * 0.15, size * 0.65);
      ctx.fill();
    } else if (type === 'nova') {
      hexagon(ctx, cx, cy, size * 1.05);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha * 0.45;
      hexagon(ctx, cx, cy, size * 0.65);
      ctx.fill();
    }
    ctx.restore();

    // inner radial glow on top of shape
    ctx.save();
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 1.4);
    g.addColorStop(0, _withAlpha(color, 0.22));
    g.addColorStop(1, _withAlpha(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  return {
    clear, gridBackground, text, wrapText, panel, roundedRect, button,
    hexagon, triangle, hpBar, coinIcon, starIcon, diamond, dashedLine,
    towerShape, glowCircle,
    _lighten, _withAlpha
  };
})();
