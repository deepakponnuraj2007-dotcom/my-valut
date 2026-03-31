import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creator Content Vault",
  description:
    "Your personal vault for storing and managing YouTube & Instagram video metadata.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-vault-dark text-vault-text antialiased bg-noise">
        {/* Ambient glow effect behind the page */}
        <div className="fixed inset-0 bg-glow-gradient pointer-events-none z-0" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
