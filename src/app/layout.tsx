import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { ServiceWorkerRegister } from "@/shared/ui/service-worker-register";
import { CookieConsentBanner } from "@/shared/ui/cookie-consent-banner";
import { PushNotificationRegister } from "@/shared/ui/push-notification-register";
import { MobileAppTabBar } from "@/widgets/mobile-app-tab-bar/ui/mobile-app-tab-bar";

const siteTitle = "Wayora — Explore Japan";
const siteDescription =
  "Discover the best places to visit in Kyoto, Osaka, Nara, and beyond. Build smart multi-day routes, save favorites, and explore Japan through photography, first-visit, and seasonal modes.";

export const metadata: Metadata = {
  metadataBase: new URL("https://wayora.ru"),
  title: siteTitle,
  description: siteDescription,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wayora"
  },
  icons: {
    icon: "/icon.png",
    apple: "/icons/apple-touch-icon.png"
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: "Wayora",
    images: [{ url: "/logo.png", width: 1254, height: 1254, alt: "Wayora" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/logo.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#287f72",
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
        <CookieConsentBanner />
        <PushNotificationRegister />
        <MobileAppTabBar />
      </body>
    </html>
  );
}
