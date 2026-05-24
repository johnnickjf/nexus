window.SkillTreeScene = class SkillTreeScene {
  constructor() {
    this.time = 0;
    this.activeTower = 'rail';
    this.feedback = null;
    this.feedbackTime = 0;
  }
  enter() { this.time = 0; this.feedback = null; }
  update(dt) {
    this.time += dt;
    if (this.feedback) {
      this.feedbackTime -= dt;
      if (this.feedbackTime <= 0) this.feedback = null;
    }
  }

  render(ctx) {
    RENDER.gridBackground(ctx, this.time);

    let backClicked = false;
    if (RENDER.button(ctx, 24, 24, 100, 36, '← VOLTAR', {
      color: DATA.COLORS.textSecondary, size: 12
    })) backClicked = true;

    RENDER.text(ctx, 'ÁRVORE DE HABILIDADES', DATA.VIRTUAL_WIDTH / 2, 50, {
      size: 18, color: DATA.COLORS.textPrimary, weight: 700,
      align: 'center', baseline: 'middle', font: 'Orbitron', letterSpacing: 6
    });

    const save = SAVE.get();
    RENDER.starIcon(ctx, DATA.VIRTUAL_WIDTH - 140, 42, 16);
    RENDER.text(ctx, String(save.stars), DATA.VIRTUAL_WIDTH - 118, 42,
      { size: 16, color: DATA.COLORS.gold, baseline: 'middle', weight: 700 });

    const towers = ['rail', 'ice', 'sniper', 'nova'];
    const tabW = 140;
    const tabsStartX = (DATA.VIRTUAL_WIDTH - tabW * 4) / 2;
    const tabY = 100;

    towers.forEach((t, i) => {
      const def = DATA.TOWERS[t];
      const x = tabsStartX + i * tabW;
      const active = this.activeTower === t;
      const mouse = INPUT.getMouse();
      const hovered = MATH_UTILS.pointInRect(mouse.x, mouse.y, x, tabY, tabW, 44);

      ctx.save();
      ctx.fillStyle = active ? '#0d1a18' : (hovered ? '#0a0a22' : 'transparent');
      ctx.strokeStyle = active ? def.color : DATA.COLORS.border;
      ctx.lineWidth = active ? 1.5 : 0.5;
      RENDER.roundedRect(ctx, x, tabY, tabW, 44, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      RENDER.towerShape(ctx, t, x + 24, tabY + 22, 9, def.color);
      RENDER.text(ctx, def.name, x + 44, tabY + 22, {
        size: 14, color: active ? def.color : DATA.COLORS.textSecondary,
        baseline: 'middle', weight: 700
      });

      if (hovered && INPUT.wasClicked()) {
        const cp = INPUT.clickPos();
        if (MATH_UTILS.pointInRect(cp.x, cp.y, x, tabY, tabW, 44)) {
          this.activeTower = t;
        }
      }
    });

    const purchaseResult = this.renderTreeForTower(ctx, this.activeTower);

    if (this.feedback) {
      ctx.save();
      ctx.globalAlpha = MATH_UTILS.clamp(this.feedbackTime, 0, 1);
      RENDER.panel(ctx, DATA.VIRTUAL_WIDTH / 2 - 150, DATA.VIRTUAL_HEIGHT - 90, 300, 36,
        { border: this.feedback.color });
      RENDER.text(ctx, this.feedback.text, DATA.VIRTUAL_WIDTH / 2,
        DATA.VIRTUAL_HEIGHT - 72, {
          size: 12, color: this.feedback.color, align: 'center', baseline: 'middle', weight: 500
        });
      ctx.restore();
    }

    if (backClicked) return 'menu';
    return purchaseResult;
  }

  renderTreeForTower(ctx, towerType) {
    const def = DATA.TOWERS[towerType];
    const effects = DATA.TREE_EFFECTS[towerType];
    const save = SAVE.get();
    const branches = save.tree[towerType];

    const treeY = 180;

    const paths = ['A', 'B', 'C'];
    const colW = 360;
    const startX = (DATA.VIRTUAL_WIDTH - colW * 3) / 2;

    let result = null;
    let hoveredTooltip = null;

    paths.forEach((p, i) => {
      const x = startX + i * colW;
      const eff = effects[p];
      const owned = branches[p].filter(Boolean).length;

      RENDER.text(ctx, eff.label, x + colW / 2, treeY, {
        size: 16, color: def.color, weight: 700,
        align: 'center', baseline: 'middle', letterSpacing: 4
      });
      RENDER.text(ctx, eff.desc, x + colW / 2, treeY + 22, {
        size: 10, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle'
      });
      RENDER.text(ctx, `${owned}/30`, x + colW / 2, treeY + 42, {
        size: 10, color: owned > 0 ? def.color : DATA.COLORS.textMuted,
        align: 'center', baseline: 'middle', weight: 500
      });

      const nodesPerRow = 6;
      const nodeSize = 22;
      const nodeGap = 12;
      const totalNodesW = nodesPerRow * nodeSize + (nodesPerRow - 1) * nodeGap;
      const nodesStartX = x + (colW - totalNodesW) / 2;
      const nodesStartY = treeY + 70;
      const rowGap = 14;

      for (let n = 0; n < 30; n++) {
        const row = Math.floor(n / nodesPerRow);
        const col = n % nodesPerRow;
        const nx = nodesStartX + col * (nodeSize + nodeGap);
        const ny = nodesStartY + row * (nodeSize + rowGap);
        const isOwned = branches[p][n];
        const isPurchasable = !isOwned && (n === 0 || branches[p][n - 1]);
        const cost = DATA.TREE_NODE_COSTS[n];
        const canAfford = save.stars >= cost;
        const isFinal = n === 29;

        if (col < nodesPerRow - 1) {
          ctx.save();
          ctx.strokeStyle = (isOwned && branches[p][n + 1]) ? def.color : DATA.COLORS.borderStrong;
          ctx.globalAlpha = (isOwned && branches[p][n + 1]) ? 0.6 : 0.3;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nx + nodeSize, ny + nodeSize / 2);
          ctx.lineTo(nx + nodeSize + nodeGap, ny + nodeSize / 2);
          ctx.stroke();
          ctx.restore();
        }
        if (col === nodesPerRow - 1 && n < 29) {
          ctx.save();
          ctx.strokeStyle = (isOwned && branches[p][n + 1]) ? def.color : DATA.COLORS.borderStrong;
          ctx.globalAlpha = (isOwned && branches[p][n + 1]) ? 0.6 : 0.3;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nx + nodeSize / 2, ny + nodeSize);
          ctx.lineTo(nx + nodeSize / 2, ny + nodeSize + rowGap);
          ctx.stroke();
          ctx.restore();
        }

        const mouse = INPUT.getMouse();
        const hovered = MATH_UTILS.pointInRect(mouse.x, mouse.y, nx, ny, nodeSize, nodeSize);

        ctx.save();
        if (isOwned) {
          ctx.fillStyle = def.color;
          ctx.strokeStyle = def.color;
        } else if (isPurchasable) {
          ctx.fillStyle = canAfford ? '#0d1a18' : DATA.COLORS.bg;
          ctx.strokeStyle = canAfford ? def.color : DATA.COLORS.textMuted;
        } else {
          ctx.fillStyle = DATA.COLORS.bg;
          ctx.strokeStyle = DATA.COLORS.textDim;
        }
        ctx.lineWidth = isFinal ? 1.5 : 0.8;

        if (isFinal) {
          RENDER.hexagon(ctx, nx + nodeSize / 2, ny + nodeSize / 2, nodeSize / 2);
        } else {
          ctx.beginPath();
          ctx.arc(nx + nodeSize / 2, ny + nodeSize / 2, nodeSize / 2 - 1, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        if (isOwned) {
          ctx.fillStyle = DATA.COLORS.bg;
          ctx.beginPath();
          ctx.arc(nx + nodeSize / 2, ny + nodeSize / 2, nodeSize / 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (hovered) {
          hoveredTooltip = {
            x: nx + nodeSize / 2,
            y: ny,
            label: isFinal ? eff.finalText : eff.nodeText,
            cost,
            canAfford,
            color: def.color,
            isOwned,
            isPurchasable
          };
          if (isPurchasable && canAfford && INPUT.wasClicked() &&
              MATH_UTILS.pointInRect(INPUT.clickPos()?.x, INPUT.clickPos()?.y, nx, ny, nodeSize, nodeSize)) {
            result = { action: 'buyNode', tower: towerType, path: p, node: n };
            INPUT.consumeClick();
          }
        }
      }
    });

    if (hoveredTooltip) {
      this.renderTooltip(ctx, hoveredTooltip);
    }

    return result;
  }

  renderTooltip(ctx, tt) {
    const w = 200, h = 64;
    let tx = tt.x - w / 2;
    let ty = tt.y - h - 8;

    if (tx < 20) tx = 20;
    if (tx + w > DATA.VIRTUAL_WIDTH - 20) tx = DATA.VIRTUAL_WIDTH - w - 20;
    if (ty < 130) ty = tt.y + 30;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    RENDER.panel(ctx, tx, ty, w, h, { border: tt.color, fill: '#080814' });
    ctx.restore();

    RENDER.text(ctx, tt.label, tx + w / 2, ty + 18,
      { size: 11, color: tt.color, align: 'center', baseline: 'middle', weight: 500 });

    if (tt.isOwned) {
      RENDER.text(ctx, '✓ Desbloqueado', tx + w / 2, ty + 42,
        { size: 11, color: DATA.COLORS.rail, align: 'center', baseline: 'middle' });
    } else if (tt.isPurchasable) {
      RENDER.text(ctx, `Custo: ${tt.cost} ✦`, tx + w / 2, ty + 42,
        { size: 11, color: tt.canAfford ? DATA.COLORS.gold : DATA.COLORS.danger, align: 'center', baseline: 'middle' });
    } else {
      RENDER.text(ctx, '◊ Bloqueado', tx + w / 2, ty + 42,
        { size: 11, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle' });
    }
  }

  handleAction(action, game) {
    if (action === 'menu') game.changeScene('menu');
    else if (action && action.action === 'buyNode') {
      const r = SAVE.purchaseTreeNode(action.tower, action.path, action.node);
      if (r.ok) {
        this.feedback = { text: `+1 melhoria desbloqueada (−${r.cost} ✦)`, color: DATA.COLORS.rail };
      } else {
        this.feedback = { text: r.reason === 'insufficient_stars' ? 'Estrelas insuficientes' : 'Não pode comprar', color: DATA.COLORS.danger };
      }
      this.feedbackTime = 2.0;
    }
  }
};
