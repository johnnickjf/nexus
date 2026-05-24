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
    const layout = DATA.TREE_LAYOUT;
    const save = SAVE.get();
    const branches = save.tree[towerType];

    const paths = ['A', 'B', 'C'];
    const colW = DATA.VIRTUAL_WIDTH / 3;
    const treeTopY = 225;

    let result = null;
    let hoveredTooltip = null;

    // column separators
    ctx.save();
    ctx.strokeStyle = DATA.COLORS.border;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(colW, 155);     ctx.lineTo(colW, DATA.VIRTUAL_HEIGHT - 30);
    ctx.moveTo(colW * 2, 155); ctx.lineTo(colW * 2, DATA.VIRTUAL_HEIGHT - 30);
    ctx.stroke();
    ctx.restore();

    paths.forEach((p, pi) => {
      const eff = effects[p];
      const owned = branches[p].filter(Boolean).length;
      const cx = colW * pi + colW / 2;

      // path header
      RENDER.text(ctx, eff.label, cx, 164, {
        size: 14, color: def.color, weight: 700,
        align: 'center', baseline: 'middle', letterSpacing: 3
      });
      RENDER.text(ctx, eff.desc, cx, 181, {
        size: 9, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle'
      });
      RENDER.text(ctx, `${owned}/10`, cx, 197, {
        size: 9, color: owned > 0 ? def.color : DATA.COLORS.textMuted,
        align: 'center', baseline: 'middle', weight: 500
      });

      // edges (drawn before nodes so nodes sit on top)
      layout.edges.forEach(([from, to]) => {
        const fn = layout.nodes[from];
        const tn = layout.nodes[to];
        const fx = cx + fn.relX, fy = treeTopY + fn.relY;
        const tx2 = cx + tn.relX, ty2 = treeTopY + tn.relY;
        const bothOwned = branches[p][from] && branches[p][to];
        const fromOwned = branches[p][from];

        ctx.save();
        if (bothOwned) {
          ctx.strokeStyle = def.color;
          ctx.globalAlpha = 0.65;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = def.color;
          ctx.shadowBlur = 4;
        } else if (fromOwned) {
          ctx.strokeStyle = def.color;
          ctx.globalAlpha = 0.22;
          ctx.lineWidth = 0.8;
        } else {
          ctx.strokeStyle = DATA.COLORS.borderStrong;
          ctx.globalAlpha = 0.18;
          ctx.lineWidth = 0.8;
        }
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx2, ty2);
        ctx.stroke();
        ctx.restore();
      });

      // nodes
      const mouse = INPUT.getMouse();
      layout.nodes.forEach(({ id, relX, relY }) => {
        const nx = cx + relX;
        const ny = treeTopY + relY;
        const isOwned = branches[p][id];
        const prereqs = layout.prereqs[id];
        const isPurchasable = !isOwned && (prereqs.length === 0 || prereqs.some(pId => branches[p][pId]));
        const cost = DATA.TREE_NODE_COSTS[id];
        const canAfford = save.stars >= cost;
        const isFinal = id === 9;
        const isRoot  = id === 0;
        const nodeR   = isFinal ? 13 : (isRoot ? 10 : 8);

        ctx.save();
        if (isOwned) {
          ctx.fillStyle = def.color;
          ctx.strokeStyle = def.color;
          ctx.shadowColor = def.color;
          ctx.shadowBlur = isFinal ? 14 : 6;
        } else if (isPurchasable) {
          ctx.fillStyle = canAfford ? '#0a1410' : DATA.COLORS.bg;
          ctx.strokeStyle = canAfford ? def.color : DATA.COLORS.textMuted;
          if (canAfford) { ctx.shadowColor = def.color; ctx.shadowBlur = 5; }
        } else {
          ctx.fillStyle = DATA.COLORS.bg;
          ctx.strokeStyle = DATA.COLORS.textDim;
        }
        ctx.lineWidth = (isFinal || isRoot) ? 1.5 : 0.8;

        if (isFinal) {
          RENDER.hexagon(ctx, nx, ny, nodeR);
        } else {
          ctx.beginPath();
          ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        if (isOwned && !isFinal) {
          ctx.shadowBlur = 0;
          ctx.fillStyle = DATA.COLORS.bg;
          ctx.beginPath();
          ctx.arc(nx, ny, nodeR * 0.38, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        const d = MATH_UTILS.dist(mouse.x, mouse.y, nx, ny);
        if (d <= nodeR + 5) {
          const label = isFinal ? eff.finalText : (isRoot ? eff.label : eff.nodeText);
          hoveredTooltip = { x: nx, y: ny, nodeR, label, cost, canAfford, color: def.color, isOwned, isPurchasable };

          if (isPurchasable && canAfford && INPUT.wasClicked()) {
            const cp = INPUT.clickPos();
            if (cp && MATH_UTILS.dist(cp.x, cp.y, nx, ny) <= nodeR + 5) {
              result = { action: 'buyNode', tower: towerType, path: p, node: id };
              INPUT.consumeClick();
            }
          }
        }
      });
    });

    if (hoveredTooltip) this.renderTooltip(ctx, hoveredTooltip);
    return result;
  }

  renderTooltip(ctx, tt) {
    const w = 200, h = 64;
    let tx = tt.x - w / 2;
    let ty = tt.y - tt.nodeR - h - 10;

    if (tx < 20) tx = 20;
    if (tx + w > DATA.VIRTUAL_WIDTH - 20) tx = DATA.VIRTUAL_WIDTH - w - 20;
    if (ty < 130) ty = tt.y + tt.nodeR + 10;

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
