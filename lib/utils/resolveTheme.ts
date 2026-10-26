import type { CSSProperties } from 'react';
import { fontClasses, themes, type PresetThemeName } from '@/lib/utils/themes';
import { sanitizeCustomTheme } from '@/lib/utils/validation';
import { cn } from '@/lib/utils/cn';
import type { BirthdayProject, CustomTheme } from '@/types';

export interface ResolvedTheme {
  /** Sanitized custom theme, or null for presets. */
  custom: CustomTheme | null;
  /** Background + text color for a full-page themed surface. */
  className: string;
  style: CSSProperties | undefined;
  /** Accent (progress dots, highlights). */
  accentClassName: string;
  accentStyle: CSSProperties | undefined;
  fontClass: string;
  candleColor: string;
}

/** One place that turns a project's theme fields into classes/styles. */
export function resolveTheme(
  project: Pick<BirthdayProject, 'theme' | 'custom_theme' | 'font_family'>
): ResolvedTheme {
  if (project.theme === 'custom') {
    const ct = sanitizeCustomTheme(project.custom_theme);
    return {
      custom: ct,
      className: '',
      style: { background: `linear-gradient(135deg, ${ct.bgFrom}, ${ct.bgTo})`, color: ct.textColor },
      accentClassName: '',
      accentStyle: { color: ct.accentColor },
      fontClass: fontClasses[ct.fontFamily],
      candleColor: ct.accentColor,
    };
  }
  const preset = themes[project.theme as PresetThemeName] ?? themes.default;
  return {
    custom: null,
    className: cn(preset.background, preset.textPrimary),
    style: undefined,
    accentClassName: preset.textAccent,
    accentStyle: undefined,
    fontClass: fontClasses[project.font_family] ?? fontClasses.sans,
    candleColor: preset.candleColor,
  };
}
