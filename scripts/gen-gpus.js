/* scripts/gen-gpus.js */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/assets/gpus");
const MANIFEST = path.join(OUT_DIR, "manifest.json");

// Card size
const SIZE = 768;         // 512 se vuoi più leggero
const QUALITY = 84;

// ID policy
const BASE_GIFT_ID = 1;   // non generato qui (1 MH/s omaggio)
const START_ID = 2;
const END_ID = 420;       // incluso

// Rarity fixed counts for IDs 2..420 = 419 cards total
const RARITIES = [
  { key: "common",    label: "Common",    count: 251 },
  { key: "uncommon",  label: "Uncommon",  count: 105 },
  { key: "rare",      label: "Rare",      count: 42  },
  { key: "epic",      label: "Epic",      count: 17  },
  { key: "legendary", label: "Legendary", count: 4   },
];

// Hashrate ranges in MH/s (42 GH/s = 42000 MH/s)
const HASHRATE_RANGES = {
  common:    [10, 120],
  uncommon:  [120, 800],
  rare:      [800, 4000],
  epic:      [4000, 15000],
  legendary: [15000, 42000],
};

// ------------------------------------------------------------
// utils
// ------------------------------------------------------------
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(arr, rnd) {
  return arr[Math.floor(rnd() * arr.length)];
}
function chance(p, rnd) {
  return rnd() < p;
}
// log-uniform in [min,max]
function logUniform(min, max, rnd) {
  const a = Math.log(min);
  const b = Math.log(max);
  const u = rnd();
  return Math.exp(a + u * (b - a));
}
function fmtHashrateFromMH(mh) {
  if (mh >= 1000) return `${(mh / 1000).toFixed(2)} GH/s`;
  if (mh >= 100) return `${mh.toFixed(0)} MH/s`;
  return `${mh.toFixed(1)} MH/s`;
}
function hexToRgb(hex) {
  const h = String(hex).replace("#", "");
  const v = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ------------------------------------------------------------
// Rarity palettes / materials
// ------------------------------------------------------------
const RARITY_BG = {
  common:    { a: "#00FF66", b: "#07110A" }, // fluo green
  uncommon:  { a: "#3AB2FF", b: "#050A14" }, // electric blue
  rare:      { a: "#FFD36A", b: "#0B0A07" }, // gold
  epic:      { a: "#FF5A00", b: "#120806" }, // fluo orange
  legendary: { a: "#9AD9FF", b: "#05070C" }, // diamond-ish
};

const MATERIALS = {
  matte:     { shine: 0.10, grain: 0.22 },
  anodized:  { shine: 0.22, grain: 0.12 },
  carbon:    { shine: 0.18, grain: 0.28 },
  metallic:  { shine: 0.35, grain: 0.10 },
  chrome:    { shine: 0.55, grain: 0.06 },
  gold:      { shine: 0.60, grain: 0.08 },
  diamond:   { shine: 0.48, grain: 0.10 },
};

// ------------------------------------------------------------
// Background SVG (rarity + per-card variation)
// ------------------------------------------------------------
function bgSvg({ rarityKey, seed }) {
  const rnd = mulberry32(seed);
  const bg = RARITY_BG[rarityKey] || RARITY_BG.common;

  const tilt = Math.floor(rnd() * 40) - 20; // -20..+19
  const noiseA = (0.10 + rnd() * 0.14).toFixed(3);

  const isLegend = rarityKey === "legendary";
  const isRarePlus = rarityKey === "rare" || rarityKey === "epic" || isLegend;

  // facets only for legendary
  const facets = isLegend
    ? `
      <pattern id="facet" width="120" height="120" patternUnits="userSpaceOnUse">
        <path d="M0,60 L60,0 L120,60 L60,120 Z" fill="${rgba("#ffffff", 0.06)}" stroke="${rgba("#B4F0FF", 0.22)}" stroke-width="2"/>
        <path d="M60,0 L120,60" stroke="${rgba("#ffffff", 0.14)}" stroke-width="2"/>
        <path d="M60,120 L120,60" stroke="${rgba("#ffffff", 0.14)}" stroke-width="2"/>
        <path d="M0,60 L60,0" stroke="${rgba("#ffffff", 0.10)}" stroke-width="2"/>
        <path d="M0,60 L60,120" stroke="${rgba("#ffffff", 0.10)}" stroke-width="2"/>
      </pattern>
    `
    : "";

  const streaks = Array.from({ length: isRarePlus ? 10 : 8 })
    .map((_, i) => {
      const w = 28 + Math.floor(rnd() * 26);
      const x = -200 + i * 120 + Math.floor(rnd() * 40);
      const y = -300 + i * 90 + Math.floor(rnd() * 60);
      return `<rect x="${x}" y="${y}" width="${SIZE * 1.8}" height="${w}" fill="${rgba(bg.a, 0.10)}" />`;
    })
    .join("");

  return `
  <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="rg" cx="50%" cy="35%" r="80%">
        <stop offset="0%" stop-color="${bg.a}" stop-opacity="0.55"/>
        <stop offset="60%" stop-color="${bg.a}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${bg.b}" stop-opacity="1"/>
      </radialGradient>

      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="${(0.75 + rnd() * 0.25).toFixed(2)}" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 ${noiseA}"/>
        </feComponentTransfer>
      </filter>

      ${facets}

      <linearGradient id="vign" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(0,0,0,0.10)"/>
        <stop offset="75%" stop-color="rgba(0,0,0,0.45)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.65)"/>
      </linearGradient>
    </defs>

    <rect width="100%" height="100%" fill="url(#rg)"/>
    <g transform="rotate(${tilt} ${SIZE / 2} ${SIZE / 2})">${streaks}</g>

    ${isLegend ? `<rect width="100%" height="100%" fill="url(#facet)"/>` : ""}

    <rect width="100%" height="100%" filter="url(#noise)"/>
    <rect width="100%" height="100%" fill="url(#vign)"/>
  </svg>`;
}

// ------------------------------------------------------------
// GPU SVG generator (THIS is the key part)
// Changes: shroud shape, fan count, fan rings, blades style,
// vents, screws, plate, led strip, accent trims, materials.
// ------------------------------------------------------------
function gpuSvg({ rarityKey, id, seed }) {
  const rnd = mulberry32(seed);

  // choose a "model"
  const models = ["dual_fan", "triple_fan", "aero", "chunky", "slim"];
  let model = pick(models, rnd);
  // bias: legendary more aggressive
  if (rarityKey === "legendary" && chance(0.6, rnd)) model = pick(["chunky", "aero"], rnd);

  // fan count from model
  const fanCount =
    model === "dual_fan" ? 2 :
    model === "triple_fan" ? 3 :
    model === "slim" ? 2 :
    chance(0.55, rnd) ? 3 : 2;

  // material selection by rarity
  const matsCommon = ["matte", "anodized", "carbon"];
  const matsRare = ["anodized", "metallic", "carbon"];
  const matsEpic = ["metallic", "chrome"];
  const matsLeg = ["gold", "chrome", "diamond"];
  const materialKey =
    rarityKey === "legendary" ? pick(matsLeg, rnd) :
    rarityKey === "epic" ? pick(matsEpic, rnd) :
    rarityKey === "rare" ? pick(matsRare, rnd) :
    pick(matsCommon, rnd);

  const mat = MATERIALS[materialKey] || MATERIALS.matte;

  // base palette (case + accents)
  const baseDark = pick(["#0B0F14", "#0E0E12", "#10141A", "#0A0A0C"], rnd);
  const baseMid  = pick(["#1B2230", "#222A36", "#20242C", "#262A33"], rnd);

  // accent palette depends on rarity
  const accentPool = {
    common:    ["#00FF66", "#7CFF6B", "#B6FFC8", "#00D455"],
    uncommon:  ["#3AB2FF", "#66D6FF", "#A8EAFF", "#1A7CFF"],
    rare:      ["#FFD36A", "#FFDD88", "#FFF2C4", "#D6A100"],
    epic:      ["#FF5A00", "#FF7A1A", "#FFB86B", "#FF3B00"],
    legendary: ["#FFD36A", "#FFF2C4", "#9AD9FF", "#FFFFFF"],
  }[rarityKey] || ["#00FF66"];

  const accent1 = pick(accentPool, rnd);
  const accent2 = pick(accentPool, rnd);

  // RGB fan mode (more frequent on epic/legendary)
  const rgbFans = rarityKey === "legendary" ? true : rarityKey === "epic" ? chance(0.85, rnd) : chance(0.35, rnd);

  // LED strip
  const hasLed = rarityKey === "legendary" ? true : chance(rarityKey === "common" ? 0.35 : 0.60, rnd);
  const ledPos = pick(["top", "bottom"], rnd);

  // shroud geometry knobs
  const corner = 22 + Math.floor(rnd() * 20); // radius
  const notch = chance(0.55, rnd);
  const ventCount = 6 + Math.floor(rnd() * 9);

  // sticker/plate on gpu (not on background)
  const plate = chance(rarityKey === "common" ? 0.25 : 0.55, rnd);
  const plateText = pick(["H42", "HASH42", "LABS", "42"], rnd);

  // dimensions within card coordinates
  // GPU box center-ish
  const gx = SIZE * 0.14;
  const gy = SIZE * 0.26;
  const gw = SIZE * 0.72;
  const gh = SIZE * 0.44;

  // fan layout
  const fanY = gy + gh * 0.56;
  const fanR = fanCount === 3 ? gw * 0.11 : gw * 0.14;
  const fanXs =
    fanCount === 3
      ? [gx + gw * 0.26, gx + gw * 0.50, gx + gw * 0.74]
      : [gx + gw * 0.34, gx + gw * 0.66];

  // “legendary = pacchiano”
  const legendaryBoost = rarityKey === "legendary";
  const goldPlated = legendaryBoost && (materialKey === "gold" || chance(0.7, rnd));
  const diamondCoat = legendaryBoost && (materialKey === "diamond" || chance(0.5, rnd));

  const hueShift = Math.floor((rnd() * 18) - 9); // -9..+8 just a tiny variation

  // helper shapes
  const vents = Array.from({ length: ventCount })
    .map((_, i) => {
      const vx = gx + gw * 0.08 + i * (gw * 0.80) / ventCount;
      const vy = gy + gh * 0.18;
      const vw = gw * 0.03;
      const vh = gh * 0.12 + (i % 3) * gh * 0.02;
      return `<rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" rx="${vw / 2}" fill="${rgba("#000000", 0.35)}"/>`;
    })
    .join("");

  const screws = [
    [gx + gw * 0.06, gy + gh * 0.12],
    [gx + gw * 0.94, gy + gh * 0.12],
    [gx + gw * 0.06, gy + gh * 0.88],
    [gx + gw * 0.94, gy + gh * 0.88],
  ]
    .map(([sx, sy]) => `<circle cx="${sx}" cy="${sy}" r="${gw * 0.012}" fill="${rgba("#FFFFFF", 0.18)}"/>`)
    .join("");

  // fan blades pattern
  function fanBlades(cx, cy, r, seedLocal) {
    const rr = mulberry32(seedLocal);
    const blades = 7 + Math.floor(rr() * 6); // 7..12
    const bladeStyle = pick(["sharp", "curved", "chunky"], rr);
    const bladeOpacity = rgbFans ? 0.20 : 0.14;

    const bladeFill = rgbFans ? `url(#rgb)` : rgba(accent2, 0.35);

    const paths = Array.from({ length: blades })
      .map((_, i) => {
        const ang = (i / blades) * Math.PI * 2;
        const a2 = ang + (Math.PI * 2) / blades * 0.55;
        const inner = r * (bladeStyle === "chunky" ? 0.35 : 0.28);
        const outer = r * (bladeStyle === "sharp" ? 0.98 : 0.90);

        // simple polar -> cart
        const x1 = cx + Math.cos(ang) * inner;
        const y1 = cy + Math.sin(ang) * inner;
        const x2 = cx + Math.cos(a2) * outer;
        const y2 = cy + Math.sin(a2) * outer;
        const x3 = cx + Math.cos(ang) * outer;
        const y3 = cy + Math.sin(ang) * outer;

        if (bladeStyle === "curved") {
          const mx = cx + Math.cos((ang + a2) / 2) * (outer * 0.92);
          const my = cy + Math.sin((ang + a2) / 2) * (outer * 0.92);
          return `<path d="M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2} L ${x3} ${y3} Z" fill="${bladeFill}" opacity="${bladeOpacity}"/>`;
        }
        return `<path d="M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} Z" fill="${bladeFill}" opacity="${bladeOpacity}"/>`;
      })
      .join("");

    return paths;
  }

  const fans = fanXs
    .map((cx, i) => {
      const cy = fanY;
      const ring = rgbFans ? `url(#rgb)` : accent1;

      const ringW = legendaryBoost ? fanR * 0.18 : fanR * 0.14;

      const blades = fanBlades(cx, cy, fanR * 0.86, seed + i * 999);

      return `
        <g>
          <circle cx="${cx}" cy="${cy}" r="${fanR}" fill="${rgba("#000000", 0.40)}"/>
          <circle cx="${cx}" cy="${cy}" r="${fanR * 0.92}" fill="none" stroke="${rgba(ring, 0.75)}" stroke-width="${ringW}"/>
          <circle cx="${cx}" cy="${cy}" r="${fanR * 0.70}" fill="${rgba("#0A0A0C", 0.85)}"/>
          ${blades}
          <circle cx="${cx}" cy="${cy}" r="${fanR * 0.18}" fill="${rgba("#000000", 0.35)}" stroke="${rgba("#ffffff", 0.10)}" stroke-width="${fanR * 0.06}"/>
        </g>
      `;
    })
    .join("");

  // shroud shape differences
  const topNotch = notch ? `L ${gx + gw * 0.55} ${gy} L ${gx + gw * 0.60} ${gy + gh * 0.08}` : "";

  const shroudPath = `
    M ${gx + corner} ${gy}
    L ${gx + gw * 0.42} ${gy}
    ${topNotch}
    L ${gx + gw - corner} ${gy}
    Q ${gx + gw} ${gy} ${gx + gw} ${gy + corner}
    L ${gx + gw} ${gy + gh - corner}
    Q ${gx + gw} ${gy + gh} ${gx + gw - corner} ${gy + gh}
    L ${gx + corner} ${gy + gh}
    Q ${gx} ${gy + gh} ${gx} ${gy + gh - corner}
    L ${gx} ${gy + corner}
    Q ${gx} ${gy} ${gx + corner} ${gy}
    Z
  `;

  const ledH = gh * 0.06;
  const ledY = ledPos === "top" ? gy + gh * 0.10 : gy + gh * 0.88;
  const led = !hasLed
    ? ""
    : `<rect x="${gx + gw * 0.16}" y="${ledY}" width="${gw * 0.68}" height="${ledH}" rx="${ledH/2}"
        fill="${rgba(accent1, 0.32)}" stroke="${rgba(accent2, 0.28)}" stroke-width="2"/>`;

  const plateW = gw * 0.22;
  const plateH = gh * 0.10;
  const plateX = gx + gw * 0.70;
  const plateY = gy + gh * 0.18;
  const plateSvg = !plate
    ? ""
    : `
      <g transform="rotate(${Math.floor(rnd() * 16) - 8} ${plateX + plateW/2} ${plateY + plateH/2})">
        <rect x="${plateX}" y="${plateY}" width="${plateW}" height="${plateH}" rx="${plateH * 0.35}"
          fill="${rgba("#000000", 0.35)}" stroke="${rgba(accent1, 0.55)}" stroke-width="3"/>
        <text x="${plateX + plateW/2}" y="${plateY + plateH*0.70}"
          text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-size="${plateH * 0.60}"
          font-weight="900"
          fill="${rgba(accent2, 0.95)}">${plateText}</text>
      </g>
    `;

  // legendary special coats
  const goldOverlay = goldPlated
    ? `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="${corner}" fill="url(#goldPlating)" opacity="0.55"/>`
    : "";

  const diamondOverlay = diamondCoat
    ? `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="${corner}" fill="url(#diamondDust)" opacity="0.45"/>`
    : "";

  // slight “model” cuts
  const modelCuts =
    model === "aero"
      ? `<path d="M ${gx + gw*0.18} ${gy + gh*0.22} L ${gx + gw*0.40} ${gy + gh*0.22} L ${gx + gw*0.33} ${gy + gh*0.38} Z" fill="${rgba("#000000", 0.25)}"/>`
      : model === "slim"
      ? `<rect x="${gx + gw*0.08}" y="${gy + gh*0.10}" width="${gw*0.84}" height="${gh*0.06}" rx="${gh*0.03}" fill="${rgba("#000000", 0.22)}"/>`
      : model === "chunky"
      ? `<rect x="${gx + gw*0.06}" y="${gy + gh*0.70}" width="${gw*0.88}" height="${gh*0.10}" rx="${gh*0.05}" fill="${rgba("#000000", 0.22)}"/>`
      : "";

  // Border/frame for legendary
  const legendaryFrame =
    rarityKey !== "legendary"
      ? ""
      : `
        <rect x="${gx - 10}" y="${gy - 10}" width="${gw + 20}" height="${gh + 20}" rx="${corner + 12}"
          fill="none" stroke="url(#legendFrame)" stroke-width="6" opacity="0.95"/>
      `;

  return `
  <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${rgbFans ? `
        <linearGradient id="rgb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FF2D55"/>
          <stop offset="35%" stop-color="#7CFF6B"/>
          <stop offset="70%" stop-color="#3AB2FF"/>
          <stop offset="100%" stop-color="#FFD36A"/>
        </linearGradient>
      ` : ""}

      <linearGradient id="shroud" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${baseMid}" stop-opacity="1"/>
        <stop offset="70%" stop-color="${baseDark}" stop-opacity="1"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="1"/>
      </linearGradient>

      <linearGradient id="trim" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${rgba(accent1, 0.95)}"/>
        <stop offset="100%" stop-color="${rgba(accent2, 0.75)}"/>
      </linearGradient>

      <filter id="shadow">
        <feGaussianBlur stdDeviation="14" result="b"/>
        <feColorMatrix type="matrix" values="
          0 0 0 0 0
          0 0 0 0 0
          0 0 0 0 0
          0 0 0 0.45 0" />
      </filter>

      <filter id="spec">
        <feGaussianBlur stdDeviation="${materialKey === "chrome" ? 10 : 8}"/>
      </filter>

      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer>
          <feFuncA type="table" tableValues="0 ${(mat.grain).toFixed(2)}"/>
        </feComponentTransfer>
      </filter>

      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
        <stop offset="45%" stop-color="rgba(255,255,255,${mat.shine.toFixed(2)})"/>
        <stop offset="55%" stop-color="rgba(255,255,255,${(mat.shine * 0.45).toFixed(2)})"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>

      <linearGradient id="goldPlating" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,211,106,0.75)"/>
        <stop offset="35%" stop-color="rgba(214,161,0,0.45)"/>
        <stop offset="100%" stop-color="rgba(255,242,196,0.25)"/>
      </linearGradient>

      <pattern id="diamondDust" width="90" height="90" patternUnits="userSpaceOnUse">
        <path d="M0,45 L45,0 L90,45 L45,90 Z" fill="rgba(255,255,255,0.06)" stroke="rgba(180,240,255,0.18)" stroke-width="2"/>
        <path d="M45,0 L90,45" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
        <path d="M45,90 L90,45" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
      </pattern>

      <linearGradient id="legendFrame" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="rgba(255,211,106,0.95)"/>
        <stop offset="45%" stop-color="rgba(154,217,255,0.70)"/>
        <stop offset="100%" stop-color="rgba(255,242,196,0.90)"/>
      </linearGradient>
    </defs>

    <!-- GPU shadow -->
    <path d="${shroudPath}" fill="black" opacity="0.55" filter="url(#shadow)"/>

    <!-- Shroud base -->
    <path d="${shroudPath}" fill="url(#shroud)" />

    <!-- Material grain -->
    ${materialKey === "carbon" ? `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="${corner}" filter="url(#grain)"/>` : ""}

    <!-- Accent trim -->
    <path d="${shroudPath}" fill="none" stroke="url(#trim)" stroke-width="6" opacity="${rarityKey === "common" ? 0.55 : 0.80}"/>

    <!-- Vents / cuts -->
    ${vents}
    ${modelCuts}

    <!-- Fans -->
    ${fans}

    <!-- LED -->
    ${led}

    <!-- Plate -->
    ${plateSvg}

    <!-- Screws -->
    ${screws}

    <!-- Shine sweep -->
    <g transform="rotate(${Math.floor(rnd() * 26) - 13} ${SIZE/2} ${SIZE/2})">
      <rect x="${-Math.floor(SIZE * 0.2)}" y="${Math.floor(SIZE * 0.22)}" width="${Math.floor(SIZE * 1.5)}" height="${Math.floor(SIZE * 0.16)}"
        fill="url(#shine)" opacity="${(0.65 + rnd() * 0.25).toFixed(2)}" filter="url(#spec)"/>
    </g>

    <!-- Legendary coats -->
    ${goldOverlay}
    ${diamondOverlay}
    ${legendaryFrame}

    <!-- tiny hue shift vibe (subtle) -->
    <rect width="100%" height="100%" fill="transparent" style="filter: hue-rotate(${hueShift}deg)"/>
  </svg>`;
}

// ------------------------------------------------------------
// Card SVG (bg + gpu + header)
// ------------------------------------------------------------
function cardSvg({ rarityKey, rarityLabel, id, hashrateLabel, seed }) {
  const bg = bgSvg({ rarityKey, seed });
  const gpu = gpuSvg({ rarityKey, id, seed: seed + 777 });

  const rnd = mulberry32(seed);
  const headerH = Math.floor(SIZE * 0.135);

  const badgeText = rarityKey === "legendary" ? "LEGENDARY" : rarityKey.toUpperCase();
  const badgeFill = rarityKey === "legendary" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.40)";
  const badgeStroke = rgba(RARITY_BG[rarityKey].a, rarityKey === "legendary" ? 0.75 : 0.55);

  const serial = `${String(id).padStart(3, "0")}-${Math.floor(rnd() * 9999).toString().padStart(4, "0")}`;

  // Put GPU slightly lower to make header readable
  const gpuScale = 0.96;
  const gpuTx = 0;
  const gpuTy = Math.floor(SIZE * 0.02);

  return `
  <svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="hdrBlur">
        <feGaussianBlur stdDeviation="10"/>
      </filter>
    </defs>

    <!-- BG -->
    <image href="data:image/svg+xml;base64,${Buffer.from(bg).toString("base64")}" x="0" y="0" width="${SIZE}" height="${SIZE}"/>

    <!-- Header bar -->
    <rect x="0" y="0" width="${SIZE}" height="${headerH}" fill="rgba(0,0,0,0.42)"/>
    <rect x="0" y="${headerH-1}" width="${SIZE}" height="1" fill="rgba(255,255,255,0.10)"/>

    <text x="${Math.floor(SIZE*0.05)}" y="${Math.floor(SIZE*0.075)}"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${Math.floor(SIZE*0.040)}"
      font-weight="900"
      fill="rgba(255,255,255,0.92)"
      letter-spacing="0.6">
      ${rarityLabel.toUpperCase()} • ${hashrateLabel}
    </text>

    <text x="${Math.floor(SIZE*0.05)}" y="${Math.floor(SIZE*0.114)}"
      font-family="Arial, Helvetica, sans-serif"
      font-size="${Math.floor(SIZE*0.028)}"
      font-weight="700"
      fill="rgba(255,255,255,0.55)">
      #${String(id).padStart(3, "0")} • ${serial}
    </text>

    <!-- Badge -->
    <g transform="translate(${Math.floor(SIZE*0.72)}, ${Math.floor(SIZE*0.028)})">
      <rect x="0" y="0" rx="16" ry="16" width="${Math.floor(SIZE*0.24)}" height="${Math.floor(SIZE*0.085)}"
        fill="${badgeFill}" stroke="${badgeStroke}" stroke-width="3"/>
      <text x="${Math.floor(SIZE*0.12)}" y="${Math.floor(SIZE*0.060)}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${Math.floor(SIZE*0.036)}"
        font-weight="900"
        fill="rgba(255,255,255,0.88)">${badgeText}</text>
    </g>

    <!-- GPU -->
    <g transform="translate(${gpuTx}, ${gpuTy}) scale(${gpuScale})">
      <image href="data:image/svg+xml;base64,${Buffer.from(gpu).toString("base64")}" x="0" y="0" width="${SIZE}" height="${SIZE}"/>
    </g>

    <!-- Outer frame -->
    <rect x="18" y="18" width="${SIZE-36}" height="${SIZE-36}" rx="34" ry="34"
      fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="2"/>
  </svg>`;
}

// ------------------------------------------------------------
// main generation
// ------------------------------------------------------------
async function main() {
  ensureDir(OUT_DIR);

  // Build distribution pool
  const pool = [];
  for (const r of RARITIES) for (let i = 0; i < r.count; i++) pool.push(r);

  const expected = END_ID - START_ID + 1;
  if (pool.length !== expected) {
    throw new Error(`RARITIES counts mismatch. Expected ${expected}, got ${pool.length}`);
  }

  // Deterministic shuffle (so rarities are spread)
  const shuffleRnd = mulberry32(424242);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(shuffleRnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const manifest = [];

  for (let idx = 0; idx < pool.length; idx++) {
    const id = START_ID + idx;
    const r = pool[idx];

    const seed = 1337 * id + 42;
    const rnd = mulberry32(seed);

    // hashrate
    const [minMH, maxMH] = HASHRATE_RANGES[r.key] || [10, 120];
    let mhps = logUniform(minMH, maxMH, rnd);
    mhps *= (0.97 + rnd() * 0.06);
    mhps = clamp(mhps, minMH, maxMH);

    if (mhps < 200) mhps = Number(mhps.toFixed(1));
    else mhps = Number(mhps.toFixed(0));

    const hashrateLabel = fmtHashrateFromMH(mhps);
    const powerScore = Math.round(Math.pow(mhps, 1.10)); // nonlinear

    const svg = cardSvg({
      rarityKey: r.key,
      rarityLabel: r.label,
      id,
      hashrateLabel,
      seed,
    });

    const outName = `gpu-${String(id).padStart(3, "0")}-${r.key}.webp`;
    const outPath = path.join(OUT_DIR, outName);

    // Render SVG -> WEBP
    await sharp(Buffer.from(svg))
      .resize(SIZE, SIZE) // safety
      .webp({ quality: QUALITY })
      .toFile(outPath);

    manifest.push({
      id,
      slug: `gpu-${id}`,
      rarity: r.key,
      name: `RTX ${r.label} #${id}`,
      hashrateMh: mhps,
      hashrateLabel,
      powerScore,
      image: `/assets/gpus/${outName}`,
    });
  }

  fs.writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        total: manifest.length,
        range: { startId: START_ID, endId: END_ID, baseGiftId: BASE_GIFT_ID },
        items: manifest,
      },
      null,
      2
    )
  );

  console.log(`✅ Generated ${manifest.length} UNIQUE GPU cards in ${OUT_DIR}`);
  console.log(`✅ Manifest: ${MANIFEST}`);
  console.log(`ℹ️ ID 1 is your gifted base GPU (1 MH/s) and is not generated by this script.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});