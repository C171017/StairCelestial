import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C171017",
  description: "Interactive 3D portfolio along an endless celestial spiral staircase.",
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
