import { useEffect } from "react";

// Warns before the browser tab is closed, refreshed, or navigated away from
// (address bar / external link) while there are unsaved form edits. Does not
// cover in-app client-side navigation (that never fires beforeunload).
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
