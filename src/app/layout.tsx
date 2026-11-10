import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Wave } from "@/components/brand";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Nochalant",
  description: "Your people. Your scene. Your rules.",
  applicationName: "Nochalant",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.className} bg-black text-white antialiased`}>
        <div className="screen">{children}</div>
        <Wave />
      </body>
    </html>
  );
}
