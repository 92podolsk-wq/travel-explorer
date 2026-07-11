import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import { ServiceWorkerRegister } from "@/shared/ui/service-worker-register";

export const metadata: Metadata = {
  title: "Travel Explorer",
  description: "Smart map for planning photography-first travel in Kyoto.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Travel Explorer"
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#287f72"
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
      </body>
    </html>
  );
}
