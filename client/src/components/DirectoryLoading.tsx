export function AlumniCardsLoading({ count = 6 }: { count?: number }) {
  return <div className="alumni-grid alumni-grid--loading" aria-live="polite" aria-label="Loading alumni records">
    {Array.from({ length: count }, (_, index) => <div className="alumni-card alumni-card--skeleton" key={index}><div className="alumni-skeleton__portrait" /><div className="alumni-skeleton__content"><span /><strong /><i /><small /></div></div>)}
  </div>;
}

export function DirectoryLoading({ label = "Loading verified alumni records…" }: { label?: string }) {
  return <div className="directory-loading" role="status" aria-live="polite"><span className="directory-loading__spinner" />{label}</div>;
}

export function GalleryLoading() {
  return <div className="gallery-grid gallery-grid--loading" role="status" aria-label="Loading gallery records">{Array.from({ length: 6 }, (_, index) => <div className="gallery-loading-tile" key={index} />)}</div>;
}
