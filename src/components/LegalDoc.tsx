import Link from "next/link";

const LINKS = [
  ["/privacy", "Privacy Policy"],
  ["/terms", "Terms of Use"],
  ["/data-deletion", "Data deletion"],
] as const;

export function LegalDoc({
  title,
  updated,
  lede,
  children,
}: {
  title: string;
  updated: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 p-5" aria-label="Site">
        <Link href="/" className="text-xl font-black">Sales<span className="neon">Crew</span></Link>
        <Link href="/app/inbox" className="btn-ghost">Open live demo</Link>
      </nav>
      <article className="mx-auto max-w-3xl px-5 pb-16">
        <p className="mb-3 text-xs tracking-widest text-emerald-300/80">SALESCREW · RISE &amp; EAT, PORT HARCOURT</p>
        <h1 className="text-4xl font-black leading-tight">{title}</h1>
        <p className="mt-3 text-sm text-slate-400">Last updated {updated}</p>
        <p className="mt-4 text-lg text-slate-300">{lede}</p>
        <div className="glass mt-8 space-y-6 p-6 text-[15px] leading-relaxed text-slate-300 [&_a]:text-[#39ff88] [&_a]:underline [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#39ff88] [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
        <nav className="mt-6 flex flex-wrap gap-3" aria-label="Policies">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="btn-ghost">{label}</Link>
          ))}
        </nav>
      </article>
    </main>
  );
}
