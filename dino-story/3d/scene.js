// "What if the asteroid missed?" - deterministic 3D scene.
// window.frame(t) renders time t (seconds) and returns a JPEG data URL.
import * as THREE from 'three';

const W = 1080, H = 1920;
export const DURATION = 50;

// ---------------------------------------------------------------- helpers
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const win = (t, a, b, fi = 0.4, fo = 0.4) =>
  (t < a || t > b) ? 0 : smooth((t - a) / fi) * smooth((b - t) / fo);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function rng(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const R = rng(42);
const perm = new Uint16Array(512), vals = new Float32Array(256);
for (let i = 0; i < 256; i++) { perm[i] = i; vals[i] = R(); }
for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const h = (a, b, c) => vals[perm[perm[perm[a & 255] + (b & 255)] + (c & 255)]];
  const x00 = lerp(h(xi, yi, zi), h(xi + 1, yi, zi), u);
  const x10 = lerp(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u);
  const x01 = lerp(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u);
  const x11 = lerp(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
function fbm(x, y, z, oct = 5) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); n += a; f *= 2; a *= 0.5; }
  return s / n;
}

// --------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const out = document.createElement('canvas');
out.width = W; out.height = H;
const ctx = out.getContext('2d');

function radialTexture(inner, outer, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}
const DOT = radialTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)', 64);

// ============================================================ SPACE SCENE
const space = new THREE.Scene();
space.background = new THREE.Color(0x000004);
const spaceCam = new THREE.PerspectiveCamera(50, W / H, 0.1, 2000);

{ // stars
  const n = 4000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const r = rng(7);
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI * 2, ph = Math.acos(2 * r() - 1), rad = 600;
    pos.set([rad * Math.sin(ph) * Math.cos(th), rad * Math.cos(ph), rad * Math.sin(ph) * Math.sin(th)], i * 3);
    const b = 0.5 + r() * 0.5, warm = r();
    col.set([b, b * (0.9 + 0.1 * warm), b * (0.8 + 0.2 * (1 - warm))], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  space.add(new THREE.Points(g, new THREE.PointsMaterial({
    size: 2.2, sizeAttenuation: false, vertexColors: true, map: DOT, transparent: true, depthWrite: false })));
}

const LR = rng(77);
function earthTextures() {
  const w = 1024, h = 512;
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cs = [mk(), mk(), mk()];
  const ims = cs.map(c => c.getContext('2d').createImageData(w, h));
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - y / h) * Math.PI;
    for (let x = 0; x < w; x++) {
      const lon = (x / w) * Math.PI * 2;
      const X = Math.cos(lat) * Math.cos(lon), Y = Math.sin(lat), Z = Math.cos(lat) * Math.sin(lon);
      const e = fbm(X * 1.7 + 5, Y * 1.7, Z * 1.7, 5);
      const i = (y * w + x) * 4;
      let r, g, b;
      if (Math.abs(Y) > 0.9 + 0.05 * e) { r = 235; g = 240; b = 245; }
      else if (e > 0.53) {
        const k = clamp((e - 0.53) / 0.2), dry = clamp(1 - Math.abs(Y) * 1.6) * k;
        r = lerp(55, 160, dry); g = lerp(115, 135, dry); b = lerp(45, 80, dry);
      } else {
        const k = clamp((e - 0.3) / 0.23);
        r = lerp(8, 30, k); g = lerp(30, 95, k); b = lerp(75, 150, k);
      }
      ims[0].data.set([r, g, b, 255], i);
      const cl = fbm(X * 3 + 9, Y * 4, Z * 3, 5);
      ims[1].data.set([255, 255, 255, 255 * smooth((cl - 0.5) / 0.18)], i);
      const lit = e > 0.55 && Math.abs(Y) < 0.8 && fbm(X * 6, Y * 6, Z * 6, 3) > 0.5 && LR() < 0.06;
      ims[2].data.set(lit ? [255, 190, 110, 255] : [0, 0, 0, 255], i);
    }
  }
  return cs.map((c, k) => {
    c.getContext('2d').putImageData(ims[k], 0, 0);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
    return tx;
  });
}
const [earthMap, cloudMap, lightsMap] = earthTextures();
const earth = new THREE.Mesh(new THREE.SphereGeometry(10, 128, 96),
  new THREE.MeshStandardMaterial({ map: earthMap, roughness: 0.85, metalness: 0,
    emissiveMap: lightsMap, emissive: new THREE.Color(1, 0.85, 0.6), emissiveIntensity: 0 }));
const clouds = new THREE.Mesh(new THREE.SphereGeometry(10.12, 96, 72),
  new THREE.MeshStandardMaterial({ map: cloudMap, transparent: true, depthWrite: false }));
const atmo = new THREE.Mesh(new THREE.SphereGeometry(10.35, 96, 72), new THREE.ShaderMaterial({
  uniforms: { c: { value: new THREE.Color(0.35, 0.6, 1.0) }, k: { value: 1.0 } },
  vertexShader: `varying vec3 vN; varying vec3 vV;
    void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal);
    vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 c; uniform float k; varying vec3 vN; varying vec3 vV;
    void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6); gl_FragColor = vec4(c*f*1.8*k, f*k); }`,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
const earthGroup = new THREE.Group();
earthGroup.add(earth, clouds, atmo);
earthGroup.rotation.z = 0.41;
space.add(earthGroup);
const sun = new THREE.DirectionalLight(0xfff4e0, 3.2);
sun.position.set(60, 20, 40);
space.add(sun, new THREE.AmbientLight(0x223355, 0.25));

// asteroid
const astGeo = new THREE.IcosahedronGeometry(1.3, 4);
{
  const p = astGeo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.4 + 3, v.y * 1.4, v.z * 1.4, 4);
    v.multiplyScalar(0.75 + 0.6 * n);
    v.x *= 1.25;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  astGeo.computeVertexNormals();
}
const asteroid = new THREE.Mesh(astGeo, new THREE.MeshStandardMaterial({
  color: 0x6b5d52, roughness: 1, flatShading: true, emissive: 0x401000, emissiveIntensity: 0.4 }));
const astGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: radialTexture('rgba(255,180,90,0.9)', 'rgba(255,80,0,0)'), blending: THREE.AdditiveBlending,
  depthWrite: false, transparent: true }));
astGlow.scale.set(9, 9, 1);
space.add(asteroid, astGlow);
const TRAIL_N = 700;
const trailGeo = new THREE.BufferGeometry();
const trailPos = new Float32Array(TRAIL_N * 3), trailCol = new Float32Array(TRAIL_N * 3);
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
trailGeo.setAttribute('color', new THREE.BufferAttribute(trailCol, 3));
const trailJit = Array.from({ length: TRAIL_N }, () => [R(), R() - 0.5, R() - 0.5, R() - 0.5]);
const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({
  size: 1.1, vertexColors: true, map: DOT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
space.add(trail);

const P0 = V(70, 34, -110), P1 = V(5, 15.5, 1), P2 = V(-90, 6, 80);
const bez = u => P0.clone().multiplyScalar((1 - u) ** 2)
  .add(P1.clone().multiplyScalar(2 * u * (1 - u))).add(P2.clone().multiplyScalar(u * u));
const UK = [[0, 0], [7, 0.38], [10.5, 0.56], [13, 1.0]];
function astU(t) {
  for (let i = 0; i < UK.length - 1; i++) {
    const [t0, u0] = UK[i], [t1, u1] = UK[i + 1];
    if (t <= t1) return lerp(u0, u1, (t - t0) / (t1 - t0));
  }
  return 1;
}

function updateSpace(t) {
  const ending = t >= 44;
  earth.rotation.y = t * 0.04 + (t > 13 && t < 20 ? (t - 13) ** 2 * 0.35 : t >= 20 ? 49 * 0.35 : 0);
  clouds.rotation.y = earth.rotation.y * 1.08 + t * 0.01;
  earth.material.emissiveIntensity = ending ? 3.0 * seg(t, 45, 47) : 0;
  atmo.material.uniforms.k.value = ending ? 0.55 : 1.0;

  const u = astU(t);
  const p = bez(u), dir = bez(Math.min(1, u + 0.01)).sub(bez(Math.max(0, u - 0.01))).normalize();
  const show = t < 13.5;
  asteroid.visible = astGlow.visible = trail.visible = show;
  asteroid.position.copy(p);
  asteroid.rotation.set(t * 0.4, t * 0.7, 0);
  astGlow.position.copy(p);
  // a burning trail only near the atmosphere; a faint dust tail elsewhere
  const heat = 0.35 + 0.65 * clamp(1 - (p.length() - 12) / 25);
  for (let i = 0; i < TRAIL_N; i++) {
    const [a, jx, jy, jz] = trailJit[i];
    const age = (a + t * 0.9) % 1;
    const d = age * (10 + 22 * heat);
    trailPos.set([p.x - dir.x * d + jx * age * 3, p.y - dir.y * d + jy * age * 3,
                  p.z - dir.z * d + jz * age * 3], i * 3);
    const f = (1 - age) * heat;
    trailCol.set([f, f * (0.75 - 0.5 * age), f * 0.35 * (1 - age)], i * 3);
  }
  trailGeo.attributes.position.needsUpdate = true;
  trailGeo.attributes.color.needsUpdate = true;

  // cameras
  if (t < 7) {
    const k = smooth(t / 7);
    spaceCam.position.set(lerp(-2, 4, k), lerp(-4, 0, k), lerp(44, 38, k));
    spaceCam.lookAt(0, lerp(9, 8, k), 0);
  } else if (t < 13) {
    const k = smooth(seg(t, 7, 11));
    spaceCam.position.set(lerp(4, 16, k), lerp(0, 24, k), lerp(38, 26, k));
    const look = V(0, 8, 0).lerp(p, smooth(seg(t, 7, 9.5)) * (1 - 0.5 * smooth(seg(t, 11.5, 13))));
    spaceCam.lookAt(look);
  } else if (t < 20) {
    const k = seg(t, 13, 19), ang = 0.6 + k * 1.2;
    const rad = lerp(36, 30, k) - 19 * smooth(seg(t, 18.6, 20));
    spaceCam.position.set(Math.sin(ang) * rad, lerp(8, 4, k), Math.cos(ang) * rad);
    spaceCam.lookAt(0, 0, 0);
  } else {
    const k = smooth(seg(t, 44, 50));
    spaceCam.position.set(lerp(-14, -22, k), lerp(3, 9, k), lerp(-16, -32, k));
    spaceCam.lookAt(0, lerp(0, 4, k), 0);
  }
}

// =========================================================== GROUND SCENE
const ground = new THREE.Scene();
const groundCam = new THREE.PerspectiveCamera(55, W / H, 0.1, 1200);
const FOG = new THREE.Color(0xc9d8e0);
ground.fog = new THREE.Fog(FOG, 80, 420);
const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x3a78c2) }, bot: { value: FOG } },
  vertexShader: `varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 top; uniform vec3 bot; varying float vY; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(0.0, 0.5, vY)), 1.0); }`
}));
ground.add(sky);
ground.add(new THREE.HemisphereLight(0xcfe6ff, 0x4a5a2a, 1.1));
const gSun = new THREE.DirectionalLight(0xfff0d0, 2.6);
gSun.castShadow = true;
gSun.shadow.mapSize.set(2048, 2048);
Object.assign(gSun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 });
gSun.shadow.bias = -0.0008;
ground.add(gSun, gSun.target);

const CITY_Z = 95;
function heightAt(x, z) {
  const hills = (fbm(x * 0.012 + 11, 0.5, z * 0.012 - 3, 5) - 0.45) * 70;
  const valley = smooth((Math.abs(x) - 14) / 50);
  const river = Math.abs(x) < 8 ? -1.4 * (1 - Math.abs(x) / 8) : 0;
  const cityFlat = 1 - smooth((Math.hypot(x, (z - CITY_Z - 25) * 0.6) - 40) / 30);
  return Math.max(hills, 0) * valley * (1 - cityFlat) + river + fbm(x * 0.2, 1, z * 0.2, 2) * 0.6;
}
{
  let g = new THREE.PlaneGeometry(700, 700, 200, 200).rotateX(-Math.PI / 2);
  g = g.toNonIndexed();
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = heightAt(x, z);
    p.setY(i, y);
    const n = fbm(x * 0.05, 2, z * 0.05, 3);
    let c = y < -0.6 ? [0.55, 0.5, 0.36] : y > 22 ? [0.45, 0.43, 0.38] : [lerp(0.2, 0.36, n), lerp(0.42, 0.55, n), lerp(0.14, 0.2, n)];
    col.set(c, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const terrain = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
  terrain.receiveShadow = true;
  ground.add(terrain);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(13, 700).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x3b7fa3, roughness: 0.15, metalness: 0.2 }));
  river.position.y = -0.55;
  ground.add(river);
}
{ // trees
  const n = 900, r = rng(9);
  const cone = new THREE.ConeGeometry(2.2, 8, 6), trunk = new THREE.CylinderGeometry(0.35, 0.45, 2.5, 5);
  cone.translate(0, 6, 0); trunk.translate(0, 1.25, 0);
  const cm = new THREE.InstancedMesh(cone, new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 }), n);
  const tm = new THREE.InstancedMesh(trunk, new THREE.MeshStandardMaterial({ color: 0x5a3e2b }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color();
  let k = 0;
  while (k < n) {
    const x = (r() - 0.5) * 520, z = (r() - 0.5) * 520 - 40;
    if (Math.abs(x) < 16 || (Math.abs(x) < 70 && z > CITY_Z - 10 && z < CITY_Z + 70)) continue;
    if (Math.abs(x - 22) < 6 && Math.abs(z) < 8) continue; // mammal spot
    const sc = 0.7 + r() * 0.9;
    s.set(sc, sc * (0.8 + r() * 0.6), sc);
    m.compose(V(x, heightAt(x, z) - 0.3, z), q.setFromEuler(new THREE.Euler(0, r() * 6, 0)), s);
    cm.setMatrixAt(k, m); tm.setMatrixAt(k, m);
    cm.setColorAt(k, c.setHSL(0.27 + r() * 0.08, 0.45, 0.18 + r() * 0.1));
    k++;
  }
  cm.castShadow = tm.castShadow = true;
  ground.add(cm, tm);
}

// --- creature builders (forward = +x) ---
function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...extra });
}
function ball(r, m, seg = 10) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 3)), m);
  o.castShadow = true; return o;
}
function limb(r1, r2, len, m) { // pivot at top, hangs down -y
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, len, 7), m);
  c.position.y = -len / 2; c.castShadow = true; g.add(c); return g;
}
function chain(n, from, to, r0, r1, m, droop = 0) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1);
    const b = ball(lerp(r0, r1, s), m, 8);
    b.userData.base = V(lerp(from.x, to.x, s), lerp(from.y, to.y, s) - droop * Math.sin(s * Math.PI), lerp(from.z, to.z, s));
    b.userData.s = s;
    b.position.copy(b.userData.base);
    parts.push(b);
  }
  return parts;
}

function makeSauropod(color) {
  const m = mat(color), belly = mat(0xb9a47a);
  const g = new THREE.Group();
  const body = ball(1, m, 14); body.scale.set(4.6, 2.7, 2.4); body.position.y = 7.3; g.add(body);
  const bel = ball(1, belly, 12); bel.scale.set(4, 1.8, 2.0); bel.position.set(0, 6.6, 0); g.add(bel);
  const neck = chain(11, V(3.6, 8.5, 0), V(9.5, 17.5, 0), 1.35, 0.55, m, -1.2);
  const tail = chain(13, V(-3.8, 7.6, 0), V(-14, 4.2, 0), 1.4, 0.15, m, 1.0);
  neck.concat(tail).forEach(b => g.add(b));
  const head = ball(0.6, m, 10); head.scale.set(1.7, 0.9, 0.9); g.add(head);
  const legs = [[2.6, 1.4], [2.6, -1.4], [-2.6, 1.4], [-2.6, -1.4]].map(([x, z]) => {
    const l = limb(0.85, 0.75, 6.8, m); l.position.set(x, 6.6, z); g.add(l); return l;
  });
  return {
    group: g,
    update(t, phase = 0) {
      const w = 2.2;
      legs.forEach((l, i) => { l.rotation.z = Math.sin(t * w + phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.3; });
      body.position.y = 7.3 + Math.abs(Math.sin(t * w + phase)) * 0.15;
      neck.forEach(b => { const s = b.userData.s;
        b.position.set(b.userData.base.x, b.userData.base.y + Math.sin(t * 0.7 + phase) * s * 0.8, b.userData.base.z + Math.sin(t * 0.5 + phase) * s * 1.2); });
      const last = neck[neck.length - 1].position;
      head.position.set(last.x + 0.9, last.y + 0.1, last.z);
      tail.forEach(b => { const s = b.userData.s;
        b.position.set(b.userData.base.x, b.userData.base.y, Math.sin(t * 1.4 - s * 2 + phase) * s * 2.2); });
    } };
}

function makeTheropod(color) {
  const m = mat(color), dark = mat(0x2b1d14), stripe = mat(0x6e4a2a);
  const g = new THREE.Group();
  const torso = new THREE.Group(); torso.position.y = 5.2; g.add(torso);
  const body = ball(1, m, 14); body.scale.set(3.0, 1.7, 1.5); torso.add(body);
  const back = ball(1, stripe, 10); back.scale.set(2.6, 0.6, 1.0); back.position.set(0, 1.25, 0); torso.add(back);
  const neckB = ball(1, m, 10); neckB.scale.set(1.4, 1.1, 1.0); neckB.position.set(2.7, 0.9, 0); torso.add(neckB);
  const head = new THREE.Group(); head.position.set(3.6, 1.6, 0); torso.add(head);
  const skull = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.15, 1.1), m); skull.position.set(1.0, 0, 0); skull.castShadow = true; head.add(skull);
  const snout = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 0.9), m); snout.position.set(2.5, -0.1, 0); head.add(snout);
  const jaw = new THREE.Group(); jaw.position.set(0, -0.5, 0); head.add(jaw);
  const jm = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.4, 0.95), m); jm.position.set(1.4, -0.2, 0); jaw.add(jm);
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 0.8), mat(0x7a1e1e)); mouth.position.set(1.3, 0.05, 0); jaw.add(mouth);
  for (const z of [0.56, -0.56]) {
    const e = ball(0.13, new THREE.MeshStandardMaterial({ color: 0xffc400, emissive: 0x553300 }), 8);
    e.position.set(0.6, 0.3, z); head.add(e);
  }
  for (let i = 0; i < 6; i++) { // teeth
    const tth = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 4), mat(0xf2ecd8));
    tth.rotation.x = Math.PI; tth.position.set(0.9 + i * 0.4, -0.65, 0.38); head.add(tth);
    const t2 = tth.clone(); t2.position.z = -0.38; head.add(t2);
  }
  const tail = chain(12, V(-2.6, 5.3, 0), V(-10.5, 4.6, 0), 1.2, 0.12, m, -0.4);
  tail.forEach(b => g.add(b));
  const arms = [0.9, -0.9].map(z => { const a = limb(0.16, 0.12, 1.1, dark); a.position.set(2.2, -0.4, z); a.rotation.z = -0.8; torso.add(a); return a; });
  const legs = [1.0, -1.0].map(z => {
    const thigh = limb(0.75, 0.45, 2.8, m); thigh.position.set(0, 4.9, z); g.add(thigh);
    const shin = limb(0.42, 0.3, 2.6, m); shin.position.set(0, -2.7, 0); thigh.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.6), dark); foot.position.set(0.5, -2.6, 0); shin.add(foot);
    return { thigh, shin };
  });
  return {
    group: g, head, jaw,
    update(t, w = 3.2, roar = 0) {
      legs.forEach((l, i) => {
        const ph = t * w + i * Math.PI;
        l.thigh.rotation.z = Math.sin(ph) * 0.45;
        l.shin.rotation.z = -0.25 - Math.max(0, Math.cos(ph)) * 0.5;
      });
      torso.position.y = 5.2 + Math.abs(Math.cos(t * w)) * 0.25;
      torso.rotation.z = -0.05 + roar * 0.12;
      head.rotation.z = roar * 0.45 + Math.sin(t * 1.3) * 0.05;
      jaw.rotation.z = -roar * 0.7;
      tail.forEach(b => { const s = b.userData.s;
        b.position.set(b.userData.base.x, b.userData.base.y + Math.sin(t * w * 0.5) * s * 0.4, Math.sin(t * w * 0.5 - s * 2) * s * 1.6); });
    } };
}

function makePterosaur(color) {
  const m = mat(color, { side: THREE.DoubleSide });
  const g = new THREE.Group();
  const body = ball(0.5, m, 8); body.scale.set(2.2, 0.8, 0.8); g.add(body);
  const head = ball(0.35, m, 8); head.scale.set(1.3, 1, 1); head.position.set(1.3, 0.3, 0); g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.8, 5), m); beak.rotation.z = -Math.PI / 2; beak.position.set(2.4, 0.25, 0); g.add(beak);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1.4, 4), m); crest.rotation.z = Math.PI / 2 + 0.3; crest.position.set(0.5, 0.6, 0); g.add(crest);
  const wings = [1, -1].map(sd => {
    const piv = new THREE.Group(); g.add(piv);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0.8, 0, 0, -0.8, 0, 0, 0.2, 0, 5.5 * sd]), 3));
    geo.computeVertexNormals();
    const wm = new THREE.Mesh(geo, m); wm.castShadow = true; piv.add(wm);
    return [piv, sd];
  });
  return { group: g, update(t, ph = 0) { wings.forEach(([p, sd]) => { p.rotation.x = Math.sin(t * 5 + ph) * 0.6 * sd; }); } };
}

function makeDinosauroid() {
  const skin = mat(0x6f8f5a), pale = mat(0xb9c79a);
  const g = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.3, 6, 10), skin); torso.position.y = 2.6; torso.castShadow = true; g.add(torso);
  const chest = ball(0.45, pale, 10); chest.scale.set(0.6, 1.1, 0.9); chest.position.set(0.25, 2.7, 0); g.add(chest);
  const headG = new THREE.Group(); headG.position.y = 3.95; g.add(headG);
  const head = ball(0.62, skin, 14); head.scale.set(1.05, 1.05, 0.95); headG.add(head);
  const muzzle = ball(0.35, skin, 10); muzzle.scale.set(1.1, 0.7, 0.9); muzzle.position.set(0.5, -0.25, 0); headG.add(muzzle);
  const lids = [];
  for (const z of [0.27, -0.27]) {
    const e = ball(0.2, new THREE.MeshStandardMaterial({ color: 0xf2e9a0, roughness: 0.3 }), 12); e.position.set(0.45, 0.12, z); headG.add(e);
    const p = ball(0.09, new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 }), 8); p.scale.set(0.5, 1.4, 1); p.position.set(0.62, 0.12, z); headG.add(p);
    const lid = ball(0.21, skin, 10); lid.position.copy(e.position); lid.scale.y = 0.05; headG.add(lid); lids.push(lid);
  }
  const arms = [0.72, -0.72].map(z => { const a = limb(0.16, 0.13, 1.5, skin); a.position.set(0, 3.2, z); g.add(a); return a; });
  [0.3, -0.3].forEach(z => { const l = limb(0.22, 0.17, 1.9, skin); l.position.set(0, 1.9, z); g.add(l); });
  return { group: g, update(t) {
    headG.rotation.z = Math.sin(t * 0.6) * 0.06; headG.rotation.y = Math.sin(t * 0.4) * 0.25;
    arms[0].rotation.z = 0.1 + Math.sin(t * 0.8) * 0.05; arms[1].rotation.z = 0.1 - Math.sin(t * 0.8) * 0.05;
    const blink = (t % 3.1) < 0.15; lids.forEach(l => { l.scale.y = blink ? 1 : 0.05; });
  } };
}

function makeShrew() {
  const fur = mat(0x6b4a33), pink = mat(0xd9998f);
  const g = new THREE.Group();
  const body = ball(0.5, fur, 12); body.scale.set(1.4, 0.75, 0.8); body.position.y = 0.4; g.add(body);
  const head = ball(0.32, fur, 10); head.position.set(0.7, 0.5, 0); g.add(head);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), fur); snout.rotation.z = -Math.PI / 2; snout.position.set(1.1, 0.45, 0); g.add(snout);
  const nose = ball(0.06, pink, 6); nose.position.set(1.36, 0.45, 0); g.add(nose);
  for (const z of [0.18, -0.18]) {
    const ear = ball(0.12, pink, 8); ear.scale.set(0.5, 1, 1); ear.position.set(0.6, 0.78, z); g.add(ear);
    const eye = ball(0.05, new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.1 }), 6); eye.position.set(0.9, 0.58, z * 0.9); g.add(eye);
  }
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 1.0, 5), pink); tail.rotation.z = Math.PI / 2 - 0.3; tail.position.set(-1.1, 0.35, 0); g.add(tail);
  return { group: g, head, update(t) { head.position.y = 0.5 + Math.sin(t * 9) * 0.03; g.rotation.y = Math.sin(t * 1.7) * 0.3; } };
}

const herd = [makeSauropod(0x7d8b5a), makeSauropod(0x8a7a55), makeSauropod(0x6d7d55)];
const herdPos = [[11, -48], [17, -66], [7, -82]];
herd.forEach(h => { h.group.rotation.y = -Math.PI / 2; ground.add(h.group); });
const rex = makeTheropod(0x8a5a33); ground.add(rex.group);
const rex2 = makeTheropod(0x6d4a2c); rex2.group.scale.setScalar(1.6); ground.add(rex2.group);
const pteros = [0, 1, 2, 3, 4].map(i => { const p = makePterosaur(0x5a4636); p.group.scale.setScalar(1.3); ground.add(p.group); return p; });
const sauroid = makeDinosauroid(); sauroid.group.scale.setScalar(1.6); ground.add(sauroid.group);
const shrew = makeShrew(); shrew.group.scale.setScalar(1.5); ground.add(shrew.group);

{ // city of the dinosauroids
  const r = rng(21);
  const ms = [mat(0xd8c9a8), mat(0xb7c9c2), mat(0xc9b28f), mat(0x9fb5a8)];
  const glass = new THREE.MeshStandardMaterial({ color: 0x8fb8c8, roughness: 0.2, metalness: 0.6, flatShading: true });
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 120, z = CITY_Z + 10 + r() * 70;
    if (Math.abs(x) < 9 && z < CITY_Z + 30) continue;
    const h = 8 + r() * r() * 70, w = 4 + r() * 8;
    const kind = r();
    const geo = kind < 0.4 ? new THREE.CylinderGeometry(w * 0.4, w * 0.55, h, 8)
      : kind < 0.75 ? new THREE.BoxGeometry(w, h, w * (0.7 + r() * 0.6))
      : new THREE.ConeGeometry(w * 0.6, h, 6);
    const b = new THREE.Mesh(geo, r() < 0.25 ? glass : ms[Math.floor(r() * 4)]);
    b.position.set(x, heightAt(x, z) + h / 2 - 0.5, z);
    b.castShadow = b.receiveShadow = true;
    ground.add(b);
    if (kind < 0.4 && h > 30) { const dome = ball(w * 0.45, glass, 12); dome.position.set(x, b.position.y + h / 2, z); ground.add(dome); }
  }
}

function place(obj, x, z, yaw = 0, lift = 0) {
  obj.position.set(x, heightAt(x, z) + lift, z);
  obj.rotation.y = yaw;
}
let shake = 0;

function updateGround(t) {
  shake = 0;
  // sun / shadow follows the area of interest
  const focus = t < 26 ? V(10, 0, -55) : t < 32 ? V(-6, 0, 18) : t < 38 ? V(0, 0, CITY_Z) : V(22, 0, 0);
  gSun.position.copy(focus).add(V(60, 90, 40)); gSun.target.position.copy(focus);

  herd.forEach((h, i) => {
    const [x, z0] = herdPos[i];
    const z = z0 + (t - 20) * 1.7;
    place(h.group, x, z, -Math.PI / 2);
    h.update(t, i * 1.3);
  });
  pteros.forEach((p, i) => {
    const k = (t - 20) * 9 + i * 14;
    p.group.position.set(-45 + k, 24 + i * 2.5 + Math.sin(t + i) * 1.5, -30 - i * 9 + Math.sin(t * 0.5 + i) * 3);
    p.group.rotation.set(0, -0.15, Math.sin(t * 0.8 + i) * 0.1);
    p.update(t, i);
  });
  // predator walks toward camera along the bank
  const roar = smooth(seg(t, 29.2, 29.7)) * (1 - smooth(seg(t, 31.0, 31.6)));
  const walking = t < 29.2 ? 1 : 0;
  const rz = lerp(2, 15, smooth(seg(t, 26, 29.2)));
  place(rex.group, -7, rz, -Math.PI / 2 + 0.35);
  rex.update(walking ? t : 29.2, 3.2, roar);
  if (roar > 0.5) shake = 0.08 * roar;
  // big predator near the mammal
  const k2 = seg(t, 38, 44);
  place(rex2.group, 26 - k2 * 2, -14 + k2 * 9, -Math.PI / 2 - 0.5);
  rex2.update(t, 2.4, 0);
  const stomp = Math.max(0, Math.cos(t * 2.4)) ** 20;
  if (t > 38 && t < 44) shake = 0.05 * stomp;

  place(sauroid.group, 12, CITY_Z + 2, Math.PI / 2 - 0.25);
  sauroid.update(t);
  place(shrew.group, 23, 1.5, -Math.PI / 2 + 1.0);
  shrew.update(t);

  // cameras
  let pos, look;
  if (t < 26) {
    const k = smooth(seg(t, 20, 26));
    pos = V(lerp(-30, -14, k), lerp(30, 17, k), lerp(-95, -40, k));
    look = V(lerp(10, 12, k), lerp(10, 9, k), lerp(-50, -35, k));
  } else if (t < 32) {
    const k = smooth(seg(t, 26, 32));
    pos = V(lerp(-1, -3, k), lerp(2.6, 3.4, k), lerp(34, 30, k));
    look = V(-7, lerp(5, 7, k), rz);
  } else if (t < 38) {
    const k = smooth(seg(t, 32, 38));
    pos = V(lerp(16, 14, k), lerp(4.2, 5.2, k), lerp(CITY_Z - 13, CITY_Z - 8, k));
    look = V(11, lerp(6.5, 8, k), CITY_Z + 10);
  } else {
    const k = smooth(seg(t, 38, 44));
    pos = V(lerp(27.5, 26.5, k), lerp(1.2, 1.8, k), lerp(6.5, 7.5, k));
    look = V(21.5, lerp(2.5, 4.5, k), lerp(-2, -4, k));
  }
  pos.y = Math.max(pos.y, heightAt(pos.x, pos.z) + 0.6);
  const sh = shake * Math.sin(t * 90);
  groundCam.position.copy(pos).add(V(sh, sh * 0.6, 0));
  groundCam.lookAt(look);
}

// ================================================================ OVERLAY
const COL = { FACT: '#34d399', STORY: '#fbbf24', SPECULATION: '#a78bfa' };
const F = '"DejaVu Sans", sans-serif';
function setFont(size, bold = true, serif = false) {
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${serif ? '"DejaVu Serif", serif' : F}`;
}
function wrapLines(s, maxW) {
  const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (ctx.measureText(tr).width <= maxW) cur = tr; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur); return lines;
}
function txt(s, y, size, color, a, { bold = true, serif = false, maxW = 900 } = {}) {
  if (a <= 0.01) return;
  setFont(size, bold, serif);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
  let yy = y + (1 - a) * 24;
  for (const l of wrapLines(s, maxW)) { ctx.fillText(l, W / 2, yy); yy += size * 1.2; }
  ctx.restore();
}
function bigNum(s, y, color, a, size = 140) {
  if (a <= 0.01) return;
  setFont(size); while (ctx.measureText(s).width > 950 && size > 30) { size -= 4; setFont(size); }
  txt(s, y, size, color, a);
}
function tag(label, a, y = 250) {
  if (a <= 0.01) return;
  setFont(32);
  const w = ctx.measureText(label).width + 52;
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = COL[label];
  ctx.beginPath(); ctx.roundRect(W / 2 - w / 2, y, w, 56, 28); ctx.fill();
  ctx.fillStyle = '#141414'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, W / 2, y + 30); ctx.restore();
}
const fmt = n => Math.round(n).toLocaleString('en-US');

function overlay(t) {
  if (t >= 20 && t < 44) { // darken the sky behind the captions
    const g = ctx.createLinearGradient(0, 120, 0, 900);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.6, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900);
  }
  // 0-7 the real past
  tag('FACT', win(t, 0.3, 6.8));
  txt('66,000,000 years ago...', 360, 64, '#fff', win(t, 0.4, 6.8));
  txt('a ~10 km asteroid was heading for Earth.', 470, 50, '#e6e6e6', win(t, 1.4, 6.8));
  txt('In reality, it hit. Most dinosaurs died.', 620, 42, '#ffb4a0', win(t, 3.2, 6.8), { bold: false });
  // 7-13 the what if
  txt('WHAT IF...', 330, 130, '#fbbf24', win(t, 7.0, 10.0, 0.3, 0.4), { serif: true });
  txt('it missed?', 500, 96, '#fff', win(t, 7.6, 10.0, 0.3, 0.4), { serif: true });
  tag('STORY', win(t, 10.2, 13.0));
  txt('Missed Earth by', 360, 48, '#ddd', win(t, 10.2, 13.0));
  bigNum(fmt(4800 * smooth(seg(t, 10.3, 12.2))) + ' km', 430, '#fbbf24', win(t, 10.2, 13.0));
  // 13-20 time-lapse counter
  tag('STORY', win(t, 13.2, 19.6));
  txt('Years since the near miss', 360, 46, '#ddd', win(t, 13.2, 19.6));
  const yrs = Math.pow(66e6 + 1, smooth(seg(t, 13.4, 18.6))) - 1;
  bigNum(fmt(yrs), 440, '#34d399', win(t, 13.2, 19.6), 130);
  // 20-26 herd
  tag('STORY', win(t, 20.3, 26));
  txt('66 million years later...', 360, 60, '#fff', win(t, 20.4, 26));
  txt('dinosaurs still rule.', 450, 60, '#fbbf24', win(t, 21.2, 26));
  tag('FACT', win(t, 22.8, 26), 570);
  txt('Before the impact they had already lived ~164 million years.', 650, 38, '#fff', win(t, 22.9, 26), { bold: false, maxW: 820 });
  // 26-32 predator
  tag('SPECULATION', win(t, 26.3, 32));
  txt('Predators kept evolving.', 360, 62, '#fff', win(t, 26.4, 29.2));
  txt('Bigger? Smarter?', 360, 76, '#fbbf24', win(t, 29.4, 32), { serif: true });
  txt('Nobody can know. This part is imagination.', 480, 38, '#eee', win(t, 30.0, 32), { bold: false });
  // 32-38 dinosauroid
  tag('SPECULATION', win(t, 32.3, 38));
  txt('In 1982, scientists Dale Russell & Ron Séguin imagined a "dinosauroid".', 350, 44, '#fff', win(t, 32.4, 38), { maxW: 900 });
  txt('A thought experiment, not evidence.', 520, 38, '#e9d5ff', win(t, 33.2, 38), { bold: false });
  txt('Their city. Their world.', 610, 58, '#fbbf24', win(t, 34.8, 38));
  // 38-44 mammals + humans counter
  tag('FACT', win(t, 38.3, 41.2));
  txt('And mammals?', 360, 66, '#fff', win(t, 38.4, 41.2));
  txt('Most dinosaur-age mammals were small. One of the biggest, Repenomamus, weighed ~12–14 kg.', 460, 40, '#eee', win(t, 38.9, 41.2), { bold: false, maxW: 880 });
  tag('SPECULATION', win(t, 41.3, 44));
  txt('Humans in this timeline', 360, 50, '#ddd', win(t, 41.3, 44));
  bigNum(fmt(8.3e9 * (1 - smooth(seg(t, 41.6, 43.4)))), 440, '#93c5fd', win(t, 41.3, 44), 130);
  txt('We may never have evolved.', 650, 50, '#fff', win(t, 42.6, 44));
  // 44-50 ending
  txt("Someone's city lights are on...", 330, 48, '#fff', win(t, 45.0, 50, 0.5, 0.6));
  txt("...but they aren't ours.", 420, 56, '#fbbf24', win(t, 46.0, 50, 0.5, 0.6));
  txt('Follow for more WHAT IF', 1420, 52, '#fff', win(t, 47.2, 50, 0.5, 0.6), { serif: true });
  txt('Facts: Renne et al. 2013 Science; Schulte et al. 2010 Science; Hu et al. 2005 Nature; Russell & Séguin 1982. Everything after the near miss is fiction or speculation.',
      1510, 24, '#ccc', win(t, 47.2, 50, 0.5, 0.6), { bold: false, maxW: 860 });

  // transitions
  const flash = Math.max(win(t, 18.9, 20.6, 1.1, 0.6) * 1.0, 0);
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }
  for (const c of [7, 26, 32, 38, 44]) {
    const d = Math.abs(t - c);
    if (d < 0.35) { ctx.fillStyle = `rgba(0,0,0,${0.9 * (1 - d / 0.35)})`; ctx.fillRect(0, 0, W, H); }
  }
  if (t < 0.6) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.6})`; ctx.fillRect(0, 0, W, H); }
  if (t > 49.2) { ctx.fillStyle = `rgba(0,0,0,${(t - 49.2) / 0.8})`; ctx.fillRect(0, 0, W, H); }
}

// ================================================================== frame
window.frame = (t, type = 'image/jpeg') => {
  const inSpace = t < 20 || t >= 44;
  if (inSpace) { updateSpace(t); renderer.render(space, spaceCam); }
  else { updateGround(t); renderer.render(ground, groundCam); }
  ctx.drawImage(renderer.domElement, 0, 0);
  overlay(t);
  return out.toDataURL(type, 0.93);
};
window.DURATION = DURATION;
window.ready = true;
