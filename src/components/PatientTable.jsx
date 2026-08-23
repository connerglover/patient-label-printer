import { useMemo, useState } from 'react';
import { Copy, Search, Trash2, Undo2, Users, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function PatientTable({ patients, removedCount, onRemove, onRestore }) {
  const [selected, setSelected] = useState(() => new Set());
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return patients;
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(needle) || patient.id.toLowerCase().includes(needle)
    );
  }, [patients, query]);

  // A patient booked twice in one day appears twice in the export — worth
  // flagging so staff can drop the extra rather than printing double.
  const duplicateIds = useMemo(() => {
    const seen = new Set();
    const dupes = new Set();
    for (const patient of patients) {
      if (seen.has(patient.id)) dupes.add(patient.id);
      seen.add(patient.id);
    }
    return dupes;
  }, [patients]);

  const visibleUids = visible.map((patient) => patient.uid);
  const selectedVisible = visibleUids.filter((uid) => selected.has(uid));
  const allVisibleSelected = visibleUids.length > 0 && selectedVisible.length === visibleUids.length;
  const someVisibleSelected = selectedVisible.length > 0 && !allVisibleSelected;

  const toggle = (uid) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleUids.forEach((uid) => next.delete(uid));
      else visibleUids.forEach((uid) => next.add(uid));
      return next;
    });
  };

  const removeSelected = () => {
    onRemove(selectedVisible);
    setSelected(new Set());
  };

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <Users className="size-4.5 text-muted-foreground" />
          <h2 className="font-semibold tracking-tight">Patients</h2>
          <Badge variant="soft" className="tabular">
            {patients.length}
          </Badge>
        </div>

        <div className="relative sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Escape' && setQuery('')}
            placeholder="Filter by name or MRN"
            aria-label="Filter patients by name or MRN"
            className="pl-9"
          />
        </div>

        {removedCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onRestore} className="shrink-0">
            <Undo2 />
            Restore {removedCount}
          </Button>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedVisible.length > 0 && (
        <div className="flex items-center gap-3 border-b border-border bg-primary-soft px-4 py-2.5 text-sm">
          <span className="font-medium text-accent-foreground">
            {selectedVisible.length} selected
          </span>
          <Button variant="destructive" size="sm" onClick={removeSelected} className="ml-auto">
            <Trash2 />
            Remove selected
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setSelected(new Set())} aria-label="Clear selection">
            <X />
          </Button>
        </div>
      )}

      {/* Column head */}
      <div className="hidden items-center gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:flex">
        <Checkbox
          checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
          onCheckedChange={toggleAllVisible}
          disabled={visible.length === 0}
          aria-label="Select all listed patients"
        />
        <span className="flex-1">Name</span>
        <span className="w-28">MRN</span>
        <span className="w-28">Date of birth</span>
        <span className="w-8" />
      </div>

      {/* Rows */}
      {patients.length === 0 ? (
        <div className="space-y-3 px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Every patient has been removed. Nothing will print.
          </p>
          {removedCount > 0 && (
            <Button variant="outline" size="sm" onClick={onRestore}>
              <Undo2 />
              Restore {removedCount}
            </Button>
          )}
        </div>
      ) : visible.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">
          No patients match “{query}”.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map((patient) => {
            const isSelected = selected.has(patient.uid);
            return (
              <li
                key={patient.uid}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 transition-colors',
                  isSelected ? 'bg-primary-soft/60' : 'hover:bg-muted/50'
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggle(patient.uid)}
                  aria-label={`Select ${patient.name}`}
                />

                <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="truncate font-medium">{patient.name}</span>
                    {duplicateIds.has(patient.id) && (
                      <Badge variant="outline" className="shrink-0" title="This MRN appears more than once">
                        <Copy />
                        Duplicate
                      </Badge>
                    )}
                  </span>
                  <span className="tabular w-28 shrink-0 text-sm text-muted-foreground">
                    <span className="sm:hidden">MRN </span>
                    {patient.id}
                  </span>
                  <span className="tabular w-28 shrink-0 text-sm text-muted-foreground">
                    <span className="sm:hidden">DOB </span>
                    {patient.dob}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemove([patient.uid])}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${patient.name}`}
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default PatientTable;
