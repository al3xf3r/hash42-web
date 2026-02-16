// app/app/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserProvider } from "ethers";

const API = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");

if (!API) {
  // in prod non vuoi crash, ma vuoi capirlo subito
  console.error("NEXT_PUBLIC_API_BASE is missing. Set it in hosting env vars.");
}

type ActivityItem = {
  id: number;
  amountNano: number; // can be +/-
  createdAt: string;
  note: string;
};

type LeaderboardItem = {
  rank: number;
  userId: number;
  username: string | null;
  wallet: string;
  powerScore: number;
  totalClaimedNano: number;
};

type LeaderboardPublicResponse = {
  ok: boolean;
  metric: "power_score";
  items: LeaderboardItem[];
};

type MarketPack = {
  key: string;
  name: string;
  priceCredits: number;
  odds: Record<string, number>;
};

type MarketConfig = {
  ok: boolean;
  currency: { symbol: string; nanoPerUnit: string };
  slotPricesCredits: Record<string, number>;
  packs: MarketPack[];
};

type InventoryItem = {
  userGpuId: number;
  gpuId: number;
  name: string;
  rarity: string;
  mhps: number;
  imagePath: string;
  acquiredAt?: string;
  createdAt?: string;
  source?: string;
};

type InventoryResponse = {
  ok: boolean;
  items: InventoryItem[];
};

type MeResponse = {
  address: string;
  username?: string | null;
  slotsUnlocked?: number;
  starterRtxGifted?: boolean;
  powerScore?: number;
  inventoryPowerScore?: number;
  credits?: {
    symbol: string; // "HUSD"
    balanceNano: number; // spendable
    nanoPerUnit?: string;
  };
  husd?: {
    symbol: string;
    balanceNano: number;
    capNano: number;
    vaultNano?: number;
    totalClaimedNano: number;
  };
};

type RewardsV2Response = {
  ok: boolean;
  today: number;
  power: number;
  claimableNano: string; // bigint as string
  daily?: any;
};

type RewardsV2ClaimResponse = {
  ok: boolean;
  paidNano: string;
  partial: boolean;
  claimableBeforeNano: string;
  claimableAfterNano: string;
};

type ProtocolStatusResponse = {
  ok: boolean;
  serverNow: string;

  poolNano: string; // revenue_pool_nano
  reserveNano: string;
  allocatedUnclaimedNano: string;
  availableNano: string;

  bootstrap: boolean;

  teamNano?: string;
  totalPower?: string;
  lastDistributionDay?: number;
  lastDailyDistributionNano?: string;
  dailyPayoutDay?: number;
  dailyPayoutUsedNano?: string;
};

type TabKey = "protocol" | "marketplace" | "leaderboard" | "vault";

type PopupState =
  | null
  | {
      title: string;
      message: string;
    };

function shortAddr(a?: string | null) {
  if (!a) return "—";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function fmtHusd8FromNano(nano?: number) {
  const husd = Number(nano || 0) / 1e8;
  return husd.toFixed(8);
}

function fmtCredits2FromNano(nano?: number) {
  const v = Math.abs(Number(nano || 0)) / 1e8;
  return v.toFixed(2);
}

function fmtCredits8FromNano(nano?: number) {
  const v = Number(nano || 0) / 1e8;
  return v.toFixed(8);
}

function fmtWhen(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

function rarityColor(r: string) {
  const x = (r || "").toLowerCase();
  if (x === "legendary") return "text-cyan-200";
  if (x === "epic") return "text-orange-300";
  if (x === "rare") return "text-yellow-300";
  if (x === "uncommon") return "text-blue-300";
  return "text-green-300";
}

function clampSlots(n: number) {
  return Math.max(1, Math.min(5, Number.isFinite(n) ? n : 1));
}

function formatHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

// Next payout: daily at 17:00 Europe/Rome (client-side).
function getNextRome17(nowMs: number) {
  const now = new Date(nowMs);
  const next = new Date(now);
  next.setHours(17, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
    next.setHours(17, 0, 0, 0);
  }
  return next.getTime();
}

function ErrorModal({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-[999]">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-red-300/90 text-xs font-semibold tracking-wide">ERROR</div>
            <div className="mt-1 text-lg font-extrabold text-zinc-100">{title}</div>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
          {message}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-xl bg-orange-500 text-black font-extrabold"
        >
          OK
        </button>
      </div>
    </div>
  );
}

/**
 * Countdown isolato (fix scroll modal):
 * invece di aggiornare tutta la pagina ogni secondo, aggiorniamo solo questa UI.
 */
function NextDistributionCountdown({ serverNowISO }: { serverNowISO?: string | null }) {
  const [seconds, setSeconds] = useState<number>(0);

  const serverNowAtFetchRef = useRef<number | null>(null);
  const clientAtFetchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!serverNowISO) {
      serverNowAtFetchRef.current = null;
      clientAtFetchRef.current = null;
      return;
    }
    const ms = new Date(serverNowISO).getTime();
    if (!Number.isFinite(ms)) return;
    serverNowAtFetchRef.current = ms;
    clientAtFetchRef.current = Date.now();
  }, [serverNowISO]);

  useEffect(() => {
    const tick = () => {
      const nowClient = Date.now();
      const baseServer = serverNowAtFetchRef.current;
      const baseClient = clientAtFetchRef.current;

      const alignedNow =
        baseServer && baseClient ? baseServer + (nowClient - baseClient) : nowClient;

      const next = getNextRome17(alignedNow);
      const s = Math.max(0, Math.floor((next - alignedNow) / 1000));
      setSeconds(s);
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-right space-y-1">
      <div className="text-zinc-400 text-xs">Next distribution</div>
      <div className="text-2xl font-extrabold text-cyan-300">{formatHMS(seconds)}</div>
      <div className="text-zinc-500 text-xs">Daily at 17:00 UTC+1</div>
    </div>
  );
}

function RigWiringAnimation({
  enabled,
  slotActive,
}: {
  enabled: boolean;
  slotActive: boolean[]; // length 5
}) {
  const anyActive = enabled && slotActive.some(Boolean);

  const cableStroke = (on: boolean) =>
    on
      ? "rgba(34,211,238,0.60)" // cyan glow
      : "rgba(113,113,122,0.25)"; // zinc dim

  const cableGlow = (on: boolean) =>
    on
      ? "rgba(249,115,22,0.22)" // orange haze
      : "rgba(0,0,0,0)";

  return (
    <div className="mt-4 rounded-xl border border-zinc-800 bg-black/30 p-3 relative overflow-hidden">
      <div className="text-xs flex items-center justify-between">
        <span className="text-zinc-400">Rig Wiring</span>
        <span className={anyActive ? "text-orange-300 font-semibold" : "text-zinc-500 font-semibold"}>
          {anyActive ? "ACTIVE" : "DISABLED"}
        </span>
      </div>

      <div className="mt-3 relative h-28">
        {/* ambient glow solo se attivo */}
        {anyActive && (
          <>
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />
          </>
        )}

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[10, 30, 50, 70, 90].map((x, i) => {
            const on = anyActive && !!slotActive[i];

            return (
              <g key={x}>
                {/* base cable (dim or lit) */}
                <path
                  d={`M ${x} 15 C ${x} 40, 50 40, 50 72`}
                  fill="none"
                  stroke={cableStroke(on)}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />

                {/* glow haze */}
                <path
                  d={`M ${x} 15 C ${x} 40, 50 40, 50 72`}
                  fill="none"
                  stroke={cableGlow(on)}
                  strokeWidth="5.2"
                  strokeLinecap="round"
                  opacity={on ? 0.65 : 0}
                />

                {/* moving energy pulse ONLY if active */}
                {on && (
                  <path
                    d={`M ${x} 15 C ${x} 40, 50 40, 50 72`}
                    fill="none"
                    stroke="rgba(34,211,238,0.95)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeDasharray="6 10"
                  >
                    <animate attributeName="stroke-dashoffset" values="0;-32" dur="1.0s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;1;0.2" dur="1.0s" repeatCount="indefinite" />
                  </path>
                )}
              </g>
            );
          })}

          {/* core pulse ONLY if any cable active */}
          {anyActive && (
            <circle cx="50" cy="72" r="2.6" fill="rgba(34,211,238,0.95)">
              <animate attributeName="r" values="2.6;4.8;2.6" dur="1.35s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.95;0.25;0.95" dur="1.35s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>

        {/* GPU nodes */}
        <div className="absolute top-2 left-0 right-0 flex justify-between px-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const on = anyActive && !!slotActive[i];
            return (
              <div
                key={i}
                className={[
                  "w-6 h-6 rounded-lg border bg-zinc-950 flex items-center justify-center",
                  on ? "border-cyan-400/40" : "border-zinc-700/60",
                ].join(" ")}
                title={`GPU Slot ${i + 1}`}
              >
                <div className={on ? "w-2 h-2 rounded-full bg-cyan-300 animate-pulse" : "w-2 h-2 rounded-full bg-zinc-500/40"} />
              </div>
            );
          })}
        </div>

        {/* Mainframe */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <div className="relative">
            {anyActive && <div className="absolute inset-0 rounded-2xl bg-cyan-400/20 blur-xl animate-pulse" />}
            <div
              className={[
                "w-44 h-12 rounded-2xl border bg-zinc-950 flex items-center justify-between px-3",
                anyActive ? "border-cyan-400/35" : "border-zinc-700/60",
              ].join(" ")}
            >
              <div className={anyActive ? "text-xs font-bold text-zinc-200" : "text-xs font-bold text-zinc-500"}>MAINFRAME</div>
              <div className="flex gap-1">
                <div className={anyActive ? "w-2 h-2 rounded-full bg-cyan-300 animate-pulse" : "w-2 h-2 rounded-full bg-zinc-600/40"} />
                <div className={anyActive ? "w-2 h-2 rounded-full bg-orange-300 animate-pulse" : "w-2 h-2 rounded-full bg-zinc-600/40"} />
                <div className="w-2 h-2 rounded-full bg-zinc-300/20" />
              </div>
            </div>
          </div>
          <div className={anyActive ? "text-[11px] text-zinc-500 text-center mt-2" : "text-[11px] text-zinc-600 text-center mt-2"}>
            {anyActive ? "Live wiring + energy flow" : "Connect and equip GPUs to activate"}
          </div>
        </div>
      </div>
    </div>
  );
}


function RigWiringMainframe({
  rig,
  slotsUnlocked,
  loggedIn,
  wrapRef,
  slotRefs,
}: {
  rig: (InventoryItem | null)[];
  slotsUnlocked: number;
  loggedIn: boolean;
  wrapRef: React.RefObject<HTMLDivElement | null>;
  slotRefs: React.RefObject<(HTMLButtonElement | null)[]>;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const connected = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const unlocked = i < slotsUnlocked;
      const hasGpu = !!rig[i];
      return loggedIn && unlocked && hasGpu;
    });
  }, [rig, slotsUnlocked, loggedIn]);

  const anyOn = connected.some(Boolean);
  const activeCount = connected.filter(Boolean).length;

  

  // dynamic ports (from DOM slot buttons)
  const [ports, setPorts] = useState<{ x: number; y: number }[]>(
    Array.from({ length: 5 }).map(() => ({ x: 0, y: 0 }))
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const compute = () => {
      const w = wrap.getBoundingClientRect();
      const next = Array.from({ length: 5 }).map((_, i) => {
        const el = slotRefs.current[i];
        if (!el) return { x: w.width * ((i + 1) / 6), y: 82 }; // fallback
        const r = el.getBoundingClientRect();
        // start cable from bottom-center of slot card (ATTACCATO allo slot)
        const x = r.left - w.left + r.width / 2;
        const y = r.bottom - w.top; // bottom edge
        return { x, y };
      });
      setPorts(next);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    window.addEventListener("scroll", compute, true);
    window.addEventListener("resize", compute);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", compute, true);
      window.removeEventListener("resize", compute);
    };
  }, [wrapRef, slotRefs, rig, slotsUnlocked, loggedIn]);

  // layout inside wrap
  const CORE = useMemo(() => {
    // “mainframe area” center lower part
    return { x: 0.5, y: 0.70 };
  }, []);

  const pathFor = (i: number, w: number, h: number) => {
    const p = ports[i];
    const x1 = p.x;
    const y1 = p.y; // starts from slot bottom
    const x2 = w * CORE.x;
    const y2 = h * CORE.y;

    const dx = x1 - x2;
    const c1x = x1;
    const c1y = y1 + Math.max(40, h * 0.12);
    const c2x = x2 + dx * 0.55;
    const c2y = y2 - Math.max(30, h * 0.10);

    return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
  };

  // Canvas: particles on active cables (same vibe, but uses dynamic ports)
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const svg = svgRef.current;
    if (!canvas || !wrap || !svg) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(r.width * dpr);
      canvas.height = Math.floor(r.height * dpr);
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // sample cable points in pixel coords directly
    const sampleCable = (i: number, steps = 90) => {
      const r = wrap.getBoundingClientRect();
      const d = pathFor(i, r.width, r.height);

      // quick bezier sampler from the same control points logic:
      const p = ports[i];
      const x1 = p.x, y1 = p.y;
      const x2 = r.width * CORE.x, y2 = r.height * CORE.y;

      const dx = x1 - x2;
      const c1x = x1;
      const c1y = y1 + Math.max(40, r.height * 0.12);
      const c2x = x2 + dx * 0.55;
      const c2y = y2 - Math.max(30, r.height * 0.10);

      const pts: { x: number; y: number }[] = [];
      for (let t = 0; t <= 1.00001; t += 1 / steps) {
        const mt = 1 - t;
        const x =
          mt * mt * mt * x1 +
          3 * mt * mt * t * c1x +
          3 * mt * t * t * c2x +
          t * t * t * x2;
        const y =
          mt * mt * mt * y1 +
          3 * mt * mt * t * c1y +
          3 * mt * t * t * c2y +
          t * t * t * y2;
        pts.push({ x, y });
      }
      return { d, pts };
    };

    let cables: { d: string; pts: { x: number; y: number }[]; on: boolean }[] = [];
    const rebuild = () => {
      const r = wrap.getBoundingClientRect();
      cables = Array.from({ length: 5 }).map((_, i) => {
        const s = sampleCable(i);
        return { d: s.d, pts: s.pts, on: !!connected[i] };
      });
    };
    rebuild();

    const ro2 = new ResizeObserver(() => {
      resize();
      rebuild();
    });
    ro2.observe(wrap);

    type P = { cable: number; t: number; speed: number; size: number; alpha: number };
    let particles: P[] = [];

    const spawn = () => {
      if (!anyOn) return;
      const n = 1 + activeCount * 2;
      const activeIdx = cables.map((c, idx) => (c.on ? idx : -1)).filter((x) => x >= 0);
      if (!activeIdx.length) return;

      for (let k = 0; k < n; k++) {
        const cable = activeIdx[Math.floor(Math.random() * activeIdx.length)];
        particles.push({
          cable,
          t: Math.random() * 0.18,
          speed: 0.55 + Math.random() * 0.65,
          size: 1.2 + Math.random() * 2.4,
          alpha: 0.55 + Math.random() * 0.45,
        });
      }
      if (particles.length > 320) particles = particles.slice(particles.length - 320);
    };

    const drawGlowDot = (x: number, y: number, rr: number, a: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      const g = ctx.createRadialGradient(x, y, 0, x, y, rr * 8);
      g.addColorStop(0, `rgba(34,211,238,${0.60 * a})`);
      g.addColorStop(0.35, `rgba(34,211,238,${0.20 * a})`);
      g.addColorStop(1, `rgba(34,211,238,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rr * 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(210, 255, 255, ${0.85 * a})`;
      ctx.beginPath();
      ctx.arc(x, y, rr, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const r = wrap.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);

      if (anyOn) {
        // ambient
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const amb = ctx.createRadialGradient(r.width * 0.5, r.height * 0.75, 0, r.width * 0.5, r.height * 0.75, r.width * 0.75);
        amb.addColorStop(0, "rgba(34,211,238,0.10)");
        amb.addColorStop(0.55, "rgba(34,211,238,0.04)");
        amb.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = amb;
        ctx.fillRect(0, 0, r.width, r.height);
        ctx.restore();

        if (Math.random() < 0.85) spawn();

        particles = particles.filter((p) => {
          const c = cables[p.cable];
          if (!c || !c.on) return false;

          p.t += p.speed * dt;
          if (p.t >= 1) return false;

          const idx = Math.min(c.pts.length - 1, Math.floor(p.t * (c.pts.length - 1)));
          const pt = c.pts[idx];
          if (!pt) return false;

          drawGlowDot(pt.x, pt.y, p.size, p.alpha);

          if (Math.random() < 0.03) {
            drawGlowDot(pt.x + (Math.random() - 0.5) * 10, pt.y + (Math.random() - 0.5) * 10, 0.9, 0.55);
          }
          return true;
        });
      } else {
        particles = [];
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      ro2.disconnect();
    };
  }, [anyOn, activeCount, connected, ports, wrapRef, CORE]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1]"
      style={{
        // copre tutta l’area slot + mainframe
        // (se vuoi più spazio sotto, aumenta padding-bottom nel parent)
      }}
    >
      <div className="absolute left-0 right-0 top-0 bottom-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ mixBlendMode: "screen", opacity: anyOn ? 1 : 0.15 }}
        />

        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <filter id="glowSoft" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="glowStrong" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="cableLive" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(34,211,238,0.10)" />
              <stop offset="35%" stopColor="rgba(34,211,238,0.95)" />
              <stop offset="70%" stopColor="rgba(34,211,238,0.18)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.10)" />
            </linearGradient>

            <linearGradient id="cableDim" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.09)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>

            {/* CAVI COLORATI DENTRO RACK */}
            <pattern id="rackCablesColor" width="26" height="22" patternUnits="userSpaceOnUse">
              <path d="M 0 6 C 8 0, 18 14, 26 8" stroke="rgba(34,197,94,0.65)" strokeWidth="2.2" fill="none" />
              <path d="M 0 14 C 10 6, 16 22, 26 14" stroke="rgba(239,68,68,0.62)" strokeWidth="2.2" fill="none" />
              <path d="M 0 10 C 8 16, 18 2, 26 10" stroke="rgba(245,158,11,0.55)" strokeWidth="2.0" fill="none" />
              <path d="M 0 18 C 9 12, 17 26, 26 18" stroke="rgba(59,130,246,0.50)" strokeWidth="2.0" fill="none" />
              <circle cx="6" cy="6" r="1.6" fill="rgba(34,197,94,0.95)" />
              <circle cx="20" cy="14" r="1.6" fill="rgba(239,68,68,0.95)" />
              <circle cx="14" cy="10" r="1.5" fill="rgba(245,158,11,0.95)" />
              <circle cx="22" cy="18" r="1.4" fill="rgba(59,130,246,0.90)" />
            </pattern>

            {/* glow “wow” unico dentro rack */}
            <filter id="rackWow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feColorMatrix
                in="b"
                type="matrix"
                values="
                  1 0 0 0 0
                  0 1 0 0 0
                  0 0 1 0 0
                  0 0 0 1 0
                "
                result="c"
              />
              <feMerge>
                <feMergeNode in="c" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* CAVI: partono dagli slot (nessun header in mezzo) */}
          {Array.from({ length: 5 }).map((_, i) => {
            const on = connected[i];
            const wrap = wrapRef.current?.getBoundingClientRect();
            const w = wrap?.width || 1;
            const h = wrap?.height || 1;
            const d = pathFor(i, w, h);

            return (
              <g key={`cable-${i}`} opacity={on ? 1 : 0.45}>
                <path d={d} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={10} strokeLinecap="round" opacity={0.55} />
                <path
                  d={d}
                  fill="none"
                  stroke={on ? "rgba(34,211,238,0.22)" : "rgba(255,255,255,0.09)"}
                  strokeWidth={7}
                  strokeLinecap="round"
                  opacity={on ? 0.95 : 0.55}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={on ? "url(#cableLive)" : "url(#cableDim)"}
                  strokeWidth={3}
                  strokeLinecap="round"
                  filter={on ? "url(#glowSoft)" : undefined}
                  style={{ animation: on ? "cableGlow 1.0s ease-in-out infinite" : "none" }}
                />
              </g>
            );
          })}

          {/* MAINFRAME CLUSTER (senza “palla blu”) */}
          {(() => {
            const wrap = wrapRef.current?.getBoundingClientRect();
const w = Math.max(1, wrap?.width || 1);
const h = Math.max(1, wrap?.height || 1);

const cx = w * CORE.x;
const cy = h * CORE.y;

// min/max per evitare valori troppo piccoli
const rackW = Math.max(52, Math.min(108, w * 0.23));
const rackH = Math.max(90, Math.min(170, h * 0.38));

// pad non deve mai rendere negativo l’interno
const pad = Math.max(6, Math.min(10, Math.floor(Math.min(rackW, rackH) * 0.14)));

const innerW = Math.max(1, rackW - pad * 2);
const innerH = Math.max(1, rackH - pad * 2);
            const gap = Math.min(18, w * 0.04);

            const leftX = cx - (rackW * 1.5 + gap);
            const midX = cx - rackW / 2;
            const rightX = cx + (rackW / 2 + gap);

            const topY = cy - rackH / 2;

            return (
              <g style={{ transformOrigin: `${cx}px ${cy}px`, animation: anyOn ? "float 2.8s ease-in-out infinite" : "none" }}>
                {/* base glow sotto */}
                {anyOn && (
                  <ellipse
                    cx={cx}
                    cy={cy + rackH * 0.35}
                    rx={rackW * 2.2}
                    ry={rackH * 0.45}
                    fill="rgba(34,211,238,0.10)"
                    filter="url(#glowStrong)"
                    style={{ animation: "breath 1.8s ease-in-out infinite" }}
                  />
                )}

                {/* racks */}
                {[leftX, midX, rightX].map((x, idx) => {
                  const isMid = idx === 1;
                  const pad = 10;
                  return (
                    <g key={idx} filter={anyOn ? "url(#rackWow)" : undefined} opacity={anyOn ? 1 : 0.55}>
                      <rect
                        x={x}
                        y={topY}
                        width={rackW}
                        height={rackH}
                        rx={18}
                        fill="rgba(18,26,38,0.95)"
                        stroke={anyOn ? "rgba(34,211,238,0.22)" : "rgba(255,255,255,0.08)"}
                      />
                      <rect
                        x={x + pad}
                        y={topY + pad}
                        width={innerW}
                        height={innerH}
                        rx={14}
                        fill="url(#rackCablesColor)"
                        opacity={anyOn ? 1 : 0.6}
                        style={{
                          animation: anyOn ? "rackPulse 1.4s ease-in-out infinite" : "none",
                        }}
                      />

                      {/* scan line “energia” dentro */}
                      {anyOn && (
                        <rect
                          x={x + pad}
                          y={topY + pad + (rackH - pad * 2) * 0.25}
                          width={rackW - pad * 2}
                          height={10}
                          rx={6}
                          fill="rgba(34,211,238,0.22)"
                          style={{
                            animation: isMid ? "scanFast 0.95s linear infinite" : "scan 1.25s linear infinite",
                          }}
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })()}

        </svg>

        <style jsx>{`
          @keyframes cableGlow {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-2px); }
          }
          @keyframes breath {
            0%, 100% { opacity: 0.45; }
            50% { opacity: 1; }
          }
          @keyframes rackPulse {
            0%, 100% { filter: saturate(1.1) brightness(1.0); opacity: 0.92; }
            50% { filter: saturate(1.45) brightness(1.15); opacity: 1; }
          }
          @keyframes scan {
            0% { transform: translateY(-24px); opacity: 0.0; }
            15% { opacity: 0.9; }
            85% { opacity: 0.9; }
            100% { transform: translateY(54px); opacity: 0.0; }
          }
          @keyframes scanFast {
            0% { transform: translateY(-28px); opacity: 0.0; }
            15% { opacity: 1.0; }
            85% { opacity: 1.0; }
            100% { transform: translateY(64px); opacity: 0.0; }
          }
        `}</style>
      </div>
    </div>
  );
}

// ---------- formatting helpers (mobile-friendly) ----------
const fmtHusd = (v: number | string, decimalsDesktop = 6, decimalsMobile = 2) => {
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "-";

  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;
  const d = isMobile ? decimalsMobile : decimalsDesktop;

  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: d,
  });
};

const fmtMHs = (v: number | string) => {
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "-";

  // per "Total Network Power" di solito 0 decimali bastano
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};



export default function Page() {
  const [tab, setTab] = useState<TabKey>("protocol");

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);

  const [busy, setBusy] = useState(false);

  const [authBusyStep, setAuthBusyStep] = useState<"connect" | "sign" | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const [popup, setPopup] = useState<PopupState>(null);

  const [showUsername, setShowUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");

  const [showStarterRtx, setShowStarterRtx] = useState(false);
const [starterStep, setStarterStep] = useState(0);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [lb, setLb] = useState<LeaderboardPublicResponse | null>(null);
  const [lbLoading, setLbLoading] = useState(false);

  const [market, setMarket] = useState<MarketConfig | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [openingPack, setOpeningPack] = useState<null | { pack: MarketPack }>(null);
  const [reveal, setReveal] = useState<null | { packName: string; reward: InventoryItem | any }>(null);

  const [inv, setInv] = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(false);

  const [rewardsV2, setRewardsV2] = useState<RewardsV2Response | null>(null);
  const [rewardsV2Loading, setRewardsV2Loading] = useState(false);

  const [protocolStatus, setProtocolStatus] = useState<ProtocolStatusResponse | null>(null);
  const [protocolLoading, setProtocolLoading] = useState(false);

  // ---- Rig (client-side for now) ----
  const [rig, setRig] = useState<(InventoryItem | null)[]>([null, null, null, null, null]);
  const [pickSlot, setPickSlot] = useState<number | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("hash42_token");
    const a = localStorage.getItem("hash42_address");
    if (t && a) {
      setToken(t);
      setAddress(a);
      fetchMe(t).catch(() => {});
      // load rig later when inventory comes in
    }
    fetchProtocolStatus().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
  if (!showStarterRtx) return;

  // sequenza "inizializzazione"
  setStarterStep(0);
  const t1 = setTimeout(() => setStarterStep(1), 350);
  const t2 = setTimeout(() => setStarterStep(2), 950);

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
  };
}, [showStarterRtx]);

  useEffect(() => {
    if (tab === "protocol") {
      fetchProtocolStatus().catch(() => {});
      const t = setInterval(() => fetchProtocolStatus().catch(() => {}), 20000);
      return () => clearInterval(t);
    }
  }, [tab]);

  useEffect(() => {
  if (tab === "leaderboard") {
    fetchLeaderboardPublic().catch(() => {});
    fetchProtocolStatus().catch(() => {});
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [tab]);

  useEffect(() => {
    if (!token) return;
    if (tab === "vault") fetchActivity(token).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  useEffect(() => {
    if (!token) return;
    if (tab === "marketplace") {
      fetchMarketConfig(token).catch(() => {});
      fetchInventory(token).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  // IMPORTANT: inventory also needed in Protocol for rig selection
  useEffect(() => {
    if (!token) return;
    if (tab === "protocol") {
      fetchInventory(token).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  const invSorted = useMemo(() => {
    const copy = [...inv];
    copy.sort((a, b) => {
      const dm = (b.mhps || 0) - (a.mhps || 0);
      if (dm !== 0) return dm;
      const ra = (a.rarity || "").toLowerCase();
      const rb = (b.rarity || "").toLowerCase();
      const order = ["legendary", "epic", "rare", "uncommon", "common"];
      const dr = order.indexOf(rb) - order.indexOf(ra);
      if (dr !== 0) return dr;
      return (b.userGpuId || 0) - (a.userGpuId || 0);
    });
    return copy;
  }, [inv]);

  const slotsUnlocked = clampSlots(Number(me?.slotsUnlocked || 1));

  const husdNano = Number(me?.husd?.vaultNano ?? 0) || 0;
const husdSymbol = "HUSD";

  const v2ClaimableNano = Number(rewardsV2?.claimableNano || "0");
  const canClaimV2 = v2ClaimableNano > 0;

  const rigPower = useMemo(() => rig.reduce((acc, g) => acc + Number(g?.mhps || 0), 0), [rig]);

  function showError(title: string, message: string) {
    setPopup({ title, message });
  }

  function rigStorageKey(addr?: string | null) {
    return addr ? `hash42_rig_${addr.toLowerCase()}` : "hash42_rig_unknown";
  }

  function loadRigFromStorage(addr?: string | null, inventory?: InventoryItem[]) {
    try {
      const raw = localStorage.getItem(rigStorageKey(addr));
      if (!raw) return null;
      const ids = JSON.parse(raw) as (number | null)[];
      if (!Array.isArray(ids)) return null;
      const invMap = new Map((inventory || []).map((g) => [g.userGpuId, g]));
      const slots: (InventoryItem | null)[] = [null, null, null, null, null].map((_, i) => {
        const id = ids[i];
        if (!id) return null;
        return invMap.get(id) || null;
      });
      return slots;
    } catch {
      return null;
    }
  }

  function saveRigToStorage(addr?: string | null, slots?: (InventoryItem | null)[]) {
    if (!addr) return;
    try {
      const ids = (slots || rig).map((g) => (g ? g.userGpuId : null));
      localStorage.setItem(rigStorageKey(addr), JSON.stringify(ids));
    } catch {
      // ignore
    }
  }

  // after inventory updates, try to hydrate rig selection from localStorage
  useEffect(() => {
    if (!token || !address) return;
    if (!inv.length) return;
    const loaded = loadRigFromStorage(address, inv);
    if (loaded) setRig(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inv.length, token, address]);

  async function connectWallet() {
    if (popup) setPopup(null);
    if (!(window as any).ethereum) {
      showError("MetaMask not found", "Please install MetaMask (or use a compatible wallet) to continue.");
      return;
    }

    
    const p = new BrowserProvider((window as any).ethereum);
    await p.send("eth_requestAccounts", []);
    const net = await p.getNetwork();
    if (Number(net.chainId) !== 8453) setToast("Switch to Base network (chainId 8453) for best experience.");
    const signer = await p.getSigner();
    const addr = await signer.getAddress();
    setProvider(p);
    setAddress(addr);
  }

  async function login() {
    if (!provider || !address) return;
    setBusy(true);
    if (popup) setPopup(null);
    try {
      const r1 = await fetch(`${API}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const n = await r1.json().catch(() => ({} as any));
if (!r1.ok) throw new Error(n?.error || `nonce_failed_${r1.status}`);

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(n.message);

      const r2 = await fetch(`${API}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, message: n.message, signature }),
      });
      const v = await r2.json().catch(() => ({} as any));
if (!r2.ok) throw new Error(v?.error || `verify_failed_${r2.status}`);

      localStorage.setItem("hash42_token", v.token);
      localStorage.setItem("hash42_address", address);
      setToken(v.token);

      await fetchMe(v.token);
      await fetchInventory(v.token);

      setToast("Logged in");
    } catch (e: any) {
      showError("Login failed", e?.message || "Login failed");
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
    setRewardsV2(null);
    setActivity([]);
    setInv([]);
    setRig([null, null, null, null, null]);
    setToast("Logged out");
    if (popup) setPopup(null);
  }

  async function fetchProtocolStatus() {
    setProtocolLoading(true);
    try {
      const r = await fetch(`${API}/protocol/status`);
      const j = (await r.json().catch(() => null)) as ProtocolStatusResponse | null;
      if (!r.ok || !j?.ok) return;
      setProtocolStatus(j);
    } finally {
      setProtocolLoading(false);
    }
  }

  async function fetchMe(t: string) {
    const r = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${t}` } });
    const j = await r.json().catch(() => null);
    if (!r.ok) return;
    setMe(j);

    fetchRewardsV2(t).catch(() => {});

   // Starter gift FIRST (one-time), then username
if (j && j.starterRtxGifted === false) {
  setShowStarterRtx(true);
  setStarterStep(0);
  setShowUsername(false);
  setUsernameDraft("");
} else if (!j?.username) {
  setShowUsername(true);
  setUsernameDraft("");
}
  }

  async function fetchRewardsV2(t: string) {
    setRewardsV2Loading(true);
    try {
      const r = await fetch(`${API}/rewards/v2`, { headers: { Authorization: `Bearer ${t}` } });
      const j = (await r.json().catch(() => null)) as RewardsV2Response | null;
      if (!r.ok || !j?.ok) return;
      setRewardsV2(j);
    } finally {
      setRewardsV2Loading(false);
    }
  }

  async function claimRewardsV2() {
    if (!token) return;
    setBusy(true);
    if (popup) setPopup(null);
    try {
      const r = await fetch(`${API}/rewards/v2/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = (await r.json().catch(() => ({}))) as RewardsV2ClaimResponse | any;
      if (!r.ok || !j?.ok) throw new Error(j.error || `v2_claim_failed_${r.status}`);

      const paid = Number(j?.paidNano || "0");
      setToast(paid > 0 ? `Claimed: +${fmtCredits8FromNano(paid)} ${husdSymbol}` : "Nothing to claim");

      await fetchMe(token);
      await fetchRewardsV2(token);
      if (tab === "vault") await fetchActivity(token);
    } catch (e: any) {
      showError("Claim failed", e?.message || "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  async function claimStarterRtx() {
  if (!token) return;
  setBusy(true);
  if (popup) setPopup(null);

  try {
    const r = await fetch(`${API}/rigs/claim-starter-rtx`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j?.ok) throw new Error(j.error || "starter_claim_failed");

    setToast("Starter GPU claimed");
    setShowStarterRtx(false);

    // refresh state
    await fetchMe(token);
    await fetchInventory(token);
    if (tab === "vault") await fetchActivity(token);
  } catch (e: any) {
    showError("Starter claim failed", e?.message || "Starter claim failed");
  } finally {
    setBusy(false);
  }
}

  async function fetchActivity(t: string) {
    setActivityLoading(true);
    try {
      const r = await fetch(`${API}/vault/activity`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) return;
      setActivity(Array.isArray(j?.items) ? j.items : []);
    } finally {
      setActivityLoading(false);
    }
  }

  async function fetchLeaderboardPublic() {
    setLbLoading(true);
    try {
      const r = await fetch(`${API}/leaderboard/public`);
      const j = await r.json().catch(() => null);
      if (!r.ok) return;
      setLb(j);
    } finally {
      setLbLoading(false);
    }
  }

  async function fetchMarketConfig(t: string) {
    setMarketLoading(true);
    try {
      const r = await fetch(`${API}/market/config`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) return;
      setMarket(j);
    } finally {
      setMarketLoading(false);
    }
  }

  async function fetchInventory(t: string) {
    setInvLoading(true);
    try {
      const r = await fetch(`${API}/inventory`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const j = (await r.json().catch(() => null)) as InventoryResponse | null;
      if (!r.ok) return;
      setInv(Array.isArray(j?.items) ? j.items : []);
    } finally {
      setInvLoading(false);
    }
  }

  async function buySlotWithCredits(slot: number) {
    if (!token) return;
    setBusy(true);
    if (popup) setPopup(null);
    try {
      const r = await fetch(`${API}/market/buy-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slot }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "buy_slot_failed");

      setToast(j.alreadyUnlocked ? "Already unlocked" : `Slot ${slot} unlocked`);
      await fetchMe(token);
      if (tab === "vault") await fetchActivity(token);
    } catch (e: any) {
      showError("Buy slot failed", e?.message || "Buy slot failed");
    } finally {
      setBusy(false);
    }
  }

  async function openPack(pack: MarketPack) {
    if (!token) return;
    setOpeningPack({ pack });
    if (popup) setPopup(null);

    setTimeout(async () => {
      try {
        const r = await fetch(`${API}/market/open-pack`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ packKey: pack.key }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "open_pack_failed");

        setReveal({ packName: pack.name, reward: j.reward });
        setToast("Pack opened");
        await fetchMe(token);
        await fetchInventory(token);
        if (tab === "vault") await fetchActivity(token);
      } catch (e: any) {
        showError("Open pack failed", e?.message || "Open pack failed");
      } finally {
        setOpeningPack(null);
      }
    }, 650);
  }

  async function saveUsername() {
    if (!token) return;
    setBusy(true);
    if (popup) setPopup(null);
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
      showError("Username error", e?.message || "Username failed");
    } finally {
      setBusy(false);
    }
  }

  function setRigSlot(slotIdx: number, gpu: InventoryItem | null) {
    setRig((prev) => {
      const next = [...prev];
      next[slotIdx] = gpu;
      if (gpu) {
        for (let i = 0; i < next.length; i++) {
          if (i !== slotIdx && next[i]?.userGpuId === gpu.userGpuId) next[i] = null;
        }
      }
      saveRigToStorage(address, next);
      return next;
    });
  }

  function BottomNav() {
    const item = (key: TabKey, label: string) => {
      const active = tab === key;
      return (
        <button
          onClick={() => setTab(key)}
          className={["flex-1 py-3 text-xs font-semibold", active ? "text-orange-400" : "text-zinc-400"].join(" ")}
        >
          {label}
        </button>
      );
    };

    return (
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black/90 backdrop-blur z-[9999]">
        <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black/90 backdrop-blur z-[9999] isolate"></div>
        <div className="max-w-md mx-auto flex">
          {item("protocol", "Protocol")}
          {item("marketplace", "Marketplace")}
          {item("leaderboard", "Leaderboard")}
          {item("vault", "Vault")}
        </div>
      </div>
    );
  }

  function RigPickerModal() {
    if (pickSlot === null) return null;
    const slotLocked = pickSlot >= slotsUnlocked;

    return (
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-[800]"
        onClick={() => setPickSlot(null)}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-zinc-400 text-xs">Select GPU</div>
              <div className="mt-1 text-lg font-extrabold">Rig Slot {pickSlot + 1}</div>
              {slotLocked && <div className="text-orange-300 text-xs mt-1">This slot is locked.</div>}
            </div>
            <button
              onClick={() => setPickSlot(null)}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              disabled={slotLocked}
              onClick={() => {
                setRigSlot(pickSlot, null);
                setPickSlot(null);
              }}
              className={[
                "flex-1 py-3 rounded-xl border text-sm",
                slotLocked
                  ? "border-zinc-800 bg-black/20 text-zinc-600 cursor-not-allowed"
                  : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800",
              ].join(" ")}
            >
              Clear Slot
            </button>
            <button
              onClick={() => {
                if (slotLocked) return;
                const used = new Set(rig.filter(Boolean).map((g) => g!.userGpuId));
                const best = invSorted.find((g) => !used.has(g.userGpuId));
                if (best) setRigSlot(pickSlot, best);
                setPickSlot(null);
              }}
              disabled={slotLocked || invSorted.length === 0}
              className={[
                "flex-1 py-3 rounded-xl font-extrabold text-sm",
                slotLocked || invSorted.length === 0
                  ? "bg-orange-500/15 text-orange-200/60 border border-orange-500/20 cursor-not-allowed"
                  : "bg-orange-500 text-black",
              ].join(" ")}
            >
              Auto Best
            </button>
          </div>

          <div className="mt-3 max-h-[55vh] overflow-y-auto pr-1 overscroll-contain space-y-2">
            {invLoading ? (
              <>
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
              </>
            ) : invSorted.length === 0 ? (
              <div className="text-zinc-500 text-sm">No GPUs available yet. Open packs in Marketplace.</div>
            ) : (
              invSorted.map((g) => {
                const selectedHere = rig[pickSlot]?.userGpuId === g.userGpuId;
                const usedElsewhere = rig.some((x, idx) => idx !== pickSlot && x?.userGpuId === g.userGpuId);
                const disabled = slotLocked || usedElsewhere;

                return (
                  <button
                    key={g.userGpuId}
                    disabled={disabled}
                    onClick={() => {
                      setRigSlot(pickSlot, g);
                      setPickSlot(null);
                    }}
                    className={[
                      "w-full rounded-xl border p-3 text-left flex gap-3 items-center",
                      selectedHere
                        ? "border-orange-500/60 bg-orange-500/10"
                        : disabled
                        ? "border-zinc-800 bg-black/20 opacity-60 cursor-not-allowed"
                        : "border-zinc-800 bg-black/30 hover:bg-zinc-900",
                    ].join(" ")}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 bg-black shrink-0">
                      <img
                        src={g.imagePath || "/assets/rtx-classic.webp"}
                        alt={g.name || "GPU"}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold truncate">{g.name || `GPU #${g.gpuId}`}</div>
                        <div className={`text-[11px] font-bold ${rarityColor(g.rarity)}`}>
                          {(g.rarity || "common").toUpperCase()}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{g.mhps} MH/s</div>
                      {usedElsewhere && (
                        <div className="text-[11px] text-orange-300 mt-1">Already used in another slot</div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  function ProtocolTab() {

    
    const poolNano = Number(protocolStatus?.poolNano || "0");
    const reserveNano = Number(protocolStatus?.reserveNano || "0");
    const allocNano = Number(protocolStatus?.allocatedUnclaimedNano || "0");
    const availNano = Number(protocolStatus?.availableNano || "0");
    const totalNetworkPower = Number(protocolStatus?.totalPower || "0"); // MH/s
    // Mini visual scaling (420 max per GPU * 5 slots realistic per user, ma network può essere grande)
// Facciamo una scala dinamica soft cap a 100k per la barra visuale
const networkPowerScaleMax = 10000; 
const networkPowerPercent = Math.min(
  100,
  totalNetworkPower > 0
    ? (totalNetworkPower / networkPowerScaleMax) * 100
    : 0
);

    const rigDisplayPower = rigPower; // 0 se rig vuoto
const effectivePower = rigPower > 0 ? rigPower : Number(me?.powerScore || rewardsV2?.power || 0);

    const rigWrapRef = useRef<HTMLDivElement | null>(null);
    const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);



    // Estimated next payout (requires totalPower)
    const totalPower = Number(protocolStatus?.totalPower || "0");
    const estNextNano =
      totalPower > 0 && effectivePower > 0 ? Math.floor((availNano * effectivePower) / totalPower) : null;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-zinc-400 text-xs">Hash42 Protocol</div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight">
                {protocolLoading ? "..." : "Active Pool"}
              </div>
              <div className="text-zinc-500 text-xs mt-1">
                Updated: {protocolStatus?.serverNow ? fmtWhen(protocolStatus.serverNow) : "—"}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="mb-3">
              <NextDistributionCountdown serverNowISO={protocolStatus?.serverNow} />
              </div>
            </div>
          </div>
<div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
  <div className="flex items-center justify-between">
    <div className="text-zinc-400 text-xs tracking-wide">
      TOTAL NETWORK POWER
    </div>

    <div className="flex items-center gap-2">
      <div className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/20 text-orange-500 font-bold">
        LIVE
      </div>
      <div className="font-extrabold text-cyan-500">
        {protocolLoading ? "..." : totalNetworkPower}{" "} MH/s
      </div>
    </div>
  </div>

  {/* Energy Flow Bar (premium) */}
<div className="mt-2">
  <div className="h-2.5 rounded-full bg-zinc-900/80 overflow-hidden relative border border-zinc-800">
    {/* glow always full */}
    <div className="absolute inset-0">
      <div className="w-full h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-35 blur-[2px] animate-pulse" />
    </div>

    {/* subtle moving shine */}
    <div className="absolute inset-0 opacity-20">
      <div className="w-1/3 h-full bg-white/30 blur-md animate-[shine_1.8s_linear_infinite]" />
    </div>

    {/* fill */}
    <div
      className="relative h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400"
      style={{
        width: `${Math.max(2, networkPowerPercent)}%`, // minimo visibile
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

  <div className="text-[11px] text-zinc-500 mt-2">
    Real-time aggregated hash power contributing to revenue distribution.
  </div>
</div>


          <div className="mt-4 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Pool</span>
              <span className="font-extrabold">
                {fmtCredits8FromNano(poolNano)} {husdSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Reserve</span>
              <span className="font-bold">
                {fmtCredits8FromNano(reserveNano)} {husdSymbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Allocated</span>
              <span className="font-bold">
                {fmtCredits8FromNano(allocNano)} {husdSymbol}
              </span>
            </div>
            

            
            <div className="flex justify-between">
              <span className="text-zinc-400">Available</span>
              <span className="font-extrabold text-orange-400">
                {fmtCredits8FromNano(availNano)} {husdSymbol}
              </span>
            </div>

            <div className="pt-2 mt-2 border-t border-zinc-800 flex justify-between">
                
              <span className="text-zinc-400">Est. next payout</span>
              <span className="font-extrabold text-cyan-300">
                {estNextNano === null ? "—" : `${fmtCredits8FromNano(estNextNano)} ${husdSymbol}`}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Estimate uses: Available × (Your Power / Total Power). Requires server totalPower.
            </div>
          </div>
        </div>

        {/* Rig */}
<div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="font-bold text-lg">Your Rig</div>
      <div className="text-zinc-400 text-sm mt-1">
        Choose GPUs for your slots. Power is calculated from selected MH/s.
      </div>
    </div>

    <div className="text-right">
      <div className="text-zinc-400 text-xs">Rig Power</div>
      <div className="text-2xl font-extrabold">{rigDisplayPower}</div>
      <div className="text-zinc-500 text-xs">MH/s (beta)</div>
    </div>
  </div>

  <div className="mt-3">
    <button
      onClick={() => token && fetchInventory(token)}
      disabled={!token || busy || invLoading}
      className="w-full text-xs px-3 py-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
    >
      {invLoading ? "..." : "Sync GPUs"}
    </button>
  </div>

  {/* SLOT GRID + OVERLAY CAVI (partono dagli slot) */}
<div className="mt-4 relative pb-[100px] sm:pb-[100px] isolate" ref={rigWrapRef}>
  {/* overlay assoluto che parte dagli slot e va al mainframe */}
  <RigWiringMainframe
    rig={rig}
    slotsUnlocked={slotsUnlocked}
    loggedIn={!!token}
    wrapRef={rigWrapRef}
    slotRefs={slotRefs}
  />

  <div className="grid grid-cols-5 gap-0.3 relative z-[2]">
    {Array.from({ length: 5 }).map((_, i) => {
      const locked = i >= slotsUnlocked;
      const g = rig[i];
      return (
        <button
          key={i}
          ref={(el) => {
            slotRefs.current[i] = el;
          }}
          disabled={!token || locked}
          onClick={() => setPickSlot(i)}
          className={[
            "rounded-xl border p-2 text-left min-h-[86px] relative overflow-hidden",
            locked
              ? "border-zinc-800 bg-black/20 text-zinc-600 cursor-not-allowed"
              : "border-zinc-800 bg-black/30 hover:bg-zinc-900",
          ].join(" ")}
          title={locked ? "Locked slot" : "Select GPU"}
        >
          <div className="text-[10px] text-zinc-500">S{i + 1}</div>
          {g ? (
            <div className="mt-1">
              <div className="w-full h-10 rounded-lg overflow-hidden border border-zinc-800 bg-black">
                <img
                  src={g.imagePath || "/assets/rtx-classic.webp"}
                  alt={g.name || "GPU"}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="mt-1 text-[10px] text-zinc-300 font-semibold truncate">
                {g.mhps}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-[10px] text-zinc-500">
              {locked ? "LOCKED" : "EMPTY"}
            </div>
          )}
        </button>
      );
    })}
  </div>

  {/* Spacer reale: rende alta l’area per mainframe/cavi (evita lo “schiacciamento”) */}
  <div className="h-[100px] sm:h-[100px]" aria-hidden="true" />
</div>

  <div className="text-zinc-500 text-xs mt-3">
    Slots unlocked: <span className="text-zinc-200 font-semibold">{slotsUnlocked}/5</span>. Configure in Marketplace.
  </div>
</div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-bold text-lg">Your Position</div>
          <div className="text-zinc-400 text-sm mt-1">
            Connect + sign to see your claimable rewards and wallet-linked stats.
          </div>

          {!token ? (
            <div className="mt-3 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm text-zinc-300">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-zinc-400 text-xs">Wallet</div>
                  <div className="font-mono">{address ? shortAddr(address) : "Not connected"}</div>
                </div>
                {!address ? (
                  <button
                    onClick={connectWallet}
                    className="px-3 py-2 rounded-lg bg-orange-500 text-black font-extrabold text-xs"
                  >
                    Connect
                  </button>
                ) : (
                  <button
                    onClick={login}
                    disabled={busy}
                    className="px-3 py-2 rounded-lg bg-orange-500 text-black font-extrabold text-xs disabled:opacity-50"
                  >
                    {busy ? "..." : "Sign & Enter"}
                  </button>
                )}
              </div>

              <div className="text-zinc-500 text-xs mt-3">
                No transaction. You only sign a message to create a session token.
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Power</span>
                <span className="font-extrabold">{effectivePower}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Est. next payout</span>
                <span className="font-extrabold text-cyan-300">
                  {estNextNano === null ? "—" : `${fmtCredits8FromNano(estNextNano)} ${husdSymbol}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-400">Claimable</span>
                <span className="font-extrabold text-cyan-300">
                  {rewardsV2Loading ? "..." : fmtCredits8FromNano(v2ClaimableNano)} {husdSymbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Vault</span>
                <span className="font-bold">
                  {fmtCredits2FromNano(husdNano)} {husdSymbol}
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => token && fetchMe(token)}
                  disabled={busy}
                  className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-sm"
                >
                  Sync
                </button>
                <button
                  onClick={claimRewardsV2}
                  disabled={busy || !canClaimV2}
                  className={[
                    "flex-1 py-3 rounded-xl font-extrabold border text-sm",
                    canClaimV2
                      ? "bg-cyan-400 text-black border-cyan-400"
                      : "bg-cyan-400/10 text-cyan-200 border-cyan-400/20",
                    "disabled:opacity-100 disabled:cursor-not-allowed",
                  ].join(" ")}
                >
                  Claim
                </button>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={logout}
                  className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm"
                >
                  Logout
                </button>
              </div>

              <div className="text-zinc-500 text-xs mt-3">
                Claim adds to Vault HUSD (beta). Marketplace + Vault require login.
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-bold">How it works</div>
          <div className="text-zinc-500 text-xs mt-2 leading-relaxed">
            Public data is visible to everyone. Your personal position (claimable, vault, power) is linked to your wallet and
            requires a signed login (no on-chain tx).
          </div>
        </div>

        <RigPickerModal />
      </div>
    );
  }

  function MarketplaceTab() {
    if (!token) {
      return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-bold text-lg">Marketplace</div>
          <div className="text-zinc-400 text-sm mt-1">Connect and sign to access packs and slot purchases.</div>

          <div className="mt-4 space-y-2">
            {!address ? (
              <button onClick={connectWallet} className="w-full py-4 rounded-2xl bg-orange-500 text-black font-extrabold">
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={login}
                disabled={busy}
                className="w-full py-4 rounded-2xl bg-orange-500 text-black font-extrabold disabled:opacity-50"
              >
                {busy ? "Signing..." : "Sign & Enter"}
              </button>
            )}
          </div>
        </div>
      );
    }

    const packs = market?.packs || [];
    const slotPrices = market?.slotPricesCredits || {};

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-xs">Vault Credits</div>
              <div className="mt-1 text-2xl font-extrabold">
                {fmtCredits2FromNano(husdNano)}{" "}
                <span className="text-zinc-400 text-sm font-semibold">{husdSymbol}</span>
              </div>
              <div className="text-zinc-500 text-xs mt-1">Use credits to unlock slots and open packs (beta).</div>
            </div>

            <button
              onClick={() => token && fetchMe(token)}
              disabled={busy}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
            >
              Sync
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-bold text-lg">Unlock Slots</div>
          <div className="text-zinc-400 text-sm mt-1">Unlock in order.</div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {[2, 3, 4, 5].map((s) => {
              const price = Number(slotPrices[String(s)] || 0);
              const locked = s > slotsUnlocked + 1;
              const already = s <= slotsUnlocked;
              const disabled = busy || locked || already;

              return (
                <button
                  key={s}
                  disabled={disabled}
                  onClick={() => buySlotWithCredits(s)}
                  className={[
                    "rounded-xl border p-3 text-left",
                    already
                      ? "border-zinc-800 bg-black/30 text-zinc-500"
                      : locked
                      ? "border-orange-500/20 bg-orange-500/10 text-orange-200/60"
                      : "border-orange-500/40 bg-orange-500/15 hover:bg-orange-500/20 text-orange-100",
                    "disabled:cursor-not-allowed",
                  ].join(" ")}
                >
                  <div className="font-extrabold">Slot {s}</div>
                  <div className="text-xs opacity-80 mt-1">
                    {already ? "Unlocked" : locked ? "Unlock previous first" : `${price} ${husdSymbol}`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">Packs</div>
              <div className="text-zinc-400 text-sm">Open packs to receive GPUs.</div>
            </div>
            <button
              onClick={() => token && fetchMarketConfig(token)}
              disabled={busy || marketLoading}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
            >
              {marketLoading ? "..." : "Refresh"}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {packs.map((p) => {
              const priceNano = Number(p.priceCredits || 0) * 1e8;
              const afford = husdNano >= priceNano;
              return (
                <button
                  key={p.key}
                  disabled={busy || !afford}
                  onClick={() => openPack(p)}
                  className={[
                    "rounded-xl border border-zinc-800 bg-black/30 hover:bg-zinc-900 p-3 text-left",
                    !afford ? "opacity-60 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold">{p.name}</div>
                    <div className="text-xs text-orange-300 font-bold">
                      {p.priceCredits} {husdSymbol}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Odds: C {Math.round((p.odds.common || 0) * 100)}% • U{" "}
                    {Math.round((p.odds.uncommon || 0) * 100)}% • R{" "}
                    {Math.round((p.odds.rare || 0) * 100)}% • E{" "}
                    {Math.round((p.odds.epic || 0) * 100)}% • L{" "}
                    {Math.round((p.odds.legendary || 0) * 100)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-lg">Inventory</div>
            <button
              onClick={() => token && fetchInventory(token)}
              disabled={busy || invLoading}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
            >
              {invLoading ? "..." : "Sync"}
            </button>
          </div>

          <div className="mt-3 space-y-2 max-h-[55vh] overflow-y-auto pr-1 overscroll-contain">
            {invLoading ? (
              <>
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
              </>
            ) : inv.length === 0 ? (
              <div className="text-zinc-500 text-sm">No GPUs yet.</div>
            ) : (
              invSorted.map((g) => {
                const when = g.acquiredAt || g.createdAt;
                return (
                  <div key={g.userGpuId} className="rounded-xl border border-zinc-800 bg-black/30 p-3 flex gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-zinc-800 bg-black">
                      <img
                        src={g.imagePath || "/assets/rtx-classic.webp"}
                        alt={g.name || "GPU"}
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold truncate">{g.name || `GPU #${g.gpuId}`}</div>
                        <div className={`text-xs font-bold ${rarityColor(g.rarity)}`}>
                          {(g.rarity || "common").toUpperCase()}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {g.mhps} MH/s • {fmtWhen(when)}
                        {g.source ? ` • ${g.source}` : ""}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-zinc-500 text-xs mt-3">Tip: configure your Rig in Protocol tab (slots) to see your power.</div>
        </div>
      </div>
    );
  }

  function LeaderboardTab() {
    
    const totalNetworkPower = Number(protocolStatus?.totalPower || "0");
    const networkPowerScaleMax = 10000;
const networkPowerPercent = Math.min(
  100,
  totalNetworkPower > 0 ? (totalNetworkPower / networkPowerScaleMax) * 100 : 0
);
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
  <div className="flex items-start justify-between gap-3">
    {/* LEFT */}
    <div className="flex-1 min-w-0">
      <div className="font-bold text-lg">Leaderboard</div>
      <div className="text-zinc-400 text-sm">
        Public leaderboard (Power Score).
      </div>

      <div className="mt-2 text-lg">
        <span className="text-zinc-400">Total network power: </span>
        <span className="text-cyan-500 font-bold">{totalNetworkPower} MH/s</span>
      </div>

      {/* BAR SECTION (outside the text-sm block) */}
      <div className="mt-3 w-full">
  <div className="text-[11px] text-zinc-500 mb-2">Live network power signal</div>

  {/* OUTER: no overflow-hidden (così il glow può vivere) */}
  <div className="relative w-full h-2.5 rounded-full border border-zinc-800 bg-zinc-900/80">

    {/* INNER MASK: qui facciamo il clipping, non fuori */}
    <div className="absolute inset-0 rounded-full overflow-hidden">

      {/* 1) TRACK: gradiente pieno sempre visibile */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-25" />

      {/* 2) SOFT GLOW: pieno, leggero, sempre */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 opacity-25 animate-pulse" />

      {/* 3) SHINE che scorre */}
      <div className="absolute inset-0 opacity-18">
        <div className="w-1/3 h-full bg-white/35 blur-md animate-[shine_1.8s_linear_infinite]" />
      </div>

      {/* 4) FILL percentuale sopra */}
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400"
        style={{ width: `${Math.max(2, networkPowerPercent)}%` }}
      />
    </div>

    {/* GLOW esterno (fuori dal mask) */}
    <div className="pointer-events-none absolute inset-0 rounded-full"
         style={{ boxShadow: "0 0 16px rgba(249,115,22,0.28)" }} />
  </div>

  <style jsx>{`
    @keyframes shine {
      0% { transform: translateX(-40%); }
      100% { transform: translateX(340%); }
    }
  `}</style>
</div>
    </div>

    {/* RIGHT */}
    <button
      onClick={() => fetchLeaderboardPublic().catch(() => {})}
      disabled={busy || lbLoading}
      className="shrink-0 text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
    >
      {lbLoading ? "..." : "Refresh"}
    </button>
  </div>
</div>


          



        

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-bold mb-3">Top Players</div>

          {lbLoading ? (
            <div className="space-y-2">
              <div className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
              <div className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
              <div className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
              <div className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
            </div>
          ) : !lb?.items?.length ? (
            <div className="text-zinc-500 text-sm">No data yet.</div>
          ) : (
            <div className="space-y-2">
              {lb.items.slice(0, 10).map((it) => (
                <div key={it.userId} className="rounded-xl border border-zinc-800 bg-black/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-orange-400">#{it.rank}</div>
                    <div className="text-xs text-zinc-500">Claimed: {fmtHusd8FromNano(it.totalClaimedNano)} HUSD</div>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="font-bold">{it.username || shortAddr(it.wallet)}</div>
                    <div className="text-sm font-extrabold">
                      {it.powerScore} <span className="text-zinc-500 font-semibold text-xs">POWER</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-zinc-500 text-xs mt-3">Public: wallet is displayed if username is not set.</div>
        </div>
      </div>
    );
  }

  function VaultTab() {
    if (!token) {
      return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="font-bold text-lg">Vault</div>
          <div className="text-zinc-400 text-sm mt-1">Connect and sign to view your vault and activity.</div>

          <div className="mt-4 space-y-2">
            {!address ? (
              <button onClick={connectWallet} className="w-full py-4 rounded-2xl bg-orange-500 text-black font-extrabold">
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={login}
                disabled={busy}
                className="w-full py-4 rounded-2xl bg-orange-500 text-black font-extrabold disabled:opacity-50"
              >
                {busy ? "Signing..." : "Sign & Enter"}
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-400 text-xs">Vault Credits</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {fmtCredits2FromNano(husdNano)}{" "}
            <span className="text-zinc-400 text-sm font-semibold">{husdSymbol}</span>
          </div>

          <div className="text-zinc-500 text-xs mt-2">Beta: Vault is locked (no withdrawals).</div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => token && fetchMe(token)}
              disabled={busy}
              className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-sm"
            >
              Sync
            </button>
            <button
              onClick={() => token && fetchActivity(token)}
              disabled={busy || activityLoading}
              className="flex-1 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm"
            >
              {activityLoading ? "Loading..." : "Activity"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-400 text-xs">V2 Claimable</div>
          <div className="mt-1 text-2xl font-extrabold">
            {rewardsV2Loading ? "..." : fmtCredits8FromNano(v2ClaimableNano)}{" "}
            <span className="text-zinc-400 text-sm font-semibold">{husdSymbol}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => token && fetchRewardsV2(token)}
              disabled={busy || rewardsV2Loading}
              className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-sm"
            >
              {rewardsV2Loading ? "..." : "Sync"}
            </button>
            <button
              onClick={claimRewardsV2}
              disabled={busy || !canClaimV2}
              className={[
                "flex-1 py-3 rounded-xl font-extrabold border text-sm",
                canClaimV2 ? "bg-cyan-400 text-black border-cyan-400" : "bg-cyan-400/10 text-cyan-200 border-cyan-400/20",
                "disabled:opacity-100 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              Claim
            </button>
          </div>
        </div>

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

          <button
            onClick={logout}
            className="mt-3 w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm"
          >
            Logout
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold">Activity</div>
            <div className="text-xs text-zinc-500">{activity.length ? `${activity.length} items` : ""}</div>
          </div>

          <div className="mt-3 space-y-2">
            {activityLoading ? (
              <>
                <div className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
                <div className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
                <div className="h-12 rounded-xl bg-zinc-900 animate-pulse" />
              </>
            ) : activity.length === 0 ? (
              <div className="text-zinc-500 text-sm">No activity yet.</div>
            ) : (
              activity.map((it) => {
                const sign = it.amountNano >= 0 ? "+" : "-";
                return (
                  <div key={it.id} className="rounded-xl border border-zinc-800 bg-black/30 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-zinc-200">
                        {sign}
                        {fmtCredits2FromNano(it.amountNano)} {husdSymbol}
                      </div>
                      <div className="text-xs text-zinc-500">{fmtWhen(it.createdAt)}</div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{it.note || "ledger"}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-zinc-500 text-xs mt-3">Activity tracks all Vault HUSD movements.</div>
        </div>
      </div>
    );
  }

  // Header button: SEMPRE visibile, fa Login o Logout
  function HeaderAuthButton() {
    if (token) {
      return (
        <button
          onClick={logout}
          className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
          title="Logout"
        >
          Logout
        </button>
      );
    }

    const canSign = !!address && !!provider;

    return (
      <button
        onClick={() => {
          if (!address) return connectWallet();
          if (!canSign) return connectWallet();
          return login();
        }}
        disabled={busy}
        className="text-xs px-3 py-2 rounded-lg border border-orange-500/40 bg-orange-500/15 hover:bg-orange-500/20 text-orange-100 disabled:opacity-50"
        title={address ? "Sign & Enter" : "Connect Wallet"}
      >
        {address ? (busy ? "..." : "Login") : "Login"}
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto p-4 pb-24">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-orange-500 font-extrabold text-xl">Hash42</div>
            <div className="text-zinc-400 text-xs">Protocol Interface (Beta)</div>
          </div>

          <div className="flex items-center gap-2">
  {/* Login/Logout sempre visibile e stateful */}
  <button
    onClick={() => {
      if (token) return logout();
      if (!address) return connectWallet();
      return login();
    }}
    disabled={busy}
    className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
    title={token ? "Logout" : !address ? "Connect wallet" : "Sign & Enter"}
  >
    {busy ? "Signing..." : token ? "Logout" : !address ? "Connect" : "Sign & Enter"}
  </button>

  <button
    onClick={() => fetchProtocolStatus().catch(() => {})}
    className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
    disabled={busy || protocolLoading}
    title="Refresh public protocol status"
  >
    {protocolLoading ? "..." : "Refresh"}
  </button>
</div>
        </div>

        {/* HERO SEMPRE VISIBILE */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <img
              src="/assets/hero-hash42-miningapp.webp"
              alt="Hash42 Protocol"
              className="w-full h-[28vh] object-cover"
              draggable={false}
            />
          </div>
        </div>

        <div className="space-y-4 mt-4">
  {tab === "protocol" && <ProtocolTab />}
  {tab === "marketplace" && <MarketplaceTab />}
  {tab === "leaderboard" && <LeaderboardTab />}
  {tab === "vault" && <VaultTab />}
</div>

        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm">
            {toast}
          </div>
        )}

        {token && showStarterRtx && (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
    <div className="w-full max-w-md rounded-2xl border border-orange-500/30 bg-zinc-950 p-4 overflow-hidden relative">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative">
        <div className="text-xs text-orange-300/80 font-semibold tracking-wide">WELCOME DROP</div>
        <div className="mt-1 text-xl font-extrabold">You received your first GPU</div>
        <div className="text-zinc-400 text-sm mt-1">RTX Classic • 1 MH/s</div>

        <div
          className={[
            "mt-4 rounded-xl border border-zinc-800 bg-black/30 overflow-hidden",
            starterStep >= 1 ? "animate-[pop_400ms_ease-out_1]" : "",
          ].join(" ")}
        >
          <img
            src="/assets/rtx-classic.webp"
            alt="RTX Classic"
            className="w-full h-56 object-cover"
            draggable={false}
          />
        </div>

        <div className="mt-4 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Status</span>
            <span className={starterStep >= 2 ? "text-orange-400 font-bold" : "text-zinc-500"}>
              {starterStep >= 2 ? "Ready" : "Initializing..."}
            </span>
          </div>

          <div className="mt-2 h-2 w-full rounded-full bg-zinc-900 overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all"
              style={{ width: `${starterStep === 0 ? 25 : starterStep === 1 ? 65 : 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={claimStarterRtx}
          disabled={busy || starterStep < 2}
          className={[
            "mt-4 w-full py-3 rounded-xl font-extrabold border",
            starterStep >= 2
              ? "bg-orange-500 text-black border-orange-500"
              : "bg-orange-500/20 text-orange-200 border-orange-500/30",
            "disabled:opacity-100 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          {starterStep >= 2 ? "Claim GPU" : "Loading..."}
        </button>

        <div className="text-zinc-500 text-xs mt-3">
          This is a one-time gift. It will stay linked to your wallet.
        </div>
      </div>
    </div>
  </div>
)}

        {token && showUsername && ! showStarterRtx && (
          <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="font-bold text-lg">Set username</div>
              <div className="text-zinc-400 text-sm mt-1">3–16 chars, lowercase, numbers, underscore.</div>

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

        {token && openingPack && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
            <div className="w-full max-w-md rounded-2xl border border-orange-500/30 bg-zinc-950 p-4 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="relative">
                <div className="text-xs text-orange-300/80 font-semibold tracking-wide">OPENING</div>
                <div className="mt-1 text-xl font-extrabold">{openingPack.pack.name}</div>
                <div className="mt-4 h-40 rounded-xl border border-zinc-800 bg-black/30 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-4 border-orange-500/30 border-t-orange-500 animate-spin" />
                </div>
                <div className="text-zinc-500 text-xs mt-3">Decrypting drop...</div>
              </div>
            </div>
          </div>
        )}

        {token && reveal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50">
            <div className="w-full max-w-md rounded-2xl border border-orange-500/30 bg-zinc-950 p-4 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl" />

              <div className="relative">
                <div className="text-xs text-orange-300/80 font-semibold tracking-wide">REVEAL</div>
                <div className="mt-1 text-xl font-extrabold">{reveal.packName}</div>

                <div className="mt-4 rounded-xl border border-zinc-800 bg-black/30 overflow-hidden">
                  <img
                    src={reveal.reward?.imagePath || "/assets/rtx-classic.webp"}
                    alt={reveal.reward?.name || "GPU"}
                    className="w-full h-56 object-cover"
                    draggable={false}
                  />
                </div>

                <div className="mt-3 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold truncate">{reveal.reward?.name || `GPU #${reveal.reward?.gpuId}`}</div>
                    <div className={`text-xs font-bold ${rarityColor(reveal.reward?.rarity || "common")}`}>
                      {(reveal.reward?.rarity || "common").toUpperCase()}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">{Number(reveal.reward?.mhps || 1)} MH/s</div>
                </div>

                <button
                  onClick={() => setReveal(null)}
                  className="mt-4 w-full py-3 rounded-xl bg-orange-500 text-black font-extrabold"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />

      <ErrorModal
        open={!!popup}
        title={popup?.title || "Error"}
        message={popup?.message || "Something went wrong."}
        onClose={() => setPopup(null)}
      />
    </main>
  );
}