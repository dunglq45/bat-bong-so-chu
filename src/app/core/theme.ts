// Design tokens ported from tokens.json / theme.ts (thiết kế Bắt Bóng Số & Chữ)
export type BalloonColorName = 'dau' | 'cam' | 'chanh' | 'tao' | 'bien' | 'nho';

export interface BalloonPalette {
  highlight: string;
  base: string;
  shade: string;
}

export const BALLOON_COLORS: Record<BalloonColorName, BalloonPalette> = {
  dau: { highlight: '#FFC2D4', base: '#FF5C8A', shade: '#E23D6D' },
  cam: { highlight: '#FFD2B0', base: '#FF8A3D', shade: '#E86A1C' },
  chanh: { highlight: '#FFF0B8', base: '#FFC93C', shade: '#F0A91A' },
  tao: { highlight: '#C9F2C4', base: '#4CC76B', shade: '#2FA64F' },
  bien: { highlight: '#BFE0FF', base: '#3D9BFF', shade: '#1F79E0' },
  nho: { highlight: '#DCCBFF', base: '#9B6BFF', shade: '#7A48E8' },
};

export const BALLOON_COLOR_NAMES = Object.keys(BALLOON_COLORS) as BalloonColorName[];

export const MOTION = {
  popMs: 400,
  starFlyMs: 600,
  wobbleMs: 300,
  hintMs: 1200,
  hintDelayMs: 5000,
  confettiMs: 1500,
  pressMs: 120,
  balloonRiseMs: [8000, 10000] as const,
  easePop: 'cubic-bezier(.34,1.56,.64,1)',
} as const;

export const BREAKPOINT = { phoneMax: 600, tabletMin: 900 } as const;

export const VN_ALPHABET = [
  'A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M',
  'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y',
] as const;

export type GameMode = 'number' | 'letter';

export interface LevelDef {
  index: number;
  /** Giá trị hiển thị trên bóng / có thể là đích (số hoặc chữ cái) */
  pool: string[];
}

const NUMBER_RANGES = [5, 10, 15, 20, 30, 40, 50];

/** Chia đều `arr` thành đúng `groupCount` nhóm (nhóm đầu nhận phần dư nếu chia không hết). */
function splitEvenly<T>(arr: readonly T[], groupCount: number): T[][] {
  const base = Math.floor(arr.length / groupCount);
  const remainder = arr.length % groupCount;
  const out: T[][] = [];
  let start = 0;
  for (let i = 0; i < groupCount; i++) {
    const size = base + (i < remainder ? 1 : 0);
    out.push(arr.slice(start, start + size) as T[]);
    start += size;
  }
  return out;
}

export const NUMBER_LEVELS: LevelDef[] = NUMBER_RANGES.map((max, index) => ({
  index,
  pool: Array.from({ length: max }, (_, i) => String(i + 1)),
}));

export const LETTER_LEVELS: LevelDef[] = splitEvenly(VN_ALPHABET, 7).map((group, index) => ({
  index,
  pool: [...group],
}));

export const CORRECT_CATCHES_PER_LEVEL = 5;

export const PRAISE_PHRASES = [
  'Giỏi quá!',
  'Tuyệt vời!',
  'Con làm được rồi!',
  'Bé giỏi lắm!',
  'Xuất sắc!',
] as const;

export function levelsFor(mode: GameMode): LevelDef[] {
  return mode === 'number' ? NUMBER_LEVELS : LETTER_LEVELS;
}

export function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomBalloonColor(): BalloonColorName {
  return randomItem(BALLOON_COLOR_NAMES);
}
