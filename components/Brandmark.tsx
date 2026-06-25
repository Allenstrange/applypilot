"use client";

/**
 * ApplyPilot brand mark — a paper plane on the "Ascent" violet→coral gradient.
 * `size` controls the rounded tile in px. useId gives each instance a unique
 * gradient id; without it, multiple marks on a page collide and a gradient
 * defined in a hidden subtree (e.g. the mobile nav) fails to paint.
 */
import { useId } from "react";

export default function Brandmark({
  size = 36,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const gid = `ap-brand-${useId()}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="ApplyPilot"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" />
          <stop offset="0.55" stopColor="#a855f7" />
          <stop offset="1" stopColor="#fb6f4c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gid})`} />
      {/* paper plane, ascending */}
      <path
        d="M29.5 11.2 11.6 19.1c-.9.4-.84 1.7.1 2l6.05 1.86 2.02 6.18c.28.86 1.45.96 1.87.16l2.36-4.5 4.7 3.46c.6.44 1.46.1 1.6-.63l2.5-14.6c.16-.95-.83-1.7-1.7-1.3Z"
        fill="#fff"
      />
      <path
        d="m17.75 23 11-9.2-7.9 10.06"
        stroke="#7c3aed"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}
