// Thin wrapper around @capacitor/haptics — no-op on web/SSR, never throws.
//
// Returns { plugin } rather than the plugin object directly: Capacitor's
// plugin proxies respond to arbitrary property access (routing it to a
// native call), so a plugin object returned straight from an async function
// gets treated as "thenable" by the JS engine's promise-resolution algorithm
// — it calls plugin.then(...), which the native side doesn't implement, and
// the outer await never settles. Wrapping in a plain object avoids that.
type HapticsPlugin = typeof import("@capacitor/haptics")["Haptics"];

async function getHaptics(): Promise<{ plugin: HapticsPlugin | null }> {
  if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform?.()) {
    return { plugin: null };
  }
  try {
    const { Haptics } = await import("@capacitor/haptics");
    return { plugin: Haptics };
  } catch {
    return { plugin: null };
  }
}

export async function hapticLight() {
  const { plugin: haptics } = await getHaptics();
  if (!haptics) return;
  const { ImpactStyle } = await import("@capacitor/haptics");
  haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export async function hapticMedium() {
  const { plugin: haptics } = await getHaptics();
  if (!haptics) return;
  const { ImpactStyle } = await import("@capacitor/haptics");
  haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

export async function hapticSelection() {
  const { plugin: haptics } = await getHaptics();
  if (!haptics) return;
  haptics.selectionStart().catch(() => {});
}
