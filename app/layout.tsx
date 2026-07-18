import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://choisw2718.github.io/Game_Chessle/";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Chessle — Opening Word Game",
  description: "Guess a named chess opening in 10 ply.",
  applicationName: "Chessle",
  openGraph: {
    title: "Chessle",
    description: "Guess the exact opening line.",
    type: "website",
    url: siteUrl,
    images: [{ url: "og.png", width: 1734, height: 907, alt: "Chessle — 10 ply, 6 attempts" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chessle",
    description: "Guess the exact opening line.",
    images: ["og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
