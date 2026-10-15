import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
export const metadata: Metadata = {
  title: "StudyVance AI Explorers — Level 1",
  description: "A friendly AI adventure for South African Grade 4–6 explorers.",
  icons: { icon: "/assets/mascot/vance-robot.png" },
};
export const viewport: Viewport = { themeColor: "#0b1f3a", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-cream text-navy`}>{children}</body>
    </html>
  );
}
