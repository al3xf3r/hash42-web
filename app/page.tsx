// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

const APP_URL = "https://protocol.hash42.xyz";
const LABS_URL = "https://hash42.xyz/labs";
const DISCOVER_URL = "https://hash42.xyz/discover";

// API base (es: https://api.hash42.xyz). Deve essere impostato su Vercel env.
const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");

// ⚠️ Se il tuo backend usa un path diverso, cambia SOLO questo:
const STATUS_PATH = "/protocol/status";

type ProtocolStatus = {
  poolNano?: string | number;
  reserveNano?: string | number;
  allocatedUnclaimedNano?: string | number;
  availableNano?: string | number;
  totalPower?: string | number; // MH/s
  serverNow?: string; // ISO
};

export default function HomePage() {
  const year = useMemo(() => new Date().getFullYear(), []);

  // --- Mobile menu ---
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // --- Live protocol status (Active Pool preview) ---
  const [protocolStatus, setProtocolStatus] = useState<ProtocolStatus | null>(null);
  const [protocolLoading, setProtocolLoading] = useState(true);
  const [protocolErr, setProtocolErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!API_BASE) {
        setProtocolErr("NEXT_PUBLIC_API_BASE is missing");
        setProtocolLoading(false);
        return;
      }

      try {
        setProtocolErr(null);
        const r = await fetch(`${API_BASE}${STATUS_PATH}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!r.ok) throw new Error(`API ${r.status}`);

        const data = (await r.json()) as ProtocolStatus;
        if (!alive) return;

        setProtocolStatus(data);
        setProtocolLoading(false);
      } catch (e: any) {
        if (!alive) return;
        setProtocolErr(e?.message || "Failed to load");
        setProtocolLoading(false);
      }
    }

    load();
    const t = setInterval(load, 10000); // refresh every 10s
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const poolNano = Number(protocolStatus?.poolNano || "0");
  const reserveNano = Number(protocolStatus?.reserveNano || "0");
  const allocNano = Number(protocolStatus?.allocatedUnclaimedNano || "0");
  const availNano = Number(protocolStatus?.availableNano || "0");
  const totalNetworkPower = Number(protocolStatus?.totalPower || "0");

  // Soft cap visual scale for bar
  const networkPowerScaleMax = 30000;
  const networkPowerPercent = Math.min(
    100,
    totalNetworkPower > 0 ? (totalNetworkPower / networkPowerScaleMax) * 100 : 0
  );

  return (
    <main className="bg-black text-white antialiased min-h-screen overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(46,108,255,0.22),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(255,106,0,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px] opacity-40" />
        <div className="absolute inset-0 noise opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black to-black" />
      </div>

      {/* Subtle noise */}
      <style>{`
        .noise {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* Top bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/35 border-b border-white/5">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img
              src="/assets/icon-h42.webp"
              alt="H42 icon"
              className="h-9 w-9 rounded-xl border border-white/10 bg-black/40"
            />
            <div>
              <div className="font-extrabold tracking-tight text-lg leading-none">
                <span className="text-white">HASH</span>
                <span className="text-[#ff6a00]">42</span>
              </div>
              <div className="text-[11px] text-white/55 -mt-0.5">
                Labs • Protocol
              </div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/75">
            <a href="#protocol" className="hover:text-white">Protocol</a>
            <a href="#labs" className="hover:text-white">Labs</a>
            <a href="#tech" className="hover:text-white">Technology</a>
            <a href="#roadmap" className="hover:text-white">Roadmap</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="#contacts" className="hover:text-white">Contacts</a>
          </nav>

          <div className="flex items-center gap-2 relative">
            {/* Secondary CTAs (desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              <a
                href={LABS_URL}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm"
              >
                Labs
              </a>
              
            </div>

            {/* Primary CTA */}
            <a
              href={APP_URL}
              className="px-4 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold text-sm shadow-[0_0_40px_rgba(255,106,0,0.18)]"
            >
              Open App
            </a>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="opacity-90">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Mobile dropdown */}
            {menuOpen && (
              <div className="md:hidden absolute right-0 top-12 w-64 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-[0_0_40px_rgba(46,108,255,0.18)] overflow-hidden">
                <div className="p-2">
                  {[
                    ["Open App", APP_URL],
                    ["Labs (page)", LABS_URL],
                    
                    ["Protocol (section)", "#protocol"],
                    ["Labs (section)", "#labs"],
                    ["Technology", "#tech"],
                    ["Roadmap", "#roadmap"],
                    ["FAQ", "#faq"],
                    ["Contacts", "#contacts"],
                  ].map(([label, href]) => (
                    <a
                      key={`${label}-${href}`}
                      href={href}
                      onClick={closeMenu}
                      className="block px-3 py-2 rounded-xl text-sm text-white/80 hover:text-white hover:bg-white/10"
                    >
                      {label}
                    </a>
                  ))}
                  <div className="mt-2 px-3 pb-1 text-[11px] text-white/40">Menu</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 md:pt-16 md:pb-16">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-[#ff6a00]" />
                HASH42 ● The First Gamified Revenue Protocol
              </div>

              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight md:leading-[1.12] pb-1 tracking-tight">
                Earn real protocol revenue
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4f8fff] via-white to-[#ff8a2e]">
                  through Power.
                </span>
              </h1>

              <p className="mt-4 text-white/70 text-base md:text-lg leading-relaxed">
                Hash42 Protocol is a gamified revenue protocol engineered for sustainability, transparency, and scale.
                No emissions. No inflation. Only revenue. Built by Hash42 Labs.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={APP_URL}
                  className="px-5 py-3 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold shadow-[0_0_40px_rgba(255,106,0,0.18)] text-center"
                >
                  Open App
                </a>
                
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Model</div>
                  <div className="mt-1 font-bold">Revenue-first</div>
                  <div className="text-xs text-white/45 mt-1">No inflation</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Distribution</div>
                  <div className="mt-1 font-bold">Continuous</div>
                  <div className="text-xs text-white/45 mt-1">Programmatic</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Focus</div>
                  <div className="mt-1 font-bold">Scale</div>
                  <div className="text-xs text-white/45 mt-1">Anti-abuse</div>
                </div>
              </div>

              <div className="mt-6 text-xs text-white/45">
                Transparency-first: the homepage shows live pool data pulled from the same backend used by the app.
              </div>
            </div>

            {/* Right column: Active Pool preview */}
            <div className="relative">
              <div className="relative rounded-[32px] overflow-hidden">
                <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(46,108,255,0.25),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,106,0,0.18),transparent_50%)] blur-2xl" />

                <div className="relative rounded-[32px] border border-white/10 bg-black/40 overflow-hidden shadow-[0_0_40px_rgba(46,108,255,0.25)]">
                  <div className="p-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />
                      <span className="text-xs text-white/70">Hash42 App</span>
                    </div>
                    <span className="text-xs text-white/45">Live preview</span>
                  </div>

                  <div className="p-4">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white/55 text-xs">Hash42 Protocol</div>
                          <div className="mt-1 text-2xl font-extrabold tracking-tight">
                            {protocolLoading ? "..." : "Active Pool"}
                          </div>
                          <div className="text-white/40 text-xs mt-1">
                            Updated:{" "}
                            {protocolStatus?.serverNow ? fmtWhen(protocolStatus.serverNow) : "—"}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <NextDistributionCountdown serverNowISO={protocolStatus?.serverNow} />
                        </div>
                      </div>

                      {/* Network Power */}
                      <div className="mt-4 rounded-xl border border-[#06b6d4]/20 bg-[#06b6d4]/5 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-white/55 text-xs tracking-wide">
                            TOTAL NETWORK POWER
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-[10px] px-2 py-1 rounded-full bg-[#06b6d4]/20 text-[#ff6a00] font-bold">
                              LIVE
                            </div>
                            <div className="font-extrabold text-[#06b6d4]">
                              {protocolLoading ? "..." : totalNetworkPower}{" "}
                              <span className="text-white/60 font-bold">MH/s</span>
                            </div>
                          </div>
                        </div>

                        {/* Energy Flow Bar */}
                        <div className="mt-2">
                          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden relative border border-white/10">
                            <div className="absolute inset-0">
                              <div className="w-full h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-35 blur-[2px] animate-pulse" />
                            </div>

                            <div className="absolute inset-0 opacity-20">
                              <div className="w-1/3 h-full bg-white/30 blur-md animate-[shine_1.8s_linear_infinite]" />
                            </div>

                            <div
                              className="relative h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400"
                              style={{
                                width: `${Math.max(2, networkPowerPercent)}%`,
                                boxShadow: "0 0 18px rgba(249,115,22,0.45)",
                              }}
                            />
                          </div>

                          <style jsx>{`
                            @keyframes shine {
                              0% { transform: translateX(-40%); }
                              100% { transform: translateX(340%); }
                            }
                          `}</style>
                        </div>

                        <div className="text-[11px] text-white/45 mt-2">
                          Real-time aggregated hash power contributing to revenue distribution.
                        </div>
                      </div>

                      {/* Pool numbers */}
                      <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 text-sm space-y-2">
                        <Row label="Pool" value={`${fmtCredits8FromNano(poolNano)} HUSD`} strong />
                        <Row label="Reserve" value={`${fmtCredits8FromNano(reserveNano)} HUSD`} />
                        <Row label="Allocated" value={`${fmtCredits8FromNano(allocNano)} HUSD`} />
                        <Row
                          label="Available"
                          value={`${fmtCredits8FromNano(availNano)} HUSD`}
                          strong
                          accent
                        />

                        <div className="pt-2 mt-2 border-t border-white/10 flex justify-between">
                          <span className="text-white/55">Status</span>
                          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
                            <span className="h-2 w-2 rounded-full bg-[#2e6cff]" />
                            Online
                          </span>
                        </div>

                        {protocolErr && (
                          <div className="mt-2 text-[11px] text-red-300">
                            Live data error: {protocolErr}
                          </div>
                        )}
                      </div>

                      <a
                        href={APP_URL}
                        className="mt-4 mb-2 w-full inline-flex justify-center px-4 py-3 rounded-xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold"
                      >
                        Open App
                      </a>

                      <div className="mt-3 text-[11px] text-white/45">
                        App runs on{" "}
                        <span className="text-white/70 font-semibold">protocol.hash42.xyz</span>.{" "}
                        <span className="text-white/50">
                          hash42.xyz/protocol redirects to the same app.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-white/45">
                This page is the institutional entry point. The app UI and flows may evolve while the core remains revenue-first.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol core */}
      <section id="protocol" className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="text-sm text-white/60">Hash42 Protocol</div>
              <h2 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">
                The first Gamified Revenue Protocol
              </h2>
              <p className="mt-3 text-white/70 max-w-2xl leading-relaxed">
                A protocol should not rely on inflationary incentives. Hash42 is designed to distribute real protocol revenue,
                with mechanisms built to resist abuse and scale to high-volume usage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
             
              <a
                href={APP_URL}
                className="px-5 py-3 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold shadow-[0_0_40px_rgba(255,106,0,0.18)] text-center"
              >
                Open App
              </a>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              {
                k: "Revenue only",
                t: "No emissions. No inflation.",
                d: "Distribution is tied to protocol revenue, not token printing. Sustainability is a design constraint, not a promise.",
                badge: "Core rule",
              },
              {
                k: "Gamified UX",
                t: "Earn through Power.",
                d: "A gamified surface that drives retention while keeping the underlying economy measurable and controllable.",
                badge: "Experience",
              },
              {
                k: "Scale & safety",
                t: "Built to resist abuse.",
                d: "Anti-sybil and pacing mechanics tuned with real usage data. Protect the system before scaling distribution.",
                badge: "Defense",
              },
            ].map((c) => (
              <div key={c.k} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="text-xs text-white/60">{c.badge}</div>
                <div className="mt-2 text-xl font-bold">{c.t}</div>
                <div className="mt-2 text-sm text-white/70 leading-relaxed">{c.d}</div>
                <div className="mt-4 text-xs text-white/50">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2e6cff]" />
                    {c.k}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Labs */}
      <section id="labs" className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-sm text-white/60">Hash42 Labs</div>
            <h2 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">
              Web3 Infrastructure Studio
            </h2>
            <p className="mt-3 text-white/70 leading-relaxed">
              We build gamified revenue protocols designed for sustainability, transparency, and scale.
              From economic design to smart contracts, frontends, and production infrastructure.
            </p>

            <div className="mt-6 space-y-3">
              {[
                ["Protocol design", "Tokenless-first thinking, revenue flows, and measurable incentives."],
                ["Smart contracts", "Security-driven patterns, modular upgrades, verifiable accounting."],
                ["Product & UX", "High-end interfaces built for retention without sacrificing clarity."],
                ["Infrastructure", "Indexing, automation, analytics, and monitoring for production scale."],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3">
                  <div className="mt-1 h-6 w-6 rounded-lg bg-[#2e6cff]/20 border border-white/10" />
                  <div>
                    <div className="font-semibold">{title}</div>
                    <div className="text-sm text-white/70">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href={LABS_URL}
                className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-center"
              >
                Explore Labs
              </a>
              <a
                href="#contacts"
                className="px-5 py-3 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold shadow-[0_0_40px_rgba(255,106,0,0.18)] text-center"
              >
                Contact for partnerships
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-[32px] overflow-hidden">
              <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(46,108,255,0.25),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,106,0,0.18),transparent_50%)] blur-2xl" />
              <div className="relative rounded-[32px] border border-white/10 bg-black/40 overflow-hidden shadow-[0_0_40px_rgba(46,108,255,0.25)]">
                <div className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="/assets/logo-hash42-labs.webp"
                        alt="Hash42 Labs"
                        className="h-8 w-auto opacity-90"
                      />
                      <div>
                        <div className="text-sm font-semibold">Infrastructure Studio</div>
                        <div className="text-xs text-white/55">Build • Ship • Scale</div>
                      </div>
                    </div>
                    <div className="text-xs text-white/50">Hash42 Labs</div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      ["Sustainability", "Revenue-first economics"],
                      ["Transparency", "Auditable flows"],
                      ["Scale", "Designed for volume"],
                      ["Security", "Safety baseline"],
                    ].map(([t, d]) => (
                      <div key={t} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <div className="text-xs text-white/60">{t}</div>
                        <div className="mt-1 text-sm font-semibold">{d}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold">Built by @Hash42Labs</div>
                    <div className="mt-1 text-sm text-white/70 leading-relaxed">
                      We ship production-grade protocol products with a serious fintech infrastructure aesthetic.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-xs text-white/45">
              Studio output: protocol primitives, revenue accounting, anti-abuse mechanics, and premium UX.
            </div>
          </div>
        </div>
      </section>

      {/* Technology */}
      <section id="tech" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">Technology principles</h3>
              <p className="mt-2 text-white/70 leading-relaxed">
                The protocol is engineered as infrastructure: measurable economics, auditable accounting, and
                product mechanics that can scale without breaking distribution.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  {
                    title: "Revenue accounting first",
                    desc: "Revenue sources and distribution logic are explicit and measurable, not implied.",
                    color: "bg-[#2e6cff]/20",
                  },
                  {
                    title: "Pacing + anti-abuse",
                    desc: "Mechanics are designed to resist farms, bots, and Sybil patterns before scaling rewards.",
                    color: "bg-[#ff6a00]/20",
                  },
                  {
                    title: "Transparency by default",
                    desc: "Clear states, clear flows, and verifiable data paths where possible.",
                    color: "bg-white/10",
                  },
                ].map((x) => (
                  <div key={x.title} className="flex gap-3">
                    <div className={`mt-1 h-6 w-6 rounded-lg ${x.color} border border-white/10`} />
                    <div>
                      <div className="font-semibold">{x.title}</div>
                      <div className="text-sm text-white/70">{x.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5 md:p-6">
              <div className="text-sm text-white/60">What users feel</div>

              <div className="mt-4 space-y-3">
                {[
                  ["Simple loop", "Users understand what happens next and why."],
                  ["Real momentum", "Activity feels alive without promising fixed returns."],
                  ["Institutional tone", "Premium UI, serious infrastructure vibe."],
                  ["Upgrade paths", "Progression exists, but the economy stays controlled."],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="font-semibold">{t}</div>
                    <div className="mt-1 text-sm text-white/70">{d}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-xs text-white/45">
                This is a presentation layer: terms and implementation details are refined as the protocol evolves.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Roadmap</h2>
        <p className="mt-2 text-white/70 max-w-2xl">
          Ship fast. Validate with users. Scale only after the core economics is proven.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            {
              phase: "Phase 0",
              title: "Core loop + distribution",
              items: ["Protocol entry point", "Gamified UX foundations", "Data instrumentation", "Anti-abuse baseline"],
            },
            {
              phase: "Phase 1",
              title: "Revenue modules",
              items: ["Revenue routing", "Continuous distribution", "Pacing refinements", "Transparency upgrades"],
            },
            {
              phase: "Phase 2",
              title: "Scale + integrations",
              items: ["Partnership rails", "Analytics and monitoring", "New surfaces", "Hardening + audits"],
            },
          ].map((p) => (
            <div key={p.phase} className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-xs text-white/60">{p.phase}</div>
              <div className="mt-1 text-xl font-bold">{p.title}</div>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {p.items.map((it) => (
                  <li key={it}>• {it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-r from-[#2e6cff]/20 via-white/5 to-[#ff6a00]/15 p-10 md:p-14 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Enter Hash42</h2>
          <p className="mt-3 text-white/70 leading-relaxed max-w-2xl mx-auto">
            Hash42 Protocol is the product. Hash42 Labs is the studio behind it. One brand, two surfaces, one core:
            revenue-first design.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <a
              href={APP_URL}
              className="px-7 py-4 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold text-lg shadow-[0_0_40px_rgba(255,106,0,0.18)]"
            >
              Open App
            </a>
            <a
              href={LABS_URL}
              className="px-7 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-lg"
            >
              Explore Labs
            </a>
            
          </div>

          <div className="mt-4 text-xs text-white/45">
            No promises of fixed returns. This site presents the vision and direction of the project.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">FAQ</h2>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          {[
            {
              q: "Where is the app?",
              a: "The app runs at protocol.hash42.xyz. The /protocol path on hash42.xyz redirects to the same app.",
            },
            {
              q: "Is the pool data real?",
              a: "Yes. The homepage pulls live numbers from the same API used by the app, for transparency.",
            },
            {
              q: "Does Hash42 rely on token emissions?",
              a: "No. The core positioning is revenue-first: no emissions and no inflation as a mechanism for distribution.",
            },
            {
              q: "What is the relationship between Labs and Protocol?",
              a: "Hash42 Labs is the Web3 infrastructure studio. Hash42 Protocol is the flagship product built and maintained by the studio.",
            },
          ].map((f) => (
            <div key={f.q} className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="font-semibold">{f.q}</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Stay in touch</h2>
              <p className="mt-2 text-white/70 max-w-2xl">Contact us for partnerships, feedback, and collaboration.</p>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <a
              href="mailto:hash42labs@gmail.com"
              className="rounded-2xl border border-white/10 bg-black/30 p-5 hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <IconMail />
                <div>
                  <div className="text-sm text-white/60">Email</div>
                  <div className="font-semibold">hash42labs@gmail.com</div>
                </div>
              </div>
            </a>

            <a
              href="https://x.com/hash42labs"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-black/30 p-5 hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <IconX />
                <div>
                  <div className="text-sm text-white/60">X</div>
                  <div className="font-semibold">x.com/hash42labs</div>
                </div>
              </div>
            </a>

            <a
              href="https://t.me/hash42labs"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-white/10 bg-black/30 p-5 hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <IconTelegram />
                <div>
                  <div className="text-sm text-white/60">Telegram</div>
                  <div className="font-semibold">t.me/hash42labs</div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo-hash42-labs.webp"
                alt="Hash42 Labs"
                className="h-9 w-auto opacity-90"
              />
              <div className="text-sm text-white/60">© {year} Hash42. All rights reserved.</div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <a href={LABS_URL} className="hover:text-white">Labs</a>
              
              <a href={APP_URL} className="hover:text-white">Open App</a>
              <a href="#contacts" className="hover:text-white">Contacts</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ---------- Small UI helpers ---------- */

function Row({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-white/55">{label}</span>
      <span
        className={[
          strong ? "font-extrabold" : "font-bold",
          accent ? "text-[#ffb26b]" : "text-white",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function fmtCredits8FromNano(nano: number) {
  // nano = 1e-8
  const v = nano / 1e8;
  return v.toLocaleString(undefined, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

function fmtWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function NextDistributionCountdown({ serverNowISO }: { serverNowISO?: string }) {
  const [text, setText] = useState<string>("—");

  // Anchor: quando arriva serverNowISO, salviamo:
  // - serverMs: il timestamp del server
  // - clientMs: il timestamp locale nel momento in cui l’abbiamo salvato
  const anchorRef = useMemo(
    () => ({ serverMs: 0, clientMs: 0 }),
    []
  );

  useEffect(() => {
    // aggiorna anchor quando cambia serverNowISO
    const serverDate = serverNowISO ? new Date(serverNowISO) : null;
    const serverMs =
      serverDate && !Number.isNaN(serverDate.getTime()) ? serverDate.getTime() : 0;

    if (serverMs > 0) {
      anchorRef.serverMs = serverMs;
      anchorRef.clientMs = Date.now();
    } else {
      // fallback: usa tempo locale come riferimento
      anchorRef.serverMs = Date.now();
      anchorRef.clientMs = Date.now();
    }
  }, [serverNowISO, anchorRef]);

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - anchorRef.clientMs;
      const nowMs = anchorRef.serverMs + Math.max(0, elapsed);
      const now = new Date(nowMs);

      // Next distribution daily at 17:00 local time
      const next = new Date(now);
      next.setHours(17, 0, 0, 0);
      if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);

      const diff = Math.max(0, next.getTime() - now.getTime());
      const s = Math.floor(diff / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, "0");
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const ss = String(s % 60).padStart(2, "0");

      setText(`${hh}:${mm}:${ss}`);
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [anchorRef]);

  return (
    <div className="text-right">
      <div className="text-white/55 text-xs">Next distribution</div>
      <div className="mt-1 text-[#06b6d4] font-extrabold tabular-nums">{text}</div>
      <div className="text-white/40 text-[11px] mt-0.5">Daily at 17:00 UTC+1</div>
    </div>
  );
}

/* --- Icons (inline SVG, zero deps) --- */
function IconMail() {
  return (
    <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.9"
        />
        <path
          d="M5.5 7.5 12 12l6.5-4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

function IconX() {
  return (
    <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 5h4.2l2.9 4.2L18 5h2l-5 6.7L20 19h-4.2l-3.1-4.5L8.7 19H6.6l5.3-7L7 5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

function IconTelegram() {
  return (
    <div className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 5 3.8 12.2c-.8.3-.8 1.5.1 1.7l4.6 1.3 1.7 5.2c.3.9 1.5 1 2 .2l2.6-4.1 4.7 3.4c.8.6 2 .1 2.2-.9L23 6.7c.2-1.2-.8-2-2-1.7Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <path
          d="M9 14.5 20 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}