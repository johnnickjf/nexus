window.WaveSystem = class WaveSystem {
  constructor(mapData, mode) {
    this.mapData = mapData;
    this.mode = mode;
    this.currentWaveNumber = 0;
    this.totalWaves = mode === 'infinite' ? Infinity : mapData.totalWaves;
    this.state = 'betweenWaves';
    this.timeInState = 0;
    this.currentWave = null;
    this.spawnIndex = 0;
    this.waveStartTime = 0;
    this.breakDuration = DATA.ECONOMY.waveBreakDuration;
    this.firstWaveDelay = DATA.ECONOMY.firstWaveDelay;
  }

  tick(dt, gameTime, enemySystem, onStarsEarned, onWaveStart, onMapComplete) {

    if (this.state === 'betweenWaves') {
      this.timeInState += dt;
      const requiredWait = this.currentWaveNumber === 0 ? this.firstWaveDelay : this.breakDuration;
      if (this.timeInState >= requiredWait) {
        this.startNextWave(gameTime, onWaveStart);
      }
      return;
    }

    if (this.state === 'spawning') {
      const elapsed = gameTime - this.waveStartTime;
      while (this.spawnIndex < this.currentWave.enemies.length) {
        const next = this.currentWave.enemies[this.spawnIndex];
        if (elapsed >= next.delay) {
          enemySystem.spawn(next.type, next.modifiers, this.currentWaveNumber, this.mapData);
          this.spawnIndex++;
        } else {
          break;
        }
      }
      if (this.spawnIndex >= this.currentWave.enemies.length) {
        this.state = 'clearing';
      }
    }

    if (this.state === 'clearing') {
      if (enemySystem.count() === 0) {
        const wave = this.currentWaveNumber;
        let stars = DATA.ECONOMY.starsPerWave;
        if (wave % 5 === 0) stars += DATA.ECONOMY.bossWaveStarBonus;
        onStarsEarned(stars, wave);

        if (this.mode === 'normal' && this.currentWaveNumber >= this.totalWaves) {
          onStarsEarned(DATA.ECONOMY.mapCompleteStarBonus, wave);
          this.state = 'victory';
          onMapComplete(true);
          return;
        }

        this.state = 'betweenWaves';
        this.timeInState = 0;
      }
    }
  }

  startNextWave(gameTime, onWaveStart) {
    this.currentWaveNumber++;
    this.currentWave = this.mapData.waveGenerator(this.currentWaveNumber);
    this.spawnIndex = 0;
    this.waveStartTime = gameTime;
    this.state = 'spawning';
    if (onWaveStart) onWaveStart(this.currentWaveNumber);
  }

  skipBreak() {
    if (this.state === 'betweenWaves') {
      this.timeInState = 9999;
    }
  }

  getBreakTimeLeft() {
    if (this.state !== 'betweenWaves') return 0;
    const required = this.currentWaveNumber === 0 ? this.firstWaveDelay : this.breakDuration;
    return Math.max(0, required - this.timeInState);
  }
};
