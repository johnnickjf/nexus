window.INPUT = (function() {

  const state = {
    x: 0, y: 0,
    clicked: false,
    rightClicked: false,
    isDown: false,
    keys: {}
  };

  let canvas = null;
  let pendingClicks = [];
  let pendingRightClicks = [];

  function attach(canvasEl) {
    canvas = canvasEl;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = DATA.VIRTUAL_WIDTH / rect.width;
      const scaleY = DATA.VIRTUAL_HEIGHT / rect.height;
      state.x = (e.clientX - rect.left) * scaleX;
      state.y = (e.clientY - rect.top) * scaleY;
    });

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      state.isDown = true;
      const rect = canvas.getBoundingClientRect();
      const scaleX = DATA.VIRTUAL_WIDTH / rect.width;
      const scaleY = DATA.VIRTUAL_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      if (e.button === 0) {
        pendingClicks.push({ x, y });
      } else if (e.button === 2) {
        pendingRightClicks.push({ x, y });
      }
    });

    canvas.addEventListener('mouseup', () => {
      state.isDown = false;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      state.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      state.keys[e.code] = false;
    });
  }

  function tick() {
    state.clicked = pendingClicks.length > 0;
    state.clickPos = pendingClicks[0] || null;
    state.rightClicked = pendingRightClicks.length > 0;
    state.rightClickPos = pendingRightClicks[0] || null;
    pendingClicks = [];
    pendingRightClicks = [];
  }

  function getMouse() { return { x: state.x, y: state.y }; }
  function wasClicked() { return state.clicked; }
  function clickPos() { return state.clickPos; }
  function wasRightClicked() { return state.rightClicked; }
  function keyDown(code) { return !!state.keys[code]; }

  function consumeClick() {
    state.clicked = false;
    state.clickPos = null;
  }

  return {
    attach, tick,
    getMouse, wasClicked, clickPos, wasRightClicked, keyDown,
    consumeClick
  };
})();
