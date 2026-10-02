import * as THREE from 'three';
import { createField, fieldGlyphs, fieldPosition, planetLayout, type HeroEngine } from './hero-field';

const vertex = `
 attribute float aSize;
 attribute float aGlyph;
 attribute float aOpacity;
 attribute float aPhase;
 varying float vGlyph;
 varying float vOpacity;
 uniform float uPixelRatio;
 uniform float uTime;
 void main() {
   vGlyph = aGlyph;
   vOpacity = aOpacity * (0.72 + 0.2 * sin(uTime * 0.8 + aPhase));
   vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
   float size = aGlyph < 0.0 ? aSize * 1.2 : 14.0;
   gl_PointSize = clamp(size * uPixelRatio * 18.0 / -viewPosition.z, 1.0, 16.0 * uPixelRatio);
   gl_Position = projectionMatrix * viewPosition;
 }`;
const fragment = `
 varying float vGlyph;
 varying float vOpacity;
 uniform sampler2D uAtlas;
 void main() {
   vec2 p = gl_PointCoord - 0.5;
   float alpha = vGlyph < 0.0 ? exp(-dot(p,p) * 14.0) * (1.0-smoothstep(0.35,0.5,length(p)))
     : texture2D(uAtlas, vec2((gl_PointCoord.x + vGlyph) / 8.0, 1.0 - gl_PointCoord.y)).a;
   gl_FragColor = vec4(vec3(0.176,0.42,1.0), alpha * vOpacity);
   #include <colorspace_fragment>
 }`;

/** Dynamically imported on the client. One RAF owner in HeroGalaxy drives both engines. */
export function createWebGLEngine(onFailure: () => void): HeroEngine | null {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  canvas.className = 'galaxy-canvas'; canvas.setAttribute('aria-hidden', 'true');
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  let disposed = false, shaderFailed = false;
  const lose = (event: Event) => { event.preventDefault(); if (!disposed) onFailure(); };
  canvas.addEventListener('webglcontextlost', lose);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    canvas.removeEventListener('webglcontextlost', lose);
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    renderer.dispose();
    if (!context.isContextLost() && context.getExtension('WEBGL_lose_context')) renderer.forceContextLoss();
    canvas.remove();
  };
  try {
    renderer.setClearColor(0x0a0a0a, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
    renderer.debug.onShaderError = () => { shaderFailed = true; };
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.z = 18;
    const light = new THREE.DirectionalLight(0xe3edff, 2.1);
    light.position.set(-4, 6, 10);
    scene.add(light, new THREE.AmbientLight(0x93adff, 0.35));

    // A local glyph atlas keeps this effect independent of external assets/services.
    const atlasCanvas = document.createElement('canvas'); atlasCanvas.width = 384; atlasCanvas.height = 48;
    const atlasContext = atlasCanvas.getContext('2d');
    if (!atlasContext) throw new Error('Canvas2D unavailable for the particle atlas');
    atlasContext.font = '28px monospace'; atlasContext.fillStyle = '#fff';
    atlasContext.textAlign = 'center'; atlasContext.textBaseline = 'middle';
    fieldGlyphs.forEach((glyph, index) => atlasContext.fillText(glyph, index * 48 + 24, 24));
    const atlas = new THREE.CanvasTexture(atlasCanvas); textures.add(atlas);
    const geometry = new THREE.BufferGeometry(); geometries.add(geometry);
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false, toneMapped: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uPixelRatio: { value: 1 }, uTime: { value: 0 }, uAtlas: { value: atlas } },
    });
    materials.add(material);
    const field = new THREE.Points(geometry, material); field.frustumCulled = false; scene.add(field);
    let compact: boolean | null = null, height = 1, viewWidth = 1, viewHeight = 1;
    let points = createField(false), positions = new Float32Array(0), layout = planetLayout(1);
    const position = { x: 0, y: 0, z: 0 };

    // Smooth mineral clouds without image downloads or exaggerated horizontal stripes.
    function planetTexture(tint: string) {
      const data = new Uint8Array(256 * 128 * 4), color = new THREE.Color(tint), sample = new THREE.Color();
      for (let y = 0; y < 128; y++) for (let x = 0; x < 256; x++) {
        const u = x / 256 * Math.PI * 2, v = y / 128 * Math.PI;
        const a = Math.cos(u) * Math.sin(v), b = Math.sin(u) * Math.sin(v), c = Math.cos(v);
        const noise = Math.sin(a * 11 + Math.sin(b * 7) * 2 + c * 9) * 0.1
          + Math.sin(b * 23 + Math.sin(c * 17) + a * 19) * 0.055;
        sample.copy(color).multiplyScalar(0.65 + noise).convertLinearToSRGB();
        const offset = (y * 256 + x) * 4;
        data[offset] = sample.r * 255; data[offset + 1] = sample.g * 255; data[offset + 2] = sample.b * 255; data[offset + 3] = 255;
      }
      const texture = new THREE.DataTexture(data, 256, 128, THREE.RGBAFormat);
      texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping;
      texture.magFilter = THREE.LinearFilter; texture.minFilter = THREE.LinearFilter; texture.needsUpdate = true;
      textures.add(texture); return texture;
    }
    const sphere = new THREE.SphereGeometry(1, 40, 28); geometries.add(sphere);
    const planets = ['#2D6BFF', '#A3B9E8', '#B6BDC9'].map((tint, index) => {
      const group = new THREE.Group();
      const surface = new THREE.MeshStandardMaterial({ map: planetTexture(tint), roughness: 0.9, metalness: 0.04 });
      materials.add(surface);
      const mesh = new THREE.Mesh(sphere, surface); group.add(mesh);
      if (index === 1) {
        const ringGeometry = new THREE.RingGeometry(1.25, 1.8, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: '#5487ff', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
        geometries.add(ringGeometry); materials.add(ringMaterial);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial); ring.rotation.set(1.15, 0.2, -0.25); group.add(ring);
      }
      scene.add(group);
      return { group, mesh, z: index === 2 ? -1.5 : 0.5, base: new THREE.Vector3(), pixelUnit: 0 };
    });

    return {
      canvas, kind: 'webgl', dispose,
      resize(w, h, ratio) {
        height = h;
        renderer.setPixelRatio(ratio); renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
        viewHeight = 2 * Math.tan(camera.fov * Math.PI / 360) * 18; viewWidth = viewHeight * camera.aspect;
        material.uniforms.uPixelRatio.value = ratio;
        if (compact !== (w < 760)) {
          // Release the old GPU attributes/VAO before replacing buffers at a breakpoint.
          if (compact !== null) geometry.dispose();
          compact = w < 760; points = createField(compact); positions = new Float32Array(points.length * 3);
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
          for (const [name, key] of [['aSize','size'],['aGlyph','glyph'],['aOpacity','opacity'],['aPhase','phase']] as const)
            geometry.setAttribute(name, new THREE.Float32BufferAttribute(points.map(point => point[key]), 1));
        }
        layout = planetLayout(w);
        planets.forEach((planet, index) => {
          const worldHeight = viewHeight * (18 - planet.z) / 18, worldWidth = worldHeight * camera.aspect;
          planet.pixelUnit = worldHeight / height;
          planet.base.set((layout[index].x - 0.5) * worldWidth, (0.5 - layout[index].y) * worldHeight, planet.z);
          planet.group.scale.setScalar(layout[index].diameter * planet.pixelUnit / 2);
        });
      },
      render(frame) {
        if (context.isContextLost()) throw new Error('Hero WebGL context lost');
        for (let i = 0; i < points.length; i++) {
          fieldPosition(points[i], frame, position);
          positions[i * 3] = position.x * viewWidth;
          positions[i * 3 + 1] = position.y * viewHeight;
          positions[i * 3 + 2] = position.z;
        }
        geometry.attributes.position.needsUpdate = true;
        material.uniforms.uTime.value = frame.time;
        camera.position.x = frame.pointerX * viewWidth * 0.012;
        camera.position.y = frame.pointerY * viewHeight * 0.012;
        camera.lookAt(0, 0, -2);
        planets.forEach((planet, index) => {
          planet.mesh.rotation.y = frame.time * (0.32 + index * 0.06) + layout[index].phase;
          planet.mesh.rotation.z = index === 0 ? 0.2 : -0.12;
          planet.group.position.copy(planet.base);
          planet.group.position.x += Math.sin(frame.time * 0.55 + layout[index].phase) * planet.pixelUnit * 6;
          planet.group.position.y += Math.cos(frame.time * 0.45 + layout[index].phase) * planet.pixelUnit * 5;
        });
        renderer.render(scene, camera);
        if (shaderFailed) throw new Error('Hero shader compilation failed');
      },
    };
  } catch (error) { dispose(); throw error; }
}
