/** Local navigation only. A profile never includes adjacent authored story locations. */
export interface Point { x: number; z: number }
export interface Rectangle { minX: number; maxX: number; minZ: number; maxZ: number }
export interface NavigationArea { bounds: Rectangle; obstacles: readonly Rectangle[] }
const inside = (point: Point, box: Rectangle) => point.x >= box.minX && point.x <= box.maxX && point.z >= box.minZ && point.z <= box.maxZ;
export function walkable(area: NavigationArea, point: Point): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.z) && inside(point, area.bounds) && !area.obstacles.some(box => inside(point, box));
}
/** Substeps prevent keyboard frame gaps or large callers from tunnelling through gates. */
export function moveWithinArea(area: NavigationArea, from: Point, delta: Point): Point {
  if (!walkable(area, from) || !Number.isFinite(delta.x) || !Number.isFinite(delta.z)) return { ...from };
  const count = Math.ceil(Math.max(Math.abs(delta.x), Math.abs(delta.z)) / 0.08);
  if (!count || count > 10000) return { ...from };
  const point = { ...from };
  for (let index = 0; index < count; index++) {
    const x = point.x + delta.x / count, z = point.z + delta.z / count;
    if (walkable(area, { x, z: point.z })) point.x = x;
    if (walkable(area, { x: point.x, z })) point.z = z;
  }
  return point;
}
const segmentClear = (area: NavigationArea, from: Point, to: Point) => {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.06));
  for (let index = 0; index <= steps; index++) {
    if (!walkable(area, { x: from.x + (to.x - from.x) * index / steps, z: from.z + (to.z - from.z) * index / steps })) return false;
  }
  return true;
};
/** Bounded breadth-first route, forbidding corner cuts and blocked final segments. */
export function walkPath(area: NavigationArea, from: Point, to: Point): Point[] {
  if (!walkable(area, from) || !walkable(area, to)) return [];
  if (segmentClear(area, from, to)) return [{ ...to }];
  const step = 0.4;
  const snap = (point: Point) => ({ x: Math.round(point.x / step) * step, z: Math.round(point.z / step) * step });
  const start = snap(from), goal = snap(to);
  if (!segmentClear(area, from, start) || !segmentClear(area, goal, to)) return [];
  const key = (point: Point) => `${Math.round(point.x / step)},${Math.round(point.z / step)}`;
  const queue = [start], parents = new Map<string, Point | null>([[key(start), null]]);
  for (let index = 0; index < queue.length && index < 6000; index++) {
    const current = queue[index];
    if (key(current) === key(goal)) {
      const route: Point[] = [to]; let at: Point | null = current;
      while (at) { route.push(at); at = parents.get(key(at)) ?? null; }
      return route.reverse();
    }
    for (const [dx, dz] of [[0,-step],[step,0],[0,step],[-step,0],[step,step],[-step,step],[step,-step],[-step,-step]]) {
      const next = { x: current.x + dx, z: current.z + dz };
      if (parents.has(key(next)) || !walkable(area, next) || !walkable(area, {x:next.x,z:current.z}) || !walkable(area, {x:current.x,z:next.z}) || !segmentClear(area, current, next)) continue;
      parents.set(key(next), current); queue.push(next);
    }
  }
  return [];
}
