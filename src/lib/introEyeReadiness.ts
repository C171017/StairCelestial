/**
 * The loading eye may finish an in-flight blink, but never waits for another
 * blink or its idle pause once the essential scene becomes usable.
 */
export function createIntroEyeReadiness(open: () => void) {
  let ready = false;
  let blinking = false;
  let opened = false;
  let disposed = false;

  const tryOpen = () => {
    if (!ready || blinking || opened || disposed) return;
    opened = true;
    open();
  };

  return {
    beginBlink() {
      if (ready || opened || disposed) return false;
      blinking = true;
      return true;
    },
    finishBlink() {
      blinking = false;
      tryOpen();
    },
    setReady(value: boolean) {
      ready = value;
      tryOpen();
    },
    dispose() {
      disposed = true;
    },
  };
}
