type Mood = "good" | "warn" | "bad";

const TONE_FILL: Record<Mood, string> = {
  good: "#34d399", // emerald-400
  warn: "#fbbf24", // amber-400
  bad: "#f87171", // red-400
};

const FEATURE = "#0a0f14";

/**
 * Tiny pixel-art face drawn with crisp <rect>s on a low-res viewBox, matching the
 * PixelFish/PixelPlant style (page.tsx). Three moods express a vital's condition:
 *  - good  → happy (😀/😌/😋)
 *  - warn  → neutral (😐/😬)
 *  - bad   → distressed/sick (🤢/😱/😵)
 * Tinted with the existing good/warn/bad tone colors.
 */
export function PixelFace({
  mood,
  size = 24,
  title,
}: {
  mood: Mood;
  size?: number;
  title?: string;
}) {
  const fill = TONE_FILL[mood];
  return (
    <svg
      className="pixelated"
      viewBox="0 0 10 10"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title}
    >
      {title && <title>{title}</title>}

      {/* round-ish face blob */}
      <rect x="3" y="0" width="4" height="1" fill={fill} />
      <rect x="2" y="1" width="6" height="1" fill={fill} />
      <rect x="1" y="2" width="8" height="6" fill={fill} />
      <rect x="2" y="8" width="6" height="1" fill={fill} />
      <rect x="3" y="9" width="4" height="1" fill={fill} />

      {/* eyes */}
      {mood === "bad" ? (
        // squeezed/sick eyes: small angled marks
        <>
          <rect x="2" y="3" width="2" height="1" fill={FEATURE} />
          <rect x="6" y="3" width="2" height="1" fill={FEATURE} />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="1" height="2" fill={FEATURE} />
          <rect x="6" y="3" width="1" height="2" fill={FEATURE} />
        </>
      )}

      {/* mouth */}
      {mood === "good" && (
        // smile
        <>
          <rect x="3" y="6" width="1" height="1" fill={FEATURE} />
          <rect x="4" y="7" width="2" height="1" fill={FEATURE} />
          <rect x="6" y="6" width="1" height="1" fill={FEATURE} />
        </>
      )}
      {mood === "warn" && (
        // flat mouth
        <rect x="3" y="7" width="4" height="1" fill={FEATURE} />
      )}
      {mood === "bad" && (
        // frown
        <>
          <rect x="3" y="7" width="1" height="1" fill={FEATURE} />
          <rect x="4" y="6" width="2" height="1" fill={FEATURE} />
          <rect x="6" y="7" width="1" height="1" fill={FEATURE} />
        </>
      )}
    </svg>
  );
}
