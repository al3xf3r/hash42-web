"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider } from "ethers";

const API = process.env.NEXT_PUBLIC_API_BASE!;

type Mission = {
  id: string;
  name: string;
  durationSec: number;
  energyCost: number;
  xp: number;
  requiresMinPower?: number;
};

type MeResponse = {
  address: string;
  username?: string | null;
  rig?: { level: number; slots: number; powerScore: number };
  energy?: { dailyLimit: number; used: number; remaining: number };
  rewards?: { availableUsdCents: number; capUsdCents: number; minWithdrawUsdCents: number };
};

type LeaderRow = { name: string; wallet: string; weeklyXp: number; powerScore: number };

function shortAddr(a?: string | null) {
  if (!a) return "—";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  return `${m}m`;
}

export default function Page() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);

const [activeRun, setActiveRun] = useState<{ missionRunId: string; missionId: string; endsAt: string } | null>(null);

  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showUsername, setShowUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");

  // countdown tick
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
      fetchAll(t).catch(() => {});
    }
  }, []);

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const timeLeftSec = useMemo(() => {
    if (!activeRun) return 0;
    return Math.max(0, Math.floor((new Date(activeRun.endsAt).getTime() - now) / 1000));
  }, [activeRun, now]);

  const activeMission = useMemo(() => {
  if (!activeRun) return null;
  return missions.find((m) => m.id === activeRun.missionId) || null;
}, [activeRun, missions]);

const activeTotalSec = activeMission?.durationSec ?? 0;

const progressLeftPct = useMemo(() => {
  if (!activeRun || !activeTotalSec) return 0;
  return Math.min(100, Math.max(0, Math.round((timeLeftSec / activeTotalSec) * 100)));
}, [activeRun, activeTotalSec, timeLeftSec]);



  const cap = me?.rewards?.capUsdCents ?? 1000;
  const available = me?.rewards?.availableUsdCents ?? 0;
  const progressPct = Math.max(0, Math.min(100, Math.round((available / cap) * 100)));

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

      await fetchAll(v.token);
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
    setMissions([]);
    setLeaderboard([]);
    setActiveRun(null);
    setToast("Logged out");
  }

async function fetchAll(t: string) {
  await Promise.all([fetchMe(t), fetchMissions(t), fetchLeaderboard(t), fetchActiveRun(t)]);
}

  async function fetchMe(t: string) {
    const r = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${t}` } });
    if (!r.ok) return;
    const j = await r.json();
    setMe(j);

    // If no username, prompt
    if (!j?.username) {
      setShowUsername(true);
      setUsernameDraft("");
    }
  }

  async function fetchMissions(t: string) {
    const r = await fetch(`${API}/missions`, { headers: { Authorization: `Bearer ${t}` } });
    if (!r.ok) return;
    const j = await r.json();
    setMissions(j.missions || []);
  }

  async function fetchActiveRun(t: string) {
  const r = await fetch(`${API}/missions/active`, { headers: { Authorization: `Bearer ${t}` } });
  if (!r.ok) return;
  const j = await r.json();

  if (j?.active) {
    setActiveRun({
      missionRunId: String(j.active.missionRunId),
      missionId: String(j.active.missionId),
      endsAt: String(j.active.endsAt),
    });
  } else {
    setActiveRun(null);
  }
}

  async function fetchLeaderboard(t: string) {
    const r = await fetch(`${API}/leaderboard/weekly`, { headers: { Authorization: `Bearer ${t}` } });
    if (!r.ok) return;
    const j = await r.json();
    setLeaderboard(j.rows || []);
  }

  async function startMission(missionId: string) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/missions/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ missionId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "start_failed");

      setActiveRun({ missionRunId: j.missionRunId, missionId, endsAt: j.endsAt });
      setToast("Mining started");
    } catch (e: any) {
      setError(e?.message || "Start failed");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    if (!token || !activeRun) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${API}/missions/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ missionRunId: activeRun.missionRunId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "claim_failed");

      setActiveRun(null);
      await fetchAll(token);

      const cents = Number(j.rewardUsdCents ?? 0);
      const xp = Number(j.xp ?? 0);
      setToast(`Claimed: +${xp} XP, +$${(cents / 100).toFixed(2)}`);
    } catch (e: any) {
      setError(e?.message || "Claim failed");
    } finally {
      setBusy(false);
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
      await fetchLeaderboard(token);
    } catch (e: any) {
      setError(e?.message || "Username failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto p-4 pb-20">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-orange-500 font-extrabold text-xl">Hash42</div>
            <div className="text-zinc-400 text-xs">Mining App</div>
          </div>

          {token ? (
            <button
              onClick={logout}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
            >
              Logout
            </button>
          ) : null}
        </div>

        {/* Auth panel */}
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

        {/* Main app */}
        {token && (
          <div className="space-y-4">
            {/* User Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-zinc-400 text-xs">Wallet</div>
                  <div className="font-mono">{shortAddr(address)}</div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-400 text-xs">Rig Power</div>
                  <div className="font-bold">{me?.rig?.powerScore ?? 0}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-zinc-400 text-xs">Username</div>
                  <div className="font-bold">{me?.username || "—"}</div>
                </div>

                <button
                  onClick={() => setShowUsername(true)}
                  className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Progress to cap */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-center justify-between">
                <div className="font-bold">Level 1 Cap</div>
                <div className="text-zinc-300 text-sm">
                  ${ (available / 100).toFixed(2) } / ${ (cap / 100).toFixed(2) }
                </div>
              </div>
              <div className="mt-3 h-3 rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full bg-orange-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-zinc-500 text-xs mt-2">
                When you reach the cap, mining stops until payout/claim flow (Phase 0.5).
              </div>
            </div>

            {/* Missions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold">Jobs</div>
                <button
                  onClick={() => token && fetchAll(token)}
                  className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                  disabled={busy}
                >
                  Refresh
                </button>
              </div>

              {missions.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold">{m.name}</div>
                    <div className="text-xs text-zinc-400 mt-1">
                      Duration {fmtDuration(m.durationSec)} • XP {m.xp}
                    </div>
                  </div>
                  <button
                    onClick={() => startMission(m.id)}
                    disabled={busy || !!activeRun}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-50"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>

            {/* Active mining */}
            <div className="rounded-2xl border border-orange-500/60 bg-gradient-to-b from-zinc-950 to-black p-4">
              <div className="flex items-center justify-between">
                <div className="font-bold">Active Mining</div>
                {activeRun ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-500 text-black font-bold">
                    LIVE
                  </span>
                ) : (
                  <span className="text-xs text-zinc-500">Idle</span>
                )}
              </div>

              {!activeRun ? (
                <div className="text-zinc-400 text-sm mt-2">
                  Start a job to begin mining.
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <div className="text-sm">
                    Time left:{" "}
                    <span className="font-mono text-orange-400">
                      {timeLeftSec}s
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                    {/* simple countdown bar: goes from 100% to 0% */}
                    <div
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${progressLeftPct}%` }}
                    />
                  </div>

                  <button
                    onClick={claim}
                    disabled={busy || timeLeftSec > 0}
                    className="w-full py-3 rounded-xl bg-orange-500 text-black font-bold disabled:opacity-50"
                  >
                    {timeLeftSec > 0 ? "Mining..." : "Claim"}
                  </button>

                  <div className="text-zinc-500 text-xs">
                    Claim triggers server-side reward calculation. No on-chain tx in Phase 0.5.
                  </div>
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="font-bold mb-3">Leaderboard (Weekly)</div>
              <div className="space-y-2">
                {leaderboard.length === 0 && (
                  <div className="text-zinc-500 text-sm">No data yet.</div>
                )}
                {leaderboard.map((r, idx) => {
                  const isMe = address && r.wallet?.toLowerCase() === address.toLowerCase();
                  return (
                    <div
                      key={`${r.wallet}-${idx}`}
                      className={[
                        "flex items-center justify-between rounded-xl px-3 py-2 border",
                        isMe ? "border-orange-500/60 bg-orange-500/10" : "border-zinc-800 bg-black/30",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 text-zinc-400 text-sm">{idx + 1}</div>
                        <div className="font-semibold">
                          {r.name}
                          {isMe ? <span className="text-orange-400 ml-2 text-xs">(you)</span> : null}
                        </div>
                      </div>
                      <div className="text-zinc-200 text-sm">{r.weeklyXp} XP</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-6 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm">
            {toast}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 text-sm text-red-400">
            {error}
          </div>
        )}

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
      </div>
    </main>
  );
}