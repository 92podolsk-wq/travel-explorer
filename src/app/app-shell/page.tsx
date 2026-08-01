import { AppShellRouter } from "@/views/app-shell-router";
import type { SiteSettings } from "@/entities/site-setting/model/types";

export const dynamic = "force-static";

const placeholderSiteSettings: SiteSettings = {
  mapStyleId: "openfreemap-bright",
  protomapsPmtilesUrl: null,
  maxCustomMarkersPerUser: 0,
  maxPhotoUploadsPerUserPerDay: 0,
  maxPhotoUploadsSiteWidePerDay: 0
};

export default function AppShellPage() {
  return <AppShellRouter placeholderSiteSettings={placeholderSiteSettings} />;
}
