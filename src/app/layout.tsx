import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SponsorScope",
  description: "Sponsor market research dashboard for gaming creators.",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <Link href="/" className="text-xl font-semibold tracking-tight">
                SponsorScope
              </Link>
              <nav className="flex gap-2 text-sm text-muted-foreground">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-md px-3 py-2 hover:bg-secondary hover:text-foreground">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
