/**
 * Open a URL in a new tab/window from a user gesture (3D pointer, button, etc.).
 * Tries window.open first (reliable on desktop click), then a transient <a> click
 * (better on iOS Safari and in-app browsers), then same-tab navigation.
 */
export function openExternalUrl(url: string): void {
  if (typeof window === "undefined" || !url) return;

  if (tryWindowOpen(url)) return;
  if (tryAnchorClick(url)) return;

  window.location.assign(url);
}

function tryWindowOpen(url: string): boolean {
  try {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    return popup !== null;
  } catch {
    return false;
  }
}

function tryAnchorClick(url: string): boolean {
  if (typeof document === "undefined") return false;

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return true;
  } catch {
    return false;
  }
}
