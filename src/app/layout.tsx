import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { ServiceWorkerRegister } from "@/shared/ui/service-worker-register";
import { CookieConsentBanner } from "@/shared/ui/cookie-consent-banner";
import { PushNotificationRegister } from "@/shared/ui/push-notification-register";
import { DeviceTokenRegister } from "@/shared/ui/device-token-register";
import { NativeAppClass } from "@/shared/ui/native-app-class";
import { OfflineToast } from "@/shared/ui/offline-toast";
import { NavigationTransitionOverlay } from "@/shared/ui/navigation-transition-overlay";
import { DeepLinkHandler } from "@/shared/ui/deep-link-handler";
import { MobileAppTabBar } from "@/widgets/mobile-app-tab-bar/ui/mobile-app-tab-bar";
import { ThemeApplier } from "@/shared/ui/theme-applier";
import { ThemeBootstrapScript } from "@/shared/ui/theme-bootstrap-script";
import { LanguageApplier } from "@/shared/ui/language-applier";

const manrope = Manrope({
  subsets: ["cyrillic", "latin"],
  variable: "--font-manrope",
  display: "swap"
});

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
    images: [{ url: "/og-image.jpg", width: 512, height: 512, alt: "Wayora" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.jpg"]
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
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <head>
        <ThemeBootstrapScript />
      </head>
      <body>
        {children}
        <ThemeApplier />
        <LanguageApplier />
        <ServiceWorkerRegister />
        <CookieConsentBanner />
        <PushNotificationRegister />
        <DeviceTokenRegister />
        <NativeAppClass />
        <OfflineToast />
        <NavigationTransitionOverlay />
        <DeepLinkHandler />
        <MobileAppTabBar />
      </body>
    </html>
  );
}
