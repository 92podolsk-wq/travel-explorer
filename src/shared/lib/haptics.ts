// Thin wrapper around @capacitor/haptics — no-op on web/SSR, never throws.
async function getHaptics() {
  if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform?.()) {
    return null;
  }
  try {
    const { Haptics } = await import("@capacitor/haptics");
    return Haptics;
  } catch {
    return null;
  }
}

export async function hapticLight() {
  const haptics = await getHaptics();
  if (!haptics) return;
  const { ImpactStyle } = await import("@capacitor/haptics");
  haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export async function hapticMedium() {
  const haptics = await getHaptics();
  if (!haptics) return;
  const { ImpactStyle } = await import("@capacitor/haptics");
  haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

export async function hapticSelection() {
  const haptics = await getHaptics();
  if (!haptics) return;
  haptics.selectionStart().catch(() => {});
}
