"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import type { BufferGeometry, Material } from 'three';

const pointVertex = `
 attribute float aSize;
 varying vec3 vColor;
 uniform float uPixelRatio;
 void main() {
   vColor = color;
   vec4 p = modelViewMatrix * vec4(position, 1.0);
   gl_PointSize = clamp(aSize * uPixelRatio * (18.0 / -p.z), 1.0, 12.0);
   gl_Position = projectionMatrix * p;
 }`;
const pointFragment = `
 varying vec3 vColor;
 uniform float uOpacity;
 void main() {
   vec2 p = gl_PointCoord - 0.5;
   float glow = exp(-dot(p, p) * 22.0);
   gl_FragColor = vec4(vColor, glow * uOpacity);
   #include <colorspace_fragment>
 }`;
const planetVertex = `
 varying vec3 vNormal;
 varying vec3 vWorld;
 varying vec2 vUv;
 void main() {
   vUv = uv;
   vNormal = normalize(mat3(modelMatrix) * normal);
   vec4 world = modelMatrix * vec4(position, 1.0);
   vWorld = world.xyz;
   gl_Position = projectionMatrix * viewMatrix * world;
 }`;
const planetFragment = `
 varying vec3 vNormal;
 varying vec3 vWorld;
 varying vec2 vUv;
 uniform vec3 uTint;
 uniform float uTime;
 uniform float uKind;
 void main() {
   vec3 n = normalize(vNormal);
   vec3 view = normalize(cameraPosition - vWorld);
   float light = max(dot(n, normalize(vec3(-0.6, 0.8, 1.0))), 0.0);
   float rim = pow(1.0 - max(dot(n, view), 0.0), 3.5);
   float bands = sin(vUv.y * 68.0 + sin(vUv.x * 24.0 + uTime * 0.04) * 2.5);
   float grain = sin(vUv.x * 340.0) * sin(vUv.y * 270.0);
   float detail = mix(0.72 + bands * 0.16, 0.77 + grain * 0.14, uKind);
   vec3 surface = mix(uTint * 0.35, uTint, detail);
   vec3 color = surface * (0.025 + pow(light, 1.6) * 0.88);
   color += vec3(0.026, 0.147, 1.0) * rim * (0.25 + light * 0.45);
   gl_FragColor = vec4(color, 1.0);
   #include <colorspace_fragment>
 }`;

/** Decorative, client-only WebGL scene; SVG remains usable without WebGL or JS. */
export function HeroGalaxy({paused}:{paused:boolean}) {
 const host = useRef<HTMLDivElement>(null);
 const controls = useRef<{setPaused:(value:boolean)=>void} | null>(null);
 const pausedRef = useRef(paused);
 useEffect(() => {pausedRef.current=paused;controls.current?.setPaused(paused);}, [paused]);

 useEffect(() => {
  const element=host.current;
  const hero=element?.closest('section');
  if(!element || !hero)return;
  let cancelled=false;
  let dispose=()=>{};
  async function initialize() {
   const THREE=await import('three');
   if(cancelled || !element || !hero)return;
   let renderer:InstanceType<typeof THREE.WebGLRenderer>;
   try {renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}
   catch {element.dataset.renderer='fallback';return;}
   renderer.setClearColor(0x0a0a0a,0);
   const canvas=renderer.domElement;
   canvas.setAttribute('aria-hidden','true');
   canvas.className='galaxy-canvas';
   element.appendChild(canvas);
   const scene=new THREE.Scene();
   const camera=new THREE.PerspectiveCamera(45,1,0.1,80);
   camera.position.z=12;
   const world=new THREE.Group();scene.add(world);
   const geometries=new Set<BufferGeometry>();
   const materials=new Set<Material>();
   const pointMaterials:InstanceType<typeof THREE.ShaderMaterial>[]=[];
   let seed=10403;
   const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   function points(count:number, spiral:boolean) {
    const positions=new Float32Array(count*3),colors=new Float32Array(count*3),sizes=new Float32Array(count);
    const blue=new THREE.Color('#2D6BFF'),white=new THREE.Color('#FFFFFF');
    for(let i=0;i<count;i++) {
     const radius=Math.pow(random(),0.62)*7;
     const angle=(i%4)*Math.PI/2+radius*1.24+(random()-.5)*0.72;
     positions[i*3]=spiral?Math.cos(angle)*radius:(random()-.5)*32;
     positions[i*3+1]=spiral?(random()-.5)*.35:(random()-.5)*20;
     positions[i*3+2]=spiral?Math.sin(angle)*radius:-5-random()*20;
     const color=blue.clone().lerp(white,spiral?Math.pow(random(),2):.5+random()*.5);
     colors.set([color.r,color.g,color.b],i*3);sizes[i]=.65+random()*2;
    }
    const geometry=new THREE.BufferGeometry();geometries.add(geometry);
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
    geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
    const material=new THREE.ShaderMaterial({vertexShader:pointVertex,fragmentShader:pointFragment,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uPixelRatio:{value:1},uOpacity:{value:spiral?.55:.7}}});
    materials.add(material);pointMaterials.push(material);
    return new THREE.Points(geometry,material);
   }
   const compact=element.clientWidth<760;
   const galaxy=points(compact?1800:4200,true);
   galaxy.rotation.set(1.05,0,-.35);galaxy.position.set(0,.3,-4);
   world.add(galaxy,points(compact?260:650,false));
   const sphere=new THREE.SphereGeometry(1,compact?32:64,compact?24:48);geometries.add(sphere);
   const planets=[{x:-.37,y:.27,size:1.04,tint:'#2D6BFF',kind:0},{x:.37,y:-.27,size:1.12,tint:'#FFFFFF',kind:0},{x:.33,y:.32,size:.32,tint:'#FFFFFF',kind:1}].map((config,index)=>{
    const material=new THREE.ShaderMaterial({vertexShader:planetVertex,fragmentShader:planetFragment,uniforms:{uTint:{value:new THREE.Color(config.tint)},uTime:{value:0},uKind:{value:config.kind}}});
    materials.add(material);
    const group=new THREE.Group();const mesh=new THREE.Mesh(sphere,material);group.add(mesh);world.add(group);
    if(index===1) {
     const geometry=new THREE.RingGeometry(1.3,1.88,128);geometries.add(geometry);
     const ringMaterial=new THREE.ShaderMaterial({vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
      varying vec2 vUv;
      void main(){
       float radius=length(vUv-.5)*2.0;
       float bands=pow(abs(sin(radius*180.0)),8.0);
       float alpha=(.06+bands*.27)*smoothstep(.69,.75,radius);
       gl_FragColor=vec4(mix(vec3(.026,.147,1.0),vec3(.5,.65,1.0),bands*.5),alpha);
       #include <colorspace_fragment>
      }`,transparent:true,side:THREE.DoubleSide,depthWrite:false});materials.add(ringMaterial);
     const ring=new THREE.Mesh(geometry,ringMaterial);ring.rotation.set(.95,-.2,-.4);group.add(ring);
    }
    return {group,mesh,material,config,baseY:0};
   });
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
   const fine=window.matchMedia('(pointer: fine)');
   const pointer={x:0,y:0};
   let visible=true,running=false,lost=false,elapsed=0;
   function render(delta=0) {
    elapsed+=delta;
    const amount=1-Math.exp(-delta*3.5);
    world.rotation.y+=(pointer.x*.16-world.rotation.y)*amount;
    world.rotation.x+=(-pointer.y*.08-world.rotation.x)*amount;
    galaxy.rotation.y=elapsed*.025;
    planets.forEach((planet,index)=>{
     planet.mesh.rotation.y=elapsed*(.035+index*.012);
     planet.group.position.y=planet.baseY+Math.sin(elapsed*.2+index)*.12;
     planet.material.uniforms.uTime.value=elapsed;
    });
    renderer.render(scene,camera);
   }
   const tick=(_time:number,delta:number)=>render(Math.min(delta/1000,.05));
   function activity() {
    const next=visible&&!document.hidden&&!reduced.matches&&!pausedRef.current&&!lost;
    element!.dataset.motion=next?'running':'paused';
    if(next===running)return;
    running=next;
    if(running)gsap.ticker.add(tick);else gsap.ticker.remove(tick);
   }
   function resize() {
    const width=element!.clientWidth,height=element!.clientHeight;
    if(!width || !height)return;
    const pixelRatio=Math.min(window.devicePixelRatio||1,width<760?1.25:1.75);
    renderer.setPixelRatio(pixelRatio);renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
    const worldHeight=2*Math.tan(Math.PI/8)*12,worldWidth=worldHeight*camera.aspect;
    planets.forEach(planet=>{
     planet.group.position.x=worldWidth*planet.config.x;
     planet.baseY=worldHeight*(planet.config.y-(width<760&&planet.config.y<0?.11:0));
     planet.group.scale.setScalar(planet.config.size*(width<760?.52:1));
    });
    pointMaterials.forEach(material=>{material.uniforms.uPixelRatio.value=pixelRatio;});
    render();
   }
   function move(event:PointerEvent) {
    if(!fine.matches||reduced.matches||pausedRef.current||event.pointerType==='touch')return;
    const bounds=hero!.getBoundingClientRect();
    pointer.x=((event.clientX-bounds.left)/bounds.width-.5)*2;
    pointer.y=((event.clientY-bounds.top)/bounds.height-.5)*2;
   }
   const leave=()=>{pointer.x=0;pointer.y=0;};
   const preference=()=>{leave();if(reduced.matches){world.rotation.set(0,0,0);render();}activity();};
   const contextLost=(event:Event)=>{event.preventDefault();lost=true;element!.dataset.renderer='fallback';activity();};
   const contextRestored=()=>{lost=false;element!.dataset.renderer='ready';resize();activity();};
   const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;activity();},{threshold:0});observer.observe(hero);
   const dimensions=new ResizeObserver(resize);dimensions.observe(element);
   hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',leave);
   document.addEventListener('visibilitychange',activity);reduced.addEventListener('change',preference);
   canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);
   controls.current={setPaused:activity};
   resize();element.dataset.renderer='ready';activity();
   dispose=()=>{
    controls.current=null;gsap.ticker.remove(tick);observer.disconnect();dimensions.disconnect();
    hero.removeEventListener('pointermove',move);hero.removeEventListener('pointerleave',leave);
    document.removeEventListener('visibilitychange',activity);reduced.removeEventListener('change',preference);
    canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
    renderer.dispose();renderer.forceContextLoss();canvas.remove();
   };
  }
  const start=()=>{void initialize().catch(()=>{if(!cancelled&&element)element.dataset.renderer='fallback';});};
  const idle=window.requestIdleCallback?.(start,{timeout:1200});
  const timer=idle===undefined?window.setTimeout(start,80):undefined;
  return ()=>{cancelled=true;if(idle!==undefined)window.cancelIdleCallback(idle);if(timer!==undefined)clearTimeout(timer);dispose();};
 },[]);

 return <div ref={host} className="hero-galaxy" data-renderer="loading" aria-hidden="true">
  <svg className="galaxy-fallback" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="planet-light"><stop stopColor="#2D6BFF"/><stop offset="1" stopColor="#0A0A0A"/></radialGradient></defs><g fill="none" stroke="#2D6BFF" strokeOpacity=".13">{Array.from({length:16},(_,i)=><ellipse key={i} cx="700" cy="450" rx={100+i*30} ry={45+i*14} transform="rotate(-25 700 450)"/>)}</g><circle cx="180" cy="230" r="85" fill="url(#planet-light)"/><circle cx="1170" cy="650" r="98" fill="url(#planet-light)"/><ellipse cx="1170" cy="650" rx="165" ry="42" transform="rotate(-25 1170 650)" fill="none" stroke="#2D6BFF" strokeOpacity=".4"/></svg>
 </div>;
}
