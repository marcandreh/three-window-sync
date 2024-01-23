import { Color, Object3D, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { RenderHandler, SetupHandler, SyncHandler, WindowStore, WindowSynchronization } from './types';

export class MultiWindowRendering implements WindowSynchronization {
  #camera: OrthographicCamera;
  #scene: Scene;
  #world: Object3D;
  #renderer: WebGLRenderer;
  #store: WindowStore;

  #items = new Array<Object3D>();
  #running = false;
  #sceneOffsetTarget = { x: 0, y: 0 };
  #sceneOffset = { x: 0, y: 0 };

  private static readonly FALLOFF = 0.05;

  onSetup?: SetupHandler;
  onSync?: SyncHandler;
  onRender?: RenderHandler;

  constructor(store: WindowStore) {
    // Create core objects with default values.
    // Window specific properties (e.g. size) are later set on setup.
    this.#camera = new OrthographicCamera(undefined, undefined, undefined, undefined, -1000, 1000);
    this.#camera.position.z = 2.5;

    this.#scene = new Scene();
    this.#scene.background = new Color('rgb(18, 18, 18)');
    this.#scene.add((this.#world = new Object3D()));

    this.#renderer = new WebGLRenderer({ antialias: true });

    this.#store = store;
    this.#store.onChange = this.sync;
  }

  /**
   * Prepares the scene for rendering.
   * Must be called once before `start` and after DOM is initialized
   * (e.g. on `DOMContentLoaded`).
   */
  setup = () => {
    this.#renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.#renderer.domElement.setAttribute('id', 'scene');
    document.body.appendChild(this.#renderer.domElement);

    // Call setup handler, so custom setup on core objects can be done.
    this.onSetup?.({ camera: this.#camera, scene: this.#scene, renderer: this.#renderer });

    // Register current window before syncing objects.
    this.#store.register();

    // Resize camera and renderer, calc offsets and sync objects initally.
    this.resize();
    this.move(false);
    this.sync();

    window.addEventListener('resize', this.resize);
    window.addEventListener('beforeunload', this.#store.unregister);
  };

  /**
   *
   */
  start = () => {
    this.#running = true;
    this.render();
  };

  /**
   *
   */
  stop = () => {
    this.#running = false;
  };

  /**
   *
   */
  private sync = () => {
    this.#world.remove(...this.#items);
    this.#items = [];

    const windows = this.#store.items;

    windows.forEach((window, windowIndex) => {
      const item = this.onSync?.({ window, windowIndex, x: window.x, y: window.y });

      if (item) {
        this.#world.add(item);
        this.#items.push(item);
      }
    });
  };

  /**
   *
   */
  private render = () => {
    if (!this.#running) return;

    if (this.#store.update()) this.move();

    this.#sceneOffset.x =
      this.#sceneOffset.x + (this.#sceneOffsetTarget.x - this.#sceneOffset.x) * MultiWindowRendering.FALLOFF;
    this.#sceneOffset.y =
      this.#sceneOffset.y + (this.#sceneOffsetTarget.y - this.#sceneOffset.y) * MultiWindowRendering.FALLOFF;

    this.#world.position.x = this.#sceneOffset.x;
    this.#world.position.y = this.#sceneOffset.y;

    const windows = this.#store.items;

    this.#items.forEach((item, index) => {
      const window = windows[index];
      if (!window) return;

      const posTarget = {
        x: window.x + window.width * 0.5,
        y: window.y + window.height * 0.5,
      };

      item.position.x = item.position.x + (posTarget.x - item.position.x) * MultiWindowRendering.FALLOFF;
      item.position.y = item.position.y + (posTarget.y - item.position.y) * MultiWindowRendering.FALLOFF;

      this?.onRender?.({ ...posTarget, window, windowIndex: index, item });
    });

    this.#renderer.render(this.#scene, this.#camera);
    requestAnimationFrame(this.render);
  };

  private move = (easing = true) => {
    this.#sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
    if (!easing) this.#sceneOffset = this.#sceneOffsetTarget;
  };

  private resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.#camera.left = 0;
    this.#camera.right = width;
    this.#camera.top = 0;
    this.#camera.bottom = height;

    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(width, height);
  };
}
