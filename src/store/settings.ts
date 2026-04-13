export type DataSource = 'demo' | 'url' | 'slack';
export type CardShape  = 'rounded' | 'circle';

export interface AppSettings {
  // Data source
  dataSource: DataSource;
  customUrl: string;
  demoUserCount: number;
  // Timing
  featuredDurationSec: number;
  scrollSpeed: number;
  pauseMs: number;
  liftMs: number;
  dismissMs: number;
  // Layout
  numRowsOverride: number; // 0 = auto
  tileGap: number;
  cardSize: number;
  // Card appearance
  cardShape: CardShape;
  showRole: boolean;
  // Theme
  highlightColor: string;
  navColor: string;
  bgColor: string;
  // Display features
  showClock: boolean;
  kioskMode: boolean;
  // Filtering (newline-separated role names to exclude)
  excludedRoles: string;
}

export const DEFAULTS: AppSettings = {
  dataSource: 'demo',
  customUrl: '',
  demoUserCount: 50,
  featuredDurationSec: 5,
  scrollSpeed: 8,
  pauseMs: 700,
  liftMs: 800,
  dismissMs: 1200,
  numRowsOverride: 0,
  tileGap: 0,
  cardSize: 300,
  cardShape: 'rounded',
  showRole: true,
  highlightColor: '#a855f7',
  navColor: '#0f172a',
  bgColor: '#1a2535',
  showClock: false,
  kioskMode: false,
  excludedRoles: '',
};

const KEY = 'facewall_settings';

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
