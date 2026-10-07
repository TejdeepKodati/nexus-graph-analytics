import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusGraph — Enterprise Knowledge Graph & Fraud Analytics",
  description: "High-performance enterprise knowledge graph, fraud ring detection, and systemic risk analytics platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
