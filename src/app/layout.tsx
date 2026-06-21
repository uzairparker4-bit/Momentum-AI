import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Momentum AI — The Navigator",
  description: "Your way back to what you started.",
  openGraph: {
    title: "Momentum AI — The Navigator",
    description: "Your way back to what you started.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: "#0d0d0d", color: "#e8e8e8" }}>
        {children}
      </body>
    </html>
  );
}
