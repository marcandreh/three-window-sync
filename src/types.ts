export type Window = {
  x: number;
  y: number;
  height: number;
  width: number;
  hash: string;
};

export type ChangeEventHandler = () => void;

export interface WindowStore {
  readonly windows: Window[];
  readonly instance?: Window;

  onChange?: ChangeEventHandler;

  register: () => void;
  unregister: () => void;
  update: () => boolean;
  bringToFront: () => void;
  clear: () => void;
}
