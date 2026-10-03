// Hashtag Labs mark: thick square-cut # on a yellow tile (same geometry as quattroventi.xyz).
export default function HashtagMark({ size = 32 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 64 64" className="shrink-0">
      <rect width="64" height="64" rx="14" fill="#FFD600" />
      <g fill="#0B0B0A">
        <rect x="19.6" y="8.9" width="7.25" height="46.2" />
        <rect x="37.15" y="8.9" width="7.25" height="46.2" />
        <rect x="9.6" y="19.7" width="44.8" height="6.6" />
        <rect x="9.6" y="37.7" width="44.8" height="6.6" />
      </g>
    </svg>
  )
}
