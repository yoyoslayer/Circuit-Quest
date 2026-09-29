
// ---- Renderer & scene ---------------------------------------------------------------------------
const canvas = $('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const effect = new OutlineEffect(renderer, { defaultThickness: 0.0032, defaultColor: [0.17, 0.18, 0.26] });

const scene = new THREE.Scene();
// The sky's color and the fog change with the time of day and the weather (world/sky.ts).
scene.background = new THREE.Color('#bfe3ff');
scene.fog = new THREE.Fog('#bfe3ff', 40, 90);
/** How far the camera sees in the office: as far as the haze ever is, from the top floor. */
const FAR = HAZE_MAX + 20;
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, FAR);

const hemi = new THREE.HemisphereLight('#fff5e6', '#c9a27a', 1.5);
const ambient = new THREE.AmbientLight('#ffffff', 0.5);
scene.add(hemi, ambient);
// The sun by day and the moon by night; the sky moves it (world/sky.ts).
const sun = new THREE.DirectionalLight('#fff1d6', 2.2);
sun.position.set(-8, 18, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
// Wide enough for the office, the garage under it and the balcony and lot out front, from wherever the sun is.
Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 30, bottom: -30, near: 1, far: 100 });
sun.shadow.bias = -0.0008;
sun.shadow.normalBias = 0.03;
scene.add(sun);

const office = buildOffice();
scene.add(office.group);
const sky = new Sky(scene, { sun, hemi, ambient }, office.night);
store.on('sky', () => store.sky && sky.set(store.sky));
// Halloween or Christmas decorations, up while the building's dressed up for one (see dressUp).
const holiday = new Holiday(office);
scene.add(holiday.group);

const noOutline = (obj: THREE.Object3D) =>
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const geo = m.geometry;
    const flat = geo instanceof THREE.PlaneGeometry || geo instanceof THREE.CircleGeometry;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) if (flat || mat instanceof THREE.MeshBasicMaterial) mat.userData.outlineParameters = { visible: false };
  });
noOutline(office.group);
noOutline(holiday.group);
