import { Link } from 'react-router-dom';

// Reusable Inkly logo
// Props:
//   - size: 'sm' (header), 'md' (default), 'lg' (auth pages), 'xl' (hero)
//   - linkTo: where clicking the logo navigates (default: home)
//   - showText: whether to show "Inkly" text alongside icon (default: true)
//   - className: additional classes
export default function Logo({
  size = 'md',
  linkTo = '/',
  showText = true,
  className = '',
}) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg', gap: 'gap-2' },
    md: { icon: 28, text: 'text-xl', gap: 'gap-2.5' },
    lg: { icon: 36, text: 'text-2xl', gap: 'gap-3' },
    xl: { icon: 48, text: 'text-4xl', gap: 'gap-3.5' },
  };
  const s = sizes[size] || sizes.md;

  const content = (
    <div className={`inline-flex items-center ${s.gap} ${className}`}>
      {/* Icon: stylized ink drop with subtle gradient */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="inkly-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
        </defs>
        {/* Ink drop shape */}
        <path
          d="M16 3 C 10 11, 6 16, 6 21 C 6 26.5, 10.5 30, 16 30 C 21.5 30, 26 26.5, 26 21 C 26 16, 22 11, 16 3 Z"
          fill="url(#inkly-grad)"
        />
        {/* Subtle highlight */}
        <ellipse
          cx="12.5"
          cy="14"
          rx="2"
          ry="3.5"
          fill="white"
          fillOpacity="0.25"
          transform="rotate(-20 12.5 14)"
        />
      </svg>
      {showText && (
        <span className={`${s.text} font-bold text-ink-950 tracking-tight`}>
          Inkly
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex items-center hover:opacity-80 transition-base">
        {content}
      </Link>
    );
  }
  return content;
}
