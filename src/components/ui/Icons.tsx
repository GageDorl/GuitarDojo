/** Small inline icons (no icon library needed for a handful of glyphs). */
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const CheckIcon = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 18} height={p.size ?? 18}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const XIcon = (p: { size?: number }) => (
  <svg {...base} width={p.size ?? 18} height={p.size ?? 18}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const ArrowLeft = () => (
  <svg {...base}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
export const ArrowRight = () => (
  <svg {...base}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);
export const PlayIcon = () => (
  <svg {...base} fill="currentColor" stroke="none">
    <path d="M8 5.5v13l11-6.5z" />
  </svg>
);
export const PauseIcon = () => (
  <svg {...base}>
    <path d="M9 5v14M15 5v14" />
  </svg>
);
export const LightbulbIcon = () => (
  <svg {...base}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
  </svg>
);
export const GuitarIcon = () => (
  <svg {...base}>
    <path d="M19 5l-6.5 6.5M17 3l4 4M11.5 10.5a4 4 0 0 0-5.3 1.2c-.7 1-.4 2.2-1.7 2.8-1.4.7-2.5 1.6-2.3 3.4.2 1.6 1.6 3 3.2 3.2 1.8.2 2.7-.9 3.4-2.3.6-1.3 1.8-1 2.8-1.7a4 4 0 0 0 1.2-5.3" />
    <circle cx="9" cy="15" r="1.4" />
  </svg>
);
export const InfoIcon = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
export const ResetIcon = () => (
  <svg {...base}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
  </svg>
);
