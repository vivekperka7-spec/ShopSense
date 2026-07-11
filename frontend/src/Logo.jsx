import React from "react";

// Shared brand mark: storefront silhouette with an upward trend line - ties
// the "marketplace" and "analytics" halves of the product into one icon.
export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="var(--navy)" />
      <path d="M10 17L16 12L24 15L30 10" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="10" r="2.2" fill="var(--accent)" />
      <path d="M9 22H31V28C31 29.1 30.1 30 29 30H11C9.9 30 9 29.1 9 28V22Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 22L11 17H29L31 22" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
