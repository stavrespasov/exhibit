import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "EXHIBIT — Proof beats promises.", template: "%s · EXHIBIT" },
  description: "Turn your public GitHub repository into a job-specific portfolio of inspectable technical evidence. Every supported claim has a source.",
  openGraph: { title: "EXHIBIT — Proof beats promises.", description: "Your code, organized into evidence a reviewer can actually inspect.", type: "website" },
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-scroll-behavior="smooth"><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
