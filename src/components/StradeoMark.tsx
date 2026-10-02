// Stradeo's mark: the road glyph on a neutral tile — same icon as on quattroventi.xyz.
export default function StradeoMark({ size = 32 }: { size?: number }) {
  const radius = size >= 64 ? 14 : size >= 40 ? 10 : 8
  return (
    <span aria-hidden="true"
      className="inline-grid shrink-0 place-items-center border border-stradeo-line bg-stradeo-surface2 text-stradeo-ink"
      style={{ width: size, height: size, borderRadius: radius }}>
      <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="none" stroke="currentColor"
        strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3 5 21" /><path d="M15 3l4 18" /><path d="M12 5v2.5" /><path d="M12 10.5v3" /><path d="M12 16.5V19" />
      </svg>
    </span>
  )
}
