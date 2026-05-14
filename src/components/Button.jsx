import React from 'react';
import { Link } from 'react-router-dom';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  to,
  href,
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
  leftIcon,
  rightIcon,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center font-medium ' +
    'transition-base whitespace-nowrap rounded-lg ' +
    'disabled:opacity-50 disabled:cursor-not-allowed ' +
    'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2';

  const variants = {
    primary:
      'bg-brand-600 text-white shadow-card hover:bg-brand-700 ' +
      'active:bg-brand-800',
    secondary:
      'bg-white text-ink-900 border border-ink-200 shadow-subtle ' +
      'hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100',
    ghost:
      'text-ink-700 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200',
    dark:
      'bg-ink-950 text-white shadow-card hover:bg-ink-800 ' +
      'active:bg-ink-900',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  const classes = [
    base,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {leftIcon ? <span className="flex-shrink-0">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="flex-shrink-0">{rightIcon}</span> : null}
    </>
  );

  // Internal navigation via React Router
  if (to && !disabled) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  // External or mailto links — use React.createElement to avoid GitHub paste issues
  if (href && !disabled) {
    const isExternal = href.startsWith('http');
    const anchorProps = {
      href: href,
      className: classes,
      target: isExternal ? '_blank' : undefined,
      rel: isExternal ? 'noopener noreferrer' : undefined,
      ...rest,
    };
    return React.createElement('a', anchorProps, content);
  }

  // Default — plain button element
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
}
