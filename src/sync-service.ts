import { BoxGeometry, Color, Mesh, MeshBasicMaterial, Object3D, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { WindowStack } from './window-stack';
import { WindowStore } from './types';

export class SyncService {
  private ready = false;
  private camera!: OrthographicCamera;
  private scene!: Scene;
  private renderer!: WebGLRenderer;
  private world!: Object3D;
  private items = new Array<Object3D>();
  private store!: WindowStore;
  private sceneOffsetTarget = { x: 0, y: 0 };
  private sceneOffset = { x: 0, y: 0 };

  setup = () => {
    if (this.ready) return;
    this.ready = true;

    this.camera = new OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
    this.camera.position.z = 2.5;

    this.scene = new Scene();
    this.scene.background = new Color(0.0);
    this.scene.add(this.camera);

    this.renderer = new WebGLRenderer({ antialias: true, depth: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);

    this.world = new Object3D();
    this.scene.add(this.world);

    this.renderer.domElement.setAttribute('id', 'scene');
    document.body.appendChild(this.renderer.domElement);

    this.store = new WindowStack();
    this.store.onChange = this.updateContent;
    this.store.register();

    this.resize();
    this.updateWindow(false);
    this.render();
    this.updateContent();

    // Automatically unregister this window when it is closed.
    window.addEventListener('beforeunload', this.store.unregister);
  };

  reset = () => {
    this.store.clear();
  };

  updateContent = () => {
    this.world.remove(...this.items);
    this.items = [];

    const windows = this.store.windows;

    windows.forEach((window, index) => {
      const color = new Color();
      color.setHSL(index * 0.1, 1.0, 0.5);

      const size = 100 + index * 50;
      const cube = new Mesh(new BoxGeometry(size, size, size), new MeshBasicMaterial({ color, wireframe: true }));

      cube.position.x = window.x + window.width * 0.5;
      cube.position.y = window.y + window.height * 0.5;

      // const loader = new GLTFLoader();
      // loader.load('demo/LeePerrySmith.glb', (gltf) => {
      //   const mesh = gltf.scene.children[0];
      //   this.world.add(mesh);
      //   this.items.push(cube);
      // });

      this.world.add(cube);
      this.items.push(cube);
    });
  };

  updateWindow = (easing = true) => {
    this.sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) this.sceneOffset = this.sceneOffsetTarget;
  };

  resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera = new OrthographicCamera(0, width, 0, height, -10000, 10000);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  render = () => {
    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);

    const time = (new Date().getTime() - today.getTime()) / 1000.0;

    const hasChanges = this.store.update();
    hasChanges && this.updateWindow();

    const falloff = 0.05;
    this.sceneOffset.x = this.sceneOffset.x + (this.sceneOffsetTarget.x - this.sceneOffset.x) * falloff;
    this.sceneOffset.y = this.sceneOffset.y + (this.sceneOffsetTarget.y - this.sceneOffset.y) * falloff;

    this.world.position.x = this.sceneOffset.x;
    this.world.position.y = this.sceneOffset.y;

    const windows = this.store.windows;

    this.items.forEach((item, index) => {
      const window = windows[index];
      if (!window) return;

      const posTarget = {
        x: window.x + window.width * 0.5,
        y: window.y + window.height * 0.5,
      };

      item.position.x = item.position.x + (posTarget.x - item.position.x) * falloff;
      item.position.y = item.position.y + (posTarget.y - item.position.y) * falloff;
      item.rotation.x = time * 0.5;
      item.rotation.y = time * 0.3;
    });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  };
}
