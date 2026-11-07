// lib/utils.js

// ─── PHONE ────────────────────────────────────────────────────
export function formatPhone(value) {
  const d = String(value || "").replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`;
}

export function isValidPhone(value) {
  return String(value || "").replace(/\D/g, "").length === 10;
}

export function getPhoneDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

// ─── PAYMENTS ─────────────────────────────────────────────────
export const PAYMENT_METHODS = ["Cash", "Card", "Bank Transfer", "Online", "COD", "Other"];

export const PAYMENT_LABELS = {
  Cash: "Cash", 
  Card: "Card", 
  "Bank Transfer": "Bank Transfer",
  Online: "Online", 
  COD: "COD (Cash on Delivery)", 
  Other: "Other",
};

export const PAYMENT_COLORS = {
  Cash: "bg-green-900/40 text-green-300 border-green-700",
  Card: "bg-blue-900/40 text-blue-300 border-blue-700",
  "Bank Transfer": "bg-purple-900/40 text-purple-300 border-purple-700",
  Online: "bg-cyan-900/40 text-cyan-300 border-cyan-700",
  COD: "bg-orange-900/40 text-orange-300 border-orange-700",
  Other: "bg-gray-800 text-gray-300 border-gray-700",
};

export function getPaymentLabel(m) { 
  return PAYMENT_LABELS[m] || m || "—"; 
}

// ─── FORMATTERS ───────────────────────────────────────────────
export function fmtMoney(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtRs(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-LK");
}

export function fmtDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}/${x.getFullYear()}`;
}

export function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function fmtWarranty(months) {
  const m = Number(months);
  if (!months || isNaN(m) || m <= 0) return "—";
  return String(m).padStart(2, "0") + "M";
}

// ─── AUTO CODES (For Inventory & Products) ────────────────────
const CATEGORY_PREFIXES = {
  "power supply": "PSU", processor: "CPU", motherboard: "MBD", ram: "RAM", memory: "RAM",
  "graphics card": "GPU", storage: "SSD", ssd: "SSD", hdd: "HDD", cabinet: "CAS", casing: "CAS",
  "cpu cooler": "CLR", cooler: "CLR", "case fan": "FAN", monitor: "MON", keyboard: "KBD",
  mouse: "MOU", speaker: "SPK", headset: "HST", printer: "PRN", webcam: "CAM", cable: "CBL",
  adapter: "ADP", networking: "NET", ups: "UPS", laptop: "LAP", other: "GEN"
};

export function liveTitleCase(str) {
  if (!str) return "";
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function liveUpperCase(str) {
  if (!str) return "";
  return str.toUpperCase();
}

export async function generateNextVariantCode(supabase, baseCode) {
  if (!baseCode) return "";
  const prefix = `${baseCode}-`;
  const { data } = await supabase.from("products").select("item_code").like("item_code", `${prefix}%`);

  let maxNum = 0;
  (data || []).forEach((p) => {
    const rest = p.item_code?.substring(prefix.length);
    if (!rest) return;
    const m = rest.match(/^(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  });
  return `${baseCode}-${String(maxNum + 1).padStart(2, "0")}`;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 ** 2) return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1024 ** 3) return (bytes / 1024 ** 2).toFixed(2) + " MB";
  return (bytes / 1024 ** 3).toFixed(2) + " GB";
}