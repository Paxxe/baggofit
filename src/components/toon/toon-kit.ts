import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/**
 * "Hand-drawn 3D" rendering kit:
 * - banded toon shading with a wobbly terminator and pencil hatching in the shadows
 * - inverted-hull ink outlines whose width "boils" a few times per second, like redrawn frames
 * - dashed stitch lines and a scribbled ground shadow
 */

export const INK = "#1c1f3a";

const toonVertex = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewPosition;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const noise = /* glsl */ `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
`;

const toonFragment = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uShade;
uniform vec3 uLightTone;
uniform vec3 uInk;
uniform vec3 uLight;
uniform float uBoil;
uniform float uPixelRatio;
uniform float uHatch;
uniform float uGloss;
varying vec3 vNormal;
varying vec3 vViewPosition;
${noise}
void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vViewPosition);
  vec2 fc = gl_FragCoord.xy / uPixelRatio;

  // Barely-there wobble on the light/shadow edge: enough to feel drawn, not enough to ripple.
  float jitter = sin(fc.x * 0.03 + uBoil) * sin(fc.y * 0.025 - uBoil * 0.7) * 0.015;
  float d = dot(n, normalize(uLight)) + jitter;

  // Softer band edges (wider smoothstep) avoid stair-stepped "zig-zag" highlights on curved fabric.
  vec3 col = mix(uShade, uColor, smoothstep(-0.08, 0.08, d));
  col = mix(col, uLightTone, smoothstep(0.55, 0.72, d) * 0.7);

  // Light pencil hatching, one direction only, just in the deepest shadow.
  float deepAmt = 1.0 - smoothstep(-0.5, -0.25, d);
  float h1 = abs(fract((fc.x + fc.y) / 7.0) - 0.5) * 7.0;
  float hatch = (1.0 - smoothstep(0.5, 1.2, h1)) * deepAmt;
  col = mix(col, uInk, clamp(hatch, 0.0, 1.0) * 0.12 * uHatch);

  // Cartoon specular: a crisp little highlight blob.
  vec3 h = normalize(normalize(uLight) + v);
  float spec = smoothstep(0.955, 0.968, dot(n, h)) * uGloss;
  col = mix(col, vec3(1.0), spec * 0.8);

  // Paper grain.
  col *= 0.985 + 0.03 * hash12(floor(fc));

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

const outlineVertex = /* glsl */ `
uniform float uThickness;
uniform float uBoil;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec3 viewNormal = normalize(normalMatrix * normal);
  // Line "boil": width changes a few times per second, like a redrawn animation frame.
  float a = sin(dot(position, vec3(17.1, 23.7, 11.3)) * 1.7 + uBoil * 2.39) * 0.5 + 0.5;
  float b = sin(dot(position, vec3(-5.3, 9.1, 13.7)) * 3.1 - uBoil * 1.73) * 0.5 + 0.5;
  float width = uThickness * (0.62 + 0.5 * a + 0.28 * b);
  // Thin the line out on very small (shrinking) objects so they don't turn into ink blots.
  float worldScale = length(modelMatrix[0].xyz);
  width *= clamp(worldScale / 0.35, 0.0, 1.0);
  mvPosition.xyz += viewNormal * width * -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const outlineFragment = /* glsl */ `
uniform vec3 uInk;
void main() {
  gl_FragColor = vec4(uInk, 1.0);
  #include <colorspace_fragment>
}
`;

const stitchVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const stitchFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uCount;
varying vec2 vUv;
void main() {
  if (fract(vUv.x * uCount) > 0.56) discard;
  gl_FragColor = vec4(uColor, 1.0);
  #include <colorspace_fragment>
}
`;

const shadowFragment = /* glsl */ `
uniform vec3 uInk;
uniform float uBoil;
uniform float uOpacity;
uniform float uPixelRatio;
varying vec2 vUv;
${noise}
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float angle = atan(p.y, p.x);
  float rim = 0.9 + sin(angle * 5.0 + uBoil * 2.1) * 0.035 + sin(angle * 11.0 - uBoil * 1.3) * 0.02;
  float r = length(p);
  float body = 1.0 - smoothstep(rim - 0.05, rim, r);
  vec2 fc = gl_FragCoord.xy / uPixelRatio;
  float stroke = abs(fract((fc.x * 0.7 + fc.y * 1.9 + sin(fc.x * 0.05 + uBoil) * 2.0) / 5.0) - 0.5) * 5.0;
  float line = 1.0 - smoothstep(0.5, 1.3, stroke);
  float core = 1.0 - smoothstep(0.0, 0.75, r);
  float alpha = body * (0.25 + 0.55 * line + 0.35 * core) * uOpacity;
  gl_FragColor = vec4(uInk, alpha);
  #include <colorspace_fragment>
}
`;

export interface ToonOptions {
  /** 0 = no hatching, 1 = normal, >1 heavier */
  hatch?: number;
  /** 0 = matte fabric, 1 = glossy plastic */
  gloss?: number;
  shade?: string;
  light?: string;
}

export type InkWeight = "bold" | "thin" | "none";

/** Replace normals with fully smoothed ones (needed for clean inverted-hull outlines). */
export function smoothGeometry(geometry: THREE.BufferGeometry) {
  const source = geometry.clone();
  for (const name of Object.keys(source.attributes)) {
    if (name !== "position") source.deleteAttribute(name);
  }
  const merged = mergeVertices(source, 1e-4);
  merged.computeVertexNormals();
  source.dispose();
  geometry.dispose();
  return merged;
}

export function createToonKit({ pixelRatio, reducedMotion }: { pixelRatio: number; reducedMotion: boolean }) {
  const ink = new THREE.Color(INK);
  const shared = {
    uLight: { value: new THREE.Vector3(-0.5, 0.78, 0.6).normalize() },
    uBoil: { value: 0 },
    uPixelRatio: { value: pixelRatio },
    uInk: { value: ink },
  };

  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const toonCache = new Map<string, THREE.ShaderMaterial>();

  const outlineBold = new THREE.ShaderMaterial({
    uniforms: { uThickness: { value: 0.003 }, uBoil: shared.uBoil, uInk: shared.uInk },
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    side: THREE.BackSide,
  });
  const outlineThin = new THREE.ShaderMaterial({
    uniforms: { uThickness: { value: 0.0018 }, uBoil: shared.uBoil, uInk: shared.uInk },
    vertexShader: outlineVertex,
    fragmentShader: outlineFragment,
    side: THREE.BackSide,
  });
  materials.add(outlineBold);
  materials.add(outlineThin);

  const toon = (color: string, options: ToonOptions = {}) => {
    const key = `${color}|${options.hatch ?? 1}|${options.gloss ?? 0}|${options.shade ?? ""}|${options.light ?? ""}`;
    const cached = toonCache.get(key);
    if (cached) return cached;
    const base = new THREE.Color(color);
    const shade = options.shade ? new THREE.Color(options.shade) : base.clone().lerp(new THREE.Color("#33405f"), 0.22).multiplyScalar(0.58);
    // Dark colours get a saturated highlight instead of a washed-out grey one.
    const luminance = base.r * 0.2126 + base.g * 0.7152 + base.b * 0.0722;
    const lightTone = options.light
      ? new THREE.Color(options.light)
      : luminance < 0.05
        ? base.clone().lerp(new THREE.Color("#4f63d9"), 0.4)
        : base.clone().lerp(new THREE.Color("#fffbe8"), 0.28);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: base },
        uShade: { value: shade },
        uLightTone: { value: lightTone },
        uInk: shared.uInk,
        uLight: shared.uLight,
        uBoil: shared.uBoil,
        uPixelRatio: shared.uPixelRatio,
        uHatch: { value: options.hatch ?? 1 },
        uGloss: { value: options.gloss ?? 0 },
      },
      vertexShader: toonVertex,
      fragmentShader: toonFragment,
    });
    toonCache.set(key, material);
    materials.add(material);
    return material;
  };

  const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, inkWeight: InkWeight = "bold") => {
    geometries.add(geometry);
    const result = new THREE.Mesh(geometry, material);
    if (inkWeight !== "none") {
      const hull = new THREE.Mesh(geometry, inkWeight === "bold" ? outlineBold : outlineThin);
      hull.raycast = () => {};
      result.add(hull);
    }
    return result;
  };

  /** Dashed "sewn" line following a set of points. */
  const stitch = (points: THREE.Vector3[], { closed = false, color = "#fff3d6", radius = 0.011, dash = 0.075 } = {}) => {
    const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
    const length = curve.getLength();
    const geometry = new THREE.TubeGeometry(curve, Math.max(12, Math.ceil(length / 0.012)), radius, 5, closed);
    const material = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uCount: { value: Math.max(2, Math.round(length / dash)) } },
      vertexShader: stitchVertex,
      fragmentShader: stitchFragment,
    });
    materials.add(material);
    geometries.add(geometry);
    return new THREE.Mesh(geometry, material);
  };

  const scribbleShadow = (radius: number) => {
    const geometry = new THREE.PlaneGeometry(radius * 2, radius * 2);
    const material = new THREE.ShaderMaterial({
      uniforms: { uInk: shared.uInk, uBoil: shared.uBoil, uOpacity: { value: 0.16 }, uPixelRatio: shared.uPixelRatio },
      vertexShader: stitchVertex,
      fragmentShader: shadowFragment,
      transparent: true,
      depthWrite: false,
    });
    materials.add(material);
    geometries.add(geometry);
    const shadow = new THREE.Mesh(geometry, material);
    shadow.rotation.x = -Math.PI / 2;
    return shadow;
  };

  return {
    toon,
    mesh,
    stitch,
    scribbleShadow,
    /** Keep ink width constant in screen pixels for the current viewport. */
    setViewport(heightCss: number, fovDegrees: number, boldPx = 3.2, thinPx = 1.9) {
      const unitsPerPixel = (2 * Math.tan(THREE.MathUtils.degToRad(fovDegrees) / 2)) / Math.max(1, heightCss);
      outlineBold.uniforms.uThickness.value = boldPx * unitsPerPixel;
      outlineThin.uniforms.uThickness.value = thinPx * unitsPerPixel;
    },
    /** Advance the hand-drawn "boil" at ~8 drawings per second. */
    tick(timeSeconds: number) {
      shared.uBoil.value = reducedMotion ? 3 : Math.floor(timeSeconds * 8) % 61;
    },
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      geometries.clear();
      materials.clear();
      toonCache.clear();
    },
  };
}

export type ToonKit = ReturnType<typeof createToonKit>;
