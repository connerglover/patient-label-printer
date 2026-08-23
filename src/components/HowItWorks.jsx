import { FileSpreadsheet, ListChecks, Printer } from 'lucide-react';

const CARDS = [
  {
    icon: FileSpreadsheet,
    title: 'Export the schedule',
    body: 'Pull the daily summary report out of your EMR as .xls or .xlsx. No template or setup required.',
  },
  {
    icon: ListChecks,
    title: 'Trim the list',
    body: 'Names, MRNs and dates of birth are read automatically. Drop anyone who doesn’t need labels today.',
  },
  {
    icon: Printer,
    title: 'Print the sheet',
    body: 'Download a PDF sized to your label stock and send it straight to the printer.',
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="mx-auto w-full max-w-3xl">
      <h2 id="how-it-works" className="sr-only">
        How it works
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-4 shadow-card">
            <Icon className="size-5 text-primary" />
            <h3 className="mt-3 text-sm font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm/relaxed text-pretty text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
