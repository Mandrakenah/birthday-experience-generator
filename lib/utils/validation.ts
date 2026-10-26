import { DEFAULT_CUSTOM_THEME } from '@/lib/utils/themes';
import type {
  BirthdayProject,
  CustomSticker,
  CustomTheme,
  FontFamily,
  StickerKind,
  ThemeName,
} from '@/types';

// Shared by the editor inputs (maxLength) and the API routes (enforcement).
export const LIMITS = {
  recipient: 60,
  message: 500,
  finalMessage: 200,
  caption: 120,
  wishName: 60,
  wishMessage: 280,
  wishesPerProject: 200,
  stickers: 40,
} as const;

// Record<Union, true> makes the compiler flag a missing member when a union grows.
const THEMES: Record<ThemeName, true> = {
  default: true,
  elegant: true,
  sunset: true,
  ocean: true,
  forest: true,
  sweetheart: true,
  custom: true,
};
const FONTS: Record<FontFamily, true> = { sans: true, serif: true, script: true };
const STICKER_KINDS: Record<StickerKind, true> = {
  teddy: true,
  heart: true,
  star: true,
  balloon: true,
  rainbow: true,
  crown: true,
  flower: true,
  butterfly: true,
};

function isKey<T extends string>(record: Record<T, true>, value: unknown): value is T {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(record, value);
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const color = (v: unknown, fallback: string) =>
  typeof v === 'string' && HEX_COLOR.test(v) ? v : fallback;
const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;

/**
 * True only for files in our own public bucket. Anything else in an <img src>
 * shown to recipients would let a creator point it at a tracking pixel.
 */
export function isOwnMediaUrl(url: unknown): url is string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
  return (
    typeof url === 'string' &&
    Boolean(base) &&
    url.startsWith(`${base}/storage/v1/object/public/birthday-media/`)
  );
}

/**
 * Coerces an untrusted custom_theme blob into a safe CustomTheme. Colors are
 * interpolated into a CSS gradient, so anything but #rrggbb could smuggle in
 * `url(...)`. Used on write (PATCH) and again on render for rows saved before
 * this validation existed.
 */
export function sanitizeCustomTheme(input: unknown): CustomTheme {
  const t = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_CUSTOM_THEME;
  const stickers: CustomSticker[] = (Array.isArray(t.stickers) ? t.stickers : [])
    .slice(0, LIMITS.stickers)
    .flatMap((raw: unknown) => {
      const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
      if (!isKey(STICKER_KINDS, s.kind)) return [];
      return [
        {
          id: typeof s.id === 'string' ? s.id.slice(0, 64) : crypto.randomUUID(),
          kind: s.kind,
          x: clamp(s.x, 0, 1, 0.5),
          y: clamp(s.y, 0, 1, 0.5),
          size: clamp(s.size, 0.04, 0.6, 0.16),
        },
      ];
    });

  return {
    bgFrom: color(t.bgFrom, d.bgFrom),
    bgTo: color(t.bgTo, d.bgTo),
    backgroundImage: isOwnMediaUrl(t.backgroundImage) ? t.backgroundImage : null,
    backgroundOpacity: clamp(t.backgroundOpacity, 0, 1, d.backgroundOpacity),
    textColor: color(t.textColor, d.textColor),
    accentColor: color(t.accentColor, d.accentColor),
    fontFamily: isKey(FONTS, t.fontFamily) ? t.fontFamily : d.fontFamily,
    textScale: clamp(t.textScale, 0.5, 2, d.textScale),
    stickers,
  };
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : null);

/** Validates a PATCH /api/projects body into column updates. */
export function parseProjectUpdate(
  body: Record<string, unknown>
): { updates: Partial<BirthdayProject> } | { error: string } {
  const updates: Partial<BirthdayProject> = {};

  if ('recipient' in body) {
    const v = text(body.recipient, LIMITS.recipient);
    if (v === null) return { error: 'recipient must be a string' };
    updates.recipient = v.trim();
  }
  if ('message' in body) {
    const v = text(body.message, LIMITS.message);
    if (v === null) return { error: 'message must be a string' };
    updates.message = v;
  }
  if ('final_message' in body) {
    const v = text(body.final_message, LIMITS.finalMessage);
    if (v === null) return { error: 'final_message must be a string' };
    updates.final_message = v;
  }
  if ('theme' in body) {
    if (!isKey(THEMES, body.theme)) return { error: 'Unknown theme' };
    updates.theme = body.theme;
  }
  if ('font_family' in body) {
    if (!isKey(FONTS, body.font_family)) return { error: 'Unknown font' };
    updates.font_family = body.font_family;
  }
  if ('custom_theme' in body) {
    updates.custom_theme = body.custom_theme === null ? null : sanitizeCustomTheme(body.custom_theme);
  }
  if ('reveal_at' in body) {
    if (body.reveal_at === null) updates.reveal_at = null;
    else {
      const date = typeof body.reveal_at === 'string' ? new Date(body.reveal_at) : null;
      if (!date || Number.isNaN(date.getTime())) return { error: 'Invalid reveal date' };
      updates.reveal_at = date.toISOString();
    }
  }
  if ('candle_count' in body) {
    if (typeof body.candle_count !== 'number') return { error: 'candle_count must be a number' };
    updates.candle_count = Math.round(clamp(body.candle_count, 1, 10, 5));
  }
  if ('wishes_enabled' in body) {
    if (typeof body.wishes_enabled !== 'boolean') return { error: 'wishes_enabled must be a boolean' };
    updates.wishes_enabled = body.wishes_enabled;
  }

  if (Object.keys(updates).length === 0) return { error: 'No updatable fields provided' };
  return { updates };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

/** Only same-origin relative paths — blocks `//evil.com` open redirects. */
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')
    ? next
    : fallback;
}
