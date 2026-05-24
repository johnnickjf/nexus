window.SAVE = (function() {

  const KEY = 'nexus_save_v2';
  const VERSION = 2;

  function makeEmptyTree() {
    const tree = {};
    ['rail', 'ice', 'sniper', 'nova'].forEach(t => {
      tree[t] = {
        A: new Array(10).fill(false),
        B: new Array(10).fill(false),
        C: new Array(10).fill(false)
      };
    });
    return tree;
  }

  function makeDefault() {
    return {
      version: VERSION,
      completedMaps: [],
      stars: 0,
      tree: makeEmptyTree(),
      infiniteUnlocked: false,
      settings: {
        masterVolume: 0.7,
        sfxVolume: 0.8,
        showFps: false
      }
    };
  }

  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        state = makeDefault();
        save();
        return state;
      }
      const parsed = JSON.parse(raw);
      if (parsed.version !== VERSION) {
        state = makeDefault();
        save();
        return state;
      }
      state = parsed;
      if (!state.tree) state.tree = makeEmptyTree();
      if (!state.settings) state.settings = makeDefault().settings;
      return state;
    } catch (e) {
      console.error('Save load error', e);
      state = makeDefault();
      return state;
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Save error', e);
    }
  }

  function get() {
    if (!state) load();
    return state;
  }

  function addStars(amount) {
    if (!state) load();
    state.stars += amount;
    save();
  }

  function spendStars(amount) {
    if (!state) load();
    if (state.stars < amount) return false;
    state.stars -= amount;
    save();
    return true;
  }

  function purchaseTreeNode(towerType, path, nodeIndex) {
    if (!state) load();
    const cost = DATA.TREE_NODE_COSTS[nodeIndex];
    const branch = state.tree[towerType][path];

    if (branch[nodeIndex]) return { ok: false, reason: 'already_owned' };

    const prereqs = DATA.TREE_LAYOUT.prereqs[nodeIndex];
    if (prereqs.length > 0 && !prereqs.some(pId => branch[pId])) {
      return { ok: false, reason: 'previous_locked' };
    }

    if (state.stars < cost) return { ok: false, reason: 'insufficient_stars' };

    state.stars -= cost;
    branch[nodeIndex] = true;
    save();
    return { ok: true, cost };
  }

  function markMapComplete(mapId) {
    if (!state) load();
    if (!state.completedMaps.includes(mapId)) {
      state.completedMaps.push(mapId);
      state.completedMaps.sort((a, b) => a - b);
    }
    if (state.completedMaps.length >= 10 && !state.infiniteUnlocked) {
      state.infiniteUnlocked = true;
    }
    save();
  }

  function isMapUnlocked(mapId) {
    if (!state) load();
    if (mapId === 1) return true;
    return state.completedMaps.includes(mapId - 1);
  }

  function isMapCompleted(mapId) {
    if (!state) load();
    return state.completedMaps.includes(mapId);
  }

  function countOwnedNodes(towerType, path) {
    if (!state) load();
    return state.tree[towerType][path].filter(x => x).length;
  }

  function updateSettings(partial) {
    if (!state) load();
    Object.assign(state.settings, partial);
    save();
  }

  function resetAll() {
    state = makeDefault();
    save();
  }

  return {
    load, save, get,
    addStars, spendStars, purchaseTreeNode,
    markMapComplete, isMapUnlocked, isMapCompleted,
    countOwnedNodes,
    updateSettings, resetAll
  };
})();
