// lib/utils/themes.ts
import type { CustomTheme, FontFamily, ThemeConfig, ThemeName } from '@/types';

// Starting point for the "custom" theme builder.
export const DEFAULT_CUSTOM_THEME: CustomTheme = {
  bgFrom: '#fce7f3',
  bgTo: '#ede9fe',
  backgroundImage: null,
  backgroundOpacity: 0.5,
  textColor: '#3b0764',
  accentColor: '#db2777',
  fontFamily: 'sans',
  textScale: 1,
  stickers: [],
};

// font_family column → Tailwind utility (font-script comes from the
// @theme token in globals.css — see SPEC_PATCHES Patch 4).
export const fontClasses: Record<FontFamily, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  script: 'font-script',
};

// 'custom' is built per-project (see CustomTheme), so it has no preset config.
export type PresetThemeName = Exclude<ThemeName, 'custom'>;

export const themes: Record<PresetThemeName, ThemeConfig> = {
  default: {
    name: 'default',
    label: 'Romantic',
    background: 'bg-gradient-to-br from-pink-100 via-purple-100 to-rose-100',
    textPrimary: 'text-purple-900',
    textAccent: 'text-pink-600',
    candleColor: '#FFC107',
  },
  elegant: {
    name: 'elegant',
    label: 'Elegant',
    background: 'bg-gradient-to-br from-black via-gray-900 to-yellow-900',
    textPrimary: 'text-yellow-50',
    textAccent: 'text-yellow-400',
    candleColor: '#FFD700',
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    background: 'bg-gradient-to-br from-orange-200 via-red-200 to-pink-200',
    textPrimary: 'text-orange-900',
    textAccent: 'text-red-600',
    candleColor: '#FF6B35',
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean',
    background: 'bg-gradient-to-br from-blue-100 via-teal-100 to-cyan-100',
    textPrimary: 'text-blue-900',
    textAccent: 'text-teal-600',
    candleColor: '#06B6D4',
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    background: 'bg-gradient-to-br from-green-100 via-emerald-100 to-lime-100',
    textPrimary: 'text-green-900',
    textAccent: 'text-emerald-700',
    candleColor: '#84CC16',
  },
  sweetheart: {
    name: 'sweetheart',
    label: 'Sweetheart',
    background: 'bg-gradient-to-br from-rose-200 via-pink-200 to-fuchsia-200',
    textPrimary: 'text-rose-900',
    textAccent: 'text-rose-500',
    candleColor: '#FB7185',
  },
};
