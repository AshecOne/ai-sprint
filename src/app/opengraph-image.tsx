import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AquaSim — Pixel Aquarium Simulator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #062436 0%, #04141f 55%, #020c14 100%)",
          fontFamily: "ui-monospace, Menlo, 'Courier New', monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "50%",
            width: 900,
            height: 350,
            marginLeft: -450,
            background:
              "radial-gradient(ellipse, rgba(34,211,238,0.2) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Light rays */}
        {[
          { left: 280, rotate: "-14deg", w: 4, o: 0.11 },
          { left: 460, rotate: "-5deg", w: 7, o: 0.08 },
          { left: 640, rotate: "2deg", w: 5, o: 0.10 },
          { left: 820, rotate: "9deg", w: 3, o: 0.07 },
          { left: 1000, rotate: "16deg", w: 4, o: 0.06 },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: r.left,
              width: r.w,
              height: 630,
              background: `linear-gradient(180deg, rgba(165,243,252,${r.o}) 0%, transparent 85%)`,
              transform: `rotate(${r.rotate})`,
            }}
          />
        ))}

        {/* Bubbles */}
        {[
          { l: 90, b: 230, s: 14 },
          { l: 175, b: 350, s: 9 },
          { l: 330, b: 180, s: 20 },
          { l: 430, b: 300, s: 11 },
          { l: 860, b: 290, s: 15 },
          { l: 970, b: 190, s: 10 },
          { l: 1070, b: 270, s: 18 },
          { l: 1140, b: 390, s: 8 },
        ].map((b, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.l,
              bottom: b.b,
              width: b.s,
              height: b.s,
              borderRadius: "50%",
              border: "2px solid rgba(165,243,252,0.4)",
              background: "rgba(165,243,252,0.07)",
            }}
          />
        ))}

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#22d3ee",
              letterSpacing: "0.38em",
              textTransform: "uppercase" as const,
              marginBottom: 22,
              opacity: 0.8,
              display: "flex",
            }}
          >
            PIXEL AQUARIUM SIMULATOR
          </div>

          {/* AQUASIM title */}
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 26 }}
          >
            <span
              style={{
                fontSize: 108,
                fontWeight: 900,
                color: "#22d3ee",
                letterSpacing: "-3px",
                lineHeight: 1,
              }}
            >
              AQUA
            </span>
            <span
              style={{
                fontSize: 108,
                fontWeight: 900,
                color: "#f5b461",
                letterSpacing: "-3px",
                lineHeight: 1,
              }}
            >
              SIM
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              width: 500,
              height: 2,
              background: "rgba(34,211,238,0.3)",
              marginBottom: 26,
            }}
          />

          {/* Tag chips */}
          <div style={{ display: "flex", gap: 12 }}>
            {[
              "7 jenis ikan",
              "kimia air real-time",
              "tanaman akuatik",
              "pixel art",
            ].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: "6px 18px",
                  border: "1px solid rgba(34,211,238,0.3)",
                  borderRadius: 999,
                  fontSize: 14,
                  color: "#9bb4cf",
                  background: "rgba(34,211,238,0.07)",
                  display: "flex",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>

        {/* Substrate floor */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 78,
            background:
              "linear-gradient(180deg, transparent 0%, #0b1e2d 50%, #060f18 100%)",
            borderTop: "2px solid #103245",
            display: "flex",
          }}
        />

        {/* Plants — left cluster */}
        <div
          style={{
            position: "absolute",
            bottom: 76,
            left: 72,
            display: "flex",
            gap: 6,
            alignItems: "flex-end",
          }}
        >
          {[96, 148, 82, 128, 108, 88, 136, 100].map((h, i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: h,
                background: i % 2 === 0 ? "#2f7d4f" : "#3aa15f",
                borderRadius: "3px 3px 0 0",
                display: "flex",
              }}
            />
          ))}
        </div>

        {/* Plants — right cluster */}
        <div
          style={{
            position: "absolute",
            bottom: 76,
            right: 72,
            display: "flex",
            gap: 6,
            alignItems: "flex-end",
          }}
        >
          {[88, 132, 104, 76, 118, 96, 142, 110].map((h, i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: h,
                background: i % 2 === 0 ? "#3aa15f" : "#2f7d4f",
                borderRadius: "3px 3px 0 0",
                display: "flex",
              }}
            />
          ))}
        </div>

        {/* Glass frame */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "5px solid rgba(34,211,238,0.1)",
            display: "flex",
          }}
        />

        {/* Corner accents */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            width: 36,
            height: 36,
            borderTop: "3px solid rgba(34,211,238,0.5)",
            borderLeft: "3px solid rgba(34,211,238,0.5)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 36,
            height: 36,
            borderTop: "3px solid rgba(34,211,238,0.5)",
            borderRight: "3px solid rgba(34,211,238,0.5)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            width: 36,
            height: 36,
            borderBottom: "3px solid rgba(34,211,238,0.5)",
            borderLeft: "3px solid rgba(34,211,238,0.5)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            width: 36,
            height: 36,
            borderBottom: "3px solid rgba(34,211,238,0.5)",
            borderRight: "3px solid rgba(34,211,238,0.5)",
            display: "flex",
          }}
        />

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 22,
            right: 30,
            fontSize: 13,
            color: "#2a4d6e",
            letterSpacing: "0.08em",
            display: "flex",
          }}
        >
          ai-sprint-liart.vercel.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
