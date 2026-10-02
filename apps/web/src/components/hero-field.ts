/** Shared composition for WebGL and the animated Canvas2D fallback. */
export type HeroFrame = { time: number; pointerX: number; pointerY: number; influence: number };
export type HeroEngine = {
  canvas: HTMLCanvasElement;
  kind: 'webgl' | 'canvas2d';
  resize: (width: number, height: number, pixelRatio: number) => void;
  render: (frame: HeroFrame) => void;
  dispose: () => void;
};
export type FieldPoint = { along: number; across: number; size: number; phase: number; glyph: number; opacity: number };
export type FieldPosition = { x: number; y: number; z: number };
export const fieldGlyphs = ['0', '1', '{', '}', '<', '>', '/', '+'];

export function createField(compact: boolean): FieldPoint[] {
  let seed = 10403;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const columns = compact ? 72 : 132, rows = compact ? 12 : 18;
  return Array.from({ length: columns * rows }, (_, index) => {
    const across = ((index % rows) + random() * 0.6) / (rows - 1) * 2 - 1;
    return {
      along: (Math.floor(index / rows) + random() * 0.6) / (columns - 1) * 2 - 1,
      across, size: 1.2 + random() * 1.5, phase: random() * Math.PI * 2,
      glyph: random() > 0.55 ? Math.floor(random() * fieldGlyphs.length) : -1,
      opacity: 0.2 + Math.pow(Math.abs(across), 2) * 0.65 + random() * 0.15,
    };
  });
}

/** A twisting ribbon, not a rigid object rotating around its center. Coordinates are viewport-relative. */
export function fieldPosition(point: FieldPoint, frame: HeroFrame, out: FieldPosition) {
  const u = point.along, v = point.across, t = frame.time;
  const twist = u * 4.6 + t * 0.58;
  const width = 0.07 + 0.075 * (0.5 + 0.5 * Math.cos(u * 3.8 - t * 0.62));
  out.x = u * 0.62 + Math.sin(v * 1.4 + u * 3 + t * 0.45) * 0.018;
  out.y = u * 0.15 + Math.sin(u * 3.2 - t * 0.7) * 0.11
    + Math.sin(u * 6 + t * 0.4) * 0.035 + v * width * Math.cos(twist);
  out.z = Math.sin(twist) * v * 2 + Math.sin(u * 3.4 - t * 0.6) * 1.2;
  const dx = out.x - frame.pointerX * 0.5, dy = out.y - frame.pointerY * 0.5;
  const push = Math.exp(-(dx * dx + dy * dy) * 24) * frame.influence;
  out.x += dx * push * 0.15;
  out.y += dy * push * 0.3;
  out.z += push * 0.9;
}

export function planetLayout(width: number) {
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  return width < 760 ? [
    { x: 0.12, y: 0.22, diameter: clamp(width * 0.095, 26, 40), phase: 0.5 },
    { x: 0.9, y: 0.855, diameter: clamp(width * 0.055, 18, 26), phase: 2.3 },
    { x: 0.885, y: 0.22, diameter: clamp(width * 0.035, 12, 16), phase: 4.1 },
  ] : [
    { x: 0.13, y: 0.26, diameter: clamp(width * 0.058, 56, 84), phase: 0.5 },
    { x: 0.875, y: 0.76, diameter: clamp(width * 0.038, 38, 56), phase: 2.3 },
    { x: 0.88, y: 0.24, diameter: clamp(width * 0.021, 20, 30), phase: 4.1 },
  ];
}

export function createCanvasEngine(): HeroEngine | null {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return null;
  canvas.className = 'galaxy-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  let width = 1, height = 1, ratio = 1;
  let points = createField(false);
  let planets = planetLayout(width);
  const position = { x: 0, y: 0, z: 0 };
  return {
    canvas, kind: 'canvas2d',
    resize(w, h, pixelRatio) {
      width = w; height = h; ratio = pixelRatio;
      canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio);
      points = createField(w < 760); planets = planetLayout(w);
    },
    render(frame) {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.font = `${width < 760 ? 9 : 11}px monospace`;
      context.textAlign = 'center'; context.textBaseline = 'middle';
      for (const point of points) {
        fieldPosition(point, frame, position);
        const depth = 18 / (18 - position.z);
        const x = width * (0.5 + position.x * depth) - frame.pointerX * 9 * depth;
        const y = height * (0.5 - position.y * depth) + frame.pointerY * 6 * depth;
        context.globalAlpha = point.opacity * (0.72 + 0.2 * Math.sin(frame.time * 0.8 + point.phase));
        context.fillStyle = point.glyph >= 0 ? '#5487ff' : '#2D6BFF';
        if (point.glyph >= 0) context.fillText(fieldGlyphs[point.glyph], x, y);
        else context.fillRect(x, y, point.size * 0.65, point.size * 0.65);
      }
      context.globalAlpha = 1;
      planets.forEach((planet, index) => {
        const radius = planet.diameter / 2;
        const x = width * planet.x + Math.sin(frame.time * 0.55 + planet.phase) * 6 - frame.pointerX * (10 + index * 3);
        const y = height * planet.y + Math.cos(frame.time * 0.45 + planet.phase) * 5 + frame.pointerY * (7 + index * 2);
        if (index === 1) {
          context.strokeStyle = '#5487ff50'; context.lineWidth = 3;
          context.beginPath(); context.ellipse(x, y, radius * 1.8, radius * 0.4, -0.3, 0, Math.PI * 2); context.stroke();
        }
        const lightX = x - radius * 0.3 + Math.sin(frame.time * 0.25 + planet.phase) * radius * 0.12;
        const gradient = context.createRadialGradient(lightX, y - radius * 0.35, 0, x, y, radius);
        gradient.addColorStop(0, index === 0 ? '#477cca' : '#95a5bf');
        gradient.addColorStop(0.5, index === 0 ? '#173359' : '#3e4b60'); gradient.addColorStop(1, '#080d17');
        context.fillStyle = gradient;
        context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
      });
    },
    dispose() { canvas.remove(); canvas.width = 0; canvas.height = 0; },
  };
}
