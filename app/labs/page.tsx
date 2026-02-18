// app/labs/page.tsx
"use client";

import { useMemo, useState } from "react";

const APP_URL = "https://protocol.hash42.xyz";
const HOME_URL = "https://hash42.xyz";
const PROTOCOL_PATH = "/protocol"; // (redirect to protocol.hash42.xyz)

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
              <div className="text-[11px] text-white/55 -mt-0.5">
                Labs • Development Team
              </div>
            </div>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/75">
            <a href="#services" className="hover:text-white">
              Services
            </a>
            <a href="#process" className="hover:text-white">
              Process
            </a>
            <a href="#stack" className="hover:text-white">
              Stack
            </a>
            <a href="#work" className="hover:text-white">
              Proof
            </a>
            <a href="#contacts" className="hover:text-white">
              Contacts
            </a>
          </nav>

          {/* Switch + CTA */}
          <div className="flex items-center gap-2 relative">
            {/* switch pills (desktop) */}
            <div className="hidden sm:flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
              <a
                href="/"
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-white/10"
              >
                Labs
              </a>
              <a
                href={PROTOCOL_PATH}
                className="px-3 py-2 rounded-xl text-sm font-semibold text-white/70 hover:text-white"
              >
                Protocol
              </a>
            </div>

            {/* Primary CTA */}
            <a
              href="#contacts"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm"
            >
              Request a build
            </a>

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
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-90"
              >
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
                    ["Home", "/"],
                    ["Protocol (redirect)", PROTOCOL_PATH],
                    ["Open App", APP_URL],
                    ["Services", "#services"],
                    ["Process", "#process"],
                    ["Stack", "#stack"],
                    ["Proof", "#work"],
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
                  <div className="mt-2 px-3 pb-1 text-[11px] text-white/40">
                    Menu
                  </div>
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
                Hash42 Labs • Product Engineering for Web3 & AI
              </div>

              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight md:leading-[1.12] pb-1 tracking-tight">
                A development team that ships
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4f8fff] via-white to-[#ff8a2e]">
                  production-grade digital products.
                </span>
              </h1>

              <p className="mt-4 text-white/70 text-base md:text-lg leading-relaxed">
                We build on request: AI agents, NFT platforms, Solidity smart contracts,
                token launches, dashboards, and full-stack Web3 applications. Clean code, serious UX,
                and infrastructure-ready delivery.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href="#contacts"
                  className="px-5 py-3 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold shadow-[0_0_40px_rgba(255,106,0,0.18)] text-center"
                >
                  Start a project
                </a>
                <a
                  href="#services"
                  className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-center"
                >
                  View services
                </a>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  ["Team", "Builders", "Engineering-first"],
                  ["Delivery", "Fast", "Weekly iterations"],
                  ["Quality", "Serious", "Fintech grade"],
                ].map(([k, v, s]) => (
                  <div
                    key={k}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="text-xs text-white/60">{k}</div>
                    <div className="mt-1 font-bold">{v}</div>
                    <div className="text-xs text-white/45 mt-1">{s}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-xs text-white/45">
                Flagship product built in-house:{" "}
                <a className="text-white/70 font-semibold hover:text-white" href={PROTOCOL_PATH}>
                  Hash42 Protocol
                </a>{" "}
                (app on{" "}
                <span className="text-white/70 font-semibold">protocol.hash42.xyz</span>).
              </div>
            </div>

            {/* Right panel */}
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
                          <div className="text-sm font-semibold">
                            Hash42 Labs
                          </div>
                          <div className="text-xs text-white/55">
                            Engineering • Web3 • AI
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-white/50">Team</div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      {[
                        ["AI Agents", "Workflows + tooling"],
                        ["Solidity", "EVM contracts"],
                        ["NFT Platforms", "Mint + marketplace"],
                        ["Tokens", "Launch + integrations"],
                        ["Dashboards", "Onchain analytics"],
                        ["Full-stack", "Next.js + APIs"],
                      ].map(([t, d]) => (
                        <div
                          key={t}
                          className="rounded-2xl border border-white/10 bg-black/30 p-4"
                        >
                          <div className="text-xs text-white/60">{t}</div>
                          <div className="mt-1 text-sm font-semibold">{d}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold">
                        Engagement model
                      </div>
                      <div className="mt-1 text-sm text-white/70 leading-relaxed">
                        Build scoped MVPs, then iterate in weekly cycles until production-ready.
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <div className="text-xs text-white/60">Start</div>
                          <div className="font-bold mt-1">Scope call</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                          <div className="text-xs text-white/60">Delivery</div>
                          <div className="font-bold mt-1">GitHub + Vercel</div>
                        </div>
                      </div>

                      <a
                        href="#contacts"
                        className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold text-sm w-full"
                      >
                        Request a build
                      </a>

                      <div className="mt-3 text-[11px] text-white/45">
                        Prefer clear specs. If you have only the vision, we’ll structure the scope.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-white/45">
                We build like a real team: specs → repo → iterations → tests → deploy.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="text-sm text-white/60">Services</div>
              <h2 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">
                We build on request
              </h2>
              <p className="mt-3 text-white/70 max-w-2xl leading-relaxed">
                From single smart contracts to full platforms. We can join as a delivery team or
                plug into your existing pipeline.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#process"
                className="px-5 py-3 rounded-2xl border border-white/10 bg-black/30 hover:bg-white/5 text-white font-semibold text-center"
              >
                How we work
              </a>
              <a
                href="#contacts"
                className="px-5 py-3 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold shadow-[0_0_40px_rgba(255,106,0,0.18)] text-center"
              >
                Get a quote
              </a>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              {
                tag: "AI",
                title: "AI Agents & Automation",
                desc: "Agents, bots, and workflow automation connected to APIs, socials, and onchain events.",
                bullets: ["Telegram/X bots", "Task automation", "LLM tooling + guardrails"],
              },
              {
                tag: "WEB3",
                title: "NFT Platforms & Marketplaces",
                desc: "Minting sites, random mints, allowlists, marketplaces, royalties, and dashboards.",
                bullets: ["Mint flows", "Internal marketplaces", "Indexing + metadata"],
              },
              {
                tag: "EVM",
                title: "Solidity Smart Contracts",
                desc: "Tokens, staking, vesting, revenue distribution, and protocol primitives.",
                bullets: ["ERC20/ERC721", "Staking + rewards", "Upgradeable patterns"],
              },
              {
                tag: "TOKEN",
                title: "Token Creation & Launch",
                desc: "Token deployment, supply strategy, integrations, and operational tooling.",
                bullets: ["Token contracts", "Launch playbooks", "DApp integrations"],
              },
              {
                tag: "FULLSTACK",
                title: "Web Apps & Dashboards",
                desc: "Next.js apps, auth, wallet connect, admin panels, analytics, and monitoring.",
                bullets: ["Next.js + APIs", "Wallet integrations", "Admin dashboards"],
              },
              {
                tag: "INFRA",
                title: "Production Infrastructure",
                desc: "Indexers, cron jobs, queues, observability, and deployment hardening.",
                bullets: ["Indexing + cache", "Automations", "Monitoring + alerts"],
              },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-2xl border border-white/10 bg-black/30 p-6"
              >
                <div className="text-xs text-white/60">{s.tag}</div>
                <div className="mt-1 text-xl font-bold">{s.title}</div>
                <div className="mt-2 text-sm text-white/70 leading-relaxed">
                  {s.desc}
                </div>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#2e6cff]" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 text-xs text-white/45">
            We can build from scratch or integrate with your existing codebase. GitHub-first delivery.
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="process" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Process
        </h2>
        <p className="mt-2 text-white/70 max-w-2xl">
          A professional delivery flow that keeps scope, quality, and shipping under control.
        </p>

        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {[
            {
              step: "Step 01",
              title: "Scope & spec",
              desc: "We translate your vision into a clear spec, milestones, and acceptance criteria.",
            },
            {
              step: "Step 02",
              title: "Build in repo",
              desc: "We ship in a GitHub repo with clean commits, reviews, and reusable components.",
            },
            {
              step: "Step 03",
              title: "Test & harden",
              desc: "Basic safety checks, edge cases, and performance pass. No fragile demos.",
            },
            {
              step: "Step 04",
              title: "Deploy & iterate",
              desc: "Vercel/infra deploy, monitoring hooks, then weekly iterations based on real usage.",
            },
          ].map((x) => (
            <div
              key={x.step}
              className="rounded-2xl border border-white/10 bg-black/30 p-6"
            >
              <div className="text-xs text-white/60">{x.step}</div>
              <div className="mt-2 text-xl font-bold">{x.title}</div>
              <div className="mt-2 text-sm text-white/70 leading-relaxed">
                {x.desc}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-sm font-semibold">Delivery style</div>
          <div className="mt-2 grid md:grid-cols-3 gap-3 text-sm text-white/70">
            {[
              ["Transparent progress", "Weekly updates + changelog."],
              ["No black boxes", "Clear architecture and docs."],
              ["Production mindset", "Monitoring and ops included when needed."],
            ].map(([t, d]) => (
              <div
                key={t}
                className="rounded-xl border border-white/10 bg-black/30 p-4"
              >
                <div className="font-semibold">{t}</div>
                <div className="mt-1 text-white/70">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section id="stack" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="text-sm text-white/60">Stack</div>
              <h3 className="mt-1 text-2xl md:text-3xl font-extrabold tracking-tight">
                Tools we ship with
              </h3>
              <p className="mt-2 text-white/70 leading-relaxed max-w-2xl">
                We choose boring, proven tooling where it matters, and modern UX where it gives leverage.
              </p>
            </div>
            <a
              href={HOME_URL}
              className="px-5 py-3 rounded-2xl border border-white/10 bg-black/30 hover:bg-white/5 text-white font-semibold text-center"
            >
              Back to Home
            </a>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              {
                title: "Frontend",
                items: ["Next.js", "React", "TypeScript", "Tailwind"],
              },
              {
                title: "Web3",
                items: ["Ethers.js", "WalletConnect", "EVM chains", "Indexing"],
              },
              {
                title: "Infra",
                items: ["Vercel", "GitHub", "APIs", "Monitoring"],
              },
            ].map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-white/10 bg-black/30 p-6"
              >
                <div className="text-sm font-semibold">{b.title}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.items.map((it) => (
                    <span
                      key={it}
                      className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/80"
                    >
                      {it}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-xs text-white/45">
            If you require a specific stack (Solana, Polygon, Base, BNB, etc.), we adapt the delivery accordingly.
          </div>
        </div>
      </section>

      {/* Proof */}
      <section id="work" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="text-sm text-white/60">Proof</div>
              <h2 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">
                Built in-house
              </h2>
              <p className="mt-2 text-white/70 max-w-2xl">
                Hash42 Protocol is our public flagship product. It shows our engineering style:
                transparent metrics, serious UI, and infrastructure-first choices.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={PROTOCOL_PATH}
                className="px-5 py-3 rounded-2xl border border-white/10 bg-black/30 hover:bg-white/5 text-white font-semibold text-center"
              >
                Protocol (redirect)
              </a>
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
                t: "Transparency",
                d: "Protocol surfaces show real state (pool, reserve, power) instead of marketing numbers.",
              },
              {
                t: "Systems thinking",
                d: "Designed to survive abuse patterns, scale constraints, and long timelines.",
              },
              {
                t: "Premium product",
                d: "Institutional aesthetic with fast UX and clear user mental models.",
              },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-black/30 p-6">
                <div className="font-semibold">{x.t}</div>
                <div className="mt-2 text-sm text-white/70 leading-relaxed">{x.d}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-xs text-white/45">
            Want a similar build for your protocol or product? We can ship it with the same delivery discipline.
          </div>
        </div>
      </section>

      {/* Contacts */}
      <section id="contacts" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Contact
              </h2>
              <p className="mt-2 text-white/70 max-w-2xl">
                Tell us what you want to build. We’ll reply with a scope outline and next steps.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a
                href={APP_URL}
                className="px-5 py-3 rounded-2xl border border-white/10 bg-black/30 hover:bg-white/5 text-white font-semibold text-center"
              >
                View app
              </a>
              <a
                href="#services"
                className="px-5 py-3 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold shadow-[0_0_40px_rgba(255,106,0,0.18)] text-center"
              >
                Request a build
              </a>
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

          <div className="mt-6 text-xs text-white/45">
            Prefer a quick scope call? Write “SCOPE” in the subject and include: goal, chain, deadline, budget range.
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
                            <div className="text-sm text-white/60">© {year} Hash42. All rights reserved. Powered by <a href="https://alexfer33.pw" className="text-orange-500">al33xf</a></div>

            </div>

            

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <a href="/" className="hover:text-white">
                Home
              </a>
              <a href={PROTOCOL_PATH} className="hover:text-white">
                Protocol
              </a>
              <a href={APP_URL} className="hover:text-white">
                Open App
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