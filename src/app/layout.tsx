import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import "@rrweb/replay/dist/style.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Online Information Search Survey",
  description:
    "Academic research instrument on product involvement and online information search behaviour.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceee8" },
    { media: "(prefers-color-scheme: dark)", color: "#131313" },
  ],
};

/**
 * The theme override lives in a cookie and is stamped onto `<html>` during
 * SSR. That avoids the usual blocking inline script, the flash of the wrong
 * theme, and any hydration mismatch. With no cookie set, the stylesheet's
 * `prefers-color-scheme` rules follow the operating system.
 */
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const stored = (await cookies()).get("survey-theme")?.value;
  const theme = stored === "light" || stored === "dark" ? stored : undefined;

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${archivo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-surface text-content">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
