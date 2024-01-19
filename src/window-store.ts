type Shape = {
  x: number;
  y: number;
  height: number;
  width: number;
};

type Window = Shape & {
  id: number;
};

type ChangeEventHandler = () => void;

export class WindowStore {
  static KEY = 'windows';

  #items: Record<string, Window> = {};
  #instance?: Window;
  onChange?: ChangeEventHandler;

  constructor() {
    window.addEventListener('storage', ({ key, newValue }) => {
      if (key == WindowStore.KEY) this.handleStorageChange(newValue);
    });

    window.addEventListener('beforeunload', () => {
      this.unregister();
    });
  }

  static clear = () => {
    localStorage.removeItem(WindowStore.KEY);
  };

  get shape() {
    return {
      x: window.screenLeft,
      y: window.screenTop,
      height: window.innerHeight,
      width: window.innerWidth,
    };
  }

  get windows() {
    return this.#items;
  }

  get instance() {
    return this.#items;
  }

  register = () => {
    const json = localStorage.getItem(WindowStore.KEY);
    if (json) this.#items = JSON.parse(json);

    this.#instance = {
      id: new Date().getTime(),
      ...this.shape,
    };

    this.#items[this.#instance.id] = this.#instance;
    localStorage.setItem(WindowStore.KEY, JSON.stringify(this.#items));
  };

  unregister = () => {
    if (!this.#instance) return;

    delete this.#items[this.#instance.id];
    localStorage.setItem(WindowStore.KEY, JSON.stringify(this.#items));
  };

  update() {
    if (!this.#instance) return false;

    const shape = this.shape;

    if (
      this.#instance.x !== shape.x ||
      this.#instance.y !== shape.y ||
      this.#instance.height !== shape.height ||
      this.#instance.width !== shape.width
    ) {
      this.#instance = {
        id: this.#instance.id,
        ...shape,
      };

      this.#items[this.#instance.id] = this.#instance;
      localStorage.setItem(WindowStore.KEY, JSON.stringify(this.#items));

      return true;
    }

    return false;
  }

  private handleStorageChange = (value: string | null) => {
    const windows = value ? JSON.parse(value) : null;

    let hashA = 0;
    windows && Object.keys(windows).forEach((id) => (hashA += Number(id)));
    let hashB = 0;
    Object.keys(this.#items).forEach((id) => (hashB += Number(id)));

    if (hashA !== hashB) this.onChange?.();
  };
}
