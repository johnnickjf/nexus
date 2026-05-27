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
  let _isTouch = false;

  function _canvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = DATA.VIRTUAL_WIDTH  / rect.width;
    const scaleY = DATA.VIRTUAL_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY
    };
  }

  function attach(canvasEl) {
    canvas = canvasEl;

    // ── Mouse ────────────────────────────────────────────────────────────────
    canvas.addEventListener('mousemove', (e) => {
      const { x, y } = _canvasCoords(e.clientX, e.clientY);
      state.x = x; state.y = y;
    });

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      state.isDown = true;
      const { x, y } = _canvasCoords(e.clientX, e.clientY);
      if (e.button === 0) {
        pendingClicks.push({ x, y });
      } else if (e.button === 2) {
        pendingRightClicks.push({ x, y });
      }
    });

    canvas.addEventListener('mouseup', () => { state.isDown = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // ── Touch ────────────────────────────────────────────────────────────────
    // All touch handlers call preventDefault() so the browser never generates
    // synthetic mouse events — no double-firing.

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      _isTouch = true;
      state.isDown = true;
      const touch = e.changedTouches[0];
      const { x, y } = _canvasCoords(touch.clientX, touch.clientY);
      state.x = x; state.y = y;
      pendingClicks.push({ x, y });
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const { x, y } = _canvasCoords(touch.clientX, touch.clientY);
      state.x = x; state.y = y;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      state.isDown = false;
    }, { passive: false });

    canvas.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      state.isDown = false;
    }, { passive: false });

    // ── Keyboard ─────────────────────────────────────────────────────────────
    window.addEventListener('keydown', (e) => { state.keys[e.code] = true; });
    window.addEventListener('keyup',   (e) => { state.keys[e.code] = false; });
  }

  function tick() {
    state.clicked      = pendingClicks.length > 0;
    state.clickPos     = pendingClicks[0] || null;
    state.rightClicked = pendingRightClicks.length > 0;
    state.rightClickPos = pendingRightClicks[0] || null;
    pendingClicks      = [];
    pendingRightClicks = [];
  }

  function getMouse()        { return { x: state.x, y: state.y }; }
  function wasClicked()      { return state.clicked; }
  function clickPos()        { return state.clickPos; }
  function wasRightClicked() { return state.rightClicked; }
  function keyDown(code)     { return !!state.keys[code]; }
  function isTouch()         { return _isTouch; }

  function consumeClick() {
    state.clicked  = false;
    state.clickPos = null;
  }

  return {
    attach, tick,
    getMouse, wasClicked, clickPos, wasRightClicked, keyDown,
    consumeClick, isTouch
  };
})();
