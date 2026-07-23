/* ==========================================================================
   THREE.JS 3D SCENE MANAGER & DYNAMIC BACKGROUND VISUALIZER
   ========================================================================== */

import * as THREE from 'three';

export class SceneManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });

    this.currentTheme = 'theme-cyberpunk';
    this.nodes = [];
    this.particles = null;
    this.grid = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredNode = null;
    this.onNodeClickCallback = null;

    this.init();
  }

  init() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera.position.set(0, 0, 15);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    this.pointLight1 = new THREE.PointLight(0x00f0ff, 3, 50);
    this.pointLight1.position.set(10, 10, 10);
    this.scene.add(this.pointLight1);

    this.pointLight2 = new THREE.PointLight(0x7000ff, 3, 50);
    this.pointLight2.position.set(-10, -10, -5);
    this.scene.add(this.pointLight2);

    // Build initial particle background & 3D selection nodes
    this.createParticles();
    this.createCyberGrid();
    this.createFloating3DNodes();

    // Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('click', (e) => this.onClick(e));

    // Animation Loop
    this.animate();
  }

  createParticles() {
    if (this.particles) this.scene.remove(this.particles);

    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const color1 = new THREE.Color(0x00f0ff);
    const color2 = new THREE.Color(0x7000ff);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60;
      positions[i + 1] = (Math.random() - 0.5) * 60;
      positions[i + 2] = (Math.random() - 0.5) * 60;

      const mixedColor = color1.clone().lerp(color2, Math.random());
      colors[i] = mixedColor.r;
      colors[i + 1] = mixedColor.g;
      colors[i + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createCyberGrid() {
    if (this.grid) this.scene.remove(this.grid);

    const size = 60;
    const divisions = 40;
    this.grid = new THREE.GridHelper(size, divisions, 0x00f0ff, 0x7000ff);
    this.grid.position.y = -12;
    this.grid.material.opacity = 0.35;
    this.grid.material.transparent = true;
    this.scene.add(this.grid);
  }

  createFloating3DNodes() {
    // Clear old nodes
    this.nodes.forEach(node => this.scene.remove(node));
    this.nodes = [];

    const geometries = [
      new THREE.IcosahedronGeometry(1.2, 1),
      new THREE.OctahedronGeometry(1.3, 0),
      new THREE.TorusGeometry(1, 0.4, 16, 32),
      new THREE.DodecahedronGeometry(1.2, 0),
      new THREE.TetrahedronGeometry(1.4, 0)
    ];

    const nodeColors = [0x00f0ff, 0x7000ff, 0xff0076, 0x10b981, 0xf59e0b];

    for (let i = 0; i < 5; i++) {
      const geo = geometries[i % geometries.length];
      const mat = new THREE.MeshStandardMaterial({
        color: nodeColors[i],
        wireframe: true,
        emissive: nodeColors[i],
        emissiveIntensity: 0.4,
        metalness: 0.8,
        roughness: 0.2
      });

      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / 5) * Math.PI * 2;
      const radius = 9;

      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * 3 + (Math.random() - 0.5) * 2;
      mesh.position.z = Math.sin(angle) * (radius * 0.5) - 3;

      mesh.userData = {
        index: i,
        initialY: mesh.position.y,
        rotSpeedX: 0.008 + Math.random() * 0.01,
        rotSpeedY: 0.01 + Math.random() * 0.01,
        floatSpeed: 1.5 + Math.random()
      };

      this.nodes.push(mesh);
      this.scene.add(mesh);
    }
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    let p1Color = 0x00f0ff;
    let p2Color = 0x7000ff;

    if (themeName === 'theme-ancient') {
      p1Color = 0xf59e0b;
      p2Color = 0x10b981;
    } else if (themeName === 'theme-space') {
      p1Color = 0x38bdf8;
      p2Color = 0xc084fc;
    } else if (themeName === 'theme-quantum') {
      p1Color = 0x34d399;
      p2Color = 0x60a5fa;
    }

    this.pointLight1.color.setHex(p1Color);
    this.pointLight2.color.setHex(p2Color);
    if (this.grid) this.grid.material.color.setHex(p1Color);
  }

  transitionToGameplayCamera() {
    // Smooth camera pull forward for gameplay mode
    const targetZ = 8;
    const targetY = 1;

    let progress = 0;
    const animateCam = () => {
      progress += 0.03;
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 0.08);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, 0.08);
      if (progress < 1) requestAnimationFrame(animateCam);
    };
    animateCam();
  }

  transitionToSelectorCamera() {
    const targetZ = 15;
    const targetY = 0;

    let progress = 0;
    const animateCam = () => {
      progress += 0.03;
      this.camera.position.z = THREE.MathUtils.lerp(this.camera.position.z, targetZ, 0.08);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, targetY, 0.08);
      if (progress < 1) requestAnimationFrame(animateCam);
    };
    animateCam();
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast nodes
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (this.hoveredNode !== hit) {
        if (this.hoveredNode) this.hoveredNode.scale.set(1, 1, 1);
        this.hoveredNode = hit;
        this.hoveredNode.scale.set(1.3, 1.3, 1.3);
        document.body.style.cursor = 'pointer';
      }
    } else {
      if (this.hoveredNode) {
        this.hoveredNode.scale.set(1, 1, 1);
        this.hoveredNode = null;
      }
      document.body.style.cursor = 'default';
    }
  }

  onClick(event) {
    if (this.hoveredNode && this.onNodeClickCallback) {
      this.onNodeClickCallback(this.hoveredNode.userData.index);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = Date.now() * 0.001;

    // Rotate & Float 3D Nodes
    this.nodes.forEach(node => {
      node.rotation.x += node.userData.rotSpeedX;
      node.rotation.y += node.userData.rotSpeedY;
      node.position.y = node.userData.initialY + Math.sin(time * node.userData.floatSpeed) * 0.4;
    });

    // Rotate Particles
    if (this.particles) {
      this.particles.rotation.y = time * 0.03;
      this.particles.rotation.x = Math.sin(time * 0.02) * 0.05;
    }

    // Parallax camera movement based on mouse
    this.camera.position.x += (this.mouse.x * 1.5 - this.camera.position.x) * 0.02;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }
}
