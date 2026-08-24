import { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  Tags,
  X,
} from 'lucide-react';

import AppHeader from '@/components/AppHeader';
import DropZone from '@/components/DropZone';
import HowItWorks from '@/components/HowItWorks';
import LabelSettings from '@/components/LabelSettings';
import PatientTable from '@/components/PatientTable';
import StepRail from '@/components/StepRail';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { ExcelParser } from '@/utils/excelParser';
import { LabelConfig, PDFGenerator } from '@/utils/pdfGenerator';

/** Stable per-row key so removals survive filtering and bulk actions. */
function withUid(patients) {
  return patients.map((patient, index) => ({
    uid: `${patient.id}-${index}`,
    name: patient.name,
    id: patient.id,
    dob: patient.dob,
  }));
}

function App() {
  const { theme, toggleTheme } = useTheme();

  const [allPatients, setAllPatients] = useState([]);
  const [removedUids, setRemovedUids] = useState(() => new Set());
  const [fileName, setFileName] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [config, setConfig] = useState(() => new LabelConfig());

  const patients = useMemo(
    () => allPatients.filter((patient) => !removedUids.has(patient.uid)),
    [allPatients, removedUids]
  );

  // Stay on the review screen once a file is loaded, even if every patient has
  // been removed — otherwise an over-eager "select all → remove" throws the
  // parsed list away along with any chance to undo it.
  const hasFile = allPatients.length > 0;
  const totalLabels = patients.length * config.pagesPerPatient;
  const step = !hasFile ? 0 : 1;

  const handleFileSelect = useCallback(async (file) => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const parsed = await new ExcelParser(file).parseFile();
      setAllPatients(withUid(parsed));
      setRemovedUids(new Set());
      setFileName(file.name);
      setSuccess(
        `Read ${parsed.length} ${parsed.length === 1 ? 'patient' : 'patients'} from ${file.name}.`
      );
    } catch (err) {
      setError(err.message);
      console.error('File parsing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // One batched update — removing several patients at once must not race.
  const handleRemove = useCallback((uids) => {
    setRemovedUids((current) => {
      const next = new Set(current);
      uids.forEach((uid) => next.add(uid));
      return next;
    });
  }, []);

  const handleRestore = useCallback(() => setRemovedUids(new Set()), []);

  const handleGeneratePDF = () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const filename = new PDFGenerator(patients, config).downloadPDF();
      setSuccess(`Generated ${totalLabels} labels — ${filename} is in your downloads.`);
    } catch (err) {
      setError(`Couldn’t generate the PDF: ${err.message}`);
      console.error('PDF generation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const startOver = () => {
    setAllPatients([]);
    setRemovedUids(new Set());
    setFileName(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <StepRail current={step} />

        {/* Status messages */}
        <div className="mx-auto mt-8 max-w-3xl space-y-3 empty:mt-0">
          {error && (
            <Alert variant="destructive" className="animate-fade-in">
              <AlertCircle />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
                className="col-start-3 row-start-1 -my-1 -mr-1"
              >
                <X />
              </Button>
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="animate-fade-in">
              <CheckCircle2 />
              <AlertDescription className="text-foreground">{success}</AlertDescription>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSuccess(null)}
                aria-label="Dismiss message"
                className="col-start-3 row-start-1 -my-1 -mr-1"
              >
                <X />
              </Button>
            </Alert>
          )}
        </div>

        {!hasFile ? (
          /* ---------- Step 1: upload ---------- */
          <div className="mx-auto mt-8 max-w-3xl space-y-8 animate-fade-up">
            <DropZone
              onFileSelect={handleFileSelect}
              onReject={setError}
              isProcessing={isProcessing}
              fileName={fileName}
            />

            <Alert variant="info">
              <Info />
              <AlertTitle>Works with Greenway EMR only</AlertTitle>
              <AlertDescription>
                The parser is written against the column layout of Greenway’s daily summary report.
                Exports from other EMRs — and other Greenway reports — won’t be recognised.
              </AlertDescription>
            </Alert>

            <HowItWorks />

            <p className="flex items-start justify-center gap-2 text-center text-xs text-pretty text-muted-foreground">
              <Lock className="mt-px size-3.5 shrink-0" />
              <span>
                Your report is parsed in this browser tab and never uploaded. Closing the tab
                discards it. The PDF you download contains PHI — handle it under your normal
                safeguards.
              </span>
            </p>
          </div>
        ) : (
          /* ---------- Steps 2 & 3: review and print ---------- */
          <div className="mt-8 grid grid-cols-1 items-start gap-6 animate-fade-up lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 space-y-4">
              {fileName && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    From <span className="font-medium text-foreground">{fileName}</span>
                  </span>
                  <Button variant="link" size="xs" onClick={startOver} className="h-auto p-0">
                    Use a different file
                  </Button>
                </div>
              )}

              <PatientTable
                patients={patients}
                removedCount={removedUids.size}
                onRemove={handleRemove}
                onRestore={handleRestore}
              />
            </div>

            {/* Sticky settings + print rail */}
            <aside className="min-w-0 lg:sticky lg:top-24">
              <div className="rounded-xl border border-border bg-card p-5 shadow-card">
                <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                  <Tags className="size-4.5 text-primary" />
                  Label setup
                </h2>

                <div className="mt-5">
                  <LabelSettings config={config} onConfigChange={setConfig} />
                </div>

                <div className="mt-6 space-y-2 border-t border-border pt-5">
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isProcessing || totalLabels === 0}
                    size="lg"
                    className="w-full"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Download />}
                    {isProcessing ? 'Generating…' : 'Generate label PDF'}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    <span className="tabular font-medium text-foreground">{totalLabels}</span> labels
                    {' · '}
                    <span className="tabular">{patients.length}</span> patients ×{' '}
                    <span className="tabular">{config.pagesPerPatient}</span>
                  </p>

                  <Button
                    onClick={startOver}
                    disabled={isProcessing}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    <RotateCcw />
                    Start over
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        <p>Greenway Label Printer — patient data never leaves your browser.</p>
        <p className="mt-1">
          Not affiliated with or endorsed by Greenway Health, LLC. “Greenway” is their trademark.
        </p>
      </footer>
    </div>
  );
}

export default App;
