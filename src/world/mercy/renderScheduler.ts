/** A single outstanding frame, with no polling when the world is at rest. */
export interface FrameDriver {
 request: (callback: (now: number) => void) => number;
 cancel: (id: number) => void;
 now: () => number;
}
export function createRenderScheduler(driver: FrameDriver, tick: (dt: number) => boolean) {
 let frame: number | undefined, last = driver.now(), active = true, disposed = false, dirty = false;
 const run = (now: number) => {
  frame = undefined;
  if (disposed || !active) return;
  dirty = false;
  const dt = Math.max(0, Math.min((now - last) / 1000, .05));
  last = now;
  const continuing = tick(dt);
  if (continuing || dirty) request();
 };
 const request = () => {
  if (!disposed && active && frame === undefined) frame = driver.request(run);
 };
 return {
  wake() {
   if (disposed) return;
   dirty = true;
   if (frame === undefined) last = driver.now();
   request();
  },
  setActive(value: boolean) {
   if (disposed || value === active) return;
   active = value;
   if (!active && frame !== undefined) { driver.cancel(frame); frame = undefined; }
   if (active) { last = driver.now(); dirty = true; request(); }
  },
  dispose() {
   disposed = true;
   if (frame !== undefined) driver.cancel(frame);
   frame = undefined;
  },
 };
}
