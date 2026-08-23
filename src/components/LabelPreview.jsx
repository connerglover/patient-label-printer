import { FONT_OPTIONS, labelLines, needsRotation } from '@/utils/pdfGenerator';

const SAMPLE_PATIENT = { name: 'Doe, Jane', id: '123456', dob: '04/12/1978' };

const PREVIEW_BOX = { width: 210, height: 210 };

function fontStack(fontName) {
  return FONT_OPTIONS.find((option) => option.value === fontName)?.css ?? FONT_OPTIONS[0].css;
}

/**
 * A to-scale rendering of one label, mirroring pdfGenerator's layout rules:
 * text rotates on stock that is taller than it is wide, and the three-line
 * block is centred across the short dimension.
 */
export function LabelPreview({ config, patient = SAMPLE_PATIENT }) {
  const [widthIn, heightIn] = config.pageGeometry;

  if (!(widthIn > 0) || !(heightIn > 0)) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        Enter a width and height to see a preview
      </div>
    );
  }

  // Fit the label inside the preview box without ever enlarging past life size.
  const scale = Math.min(PREVIEW_BOX.width / widthIn, PREVIEW_BOX.height / heightIn, 96);

  const rotate = needsRotation(config.pageGeometry);
  const lines = labelLines(patient);

  const labelWidth = widthIn * scale;
  const labelHeight = heightIn * scale;
  const blockLength = (rotate ? heightIn : widthIn) * scale;
  const blockThickness = (rotate ? widthIn : heightIn) * scale;

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative overflow-hidden rounded-[3px] bg-white text-black ring-1 shadow-card ring-black/15"
        style={{ width: `${labelWidth}px`, height: `${labelHeight}px` }}
        role="img"
        aria-label={`Preview of a ${widthIn} by ${heightIn} inch label reading ${lines.join(', ')}`}
      >
        <div
          className="absolute top-1/2 left-1/2 flex flex-col justify-center"
          style={{
            width: `${blockLength}px`,
            height: `${blockThickness}px`,
            padding: `0 ${config.margin * scale}px`,
            transform: `translate(-50%, -50%) ${rotate ? 'rotate(-90deg)' : ''}`,
            fontFamily: fontStack(config.fontName),
            fontSize: `${(config.fontSize * scale) / 72}px`,
            lineHeight: `${config.lineHeight * scale}px`,
          }}
        >
          {lines.map((line) => (
            <span key={line} className="block truncate whitespace-nowrap">
              {line}
            </span>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        <span className="tabular">
          {widthIn}″ × {heightIn}″
        </span>
        {' · '}
        {rotate ? 'text rotated to read along the length' : 'text printed horizontally'}
      </p>
    </div>
  );
}

export default LabelPreview;
