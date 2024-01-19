import { OrthographicCamera, Scene, WebGLRenderer, Object3D, Color, Mesh, BoxGeometry, MeshBasicMaterial } from 'three';
import { WindowStore } from './window-store';
export class SyncService {
  private ready = false;
  private camera!: OrthographicCamera;
  private scene!: Scene;
  private renderer!: WebGLRenderer;
  private world!: Object3D;
  private cubes = new Array<Mesh>();
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

    this.store = new WindowStore();
    this.store.onChange = this.updateContent;
    this.store.register();

    this.resize();
    this.updateWindow(false);
    this.render();
    this.updateContent();
  };

  reset = () => {};

  updateContent = () => {
    const windows = Object.values(this.store.windows);

    this.cubes.forEach((cube) => {
      this.world.remove(cube);
    });

    this.cubes = [];

    windows.forEach((window, index) => {
      const color = new Color();
      color.setHSL(index * 0.1, 1.0, 0.5);

      const size = 100 + index * 50;
      const cube = new Mesh(new BoxGeometry(size, size, size), new MeshBasicMaterial({ color, wireframe: true }));

      cube.position.x = window.x + window.width * 0.5;
      cube.position.y = window.y + window.height * 0.5;

      this.world.add(cube);
      this.cubes.push(cube);
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

    const windows = Object.values(this.store.windows);

    this.cubes.forEach((cube, index) => {
      const window = windows[index];

      const posTarget = {
        x: window.x + window.width * 0.5,
        y: window.y + window.height * 0.5,
      };

      cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
      cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;
      cube.rotation.x = time * 0.5;
      cube.rotation.y = time * 0.3;
    });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  };
}
