import { PALETTE, SPRITES } from "../lib/sprites";

export const Sprite = ({ name, size = 20, className = "" }: { name: keyof typeof SPRITES; size?: number; className?: string }) => {
  const rows = SPRITES[name];
  return (
    <svg
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden
    >
      {rows.flatMap((row, y) =>
        [...row].map((key, x) =>
          key === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[key]} />,
        ),
      )}
    </svg>
  );
};

export const Mascot = ({ className = "" }: { className?: string }) => (
  <img src="/mascot.png" alt="" className={`pixelated select-none ${className}`} draggable={false} />
);
