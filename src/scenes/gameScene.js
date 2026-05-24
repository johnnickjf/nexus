window.GameScene = class GameScene {
  constructor() {
    this.mapData = null;
    this.mode = 'normal';
    this.gameTime = 0;
    this.speedMultiplier = 1;
    this.paused = false;

    this.enemySystem = null;
    this.towerSystem = null;
    this.projectileSystem = null;
    this.waveSystem = null;
    this.hudSystem = null;

    this.floatingTexts = [];
    this.coreHp = 20;
    this.coreMaxHp = 20;
    this.coins = 0;
    this.runStarsEarned = 0;
    this.kills = 0;
    this.slotOccupied = {};

    this.exitRequested = null;
    this.victoryRequested = null;
    this.gameOverRequested = null;
  }

  enter() {

  }

  startMap(mapData, mode) {
    this.mapData = mapData;
    this.mode = mode;
    this.gameTime = 0;
    this.speedMultiplier = 1;
    this.paused = false;
    this.coins = DATA.ECONOMY.startingCoins;
    this.coreHp = mapData.coreHp;
    this.coreMaxHp = mapData.coreHp;
    this.runStarsEarned = 0;
    this.kills = 0;

    this.enemySystem = new EnemySystem();
    this.towerSystem = new TowerSystem();
    this.projectileSystem = new ProjectileSystem();
    this.waveSystem = new WaveSystem(mapData, mode);
    this.hudSystem = new HudSystem();
    this.floatingTexts = [];
    this.slotOccupied = {};

    this.exitRequested = null;
    this.victoryRequested = null;
    this.gameOverRequested = null;
  }

  update(dt) {
    if (this.exitRequested || this.victoryRequested || this.gameOverRequested) return;
    if (this.paused) return;

    const effDt = dt * this.speedMultiplier;
    this.gameTime += effDt;

    this.waveSystem.tick(
      effDt, this.gameTime, this.enemySystem,
      (stars, wave) => {
        this.runStarsEarned += stars;
        SAVE.addStars(stars);
        AUDIO.sfx.waveClear();
        this.floatingTexts.push(new FloatingText(
          `+${stars} ✦`,
          DATA.VIRTUAL_WIDTH / 2,
          DATA.VIRTUAL_HEIGHT / 2 - 60,
          DATA.COLORS.gold
        ));
        this.coins += DATA.ECONOMY.waveCompleteBonus;
        this.floatingTexts.push(new FloatingText(
          `+${DATA.ECONOMY.waveCompleteBonus} ◈ wave clear`,
          DATA.VIRTUAL_WIDTH / 2,
          DATA.VIRTUAL_HEIGHT / 2 - 30,
          DATA.COLORS.rail
        ));
      },
      (waveNumber) => {
        AUDIO.sfx.waveStart();
      },
      (didWin) => {
        if (didWin) {
          SAVE.markMapComplete(this.mapData.id);
          AUDIO.sfx.victory();
          this.victoryRequested = true;
        }
      }
    );

    this.enemySystem.tick(effDt, (enemy) => {
      this.coreHp -= enemy.coreDamage;
      AUDIO.sfx.coreHit();
      this.floatingTexts.push(new FloatingText(
        `-${enemy.coreDamage} CORE`,
        DATA.VIRTUAL_WIDTH / 2, 90,
        DATA.COLORS.danger
      ));
      if (this.coreHp <= 0) {
        this.coreHp = 0;
        AUDIO.sfx.defeat();
        this.gameOverRequested = true;
      }
    });

    this.towerSystem.tick(effDt, this.gameTime, this.enemySystem, this.projectileSystem);

    this.projectileSystem.tick(effDt, this.enemySystem,
      (enemy) => {
        this.coins += enemy.coinReward;
        this.kills++;
      },
      this.floatingTexts
    );

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      this.floatingTexts[i].tick(dt);
      if (this.floatingTexts[i].dead) this.floatingTexts.splice(i, 1);
    }
  }

  render(ctx) {

    RENDER.clear(ctx, DATA.COLORS.bg);

    this.renderGameArea(ctx);

    if (!this.mapData) return null;

    const state = {
      mapName: this.mapData.name,
      mapData: this.mapData,
      wave: this.waveSystem.currentWaveNumber,
      totalWaves: this.waveSystem.totalWaves,
      waveState: this.waveSystem.state,
      waveBreakLeft: this.waveSystem.getBreakTimeLeft(),
      coreHp: this.coreHp,
      coreMaxHp: this.coreMaxHp,
      coins: this.coins,
      stars: SAVE.get().stars,
      speed: this.speedMultiplier,
      paused: this.paused,
      slotOccupied: this.slotOccupied
    };

    this.hudSystem.render(ctx, state);

    const action = this.hudSystem.consumeAction();
    if (action) this.processHudAction(action);

    this.handleClicks();

    if (this.exitRequested) return { action: 'exit' };
    if (this.victoryRequested) return { action: 'victory' };
    if (this.gameOverRequested) return { action: 'gameOver' };
    return null;
  }

  renderGameArea(ctx) {
    if (!this.mapData) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 56, DATA.VIRTUAL_WIDTH, DATA.VIRTUAL_HEIGHT - 56 - 100);
    ctx.clip();

    RENDER.gridBackground(ctx, this.gameTime);

    this.renderPath(ctx);

    this.renderSlots(ctx);

    this.renderCore(ctx);

    if (this.towerSystem) this.towerSystem.render(ctx);
    if (this.enemySystem) this.enemySystem.render(ctx);
    if (this.projectileSystem) this.projectileSystem.render(ctx);
    if (this.floatingTexts) this.floatingTexts.forEach(t => t.render(ctx));

    ctx.restore();
  }

  renderPath(ctx) {
    const path = this.mapData.path;

    ctx.save();
    ctx.strokeStyle = DATA.COLORS.pathFill;
    ctx.lineWidth = 38;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();

    ctx.strokeStyle = DATA.COLORS.pathEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();

    ctx.strokeStyle = DATA.COLORS.rail;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 0.6;
    ctx.setLineDash([8, 12]);
    ctx.lineDashOffset = -this.gameTime * 30;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
    ctx.restore();
  }

  renderSlots(ctx) {
    const mouse = INPUT.getMouse();
    this.mapData.slots.forEach((slot, i) => {
      const key = slot.x + ',' + slot.y;
      if (this.slotOccupied[key]) return;

      const hovered = MATH_UTILS.pointInCircle(mouse.x, mouse.y, slot.x, slot.y, 20);
      const canPlace = this.hudSystem.selectedTowerType !== null;

      ctx.save();
      ctx.strokeStyle = (hovered && canPlace) ? DATA.COLORS.rail : DATA.COLORS.borderStrong;
      ctx.fillStyle = (hovered && canPlace) ? '#0d1a18' : 'transparent';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 14, 0, Math.PI * 2);
      if (hovered && canPlace) ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = (hovered && canPlace) ? DATA.COLORS.rail : DATA.COLORS.textDim;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  renderCore(ctx) {
    const path = this.mapData.path;
    const last = path[path.length - 1];

    ctx.save();
    const pulse = 0.6 + 0.4 * Math.sin(this.gameTime * 2);
    ctx.fillStyle = DATA.COLORS.rail;
    ctx.globalAlpha = 0.1 + 0.15 * pulse;
    ctx.beginPath();
    ctx.arc(last.x, last.y, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = DATA.COLORS.rail;
    ctx.lineWidth = 1.5;
    RENDER.diamond(ctx, last.x, last.y, 14);
    ctx.stroke();

    ctx.fillStyle = DATA.COLORS.rail;
    ctx.globalAlpha = 0.8;
    RENDER.diamond(ctx, last.x, last.y, 7);
    ctx.fill();
    ctx.restore();
  }

  handleClicks() {
    if (!INPUT.wasClicked()) return;
    const cp = INPUT.clickPos();
    if (!cp) return;

    if (cp.y < 60 || cp.y > DATA.VIRTUAL_HEIGHT - 100) return;

    if (this.hudSystem.selectedTowerType) {
      for (const slot of this.mapData.slots) {
        const key = slot.x + ',' + slot.y;
        if (this.slotOccupied[key]) continue;
        if (MATH_UTILS.pointInCircle(cp.x, cp.y, slot.x, slot.y, 22)) {
          const type = this.hudSystem.selectedTowerType;
          const cost = DATA.TOWERS[type].cost;
          if (this.coins >= cost) {
            this.coins -= cost;
            const globalBonuses = SAVE.get().tree;
            const tower = new Tower(type, this.mapData.slots.indexOf(slot), slot, globalBonuses);
            this.towerSystem.add(tower);
            this.slotOccupied[key] = true;
            this.hudSystem.deselectAll(this.towerSystem);
            AUDIO.sfx.place();
          } else {
            AUDIO.sfx.error();
            this.floatingTexts.push(new FloatingText(
              'COINS INSUFICIENTES', cp.x, cp.y, DATA.COLORS.danger));
          }
          return;
        }
      }
    }

    const t = this.towerSystem.findAt(cp.x, cp.y);
    if (t) {
      this.hudSystem.deselectAll(this.towerSystem);
      this.hudSystem.selectPlacedTower(t);
      return;
    }

    this.hudSystem.deselectAll(this.towerSystem);
  }

  processHudAction(action) {
    if (action.type === 'speed') {
      this.speedMultiplier = action.value;
      this.paused = false;
    } else if (action.type === 'togglePause') {
      this.paused = !this.paused;
    } else if (action.type === 'exit') {
      this.exitRequested = true;
    } else if (action.type === 'skipBreak') {
      this.waveSystem.skipBreak();
    } else if (action.type === 'selectTowerType') {
      if (this.hudSystem.selectedTowerType === action.value) {
        this.hudSystem.deselectAll(this.towerSystem);
      } else {
        this.hudSystem.deselectAll(this.towerSystem);
        this.hudSystem.setSelectedTowerType(action.value);
      }
    } else if (action.type === 'upgradeAbility') {
      const t = this.hudSystem.selectedPlacedTower;
      if (!t) return;
      const result = t.upgradeAbility(action.path);
      if (result.ok && this.coins >= result.cost) {
        this.coins -= result.cost;
        result.applyFn();
        AUDIO.sfx.upgrade();
      } else {
        AUDIO.sfx.error();
      }
    } else if (action.type === 'sellTower') {
      const t = this.hudSystem.selectedPlacedTower;
      if (!t) return;
      const refund = Math.floor(t.totalSpent * DATA.ECONOMY.sellRefundPercent);
      this.coins += refund;
      const key = t.x + ',' + t.y;
      this.slotOccupied[key] = false;
      this.towerSystem.remove(t);
      this.hudSystem.deselectAll(this.towerSystem);
      AUDIO.sfx.sell();
    }
  }

  handleAction(action, game) {
    if (!action) return;
    if (action.action === 'exit') {
      game.changeScene('mapSelect');
    } else if (action.action === 'victory') {
      game.endGameResult = {
        won: true,
        mapId: this.mapData.id,
        wave: this.waveSystem.currentWaveNumber,
        kills: this.kills,
        starsEarned: this.runStarsEarned
      };
      game.changeScene('gameOver');
    } else if (action.action === 'gameOver') {
      game.endGameResult = {
        won: false,
        mapId: this.mapData.id,
        wave: this.waveSystem.currentWaveNumber,
        kills: this.kills,
        starsEarned: this.runStarsEarned
      };
      game.changeScene('gameOver');
    }
  }
};
