// ============================================================
// types/index.ts
// ============================================================

export type ProjectStatus = 'draft' | 'published';

export type MediaType = 'photo' | 'video' | 'music';

export type ThemeName =
  | 'default'     // Purple/pink — romantic
  | 'elegant'     // Black/gold — classy
  | 'sunset'      // Orange/red — warm
  | 'ocean'       // Blue/teal — calm
  | 'forest'      // Green/brown — natural
  | 'sweetheart'  // Rose/pink — cute, hearts (lovers / teens)
  | 'custom';     // Fully creator-customized (see CustomTheme)

// Preset cute stickers the creator can drop onto a custom page.
export type StickerKind =
  | 'teddy'
  | 'heart'
  | 'star'
  | 'balloon'
  | 'rainbow'
  | 'crown'
  | 'flower'
  | 'butterfly';

// One placed sticker. Position/size are fractions of the page so they scale
// identically in the editor canvas and the full-screen experience.
export interface CustomSticker {
  id: string;
  kind: StickerKind;
  x: number;    // 0..1 — center x as a fraction of width
  y: number;    // 0..1 — center y as a fraction of height
  size: number; // 0..1 — width as a fraction of the page width
}

// Everything the "custom" theme lets a creator control.
export interface CustomTheme {
  bgFrom: string;            // background gradient start (CSS color)
  bgTo: string;              // background gradient end (CSS color)
  backgroundImage: string | null;
  backgroundOpacity: number; // 0..1 — opacity of the background image
  textColor: string;         // CSS color
  accentColor: string;       // CSS color (candles, dots)
  fontFamily: FontFamily;
  textScale: number;         // heading scale multiplier (e.g. 0.85 / 1 / 1.2)
  stickers: CustomSticker[];
}

export type FontFamily = 'sans' | 'serif' | 'script';

export interface BirthdayProject {
  id: string;
  creator_id: string;
  slug: string | null;
  recipient: string;
  theme: ThemeName;
  message: string;
  final_message: string;
  status: ProjectStatus;
  font_family: FontFamily;
  custom_theme: CustomTheme | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  type: MediaType;
  storage_path: string;
  public_url: string;
  caption: string;
  sort_order: number;
  created_at: string;
}

export interface ExperienceData {
  project: BirthdayProject;
  photos: ProjectMedia[];
  video: ProjectMedia | null;
  music: ProjectMedia | null;
}

export type SceneId =
  | 'tap-to-start'
  | 'welcome'
  | 'slideshow'
  | 'message'
  | 'video'
  | 'cake'
  | 'fireworks'
  | 'finale';

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  background: string;     // Tailwind class or CSS gradient
  textPrimary: string;
  textAccent: string;
  candleColor: string;
}
