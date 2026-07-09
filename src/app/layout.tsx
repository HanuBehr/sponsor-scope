import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SponsorScope",
  description: "Sponsor market research dashboard for gaming creators.",
};

const navItems = [
  { href: "/campaigns", label: "Campaigns" },
  { href: "/campaigns/new", label: "New Campaign" },
  { href: "/settings", label: "Settings" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_34rem),hsl(var(--background))] text-foreground">
          <div className="grid min-h-screen md:grid-cols-[210px_1fr]">
            <aside className="hidden border-r border-border/70 bg-card/70 md:block">
              <div className="px-5 py-5">
                <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
                  SponsorScope
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">Sponsor lead research for your Twitch channel</p>
              </div>
              <nav className="grid gap-1 px-3 text-sm text-muted-foreground">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded px-3 py-2 hover:bg-muted hover:text-foreground">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
            <div className="min-w-0">
              <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 md:h-14 md:flex-row md:items-center md:justify-between md:px-6 md:py-0">
                  <div>
                    <Link href="/" className="text-sm font-semibold tracking-tight text-foreground md:hidden">
                      SponsorScope
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground md:hidden">Sponsor lead research for your Twitch channel</p>
                  </div>
                  <div className="hidden text-sm text-muted-foreground md:block">Sponsor research workspace</div>
                  <nav className="flex max-w-full gap-1 overflow-x-auto pb-1 text-xs text-muted-foreground md:hidden">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} className="shrink-0 rounded px-2 py-1 hover:bg-muted hover:text-foreground">
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </header>
              <main className="mx-auto min-w-0 max-w-7xl px-4 py-6 md:px-6">{children}</main>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
