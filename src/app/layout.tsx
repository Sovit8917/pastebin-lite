import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pastebin Lite",
  description: "Share text with a link. Optionally expire it by time or view count.",
  robots: { index: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

function Logo() {
  return (
    <span
      aria-hidden
      className="grid h-7 w-7 place-items-center rounded-[8px] bg-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(36,87,230,0.35)]"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3.5H4.5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1H6" />
        <path d="M10 3.5h1.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H10" />
        <path d="M6.5 8h3" />
      </svg>
    </span>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        <header className="sticky top-0 z-20 border-b border-line bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <a href="/" className="group flex items-center gap-2.5 rounded-md">
              <Logo />
              <span className="text-[15px] font-semibold tracking-tight">
                Pastebin<span className="font-normal text-subtle"> Lite</span>
              </span>
            </a>
            <a href="/" className="btn btn-primary btn-sm">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M6 2v8M2 6h8" />
              </svg>
              New paste
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">{children}</main>
      </body>
    </html>
  );
}
