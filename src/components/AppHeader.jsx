import { Moon, ShieldCheck, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import BrandMark from '@/components/BrandMark';

export function AppHeader({ theme, onToggleTheme }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <BrandMark className="size-9" />

        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-semibold tracking-tight">
            Greenway Label Printer
          </p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            Greenway daily summary in, print-ready labels out
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-success/25 bg-[var(--success-soft)] px-3 py-1.5 text-xs font-medium text-success md:inline-flex">
            <ShieldCheck className="size-3.5" />
            Runs entirely in your browser
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
