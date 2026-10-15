export const PlayIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M0 0v12l10-6z" fill="currentColor" /></svg>
)

export const PauseIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true">
    <rect width="3.5" height="12" rx="1" fill="currentColor" />
    <rect x="6.5" width="3.5" height="12" rx="1" fill="currentColor" />
  </svg>
)

export const Chevron = ({ dir = 'right', size = 12 }: { dir?: 'right' | 'down' | 'left'; size?: number }) => {
  const rot = dir === 'down' ? 90 : dir === 'left' ? 180 : 0
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" style={{ transform: `rotate(${rot}deg)`, transition: 'transform .15s', flex: 'none' }}>
      <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export const WarnIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 1.5 15 14H1z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="8" cy="11.6" r="0.9" fill="currentColor" />
  </svg>
)

export const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 7v4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="8" cy="4.8" r="0.9" fill="currentColor" />
  </svg>
)

export const CubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M2 4.5 8 1.5l6 3v7l-6 3-6-3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

export const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
