export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <rect width="100" height="100" rx="22" fill="var(--accent)" />
      <g
        fill="none"
        stroke="var(--accent-contrast)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="29" y="27" width="42" height="52" rx="8" />
        <path d="M40 55l8 8 15-17" />
      </g>
      <rect x="39" y="19" width="22" height="15" rx="5" fill="var(--accent-contrast)" />
    </svg>
  );
}
