"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider } from "ethers";

const API = process.env.NEXT_PUBLIC_API_BASE!;

type MeResponse = {
  address: string;
  username?: string | null;
  slotsUnlocked?: number; // 1..5
  husd?: {
    symbol: string;
    balanceNano: number;
    capNano: number;
    totalClaimedNano: number;
  };
  mining?: {
    active: boolean;
    endsAt: string | null;
    secondsLeft: number;
    completed: boolean;
    capReached: boolean;
    rateNanoPerSec?: number;
    serverNow?: string;
    sessionSeconds?: number; // 86400
  };
};

type TabKey = "mining" | "marketplace" | "leaderboard" | "profile";

function shortAddr(a?: string | null) {
  if (!a) return "—";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function fmtHusd8FromNano(nano?: number) {
  const husd = Number(nano || 0) / 1e8; // 1 HUSD = 1e8 nano
  return husd.toFixed(8);
}

function clampPct(x: number) {
  return Math.max(0, Math.min(100, x));
}

function fmtTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export default function Page() {
  const [tab, setTab] = useState<TabKey>("mining");

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);

  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showUsername, setShowUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");

  // UI-only animated balance
  const [uiBalanceNano, setUiBalanceNano] = useState<number>(0);

  // Slot modal
  const [slotModal, setSlotModal] = useState<null | { slotIndex: number; payoutHusd: number; priceUsd: number }>(null);

  // tick
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // restore session
  useEffect(() => {
    const t = localStorage.getItem("hash42_token");
    const a = localStorage.getItem("hash42_address");
    if (t && a) {
      setToken(t);
      setAddress(a);
      fetchMe(t).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Keep UI balance in sync with server balance
  useEffect(() => {
    setUiBalanceNano(Number(me?.husd?.balanceNano || 0));
  }, [me?.husd?.balanceNano]);

  // While mining is active, animate + refresh
  useEffect(() => {
    if (!token) return;
    if (!me?.mining?.active) return;

    const rate = Number(me?.mining?.rateNanoPerSec ?? 11); // fallback
    const uiTick = setInterval(() => {
      setUiBalanceNano((x) => x + rate);
    }, 1000);

    const refresh = setInterval(() => {
      fetchMe(token).catch(() => {});
    }, 15000);

    return () => {
      clearInterval(uiTick);
      clearInterval(refresh);
    };
  }, [token, me?.mining?.active, me?.mining?.rateNanoPerSec]);

  const miningActive = !!me?.mining?.active;

  const endsAtMs = useMemo(() => {
    const s = me?.mining?.endsAt;
    if (!s) return null;
    const t = new Date(s).getTime();
    return Number.isFinite(t) ? t : null;
  }, [me?.mining?.endsAt]);

  const secondsLeft = useMemo(() => {
    if (endsAtMs) return Math.max(0, Math.floor((endsAtMs - now) / 1000));
    return Math.max(0, Number(me?.mining?.secondsLeft || 0));
  }, [endsAtMs, now, me?.mining?.secondsLeft]);

  const sessionTotalSec = Number(me?.mining?.sessionSeconds || 86400);
  const sessionLeftPct = useMemo(() => clampPct(Math.round((secondsLeft / sessionTotalSec) * 100)), [secondsLeft, sessionTotalSec]);

  const capNano = Number(me?.husd?.capNano || 0);
  const capPct = useMemo(() => {
    if (!capNano) return 0;
    return clampPct(Math.round((uiBalanceNano / capNano) * 100));
  }, [uiBalanceNano, capNano]);

  const slotsUnlocked = Math.max(1, Math.min(5, Number(me?.slotsUnlocked || 1)));

  async function connectWallet() {
    setError(null);
    if (!(window as any).ethereum) {
      setError("MetaMask not found");
      return;
    }
    const p = new BrowserProvider((window as any).ethereum);
    await p.send("eth_requestAccounts", []);
    const net = await p.getNetwork();
    if (Number(net.chainId) !== 8453) {
      setToast("Switch to Base network (chainId 8453) for best experience.");
    }
    const signer = await p.getSigner();
    const addr = await signer.getAddress();
    setProvider(p);
    setAddress(addr);
  }

  async function login() {
    if (!provider || !address) return;
    setBusy(true);
    setError(null);
    try {
      const r1 = await fetch(`${API}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const n = await r1.json();
      if (!r1.ok) throw new Error(n.error || "nonce_failed");

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(n.message);

      const r2 = await fetch(`${API}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message: n.message, signature }),
      });
      const v = await r2.json();
      if (!r2.ok) throw new Error(v.error || "verify_failed");

      localStorage.setItem("hash42_token", v.token);
      localStorage.setItem("hash42_address", address);
      setToken(v.token);

      await fetchMe(v.token);
      setToast("Logged in");
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("hash42_token");
    localStorage.removeItem("hash42_address");
    setToken(null);
    setAddress(null);
    setProvider(null);
    setMe(null);
    setToast("Logged out");
  }

  async function fetchMe(t: string) {
    const r = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${t}` } });
    const j = await r.json().catch(() => null);
    if (!r.ok) return;
    setMe(j);

    if (!j?.username) {
      setShowUsername(true);
      setUsernameDraft("");
    }
  }

  async function saveUsername() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/profile/username`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: usernameDraft }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "username_failed");

      setShowUsername(false);
      setToast("Username saved");
      await fetchMe(token);
    } catch (e: any) {
      setError(e?.message || "Username failed");
    } finally {
      setBusy(false);
    }
  }

  async function startMining() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/mining/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `start_failed_${r.status}`);

      setToast("Mining started");
      await fetchMe(token);
    } catch (e: any) {
      setError(e?.message || "Start mining failed");
    } finally {
      setBusy(false);
    }
  }

  async function stopMining() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/mining/stop`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `stop_failed_${r.status}`);

      setToast("Mining stopped");
      await fetchMe(token);
    } catch (e: any) {
      setError(e?.message || "Stop mining failed");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/mining/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `claim_failed_${r.status}`);

      setToast("Claimed");
      await fetchMe(token);
    } catch (e: any) {
      setError(e?.message || "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  function openBuySlot(slotIndex: number) {
    // payout mapping (beta spec)
    const payouts = [10, 25, 50, 100, 250];
    const payoutHusd = payouts[slotIndex - 1] || 10;

    // placeholder prices (UI only for beta)
    const prices = [0, 2, 5, 10, 20]; // slot1 free, others example
    const priceUsd = prices[slotIndex - 1] ?? 2;

    setSlotModal({ slotIndex, payoutHusd, priceUsd });
  }

  function BottomNav() {
    const item = (key: TabKey, label: string) => {
      const active = tab === key;
      return (
        <button
          onClick={() => setTab(key)}
          className={[
            "flex-1 py-3 text-xs font-semibold",
            active ? "text-orange-400" : "text-zinc-400",
          ].join(" ")}
        >
          {label}
        </button>
      );
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black/90 backdrop-blur">
        <div className="max-w-md mx-auto flex">
          {item("mining", "Mining")}
          {item("marketplace", "Marketplace")}
          {item("leaderboard", "Leaderboard")}
          {item("profile", "Profile")}
        </div>
      </div>
    );
  }

  function MiningTab() {
    return (
      <div className="space-y-4">
        {/* Balance header */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-400 text-xs">Balance</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {fmtHusd8FromNano(uiBalanceNano)}{" "}
            <span className="text-zinc-400 text-sm font-semibold">{me?.husd?.symbol || "HUSD"}</span>
          </div>

          <div className="mt-3 h-2 rounded-full bg-zinc-900 overflow-hidden">
            <div className="h-full bg-orange-500" style={{ width: `${capPct}%` }} />
          </div>
          <div className="text-zinc-500 text-xs mt-2">
            Cap: {fmtHusd8FromNano(me?.husd?.capNano || 0)} • Slots increase cap.
          </div>
        </div>

        {/* GPU Slots */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-bold mb-3">GPU Slots</div>
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const slotIndex = i + 1;
              const unlocked = slotIndex <= slotsUnlocked;
              const isFreeGpu = slotIndex === 1;

              if (isFreeGpu) {
                return (
                  <div
                    key={slotIndex}
                    className="aspect-square rounded-xl border border-orange-500/60 bg-orange-500/10 flex items-center justify-center text-xs font-bold"
                    title="Free RTX — 1 MH/s"
                  >
                    RTX
                  </div>
                );
              }

              if (unlocked) {
                // For beta, unlocked but empty = show placeholder
                return (
                  <div
                    key={slotIndex}
                    className="aspect-square rounded-xl border border-zinc-700 bg-black/30 flex items-center justify-center text-[10px] text-zinc-300"
                    title="Unlocked slot (beta)"
                  >
                    Empty
                  </div>
                );
              }

              return (
                <button
                  key={slotIndex}
                  onClick={() => openBuySlot(slotIndex)}
                  className="aspect-square rounded-xl border border-zinc-800 bg-black/30 flex items-center justify-center text-xl text-zinc-500 hover:bg-zinc-900"
                  title="Buy slot"
                >
                  +
                </button>
              );
            })}
          </div>

          <div className="text-zinc-500 text-xs mt-3">
            Slot 1 is gifted (Free RTX 1 MH/s). Slots 2–5 are purchasable (beta UI only).
          </div>
        </div>

        {/* Start/Stop + Timer */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold">Mining Session</div>
            <div className="text-xs text-zinc-500">24h</div>
          </div>

          <div className="mt-3">
            <button
              onClick={miningActive ? stopMining : startMining}
              disabled={busy}
              className={[
                "w-full py-4 rounded-2xl font-extrabold text-black disabled:opacity-50",
                miningActive ? "bg-red-500" : "bg-green-500",
              ].join(" ")}
            >
              {busy ? "..." : miningActive ? "Stop Mining" : "Start Mining"}
            </button>

            <div className="mt-3 text-center text-zinc-400 text-sm">
              Timer:{" "}
              <span className="font-mono text-zinc-100">{fmtTime(secondsLeft)}</span>
            </div>

            <div className="mt-3 h-2 rounded-full bg-zinc-900 overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${sessionLeftPct}%` }} />
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => token && fetchMe(token)}
                disabled={busy}
                className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-sm"
              >
                Refresh
              </button>

              <button
                onClick={claim}
                disabled={busy || miningActive}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-bold disabled:opacity-50 text-sm"
              >
                Claim
              </button>
            </div>

            <div className="text-zinc-500 text-xs mt-3">
              During beta, claim is off-chain. Claim is disabled while mining is active.
            </div>
          </div>
        </div>
      </div>
    );
  }

  function MarketplaceTab() {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="font-bold text-lg">Marketplace (Beta)</div>
        <div className="text-zinc-400 text-sm mt-2">
          Packs + drop rates (off-chain). We’ll implement FIFA-style packs here next.
        </div>
      </div>
    );
  }

  function LeaderboardTab() {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="font-bold text-lg">Leaderboard</div>
        <div className="text-zinc-400 text-sm mt-2">
          Weekly + All-Time. Metric: computing power (not earnings). Coming next.
        </div>
      </div>
    );
  }

  function ProfileTab() {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-400 text-xs">Username</div>
          <div className="text-xl font-bold">{me?.username || "—"}</div>
          <button
            onClick={() => setShowUsername(true)}
            className="mt-3 w-full py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-sm"
          >
            Edit Username
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-400 text-xs">Wallet</div>
          <div className="font-mono text-sm">{shortAddr(me?.address || address)}</div>
          <div className="text-zinc-500 text-xs mt-2">
            Referral + settings will appear here.
          </div>

          <button
            onClick={logout}
            className="mt-3 w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------
  // UI
  // ---------------------------
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto p-4 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-orange-500 font-extrabold text-xl">Hash42</div>
            <div className="text-zinc-400 text-xs">Mining App (Beta)</div>
          </div>

          {token ? (
            <button
              onClick={() => token && fetchMe(token)}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
              disabled={busy}
            >
              Refresh
            </button>
          ) : null}
        </div>

        {/* Auth */}
        {!address && (
          <button
            onClick={connectWallet}
            className="w-full py-3 rounded-xl bg-orange-500 text-black font-bold"
          >
            Connect Wallet
          </button>
        )}

        {address && !token && (
          <div className="space-y-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-zinc-400 text-xs">Wallet</div>
              <div className="font-mono">{shortAddr(address)}</div>
              <div className="text-zinc-500 text-xs mt-2">
                You will sign a message. No blockchain transaction.
              </div>
            </div>

            <button
              onClick={login}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-orange-500 text-black font-bold disabled:opacity-50"
            >
              {busy ? "Signing..." : "Login"}
            </button>
          </div>
        )}

        {/* App */}
        {token && (
          <div className="space-y-4">
            {tab === "mining" && <MiningTab />}
            {tab === "marketplace" && <MarketplaceTab />}
            {tab === "leaderboard" && <LeaderboardTab />}
            {tab === "profile" && <ProfileTab />}
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm">
            {toast}
          </div>
        )}

        {/* Error */}
        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}

        {/* Username modal */}
        {token && showUsername && (
          <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="font-bold text-lg">Set username</div>
              <div className="text-zinc-400 text-sm mt-1">
                3–16 chars, lowercase, numbers, underscore.
              </div>

              <input
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="e.g. alexfer33"
                className="mt-3 w-full rounded-xl bg-black border border-zinc-800 px-3 py-3 outline-none focus:border-orange-500"
              />

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setShowUsername(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                  disabled={busy}
                >
                  Later
                </button>
                <button
                  onClick={saveUsername}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-bold disabled:opacity-50"
                  disabled={busy || usernameDraft.trim().length === 0}
                >
                  Save
                </button>
              </div>

              <div className="text-zinc-500 text-xs mt-3">
                Username is used in the leaderboard. If not set, your wallet will be shown.
              </div>
            </div>
          </div>
        )}

        {/* Slot modal */}
        {token && slotModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="font-bold text-lg">Buy Slot #{slotModal.slotIndex}</div>
              <div className="text-zinc-400 text-sm mt-1">
                Unlocking slots increases your payout cap.
              </div>

              <div className="mt-3 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">New cap</span>
                  <span className="font-bold">{slotModal.payoutHusd} HUSD</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-zinc-400">Price</span>
                  <span className="font-bold">${slotModal.priceUsd.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setSlotModal(null)}
                  className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setToast("Purchase flow (beta) coming next");
                    setSlotModal(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-bold"
                >
                  Buy (Beta)
                </button>
              </div>

              <div className="text-zinc-500 text-xs mt-3">
                Beta note: slot purchases are off-chain for now. We’ll wire payments later.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      {token ? <BottomNav /> : null}
    </main>
  );
}