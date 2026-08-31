import { STICKERS } from '@/components/experience/Stickers';
import type { CustomSticker } from '@/types';

// Read-only render of placed stickers, positioned/sized by fraction so they
// match the editor canvas. Used as an overlay in the custom-theme experience.
// Defensive: custom_theme is owner-controlled JSON rendered to recipients, so
// tolerate a malformed blob (non-array / unknown sticker kind) without crashing.
export function CustomStickers({ stickers }: { stickers: CustomSticker[] }) {
  const valid = Array.isArray(stickers) ? stickers.filter((s) => s && STICKERS[s.kind]) : [];
  if (!valid.length) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {valid.map((s) => {
        const { Sticker } = STICKERS[s.kind];
        return (
          <span
            key={s.id}
            className="absolute"
            style={{
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              width: `${s.size * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <Sticker className="h-auto w-full" />
          </span>
        );
      })}
    </div>
  );
}
