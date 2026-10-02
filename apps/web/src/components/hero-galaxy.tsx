"use client";

import { useEffect, useRef } from 'react';
import type { BufferGeometry, Material, Texture } from 'three';

const particleVertex = `
 attribute float aSize;
 attribute float aPhase;
 varying vec3 vColor;
 varying float vBrightness;
 uniform float uPixelRatio;
 uniform float uTime;
 uniform float uFlow;
 void main() {
   vColor = color;
   vBrightness = 0.82 + 0.18 * sin(uTime * 0.65 + aPhase);
   vec3 p = position;
   p.z += sin(p.x * 4.0 + uTime * 0.22 + aPhase * 0.08) * 0.035 * uFlow;
   vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
   gl_PointSize = clamp(aSize * uPixelRatio * (24.0 / -viewPosition.z), 0.65, 5.0 * uPixelRatio);
   gl_Position = projectionMatrix * viewPosition;
 }`;

const particleFragment = `
 varying vec3 vColor;
 varying float vBrightness;
 uniform float uOpacity;
 void main() {
   vec2 p = gl_PointCoord - 0.5;
   float glow = exp(-dot(p, p) * 16.0) * (1.0 - smoothstep(0.35, 0.5, length(p)));
   gl_FragColor = vec4(vColor, glow * uOpacity * vBrightness);
   #include <colorspace_fragment>
 }`;

const atmosphereVertex = `
 varying vec3 vNormal;
 varying vec3 vView;
 void main() {
   vec4 p = modelViewMatrix * vec4(position, 1.0);
   vNormal = normalize(normalMatrix * normal);
   vView = normalize(-p.xyz);
   gl_Position = projectionMatrix * p;
 }`;

const atmosphereFragment = `
 varying vec3 vNormal;
 varying vec3 vView;
 uniform vec3 uColor;
 void main() {
   float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 3.0);
   gl_FragColor = vec4(uColor, rim * 0.24);
   #include <colorspace_fragment>
 }`;

/** Background-only WebGL. Its render loop is independent of the page's GSAP timelines. */
export function HeroGalaxy({ paused }: { paused: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{ refresh: () => void } | null>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
    controls.current?.refresh();
  }, [paused]);

  useEffect(() => {
    const element = host.current;
    const hero = element?.closest('section');
    if (!element || !hero) return;
    let cancelled = false;
    let dispose = () => {};

    async function initialize() {
      const THREE = await import('three');
      if (cancelled || !element || !hero) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      } catch {
        element.dataset.renderer = 'fallback';
        return;
      }
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      const textures = new Set<Texture>();
      const unsubscribe: (() => void)[] = [];
      const canvas = renderer.domElement;
      canvas.className = 'galaxy-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      element.appendChild(canvas);
      dispose = () => {
        controls.current = null;
        renderer.setAnimationLoop(null);
        unsubscribe.forEach(cleanup => cleanup());
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => material.dispose());
        textures.forEach(texture => texture.dispose());
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      };
      renderer.setClearColor(0x0a0a0a, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 90);
      camera.position.z = 18;
      const light = new THREE.DirectionalLight(0xe3edff, 2.4);
      light.position.set(-4, 6, 10);
      scene.add(light, new THREE.AmbientLight(0x93adff, 0.48));
      const compact = element.clientWidth < 760;
      const particleMaterials: InstanceType<typeof THREE.ShaderMaterial>[] = [];
      let seed = 10403;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      function particles(count: number, spiral: boolean) {
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const phases = new Float32Array(count);
        const blue = new THREE.Color('#2D6BFF');
        const white = new THREE.Color('#FFFFFF');
        for (let i = 0; i < count; i++) {
          const radius = 0.09 + Math.pow(random(), 0.66) * 0.91;
          const angle = (i % 3) * Math.PI * 2 / 3 + radius * 5.8 + (random() - 0.5) * 0.7;
          positions[i * 3] = spiral ? Math.cos(angle) * radius : (random() - 0.5) * 2.8;
          positions[i * 3 + 1] = spiral ? Math.sin(angle) * radius * 0.48 : (random() - 0.5) * 2;
          positions[i * 3 + 2] = spiral ? (random() - 0.5) * 0.06 : -4 - random() * 18;
          const color = blue.clone().lerp(white, spiral ? random() * 0.35 : 0.5 + random() * 0.5);
          colors.set([color.r, color.g, color.b], i * 3);
          sizes[i] = spiral ? 1.2 + random() * 2.2 : 1 + random() * 1.8;
          phases[i] = random() * Math.PI * 2;
        }
        const geometry = new THREE.BufferGeometry();
        geometries.add(geometry);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
        const material = new THREE.ShaderMaterial({
          vertexShader: particleVertex, fragmentShader: particleFragment, vertexColors: true,
          transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
          uniforms: { uPixelRatio: { value: 1 }, uOpacity: { value: spiral ? 0.72 : 0.6 }, uTime: { value: 0 }, uFlow: { value: spiral ? 1 : 0 } },
        });
        materials.add(material);
        particleMaterials.push(material);
        return new THREE.Points(geometry, material);
      }

      const galaxy = new THREE.Group();
      galaxy.position.z = -7;
      galaxy.rotation.x = 0.28;
      galaxy.add(particles(compact ? 1200 : 2800, true));
      // Faint spiral guides make the moving field readable without a bloom pass.
      for (let arm = 0; arm < 3; arm++) {
        const positions: number[] = [];
        for (let i = 0; i <= 220; i++) {
          const radius = 0.09 + i / 220 * 0.91;
          const angle = arm * Math.PI * 2 / 3 + radius * 5.8;
          positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.48, 0);
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const material = new THREE.LineBasicMaterial({ color: 0x2d6bff, transparent: true, opacity: 0.1, depthWrite: false });
        geometries.add(geometry);
        materials.add(material);
        galaxy.add(new THREE.Line(geometry, material));
      }
      const stars = particles(compact ? 240 : 650, false);
      scene.add(galaxy, stars);

      // Seamless procedural mineral textures; no external image requests or assets.
      function planetTexture(tint: string, rocky: boolean) {
        const width = 256, height = 128;
        const data = new Uint8Array(width * height * 4);
        const base = new THREE.Color(tint);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const u = x / width * Math.PI * 2, v = y / height * Math.PI;
            const noise = Math.sin(Math.cos(u) * 8 + Math.sin(v) * 13)
              + Math.sin(Math.sin(u) * 17 - Math.cos(v) * 19) * 0.5
              + Math.sin(Math.cos(u) * 39 + Math.sin(v) * 37) * 0.25;
            const shade = rocky ? 0.62 + noise * 0.17 : 0.58 + noise * 0.22;
            const offset = (y * width + x) * 4;
            const color = base.clone().multiplyScalar(Math.max(0.18, shade)).convertLinearToSRGB();
            data[offset] = Math.round(color.r * 255);
            data[offset + 1] = Math.round(color.g * 255);
            data[offset + 2] = Math.round(color.b * 255);
            data[offset + 3] = 255;
          }
        }
        const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;
        texture.needsUpdate = true;
        textures.add(texture);
        return texture;
      }

      const sphere = new THREE.SphereGeometry(1, compact ? 28 : 48, compact ? 20 : 32);
      geometries.add(sphere);
      const configs = [
        { tint: '#2D6BFF', z: 0.3, phase: 0.5, rocky: false },
        { tint: '#A3B9E8', z: 0.8, phase: 2.3, rocky: true },
        { tint: '#B6BDC9', z: -1.5, phase: 4.1, rocky: true },
      ];
      const planets = configs.map((config, index) => {
        const group = new THREE.Group();
        const material = new THREE.MeshStandardMaterial({ map: planetTexture(config.tint, config.rocky), roughness: 0.94, metalness: 0.08 });
        const mesh = new THREE.Mesh(sphere, material);
        materials.add(material);
        group.add(mesh);
        if (index < 2) {
          const atmosphereMaterial = new THREE.ShaderMaterial({
            vertexShader: atmosphereVertex, fragmentShader: atmosphereFragment,
            uniforms: { uColor: { value: new THREE.Color('#2D6BFF') } },
            side: THREE.BackSide, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
          });
          materials.add(atmosphereMaterial);
          const atmosphere = new THREE.Mesh(sphere, atmosphereMaterial);
          atmosphere.scale.setScalar(1.055);
          group.add(atmosphere);
        }
        if (index === 1) {
          const geometry = new THREE.RingGeometry(1.2, 1.82, compact ? 64 : 96);
          const material = new THREE.ShaderMaterial({
            vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
            fragmentShader: `varying vec2 vUv; void main(){
              float r=length(vUv-0.5); float band=0.5+0.5*sin(r*260.0);
              gl_FragColor=vec4(vec3(0.16,0.29,0.62),0.12+band*0.12);
              #include <colorspace_fragment>
            }`,
            side: THREE.DoubleSide, transparent: true, depthWrite: false, toneMapped: false,
          });
          geometries.add(geometry);
          materials.add(material);
          const ring = new THREE.Mesh(geometry, material);
          ring.rotation.set(1.05, 0.25, -0.2);
          group.add(ring);
        }
        scene.add(group);
        return { group, mesh, config, base: new THREE.Vector3(), pixelUnit: 0 };
      });

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      const fine = window.matchMedia('(pointer: fine)');
      const pointer = new THREE.Vector2();
      const easedPointer = new THREE.Vector2();
      let visible = true, running = false, lost = false, elapsed = 0;
      let previousTime: number | null = null;

      function render(delta = 0) {
        if (lost) return;
        elapsed += delta;
        easedPointer.lerp(pointer, 1 - Math.exp(-delta * 4));
        camera.position.x = easedPointer.x * 0.55;
        camera.position.y = easedPointer.y * 0.32;
        camera.lookAt(0, 0, -2);
        galaxy.rotation.z = -0.4 + elapsed * 0.018;
        galaxy.rotation.y = easedPointer.x * 0.045;
        stars.rotation.z = elapsed * 0.003;
        planets.forEach((planet, index) => {
          planet.mesh.rotation.y = elapsed * (0.13 + index * 0.035) + planet.config.phase;
          planet.mesh.rotation.z = index === 0 ? 0.2 : -0.12;
          planet.group.position.copy(planet.base);
          planet.group.position.x += Math.sin(elapsed * 0.32 + planet.config.phase) * planet.pixelUnit * 4;
          planet.group.position.y += Math.cos(elapsed * 0.26 + planet.config.phase) * planet.pixelUnit * 3;
        });
        particleMaterials.forEach(material => { material.uniforms.uTime.value = elapsed; });
        renderer.render(scene, camera);
      }

      function frame(time: number) {
        const delta = previousTime === null ? 0 : Math.min((time - previousTime) / 1000, 0.05);
        previousTime = time;
        render(delta);
      }

      function activity() {
        const next = visible && !document.hidden && !reduced.matches && !pausedRef.current && !lost;
        element!.dataset.motion = next ? 'running' : 'paused';
        if (next === running) return;
        running = next;
        previousTime = null;
        renderer.setAnimationLoop(next ? frame : null);
      }

      function resize() {
        const width = element!.clientWidth, height = element!.clientHeight;
        if (!width || !height || lost) return;
        const mobile = width < 760;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        const fov = Math.tan(camera.fov * Math.PI / 360);
        const viewHeight = 2 * fov * 18, viewWidth = viewHeight * camera.aspect;
        galaxy.scale.set(viewWidth * 0.7, viewHeight * 0.9, 18);
        galaxy.position.x = viewWidth * 0.05;
        galaxy.position.y = -viewHeight * 0.03;
        stars.scale.set(viewWidth, viewHeight, 1);
        const clamp = THREE.MathUtils.clamp;
        const layout = mobile ? [
          { x: 0.12, y: 0.22, diameter: clamp(width * 0.11, 30, 48) },
          { x: 0.9, y: 0.855, diameter: clamp(width * 0.065, 22, 30) },
          { x: 0.885, y: 0.22, diameter: clamp(width * 0.04, 14, 20) },
        ] : [
          { x: 0.13, y: 0.26, diameter: clamp(width * 0.082, 70, 120) },
          { x: 0.875, y: 0.76, diameter: clamp(width * 0.053, 52, 80) },
          { x: 0.88, y: 0.24, diameter: clamp(width * 0.027, 24, 40) },
        ];
        planets.forEach((planet, index) => {
          const config = layout[index];
          const worldHeight = 2 * fov * (18 - planet.config.z);
          const worldWidth = worldHeight * camera.aspect;
          planet.pixelUnit = worldHeight / height;
          planet.base.set((config.x - 0.5) * worldWidth, (0.5 - config.y) * worldHeight, planet.config.z);
          planet.group.scale.setScalar(config.diameter * planet.pixelUnit / 2);
        });
        particleMaterials.forEach(material => { material.uniforms.uPixelRatio.value = pixelRatio; });
        render();
      }

      function move(event: PointerEvent) {
        if (!fine.matches || reduced.matches || pausedRef.current || event.pointerType === 'touch') return;
        const bounds = hero!.getBoundingClientRect();
        pointer.set(
          THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1),
          THREE.MathUtils.clamp(1 - (event.clientY - bounds.top) / bounds.height * 2, -1, 1),
        );
      }
      const leave = () => pointer.set(0, 0);
      const preference = () => {
        leave();
        if (reduced.matches) { easedPointer.set(0, 0); render(); }
        activity();
      };
      const contextLost = (event: Event) => {
        event.preventDefault(); lost = true;
        element!.dataset.renderer = 'fallback'; activity();
      };
      const contextRestored = () => {
        lost = false; resize(); element!.dataset.renderer = 'ready'; activity();
      };
      const observer = new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting; activity();
      }, { threshold: 0 });
      observer.observe(hero);
      const dimensions = new ResizeObserver(resize);
      dimensions.observe(element);
      hero.addEventListener('pointermove', move, { passive: true });
      hero.addEventListener('pointerleave', leave);
      document.addEventListener('visibilitychange', activity);
      reduced.addEventListener('change', preference);
      canvas.addEventListener('webglcontextlost', contextLost);
      canvas.addEventListener('webglcontextrestored', contextRestored);
      unsubscribe.push(() => {
        observer.disconnect(); dimensions.disconnect();
        hero.removeEventListener('pointermove', move);
        hero.removeEventListener('pointerleave', leave);
        document.removeEventListener('visibilitychange', activity);
        reduced.removeEventListener('change', preference);
        canvas.removeEventListener('webglcontextlost', contextLost);
        canvas.removeEventListener('webglcontextrestored', contextRestored);
      });
      controls.current = { refresh: activity };
      resize();
      element.dataset.renderer = 'ready';
      activity();
    }

    const start = () => {
      void initialize().catch(error => {
        dispose();
        if (!cancelled) element.dataset.renderer = 'fallback';
        if (process.env.NODE_ENV === 'development') console.warn('Bravite: fundo WebGL substituído pela versão estática.', error);
      });
    };
    const idle = window.requestIdleCallback?.(start, { timeout: 1200 });
    const timer = idle === undefined ? window.setTimeout(start, 80) : undefined;
    return () => {
      cancelled = true;
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) clearTimeout(timer);
      dispose();
    };
  }, []);

  return <div ref={host} className="hero-galaxy" data-renderer="loading" aria-hidden="true">
    <div className="galaxy-fallback">
      <svg viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" fill="none" stroke="#2D6BFF" strokeOpacity=".12">
        <path d="M-160 780C210 290 1090 900 1550 90M-190 815C280 250 1060 940 1570 30M-140 735C240 340 1120 850 1520 150"/>
      </svg>
      <span className="fallback-planet fallback-planet-blue"/>
      <span className="fallback-planet fallback-planet-ringed"/>
      <span className="fallback-planet fallback-planet-moon"/>
    </div>
  </div>;
}
