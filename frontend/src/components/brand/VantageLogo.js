import React from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";

const FULL = { width: 420, height: 130 };
const COMPACT = { width: 280, height: 86 };

export default function VantageLogo({ width, height, compact = false, ...boxProps }) {
  const w = width ?? (compact ? COMPACT.width : FULL.width);
  const h = height ?? (compact ? COMPACT.height : FULL.height);

  const isDark = useColorModeValue(false, true);

  const darkSvg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 130"
      width={w}
      height={h}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="vantage-grad-dark" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#6C63FF" }} />
          <stop offset="100%" style={{ stopColor: "#3ECFCF" }} />
        </linearGradient>
      </defs>

      <rect x="0" y="5" width="105" height="105" rx="20" fill="#111111" />
      <polyline
        points="15,30 40,30 55,72 70,30 95,30"
        stroke="url(#vantage-grad-dark)"
        strokeWidth="7"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="55" cy="75" r="5" fill="#3ECFCF" />
      <polygon points="55,88 61,100 49,100" fill="#6C63FF" opacity="0.6" />

      <text
        x="122"
        y="55"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontSize="38"
        fontWeight="900"
        fill="url(#vantage-grad-dark)"
        letterSpacing="3"
      >
        VANTAGE
      </text>

      <line x1="122" y1="65" x2="390" y2="65" stroke="#6C63FF" strokeWidth="1" opacity="0.4" />

      <text
        x="123"
        y="82"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontSize="11"
        fill="#888888"
        letterSpacing="3.5"
        fontWeight="300"
      >
        REBALANCING  DASHBOARD
      </text>

      <rect x="122" y="92" width="155" height="22" rx="11" fill="#111111" />
      <text
        x="133"
        y="107"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontSize="10.5"
        fill="#888888"
      >
        Built for{" "}
      </text>
      <text
        x="180"
        y="107"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontSize="10.5"
        fontWeight="700"
        fill="#3ECFCF"
      >
        W by Groww
      </text>
    </svg>
  );

  const lightSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 130" width={w} height={h} style={{ display: "block" }}>
      <defs>
        <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#5A52E0" }} />
          <stop offset="100%" style={{ stopColor: "#1AAFAF" }} />
        </linearGradient>
        <linearGradient id="g2b" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#5A52E0" }} />
          <stop offset="100%" style={{ stopColor: "#1AAFAF" }} />
        </linearGradient>
      </defs>

      <rect x="0" y="5" width="105" height="105" rx="20" fill="#F0EFFF" />

      <polyline points="15,30 40,30 55,72 70,30 95,30"
                stroke="url(#g2)" strokeWidth="7" fill="none"
                strokeLinejoin="round" strokeLinecap="round" />

      <circle cx="55" cy="75" r="5" fill="#1AAFAF" />

      <polygon points="55,88 61,100 49,100" fill="#5A52E0" opacity="0.5" />

      <text x="122" y="55" fontFamily="'Segoe UI', Arial, sans-serif"
            fontSize="38" fontWeight="900" fill="url(#g2)" letterSpacing="3">VANTAGE</text>

      <line x1="122" y1="65" x2="390" y2="65" stroke="#5A52E0" strokeWidth="1" opacity="0.25" />

      <text x="123" y="82" fontFamily="'Segoe UI', Arial, sans-serif"
            fontSize="11" fill="#999" letterSpacing="3.5" fontWeight="400">REBALANCING  DASHBOARD</text>

      <rect x="122" y="92" width="155" height="22" rx="11" fill="#EEEEFF" stroke="#D5D3FA" strokeWidth="1" />

      <text x="133" y="107" fontFamily="'Segoe UI', Arial, sans-serif"
            fontSize="10.5" fill="#888">Built for </text>
      <text x="180" y="107" fontFamily="'Segoe UI', Arial, sans-serif"
            fontSize="10.5" fontWeight="700" fill="#1AAFAF">W by Groww</text>
    </svg>
  );

  return <Box display="inline-flex" {...boxProps}>{isDark ? darkSvg : lightSvg}</Box>;
}
