// 3D skyline scene hooked to world state
// Uses global THREE from CDN

export class NeonScene {
  constructor(container) {
    this.container = container;
    this.canvas = document.getElementById('threeCanvas');

    const w = container.clientWidth; const h = container.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = false;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.012);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 2000);
    this.camera.position.set(60, 38, 80);

    // Basic lighting
    this.amb = new THREE.AmbientLight(0x1d2b46, 0.9);
    this.scene.add(this.amb);

    this.sun = new THREE.DirectionalLight(0xffffff, 0.7);
    this.sun.position.set(80, 120, 40);
    this.scene.add(this.sun);

    // Sky gradient
    this.bg = gradientBackdrop();
    this.scene.add(this.bg);

    // City
    this.city = makeCityBlock();
    this.scene.add(this.city);

    // Billboards
    this.billboards = makeBillboards();
    this.scene.add(this.billboards);

    // Drones traffic
    const { drones, splines } = makeDrones();
    this.drones = drones; this.paths = splines;
    this.scene.add(drones);

    // Postprocessing (bloom)
    this.composer = new THREE.EffectComposer(this.renderer);
    this.renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    const bloomStrength = 1.2, bloomRadius = 0.6, bloomThreshold = 0.2;
    this.bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), bloomStrength, bloomRadius, bloomThreshold);
    this.composer.addPass(this.bloomPass);

    // Resize
    window.addEventListener('resize', () => this.onResize());
    this.t = 0;
  }

  onResize() {
    const w = this.container.clientWidth; const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.composer.setSize(w, h);
  }

  updateFromWorld(world) {
    // Adjust fog and drone count by district composite state
    const chrome = world.districts.find(d => d.id==='chrome');
    const rust = world.districts.find(d => d.id==='rustline');
    const under = world.districts.find(d => d.id==='underhollow');

    // Fog density: more fog with unrest in Underhollow
    const baseFog = 0.008 + (under.unrest * 0.015);
    this.scene.fog.density = baseFog;

    // Emissive intensity scaled to drones/corp pressure (feel more neon when corp presence is high)
    const corpPower = world.factions.getPower('Dominion Corps');
    const neonIntensity = 0.8 + corpPower * 0.8;
    this.billboards.children.forEach(m => m.material.emissiveIntensity = neonIntensity);

    // Drone count: retarget visibility based on total drones average
    const avgDrones = (chrome.drones + rust.drones + under.drones) / 3;
    const targetCount = Math.floor(50 + avgDrones * 120);
    setDroneCount(this.drones, targetCount);

    // Time of day -> sun color/angle
    const h = world.clock.hour + world.clock.minute/60;
    const t = h / 24.0;
    const sunAngle = t * Math.PI * 2;
    this.sun.position.set(Math.cos(sunAngle) * 140, 100 + Math.sin(sunAngle) * 60, 70);
    const day = Math.sin((t) * Math.PI);
    this.sun.intensity = 0.4 + 0.6 * day;
    this.amb.intensity = 0.6 + 0.4 * (1 - day);
  }

  frame(dt) {
    this.t += dt;

    // Drone motion along circular paths
    for (let i = 0; i < this.drones.children.length; i++) {
      const m = this.drones.children[i];
      const speed = 0.3 + (m.userData.speed || 0.2);
      const r = m.userData.radius || 20 + (i % 10) * 1.5;
      const h = 8 + (i % 5) * 4;
      const a = (this.t * speed + i) % (Math.PI * 2);
      m.position.set(Math.cos(a) * r, h, Math.sin(a) * r);
      m.lookAt(0, h, 0);
    }

    // Billboard pulse
    this.billboards.children.forEach((b, idx) => {
      const pulse = 0.9 + 0.2 * Math.sin(this.t * 2 + idx);
      b.material.emissiveIntensity = (b.material.emissiveIntensityBase || 1.2) * pulse;
    });

    // Camera subtle dolly/orbit
    const r = 95, y = 38;
    const a = this.t * 0.06;
    this.camera.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    this.camera.lookAt(0, 20, 0);

    this.composer.render();
  }
}

// Helpers to build scene
function gradientBackdrop() {
  const g = new THREE.PlaneGeometry(2000, 1000);
  const mat = new THREE.ShaderMaterial({
    depthWrite: false,
    transparent: true,
    uniforms: {
      top: { value: new THREE.Color(0x091627) },
      bottom: { value: new THREE.Color(0x180a20) }
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; uniform vec3 top; uniform vec3 bottom; void main(){ vec3 c=mix(bottom, top, smoothstep(0.0,1.0,vUv.y)); gl_FragColor=vec4(c,1.0); }`
  });
  const m = new THREE.Mesh(g, mat);
  m.position.set(0, 200, -600);
  return m;
}

function makeCityBlock() {
  const group = new THREE.Group();
  const seed = Math.random()*9999;
  const rng = mulberry32(seed);

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1a2233, metalness: 0.6, roughness: 0.85 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x0b0f1a, emissive: 0x0, emissiveIntensity: 0.0 });

  for (let i=0; i<200; i++) {
    const w = 4 + Math.floor(rng()*6);
    const d = 4 + Math.floor(rng()*6);
    const h = 10 + Math.floor(rng()*60);
    const geo = new THREE.BoxGeometry(w, h, d);

    const b = new THREE.Mesh(geo, baseMat.clone());
    b.position.set((rng()-0.5)*120, h/2, (rng()-0.5)*120);
    group.add(b);

    // Emissive windows belt
    const beltGeo = new THREE.BoxGeometry(w*0.98, 0.4, d*0.98);
    for (let y=2; y<h; y+=4) {
      const belt = new THREE.Mesh(beltGeo, new THREE.MeshStandardMaterial({
        color: 0x111414,
        emissive: pickNeon(rng),
        emissiveIntensity: 1.2,
        metalness: 0.2,
        roughness: 0.8
      }));
      belt.position.set(b.position.x, y, b.position.z);
      group.add(belt);
    }
  }

  // Elevated highways
  for (let i=0;i<3;i++) {
    const hw = new THREE.Mesh(new THREE.BoxGeometry(180, 2, 6), new THREE.MeshStandardMaterial({ color: 0x10151e, metalness:0.7, roughness:0.6 }));
    hw.position.set(0, 18 + i*8, -60 + i*30);
    group.add(hw);
  }

  return group;
}

function makeBillboards() {
  const group = new THREE.Group();
  const signs = [0xff2fb9, 0x19e3ff, 0x00f5d4, 0xff6b6b, 0xf6ff66];
  for (let i=0;i<14;i++) {
    const w = 6 + Math.random()*8; const h = 2 + Math.random()*6;
    const geo = new THREE.PlaneGeometry(w, h);
    const mat = new THREE.MeshStandardMaterial({ color: 0x090d14, emissive: signs[i%signs.length], emissiveIntensity: 1.2, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.material.emissiveIntensityBase = 1.2;
    m.position.set((Math.random()-0.5)*120, 6 + Math.random()*40, (Math.random()-0.5)*120);
    m.rotation.y = Math.random()*Math.PI;
    group.add(m);
  }
  return group;
}

function makeDrones() {
  const group = new THREE.Group();
  for (let i=0;i<80;i++) {
    const g = new THREE.SphereGeometry(0.35, 12, 12);
    const m = new THREE.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x19e3ff, emissiveIntensity: 2.0, metalness: 0.4, roughness:0.3 });
    const s = new THREE.Mesh(g, m);
    s.userData.speed = 0.1 + Math.random()*0.4;
    s.userData.radius = 20 + Math.random()*70;
    group.add(s);
  }
  return { drones: group, splines: [] };
}

function setDroneCount(group, count) {
  // Ensure group has exactly count children
  const cur = group.children.length;
  if (cur < count) {
    for (let i=0;i<count-cur;i++) {
      const g = new THREE.SphereGeometry(0.35, 12, 12);
      const m = new THREE.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x19e3ff, emissiveIntensity: 2.0, metalness: 0.4, roughness:0.3 });
      const s = new THREE.Mesh(g, m);
      s.userData.speed = 0.1 + Math.random()*0.4;
      s.userData.radius = 20 + Math.random()*70;
      group.add(s);
    }
  } else if (cur > count) {
    group.children.splice(count).forEach(c => { c.geometry.dispose(); c.material.dispose(); });
  }
}

function pickNeon(rng) {
  const palette = [0xff2fb9, 0x19e3ff, 0x00f5d4, 0xff6b6b, 0xf6ff66];
  return palette[Math.floor(rng()*palette.length)];
}

function mulberry32(a){ return function(){ var t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
