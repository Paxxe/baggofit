"use client";

import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import type { Locale } from "@/lib/data/packing-items";
import { createToonKit } from "@/components/toon/toon-kit";
import { createSparkle, createToonBackpack, createTravelItems, PALETTE } from "@/components/toon/toon-backpack";
import { backOut, clamp01, easeInOut, smooth, Spring } from "@/components/toon/motion";

interface StoryChapter {
  tag: string;
  title: string;
  body: string;
}

const FOV = 30;
const FLOOR_Y = -1.45;

export function BackpackStory({ locale, intro, actions, chapters, scrollLabel }: { locale: Locale; intro: StoryChapter; actions: ReactNode; chapters: readonly StoryChapter[]; scrollLabel: string }) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLSpanElement>(null);
  const progressIndexRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pixelRatio = Math.min(window.devicePixelRatio, 1.75);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    const lookTarget = new THREE.Vector3(0, 0.05, 0);

    const kit = createToonKit({ pixelRatio, reducedMotion });
    const backpack = createToonBackpack(kit);

    // rig: placement + yaw/tilt + hop · squash: squash & stretch from the floor up
    const rig = new THREE.Group();
    const squash = new THREE.Group();
    rig.add(squash);
    squash.add(backpack.root);
    scene.add(rig);

    const shadow = kit.scribbleShadow(1.55);
    shadow.scale.set(1.3, 0.62, 1);
    shadow.position.y = FLOOR_Y + 0.004;
    scene.add(shadow);

    /* the things that get packed */
    const props = createTravelItems(kit);
    const flights = [
      { object: props.notebook, slot: new THREE.Vector3(-0.3, 0, 0.02), settle: new THREE.Euler(0.1, 0.25, -0.12), spin: new THREE.Vector3(0.7, 1.3, 0.4), toPocket: false },
      { object: props.headphones, slot: new THREE.Vector3(0.32, 0, -0.06), settle: new THREE.Euler(0.2, -0.3, 0.15), spin: new THREE.Vector3(1.1, 0.6, 0.9), toPocket: false },
      { object: props.sweater, slot: new THREE.Vector3(0.02, 0, 0.08), settle: new THREE.Euler(0, 0.12, 0.05), spin: new THREE.Vector3(0.4, 1.4, 0.8), toPocket: false },
      { object: props.passport, slot: new THREE.Vector3(-0.08, 0, 0.14), settle: new THREE.Euler(-0.15, 0.2, 0.2), spin: new THREE.Vector3(1.3, 0.8, 1.1), toPocket: false },
      { object: props.bottle, slot: new THREE.Vector3(), settle: new THREE.Euler(0, 0.4, -0.04), spin: new THREE.Vector3(0.9, 0.5, 1.2), toPocket: true },
    ].map((flight) => {
      backpack.body.add(flight.object);
      flight.object.visible = false;
      return { ...flight, lastDive: 0 };
    });
    const ITEM_SCALE = 0.92;

    /* doodle sparkles */
    const sparkles = [
      { mesh: createSparkle(kit, PALETTE.lime), base: new THREE.Vector3(-1.75, 1.55, -0.4), delay: 0, size: 1 },
      { mesh: createSparkle(kit, PALETTE.peach), base: new THREE.Vector3(1.8, 1.1, 0.2), delay: 0.02, size: 0.75 },
      { mesh: createSparkle(kit, PALETTE.mint), base: new THREE.Vector3(1.5, -0.7, 0.6), delay: 0.04, size: 0.6 },
      { mesh: createSparkle(kit, PALETTE.lime), base: new THREE.Vector3(-1.55, -0.45, 0.5), delay: 0.06, size: 0.7 },
    ];
    sparkles.forEach(({ mesh }) => scene.add(mesh));

    /* springs for cartoon follow-through */
    const lidSpring = new Spring(0);
    const squashSpring = new Spring(0);
    const tagSwing = new Spring(0);
    const tagFlare = new Spring(0);
    const pullSwings = backpack.pulls.map(() => new Spring(0));

    let targetProgress = 0;
    let currentProgress = 0;
    let subjectOffsetX = 0;
    let subjectScale = 0.9;
    let animationFrame = 0;
    let visible = true;
    let lastTime = performance.now();
    let previousYaw: number | null = null;
    let previousYawVelocity = 0;

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      const mobile = width < 620;
      subjectScale = mobile ? 0.98 : 0.9;
      // Fit the bag + open lid vertically, and the orbiting items horizontally.
      const fitHeight = 2.85 / tanHalf;
      const fitWidth = (mobile ? 2.25 : 3.4) / (tanHalf * camera.aspect);
      const distance = Math.max(fitHeight, fitWidth);
      camera.position.set(0, 1.35, distance);
      camera.lookAt(lookTarget);
      const halfWidthAtTarget = distance * tanHalf * camera.aspect;
      subjectOffsetX = mobile ? 0 : halfWidthAtTarget * (width < 900 ? 0.36 : 0.3);
      camera.updateProjectionMatrix();
      kit.setViewport(height, FOV, mobile ? 2.6 : 3.2, mobile ? 1.6 : 1.9);
    };

    const updateProgress = () => {
      const bounds = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      targetProgress = THREE.MathUtils.clamp(-bounds.top / travel, 0, 1);
    };

    const orbitPosition = new THREE.Vector3();
    const above = new THREE.Vector3();
    const inside = new THREE.Vector3();
    const flightPosition = new THREE.Vector3();

    const render = (now: number) => {
      animationFrame = window.requestAnimationFrame(render);
      const dt = Math.min(1 / 30, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      if (!visible) return;
      const t = reducedMotion ? 0 : now / 1000;
      kit.tick(now / 1000);

      currentProgress += (targetProgress - currentProgress) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 6));
      const p = currentProgress;

      /* --- lid: springs open, then clicks shut with a bounce --- */
      const open = smooth(0.08, 0.2, p) * (1 - smooth(0.63, 0.7, p));
      lidSpring.step(-1.9 * open, dt, 140, 10);
      if (lidSpring.value > 0) {
        if (lidSpring.velocity > 1.2) squashSpring.velocity += lidSpring.velocity * 0.35;
        lidSpring.value = 0;
        lidSpring.velocity *= -0.3;
      }
      backpack.lid.rotation.x = reducedMotion ? -1.9 * open : lidSpring.value + Math.sin(t * 3.1) * 0.012 * open;

      /* --- yaw: 3/4 view → front for packing → turn round to show the straps --- */
      const turnFront = smooth(0.0, 0.3, p);
      const turnBack = smooth(0.72, 0.9, p);
      const yaw = -0.62 + 0.62 * turnFront + Math.PI * 0.8 * turnBack + Math.sin(t * 0.7) * 0.06;
      const yawVelocity = previousYaw === null ? 0 : (yaw - previousYaw) / dt;
      const yawAcceleration = THREE.MathUtils.clamp((yawVelocity - previousYawVelocity) / dt, -25, 25);
      previousYaw = yaw;
      previousYawVelocity = yawVelocity;

      /* --- off you go: happy hops in the last chapter --- */
      const go = reducedMotion ? 0 : smooth(0.86, 0.93, p);
      const hopPhase = Math.sin(t * 4.4);
      const air = Math.abs(hopPhase);
      const hop = go * air * 0.34;
      const impact = go * Math.exp(-air * 8);

      squashSpring.step(0, dt, 260, 9);
      const squashAmount = squashSpring.value + impact * 0.14 - go * Math.max(0, air - 0.25) * 0.06;
      const breathe = reducedMotion ? 0 : Math.sin(t * 2.1) * 0.009;
      squash.scale.set(1 + squashAmount * 0.55, 1 - squashAmount + breathe, 1 + squashAmount * 0.55);

      rig.position.set(subjectOffsetX, FLOOR_Y + hop, 0);
      rig.rotation.set(open * 0.38 + Math.sin(t * 0.9) * 0.012, yaw, Math.sin(p * Math.PI * 3) * 0.03 + Math.sin(t * 1.3) * 0.012);
      rig.scale.setScalar(subjectScale);

      shadow.position.x = subjectOffsetX;
      const shadowScale = 1 - hop * 0.75;
      shadow.scale.set(1.3 * shadowScale * subjectScale, 0.62 * shadowScale * subjectScale, 1);
      (shadow.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.16 * (0.6 + 0.4 * shadowScale);

      /* --- secondary motion: tag & zipper pulls swing --- */
      tagSwing.velocity += (-yawAcceleration * 0.4 + Math.sin(t * 1.7) * 0.25) * dt;
      tagSwing.step(0, dt, 38, 1.6);
      tagFlare.velocity += impact * 4 * dt;
      tagFlare.step(0, dt, 30, 2);
      backpack.tag.rotation.set(tagSwing.value, 0, -Math.abs(tagFlare.value) * 0.8);
      pullSwings.forEach((swing, index) => {
        swing.velocity += (-yawAcceleration * 0.3 + (index === 1 ? lidSpring.velocity * 0.6 : 0) + impact * 2) * dt;
        swing.step(0, dt, 45, 2.2);
        backpack.pulls[index].rotation.z = swing.value;
        backpack.pulls[index].rotation.x = -swing.value * 0.4;
      });

      /* --- packing: items pop in, orbit, then dive into the bag --- */
      flights.forEach((flight, index) => {
        const appear = smooth(0.12 + index * 0.025, 0.24 + index * 0.025, p);
        const dive = clamp01((p - (0.33 + index * 0.055)) / 0.12);
        const a = easeInOut(clamp01(dive / 0.62));
        const b = clamp01((dive - 0.55) / 0.45) ** 2;

        const angle = (index / flights.length) * Math.PI * 2 + p * 7 + t * 0.35;
        orbitPosition.set(Math.cos(angle) * 1.85, 0.5 + Math.sin(index * 1.9 + t * 0.9) * 0.12 + Math.sin(angle * 2) * 0.12, Math.sin(angle) * 1.05 + 0.2);
        if (flight.toPocket) {
          above.copy(backpack.sidePocket).add(new THREE.Vector3(0.1, 1.15, 0));
          inside.copy(backpack.sidePocket);
        } else {
          above.copy(backpack.opening).add(flight.slot).add(new THREE.Vector3(0, 0.95, 0));
          inside.copy(backpack.opening).add(flight.slot).add(new THREE.Vector3(0, -0.55, 0));
        }
        flightPosition.lerpVectors(orbitPosition, above, a);
        flightPosition.y += Math.sin(a * Math.PI) * 0.45;
        flightPosition.lerp(inside, b);
        flight.object.position.copy(flightPosition);

        const spinAmount = (p * 5 + t * 0.6) * (1 - a);
        flight.object.rotation.set(
          THREE.MathUtils.lerp(flight.spin.x * spinAmount, flight.settle.x, a),
          THREE.MathUtils.lerp(flight.spin.y * spinAmount, flight.settle.y, a),
          THREE.MathUtils.lerp(flight.spin.z * spinAmount, flight.settle.z, a),
        );
        const shrink = flight.toPocket ? 1 : 1 - b * 0.35;
        const scale = ITEM_SCALE * Math.max(0, backOut(appear)) * shrink;
        flight.object.scale.setScalar(Math.max(0.0001, scale));
        flight.object.visible = scale > 0.01 && (flight.toPocket || dive < 1);

        // Each landing bumps the bag (and the lid, if open).
        if (dive >= 0.85 && flight.lastDive < 0.85) {
          squashSpring.velocity += 2.4;
          lidSpring.velocity += 2.2 * open;
          tagSwing.velocity += 1.5;
        }
        flight.lastDive = dive;
      });

      /* --- sparkles pop when the lid clicks shut, and dance on the way out --- */
      sparkles.forEach(({ mesh, base, delay, size }, index) => {
        const pop = backOut(smooth(0.66 + delay, 0.74 + delay, p));
        const scale = size * (0.45 + 0.55 * Math.max(0, pop)) * subjectScale;
        mesh.scale.setScalar(scale);
        mesh.position.set(
          subjectOffsetX + base.x * subjectScale * (1 + pop * 0.12),
          base.y * subjectScale + Math.sin(t * 1.4 + index) * 0.08 + go * Math.sin(t * 4.4 + index) * 0.06,
          base.z,
        );
        mesh.rotation.set(Math.sin(t * 0.8 + index) * 0.3, t * 0.6 + index, Math.sin(t + index) * 0.25 + p * 3);
      });

      if (contentRef.current) {
        const activeChapter = Math.min(3, Math.floor(p * 4));
        contentRef.current.dataset.chapter = String(activeChapter);
        if (progressIndexRef.current) progressIndexRef.current.textContent = String(activeChapter + 1).padStart(2, "0");
      }
      if (progressBarRef.current) progressBarRef.current.style.transform = `scaleX(${p})`;
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      lastTime = performance.now();
    });
    visibilityObserver.observe(section);
    resize();
    updateProgress();
    currentProgress = targetProgress;
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      kit.dispose();
      renderer.dispose();
    };
  }, []);

  const total = chapters.length + 1;
  return (
    <section className="backpack-story" ref={sectionRef} aria-label={scrollLabel}>
      <div className="backpack-story-sticky">
        <div className="story-sun" aria-hidden="true" />
        <canvas className="backpack-story-canvas" ref={canvasRef} aria-label={locale === "it" ? "Illustrazione 3D disegnata a mano di uno zaino che si apre, si riempie, si richiude e parte" : "Hand-drawn 3D illustration of a backpack opening, filling up, closing and heading off"} role="img" />
        <div className="story-chapters" ref={contentRef} data-chapter="0">
          <article className="story-chapter story-chapter-intro">
            <p className="story-chapter-tag"><span />{intro.tag}</p>
            <h1>{intro.title}</h1>
            <p className="story-chapter-body">{intro.body}</p>
            <div className="story-actions">{actions}</div>
          </article>
          {chapters.map((chapter) => <article className="story-chapter" key={chapter.tag}>
            <p className="story-chapter-tag"><span />{chapter.tag}</p><h2>{chapter.title}</h2><p className="story-chapter-body">{chapter.body}</p>
          </article>)}
        </div>
        <div className="story-scroll-hint" aria-hidden="true"><span>{scrollLabel}</span><i /></div>
        <div className="story-progress"><span className="story-progress-label">{scrollLabel}</span><span className="story-progress-track"><span ref={progressBarRef} /></span><span className="story-progress-index"><span ref={progressIndexRef}>01</span> / {String(total).padStart(2, "0")}</span></div>
      </div>
    </section>
  );
}
