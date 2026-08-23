import { cn } from '@/lib/utils';

/**
 * A label tag with a punch hole and three text rules — the product in one glyph.
 * Inline SVG so it inherits currentColor and stays crisp at any size.
 */
export function BrandMark({ className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-hidden="true"
      className={cn('size-8', className)}
      fill="none"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M13 7h10a2.5 2.5 0 0 1 2.5 2.5v13A2.5 2.5 0 0 1 23 25H13L6.8 17.2a2 2 0 0 1 0-2.4L13 7Z"
        className="fill-[var(--primary-foreground)]"
        opacity="0.95"
      />
      <circle cx="11.6" cy="16" r="1.7" className="fill-primary" />
      <g className="stroke-primary" strokeWidth="1.6" strokeLinecap="round">
        <path d="M16.4 12.4h6.2" />
        <path d="M16.4 16h6.2" />
        <path d="M16.4 19.6h4" />
      </g>
    </svg>
  );
}

export default BrandMark;
