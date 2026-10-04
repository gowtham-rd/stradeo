// Wraps every page and re-mounts on navigation, so each page eases in
// (fade + slight rise) instead of snapping into place.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in page-shift">{children}</div>
}
