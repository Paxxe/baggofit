import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { smoothGeometry, type ToonKit } from "./toon-kit";

export const PALETTE = {
  coral: "#ff6a3d",
  coralLight: "#ff9168",
  coralDeep: "#e24f2b",
  interior: "#4a1d14",
  strap: "#232a52",
  webbing: "#2b3363",
  buckle: "#3a4380",
  mint: "#3f6bff",
  mintDeep: "#2a4fd6",
  lime: "#ffc531",
  cream: "#fff3dc",
  blue: "#2d5bff",
  teal: "#1f3a8a",
  mustard: "#ffc531",
  peach: "#ff9ec0",
} as const;

/* ------------------------------------------------------------------ geometry helpers */

interface PillowOptions {
  /** outward bulge of the +z face */
  bulge?: number;
  /** narrows the top (fraction of width) */
  taper?: number;
  /** bends the edges back on z (wraps around a curved surface) */
  wrap?: number;
  /** dome on the +y face */
  dome?: number;
}

function pillowBox(width: number, height: number, depth: number, radius: number, options: PillowOptions = {}, segments = 6) {
  const { bulge = 0, taper = 0, wrap = 0, dome = 0 } = options;
  const geometry = new RoundedBoxGeometry(width, height, depth, segments, radius);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    const ny = vertex.y / (height / 2);
    const nz = vertex.z / (depth / 2);
    vertex.x *= 1 - taper * (ny + 1) * 0.5;
    const nx = THREE.MathUtils.clamp(vertex.x / (width / 2), -1, 1);
    if (vertex.z > 0) vertex.z += bulge * (1 - nx * nx) * (1 - ny * ny) * nz;
    vertex.z -= wrap * nx * nx;
    if (vertex.y > 0) vertex.y += dome * (1 - nx * nx) * (1 - nz * nz) * ny;
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  return smoothGeometry(geometry);
}

const rbox = (width: number, height: number, depth: number, radius: number, segments = 4) =>
  smoothGeometry(new RoundedBoxGeometry(width, height, depth, segments, Math.min(radius, width / 2, height / 2, depth / 2) * 0.999));

/**
 * Sweeps a rounded-rectangle profile along a curve (padded straps, webbing, handles).
 * Returns the geometry plus a helper to place things (stitches, buckles) on the strap.
 */
function sweepStrap(points: THREE.Vector3[], width: number | ((t: number) => number), thickness: number, sideHint = new THREE.Vector3(1, 0, 0), segments = 48) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const ringSize = 18;
  const widthAt = typeof width === "number" ? () => width : width;
  const vertices: number[] = [];
  const indices: number[] = [];
  const frames: { point: THREE.Vector3; side: THREE.Vector3; normal: THREE.Vector3; width: number }[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = sideHint.clone().sub(tangent.clone().multiplyScalar(sideHint.dot(tangent))).normalize();
    const normal = new THREE.Vector3().crossVectors(side, tangent).normalize();
    const w = widthAt(t);
    frames.push({ point, side, normal, width: w });
    for (let k = 0; k < ringSize; k += 1) {
      const angle = (k / ringSize) * Math.PI * 2;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const x = Math.sign(c) * Math.pow(Math.abs(c), 0.35) * (w / 2);
      const y = Math.sign(s) * Math.pow(Math.abs(s), 0.35) * (thickness / 2);
      vertices.push(point.x + side.x * x + normal.x * y, point.y + side.y * x + normal.y * y, point.z + side.z * x + normal.z * y);
    }
  }
  for (let i = 0; i < segments; i += 1) {
    for (let k = 0; k < ringSize; k += 1) {
      const a = i * ringSize + k;
      const b = (i + 1) * ringSize + k;
      const c = i * ringSize + ((k + 1) % ringSize);
      const d = (i + 1) * ringSize + ((k + 1) % ringSize);
      indices.push(a, b, c, b, d, c);
    }
  }
  const startCenter = vertices.length / 3;
  vertices.push(...frames[0].point.toArray());
  const endCenter = startCenter + 1;
  vertices.push(...frames[segments].point.toArray());
  for (let k = 0; k < ringSize; k += 1) {
    const next = (k + 1) % ringSize;
    indices.push(startCenter, k, next);
    indices.push(endCenter, segments * ringSize + next, segments * ringSize + k);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  /** point on the strap surface: u across the width (-1..1), outward face. */
  const surfacePoints = (u: number, lift = 0.012, from = 0, to = 1) =>
    frames
      .filter((_, i) => i / segments >= from && i / segments <= to)
      .map(({ point, side, normal, width: w }) => point.clone().addScaledVector(side, u * (w / 2)).addScaledVector(normal, thickness / 2 + lift));

  return { geometry, frames, surfacePoints, curve };
}

function roundedRectPoints(halfWidth: number, halfHeight: number, radius: number, surfaceZ: (x: number, y: number) => number, lift = 0.012) {
  const points: THREE.Vector3[] = [];
  const corners: [number, number, number][] = [
    [halfWidth - radius, halfHeight - radius, 0],
    [-(halfWidth - radius), halfHeight - radius, Math.PI / 2],
    [-(halfWidth - radius), -(halfHeight - radius), Math.PI],
    [halfWidth - radius, -(halfHeight - radius), Math.PI * 1.5],
  ];
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= 5; i += 1) {
      const angle = start + (i / 5) * (Math.PI / 2);
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, surfaceZ(x, y) + lift));
    }
  }
  return points;
}

/* ------------------------------------------------------------------ the backpack */

export interface ToonBackpack {
  /** origin at the bottom centre of the bag */
  root: THREE.Group;
  /** body-centred group; carried items should be parented here */
  body: THREE.Group;
  lid: THREE.Group;
  /** swinging bits: the luggage tag and the zipper pulls */
  tag: THREE.Group;
  pulls: THREE.Group[];
  /** body-space anchors */
  opening: THREE.Vector3;
  sidePocket: THREE.Vector3;
  /** total height of the bag from the floor */
  height: number;
}

const BODY = { width: 2, height: 2.5, depth: 0.95, radius: 0.42, bulge: 0.13, taper: 0.09 };

/** z of the body's front surface at (x, y), matching pillowBox's deformation. */
function bodyFrontZ(x: number, y: number) {
  const ny = y / (BODY.height / 2);
  const halfWidth = (BODY.width / 2) * (1 - BODY.taper * (ny + 1) * 0.5);
  const nx = THREE.MathUtils.clamp(x / halfWidth, -1, 1);
  return BODY.depth / 2 + BODY.bulge * (1 - nx * nx) * (1 - ny * ny);
}

export function createToonBackpack(kit: ToonKit): ToonBackpack {
  const { toon, mesh, stitch } = kit;
  const root = new THREE.Group();
  const body = new THREE.Group();
  body.position.y = 1.31;
  root.add(body);

  const shell = toon(PALETTE.coral);
  const shellLight = toon(PALETTE.coralLight);
  const shellDeep = toon(PALETTE.coralDeep);
  const strapMat = toon(PALETTE.strap, { hatch: 1.3 });
  const webbingMat = toon(PALETTE.webbing, { hatch: 0.6 });
  const buckleMat = toon(PALETTE.buckle, { gloss: 0.7, hatch: 0.5 });
  const mintMat = toon(PALETTE.mint);
  const mintDeepMat = toon(PALETTE.mintDeep, { hatch: 1.4 });
  const limeMat = toon(PALETTE.lime, { gloss: 0.3, hatch: 0.6 });
  const zipperMat = toon(PALETTE.strap, { gloss: 0.6, hatch: 0 });

  /* main body */
  const mainBody = mesh(pillowBox(BODY.width, BODY.height, BODY.depth, BODY.radius, { bulge: BODY.bulge, taper: BODY.taper }, 8), shell);
  body.add(mainBody);

  /* reinforced base */
  const base = mesh(pillowBox(2.04, 0.4, 1.02, 0.17, { bulge: 0.02 }), webbingMat);
  base.position.y = -1.1;
  body.add(base);
  body.add(stitch(roundedRectPoints(0.84, 0.12, 0.08, () => 0, 0).map((p) => new THREE.Vector3(p.x, p.y - 1.06, 0.52 + 0.02 * (1 - (p.x / 0.9) ** 2))), { closed: true, color: PALETTE.mint, dash: 0.07 }));

  /* side seams (piping) */
  for (const s of [-1, 1]) {
    const seam: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i += 1) {
      const y = -0.85 + (i / 12) * 1.75;
      const ny = y / (BODY.height / 2);
      const halfWidth = (BODY.width / 2) * (1 - BODY.taper * (ny + 1) * 0.5);
      seam.push(new THREE.Vector3(s * (halfWidth - 0.17), y, 0.41 + 0.02 * (1 - ny * ny)));
    }
    body.add(stitch(seam, { color: PALETTE.cream, dash: 0.08 }));
  }

  /* back panel with padding */
  const backPanel = mesh(rbox(1.65, 1.9, 0.16, 0.12), strapMat);
  backPanel.position.set(0, 0, -0.54);
  body.add(backPanel);
  for (const s of [-1, 1]) {
    const pad = mesh(pillowBox(0.62, 0.72, 0.13, 0.06, { dome: 0.02 }), mintDeepMat, "thin");
    pad.position.set(s * 0.38, 0.38, -0.66);
    pad.rotation.y = Math.PI;
    body.add(pad);
  }
  const lumbar = mesh(pillowBox(1.3, 0.42, 0.13, 0.06), mintDeepMat, "thin");
  lumbar.position.set(0, -0.56, -0.66);
  lumbar.rotation.y = Math.PI;
  body.add(lumbar);

  /* haul handle */
  const haul = sweepStrap(
    [new THREE.Vector3(-0.26, 0.8, -0.63), new THREE.Vector3(-0.2, 1.0, -0.7), new THREE.Vector3(0, 1.08, -0.74), new THREE.Vector3(0.2, 1.0, -0.7), new THREE.Vector3(0.26, 0.8, -0.63)],
    0.15,
    0.05,
    new THREE.Vector3(0, 0, 1),
    32,
  );
  body.add(mesh(haul.geometry, webbingMat, "thin"));

  /* padded shoulder straps, webbing, adjusters and sternum strap */
  for (const s of [-1, 1]) {
    const strap = sweepStrap(
      [
        new THREE.Vector3(s * 0.36, 0.92, -0.6),
        new THREE.Vector3(s * 0.44, 0.84, -0.86),
        new THREE.Vector3(s * 0.54, 0.42, -0.98),
        new THREE.Vector3(s * 0.62, -0.15, -0.96),
        new THREE.Vector3(s * 0.68, -0.6, -0.84),
        new THREE.Vector3(s * 0.72, -0.82, -0.7),
      ],
      (t) => 0.2 + 0.17 * Math.sin(Math.PI * Math.min(1, t * 1.1)),
      0.11,
    );
    body.add(mesh(strap.geometry, strapMat));
    body.add(stitch(strap.surfacePoints(0.72, 0.01, 0.04, 0.96), { color: PALETTE.mint }));
    body.add(stitch(strap.surfacePoints(-0.72, 0.01, 0.04, 0.96), { color: PALETTE.mint }));

    const lower = sweepStrap([new THREE.Vector3(s * 0.72, -0.8, -0.7), new THREE.Vector3(s * 0.76, -0.98, -0.66), new THREE.Vector3(s * 0.8, -1.14, -0.56)], 0.12, 0.03, new THREE.Vector3(1, 0, 0), 16);
    body.add(mesh(lower.geometry, webbingMat, "thin"));
    const tail = sweepStrap([new THREE.Vector3(s * 0.7, -0.84, -0.76), new THREE.Vector3(s * 0.66, -1.0, -0.82), new THREE.Vector3(s * 0.67, -1.18, -0.8)], 0.11, 0.025, new THREE.Vector3(1, 0, 0), 16);
    body.add(mesh(tail.geometry, webbingMat, "thin"));
    const adjuster = mesh(rbox(0.2, 0.1, 0.07, 0.03), buckleMat, "thin");
    adjuster.position.set(s * 0.71, -0.82, -0.76);
    body.add(adjuster);
  }
  const sternum = mesh(rbox(1.12, 0.07, 0.03, 0.014), webbingMat, "thin");
  sternum.position.set(0, 0.3, -1.04);
  body.add(sternum);
  const sternumBuckle = mesh(rbox(0.2, 0.13, 0.07, 0.03), limeMat, "thin");
  sternumBuckle.position.set(0, 0.3, -1.07);
  body.add(sternumBuckle);

  /* side pockets + compression straps */
  for (const s of [-1, 1]) {
    const pocket = mesh(pillowBox(0.3, 0.88, 0.82, 0.13, { dome: 0.02 }), mintMat);
    pocket.position.set(s * 1.02, -0.66, 0.02);
    body.add(pocket);
    const band = mesh(rbox(0.33, 0.1, 0.85, 0.05), mintDeepMat, "thin");
    band.position.set(s * 1.02, -0.26, 0.02);
    body.add(band);
    const pocketSeam: THREE.Vector3[] = [];
    for (let i = 0; i <= 10; i += 1) {
      const z = -0.3 + (i / 10) * 0.64;
      pocketSeam.push(new THREE.Vector3(s * 1.185, -0.4, z));
    }
    body.add(stitch(pocketSeam, { color: PALETTE.cream }));

    const y = 0.3;
    const ny = y / (BODY.height / 2);
    const centerX = (BODY.width / 2) * (1 - BODY.taper * (ny + 1) * 0.5) - BODY.radius;
    const around: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i += 1) {
      const theta = -1.25 + (i / 12) * 2.5;
      const zOffset = 0.055 * THREE.MathUtils.clamp(theta * 4, -1, 1);
      around.push(new THREE.Vector3(s * (centerX + Math.cos(theta) * 0.455), y, zOffset + Math.sin(theta) * 0.455 + (theta > 0 ? 0.03 : 0)));
    }
    const compression = sweepStrap(around, 0.13, 0.035, new THREE.Vector3(0, 1, 0), 24);
    body.add(mesh(compression.geometry, webbingMat, "thin"));
    const buckle = mesh(rbox(0.08, 0.19, 0.17, 0.035), buckleMat, "thin");
    buckle.position.set(s * (centerX + 0.48), y, 0.02);
    body.add(buckle);
  }

  /* luggage tag on the left compression strap */
  const tag = new THREE.Group();
  tag.position.set(-1.0, 0.24, 0.02);
  body.add(tag);
  const ring = mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 20), buckleMat, "thin");
  ring.rotation.y = Math.PI / 2;
  ring.position.y = -0.05;
  tag.add(ring);
  const tagBody = mesh(rbox(0.035, 0.36, 0.25, 0.016), toon(PALETTE.blue), "bold");
  tagBody.position.set(-0.02, -0.29, 0);
  tag.add(tagBody);
  const label = mesh(rbox(0.012, 0.15, 0.17, 0.006), toon(PALETTE.cream, { hatch: 0.3 }), "none");
  label.position.set(-0.042, -0.32, 0);
  tag.add(label);
  tag.add(stitch([new THREE.Vector3(-0.05, -0.26, -0.065), new THREE.Vector3(-0.05, -0.26, 0.065)], { color: PALETTE.blue, radius: 0.008, dash: 0.04 }));
  tag.add(stitch([new THREE.Vector3(-0.05, -0.3, -0.065), new THREE.Vector3(-0.05, -0.3, 0.04)], { color: PALETTE.blue, radius: 0.008, dash: 0.04 }));

  /* front pocket with zipper and pull */
  const pocketGroup = new THREE.Group();
  pocketGroup.position.set(0, -0.6, 0.68);
  body.add(pocketGroup);
  const pocketShape = { width: 1.42, height: 0.86, depth: 0.26, radius: 0.2, bulge: 0.09, wrap: 0.08 };
  pocketGroup.add(mesh(pillowBox(pocketShape.width, pocketShape.height, pocketShape.depth, pocketShape.radius, { bulge: pocketShape.bulge, wrap: pocketShape.wrap }), shellLight));
  const pocketFrontZ = (x: number, y: number) => {
    const nx = THREE.MathUtils.clamp(x / (pocketShape.width / 2), -1, 1);
    const ny = THREE.MathUtils.clamp(y / (pocketShape.height / 2), -1, 1);
    return pocketShape.depth / 2 + pocketShape.bulge * (1 - nx * nx) * (1 - ny * ny) - pocketShape.wrap * nx * nx;
  };
  pocketGroup.add(stitch(roundedRectPoints(0.6, 0.34, 0.14, pocketFrontZ, 0.004), { closed: true, color: PALETTE.cream }));
  const zipperPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 16; i += 1) {
    const x = -0.5 + (i / 16) * 1.0;
    const y = 0.17 + 0.04 * (1 - (x / 0.5) ** 2);
    zipperPoints.push(new THREE.Vector3(x, y, pocketFrontZ(x, y) + 0.004));
  }
  pocketGroup.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(zipperPoints), 40, 0.024, 6, false), zipperMat, "none"));
  pocketGroup.add(stitch(zipperPoints.map((p) => p.clone().add(new THREE.Vector3(0, 0.002, 0.012))), { color: PALETTE.lime, radius: 0.012, dash: 0.03 }));

  const makePull = (color: THREE.Material) => {
    const pull = new THREE.Group();
    const loop = mesh(new THREE.TorusGeometry(0.035, 0.012, 8, 16), buckleMat, "none");
    loop.position.y = -0.03;
    pull.add(loop);
    const pullTab = mesh(rbox(0.075, 0.17, 0.03, 0.013), color, "thin");
    pullTab.position.y = -0.14;
    pull.add(pullTab);
    return pull;
  };
  const pocketPull = makePull(limeMat);
  pocketPull.position.copy(zipperPoints[11]).add(new THREE.Vector3(0, 0, 0.03));
  pocketGroup.add(pocketPull);

  /* buckle anchors on the body (female halves) */
  for (const s of [-1, 1]) {
    const y = -0.02;
    const z = bodyFrontZ(s * 0.52, y);
    const female = mesh(rbox(0.22, 0.14, 0.08, 0.03), buckleMat, "thin");
    female.position.set(s * 0.52, y, z + 0.035);
    body.add(female);
    const webbing = mesh(rbox(0.16, 0.2, 0.03, 0.012), webbingMat, "thin");
    webbing.position.set(s * 0.52, -0.16, bodyFrontZ(s * 0.52, -0.16) + 0.06);
    body.add(webbing);
  }

  /* drawstring collar and interior (visible when the lid opens) */
  const collarProfile = [
    new THREE.Vector2(0.44, -0.12),
    new THREE.Vector2(0.52, -0.12),
    new THREE.Vector2(0.54, 0.0),
    new THREE.Vector2(0.53, 0.11),
    new THREE.Vector2(0.49, 0.14),
    new THREE.Vector2(0.45, 0.12),
    new THREE.Vector2(0.44, 0.0),
    new THREE.Vector2(0.44, -0.12),
  ];
  const collar = mesh(smoothGeometry(new THREE.LatheGeometry(collarProfile, 40)), shellDeep);
  collar.scale.set(1.72, 1, 0.82);
  collar.position.y = 1.18;
  body.add(collar);
  const interior = mesh(new THREE.CircleGeometry(0.46, 40), toon(PALETTE.interior, { hatch: 1.8 }), "none");
  interior.rotation.x = -Math.PI / 2;
  interior.scale.set(1.72, 0.82, 1);
  interior.position.y = 1.22;
  body.add(interior);
  const cordPoints: THREE.Vector3[] = [];
  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2;
    cordPoints.push(new THREE.Vector3(Math.cos(angle) * 0.92, 1.28, Math.sin(angle) * 0.445));
  }
  body.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPoints, true), 48, 0.022, 6, true), toon(PALETTE.cream, { hatch: 0.4 }), "none"));
  const cordLock = mesh(rbox(0.09, 0.15, 0.09, 0.04), limeMat, "thin");
  cordLock.position.set(0.2, 1.24, 0.47);
  body.add(cordLock);

  /* the lid: hinged at the back, drapes over the front */
  const lid = new THREE.Group();
  lid.position.set(0, 1.3, -0.48);
  body.add(lid);
  const toLid = (x: number, y: number, z: number) => new THREE.Vector3(x - lid.position.x, y - lid.position.y, z - lid.position.z);

  const lidCap = mesh(pillowBox(2.0, 0.3, 1.2, 0.15, { dome: 0.1 }), shell);
  lidCap.position.copy(toLid(0, 1.34, 0.12));
  lid.add(lidCap);
  lid.add(stitch(roundedRectPoints(0.86, 0.46, 0.12, () => 0, 0).map((p) => {
    const nx = p.x / 1.0;
    const nz = -p.y / 0.6;
    return toLid(p.x, 1.34 + 0.15 + 0.1 * (1 - nx * nx) * (1 - nz * nz) + 0.012, 0.12 + -p.y);
  }), { closed: true, color: PALETTE.cream }));

  const drapeShape = { width: 1.74, height: 0.9, depth: 0.16, bulge: 0.05, wrap: 0.07 };
  const drape = mesh(pillowBox(drapeShape.width, drapeShape.height, drapeShape.depth, 0.08, { bulge: drapeShape.bulge, wrap: drapeShape.wrap }), shell);
  const drapeCenter = new THREE.Vector3(0, 0.84, 0.63);
  drape.position.copy(toLid(drapeCenter.x, drapeCenter.y, drapeCenter.z));
  lid.add(drape);
  const drapeFrontZ = (x: number, y: number) => {
    const nx = THREE.MathUtils.clamp(x / (drapeShape.width / 2), -1, 1);
    const ny = THREE.MathUtils.clamp(y / (drapeShape.height / 2), -1, 1);
    return drapeShape.depth / 2 + drapeShape.bulge * (1 - nx * nx) * (1 - ny * ny) - drapeShape.wrap * nx * nx;
  };
  const drapeStitch = stitch(roundedRectPoints(0.78, 0.36, 0.1, drapeFrontZ, 0.004), { closed: true, color: PALETTE.cream });
  drapeStitch.position.copy(drape.position);
  lid.add(drapeStitch);

  const patch = mesh(rbox(0.5, 0.26, 0.04, 0.02), limeMat, "thin");
  patch.position.copy(drape.position).add(new THREE.Vector3(0, 0.08, drapeFrontZ(0, 0.08) + 0.012));
  lid.add(patch);
  const patchStitch = stitch(roundedRectPoints(0.2, 0.09, 0.04, () => 0, 0), { closed: true, color: PALETTE.strap, radius: 0.008, dash: 0.035 });
  patchStitch.position.copy(patch.position).add(new THREE.Vector3(0, 0, 0.022));
  lid.add(patchStitch);
  // Tiny embroidered mountain + sun on the patch.
  const emblem = stitch([new THREE.Vector3(-0.12, -0.05, 0), new THREE.Vector3(-0.03, 0.05, 0), new THREE.Vector3(0.02, -0.0, 0), new THREE.Vector3(0.06, 0.03, 0), new THREE.Vector3(0.12, -0.05, 0)], { color: PALETTE.strap, radius: 0.009, dash: 0.02 });
  emblem.position.copy(patchStitch.position).add(new THREE.Vector3(0, 0, 0.002));
  lid.add(emblem);

  // Lid straps + male buckle halves (they lift with the lid).
  for (const s of [-1, 1]) {
    const strapTop = new THREE.Vector3(s * 0.52, 0.62, drapeCenter.z + drapeFrontZ(s * 0.52, -0.22) + 0.012);
    const strapBottom = new THREE.Vector3(s * 0.52, 0.1, bodyFrontZ(s * 0.52, 0.1) + 0.06);
    const lidStrap = sweepStrap([toLid(strapTop.x, strapTop.y, strapTop.z), toLid(s * 0.52, 0.38, (strapTop.z + strapBottom.z) / 2 + 0.01), toLid(strapBottom.x, strapBottom.y, strapBottom.z)], 0.15, 0.03, new THREE.Vector3(1, 0, 0), 12);
    lid.add(mesh(lidStrap.geometry, webbingMat, "thin"));
    const male = mesh(rbox(0.2, 0.16, 0.07, 0.03), buckleMat, "thin");
    male.position.copy(toLid(s * 0.52, 0.1, bodyFrontZ(s * 0.52, 0.1) + 0.055));
    lid.add(male);
  }

  /* zipper pull hanging from the lid's side zip (more secondary motion) */
  const lidPull = makePull(toon(PALETTE.mint));
  lidPull.position.copy(toLid(0.78, 1.22, 0.7));
  lid.add(lidPull);

  return {
    root,
    body,
    lid,
    tag,
    pulls: [pocketPull, lidPull],
    opening: new THREE.Vector3(0, 1.28, 0),
    sidePocket: new THREE.Vector3(1.04, -0.38, 0.06),
    height: 1.31 + 1.6,
  };
}

/* ------------------------------------------------------------------ props */

export function createTravelItems(kit: ToonKit) {
  const { toon, mesh, stitch } = kit;

  const notebook = new THREE.Group();
  notebook.add(mesh(rbox(0.5, 0.66, 0.1, 0.04), toon(PALETTE.mustard)));
  const pages = mesh(rbox(0.46, 0.62, 0.08, 0.02), toon(PALETTE.cream, { hatch: 0.4 }), "thin");
  pages.position.x = 0.035;
  notebook.add(pages);
  const elastic = mesh(rbox(0.035, 0.68, 0.12, 0.015), toon(PALETTE.strap), "none");
  elastic.position.x = 0.17;
  notebook.add(elastic);

  const headphones = new THREE.Group();
  headphones.add(mesh(smoothGeometry(new THREE.TorusGeometry(0.23, 0.04, 10, 32, Math.PI)), toon(PALETTE.strap, { gloss: 0.4 })));
  for (const s of [-1, 1]) {
    const cup = mesh(rbox(0.11, 0.22, 0.22, 0.09), toon(PALETTE.mint, { gloss: 0.5 }));
    cup.position.set(s * 0.23, -0.03, 0);
    headphones.add(cup);
  }

  const passport = new THREE.Group();
  passport.add(mesh(rbox(0.34, 0.46, 0.05, 0.025), toon(PALETTE.teal)));
  const seal = mesh(smoothGeometry(new THREE.CylinderGeometry(0.065, 0.065, 0.014, 24)), toon(PALETTE.mustard, { gloss: 0.8, hatch: 0 }), "none");
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, 0.05, 0.03);
  passport.add(seal);
  const sealStitch = stitch([new THREE.Vector3(-0.09, -0.12, 0.032), new THREE.Vector3(0.09, -0.12, 0.032)], { color: PALETTE.mustard, radius: 0.007, dash: 0.03 });
  passport.add(sealStitch);

  const sweater = new THREE.Group();
  sweater.add(mesh(rbox(0.72, 0.3, 0.3, 0.145, 6), toon("#8fb0ff")));
  for (const x of [-0.18, 0.18]) {
    const stripe = mesh(rbox(0.06, 0.31, 0.31, 0.15, 6), toon(PALETTE.cream, { hatch: 0.6 }), "none");
    stripe.position.x = x;
    sweater.add(stripe);
  }

  const bottle = new THREE.Group();
  const bottleProfile = [
    new THREE.Vector2(0.0, -0.31),
    new THREE.Vector2(0.12, -0.31),
    new THREE.Vector2(0.14, -0.27),
    new THREE.Vector2(0.14, 0.14),
    new THREE.Vector2(0.11, 0.22),
    new THREE.Vector2(0.085, 0.26),
    new THREE.Vector2(0.0, 0.26),
  ];
  bottle.add(mesh(smoothGeometry(new THREE.LatheGeometry(bottleProfile, 28)), toon(PALETTE.peach, { gloss: 1 })));
  const cap = mesh(rbox(0.19, 0.12, 0.19, 0.06), toon(PALETTE.strap, { gloss: 0.5 }));
  cap.position.y = 0.31;
  bottle.add(cap);
  const bottleBand = mesh(smoothGeometry(new THREE.CylinderGeometry(0.147, 0.147, 0.12, 28)), toon(PALETTE.lime, { hatch: 0.6 }), "none");
  bottleBand.position.y = -0.04;
  bottle.add(bottleBand);

  return { notebook, headphones, passport, sweater, bottle };
}

/** A little 4-point sparkle, like the ✳ doodles in the page. */
export function createSparkle(kit: ToonKit, color: string = PALETTE.lime) {
  const shape = new THREE.Shape();
  const outer = 0.22;
  const inner = 0.05;
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 2;
    const tip = new THREE.Vector2(Math.cos(angle) * outer, Math.sin(angle) * outer);
    const nextAngle = angle + Math.PI / 2;
    const tipNext = new THREE.Vector2(Math.cos(nextAngle) * outer, Math.sin(nextAngle) * outer);
    const mid = new THREE.Vector2(Math.cos(angle + Math.PI / 4) * inner, Math.sin(angle + Math.PI / 4) * inner);
    if (i === 0) shape.moveTo(tip.x, tip.y);
    shape.quadraticCurveTo(mid.x, mid.y, tipNext.x, tipNext.y);
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 6 });
  geometry.center();
  return kit.mesh(smoothGeometry(geometry), kit.toon(color, { hatch: 0.4, gloss: 0.3 }));
}
