import { SyncService } from './sync-service';

export default function sync() {
  const threeSync = new SyncService();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState != 'hidden') threeSync.setup();
  });

  document.addEventListener('onload', () => {
    if (document.visibilityState != 'hidden') threeSync.setup();
  });

  setTimeout(() => threeSync.setup(), 500);

  window.addEventListener('resize', () => threeSync.resize());
}

sync();
