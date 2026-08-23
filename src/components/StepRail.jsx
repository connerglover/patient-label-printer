import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const STEPS = [
  { id: 'upload', label: 'Upload', hint: 'Greenway daily summary' },
  { id: 'review', label: 'Review', hint: 'Trim the patient list' },
  { id: 'print', label: 'Print', hint: 'Download the PDF' },
];

/** Horizontal progress rail. `current` is the zero-based index of the active step. */
export function StepRail({ current }) {
  return (
    <nav aria-label="Progress" className="mx-auto w-full max-w-3xl">
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isDone = index < current;
          const isActive = index === current;

          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                    isDone && 'border-transparent bg-primary text-primary-foreground',
                    isActive && 'border-primary bg-primary-soft text-accent-foreground',
                    !isDone && !isActive && 'border-border bg-card text-muted-foreground'
                  )}
                >
                  {isDone ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                </span>

                <span className="hidden sm:block">
                  <span
                    className={cn(
                      'block text-sm leading-tight font-medium',
                      isActive || isDone ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                    {isActive && <span className="sr-only"> (current step)</span>}
                  </span>
                  <span className="block text-xs text-muted-foreground">{step.hint}</span>
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-3 h-px flex-1 transition-colors sm:mx-4',
                    isDone ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default StepRail;
