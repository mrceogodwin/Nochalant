import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nochalant Club — Welcome to the Club",
  description: "Your people. Your scene. Your rules.",
  applicationName: "Nochalant Club",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Nochalant" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
