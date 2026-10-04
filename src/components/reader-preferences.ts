export type TextSize = 'small' | 'normal' | 'large';
const key = 'literary-detective-reader-text-size';

export function textSizeOf(value: unknown): TextSize {
  return value === 'small' || value === 'large' ? value : 'normal';
}

export function loadTextSize(): TextSize {
  try { return textSizeOf(globalThis.localStorage.getItem(key)); }
  catch { return 'normal'; }
}

export function saveTextSize(value: TextSize): void {
  // Reading preferences remain usable when browser storage is unavailable.
  // They are independent of the evidence record and its saved checkpoints.
  try { globalThis.localStorage.setItem(key, value); }
  catch { /* Keep this session's selection. */ }
}
