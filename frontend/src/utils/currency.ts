export function formatRWF(amount: number): string {
  if (isNaN(amount)) return "0 RWF";

  const rounded = Math.round(amount);
  const formatted = rounded.toLocaleString("en-US"); // adds thousand separators
  return `${formatted} RWF`;
}