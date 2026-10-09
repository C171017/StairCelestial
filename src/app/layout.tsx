import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(hover: none) and (pointer: coarse)", color: "#dceaf0" }],
};

export const metadata: Metadata = {
  title: "⊙",
  description: "A world of curiosities. Projects and experiments along an infinite glass ribbon above the clouds.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "32x32" },
      { url: "/favicon-light.png?v=3", type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark.png?v=3", type: "image/png", sizes: "32x32", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg?v=3", type: "image/svg+xml", sizes: "any" },
    ],
    apple: { url: "/apple-touch-icon.png?v=3", sizes: "180x180" },
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
