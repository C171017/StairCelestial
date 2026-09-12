import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "⊙",
  description: "Interactive 3D portfolio along an endless celestial spiral staircase.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "32x32" },
      { url: "/favicon-light.png", type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png", type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg?v=2", type: "image/svg+xml", sizes: "any" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
