import { SyncService } from "./sync-service";

export default function sync() {
  const service = new SyncService();

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState != "hidden") service.setup();
  });

  document.addEventListener("onload", () => {
    if (document.visibilityState != "hidden") service.setup();
  });

  setTimeout(() => service.setup(), 500);

  window.addEventListener("resize", () => service.resize());
}

sync();
