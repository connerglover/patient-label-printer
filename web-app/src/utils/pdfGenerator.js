import jsPDF from 'jspdf';

export class LabelConfig {
  constructor(options = {}) {
    this.pagesPerPatient = options.pagesPerPatient || 2;
    this.pageGeometry = options.pageGeometry || [1.125, 3.5]; // [width, height] in inches
    this.filename = options.filename || "Patient_Labels.pdf";
    this.fontName = options.fontName || "helvetica";
    this.fontSize = options.fontSize || 10;
    this.margin = options.margin || 0.12; // inches
    this.lineHeight = options.lineHeight || 0.22; // inches
  }
}

export class PDFGenerator {
  constructor(patients, config = null) {
    this.patients = patients;
    this.config = config || new LabelConfig();
  }

  generatePDF() {
    if (!this.patients || this.patients.length === 0) {
      throw new Error("No patients to generate labels for");
    }

    // Convert inches to points (72 points per inch)
    const finalWidth = this.config.pageGeometry[0] * 72;
    const finalHeight = this.config.pageGeometry[1] * 72;

    // Create PDF with custom page size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [finalWidth, finalHeight]
    });

    const totalPages = this.patients.length * this.config.pagesPerPatient;
    console.log(`Generating ${totalPages} labels for ${this.patients.length} patients...`);

    let pageCount = 0;
    let isFirstPage = true;

    for (let i = 0; i < this.patients.length; i++) {
      const patient = this.patients[i];
      
      for (let copy = 0; copy < this.config.pagesPerPatient; copy++) {
        if (!isFirstPage) {
          pdf.addPage([finalWidth, finalHeight]);
        }
        isFirstPage = false;

        this.createPage(pdf, patient);
        pageCount++;

        // Progress feedback
        if (pageCount % 10 === 0 || pageCount === totalPages) {
          console.log(`Generated ${pageCount}/${totalPages} labels...`);
        }
      }
    }

    console.log(`Successfully created PDF with ${pageCount} labels`);
    return pdf;
  }

  createPage(pdf, patient) {
    const margin = this.config.margin * 72; // Convert to points
    const lineHeight = this.config.lineHeight * 72; // Convert to points

    // Save current state
    pdf.saveGraphicsState();

    try {
      // Rotate for label orientation (90 degrees counterclockwise)
      const pageWidth = this.config.pageGeometry[0] * 72;
      const pageHeight = this.config.pageGeometry[1] * 72;
      
      // Translate to bottom-left, then rotate
      pdf.setTransform(0, 1, -1, 0, pageHeight, 0);

      // Set font
      pdf.setFont(this.config.fontName, 'normal');
      pdf.setFontSize(this.config.fontSize);

      // Draw patient information
      const yPositions = [
        margin + 3 * lineHeight,
        margin + 2 * lineHeight,
        margin + lineHeight
      ];

      const labels = [
        `Name: ${patient.name}`,
        `ID: ${patient.id}`,
        `Date of Birth: ${patient.dob}`
      ];

      labels.forEach((label, index) => {
        if (yPositions[index]) {
          pdf.text(label, margin * 2, yPositions[index]);
        }
      });

    } finally {
      // Restore state
      pdf.restoreGraphicsState();
    }
  }

  downloadPDF() {
    const pdf = this.generatePDF();
    pdf.save(this.config.filename);
    return this.config.filename;
  }

  getPDFBlob() {
    const pdf = this.generatePDF();
    return pdf.output('blob');
  }

  getPDFDataUrl() {
    const pdf = this.generatePDF();
    return pdf.output('dataurlstring');
  }
}

export default PDFGenerator;