import type { ConfettiPiece } from "../types";

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

export function buildConfettiPieces(count = 26): ConfettiPiece[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    left: Math.random() * 100,
    top: Math.random() * 14,
    size: 8 + Math.random() * 8,
    delay: Math.random() * 0.35,
    duration: 1.8 + Math.random() * 1.2,
    rotate: -120 + Math.random() * 240,
    drift: -70 + Math.random() * 140,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  }));
}
