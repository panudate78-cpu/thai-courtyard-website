import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Thai Courtyard — Authentic Thai Cuisine in East Molesey";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1d1b1a",
          padding: 40,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#c9a14a", fontSize: 16, letterSpacing: 6, textTransform: "uppercase", marginBottom: 16 }}>
          Thai Courtyard • East Molesey
        </div>
        <div style={{ color: "#faf6ee", fontSize: 56, fontWeight: 800, lineHeight: 1 }}>Authentic Thai Cuisine</div>
        <div style={{ color: "#c9a14a", fontSize: 56, fontWeight: 800, lineHeight: 1, marginTop: 6 }}>Near Hampton Court</div>
        <div style={{ color: "rgba(250,246,238,0.7)", fontSize: 18, marginTop: 18, maxWidth: 760 }}>
          Dine in • Collection • Deliveroo • BYOB • Family-friendly • 105 Walton Road, KT8 0DR • Tue–Sat 12–9
        </div>
        <div
          style={{
            marginTop: 22,
            background: "#c9a14a",
            color: "#1d1b1a",
            padding: "10px 22px",
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          Order Collection • Book a Table • 020 8941 3595
        </div>
      </div>
    ),
    { ...size },
  );
}
