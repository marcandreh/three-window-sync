import { ChangeHandler, Window, WindowStore } from './types';

/**
 * Stores browser windows in local storage.
 */
export class LocalWindowStore implements WindowStore {
  #key: string;
  #items: Record<number, Window> = {};
  #instance?: Window;

  onChange?: ChangeHandler;

  constructor(key = 'windows') {
    this.#key = key;
  }

  /**
   * Returns **all registered windows**.
   */
  get items() {
    return Object.values(this.#items);
  }

  /**
   * Returns the **registered instance of this browser window**.
   */
  get instance() {
    return this.#instance;
  }

  /**
   * **Registers an instance** of this browser window.
   */
  register = () => {
    if (this.#instance) throw new Error('Window is already registered');

    // Parse registered windows from local storage.
    const json = localStorage.getItem(this.#key);
    this.#items = json ? JSON.parse(json) : {};

    // Create a new instance of this window and write it to local storage.
    this.#instance = this.createInstance();
    this.#items[this.#instance.id] = this.#instance;
    localStorage.setItem(this.#key, JSON.stringify(this.#items));

    // Listen to local storage changes.
    // Do this after writing to it, so we don't trigger our own change handler.
    window.addEventListener('storage', this.handleStorageChange);
  };

  /**
   * **Unregisters the instance** this browser window.
   */
  unregister = () => {
    if (!this.#instance) return;

    // Remove event handling to local storage changes.
    // Do this before writing to it, so we don't trigger our own change handler.
    window.removeEventListener('storage', this.handleStorageChange);

    // Remove instance of this window and write it to local storage.
    delete this.#items[this.#instance.id];
    this.#instance = undefined;
    localStorage.setItem(this.#key, JSON.stringify(this.#items));
  };

  /**
   * **Updates the instance** of this browser window, if its size or location has changed.
   * Returns `true` if the instance has changed.
   */
  update() {
    if (!this.#instance) return false;

    // Create a new instance with the same id as the current, but with fresh bounds.
    const instance = this.createInstance(this.#instance.id);

    // Only update store if the bounds have changed.
    if (
      instance.x !== this.#instance.x ||
      instance.y !== this.#instance.y ||
      instance.width !== this.#instance.width ||
      instance.height !== this.#instance.height
    ) {
      this.#items[instance.id] = instance;
      this.#instance = instance;
      localStorage.setItem(this.#key, JSON.stringify(this.#items));

      return true;
    }

    return false;
  }

  /**
   * **Clears all windows** in storage.
   */
  clear = () => {
    this.#items = {};
    this.#instance = undefined;
    localStorage.removeItem(this.#key);
  };

  private createInstance = (id?: number): Window => {
    return {
      id: id ?? Date.now(),
      x: window.screenLeft,
      y: window.screenTop,
      height: window.innerHeight,
      width: window.innerWidth,
    };
  };

  private handleStorageChange = ({ key, newValue }: StorageEvent) => {
    if (key !== this.#key || !this.#instance) return;

    const items = newValue ? JSON.parse(newValue) : {};
    const beforeLength = Object.keys(this.#items).length;
    const afterLength = Object.keys(items).length;

    this.#items = items;

    if (beforeLength !== afterLength) this.onChange?.();
  };
}
