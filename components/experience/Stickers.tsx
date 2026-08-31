import type { ComponentType, SVGProps } from 'react';
import type { StickerKind } from '@/types';

// Cute preset stickers for the custom theme. Filled, colorful, 64x64 grid.
// Size is controlled by the consumer via className/width.

type Props = SVGProps<SVGSVGElement>;

function S({ children, ...props }: Props) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

function Teddy(props: Props) {
  return (
    <S {...props}>
      <circle cx="20" cy="16" r="8" fill="#8d5524" />
      <circle cx="44" cy="16" r="8" fill="#8d5524" />
      <circle cx="20" cy="16" r="4" fill="#c08a55" />
      <circle cx="44" cy="16" r="4" fill="#c08a55" />
      <circle cx="32" cy="34" r="20" fill="#a0673a" />
      <ellipse cx="32" cy="40" rx="11" ry="9" fill="#eccfac" />
      <circle cx="24" cy="30" r="3" fill="#2b1a12" />
      <circle cx="40" cy="30" r="3" fill="#2b1a12" />
      <ellipse cx="32" cy="37" rx="3" ry="2.2" fill="#2b1a12" />
    </S>
  );
}

function Heart(props: Props) {
  return (
    <S {...props}>
      <path
        d="M32 55C9 40 7 23 18 17c8-4 14 2 14 6 0-4 6-10 14-6 11 6 9 23-14 38Z"
        fill="#ef4444"
      />
      <ellipse cx="22" cy="24" rx="4" ry="6" fill="#fff" opacity="0.35" transform="rotate(-25 22 24)" />
    </S>
  );
}

function Star(props: Props) {
  return (
    <S {...props}>
      <path
        d="M32 6l7 18h18L43 36l5 20-16-12-16 12 5-20L4 24h18z"
        fill="#fbbf24"
      />
    </S>
  );
}

function Balloon(props: Props) {
  return (
    <S {...props}>
      <ellipse cx="32" cy="25" rx="18" ry="22" fill="#f472b6" />
      <path d="M32 47l-3 6h6z" fill="#ec4899" />
      <path d="M32 53c4 5-2 7 0 11" stroke="#9ca3af" strokeWidth="1.5" fill="none" />
      <ellipse cx="25" cy="17" rx="4" ry="6" fill="#fff" opacity="0.4" />
    </S>
  );
}

function Rainbow(props: Props) {
  const arcs = [
    { r: 24, c: '#ef4444' },
    { r: 20, c: '#f59e0b' },
    { r: 16, c: '#facc15' },
    { r: 12, c: '#22c55e' },
    { r: 8, c: '#3b82f6' },
  ];
  return (
    <S {...props}>
      {arcs.map((a) => (
        <path
          key={a.r}
          d={`M${32 - a.r} 46a${a.r} ${a.r} 0 0 1 ${a.r * 2} 0`}
          stroke={a.c}
          strokeWidth="4"
          fill="none"
        />
      ))}
    </S>
  );
}

function Crown(props: Props) {
  return (
    <S {...props}>
      <path d="M10 46L14 22l10 12 8-16 8 16 10-12 4 24z" fill="#fbbf24" />
      <rect x="10" y="44" width="44" height="7" rx="2" fill="#f59e0b" />
      <circle cx="32" cy="20" r="3" fill="#ef4444" />
      <circle cx="14" cy="22" r="2.5" fill="#3b82f6" />
      <circle cx="50" cy="22" r="2.5" fill="#3b82f6" />
    </S>
  );
}

function Flower(props: Props) {
  return (
    <S {...props}>
      <g fill="#f472b6">
        <circle cx="32" cy="16" r="9" />
        <circle cx="48" cy="28" r="9" />
        <circle cx="42" cy="46" r="9" />
        <circle cx="22" cy="46" r="9" />
        <circle cx="16" cy="28" r="9" />
      </g>
      <circle cx="32" cy="32" r="9" fill="#fde047" />
    </S>
  );
}

function Butterfly(props: Props) {
  return (
    <S {...props}>
      <ellipse cx="22" cy="24" rx="13" ry="11" fill="#a78bfa" />
      <ellipse cx="42" cy="24" rx="13" ry="11" fill="#a78bfa" />
      <ellipse cx="24" cy="42" rx="10" ry="9" fill="#f472b6" />
      <ellipse cx="40" cy="42" rx="10" ry="9" fill="#f472b6" />
      <rect x="31" y="16" width="2.5" height="33" rx="1.25" fill="#4b5563" />
    </S>
  );
}

export const STICKERS: Record<StickerKind, { label: string; Sticker: ComponentType<Props> }> = {
  teddy: { label: 'Teddy', Sticker: Teddy },
  heart: { label: 'Heart', Sticker: Heart },
  star: { label: 'Star', Sticker: Star },
  balloon: { label: 'Balloon', Sticker: Balloon },
  rainbow: { label: 'Rainbow', Sticker: Rainbow },
  crown: { label: 'Crown', Sticker: Crown },
  flower: { label: 'Flower', Sticker: Flower },
  butterfly: { label: 'Butterfly', Sticker: Butterfly },
};

export const STICKER_KINDS = Object.keys(STICKERS) as StickerKind[];
