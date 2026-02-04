export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="bg-black text-white antialiased min-h-screen overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
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
          <div className="flex items-center gap-3">
            <img
              src="/assets/icon-h42.png"
              alt="H42 icon"
              className="h-9 w-9 rounded-xl border border-white/10 bg-black/40"
            />
            <div>
              <div className="font-extrabold tracking-tight text-lg">
                <span className="text-white">HASH</span>
                <span className="text-[#ff6a00]">42</span>
              </div>
              <div className="text-[11px] text-white/55 -mt-0.5">
                Mining App • Beta
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-white/75">
            <a href="#how" className="hover:text-white">
              How it works
            </a>
            <a href="#economy" className="hover:text-white">
              Economy
            </a>
            <a href="#roadmap" className="hover:text-white">
              Roadmap
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="https://hash42.xyz/mining-app"
              className="px-4 py-2 rounded-xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold text-sm shadow-[0_0_40px_rgba(255,106,0,0.18)]"
            >
              Open app
            </a>
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
                Daily mining. Sustainable economy. Built for growth.
              </div>

              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold leading-tight md:leading-[1.12] pb-1 tracking-tight">
                A daily mining game
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#4f8fff] via-white to-[#ff8a2e]">
                  designed to last.
                </span>
              </h1>

              <p className="mt-4 text-white/70 text-base md:text-lg leading-relaxed">
                Hash42 is an idle mining experience where rewards are paced by
                design. Start mining, come back daily, and build your rig
                through GPU packs, slots, and future marketplace trading.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href="#cta"
                  className="px-5 py-3 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold shadow-[0_0_40px_rgba(255,106,0,0.18)] text-center"
                >
                  Start mining
                </a>
                <a
                  href="#how"
                  className="px-5 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold text-center"
                >
                  Read how it works
                </a>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Cycle</div>
                  <div className="mt-1 font-bold">24h</div>
                  <div className="text-xs text-white/45 mt-1">
                    Daily check-in
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Currency</div>
                  <div className="mt-1 font-bold">USD-based</div>
                  <div className="text-xs text-white/45 mt-1">HUSD in beta</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="text-xs text-white/60">Anti-spam</div>
                  <div className="mt-1 font-bold">Built-in</div>
                  <div className="text-xs text-white/45 mt-1">
                    Difficulty & caps
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px]">
  <div className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(46,108,255,0.25),transparent_55%),radial-gradient(circle_at_bottom,rgba(255,106,0,0.18),transparent_50%)] blur-2xl" />
  <div className="relative rounded-[32px] border border-white/10 bg-black/40 overflow-hidden shadow-[0_0_40px_rgba(46,108,255,0.25)]">
                <div className="p-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />
                    <span className="text-xs text-white/70">
                      Hash42 Mining App
                    </span>
                  </div>
                  <span className="text-xs text-white/45">Beta preview</span>
                </div>

                <div className="p-4">
                  <img
                    src="/assets/hero-hash42-miningapp.png"
                    alt="Hash42 hero"
                    className="w-full md:w-[92%] md:mx-auto rounded-2xl border border-white/10"
                  />

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-white/60">Balance</div>
                        <div className="text-2xl font-extrabold mt-1">
                          $4<span className="text-white/60">.</span>20933021
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          HashUSD • updates every second
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-white/60">Status</div>
                        <div className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs">
                          <span className="h-2 w-2 rounded-full bg-[#2e6cff]" />
                          Mining (24h)
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full w-1/3 bg-gradient-to-r from-[#2e6cff] to-[#ff6a00]" />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <div className="text-xs text-white/60">Active slots</div>
                        <div className="font-bold mt-1">1 / 5</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <div className="text-xs text-white/60">Payout cap</div>
                        <div className="font-bold mt-1">$10.00</div>
                      </div>
                    </div>

                    <a
                      href="https://hash42.xyz/mining-app"
                      className="mt-4 w-full inline-flex justify-center px-4 py-3 rounded-xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold"
                    >
                      Open app
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/45">
                The beta runs with hash dollars (HUSD). No real USDC is
                distributed.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof / positioning */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-white/60">Principle</div>
              <div className="mt-1 text-xl font-bold">
                Rewards must be sustainable.
              </div>
              <div className="mt-2 text-white/70 text-sm leading-relaxed">
                Hash42 is built to scale to high-volume markets without being
                drained by farms or bots.
              </div>
            </div>
            <div>
              <div className="text-sm text-white/60">Design</div>
              <div className="mt-1 text-xl font-bold">
                Idle by default. Daily by choice.
              </div>
              <div className="mt-2 text-white/70 text-sm leading-relaxed">
                Start a 24h cycle and let it run. Return for claim and progress.
                No 24/7 attention required.
              </div>
            </div>
            <div>
              <div className="text-sm text-white/60">Future</div>
              <div className="mt-1 text-xl font-bold">
                Collectible GPUs & marketplace.
              </div>
              <div className="mt-2 text-white/70 text-sm leading-relaxed">
                GPUs evolve into tradable NFTs, enabling player-to-player
                trading with marketplace fees.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              How it works
            </h2>
            <p className="mt-2 text-white/70 max-w-2xl">
              Simple loop. Clear incentives. Strong protections against abuse.
            </p>
          </div>
        </div>

        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-xs text-white/60">Step 01</div>
            <div className="mt-1 font-bold">Connect wallet</div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Login by signing a message. No on-chain transaction.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-xs text-white/60">Step 02</div>
            <div className="mt-1 font-bold">Start mining (24h)</div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              One button. One daily cycle. Progress continues while you are
              offline.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-xs text-white/60">Step 03</div>
            <div className="mt-1 font-bold">Balance grows per second</div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              USD-based balance with high precision decimals for visible
              momentum.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="text-xs text-white/60">Step 04</div>
            <div className="mt-1 font-bold">Claim at cap</div>
            <p className="mt-2 text-sm text-white/70 leading-relaxed">
              Once you hit your cap, you claim and start the next cycle.
            </p>
          </div>
        </div>
      </section>

      {/* Economy */}
      <section id="economy" className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">
                Economy & sustainability
              </h3>
              <p className="mt-2 text-white/70 leading-relaxed">
                Hash42 avoids inflationary “free money” mechanics. The system
                stays stable by combining caps, a global difficulty variable,
                and paid acceleration paths.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex gap-3">
                  <div className="mt-1 h-6 w-6 rounded-lg bg-[#2e6cff]/20 border border-white/10" />
                  <div>
                    <div className="font-semibold">Global difficulty</div>
                    <div className="text-sm text-white/70">
                      GPUs remain permanent while the difficulty can increase
                      over time, preserving long-term balance.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 h-6 w-6 rounded-lg bg-[#ff6a00]/20 border border-white/10" />
                  <div>
                    <div className="font-semibold">Caps by slots</div>
                    <div className="text-sm text-white/70">
                      1 free slot. Up to 5 slots. Higher slots unlock higher
                      payout caps.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-1 h-6 w-6 rounded-lg bg-white/10 border border-white/10" />
                  <div>
                    <div className="font-semibold">Paid progression</div>
                    <div className="text-sm text-white/70">
                      GPU packs, slot upgrades, and later ads/boosts create
                      sustainable revenue without draining the system.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5 md:p-6">
              <div className="text-sm text-white/60">Caps (example)</div>

              <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-white/60">1 slot</div>
                  <div className="font-bold mt-1">$10</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-white/60">2</div>
                  <div className="font-bold mt-1">$25</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-white/60">3</div>
                  <div className="font-bold mt-1">$50</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-white/60">4</div>
                  <div className="font-bold mt-1">$100</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                  <div className="text-white/60">5</div>
                  <div className="font-bold mt-1">$250</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">GPU packs (random)</div>
                <p className="mt-1 text-sm text-white/70 leading-relaxed">
                  Packs roll GPUs with controlled rarity. Low-priced packs
                  cannot drop top-tier GPUs. Higher-priced packs minimize
                  low-tier outcomes. Legendary remains rare.
                </p>
              </div>

              <div className="mt-4 text-xs text-white/45">
                Final probabilities, pricing, and pacing are tuned with real
                data during the closed beta.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Roadmap
        </h2>
        <p className="mt-2 text-white/70 max-w-2xl">
          Ship fast. Validate with real users. Scale only after the economy is
          proven.
        </p>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-xs text-white/60">Phase 0.5</div>
            <div className="mt-1 text-xl font-bold">Closed beta</div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>• 24h mining cycles</li>
              <li>• HashUSD balance (high precision)</li>
              <li>• Caps & claim flow</li>
              <li>• Basic leaderboard</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-xs text-white/60">Phase 1</div>
            <div className="mt-1 text-xl font-bold">GPU packs & slots</div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>• Randomized GPU drops</li>
              <li>• Slot upgrades (1 → 5)</li>
              <li>• Global difficulty tuning</li>
              <li>• Anti-spam improvements</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="text-xs text-white/60">Phase 2</div>
            <div className="mt-1 text-xl font-bold">NFT marketplace</div>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>• GPUs become NFTs</li>
              <li>• Player-to-player marketplace</li>
              <li>• Fees & royalties</li>
              <li>• Optional ad boosts</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="mx-auto max-w-6xl px-4 pb-14">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-r from-[#2e6cff]/20 via-white/5 to-[#ff6a00]/15 p-10 md:p-14 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Start mining
          </h2>
          <p className="mt-3 text-white/70 leading-relaxed max-w-2xl mx-auto">
            Open the app and begin your daily 24h cycle. Rewards are paced by
            design.
          </p>

          <div className="mt-6 flex justify-center">
            <a
              href="https://hash42.xyz/mining-app"
              className="px-7 py-4 rounded-2xl bg-[#ff6a00] hover:bg-[#ff8a2e] text-black font-semibold text-lg shadow-[0_0_40px_rgba(255,106,0,0.18)]"
            >
              Open app
            </a>
          </div>

          <div className="mt-4 text-xs text-white/45">
            Beta preview. HashUSD only. No real USDC is distributed.
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          FAQ
        </h2>

        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="font-semibold">Is Hash42 a faucet?</div>
            <div className="mt-2 text-sm text-white/70 leading-relaxed">
              No. It is a paced mining game. The economy is designed around
              caps, difficulty, and paid progression.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="font-semibold">Do I need to keep the app open?</div>
            <div className="mt-2 text-sm text-white/70 leading-relaxed">
              No. You start a 24h cycle and come back for claim. The loop is
              built for daily engagement.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="font-semibold">What stops bots and farms?</div>
            <div className="mt-2 text-sm text-white/70 leading-relaxed">
              The system is not “free money”. Free progression is extremely
              slow, caps gate payouts, and difficulty can rise globally.
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
            <div className="font-semibold">
              When will NFTs and marketplace launch?
            </div>
            <div className="mt-2 text-sm text-white/70 leading-relaxed">
              After the closed beta proves the economy. Then GPUs become tradable
              NFTs with marketplace fees.
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo-hash42-labs.png"
                alt="Hash42 Labs"
                className="h-9 w-auto opacity-90"
              />
              <div className="text-sm text-white/60">
                © {year} Hash42. All rights reserved.
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-white/60">
              <a href="#how" className="hover:text-white">
                How it works
              </a>
              <a href="#economy" className="hover:text-white">
                Economy
              </a>
              <a href="#roadmap" className="hover:text-white">
                Roadmap
              </a>
              <a href="#cta" className="hover:text-white">
                Start
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
