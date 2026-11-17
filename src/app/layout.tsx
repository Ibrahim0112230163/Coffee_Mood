import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "opsz"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Coffie Mood · Your Mood. Your Coffee. Your Moment.", template: "%s · Coffie Mood" },
  description:
    "Coffie Mood reads your visible expression privately in your browser and recommends a coffee to match your moment.",
  applicationName: "Coffie Mood",
};

export const viewport: Viewport = {
  themeColor: "#f8f1e7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
