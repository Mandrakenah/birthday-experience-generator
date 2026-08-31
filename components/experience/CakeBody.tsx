// Static cake drawing shared by CakeScene and the landing PhonePreview, so the
// preview shows the real cake. Renders SVG elements — place inside an
// <svg viewBox="0 0 320 270">. Candles are added separately on the top tier.

export const CAKE_WIDTH = 320;

/** Evenly spaced candle x-positions across the top tier. */
export function candleXs(count: number): number[] {
  const spacing = 160 / (count + 1);
  return Array.from({ length: count }, (_, i) => 80 + spacing * (i + 1));
}

// A row of frosting drips hanging off a tier's bottom edge.
function Drips({ x, width, y }: { x: number; width: number; y: number }) {
  const count = Math.max(3, Math.round(width / 28));
  const step = width / count;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const cx = x + step / 2 + i * step;
        const r = 5 + (i % 2 === 0 ? 2 : 0);
        return <circle key={i} cx={cx} cy={y + (i % 2 === 0 ? 1 : 3)} r={r} fill="url(#cakeFrost)" />;
      })}
    </>
  );
}

const SPRINKLES = [
  { x: 96, y: 226, c: '#FF6B9D', r: 22 },
  { x: 132, y: 232, c: '#7DD3FC', r: -18 },
  { x: 170, y: 228, c: '#FFD700', r: 40 },
  { x: 206, y: 233, c: '#A78BFA', r: -30 },
  { x: 238, y: 227, c: '#84CC16', r: 15 },
  { x: 112, y: 186, c: '#FFD700', r: -25 },
  { x: 158, y: 188, c: '#FF6B9D', r: 30 },
  { x: 198, y: 185, c: '#7DD3FC', r: -12 },
];

export function CakeBody() {
  return (
    <>
      <defs>
        <linearGradient id="cakeSponge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F6D5A8" />
          <stop offset="100%" stopColor="#D99A57" />
        </linearGradient>
        <linearGradient id="cakeFrost" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F7B8D2" />
        </linearGradient>
        <linearGradient id="cakePlate" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#C7D0DC" />
        </linearGradient>
      </defs>

      {/* cast shadow + plate */}
      <ellipse cx={160} cy={257} rx={120} ry={9} fill="#000000" opacity={0.12} />
      <ellipse cx={160} cy={250} rx={140} ry={15} fill="url(#cakePlate)" />
      <ellipse cx={160} cy={246} rx={130} ry={10} fill="#FFFFFF" opacity={0.5} />

      {/* bottom tier */}
      <rect x={60} y={196} width={200} height={52} rx={12} fill="url(#cakeSponge)" />
      <rect x={66} y={200} width={9} height={44} rx={4} fill="#FFFFFF" opacity={0.12} />
      <rect x={60} y={190} width={200} height={20} rx={10} fill="url(#cakeFrost)" />
      <Drips x={60} width={200} y={210} />

      {/* middle tier */}
      <rect x={85} y={156} width={150} height={42} rx={11} fill="url(#cakeSponge)" />
      <rect x={91} y={160} width={8} height={34} rx={4} fill="#FFFFFF" opacity={0.12} />
      <rect x={85} y={150} width={150} height={16} rx={8} fill="url(#cakeFrost)" />
      <Drips x={85} width={150} y={166} />

      {/* top tier */}
      <rect x={105} y={124} width={110} height={34} rx={10} fill="url(#cakeSponge)" />
      <rect x={110} y={128} width={7} height={28} rx={3} fill="#FFFFFF" opacity={0.12} />
      <rect x={105} y={118} width={110} height={14} rx={7} fill="url(#cakeFrost)" />
      <Drips x={105} width={110} y={132} />

      {/* sprinkles */}
      {SPRINKLES.map((s, i) => (
        <rect
          key={i}
          x={s.x}
          y={s.y}
          width={9}
          height={3.4}
          rx={1.7}
          fill={s.c}
          transform={`rotate(${s.r} ${s.x + 4.5} ${s.y + 1.7})`}
        />
      ))}
    </>
  );
}
