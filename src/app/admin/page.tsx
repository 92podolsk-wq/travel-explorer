import { Suspense } from "react";
import { AdminPanel } from "@/widgets/admin-panel/ui/admin-panel";

export default function AdminPage() {
  return (
    <main className="min-h-dvh bg-muted">
      <Suspense fallback={null}>
        <AdminPanel />
      </Suspense>
    </main>
  );
}
