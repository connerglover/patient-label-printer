import { useRef, useState } from 'react';
import { FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VALID_EXTENSIONS = ['.xls', '.xlsx'];

function hasSpreadsheetExtension(name) {
  return VALID_EXTENSIONS.some((extension) => name.toLowerCase().endsWith(extension));
}

export function DropZone({ onFileSelect, onReject, isProcessing, fileName }) {
  // A counter, not a boolean: dragenter/dragleave also fire for child elements,
  // and a plain flag makes the highlight flicker as the cursor moves inside.
  const [dragDepth, setDragDepth] = useState(0);
  const inputRef = useRef(null);

  const isDragging = dragDepth > 0;

  const acceptFile = (file) => {
    if (!file) return;
    if (!hasSpreadsheetExtension(file.name)) {
      onReject(
        `“${file.name}” isn’t a spreadsheet. Upload the .xls or .xlsx daily summary report exported from Greenway.`
      );
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragDepth(0);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        setDragDepth((depth) => depth + 1);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragDepth((depth) => Math.max(0, depth - 1));
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className={cn(
        'group relative rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-12',
        isDragging
          ? 'border-primary bg-primary-soft shadow-lift'
          : 'border-border bg-card hover:border-primary/40',
        isProcessing && 'pointer-events-none opacity-60'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        className="sr-only"
        disabled={isProcessing}
        onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          // Reset so re-picking the same file still fires a change event.
          event.target.value = '';
        }}
      />

      <div
        aria-hidden="true"
        className={cn(
          'mx-auto flex size-14 items-center justify-center rounded-2xl transition-transform',
          isDragging ? 'scale-110 bg-primary text-primary-foreground' : 'bg-primary-soft text-primary'
        )}
      >
        {isProcessing ? (
          <Loader2 className="size-7 animate-spin" />
        ) : fileName && !isDragging ? (
          <FileSpreadsheet className="size-7" />
        ) : (
          <UploadCloud className="size-7" />
        )}
      </div>

      <h2 className="mt-5 text-lg font-semibold tracking-tight text-balance">
        {isProcessing
          ? 'Reading your spreadsheet…'
          : isDragging
            ? 'Drop it anywhere in this box'
            : 'Drop your Greenway daily summary report here'}
      </h2>

      <p className="mx-auto mt-1.5 max-w-sm text-sm text-pretty text-muted-foreground">
        {fileName && !isProcessing ? (
          <>
            Loaded <span className="font-medium text-foreground">{fileName}</span>. Drop another file
            to start over.
          </>
        ) : (
          <>
            Greenway EMR only — the .xls or .xlsx daily summary report, exactly as Greenway exports
            it.
          </>
        )}
      </p>

      <Button
        type="button"
        onClick={openPicker}
        disabled={isProcessing}
        size="lg"
        className="mt-6"
      >
        {fileName ? 'Choose a different file' : 'Browse files'}
      </Button>
    </div>
  );
}

export default DropZone;
