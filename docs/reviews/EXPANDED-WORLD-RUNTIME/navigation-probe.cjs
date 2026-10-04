"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// docs/reviews/EXPANDED-WORLD-RUNTIME/prototype/navigation.ts
var navigation_exports = {};
__export(navigation_exports, {
  bounds: () => bounds,
  heightAt: () => heightAt,
  moveWithinBath: () => moveWithinBath,
  obstacles: () => obstacles,
  position: () => position,
  walkPath: () => walkPath,
  walkable: () => walkable
});
module.exports = __toCommonJS(navigation_exports);

// docs/reviews/EXPANDED-WORLD-RUNTIME/prototype/bath-spatial.json
var bath_spatial_default = {
  schemaVersion: 2,
  assetId: "bath-expanded-w002",
  coordinates: {
    axes: "Y-up, +Z front street, -X service yard",
    units: "rough production units; not measured forensic dimensions",
    blenderMap: "(x,y,z) game -> (x,-z,y) Blender"
  },
  anchors: {
    arrival: {
      x: 0,
      y: 0,
      z: 10.5,
      layer: "ground"
    },
    bench: {
      x: 5.6,
      y: 0,
      z: 3,
      layer: "ground"
    },
    workshop: {
      x: -6.25,
      y: 0,
      z: -10,
      layer: "ground"
    },
    workshopDoorway: {
      x: -6.05,
      y: 0,
      z: -7.6,
      layer: "ground"
    },
    arrivalAdaApproach: {
      x: -3.5,
      y: 0,
      z: 8.4,
      layer: "ground"
    },
    cabinet: {
      x: -5.1,
      y: 0,
      z: -2,
      layer: "ground"
    },
    gallery: {
      x: 5.8,
      y: 2.66,
      z: -10.4,
      layer: "gallery"
    },
    gathering: {
      x: 1.8,
      y: 0,
      z: 8,
      layer: "ground"
    },
    waterChairs: {
      x: 5.45,
      y: 0,
      z: 6.8,
      layer: "ground"
    },
    frontInterior: {
      x: 0,
      y: 0,
      z: 12.4,
      layer: "ground"
    },
    frontThreshold: {
      x: 0,
      y: 0,
      z: 14,
      layer: "ground"
    },
    frontExterior: {
      x: 0,
      y: 0,
      z: 15.15,
      layer: "exterior"
    },
    exteriorSill: {
      x: -2.6,
      y: 0.47,
      z: 14.25,
      layer: "exterior"
    },
    laundryWaiting: {
      x: 0,
      y: 0,
      z: 23,
      layer: "exterior"
    },
    serviceInterior: {
      x: -8.9,
      y: 0,
      z: -5.95,
      layer: "ground"
    },
    serviceThreshold: {
      x: -10,
      y: 0,
      z: -5.95,
      layer: "ground"
    },
    yard: {
      x: -13.25,
      y: 0,
      z: -5.95,
      layer: "yard"
    },
    miriamBench: {
      x: 7.4,
      y: 0,
      z: 3,
      layer: "ground"
    },
    miriamEntrance: {
      x: 0.95,
      y: 0,
      z: 12.5,
      layer: "ground"
    },
    miriamStanding: {
      x: 6.6,
      y: 0,
      z: 3,
      layer: "ground"
    },
    adaWorkshop: {
      x: -8.5,
      y: 0,
      z: -10.1,
      layer: "ground"
    },
    simonGallery: {
      x: 6.3,
      y: 2.66,
      z: -11,
      layer: "gallery"
    },
    emmyWorkshop: {
      x: -7.25,
      y: 0,
      z: -10.1,
      layer: "ground"
    },
    ruthFront: {
      x: 1.5,
      y: 0,
      z: 11.8,
      layer: "ground"
    },
    testChair: {
      x: -5.92,
      y: 0,
      z: -2.32,
      layer: "ground"
    },
    cabinetPier: {
      x: -6.25,
      y: 0,
      z: -1.67,
      layer: "ground"
    }
  },
  surfaces: [
    {
      id: "bath-ground",
      layer: "ground",
      height: 0,
      minX: -9.35,
      maxX: 9.35,
      minZ: -13.3,
      maxZ: 13
    },
    {
      id: "gallery-north",
      layer: "gallery",
      height: 2.66,
      minX: -9.4,
      maxX: 9.35,
      minZ: -13.2,
      maxZ: -8.55
    },
    {
      id: "gallery-west",
      layer: "gallery",
      height: 2.66,
      minX: -9.35,
      maxX: -5.45,
      minZ: -8.55,
      maxZ: -1.5
    },
    {
      id: "front-pavement",
      layer: "exterior",
      height: 0,
      minX: -10.6,
      maxX: 10.6,
      minZ: 14.15,
      maxZ: 17.8
    },
    {
      id: "street",
      layer: "exterior",
      height: -0.07,
      minX: -14.6,
      maxX: 14.6,
      minZ: 17.8,
      maxZ: 22.2
    },
    {
      id: "laundry-pavement",
      layer: "exterior",
      height: 0,
      minX: -14.6,
      maxX: 14.6,
      minZ: 22.2,
      maxZ: 24.2
    },
    {
      id: "service-passage",
      layer: "yard",
      height: 0,
      minX: -11.85,
      maxX: -9.85,
      minZ: -7,
      maxZ: -4.9
    },
    {
      id: "service-yard",
      layer: "yard",
      height: 0,
      minX: -17,
      maxX: -11.85,
      minZ: -12.25,
      maxZ: -0.95
    }
  ],
  stairs: {
    root: "GalleryStairs",
    fromLayer: "ground",
    toLayer: "gallery",
    axis: "z",
    bottomZ: -2.8,
    topZ: -8.31,
    bottomY: 0,
    topY: 2.66,
    stepCount: 19,
    stepRise: 0.14,
    stepRun: 0.29,
    bottomLanding: {
      x: 6.3,
      y: 0,
      z: -2.55
    },
    topLanding: {
      x: 6.3,
      y: 2.66,
      z: -8.65
    },
    lateralEntry: "railings block side entry; connect only at top/bottom landings",
    minX: 5.55,
    maxX: 7.05,
    minZ: -8.31,
    maxZ: -2.8
  },
  doorGates: [
    {
      id: "front",
      root: "FrontDoor",
      axis: "z",
      coordinate: 14,
      opening: [
        -1.1,
        1.1
      ],
      fromLayer: "ground",
      toLayer: "exterior",
      traversal: "offered authored action only; no free walking experiment"
    },
    {
      id: "service",
      root: "ServiceDoor",
      axis: "x",
      coordinate: -10,
      opening: [
        -6.87,
        -5.03
      ],
      fromLayer: "ground",
      toLayer: "yard",
      traversal: "offered authored action only; no free walking experiment"
    }
  ],
  groundSolids: [
    {
      id: "pool",
      minX: -4.45,
      maxX: 4.45,
      minZ: -7.95,
      maxZ: 5.95
    },
    {
      id: "cabinet-body",
      minX: -7.55,
      maxX: -5.45,
      minZ: -4.25,
      maxZ: -2.45
    },
    {
      id: "cabinet-pier",
      minX: -6.68,
      maxX: -5.82,
      minZ: -2.1,
      maxZ: -1.24
    },
    {
      id: "worktable",
      minX: -8.99,
      maxX: -5.81,
      minZ: -12.74,
      maxZ: -10.86
    },
    {
      id: "workshop-sink",
      minX: -9.74,
      maxX: -8.06,
      minZ: -13.23,
      maxZ: -12.17
    },
    {
      id: "workshop-shelf",
      minX: -9.82,
      maxX: -8.78,
      minZ: -12.19,
      maxZ: -10.41
    },
    {
      id: "workshop-east-wall",
      minX: -5.42,
      maxX: -4.88,
      minZ: -13.7,
      maxZ: -8.25
    },
    {
      id: "workshop-front-left",
      minX: -10,
      maxX: -6.98,
      minZ: -8.57,
      maxZ: -8.03
    },
    {
      id: "workshop-front-right",
      minX: -5.3,
      maxX: -4.93,
      minZ: -8.57,
      maxZ: -8.03
    },
    {
      id: "workshop-open-door",
      minX: -7.13,
      maxX: -6.57,
      minZ: -8.58,
      maxZ: -6.48
    },
    {
      id: "spectators-bench",
      minX: 7.02,
      maxX: 8.45,
      minZ: 0.45,
      maxZ: 5.55
    },
    {
      id: "arrival-bucket",
      minX: -3.03,
      maxX: -1.97,
      minZ: 7.97,
      maxZ: 9.03
    },
    {
      id: "concrete-pier--8.6--11",
      minX: -9.03,
      maxX: -8.17,
      minZ: -11.43,
      maxZ: -10.57
    },
    {
      id: "concrete-pier--8.6--4",
      minX: -9.03,
      maxX: -8.17,
      minZ: -4.43,
      maxZ: -3.57
    },
    {
      id: "concrete-pier--8.6-4",
      minX: -9.03,
      maxX: -8.17,
      minZ: 3.57,
      maxZ: 4.43
    },
    {
      id: "concrete-pier--8.6-11",
      minX: -9.03,
      maxX: -8.17,
      minZ: 10.57,
      maxZ: 11.43
    },
    {
      id: "concrete-pier-8.6--11",
      minX: 8.17,
      maxX: 9.03,
      minZ: -11.43,
      maxZ: -10.57
    },
    {
      id: "concrete-pier-8.6--4",
      minX: 8.17,
      maxX: 9.03,
      minZ: -4.43,
      maxZ: -3.57
    },
    {
      id: "concrete-pier-8.6-4",
      minX: 8.17,
      maxX: 9.03,
      minZ: 3.57,
      maxZ: 4.43
    },
    {
      id: "concrete-pier-8.6-11",
      minX: 8.17,
      maxX: 9.03,
      minZ: 10.57,
      maxZ: 11.43
    }
  ],
  gallerySolids: [
    {
      id: "gallery-bench",
      minX: 7.02,
      maxX: 8.45,
      minZ: -13.05,
      maxZ: -7.95
    },
    {
      id: "recording-table",
      minX: 7.56,
      maxX: 9.64,
      minZ: -12.82,
      maxZ: -11.38
    },
    {
      id: "concrete-pier--8.6--11",
      minX: -9.03,
      maxX: -8.17,
      minZ: -11.43,
      maxZ: -10.57
    },
    {
      id: "concrete-pier--8.6--4",
      minX: -9.03,
      maxX: -8.17,
      minZ: -4.43,
      maxZ: -3.57
    },
    {
      id: "concrete-pier--8.6-4",
      minX: -9.03,
      maxX: -8.17,
      minZ: 3.57,
      maxZ: 4.43
    },
    {
      id: "concrete-pier--8.6-11",
      minX: -9.03,
      maxX: -8.17,
      minZ: 10.57,
      maxZ: 11.43
    },
    {
      id: "concrete-pier-8.6--11",
      minX: 8.17,
      maxX: 9.03,
      minZ: -11.43,
      maxZ: -10.57
    },
    {
      id: "concrete-pier-8.6--4",
      minX: 8.17,
      maxX: 9.03,
      minZ: -4.43,
      maxZ: -3.57
    },
    {
      id: "concrete-pier-8.6-4",
      minX: 8.17,
      maxX: 9.03,
      minZ: 3.57,
      maxZ: 4.43
    },
    {
      id: "concrete-pier-8.6-11",
      minX: 8.17,
      maxX: 9.03,
      minZ: 10.57,
      maxZ: 11.43
    }
  ],
  exteriorSolids: [],
  yardSolids: [
    {
      id: "yard-bin--10.6",
      minX: -17.365,
      maxX: -16.035,
      minZ: -11.265,
      maxZ: -9.934999999999999
    },
    {
      id: "yard-bin--8.8",
      minX: -17.365,
      maxX: -16.035,
      minZ: -9.465,
      maxZ: -8.135000000000002
    }
  ],
  cutawayRoots: {
    outerWalls: [
      "WestWall",
      "NorthWall"
    ],
    workshopWalls: [
      "WorkshopEastWall",
      "WorkshopSouthWallLeft",
      "WorkshopSouthWallRight",
      "WorkshopDoorLintel"
    ],
    roofs: [
      "WorkshopCeiling",
      "GalleryWestCatwalk",
      "ServicePassageRoof"
    ],
    yardWalls: [
      "ServiceYardWestWall",
      "ServiceYardNorthWall",
      "ServiceYardSouthWall"
    ],
    streetWalls: [
      "LaundryFacade"
    ],
    note: "hide near/facing geometry for the elevated follow camera; hidden geometry is not a clue"
  },
  cabinet: {
    root: "Cabinet",
    doorRoot: "CabinetDoor",
    hinge: {
      x: -7.15,
      y: 0,
      z: -2.81
    },
    doorWidth: 1.3,
    outwardAxis: "+Z",
    yawSign: -1,
    pierRoot: "CabinetGalleryPier",
    pier: [
      -6.25,
      0,
      -1.67
    ],
    testChair: [
      -5.92,
      0,
      -2.32
    ],
    chairBeforePier: true,
    mirrorFace: "inside, -Z when closed",
    note: "symbolic apparatus, no optical/impact simulation or measured dimension evidence"
  },
  actors: {
    roots: [
      "Blaise",
      "Ada",
      "Simon",
      "Miriam",
      "Emmy",
      "Ruth"
    ],
    parkedInitially: [
      "Emmy",
      "Ruth"
    ],
    miriamClone: "clone exact Miriam geometry/materials only when current player encounters co-presence; no separate exterior model or original/copy palette"
  },
  stagedProps: {
    PropPaddedTestChair: {
      anchor: "testChair",
      yaw: 0.55
    },
    PropSoundChair: {
      anchor: "miriamEntrance",
      yaw: 3.141592653589793
    },
    PropLooseChair: {
      anchor: "waterChairs",
      yaw: 0
    },
    PropWaterCup: {
      x: 6.6,
      y: 0.7,
      z: 3
    },
    PropBenchShoe: {
      x: 7.4,
      y: 0,
      z: 3.6
    },
    PropFootballBoot: {
      anchor: "frontInterior",
      yaw: 0
    },
    PropExteriorBearer: {
      anchor: "exteriorSill",
      yaw: 0
    },
    PropInteriorBearer: {
      x: -9.3,
      y: 0,
      z: -5.2,
      yaw: 0
    },
    PropWrappedGlass: {
      anchor: "serviceInterior",
      yaw: 1.5707963267948966
    },
    PropBindingTest: {
      x: -6.5,
      y: 0,
      z: -3.4
    }
  },
  visibilityRule: "staged actor/prop extras are hints for the renderer; root must hide until encountered; movement never acquires sources or NPC knowledge"
};

// docs/reviews/EXPANDED-WORLD-RUNTIME/prototype/navigation.ts
var bounds = bath_spatial_default.surfaces.find((surface) => surface.id === "bath-ground");
var obstacles = bath_spatial_default.groundSolids;
var inside = (point, box) => point.x >= box.minX && point.x <= box.maxX && point.z >= box.minZ && point.z <= box.maxZ;
var stairs = bath_spatial_default.stairs;
var stairBounds = { minX: stairs.minX, maxX: stairs.maxX, minZ: stairs.topLanding.z - 0.15, maxZ: stairs.bottomLanding.z + 0.15 };
var solids = { ground: bath_spatial_default.groundSolids, gallery: bath_spatial_default.gallerySolids, exterior: bath_spatial_default.exteriorSolids, yard: bath_spatial_default.yardSolids };
function heightAt(point, layer = point.layer ?? "ground") {
  if (layer === "stairs") return stairs.bottomY + Math.max(0, Math.min(1, (stairs.bottomZ - point.z) / (stairs.bottomZ - stairs.topZ))) * (stairs.topY - stairs.bottomY);
  return bath_spatial_default.surfaces.find((surface) => surface.layer === layer && inside(point, surface))?.height ?? 0;
}
function position(point, layer = point.layer ?? "ground") {
  return { x: point.x, z: point.z, layer, y: heightAt(point, layer) };
}
function walkable(point, layer = point.layer ?? "ground") {
  if (layer === "stairs") return inside(point, stairBounds);
  if (layer === "gallery" && inside(point, { ...stairBounds, maxZ: stairs.topZ })) return true;
  if (!bath_spatial_default.surfaces.some((surface) => surface.layer === layer && inside(point, surface))) return false;
  if (solids[layer].some((box) => inside(point, box))) return false;
  if (layer === "ground" && inside(point, { ...stairBounds, maxZ: stairs.bottomZ - 0.05 })) return false;
  return true;
}
function destination(from, to) {
  if (from.layer === "stairs") {
    if (to.z >= stairs.bottomZ && from.z >= stairs.bottomZ - 0.4 && walkable(to, "ground")) return position(to, "ground");
    if (to.z <= stairs.topZ && from.z <= stairs.topZ + 0.4 && walkable(to, "gallery")) return position(to, "gallery");
    return walkable(to, "stairs") ? position(to, "stairs") : void 0;
  }
  if (from.layer === "ground" && from.z >= stairs.bottomZ - 0.15 && to.z < stairs.bottomZ && inside(to, stairBounds)) return position(to, "stairs");
  if (from.layer === "gallery" && from.z <= stairs.topZ + 0.15 && to.z > stairs.topZ && inside(to, stairBounds)) return position(to, "stairs");
  return walkable(to, from.layer) ? position(to, from.layer) : void 0;
}
function moveWithinBath(from, delta) {
  let current = position(from);
  const count = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / 0.12));
  for (let i = 0; i < count; i++) {
    current = destination(current, { x: current.x + delta.x / count, z: current.z }) ?? current;
    current = destination(current, { x: current.x, z: current.z + delta.z / count }) ?? current;
  }
  return current;
}
var step = 0.5;
var key = (point) => `${point.layer}:${point.x},${point.z}`;
var distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function connected(from, to) {
  const moved = moveWithinBath(from, { x: to.x - from.x, z: to.z - from.z });
  return distance(moved, to) < 0.01 && (moved.layer === to.layer || moved.layer === "stairs" && to.layer === "gallery" && to.z <= stairs.topZ);
}
function walkPath(from, to) {
  const startPosition = position(from), target = position(to);
  if (!walkable(startPosition) || !walkable(target)) return [];
  const snapped = (p) => position({ x: Math.round(p.x / step) * step, z: Math.round(p.z / step) * step }, p.layer);
  const start = snapped(startPosition), goal = snapped(target);
  if (!walkable(start) || !walkable(goal) || !connected(startPosition, start) || !connected(goal, target)) return [];
  const queue = [start], parents = /* @__PURE__ */ new Map([[key(start), null]]);
  for (let index = 0; index < queue.length && index < 15e3; index++) {
    const current = queue[index];
    if (key(current) === key(goal)) {
      const result = [target];
      let at = current;
      while (at) {
        result.push(at);
        at = parents.get(key(at)) ?? null;
      }
      return result.reverse();
    }
    for (const [dx, dz] of [[0, -step], [step, 0], [0, step], [-step, 0]]) {
      const next = moveWithinBath(current, { x: dx, z: dz });
      if (distance(next, { x: current.x + dx, z: current.z + dz }) > 0.01) continue;
      next.x = Math.round(next.x / step) * step;
      next.z = Math.round(next.z / step) * step;
      if (parents.has(key(next))) continue;
      parents.set(key(next), current);
      queue.push(next);
    }
  }
  return [];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bounds,
  heightAt,
  moveWithinBath,
  obstacles,
  position,
  walkPath,
  walkable
});
