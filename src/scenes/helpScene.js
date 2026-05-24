window.HelpScene = class HelpScene {
  constructor() {
    this.time = 0;
    this.activeTab = 'basics';
  }
  enter() { this.time = 0; this.activeTab = 'basics'; }
  update(dt) { this.time += dt; }

  render(ctx) {
    RENDER.gridBackground(ctx, this.time);

    let backClicked = false;
    if (RENDER.button(ctx, 24, 24, 100, 36, '← VOLTAR', {
      color: DATA.COLORS.textSecondary, size: 12
    })) backClicked = true;

    RENDER.text(ctx, 'COMO JOGAR', DATA.VIRTUAL_WIDTH / 2, 80, {
      size: 22, color: DATA.COLORS.textPrimary, weight: 700,
      align: 'center', baseline: 'middle', font: 'Orbitron', letterSpacing: 8
    });

    const tabs = [
      { id: 'basics', label: 'BÁSICO' },
      { id: 'towers', label: 'TORRES' },
      { id: 'enemies', label: 'INIMIGOS' },
      { id: 'progression', label: 'PROGRESSÃO' }
    ];
    const tabW = 130;
    const tabsStartX = (DATA.VIRTUAL_WIDTH - tabW * tabs.length) / 2;
    tabs.forEach((t, i) => {
      const x = tabsStartX + i * tabW;
      const active = this.activeTab === t.id;
      const mouse = INPUT.getMouse();
      const hovered = MATH_UTILS.pointInRect(mouse.x, mouse.y, x, 130, tabW, 36);

      ctx.save();
      ctx.fillStyle = active ? '#0d1a18' : 'transparent';
      ctx.strokeStyle = active ? DATA.COLORS.rail : (hovered ? DATA.COLORS.borderHover : DATA.COLORS.border);
      ctx.lineWidth = active ? 1.5 : 0.5;
      RENDER.roundedRect(ctx, x, 130, tabW, 36, 4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      RENDER.text(ctx, t.label, x + tabW / 2, 148, {
        size: 11, color: active ? DATA.COLORS.rail : DATA.COLORS.textSecondary,
        align: 'center', baseline: 'middle', weight: 500, letterSpacing: 2
      });

      if (hovered && INPUT.wasClicked()) this.activeTab = t.id;
    });

    if (this.activeTab === 'basics') this.renderBasics(ctx);
    else if (this.activeTab === 'towers') this.renderTowers(ctx);
    else if (this.activeTab === 'enemies') this.renderEnemies(ctx);
    else this.renderProgression(ctx);

    if (backClicked) return 'menu';
    return null;
  }

  renderBasics(ctx) {
    const cx = DATA.VIRTUAL_WIDTH / 2;
    const items = [
      ['→', 'Inimigos seguem o caminho até o CORE'],
      ['◇', 'Coloque torres nos slots para destruí-los'],
      ['◈', 'Coins caem ao matar inimigos · gaste em upgrades durante a partida'],
      ['✦', 'Estrelas são ganhas por wave · gaste no menu de habilidades'],
      ['⏸', 'Pause e mude a velocidade no topo (1×/2×)'],
      ['▸', 'Clique numa torre para ver e melhorar suas habilidades'],
      ['✕', 'Botão direito no slot ou venda na torre para desfazer (70% refund)']
    ];

    items.forEach((it, i) => {
      const y = 220 + i * 40;
      RENDER.text(ctx, it[0], cx - 220, y,
        { size: 18, color: DATA.COLORS.rail, baseline: 'middle', weight: 700 });
      RENDER.text(ctx, it[1], cx - 190, y,
        { size: 13, color: DATA.COLORS.textPrimary, baseline: 'middle' });
    });
  }

  renderTowers(ctx) {
    const types = ['rail', 'ice', 'sniper', 'nova'];
    const cardW = 240, cardH = 200;
    const startX = (DATA.VIRTUAL_WIDTH - cardW * 4 - 12 * 3) / 2;
    const y = 200;

    types.forEach((t, i) => {
      const def = DATA.TOWERS[t];
      const x = startX + i * (cardW + 12);
      RENDER.panel(ctx, x, y, cardW, cardH, { border: def.color, fill: '#0a0a18' });
      RENDER.towerShape(ctx, t, x + cardW / 2, y + 50, 18, def.color);
      RENDER.text(ctx, def.name, x + cardW / 2, y + 96, {
        size: 16, color: def.color, weight: 700, align: 'center', baseline: 'middle', letterSpacing: 3
      });
      RENDER.text(ctx, def.tagline, x + cardW / 2, y + 116, {
        size: 11, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle'
      });

      RENDER.text(ctx, `dano · ${def.damage}`, x + cardW / 2, y + 144,
        { size: 11, color: DATA.COLORS.textSecondary, align: 'center', baseline: 'middle' });
      RENDER.text(ctx, `range · ${def.range}`, x + cardW / 2, y + 160,
        { size: 11, color: DATA.COLORS.textSecondary, align: 'center', baseline: 'middle' });
      RENDER.text(ctx, `cd · ${def.cooldown}s  ·  ${def.cost}◈`, x + cardW / 2, y + 176,
        { size: 11, color: DATA.COLORS.gold, align: 'center', baseline: 'middle' });
    });
  }

  renderEnemies(ctx) {
    const enemies = [
      { type: 'drone',  desc: 'Rápido e fraco · vem em grupos' },
      { type: 'shield', desc: 'HP médio · costuma vir com escudo' },
      { type: 'tank',   desc: 'Lento mas resistente · alto dano no CORE' },
      { type: 'ghost',  desc: 'Pode ter imunidade a uma torre específica' },
      { type: 'boss',   desc: 'Aparece a cada 5 waves · execução não funciona' }
    ];
    const startY = 200;
    const cx = DATA.VIRTUAL_WIDTH / 2;

    enemies.forEach((e, i) => {
      const def = DATA.ENEMIES[e.type];
      const y = startY + i * 56;
      RENDER.panel(ctx, cx - 320, y, 640, 48, { border: DATA.COLORS.borderStrong, fill: '#0a0a18' });

      ctx.save();
      ctx.fillStyle = def.color;
      if (e.type === 'drone' || e.type === 'shield') {
        ctx.beginPath();
        ctx.arc(cx - 290, y + 24, 10, 0, Math.PI * 2); ctx.fill();
      } else if (e.type === 'tank') {
        RENDER.roundedRect(ctx, cx - 300, y + 14, 20, 20, 2); ctx.fill();
      } else if (e.type === 'ghost') {
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx - 290, y + 24, 10, 0, Math.PI * 2); ctx.fill();
      } else if (e.type === 'boss') {
        RENDER.hexagon(ctx, cx - 290, y + 24, 14); ctx.fill();
      }
      ctx.restore();

      RENDER.text(ctx, def.name, cx - 260, y + 16,
        { size: 13, color: def.color, weight: 700, baseline: 'middle' });
      RENDER.text(ctx, e.desc, cx - 260, y + 33,
        { size: 11, color: DATA.COLORS.textSecondary, baseline: 'middle' });

      RENDER.text(ctx, `hp ${def.baseHp}`, cx + 200, y + 24,
        { size: 11, color: DATA.COLORS.textMuted, baseline: 'middle' });
      RENDER.text(ctx, `+${def.coinReward} ◈`, cx + 260, y + 24,
        { size: 11, color: DATA.COLORS.gold, baseline: 'middle' });
    });

    RENDER.text(ctx, 'Modificadores podem aparecer:  escudo · raio (rápido) · piscar (imune temporário) · imune à torre X',
      cx, DATA.VIRTUAL_HEIGHT - 80,
      { size: 11, color: DATA.COLORS.textMuted, align: 'center', baseline: 'middle' });
  }

  renderProgression(ctx) {
    const cx = DATA.VIRTUAL_WIDTH / 2;
    const items = [
      { icon: '◈', title: 'Coins (in-run)',
        desc: 'Caem de inimigos · reseta a cada partida · usados em upgrades durante o jogo' },
      { icon: '✦', title: 'Estrelas (persistente)',
        desc: 'Ganhas ao completar waves · ficam pra sempre · usadas na árvore de habilidades' },
      { icon: '✚', title: 'Árvore de habilidades',
        desc: '4 torres × 3 caminhos × 30 nós = 360 melhorias permanentes · aplica em partidas futuras' },
      { icon: '⌬', title: 'In-run upgrades',
        desc: '3 habilidades por torre · 3 níveis cada · efeito apenas naquela partida' },
      { icon: '∞', title: 'Modo Infinito',
        desc: 'Desbloqueado ao zerar os 10 setores · waves sem fim, dificuldade crescente' }
    ];

    items.forEach((it, i) => {
      const y = 210 + i * 65;
      RENDER.text(ctx, it.icon, cx - 280, y + 6,
        { size: 22, color: DATA.COLORS.rail, baseline: 'middle' });
      RENDER.text(ctx, it.title, cx - 240, y,
        { size: 13, color: DATA.COLORS.textPrimary, baseline: 'middle', weight: 700 });
      RENDER.text(ctx, it.desc, cx - 240, y + 20,
        { size: 11, color: DATA.COLORS.textMuted, baseline: 'middle' });
    });
  }

  handleAction(action, game) {
    if (action === 'menu') game.changeScene('menu');
  }
};
