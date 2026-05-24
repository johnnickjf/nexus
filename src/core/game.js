window.Game = class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = true;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    INPUT.attach(this.canvas);
    SAVE.load();

    this.canvas.addEventListener('mousedown', () => {
      AUDIO.init();
      AUDIO.resume();
    }, { once: true });

    const loading = document.getElementById('loading-fallback');
    if (loading) loading.style.display = 'none';

    this.scenes = {
      menu: new MenuScene(),
      chapterSelect: new ChapterSelectScene(),
      mapSelect: new MapSelectScene(),
      skillTree: new SkillTreeScene(),
      settings: new SettingsScene(),
      help: new HelpScene(),
      support: new SupportScene(),
      game: new GameScene(),
      gameOver: new GameOverScene()
    };

    this.currentSceneName = 'menu';
    this.currentScene = this.scenes.menu;
    this.currentScene.enter();

    this.selectedChapter = null;
    this.endGameResult = null;

    this.fadeAlpha = 1;
    this.fadeDuration = 0.3;

    this.lastFrame = performance.now();
    this.fps = 60;
    this.fpsBuffer = [];

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    // CSS displayed size — fall back to virtual if not laid out yet
    const cssW = Math.max(1, Math.round(rect.width || DATA.VIRTUAL_WIDTH));
    const cssH = Math.max(1, Math.round(rect.height || DATA.VIRTUAL_HEIGHT));

    // backing store at native pixel density of the displayed area
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);

    // scale so drawing at virtual coords (1280x720) fills the displayed area crisply
    const scaleX = (cssW * dpr) / DATA.VIRTUAL_WIDTH;
    const scaleY = (cssH * dpr) / DATA.VIRTUAL_HEIGHT;
    this.ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  changeScene(name, payload) {
    if (!this.scenes[name]) {
      console.error('Unknown scene:', name);
      return;
    }
    this.currentSceneName = name;
    this.currentScene = this.scenes[name];
    this.fadeAlpha = 1;

    if (name === 'gameOver') {
      this.currentScene.enter(this.endGameResult);
    } else {
      this.currentScene.enter(payload);
    }
  }

  startMap(mapId, mode) {
    const mapData = MAPS.get(mapId);
    if (!mapData) return;
    if (mapData.placeholder) {
      alert('Esse setor ainda não foi construído. Em breve!');
      return;
    }
    this.scenes.game.startMap(mapData, mode);
    this.changeScene('game');
  }

  loop(now) {
    const rawDt = Math.min((now - this.lastFrame) / 1000, 1/30);
    this.lastFrame = now;

    this.fpsBuffer.push(1 / Math.max(rawDt, 0.001));
    if (this.fpsBuffer.length > 30) this.fpsBuffer.shift();
    this.fps = this.fpsBuffer.reduce((a, b) => a + b, 0) / this.fpsBuffer.length;

    INPUT.tick();

    if (this.currentScene.update) this.currentScene.update(rawDt);
    const action = this.currentScene.render(this.ctx);
    if (action !== undefined && action !== null) {
      this.currentScene.handleAction(action, this);
    }

    // Scene fade overlay (fade from black on enter)
    if (this.fadeAlpha > 0) {
      this.fadeAlpha = Math.max(0, this.fadeAlpha - rawDt / this.fadeDuration);
      this.ctx.save();
      this.ctx.fillStyle = `rgba(0,0,0,${this.fadeAlpha})`;
      this.ctx.fillRect(0, 0, DATA.VIRTUAL_WIDTH, DATA.VIRTUAL_HEIGHT);
      this.ctx.restore();
    }

    if (SAVE.get().settings.showFps) {
      RENDER.text(this.ctx, `${Math.round(this.fps)} fps`, 10, DATA.VIRTUAL_HEIGHT - 14,
        { size: 10, color: DATA.COLORS.textMuted });
    }

    requestAnimationFrame(this.loop);
  }
};

window.addEventListener('load', () => {
  window.game = new Game();
});
