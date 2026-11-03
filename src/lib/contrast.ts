// WCAG 2.x contrast helpers (client-safe).
export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]) {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrastRatio(a: string, b: string): number | null {
  const x = hexToRgb(a), y = hexToRgb(b);
  if (!x || !y) return null;
  const [l1, l2] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Text/background pairs the site actually uses, with the minimum ratio each needs. */
export const PALETTE_PAIRS: { fg: string; bg: string; label: string; min: number }[] = [
  { fg: "foreground", bg: "background", label: "Body text on page", min: 4.5 },
  { fg: "cream", bg: "background", label: "Headlines on page", min: 3 },
  { fg: "mutedForeground", bg: "background", label: "Secondary text on page", min: 4.5 },
  { fg: "foreground", bg: "card", label: "Text on cards", min: 4.5 },
  { fg: "primaryForeground", bg: "primary", label: "Button text", min: 4.5 },
  { fg: "gold", bg: "background", label: "Gold links on page", min: 3 },
];
