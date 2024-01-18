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
  windows: Record<string, Window> = {};
  instance?: Window;
  private onChange?: ChangeEventHandler;

  static KEY = "windows";

  constructor(onChange?: ChangeEventHandler) {
    this.onChange = onChange;

    window.addEventListener("storage", event => {
      if (event.key == WindowStore.KEY)
        this.handleStorageChange(event.newValue ?? "{}");
    });

    window.addEventListener("beforeunload", () => {
      this.unregister();
    });
  }

  static clear = () => {
    localStorage.removeItem(WindowStore.KEY);
  };

  private get shape() {
    return {
      x: window.screenLeft,
      y: window.screenTop,
      height: window.innerHeight,
      width: window.innerWidth,
    };
  }

  register = () => {
    const json = localStorage.getItem(WindowStore.KEY);
    if (json) this.windows = JSON.parse(json);

    this.instance = {
      id: new Date().getTime(),
      ...this.shape,
    };

    this.windows[this.instance.id] = this.instance;
    localStorage.setItem(WindowStore.KEY, JSON.stringify(this.windows));
  };

  unregister = () => {
    if (!this.instance) return;

    delete this.windows[this.instance.id];
    localStorage.setItem(WindowStore.KEY, JSON.stringify(this.windows));
  };

  private handleStorageChange = (value: string) => {
    const windows = JSON.parse(value) ?? {};

    let hashA = 0;
    Object.keys(windows).forEach(id => (hashA += Number(id)));
    let hashB = 0;
    Object.keys(this.windows).forEach(id => (hashB += Number(id)));

    if (hashA !== hashB) this.onChange?.();
  };

  update() {
    if (!this.instance) return false;

    const shape = this.shape;

    if (
      this.instance.x !== shape.x ||
      this.instance.y !== shape.y ||
      this.instance.height !== shape.height ||
      this.instance.width !== shape.width
    ) {
      this.instance = {
        id: this.instance.id,
        ...shape,
      };

      this.windows[this.instance.id] = this.instance;
      localStorage.setItem(WindowStore.KEY, JSON.stringify(this.windows));

      return true;
    }

    return false;
  }
}
