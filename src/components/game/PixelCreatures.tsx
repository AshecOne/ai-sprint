"use client";

/**
 * Shared pixel-art creatures used by the lobby background and the in-game
 * loading screen, so both stay visually identical. Drawn with crisp <rect>s
 * on a low-res viewBox; their motion (swim/bob/sway) is handled in CSS via the
 * `.lobby-*` classes passed through `className`.
 */

/** Tiny pixel-art fish. */
export function PixelFish({
  className,
  color,
  belly,
}: {
  className?: string;
  color: string;
  belly: string;
}) {
  return (
    <svg
      className={`pixelated ${className ?? ""}`}
      viewBox="0 0 16 10"
      width="48"
      height="30"
      shapeRendering="crispEdges"
    >
      {/* tail */}
      <rect x="0" y="3" width="2" height="1" fill={color} />
      <rect x="0" y="6" width="2" height="1" fill={color} />
      <rect x="1" y="4" width="2" height="2" fill={color} />
      {/* body */}
      <rect x="3" y="3" width="8" height="4" fill={color} />
      <rect x="4" y="2" width="6" height="1" fill={color} />
      <rect x="4" y="7" width="6" height="1" fill={color} />
      <rect x="11" y="4" width="2" height="2" fill={color} />
      {/* belly highlight */}
      <rect x="4" y="5" width="6" height="2" fill={belly} opacity="0.55" />
      {/* eye */}
      <rect x="10" y="4" width="1" height="1" fill="#061018" />
    </svg>
  );
}

/** Simple pixel seaweed; sway handled in CSS. */
export function PixelPlant({ className }: { className?: string }) {
  return (
    <svg
      className={`pixelated ${className ?? ""}`}
      viewBox="0 0 8 24"
      width="24"
      height="72"
      shapeRendering="crispEdges"
    >
      <rect x="3" y="2" width="2" height="22" fill="#2f7d4f" />
      <rect x="1" y="6" width="2" height="2" fill="#3aa15f" />
      <rect x="5" y="10" width="2" height="2" fill="#3aa15f" />
      <rect x="1" y="14" width="2" height="2" fill="#2f7d4f" />
      <rect x="5" y="18" width="2" height="2" fill="#2f7d4f" />
      <rect x="3" y="0" width="2" height="2" fill="#3aa15f" />
    </svg>
  );
}
