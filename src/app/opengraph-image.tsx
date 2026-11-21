import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Thai Courtyard — Authentic Thai Cuisine in East Molesey, near Hampton Court";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Try to read DB config — but edge runtime has no DB; fallback to env/SITE defaults
  let name = "Thai Courtyard";
  let locality = "East Molesey";
  let street = "Walton Road";
  let postcode = "KT8 0DR";
  let phone = "020 8941 3595";
  let hoursShort = "Tue–Sat 12:00–21:00";
  let siteHost = "thaicourtyardmolesey.co.uk";
  let cuisine = "Authentic Thai";
  try {
    // Edge cannot use pg pool; read from env that setup wizard sets
    name = process.env.NEXT_PUBLIC_RESTAURANT_NAME || name;
    locality = process.env.NEXT_PUBLIC_ADDRESS_LOCALITY || locality;
    // For full DB fidelity, the Node route will override via /opengraph dynamic; edge is fallback
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#1d1b1a",
          padding: 48,
          position: "relative",
        }}
      >
        {/* Subtle thai pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' stroke='%23c9a14a' stroke-opacity='0.9'%3E%3Cpath d='M32 6 58 32 32 58 6 32Z'/%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                background: "#c9a14a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1d1b1a",
                fontSize: 22,
                fontWeight: 800,
              }}
            >
              TC
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "#e3c77f", fontSize: 22, letterSpacing: 1, fontWeight: 700 }}>{name}</span>
              <span style={{ color: "#faf6ee", opacity: 0.6, fontSize: 11, letterSpacing: 4, textTransform: "uppercase" }}>
                {locality} • Simply Delicious
              </span>
            </div>
          </div>
          <div
            style={{
              color: "#e3c77f",
              border: "1px solid rgba(201,161,74,0.35)",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 12,
              letterSpacing: 1.5,
            }}
          >
            {street.toUpperCase()} • {postcode}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              display: "inline-flex",
              alignSelf: "flex-start",
              background: "rgba(201,161,74,0.15)",
              border: "1px solid rgba(201,161,74,0.3)",
              color: "#e3c77f",
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 12,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            ★ Authentic Thai • Family Friendly • BYOB
          </div>
          <div style={{ color: "#faf6ee", fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: -1 }}>
            Authentic Thai
            <br />
            <span style={{ color: "#c9a14a" }}>in {locality}</span>
          </div>
          <div style={{ color: "rgba(250,246,238,0.75)", fontSize: 20, maxWidth: 720, lineHeight: 1.4 }}>
            Dine in, book a table or order for collection — freshly prepared, every time. Near Hampton Court Palace.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, color: "rgba(250,246,238,0.7)", fontSize: 14 }}>
            <span style={{ background: "rgba(250,246,238,0.1)", padding: "6px 12px", borderRadius: 999 }}>{hoursShort}</span>
            <span style={{ background: "rgba(250,246,238,0.1)", padding: "6px 12px", borderRadius: 999 }}>{phone}</span>
          </div>
          <div style={{ color: "#c9a14a", fontSize: 14, letterSpacing: 1 }}>{siteHost}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
