export function LogoMark({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      {/* Chat bubble */}
      <path d="M8 10c0-1.657 1.343-3 3-3h42c1.657 0 3 1.343 3 3v26c0 1.657-1.343 3-3 3H28l-9 9c-1.2 1.2-3 .35-3-1.35V39H11c-1.657 0-3-1.343-3-3V10z" />
      {/* 3 dots */}
      <circle cx="24" cy="23" r="3" fill="white" />
      <circle cx="34" cy="23" r="3" fill="white" />
      <circle cx="44" cy="23" r="3" fill="white" />
    </svg>
  );
}

