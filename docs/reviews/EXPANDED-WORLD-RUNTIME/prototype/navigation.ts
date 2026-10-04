import spatial from './bath-spatial.json';

export interface Point { x: number; z: number; y?: number; layer?: Layer }
export type Layer = 'ground' | 'gallery' | 'stairs' | 'exterior' | 'yard';
export interface Position extends Point { y: number; layer: Layer }
interface Box { minX: number; maxX: number; minZ: number; maxZ: number }
export const bounds = spatial.surfaces.find(surface => surface.id === 'bath-ground')!;
export const obstacles = spatial.groundSolids;
const inside = (point: Point, box: Box) => point.x >= box.minX && point.x <= box.maxX && point.z >= box.minZ && point.z <= box.maxZ;
const stairs = spatial.stairs;
// Landing overlap connects each floor to the stairs, never one floor to another by X/Z.
const stairBounds = { minX: stairs.minX, maxX: stairs.maxX, minZ: stairs.topLanding.z - .15, maxZ: stairs.bottomLanding.z + .15 };
const solids = { ground: spatial.groundSolids, gallery: spatial.gallerySolids, exterior: spatial.exteriorSolids, yard: spatial.yardSolids };
export function heightAt(point: Point, layer: Layer = point.layer ?? 'ground'): number {
  if (layer === 'stairs') return stairs.bottomY + Math.max(0, Math.min(1, (stairs.bottomZ - point.z) / (stairs.bottomZ - stairs.topZ))) * (stairs.topY - stairs.bottomY);
  return spatial.surfaces.find(surface => surface.layer === layer && inside(point, surface))?.height ?? 0;
}
export function position(point: Point, layer: Layer = point.layer ?? 'ground'): Position {
  return { x: point.x, z: point.z, layer, y: heightAt(point, layer) };
}
export function walkable(point: Point, layer: Layer = point.layer ?? 'ground'): boolean {
  if (layer === 'stairs') return inside(point, stairBounds);
  if (layer === 'gallery' && inside(point, { ...stairBounds, maxZ:stairs.topZ })) return true;
  if (!spatial.surfaces.some(surface => surface.layer === layer && inside(point, surface))) return false;
  if (solids[layer].some(box => inside(point, box))) return false;
  // The sloping flight and its railings cannot be entered sideways from beneath it.
  if (layer === 'ground' && inside(point, { ...stairBounds, maxZ: stairs.bottomZ - .05 })) return false;
  return true;
}
function destination(from: Position, to: Point): Position | undefined {
  if (from.layer === 'stairs') {
    if (to.z >= stairs.bottomZ && from.z >= stairs.bottomZ - .4 && walkable(to, 'ground')) return position(to, 'ground');
    if (to.z <= stairs.topZ && from.z <= stairs.topZ + .4 && walkable(to, 'gallery')) return position(to, 'gallery');
    return walkable(to, 'stairs') ? position(to, 'stairs') : undefined;
  }
  if (from.layer === 'ground' && from.z >= stairs.bottomZ - .15 && to.z < stairs.bottomZ && inside(to, stairBounds)) return position(to, 'stairs');
  if (from.layer === 'gallery' && from.z <= stairs.topZ + .15 && to.z > stairs.topZ && inside(to, stairBounds)) return position(to, 'stairs');
  return walkable(to, from.layer) ? position(to, from.layer) : undefined;
}
/** Substeps prevent a large keyboard delta tunnelling through a wall. Doors do not connect layers. */
export function moveWithinBath(from: Point, delta: Point): Position {
  let current = position(from);
  const count = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / .12));
  for (let i = 0; i < count; i++) {
    current = destination(current, { x: current.x + delta.x / count, z: current.z }) ?? current;
    current = destination(current, { x: current.x, z: current.z + delta.z / count }) ?? current;
  }
  return current;
}
const step = .5;
const key = (point: Position) => `${point.layer}:${point.x},${point.z}`;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
function connected(from: Position, to: Position): boolean {
  const moved = moveWithinBath(from, { x: to.x - from.x, z: to.z - from.z });
  return distance(moved, to) < .01 && (moved.layer === to.layer || (moved.layer === 'stairs' && to.layer === 'gallery' && to.z <= stairs.topZ));
}
/** Bounded BFS over actual floor layers; no front/service-door edge exists. */
export function walkPath(from: Point, to: Point): Position[] {
  const startPosition = position(from), target = position(to);
  if (!walkable(startPosition) || !walkable(target)) return [];
  const snapped = (p: Position) => position({ x: Math.round(p.x / step) * step, z: Math.round(p.z / step) * step }, p.layer);
  const start = snapped(startPosition), goal = snapped(target);
  if (!walkable(start) || !walkable(goal) || !connected(startPosition, start) || !connected(goal, target)) return [];
  const queue = [start], parents = new Map<string, Position | null>([[key(start), null]]);
  for (let index = 0; index < queue.length && index < 15000; index++) {
    const current = queue[index];
    if (key(current) === key(goal)) {
      const result: Position[] = [target];
      let at: Position | null = current;
      while (at) { result.push(at); at = parents.get(key(at)) ?? null; }
      return result.reverse();
    }
    for (const [dx, dz] of [[0, -step], [step, 0], [0, step], [-step, 0]]) {
      const next = moveWithinBath(current, { x: dx, z: dz });
      if (distance(next, { x: current.x + dx, z: current.z + dz }) > .01) continue;
      // Canonical grid coordinates avoid floating-point duplicate nodes.
      next.x = Math.round(next.x / step) * step; next.z = Math.round(next.z / step) * step;
      if (parents.has(key(next))) continue;
      parents.set(key(next), current); queue.push(next);
    }
  }
  return [];
}
