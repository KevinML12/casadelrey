// Dialog transitions can overlap while the outgoing surface fades out.
// Keep the background locked until the final dialog releases its layer.
let layers = 0;
let restore = null;

export function lockDialogBackground() {
  if (layers === 0) {
    const root = document.getElementById('root');
    const previousInert = root?.inert;
    const previousOverflow = document.body.style.overflow;
    const trigger = document.activeElement;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    restore = () => {
      if (root) root.inert = previousInert;
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }
  layers += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    layers -= 1;
    if (layers === 0) {
      restore?.();
      restore = null;
    }
  };
}

export function restoreParentDialogFocus(element) {
  const top = [...document.querySelectorAll('[role="dialog"]')].at(-1);
  if (element?.isConnected && top?.contains(element)) element.focus();
}
