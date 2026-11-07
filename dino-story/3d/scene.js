// "What if the asteroid missed?" - deterministic 3D scene.
// window.frame(t) renders time t (seconds) and returns a JPEG data URL.
import * as THREE from 'three';

const W = 1080, H = 1920;
export const DURATION = 120;

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


const LP_N = 1800;
const lpPos = new Float32Array(LP_N * 3), lpCol = new Float32Array(LP_N * 3), lpOff = new Float32Array(LP_N), lpB = new Float32Array(LP_N);
{
  const r = rng(55); let k = 0, guard = 0;
  while (k < LP_N && guard++ < 500000) {
    const z = 2 * r() - 1, th = r() * Math.PI * 2, sq = Math.sqrt(1 - z * z);
    const px = sq * Math.cos(th), py = z, pz = sq * Math.sin(th);
    const X = -px, Y = py, Z = pz; // same frame as the earth texture
    if (Math.abs(Y) > 0.8 || fbm(X * 1.7 + 5, Y * 1.7, Z * 1.7, 5) <= 0.55 || fbm(X * 6, Y * 6, Z * 6, 3) <= 0.5) continue;
    lpPos.set([px * 10.06, py * 10.06, pz * 10.06], k * 3);
    const cl = fbm(X * 2 + 3, Y * 2, Z * 2, 3);
    lpOff[k] = r() < 0.14 ? 1e9 : 101.3 + clamp((cl - 0.3) / 0.4) * 6.5 + r() * 0.8;
    lpB[k] = 0.6 + r() * 0.6; k++;
  }
}
const lpGeo = new THREE.BufferGeometry();
lpGeo.setAttribute('position', new THREE.BufferAttribute(lpPos, 3));
lpGeo.setAttribute('color', new THREE.BufferAttribute(lpCol, 3));
const lightPts = new THREE.Points(lpGeo, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, map: DOT,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
lightPts.visible = false;
earth.add(lightPts);
function updateLights(rt) {
  lightPts.visible = true;
  const fin = seg(rt, 100, 100.8);
  for (let i = 0; i < LP_N; i++) {
    let on = rt < lpOff[i] ? 1 : 0;
    if (rt > lpOff[i] - 0.35 && rt < lpOff[i]) on = Math.sin(rt * 60 + i) > 0 ? 1 : 0.15;
    const c = lpB[i] * on * fin;
    lpCol[i * 3] = c; lpCol[i * 3 + 1] = c * 0.75; lpCol[i * 3 + 2] = c * 0.45;
  }
  lpGeo.attributes.color.needsUpdate = true;
}

function updateSpace(t) {
  const ending = t >= 56;
  earth.rotation.y = t * 0.04 + (t > 13 && t < 20 ? (t - 13) ** 2 * 0.35 : t >= 20 ? 49 * 0.35 : 0);
  clouds.rotation.y = earth.rotation.y * 1.08 + t * 0.01;
  earth.material.emissiveIntensity = ending ? 3.0 * seg(t, 57, 59) : 0;
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
    const k = smooth(seg(t, 56, 62));
    spaceCam.position.set(lerp(-14, -22, k), lerp(3, 9, k), lerp(-16, -32, k));
    spaceCam.lookAt(0, lerp(0, 4, k), 0);
  }
}

// =========================================================== GROUND SCENE
const ground = new THREE.Scene();
const groundCam = new THREE.PerspectiveCamera(55, W / H, 0.1, 1200);
const FOG = new THREE.Color(0xc9d8e0);
ground.fog = new THREE.Fog(FOG.clone(), 80, 420);
const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x3a78c2) }, bot: { value: FOG.clone() } },
  vertexShader: `varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 top; uniform vec3 bot; varying float vY; void main(){ gl_FragColor = vec4(mix(bot, top, smoothstep(0.0, 0.5, vY)), 1.0); }`
}));
ground.add(sky);
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4a5a2a, 1.1);
ground.add(hemi);
const gSun = new THREE.DirectionalLight(0xfff0d0, 2.6);
gSun.castShadow = true;
gSun.shadow.mapSize.set(2048, 2048);
Object.assign(gSun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 300 });
gSun.shadow.bias = -0.0008;
ground.add(gSun, gSun.target);

const CITY_Z = 95;
const TOWN_X = 30, TOWN_Z = -175;
const WALL_X = 30, WALL_Z = -250, WALL_H = 9;
function heightAt(x, z) {
  const hills = (fbm(x * 0.012 + 11, 0.5, z * 0.012 - 3, 5) - 0.45) * 70;
  const valley = smooth((Math.abs(x) - 14) / 50);
  const river = Math.abs(x) < 8 ? -1.4 * (1 - Math.abs(x) / 8) : 0;
  const cityFlat = 1 - smooth((Math.hypot(x, (z - CITY_Z - 25) * 0.6) - 40) / 30);
  const townFlat = 1 - smooth((Math.hypot(x - TOWN_X, z - TOWN_Z) - 45) / 25);
  const wallFlat = 1 - smooth((Math.hypot(x - WALL_X, (z - WALL_Z - 20) * 0.8) - 50) / 25);
  return Math.max(hills, 0) * valley * (1 - cityFlat) * (1 - townFlat) * (1 - wallFlat) + river + fbm(x * 0.2, 1, z * 0.2, 2) * 0.6;
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
    if (Math.hypot(x - TOWN_X, z - TOWN_Z) < 62) continue; // human town
    if (Math.hypot(x - WALL_X, z - WALL_Z - 20) < 75) continue; // the wall
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


// ============================================================ THE CLASH
function makeHuman(shirt) {
  const skin = mat(0xc68e64), sh = mat(shirt), pants = mat(0x2d3a4f);
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.55, 4, 8), sh); body.position.y = 1.2; body.castShadow = true; g.add(body);
  const head = ball(0.22, skin, 10); head.position.y = 1.82; g.add(head);
  const hair = ball(0.23, mat(0x1f1a17), 8); hair.scale.set(1, 0.55, 1); hair.position.set(-0.04, 1.93, 0); g.add(hair);
  const legs = [0.13, -0.13].map(z => { const l = limb(0.1, 0.09, 0.85, pants); l.position.set(0, 0.85, z); g.add(l); return l; });
  const arms = [0.36, -0.36].map(z => { const a = limb(0.08, 0.07, 0.7, sh); a.position.set(0, 1.48, z); g.add(a); return a; });
  const torch = new THREE.Group(); torch.position.set(0.25, -0.65, 0); arms[0].add(torch);
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.9, 5), mat(0x5a3e2b)); stick.position.y = 0.3; torch.add(stick);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flame.scale.set(1.3, 1.6, 1); flame.position.y = 0.95; torch.add(flame);
  return { group: g, torch, flame, update(t, speed, ph, fallen = 0, armUp = 0) {
    const sw = speed > 0 ? Math.sin(t * speed + ph) : 0;
    legs[0].rotation.z = sw * 0.8; legs[1].rotation.z = -sw * 0.8;
    arms[0].rotation.z = armUp ? -2.6 + Math.sin(t * 3 + ph) * 0.15 : -sw * 0.9;
    arms[1].rotation.z = sw * 0.9;
    g.rotation.z = -fallen * 1.45;
    flame.scale.set(1.2 + Math.sin(t * 17 + ph) * 0.2, 1.5 + Math.sin(t * 13 + ph) * 0.3, 1);
  } };
}
const FIRE = radialTexture('rgba(255,210,120,1)', 'rgba(255,60,0,0)', 64);
const SMOKE = radialTexture('rgba(40,35,35,0.75)', 'rgba(40,35,35,0)', 64);
const SMOKE_L = radialTexture('rgba(120,105,100,0.8)', 'rgba(120,105,100,0)', 64);

const houses = [];
{
  const r = rng(33);
  const walls = [mat(0xe8dcc4), mat(0xd9c2a0), mat(0xc4d4d8), mat(0xe0b9a0)];
  const roofs = [mat(0x9c3b2e), mat(0x5b6b7a), mat(0x7a4b2e)];
  const win = new THREE.MeshStandardMaterial({ color: 0x332a1a, emissive: 0xffc070, emissiveIntensity: 0.6 });
  while (houses.length < 36) {
    const x = TOWN_X + (r() - 0.5) * 84, z = TOWN_Z + (r() - 0.5) * 76;
    if (Math.abs(x) < 10 || Math.abs(x - TOWN_X) < 9 || z < TOWN_Z - 22) continue; // keep the main street + front clear
    if (houses.some(h => Math.hypot(h.userData.x - x, h.userData.z - z) < 9)) continue;
    const w = 4 + r() * 3, d = 4 + r() * 3, h = 3 + r() * 3.5;
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), walls[Math.floor(r() * 4)]);
    b.position.y = h / 2; b.castShadow = b.receiveShadow = true; g.add(b);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 2.6, 4), roofs[Math.floor(r() * 3)]);
    roof.rotation.y = Math.PI / 4; roof.position.y = h + 1.3; roof.castShadow = true; g.add(roof);
    for (const sx of [-0.25, 0.25]) {
      const wn = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, d + 0.05), win); wn.position.set(sx * w, h * 0.6, 0); g.add(wn);
    }
    const yaw = (r() - 0.5) * 0.5;
    place(g, x, z, yaw);
    g.userData = { x, z, yaw, dir: r() < 0.5 ? 1 : -1, y0: g.position.y };
    ground.add(g); houses.push(g);
  }
}
const fires = Array.from({ length: 12 }, () => {
  const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  const sm = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, depthWrite: false, transparent: true }));
  ground.add(f, sm); return [f, sm];
});
const people = Array.from({ length: 28 }, (_, i) => {
  const shirts = [0xd14b3c, 0x3c78d1, 0xe6c34a, 0x4caf6e, 0xf2f2f2, 0x8a5cc4, 0xe08a3c];
  const h = makeHuman(shirts[i % shirts.length]); ground.add(h.group);
  const r = rng(100 + i);
  h.ax = TOWN_X + (r() - 0.5) * 44; h.az = TOWN_Z + (r() - 0.5) * 34; h.sp = 4.2 + r() * 1.6; h.ph = r() * 6;
  h.bx = TOWN_X + (i % 14 - 6.5) * 2.4 + (r() - 0.5); h.bz = TOWN_Z - 31 - Math.floor(i / 14) * 2.2;
  return h;
});
const barricade = Array.from({ length: 12 }, (_, i) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.6 + (i % 3) * 0.4, 1.4), mat(i % 2 ? 0x6b5233 : 0x7d7d78));
  b.castShadow = true; ground.add(b);
  b.userData = { x: TOWN_X + (i - 5.5) * 2.7, vx: (i - 5.5) * 1.6, vy: 6 + (i % 4) * 2, spin: (i % 2 ? 1 : -1) * (2 + i % 3) };
  return b;
});
const packRex = makeTheropod(0x4a3b2a); packRex.group.scale.setScalar(1.25); ground.add(packRex.group);
const raptors = [0x7a6a3a, 0x5f5530, 0x6e5a3a, 0x8a7046].map(c => {
  const r = makeTheropod(c); r.group.scale.setScalar(0.45); ground.add(r.group); return r; });
const RAPTOR_LANE = [[-9, 6], [8, 2], [-17, 10], [15, 12]];
const bigSauro = makeSauropod(0x5d6a48); bigSauro.group.scale.setScalar(1.35); ground.add(bigSauro.group);

// where the charging animals are, so houses/people know when they are hit
const rexZ = t => TOWN_Z + 48 - (t - 44) * 8.5;
const sauroZ = t => TOWN_Z + 26 - (t - 50) * 11;
const SAURO_X = TOWN_X + 3;

function updateClash(t) {
  const A = t < 50;
  // houses collapse after an animal passes close by
  houses.forEach(h => {
    const { x, z, yaw, dir, y0 } = h.userData;
    let hit = Infinity;
    if (Math.abs(x - TOWN_X) < 13) hit = 44 + (TOWN_Z + 48 - z) / 8.5;
    if (Math.abs(x - SAURO_X) < 15) hit = Math.min(hit, 50 + (TOWN_Z + 26 - z) / 11);
    const c = smooth((t - hit) / 1.1);
    h.rotation.set(c * 1.35 * dir, yaw, c * 0.3);
    h.position.y = y0 - c * 2.2;
    h.userData.hit = hit;
  });
  const burning = houses.filter(h => t > h.userData.hit + 0.3).slice(0, fires.length);
  fires.forEach(([f, sm], i) => {
    const h = burning[i];
    f.visible = sm.visible = !!h;
    if (!h) return;
    const age = t - h.userData.hit, fl = 1 + 0.25 * Math.sin(t * 11 + i * 2);
    f.position.set(h.userData.x, h.userData.y0 + 2.5, h.userData.z);
    f.scale.set(7 * fl * clamp(age), 9 * fl * clamp(age), 1);
    const rise = (age * 0.6 + i * 0.37) % 1;
    sm.position.set(h.userData.x + rise * 3, h.userData.y0 + 5 + rise * 14, h.userData.z);
    sm.scale.setScalar(6 + rise * 14); sm.material.opacity = 0.8 * (1 - rise);
  });
  // the predator pack (raid, 44-50) then waiting behind the sauropod (50-56)
  const rz = A ? rexZ(t) : TOWN_Z + 30;
  place(packRex.group, TOWN_X, rz, Math.PI / 2);
  const roarA = !A ? smooth(seg(t, 51.0, 51.5)) * (1 - smooth(seg(t, 53.0, 53.6))) : 0;
  packRex.update(A ? t : 50, 3.6, roarA);
  raptors.forEach((r, i) => {
    const [dx, dz] = RAPTOR_LANE[i];
    let x = TOWN_X + dx, z = TOWN_Z + 48 + dz - (t - 44) * 10, lift = 0;
    if (!A) { // leap over the barricade
      z = TOWN_Z + 12 - (t - 50) * 9 + dz * 0.3;
      const jt = seg(t, 52.6 + i * 0.2, 53.6 + i * 0.2);
      lift = Math.sin(jt * Math.PI) * 5;
    }
    place(r.group, x, z, Math.PI / 2, lift);
    r.update(t, 6, 0);
  });
  // the stampeding sauropod (50-56)
  place(bigSauro.group, SAURO_X, A ? TOWN_Z + 200 : sauroZ(t), Math.PI / 2);
  bigSauro.update(t * 1.8, 0);
  // barricade breaks when the sauropod reaches it (~53.2 s)
  const bz = TOWN_Z - 26, breakT = 50 + (TOWN_Z + 26 - bz - 6) / 11;
  barricade.forEach(b => {
    const { x, vx, vy, spin } = b.userData, dt = Math.max(0, t - breakT);
    b.visible = !A;
    b.position.set(x + vx * dt, heightAt(x, bz) + 0.8 + vy * dt - 9 * dt * dt, bz - dt * 6);
    if (b.position.y < heightAt(x, bz) + 0.6) b.position.y = heightAt(x, bz) + 0.6;
    b.rotation.set(spin * dt, 0, spin * dt * 0.7);
  });
  // people
  people.forEach((p, i) => {
    let x, z, yaw, speed = p.sp * 2.2, fallen = 0, armUp = 0;
    if (A) {
      x = p.ax + Math.sin(i) * (t - 44) * 0.6; z = p.az - (t - 44) * p.sp; yaw = Math.PI / 2;
      const hitBy = Math.abs(x - TOWN_X) < 4 ? rexZ(t) :
        Math.min(...RAPTOR_LANE.filter(([dx]) => Math.abs(x - TOWN_X - dx) < 2.5).map(([, dz]) => TOWN_Z + 48 + dz - (t - 44) * 10), Infinity);
      if (hitBy < z + 1 && i % 3 === 0) { fallen = smooth((z + 1 - hitBy) / 2); speed = 0; z = Math.max(z, hitBy - 1); }
      p.torch.visible = false;
    } else {
      x = p.bx; z = p.bz; yaw = -Math.PI / 2; speed = 0; armUp = i % 2 === 0;
      p.torch.visible = !!armUp;
      if (t > breakT - 0.2) { // fall back
        const rt = t - breakT + 0.2;
        yaw = Math.PI / 2; speed = 9; z = p.bz - rt * (5 + (i % 5)); armUp = 0; p.torch.visible = false;
        if (Math.abs(x - SAURO_X) < 6 && i % 2) { fallen = smooth(rt / 0.8); speed = 0; z = p.bz - rt; }
      }
    }
    place(p.group, x, z, yaw);
    p.update(t, speed, p.ph, fallen, armUp);
  });
  // flying reptiles dive in during the last stand
  if (!A) pteros.forEach((p, i) => {
    const k = seg(t, 50.5 + i * 0.6, 53.5 + i * 0.6);
    p.group.position.set(TOWN_X - 30 + k * 60 + i * 3, lerp(28, 6, Math.sin(k * Math.PI)) + i, TOWN_Z - 20 - i * 3);
    p.group.rotation.set(0, 0, -0.3 + k * 0.6);
  });
  // shake on big steps
  if (A) shake = 0.06 * Math.max(0, Math.cos(t * 3.6)) ** 16;
  else shake = Math.max(0.07 * Math.max(0, Math.cos(t * 1.8 * 2.2)) ** 16, t > breakT && t < breakT + 0.6 ? 0.12 : 0, roarA > 0.5 ? 0.05 : 0);
  // cameras
  if (A) {
    const k = smooth(seg(t, 44, 50));
    return [V(TOWN_X + lerp(7, 4, k), lerp(4.5, 3.2, k), TOWN_Z - lerp(30, 40, k)), V(TOWN_X - 1, lerp(4, 6, k), TOWN_Z + 6)];
  }
  const k = smooth(seg(t, 50, 56));
  return [V(TOWN_X - lerp(5, 2, k), lerp(6.5, 10, k), TOWN_Z - lerp(44, 52, k)), V(TOWN_X + 2, lerp(4, 6, k), TOWN_Z - 14)];
}


// ======================================================= NEW WAR SCENES
// --- the wall
const wallParts = new THREE.Group(); ground.add(wallParts);
const WGY = heightAt(WALL_X, WALL_Z), WTOP = WGY + WALL_H - 0.5;
{
  const stone = mat(0x8d8a80), dark = mat(0x5f5b54);
  const body = new THREE.Mesh(new THREE.BoxGeometry(104, WALL_H + 2, 3.5), stone);
  body.position.set(WALL_X, WGY + WALL_H / 2 - 1.5, WALL_Z); body.castShadow = body.receiveShadow = true; wallParts.add(body);
  for (let x = -51; x <= 51; x += 3) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.8), stone);
    c.position.set(WALL_X + x, WTOP + 0.7, WALL_Z + 1.4); c.castShadow = true; wallParts.add(c);
  }
  const walk = new THREE.Mesh(new THREE.BoxGeometry(104, 0.5, 3.2), dark);
  walk.position.set(WALL_X, WTOP - 0.25, WALL_Z - 3.2); walk.receiveShadow = true; wallParts.add(walk);
  for (const x of [-46, -22, 22, 46]) {
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.8, WALL_H + 7, 8), dark);
    tw.position.set(WALL_X + x, WGY + (WALL_H + 7) / 2 - 1.5, WALL_Z); tw.castShadow = true; wallParts.add(tw);
  }
}
const CANNON_X = [-16, -8, 0, 8, 16];
const cannons = CANNON_X.map(dx => {
  const g = new THREE.Group(); g.position.set(WALL_X + dx, WTOP, WALL_Z); wallParts.add(g);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.8), mat(0x3d3a36)); base.position.y = 0.4; g.add(base);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 3.4, 10), mat(0x22201e, { metalness: 0.6, roughness: 0.4 }));
  barrel.rotation.x = Math.PI / 2 - 0.25; barrel.position.set(0, 1.2, 1.2); g.add(barrel);
  const sp = () => { const o = new THREE.Sprite(new THREE.SpriteMaterial({ map: FIRE, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); ground.add(o); return o; };
  const flash = sp(), boom = sp();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffb060 }));
  ground.add(shell);
  const smoke = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE, depthWrite: false, transparent: true })); ground.add(smoke);
  return { x: WALL_X + dx, flash, boom, shell, smoke };
});
// fire schedule (mirrored in audio3d.py): cannon j fires at t0 + 0.33 j + k*period, until t1
const SHOTS = { wall: [61.0, 1.8, 69.6], night: [71.0, 2.4, 79.6] };
function updateCannons(rt, kind) {
  const [t0, period, t1] = SHOTS[kind];
  cannons.forEach((c, j) => {
    const first = t0 + 0.33 * j;
    const k = Math.floor((rt - first) / period);
    const tf = first + k * period, dt = rt - tf;
    const live = rt >= first && tf <= t1;
    const muzzle = V(c.x, WTOP + 1.6, WALL_Z + 2.9);
    const tx = c.x + Math.sin(k * 2.3 + j * 1.7) * 9, tz = WALL_Z + 38 + ((k * 11 + j * 7) % 28);
    const target = V(tx, heightAt(tx, tz) + 0.8, tz);
    c.flash.visible = live && dt < 0.15;
    c.flash.position.copy(muzzle).add(V(0, 0, 0.6)); c.flash.scale.setScalar(4.5);
    c.shell.visible = live && dt < 1.0;
    if (c.shell.visible) c.shell.position.lerpVectors(muzzle, target, dt).add(V(0, Math.sin(dt * Math.PI) * 9, 0));
    const e = (dt - 1.0) / 0.7;
    c.boom.visible = live && e >= 0 && e < 1;
    c.boom.position.copy(target).add(V(0, 1.5 + e * 2, 0)); c.boom.scale.setScalar(3 + e * 12);
    c.boom.material.opacity = 1 - e;
    c.smoke.visible = c.boom.visible;
    c.smoke.position.copy(target).add(V(0, 3 + e * 6, 0)); c.smoke.scale.setScalar(5 + e * 10); c.smoke.material.opacity = 0.7 * (1 - e);
    if (live && dt < 0.2) shake = Math.max(shake, 0.03);
  });
}
const beams = [-46, -22, 22, 46].map((dx, i) => {
  const outer = new THREE.Group(); outer.position.set(WALL_X + dx, WGY + WALL_H + 5.6, WALL_Z); ground.add(outer);
  const geo = new THREE.ConeGeometry(7, 90, 24, 1, true); geo.translate(0, -45, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xfff1c0, transparent: true, opacity: 0.17,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  outer.add(m);
  const lamp = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: 0xfff6d8, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  lamp.scale.setScalar(4); outer.add(lamp);
  return { outer, m, i };
});
const wallRaptors = [0x7a6a3a, 0x5f5530, 0x6e5a3a, 0x8a7046, 0x6a5a35, 0x7d6440].map(c => {
  const r = makeTheropod(c); r.group.scale.setScalar(0.6); r.group.rotation.order = 'YXZ'; ground.add(r.group); return r; });
const wallRex = makeTheropod(0x3e3226); wallRex.group.scale.setScalar(1.3); ground.add(wallRex.group);
const nightPteros = [0, 1, 2, 3, 4, 5].map(() => { const p = makePterosaur(0x2a2420); p.group.scale.setScalar(1.9); p.group.rotation.order = 'YXZ'; ground.add(p.group); return p; });
// --- the retreat
const refugees = Array.from({ length: 40 }, (_, i) => {
  const h = makeHuman([0x7a5c48, 0x5b6470, 0x8c7a5c, 0x6b4f4f, 0x4f5f4f][i % 5]); ground.add(h.group);
  h.ph = i * 1.37; return h;
});
const smokeCols = Array.from({ length: 24 }, () => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: SMOKE_L, depthWrite: false, transparent: true })); ground.add(sp); return sp; });
const ridgeSauros = [makeSauropod(0x4f5a40), makeSauropod(0x5a5040)];
ridgeSauros.forEach(r => { r.group.scale.setScalar(1.2); ground.add(r.group); });

const NEW_ACTORS = {
  wall: [wallParts, wallRex.group, ...wallRaptors.map(r => r.group), ...cannons.flatMap(c => [c.flash, c.boom, c.shell, c.smoke])],
  night: [...beams.map(b => b.outer), ...nightPteros.map(p => p.group)],
  retreat: [...refugees.map(r => r.group), ...smokeCols, ...ridgeSauros.map(r => r.group)],
};
const CLASH_ACTORS = () => [bigSauro.group, packRex.group, ...raptors.map(r => r.group), ...barricade, ...pteros.map(p => p.group)];
function showActors(kind) {
  for (const o of CLASH_ACTORS()) o.visible = kind === 'o'; // updateClash refines the barricade
  const on = new Set(kind === 'night' ? [...NEW_ACTORS.wall, ...NEW_ACTORS.night] : NEW_ACTORS[kind] || []);
  for (const list of Object.values(NEW_ACTORS)) for (const o of list) o.visible = on.has(o);
  if (kind !== 'wall' && kind !== 'night') wallParts.visible = true; // static scenery stays
}
function setSky(top, bot) {
  sky.material.uniforms.top.value.set(top); sky.material.uniforms.bot.value.set(bot); ground.fog.color.set(bot);
}

function updateNew(kind, lt, rt) {
  shake = 0;
  let pos, look, focus;
  if (kind === 'wall' || kind === 'night') {
    const night = kind === 'night';
    focus = V(WALL_X, 0, WALL_Z + 25);
    if (night) {
      setSky(0x04060f, 0x161b2e); ground.fog.near = 30; ground.fog.far = 280;
      hemi.intensity = 0.45; gSun.intensity = 0.7; gSun.color.setRGB(0.6, 0.7, 1.0);
    } else {
      setSky(0x6a4040, 0xd09a7a); hemi.intensity = 0.95; gSun.intensity = 2.0; gSun.color.setRGB(1, 0.75, 0.6);
    }
    beams.forEach(b => {
      b.outer.rotation.y = Math.sin(rt * 0.45 + b.i * 1.7) * 0.7;
      b.m.rotation.x = -Math.PI / 2 + (b.i % 2 ? -0.35 : 0.12) + Math.sin(rt * 0.6 + b.i) * 0.12;
    });
    updateCannons(rt, kind);
    // defenders on the walkway
    people.forEach((p, i) => {
      if (i >= 18) return;
      const x = WALL_X + (i - 8.5) * 4.6 + (i % 2) * 0.6;
      let fallen = 0;
      const armUp = night ? 1 : (i % 3 === 0 ? 1 : 0);
      if (night && (i === 6 || i === 7 || i === 12)) fallen = smooth((lt - 6.6) / 0.6);
      p.group.position.set(x, WTOP, WALL_Z - 2.8); p.group.rotation.y = -Math.PI / 2;
      p.torch.visible = !!armUp;
      p.update(rt, 0, p.ph, fallen, armUp);
    });
    // raptors: charge then get driven back (day) / climb the wall (night)
    wallRaptors.forEach((r, i) => {
      r.group.rotation.z = 0;
      if (!night) {
        const x = WALL_X + (i - 2.5) * 9, tt = 4.0 + i * 0.3;
        if (lt < tt) place(r.group, x, WALL_Z + 95 + i * 5 - lt * 10, Math.PI / 2);
        else place(r.group, x, WALL_Z + 95 + i * 5 - tt * 10 + (lt - tt) * 12, -Math.PI / 2);
        r.update(rt, 6, 0);
      } else if (i < 4) {
        const x = WALL_X + [-12, -4, 6, 14][i], cs = 2.6 + i * 0.9, c = (lt - cs) / 1.6;
        if (c < 0) { place(r.group, x, WALL_Z + 2.4 + (cs - lt) * 10, Math.PI / 2); r.update(rt, 6, 0); }
        else if (c < 1) { r.group.position.set(x, WGY + c * (WALL_H - 1.5), WALL_Z + 2.5); r.group.rotation.y = Math.PI / 2; r.group.rotation.z = 1.3; r.update(rt * 1.5, 6, 0); }
        else { r.group.position.set(x, WTOP, WALL_Z + 0.3); r.group.rotation.y = Math.PI / 2; r.update(rt, 0, Math.min(1, c - 1)); }
      } else {
        place(r.group, WALL_X - 45 + lt * 8 + i * 5, WALL_Z + 14 + i * 4, 0); r.update(rt, 6, 0);
      }
    });
    const roarRex = night ? smooth(seg(lt, 6.0, 6.5)) * (1 - smooth(seg(lt, 7.6, 8.1))) : smooth(seg(lt, 3.5, 4.0)) * (1 - smooth(seg(lt, 5.4, 5.9)));
    place(wallRex.group, WALL_X + (night ? -10 : 4), WALL_Z + (night ? 62 : 110 - Math.min(lt, 3.5) * 4), Math.PI / 2);
    wallRex.update(night ? 0 : Math.min(lt, 3.5) + 60, 3, roarRex);
    if (night) nightPteros.forEach((p, i) => {
      const tc = 1.6 + i * 1.0, z = WALL_Z + (tc - lt) * 24, dz = z - WALL_Z;
      p.group.position.set(WALL_X + (((i * 7) % 5) - 2) * 8, clamp(13 + 0.012 * dz * dz, 13, 45), z);
      p.group.rotation.y = Math.PI / 2; p.group.rotation.z = dz > 0 ? -0.35 : 0.25;
      p.update(rt, i);
      if (Math.abs(lt - tc) < 0.3) shake = Math.max(shake, 0.05);
    });
    if (roarRex > 0.5) shake = Math.max(shake, 0.04);
    if (!night) {
      const k = smooth(lt / 10);
      pos = V(WALL_X - 8 + k * 4, WTOP + 8.5, WALL_Z - 15); look = V(WALL_X + 2, lerp(2, 4, k), WALL_Z + 55);
    } else {
      const k = smooth(lt / 10);
      pos = V(WALL_X + 12 - k * 5, WTOP + 6, WALL_Z - 15); look = V(WALL_X - 3, lerp(WTOP + 10, WTOP + 1, k), WALL_Z + 30);
    }
  } else { // retreat
    focus = V(12, 0, -300);
    setSky(0x3b2a33, 0xb07a5a); ground.fog.near = 50; ground.fog.far = 340;
    hemi.intensity = 0.75; gSun.intensity = 1.1; gSun.color.setRGB(1, 0.6, 0.45);
    people.concat(refugees).forEach((p, i) => {
      const x = 11 + (((i * 37) % 7) - 3) * 0.75;
      const z = -300 + i * 2.1 - lt * 1.3 + Math.sin(i * 1.3) * 0.6;
      place(p.group, x, z, Math.PI / 2);
      const armUp = i % 7 === 0 ? 1 : 0;
      p.torch.visible = !!armUp;
      p.update(rt, 5.5, p.ph, 0, armUp);
    });
    smokeCols.forEach((sp, i) => {
      const c = Math.floor(i / 6), rise = (rt * 0.06 + (i % 6) / 6) % 1;
      sp.position.set(TOWN_X + (c - 1.5) * 20, 10 + rise * 80, TOWN_Z + 5 + c * 6);
      sp.scale.setScalar(20 + rise * 55); sp.material.opacity = 0.6 * (1 - rise);
    });
    ridgeSauros.forEach((r, i) => { place(r.group, -4 + i * 3, -230 - i * 16 - lt * 1.0, Math.PI / 2); r.update(rt, i * 2); });
    const k = smooth(lt / 13);
    pos = V(lerp(20, 16, k), lerp(9, 5, k), lerp(-338, -332, k)); look = V(lerp(9, 10, k), lerp(5, 4, k), -280);
  }
  gSun.position.copy(focus).add(V(60, 90, 40)); gSun.target.position.copy(focus);
  pos.y = Math.max(pos.y, heightAt(pos.x, pos.z) + 0.6);
  const sh = shake * Math.sin(rt * 90);
  groundCam.position.copy(pos).add(V(sh, sh * 0.6, 0));
  groundCam.lookAt(look);
}

function place(obj, x, z, yaw = 0, lift = 0) {
  obj.position.set(x, heightAt(x, z) + lift, z);
  obj.rotation.y = yaw;
}
let shake = 0;

const SKY_TOP = new THREE.Color(0x3a78c2), SKY_RED = new THREE.Color(0x3a1418), FOG_RED = new THREE.Color(0xc9765a);
function updateGround(t) {
  shake = 0;
  hemi.intensity = 1.1; gSun.intensity = 2.6; ground.fog.near = 80; ground.fog.far = 420;
  const war = smooth(seg(t, 45, 52));
  sky.material.uniforms.top.value.lerpColors(SKY_TOP, SKY_RED, war);
  sky.material.uniforms.bot.value.lerpColors(FOG, FOG_RED, war);
  ground.fog.color.lerpColors(FOG, FOG_RED, war);
  gSun.color.setRGB(1, lerp(0.94, 0.55, war), lerp(0.82, 0.4, war));
  // sun / shadow follows the area of interest
  const focus = t < 26 ? V(10, 0, -55) : t < 32 ? V(-6, 0, 18) : t < 38 ? V(0, 0, CITY_Z) : t < 44 ? V(22, 0, 0) : V(TOWN_X, 0, TOWN_Z - 15);
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
  const clash = updateClash(t);
  if (t >= 44) {
    [pos, look] = clash;
  } else if (t < 26) {
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


const HUMANS0 = 8.3e9, HUMANS1 = 1.2e9;
let REAL_T = 0;
// fictional war curve, keyed on real video time: [time, humans, war year]
const WARK = [[53, 8.3e9, 1], [60, 6.9e9, 6], [70, 6.3e9, 12], [80, 4.1e9, 19], [87, 2.6e9, 27], [100, 1.2e9, 40], [110, 0.9e9, 52]];
function warAt(rt) {
  if (rt <= WARK[0][0]) return [WARK[0][1], 1];
  for (let i = 0; i < WARK.length - 1; i++) {
    const [t0, h0, y0] = WARK[i], [t1, h1, y1] = WARK[i + 1];
    if (rt <= t1) { const p = (rt - t0) / (t1 - t0); return [Math.exp(lerp(Math.log(h0), Math.log(h1), p)), lerp(y0, y1, p)]; }
  }
  const L = WARK[WARK.length - 1]; return [L[1], L[2]];
}
const humansAt = () => warAt(REAL_T)[0];
function hudWar(t, a) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 200, W, 270);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  setFont(40); ctx.fillStyle = '#fff';
  const yr = `YEAR ${Math.max(1, Math.round(warAt(REAL_T)[1]))} OF THE WAR`;
  ctx.fillText(yr, W / 2, 215);
  if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(W / 2 - ctx.measureText(yr).width / 2 - 24, 236, 10, 0, 7); ctx.fill(); }
  const h = humansAt(t);
  for (const [cx, label, val, col] of [[W * 0.27, 'HUMANS', h, '#93c5fd'], [W * 0.73, 'HUMANS LOST', HUMANS0 - h, '#ef4444']]) {
    setFont(30); ctx.fillStyle = '#a3a3a3'; ctx.fillText(label, cx, 285);
    let sz = 62; setFont(sz); while (ctx.measureText(fmt(val)).width > 440) { sz -= 2; setFont(sz); }
    ctx.fillStyle = col; ctx.fillText(fmt(val), cx, 330);
  }
  ctx.restore();
  tag('SPECULATION', a, 395);
}
function overlay(t) {
  if (t >= 20 && t < 56) { // darken the sky behind the captions
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
  txt('Humans may never have evolved.', 360, 50, '#ddd', win(t, 41.3, 44));
  txt('But what if we did...', 470, 72, '#fbbf24', win(t, 42.2, 44), { serif: true });
  txt('...and had to share the planet with them?', 580, 46, '#fff', win(t, 42.8, 44));
  // 44-56 the clash: war HUD
  hudWar(t, win(t, 44.2, 55.8, 0.4, 0.3));
  txt('It was never going to be peaceful.', 560, 54, '#fff', win(t, 44.6, 49.6));
  txt('Raptors hunt in packs. Towns fell first.', 720, 40, '#eee', win(t, 46.0, 49.6), { bold: false });
  txt('The last towns made a stand...', 560, 60, '#fff', win(t, 50.3, 53.0));
  txt('...but they were outnumbered.', 560, 64, '#ef4444', win(t, 53.2, 55.8), { serif: true });
  // 44-50 ending
  txt("Someone's city lights are on...", 330, 48, '#fff', win(t, 57.0, 62, 0.5, 0.6));
  txt("...and fewer of them are ours.", 420, 52, '#fbbf24', win(t, 58.0, 62, 0.5, 0.6));
  txt('Follow for more WHAT IF', 1420, 52, '#fff', win(t, 59.2, 62, 0.5, 0.6), { serif: true });
  txt('Facts: Renne et al. 2013 Science; Schulte et al. 2010 Science; Hu et al. 2005 Nature; Russell & Séguin 1982; UN WPP 2024 (8.3 bn). Everything after the near miss is fiction or speculation.',
      1510, 24, '#ccc', win(t, 59.2, 62, 0.5, 0.6), { bold: false, maxW: 860 });

  // transitions
  const flash = Math.max(win(t, 18.9, 20.6, 1.1, 0.6) * 1.0, 0);
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }
  for (const c of [7, 26, 32, 38, 44, 50, 56]) {
    const d = Math.abs(t - c);
    if (d < 0.35) { ctx.fillStyle = `rgba(0,0,0,${0.9 * (1 - d / 0.35)})`; ctx.fillRect(0, 0, W, H); }
  }
  if (t < 0.6) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.6})`; ctx.fillRect(0, 0, W, H); }
  if (t > 61.2) { ctx.fillStyle = `rgba(0,0,0,${(t - 61.2) / 0.8})`; ctx.fillRect(0, 0, W, H); }
}

// ================================================================== frame
function overlayNew(kind, lt, rt) {
  const g = ctx.createLinearGradient(0, 120, 0, 900);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(0.6, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 900);
  hudWar(rt, 1);
  if (kind === 'wall') {
    txt('The survivors built walls.', 560, 60, '#fff', win(lt, 0.4, 5.0));
    txt('Stone. Fire. Cannons.', 670, 44, '#eee', win(lt, 1.2, 5.0), { bold: false });
    txt('For a while, it worked.', 560, 66, '#fbbf24', win(lt, 5.4, 9.8), { serif: true });
  } else if (kind === 'night') {
    txt('Then the flyers came.', 560, 66, '#fff', win(lt, 0.6, 5.0));
    txt("Walls don't stop wings.", 560, 66, '#ef4444', win(lt, 5.4, 9.8), { serif: true });
  } else if (kind === 'retreat') {
    txt('The survivors fled north.', 560, 60, '#fff', win(lt, 0.6, 6.5));
    txt('Fewer than 1 in 6 humans remained.', 560, 56, '#fbbf24', win(lt, 7.0, 12.8));
  } else if (kind === 'lights') {
    txt('City by city...', 560, 62, '#fff', win(lt, 0.6, 5.0));
    txt('...the lights went out.', 560, 66, '#fbbf24', win(lt, 4.6, 9.8), { serif: true });
  }
}

// real time -> scene. 'o' = original scene, played over [a,b] using its own clock [c,d].
const SEGS = [[0, 9, 'o', 0, 7], [9, 16, 'o', 7, 13], [16, 24, 'o', 13, 20], [24, 32, 'o', 20, 26],
  [32, 39, 'o', 26, 32], [39, 46, 'o', 32, 38], [46, 53, 'o', 38, 44], [53, 60, 'o', 44, 50],
  [60, 70, 'wall'], [70, 80, 'night'], [80, 87, 'o', 50, 56], [87, 100, 'retreat'], [100, 110, 'lights'],
  [110, 120, 'o', 56, 62]];

window.frame = (rt, type = 'image/jpeg') => {
  REAL_T = rt;
  const sg = SEGS.find(q => rt < q[1]) || SEGS[SEGS.length - 1];
  const kind = sg[2];
  showActors(kind);
  lightPts.visible = false;
  if (kind === 'o') {
    const t = sg[3] + (rt - sg[0]) * (sg[4] - sg[3]) / (sg[1] - sg[0]);
    if (t < 20 || t >= 56) {
      updateSpace(t);
      if (rt >= 100) { earth.material.emissiveIntensity = 0; updateLights(rt); }
      renderer.render(space, spaceCam);
    } else { updateGround(t); renderer.render(ground, groundCam); }
    ctx.drawImage(renderer.domElement, 0, 0);
    overlay(t);
  } else if (kind === 'lights') {
    const lt = rt - sg[0];
    updateSpace(56 - (110 - rt) * 0.6);
    earth.material.emissiveIntensity = 0; atmo.material.uniforms.k.value = 0.55;
    updateLights(rt);
    const k = smooth(lt / 10);
    spaceCam.position.set(lerp(-6, -14, k), lerp(8, 3, k), lerp(-22, -16, k));
    spaceCam.lookAt(0, 0, 0);
    renderer.render(space, spaceCam);
    ctx.drawImage(renderer.domElement, 0, 0);
    overlayNew(kind, lt, rt);
  } else {
    const lt = rt - sg[0];
    updateGround(55.6);
    updateNew(kind, lt, rt);
    renderer.render(ground, groundCam);
    ctx.drawImage(renderer.domElement, 0, 0);
    overlayNew(kind, lt, rt);
  }
  for (const c of [60, 70, 80, 87, 100, 110]) {
    const d = Math.abs(rt - c);
    if (d < 0.35) { ctx.fillStyle = `rgba(0,0,0,${0.9 * (1 - d / 0.35)})`; ctx.fillRect(0, 0, W, H); }
  }
  return out.toDataURL(type, 0.93);
};
window.DURATION = DURATION;
window.ready = true;
