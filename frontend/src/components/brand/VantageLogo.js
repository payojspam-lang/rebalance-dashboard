import React from "react";
import { Box, useColorModeValue } from "@chakra-ui/react";

const FULL = { width: 420, height: 130 };
const COMPACT = { width: 280, height: 86 };

export default function VantageLogo({ width, height, compact = false, ...boxProps }) {
  const w = width ?? (compact ? COMPACT.width : FULL.width);
  const h = height ?? (compact ? COMPACT.height : FULL.height);

  // On light backgrounds, wrap in a dark pill so the logo stays readable
  const needsWrapper = useColorModeValue(true, false);
  const wrapperBg = "#0F0F1A";

  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 420 130"
      width={w}
      height={h}
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id="vantage-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: "#6C63FF" }} />
          <stop offset="100%" style={{ stopColor: "#3ECFCF" }} />
        </linearGradient>
      </defs>

      {/* Background pill */}
      <rect x="0" y="5" width="105" height="105" rx="20" fill="#0F0F1A" />

      {/* V shape */}
      <polyline
        points="15,30 40,30 55,72 70,30 95,30"
        stroke="url(#vantage-grad)"
        strokeWidth="7"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dot at V bottom */}
      <circle cx="55" cy="75" r="5" fill="#3ECFCF" />

      {/* Small upward arrow */}
      <polygon points="55,88 61,100 49,100" fill="#6C63FF" opacity="0.6" />

      {/* VANTAGE text */}
      <text
        x="122"
        y="55"
        fontFamily="'Segoe UI', Arial, sans-serif"
        fontSize="38"
        fontWeight="900"
        fill="url(#vantage-grad)"
        letterSpacing="3"
      >
        VANTAGE
      </text>

      {/* Separator line */}
      <line x1="122" y1="65" x2="390" y2="65" stroke="#6C63FF" strokeWidth="1" opacity="0.4" />

      {/* Subtitle */}
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

      {/* Built for W by Groww badge */}
      <rect x="122" y="92" width="155" height="22" rx="11" fill="#0F0F1A" />
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

  if (needsWrapper) {
    return (
      <Box
        display="inline-flex"
        bg={wrapperBg}
        borderRadius="20px"
        p="12px 20px"
        {...boxProps}
      >
        {svg}
      </Box>
    );
  }

  return <Box display="inline-flex" {...boxProps}>{svg}</Box>;
}
