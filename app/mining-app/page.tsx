// app/mining-app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { BrowserProvider } from "ethers";

const API = process.env.NEXT_PUBLIC_API_BASE!;

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

type LeaderboardResponse = {
  ok: boolean;
  metric: "power_score";
  items: LeaderboardItem[];
  me: { userId: number; rank: number };
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

type RigSlotGpu = {
  gpuId: number;
  name: string;
  rarity: string;
  mhps: number;
  imagePath: string;
};

type RigSlot = {
  slotIndex: number;
  userGpuId: number | null;
  gpu: RigSlotGpu | null;
};

type RigSlotsResponse = {
  ok: boolean;
  slotsUnlocked: number;
  slots: RigSlot[];
};

type MeResponse = {
  address: string;
  username?: string | null;
  slotsUnlocked?: number;
  starterRtxGifted?: boolean;
  powerScore?: number;
  inventoryPowerScore?: number;
  // ✅ single spendable currency (Vault Credits)
  credits?: {
    symbol: string; // "CREDITS"
    balanceNano: number; // spendable
    nanoPerUnit?: string;
  };
  husd?: {
    symbol: string;
    balanceNano: number;
    capNano: number;
    vaultNano?: number; // still returned for compatibility; equals credits.balanceNano
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
    sessionSeconds?: number;
  };
};

type TabKey = "mining" | "marketplace" | "leaderboard" | "vault";

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

export default function Page() {
  const [tab, setTab] = useState<TabKey>("mining");

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [me, setMe] = useState<MeResponse | null>(null);

  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [popup, setPopup] = useState<PopupState>(null);

  const [showUsername, setShowUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");

  const [uiMiningBalanceNano, setUiMiningBalanceNano] = useState<number>(0);

  const [slotModal, setSlotModal] = useState<null | { slotIndex: number; payoutHusd: number; priceUsd: number }>(null);

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const [showStarterRtx, setShowStarterRtx] = useState(false);
  const [starterStep, setStarterStep] = useState<0 | 1 | 2>(0);

  const [lb, setLb] = useState<LeaderboardResponse | null>(null);
  const [lbLoading, setLbLoading] = useState(false);

  const [market, setMarket] = useState<MarketConfig | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [openingPack, setOpeningPack] = useState<null | { pack: MarketPack }>(null);
  const [reveal, setReveal] = useState<null | { packName: string; reward: InventoryItem | any }>(null);

  const [inv, setInv] = useState<InventoryItem[]>([]);
  const [invLoading, setInvLoading] = useState(false);

  const [rigSlots, setRigSlots] = useState<RigSlot[] | null>(null);
  const [rigSlotsLoading, setRigSlotsLoading] = useState(false);

  const [equipModal, setEquipModal] = useState<null | { slotIndex: number }>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("hash42_token");
    const a = localStorage.getItem("hash42_address");
    if (t && a) {
      setToken(t);
      setAddress(a);
      fetchMe(t).catch(() => {});
      fetchRigSlots(t).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    setUiMiningBalanceNano(Number(me?.husd?.balanceNano || 0));
  }, [me?.husd?.balanceNano]);

  useEffect(() => {
    if (!token) return;
    if (!me?.mining?.active) return;

    const rate = Number(me?.mining?.rateNanoPerSec ?? 11);
    const uiTick = setInterval(() => {
      setUiMiningBalanceNano((x) => x + rate);
    }, 1000);

    const refresh = setInterval(() => {
      fetchMe(token).catch(() => {});
      fetchRigSlots(token).catch(() => {});
    }, 15000);

    return () => {
      clearInterval(uiTick);
      clearInterval(refresh);
    };
  }, [token, me?.mining?.active, me?.mining?.rateNanoPerSec]);

  useEffect(() => {
    if (!token) return;
    if (tab !== "vault") return;
    fetchActivity(token).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  useEffect(() => {
    if (!token) return;
    if (tab !== "leaderboard") return;
    fetchLeaderboard(token).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  useEffect(() => {
    if (!token) return;
    if (tab !== "marketplace") return;
    fetchMarketConfig(token).catch(() => {});
    fetchInventory(token).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  useEffect(() => {
    if (!token) return;
    if (tab !== "mining") return;
    fetchRigSlots(token).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

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
  const sessionLeftPct = useMemo(
    () => clampPct(Math.round((secondsLeft / sessionTotalSec) * 100)),
    [secondsLeft, sessionTotalSec]
  );

  const capNano = Number(me?.husd?.capNano || 0);

  const capPct = useMemo(() => {
    if (!capNano) return 0;
    return clampPct(Math.round((uiMiningBalanceNano / capNano) * 100));
  }, [uiMiningBalanceNano, capNano]);

  const slotsUnlocked = Math.max(1, Math.min(5, Number(me?.slotsUnlocked || 1)));

  const miningBalanceNano = Number(me?.husd?.balanceNano || 0);

  // ✅ Single spendable currency
  const creditsNano =
    Number(me?.credits?.balanceNano ?? 0) || Number(me?.husd?.vaultNano ?? 0) || 0;
  const creditsSymbol = me?.credits?.symbol || "CREDITS";

  const vaultNano = creditsNano; // alias for UI naming
  const totalClaimedNano = Number(me?.husd?.totalClaimedNano || 0);

  const canClaim = capNano > 0 && miningBalanceNano >= capNano;

  function showError(title: string, message: string) {
    setPopup({ title, message });
  }

  function blockIfMiningActive(actionLabel: string) {
    if (!miningActive) return false;
    showError(
      "Action blocked (Mining active)",
      `You can't ${actionLabel} while mining is running.\n\nStop mining first, then change your rig, then start mining again.`
    );
    return true;
  }

  async function connectWallet() {
    if (popup) setPopup(null);
    if (!(window as any).ethereum) {
      showError("MetaMask not found", "Please install MetaMask (or use a compatible wallet) to continue.");
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
    if (popup) setPopup(null);
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
      await fetchRigSlots(v.token);
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
    setActivity([]);
    setRigSlots(null);
    setEquipModal(null);
    setToast("Logged out");
    if (popup) setPopup(null);
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

    if (j && j.starterRtxGifted === false) {
      setShowStarterRtx(true);
      setStarterStep(0);
      setTimeout(() => setStarterStep(1), 400);
      setTimeout(() => setStarterStep(2), 900);
    }
  }

  async function fetchRigSlots(t: string) {
    setRigSlotsLoading(true);
    try {
      const r = await fetch(`${API}/rigs/slots`, { headers: { Authorization: `Bearer ${t}` } });
      const j = (await r.json().catch(() => null)) as RigSlotsResponse | null;
      if (!r.ok || !j?.ok) return;
      setRigSlots(Array.isArray(j.slots) ? j.slots : null);
    } finally {
      setRigSlotsLoading(false);
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

  async function fetchLeaderboard(t: string) {
    setLbLoading(true);
    try {
      const r = await fetch(`${API}/leaderboard`, {
        headers: { Authorization: `Bearer ${t}` },
      });
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
      setInv(Array.isArray(j?.items) ? j!.items : []);
    } finally {
      setInvLoading(false);
    }
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

  async function startMining() {
    if (!token) return;
    setBusy(true);
    if (popup) setPopup(null);
    try {
      const r = await fetch(`${API}/mining/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `start_failed_${r.status}`);

      setToast("Mining started");
      await fetchMe(token);
      await fetchRigSlots(token);
    } catch (e: any) {
      showError("Start mining failed", e?.message || "Start mining failed");
    } finally {
      setBusy(false);
    }
  }

  async function stopMining() {
    if (!token) return;
    setBusy(true);
    if (popup) setPopup(null);
    try {
      const r = await fetch(`${API}/mining/stop`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `stop_failed_${r.status}`);

      setToast("Mining stopped");
      await fetchMe(token);
      await fetchRigSlots(token);
    } catch (e: any) {
      showError("Stop mining failed", e?.message || "Stop mining failed");
    } finally {
      setBusy(false);
    }
  }

  async function claimToVault() {
    if (!token) return;
    setBusy(true);
    if (popup) setPopup(null);
    try {
      const r = await fetch(`${API}/mining/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `claim_failed_${r.status}`);

      setToast("Moved to Vault");
      await fetchMe(token);

      if (tab === "vault") {
        await fetchActivity(token);
      }
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
      if (!r.ok) throw new Error(j.error || `starter_rtx_failed_${r.status}`);

      setShowStarterRtx(false);
      setToast("RTX Classic received");

      await fetchMe(token);
      await fetchInventory(token);

      const latestInv = await fetch(`${API}/inventory`, { headers: { Authorization: `Bearer ${token}` } });
      const invJson = (await latestInv.json().catch(() => null)) as InventoryResponse | null;
      const items = invJson?.items || [];
      const starter =
        items.find((x) => (x.source || "").toLowerCase() === "starter") || items.find((x) => x.gpuId === 1);
      if (starter?.userGpuId) {
        await equipGpu(1, starter.userGpuId, { silent: true });
      }

      await fetchRigSlots(token);
    } catch (e: any) {
      showError("Starter RTX failed", e?.message || "Starter RTX failed");
    } finally {
      setBusy(false);
    }
  }

  async function buySlotWithCredits(slot: number) {
    if (!token) return;
    if (blockIfMiningActive(`unlock Slot ${slot}`)) return;

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
      await fetchRigSlots(token);
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

  function openBuySlot(slotIndex: number) {
    if (blockIfMiningActive(`buy Slot ${slotIndex}`)) return;

    const payouts = [10, 25, 50, 100, 250];
    const payoutHusd = payouts[slotIndex - 1] || 10;

    const prices = [0, 2, 5, 10, 20];
    const priceUsd = prices[slotIndex - 1] ?? 2;

    setSlotModal({ slotIndex, payoutHusd, priceUsd });
  }

  async function equipGpu(slotIndex: number, userGpuId: number, opts?: { silent?: boolean }) {
    if (!token) return;
    if (blockIfMiningActive("equip GPUs")) return;

    setBusy(true);
    if (popup) setPopup(null);
    try {
      const r = await fetch(`${API}/rigs/equip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotIndex, userGpuId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "equip_failed");

      if (!opts?.silent) setToast(`Equipped in slot ${slotIndex}`);
      setEquipModal(null);

      await fetchRigSlots(token);
      await fetchMe(token);
    } catch (e: any) {
      showError("Equip failed", e?.message || "Equip failed");
    } finally {
      setBusy(false);
    }
  }

  async function unequipGpu(slotIndex: number) {
    if (!token) return;
    if (blockIfMiningActive("unequip GPUs")) return;

    setBusy(true);
    if (popup) setPopup(null);
    try {
      const r = await fetch(`${API}/rigs/unequip`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slotIndex }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "unequip_failed");

      setToast(`Unequipped slot ${slotIndex}`);
      await fetchRigSlots(token);
      await fetchMe(token);
    } catch (e: any) {
      showError("Unequip failed", e?.message || "Unequip failed");
    } finally {
      setBusy(false);
    }
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
      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-800 bg-black/90 backdrop-blur">
        <div className="max-w-md mx-auto flex">
          {item("mining", "Mining")}
          {item("marketplace", "Marketplace")}
          {item("leaderboard", "Leaderboard")}
          {item("vault", "Vault")}
        </div>
      </div>
    );
  }

  function MiningTab() {
    const slots =
      rigSlots ?? Array.from({ length: 5 }).map((_, i) => ({ slotIndex: i + 1, userGpuId: null, gpu: null }));
    const equippedIds = new Set(slots.map((s) => s.userGpuId).filter(Boolean) as number[]);
    const availableForEquip = inv.filter((g) => !equippedIds.has(g.userGpuId));

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-zinc-400 text-xs">Mining Balance</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight">
                {fmtHusd8FromNano(uiMiningBalanceNano)}{" "}
                <span className="text-zinc-400 text-sm font-semibold">{me?.husd?.symbol || "HUSD"}</span>
              </div>
            </div>

            <button
              onClick={claimToVault}
              disabled={busy || !canClaim}
              className={[
                "shrink-0 px-4 py-3 rounded-xl font-extrabold text-sm border",
                canClaim
                  ? "bg-orange-500 text-black border-orange-500"
                  : "bg-orange-500/20 text-orange-200 border-orange-500/30",
                "disabled:opacity-100 disabled:cursor-not-allowed",
              ].join(" ")}
              title={canClaim ? "Claim to Vault" : "Reach cap to claim"}
            >
              Claim
            </button>
          </div>

          <div className="mt-3 h-2 rounded-full bg-zinc-900 overflow-hidden">
            <div className="h-full bg-orange-500" style={{ width: `${capPct}%` }} />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="text-zinc-500">Cap: {fmtHusd8FromNano(me?.husd?.capNano || 0)}</div>
            <div className={canClaim ? "text-orange-400 font-semibold" : "text-zinc-500"}>
              {canClaim ? "Cap reached ✓" : `${capPct}%`}
            </div>
          </div>

          <div className="text-zinc-500 text-xs mt-2">
            Claim is available only at 100% cap. Claim moves funds to Vault Credits (beta: no withdrawals).
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">GPU Slots</div>
            <div className="text-xs text-zinc-500">
              Power: <span className="text-orange-400 font-semibold">{Number(me?.powerScore || 0)}</span>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const slotIndex = i + 1;
              const unlocked = slotIndex <= slotsUnlocked;
              const slot = slots.find((s) => s.slotIndex === slotIndex) || { slotIndex, userGpuId: null, gpu: null };

              if (!unlocked) {
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
              }

              if (slot.userGpuId && slot.gpu) {
                return (
                  <button
                    key={slotIndex}
                    onClick={() => unequipGpu(slotIndex)}
                    disabled={busy}
                    className="aspect-square rounded-xl border border-orange-500/40 bg-orange-500/10 overflow-hidden relative"
                    title={`Unequip: ${slot.gpu.name} (${slot.gpu.mhps} MH/s)`}
                  >
                    <img
                      src={slot.gpu.imagePath || "/assets/rtx-classic.webp"}
                      alt={slot.gpu.name || "GPU"}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                    <div className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded-md bg-black/60 border border-zinc-700">
                      {slot.gpu.mhps} MH/s
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={slotIndex}
                  disabled={busy}
                  onClick={async () => {
                    if (!token) return;
                    if (blockIfMiningActive("change GPUs")) return;
                    if (inv.length === 0 && !invLoading) await fetchInventory(token);
                    setEquipModal({ slotIndex });
                  }}
                  className="aspect-square rounded-xl border border-zinc-700 bg-black/30 flex items-center justify-center text-[10px] text-zinc-300 hover:bg-zinc-900"
                  title="Equip GPU"
                >
                  Empty
                </button>
              );
            })}
          </div>

          <div className="text-zinc-500 text-xs mt-3">Tap an empty slot to equip a GPU. Tap an equipped slot to unequip.</div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={() => token && fetchRigSlots(token)}
              disabled={busy || rigSlotsLoading}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
            >
              {rigSlotsLoading ? "..." : "Sync Slots"}
            </button>
          </div>
        </div>

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
              Timer: <span className="font-mono text-zinc-100">{fmtTime(secondsLeft)}</span>
            </div>

            <div className="mt-3 h-2 rounded-full bg-zinc-900 overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${sessionLeftPct}%` }} />
            </div>

            <div className="text-zinc-500 text-xs mt-3">Reach 100% cap to enable Claim. Claim moves funds to Vault Credits.</div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold">Funds</div>

            <button
              onClick={() => token && fetchMe(token)}
              disabled={busy}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
            >
              Sync
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Mining balance</span>
              <span className="font-bold">{fmtHusd8FromNano(miningBalanceNano)} HUSD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Vault credits</span>
              <span className="font-bold">{fmtCredits2FromNano(vaultNano)} {creditsSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total claimed</span>
              <span className="font-bold">{fmtHusd8FromNano(totalClaimedNano)} HUSD</span>
            </div>
          </div>

          <div className="text-zinc-500 text-xs mt-3">
            Vault Credits are spendable in Marketplace (slots + packs). Vault is locked during beta (no withdrawals).
          </div>
        </div>

        {equipModal && (
          <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center p-4 z-50">
            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-lg">Equip GPU</div>
                  <div className="text-zinc-400 text-sm mt-1">
                    Select a GPU to equip into Slot {equipModal.slotIndex}.
                  </div>
                </div>
                <button
                  onClick={() => setEquipModal(null)}
                  className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900"
                >
                  Close
                </button>
              </div>

              <div className="mt-3">
                <button
                  onClick={() => token && fetchInventory(token)}
                  disabled={busy || invLoading}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
                >
                  {invLoading ? "Loading..." : "Sync inventory"}
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-[55vh] overflow-auto pr-1">
                {invLoading ? (
                  <>
                    <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                    <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                    <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                  </>
                ) : availableForEquip.length === 0 ? (
                  <div className="text-zinc-500 text-sm">
                    No available GPUs to equip. (If all are already equipped, unequip one first.)
                  </div>
                ) : (
                  availableForEquip.map((g) => {
                    const when = g.acquiredAt || g.createdAt;
                    return (
                      <button
                        key={g.userGpuId}
                        onClick={() => equipGpu(equipModal.slotIndex, g.userGpuId)}
                        disabled={busy}
                        className="w-full rounded-xl border border-zinc-800 bg-black/30 hover:bg-zinc-900 p-3 flex gap-3 text-left disabled:opacity-50"
                      >
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
                      </button>
                    );
                  })
                )}
              </div>

              <div className="text-zinc-500 text-xs mt-3">Tip: tapping an equipped slot will unequip it.</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function MarketplaceTab() {
    const packs = market?.packs || [];
    const slotPrices = market?.slotPricesCredits || {};

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-zinc-400 text-xs">Vault Credits</div>
              <div className="mt-1 text-2xl font-extrabold">
                {fmtCredits2FromNano(creditsNano)}{" "}
                <span className="text-zinc-400 text-sm font-semibold">{creditsSymbol}</span>
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
          <div className="text-zinc-400 text-sm mt-1">Unlock in order. Slots increase your mining cap.</div>

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
                    {already ? "Unlocked" : locked ? "Unlock previous first" : `${price} ${creditsSymbol}`}
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
              <div className="text-zinc-400 text-sm">FIFA-style: open packs to receive GPUs.</div>
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
              const afford = creditsNano >= priceNano;
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
                      {p.priceCredits} {creditsSymbol}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Odds: C {Math.round((p.odds.common || 0) * 100)}% • U {Math.round((p.odds.uncommon || 0) * 100)}% •
                    R {Math.round((p.odds.rare || 0) * 100)}% • E {Math.round((p.odds.epic || 0) * 100)}% • L{" "}
                    {Math.round((p.odds.legendary || 0) * 100)}%
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-zinc-500 text-xs mt-3">
            Rewards are stored off-chain in your inventory (beta). Later this can become on-chain / real economy.
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

          <div className="mt-3 space-y-2">
            {invLoading ? (
              <>
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
                <div className="h-16 rounded-xl bg-zinc-900 animate-pulse" />
              </>
            ) : inv.length === 0 ? (
              <div className="text-zinc-500 text-sm">No GPUs yet.</div>
            ) : (
              inv.slice(0, 10).map((g) => {
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
                        <div className={`text-xs font-bold ${rarityColor(g.rarity)}`}>{(g.rarity || "common").toUpperCase()}</div>
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
        </div>
      </div>
    );
  }

  function LeaderboardTab() {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">Leaderboard</div>
              <div className="text-zinc-400 text-sm">Metric: Power Score (active slots).</div>
            </div>
            <button
              onClick={() => token && fetchLeaderboard(token)}
              disabled={busy || lbLoading}
              className="text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50"
            >
              {lbLoading ? "..." : "Refresh"}
            </button>
          </div>

          <div className="mt-3 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Your rank</span>
              <span className="font-extrabold text-orange-400">#{lb?.me?.rank || "—"}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-zinc-400">Your power</span>
              <span className="font-bold">{Number(me?.powerScore || 0)}</span>
            </div>
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
              {lb.items.map((it) => (
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

          <div className="text-zinc-500 text-xs mt-3">Power Score is based on your equipped GPUs (active slots).</div>
        </div>
      </div>
    );
  }

  function VaultTab() {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-400 text-xs">Vault Credits</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {fmtCredits2FromNano(vaultNano)}{" "}
            <span className="text-zinc-400 text-sm font-semibold">{creditsSymbol}</span>
          </div>

          <div className="text-zinc-500 text-xs mt-2">Beta: Vault is locked (no withdrawals). Credits are spendable in Marketplace.</div>

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
                        {fmtCredits2FromNano(it.amountNano)} {creditsSymbol}
                      </div>
                      <div className="text-xs text-zinc-500">{fmtWhen(it.createdAt)}</div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{it.note || "ledger"}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-zinc-500 text-xs mt-3">Activity tracks all Vault Credits movements (grant, claim, purchases).</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto p-4 pb-24">
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
              Sync
            </button>
          ) : null}
        </div>

        {/* Auth: Connect screen with hero */}
        {!address && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-orange-500/40 bg-zinc-950 overflow-hidden">
              <img
                src="/assets/hero-hash42-miningapp.webp"
                alt="Hash42 Mining App"
                className="w-full h-[44vh] object-cover"
                draggable={false}
              />
            </div>

            <button onClick={connectWallet} className="w-full py-4 rounded-2xl bg-orange-500 text-black font-extrabold">
              Connect Wallet
            </button>

            <div className="text-center text-zinc-500 text-xs">
              Mobile-first beta. Connect your wallet to start.
            </div>
          </div>
        )}

        {address && !token && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-orange-500/20 bg-zinc-950 overflow-hidden">
              <img
                src="/assets/hero-hash42-miningapp.webp"
                alt="Hash42 Mining App"
                className="w-full h-[28vh] object-cover"
                draggable={false}
              />
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-zinc-400 text-xs">Wallet</div>
              <div className="font-mono">{shortAddr(address)}</div>
              <div className="text-zinc-500 text-xs mt-2">You will sign a message. No blockchain transaction.</div>
            </div>

            <button
              onClick={login}
              disabled={busy}
              className="w-full py-4 rounded-2xl bg-orange-500 text-black font-extrabold disabled:opacity-50"
            >
              {busy ? "Signing..." : "Login"}
            </button>
          </div>
        )}

        {token && (
          <div className="space-y-4">
            {tab === "mining" && <MiningTab />}
            {tab === "marketplace" && <MarketplaceTab />}
            {tab === "leaderboard" && <LeaderboardTab />}
            {tab === "vault" && <VaultTab />}
          </div>
        )}

        {toast && (
          <div className="fixed left-1/2 -translate-x-1/2 bottom-24 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-sm">
            {toast}
          </div>
        )}

        {token && showUsername && (
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

                <button onClick={() => setReveal(null)} className="mt-4 w-full py-3 rounded-xl bg-orange-500 text-black font-extrabold">
                  Continue
                </button>
              </div>
            </div>
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
                  <img src="/assets/rtx-classic.webp" alt="RTX Classic" className="w-full h-56 object-cover" />
                </div>

                <div className="mt-4 rounded-xl border border-zinc-800 bg-black/30 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Status</span>
                    <span className={starterStep >= 2 ? "text-orange-400 font-bold" : "text-zinc-500"}>
                      {starterStep >= 2 ? "Ready" : "Initializing..."}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-zinc-900 overflow-hidden">
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
                    starterStep >= 2 ? "bg-orange-500 text-black border-orange-500" : "bg-orange-500/20 text-orange-200 border-orange-500/30",
                    "disabled:opacity-100 disabled:cursor-not-allowed",
                  ].join(" ")}
                >
                  {starterStep >= 2 ? "Claim GPU" : "Loading..."}
                </button>

                <div className="text-zinc-500 text-xs mt-3">This is a one-time gift. It will stay linked to your wallet.</div>
              </div>

              <style jsx>{`
                @keyframes pop {
                  0% {
                    transform: scale(0.97);
                    opacity: 0.4;
                  }
                  100% {
                    transform: scale(1);
                    opacity: 1;
                  }
                }
              `}</style>
            </div>
          </div>
        )}
      </div>

      {token ? <BottomNav /> : null}

      <ErrorModal
        open={!!popup}
        title={popup?.title || "Error"}
        message={popup?.message || "Something went wrong."}
        onClose={() => setPopup(null)}
      />
    </main>
  );
}