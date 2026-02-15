// app/labs/page.tsx
"use client";

import { useMemo, useState } from "react";

export default function LabsPage() {
  const year = useMemo(() => new Date().getFullYear(), []);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

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

      {/* Header */}
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
              <div className="text-[11px] text-white/55 -mt-0.5">Labs</div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/75">
            <a href="#what" className="hover:text-white">
              What we build
            </a>
            <a href="#capabilities" className="hover:text-white">
              Capabilities
            </a>
            <a href="#principles" className="hover:text-white">
              Principles
            </a>
            <a href="#contacts" className="hover:text-white">
              Contacts
            </a>
          </nav>

          {/* Switch + CTA */}
          <div className="flex items-center gap-2 relative">
            <div className="hidden sm:flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
              <a
                href="https://hash42.xyz"
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-white/10"
              >
                Home
              </a>
              
            </div>

            <a
              href="/protocol"
              className="px-4 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold text-sm shadow-[0_0_40px_rgba(255,106,0,0.18)]"
            >
              Open Protocol
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
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Mobile dropdown */}
            {menuOpen && (
              <div className="md:hidden absolute right-0 top-12 w-64 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-[0_0_40px_rgba(46,108,255,0.18)] overflow-hidden">
                <div className="p-2">
                  {[
                    ["Home", "https://hash42.xyz"],
                    ["Protocol", "/protocol"],
                    ["What we build", "#what"],
                    ["Capabilities", "#capabilities"],
                    ["Principles", "#principles"],
                    ["Contacts", "#contacts"],
                  ].map(([label, href]) => (
                    <a
                      key={href}
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
                <span className="h-2 w-2 rounded-full bg-[#2e6cff]" />
                Web3 Infrastructure Studio
              </div>

              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight md:leading-[1.12] pb-1 tracking-tight">
                We build protocols
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4f8fff] via-white to-[#ff8a2e]">
                  designed to scale.
                </span>
              </h1>

              <p className="mt-4 text-white/70 text-base md:text-lg leading-relaxed">
                Hash42 Labs is a Web3 infrastructure studio. We design revenue-first primitives and ship premium products
                where sustainability, transparency, and performance are non-negotiable.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href="#contacts"
                  className="px-5 py-3 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold shadow-[0_0_40px_rgba(255,106,0,0.18)] text-center"
                >
                  Work with us
                </a>
                <a
                  href="/protocol"
                  className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-center"
                >
                  See Hash42 Protocol
                </a>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Focus</div>
                  <div className="mt-1 font-bold">Infrastructure</div>
                  <div className="text-xs text-white/45 mt-1">Not hype</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Output</div>
                  <div className="mt-1 font-bold">Protocols</div>
                  <div className="text-xs text-white/45 mt-1">Products</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Standard</div>
                  <div className="mt-1 font-bold">Serious</div>
                  <div className="text-xs text-white/45 mt-1">Fintech grade</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-[32px] overflow-hidden">
                <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(46,108,255,0.25),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,106,0,0.18),transparent_50%)] blur-2xl" />
                <div className="relative rounded-[32px] border border-white/10 bg-black/40 overflow-hidden shadow-[0_0_40px_rgba(46,108,255,0.25)]">
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src="/assets/logo-hash42-labs.webp"
                          alt="Hash42 Labs"
                          className="h-8 w-auto opacity-90"
                        />
                        <div>
                          <div className="text-sm font-semibold">Hash42 Labs</div>
                          <div className="text-xs text-white/55">Web3 Infrastructure Studio</div>
                        </div>
                      </div>
                      <div className="text-xs text-white/50">Studio</div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[
                        ["Protocol design", "Economics + incentives"],
                        ["Smart contracts", "Security first"],
                        ["Product & UX", "Premium surfaces"],
                        ["Infra & data", "Indexing + ops"],
                      ].map(([t, d]) => (
                        <div key={t} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="text-xs text-white/60">{t}</div>
                          <div className="mt-1 text-sm font-semibold">{d}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold">Flagship product</div>
                      <div className="mt-1 text-sm text-white/70 leading-relaxed">
                        Hash42 Protocol — the first gamified revenue protocol.
                      </div>
                      <a
                        href="/protocol"
                        className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold text-sm w-full"
                      >
                        Open Protocol
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-white/45">
                Studio building blocks: economic design, revenue accounting, anti-abuse mechanics, and production ops.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we build */}
      <section id="what" className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Revenue primitives",
                desc: "We design and implement revenue routing + distribution logic that remains measurable under scale.",
              },
              {
                title: "Gamified protocol surfaces",
                desc: "Serious infrastructure with user experiences that drive retention, without relying on inflation.",
              },
              {
                title: "Production-ready systems",
                desc: "Indexing, automation, analytics, monitoring, and ops: the boring parts done properly.",
              },
            ].map((x) => (
              <div key={x.title}>
                <div className="text-sm text-white/60">Focus</div>
                <div className="mt-1 text-xl font-bold">{x.title}</div>
                <div className="mt-2 text-white/70 text-sm leading-relaxed">{x.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section id="capabilities" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Capabilities</h2>
        <p className="mt-2 text-white/70 max-w-2xl">
          End-to-end: from protocol design to engineering and product.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            {
              k: "Design",
              t: "Economics & incentives",
              d: "Revenue-first models, pacing, anti-abuse, and measurable distribution.",
            },
            {
              k: "Engineering",
              t: "Smart contracts & infra",
              d: "Contracts, indexing, automation, analytics, monitoring, and integrations.",
            },
            {
              k: "Product",
              t: "Premium UX",
              d: "Institutional design language with clean, high-performance UIs.",
            },
          ].map((c) => (
            <div key={c.k} className="rounded-2xl border border-white/10 bg-black/30 p-6">
              <div className="text-xs text-white/60">{c.k}</div>
              <div className="mt-1 text-xl font-bold">{c.t}</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Principles */}
      <section id="principles" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 md:p-8">
          <h3 className="text-2xl font-extrabold tracking-tight">Principles</h3>
          <p className="mt-2 text-white/70 leading-relaxed max-w-2xl">
            We aim for systems that survive reality: abuse, scale, and long timelines.
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {[
              ["Sustainability first", "If it can be farmed, it will be farmed. Design accordingly."],
              ["Transparency by default", "Clear state, clear flows, and verifiable paths where possible."],
              ["Scale is a requirement", "Architecture and economics must work under volume."],
              ["Serious product quality", "Institutional tone, premium UI, strong performance."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="font-semibold">{t}</div>
                <div className="mt-2 text-sm text-white/70 leading-relaxed">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Stay in touch</h2>
              <p className="mt-2 text-white/70 max-w-2xl">
                Partnerships, collaboration, and infrastructure work.
              </p>
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
              <img src="/assets/logo-hash42-labs.webp" alt="Hash42 Labs" className="h-9 w-auto opacity-90" />
              <div className="text-sm text-white/60">© {year} Hash42 Labs. All rights reserved.</div>
            </div>

            <div className="flex items-center gap-4 text-sm text-white/60">
              <a href="/" className="hover:text-white">
                Home
              </a>
              <a href="/protocol" className="hover:text-white">
                Protocol
              </a>
              <a href="#contacts" className="hover:text-white">
                Contacts
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
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