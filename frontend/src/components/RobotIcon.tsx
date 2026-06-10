interface Props {
  size?: number
}

export function RobotIcon({ size = 18 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="8" width="14" height="11" rx="3" />
      <circle cx="9.5" cy="13" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="1.25" fill="currentColor" stroke="none" />
      <path d="M9 17h6" />
      <path d="M12 8V5" />
      <circle cx="12" cy="4" r="1.25" fill="currentColor" stroke="none" />
      <path d="M5 11H3" />
      <path d="M21 11h-2" />
    </svg>
  )
}
