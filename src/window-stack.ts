import { ChangeEventHandler, Window, WindowStore } from './types';

/**
 * Stores windows in local storage in a stack format.
 */
export class WindowStack implements WindowStore {
  #key: string;
  #items: Array<Window> = [];
  #instance?: Window;

  onChange?: ChangeEventHandler;

  constructor(key = 'windows') {
    this.#key = key;
  }

  /**
   * Returns **all registered browser windows**.
   */
  get windows() {
    return this.#items;
  }

  /**
   * Returns the **registered instance of this browser window**.
   */
  get instance() {
    return this.#instance;
  }

  /**
   * **Registers an instance** this browser window.
   */
  register = () => {
    if (this.#instance) throw new Error('Window is already registered');

    // Parse registered windows from local storage.
    const json = localStorage.getItem(this.#key);
    this.#items = json ? JSON.parse(json) : [];

    // Create a new instance of this window and write it to local storage.
    this.#instance = this.createInstance();
    this.#items.push(this.#instance);
    localStorage.setItem(this.#key, JSON.stringify(this.#items));

    // Listen to local storage changes.
    // If windows have changed, call the onChange handler.
    window.addEventListener('storage', ({ key, newValue }) => {
      if (key !== this.#key || !this.#instance) return;

      // TODO: Only notify windows on top of this instance's stack.
      const items = newValue ? JSON.parse(newValue) : [];
      const hasChanges = items.length !== this.#items.length;
      hasChanges && this.onChange?.();
    });
  };

  /**
   * **Unregisters the instance** this browser window.
   */
  unregister = () => {
    if (!this.#instance) return;

    // Find index of this window and remove it.
    const index = this.#items.indexOf(this.#instance);
    this.#items.splice(index, 1);
    this.#instance = undefined;

    localStorage.setItem(this.#key, JSON.stringify(this.#items));
  };

  /**
   * **Updates the instance** of this browser window, if its size or location has changed.
   * Returns `true` if the instance has changed.
   */
  update() {
    if (!this.#instance) return false;

    const instance = this.createInstance();

    if (instance.hash !== this.#instance.hash) {
      const index = this.#items.indexOf(this.#instance);
      this.#items[index] = instance;
      this.#instance = instance;

      localStorage.setItem(this.#key, JSON.stringify(this.#items));
      return true;
    }

    return false;
  }

  /**
   *
   */
  bringToFront = () => {
    if (!this.#instance) return;

    const index = this.#items.indexOf(this.#instance);
    this.#items.splice(index, 1);
    this.#items.push(this.#instance);
  };

  clear = () => {
    this.#items = [];
    this.#instance = undefined;
    localStorage.removeItem(this.#key);
  };

  private createInstance(): Window {
    const shape = {
      x: window.screenLeft,
      y: window.screenTop,
      height: window.innerHeight,
      width: window.innerWidth,
    };

    return {
      ...shape,
      hash: `${shape.x}x${shape.y}-${shape.height}x${shape.width}`,
    };
  }
}
