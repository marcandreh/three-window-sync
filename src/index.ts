import { BoxGeometry, Color, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import { LocalWindowStore } from './store';
import { MultiWindowRendering } from './synchronization';

export const threeWindowSyncDemo = () => {
  const spring = 0.01;
  const damping = 0.95;

  const store = new LocalWindowStore();
  const rendering = new MultiWindowRendering(store);

  rendering.onSetup = (args) => {
    args.scene.background = new Color('rgb(18, 18, 18)');
  };

  rendering.onSync = ({ x, y, window, windowIndex }) => {
    const color = new Color();
    color.setHSL(windowIndex * 0.1, 1.0, 0.5);

    const size = 100 + windowIndex * 50;
    const cube = new Mesh(new BoxGeometry(size, size, size), new MeshBasicMaterial({ color, wireframe: true }));

    cube.position.x = x + window.width * 0.5;
    cube.position.y = y + window.height * 0.5;

    cube.userData.rotationSpeedX = 0.01 + (windowIndex / 10) * 0.01;
    cube.userData.rotationSpeedY = 0.02 + (windowIndex / 10) * 0.01;
    cube.userData.velocity = new Vector3(0, 0, 0);

    return cube;
  };

  rendering.onRender = ({ x, y, item }) => {
    // Calculate the spring force.
    const springForceX = (x - item.position.x) * spring;
    const springForceY = (y - item.position.y) * spring;

    // Apply the spring force to the velocity.
    item.userData.velocity.x += springForceX;
    item.userData.velocity.y += springForceY;

    // Apply damping to the velocity.
    item.userData.velocity.x *= damping;
    item.userData.velocity.y *= damping;

    // Update the position based on the velocity
    item.position.x += item.userData.velocity.x;
    item.position.y += item.userData.velocity.y;

    item.rotation.x += item.userData.rotationSpeedX;
    item.rotation.y += item.userData.rotationSpeedY;
  };

  document.addEventListener('DOMContentLoaded', () => {
    rendering.setup();
    rendering.start();
  });

  return { store, rendering };
};

export * from './types';
export { LocalWindowStore, MultiWindowRendering };
export default { LocalWindowStore, MultiWindowRendering };
