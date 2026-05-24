window.MATH_UTILS = (function() {

  function dist(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function distSq(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, mn, mx) {
    return v < mn ? mn : (v > mx ? mx : v);
  }

  function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }

  function pathLength(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += dist(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
    }
    return total;
  }

  function positionOnPath(points, totalLength, progress) {
    const target = progress * totalLength;
    let acc = 0;
    for (let i = 1; i < points.length; i++) {
      const seg = dist(points[i-1].x, points[i-1].y, points[i].x, points[i].y);
      if (acc + seg >= target) {
        const localT = (target - acc) / seg;
        return {
          x: lerp(points[i-1].x, points[i].x, localT),
          y: lerp(points[i-1].y, points[i].y, localT)
        };
      }
      acc += seg;
    }
    return { x: points[points.length-1].x, y: points[points.length-1].y };
  }

  function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  function pointInCircle(px, py, cx, cy, r) {
    return distSq(px, py, cx, cy) <= r * r;
  }

  function lineCircleHit(x1, y1, x2, y2, cx, cy, r) {
    const dx = x2 - x1, dy = y2 - y1;
    const fx = x1 - cx, fy = y1 - cy;
    const a = dx*dx + dy*dy;
    const b = 2*(fx*dx + fy*dy);
    const c = fx*fx + fy*fy - r*r;
    let disc = b*b - 4*a*c;
    if (disc < 0) return false;
    disc = Math.sqrt(disc);
    const t1 = (-b - disc) / (2*a);
    const t2 = (-b + disc) / (2*a);
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
  }

  return {
    dist, distSq, lerp, clamp, angle,
    pathLength, positionOnPath,
    pointInRect, pointInCircle, lineCircleHit
  };
})();
