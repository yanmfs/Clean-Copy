export function Logo({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={className}>
      <rect width="100" height="100" rx="22" fill="#1D7A52" />
      <rect x="14" y="40" width="72" height="20" rx="5" fill="#FDE58A" />
      <rect x="22" y="26" width="56" height="9" rx="4.5" fill="#FFFFFF" />
      <rect x="22" y="45" width="56" height="9" rx="4.5" fill="#0B2B1E" />
      <rect x="22" y="64" width="34" height="9" rx="4.5" fill="#FFFFFF" />
    </svg>
  );
}
