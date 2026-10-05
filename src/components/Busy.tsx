// Button label that swaps to the app's spinner while busy. The label stays in
// the layout (just hidden), so the button keeps its size and nothing jumps.
export default function Busy({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-grid place-items-center">
      <span className={`col-start-1 row-start-1 ${busy ? 'invisible' : ''}`}>{children}</span>
      {busy && <span role="status" aria-label="…" className="col-start-1 row-start-1 h-[18px] w-[18px] rounded-full border-2 animate-spin-slow" style={{ borderColor: 'color-mix(in srgb, currentColor 30%, transparent)', borderTopColor: 'currentColor' }} />}
    </span>
  )
}
