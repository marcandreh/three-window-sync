import { Object3D, OrthographicCamera, Scene, WebGLRenderer } from 'three';

export type Window = {
  id: number;
  x: number;
  y: number;
  height: number;
  width: number;
};

export type ChangeHandler = () => void;

export interface WindowStore {
  readonly items: Window[];
  readonly instance?: Window;

  onChange?: ChangeHandler;

  register: () => void;
  unregister: () => void;
  update: () => boolean;
  clear: () => void;
}

export type SetupHandlerArgs = { camera: OrthographicCamera; scene: Scene; renderer: WebGLRenderer };
export type SetupHandler = (args: SetupHandlerArgs) => void;
export type SyncHandlerArgs = { x: number; y: number; windowIndex: number; window: Window };
export type SyncHandler = (args: SyncHandlerArgs) => Object3D | undefined;
export type RenderHandlerArgs = { item: Object3D; x: number; y: number; windowIndex: number; window: Window };
export type RenderHandler = (args: RenderHandlerArgs) => void;

export interface WindowSynchronization {
  onSetup?: SetupHandler;
  onSync?: SyncHandler;
  onRender?: RenderHandler;

  setup: () => void;
  start: () => void;
  stop: () => void;
}
