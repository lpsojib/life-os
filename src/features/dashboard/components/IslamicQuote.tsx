"use client";

const COLORS = {
  teal: "#2A6459",
  tealSoft: "#E3EFEA",
  ink: "#2A2318",
};

const ayatQuote =
  "মানুষের জন্য তা-ই আছে যার জন্য সে চেষ্টা করে, তার প্রচেষ্টা শীঘ্রই দেখা হবে, তারপর তাকে তার পূর্ণ প্রতিদান দেওয়া হবে।";

const ayatSource =
  "সূরা আন-নাজম (৫৩:৩৯-৪১)";

export default function IslamicQuote() {
  return (
    <div
      className="px-4 py-3.5 rounded-2xl mb-5"
      style={{
        background: COLORS.tealSoft,
        borderLeft: `3px solid ${COLORS.teal}`,
      }}
    >
      <p
        style={{
          fontFamily:
            "'Noto Serif Bengali', serif",
          fontSize: "14px",
          lineHeight: 1.7,
          color: COLORS.ink,
        }}
      >
        <span>&quot;</span>
        {ayatQuote}
        <span>&quot;</span>
      </p>

      <p
        className="text-xs mt-1.5"
        style={{
          color: COLORS.teal,
          fontWeight: 600,
        }}
      >
        — {ayatSource}
      </p>
    </div>
  );
}