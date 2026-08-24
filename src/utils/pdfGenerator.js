import { jsPDF } from 'jspdf';

const PT_PER_INCH = 72;

/** Common patient-ID / chart label stock, so nobody has to measure by hand. */
export const LABEL_PRESETS = [
  { id: 'patient-id', name: 'Patient ID roll', size: [1.125, 3.5], note: 'Standard chart/lab label' },
  { id: 'avery-5160', name: 'Avery 5160', size: [2.625, 1], note: '30-up address sheet' },
  { id: 'avery-5163', name: 'Avery 5163', size: [4, 2], note: '10-up shipping sheet' },
  { id: 'dymo-30252', name: 'DYMO 30252', size: [3.5, 1.125], note: 'Address roll (landscape)' },
  { id: 'wristband', name: 'Wristband insert', size: [1, 4], note: 'Tall narrow insert' },
];

export const FONT_OPTIONS = [
  { value: 'helvetica', label: 'Helvetica', css: 'Arial, Helvetica, sans-serif' },
  { value: 'times', label: 'Times', css: '"Times New Roman", Times, serif' },
  { value: 'courier', label: 'Courier', css: '"Courier New", Courier, monospace' },
];

export class LabelConfig {
  constructor(options = {}) {
    this.pagesPerPatient = options.pagesPerPatient ?? 2;
    this.pageGeometry = options.pageGeometry ?? [1.125, 3.5]; // [width, height] in inches
    this.filename = options.filename ?? 'Patient_Labels.pdf';
    this.fontName = options.fontName ?? 'helvetica';
    this.fontSize = options.fontSize ?? 10;
    this.margin = options.margin ?? 0.2; // inches
    this.lineHeight = options.lineHeight ?? 0.22; // inches
  }
}

/** The three identifiers a specimen or requisition needs. */
export function labelLines(patient) {
  return [
    `Name: ${patient.name}`,
    `ID: ${patient.id}`,
    `Date of Birth: ${patient.dob}`,
  ];
}

/** Labels taller than they are wide get their text rotated to read along the length. */
export function needsRotation([width, height]) {
  return height > width;
}

function normalizeFilename(name) {
  const trimmed = (name || '').trim() || 'Patient_Labels.pdf';
  return trimmed.toLowerCase().endsWith('.pdf') ? trimmed : `${trimmed}.pdf`;
}

export class PDFGenerator {
  constructor(patients, config = null) {
    this.patients = patients;
    this.config = config || new LabelConfig();
  }

  generatePDF() {
    if (!this.patients || this.patients.length === 0) {
      throw new Error('No patients to generate labels for');
    }

    const [widthIn, heightIn] = this.config.pageGeometry;
    if (!(widthIn > 0) || !(heightIn > 0)) {
      throw new Error('Label width and height must both be greater than zero');
    }

    const format = [widthIn * PT_PER_INCH, heightIn * PT_PER_INCH];

    // jsPDF reorders `format` to agree with `orientation`, so declaring the
    // orientation the stock actually has is what keeps wide labels from being
    // silently rotated into a portrait page.
    const orientation = heightIn >= widthIn ? 'portrait' : 'landscape';
    const pdf = new jsPDF({ orientation, unit: 'pt', format });

    let isFirstPage = true;
    for (const patient of this.patients) {
      for (let copy = 0; copy < this.config.pagesPerPatient; copy++) {
        if (!isFirstPage) pdf.addPage(format, orientation);
        isFirstPage = false;
        this.createPage(pdf, patient);
      }
    }

    pdf.setProperties({
      title: normalizeFilename(this.config.filename).replace(/\.pdf$/i, ''),
      creator: 'Greenway Label Printer',
    });

    return pdf;
  }

  /**
   * Draws one label. Text is rotated 90° on portrait stock so it reads along
   * the length of the label, and shrinks to fit rather than running off the edge.
   */
  createPage(pdf, patient) {
    const [widthIn, heightIn] = this.config.pageGeometry;
    const pageWidth = widthIn * PT_PER_INCH;
    const pageHeight = heightIn * PT_PER_INCH;
    const margin = this.config.margin * PT_PER_INCH;
    const lineHeight = this.config.lineHeight * PT_PER_INCH;

    const rotate = needsRotation(this.config.pageGeometry);
    const lines = labelLines(patient);

    pdf.setFont(this.config.fontName, 'normal');

    // The dimension the text runs along, minus margins at both ends.
    const availableLength = (rotate ? pageHeight : pageWidth) - margin * 2;
    const fontSize = this.fitFontSize(pdf, lines, availableLength);
    pdf.setFontSize(fontSize);

    // Centre the three-line block across the label's short dimension.
    const blockThickness = lines.length * lineHeight;
    const across = rotate ? pageWidth : pageHeight;
    const blockStart = Math.max(margin / 2, (across - blockThickness) / 2);

    lines.forEach((line, index) => {
      if (rotate) {
        // Reads bottom-to-top; successive lines step across the label's width.
        pdf.text(line, blockStart + index * lineHeight, pageHeight - margin, { angle: 90 });
      } else {
        pdf.text(line, margin, blockStart + (index + 1) * lineHeight);
      }
    });
  }

  /** Steps the font down until the longest line fits, so long names never clip. */
  fitFontSize(pdf, lines, availableLength) {
    const MIN_FONT_SIZE = 5;
    let size = this.config.fontSize;

    while (size > MIN_FONT_SIZE) {
      pdf.setFontSize(size);
      const widest = Math.max(...lines.map((line) => pdf.getTextWidth(line)));
      if (widest <= availableLength) break;
      size -= 0.5;
    }

    return size;
  }

  downloadPDF() {
    const pdf = this.generatePDF();
    const filename = normalizeFilename(this.config.filename);
    pdf.save(filename);
    return filename;
  }

  getPDFBlob() {
    return this.generatePDF().output('blob');
  }

  getPDFDataUrl() {
    return this.generatePDF().output('dataurlstring');
  }
}

export default PDFGenerator;
