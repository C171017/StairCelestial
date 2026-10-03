import { usePortfolioStore } from "./store";

const owners = new Set<symbol>();
let revision = 0;

/** Effect replay (Strict Mode / Fast Refresh) is not a new visit. */
export function retainIntroSession() {
  const owner = Symbol("intro session");
  owners.add(owner);
  revision++;
  return () => {
    if (!owners.delete(owner)) return;
    const releasedAt = ++revision;
    queueMicrotask(() => {
      if (owners.size || revision !== releasedAt) return;
      usePortfolioStore.setState({
        sceneBootstrapped: false,
        introEpochMs: null,
        introAtmosphereElapsed: 0,
        introPlayPhase: "hidden",
        introPlayEnteredByClick: false,
        introMainOpacity: 0,
        introStarsOpacity: 0,
        introShootingStarIntensity: 0,
      });
    });
  };
}
